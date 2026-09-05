import { describe, expect, it } from "vitest";

import {
  FIT_BOUNDS_ZOOM_HEADROOM,
  MAX_GLOBE_LATITUDE,
  focusZoom,
  globeZoomAdjustment,
  globeZoomForLatitude,
} from "../../client/src/lib/globeZoom";

/**
 * These numbers are not derived from the implementation. They were measured on the live
 * scene at 1425x832 with the idle spin neutralised and render frames pumped by hand:
 * MapLibre's own panning took zoom 2 at latitude 0 to zoom −1.5351 at latitude 85.051129
 * while holding ground scale at 5.689 px per degree of latitude throughout. If this file
 * starts failing, the question is whether MapLibre changed `getZoomAdjustment`, not
 * whether the expectations need loosening.
 */
const MEASURED = {
  zoomAtEquator: 2,
  zoomAtPole: -1.5351,
  /** px per degree of latitude, constant under MapLibre's own compensation. */
  groundScale: 5.689,
  /** At a fixed zoom of 2 instead, the same excursion tightened the scale to this. */
  uncompensatedScaleAtPole: 65.264,
};

describe("globeZoomAdjustment", () => {
  it("reproduces the zoom MapLibre's own panning reached at the pole", () => {
    expect(MEASURED.zoomAtEquator + globeZoomAdjustment(0, MAX_GLOBE_LATITUDE)).toBeCloseTo(
      MEASURED.zoomAtPole,
      3
    );
  });

  it("equals the scale ratio the uncompensated camera showed", () => {
    // Independent check on the same term from the other measurement: holding zoom fixed
    // multiplied the scale by 65.264/5.689, so the compensation owed is log2 of that.
    //
    // Deliberately loose. The scale oracle was the pixel distance between centre ±0.5° of
    // latitude, and at 85° the scale changes ~3.6% per degree, so a one-degree secant
    // cannot resolve the tangent scale better than about 1% (it read 11.472x where the
    // closed form is 11.592x). Tightening this would be pretending the probe was sharper
    // than it was; at 0.05 it still catches a sign error, a missing log2, or a factor of 2.
    const measuredRatio = MEASURED.uncompensatedScaleAtPole / MEASURED.groundScale;
    expect(globeZoomAdjustment(0, MAX_GLOBE_LATITUDE)).toBeCloseTo(-Math.log2(measuredRatio), 1);
  });

  it("is zero along a parallel, in both hemispheres", () => {
    expect(globeZoomAdjustment(47.5, 47.5)).toBe(0);
    expect(globeZoomAdjustment(-33.9, -33.9)).toBe(0);
  });

  it("loses zoom going poleward and regains it coming back", () => {
    expect(globeZoomAdjustment(0, 60)).toBeLessThan(0);
    expect(globeZoomAdjustment(60, 0)).toBeGreaterThan(0);
    expect(globeZoomAdjustment(0, 60) + globeZoomAdjustment(60, 0)).toBeCloseTo(0, 12);
  });

  it("is exactly one stop between the equator and 60 degrees", () => {
    // cos(60°) = 1/2, so this is the one value that can be checked without a calculator.
    expect(globeZoomAdjustment(0, 60)).toBeCloseTo(-1, 12);
  });

  it("treats north and south alike", () => {
    expect(globeZoomAdjustment(0, 52.3)).toBeCloseTo(globeZoomAdjustment(0, -52.3), 12);
  });

  it("chains, so no path between two latitudes is cheaper than another", () => {
    expect(globeZoomAdjustment(12, 40) + globeZoomAdjustment(40, 71)).toBeCloseTo(
      globeZoomAdjustment(12, 71),
      12
    );
  });

  it("clamps at the pole instead of falling off a cliff", () => {
    // cos(90°) is 6.1e-17, not 0, so unclamped this would be −54 stops and the camera
    // would be asked for a zoom that means nothing. Feature coordinates come from data
    // files, so a polar row is a plausible input.
    expect(globeZoomAdjustment(0, 90)).toBeCloseTo(globeZoomAdjustment(0, MAX_GLOBE_LATITUDE), 12);
    expect(globeZoomAdjustment(0, 1e6)).toBeCloseTo(globeZoomAdjustment(0, MAX_GLOBE_LATITUDE), 12);
    expect(globeZoomAdjustment(0, 90)).toBeGreaterThan(-4);
  });
});

describe("globeZoomForLatitude", () => {
  it("is the identity at the reference latitude", () => {
    expect(globeZoomForLatitude(3.7, 18, 18)).toBe(3.7);
  });

  it("re-expresses a zoom measured at one latitude for another", () => {
    expect(globeZoomForLatitude(MEASURED.zoomAtEquator, MAX_GLOBE_LATITUDE, 0)).toBeCloseTo(
      MEASURED.zoomAtPole,
      3
    );
  });

  it("round-trips", () => {
    const atPole = globeZoomForLatitude(4, 78, 18);
    expect(globeZoomForLatitude(atPole, 18, 78)).toBeCloseTo(4, 12);
  });

  it("passes a non-finite latitude through untouched rather than emitting NaN", () => {
    // A NaN zoom handed to `easeTo` poisons the transform permanently: every later
    // `project()` returns NaN and the map stops responding to input.
    expect(globeZoomForLatitude(2.5, Number.NaN, 18)).toBe(2.5);
    expect(globeZoomForLatitude(2.5, 40, Number.NaN)).toBe(2.5);
    expect(globeZoomForLatitude(2.5, Number.POSITIVE_INFINITY, 18)).toBe(2.5);
  });
});

/**
 * The scene's real call sites: `focusGeoPoint` passes 4.1 for an adm1 selection, 7.2 for
 * adm2 and 12.5 for a locality; `focusNode` defaults to 3.8. The base view is zoom 1.25 at
 * latitude 18 unless a URL hash supplies another.
 */
const scene = {
  baseZoom: 1.25,
  baseLatitude: 18,
  minZoom: 0,
  maxZoom: 24,
};

describe("focusZoom", () => {
  it("frames a high-latitude selection at the same ground scale as an equatorial one", () => {
    // The defect this function exists to fix. Both requests ask for adm1 framing (4.1x);
    // before the latitude term the pole got the same zoom number as the equator, which on
    // a globe is 11.5x tighter — a Norwegian county filled the viewport while a Kenyan one
    // sat in the middle of it.
    const equator = focusZoom({ ...scene, latitude: 0, zoomFactor: 4.1 });
    const sixty = focusZoom({ ...scene, latitude: 60, zoomFactor: 4.1 });
    expect(sixty - equator).toBeCloseTo(globeZoomAdjustment(0, 60), 12);
    expect(sixty - equator).toBeCloseTo(-1, 12);
  });

  it("carries the full 3.54 stops out to the pole, when the range allows it", () => {
    // Same check at the extreme, with a locality-scale factor (12.5x) so the floor does
    // not truncate the answer — see the clamp test below for what happens when it does.
    const equator = focusZoom({ ...scene, latitude: 0, zoomFactor: 12.5 });
    const pole = focusZoom({ ...scene, latitude: MAX_GLOBE_LATITUDE, zoomFactor: 12.5 });
    expect(pole - equator).toBeCloseTo(globeZoomAdjustment(0, MAX_GLOBE_LATITUDE), 12);
    expect(pole).toBeLessThan(equator);
    expect(pole).toBeGreaterThan(scene.minZoom);
  });

  it("turns a linear factor into stops, relative to the captured base view", () => {
    expect(focusZoom({ ...scene, latitude: 18, zoomFactor: 4 })).toBeCloseTo(1.25 + 2, 12);
    expect(focusZoom({ ...scene, latitude: 18, zoomFactor: 1 })).toBeCloseTo(1.25, 12);
  });

  it("ignores a factor below 1 instead of zooming out", () => {
    // `focusFeature` is a selection response. Selecting something must never pull the
    // camera further away than the view it was selected from.
    expect(focusZoom({ ...scene, latitude: 18, zoomFactor: 0 })).toBeCloseTo(1.25, 12);
    expect(focusZoom({ ...scene, latitude: 18, zoomFactor: -3 })).toBeCloseTo(1.25, 12);
  });

  it("adds the fitBounds headroom on top", () => {
    const plain = focusZoom({ ...scene, latitude: 55, zoomFactor: 7.2 });
    const capped = focusZoom({
      ...scene,
      latitude: 55,
      zoomFactor: 7.2,
      extraZoom: FIT_BOUNDS_ZOOM_HEADROOM,
    });
    expect(capped - plain).toBeCloseTo(FIT_BOUNDS_ZOOM_HEADROOM, 12);
  });

  it("stays inside the map's own range, at both ends", () => {
    // The floor is the one that bites: minZoom is 0 here while the latitude term is worth
    // −3.46 stops at the pole, so an overview-scale focus near a pole computes below the
    // floor. MapLibre would substitute the floor silently; this makes it explicit.
    expect(
      focusZoom({ ...scene, baseZoom: 0.2, latitude: MAX_GLOBE_LATITUDE, zoomFactor: 1 })
    ).toBe(0);
    expect(focusZoom({ ...scene, latitude: 0, zoomFactor: 1e9 })).toBe(24);
  });

  it("never returns a zoom the camera cannot accept", () => {
    for (const latitude of [-90, -85.051129, -42, 0, 18, 61.5, 85.051129, 90, Number.NaN]) {
      for (const zoomFactor of [0, 1, 3.8, 4.1, 7.2, 12.5, Number.NaN]) {
        const zoom = focusZoom({ ...scene, latitude, zoomFactor });
        expect(Number.isFinite(zoom)).toBe(true);
        expect(zoom).toBeGreaterThanOrEqual(scene.minZoom);
        expect(zoom).toBeLessThanOrEqual(scene.maxZoom);
      }
    }
  });

  it("drops the correction rather than the request when the latitude is unusable", () => {
    // `Math.min`/`Math.max` propagate NaN, so the clamp cannot be the thing that catches
    // this — one malformed coordinate would otherwise wedge the camera for the session
    // (a NaN zoom poisons the transform: every later `project()` returns NaN).
    //
    // What survives is the uncorrected zoom — 1.25 + log2(4.1) — which is precisely the
    // pre-fix behaviour, and the right answer for a point whose latitude is unknown.
    expect(focusZoom({ ...scene, latitude: Number.NaN, zoomFactor: 4.1 })).toBeCloseTo(
      1.25 + Math.log2(4.1),
      12
    );
    // A factor that is not a number leaves nothing to preserve, so the base view is the
    // fallback, and a base that is itself unusable falls back to the map's floor.
    expect(focusZoom({ ...scene, latitude: 20, zoomFactor: Number.NaN })).toBeCloseTo(1.25, 12);
    expect(focusZoom({ ...scene, baseZoom: Number.NaN, latitude: 20, zoomFactor: 4.1 })).toBe(0);
  });
});
