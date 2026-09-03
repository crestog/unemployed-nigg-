import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPackedMvtResponse, type Env } from "../../worker";

/**
 * The bug this file exists to prevent: `buildPackedMvtResponse` used to answer 404 for *any*
 * failure, including a transient one, and `packedMvtResponse` caches 404 for an hour per colo.
 * MapLibre paints a 404 as an empty tile and never retries it, so a single upstream blip became a
 * silent, region-shaped hole in the map that healed itself an hour later — indistinguishable from
 * a data bug, and the reported "root problem that keeps coming back".
 *
 * The invariant: 404 means the part indexes positively agree the tile does not exist, and only
 * 200/404 are cacheable. Anything that means "we could not tell" must be a 5xx with no-store.
 */

const TILE = { releaseId: "r1", layerDirectory: "adm1", zoom: "5", x: "16", y: "12" };
const TILE_URL =
  "https://atlas.test/data/world-mvt/r1/packed/adm1/5/16/12.pbf";
const INDEX_PATH = "/data/world-mvt/r1/packed/adm1/5/16.json";
const SHARD_PATH = "/data/world-mvt/r1/packed/adm1/5/16.bin";

/** Stands in for the asset layer: a path -> Response map, everything else is the SPA shell. */
const assetsFrom = (routes: Record<string, () => Response>): Env => ({
  ASSETS: {
    fetch: async (input: Request | string) => {
      const path = new URL(typeof input === "string" ? input : input.url).pathname;
      const route = routes[path];
      if (route) return route();
      // How the asset layer really answers an unknown path: the SPA shell, status 200, text/html.
      return new Response("<!doctype html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  } as unknown as Fetcher,
  ATLAS_DB: {} as D1Database,
});

const build = (env: Env) =>
  buildPackedMvtResponse(new Request(TILE_URL), env, TILE);

const cacheControl = (response: Response) =>
  response.headers.get("cache-control") || "";

/** The only statuses packedMvtResponse is allowed to write into caches.default. */
const isCacheable = (status: number) => status === 200 || status === 404;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("packed MVT tile misses", () => {
  it("serves the requested byte range as a tile", async () => {
    const shard = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const response = await build(
      assetsFrom({
        [INDEX_PATH]: () =>
          new Response(JSON.stringify({ 12: [4, 3] }), {
            headers: { "content-type": "application/json" },
          }),
        [SHARD_PATH]: () =>
          new Response(shard.slice(4, 7), {
            status: 206,
            headers: { "content-type": "application/octet-stream" },
          }),
      })
    );
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([4, 5, 6])
    );
    expect(cacheControl(response)).toContain("immutable");
  });

  it("slices the correct tile out of a whole shard when Range is ignored", async () => {
    // Workers Static Assets does not honour Range, so this is the live path, not an edge case.
    const shard = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const response = await build(
      assetsFrom({
        [INDEX_PATH]: () =>
          new Response(JSON.stringify({ 12: [4, 3] }), {
            headers: { "content-type": "application/json" },
          }),
        [SHARD_PATH]: () => new Response(shard, { status: 200 }),
      })
    );
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([4, 5, 6])
    );
  });

  it("caches a 404 when the part index is absent", async () => {
    // Nothing is registered, so the index request gets the SPA shell: genuine absence.
    const response = await build(assetsFrom({}));
    expect(response.status).toBe(404);
    expect(isCacheable(response.status)).toBe(true);
    expect(cacheControl(response)).toContain("max-age=3600");
  });

  it("caches a 404 when the index parses but does not list the row", async () => {
    const response = await build(
      assetsFrom({
        [INDEX_PATH]: () =>
          new Response(JSON.stringify({ 11: [0, 8], 13: [8, 8] }), {
            headers: { "content-type": "application/json" },
          }),
      })
    );
    expect(response.status).toBe(404);
    expect(cacheControl(response)).toContain("max-age=3600");
  });

  it("does not cache a 404 when the index request fails transiently", async () => {
    for (const status of [500, 502, 503, 504]) {
      const response = await build(
        assetsFrom({
          [INDEX_PATH]: () => new Response(null, { status }),
        })
      );
      expect(response.status).toBe(503);
      expect(isCacheable(response.status)).toBe(false);
      expect(cacheControl(response)).toBe("no-store");
    }
  });

  it("does not cache a 404 when the shard fetch fails after the index confirmed the tile", async () => {
    for (const status of [403, 404, 500, 503]) {
      const response = await build(
        assetsFrom({
          [INDEX_PATH]: () =>
            new Response(JSON.stringify({ 12: [0, 16] }), {
              headers: { "content-type": "application/json" },
            }),
          [SHARD_PATH]: () => new Response(null, { status }),
        })
      );
      // The index is authoritative that this tile exists, so a failed shard fetch is never
      // evidence of absence.
      expect(response.status).toBe(503);
      expect(cacheControl(response)).toBe("no-store");
    }
  });

  it("does not cache a 404 when the part index is unparseable", async () => {
    const response = await build(
      assetsFrom({
        [INDEX_PATH]: () =>
          new Response("{ not json", {
            headers: { "content-type": "application/json" },
          }),
      })
    );
    expect(response.status).toBe(502);
    expect(isCacheable(response.status)).toBe(false);
    expect(cacheControl(response)).toBe("no-store");
  });

  it("does not cache a 404 when the index entry is malformed", async () => {
    for (const entry of [[-1, 8], [0, 0], [1.5, 8], [0, -8], ["a", "b"]]) {
      const response = await build(
        assetsFrom({
          [INDEX_PATH]: () =>
            new Response(JSON.stringify({ 12: entry }), {
              headers: { "content-type": "application/json" },
            }),
        })
      );
      expect(response.status).toBe(502);
      expect(cacheControl(response)).toBe("no-store");
    }
  });

  it("does not cache a 404 when the shard is too short for the indexed range", async () => {
    const response = await build(
      assetsFrom({
        [INDEX_PATH]: () =>
          new Response(JSON.stringify({ 12: [0, 64] }), {
            headers: { "content-type": "application/json" },
          }),
        [SHARD_PATH]: () =>
          new Response(new Uint8Array(8), { status: 206 }),
      })
    );
    expect(response.status).toBe(502);
    expect(cacheControl(response)).toBe("no-store");
  });

  it("never answers a transient failure with a cacheable status", async () => {
    // The property that actually matters, stated once over every transient shape above.
    const transientShapes: Array<Record<string, () => Response>> = [
      { [INDEX_PATH]: () => new Response(null, { status: 500 }) },
      {
        [INDEX_PATH]: () =>
          new Response(JSON.stringify({ 12: [0, 16] }), {
            headers: { "content-type": "application/json" },
          }),
        [SHARD_PATH]: () => new Response(null, { status: 500 }),
      },
      {
        [INDEX_PATH]: () =>
          new Response("{", { headers: { "content-type": "application/json" } }),
      },
    ];
    for (const shape of transientShapes) {
      const response = await build(assetsFrom(shape));
      expect(isCacheable(response.status)).toBe(false);
      expect(response.status).toBeGreaterThanOrEqual(500);
    }
  });
});
