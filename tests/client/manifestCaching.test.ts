import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * `client/public/_headers` is the only place the served Cache-Control for a static
 * asset can be set: with Workers Static Assets a request that matches a real file
 * is answered by the asset layer and never reaches `worker.ts`, so a helper on the
 * Worker's fetch path only ever saw requests that had already missed. Nothing else
 * in the gate reads that file, which is why these assertions do.
 *
 * The specific failure they exist for: the world tile manifest names the release
 * directory every tile URL is built from, so a client holding a stale copy asks for
 * tiles from a release that may no longer be deployed. Whether that can happen is
 * decided by two facts in two different files agreeing — the `?v=` stamp on the
 * fetch, and the header on the path — and neither file mentions the other at
 * runtime.
 */
const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const explorer = read("../../client/src/components/WorldMapExplorer.tsx");
const headers = read("../../client/public/_headers");
const worldManifest = JSON.parse(read("../../client/public/data/world-mvt/manifest.json")) as {
  releaseId: string;
};

/**
 * Every `/data/...` literal anywhere under `client/src`. Walked rather than listed
 * so a fetch added to a new module is covered without anyone remembering to add the
 * file here — five modules name one today, and which five is not stable.
 */
const dataPathLiterals = (() => {
  const root = fileURLToPath(new URL("../../client/src", import.meta.url));
  const found = new Set<string>();
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.tsx?$/.test(entry.name)) {
        for (const match of readFileSync(full, "utf8").matchAll(/"(\/data\/[^"?]+)"/g)) {
          found.add(match[1]);
        }
      }
    }
  };
  walk(root);
  return [...found].sort();
})();

/** `[pattern, value]` for every `Cache-Control` rule, in file order. */
const cacheRules: Array<[string, string]> = [];
{
  let pattern: string | null = null;
  for (const raw of headers.split(/\r?\n/)) {
    if (raw.trim() === "" || raw.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      pattern = raw.trim();
      continue;
    }
    const match = /^\s*Cache-Control:\s*(.+?)\s*$/i.exec(raw);
    if (match && pattern) cacheRules.push([pattern, match[1]]);
  }
}

/**
 * Cloudflare's `_headers` matching, as far as this file uses it: `:name` is exactly
 * one path segment, `*` is any run of characters including `/`, and everything else
 * is literal. Tokenised in one pass rather than substituted in several, so no
 * placeholder has to survive being escaped.
 */
const matches = (pattern: string, path: string) => {
  let source = "";
  for (const [, star, placeholder, literal] of pattern.matchAll(
    /(\*)|(:[A-Za-z_][A-Za-z0-9_]*)|([^*:]+|:)/g
  )) {
    if (star) source += ".*";
    else if (placeholder) source += "[^/]+";
    else source += literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`).test(path);
};

describe("_headers is parsed the way this suite assumes", () => {
  it("finds a Cache-Control for every rule, and no rule twice", () => {
    expect(cacheRules.length).toBeGreaterThan(10);
    const patterns = cacheRules.map(([pattern]) => pattern);
    expect(new Set(patterns).size).toBe(patterns.length);
    for (const [pattern] of cacheRules) expect(pattern.startsWith("/")).toBe(true);
  });

  it("reads `:release` as one segment and `*` as any run", () => {
    // The parser above is the only reason the disjointness assertions below mean
    // anything, so it gets its own cases — including the overlap it has to be able
    // to see, which is the broad `/data/*` this file deliberately does not contain.
    expect(matches("/data/*", "/data/world-mvt/manifest.json")).toBe(true);
    expect(matches("/data/world-mvt/:release/*", "/data/world-mvt/manifest.json")).toBe(false);
    expect(matches("/data/world-mvt/:release/*", "/data/world-mvt/r/adm1/5/16/12.pbf")).toBe(true);
    expect(matches("/data/manifest.json", "/data/manifestXjson")).toBe(false);
    expect(matches("/assets/*", "/data/assets/x.js")).toBe(false);
    expect(matches("/fonts/*", "/fonts/Open Sans Semibold/0-255.pbf")).toBe(true);
  });
});

describe("world tile manifest cache busting", () => {
  const fetchCall = /fetch\(\s*"(\/data\/world-mvt\/manifest\.json[^"]*)"/.exec(explorer);

  it("fetches the manifest with a `?v=` stamp", () => {
    expect(fetchCall).not.toBeNull();
    expect(fetchCall?.[1]).toMatch(/\?v=.+$/);
  });

  it("stamps it with the release id the manifest itself declares", () => {
    // These were allowed to differ once: the stamp read `20260824-global-deep` while
    // the release was `world-global-deep-y-corrected-20260824`. Close enough to read
    // as intentional, and it meant a rebuild could change the release without
    // changing this URL — so a cached manifest would keep naming the old release
    // directory for as long as its `max-age` lasted, and every tile URL built from
    // it would point into a release that is no longer deployed.
    const stamp = new URL(fetchCall?.[1] ?? "", "https://example.invalid").searchParams.get("v");
    expect(stamp).toBe(worldManifest.releaseId);
  });

  it("does not disable the browser cache for it", () => {
    // `{ cache: "no-store" }` here forced a full re-download on every load and
    // defeated the header below. It was removed when the manifest still weighed
    // 8.27 MB; it must not come back now that the win is smaller and less obvious.
    const effect = /fetch\(\s*"\/data\/world-mvt\/manifest\.json[\s\S]{0,400}?\);/.exec(explorer);
    expect(effect).not.toBeNull();
    expect(effect?.[0]).not.toMatch(/cache:\s*["']no-store["']/);
  });
});

describe("Cache-Control for the manifests", () => {
  const ruleFor = (path: string) => cacheRules.filter(([pattern]) => matches(pattern, path));

  it("keeps the release-stamped world manifest cacheable but not immutable", () => {
    // Cacheable, because the URL now moves with the release: nothing needs this
    // header to make a *new* release visible. Not immutable, because a regenerate
    // that keeps the same release id does not move the URL, and `immutable` would
    // pin the superseded manifest for as long as the `max-age` says.
    const rules = ruleFor("/data/world-mvt/manifest.json");
    expect(rules).toHaveLength(1);
    const [, value] = rules[0];
    expect(value).not.toMatch(/immutable/);
    const maxAge = Number(/max-age=(\d+)/.exec(value)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(3600);
    expect(maxAge).toBeLessThanOrEqual(2592000);
    // `must-revalidate` forbids serving stale, which is the whole point of the
    // `stale-while-revalidate` window — the two cannot both be set.
    expect(value).toMatch(/stale-while-revalidate=\d+/);
    expect(value).not.toMatch(/must-revalidate/);
  });
});

describe("Cache-Control for the release-scoped and unstamped paths", () => {
  const ruleFor = (path: string) => cacheRules.filter(([pattern]) => matches(pattern, path));

  it("keeps the unstamped manifests on a short leash", () => {
    // Neither of these carries a `?v=`, so their URLs do not move when their release
    // does and the header is the only thing keeping them fresh.
    for (const path of ["/data/manifest.json", "/data/india-tiles/manifest.json"]) {
      const rules = ruleFor(path);
      expect(rules).toHaveLength(1);
      const [, value] = rules[0];
      expect(Number(/max-age=(\d+)/.exec(value)?.[1])).toBeLessThanOrEqual(300);
      expect(value).toMatch(/must-revalidate/);
    }
  });

  it("serves release-scoped tiles and part indexes as immutable", () => {
    for (const path of [
      `/data/world-mvt/${worldManifest.releaseId}/adm1/5/16/12.pbf`,
      `/data/world-mvt/${worldManifest.releaseId}/packed/adm1/5/16.json`,
      "/data/india-tiles/world-india-geography-20260820/manifest.json",
    ]) {
      const rules = ruleFor(path);
      expect(rules).toHaveLength(1);
      expect(rules[0][1]).toMatch(/max-age=31536000/);
      expect(rules[0][1]).toMatch(/immutable/);
    }
  });
});
describe("the rules stay disjoint", () => {
  // Every matching rule contributes its value and same-named values are joined with a
  // comma rather than overriding, so two rules matching one path produced
  // `max-age=86400, …, max-age=31536000, immutable, max-age=300, must-revalidate` on a
  // single response. A broad `/data/*` is the way that happens: it also matches the
  // release directories and the bare manifests.
  const probes = [
    "/assets/index-abc12345.js",
    "/assets/index-abc12345.css",
    "/fonts/Open Sans Semibold/0-255.pbf",
    "/sw.js",
    "/favicon.svg",
    "/data/manifest.json",
    "/data/taxonomies.json",
    "/data/occupations.json",
    "/data/occupations-index.json",
    "/data/occupations-detail.json",
    "/data/international.json",
    "/data/atlas-entities-india.json",
    "/data/atlas-entities-india-detail.json",
    "/data/roadmaps/frontend.json",
    "/data/world-mvt/manifest.json",
    "/data/india-tiles/manifest.json",
    `/data/world-mvt/${worldManifest.releaseId}/adm2/6/40/25.pbf`,
    "/data/india-tiles/world-india-geography-20260820/tiles/4/11/6.json",
  ];

  it("matches each probe path with at most one rule", () => {
    const overlapping = probes
      .map(path => ({ path, hit: cacheRules.filter(([pattern]) => matches(pattern, path)) }))
      .filter(({ hit }) => hit.length > 1)
      .map(({ path, hit }) => `${path} <- ${hit.map(([pattern]) => pattern).join(" + ")}`);
    expect(overlapping).toEqual([]);
  });

  it("covers every `/data` path the client fetches by literal", () => {
    // Anything not covered here falls through to the asset layer's own default,
    // `public, max-age=0, must-revalidate` — which is what production served for every
    // bundle and data file before this file existed. A new fetch added to the client is
    // the way that regresses.
    expect(dataPathLiterals.length).toBeGreaterThan(5);
    const uncovered = dataPathLiterals.filter(
      path => cacheRules.filter(([pattern]) => matches(pattern, path)).length === 0
    );
    expect(uncovered).toEqual([]);
  });
});
