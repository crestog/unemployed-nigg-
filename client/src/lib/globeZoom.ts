/**
 * What zoom a programmatic "focus this" should ask for on the globe.
 *
 * On a globe, zoom alone does not fix the scale. MapLibre keeps the drawn planet the
 * same size while you pan by folding `log2(cos(lat))` into the zoom — `getZoomAdjustment`
 * in maplibre-gl's `src/geo/projection/globe_utils.ts`, which is literally
 * `scaleZoom(cos(newLat) / cos(oldLat))`, i.e. `log2(cos newLat) − log2(cos oldLat)`.
 * Dragging north therefore *lowers* the zoom number while the ground scale under the
 * cursor never changes. Measured on this scene at 1425x832: panning latitude 0 → 85.051129
 * with the spin neutralised held the scale at 5.689 px per degree of latitude at every
 * step, while the zoom fell from 2 to −1.5351 — and −1.5351 = 2 + log2(cos 85.051129).
 *
 * So a camera target that names a zoom without naming the latitude it was measured at
 * means something different everywhere. Holding zoom at 2 and moving the centre from the
 * equator to 85° took the scale from 5.689 to 65.264 px/deg — 11.5x tighter, which is
 * exactly 1/cos(85.051129). That was the bug: `focusCenter` and `focusFeature` targeted
 * `baseZoom + log2(zoomFactor)` with `baseZoom` captured once at `style.load` (1.25 at
 * latitude 18), so "focus this region" framed a Norwegian county roughly 11x tighter than
 * a Kenyan one, and disagreed with the panning invariant the user's own dragging obeys.
 *
 * Kept out of the component because the test environment is `node` (`vitest.config.ts`),
 * so anything importing React or WebGL cannot be covered — the same reason `globeSpin.ts`
 * lives here.
 */

/**
 * MapLibre's `MAX_VALID_LATITUDE`: the highest latitude a globe centre can reach
 * (`clamp(..., -MAX_VALID_LATITUDE, MAX_VALID_LATITUDE)` in `computeGlobePanCenter`).
 *
 * Latitudes are clamped to it here for the same reason MapLibre clamps them there:
 * `cos(90°)` is 6.1e-17, not 0, so an unclamped `log2(cos(lat))` at a pole returns −54
 * and would ask the camera for a zoom 54 stops out. Feature coordinates come from data
 * files, so a polar row is a plausible input rather than a hypothetical one.
 */
export const MAX_GLOBE_LATITUDE = 85.051129;

/**
 * Extra zoom allowed above the base target when capping `fitBounds`.
 *
 * `fitBounds` is already latitude-correct — it fits projected geometry, so it derives its
 * own zoom. Only the `maxZoom` cap handed to it needs this term, and the cap exists to
 * stop a point-like feature (a single incubator, a one-node locality) from being fitted
 * to a padding-only box and slamming the camera to street level. 1.4 stops ≈ 2.6x more
 * than a plain focus, which leaves a small feature legibly framed without diving.
 */
export const FIT_BOUNDS_ZOOM_HEADROOM = 1.4;

function clampLatitude(latitude: number): number {
  return Math.min(MAX_GLOBE_LATITUDE, Math.max(-MAX_GLOBE_LATITUDE, latitude));
}

/**
 * MapLibre's own term, reimplemented rather than imported: `getZoomAdjustment` is not
 * exported from the `maplibre-gl` package entry, only from its internal source tree.
 *
 * Add the result to a zoom measured at `fromLatitude` to get the zoom that renders the
 * same ground scale at `toLatitude`. Negative going poleward, positive going equatorward,
 * zero along a parallel.
 */
export function globeZoomAdjustment(fromLatitude: number, toLatitude: number): number {
  const from = Math.cos((clampLatitude(fromLatitude) * Math.PI) / 180);
  const to = Math.cos((clampLatitude(toLatitude) * Math.PI) / 180);
  return Math.log2(to / from);
}

/**
 * `zoomAtReference` re-expressed at `latitude`, preserving ground scale.
 *
 * Non-finite in, `zoomAtReference` out: a NaN zoom handed to `easeTo` poisons the
 * transform permanently — every later `project()` returns NaN and the map stops
 * responding — so one bad coordinate must not be able to do that.
 */
export function globeZoomForLatitude(
  zoomAtReference: number,
  latitude: number,
  referenceLatitude: number
): number {
  if (!Number.isFinite(latitude) || !Number.isFinite(referenceLatitude)) return zoomAtReference;
  return zoomAtReference + globeZoomAdjustment(referenceLatitude, latitude);
}

export type FocusZoomRequest = {
  /** Zoom of the view `zoomFactor` is relative to — captured with `baseLatitude`, or it means nothing. */
  baseZoom: number;
  /** Latitude `baseZoom` was captured at. */
  baseLatitude: number;
  /** Latitude being focused. */
  latitude: number;
  /** Linear zoom multiplier from the call site, e.g. 4.1 for an adm1 selection. Values below 1 are ignored. */
  zoomFactor: number;
  /** Additional stops on top, for the `fitBounds` cap. */
  extraZoom?: number;
  /** `map.getMinZoom()`. */
  minZoom: number;
  /** `map.getMaxZoom()`. */
  maxZoom: number;
};

/**
 * The complete target for a programmatic focus: latitude-corrected, then clamped into the
 * map's own range.
 *
 * The clamp is not decoration. `minZoom` is 0 on this scene while the latitude term is
 * worth −3.46 stops at the pole, so an uncapped target would sit far below the floor and
 * MapLibre would silently substitute the floor — putting the camera at a scale nothing
 * asked for. Clamping here keeps the substitution visible to whoever reads this function
 * instead of hiding it inside the camera.
 */
export function focusZoom(request: FocusZoomRequest): number {
  const { baseZoom, baseLatitude, latitude, zoomFactor, minZoom, maxZoom } = request;
  const requested =
    baseZoom + Math.log2(Math.max(1, zoomFactor)) + (request.extraZoom ?? 0);
  const target = globeZoomForLatitude(requested, latitude, baseLatitude);
  // `Math.min`/`Math.max` propagate NaN, so an unusable target has to be caught before
  // the clamp rather than by it.
  const usable = Number.isFinite(target) ? target : Number.isFinite(baseZoom) ? baseZoom : minZoom;
  return Math.min(maxZoom, Math.max(minZoom, usable));
}
