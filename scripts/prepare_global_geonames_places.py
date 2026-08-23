#!/usr/bin/env python3
"""Prepare an official GeoNames cities500 archive for static global point tiles."""
from __future__ import annotations

import argparse
import hashlib
import json
import time
import zipfile
from pathlib import Path

SOURCE_URL = "https://download.geonames.org/export/dump/cities500.zip"
TERMS_URL = "https://www.geonames.org/export/"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def log(message: str) -> None:
    print(f"[AtlasWorldPlaces] {message}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--metadata", type=Path, required=True)
    args = parser.parse_args()
    source_hash = sha256_file(args.zip)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    by_country: dict[str, int] = {}
    with zipfile.ZipFile(args.zip) as archive:
        names = [name for name in archive.namelist() if name.lower().endswith(".txt")]
        if not names:
            raise RuntimeError("GeoNames cities500 archive contains no text extract")
        source_name = names[0]
        log(f"source={source_name} bytes={args.zip.stat().st_size} sha256={source_hash}")
        with archive.open(source_name) as raw, args.output.open("w", encoding="utf-8") as output:
            output.write('{"type":"FeatureCollection","features":[\n')
            first = True
            for line_number, raw_line in enumerate(raw, start=1):
                columns = raw_line.decode("utf-8").rstrip("\n").split("\t")
                if len(columns) < 19:
                    continue
                feature_class = columns[6]
                if feature_class != "P":
                    continue
                try:
                    geoname_id = int(columns[0])
                    name = columns[1]
                    ascii_name = columns[2] or name
                    latitude = float(columns[4])
                    longitude = float(columns[5])
                    population = int(columns[14] or 0)
                except (TypeError, ValueError):
                    continue
                if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                    continue
                country = columns[8]
                item = {
                    "type": "Feature",
                    "properties": {
                        "geonameId": geoname_id,
                        "shapeID": f"geonames-{geoname_id}",
                        "shapeName": name,
                        "asciiName": ascii_name,
                        "countryCode": country,
                        "featureClass": feature_class,
                        "featureCode": columns[7],
                        "admin1Code": columns[10] or None,
                        "admin2Code": columns[11] or None,
                        "admin3Code": columns[12] or None,
                        "admin4Code": columns[13] or None,
                        "population": population,
                        "modificationDate": columns[18] or None,
                    },
                    "geometry": {"type": "Point", "coordinates": [longitude, latitude]},
                }
                if not first:
                    output.write(",\n")
                json.dump(item, output, separators=(",", ":"), ensure_ascii=False)
                first = False
                count += 1
                by_country[country] = by_country.get(country, 0) + 1
                if count % 25000 == 0:
                    log(f"features={count} countries={len(by_country)} inputLine={line_number}")
            output.write('\n]}\n')
    metadata = {
        "sourceUrl": SOURCE_URL,
        "termsUrl": TERMS_URL,
        "license": "Creative Commons Attribution 4.0; credit GeoNames",
        "extract": "GeoNames cities500: populated places with population > 500 or administrative seats down to PPLA4, per official readme",
        "sourceFile": args.zip.name,
        "sourceSha256": source_hash,
        "sourceBytes": args.zip.stat().st_size,
        "featureCount": count,
        "countryCount": len(by_country),
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "countryFeatureCounts": dict(sorted(by_country.items())),
    }
    args.metadata.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    log(f"complete features={count} countries={len(by_country)} output={args.output} metadata={args.metadata}")


if __name__ == "__main__":
    main()
