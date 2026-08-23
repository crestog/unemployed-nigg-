from __future__ import annotations

import argparse
import csv
import json
import shutil
import sqlite3
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import ijson
from shapely import wkb as shapely_wkb

from build_global_geoboundaries_mvt import (
    DEFAULT_LAYER_ZOOMS,
    MVT_EXTENT,
    PROGRESS_FEATURE_INTERVAL,
    SAFE_VECTOR_LATITUDE,
    build_encoded_layer,
    encode_tile,
    load_layer_specs,
    prepare_feature,
    project_geometry,
    sha256_file,
    source_file_label,
    tile_x,
    tile_y,
)

AUDIT_COLUMNS = [
    "layer", "sourceId", "name", "countryCode", "accepted", "inputBbox", "normalizedBbox",
    "maxLongitudeJump", "antimeridianSplitCount", "postSplitMaxComponentLongitudeSpan",
    "polarStatus", "repairStatus", "tileReplicationCount", "rejectedReason",
]


def progress(layer: str, phase: str, started: float, **values: object) -> None:
    elapsed = round(time.monotonic() - started, 1)
    payload = {"layer": layer, "phase": phase, "elapsedSeconds": elapsed, **values}
    print("[AtlasWorldStream] " + json.dumps(payload, separators=(",", ":")), flush=True)


def open_bucket_db(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA journal_mode=OFF")
    connection.execute("PRAGMA synchronous=OFF")
    connection.execute("PRAGMA temp_store=FILE")
    connection.execute("CREATE TABLE records (source_id TEXT PRIMARY KEY, properties TEXT NOT NULL, polygon_wkb BLOB NOT NULL, label_wkb BLOB NOT NULL)")
    connection.execute("CREATE TABLE memberships (kind TEXT NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL, source_id TEXT NOT NULL, PRIMARY KEY (kind, x, y, source_id))")
    return connection


def serializable_audit(row: dict[str, object]) -> dict[str, object]:
    return {key: row.get(key) for key in AUDIT_COLUMNS}


def write_audit_row(json_handle, csv_writer: csv.DictWriter, row: dict[str, object]) -> None:
    clean = serializable_audit(row)
    json_handle.write(json.dumps(clean, separators=(",", ":"), ensure_ascii=False) + "\n")
    csv_writer.writerow({
        key: json.dumps(clean[key], separators=(",", ":"), ensure_ascii=False)
        if isinstance(clean[key], (list, dict)) else clean[key]
        for key in AUDIT_COLUMNS
    })


def stream_source_to_buckets(
    source_path: Path,
    layer: str,
    zoom: int,
    db_path: Path,
    audit_root: Path,
    source_metadata: list[dict[str, object]],
) -> tuple[dict[str, object], dict[str, object]]:
    started = time.monotonic()
    audit_root.mkdir(parents=True, exist_ok=True)
    audit_jsonl = audit_root / f"geometry-audit-{layer}.jsonl"
    audit_csv = audit_root / f"geometry-audit-{layer}.csv"
    connection = open_bucket_db(db_path)
    records_inserted = 0
    source_features = 0
    accepted = 0
    rejected = 0
    reasons: Counter[str] = Counter()
    audit_jsonl_handle = audit_jsonl.open("w", encoding="utf-8")
    audit_csv_handle = audit_csv.open("w", encoding="utf-8", newline="")
    csv_writer = csv.DictWriter(audit_csv_handle, fieldnames=AUDIT_COLUMNS)
    csv_writer.writeheader()
    progress(layer, "read-start", started, source=source_path.name, sourceBytes=source_path.stat().st_size, zoom=zoom)
    try:
        with source_path.open("rb") as handle:
            for fallback_id, feature in enumerate(ijson.items(handle, "features.item"), start=1):
                source_features = fallback_id
                record, audit = prepare_feature(feature, layer, zoom, fallback_id)
                write_audit_row(audit_jsonl_handle, csv_writer, audit)
                if record is None:
                    rejected += 1
                    reasons[str(audit.get("rejectedReason") or "unknown")] += 1
                else:
                    polygon_wgs84 = record["geometry"]
                    label_wgs84 = polygon_wgs84.representative_point()
                    polygon_projected = project_geometry(polygon_wgs84)
                    label_projected = project_geometry(label_wgs84)
                    properties_text = json.dumps(record["properties"], separators=(",", ":"), ensure_ascii=False)
                    connection.execute(
                        "INSERT INTO records(source_id, properties, polygon_wkb, label_wkb) VALUES (?, ?, ?, ?)",
                        (str(record["id"]), properties_text, shapely_wkb.dumps(polygon_projected), shapely_wkb.dumps(label_projected)),
                    )
                    for x, y in record["tileKeys"]:
                        connection.execute("INSERT OR IGNORE INTO memberships(kind, x, y, source_id) VALUES ('polygon', ?, ?, ?)", (x, y, str(record["id"])))
                    label_x = tile_x(float(label_wgs84.x), zoom)
                    label_y = tile_y(float(label_wgs84.y), zoom)
                    connection.execute("INSERT OR IGNORE INTO memberships(kind, x, y, source_id) VALUES ('label', ?, ?, ?)", (label_x, label_y, str(record["id"])))
                    records_inserted += 1
                    accepted += 1
                if source_features % PROGRESS_FEATURE_INTERVAL == 0:
                    connection.commit()
                    progress(layer, "read", started, sourceFeatures=source_features, accepted=accepted, rejected=rejected, rejectedReasons=dict(reasons))
        connection.commit()
    finally:
        audit_jsonl_handle.close()
        audit_csv_handle.close()
    connection.execute("CREATE INDEX idx_memberships_tile ON memberships(kind, x, y)")
    connection.commit()
    polygon_tiles = connection.execute("SELECT COUNT(*) FROM memberships WHERE kind='polygon'").fetchone()[0]
    label_tiles = connection.execute("SELECT COUNT(*) FROM memberships WHERE kind='label'").fetchone()[0]
    connection.close()
    audit_metadata = {
        "json": audit_jsonl.name,
        "csv": audit_csv.name,
        "sourceFeatureCount": source_features,
        "acceptedFeatureCount": accepted,
        "rejectedFeatureCount": rejected,
        "rejectedReasons": dict(sorted(reasons.items())),
    }
    source_metadata_block = {
        "sourceFile": source_file_label(source_path),
        "sourceSha256": sha256_file(source_path),
        "sourceUrl": "https://www.geoboundaries.org/api.html",
        "sourceMetadata": source_metadata,
        "audit": audit_metadata,
    }
    progress(layer, "bucket-complete", started, sourceFeatures=source_features, accepted=accepted, rejected=rejected, polygonMemberships=polygon_tiles, labelMemberships=label_tiles, dbBytes=db_path.stat().st_size)
    return source_metadata_block, audit_metadata


def build_layer_from_buckets(
    db_path: Path,
    output_root: Path,
    layer: str,
    zoom: int,
    invalid_count: int,
    source_metadata_block: dict[str, object],
) -> tuple[dict[str, object], dict[str, object]]:
    started = time.monotonic()
    connection = sqlite3.connect(db_path)
    polygon_dir = output_root / layer
    label_dir = output_root / f"{layer}-labels"
    for directory in (polygon_dir, label_dir):
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir(parents=True, exist_ok=True)
    polygon_tiles: list[str] = []
    label_tiles: list[str] = []
    polygon_bytes = 0
    label_bytes = 0
    tile_rows = list(connection.execute("SELECT kind, x, y FROM memberships GROUP BY kind, x, y ORDER BY kind, x, y"))
    progress(layer, "encode-start", started, candidateTiles=len(tile_rows), zoom=zoom)
    for tile_index, (kind, x, y) in enumerate(tile_rows, start=1):
        rows = connection.execute(
            "SELECT r.source_id, r.properties, r.polygon_wkb, r.label_wkb FROM memberships m JOIN records r ON r.source_id=m.source_id WHERE m.kind=? AND m.x=? AND m.y=? ORDER BY r.source_id",
            (kind, x, y),
        )
        records: list[dict[str, object]] = []
        for source_id, properties_text, polygon_blob, label_blob in rows:
            geometry = shapely_wkb.loads(label_blob if kind == "label" else polygon_blob)
            records.append({"id": source_id, "properties": json.loads(properties_text), "geometry": geometry, "bounds": geometry.bounds})
        label_only = kind == "label"
        payload = encode_tile("labels" if label_only else layer, records, int(x), int(y), zoom, label_only=label_only)
        if payload:
            directory = label_dir if label_only else polygon_dir
            path = directory / str(zoom) / str(x) / f"{y}.pbf"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
            relative = f"{zoom}/{x}/{y}.pbf"
            if label_only:
                label_tiles.append(relative)
                label_bytes += len(payload)
            else:
                polygon_tiles.append(relative)
                polygon_bytes += len(payload)
        if tile_index % 100 == 0 or tile_index == len(tile_rows):
            progress(layer, "encode", started, tiles=f"{tile_index}/{len(tile_rows)}", polygonTiles=len(polygon_tiles), labelTiles=len(label_tiles), polygonBytes=polygon_bytes, labelBytes=label_bytes)
    connection.close()
    polygon_metadata = {
        "tileZoom": zoom, "featureCount": int(source_metadata_block["audit"]["acceptedFeatureCount"]), "invalidOrEmptyFeatures": invalid_count,
        "tileCount": len(polygon_tiles), "tileBytes": polygon_bytes, "tiles": polygon_tiles, "layerDirectory": layer, "mvtSourceLayer": layer,
        **source_metadata_block,
    }
    label_metadata = {
        "tileZoom": zoom, "featureCount": int(source_metadata_block["audit"]["acceptedFeatureCount"]), "invalidOrEmptyFeatures": invalid_count,
        "tileCount": len(label_tiles), "tileBytes": label_bytes, "tiles": label_tiles, "layerDirectory": f"{layer}-labels", "mvtSourceLayer": "labels", "labelOnly": True,
        **source_metadata_block,
    }
    progress(layer, "encode-complete", started, polygonTiles=len(polygon_tiles), labelTiles=len(label_tiles), polygonBytes=polygon_bytes, labelBytes=label_bytes)
    return polygon_metadata, label_metadata


def merge_manifest(base_release: Path, output_root: Path, release_id: str, deep_results: list[tuple[str, dict[str, object], dict[str, object], dict[str, object]]]) -> dict[str, object]:
    manifest = json.loads((output_root / "manifest.json").read_text(encoding="utf-8"))
    manifest["releaseId"] = release_id
    manifest["generatedAt"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    manifest.setdefault("coveragePolicy", {}).setdefault("deepLevels", {})
    manifest.setdefault("geometryAudits", {})
    for layer, polygon, labels, audit in deep_results:
        manifest["layers"][layer] = polygon
        manifest["layers"][f"{layer}Labels"] = labels
        manifest["coveragePolicy"]["deepLevels"][layer] = {
            "tileZoom": polygon["tileZoom"],
            "sourceFile": polygon["sourceFile"],
            "sourceMetadataRecords": len(polygon.get("sourceMetadata") or []),
            "requestedFeatureCount": next((row.get("featureCount") for row in (polygon.get("sourceMetadata") or []) if isinstance(row, dict) and row.get("featureCount") is not None), None),
        }
        manifest["geometryAudits"][layer] = audit
    (output_root / "manifest.json").write_text(json.dumps(manifest, separators=(",", ":")) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Build deep world MVT layers with bounded memory and disk-backed tile buckets.")
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--layer-spec", type=Path, required=True)
    parser.add_argument("--base-release", type=Path, required=True)
    parser.add_argument("--output-base", type=Path, required=True)
    parser.add_argument("--release-id", required=True)
    parser.add_argument("--audit-root", type=Path, required=True)
    parser.add_argument("--work-root", type=Path, required=True)
    parser.add_argument("--layers", nargs="+", default=("adm3", "adm4", "adm5"))
    args = parser.parse_args()
    source_dir = args.source_dir.resolve()
    base_release = args.base_release.resolve()
    output_base = args.output_base.resolve()
    output_root = output_base / args.release_id
    if output_root.exists():
        shutil.rmtree(output_root)
    output_base.mkdir(parents=True, exist_ok=True)
    shutil.copytree(base_release, output_root)
    specs = {item["layer"]: item for item in load_layer_specs(args.layer_spec.resolve(), source_dir)}
    deep_results: list[tuple[str, dict[str, object], dict[str, object], dict[str, object]]] = []
    print(f"[AtlasWorldStream] build-start release={args.release_id} layers={','.join(args.layers)} memoryMode=disk-bucket-sequential extent={MVT_EXTENT} safeLatitude={SAFE_VECTOR_LATITUDE}", flush=True)
    for layer_name in args.layers:
        layer = str(layer_name).lower()
        if layer not in {"adm3", "adm4", "adm5"}:
            raise SystemExit(f"Only deep layers adm3/adm4/adm5 are supported: {layer}")
        spec = specs.get(layer)
        if not spec:
            raise SystemExit(f"Missing layer specification for {layer}")
        source_path = Path(spec["sourceFile"])
        if not source_path.is_absolute():
            source_path = source_dir / source_path
        if not source_path.exists():
            raise SystemExit(f"Missing deep source file: {source_path}")
        layer_work = args.work_root.resolve() / args.release_id / layer
        if layer_work.exists():
            shutil.rmtree(layer_work)
        layer_work.mkdir(parents=True, exist_ok=True)
        db_path = layer_work / "tile-buckets.sqlite"
        source_block, audit = stream_source_to_buckets(source_path, layer, int(spec["tileZoom"]), db_path, args.audit_root.resolve() / args.release_id, spec.get("sourceMetadata") or [])
        polygon, labels = build_layer_from_buckets(db_path, output_root, layer, int(spec["tileZoom"]), int(audit["rejectedFeatureCount"]), source_block)
        deep_results.append((layer, polygon, labels, audit))
        connection = sqlite3.connect(db_path)
        connection.close()
        db_path.unlink(missing_ok=True)
        shutil.rmtree(layer_work, ignore_errors=True)
        print(f"[AtlasWorldStream] layer-complete layer={layer} accepted={audit['acceptedFeatureCount']} rejected={audit['rejectedFeatureCount']} polygonTiles={polygon['tileCount']} labelTiles={labels['tileCount']}", flush=True)
    manifest = merge_manifest(base_release, output_root, args.release_id, deep_results)
    (output_base / "manifest.json").write_text(json.dumps(manifest, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"[AtlasWorldStream] build-complete release={args.release_id} manifest={output_root / 'manifest.json'}", flush=True)


if __name__ == "__main__":
    main()
