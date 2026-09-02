// Splits the two monolithic roadmap datasets into one file per roadmap.
//
// Why: client/src/pages/RoadmapDetail.tsx downloaded the whole 19.9 MB
// `roadmap-content.json` — all 10,499 topics across all 92 roadmaps — and then
// filtered it client-side to the ~110 topics it was going to show. RoadmapGraph
// did the same with the 5.7 MB `roadmap-graphs.json`. A visitor opening one
// roadmap paid for all of them, which is most of the reason the roadmap page
// blew past the 250 KB budget in PERFORMANCE_BUDGET.md by two orders of
// magnitude.
//
// Output (derived, gitignored — regenerate with `pnpm build` or by running this
// directly):
//
//     client/public/data/roadmaps/<slug>/topics.json   ~216 KB average
//     client/public/data/roadmaps/<slug>/graph.json    ~62 KB average
//
// The monoliths stay committed and remain the source of truth: this script is
// pure derivation, it runs offline, and it is wired into `prebuild` so a clean
// checkout produces the same output before Vite copies public/ into dist/.
//
// Run with: node scripts/split-roadmap-data.mjs

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.resolve(import.meta.dirname, "..", "client", "public", "data");
const OUT_DIR = path.join(DATA_DIR, "roadmaps");

async function readJson(name) {
  return JSON.parse(await readFile(path.join(DATA_DIR, name), "utf8"));
}

/** Slugs come from the data, not from a hand-maintained list, so a roadmap
 * added upstream is split without touching this script. Anything that would
 * escape OUT_DIR is dropped rather than trusted. */
function safeSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9][a-z0-9-]*$/i.test(slug) ? slug : null;
}

async function writeShard(slug, file, value) {
  const dir = path.join(OUT_DIR, slug);
  await mkdir(dir, { recursive: true });
  const body = JSON.stringify(value);
  await writeFile(path.join(dir, file), body);
  return Buffer.byteLength(body);
}

// A stale shard for a roadmap that no longer exists would still be served, so
// the directory is rebuilt from scratch each time.
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

const topics = await readJson("roadmap-content.json");
const byRoadmap = new Map();
let skippedTopics = 0;
for (const topic of Array.isArray(topics) ? topics : []) {
  const slug = safeSlug(topic?.roadmapSlug);
  if (!slug) {
    skippedTopics += 1;
    continue;
  }
  const bucket = byRoadmap.get(slug);
  if (bucket) bucket.push(topic);
  else byRoadmap.set(slug, [topic]);
}

let topicBytes = 0;
for (const [slug, records] of byRoadmap) {
  topicBytes += await writeShard(slug, "topics.json", records);
}

const graphs = await readJson("roadmap-graphs.json");
const generatedAt = graphs?.generatedAt ?? null;
let graphBytes = 0;
let graphCount = 0;
for (const [rawSlug, graph] of Object.entries(graphs?.roadmaps ?? {})) {
  const slug = safeSlug(rawSlug);
  if (!slug) continue;
  graphBytes += await writeShard(slug, "graph.json", { generatedAt, roadmap: graph });
  graphCount += 1;
}

// An index so a client can tell "this roadmap has no topics" from "the split has
// not run", without probing for a file that the SPA fallback answers with HTML.
const indexBody = {
  generatedAt,
  roadmaps: [...byRoadmap.keys()].sort().map(slug => ({
    slug,
    topics: byRoadmap.get(slug).length,
  })),
};
await writeFile(path.join(OUT_DIR, "index.json"), JSON.stringify(indexBody));

const kb = bytes => `${(bytes / 1024).toFixed(0)} KB`;
console.log(
  `split ${byRoadmap.size} roadmaps: topics ${kb(topicBytes)} total, ` +
    `${kb(topicBytes / byRoadmap.size)} average; graphs ${graphCount} files, ` +
    `${kb(graphBytes / Math.max(graphCount, 1))} average`
);
if (skippedTopics) console.warn(`skipped ${skippedTopics} topics with an unusable roadmapSlug`);
