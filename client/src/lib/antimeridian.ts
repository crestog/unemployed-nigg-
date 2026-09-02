/**
 * Splits GeoJSON that crosses the antimeridian, and closes rings that encircle
 * a pole.
 *
 * `world-atlas`'s `countries-50m` is authored for spherical renderers. d3-geo
 * resolves a ring that steps straight from +179.9° to -180° on the sphere, so
 * `geoPath` draws it correctly and nothing looks wrong. MapLibre does not:
 * `@maplibre/geojson-vt` tiles in planar Web Mercator, where that single step is
 * a 359.9°-wide edge. The ring stops being an island and becomes a band along
 * its own latitude that wraps the whole planet.
 *
 * Three features in `countries-50m` do exactly this, and all three were visible
 * on the globe:
 *
 *   * Russia — Wrangel Island (43 points, 70.8°N-71.6°N) sits astride 180°, so
 *     Russia's fill painted a band right across the Arctic. A probe at
 *     109.8°W/67.0°N — northern Canada — returned both "Canada" and "Russian
 *     Federation" from `queryRenderedFeatures`, which is why clicks up there
 *     selected the wrong country.
 *   * Fiji — Vanua Levu (10 points, ~16.5°S) drew the same band across the
 *     South Pacific, which on a globe reads as a stray arc leaving the disc.
 *   * Antarctica — its 2,539-point coast ring encircles the south pole and is
 *     closed by one more such step, so instead of a polar cap it filled a strip
 *     between 63°S and 85°S all the way round.
 *
 * RFC 7946 §3.1.9 says geometry crossing the antimeridian SHOULD be split at
 * it; a ring that encircles a pole additionally has to be closed *through* the
 * pole. Closing through the pole is also what makes MapLibre fill the cap:
 * `geojson-vt` clamps ±90° onto the exact tile edge, and MapLibre's globe
 * subdivision extends any triangle edge lying on that edge to the pole
 * (`render/subdivision.ts` `_fillPoles`).
 *
 * This runs at the MapLibre boundary rather than on the shared data, because the
 * d3 paths in `WorldMapExplorer` (`geoCentroid`, `geoContains`, `geoPath`) want
 * the spherical form and handle it correctly already.
 */

type Position = GeoJSON.Position;
type Ring = Position[];

const WORLD = 360;
const HALF_WORLD = 180;

/** Cached per geometry object: the topology hands out stable references. */
const splitCache = new WeakMap<object, GeoJSON.Geometry>();

/**
 * The cheap gate. Any ring that straddles the antimeridian, or that encircles a
 * pole, contains at least one step wider than 180° — a pole-encircling ring has
 * to close somewhere. Rings without one need no work at all, which is all but
 * three of the 241 countries, so the common path allocates nothing.
 */
function ringNeedsWork(ring: Ring): boolean {
  for (let index = 1; index < ring.length; index += 1) {
    if (Math.abs(ring[index][0] - ring[index - 1][0]) > HALF_WORLD) return true;
  }
  return false;
}

/** Rewrites longitudes so that no step between neighbours exceeds 180°. */
function unwrapLongitudes(ring: Ring): Ring {
  if (!ring.length) return [];
  let previous = ring[0][0];
  return ring.map(position => {
    const longitude =
      position[0] + Math.round((previous - position[0]) / WORLD) * WORLD;
    previous = longitude;
    return [longitude, ...position.slice(1)];
  });
}

function isClosed(ring: Ring): boolean {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return Boolean(first && last && first[0] === last[0] && first[1] === last[1]);
}

/** Drops GeoJSON's repeated closing vertex so the ring can be re-closed later. */
function openRing(ring: Ring): Ring {
  return isClosed(ring) ? ring.slice(0, -1) : ring.slice();
}

/** The 360°-wide strip `[360k - 180, 360k + 180]` that `longitude` falls in. */
function stripIndex(longitude: number): number {
  return Math.floor((longitude + HALF_WORLD) / WORLD);
}

function shiftRing(ring: Ring, offset: number): Ring {
  if (offset === 0) return ring;
  return ring.map(position => [position[0] + offset, ...position.slice(1)]);
}

/**
 * Sutherland-Hodgman clip of a closed ring against one vertical line. The clip
 * region is convex, so this is exact for convex input and leaves
 * boundary-hugging slivers for concave input — invisible in a fill, and earcut
 * triangulates them without complaint.
 */
function clipRingToHalfPlane(
  ring: Ring,
  limit: number,
  keepLower: boolean
): Ring {
  const inside = (position: Position) =>
    keepLower ? position[0] <= limit : position[0] >= limit;
  const out: Ring = [];
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    const currentInside = inside(current);
    if (currentInside) out.push(current);
    if (currentInside !== inside(next)) {
      const span = next[0] - current[0];
      const ratio = span === 0 ? 0 : (limit - current[0]) / span;
      out.push([limit, current[1] + (next[1] - current[1]) * ratio]);
    }
  }
  return out;
}

/**
 * Re-indexes a closed ring to start at the vertex nearest the antimeridian, so
 * that the seam {@link closeThroughPole} introduces lands on 180° rather than
 * cutting a visible meridian through the middle of the polygon.
 */
function rotateToAntimeridian(ring: Ring): Ring {
  let bestIndex = 0;
  let bestDistance = Infinity;
  ring.forEach((position, index) => {
    const distance = Math.abs(HALF_WORLD - Math.abs(position[0]));
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return [...ring.slice(bestIndex), ...ring.slice(0, bestIndex)];
}

/**
 * Closes a pole-encircling ring: walk the coast one full turn, drop to the pole,
 * run back along it, and let the implicit closing edge come home. `direction`
 * carries the sign of the ring's winding so the coast is extended the way it was
 * already travelling.
 *
 * The run back along the pole spans a full 360°, so it has to be subdivided: a
 * single edge that wide is the very defect this module removes, and the strip
 * clipper cannot help — both of its endpoints lie inside (indeed on) the strip
 * boundary, and Sutherland-Hodgman only inserts vertices where an edge *crosses*
 * one. Quarter turns are comfortably under the 180° limit and all land on the
 * pole, so `_fillPoles` still sees a run of edges along the tile edge.
 *
 * The pole latitude is chosen from the mean latitude of the ring. A ring that
 * encircles a pole necessarily sits at high latitude of that pole's sign, so
 * this is unambiguous for real-world coastlines.
 */
function closeThroughPole(unwrapped: Ring, direction: number): Ring {
  const start = unwrapped[0];
  const end: Position = [start[0] + direction * WORLD, ...start.slice(1)];
  const meanLatitude =
    unwrapped.reduce((total, position) => total + position[1], 0) /
    unwrapped.length;
  const poleLatitude = meanLatitude >= 0 ? 90 : -90;
  const poleSteps = 4;
  const poleRun: Ring = [];
  for (let step = 0; step <= poleSteps; step += 1) {
    poleRun.push([
      end[0] + ((start[0] - end[0]) * step) / poleSteps,
      poleLatitude,
    ]);
  }
  return [...unwrapped, end, ...poleRun];
}

/**
 * Twice the shoelace area, halved — signed, so the sign carries the winding.
 * Only ever compared against {@link AREA_EPSILON}, never used as a measurement.
 */
function signedArea(ring: Ring): number {
  let total = 0;
  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index, index += 1
  ) {
    total +=
      ring[previous][0] * ring[index][1] - ring[index][0] * ring[previous][1];
  }
  return total / 2;
}

/**
 * Below this, in square degrees, a ring is treated as enclosing nothing. Used
 * only on pieces that have already been conditioned, to discard the hairline
 * slivers strip clipping can leave where a ring grazes a seam at a single vertex.
 * 1e-9 deg² is about 12 m², far below one device pixel at any zoom this map
 * reaches.
 */
const AREA_EPSILON = 1e-9;

/**
 * Latitude past which a ring is all closure and no geography. The northernmost
 * and southernmost real land in `countries-50m` sits at |lat| ≈ 83.7°, so a ring
 * whose *every* vertex is beyond 89.9° — within about 11 km of the pole — cannot
 * be a coastline.
 */
const POLE_MARGIN = 89.9;

/**
 * True when a ring is nothing but a run along a pole.
 *
 * `countries-50m` closes Antarctica with one: 257 points strung along lat
 * -89.999°, all at the identical latitude, ahead of the real 2,539-point coast.
 * That is how the spherical form spells "and the cap continues to the pole" — on
 * a sphere those points are all within 100 m of each other, and the coast ring
 * beside it carries the boundary.
 *
 * Left in, it is worse than useless here, because it *does* have a step wider
 * than 180°, so {@link splitRing} takes it for a pole-encircling ring and
 * {@link closeThroughPole} hands it a pole run at exactly ±90. That run is real
 * geometry on the bottom tile edge, and MapLibre's globe subdivision extends
 * anything lying on that edge to the pole (`render/subdivision.ts` `_fillPoles`)
 * — so a ring that enclosed 7.7e-12 deg² becomes a second polar cap painted over
 * the true one, which at `fill-opacity` 0.78 reads as a bright wedge across
 * Antarctica. MapLibre's `classifyRings` discards rings of *exactly* zero signed
 * area, which is why the raw data survives its own defect; the pole run this
 * module would add takes the area to 0.36 and defeats that check.
 *
 * Testing latitude rather than area is deliberate. A pole-encircling ring at
 * constant latitude also encloses no *planar* area until it is closed through the
 * pole, and closing it is exactly the right answer for a coast — so area alone
 * cannot tell the two apart, and would throw away the cap it was meant to fix.
 */
function isPoleRun(ring: Ring): boolean {
  return (
    ring.length > 0 && ring.every(position => Math.abs(position[1]) >= POLE_MARGIN)
  );
}

/**
 * Splits one ring into at most one piece per 360° strip, keyed by strip index.
 * A ring that needs no work comes back as a single entry holding the original
 * array, so untouched geometry keeps its identity.
 */
function splitRing(ring: Ring): Map<number, Ring> {
  const pieces = new Map<number, Ring>();
  if (ring.length < 4) {
    pieces.set(0, ring);
    return pieces;
  }
  const closed = unwrapLongitudes(ring);
  const turn = closed[closed.length - 1][0] - closed[0][0];
  const encirclesPole = Math.abs(turn) > HALF_WORLD;
  const unwrapped = encirclesPole
    ? closeThroughPole(
        unwrapLongitudes(rotateToAntimeridian(openRing(ring))),
        Math.sign(turn)
      )
    : openRing(closed);

  let minimum = Infinity;
  let maximum = -Infinity;
  for (const position of unwrapped) {
    if (position[0] < minimum) minimum = position[0];
    if (position[0] > maximum) maximum = position[0];
  }
  const firstStrip = stripIndex(minimum);
  const lastStrip = stripIndex(maximum);
  if (!encirclesPole && firstStrip === 0 && lastStrip === 0) {
    pieces.set(0, ring);
    return pieces;
  }

  for (let strip = firstStrip; strip <= lastStrip; strip += 1) {
    const clipped = clipRingToHalfPlane(
      clipRingToHalfPlane(unwrapped, strip * WORLD + HALF_WORLD, true),
      strip * WORLD - HALF_WORLD,
      false
    );
    if (clipped.length < 3) continue;
    const shifted = shiftRing(clipped, -strip * WORLD);
    if (Math.abs(signedArea(shifted)) < AREA_EPSILON) continue;
    pieces.set(strip, [...shifted, [...shifted[0]]]);
  }
  return pieces;
}

/**
 * Splits a polygon's rings and regroups them by strip. A hole and its outer ring
 * are clipped against the same strip boundaries, so grouping the pieces by strip
 * index preserves the containment that made them a hole in the first place;
 * hole pieces landing in a strip with no outer piece are dropped.
 *
 * Rings that are pure pole runs go first, before anything is split. They cannot
 * contribute a fill ({@link isPoleRun}), and dropping them early also keeps them
 * out of ring 0, whose strips decide which pieces are emitted at all — in
 * `countries-50m` Antarctica's pole run *is* ring 0, and the coast that should be
 * governing that choice is ring 1.
 */
function splitPolygon(rings: Ring[]): Ring[][] {
  const usable = rings.filter(ring => !isPoleRun(ring));
  if (!usable.length) return [];
  const ringPieces = usable.map(splitRing);
  const polygons: Ring[][] = [];
  const strips = Array.from(ringPieces[0].keys()).sort((a, b) => a - b);
  for (const strip of strips) {
    const outer = ringPieces[0].get(strip);
    if (!outer) continue;
    const polygon: Ring[] = [outer];
    for (let index = 1; index < ringPieces.length; index += 1) {
      const hole = ringPieces[index].get(strip);
      if (hole) polygon.push(hole);
    }
    polygons.push(polygon);
  }
  return polygons;
}

/** Cuts a line at every strip boundary it crosses; no pole closure applies. */
function splitLine(line: Ring): Ring[] {
  const unwrapped = unwrapLongitudes(line);
  const parts: Ring[] = [];
  let current: Ring = [];
  let strip = stripIndex(unwrapped[0][0]);
  const flush = () => {
    if (current.length > 1) parts.push(shiftRing(current, -strip * WORLD));
    current = [];
  };
  for (let index = 0; index < unwrapped.length; index += 1) {
    const position = unwrapped[index];
    const positionStrip = stripIndex(position[0]);
    if (index > 0 && positionStrip !== strip) {
      const previous = unwrapped[index - 1];
      const boundary =
        positionStrip > strip
          ? strip * WORLD + HALF_WORLD
          : strip * WORLD - HALF_WORLD;
      const span = position[0] - previous[0];
      const ratio = span === 0 ? 0 : (boundary - previous[0]) / span;
      const latitude = previous[1] + (position[1] - previous[1]) * ratio;
      current.push([boundary, latitude]);
      flush();
      strip = positionStrip;
      current.push([boundary, latitude]);
    }
    current.push(position);
  }
  flush();
  return parts;
}

function polygonNeedsWork(rings: Ring[]): boolean {
  return rings.some(ring => ringNeedsWork(ring) || isPoleRun(ring));
}

/**
 * Dispatches by geometry type, and returns the argument itself when nothing
 * straddles. Callers hand the same topology in on every render, so preserving
 * identity for the 238 untouched countries is what keeps this off the hot path.
 */
function split(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
  switch (geometry.type) {
    case "Polygon": {
      if (!polygonNeedsWork(geometry.coordinates)) return geometry;
      const polygons = splitPolygon(geometry.coordinates);
      return polygons.length === 1
        ? { type: "Polygon", coordinates: polygons[0] }
        : { type: "MultiPolygon", coordinates: polygons };
    }
    case "MultiPolygon": {
      if (!geometry.coordinates.some(polygonNeedsWork)) return geometry;
      return {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.flatMap(rings =>
          polygonNeedsWork(rings) ? splitPolygon(rings) : [rings]
        ),
      };
    }
    case "LineString": {
      if (!ringNeedsWork(geometry.coordinates)) return geometry;
      const parts = splitLine(geometry.coordinates);
      return parts.length === 1
        ? { type: "LineString", coordinates: parts[0] }
        : { type: "MultiLineString", coordinates: parts };
    }
    case "MultiLineString": {
      if (!geometry.coordinates.some(ringNeedsWork)) return geometry;
      return {
        type: "MultiLineString",
        coordinates: geometry.coordinates.flatMap(line =>
          ringNeedsWork(line) ? splitLine(line) : [line]
        ),
      };
    }
    case "GeometryCollection": {
      const geometries = geometry.geometries.map(split);
      const changed = geometries.some(
        (next, index) => next !== geometry.geometries[index]
      );
      return changed ? { type: "GeometryCollection", geometries } : geometry;
    }
    default:
      return geometry;
  }
}

/**
 * Returns `geometry` conditioned for a planar tiler: no edge spans more than
 * 180° of longitude, and any ring that encircled a pole is closed through it.
 * Geometry that already satisfies both is returned unchanged, by reference.
 */
export function splitGeometryAtAntimeridian(
  geometry: GeoJSON.Geometry
): GeoJSON.Geometry {
  const cached = splitCache.get(geometry);
  if (cached) return cached;
  const result = split(geometry);
  splitCache.set(geometry, result);
  return result;
}
