#!/usr/bin/env python3
"""Build compact, source-backed global GeoBoundaries MVT releases.

The raw GeoJSON files are intentionally kept under data/raw/ (ignored by git).
This builder streams features with ijson and writes MapLibre-compatible XYZ
vector tiles under client/public/data/world-mvt/<release-id>/.

Offline build prerequisites only: ijson, shapely, mapbox-vector-tile, pyclipper,
and protobuf. Production does not import Python or these packages; it serves the
committed generated tiles and manifests as static assets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
from pathlib import Path
from typing import Any, Iterable

import ijson
from mapbox_vector_tile import encode
from mapbox_vector_tile.polygon import make_it_valid
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon, box, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = ROOT / "data" / "raw" / "world" / "geoboundaries"
DEFAULT_OUTPUT_BASE = ROOT / "client" / "public" / "data" / "world-mvt"
DEFAULT_RELEASE = "world-global-geoboundaries-20260823"
SOURCE_URLS = {
    "adm1": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM1.geojson",
    "adm2": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM2.geojson",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tile_x(longitude: float, zoom: int) -> int:
    n = 2**zoom
    return max(0, min(n - 1, int(math.floor((longitude + 180.0) / 360.0 * n))))


def tile_y(latitude: float, zoom: int) -> int:
    n = 2**zoom
    clipped = max(-85.05112878, min(85.05112878, latitude))
    radians = math.radians(clipped)
    normalized = (1.0 - math.log(math.tan(radians) + 1.0 / math.cos(radians)) / math.pi) / 2.0
    return max(0, min(n - 1, int(math.floor(normalized * n))))


def tile_bounds(x: int, y: int, zoom: int) -> tuple[float, float, float, float]:
    n = 2**zoom
    west = x / n * 360.0 - 180.0
    east = (x + 1) / n * 360.0 - 180.0
    north = math.degrees(math.atan(math.sinh(math.pi * (1.0 - 2.0 * y / n))))
    south = math.degrees(math.atan(math.sinh(math.pi * (1.0 - 2.0 * (y + 1) / n))))
    return west, south, east, north


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


def polygonal_geometry(geometry: Any) -> Any:
    if geometry is None or geometry.is_empty:
        return geometry
    if isinstance(geometry, (Polygon, MultiPolygon)):
        return geometry
    if isinstance(geometry, GeometryCollection):
        parts = [part for part in geometry.geoms if isinstance(part, (Polygon, MultiPolygon)) and not part.is_empty]
        if not parts:
            return GeometryCollection()
        return unary_union(parts)
    return GeometryCollection()


def feature_tiles(feature: dict[str, Any], layer: str, zoom: int, fallback_id: int) -> tuple[str, dict[str, Any], Any, tuple[float, float, float, float]] | None:
    geometry = feature.get("geometry")
    if not geometry:
        return None
    try:
        geom = shape(geometry)
    except Exception:
        return None
    if geom.is_empty:
        return None
    if not geom.is_valid:
        geom = make_it_valid(geom)
    geom = polygonal_geometry(geom)
    if geom.is_empty:
        return None
    minx, miny, maxx, maxy = geom.bounds
    if not all(math.isfinite(value) for value in (minx, miny, maxx, maxy)):
        return None
    minx = max(-180.0, min(180.0, minx))
    maxx = max(-180.0, min(180.0, maxx))
    miny = max(-85.05112878, min(85.05112878, miny))
    maxy = max(-85.05112878, min(85.05112878, maxy))
    if minx > maxx or miny > maxy:
        return None
    _, properties = clean_properties(feature.get("properties") or {}, layer, fallback_id)
    return str(properties["atlasId"]), properties, geom, (minx, miny, maxx, maxy)


def encode_tile(layer: str, records: list[dict[str, Any]], bounds: tuple[float, float, float, float]) -> bytes:
    west, south, east, north = bounds
    features = []
    tile_shape = box(west, south, east, north)
    for record in records:
        clipped = polygonal_geometry(record["geometry"].intersection(tile_shape))
        if clipped.is_empty:
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
            "extents": 4096,
            "y_coord_down": True,
            "check_winding_order": True,
            "on_invalid_geometry": make_it_valid,
        },
    )


def build_layer(source_path: Path, layer: str, zoom: int, output_root: Path) -> dict[str, Any]:
    layer_root = output_root / layer
    if layer_root.exists():
        shutil.rmtree(layer_root)
    layer_root.mkdir(parents=True, exist_ok=True)
    tiles: dict[tuple[int, int], list[dict[str, Any]]] = {}
    feature_count = 0
    invalid_count = 0
    with source_path.open("rb") as handle:
        for fallback_id, feature in enumerate(ijson.items(handle, "features.item"), start=1):
            parsed = feature_tiles(feature, layer, zoom, fallback_id)
            if parsed is None:
                invalid_count += 1
                continue
            feature_id, properties, geometry, bounds = parsed
            feature_count += 1
            minx, miny, maxx, maxy = bounds
            min_tile_x = tile_x(minx, zoom)
            max_tile_x = tile_x(maxx, zoom)
            min_tile_y = tile_y(maxy, zoom)
            max_tile_y = tile_y(miny, zoom)
            record = {"id": feature_id, "properties": properties, "geometry": geometry}
            for x in range(min_tile_x, max_tile_x + 1):
                for y in range(min_tile_y, max_tile_y + 1):
                    tiles.setdefault((x, y), []).append(record)
    tile_bytes = 0
    tile_files = []
    for (x, y), records in sorted(tiles.items()):
        payload = encode_tile(layer, records, tile_bounds(x, y, zoom))
        if not payload:
            continue
        tile_path = layer_root / str(zoom) / str(x) / f"{y}.pbf"
        tile_path.parent.mkdir(parents=True, exist_ok=True)
        tile_path.write_bytes(payload)
        tile_bytes += len(payload)
        tile_files.append(f"{zoom}/{x}/{y}.pbf")
    return {
        "tileZoom": zoom,
        "featureCount": feature_count,
        "invalidOrEmptyFeatures": invalid_count,
        "tileCount": len(tile_files),
        "tileBytes": tile_bytes,
        "tiles": tile_files,
        "sourceFile": str(source_path.relative_to(ROOT)),
        "sourceSha256": sha256_file(source_path),
        "sourceUrl": SOURCE_URLS[layer],
    }


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
    layers = {}
    for layer in args.layers:
        source_path = source_dir / f"geoBoundariesCGAZ_{layer.upper()}.geojson"
        if not source_path.exists():
            raise SystemExit(f"Missing source snapshot: {source_path}")
        layers[layer] = build_layer(source_path, layer, configs[layer], output_root)
    manifest = {
        "format": "atlas-global-geoboundaries-mvt-v1",
        "releaseId": args.release_id,
        "generatedAt": "2026-08-23T00:00:00Z",
        "coordinateSystem": "WGS84 longitude/latitude source transformed to XYZ vector tiles at build time",
        "tileTemplate": "/data/world-mvt/{releaseId}/{layer}/{z}/{x}/{y}.pbf",
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
        "layers": layers,
    }
    manifest_text = json.dumps(manifest, separators=(",", ":")) + "\n"
    (output_root / "manifest.json").write_text(manifest_text, encoding="utf-8")
    output_base.mkdir(parents=True, exist_ok=True)
    (output_base / "manifest.json").write_text(manifest_text, encoding="utf-8")
    print(json.dumps({"outputRoot": str(output_root), "releaseId": args.release_id, "layers": {key: {k: value[k] for k in ("tileZoom", "featureCount", "invalidOrEmptyFeatures", "tileCount", "tileBytes")} for key, value in layers.items()}}, indent=2))


if __name__ == "__main__":
    main()
