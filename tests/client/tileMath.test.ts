import { describe, expect, it } from "vitest";

import {
  clamp,
  latitudeToTileY,
  longitudeToTileX,
  tileKeyParts,
  tileKeysForViewport,
  tileKeysInViewport,
  tileRangeForViewport,
  type LngLatBounds,
} from "@/lib/tileMath";

describe("clamp", () => {
  it("bounds a value on both sides and passes through in-range values", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(4, 0, 10)).toBe(4);
  });
});

describe("longitudeToTileX", () => {
  it("maps the antimeridian and prime meridian to the expected columns", () => {
    // z=0 is one tile wide, so everything collapses to column 0.
    expect(longitudeToTileX(0, 0)).toBe(0);
    expect(longitudeToTileX(-180, 1)).toBe(0);
    expect(longitudeToTileX(0, 1)).toBe(1);
    expect(longitudeToTileX(0, 2)).toBe(2);
    expect(longitudeToTileX(-90, 2)).toBe(1);
    expect(longitudeToTileX(90, 2)).toBe(3);
  });

  it("clamps rather than overflowing at or past +180", () => {
    // Without the clamp this returns 2**zoom, an out-of-range column that would
    // 404 on every request.
    expect(longitudeToTileX(180, 2)).toBe(3);
    expect(longitudeToTileX(360, 5)).toBe(2 ** 5 - 1);
    expect(longitudeToTileX(-400, 5)).toBe(0);
  });
});

describe("latitudeToTileY", () => {
  it("maps the equator to the middle row and grows southward", () => {
    expect(latitudeToTileY(0, 1)).toBe(1);
    expect(latitudeToTileY(0, 2)).toBe(2);
    // Y increases as latitude decreases — the inversion the viewport range
    // depends on.
    expect(latitudeToTileY(60, 4)).toBeLessThan(latitudeToTileY(-60, 4));
  });

  it("clamps beyond the Web Mercator latitude limit", () => {
    expect(latitudeToTileY(90, 4)).toBe(0);
    expect(latitudeToTileY(-90, 4)).toBe(2 ** 4 - 1);
    expect(latitudeToTileY(1e6, 6)).toBe(0);
  });
});

describe("tileKeyParts", () => {
  it("parses a well-formed key", () => {
    expect(tileKeyParts("5/16/12")).toEqual({ z: 5, x: 16, y: 12 });
  });

  it("yields NaN for malformed keys so range checks exclude them", () => {
    const short = tileKeyParts("5/16");
    expect(short.y).toBeNaN();
    // NaN fails every comparison, which is what keeps a truncated key from
    // being treated as tile 0.
    expect(short.y >= 0).toBe(false);
    expect(tileKeyParts("").z).toBeNaN();
  });
});

describe("tileRangeForViewport", () => {
  const bounds: LngLatBounds = [
    [68, 8],
    [98, 36],
  ]; // roughly India

  it("returns null without bounds", () => {
    expect(tileRangeForViewport(5, null)).toBeNull();
  });

  it("puts the northern edge at minY", () => {
    const range = tileRangeForViewport(5, bounds);
    expect(range).not.toBeNull();
    expect(range!.minX).toBe(longitudeToTileX(68, 5));
    expect(range!.maxX).toBe(longitudeToTileX(98, 5));
    expect(range!.minY).toBe(latitudeToTileY(36, 5));
    expect(range!.maxY).toBe(latitudeToTileY(8, 5));
    expect(range!.minY).toBeLessThanOrEqual(range!.maxY);
    expect(range!.minX).toBeLessThanOrEqual(range!.maxX);
  });

  it("degenerates to a single tile for a point viewport", () => {
    const range = tileRangeForViewport(4, [
      [10, 10],
      [10, 10],
    ]);
    expect(range).toEqual({
      minX: range!.maxX,
      maxX: range!.maxX,
      minY: range!.maxY,
      maxY: range!.maxY,
    });
  });
});

describe("tileKeysInViewport", () => {
  it("enumerates the full inclusive rectangle", () => {
    const keys = tileKeysInViewport(2, [
      [-180, -85],
      [180, 85],
    ]);
    expect(keys).toHaveLength(16);
    expect(keys).toContain("2/0/0");
    expect(keys).toContain("2/3/3");
  });

  it("returns nothing without bounds", () => {
    expect(tileKeysInViewport(5, null)).toEqual([]);
  });
});

describe("tileKeysForViewport", () => {
  const layer = {
    tileZoom: 2,
    tiles: ["2/0/0", "2/1/1", "2/2/1", "2/3/3", "garbage", "2/1"],
  };

  it("keeps only tiles intersecting the range and drops malformed keys", () => {
    const all = tileKeysForViewport(layer, [
      [-180, -85],
      [180, 85],
    ]);
    expect(all).toEqual(["2/0/0", "2/1/1", "2/2/1", "2/3/3"]);
  });

  it("filters to the requested window", () => {
    // Northern hemisphere, western half: excludes 2/2/1 and 2/3/3.
    const subset = tileKeysForViewport(layer, [
      [-180, 1],
      [-1, 85],
    ]);
    expect(subset).toEqual(["2/0/0", "2/1/1"]);
  });

  it("returns nothing without bounds", () => {
    expect(tileKeysForViewport(layer, null)).toEqual([]);
  });

  it("returns nothing when the layer enumerates no tiles", () => {
    expect(
      tileKeysForViewport({ tileZoom: 2, tiles: [] }, [
        [-180, -85],
        [180, 85],
      ])
    ).toEqual([]);
  });
});
