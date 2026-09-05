import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * `client/public/.assetsignore` is the only thing keeping two files that live in
 * the public directory for tooling reasons from being deployed as public assets:
 * the 8.27 MiB tile inventory the offline build emits as *input* to
 * `scripts/build-world-manifest.mjs`, and the dev-only browser log collector.
 *
 * The failure this file exists for is collateral damage. `.assetsignore` uses
 * `.gitignore` syntax, where one careless pattern reaches much further than
 * intended: stopping the release-manifest pattern a segment early, at the
 * release directory rather than the file inside it, would also drop all 9,688
 * `packed/**` shards and part indexes the Worker serves every tile from — and
 * the symptom would be a blank map with nothing wrong in the source. So these
 * assertions evaluate the real patterns
 * against the real file tree and require the excluded set to be *exactly* the
 * two things described, rather than checking that the intended two are in it.
 *
 * What they cannot check is that Wrangler's parser agrees with the matcher
 * below. Only a 404 on the deployed URL proves that.
 */
const repoFile = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

const PUBLIC_DIR = repoFile("../../client/public");
const IGNORE_FILE = `${PUBLIC_DIR}/.assetsignore`;

/** Non-blank, non-comment lines, in file order. */
const patterns = readFileSync(IGNORE_FILE, "utf8")
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line !== "" && !line.startsWith("#"));

/** Every file under `client/public`, as a `/`-joined path relative to it. */
const publicFiles = (() => {
  const found: string[] = [];
  const walk = (directory: string, prefix: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(`${directory}/${entry.name}`, relative);
      else found.push(relative);
    }
  };
  walk(PUBLIC_DIR, "");
  return found.sort();
})();

/**
 * The `.gitignore` subset these two patterns use: `*` matches any run of
 * characters within one path segment and never crosses `/`; a pattern with no `/`
 * except a trailing one matches at any depth, while one containing an interior
 * `/` is anchored to the root of the ignore file's directory. A pattern that
 * matches a *directory* excludes everything beneath it whether or not it ends in
 * `/` — that is what makes a pattern stopped one segment early so dangerous, so
 * it is modelled here rather than assumed away; a trailing `/` only narrows the
 * pattern to directories. Negation (`!`) and `**` are not implemented, and the
 * assertions below refuse a file that uses them rather than silently disagreeing
 * with Wrangler.
 */
const excludes = (pattern: string, path: string) => {
  const directoryOnly = pattern.endsWith("/");
  const body = directoryOnly ? pattern.slice(0, -1) : pattern;
  const anchored = body.includes("/");
  const source = body
    .split("*")
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^/]*");
  // Anchored patterns must match from the start; unanchored ones may begin at any
  // segment boundary. Either way the match may end at the path itself or at any
  // ancestor directory of it; a directory-only pattern must end at an ancestor.
  const prefix = anchored ? "^" : "^(?:.*/)?";
  const suffix = directoryOnly ? "/.+$" : "(?:/.+)?$";
  return new RegExp(`${prefix}${source}${suffix}`).test(path);
};

const excluded = publicFiles.filter(path => patterns.some(p => excludes(p, path)));
const kept = publicFiles.filter(path => !patterns.some(p => excludes(p, path)));

/** Release directories under a data root, discovered rather than named. */
const releaseDirectories = (root: string) =>
  readdirSync(`${PUBLIC_DIR}/${root}`, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

const sizeOf = (relative: string) => statSync(`${PUBLIC_DIR}/${relative}`).size;

describe("the .assetsignore matcher behaves like .gitignore", () => {
  it("does not let `*` cross a path separator", () => {
    // The whole safety argument rests on this one property: it is what keeps
    // the release-manifest pattern off `packed/adm1/5/0.json`.
    expect(excludes("data/world-mvt/*/manifest.json", "data/world-mvt/r/manifest.json")).toBe(true);
    expect(excludes("data/world-mvt/*/manifest.json", "data/world-mvt/manifest.json")).toBe(false);
    expect(excludes("data/world-mvt/*/manifest.json", "data/world-mvt/r/p/manifest.json")).toBe(
      false
    );
  });

  it("anchors a pattern that contains an interior separator", () => {
    expect(excludes("data/world-mvt/*/manifest.json", "x/data/world-mvt/r/manifest.json")).toBe(
      false
    );
    expect(excludes("__manus__/", "nested/__manus__/a.js")).toBe(true);
  });

  it("treats a trailing separator as directory-only", () => {
    expect(excludes("__manus__/", "__manus__/debug-collector.js")).toBe(true);
    expect(excludes("__manus__/", "__manus__")).toBe(false);
  });

  it("excludes a whole subtree when a pattern matches a directory", () => {
    // Without this, the matcher would call the dangerous mistake safe. A pattern
    // stopped at the release directory matches that directory, and git excludes
    // everything under a matched directory — which is every packed shard.
    expect(excludes("data/world-mvt/*", "data/world-mvt/r/packed/adm1/5/0.bin")).toBe(true);
    expect(excludes("data/world-mvt/*", "data/world-mvt/r/manifest.json")).toBe(true);
    // The narrower pattern that is actually in use must not have that reach.
    expect(
      excludes("data/world-mvt/*/manifest.json", "data/world-mvt/r/packed/adm1/5/0.bin")
    ).toBe(false);
  });
});

describe(".assetsignore stays inside the subset the matcher implements", () => {
  it("uses no negation and no `**`", () => {
    expect(patterns.length).toBeGreaterThanOrEqual(2);
    for (const pattern of patterns) {
      expect(pattern.startsWith("!"), `negation is unsupported: ${pattern}`).toBe(false);
      expect(pattern.includes("**"), `\`**\` is unsupported: ${pattern}`).toBe(false);
    }
  });
});

describe("what .assetsignore excludes, against the real public tree", () => {
  it("excludes exactly the release-scoped world manifests and the dev collector", () => {
    // Derived, not listed: a release bump changes the directory name, and this
    // has to keep holding when it does.
    const expected = [
      ...releaseDirectories("data/world-mvt").map(r => `data/world-mvt/${r}/manifest.json`),
      ...publicFiles.filter(path => path.startsWith("__manus__/")),
    ].sort();
    expect(expected.length).toBeGreaterThanOrEqual(2);
    expect(excluded).toEqual(expected);
  });

  it("keeps the derived manifest the client actually fetches", () => {
    // The two differ by one path segment and by three orders of magnitude. If a
    // future pattern ever caught the small one, the world map would stop loading
    // entirely — so assert the size relationship too, which is what makes it
    // obvious in the failure output which manifest went missing.
    expect(kept).toContain("data/world-mvt/manifest.json");
    expect(sizeOf("data/world-mvt/manifest.json")).toBeLessThan(100_000);
    for (const path of excluded.filter(p => p.endsWith("/manifest.json"))) {
      expect(sizeOf(path)).toBeGreaterThan(1_000_000);
    }
  });

  it("keeps every packed shard and part index the Worker serves tiles from", () => {
    // `worker.ts` builds `/data/world-mvt/<release>/packed/<layer>/<z>/<x>` and
    // fetches the `.json` part index and a Range slice of the `.bin` shard
    // through `env.ASSETS.fetch`, so an excluded `packed/` path is an unservable
    // tile. The count assertion is what gives this teeth — an empty tree would
    // otherwise satisfy it.
    const packed = publicFiles.filter(path => path.includes("/packed/"));
    expect(packed.length).toBeGreaterThan(1_000);
    expect(excluded.filter(path => path.includes("/packed/"))).toEqual([]);
  });

  it("does not name the asset-layer configuration or the service worker", () => {
    // `_headers` is a special case: Wrangler consumes it as asset metadata and it
    // is already absent from the *served* manifest without any rule here. Naming
    // it would risk excluding it from that metadata pass too, which would revert
    // every Cache-Control in it to the asset layer's `max-age=0, must-revalidate`
    // default — silently, since the file would still be in `dist/public`.
    for (const path of ["_headers", "sw.js", "favicon.svg", ".assetsignore"]) {
      expect(excluded, `${path} must not be excluded`).not.toContain(path);
    }
  });
});

describe("the mechanism is wired where Wrangler will read it", () => {
  it("puts the ignore file in the directory Vite copies to the asset root", () => {
    // `.assetsignore` has to end up at the root of the *uploaded* directory, not
    // the repo. It works only because Vite copies `<root>/public` verbatim into
    // `build.outDir`, and that outDir is what `wrangler.jsonc` uploads. Three
    // files have to agree; none of them mentions the other two.
    const viteConfig = readFileSync(repoFile("../../vite.config.ts"), "utf8");
    const wranglerConfig = readFileSync(repoFile("../../wrangler.jsonc"), "utf8");
    expect(viteConfig).toMatch(/root:\s*path\.resolve\(import\.meta\.dirname,\s*"client"\)/);
    expect(viteConfig).toMatch(/outDir:\s*path\.resolve\(import\.meta\.dirname,\s*"dist\/public"\)/);
    // A custom `publicDir` would move the directory this file lives in.
    expect(viteConfig).not.toMatch(/publicDir/);
    expect(wranglerConfig).toMatch(/"directory":\s*"\.\/dist\/public"/);
  });

  it("covers every `/data` path the client fetches by literal", () => {
    // The excluded-set assertion above proves what leaves the deploy; this proves
    // the client never asks for any of it. Walked rather than listed so a fetch
    // added to a new module is covered without anyone remembering this file.
    const root = repoFile("../../client/src");
    const literals = new Set<string>();
    const walk = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = `${directory}/${entry.name}`;
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) {
          for (const match of readFileSync(full, "utf8").matchAll(/"\/(data\/[^"?]+)"/g)) {
            literals.add(match[1]);
          }
        }
      }
    };
    walk(root);
    expect(literals.size).toBeGreaterThan(5);
    expect([...literals].filter(path => excluded.includes(path))).toEqual([]);
  });
});



