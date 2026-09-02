// Splits the occupation catalog into the part the browse surfaces need and the
// part only an opened occupation needs.
//
// Why: `client/public/data/occupations.json` is 6.6 MB — 1,008 KB gzipped — and
// `loadCatalog()` in client/src/pages/RealHome.tsx fetched it whole on landing,
// before the user had opened anything. That is 4× the 250 KB first-view budget in
// PERFORMANCE_BUDGET.md on its own.
//
// Of the 1,016 records' bytes, ~72% are seven arrays that only render once a
// single occupation is opened: `tasks`, `skills`, `workActivities`, `software`,
// `preparation`, `outlook`, `relatedOccupations`. What the graph, the search box
// and the directory list actually read is the identity, the description, the
// `metrics` counts, the alternate titles and the wage row.
//
// So the index keeps those, with the seven arrays present but empty — the record
// shape is unchanged, so nothing can crash on `.map` or `.find` before the detail
// lands — and the detail file carries the arrays keyed by occupation id. The
// client shows the index immediately and merges the detail in behind it.
//
// One detail file rather than 1,016: the arrays compress far better together than
// apart, and browsing several occupations would otherwise be one request each.
//
// Output (derived, gitignored):
//
//     client/public/data/occupations-index.json    identity + counts + wages
//     client/public/data/occupations-detail.json   { [id]: heavy arrays }
//
// Run with: node scripts/split-occupations.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA = path.resolve(import.meta.dirname, "..", "client", "public", "data");
const SOURCE = path.join(DATA, "occupations.json");

/**
 * Read only once one occupation is open. Everything else stays in the index.
 *
 * `alternateTitles` is here despite being read by the two search boxes, because
 * it is 129 KB of the index's 261 KB gzipped — half the payload, to widen a
 * match the user has not made yet. The count shown in the UI comes from
 * `metrics.alternateTitleCount`, which stays in the index, and the search box
 * starts matching the titles themselves as soon as the detail lands.
 */
const DETAIL_FIELDS = [
  "tasks",
  "skills",
  "workActivities",
  "software",
  "preparation",
  "outlook",
  "relatedOccupations",
  "alternateTitles",
];

const occupations = JSON.parse(await readFile(SOURCE, "utf8"));
if (!Array.isArray(occupations)) {
  console.error(`${SOURCE} is not an array of occupations`);
  process.exit(1);
}

const index = [];
const detail = {};
for (const occupation of occupations) {
  const record = { ...occupation };
  const heavy = {};
  for (const field of DETAIL_FIELDS) {
    if (!(field in record)) continue;
    heavy[field] = record[field];
    // Kept as an empty container of the same kind, so a consumer that reads it
    // before the detail arrives sees "nothing yet" rather than `undefined`.
    record[field] = Array.isArray(record[field]) ? [] : null;
  }
  index.push(record);
  detail[occupation.id] = heavy;
}

const indexBody = JSON.stringify(index);
const detailBody = JSON.stringify(detail);
await writeFile(path.join(DATA, "occupations-index.json"), indexBody);
await writeFile(path.join(DATA, "occupations-detail.json"), detailBody);

const kb = bytes => `${(bytes / 1024).toFixed(0)} KB`;
console.log(
  `occupations: ${kb((await readFile(SOURCE)).byteLength)} -> ` +
    `index ${kb(indexBody.length)} + detail ${kb(detailBody.length)} ` +
    `across ${index.length.toLocaleString()} records`
);
