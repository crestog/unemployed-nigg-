/**
 * Point-in-boundary lookups over the India administrative layers.
 *
 * These exist because the naive form of the question — "which state is this district in?" — was
 * costing 880 ms of blocked main thread on the first render of the India view. Profiling put the
 * cost squarely in `d3-geo`'s `geoContains`: it decides containment by spherical winding, walking
 * every vertex of the candidate, and the states here average ~3,233 vertices. 641 districts against
 * 36 states is 23,076 of those walks. Converting boundaries to GeoJSON features, which was my first
 * suspicion, measured 2.1 ms in total and was never the problem.
 *
 * So the fix is two-part, and it is the containment test that matters:
 *
 *  1. A bounding box per candidate, measured once (`boundFeatures`). On the real data this cuts
 *     26,460 candidate pairs to 1,131 that need a real test.
 *  2. A planar even-odd ray cast (`pointInRings`) in place of `geoContains` for those 1,131. Over
 *     India's extent a boundary edge spanning a few hundred metres differs from its geodesic by far
 *     less than the source data's own resolution, and the measurement agrees: across all 735
 *     district centroids and all 6,562 localities — 7,297 real points — planar and spherical return
 *     the identical answer, 0 disagreements, while the containment phase drops from 419 ms to
 *     11.5 ms and the locality path from 448 ms to 53 ms.
 *
 * Two consequences worth knowing. The ray cast is winding-order-agnostic, so nothing on this path
 * depends on `normalizeD3Geometry` having reversed the rings first. And it is *planar*: geometry
 * that crosses the antimeridian would have its edges swept the wrong way and be misreported. The
 * India layers do not come near it. Do not reach for this module for a world-wide layer without
 * dealing with that first.
 *
 * `geoCentroid` stays, at 64 ms for 735 districts, because it decides *which point* each district is
 * asked about — it is the question, not the timing. The one change there is that a centroid falling
 * outside its own district is now caught and replaced (`representativePoint`), which fixed two
 * districts the old code silently attributed to India.
 */

import { geoCentroid } from "d3-geo";

/**
 * One closed ring, flattened to `[x0, y0, x1, y1, …]` with its own extent.
 *
 * Flat rather than an array of pairs because the ray cast is the hot loop and this keeps it walking
 * one contiguous buffer. The per-ring extent is what makes a state's islands cheap: a point over
 * the mainland skips every offshore ring on a bounds comparison instead of walking it.
 */
export type Ring = {
  coordinates: Float64Array;
  /** Vertex count — `coordinates.length / 2`, precomputed because the loop reads it every pass. */
  length: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/** A feature with its extent and rings measured once. `bounds` is `[[west, south], [east, north]]`. */
export type BoundedFeature = {
  id: string;
  feature: GeoJSON.Feature;
  bounds: [[number, number], [number, number]];
  rings: Ring[];
};

/**
 * Roughly 0.1 m at the equator. The box is a prefilter, not the authority, so it is deliberately
 * generous: a centroid that lands exactly on its parent's edge must reach the ray cast and be
 * decided there rather than lost to float error in the comparison.
 */
const BOX_EPSILON = 1e-6;

/** A closed ring needs four positions; anything shorter encloses no area and can contain nothing. */
const MIN_RING_LENGTH = 4;

function collectRings(geometry: GeoJSON.Geometry, into: Ring[]): void {
  switch (geometry.type) {
    case "Polygon":
      for (const ring of geometry.coordinates) addRing(ring, into);
      return;
    case "MultiPolygon":
      for (const polygon of geometry.coordinates) for (const ring of polygon) addRing(ring, into);
      return;
    case "GeometryCollection":
      for (const member of geometry.geometries) collectRings(member, into);
      return;
    default:
      // Points and lines enclose nothing, so they contribute no rings and every query against them
      // answers false. That is the right answer, not a gap.
      return;
  }
}

function addRing(ring: GeoJSON.Position[], into: Ring[]): void {
  if (ring.length < MIN_RING_LENGTH) return;
  const coordinates = new Float64Array(ring.length * 2);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < ring.length; index += 1) {
    const [x, y] = ring[index];
    coordinates[index * 2] = x;
    coordinates[index * 2 + 1] = y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return;
  into.push({ coordinates, length: ring.length, minX, minY, maxX, maxY });
}

/**
 * Measure each feature's rings and extent once, so every later query is a comparison rather than a
 * walk.
 *
 * The extent is the vertex extent, taken in the same planar terms as the ray cast that consumes it,
 * which is what makes the pair sound: a planar polygon lies entirely inside the planar box of its
 * own vertices, so the box can only reject points the ray cast would also reject. `geoBounds` used
 * to do this, 5.6× slower and in spherical terms that did not quite match the test it was gating —
 * on this data the two agree to under 6 m, so the change is a speedup and not a behaviour change.
 *
 * Generic in the input so a caller can carry its own record along — the render paths need the
 * source boundary back, and pairing two arrays by index to recover it is the kind of coupling that
 * survives exactly until someone filters one of them.
 */
export function boundFeatures<T extends { id: string; feature: GeoJSON.Feature }>(
  items: T[]
): Array<T & { bounds: [[number, number], [number, number]]; rings: Ring[] }> {
  return items.map(item => {
    const rings: Ring[] = [];
    if (item.feature.geometry) collectRings(item.feature.geometry, rings);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const ring of rings) {
      if (ring.minX < minX) minX = ring.minX;
      if (ring.minY < minY) minY = ring.minY;
      if (ring.maxX > maxX) maxX = ring.maxX;
      if (ring.maxY > maxY) maxY = ring.maxY;
    }
    return {
      ...item,
      // An empty feature gets an inverted box, which `pointInBounds` rejects for every point. That
      // is the honest answer for geometry that encloses nothing.
      bounds: [
        [minX, minY],
        [maxX, maxY],
      ] as [[number, number], [number, number]],
      rings,
    };
  });
}

export function pointInBounds(
  bounds: [[number, number], [number, number]],
  longitude: number,
  latitude: number
): boolean {
  const [[west, south], [east, north]] = bounds;
  if (latitude < south - BOX_EPSILON || latitude > north + BOX_EPSILON) return false;
  // `boundFeatures` never produces west > east, but a caller may hand over bounds from `geoBounds`,
  // which reports an extent spanning the antimeridian that way. That is a wrapped interval and not
  // an empty one, so read it as a union rather than an intersection.
  return west <= east
    ? longitude >= west - BOX_EPSILON && longitude <= east + BOX_EPSILON
    : longitude >= west - BOX_EPSILON || longitude <= east + BOX_EPSILON;
}

/**
 * Even-odd ray cast against every ring at once.
 *
 * Counting crossings across all rings together is what handles holes and islands without tracking
 * which is which: a point inside an outer ring and inside a hole crosses two boundaries and comes
 * out even, which is to say outside. That holds as long as the rings do not overlap, which is true
 * of any well-formed polygon and of administrative layers that partition their space.
 *
 * `(yi > y) !== (yj > y)` is the half-open rule, and it is the reason a vertex shared by two edges
 * is counted once rather than twice. A point exactly on a boundary falls to float comparison and is
 * decided arbitrarily but consistently — for two districts sharing an edge, exactly one claims it.
 */
export function pointInRings(rings: Ring[], longitude: number, latitude: number): boolean {
  let inside = false;
  for (const ring of rings) {
    if (
      longitude < ring.minX ||
      longitude > ring.maxX ||
      latitude < ring.minY ||
      latitude > ring.maxY
    ) {
      continue;
    }
    const { coordinates, length } = ring;
    for (let index = 0, previous = length - 1; index < length; previous = index, index += 1) {
      const y1 = coordinates[index * 2 + 1];
      const y2 = coordinates[previous * 2 + 1];
      if (y1 > latitude === y2 > latitude) continue;
      const x1 = coordinates[index * 2];
      const x2 = coordinates[previous * 2];
      if (longitude < x1 + ((latitude - y1) / (y2 - y1)) * (x2 - x1)) inside = !inside;
    }
  }
  return inside;
}

/**
 * The id of the first candidate that contains the point, or null. First rather than smallest:
 * the administrative layers here partition their space, so at most one candidate can contain a
 * point, and searching past the first would only cost time.
 */
export function containingFeatureId(
  candidates: BoundedFeature[],
  longitude: number,
  latitude: number
): string | null {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  for (const candidate of candidates) {
    if (!pointInBounds(candidate.bounds, longitude, latitude)) continue;
    if (pointInRings(candidate.rings, longitude, latitude)) return candidate.id || null;
  }
  return null;
}

/**
 * A point that actually lies inside the feature, for asking which parent contains it.
 *
 * The centroid is the natural choice and is what this returns for 732 of the 735 Indian districts.
 * The other three are the cases the naive version got wrong: Nicobars (18 rings) and Lakshadweep
 * (22 rings) are archipelagos whose centre of mass falls in the sea between islands, and Uttar
 * Dinajpur is a crescent that curves around its own centroid. All three are genuinely outside
 * themselves — so a containment test at the centroid answers "no parent", and the old code showed
 * them as belonging to India rather than to Andaman and Nicobar Islands, Lakshadweep and West
 * Bengal. Two of the three are fixed by this; Lakshadweep is not, for a reason that is in the data
 * rather than here (see `parentIdByChildId`).
 *
 * So: use the centroid when it is inside, and otherwise fall back to the largest ring — the main
 * island, or the bulk of a crescent — and find a point in it. The fallback runs for 3 of 735
 * children, which is why it can afford to be a grid scan.
 */
export function representativePoint(child: {
  feature: GeoJSON.Feature;
  rings: Ring[];
}): [number, number] {
  const centroid = geoCentroid(child.feature);
  if (
    Number.isFinite(centroid[0]) &&
    Number.isFinite(centroid[1]) &&
    pointInRings(child.rings, centroid[0], centroid[1])
  ) {
    return [centroid[0], centroid[1]];
  }
  let largest: Ring | null = null;
  let largestExtent = -Infinity;
  for (const ring of child.rings) {
    const extent = (ring.maxX - ring.minX) * (ring.maxY - ring.minY);
    if (extent > largestExtent) {
      largestExtent = extent;
      largest = ring;
    }
  }
  if (!largest) return [centroid[0], centroid[1]];
  // Interior grid over that ring alone, tested against every ring so a hole still excludes. Offset
  // by half a cell so the samples never land on the ring's own bounding edges, where the crossing
  // test is at its least decisive.
  const steps = 16;
  const stepX = (largest.maxX - largest.minX) / steps;
  const stepY = (largest.maxY - largest.minY) / steps;
  for (let row = 0; row < steps; row += 1) {
    const y = largest.minY + (row + 0.5) * stepY;
    for (let column = 0; column < steps; column += 1) {
      const x = largest.minX + (column + 0.5) * stepX;
      if (pointInRings(child.rings, x, y)) return [x, y];
    }
  }
  // A ring too thin for a 16×16 grid to land in. Rare enough that returning the centroid — and so
  // reporting no parent — is better than widening the search on a guess.
  return [centroid[0], centroid[1]];
}

/**
 * Which parent each child sits in, by a point inside the child.
 *
 * Still returns null rather than guessing when no parent contains that point, and one Indian
 * district still needs it. The adm1 and adm2 layers are independent generalisations of the same 22
 * Lakshadweep islands and they disagree about the outlines: the district reaches 71.74°E / 12.40°N,
 * the state stops at 72.16°E / 11.70°N, and only 47 of the district's 261 vertices fall inside the
 * state polygon at all. No containment test can bridge that, because there is no point the source
 * data agrees is in both. The nearest parent would be the right answer here — and would also be the
 * right answer for a district genuinely in the sea, which is why it is not worth having: the
 * fallback at the call site shows India rather than inventing a state.
 */
export function parentIdByChildId(
  children: BoundedFeature[],
  parents: BoundedFeature[]
): Map<string, string | null> {
  const parentIdOf = new Map<string, string | null>();
  for (const child of children) {
    const [longitude, latitude] = representativePoint(child);
    parentIdOf.set(child.id, containingFeatureId(parents, longitude, latitude));
  }
  return parentIdOf;
}
