/**
 * Which camera changes are worth re-rendering React for.
 *
 * MapLibre emits `move` once per animation frame, and the world globe auto-spins
 * whenever it is at rest below zoom 3.2 — so at idle the camera changes 60 times a
 * second, forever. Feeding each of those into React state re-rendered the whole
 * world explorer (entity panel, search list, legend) at that rate against a camera
 * no consumer could resolve that finely. The main thread never went quiet, and
 * typing into the place search felt like the page had stopped responding.
 *
 * The fix is to publish only when a value some consumer can actually *see* changes.
 * This module is that decision, extracted from the component so the contract is
 * testable: `publishedCameraKey` maps a camera onto a string, and a frame whose key
 * matches the last published one is dropped before it reaches React. The exact
 * camera stays available through the ref the component keeps for per-frame work, so
 * nothing that needs precision loses it.
 *
 * Each term is quantised to the finest resolution its consumer can distinguish, and
 * the reason is recorded beside it in `publishedCameraKey`. Widening a bucket here
 * makes the app cheaper and blunter; narrowing it makes it more responsive and more
 * expensive. Neither is free, which is why the numbers are justified rather than
 * tuned.
 */

/** Cells per degree for the viewport grid — 1/8°, about 14 km at India's latitude. */
export const BOUNDS_GRID_STEP = 8;

/**
 * The zoom at which the India administrative layers begin loading.
 *
 * `publishedCameraKey` needs it because below this zoom every consumer of the
 * viewport box early-returns on zoom before reading the box, so the box cannot
 * affect anything rendered there.
 */
export const INDIA_ADM1_ZOOM = 2.4;

export type CameraSnapshot = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  bounds: [[number, number], [number, number]];
};

/**
 * The camera reduced to what React resolves it to.
 *
 * Terms, and why each is quantised where it is:
 *
 *  - `zoom` to 1/100, because the heads-up display prints `zoom.toFixed(2)`. Any
 *    coarser and the readout could sit on a stale number; any finer buys nothing,
 *    since every other zoom consumer is a threshold whole levels apart.
 *  - `center` to 1/2°. Its only consumer turns it into a boolean — is India within
 *    the visible radius — by comparing an angular distance against bands 12° to 38°
 *    wide. So the worst this costs is flipping that boolean up to 0.7° of pan late,
 *    and all it gates is when India detail *begins* prefetching.
 *  - `bounds` onto the 1/8° grid the viewport box is snapped to anyway, and only
 *    at or above `INDIA_ADM1_ZOOM`. This is the term that matters: below that zoom
 *    the viewport spans most of the globe, so a 1/8° cell is a fraction of a pixel,
 *    and a spinning globe crosses one every few frames while nothing on screen is
 *    derived from the box at all.
 *  - `bearing` and `pitch` to 1°. Neither is rendered — the URL-hash effect reads
 *    the exact values off the live ref — but they are keyed so that rotating still
 *    triggers that effect, which then writes the precise numbers.
 *
 * The bounds terms are appended rather than zeroed below the threshold, so a key
 * from a low zoom can never collide with one from a high zoom even before the zoom
 * term is compared.
 */
export function publishedCameraKey(view: CameraSnapshot): string {
  const terms = [
    Math.round(view.zoom * 100),
    Math.round(view.center[0] * 2),
    Math.round(view.center[1] * 2),
    Math.round(view.bearing),
    Math.round(view.pitch),
  ];
  if (view.zoom >= INDIA_ADM1_ZOOM) {
    // Floor the west/south corner and ceil the east/north one, matching how the
    // viewport box itself is snapped: the cell a corner belongs to is the one the
    // box is expanded out to, so the key changes exactly when that box does.
    terms.push(
      Math.floor(view.bounds[0][0] * BOUNDS_GRID_STEP),
      Math.floor(view.bounds[0][1] * BOUNDS_GRID_STEP),
      Math.ceil(view.bounds[1][0] * BOUNDS_GRID_STEP),
      Math.ceil(view.bounds[1][1] * BOUNDS_GRID_STEP)
    );
  }
  return terms.join(",");
}
