# Kaggle build for Atlas World

Atlas World treats geographic preprocessing as an **offline Kaggle job**. The browser and Cloudflare Worker do not download GeoBoundaries, run Python, or call Kaggle at runtime; they serve the validated, versioned static MVT release committed to `client/public/data/world-mvt/`.

## What the pipeline builds

The job downloads the official GeoBoundaries CGAZ ADM1 and ADM2 snapshots, records their SHA-256 hashes, normalizes longitudes, splits polygon rings at the 180th meridian, repairs valid winding and geometry, rejects global ADM detail outside the documented safe vector latitude, projects accepted geometry to spherical Web Mercator, clips with an 8-pixel tile buffer, and encodes XYZ Mapbox Vector Tiles. Each source feature also gets one representative point in a separate label layer so polygon clipping cannot duplicate labels across tiles.

The release contains global **country/ADM1/ADM2 reference geography only**. It does not add worldwide cities or localities. India’s specialized ADM1/ADM2/GeoNames locality pipeline remains a separate source. GeoBoundaries attribution, source URLs, source hashes, and CGAZ disputed-area policy are preserved in the generated manifest and notices already shipped with the project.

## One-time Kaggle setup

Create or open the repository notebook at `notebooks/atlas_world_kaggle_auto.ipynb`. In Kaggle, enable **Internet** in the notebook settings. Add one Kaggle Secret named `GITHUB_TOKEN` containing a fine-grained GitHub token scoped only to `crestog/unemployed-nigg-` with repository **Contents: Read and write** permission. Do not paste a GitHub or Kaggle token into a cell or chat. No Kaggle API token is needed for this workflow.

Run the notebook cells in order. The notebook generates a unique immutable release ID such as `world-global-geoboundaries-kaggle-20260823T123456Z`, so a successful build can be identified and rolled back by commit if needed.

## Cell sequence

| Cell | Purpose | Expected result |
| --- | --- | --- |
| Setup | Reads `GITHUB_TOKEN` from Kaggle Secrets and defines a unique release ID | The token is loaded without printing its value |
| Clone | Clones the latest `main` branch | The current builder and frontend code are present |
| Dependencies | Installs `ijson`, `shapely`, `antimeridian`, `mapbox-vector-tile`, `pyclipper`, and `protobuf` | Python build environment is ready |
| Build | Downloads the two official source snapshots and runs `kaggle_build_atlas_world.py` | Four non-empty layers plus JSON/CSV audits are generated |
| Audit | Reads `geometry-audit-summary.json` and verifies the archive | Polar rejections are listed; world-spanning and invalid geometry failures stop the run |
| Push check | Shows the new commit and clean status | The wrapper has pushed the validated assets; no credential is printed |
| Deploy monitor | Polls GitHub Actions and prints the live URL | Existing GitHub Actions deploys `main` to Cloudflare |

The wrapper is intentionally the automated path. It downloads, builds, audits, validates, archives, removes stale immutable global releases, updates the mutable pointer manifest, commits, and pushes. It does not push if the audit or representative PBF validation fails.

## Geometry audit contract

Every source feature receives a JSON and CSV audit row containing source ID, name, country code, input and normalized bounding boxes, maximum longitude jump, antimeridian split count, post-split component span, polar status, repair status, tile replication count, acceptance, and rejection reason. The builder rejects any accepted component wider than 180 degrees, any invalid-after-repair geometry, any excessive tile replication, and any projection outside `SAFE_VECTOR_LATITUDE = 80.0` degrees. Features touching higher latitudes are recorded as `outside_safe_vector_latitude` and excluded from global ADM detail rather than silently clamped.

The MVT encoder quantizes against the exact tile bounds while clipping against an 8-pixel projected buffer. This follows the vector-tile buffering model: neighboring tiles receive enough edge geometry to avoid visible seams, while the tile’s quantization bounds remain stable.

## Handoff and rollback

After the wrapper pushes, the existing GitHub Actions workflow should deploy the new `main` commit to Cloudflare. The generated archive is retained in `/kaggle/working/atlas-world-<release-id>.tar.gz` for inspection. The public runtime pointer is only changed in the same generated commit as a fully validated immutable release.

If production validation fails, do not manually edit the pointer to an incomplete directory. Revert the single generated release commit in GitHub, or restore the previous generated asset commit, and let the normal workflow redeploy. Keep the failed archive and audit report as evidence for the next correction.

## Mobile acceptance test

After Actions succeeds, test the live URL on a phone as one continuous MapLibre globe. Pan, pinch, rotate, and zoom through country scale; then inspect the Middle East/dateline, India/Japan, China/Russia, and the safe polar threshold. Confirm that labels are not duplicated, global and India ownership do not overlap, ADM1 fill fades before ADM2 fill takes over, and no dark rectangular or world-spanning mass appears. The Web Mercator globe limitation at high latitudes remains explicit: the current pipeline rejects unsupported global ADM detail there; it does not claim polar administrative correctness.


## Progress output and dependency isolation

The builder now prints flushed lines such as:

```text
[AtlasWorld] layer=adm1 phase=read sourceFeatures=2500 accepted=2310 rejected=190 antimeridian=14 polar=176
[AtlasWorld] layer=adm1 phase=tile-encode outputLayer=adm1 tiles=100/1840 written=100 bytes=...
[AtlasWorld] layer=adm1 phase=complete accepted=... rejected=... polygonTiles=... labelTiles=...
```

`read` reports source features parsed, accepted features, rejected features, accepted dateline splits, and polar-policy rejections. `tile-encode` reports candidate tiles, tiles written, bytes, and elapsed time. The release also stores `build-progress-adm1.jsonl` and `build-progress-adm2.jsonl` inside the immutable release directory for post-run inspection. If the process fails, the last printed phase identifies whether the failure happened during source geometry, audit writing, polygon encoding, label encoding, validation, or push.

The copy-paste notebook uses `/kaggle/working/atlas-venv` for build-only packages and invokes the wrapper with `--skip-install`. This prevents the build dependencies from modifying Kaggle’s preinstalled BigFrames/Google packages and avoids the repeated protobuf resolver warnings. The CPU usage shown in Kaggle is expected: Shapely geometry repair, GeoJSON parsing, and MVT encoding are CPU-bound and do not use T4 GPU acceleration.
