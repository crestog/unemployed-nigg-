import { geoCentroid } from "d3-geo";
import { describe, expect, it } from "vitest";

import {
  boundFeatures,
  containingFeatureId,
  parentIdByChildId,
  pointInBounds,
  pointInRings,
  representativePoint,
} from "../../client/src/lib/geoContainment";

/**
 * The ray cast counts crossings, so it does not care which way a ring winds — unlike d3's spherical
 * `geoContains`, where the wrong winding answers about the complement. `winds both ways alike` below
 * is the test that pins that down; the rest of these fixtures wind clockwise only because that is
 * what `normalizeD3Geometry` produces in `WorldMapExplorer` and matching it keeps them readable
 * beside the production path.
 */
const ring = (
  west: number,
  south: number,
  east: number,
  north: number
): GeoJSON.Position[] => [
  [west, south],
  [west, north],
  [east, north],
  [east, south],
  [west, south],
];

const box = (
  id: string,
  west: number,
  south: number,
  east: number,
  north: number
): { id: string; feature: GeoJSON.Feature } => ({
  id,
  feature: {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring(west, south, east, north)] },
  },
});

const polygon = (id: string, coordinates: GeoJSON.Position[][]) => ({
  id,
  feature: {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates },
  },
});

describe("boundFeatures", () => {
  it("reports the vertex extent as [[west, south], [east, north]]", () => {
    const [bounded] = boundFeatures([box("a", 10, 20, 30, 40)]);
    // Exactly the corners. `geoBounds` used to be the measurement here and would have reported
    // north = 40.432, because it treats the northern edge as a geodesic that bulges poleward. The
    // ray cast this gates is planar, so a planar extent is the one that matches it.
    expect(bounded.bounds).toEqual([
      [10, 20],
      [30, 40],
    ]);
  });

  it("carries the caller's own fields through, so nothing has to be re-paired by index", () => {
    const bounded = boundFeatures([{ ...box("a", 0, 0, 1, 1), payload: "kept" }]);
    expect(bounded[0].payload).toBe("kept");
  });

  it("returns an empty list for an empty input rather than throwing", () => {
    expect(boundFeatures([])).toEqual([]);
  });

  it("flattens every ring of a MultiPolygon, each with its own extent", () => {
    const [bounded] = boundFeatures([
      {
        id: "islands",
        feature: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "MultiPolygon",
            coordinates: [[ring(0, 0, 1, 1)], [ring(10, 10, 11, 11)]],
          },
        },
      },
    ]);
    expect(bounded.rings).toHaveLength(2);
    expect(bounded.rings[1].minX).toBe(10);
    // The feature extent spans both; the per-ring extents are what let a query skip the far one.
    expect(bounded.bounds).toEqual([
      [0, 0],
      [11, 11],
    ]);
  });

  it("keeps no rings for geometry that encloses nothing, and rejects every point", () => {
    const [bounded] = boundFeatures([
      {
        id: "line",
        feature: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
        },
      },
    ]);
    expect(bounded.rings).toEqual([]);
    // An inverted box, so the prefilter alone rejects it — no point can be inside.
    expect(pointInBounds(bounded.bounds, 0, 0)).toBe(false);
    expect(containingFeatureId([bounded], 0, 0)).toBeNull();
  });

  it("drops a ring too short to close, which encloses no area", () => {
    const [bounded] = boundFeatures([polygon("degenerate", [[[0, 0], [1, 1], [0, 0]]])]);
    expect(bounded.rings).toEqual([]);
  });
});

describe("pointInBounds", () => {
  const bounds: [[number, number], [number, number]] = [
    [10, 20],
    [30, 40],
  ];

  it("accepts an interior point", () => {
    expect(pointInBounds(bounds, 20, 30)).toBe(true);
  });

  it("accepts the corners, which a strict comparison would drop to float error", () => {
    expect(pointInBounds(bounds, 10, 20)).toBe(true);
    expect(pointInBounds(bounds, 30, 40)).toBe(true);
  });

  it("rejects points outside in each direction", () => {
    expect(pointInBounds(bounds, 9, 30)).toBe(false);
    expect(pointInBounds(bounds, 31, 30)).toBe(false);
    expect(pointInBounds(bounds, 20, 19)).toBe(false);
    expect(pointInBounds(bounds, 20, 41)).toBe(false);
  });

  it("reads west > east as an interval wrapped across the antimeridian, not an empty one", () => {
    // `boundFeatures` never emits this, but `geoBounds` does, and a caller may pass those through.
    const wrapped: [[number, number], [number, number]] = [
      [170, -10],
      [-170, 10],
    ];
    expect(pointInBounds(wrapped, 175, 0)).toBe(true);
    expect(pointInBounds(wrapped, -175, 0)).toBe(true);
    expect(pointInBounds(wrapped, 0, 0)).toBe(false);
  });

  it("still applies the latitude test inside a wrapped interval", () => {
    const wrapped: [[number, number], [number, number]] = [
      [170, -10],
      [-170, 10],
    ];
    expect(pointInBounds(wrapped, 175, 40)).toBe(false);
  });
});

describe("pointInRings", () => {
  const ringsOf = (coordinates: GeoJSON.Position[][]) =>
    boundFeatures([polygon("x", coordinates)])[0].rings;

  it("separates inside from outside", () => {
    const rings = ringsOf([ring(0, 0, 10, 10)]);
    expect(pointInRings(rings, 5, 5)).toBe(true);
    expect(pointInRings(rings, 15, 5)).toBe(false);
    expect(pointInRings(rings, 5, 15)).toBe(false);
  });

  it("winds both ways alike, so nothing here depends on ring order being normalized first", () => {
    const clockwise = ringsOf([ring(0, 0, 10, 10)]);
    const counter = ringsOf([[...ring(0, 0, 10, 10)].reverse()]);
    expect(pointInRings(clockwise, 5, 5)).toBe(true);
    expect(pointInRings(counter, 5, 5)).toBe(true);
    expect(pointInRings(counter, 15, 5)).toBe(false);
  });

  it("treats a second ring as a hole, because two crossings come out even", () => {
    const rings = ringsOf([ring(0, 0, 10, 10), ring(4, 4, 6, 6)]);
    expect(pointInRings(rings, 5, 5)).toBe(false);
    expect(pointInRings(rings, 2, 2)).toBe(true);
  });

  it("counts a shared vertex once, so a ray through one does not flip twice", () => {
    // A diamond, whose left and right vertices sit exactly on y = 5. A closed-interval crossing rule
    // would count both edges meeting there and cancel them, reporting the interior as outside.
    const diamond = ringsOf([[[5, 0], [0, 5], [5, 10], [10, 5], [5, 0]]]);
    expect(pointInRings(diamond, 5, 5)).toBe(true);
    expect(pointInRings(diamond, 11, 5)).toBe(false);
  });

  it("skips a ring whose own extent excludes the point", () => {
    // Two far-apart islands. Correctness is the same either way; this is the prefilter that keeps a
    // point over the mainland from walking every offshore ring.
    const rings = ringsOf([ring(0, 0, 1, 1), ring(100, 100, 101, 101)]);
    expect(pointInRings(rings, 0.5, 0.5)).toBe(true);
    expect(pointInRings(rings, 100.5, 100.5)).toBe(true);
    expect(pointInRings(rings, 50, 50)).toBe(false);
  });

  it("reports false for a feature with no rings rather than throwing", () => {
    expect(pointInRings([], 0, 0)).toBe(false);
  });
});

describe("containingFeatureId", () => {
  const candidates = boundFeatures([box("west", 0, 0, 10, 10), box("east", 20, 0, 30, 10)]);

  it("finds the candidate a point falls inside", () => {
    expect(containingFeatureId(candidates, 5, 5)).toBe("west");
    expect(containingFeatureId(candidates, 25, 5)).toBe("east");
  });

  it("returns null in the gap between candidates, rather than the nearest one", () => {
    expect(containingFeatureId(candidates, 15, 5)).toBeNull();
  });

  it("returns null outside every candidate", () => {
    expect(containingFeatureId(candidates, 100, 80)).toBeNull();
  });

  it("returns null for a non-finite coordinate instead of walking the rings", () => {
    expect(containingFeatureId(candidates, Number.NaN, 5)).toBeNull();
    expect(containingFeatureId(candidates, 5, Number.NaN)).toBeNull();
    expect(containingFeatureId(candidates, Number.POSITIVE_INFINITY, 5)).toBeNull();
  });

  it("treats an empty id as no answer, matching what the parent lookup replaced", () => {
    expect(containingFeatureId(boundFeatures([box("", 0, 0, 10, 10)]), 5, 5)).toBeNull();
  });

  it("does not let a bounding-box overlap decide the answer", () => {
    // An L-shaped feature whose box covers the whole square, and a small feature in the notch the
    // L does not occupy. The box prefilter admits both; only the ray cast separates them.
    const lShape = polygon("l", [
      [[0, 0], [0, 10], [10, 10], [10, 6], [4, 6], [4, 0], [0, 0]],
    ]);
    const notch = box("notch", 5, 1, 9, 5);
    const candidates = boundFeatures([lShape, notch]);
    expect(pointInBounds(candidates[0].bounds, 7, 3)).toBe(true);
    expect(containingFeatureId(candidates, 7, 3)).toBe("notch");
    expect(containingFeatureId(candidates, 2, 3)).toBe("l");
  });

  it("assigns a point on a shared edge to exactly one of the two neighbours", () => {
    // Two districts meeting at x = 10, queried exactly on the seam. That one of them claims it, and
    // not both or neither, is what callers depend on. Which one follows from the crossing test being
    // strict (`longitude < intersection`): the seam counts as a crossing for the neighbour to its
    // right and not for the one to its left, so the eastern district wins. Asserted rather than
    // documented because it is the kind of tie a later rewrite of the loop would silently flip.
    const shared = boundFeatures([box("left", 0, 0, 10, 10), box("right", 10, 0, 20, 10)]);
    expect(containingFeatureId(shared, 10, 5)).toBe("right");
    expect(pointInRings(shared[0].rings, 10, 5)).toBe(false);
    expect(pointInRings(shared[1].rings, 10, 5)).toBe(true);
  });
});

describe("representativePoint", () => {
  const bound = (id: string, coordinates: GeoJSON.Position[][]) =>
    boundFeatures([polygon(id, coordinates)])[0];

  it("returns the centroid when the centroid is inside", () => {
    const square = bound("square", [ring(0, 0, 10, 10)]);
    // Exactly `geoCentroid`, not merely near it — the point of the assertion is that the grid-scan
    // fallback did not run. That centroid is 5.006°N rather than the box centre because it is the
    // spherical area centroid and the geodesic northern edge bows poleward, adding area up there.
    expect(representativePoint(square)).toEqual(geoCentroid(square.feature));
    expect(geoCentroid(square.feature)[1]).toBeCloseTo(5.006, 3);
  });

  it("finds a point inside a crescent whose centroid falls in its own gap", () => {
    // A C shape open to the east. Its centre of mass sits in the mouth, outside the polygon — this is
    // Uttar Dinajpur's situation, and the reason the old lookup reported that district as having no
    // state at all.
    const crescent = bound("c", [
      [
        [0, 0],
        [0, 10],
        [10, 10],
        [10, 8],
        [3, 8],
        [3, 2],
        [10, 2],
        [10, 0],
        [0, 0],
      ],
    ]);
    const [longitude, latitude] = representativePoint(crescent);
    expect(pointInRings(crescent.rings, longitude, latitude)).toBe(true);
  });

  it("lands on the largest island rather than the water between them", () => {
    // Two islands far apart and of very different size, which puts the centroid in open sea. The
    // point has to come back on the larger one — the archipelago case, Nicobars and Lakshadweep.
    const islands = boundFeatures([
      {
        id: "islands",
        feature: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "MultiPolygon",
            coordinates: [[ring(0, 0, 8, 8)], [ring(40, 40, 40.5, 40.5)]],
          },
        },
      },
    ])[0];
    const [longitude, latitude] = representativePoint(islands);
    expect(pointInRings(islands.rings, longitude, latitude)).toBe(true);
    expect(longitude).toBeLessThan(8);
    expect(latitude).toBeLessThan(8);
  });

  it("stays out of a hole that swallows the centroid", () => {
    const ringed = bound("annulus", [ring(0, 0, 10, 10), ring(2, 2, 8, 8)]);
    const [longitude, latitude] = representativePoint(ringed);
    expect(pointInRings(ringed.rings, longitude, latitude)).toBe(true);
  });

  it("falls back to the centroid for geometry with no rings at all", () => {
    const empty = boundFeatures([
      {
        id: "point",
        feature: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [3, 4] } },
      },
    ])[0];
    const [longitude, latitude] = representativePoint(empty);
    expect(longitude).toBeCloseTo(3, 9);
    expect(latitude).toBeCloseTo(4, 9);
  });
});

describe("parentIdByChildId", () => {
  const parents = boundFeatures([box("north", 0, 10, 20, 20), box("south", 0, 0, 20, 10)]);

  it("assigns each child by a point inside itself", () => {
    const children = boundFeatures([box("up", 2, 12, 4, 14), box("down", 2, 2, 4, 4)]);
    expect(parentIdByChildId(children, parents)).toEqual(
      new Map([
        ["up", "north"],
        ["down", "south"],
      ])
    );
  });

  it("assigns a crescent child whose centroid escapes it, instead of reporting unknown", () => {
    const crescent = boundFeatures([
      polygon("c", [
        [
          [2, 12],
          [2, 18],
          [8, 18],
          [8, 17],
          [3, 17],
          [3, 13],
          [8, 13],
          [8, 12],
          [2, 12],
        ],
      ]),
    ]);
    expect(parentIdByChildId(crescent, parents).get("c")).toBe("north");
  });

  it("reports unknown rather than guessing when no parent contains the child", () => {
    const children = boundFeatures([box("offshore", 100, 100, 101, 101)]);
    expect(parentIdByChildId(children, parents).get("offshore")).toBeNull();
  });

  it("keys every child, so a caller can tell absent from unanswered", () => {
    const children = boundFeatures([box("up", 2, 12, 4, 14), box("offshore", 100, 100, 101, 101)]);
    const parentOf = parentIdByChildId(children, parents);
    expect([...parentOf.keys()].sort()).toEqual(["offshore", "up"]);
  });

  it("returns an empty map when there are no parents to match against", () => {
    const children = boundFeatures([box("up", 2, 12, 4, 14)]);
    expect(parentIdByChildId(children, [])).toEqual(new Map([["up", null]]));
  });
});
