/**
 * Reader for the columnar entity atlas emitted by `scripts/build_entity_atlas.mjs`.
 *
 * The format is columnar rather than GeoJSON for two reasons that both matter at the scale this is
 * built for. Bytes: the same 11,370 records cost 1.28 MB here against several times that as a
 * FeatureCollection, and 191 KB brotli against the project's 250 KB first-view budget. Shape: every
 * categorical value is already a dictionary index, so a filter is an integer compare over a typed
 * array and a colour is a lookup — no per-feature object is ever allocated, which is what keeps a
 * filter pass off the garbage collector when the row count grows by two orders of magnitude.
 *
 * Positions are interned. Measured on the current source: 11,370 records resolve to 366 distinct
 * coordinates, because a state-level programme lands on its state's centroid and a city-level one
 * on its city's. Rendering one marker per record would stack roughly 4,000 of them on single pixels
 * and claim a precision the data does not have, so the map renders one marker per *position* sized
 * by how many records sit there, and the records themselves are listed on selection.
 */

export const ENTITY_ATLAS_URL = "/data/atlas-entities-india.json";
export const ENTITY_ATLAS_DETAIL_URL = "/data/atlas-entities-india-detail.json";

/** Mirrors `PRECISIONS` in the build script; index order is part of the file format. */
export type EntityPrecision =
  | "point_city"
  | "poly_district"
  | "poly_state"
  | "national"
  | "unplaceable";

/** The categorical columns, each an index into the same-named dictionary. */
export const ENTITY_FACETS = [
  "type",
  "owner",
  "sector",
  "stage",
  "support",
  "state",
  "place",
  "status",
  "host",
  "incubatorType",
] as const;

export type EntityFacet = (typeof ENTITY_FACETS)[number];

type RawColumns = Record<string, number[]>;

type RawPayload = {
  version: number;
  layout: string;
  source: string;
  sourceRecords: number;
  precisions: EntityPrecision[];
  bounds: [number, number, number, number];
  counts: {
    points: number;
    positions: number;
    national: number;
    byPrecision: Record<EntityPrecision, number>;
  };
  dictionaries: Record<string, string[]>;
  positions: { lng: number[]; lat: number[] };
  points: RawColumns & { name: string[] };
  national: RawColumns & { name: string[] };
};

export type EntityAtlas = {
  version: number;
  source: string;
  /** Records in the source CSV, including the ones that did not resolve to any place. */
  sourceRecords: number;
  bounds: [number, number, number, number];
  precisions: EntityPrecision[];
  counts: RawPayload["counts"];
  /** Interned coordinates, `[lng, lat]` interleaved, one pair per distinct position. */
  positions: Float32Array;
  /** Per-record: which interned position it sits on. */
  positionOf: Int32Array;
  names: string[];
  precisionOf: Uint8Array;
  facets: Record<EntityFacet, Int32Array>;
  dictionaries: Record<string, string[]>;
  /** Pan-India programmes: real records with no honest coordinate. Listed, never plotted. */
  national: { names: string[]; facets: Partial<Record<EntityFacet, Int32Array>> };
};

const asInt32 = (values: number[] | undefined, length: number) => {
  const out = new Int32Array(length).fill(-1);
  if (values) for (let i = 0; i < Math.min(length, values.length); i += 1) out[i] = values[i] ?? -1;
  return out;
};

export function decodeEntityAtlas(raw: unknown): EntityAtlas {
  const payload = raw as RawPayload;
  // Name both sides: if the build script ever regresses to emitting GeoJSON, the message says so
  // rather than leaving a bare "unexpected layout" to be traced back by hand.
  if (!payload || payload.layout !== "columnar")
    throw new Error(
      `entity atlas: expected a columnar payload, got ${JSON.stringify(payload?.layout ?? null)}`
    );
  const positionCount = payload.positions?.lng?.length ?? 0;
  const positions = new Float32Array(positionCount * 2);
  for (let i = 0; i < positionCount; i += 1) {
    positions[i * 2] = payload.positions.lng[i] ?? 0;
    positions[i * 2 + 1] = payload.positions.lat[i] ?? 0;
  }
  const names = payload.points?.name ?? [];
  const count = names.length;
  const facets = {} as Record<EntityFacet, Int32Array>;
  for (const facet of ENTITY_FACETS) facets[facet] = asInt32(payload.points?.[facet], count);
  const nationalNames = payload.national?.name ?? [];
  const nationalFacets: Partial<Record<EntityFacet, Int32Array>> = {};
  for (const facet of ENTITY_FACETS)
    if (payload.national?.[facet])
      nationalFacets[facet] = asInt32(payload.national[facet], nationalNames.length);

  return {
    version: payload.version,
    source: payload.source,
    sourceRecords: payload.sourceRecords,
    bounds: payload.bounds,
    precisions: payload.precisions,
    counts: payload.counts,
    positions,
    positionOf: asInt32(payload.points?.position, count),
    names,
    precisionOf: Uint8Array.from(payload.points?.precision ?? []),
    facets,
    dictionaries: payload.dictionaries ?? {},
    national: { names: nationalNames, facets: nationalFacets },
  };
}

let atlasPromise: Promise<EntityAtlas> | null = null;

/** Fetched once per page; the map, the filters, and search all read the same decoded atlas. */
export function loadEntityAtlas(signal?: AbortSignal): Promise<EntityAtlas> {
  if (!atlasPromise) {
    atlasPromise = fetch(ENTITY_ATLAS_URL, { signal })
      .then(response => {
        if (!response.ok) throw new Error(`entity atlas: HTTP ${response.status}`);
        return response.json();
      })
      .then(decodeEntityAtlas)
      .catch(error => {
        // A failed load must not poison every later attempt, or one flaky request permanently
        // removes the layer for the session.
        atlasPromise = null;
        throw error;
      });
  }
  return atlasPromise;
}

/** A facet filter: for each facet, the dictionary indices to keep. Empty or absent means "all". */
export type EntityFilter = Partial<Record<EntityFacet, ReadonlySet<number>>>;

export type EntityCluster = {
  /** Index into `atlas.positions` pairs. */
  position: number;
  lng: number;
  lat: number;
  count: number;
  /** Best precision present at this position, so the marker can be honest about it. */
  precision: number;
  /** Record indices at this position, ascending. Capped for the panel, `count` is the true total. */
  records: number[];
};

const CLUSTER_RECORD_CAP = 200;

/**
 * Groups matching records by interned position.
 *
 * This is a single pass over Int32Array columns with no allocation per record, which is why it can
 * stay on the main thread: 11,370 rows is microseconds, and the same loop over a million rows is a
 * few milliseconds — still inside one frame, and trivially movable into a worker if that changes.
 * The `records` list is capped because a detail panel cannot show 4,541 rows anyway; `count` is
 * always the untruncated total so the marker size and the legend never lie.
 */
export function clusterEntities(
  atlas: EntityAtlas,
  filter: EntityFilter = {},
  recordCap = CLUSTER_RECORD_CAP
): EntityCluster[] {
  const active = ENTITY_FACETS.filter(facet => {
    const allowed = filter[facet];
    return allowed && allowed.size > 0;
  });
  const byPosition = new Map<number, EntityCluster>();
  const total = atlas.names.length;
  for (let record = 0; record < total; record += 1) {
    let keep = true;
    for (const facet of active) {
      const value = atlas.facets[facet][record];
      if (value < 0 || !filter[facet]!.has(value)) {
        keep = false;
        break;
      }
    }
    if (!keep) continue;
    const position = atlas.positionOf[record];
    if (position < 0) continue;
    const precision = atlas.precisionOf[record] ?? 0;
    const held = byPosition.get(position);
    if (held) {
      held.count += 1;
      if (precision < held.precision) held.precision = precision;
      if (held.records.length < recordCap) held.records.push(record);
      continue;
    }
    byPosition.set(position, {
      position,
      lng: atlas.positions[position * 2],
      lat: atlas.positions[position * 2 + 1],
      count: 1,
      precision,
      records: [record],
    });
  }
  // Largest last so MapLibre draws the busiest marker on top; symbol-sort-key handles labels.
  return Array.from(byPosition.values()).sort((a, b) => a.count - b.count);
}

/**
 * Every value of a facet that survives the *other* facets' filters, with its count.
 *
 * Counting against the other facets rather than against all of them is what makes a filter panel
 * usable: after picking a state, the sector list shows how many records that state actually has per
 * sector, and options that would yield nothing are visibly zero instead of silently dead.
 */
export function facetCounts(
  atlas: EntityAtlas,
  facet: EntityFacet,
  filter: EntityFilter = {}
): { value: number; label: string; count: number }[] {
  const others = ENTITY_FACETS.filter(other => {
    if (other === facet) return false;
    const allowed = filter[other];
    return allowed && allowed.size > 0;
  });
  const labels = atlas.dictionaries[facet] ?? [];
  const counts = new Int32Array(labels.length);
  const column = atlas.facets[facet];
  const total = atlas.names.length;
  for (let record = 0; record < total; record += 1) {
    let keep = true;
    for (const other of others) {
      const value = atlas.facets[other][record];
      if (value < 0 || !filter[other]!.has(value)) {
        keep = false;
        break;
      }
    }
    if (!keep) continue;
    const value = column[record];
    if (value >= 0) counts[value] += 1;
  }
  const out: { value: number; label: string; count: number }[] = [];
  for (let value = 0; value < labels.length; value += 1)
    if (counts[value] > 0) out.push({ value, label: labels[value]!, count: counts[value] });
  return out.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Substring search over record names, folded the same way the build script folds place names. */
export function searchEntities(atlas: EntityAtlas, query: string, limit = 40): number[] {
  const needle = query
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  if (needle.length < 2) return [];
  const hits: number[] = [];
  for (let record = 0; record < atlas.names.length && hits.length < limit; record += 1) {
    const name = atlas.names[record];
    if (!name) continue;
    if (
      name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .includes(needle)
    )
      hits.push(record);
  }
  return hits;
}

export const entityLabel = (atlas: EntityAtlas, facet: EntityFacet, record: number) => {
  const value = atlas.facets[facet]?.[record] ?? -1;
  return value < 0 ? "" : (atlas.dictionaries[facet]?.[value] ?? "");
};

export type EntityDetail = {
  id: string;
  url: string;
  website: string;
  summary: string;
  eligibility: string;
  funding: string;
  route: string;
};

type RawDetail = {
  version: number;
  points: Record<keyof EntityDetail, string[]>;
  national: Record<keyof EntityDetail, string[]>;
};

const DETAIL_KEYS: (keyof EntityDetail)[] = [
  "id",
  "url",
  "website",
  "summary",
  "eligibility",
  "funding",
  "route",
];

let detailPromise: Promise<RawDetail> | null = null;

/**
 * The prose and the links, index-aligned with the atlas. Held in a second file because the map
 * never reads any of it: keeping it out of the first payload is what takes the map layer from
 * 2.6 MB to 1.28 MB, and it is only ever fetched once a user selects something.
 */
export function loadEntityDetail(signal?: AbortSignal): Promise<RawDetail> {
  if (!detailPromise) {
    detailPromise = fetch(ENTITY_ATLAS_DETAIL_URL, { signal })
      .then(response => {
        if (!response.ok) throw new Error(`entity detail: HTTP ${response.status}`);
        return response.json() as Promise<RawDetail>;
      })
      .catch(error => {
        detailPromise = null;
        throw error;
      });
  }
  return detailPromise;
}

export function readEntityDetail(
  raw: RawDetail,
  record: number,
  scope: "points" | "national" = "points"
): EntityDetail {
  const columns = raw?.[scope];
  const detail = {} as EntityDetail;
  for (const key of DETAIL_KEYS) detail[key] = columns?.[key]?.[record] ?? "";
  return detail;
}


