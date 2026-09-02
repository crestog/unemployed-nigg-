// Derives the client-facing world-MVT manifest from the release manifest by
// dropping the exhaustive per-tile listings.
//
// Why: `client/public/data/world-mvt/manifest.json` is 8.67 MB, of which
// 8,668,838 bytes are `layers[*].tiles` — a complete `"z/x/y.pbf"` enumeration
// of all 4,844 shards' worth of tiles. Nothing reads it. MapLibre requests tiles
// from a URL template and treats a missing tile as empty, and the client only
// ever touches `releaseId`, `tileTemplate`, `layers[*].tileZoom`,
// `featureCount`, `sourceMetadata`, `source`, `coveragePolicy` and
// `geometryPolicy` from this file. It was nevertheless fetched on every single
// load — 525 KB on the wire after zstd, against the 250 KB total first-view
// budget in PERFORMANCE_BUDGET.md, and with `cache: "no-store"` so it could
// never be reused.
//
// The full listing is kept: the release directory's own manifest.json stays
// committed and complete, and remains the provenance record. This script only
// produces the trimmed copy the browser downloads.
//
// Output (derived, gitignored):
//
//     client/public/data/world-mvt/manifest.json    ~4 KB
//
// Run with: node scripts/build-world-manifest.mjs

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "client", "public", "data", "world-mvt");
const OUT = path.join(ROOT, "manifest.json");

/** The release id is part of the directory name and changes on every data
 * refresh, so it is discovered rather than hardcoded. */
async function findReleaseManifests() {
  const entries = await readdir(ROOT, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(ROOT, entry.name, "manifest.json");
    try {
      const parsed = JSON.parse(await readFile(candidate, "utf8"));
      if (parsed?.format === "atlas-global-geoboundaries-mvt-v1")
        found.push({ dir: entry.name, path: candidate, manifest: parsed });
    } catch {
      // Not a release directory, or not a manifest. Either is fine.
    }
  }
  return found;
}

const releases = await findReleaseManifests();
if (!releases.length) {
  console.error(`no release manifest found under ${ROOT}`);
  process.exit(1);
}
releases.sort((a, b) =>
  String(b.manifest.generatedAt ?? "").localeCompare(String(a.manifest.generatedAt ?? ""))
);
const [current, ...older] = releases;
if (older.length)
  console.warn(
    `using ${current.dir} (generated ${current.manifest.generatedAt}); ignoring ${older.map(r => r.dir).join(", ")}`
  );

const source = current.manifest;

// `sourceMetadata` is a per-country provenance row — publisher, licence, hash,
// feature count — repeated for every country in the layer, and repeated again
// identically between `admN` and `admNLabels`. Together those rows are 118 KB of
// the 122 KB that survives dropping `tiles`. The client reads exactly one of
// them: `layers.placesLabels.sourceMetadata[0]`, for the GeoNames attribution on
// a locality selection (client/src/components/WorldMapExplorer.tsx). Everything
// else on the source panel comes from the top-level `source` block. So one row
// is kept where it is read and the rest is left to the release manifest.
const KEEP_FIRST_SOURCE_METADATA = new Set(["placesLabels"]);

const layers = {};
let droppedTiles = 0;
let droppedMetadata = 0;
for (const [key, layer] of Object.entries(source.layers ?? {})) {
  // `tileCount` and `tileBytes` are kept: they are what the UI reports, and they
  // are the two facts the enumeration was actually being used to convey.
  const { tiles, sourceMetadata, ...rest } = layer;
  droppedTiles += Array.isArray(tiles) ? tiles.length : 0;
  const metadata = Array.isArray(sourceMetadata) ? sourceMetadata : [];
  if (KEEP_FIRST_SOURCE_METADATA.has(key) && metadata[0]) {
    rest.sourceMetadata = [metadata[0]];
    droppedMetadata += metadata.length - 1;
  } else {
    droppedMetadata += metadata.length;
  }
  layers[key] = rest;
}

const trimmed = {
  ...source,
  layers,
  // Where to find what was removed, so the trimmed copy is self-describing.
  clientTrimmed: {
    droppedFields: ["layers[*].tiles", "layers[*].sourceMetadata"],
    fullManifest: `${current.dir}/manifest.json`,
  },
};
const body = JSON.stringify(trimmed);
await writeFile(OUT, body);

const before = (await readFile(current.path)).byteLength;
console.log(
  `world manifest: ${(before / 1024 / 1024).toFixed(2)} MB -> ${(body.length / 1024).toFixed(1)} KB ` +
    `(dropped ${droppedTiles.toLocaleString()} tile keys and ` +
    `${droppedMetadata.toLocaleString()} provenance rows across ${Object.keys(layers).length} layers)`
);
