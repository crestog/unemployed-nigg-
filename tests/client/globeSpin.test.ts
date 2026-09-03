import { describe, expect, it } from "vitest";

import {
  SPIN_DEGREES_PER_SECOND,
  SPIN_MAX_ZOOM,
  SPIN_SEGMENT_DEGREES,
  SPIN_SEGMENT_MS,
  type SpinState,
  planSpinSegment,
} from "../../client/src/lib/globeSpin";

/**
 * The spin's contract. Two of these assertions exist because the previous
 * implementation violated them and cost a 29-second main-thread block: a segment
 * must never be issued while the camera is busy, and the target longitude must be
 * left unwrapped. The rest pin the guard order, which is the part that decides
 * whether the spin can fight the user's pointer.
 */
const state = (overrides: Partial<SpinState> = {}): SpinState => ({
  enabled: true,
  reducedMotion: false,
  zoom: 1.25,
  moving: false,
  now: 10_000,
  pausedUntil: 0,
  center: [0, 0],
  ...overrides,
});

describe("planSpinSegment", () => {
  it("eases east by one segment when everything is quiet", () => {
    expect(planSpinSegment(state())).toEqual({
      kind: "ease",
      center: [SPIN_SEGMENT_DEGREES, 0],
      durationMs: SPIN_SEGMENT_MS,
    });
  });

  it("holds the latitude, so spinning never drifts off the parallel it started on", () => {
    const plan = planSpinSegment(state({ center: [12, 47.5] }));
    expect(plan).toMatchObject({ kind: "ease", center: [12 + SPIN_SEGMENT_DEGREES, 47.5] });
  });

  it("leaves the target longitude unwrapped past 180", () => {
    // MapLibre eases along the shortest angular path and wraps as it interpolates,
    // so `170 + 90 = 260` reads as "90° east of 170°". Normalising it to −100 first
    // would be read as 270° *west* and the globe would visibly reverse.
    expect(planSpinSegment(state({ center: [170, 0] }))).toMatchObject({
      kind: "ease",
      center: [260, 0],
    });
  });

  it("keeps the segment under the 180 degrees where the shortest path flips", () => {
    expect(SPIN_SEGMENT_DEGREES).toBeLessThan(180);
  });

  it("turns at the documented rate", () => {
    expect(SPIN_SEGMENT_DEGREES / (SPIN_SEGMENT_MS / 1000)).toBeCloseTo(
      SPIN_DEGREES_PER_SECOND,
      10
    );
  });

  it("schedules nothing at all when the spin is off", () => {
    // Not a timer that wakes to discover it is off: the loop this replaced parked a
    // frame callback per frame in exactly this state.
    expect(planSpinSegment(state({ enabled: false }))).toEqual({
      kind: "idle",
      reason: "disabled",
    });
  });

  it("schedules nothing under prefers-reduced-motion", () => {
    expect(planSpinSegment(state({ reducedMotion: true }))).toEqual({
      kind: "idle",
      reason: "reduced-motion",
    });
  });

  it("stops once zoomed past the limb, and still runs exactly at the threshold", () => {
    expect(planSpinSegment(state({ zoom: SPIN_MAX_ZOOM + 0.01 }))).toEqual({
      kind: "idle",
      reason: "zoomed-in",
    });
    expect(planSpinSegment(state({ zoom: SPIN_MAX_ZOOM }))).toMatchObject({ kind: "ease" });
  });

  it("never issues a segment while the camera is busy", () => {
    // This is the one that matters for feel: `easeTo` calls MapLibre's
    // `_stopHandlers()`, so issuing one mid-drag cuts the drag short under the
    // user's finger. The gesture's own `moveend` re-arms the spin instead.
    expect(planSpinSegment(state({ moving: true }))).toEqual({
      kind: "idle",
      reason: "camera-busy",
    });
  });

  it("waits out the pause window rather than spinning through it", () => {
    expect(planSpinSegment(state({ now: 1_000, pausedUntil: 8_000 }))).toEqual({
      kind: "wait",
      delayMs: 7_000,
    });
  });

  it("asks to be woken exactly when the pause expires, since nothing else will", () => {
    // No camera movement during the window means no MapLibre event to reconsider on,
    // so the delay has to be the real remaining time — too short and it spins early,
    // too long and the globe sits dead.
    const plan = planSpinSegment(state({ now: 5_500, pausedUntil: 5_750 }));
    expect(plan).toEqual({ kind: "wait", delayMs: 250 });
  });

  it("resumes the instant the window closes", () => {
    expect(planSpinSegment(state({ now: 5_000, pausedUntil: 5_000 }))).toMatchObject({
      kind: "ease",
    });
  });

  it("prefers the disabled answer over the pause answer", () => {
    // Otherwise toggling the spin off during the 7-second post-interaction window
    // would leave a timer armed that starts spinning after the toggle.
    expect(planSpinSegment(state({ enabled: false, now: 0, pausedUntil: 7_000 }))).toEqual({
      kind: "idle",
      reason: "disabled",
    });
  });

  it("prefers waiting over reporting a busy camera", () => {
    // A drag both sets the pause and leaves the camera moving. Reporting
    // `camera-busy` here would be correct but useless — it schedules nothing, and
    // the `moveend` that would re-arm us has already fired by the time inertia
    // stops. The wait is what actually brings the spin back.
    expect(planSpinSegment(state({ moving: true, now: 0, pausedUntil: 7_000 }))).toEqual({
      kind: "wait",
      delayMs: 7_000,
    });
  });
});
