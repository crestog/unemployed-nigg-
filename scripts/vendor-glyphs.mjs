// Vendors the MapLibre SDF glyph ranges the atlas style needs into
// client/public/fonts, so labels stop depending on demotiles.maplibre.org at
// runtime.
//
// Why this exists: client/src/components/MapLibreWorldScene.tsx used to point
// `glyphs` at https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf.
// That is MapLibre's demo server, explicitly not for production use — a rate
// limit or outage there silently removes every label from the map, and there is
// no error surface for it because MapLibre treats a missing glyph range as
// "draw nothing".
//
// The glyphs are pre-rendered SDF atlases of Open Sans (Apache-2.0), so
// redistributing them alongside the app is fine; see client/public/fonts/LICENSE.
//
// Run with: node scripts/vendor-glyphs.mjs
// It is deliberately NOT wired into `pnpm build` — the output is committed, so
// the build stays offline and reproducible.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE = "https://demotiles.maplibre.org/font";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "client", "public", "fonts");

// The single fontstack referenced by every symbol layer in the atlas style.
const FONTSTACKS = ["Open Sans Semibold"];

// Unicode is split into 256-codepoint ranges. Only the blocks that place names
// in the dataset can actually reach are fetched; anything else is dead weight in
// a repo that is already large. A range that 404s is skipped rather than fatal,
// and a missing range at runtime degrades to unlabelled text rather than a
// broken map.
const RANGE_STARTS = [
  0, // Basic Latin + Latin-1 Supplement
  256, // Latin Extended-A
  512, // Latin Extended-B
  768, // Combining diacriticals + Greek
  1024, // Cyrillic
  1280, // Cyrillic Supplement + Armenian
  7680, // Latin Extended Additional
  8192, // General Punctuation
];

async function fetchRange(fontstack, start) {
  const range = `${start}-${start + 255}`;
  const url = `${SOURCE}/${encodeURIComponent(fontstack)}/${range}.pbf`;
  const response = await fetch(url);
  if (!response.ok) return { range, skipped: response.status };
  const body = new Uint8Array(await response.arrayBuffer());
  const target = path.join(OUT_DIR, fontstack, `${range}.pbf`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  return { range, bytes: body.byteLength };
}

let total = 0;
for (const fontstack of FONTSTACKS) {
  for (const start of RANGE_STARTS) {
    const result = await fetchRange(fontstack, start);
    if (result.skipped) {
      console.warn(`skip ${fontstack} ${result.range} (HTTP ${result.skipped})`);
      continue;
    }
    total += result.bytes;
    console.log(`wrote ${fontstack} ${result.range} (${result.bytes} B)`);
  }
}
console.log(`vendored ${(total / 1024).toFixed(1)} KB of glyphs into ${OUT_DIR}`);
