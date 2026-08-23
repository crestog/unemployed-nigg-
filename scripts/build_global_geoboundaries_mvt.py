#!/usr/bin/env python3
"""Build an auditable, source-backed global GeoBoundaries MVT release.

This is an offline Kaggle build. The browser never imports this module; it only
serves the generated static tiles. The builder deliberately rejects source
features that cannot be represented safely in spherical Web Mercator vector
tiles instead of silently clamping or emitting world-spanning geometry.

Offline prerequisites: ijson, shapely, antimeridian, mapbox-vector-tile,
pyclipper, and protobuf.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import ijson
from mapbox_vector_tile import encode
from mapbox_vector_tile.polygon import make_it_valid
from shapely import intersection as shapely_intersection
from shapely.geometry import GeometryCollection, MultiPolygon, Point, Polygon, box, shape
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = ROOT / "data" / "raw" / "world" / "geoboundaries"
DEFAULT_OUTPUT_BASE = ROOT / "client" / "public" / "data" / "world-mvt"
DEFAULT_RELEASE = "world-global-geoboundaries-kaggle"
SOURCE_URLS = {
    "adm1": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM1.geojson",
    "adm2": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM2.geojson",
}

# MapLibre globe still consumes ordinary Web Mercator vector tile geometry.
# Features above this latitude are not emitted for the global ADM detail layers;
# the local country overview remains the fallback at those latitudes.
SAFE_VECTOR_LATITUDE = 80.0
MAX_COMPONENT_LONGITUDE_SPAN = 180.0
MVT_EXTENT = 4096
MVT_BUFFER_PIXELS = 8
EPSILON = 1e-9


class GeometryRejected(Exception):
    """A source feature cannot be represented safely by this tile contract."""

    def __init__(self, reason: str, *, audit: dict[str, Any] | None = None):
        super().__init__(reason)
        self.reason = reason
        self.audit = audit or {}


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
        for first, second in zip(ring, ring[1:]):
            jump = abs(second[0] - first[0])
            maximum = max(maximum, jump)
            if jump > 180.0 + EPSILON:
                crossings += 1
    return maximum, crossings


def polygonal_geometry(geometry: Any) -> Any:
    if geometry is None or geometry.is_empty:
        return geometry
    if isinstance(geometry, (Point, Polygon, MultiPolygon)):
        return geometry
    if isinstance(geometry, GeometryCollection):
        parts = [part for part in geometry.geoms if isinstance(part, (Polygon, MultiPolygon, Point)) and not part.is_empty]
        if not parts:
            return GeometryCollection()
        return unary_union(parts)
    return GeometryCollection()


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
    country = properties.get("shapeGroup") or properties.get("shapeISO") or properties.get("shapeGroupISO") or None
    output: dict[str, Any] = {
        "atlasId": str(shape_id),
        "name": str(name),
        "label": True,
        "selected": False,
        "sourceLayer": layer,
    }
    if country:
        output["countryCode"] = str(country)
    for key in ("shapeType", "shapeISO", "shapeGroup", "boundaryID", "boundaryYearRepresented"):
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
    """Project safe WGS84 geometry without silently clamping latitude."""
    earth_radius = 6378137.0

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


def encode_tile(layer: str, records: list[dict[str, Any]], x: int, y: int, zoom: int) -> bytes:
    bounds = tile_bounds(x, y, zoom)
    clip_bounds = buffered_tile_bounds(bounds)
    features = []
    tile_shape = box(*clip_bounds)
    for record in records:
        try:
            clipped_geometry = shapely_intersection(record["geometry"], tile_shape, grid_size=0.01)
        except Exception:
            repaired = make_it_valid(record["geometry"])
            try:
                clipped_geometry = shapely_intersection(repaired, tile_shape, grid_size=0.01)
            except Exception:
                clipped_geometry = shapely_intersection(repaired.buffer(0), tile_shape, grid_size=0.01)
        clipped = polygonal_geometry(clipped_geometry)
        if clipped.is_empty:
            continue
        if not clipped.is_valid:
            clipped = polygonal_geometry(make_it_valid(clipped))
        if clipped.is_empty or not clipped.is_valid:
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


def read_records(source_path: Path, layer: str, zoom: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    records: list[dict[str, Any]] = []
    audit_rows: list[dict[str, Any]] = []
    with source_path.open("rb") as handle:
        for fallback_id, feature in enumerate(ijson.items(handle, "features.item"), start=1):
            record, audit = prepare_feature(feature, layer, zoom, fallback_id)
            audit_rows.append(audit)
            if record is not None:
                record["geometry"] = project_geometry(record["geometry"])
                record["labelGeometry"] = record["geometry"].representative_point()
                records.append(record)
    return records, audit_rows


def build_encoded_layer(
    records: list[dict[str, Any]],
    layer: str,
    zoom: int,
    output_root: Path,
    label_only: bool = False,
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
        }
        for key in tile_keys:
            tiles.setdefault(key, []).append(record)
    tile_bytes = 0
    tile_files: list[str] = []
    for (x, y), records_for_tile in sorted(tiles.items()):
        payload = encode_tile(mvt_layer, records_for_tile, x, y, zoom)
        if not payload:
            continue
        tile_path = layer_root / str(zoom) / str(x) / f"{y}.pbf"
        tile_path.parent.mkdir(parents=True, exist_ok=True)
        tile_path.write_bytes(payload)
        tile_bytes += len(payload)
        tile_files.append(f"{zoom}/{x}/{y}.pbf")
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


def build_layer(source_path: Path, layer: str, zoom: int, output_root: Path) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    records, audit_rows = read_records(source_path, layer, zoom)
    audit_metadata = write_audit(output_root, audit_rows, layer)
    polygon_metadata = build_encoded_layer(records, layer, zoom, output_root, label_only=False)
    label_metadata = build_encoded_layer(records, layer, zoom, output_root, label_only=True)
    source_metadata = {
        "sourceFile": str(source_path.relative_to(ROOT)),
        "sourceSha256": sha256_file(source_path),
        "sourceUrl": SOURCE_URLS[layer],
        "audit": audit_metadata,
    }
    polygon_metadata.update(source_metadata)
    label_metadata.update(source_metadata)
    polygon_metadata["invalidOrEmptyFeatures"] = audit_metadata["rejectedFeatureCount"]
    label_metadata["invalidOrEmptyFeatures"] = audit_metadata["rejectedFeatureCount"]
    return polygon_metadata, label_metadata, audit_metadata


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output-base", type=Path, default=DEFAULT_OUTPUT_BASE)
    parser.add_argument("--release-id", default=DEFAULT_RELEASE)
    parser.add_argument("--layers", nargs="+", choices=("adm1", "adm2"), default=("adm1", "adm2"))
    args = parser.parse_args()
    source_dir = args.source_dir if args.source_dir.is_absolute() else ROOT / args.source_dir
    output_base = args.output_base if args.output_base.is_absolute() else ROOT / args.output_base
    output_root = output_base / args.release_id
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True, exist_ok=True)
    configs = {"adm1": 5, "adm2": 7}
    layers: dict[str, Any] = {}
    audits: dict[str, Any] = {}
    for layer in args.layers:
        source_path = source_dir / f"geoBoundariesCGAZ_{layer.upper()}.geojson"
        if not source_path.exists():
            raise SystemExit(f"Missing source snapshot: {source_path}")
        polygon, labels, audit = build_layer(source_path, layer, configs[layer], output_root)
        layers[layer] = polygon
        layers[f"{layer}Labels"] = labels
        audits[layer] = audit
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    manifest = {
        "format": "atlas-global-geoboundaries-mvt-v1",
        "releaseId": args.release_id,
        "generatedAt": generated_at,
        "coordinateSystem": "WGS84 longitude/latitude source projected to spherical Web Mercator meters and encoded as XYZ vector tiles at build time",
        "tileTemplate": "/data/world-mvt/{releaseId}/{layer}/{z}/{x}/{y}.pbf",
        "geometryPolicy": {
            "antimeridian": "Normalize longitudes and split polygon rings at the 180th meridian before projection.",
            "safeVectorLatitude": SAFE_VECTOR_LATITUDE,
            "polarDetail": "Global ADM1/ADM2 features touching latitudes outside the safe vector latitude are rejected and listed in the geometry audit; the local country overview remains the fallback there.",
            "tileBufferPixels": MVT_BUFFER_PIXELS,
            "worldSpanningFeatures": "Rejected after component splitting rather than emitted as a world-spanning fill.",
        },
        "coveragePolicy": {
            "adm1": "Global composite administrative level 1 from geoBoundaries CGAZ; displayed as reference geometry.",
            "adm2": "Global composite administrative level 2 from geoBoundaries CGAZ; displayed as reference geometry.",
            "disputedAreas": "CGAZ global composite policy follows the source project's US Department of State definitions; Atlas does not infer sovereignty.",
            "syntheticFeatures": 0,
        },
        "source": {
            "publisher": "geoBoundaries / William & Mary geoLab",
            "dataset": "Comprehensive Global Administrative Zones (CGAZ)",
            "license": "Attribution required; see source terms",
            "sourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
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
            key: {
                field: value[field]
                for field in ("tileZoom", "featureCount", "invalidOrEmptyFeatures", "tileCount", "tileBytes")
            }
            for key, value in layers.items()
        },
        "audits": audits,
    }
    (output_root / "build-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
