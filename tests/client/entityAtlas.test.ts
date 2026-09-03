import { describe, expect, it } from "vitest";

import {
  clusterEntities,
  decodeEntityAtlas,
  entityLabel,
  facetCounts,
  readEntityDetail,
  searchEntities,
  type EntityFilter,
} from "../../client/src/lib/entityAtlas";

/**
 * A four-record fixture with the two properties that made the real data awkward: several records
 * share one interned position (Bengaluru), and one facet value is absent (-1).
 *
 *   record 0  Alpha Incubator   Bengaluru  sector 0  type 0  precision 0
 *   record 1  Beta Programme    Bengaluru  sector 1  type 1  precision 0
 *   record 2  Gamma Scheme      Karnataka  sector 0  type 1  precision 2
 *   record 3  Delta Mission     Kerala     (none)    type 0  precision 2
 */
const payload = {
  version: 1,
  layout: "columnar",
  source: "fixture",
  sourceRecords: 5,
  precisions: ["point_city", "poly_district", "poly_state", "national", "unplaceable"],
  bounds: [75.8, 10.5, 77.6, 12.97],
  counts: {
    points: 4,
    positions: 3,
    national: 1,
    byPrecision: {
      point_city: 2,
      poly_district: 0,
      poly_state: 2,
      national: 1,
      unplaceable: 0,
    },
  },
  dictionaries: {
    type: ["Incubator", "Programme"],
    owner: ["Karnataka", "Kerala"],
    sector: ["Deeptech", "Agritech"],
    stage: [],
    support: ["Grant"],
    state: ["karnataka", "kerala"],
    place: ["Bengaluru", "Karnātaka", "Kerala"],
    status: ["Active"],
    host: [],
    incubatorType: [],
  },
  positions: { lng: [77.5946, 76.4, 76.2], lat: [12.9716, 15.3, 10.5] },
  points: {
    name: ["Alpha Incubator", "Beta Programme", "Gamma Scheme", "Delta Mission"],
    position: [0, 0, 1, 2],
    precision: [0, 0, 2, 2],
    type: [0, 1, 1, 0],
    owner: [0, 0, 0, 1],
    sector: [0, 1, 0, -1],
    stage: [-1, -1, -1, -1],
    support: [0, 0, 0, 0],
    state: [0, 0, 0, 1],
    place: [0, 0, 1, 2],
    status: [0, 0, 0, 0],
    host: [-1, -1, -1, -1],
    incubatorType: [-1, -1, -1, -1],
  },
  national: {
    name: ["Startup India Seed Fund"],
    type: [1],
    owner: [-1],
    sector: [0],
    support: [0],
  },
};

const atlas = decodeEntityAtlas(structuredClone(payload));

const filterOf = (facet: keyof EntityFilter, ...values: number[]): EntityFilter => ({
  [facet]: new Set(values),
});

/**
 * Which records survive a filter, ascending. Cluster order is by count (asserted separately), so a
 * filter test that reads records in cluster order would be asserting the draw order too.
 */
const survivors = (filter: EntityFilter) =>
  clusterEntities(atlas, filter)
    .flatMap(cluster => cluster.records)
    .sort((a, b) => a - b);

describe("decodeEntityAtlas", () => {
  it("rejects a payload that is not columnar", () => {
    expect(() => decodeEntityAtlas({ layout: "geojson" })).toThrow(/columnar/);
    expect(() => decodeEntityAtlas(null)).toThrow(/columnar/);
  });

  it("interleaves positions and keeps the per-record index", () => {
    expect(atlas.positions.length).toBe(6);
    expect(atlas.positions[0]).toBeCloseTo(77.5946, 3);
    expect(atlas.positions[1]).toBeCloseTo(12.9716, 3);
    expect(Array.from(atlas.positionOf)).toEqual([0, 0, 1, 2]);
  });

  it("represents an absent facet value as -1 rather than 0", () => {
    // 0 is a real dictionary index, so conflating the two would file every unlabelled record under
    // the first sector in the list.
    expect(atlas.facets.sector[3]).toBe(-1);
    expect(entityLabel(atlas, "sector", 3)).toBe("");
    expect(entityLabel(atlas, "sector", 0)).toBe("Deeptech");
  });

  it("keeps national records out of the plotted set", () => {
    expect(atlas.names).toHaveLength(4);
    expect(atlas.national.names).toEqual(["Startup India Seed Fund"]);
  });

  it("pads a short column to the record count instead of leaving holes", () => {
    const short = structuredClone(payload);
    short.points.host = [7];
    const decoded = decodeEntityAtlas(short);
    expect(Array.from(decoded.facets.host)).toEqual([7, -1, -1, -1]);
  });
});

describe("clusterEntities", () => {
  it("groups records that share an interned position", () => {
    const clusters = clusterEntities(atlas);
    expect(clusters).toHaveLength(3);
    const bengaluru = clusters.find(cluster => cluster.position === 0)!;
    expect(bengaluru.count).toBe(2);
    expect(bengaluru.records).toEqual([0, 1]);
    expect(bengaluru.lng).toBeCloseTo(77.5946, 3);
  });

  it("orders clusters smallest first so the busiest draws on top", () => {
    const counts = clusterEntities(atlas).map(cluster => cluster.count);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
  });

  it("reports the best precision present at a position", () => {
    const mixed = structuredClone(payload);
    // Put a state-level record on the Bengaluru position alongside the two city-level ones.
    mixed.points.name.push("Epsilon Policy");
    mixed.points.position.push(0);
    mixed.points.precision.push(2);
    for (const key of ["type", "owner", "sector", "stage", "support", "state", "place", "status", "host", "incubatorType"] as const)
      mixed.points[key].push(-1);
    const cluster = clusterEntities(decodeEntityAtlas(mixed)).find(item => item.position === 0)!;
    expect(cluster.count).toBe(3);
    expect(cluster.precision).toBe(0);
  });

  it("filters on one facet", () => {
    expect(survivors(filterOf("type", 0))).toEqual([0, 3]);
  });

  it("intersects across facets", () => {
    expect(survivors({ type: new Set([1]), sector: new Set([0]) })).toEqual([2]);
  });

  it("treats an empty facet set as no constraint", () => {
    expect(clusterEntities(atlas, { type: new Set() })).toHaveLength(3);
  });

  it("excludes records whose filtered facet is absent", () => {
    // Record 3 has sector -1; asking for any sector must not silently include it.
    expect(survivors(filterOf("sector", 0, 1))).toEqual([0, 1, 2]);
  });

  it("caps the record list but never the count", () => {
    const clusters = clusterEntities(atlas, {}, 1);
    const bengaluru = clusters.find(cluster => cluster.position === 0)!;
    expect(bengaluru.records).toHaveLength(1);
    expect(bengaluru.count).toBe(2);
  });
});

describe("facetCounts", () => {
  it("counts every present value and omits the empty ones", () => {
    expect(facetCounts(atlas, "type")).toEqual([
      { value: 0, label: "Incubator", count: 2 },
      { value: 1, label: "Programme", count: 2 },
    ]);
    expect(facetCounts(atlas, "stage")).toEqual([]);
  });

  it("counts a facet against the other facets, not against itself", () => {
    // Narrowing to type=Incubator must not change what the type list itself reports, or picking a
    // value would collapse its own list to that one option.
    const filter = filterOf("type", 0);
    expect(facetCounts(atlas, "type", filter)).toEqual([
      { value: 0, label: "Incubator", count: 2 },
      { value: 1, label: "Programme", count: 2 },
    ]);
    expect(facetCounts(atlas, "sector", filter)).toEqual([
      { value: 0, label: "Deeptech", count: 1 },
    ]);
  });

  it("orders by count then label", () => {
    const ordered = facetCounts(atlas, "place");
    expect(ordered.map(item => item.label)).toEqual(["Bengaluru", "Karnātaka", "Kerala"]);
  });
});

describe("searchEntities", () => {
  it("matches a case-insensitive substring", () => {
    expect(searchEntities(atlas, "incub")).toEqual([0]);
    expect(searchEntities(atlas, "PROGRAMME")).toEqual([1]);
  });

  it("ignores queries too short to be useful", () => {
    expect(searchEntities(atlas, "a")).toEqual([]);
    expect(searchEntities(atlas, " ")).toEqual([]);
  });

  it("folds diacritics in the query", () => {
    // The same folding the build script applies to place names, so "Karnataka" finds "Karnātaka".
    const withDiacritic = structuredClone(payload);
    withDiacritic.points.name[0] = "Karnātaka Innovation Cell";
    const decoded = decodeEntityAtlas(withDiacritic);
    expect(searchEntities(decoded, "karnataka")).toEqual([0]);
  });

  it("honours the limit", () => {
    expect(searchEntities(atlas, "e", 2).length).toBeLessThanOrEqual(2);
  });
});

describe("readEntityDetail", () => {
  const raw = {
    version: 1,
    points: {
      id: ["A-1"],
      url: ["https://example.gov.in/a"],
      website: [""],
      summary: ["Runs a deeptech cohort."],
      eligibility: [""],
      funding: [""],
      route: [""],
    },
    national: {
      id: ["N-1"],
      url: [""],
      website: [""],
      summary: [""],
      eligibility: [""],
      funding: [""],
      route: [""],
    },
  } as Parameters<typeof readEntityDetail>[0];

  it("reads a record by index", () => {
    expect(readEntityDetail(raw, 0).id).toBe("A-1");
    expect(readEntityDetail(raw, 0).summary).toBe("Runs a deeptech cohort.");
  });

  it("reads the national scope separately", () => {
    expect(readEntityDetail(raw, 0, "national").id).toBe("N-1");
  });

  it("returns empty strings for an index past the end rather than undefined", () => {
    const detail = readEntityDetail(raw, 99);
    expect(detail.summary).toBe("");
    expect(detail.url).toBe("");
  });
});
