"""Automated Kaggle -> GitHub build for Atlas World static geography.

The only manual prerequisite is a fine-grained GitHub token stored in Kaggle
Secrets as GITHUB_TOKEN. The wrapper then clones the latest main branch,
installs build-only dependencies, downloads official GeoBoundaries snapshots,
runs the auditable builder, validates the generated MVT release and its
geometry audits, archives it, and pushes the static assets. GitHub Actions
handles the existing Cloudflare deployment.

Raw source snapshots are deleted in the finally block and are never staged.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SOURCE_URLS = {
    "adm1": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM1.geojson",
    "adm2": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM2.geojson",
}
DEFAULT_REPO_URL = "https://github.com/crestog/unemployed-nigg-.git"
DEFAULT_REPO = Path("/kaggle/working/atlas-repo")
DEFAULT_RELEASE = f"world-global-geoboundaries-kaggle-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
REQUIRED_LAYERS = ("adm1", "adm1Labels", "adm2", "adm2Labels")
ALLOWED_REJECTION_REASONS = {
    "outside_safe_vector_latitude",
    "missing_geometry",
    "empty_or_nonfinite_geometry",
    "empty_or_nonfinite_normalized_geometry",
    "no_polygonal_components",
}
HARD_REJECTION_MARKERS = (
    "world_spanning",
    "excessive_tile_replication",
    "geometry_error",
    "invalid_after_repair",
    "projected_latitude_outside_safe_vector_latitude",
)


def run(command: list[str], cwd: Path | None = None, env: dict[str, str] | None = None) -> None:
    print("$", " ".join(command), flush=True)
    subprocess.run(command, cwd=cwd, env=env, check=True)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {url} -> {target}", flush=True)
    with urllib.request.urlopen(url) as response, target.open("wb") as handle:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            handle.write(chunk)
    print(f"  sha256={sha256_file(target)} bytes={target.stat().st_size}", flush=True)


def kaggle_secret(name: str) -> str | None:
    value = os.environ.get(name)
    if value:
        return value
    try:
        from kaggle_secrets import UserSecretsClient

        return UserSecretsClient().get_secret(name)
    except Exception:
        return None


def authenticated_git_env(token: str) -> dict[str, str]:
    encoded = base64.b64encode(f"x-access-token:{token}".encode()).decode()
    env = os.environ.copy()
    env.update({
        "GIT_CONFIG_COUNT": "1",
        "GIT_CONFIG_KEY_0": "http.extraheader",
        "GIT_CONFIG_VALUE_0": f"AUTHORIZATION: basic {encoded}",
    })
    return env


def ensure_repo(repo: Path, repo_url: str, branch: str) -> None:
    if (repo / ".git").is_dir():
        run(["git", "fetch", "origin", branch], cwd=repo)
        run(["git", "checkout", branch], cwd=repo)
        run(["git", "reset", "--hard", f"origin/{branch}"], cwd=repo)
        run(["git", "clean", "-fd", "data/raw/world/geoboundaries", "client/public/data/world-mvt"], cwd=repo)
        return
    if repo.exists() and any(repo.iterdir()):
        raise SystemExit(f"Refusing to overwrite non-empty directory: {repo}")
    repo.parent.mkdir(parents=True, exist_ok=True)
    run(["git", "clone", "--depth", "1", "--branch", branch, repo_url, str(repo)])


def validate_audits(release_dir: Path) -> dict[str, Any]:
    manifest = json.loads((release_dir / "manifest.json").read_text(encoding="utf-8"))
    failures: list[dict[str, Any]] = []
    summary: dict[str, Any] = {}
    for layer in ("adm1", "adm2"):
        audit_meta = manifest.get("geometryAudits", {}).get(layer)
        if not audit_meta:
            failures.append({"layer": layer, "reason": "missing_geometry_audit_metadata"})
            continue
        audit_path = release_dir / audit_meta["json"]
        rows = json.loads(audit_path.read_text(encoding="utf-8"))
        disallowed = [
            {
                "layer": row.get("layer"),
                "sourceId": row.get("sourceId"),
                "name": row.get("name"),
                "reason": row.get("rejectedReason"),
            }
            for row in rows
            if row.get("rejectedReason")
            and row.get("rejectedReason") not in ALLOWED_REJECTION_REASONS
        ]
        if disallowed:
            failures.extend(disallowed[:20])
        accepted_crossings = [
            row for row in rows
            if row.get("accepted") and (row.get("antimeridianSplitCount") or 0) > 0
        ]
        bad_crossings = [
            row for row in accepted_crossings
            if (row.get("postSplitMaxComponentLongitudeSpan") or 0) > 180.000001
        ]
        if bad_crossings:
            failures.extend({
                "layer": row.get("layer"),
                "sourceId": row.get("sourceId"),
                "name": row.get("name"),
                "reason": "accepted_dateline_component_still_spans_over_180_degrees",
            } for row in bad_crossings[:20])
        summary[layer] = {
            "sourceFeatureCount": len(rows),
            "acceptedFeatureCount": sum(1 for row in rows if row.get("accepted")),
            "rejectedFeatureCount": sum(1 for row in rows if not row.get("accepted")),
            "polarRejectedCount": sum(1 for row in rows if row.get("rejectedReason") == "outside_safe_vector_latitude"),
            "antimeridianAcceptedCount": len(accepted_crossings),
            "disallowedFailureCount": len(disallowed),
        }
    if failures:
        failure_path = release_dir / "geometry-audit-failures.json"
        failure_path.write_text(json.dumps(failures, indent=2) + "\n", encoding="utf-8")
        raise SystemExit(f"Geometry audit failed with {len(failures)} disallowed violations; see {failure_path}")
    (release_dir / "geometry-audit-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"geometryAudit": summary}, indent=2), flush=True)
    return summary


def validate_release(release_dir: Path) -> dict[str, Any]:
    from mapbox_vector_tile import decode

    manifest_path = release_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    missing = [layer for layer in REQUIRED_LAYERS if layer not in manifest.get("layers", {})]
    if missing:
        raise SystemExit(f"Generated release is missing required layers: {missing}")
    for key in REQUIRED_LAYERS:
        metadata = manifest["layers"][key]
        if metadata["featureCount"] <= 0 or metadata["tileCount"] <= 0:
            raise SystemExit(f"Generated layer is empty: {key}")
        tile = release_dir / metadata["layerDirectory"] / metadata["tiles"][0]
        payload = tile.read_bytes()
        if not payload:
            raise SystemExit(f"Representative tile is empty: {key} {tile}")
        decoded = decode(payload)
        source_layer = metadata["mvtSourceLayer"]
        if source_layer not in decoded or not decoded[source_layer].get("features"):
            raise SystemExit(f"Representative tile failed validation: {key} {tile}")
        if metadata.get("labelOnly"):
            if any(feature.get("geometry", {}).get("type") != "Point" for feature in decoded[source_layer]["features"]):
                raise SystemExit(f"Label layer contains non-point geometry: {key} {tile}")
    if "Web Mercator" not in manifest.get("coordinateSystem", ""):
        raise SystemExit("Manifest does not identify the projected Web Mercator build")
    if manifest.get("geometryPolicy", {}).get("safeVectorLatitude") != 80.0:
        raise SystemExit("Unexpected safe vector latitude; review the runtime policy before publishing")
    validate_audits(release_dir)
    return manifest


def remove_stale_releases(mvt_root: Path, release_id: str) -> None:
    for child in mvt_root.iterdir():
        if child.is_dir() and child.name.startswith("world-global-geoboundaries-") and child.name != release_id:
            print(f"Removing stale release {child.name}", flush=True)
            shutil.rmtree(child)


def archive_release(mvt_root: Path, release_dir: Path, archive: Path) -> None:
    archive.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive, "w:gz") as tar:
        tar.add(mvt_root / "manifest.json", arcname="world-mvt/manifest.json")
        tar.add(release_dir, arcname=f"world-mvt/{release_dir.name}")
    print(f"Archive written: {archive} bytes={archive.stat().st_size}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-dir", type=Path, default=DEFAULT_REPO)
    parser.add_argument("--repo-url", default=DEFAULT_REPO_URL)
    parser.add_argument("--branch", default="main")
    parser.add_argument("--release-id", default=DEFAULT_RELEASE)
    parser.add_argument("--skip-install", action="store_true")
    parser.add_argument("--no-push", action="store_true", help="Build and validate without requiring GITHUB_TOKEN")
    parser.add_argument("--archive", type=Path, default=None)
    args = parser.parse_args()

    repo = args.repo_dir.resolve()
    ensure_repo(repo, args.repo_url, args.branch)
    builder = repo / "scripts" / "build_global_geoboundaries_mvt.py"
    if not builder.exists():
        raise SystemExit(f"Missing repository builder: {builder}")

    if not args.skip_install:
        run([
            sys.executable, "-m", "pip", "install", "--quiet",
            "ijson", "shapely", "antimeridian", "mapbox-vector-tile", "pyclipper", "protobuf",
        ])

    source_dir = repo / "data" / "raw" / "world" / "geoboundaries"
    try:
        for layer, url in SOURCE_URLS.items():
            download(url, source_dir / f"geoBoundariesCGAZ_{layer.upper()}.geojson")

        run([
            sys.executable,
            str(builder),
            "--source-dir",
            str(source_dir),
            "--release-id",
            args.release_id,
        ], cwd=repo)

        mvt_root = repo / "client" / "public" / "data" / "world-mvt"
        release_dir = mvt_root / args.release_id
        manifest = validate_release(release_dir)
        remove_stale_releases(mvt_root, args.release_id)
        print(json.dumps({
            "releaseId": manifest["releaseId"],
            "coordinateSystem": manifest["coordinateSystem"],
            "geometryPolicy": manifest["geometryPolicy"],
            "layers": {layer: {
                "featureCount": manifest["layers"][layer]["featureCount"],
                "tileCount": manifest["layers"][layer]["tileCount"],
                "tileBytes": manifest["layers"][layer]["tileBytes"],
            } for layer in REQUIRED_LAYERS},
        }, indent=2), flush=True)

        archive = args.archive or (Path("/kaggle/working") / f"atlas-world-{args.release_id}.tar.gz")
        archive_release(mvt_root, release_dir, archive)

        if args.no_push:
            print("--no-push set; generated assets were not pushed.", flush=True)
        else:
            token = kaggle_secret("GITHUB_TOKEN")
            if not token:
                raise SystemExit("Missing Kaggle Secret GITHUB_TOKEN. Add a fine-grained token with Contents read/write for this repository, then rerun.")
            run(["git", "add", "client/public/data/world-mvt"], cwd=repo)
            run(["git", "diff", "--cached", "--check"], cwd=repo)
            status = subprocess.run(["git", "status", "--porcelain"], cwd=repo, text=True, capture_output=True, check=True).stdout.strip()
            if status:
                run(["git", "config", "user.name", "Atlas Kaggle Builder"], cwd=repo)
                run(["git", "config", "user.email", "atlas-kaggle-builder@users.noreply.github.com"], cwd=repo)
                run(["git", "commit", "-m", f"Publish global map release {args.release_id}"], cwd=repo)
                run(["git", "push", "origin", args.branch], cwd=repo, env=authenticated_git_env(token))
                print(f"Pushed {args.release_id}; GitHub Actions should now deploy Cloudflare.", flush=True)
            else:
                print("No generated asset changes to commit.", flush=True)
    finally:
        shutil.rmtree(source_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
