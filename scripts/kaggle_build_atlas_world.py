"""Automated Kaggle -> GitHub build for Atlas World static geography.

The only interactive setup is storing a write-scoped GitHub token in Kaggle
Secrets under the name GITHUB_TOKEN. After that, one notebook cell can:

1. clone/update the public Atlas repository;
2. install build-only Python dependencies;
3. download official GeoBoundaries CGAZ ADM1/ADM2 snapshots;
4. build projected polygon tiles plus one-point-per-feature label tiles;
5. validate the generated manifest and representative PBF payloads;
6. remove stale immutable releases, commit, and push the new release; and
7. leave GitHub Actions to deploy the static files to Cloudflare.

Kaggle is used only for preprocessing. The website runtime does not call Kaggle
or depend on Python. Raw source snapshots are deleted after the build and are
never staged because data/raw/ is ignored by the repository.
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
from pathlib import Path
from typing import Any

SOURCE_URLS = {
    "adm1": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM1.geojson",
    "adm2": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM2.geojson",
}
DEFAULT_REPO_URL = "https://github.com/crestog/unemployed-nigg-.git"
DEFAULT_REPO = Path("/kaggle/working/atlas-repo")
DEFAULT_RELEASE = "world-global-geoboundaries-20260823-point-labels"
REQUIRED_LAYERS = ("adm1", "adm1Labels", "adm2", "adm2Labels")


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
        return
    if repo.exists() and any(repo.iterdir()):
        raise SystemExit(f"Refusing to overwrite non-empty directory: {repo}")
    repo.parent.mkdir(parents=True, exist_ok=True)
    run(["git", "clone", "--depth", "1", "--branch", branch, repo_url, str(repo)])


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
        decoded = decode(tile.read_bytes())
        source_layer = metadata["mvtSourceLayer"]
        if source_layer not in decoded or not decoded[source_layer].get("features"):
            raise SystemExit(f"Representative tile failed validation: {key} {tile}")
    if "Web Mercator" not in manifest.get("coordinateSystem", ""):
        raise SystemExit("Manifest does not identify the projected Web Mercator build")
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
        run([sys.executable, "-m", "pip", "install", "--quiet", "ijson", "shapely", "mapbox-vector-tile", "pyclipper", "protobuf"])

    source_dir = repo / "data" / "raw" / "world" / "geoboundaries"
    try:
        for layer, url in SOURCE_URLS.items():
            download(url, source_dir / f"geoBoundariesCGAZ_{layer.upper()}.geojson")

        run([sys.executable, str(builder), "--source-dir", str(source_dir), "--release-id", args.release_id], cwd=repo)

        mvt_root = repo / "client" / "public" / "data" / "world-mvt"
        release_dir = mvt_root / args.release_id
        manifest = validate_release(release_dir)
        remove_stale_releases(mvt_root, args.release_id)
        print(json.dumps({
            "releaseId": manifest["releaseId"],
            "coordinateSystem": manifest["coordinateSystem"],
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
                raise SystemExit("Missing Kaggle Secret GITHUB_TOKEN. Add a GitHub token with repository contents write access, then rerun.")
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
