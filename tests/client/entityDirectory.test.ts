import { describe, expect, it } from "vitest";

import { decodeEntityAtlas, type EntityFilter } from "../../client/src/lib/entityAtlas";
import {
  EMPTY_QUERY,
  countActiveFacetValues,
  countSharing,
  directoryFacetCounts,
  directoryQueryFromParams,
  directoryQueryToParams,
  directoryRowCount,
  foldText,
  isNationalRow,
  mappedRowCount,
  rowFacet,
  rowFacetLabel,
  rowLngLat,
  rowName,
  rowPosition,
  rowPrecision,
  rowRecord,
  rowRelationships,
  rowScope,
  selectDirectoryRows,
  toggleFacetValue,
  type DirectoryQuery,
} from "../../client/src/lib/entityDirectory";

/**
 * Eleven records with the four properties that make the real corpus awkward to list.
 *
 * Rows 0–7 are plotted; rows 8–10 are pan-India, which is the half the map cannot show at all. The
 * national block carries only `type`, `sector` and `support` — the build script omits a column when
 * every pan-India record leaves it blank — so `state`, `place`, `host` and `owner` are *missing
 * columns* rather than -1 entries, and reading them must not resolve to dictionary index 0. One
 * name carries a diacritic, several facet values are absent, and "Kochi" appears as a name prefix,
 * a name substring and a place label so search ranking has something to separate.
 *
 *   row name                     pos prec type owner sector state place host support status incType
 *   0   Alpha Incubator           0   0    0    0     0      0     0     0    0       0      0
 *   1   Beta Accelerator          0   0    1    0     1      0     0     0    0       0      -
 *   2   Gamma Scheme              1   2    2    1     0      1     1     -    0       0      -
 *   3   delta programme           1   2    2    1     -      1     1     -    1       0      -
 *   4   Épsilon Lab               2   1    0    0     0      0     2     1    0       0      0
 *   5   Zeta Works                2   1    1    -     1      0     2     0    1       0      -
 *   6   Kochi Marine Cluster      1   0    0    1     1      1     1     -    0       0      -
 *   7   Greater Kochi Ventures    1   0    1    1     0      1     1     1    0       0      -
 *   8   Startup India Seed Fund   -   3    2    -     0      -     -     -    0       -      -
 *   9   National Deeptech Mission -   3    2    -     0      -     -     -    1       -      -
 *   10  Alpha National Grant      -   3    2    -     -      -     -     -    0       -      -
 */
const payload = {
  version: 1,
  layout: "columnar",
  source: "fixture",
  sourceRecords: 11,
  precisions: ["point_city", "poly_district", "poly_state", "national", "unplaceable"],
  bounds: [76.2, 9.9, 77.6, 15.3],
  counts: {
    points: 8,
    positions: 3,
    national: 3,
    byPrecision: {
      point_city: 4,
      poly_district: 2,
      poly_state: 2,
      national: 3,
      unplaceable: 0,
    },
  },
  dictionaries: {
    type: ["Incubator", "Accelerator", "Scheme"],
    owner: ["NSRCEL", "Kerala Startup Mission"],
    sector: ["Deeptech", "Agritech"],
    stage: [],
    support: ["Grant", "Equity"],
    state: ["karnataka", "kerala"],
    place: ["Bengaluru", "Kochi", "Karnātaka"],
    status: ["Active"],
    host: ["IIM Bangalore", "IIT Madras"],
    incubatorType: ["Academic"],
  },
  positions: { lng: [77.5946, 76.2673, 76.9], lat: [12.9716, 9.9312, 15.3] },
  points: {
    name: [
      "Alpha Incubator",
      "Beta Accelerator",
      "Gamma Scheme",
      "delta programme",
      "Épsilon Lab",
      "Zeta Works",
      "Kochi Marine Cluster",
      "Greater Kochi Ventures",
    ],
    position: [0, 0, 1, 1, 2, 2, 1, 1],
    precision: [0, 0, 2, 2, 1, 1, 0, 0],
    type: [0, 1, 2, 2, 0, 1, 0, 1],
    owner: [0, 0, 1, 1, 0, -1, 1, 1],
    sector: [0, 1, 0, -1, 0, 1, 1, 0],
    stage: [-1, -1, -1, -1, -1, -1, -1, -1],
    support: [0, 0, 0, 1, 0, 1, 0, 0],
    state: [0, 0, 1, 1, 0, 0, 1, 1],
    place: [0, 0, 1, 1, 2, 2, 1, 1],
    status: [0, 0, 0, 0, 0, 0, 0, 0],
    host: [0, 0, -1, -1, 1, 0, -1, 1],
    incubatorType: [0, -1, -1, -1, 0, -1, -1, -1],
  },
  national: {
    name: ["Startup India Seed Fund", "National Deeptech Mission", "Alpha National Grant"],
    type: [2, 2, 2],
    sector: [0, 0, -1],
    support: [0, 1, 0],
  },
};

const atlas = decodeEntityAtlas(structuredClone(payload));

const query = (over: Partial<DirectoryQuery> = {}): DirectoryQuery => ({ ...EMPTY_QUERY, ...over });

const rowsOf = (over: Partial<DirectoryQuery> = {}) =>
  Array.from(selectDirectoryRows(atlas, query(over)).rows);

describe("directory row addressing", () => {
  it("spans both halves of the corpus in one index space", () => {
    // The whole point of the flat index: the 3 pan-India records are addressable, where the map's
    // position-keyed view drops them because they have no coordinate to plot.
    expect(mappedRowCount(atlas)).toBe(8);
    expect(directoryRowCount(atlas)).toBe(11);
    expect(isNationalRow(atlas, 7)).toBe(false);
    expect(isNationalRow(atlas, 8)).toBe(true);
    expect(rowScope(atlas, 8)).toBe("national");
    expect(rowRecord(atlas, 9)).toBe(1);
    expect(rowName(atlas, 9)).toBe("National Deeptech Mission");
    expect(rowName(atlas, 4)).toBe("Épsilon Lab");
  });

  it("reads a facet column the national block omits as absent, not as index 0", () => {
    // `atlas.national.facets.host` does not exist. Returning 0 here would file every pan-India
    // programme under "IIM Bangalore" and under "karnataka", inventing relationships wholesale.
    expect(atlas.national.facets.host).toBeUndefined();
    expect(rowFacet(atlas, 8, "host")).toBe(-1);
    expect(rowFacetLabel(atlas, 8, "host")).toBe("");
    expect(rowFacetLabel(atlas, 8, "state")).toBe("");
    expect(rowFacet(atlas, 8, "type")).toBe(2);
    expect(rowFacetLabel(atlas, 8, "type")).toBe("Scheme");
  });

  it("calls a pan-India record national, not unplaceable, and gives it no coordinate", () => {
    // 3 is the payload's own index for "national"; hardcoding it would break silently if the build
    // script reorders `PRECISIONS`, and calling it 4 would report real programmes as unplaceable.
    expect(atlas.precisions[3]).toBe("national");
    expect(rowPrecision(atlas, 8)).toBe(3);
    expect(rowPrecision(atlas, 2)).toBe(2);
    expect(rowPosition(atlas, 8)).toBe(-1);
    expect(rowLngLat(atlas, 8)).toBeNull();
    expect(rowLngLat(atlas, 0)?.[0]).toBeCloseTo(77.5946, 3);
    expect(rowLngLat(atlas, 0)?.[1]).toBeCloseTo(12.9716, 3);
  });
});

describe("directory search", () => {
  it("finds pan-India records, which the map's own search cannot reach", () => {
    expect(rowsOf({ text: "alpha" })).toEqual([0, 10]);
  });

  it("ranks a name prefix above a name substring above a related facet", () => {
    // "Kochi" is row 6's first word, row 7's second, and the `place` label on rows 2, 3, 6 and 7.
    // Rows 3 and 2 tie at the related rank and resolve by name — "delta" before "gamma" — which is
    // what keeps the list stable rather than in build order.
    expect(rowsOf({ text: "kochi" })).toEqual([6, 7, 3, 2]);
  });

  it("matches a host institute or a state, not only a record name", () => {
    // Someone typing "IIM Bangalore" is naming a relationship. No record is called that.
    expect(rowsOf({ text: "iim bangalore" })).toEqual([0, 1, 5]);
    expect(rowsOf({ text: "kerala startup mission" })).toEqual([3, 2, 7, 6]);
  });

  it("folds diacritics in both the query and the data", () => {
    expect(foldText("Épsilon Lab")).toBe("epsilon lab");
    expect(rowsOf({ text: "epsilon" })).toEqual([4]);
    expect(rowsOf({ text: "Épsilon" })).toEqual([4]);
    // The place dictionary holds "Karnātaka"; typing it without the macron must still match.
    expect(rowsOf({ text: "karnataka" })).toEqual([0, 1, 4, 5]);
  });

  it("treats one character as no query rather than as a match against everything", () => {
    // A single letter matches most of the corpus and costs a full sort to say so.
    expect(rowsOf({ text: "a" })).toHaveLength(11);
    expect(rowsOf({ text: "  " })).toHaveLength(11);
  });

  it("reports matches per half of the corpus regardless of the scope being shown", () => {
    // The scope tabs are labelled from these, so they have to count what the *other* tab would
    // show, not what the current one does.
    const all = selectDirectoryRows(atlas, query({ text: "alpha" }));
    expect([all.mappedMatches, all.nationalMatches]).toEqual([1, 1]);
    const mapped = selectDirectoryRows(atlas, query({ text: "alpha", scope: "mapped" }));
    expect(Array.from(mapped.rows)).toEqual([0]);
    expect([mapped.mappedMatches, mapped.nationalMatches]).toEqual([1, 1]);
    const national = selectDirectoryRows(atlas, query({ text: "alpha", scope: "national" }));
    expect(Array.from(national.rows)).toEqual([10]);
    expect([national.mappedMatches, national.nationalMatches]).toEqual([1, 1]);
  });
});

describe("directory filters", () => {
  it("keeps only rows carrying the chosen value, and never an absent one", () => {
    // With no query every row ties on relevance, so the order below is the name tiebreak.
    expect(rowsOf({ filter: { type: new Set([0]) } })).toEqual([0, 4, 6]);
    // Row 10 has sector -1 and must be absent. Treating -1 as a value would file every unlabelled
    // record under the first sector in the dictionary.
    expect(rowsOf({ filter: { sector: new Set([0]) } })).toEqual([0, 4, 2, 7, 9, 8]);
  });

  it("intersects facets rather than unioning them", () => {
    const filter: EntityFilter = { state: new Set([1]), type: new Set([2]) };
    expect(rowsOf({ filter })).toEqual([3, 2]);
  });

  it("treats several values of one facet as a union", () => {
    expect(rowsOf({ filter: { type: new Set([0, 1]) } })).toEqual([0, 1, 4, 7, 6, 5]);
  });
});

describe("directory ordering", () => {
  it("sorts by name", () => {
    expect(rowsOf({ sort: "name" })).toEqual([0, 10, 1, 3, 4, 2, 7, 6, 9, 8, 5]);
    expect(rowsOf({ sort: "name", descending: true })).toEqual([5, 8, 9, 6, 7, 2, 4, 3, 1, 10, 0]);
  });

  it("collates a facet by its label, not by its dictionary index", () => {
    // `owner` index 0 is "NSRCEL" and index 1 is "Kerala Startup Mission", so an index sort would
    // put NSRCEL first. Ascending by owner has to start with Kerala.
    const ascending = rowsOf({ sort: "owner" });
    expect(rowFacetLabel(atlas, ascending[0]!, "owner")).toBe("Kerala Startup Mission");
    expect(ascending).toEqual([3, 2, 7, 6, 0, 1, 4, 10, 9, 8, 5]);
  });

  it("leaves rows with no value last in both directions", () => {
    // Reversing the order must not parade blanks to the top: "unknown host" is not the last host
    // alphabetically, it is the absence of one, and it belongs at the end either way.
    const ascending = rowsOf({ sort: "host" });
    const descending = rowsOf({ sort: "host", descending: true });
    expect(ascending).toEqual([0, 1, 5, 4, 7, 10, 3, 2, 6, 9, 8]);
    expect(descending).toEqual([4, 7, 0, 1, 5, 10, 3, 2, 6, 9, 8]);
    // The five rows that have a host reverse; the six with none keep their place at the end.
    expect(ascending.slice(5)).toEqual(descending.slice(5));
    for (const row of ascending.slice(5)) expect(rowFacet(atlas, row, "host")).toBe(-1);
  });

  it("sorts by precision, with pan-India records after every located one", () => {
    expect(rowsOf({ sort: "precision" })).toEqual([0, 1, 7, 6, 4, 5, 3, 2, 10, 9, 8]);
    expect(rowsOf({ sort: "precision", descending: true })).toEqual([
      10, 9, 8, 3, 2, 4, 5, 0, 1, 7, 6,
    ]);
  });

  it("falls back to name order when nothing distinguishes two rows", () => {
    // Relevance with no query ties every row, so this is the default listing and it has to be
    // readable rather than in whatever order the build script emitted.
    expect(rowsOf()).toEqual(rowsOf({ sort: "name" }));
  });
});

describe("directory facet counts", () => {
  it("counts a facet against the other filters but not against itself", () => {
    // Counting `state` against its own filter would leave the chosen value showing its own count and
    // every alternative at zero, so a filter panel could never be widened once narrowed.
    const states = directoryFacetCounts(atlas, "state", query({ filter: { state: new Set([1]) } }));
    expect(states).toEqual([
      { value: 0, label: "karnataka", count: 4 },
      { value: 1, label: "kerala", count: 4 },
    ]);
    const types = directoryFacetCounts(atlas, "type", query({ filter: { state: new Set([1]) } }));
    expect(types).toEqual([
      { value: 2, label: "Scheme", count: 2 },
      { value: 1, label: "Accelerator", count: 1 },
      { value: 0, label: "Incubator", count: 1 },
    ]);
  });

  it("counts against the query and the scope, so a chip's number predicts what clicking shows", () => {
    expect(directoryFacetCounts(atlas, "type", query({ scope: "national" }))).toEqual([
      { value: 2, label: "Scheme", count: 3 },
    ]);
    expect(directoryFacetCounts(atlas, "place", query({ text: "kochi" }))).toEqual([
      { value: 1, label: "Kochi", count: 4 },
    ]);
  });

  it("omits values no surviving row carries rather than listing them at zero", () => {
    const places = directoryFacetCounts(atlas, "place", query({ filter: { state: new Set([0]) } }));
    expect(places.map(entry => entry.label)).toEqual(["Bengaluru", "Karnātaka"]);
  });
});

describe("directory relationships", () => {
  it("counts a shared value across the corpus, ignoring the active filter", () => {
    // "IIM Bangalore runs 3 of these" is a fact about the data. Reporting it as 1 because a sector
    // filter happens to be on would misdescribe the relationship the reader is about to follow.
    expect(countSharing(atlas, "host", 0)).toBe(3);
    expect(countSharing(atlas, "status", 0)).toBe(8);
    expect(countSharing(atlas, "sector", 0)).toBe(6);
    expect(countSharing(atlas, "host", -1)).toBe(0);
  });

  it("lists a row's own values as relationships, busiest first, skipping the absent ones", () => {
    const relationships = rowRelationships(atlas, 0);
    expect(relationships.map(entry => entry.facet)).toEqual([
      "support",
      "status",
      "sector",
      "state",
      "type",
      "owner",
      "host",
      "place",
      "incubatorType",
    ]);
    // `stage` is empty for every record in the fixture, so it is not a relationship this row has.
    expect(relationships.some(entry => entry.facet === "stage")).toBe(false);
    expect(relationships.every(entry => entry.value >= 0)).toBe(true);
    expect(relationships.find(entry => entry.facet === "host")).toEqual({
      facet: "host",
      value: 0,
      label: "IIM Bangalore",
      shared: 3,
    });
    // A value only this row carries reads as 1, which is how the UI knows not to offer a pivot.
    expect(relationships.find(entry => entry.facet === "place")?.shared).toBe(2);
  });

  it("reports a pan-India record's relationships from the columns it actually has", () => {
    expect(rowRelationships(atlas, 8).map(entry => entry.facet)).toEqual([
      "support",
      "sector",
      "type",
    ]);
  });
});

describe("directory filter editing", () => {
  it("adds then removes a value, dropping the key rather than keeping an empty set", () => {
    const once = toggleFacetValue({}, "type", 1);
    expect(once.type).toEqual(new Set([1]));
    const twice = toggleFacetValue(once, "type", 1);
    expect("type" in twice).toBe(false);
    // The input is not mutated; React state depends on it.
    expect(once.type).toEqual(new Set([1]));
  });

  it("counts chosen values, not chosen facets, and ignores an empty set", () => {
    expect(countActiveFacetValues({ type: new Set([0, 1]), state: new Set([1]) })).toBe(3);
    expect(countActiveFacetValues({ type: new Set() })).toBe(0);
    expect(countActiveFacetValues({})).toBe(0);
  });
});

describe("directory URL state", () => {
  const shared = query({
    text: "kochi",
    scope: "mapped",
    sort: "host",
    descending: true,
    filter: { state: new Set([1]), host: new Set([0]) },
  });

  it("writes only what differs from the default", () => {
    expect(directoryQueryToParams(atlas, EMPTY_QUERY).toString()).toBe("");
    expect(directoryQueryToParams(atlas, shared).toString()).toBe(
      "q=kochi&scope=mapped&sort=host&desc=1&f.state=kerala&f.host=IIM+Bangalore"
    );
  });

  it("round-trips", () => {
    expect(directoryQueryFromParams(atlas, directoryQueryToParams(atlas, shared))).toEqual(shared);
  });

  it("survives a rebuild that renumbers the dictionaries", () => {
    // Dictionary indices are assigned in whatever order the build script met the values, so a link
    // keyed on them points at a different institute after the next data refresh. This is the whole
    // reason the query string carries labels.
    const drifted = structuredClone(payload);
    drifted.dictionaries.host = ["IIT Madras", "IIM Bangalore"];
    drifted.points.host = [1, 1, -1, -1, 0, 1, -1, 0];
    const rebuilt = decodeEntityAtlas(drifted);
    const resolved = directoryQueryFromParams(rebuilt, new URLSearchParams("f.host=IIM+Bangalore"));
    expect(resolved.filter.host).toEqual(new Set([1]));
    expect(Array.from(selectDirectoryRows(rebuilt, resolved).rows)).toEqual([0, 1, 5]);
  });

  it("matches a label case- and diacritic-insensitively", () => {
    expect(
      directoryQueryFromParams(atlas, new URLSearchParams("f.state=Kerala")).filter.state
    ).toEqual(new Set([1]));
    expect(
      directoryQueryFromParams(atlas, new URLSearchParams("f.place=karnataka")).filter.place
    ).toEqual(new Set([2]));
  });

  it("drops a value the current build no longer has instead of guessing an index", () => {
    const resolved = directoryQueryFromParams(atlas, new URLSearchParams("f.state=atlantis"));
    expect(resolved.filter.state).toBeUndefined();
    expect(Array.from(selectDirectoryRows(atlas, resolved).rows)).toHaveLength(11);
  });

  it("falls back to the defaults for an unknown sort or scope", () => {
    const resolved = directoryQueryFromParams(atlas, new URLSearchParams("sort=colour&scope=moon"));
    expect(resolved.sort).toBe("relevance");
    expect(resolved.scope).toBe("all");
  });

  it("reads the text, sort and scope before the atlas has loaded", () => {
    // The page can restore its controls from the URL on first paint and resolve the facet labels
    // once the payload lands, rather than blocking the whole toolbar on a 1.3 MB fetch.
    const resolved = directoryQueryFromParams(null, directoryQueryToParams(atlas, shared));
    expect(resolved.text).toBe("kochi");
    expect(resolved.sort).toBe("host");
    expect(resolved.scope).toBe("mapped");
    expect(resolved.descending).toBe(true);
    expect(resolved.filter).toEqual({});
  });
});

