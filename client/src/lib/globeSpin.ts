/**
 * What the idle globe spin should do next.
 *
 * The spin used to be a `requestAnimationFrame` loop calling `map.setCenter` once a
 * frame. `setCenter` delegates to `jumpTo`, which fires `movestart`, `move` and
 * `moveend` *synchronously* before returning (maplibre-gl 6.5, `Camera.jumpTo`), and
 * the loop re-armed itself from `moveend` as well as from its own rAF while zeroing
 * its in-flight handle at the top of the callback. So the `moveend` that `setCenter`
 * fired saw no frame pending, scheduled one, and then the line after `setCenter`
 * scheduled a second and overwrote the first handle without cancelling it — two
 * callbacks per frame, then four, then eight. The profile caught it: spin off idled
 * at 60 fps with zero long tasks, spin on collapsed to 3 fps with a 29,005 ms
 * main-thread block. A frame carrying 2ⁿ camera jumps is not a spinning globe, which
 * is why it was reported as "glitching and doesn't feel solid".
 *
 * The replacement hands the animation to MapLibre: one `easeTo` per segment, linear,
 * re-issued when it ends. This module is the decision of *whether* to issue one and
 * *where to*, extracted from the component so the guard order and the segment size
 * are testable rather than commented — a spin that fights the pointer, or that eases
 * the wrong way round the globe, is a bug you can only see by watching for it.
 */

/** Rotation rate. Slow enough to read place names off the limb as they pass. */
export const SPIN_DEGREES_PER_SECOND = 2.2;

/**
 * How far one `easeTo` carries the camera.
 *
 * MapLibre's globe camera helper interpolates along the *shortest* angular path
 * (`differenceOfAnglesDegrees` in `GlobeCameraHelper.handleEaseTo`), so a segment of
 * 180° or more would ease backwards, and one at exactly 180° is a coin flip. It also
 * wraps the interpolated centre itself, so unlike hand-rolled modulo arithmetic the
 * antimeridian needs no special case.
 *
 * Larger is cheaper: each boundary costs one move lifecycle plus a one-macrotask gap
 * while the next segment is issued. 90° keeps a wide margin under the limit and puts
 * a boundary roughly every 41 seconds.
 */
export const SPIN_SEGMENT_DEGREES = 90;

export const SPIN_SEGMENT_MS = (SPIN_SEGMENT_DEGREES / SPIN_DEGREES_PER_SECOND) * 1000;

/** Spinning past this zoom stops making sense: the horizon is no longer a limb. */
export const SPIN_MAX_ZOOM = 3.2;

/** Grace period after load, so the first thing a user sees is not already moving. */
export const SPIN_START_DELAY_MS = 3000;

/** How long an interaction keeps the spin off, so it never fights the pointer. */
export const SPIN_RESUME_DELAY_MS = 7000;

export type SpinState = {
  /** The user's toggle. */
  enabled: boolean;
  /** `prefers-reduced-motion: reduce`. An unattended animation is exactly what it asks about. */
  reducedMotion: boolean;
  zoom: number;
  /** `map.isMoving()` — true while a gesture or another animation owns the camera. */
  moving: boolean;
  now: number;
  /** `performance.now()` value before which the spin stays off. */
  pausedUntil: number;
  center: [number, number];
};

export type SpinPlan =
  /** Schedule nothing. `reason` records which guard stopped it. */
  | { kind: "idle"; reason: "disabled" | "reduced-motion" | "zoomed-in" | "camera-busy" }
  /** Re-check after `delayMs`; nothing is moving, so no event will come round to do it. */
  | { kind: "wait"; delayMs: number }
  /** Hand this straight to `map.easeTo` with linear easing. */
  | { kind: "ease"; center: [number, number]; durationMs: number };

/**
 * Why the spin may not run at all, independent of what the camera is doing.
 *
 * Asked separately from `planSpinSegment` because the component has a second question:
 * whether a segment *already in flight* should be cut short. A 90° segment lasts 41
 * seconds, so a spin switched off mid-segment would keep turning for most of a minute
 * under a button that says it stopped. Both callers read this one definition so the
 * "may it run" answer cannot drift from the "should it start" answer.
 */
export function spinIneligibility(
  state: Pick<SpinState, "enabled" | "reducedMotion" | "zoom">
): "disabled" | "reduced-motion" | "zoomed-in" | null {
  if (!state.enabled) return "disabled";
  if (state.reducedMotion) return "reduced-motion";
  if (state.zoom > SPIN_MAX_ZOOM) return "zoomed-in";
  return null;
}

/**
 * The guards, in the order they have to be asked:
 *
 *  1. Eligibility first — a disabled spin must schedule nothing at all, not a timer
 *     that wakes up to discover it is disabled. The old loop's cost when off was a
 *     parked frame callback per frame.
 *  2. Then the pause window, because during it nothing is moving and so no MapLibre
 *     event will fire to reconsider; a timer is the only way back.
 *  3. Then `moving`, and here the answer is to schedule *nothing*: the gesture's own
 *     `moveend` re-arms us, and issuing `easeTo` mid-drag would call MapLibre's
 *     `_stopHandlers()` and cut the drag short under the user's finger.
 */
export function planSpinSegment(state: SpinState): SpinPlan {
  const ineligible = spinIneligibility(state);
  if (ineligible) return { kind: "idle", reason: ineligible };
  const paused = state.pausedUntil - state.now;
  if (paused > 0) return { kind: "wait", delayMs: paused };
  if (state.moving) return { kind: "idle", reason: "camera-busy" };
  const [lng, lat] = state.center;
  // Eastward, and left unwrapped. MapLibre reduces both endpoints modulo 360 before
  // taking the shortest signed difference (`differenceOfAnglesDegrees`), so a target
  // of 260 and a target of −100 are read identically — the wrap is not a hazard to
  // guard against, it is simply not consulted. Unwrapped is the arithmetic-free
  // spelling of "90° east of here", and it is the segment size below, not the
  // wrapping, that keeps the shortest path pointing the way we mean.
  return {
    kind: "ease",
    center: [lng + SPIN_SEGMENT_DEGREES, lat],
    durationMs: SPIN_SEGMENT_MS,
  };
}
