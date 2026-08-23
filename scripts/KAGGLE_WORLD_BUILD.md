# Kaggle build for Atlas World

The heavy geographic preprocessing is an **offline build step**, not a browser or Worker runtime step. Kaggle can run it with Internet enabled and no API key. The browser only consumes the generated static MVT files.

## What the pipeline builds

The repository builder downloads official GeoBoundaries CGAZ ADM1 and ADM2 snapshots, projects geometries to spherical Web Mercator, clips and encodes polygon tiles, and emits separate point-label tiles. The point-label layers are important: MapLibre’s polygon symbol placement can repeat a label when one polygon is present in multiple vector tiles, so labels are precomputed once per source feature in dedicated point tiles. The result contains global ADM1/ADM2 reference geometry and labels; it does **not** add global cities/localities.

The source policy remains the GeoBoundaries CGAZ composite policy, including its disputed-area treatment. Keep the generated manifest and `THIRD_PARTY_NOTICES.md` with every release.

## Kaggle steps

Create a Kaggle Notebook with Internet enabled, then run:

```python
!git clone https://github.com/crestog/unemployed-nigg- /kaggle/working/atlas-repo
!python /kaggle/working/atlas-repo/scripts/kaggle_build_atlas_world.py \
    --repo-dir /kaggle/working/atlas-repo \
    --release-id world-global-geoboundaries-kaggle
```

The wrapper installs its Python-only build dependencies, downloads the two official source snapshots, runs `scripts/build_global_geoboundaries_mvt.py`, validates that `adm1`, `adm1Labels`, `adm2`, and `adm2Labels` exist, and writes `/kaggle/working/atlas-world-world-global-geoboundaries-kaggle.tar.gz`. It deletes the raw source snapshots after the archive is written. Use `--skip-install` only when the notebook has already installed `ijson`, `shapely`, `mapbox-vector-tile`, `pyclipper`, and `protobuf`.

## Handoff to the website

Extract the archive locally, copy its `world-mvt/manifest.json` and versioned release directory into `client/public/data/world-mvt/`, and ensure the mutable manifest points to the new release ID. Run `pnpm check`, `pnpm build`, and `git diff --check`. Commit the generated release and deploy through the normal GitHub/Cloudflare workflow. Do not commit the downloaded raw GeoJSON files; the repository ignores `data/raw/` for this reason.

## Reproducibility record

Record the release ID, source URLs, source SHA-256 values, feature counts, tile counts, tile bytes, build date, and the exact commit that consumed the release. Do not replace the source data with fabricated features or describe the global ADM1/ADM2 release as worldwide locality or city coverage.
