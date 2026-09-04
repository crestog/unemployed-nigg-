/**
 * Builds the India startup-ecosystem entity layer from the master inventory CSV.
 *
 * Why this exists as a build step rather than a client-side transform: the inventory has no
 * latitude/longitude column at all — placement has to be resolved against a gazetteer, and the
 * gazetteer needed (6,231 localities, 36 states, 728 districts) is the 12 MB
 * `world-india-geography.json` already committed for the India tile layer. Doing that resolution
 * in the browser would mean shipping the CSV *and* paying the join on every page load. Doing it
 * here means the client fetches one small columnar file.
 *
 * Placement is a cascade, best precision first:
 *   point_city    exact locality match in the GeoNames-derived gazetteer -> a real point
 *   poly_district city column names a district -> district centroid, flagged as approximate
 *   poly_state    state column resolves -> state centroid, flagged as approximate
 *   national      explicitly pan-India -> no coordinate, belongs in a legend, not on the map
 *   unplaceable   nothing resolved
 *
 * Two non-obvious correctness requirements, both of which produced wrong output when missed:
 *
 * 1. The gazetteer stores names with macron diacritics (`Karnātaka`, `Mahārāshtra`, `Tamil Nādu`).
 *    An ASCII-only normaliser turns `Karnātaka` into `karn taka` and matches nothing, which
 *    resolved 1,074 records instead of 6,799 — a 6x undercount that reads as sparse source data
 *    rather than as a bug. Normalisation must decompose to NFD and strip the combining range.
 *
 * 2. Aliases run colloquial -> official, because the gazetteer holds the official modern name.
 *    Mapping `bengaluru -> bangalore` is backwards and silently drops ~500 rows.
 *
 * Privacy: `email`, `telephone`, and `mobile` exist in the source and are deliberately NOT
 * emitted. The inventory's own methodology excludes personal contact data from publication; the
 * columns are present for the operator's verification workflow only.
 *
 * Usage:
 *   node scripts/build_entity_atlas.mjs --source <dir-with-india_ecosystem_master.csv>
 *   ATLAS_ENTITY_SOURCE=<dir> node scripts/build_entity_atlas.mjs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync } from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const GAZETTEER = join(REPO, "client/public/data/world-india-geography.json");
const OUT = join(REPO, "client/public/data/atlas-entities-india.json");
const MASTER_CSV = "india_ecosystem_master.csv";

const argSource = (() => {
  const flag = process.argv.indexOf("--source");
  if (flag !== -1 && process.argv[flag + 1]) return process.argv[flag + 1];
  return process.env.ATLAS_ENTITY_SOURCE || "";
})();

/** Decompose, drop combining marks, fold to a bare lowercase word sequence. */
export const normalise = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * RFC 4180 CSV. The source has quoted fields containing commas, newlines, and doubled quotes, so
 * a split(",") parser silently shreds it — the summary and eligibility columns are prose.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (char !== "\r") field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Colloquial -> official. The gazetteer holds the official modern name, so this direction is
 * load-bearing; reversing any entry silently drops every row using the colloquial form.
 */
export const CITY_ALIASES = {
  allahabad: "prayagraj",
  bangalore: "bengaluru",
  bombay: "mumbai",
  calcutta: "kolkata",
  baroda: "vadodara",
  ernakulam: "kochi",
  gauhati: "guwahati",
  gurgaon: "gurugram",
  "kochi ernakulam": "kochi",
  madras: "chennai",
  mysore: "mysuru",
  pondicherry: "puducherry",
  trichy: "tiruchirappalli",
  trivandrum: "thiruvananthapuram",
  vizag: "visakhapatnam",
  waltair: "visakhapatnam",
};

export const STATE_ALIASES = {
  orissa: "odisha",
  "nct of delhi": "delhi",
  "national capital territory of delhi": "delhi",
  "delhi ncr": "delhi",
  ncr: "delhi",
  "dadra and nagar haveli and daman and diu": "dadra and nagar haveli",
  pondicherry: "puducherry",
  uttaranchal: "uttarakhand",
  // Source-side misspellings and short forms found by the unresolved report. Each of these was a
  // real place losing its marker entirely.
  "andaman and nicobar": "andaman and nicobar islands",
  "andra pradesh": "andhra pradesh",
  jharkand: "jharkhand",
};

/** Placeholder values that mean "no location stated", not "a place called Unknown". */
const PLACEHOLDER =
  /^(unknown|india|statewide|pan.?india|all.?india|nationwide|multiple|various|n.?a|none|tbd|not (stated|specified|disclosed|available|applicable).*|.*not (separately stated|uniformly exposed).*|.*not stated.*)$/;

const NATIONAL = /pan.?india|all.?india|^india$|nationwide|national/;

/** Ring area by the shoelace formula; used only to pick the largest ring of a multipolygon. */
const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1)
    sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return Math.abs(sum / 2);
};

/**
 * Centroid of the largest ring. A true polygon centroid can land outside a concave boundary and a
 * bbox centre lands in the sea for coastal states, so this takes the vertex mean of the dominant
 * ring — good enough for a marker that is already flagged as approximate.
 */
export function polygonAnchor(geometry) {
  if (!geometry) return null;
  const polygons =
    geometry.type === "MultiPolygon"
      ? geometry.coordinates
      : geometry.type === "Polygon"
        ? [geometry.coordinates]
        : [];
  let best = null;
  let bestArea = -1;
  for (const polygon of polygons) {
    const outer = polygon?.[0];
    if (!Array.isArray(outer) || outer.length < 3) continue;
    const area = ringArea(outer);
    if (area > bestArea) {
      bestArea = area;
      best = outer;
    }
  }
  if (!best) return null;
  let lng = 0;
  let lat = 0;
  for (const point of best) {
    lng += point[0];
    lat += point[1];
  }
  return [lng / best.length, lat / best.length];
}

/** Builds the three lookup tables the cascade consults, keyed on the folded name. */
export function buildGazetteer(geography) {
  const localities = new Map();
  for (const record of geography.layers?.localities?.records ?? []) {
    for (const name of [record.name, record.asciiName]) {
      const key = normalise(name);
      if (!key) continue;
      // Several districts share a name with a village; keep the most populous so "Pune" is the
      // city rather than a hamlet.
      const held = localities.get(key);
      if (!held || (record.population ?? 0) > (held.population ?? 0))
        localities.set(key, record);
    }
  }
  const states = new Map();
  for (const feature of geography.layers?.adm1?.features ?? []) {
    const anchor = polygonAnchor(feature.geometry);
    if (anchor) states.set(normalise(feature.name), { feature, anchor });
  }
  const districts = new Map();
  for (const feature of geography.layers?.adm2?.features ?? []) {
    const anchor = polygonAnchor(feature.geometry);
    if (anchor) districts.set(normalise(feature.name), { feature, anchor });
  }
  return { localities, states, districts };
}

/**
 * One record's location, or null. Returns the coordinate plus how it was derived, because the UI
 * has to distinguish "this incubator is at this point" from "this scheme applies to this state" —
 * drawing the second as a pin is a lie about precision.
 */
export function placeRecord(record, gazetteer) {
  const city = normalise(record.city).replace(/\s*,.*$/, "").trim();
  const rawState = normalise(record.state).replace(/\s*,.*$/, "").trim();
  const state = STATE_ALIASES[rawState] ?? rawState;
  const geography = normalise(record.geography);

  const locality = matchLocality(city, gazetteer.localities);
  if (locality)
    return {
      precision: "point_city",
      lng: locality.longitude ?? locality.lng,
      lat: locality.latitude ?? locality.lat,
      state,
      place: locality.name,
    };

  const district = city && gazetteer.districts.get(city);
  if (district)
    return {
      precision: "poly_district",
      lng: district.anchor[0],
      lat: district.anchor[1],
      state,
      place: district.feature.name,
    };

  // The city column sometimes holds a state name ("Kerala"), so try it as a state before falling
  // through to the state column.
  for (const candidate of [STATE_ALIASES[city] ?? city, state]) {
    if (!candidate || PLACEHOLDER.test(candidate)) continue;
    const hit = gazetteer.states.get(candidate);
    if (hit)
      return {
        precision: "poly_state",
        lng: hit.anchor[0],
        lat: hit.anchor[1],
        state: candidate,
        place: hit.feature.name,
      };
  }

  if (NATIONAL.test(rawState) || NATIONAL.test(geography) || NATIONAL.test(city))
    return { precision: "national", lng: null, lat: null, state: "", place: "India" };

  return { precision: "unplaceable", lng: null, lat: null, state, place: "" };
}

/**
 * Exact fold, then alias, then the head and tail token. The token fallback is what resolves
 * "Bengaluru Urban", "Pune District", and "Kochi, Kerala" once the comma tail is stripped.
 */
function matchLocality(city, localities) {
  if (!city || city.length < 3 || PLACEHOLDER.test(city)) return null;
  const key = CITY_ALIASES[city] ?? city;
  const direct = localities.get(key);
  if (direct) return direct;
  const tokens = key.split(" ").filter((token) => token.length > 2);
  if (tokens.length < 2) return null;
  const tail = tokens[tokens.length - 1];
  return (
    localities.get(CITY_ALIASES[tail] ?? tail) ??
    localities.get(CITY_ALIASES[tokens[0]] ?? tokens[0]) ??
    null
  );
}

/**
 * Interns repeated strings so the emitted file stores a small integer per row. `sector_focus` has
 * 1,805 distinct values across 12,983 filled rows and `owner_or_nodal_body` only 511 across
 * 13,222, so this is most of the size win — and it is also the form a WebGL renderer wants, since
 * a category index can go straight into an attribute buffer.
 */
class Dictionary {
  constructor() {
    this.values = [];
    this.index = new Map();
  }
  /** Returns -1 for empty, so the client can test `< 0` rather than carrying nulls. */
  id(value) {
    const text = String(value ?? "").trim();
    if (!text) return -1;
    const held = this.index.get(text);
    if (held !== undefined) return held;
    const next = this.values.length;
    this.values.push(text);
    this.index.set(text, next);
    return next;
  }
}

/** 5 decimal places is ~1.1 m at the equator — far finer than a city centroid deserves. */
const round5 = (value) => Math.round(value * 1e5) / 1e5;

function main() {
  if (!argSource) {
    console.error(
      "build_entity_atlas: no source directory. Pass --source <dir> or set ATLAS_ENTITY_SOURCE.\n" +
        `Expected ${MASTER_CSV} inside it. The inventory CSV is not committed to this repo.`
    );
    process.exit(2);
  }
  const csvPath = join(resolve(argSource), MASTER_CSV);
  if (!existsSync(csvPath)) {
    console.error(`build_entity_atlas: ${csvPath} not found.`);
    process.exit(2);
  }
  if (!existsSync(GAZETTEER)) {
    console.error(`build_entity_atlas: gazetteer missing at ${GAZETTEER}.`);
    process.exit(2);
  }

  const gazetteer = buildGazetteer(JSON.parse(readFileSync(GAZETTEER, "utf8")));
  console.log(
    `gazetteer: ${gazetteer.localities.size} locality keys, ${gazetteer.states.size} states, ${gazetteer.districts.size} districts`
  );

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  // `\uFEFF` as an escape, not the literal character: a raw BOM in source is invisible to review and
  // reads as stray whitespace to every linter, while meaning exactly the same thing here.
  const header = (rows[0] ?? []).map((name) => name.replace(/^\uFEFF/, "").trim());
  const at = (name) => header.indexOf(name);
  const columns = {
    id: at("record_id"),
    name: at("record_name"),
    type: at("record_type"),
    owner: at("owner_or_nodal_body"),
    geography: at("geography"),
    state: at("state_or_ut"),
    city: at("city_or_region"),
    sector: at("sector_focus"),
    stage: at("startup_stage"),
    support: at("support_types"),
    summary: at("policy_or_support_summary"),
    eligibility: at("eligibility_summary"),
    funding: at("funding_or_terms"),
    route: at("application_or_access_route"),
    url: at("official_source_url"),
    status: at("activity_status"),
    host: at("host_institute"),
    incubatorType: at("incubator_type"),
    website: at("website"),
  };
  const missing = Object.entries(columns).filter(([, index]) => index < 0);
  if (missing.length) {
    console.error(
      `build_entity_atlas: source is missing expected columns: ${missing.map(([key]) => key).join(", ")}`
    );
    process.exit(2);
  }
  const records = rows.slice(1).filter((row) => row.length > 1 && row[columns.name]?.trim());
  console.log(`source: ${records.length} records, ${header.length} columns`);
  build(records, columns, gazetteer);
}

const PRECISIONS = ["point_city", "poly_district", "poly_state", "national", "unplaceable"];

function build(records, columns, gazetteer) {
  const dictionaries = {
    type: new Dictionary(),
    owner: new Dictionary(),
    sector: new Dictionary(),
    stage: new Dictionary(),
    support: new Dictionary(),
    state: new Dictionary(),
    place: new Dictionary(),
    status: new Dictionary(),
    host: new Dictionary(),
    incubatorType: new Dictionary(),
  };
  const point = {
    name: [],
    // Position is an index into a shared table, not a coordinate pair. Measured: 11,365 records
    // resolve to only 366 distinct coordinates, because a state-level programme lands on its state
    // centroid and a city-level one on its city centroid. Storing the pairs once cuts ~190 KB and,
    // more importantly, makes the collapse explicit — the renderer has to spread coincident
    // records deliberately instead of stacking 4,000 invisible markers on one pixel.
    position: [],
    precision: [],
    type: [],
    owner: [],
    sector: [],
    stage: [],
    support: [],
    state: [],
    place: [],
    status: [],
    host: [],
    incubatorType: [],
  };
  const positions = { lng: [], lat: [] };
  const positionIndex = new Map();
  /** Pan-India programmes have no honest coordinate; they get a list, not a marker. */
  const national = { name: [], type: [], owner: [], sector: [], support: [] };
  /**
   * Everything only needed once a record is selected. Split by access pattern rather than by
   * subject: `id`, `url` and `website` cost 1,044 KB raw in the map payload and the map never
   * reads any of them. Index-aligned with `point` / `national`.
   */
  const detail = { id: [], url: [], website: [], summary: [], eligibility: [], funding: [], route: [] };
  const nationalDetail = { id: [], url: [], website: [], summary: [], eligibility: [], funding: [], route: [] };
  const tally = Object.fromEntries(PRECISIONS.map((key) => [key, 0]));
  const unresolved = new Map();
  let bounds = [180, 90, -180, -90];

  const internPosition = (lng, lat) => {
    const key = `${lng},${lat}`;
    const held = positionIndex.get(key);
    if (held !== undefined) return held;
    const next = positions.lng.length;
    positions.lng.push(lng);
    positions.lat.push(lat);
    positionIndex.set(key, next);
    return next;
  };
  const pushDetail = (target, row) => {
    target.id.push(String(row[columns.id] ?? "").trim());
    target.url.push(String(row[columns.url] ?? "").trim());
    target.website.push(String(row[columns.website] ?? "").trim());
    target.summary.push(String(row[columns.summary] ?? "").trim());
    target.eligibility.push(String(row[columns.eligibility] ?? "").trim());
    target.funding.push(String(row[columns.funding] ?? "").trim());
    target.route.push(String(row[columns.route] ?? "").trim());
  };

  for (const row of records) {
    const record = {
      city: row[columns.city],
      state: row[columns.state],
      geography: row[columns.geography],
    };
    const placed = placeRecord(record, gazetteer);
    tally[placed.precision] += 1;
    const name = String(row[columns.name] ?? "").trim();

    if (placed.precision === "national") {
      national.name.push(name);
      national.type.push(dictionaries.type.id(row[columns.type]));
      national.owner.push(dictionaries.owner.id(row[columns.owner]));
      national.sector.push(dictionaries.sector.id(row[columns.sector]));
      national.support.push(dictionaries.support.id(row[columns.support]));
      pushDetail(nationalDetail, row);
      continue;
    }
    if (placed.precision === "unplaceable") {
      const key = normalise(record.city) || normalise(record.state) || "(blank)";
      unresolved.set(key, (unresolved.get(key) ?? 0) + 1);
      continue;
    }
    if (!Number.isFinite(placed.lng) || !Number.isFinite(placed.lat)) {
      tally[placed.precision] -= 1;
      tally.unplaceable += 1;
      continue;
    }

    const lng = round5(placed.lng);
    const lat = round5(placed.lat);
    bounds = [
      Math.min(bounds[0], lng),
      Math.min(bounds[1], lat),
      Math.max(bounds[2], lng),
      Math.max(bounds[3], lat),
    ];
    point.name.push(name);
    point.position.push(internPosition(lng, lat));
    point.precision.push(PRECISIONS.indexOf(placed.precision));
    point.type.push(dictionaries.type.id(row[columns.type]));
    point.owner.push(dictionaries.owner.id(row[columns.owner]));
    point.sector.push(dictionaries.sector.id(row[columns.sector]));
    point.stage.push(dictionaries.stage.id(row[columns.stage]));
    point.support.push(dictionaries.support.id(row[columns.support]));
    point.state.push(dictionaries.state.id(placed.state));
    point.place.push(dictionaries.place.id(placed.place));
    point.status.push(dictionaries.status.id(row[columns.status]));
    point.host.push(dictionaries.host.id(row[columns.host]));
    point.incubatorType.push(dictionaries.incubatorType.id(row[columns.incubatorType]));
    pushDetail(detail, row);
  }

  report(records.length, tally, unresolved);
  write({ point, positions, national, detail, nationalDetail, dictionaries, bounds, tally, sourceCount: records.length });
}


function report(total, tally, unresolved) {
  console.log(`\nplacement cascade over ${total} records:`);
  for (const key of PRECISIONS) {
    const count = tally[key];
    console.log(
      `  ${key.padEnd(14)} ${String(count).padStart(6)}  ${((100 * count) / total).toFixed(1)}%`
    );
  }
  const mapped = tally.point_city + tally.poly_district + tally.poly_state + tally.national;
  console.log(`  ${"mappable".padEnd(14)} ${String(mapped).padStart(6)}  ${((100 * mapped) / total).toFixed(1)}%`);
  if (unresolved.size) {
    const worst = [...unresolved.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    console.log(`\nunresolved place names (${unresolved.size} distinct), most frequent first:`);
    for (const [name, count] of worst) console.log(`  ${String(count).padStart(4)}  ${name}`);
    console.log("  -> add to CITY_ALIASES / STATE_ALIASES if any of these are real places.");
  }
}

function write({ point, positions, national, detail, nationalDetail, dictionaries, bounds, tally, sourceCount }) {
  const payload = {
    version: 1,
    // Columnar on purpose: the client reads the position table straight into a Float32Array for the
    // WebGL layer with no per-feature object allocated, and every categorical column is already an
    // integer that can become a vertex attribute or a filter bitmask. GeoJSON would cost several
    // times the bytes and force a parse-then-flatten pass on the main thread.
    layout: "columnar",
    source: "crestog/india-startup-ecosystem-master-inventory",
    sourceRecords: sourceCount,
    precisions: PRECISIONS,
    bounds,
    counts: {
      points: point.name.length,
      positions: positions.lng.length,
      national: national.name.length,
      byPrecision: tally,
    },
    dictionaries: Object.fromEntries(
      Object.entries(dictionaries).map(([key, dictionary]) => [key, dictionary.values])
    ),
    positions,
    points: point,
    national,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload));
  const detailPath = OUT.replace(/\.json$/, "-detail.json");
  writeFileSync(
    detailPath,
    JSON.stringify({ version: 1, points: detail, national: nationalDetail })
  );

  const measure = (path, note) => {
    const bytes = readFileSync(path);
    const brotli = brotliCompressSync(bytes).byteLength;
    console.log(
      `  ${(bytes.byteLength / 1024).toFixed(1).padStart(8)} KB raw   ${(brotli / 1024).toFixed(1).padStart(6)} KB brotli   ${path.replace(/.*[\\/]/, "")}  ${note}`
    );
  };
  console.log("");
  measure(OUT, `${point.name.length} points over ${positions.lng.length} distinct positions`);
  measure(detailPath, "prose + links, fetched on selection only");
}

main();





