from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import time
from collections import Counter
from pathlib import Path

import ijson
from shapely import wkb as shapely_wkb
from shapely.geometry import Point, shape

from build_global_geoboundaries_mvt import (
    PROGRESS_FEATURE_INTERVAL,
    encode_tile,
    project_geometry,
    tile_x,
    tile_y,
)


def progress(phase: str, started: float, **values: object) -> None:
    print("[AtlasPlacesStream] " + json.dumps({"phase": phase, "elapsedSeconds": round(time.monotonic() - started, 1), **values}, separators=(",", ":")), flush=True)


def open_db(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA journal_mode=OFF")
    connection.execute("PRAGMA synchronous=OFF")
    connection.execute("PRAGMA temp_store=FILE")
    connection.execute("CREATE TABLE records (source_id TEXT PRIMARY KEY, properties TEXT NOT NULL, point_wkb BLOB NOT NULL)")
    connection.execute("CREATE TABLE memberships (x INTEGER NOT NULL, y INTEGER NOT NULL, source_id TEXT NOT NULL, PRIMARY KEY (x, y, source_id))")
    return connection


def stream_points(source: Path, db_path: Path, audit_path: Path, zoom: int, metadata: dict[str, object]) -> dict[str, object]:
    started = time.monotonic()
    connection = open_db(db_path)
    audit_reasons: Counter[str] = Counter()
    source_features = accepted = rejected = 0
    audit_path.parent.mkdir(parents=True, exist_ok=True)
    progress("read-start", started, source=source.name, sourceBytes=source.stat().st_size, zoom=zoom)
    with source.open("rb") as handle:
        for fallback_id, feature in enumerate(ijson.items(handle, "features.item"), start=1):
            source_features = fallback_id
            properties = feature.get("properties") or {}
            source_id = str(properties.get("geonameId") or properties.get("shapeID") or f"places-{fallback_id}")
            reason: str | None = None
            try:
                geometry = shape(feature.get("geometry") or {})
                if not isinstance(geometry, Point) or geometry.is_empty:
                    raise ValueError("not_a_point")
                longitude, latitude = float(geometry.x), float(geometry.y)
                if abs(latitude) > 80.0:
                    raise ValueError("outside_safe_vector_latitude")
                projected = project_geometry(Point(longitude, latitude))
                output_properties = {
                    "atlasId": source_id,
                    "name": str(properties.get("name") or properties.get("asciiName") or "Unnamed place"),
                    "label": True,
                    "selected": False,
                    "sourceLayer": "places",
                    "countryCode": str(properties.get("countryCode") or ""),
                    "featureClass": str(properties.get("featureClass") or "P"),
                    "featureCode": str(properties.get("featureCode") or ""),
                    "population": int(properties.get("population") or 0),
                    "admin1Code": str(properties.get("admin1Code") or ""),
                    "admin2Code": str(properties.get("admin2Code") or ""),
                }
                connection.execute("INSERT OR REPLACE INTO records(source_id, properties, point_wkb) VALUES (?, ?, ?)", (source_id, json.dumps(output_properties, separators=(",", ":"), ensure_ascii=False), shapely_wkb.dumps(projected)))
                connection.execute("INSERT OR IGNORE INTO memberships(x, y, source_id) VALUES (?, ?, ?)", (tile_x(longitude, zoom), tile_y(latitude, zoom), source_id))
                accepted += 1
            except Exception as exc:
                reason = str(exc) if isinstance(exc, ValueError) else f"geometry_error:{type(exc).__name__}"
                rejected += 1
                audit_reasons[reason] += 1
            if fallback_id % PROGRESS_FEATURE_INTERVAL == 0:
                connection.commit()
                progress("read", started, sourceFeatures=source_features, accepted=accepted, rejected=rejected, rejectedReasons=dict(audit_reasons))
    connection.commit()
    connection.execute("CREATE INDEX idx_memberships_tile ON memberships(x, y)")
    connection.commit()
    tile_count = connection.execute("SELECT COUNT(*) FROM (SELECT x, y FROM memberships GROUP BY x, y)").fetchone()[0]
    connection.close()
    audit = {
        "json": audit_path.name,
        "sourceFeatureCount": source_features,
        "acceptedFeatureCount": accepted,
        "rejectedFeatureCount": rejected,
        "rejectedReasons": dict(sorted(audit_reasons.items())),
    }
    audit_path.write_text(json.dumps({"layer": "places", **audit}, indent=2) + "\n", encoding="utf-8")
    progress("bucket-complete", started, sourceFeatures=source_features, accepted=accepted, rejected=rejected, candidateTiles=tile_count, dbBytes=db_path.stat().st_size)
    return {"audit": audit, "sourceMetadata": [metadata], "sourceFile": metadata.get("sourceFile", source.name), "sourceSha256": metadata.get("sourceSha256", ""), "sourceUrl": metadata.get("sourceUrl", "https://download.geonames.org/export/dump/cities500.zip")}


def encode_points(db_path: Path, output_dir: Path, zoom: int, feature_count: int, source_block: dict[str, object]) -> dict[str, object]:
    started = time.monotonic()
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    tile_rows = list(connection.execute("SELECT x, y FROM memberships GROUP BY x, y ORDER BY x, y"))
    tile_files: list[str] = []
    tile_bytes = 0
    progress("encode-start", started, candidateTiles=len(tile_rows), zoom=zoom)
    for index, (x, y) in enumerate(tile_rows, start=1):
        records = []
        for source_id, properties_text, point_blob in connection.execute("SELECT r.source_id, r.properties, r.point_wkb FROM memberships m JOIN records r ON r.source_id=m.source_id WHERE m.x=? AND m.y=? ORDER BY r.source_id", (x, y)):
            point = shapely_wkb.loads(point_blob)
            records.append({"id": source_id, "properties": json.loads(properties_text), "geometry": point, "bounds": point.bounds})
        payload = encode_tile("labels", records, int(x), int(y), zoom, label_only=True)
        if payload:
            path = output_dir / str(zoom) / str(x) / f"{y}.pbf"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
            tile_files.append(f"{zoom}/{x}/{y}.pbf")
            tile_bytes += len(payload)
        if index % 500 == 0 or index == len(tile_rows):
            progress("encode", started, tiles=f"{index}/{len(tile_rows)}", written=len(tile_files), tileBytes=tile_bytes)
    connection.close()
    progress("encode-complete", started, tiles=len(tile_files), tileBytes=tile_bytes)
    return {
        "tileZoom": zoom,
        "featureCount": feature_count,
        "invalidOrEmptyFeatures": int(source_block["audit"]["rejectedFeatureCount"]),
        "tileCount": len(tile_files),
        "tileBytes": tile_bytes,
        "tiles": tile_files,
        "layerDirectory": "places-labels",
        "mvtSourceLayer": "labels",
        "labelOnly": True,
        **source_block,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build GeoNames cities500 point labels with bounded memory.")
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--metadata", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--work-db", type=Path, required=True)
    parser.add_argument("--audit", type=Path, required=True)
    parser.add_argument("--zoom", type=int, default=8)
    args = parser.parse_args()
    metadata = json.loads(args.metadata.read_text(encoding="utf-8"))
    source_block = stream_points(args.source.resolve(), args.work_db.resolve(), args.audit.resolve(), args.zoom, metadata)
    layer = encode_points(args.work_db.resolve(), args.output_dir.resolve(), args.zoom, int(source_block["audit"]["acceptedFeatureCount"]), source_block)
    args.work_db.unlink(missing_ok=True)
    manifest_path = args.output_dir.parent / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["layers"]["placesLabels"] = layer
    manifest.setdefault("geometryAudits", {})["places"] = source_block["audit"]
    manifest["coveragePolicy"]["places"] = "GeoNames cities500 populated-place reference points; source is CC BY and is not a complete locality census."
    manifest_path.write_text(json.dumps(manifest, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"[AtlasPlacesStream] build-complete manifest={manifest_path}", flush=True)


if __name__ == "__main__":
    main()
