#!/usr/bin/env python3
"""Build an auditable, source-backed global GeoBoundaries MVT release.

This is an offline Kaggle build. The browser never imports this module; it only
serves the generated static tiles. The builder deliberately rejects source
features that cannot be represented safely in spherical Web Mercator vector
tiles instead of silently clamping or emitting world-spanning geometry.

Offline prerequisites: ijson, shapely, antimeridian, mapbox-vector-tile,
pyclipper, protobuf, pyproj, and numpy.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import shutil
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import ijson
import numpy as np
from mapbox_vector_tile import encode
try:
    from pyproj import Transformer
except ImportError:  # pragma: no cover - Kaggle installs pyproj in the build venv
    Transformer = None  # type: ignore[assignment,misc]
from mapbox_vector_tile.polygon import make_it_valid
from shapely import intersection as shapely_intersection
from shapely.geometry import GeometryCollection, MultiPolygon, Point, Polygon, box, shape
from shapely.ops import transform, unary_union

WEB_MERCATOR_TRANSFORMER = (
    Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    if Transformer is not None else None
)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = ROOT / "data" / "raw" / "world" / "geoboundaries"
DEFAULT_OUTPUT_BASE = ROOT / "client" / "public" / "data" / "world-mvt"
DEFAULT_RELEASE = "world-global-geoboundaries-kaggle"
SOURCE_URLS = {
    "adm1": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM1.geojson",
    "adm2": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM2.geojson",
    "adm3": "https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM3/",
    "adm4": "https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM4/",
    "adm5": "https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM5/",
}
DEFAULT_LAYER_ZOOMS = {"adm1": 5, "adm2": 7, "adm3": 9, "adm4": 11, "adm5": 13}

# MapLibre globe still consumes ordinary Web Mercator vector tile geometry.
# Features above this latitude are not emitted for the global ADM detail layers;
# the local country overview remains the fallback at those latitudes.
SAFE_VECTOR_LATITUDE = 80.0
MAX_COMPONENT_LONGITUDE_SPAN = 180.0
MVT_EXTENT = 4096
MVT_BUFFER_PIXELS = 8
EPSILON = 1e-9
PROGRESS_INTERVAL_SECONDS = 10.0
PROGRESS_FEATURE_INTERVAL = 250


def progress_line(layer: str, phase: str, started: float, **values: Any) -> None:
    elapsed = time.monotonic() - started
    details = " ".join(f"{key}={value}" for key, value in values.items())
    print(f"[AtlasWorld] layer={layer} phase={phase} elapsed={elapsed:.1f}s {details}".rstrip(), flush=True)


class GeometryRejected(Exception):
    """A source feature cannot be represented safely by this tile contract."""

    def __init__(self, reason: str, *, audit: dict[str, Any] | None = None):
        super().__init__(reason)
        self.reason = reason
        self.audit = audit or {}


def source_file_label(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def finite_bbox(geometry: Any) -> tuple[float, float, float, float] | None:
    if geometry is None or geometry.is_empty:
        return None
    bounds = geometry.bounds
    if len(bounds) != 4 or not all(math.isfinite(float(value)) for value in bounds):
        return None
    return tuple(float(value) for value in bounds)


def bbox_json(bounds: tuple[float, float, float, float] | None) -> list[float] | None:
    return list(bounds) if bounds is not None else None


def normalize_longitude(value: float) -> float:
    """Wrap a longitude into [-180, 180], retaining +180 as a boundary value."""
    wrapped = ((float(value) + 180.0) % 360.0) - 180.0
    if math.isclose(wrapped, -180.0, abs_tol=EPSILON) and value > 0:
        return 180.0
    return wrapped


def normalize_longitudes(geometry: Any) -> Any:
    def normalize(x: float, y: float, *extra: float) -> tuple[float, float]:
        return normalize_longitude(x), float(y)

    return transform(normalize, geometry)


def iter_rings(geometry: Any) -> Iterable[list[tuple[float, float]]]:
    if isinstance(geometry, Polygon):
        yield [(float(x), float(y)) for x, y, *_ in geometry.exterior.coords]
        for ring in geometry.interiors:
            yield [(float(x), float(y)) for x, y, *_ in ring.coords]
    elif isinstance(geometry, MultiPolygon):
        for polygon in geometry.geoms:
            yield from iter_rings(polygon)
    elif hasattr(geometry, "geoms"):
        for part in geometry.geoms:
            yield from iter_rings(part)


def longitude_jump_stats(geometry: Any) -> tuple[float, int]:
    maximum = 0.0
    crossings = 0
    for ring in iter_rings(geometry):
        coordinates = np.asarray(ring, dtype=np.float64)
        if len(coordinates) < 2:
            continue
        jumps = np.abs(np.diff(coordinates[:, 0]))
        if jumps.size:
            maximum = max(maximum, float(jumps.max()))
            crossings += int(np.count_nonzero(jumps > 180.0 + EPSILON))
    return maximum, crossings


def _polygon_parts(geometry: Any) -> Iterable[Polygon]:
    if geometry is None or geometry.is_empty:
        return
    if isinstance(geometry, Polygon):
        yield geometry
    elif isinstance(geometry, MultiPolygon):
        for part in geometry.geoms:
            if not part.is_empty:
                yield part
    elif isinstance(geometry, GeometryCollection):
        for part in geometry.geoms:
            yield from _polygon_parts(part)


def polygonal_geometry(geometry: Any, *, allow_point: bool = False) -> Any:
    """Return only homogeneous polygonal geometry for polygon MVT layers.

    GEOS intersections and make-valid can legally return a GeometryCollection
    containing polygons plus line/point remnants. mapbox-vector-tile rejects
    that collection type, so discard non-area remnants and union the polygon
    parts before encoding. Point labels opt into the separate point path.
    """
    if geometry is None or geometry.is_empty:
        return geometry if geometry is not None else GeometryCollection()
    if allow_point and isinstance(geometry, Point):
        return geometry
    if isinstance(geometry, (Polygon, MultiPolygon)):
        return geometry
    parts = list(_polygon_parts(geometry))
    if not parts:
        return GeometryCollection()
    merged = unary_union(parts)
    if isinstance(merged, GeometryCollection):
        parts = list(_polygon_parts(merged))
        return unary_union(parts) if parts else GeometryCollection()
    return merged


def split_antimeridian(geometry: Any) -> Any:
    """Split polygon rings at the dateline using the maintained geospatial API."""
    if not isinstance(geometry, (Polygon, MultiPolygon)):
        return geometry
    try:
        from antimeridian import fix_multi_polygon, fix_polygon
    except ImportError as exc:  # pragma: no cover - exercised only in a bad Kaggle env
        raise RuntimeError("The Kaggle build requires the antimeridian package") from exc
    if isinstance(geometry, Polygon):
        return fix_polygon(geometry, fix_winding=True, great_circle=True)
    return fix_multi_polygon(geometry, fix_winding=True, great_circle=True)


def repair_geometry(geometry: Any) -> tuple[Any, str]:
    status: list[str] = []
    if not geometry.is_valid:
        repaired = make_it_valid(geometry)
        status.append("make_valid")
        geometry = repaired
    geometry = polygonal_geometry(geometry)
    if geometry.is_empty:
        return geometry, "+".join(status) or "unchanged"
    if not geometry.is_valid:
        geometry = polygonal_geometry(geometry.buffer(0))
        status.append("buffer_zero")
    if not geometry.is_valid:
        raise GeometryRejected("invalid_after_repair")
    return geometry, "+".join(status) or "unchanged"


def clean_properties(properties: dict[str, Any], layer: str, fallback_id: int) -> tuple[str, dict[str, Any]]:
    shape_id = properties.get("shapeID") or properties.get("shapeId") or f"{layer}-{fallback_id}"
    name = properties.get("shapeName") or properties.get("shape_name") or properties.get("name") or "Unnamed administrative unit"
    country = properties.get("countryCode") or properties.get("shapeGroup") or properties.get("shapeISO") or properties.get("shapeGroupISO") or None
    output: dict[str, Any] = {
        "atlasId": str(shape_id),
        "name": str(name),
        "label": True,
        "selected": False,
        "sourceLayer": layer,
    }
    if country:
        output["countryCode"] = str(country)
    for key in ("shapeType", "shapeISO", "shapeGroup", "boundaryID", "boundaryYearRepresented", "sourceBoundaryId", "adminLevel"):
        value = properties.get(key)
        if value not in (None, ""):
            output[key] = value
    return str(shape_id), output


def component_bounds(geometry: Any) -> list[tuple[float, float, float, float]]:
    if isinstance(geometry, Polygon):
        bounds = finite_bbox(geometry)
        return [bounds] if bounds else []
    if isinstance(geometry, MultiPolygon):
        return [bounds for polygon in geometry.geoms if (bounds := finite_bbox(polygon))]
    bounds = finite_bbox(geometry)
    return [bounds] if bounds else []


def safe_geometry_tile_keys(geometry: Any, zoom: int) -> set[tuple[int, int]]:
    keys: set[tuple[int, int]] = set()
    for minx, miny, maxx, maxy in component_bounds(geometry):
        if maxx - minx > MAX_COMPONENT_LONGITUDE_SPAN + EPSILON:
            raise GeometryRejected("world_spanning_component")
        min_tile_x = tile_x(minx, zoom)
        max_tile_x = tile_x(maxx, zoom)
        min_tile_y = tile_y(maxy, zoom)
        max_tile_y = tile_y(miny, zoom)
        for x in range(min_tile_x, max_tile_x + 1):
            for y in range(min_tile_y, max_tile_y + 1):
                keys.add((x, y))
    if len(keys) > 4096:
        raise GeometryRejected("excessive_tile_replication")
    return keys


def prepare_feature(
    feature: dict[str, Any],
    layer: str,
    zoom: int,
    fallback_id: int,
) -> tuple[dict[str, Any], dict[str, Any]] | None:
    properties = feature.get("properties") or {}
    shape_id, output_properties = clean_properties(properties, layer, fallback_id)
    audit: dict[str, Any] = {
        "layer": layer,
        "sourceId": shape_id,
        "name": str(output_properties.get("name", "")),
        "countryCode": output_properties.get("countryCode"),
        "accepted": False,
        "inputBbox": None,
        "normalizedBbox": None,
        "maxLongitudeJump": None,
        "antimeridianSplitCount": 0,
        "postSplitMaxComponentLongitudeSpan": None,
        "polarStatus": "not_checked",
        "repairStatus": "not_run",
        "tileReplicationCount": 0,
        "rejectedReason": None,
    }
    raw_geometry = feature.get("geometry")
    if not raw_geometry:
        audit["rejectedReason"] = "missing_geometry"
        return None, audit
    try:
        geometry = shape(raw_geometry)
        input_bbox = finite_bbox(geometry)
        audit["inputBbox"] = bbox_json(input_bbox)
        if input_bbox is None:
            raise GeometryRejected("empty_or_nonfinite_geometry")
        # GeoBoundaries is normally already in [-180, 180]. Avoid a Python
        # callback over every vertex for that common case; normalize only
        # malformed/out-of-range source coordinates.
        if input_bbox[0] < -180.0 or input_bbox[2] > 180.0:
            geometry = normalize_longitudes(geometry)
        normalized_bbox = finite_bbox(geometry)
        audit["normalizedBbox"] = bbox_json(normalized_bbox)
        if normalized_bbox is None:
            raise GeometryRejected("empty_or_nonfinite_normalized_geometry")
        maximum_jump, split_count = longitude_jump_stats(geometry)
        audit["maxLongitudeJump"] = round(maximum_jump, 9)
        audit["antimeridianSplitCount"] = split_count
        if split_count:
            geometry = split_antimeridian(geometry)
            audit["repairStatus"] = "antimeridian_split"
        geometry, repair_status = repair_geometry(geometry)
        audit["repairStatus"] = "+".join(filter(None, [audit["repairStatus"], repair_status]))
        if geometry.is_empty:
            raise GeometryRejected("empty_after_repair")
        all_bounds = component_bounds(geometry)
        if not all_bounds:
            raise GeometryRejected("no_polygonal_components")
        maximum_component_span = max(maxx - minx for minx, _, maxx, _ in all_bounds)
        audit["postSplitMaxComponentLongitudeSpan"] = round(maximum_component_span, 9)
        if maximum_component_span > MAX_COMPONENT_LONGITUDE_SPAN + EPSILON:
            raise GeometryRejected("world_spanning_component")
        min_latitude = min(miny for _, miny, _, _ in all_bounds)
        max_latitude = max(maxy for _, _, _, maxy in all_bounds)
        if min_latitude < -SAFE_VECTOR_LATITUDE or max_latitude > SAFE_VECTOR_LATITUDE:
            audit["polarStatus"] = "rejected_outside_safe_vector_latitude"
            raise GeometryRejected("outside_safe_vector_latitude")
        audit["polarStatus"] = "within_safe_vector_latitude"
        tile_keys = safe_geometry_tile_keys(geometry, zoom)
        audit["tileReplicationCount"] = len(tile_keys)
        if not tile_keys:
            raise GeometryRejected("no_intersecting_tiles")
        audit["accepted"] = True
        return {
            "id": shape_id,
            "properties": output_properties,
            "geometry": geometry,
            "tileKeys": tile_keys,
            "audit": audit,
        }, audit
    except GeometryRejected as exc:
        audit["rejectedReason"] = exc.reason
        if exc.audit:
            audit.update(exc.audit)
        return None, audit
    except Exception as exc:
        audit["rejectedReason"] = f"geometry_error:{type(exc).__name__}"
        return None, audit


def tile_x(longitude: float, zoom: int) -> int:
    n = 2**zoom
    clipped = max(-180.0, min(180.0, float(longitude)))
    return max(0, min(n - 1, int(math.floor((clipped + 180.0) / 360.0 * n))))


def tile_y(latitude: float, zoom: int) -> int:
    n = 2**zoom
    clipped = max(-SAFE_VECTOR_LATITUDE, min(SAFE_VECTOR_LATITUDE, float(latitude)))
    radians = math.radians(clipped)
    normalized = (1.0 - math.log(math.tan(radians) + 1.0 / math.cos(radians)) / math.pi) / 2.0
    return max(0, min(n - 1, int(math.floor(normalized * n))))


def tile_bounds(x: int, y: int, zoom: int) -> tuple[float, float, float, float]:
    """Return the exact XYZ tile bounds in EPSG:3857 meters."""
    n = 2**zoom
    earth_radius = 6378137.0
    world = 2.0 * math.pi * earth_radius
    west = x / n * world - world / 2.0
    east = (x + 1) / n * world - world / 2.0
    north = world / 2.0 - y / n * world
    south = world / 2.0 - (y + 1) / n * world
    return west, south, east, north


def project_geometry(geometry: Any) -> Any:
    """Project safe WGS84 geometry without silently clamping latitude.

    pyproj performs the coordinate transform in native code and accepts the
    vectorized coordinate arrays supplied by Shapely 2.x. The pure-Python
    callback remains as a deterministic fallback for minimal environments.
    """
    earth_radius = 6378137.0
    if WEB_MERCATOR_TRANSFORMER is not None:
        return transform(WEB_MERCATOR_TRANSFORMER.transform, geometry)

    def project(longitude: float, latitude: float, *extra: float) -> tuple[float, float]:
        if not math.isfinite(latitude) or abs(latitude) > SAFE_VECTOR_LATITUDE + EPSILON:
            raise GeometryRejected("projected_latitude_outside_safe_vector_latitude")
        x = math.radians(normalize_longitude(longitude)) * earth_radius
        y = math.log(math.tan(math.pi / 4.0 + math.radians(latitude) / 2.0)) * earth_radius
        return x, y

    return transform(project, geometry)


def buffered_tile_bounds(bounds: tuple[float, float, float, float]) -> tuple[float, float, float, float]:
    west, south, east, north = bounds
    buffer_meters = (east - west) * MVT_BUFFER_PIXELS / MVT_EXTENT
    return west - buffer_meters, south - buffer_meters, east + buffer_meters, north + buffer_meters


def encode_tile(layer: str, records: list[dict[str, Any]], x: int, y: int, zoom: int, label_only: bool = False) -> bytes:
    bounds = tile_bounds(x, y, zoom)
    clip_bounds = buffered_tile_bounds(bounds)
    features = []
    tile_shape = box(*clip_bounds)
    for record in records:
        geometry = record["geometry"]
        if label_only:
            clipped_geometry = geometry
        else:
            minx, miny, maxx, maxy = record.get("bounds", geometry.bounds)
            if minx >= clip_bounds[0] and miny >= clip_bounds[1] and maxx <= clip_bounds[2] and maxy <= clip_bounds[3]:
                # Most small administrative units already fit inside the
                # buffered tile. Avoid a costly GEOS intersection in that
                # common case; the encoder still quantizes to exact bounds.
                clipped_geometry = geometry
            else:
                try:
                    clipped_geometry = shapely_intersection(geometry, tile_shape, grid_size=0.01)
                except Exception:
                    repaired = make_it_valid(geometry)
                    try:
                        clipped_geometry = shapely_intersection(repaired, tile_shape, grid_size=0.01)
                    except Exception:
                        clipped_geometry = shapely_intersection(repaired.buffer(0), tile_shape, grid_size=0.01)
        clipped = polygonal_geometry(clipped_geometry, allow_point=label_only)
        if clipped.is_empty:
            continue
        if label_only:
            if not isinstance(clipped, Point):
                continue
        else:
            if not isinstance(clipped, (Polygon, MultiPolygon)):
                continue
            if not clipped.is_valid:
                clipped = polygonal_geometry(make_it_valid(clipped))
            if clipped.is_empty or not isinstance(clipped, (Polygon, MultiPolygon)) or not clipped.is_valid:
                continue
        features.append({
            "id": record["id"],
            "properties": record["properties"],
            "geometry": clipped,
        })
    if not features:
        return b""
    return encode(
        {"name": layer, "features": features},
        default_options={
            "quantize_bounds": bounds,
            "extents": MVT_EXTENT,
            "y_coord_down": True,
            "check_winding_order": True,
            "on_invalid_geometry": make_it_valid,
        },
    )


def read_records(
    source_path: Path,
    layer: str,
    zoom: int,
    output_root: Path,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    records: list[dict[str, Any]] = []
    audit_rows: list[dict[str, Any]] = []
    started = time.monotonic()
    last_report = started
    rejected_reasons: Counter[str] = Counter()
    accepted_crossings = 0
    progress_path = output_root / f"build-progress-{layer}.jsonl"
    progress_path.write_text("", encoding="utf-8")
    progress_line(layer, "read-start", started, sourceBytes=source_path.stat().st_size, zoom=zoom)
    with source_path.open("rb") as handle:
        for fallback_id, feature in enumerate(ijson.items(handle, "features.item"), start=1):
            record, audit = prepare_feature(feature, layer, zoom, fallback_id)
            audit_rows.append(audit)
            if record is not None:
                record["geometry"] = project_geometry(record["geometry"])
                record["labelGeometry"] = record["geometry"].representative_point()
                records.append(record)
                if audit.get("antimeridianSplitCount", 0) > 0:
                    accepted_crossings += 1
            else:
                rejected_reasons[str(audit.get("rejectedReason") or "unknown")] += 1
            now = time.monotonic()
            if fallback_id % PROGRESS_FEATURE_INTERVAL == 0 or now - last_report >= PROGRESS_INTERVAL_SECONDS:
                elapsed = now - started
                summary = {
                    "layer": layer,
                    "phase": "read",
                    "elapsedSeconds": round(elapsed, 1),
                    "sourceFeaturesSeen": fallback_id,
                    "acceptedFeatures": len(records),
                    "rejectedFeatures": fallback_id - len(records),
                    "acceptedAntimeridianFeatures": accepted_crossings,
                    "rejectedReasons": dict(rejected_reasons),
                }
                with progress_path.open("a", encoding="utf-8") as progress_handle:
                    progress_handle.write(json.dumps(summary, separators=(",", ":")) + "\n")
                progress_line(
                    layer,
                    "read",
                    started,
                    sourceFeatures=fallback_id,
                    accepted=len(records),
                    rejected=fallback_id - len(records),
                    antimeridian=accepted_crossings,
                    polar=rejected_reasons.get("outside_safe_vector_latitude", 0),
                )
                last_report = now
    progress_line(
        layer,
        "read-complete",
        started,
        sourceFeatures=len(audit_rows),
        accepted=len(records),
        rejected=len(audit_rows) - len(records),
        antimeridian=accepted_crossings,
        polar=rejected_reasons.get("outside_safe_vector_latitude", 0),
    )
    return records, audit_rows


def build_encoded_layer(
    records: list[dict[str, Any]],
    layer: str,
    zoom: int,
    output_root: Path,
    label_only: bool = False,
    workers: int | None = None,
) -> dict[str, Any]:
    output_layer = f"{layer}-labels" if label_only else layer
    mvt_layer = "labels" if label_only else layer
    layer_root = output_root / output_layer
    if layer_root.exists():
        shutil.rmtree(layer_root)
    layer_root.mkdir(parents=True, exist_ok=True)
    tiles: dict[tuple[int, int], list[dict[str, Any]]] = {}
    for source_record in records:
        if label_only:
            geometry = source_record["labelGeometry"]
            tile_keys = {(
                tile_x(math.degrees(geometry.x / 6378137.0), zoom),
                tile_y(math.degrees(2.0 * math.atan(math.exp(geometry.y / 6378137.0)) - math.pi / 2.0), zoom),
            )}
        else:
            geometry = source_record["geometry"]
            tile_keys = source_record["tileKeys"]
        record = {
            "id": source_record["id"],
            "properties": source_record["properties"],
            "geometry": geometry,
            "bounds": geometry.bounds,
        }
        for key in tile_keys:
            tiles.setdefault(key, []).append(record)
    tile_bytes = 0
    tile_files: list[str] = []
    started = time.monotonic()
    total_tiles = len(tiles)
    workers = max(1, min(4, workers or (os.cpu_count() or 1)))
    progress_line(layer, "tile-encode-start", started, outputLayer=output_layer, records=len(records), candidateTiles=total_tiles, workers=workers, zoom=zoom)
    last_report = started
    encoded_tiles: list[tuple[tuple[int, int], bytes]] = []
    tile_items = sorted(tiles.items())
    with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="atlas-mvt") as executor:
        futures = {
            executor.submit(encode_tile, mvt_layer, records_for_tile, x, y, zoom, label_only): (x, y)
            for (x, y), records_for_tile in tile_items
        }
        for tile_index, future in enumerate(as_completed(futures), start=1):
            key = futures[future]
            payload = future.result()
            if payload:
                encoded_tiles.append((key, payload))
            now = time.monotonic()
            if tile_index == total_tiles or tile_index % 100 == 0 or now - last_report >= PROGRESS_INTERVAL_SECONDS:
                written_bytes = sum(len(data) for _, data in encoded_tiles)
                progress_line(layer, "tile-encode", started, outputLayer=output_layer, tiles=f"{tile_index}/{total_tiles}", written=len(encoded_tiles), bytes=written_bytes, workers=workers)
                last_report = now
    for (x, y), payload in sorted(encoded_tiles):
        tile_path = layer_root / str(zoom) / str(x) / f"{y}.pbf"
        tile_path.parent.mkdir(parents=True, exist_ok=True)
        tile_path.write_bytes(payload)
        tile_bytes += len(payload)
        tile_files.append(f"{zoom}/{x}/{y}.pbf")
    progress_line(layer, "tile-encode-complete", started, outputLayer=output_layer, tiles=len(tile_files), bytes=tile_bytes)
    return {
        "tileZoom": zoom,
        "featureCount": len(records),
        "invalidOrEmptyFeatures": 0,
        "tileCount": len(tile_files),
        "tileBytes": tile_bytes,
        "tiles": tile_files,
        "layerDirectory": output_layer,
        "mvtSourceLayer": mvt_layer,
        "labelOnly": label_only,
    }


def write_audit(output_root: Path, audit_rows: list[dict[str, Any]], layer: str) -> dict[str, Any]:
    json_path = output_root / f"geometry-audit-{layer}.json"
    csv_path = output_root / f"geometry-audit-{layer}.csv"
    json_path.write_text(json.dumps(audit_rows, indent=2) + "\n", encoding="utf-8")
    columns = [
        "layer", "sourceId", "name", "countryCode", "accepted", "inputBbox", "normalizedBbox",
        "maxLongitudeJump", "antimeridianSplitCount", "postSplitMaxComponentLongitudeSpan",
        "polarStatus", "repairStatus", "tileReplicationCount", "rejectedReason",
    ]
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in audit_rows:
            writer.writerow({key: json.dumps(row.get(key), separators=(",", ":")) if isinstance(row.get(key), list) else row.get(key) for key in columns})
    accepted = sum(1 for row in audit_rows if row.get("accepted"))
    rejected = len(audit_rows) - accepted
    return {
        "json": json_path.name,
        "csv": csv_path.name,
        "sourceFeatureCount": len(audit_rows),
        "acceptedFeatureCount": accepted,
        "rejectedFeatureCount": rejected,
        "rejectedReasons": {
            reason: sum(1 for row in audit_rows if row.get("rejectedReason") == reason)
            for reason in sorted({row.get("rejectedReason") for row in audit_rows if row.get("rejectedReason")})
        },
    }


def build_points_layer(
    source_path: Path,
    output_root: Path,
    zoom: int,
    source_url: str,
    source_sha256: str,
    source_metadata: dict[str, Any],
    workers: int | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    layer = "places"
    started = time.monotonic()
    records: list[dict[str, Any]] = []
    audit_rows: list[dict[str, Any]] = []
    progress_line(layer, "point-read-start", started, source=source_path.name, sourceBytes=source_path.stat().st_size, zoom=zoom)
    with source_path.open("rb") as handle:
        for fallback_id, feature in enumerate(ijson.items(handle, "features.item"), start=1):
            properties = feature.get("properties") or {}
            audit: dict[str, Any] = {
                "layer": layer,
                "sourceId": str(properties.get("shapeID") or properties.get("geonameId") or fallback_id),
                "name": str(properties.get("shapeName") or properties.get("name") or "Unnamed place"),
                "countryCode": properties.get("countryCode"),
                "accepted": False,
                "inputBbox": None,
                "normalizedBbox": None,
                "maxLongitudeJump": 0,
                "antimeridianSplitCount": 0,
                "postSplitMaxComponentLongitudeSpan": 0,
                "polarStatus": "not_checked",
                "repairStatus": "not_run",
                "tileReplicationCount": 0,
                "rejectedReason": None,
            }
            try:
                geometry = shape(feature.get("geometry") or {})
                if not isinstance(geometry, Point) or geometry.is_empty:
                    raise GeometryRejected("not_a_point")
                longitude, latitude = float(geometry.x), float(geometry.y)
                if not all(math.isfinite(value) for value in (longitude, latitude)):
                    raise GeometryRejected("empty_or_nonfinite_geometry")
                longitude = normalize_longitude(longitude)
                if abs(latitude) > SAFE_VECTOR_LATITUDE + EPSILON:
                    audit["polarStatus"] = "rejected_outside_safe_vector_latitude"
                    raise GeometryRejected("outside_safe_vector_latitude")
                geometry = Point(longitude, latitude)
                projected = project_geometry(geometry)
                source_id = str(properties.get("shapeID") or properties.get("geonameId") or f"places-{fallback_id}")
                output_properties = {
                    "atlasId": source_id,
                    "name": str(properties.get("shapeName") or properties.get("name") or "Unnamed place"),
                    "label": True,
                    "selected": False,
                    "sourceLayer": layer,
                    "countryCode": str(properties.get("countryCode") or ""),
                    "featureClass": str(properties.get("featureClass") or "P"),
                    "featureCode": str(properties.get("featureCode") or ""),
                    "population": int(properties.get("population") or 0),
                    "admin1Code": str(properties.get("admin1Code") or ""),
                    "admin2Code": str(properties.get("admin2Code") or ""),
                }
                records.append({
                    "id": source_id,
                    "properties": output_properties,
                    "geometry": projected,
                    "labelGeometry": projected,
                })
                audit["accepted"] = True
                audit["polarStatus"] = "within_safe_vector_latitude"
                audit["repairStatus"] = "point"
                audit["tileReplicationCount"] = 1
            except GeometryRejected as exc:
                audit["rejectedReason"] = exc.reason
            except Exception as exc:
                audit["rejectedReason"] = f"geometry_error:{type(exc).__name__}"
            audit_rows.append(audit)
            if fallback_id % PROGRESS_FEATURE_INTERVAL == 0:
                progress_line(layer, "point-read", started, sourceFeatures=fallback_id, accepted=len(records), rejected=fallback_id - len(records))
    audit_metadata = write_audit(output_root, audit_rows, layer)
    point_metadata = build_encoded_layer(records, layer, zoom, output_root, label_only=True, workers=workers)
    point_metadata.update({
        "sourceFile": source_file_label(source_path),
        "sourceSha256": source_sha256,
        "sourceUrl": source_url,
        "sourceMetadata": [source_metadata],
        "audit": audit_metadata,
    })
    point_metadata["invalidOrEmptyFeatures"] = audit_metadata["rejectedFeatureCount"]
    progress_line(layer, "complete", started, accepted=len(records), rejected=audit_metadata["rejectedFeatureCount"], pointTiles=point_metadata["tileCount"], pointBytes=point_metadata["tileBytes"])
    return point_metadata, audit_metadata


def build_layer(
    source_path: Path,
    layer: str,
    zoom: int,
    output_root: Path,
    workers: int | None = None,
    source_url: str | None = None,
    source_metadata: list[dict[str, Any]] | None = None,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    started = time.monotonic()
    progress_line(layer, "start", started, source=source_path.name, sourceBytes=source_path.stat().st_size, zoom=zoom)
    records, audit_rows = read_records(source_path, layer, zoom, output_root)
    audit_metadata = write_audit(output_root, audit_rows, layer)
    progress_line(layer, "audit-written", started, sourceFeatures=len(audit_rows), accepted=len(records), rejected=len(audit_rows) - len(records), auditJson=audit_metadata["json"], auditCsv=audit_metadata["csv"])
    polygon_metadata = build_encoded_layer(records, layer, zoom, output_root, label_only=False, workers=workers)
    label_metadata = build_encoded_layer(records, layer, zoom, output_root, label_only=True, workers=workers)
    source_metadata = {
        "sourceFile": source_file_label(source_path),
        "sourceSha256": sha256_file(source_path),
        "sourceUrl": source_url or SOURCE_URLS.get(layer, SOURCE_URLS["adm2"]),
        "sourceMetadata": source_metadata or [],
        "audit": audit_metadata,
    }
    polygon_metadata.update(source_metadata)
    label_metadata.update(source_metadata)
    polygon_metadata["invalidOrEmptyFeatures"] = audit_metadata["rejectedFeatureCount"]
    label_metadata["invalidOrEmptyFeatures"] = audit_metadata["rejectedFeatureCount"]
    progress_line(layer, "complete", started, accepted=len(records), rejected=audit_metadata["rejectedFeatureCount"], polygonTiles=polygon_metadata["tileCount"], labelTiles=label_metadata["tileCount"], polygonBytes=polygon_metadata["tileBytes"], labelBytes=label_metadata["tileBytes"])
    return polygon_metadata, label_metadata, audit_metadata


def load_layer_specs(spec_path: Path, source_dir: Path) -> list[dict[str, Any]]:
    payload = json.loads(spec_path.read_text(encoding="utf-8"))
    raw_levels = payload.get("levels")
    if not isinstance(raw_levels, list):
        raise SystemExit(f"Layer spec has no levels list: {spec_path}")
    specs: list[dict[str, Any]] = []
    for raw in raw_levels:
        layer = str(raw.get("layer", "")).lower()
        if layer not in {"adm3", "adm4", "adm5"}:
            raise SystemExit(f"Unsupported deep layer in spec: {layer}")
        source_file = Path(str(raw.get("sourceFile", "")))
        if not source_file.name:
            raise SystemExit(f"Missing sourceFile for {layer}")
        if not source_file.is_absolute():
            source_file = source_dir / source_file
        specs.append({
            "layer": layer,
            "tileZoom": int(raw.get("tileZoom", DEFAULT_LAYER_ZOOMS[layer])),
            "sourceFile": source_file,
            "sourceUrl": str(raw.get("sourceUrl") or SOURCE_URLS[layer]),
            "sourceMetadata": raw.get("sourceRows") if isinstance(raw.get("sourceRows"), list) else [],
            "featureCount": raw.get("featureCount"),
        })
    return specs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output-base", type=Path, default=DEFAULT_OUTPUT_BASE)
    parser.add_argument("--release-id", default=DEFAULT_RELEASE)
    parser.add_argument("--layers", nargs="+", default=("adm1", "adm2"))
    parser.add_argument("--layer-spec", type=Path, default=None, help="Kaggle-generated JSON spec for available country-specific ADM3-ADM5 inputs")
    parser.add_argument("--workers", type=int, default=None, help="Tile encoder threads per layer; default is up to four based on CPU count")
    parser.add_argument("--parallel-layers", action="store_true", help="Build independent levels in separate CPU processes")
    parser.add_argument("--places-source", type=Path, default=None, help="Optional GeoNames-derived Point GeoJSON input")
    parser.add_argument("--places-metadata", type=Path, default=None, help="Metadata JSON for the optional GeoNames-derived Point GeoJSON input")
    parser.add_argument("--places-zoom", type=int, default=8, help="Tile zoom for the optional global place points")
    args = parser.parse_args()
    source_dir = args.source_dir if args.source_dir.is_absolute() else ROOT / args.source_dir
    output_base = args.output_base if args.output_base.is_absolute() else ROOT / args.output_base
    output_root = output_base / args.release_id
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True, exist_ok=True)
    workers = max(1, min(4, args.workers or (os.cpu_count() or 1)))

    base_layers = []
    for layer in args.layers:
        layer = str(layer).lower()
        if layer not in DEFAULT_LAYER_ZOOMS or layer in {"adm3", "adm4", "adm5"}:
            raise SystemExit(f"Base --layers accepts adm1/adm2 only; use --layer-spec for deep levels: {layer}")
        source_path = source_dir / f"geoBoundariesCGAZ_{layer.upper()}.geojson"
        base_layers.append({
            "layer": layer,
            "tileZoom": DEFAULT_LAYER_ZOOMS[layer],
            "sourceFile": source_path,
            "sourceUrl": SOURCE_URLS[layer],
            "sourceMetadata": [],
        })
    deep_layers = load_layer_specs(args.layer_spec, source_dir) if args.layer_spec else []
    layer_specs = base_layers + deep_layers
    if not layer_specs:
        raise SystemExit("No layers configured")
    layers_config = {item["layer"]: item for item in layer_specs}
    layer_names = [item["layer"] for item in layer_specs]
    print(f"[AtlasWorld] build-start release={args.release_id} output={output_root} layers={','.join(layer_names)} workers={workers} cpuCount={os.cpu_count() or 1} parallelLayers={args.parallel_layers}", flush=True)
    layers: dict[str, Any] = {}
    audits: dict[str, Any] = {}
    build_results: dict[str, tuple[dict[str, Any], dict[str, Any], dict[str, Any]]] = {}
    layer_processes = min(len(layer_specs), workers) if args.parallel_layers else 1
    layer_workers = max(1, workers // layer_processes) if args.parallel_layers else workers
    if args.parallel_layers and len(layer_specs) > 1:
        print(f"[AtlasWorld] phase=parallel-layer-start layers={','.join(layer_names)} processes={layer_processes} workersPerLayer={layer_workers}", flush=True)
        with ProcessPoolExecutor(max_workers=layer_processes) as executor:
            futures = {}
            for item in layer_specs:
                source_path = item["sourceFile"]
                if not source_path.exists():
                    raise SystemExit(f"Missing source snapshot: {source_path}")
                print(f"[AtlasWorld] layer-queued layer={item['layer']} source={source_path.name} bytes={source_path.stat().st_size}", flush=True)
                futures[executor.submit(
                    build_layer,
                    source_path,
                    item["layer"],
                    item["tileZoom"],
                    output_root,
                    layer_workers,
                    item["sourceUrl"],
                    item["sourceMetadata"],
                )] = item["layer"]
            for future in as_completed(futures):
                layer = futures[future]
                build_results[layer] = future.result()
                print(f"[AtlasWorld] layer-process-complete layer={layer}", flush=True)
    else:
        for item in layer_specs:
            source_path = item["sourceFile"]
            print(f"[AtlasWorld] layer-start layer={item['layer']} source={source_path.name} bytes={source_path.stat().st_size}", flush=True)
            if not source_path.exists():
                raise SystemExit(f"Missing source snapshot: {source_path}")
            build_results[item["layer"]] = build_layer(
                source_path,
                item["layer"],
                item["tileZoom"],
                output_root,
                workers=workers,
                source_url=item["sourceUrl"],
                source_metadata=item["sourceMetadata"],
            )
    for item in layer_specs:
        layer = item["layer"]
        polygon, labels, audit = build_results[layer]
        layers[layer] = polygon
        layers[f"{layer}Labels"] = labels
        audits[layer] = audit

    if args.places_source:
        places_source = args.places_source if args.places_source.is_absolute() else ROOT / args.places_source
        places_metadata_path = args.places_metadata if args.places_metadata and args.places_metadata.is_absolute() else (ROOT / args.places_metadata if args.places_metadata else None)
        if not places_source.exists():
            raise SystemExit(f"Missing places source: {places_source}")
        if not places_metadata_path or not places_metadata_path.exists():
            raise SystemExit("--places-metadata is required when --places-source is provided")
        places_metadata = json.loads(places_metadata_path.read_text(encoding="utf-8"))
        print(f"[AtlasWorld] layer-start layer=places source={places_source.name} bytes={places_source.stat().st_size}", flush=True)
        place_layer, place_audit = build_points_layer(
            places_source,
            output_root,
            args.places_zoom,
            str(places_metadata.get("sourceUrl") or "https://download.geonames.org/export/dump/cities500.zip"),
            str(places_metadata.get("sourceSha256") or sha256_file(places_source)),
            places_metadata,
            workers=workers,
        )
        layers["placesLabels"] = place_layer
        audits["places"] = place_audit
        print(f"[AtlasWorld] layer-process-complete layer=places", flush=True)
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    deep_summary = {
        item["layer"]: {
            "tileZoom": item["tileZoom"],
            "sourceFile": item["sourceFile"].name,
            "sourceMetadataRecords": len(item["sourceMetadata"]),
            "requestedFeatureCount": item.get("featureCount"),
        }
        for item in deep_layers
    }
    manifest = {
        "format": "atlas-global-geoboundaries-mvt-v1",
        "releaseId": args.release_id,
        "generatedAt": generated_at,
        "coordinateSystem": "WGS84 longitude/latitude source projected to spherical Web Mercator meters and encoded as XYZ vector tiles at build time",
        "tileTemplate": "/data/world-mvt/{releaseId}/{layer}/{z}/{x}/{y}.pbf",
        "geometryPolicy": {
            "antimeridian": "Normalize longitudes and split polygon rings at the 180th meridian before projection.",
            "safeVectorLatitude": SAFE_VECTOR_LATITUDE,
            "polarDetail": "Features touching latitudes outside the safe vector latitude are rejected and listed in the geometry audit; the local country overview remains the fallback there.",
            "tileBufferPixels": MVT_BUFFER_PIXELS,
            "worldSpanningFeatures": "Rejected after component splitting rather than emitted as a world-spanning fill.",
        },
        "coveragePolicy": {
            "adm1": "Global composite administrative level 1 from geoBoundaries CGAZ; displayed as reference geometry.",
            "adm2": "Global composite administrative level 2 from geoBoundaries CGAZ; displayed as reference geometry.",
            "deepLevels": deep_summary,
            "places": "GeoNames cities500 populated-place reference points; source is CC BY and is not a complete locality census.",
            "disputedAreas": "CGAZ global composite policy follows the source project; Atlas does not infer sovereignty.",
            "syntheticFeatures": 0,
        },
        "source": {
            "publisher": "geoBoundaries / William & Mary geoLab",
            "dataset": "CGAZ plus country-specific gbOpen administrative levels where available",
            "license": "Per-source attribution and license metadata are preserved per layer",
            "sourceUrl": "https://www.geoboundaries.org/api.html",
        },
        "geometryAudits": audits,
        "layers": layers,
    }
    manifest_text = json.dumps(manifest, separators=(",", ":")) + "\n"
    (output_root / "manifest.json").write_text(manifest_text, encoding="utf-8")
    output_base.mkdir(parents=True, exist_ok=True)
    (output_base / "manifest.json").write_text(manifest_text, encoding="utf-8")
    summary = {
        "outputRoot": str(output_root),
        "releaseId": args.release_id,
        "safeVectorLatitude": SAFE_VECTOR_LATITUDE,
        "layers": {
            key: {field: value[field] for field in ("tileZoom", "featureCount", "invalidOrEmptyFeatures", "tileCount", "tileBytes")}
            for key, value in layers.items()
        },
        "audits": audits,
    }
    (output_root / "build-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"[AtlasWorld] build-complete release={args.release_id} manifest={output_root / 'manifest.json'}", flush=True)
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
