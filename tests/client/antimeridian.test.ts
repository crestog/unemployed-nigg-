import { describe, expect, it } from "vitest";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-50m.json";

import { splitGeometryAtAntimeridian } from "@/lib/antimeridian";

type Position = GeoJSON.Position;
type Ring = Position[];

/**
 * The invariant, restated independently of the implementation: no edge of the
 * conditioned geometry may span more than 180° of longitude. `@maplibre/geojson-vt`
 * tiles in planar Web Mercator, where such an edge is not a short hop across the
 * antimeridian but a band the width of the planet.
 */
function widestStep(ring: Ring): number {
  let widest = 0;
  for (let index = 1; index < ring.length; index += 1) {
    widest = Math.max(widest, Math.abs(ring[index][0] - ring[index - 1][0]));
  }
  return widest;
}

function rings(geometry: GeoJSON.Geometry): Ring[] {
  switch (geometry.type) {
    case "Polygon":
      return geometry.coordinates;
    case "MultiPolygon":
      return geometry.coordinates.flat();
    case "LineString":
      return [geometry.coordinates];
    case "MultiLineString":
      return geometry.coordinates;
    default:
      return [];
  }
}

function widestStepIn(geometry: GeoJSON.Geometry): number {
  return rings(geometry).reduce((widest, ring) => Math.max(widest, widestStep(ring)), 0);
}

function longitudes(geometry: GeoJSON.Geometry): number[] {
  return rings(geometry).flatMap(ring => ring.map(position => position[0]));
}

function latitudes(geometry: GeoJSON.Geometry): number[] {
  return rings(geometry).flatMap(ring => ring.map(position => position[1]));
}

function signedArea(ring: Ring): number {
  let total = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    total += ring[previous][0] * ring[index][1] - ring[index][0] * ring[previous][1];
  }
  return total / 2;
}

/**
 * A ring that is nothing but a run along a pole. `countries-50m` ships one — 257
 * points at lat -89.999 ahead of Antarctica's real coast — and it is the
 * dangerous kind of harmless: it carries a step wider than 180°, so a splitter
 * reads it as pole-encircling and closes it through lat ±90. That closure lands
 * on the tile edge, where MapLibre's globe subdivision extends it to the pole,
 * and a ring that enclosed 7.7e-12 deg² becomes a second polar cap over the
 * first. Real land in this dataset stops at |lat| ≈ 83.7°.
 */
function poleRuns(geometry: GeoJSON.Geometry): Ring[] {
  return rings(geometry).filter(
    ring => ring.length > 0 && ring.every(position => Math.abs(position[1]) >= 89.9)
  );
}

describe("splitGeometryAtAntimeridian", () => {
  it("returns geometry that does not straddle by reference", () => {
    const geometry: GeoJSON.Geometry = {
      type: "Polygon",
      coordinates: [
        [
          [10, 10],
          [20, 10],
          [20, 20],
          [10, 20],
          [10, 10],
        ],
      ],
    };
    expect(splitGeometryAtAntimeridian(geometry)).toBe(geometry);
  });

  it("splits a ring that straddles 180° into one piece per hemisphere", () => {
    // Wrangel Island's shape, reduced: four corners either side of the seam.
    const geometry: GeoJSON.Geometry = {
      type: "Polygon",
      coordinates: [
        [
          [179, 71],
          [-179, 71],
          [-179, 72],
          [179, 72],
          [179, 71],
        ],
      ],
    };
    const split = splitGeometryAtAntimeridian(geometry);
    expect(split.type).toBe("MultiPolygon");
    expect(widestStepIn(split)).toBeLessThanOrEqual(180);

    const pieces = (split as GeoJSON.MultiPolygon).coordinates;
    expect(pieces).toHaveLength(2);
    // Every piece stays inside one hemisphere and reaches the seam.
    for (const piece of pieces) {
      const values = piece.flat().map(position => position[0]);
      expect(Math.max(...values)).toBeLessThanOrEqual(180);
      expect(Math.min(...values)).toBeGreaterThanOrEqual(-180);
      expect(values.some(value => Math.abs(value) === 180)).toBe(true);
    }
  });

  it("closes a pole-encircling ring through the pole", () => {
    // A coast that runs the full way round the south pole, as Antarctica's does,
    // and is closed by a single 360°-wide step back to its own first vertex.
    const coast: Ring = [];
    for (let longitude = -180; longitude <= 175; longitude += 5) {
      coast.push([longitude, -70]);
    }
    coast.push([-180, -70]);
    const geometry: GeoJSON.Geometry = { type: "Polygon", coordinates: [coast] };

    const split = splitGeometryAtAntimeridian(geometry);
    expect(widestStepIn(split)).toBeLessThanOrEqual(180);
    // Reaching exactly -90 is what makes the cap fill: geojson-vt clamps the
    // projected latitude onto the tile edge, and MapLibre's globe subdivision
    // extends any triangle edge lying on that edge to the pole.
    expect(Math.min(...latitudes(split))).toBe(-90);
    const values = longitudes(split);
    expect(Math.max(...values)).toBeLessThanOrEqual(180);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-180);
  });

  it("drops a pole ring and promotes the coast it was paired with", () => {
    // Antarctica's exact shape in `countries-50m`: ring 0 is a run of points
    // strung along one parallel just short of the pole — the spherical way of
    // saying "the cap continues to the pole" — and ring 1 is the real coast,
    // nominally a hole. Read planar, that is a zero-area outer ring with a
    // continent-sized hole in it.
    const poleRun: Ring = [];
    for (let longitude = -180; longitude <= 180; longitude += 10) poleRun.push([longitude, -89.999]);
    const coast: Ring = [];
    for (let longitude = 180; longitude >= -180; longitude -= 10) coast.push([longitude, -70]);
    const geometry: GeoJSON.Geometry = { type: "Polygon", coordinates: [poleRun, coast] };

    const split = splitGeometryAtAntimeridian(geometry);
    expect(poleRuns(split)).toEqual([]);
    expect(widestStepIn(split)).toBeLessThanOrEqual(180);

    // What is left is one polygon, outer ring first, enclosing real area — so
    // earcut triangulates a cap rather than bridging into a hole.
    const polygons =
      split.type === "MultiPolygon" ? split.coordinates : [(split as GeoJSON.Polygon).coordinates];
    expect(polygons).toHaveLength(1);
    expect(Math.abs(signedArea(polygons[0][0]))).toBeGreaterThan(1000);
    expect(Math.min(...latitudes(split))).toBe(-90);
  });

  it("cuts a line at the seam instead of wrapping it round the world", () => {
    const geometry: GeoJSON.Geometry = {
      type: "LineString",
      coordinates: [
        [170, 0],
        [-170, 5],
      ],
    };
    const split = splitGeometryAtAntimeridian(geometry);
    expect(split.type).toBe("MultiLineString");
    expect(widestStepIn(split)).toBeLessThanOrEqual(180);
    // The cut lands on the seam, at the latitude the segment had reached there.
    expect((split as GeoJSON.MultiLineString).coordinates).toEqual([
      [
        [170, 0],
        [180, 2.5],
      ],
      [
        [-180, 2.5],
        [-170, 5],
      ],
    ]);
  });

  it("caches per geometry object", () => {
    const geometry: GeoJSON.Geometry = {
      type: "Polygon",
      coordinates: [
        [
          [179, 71],
          [-179, 71],
          [-179, 72],
          [179, 72],
          [179, 71],
        ],
      ],
    };
    expect(splitGeometryAtAntimeridian(geometry)).toBe(splitGeometryAtAntimeridian(geometry));
  });
});

describe("countries-50m, as the globe consumes it", () => {
  const collection = feature(
    worldTopology as never,
    (worldTopology as unknown as { objects: { countries: never } }).objects.countries
  ) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;

  it("has exactly the three straddling features this module was written for", () => {
    const offenders = collection.features
      .filter(item => widestStepIn(item.geometry) > 180)
      .map(item => item.properties?.name)
      .sort();
    expect(offenders).toEqual(["Antarctica", "Fiji", "Russia"]);
  });

  it("leaves no edge wider than 180° anywhere in the world once split", () => {
    for (const item of collection.features) {
      const split = splitGeometryAtAntimeridian(item.geometry);
      expect(widestStepIn(split), item.properties?.name ?? "unnamed").toBeLessThanOrEqual(180);
      const values = longitudes(split);
      expect(Math.max(...values)).toBeLessThanOrEqual(180);
      expect(Math.min(...values)).toBeGreaterThanOrEqual(-180);
    }
  });

  it("closes Antarctica onto the south pole so the globe fills a cap", () => {
    const antarctica = collection.features.find(item => item.properties?.name === "Antarctica");
    expect(antarctica).toBeDefined();
    const split = splitGeometryAtAntimeridian(antarctica!.geometry);
    expect(Math.min(...latitudes(split))).toBe(-90);
  });

  it("leaves Antarctica exactly one continent-sized ring, and no pole run", () => {
    const antarctica = collection.features.find(item => item.properties?.name === "Antarctica")!;
    // The source really does carry one: 257 points along lat -89.999, ahead of
    // the 2,539-point coast, enclosing 7.7e-12 deg².
    expect(poleRuns(antarctica.geometry).length).toBeGreaterThan(0);

    const split = splitGeometryAtAntimeridian(antarctica.geometry);
    expect(poleRuns(split)).toEqual([]);
    const continental = rings(split).filter(ring => Math.abs(signedArea(ring)) > 1000);
    expect(continental).toHaveLength(1);
  });

  it("leaves no country a ring that is only a pole run", () => {
    for (const item of collection.features) {
      const split = splitGeometryAtAntimeridian(item.geometry);
      expect(poleRuns(split), item.properties?.name ?? "unnamed").toEqual([]);
    }
  });
});
