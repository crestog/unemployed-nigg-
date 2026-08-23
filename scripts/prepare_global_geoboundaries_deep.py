#!/usr/bin/env python3
"""Prepare country-specific geoBoundaries ADM3-ADM5 inputs for the Kaggle builder.

This script intentionally runs in Kaggle, not in the browser or local build. It
uses the geoBoundaries API metadata to download only available gbOpen country
files, rewrites stable namespaced IDs and explicit ISO country codes, streams
features into one file per level, and writes source hashes/provenance metadata.
"""
from __future__ import annotations

import argparse
import hashlib
from decimal import Decimal
import json
import os
import shutil
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import ijson

API_TEMPLATE = "https://www.geoboundaries.org/api/current/gbOpen/ALL/{level}/"
LEVELS = {"adm3": ("ADM3", 9), "adm4": ("ADM4", 11), "adm5": ("ADM5", 13)}
SOURCE_PAGE = "https://www.geoboundaries.org/api.html"


def log(message: str) -> None:
    print(f"[AtlasWorldDeep] {message}", flush=True)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fetch_json(url: str) -> Any:
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "AtlasWorld-Kaggle/1.0"})
    last_error: Exception | None = None
    for attempt in range(1, 6):
        try:
            log(f"metadata-fetch-start url={url} attempt={attempt}/5")
            with urlopen(request, timeout=300) as response:
                payload = json.load(response)
            log(f"metadata-fetch-complete url={url} attempt={attempt}")
            return payload
        except (TimeoutError, HTTPError, URLError, OSError, json.JSONDecodeError) as exc:
            last_error = exc
            log(f"metadata-fetch-retry url={url} attempt={attempt}/5 error={type(exc).__name__}:{exc}")
            if attempt < 5:
                time.sleep(min(30, attempt * 5))
    raise RuntimeError(f"metadata-fetch-failed after 5 attempts url={url} error={last_error}")


def download(url: str, destination: Path) -> None:
    request = Request(url, headers={"Accept": "application/geo+json,application/json", "User-Agent": "AtlasWorld-Kaggle/1.0"})
    temporary = destination.with_suffix(destination.suffix + ".part")
    with urlopen(request, timeout=300) as response, temporary.open("wb") as handle:
        shutil.copyfileobj(response, handle, length=1024 * 1024)
    temporary.replace(destination)


def prepare_level(level_key: str, raw_dir: Path, download_dir: Path, workers: int, allow_partial: bool) -> dict[str, Any]:
    api_level, tile_zoom = LEVELS[level_key]
    try:
        metadata = fetch_json(API_TEMPLATE.format(level=api_level))
    except Exception as exc:
        if not allow_partial:
            raise
        log(f"level={level_key} metadata-unavailable allowPartial=true error={type(exc).__name__}:{exc}")
        metadata = []
    if not isinstance(metadata, list):
        if not allow_partial:
            raise RuntimeError(f"Unexpected metadata response for {api_level}")
        log(f"level={level_key} metadata-invalid allowPartial=true")
        metadata = []
    candidates = sorted(
        [item for item in metadata if item.get("boundaryISO") and item.get("gjDownloadURL")],
        key=lambda item: (str(item.get("boundaryISO")), str(item.get("boundaryID"))),
    )
    selected: dict[str, dict[str, Any]] = {}
    for item in candidates:
        selected.setdefault(str(item["boundaryISO"]).upper(), item)
    metadata = list(selected.values())
    level_dir = download_dir / level_key
    level_dir.mkdir(parents=True, exist_ok=True)
    log(f"level={level_key} metadataCountries={len(metadata)} downloadWorkers={workers}")
    download_results: dict[str, dict[str, Any]] = {}
    download_failures: list[dict[str, Any]] = []

    def fetch_one(item: dict[str, Any]) -> tuple[str, Path, dict[str, Any]]:
        iso = str(item["boundaryISO"]).upper()
        path = level_dir / f"{iso}.geojson"
        for attempt in range(1, 4):
            try:
                if not path.exists() or path.stat().st_size == 0:
                    download(str(item["gjDownloadURL"]), path)
                return iso, path, item
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(attempt * 2)
        raise AssertionError("unreachable")

    with ThreadPoolExecutor(max_workers=max(1, min(workers, 8))) as executor:
        futures = [executor.submit(fetch_one, item) for item in metadata]
        for index, future in enumerate(as_completed(futures), start=1):
            try:
                iso, path, item = future.result()
                download_results[iso] = {"path": path, "metadata": item}
                log(f"downloaded level={level_key} country={iso} progress={index}/{len(metadata)} bytes={path.stat().st_size}")
            except Exception as exc:
                if not allow_partial:
                    raise
                download_failures.append({"error": f"{type(exc).__name__}:{exc}"})
                log(f"download-failed level={level_key} progress={index}/{len(metadata)} allowPartial=true error={type(exc).__name__}:{exc}")

    merged_path = raw_dir / f"geoBoundariesGlobal_{api_level}.geojson"
    source_rows: list[dict[str, Any]] = []
    feature_count = 0
    with merged_path.open("w", encoding="utf-8") as output:
        output.write('{"type":"FeatureCollection","features":[')
        first = True
        for iso in sorted(download_results):
            item = download_results[iso]["metadata"]
            path = download_results[iso]["path"]
            source_hash = sha256_file(path)
            country_features = 0
            with path.open("rb") as handle:
                for source_index, feature in enumerate(ijson.items(handle, "features.item"), start=1):
                    properties = dict(feature.get("properties") or {})
                    original_id = str(
                        properties.get("shapeID")
                        or properties.get("shapeId")
                        or properties.get("boundaryID")
                        or source_index
                    )
                    properties["shapeID"] = f"{iso}-{api_level}-{original_id}"
                    properties["sourceBoundaryId"] = original_id
                    properties["shapeName"] = str(
                        properties.get("shapeName")
                        or properties.get("shape_name")
                        or properties.get("name")
                        or f"{item.get('boundaryName', iso)} unit {source_index}"
                    )
                    properties["countryCode"] = iso
                    properties["shapeGroup"] = iso
                    properties["shapeISO"] = iso
                    properties["adminLevel"] = int(api_level[-1])
                    properties["boundaryYearRepresented"] = item.get("boundaryYearRepresented")
                    rewritten = {"type": "Feature", "properties": properties, "geometry": feature.get("geometry")}
                    if not first:
                        output.write(",")
                    json.dump(
                        rewritten,
                        output,
                        separators=(",", ":"),
                        ensure_ascii=False,
                        default=lambda value: float(value) if isinstance(value, Decimal) else str(value),
                    )
                    first = False
                    country_features += 1
                    feature_count += 1
            source_rows.append({
                "countryCode": iso,
                "countryName": item.get("boundaryName"),
                "boundaryId": item.get("boundaryID"),
                "boundaryType": api_level,
                "boundaryYearRepresented": item.get("boundaryYearRepresented"),
                "sourceUrl": item.get("gjDownloadURL"),
                "sourceLicense": item.get("boundaryLicense"),
                "licenseSource": item.get("licenseSource"),
                "sourceHash": source_hash,
                "sourceBytes": path.stat().st_size,
                "featureCount": country_features,
            })
            log(f"merged level={level_key} country={iso} features={country_features}")
        output.write(']}\n')

    spec = {
        "format": "atlas-global-geoboundaries-layer-spec-v1",
        "api": API_TEMPLATE.format(level=api_level),
        "retrievedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "layer": level_key,
        "tileZoom": tile_zoom,
        "sourceFile": merged_path.name,
        "sourceUrl": SOURCE_PAGE,
        "sourceRows": source_rows,
        "featureCount": feature_count,
        "downloadFailures": download_failures,
        "allowPartial": allow_partial,
    }
    (raw_dir / f"deep-{level_key}-sources.json").write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
    return spec


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", type=Path, required=True)
    parser.add_argument("--download-dir", type=Path, required=True)
    parser.add_argument("--spec-output", type=Path, required=True)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--allow-partial", action="store_true", help="Keep successful countries and record metadata/download failures instead of aborting")
    args = parser.parse_args()
    args.raw_dir.mkdir(parents=True, exist_ok=True)
    args.download_dir.mkdir(parents=True, exist_ok=True)
    specs = []
    for level_key in LEVELS:
        spec = prepare_level(level_key, args.raw_dir, args.download_dir, args.workers, args.allow_partial)
        if spec.get("featureCount", 0) > 0:
            specs.append(spec)
        else:
            log(f"level={level_key} skipped-no-features allowPartial={args.allow_partial}")
    payload = {
        "format": "atlas-global-geoboundaries-layer-spec-v1",
        "sourcePage": SOURCE_PAGE,
        "levels": specs,
        "partial": args.allow_partial,
        "skippedLevels": [level for level in LEVELS if level not in {spec["layer"] for spec in specs}],
    }
    args.spec_output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    log(f"complete levels={','.join(item['layer'] for item in specs)} totalFeatures={sum(item['featureCount'] for item in specs)} spec={args.spec_output}")


if __name__ == "__main__":
    main()
