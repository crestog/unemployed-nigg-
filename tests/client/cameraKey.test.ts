import { describe, expect, it } from "vitest";

import {
  BOUNDS_GRID_STEP,
  INDIA_ADM1_ZOOM,
  type CameraSnapshot,
  publishedCameraKey,
} from "../../client/src/lib/cameraKey";

/**
 * These assertions are the throttle's contract, not its implementation. Each one
 * says either "this change must reach React" or "this change must not", and the
 * reason is the consumer named in the test title. A change to a bucket width that
 * breaks one of these is changing what the UI can show, which is a decision rather
 * than a refactor.
 */
const camera = (overrides: Partial<CameraSnapshot> = {}): CameraSnapshot => ({
  center: [0, 0],
  zoom: 1.25,
  bearing: 0,
  pitch: 0,
  bounds: [
    [-180, -60],
    [180, 60],
  ],
  ...overrides,
});

describe("publishedCameraKey", () => {
  it("is stable for an unchanged camera, which is what lets a frame be dropped", () => {
    expect(publishedCameraKey(camera())).toBe(publishedCameraKey(camera()));
  });

  it("changes on the second decimal of zoom, because the readout prints two", () => {
    // `Z 1.25 · 2.4×` in the heads-up display. If this bucket were any wider the
    // number on screen could disagree with the camera it claims to describe.
    expect(publishedCameraKey(camera({ zoom: 1.25 }))).not.toBe(
      publishedCameraKey(camera({ zoom: 1.26 }))
    );
  });

  it("holds through a zoom change too small to print", () => {
    expect(publishedCameraKey(camera({ zoom: 1.25 }))).toBe(
      publishedCameraKey(camera({ zoom: 1.2504 }))
    );
  });

  it("holds across a fifth of a degree of spin, and gives way at half a degree", () => {
    // The globe spins at 2.2°/s, so this is the term that decides the idle
    // re-render rate: ~4 a second at half-degree buckets instead of 60.
    const start = publishedCameraKey(camera({ center: [0, 0] }));
    expect(publishedCameraKey(camera({ center: [0.2, 0] }))).toBe(start);
    expect(publishedCameraKey(camera({ center: [0.6, 0] }))).not.toBe(start);
  });

  it("tracks latitude as well as longitude, so a vertical pan is not invisible", () => {
    expect(publishedCameraKey(camera({ center: [0, 0.6] }))).not.toBe(
      publishedCameraKey(camera({ center: [0, 0] }))
    );
  });

  it("ignores the viewport box below the India zoom, where nothing reads it", () => {
    // Every consumer of the snapped box — the tile effect, the district cull, the
    // locality cull — returns early on zoom before touching it. Down here the box
    // is a globe-wide extent whose 1/8° cells are a fraction of a pixel, so keying
    // on it would re-render for a change that cannot appear on screen.
    const wide = camera({ zoom: INDIA_ADM1_ZOOM - 0.01 });
    const shifted = camera({
      zoom: INDIA_ADM1_ZOOM - 0.01,
      bounds: [
        [-179, -59],
        [179, 59],
      ],
    });
    expect(publishedCameraKey(shifted)).toBe(publishedCameraKey(wide));
  });

  it("tracks the viewport box once the India layers can be on", () => {
    const near = camera({
      zoom: INDIA_ADM1_ZOOM,
      bounds: [
        [70, 8],
        [90, 30],
      ],
    });
    const panned = camera({
      zoom: INDIA_ADM1_ZOOM,
      bounds: [
        [71, 8],
        [91, 30],
      ],
    });
    expect(publishedCameraKey(panned)).not.toBe(publishedCameraKey(near));
  });

  it("holds inside one grid cell of viewport movement", () => {
    const cell = 1 / BOUNDS_GRID_STEP;
    const at = (west: number) =>
      publishedCameraKey(
        camera({
          zoom: 6,
          center: [80, 20],
          bounds: [
            [west, 8],
            [90, 30],
          ],
        })
      );
    // Both west edges floor into the same cell, so the box the culling memos
    // actually receive is byte-identical and there is nothing to re-render for.
    expect(at(70 + cell * 0.1)).toBe(at(70 + cell * 0.9));
    expect(at(70 + cell * 1.1)).not.toBe(at(70 + cell * 0.9));
  });

  it("cannot collide across the India zoom threshold, even before zoom is compared", () => {
    // The bounds terms are appended rather than zeroed, so the keys differ in
    // length. Belt and braces: the zoom term already differs here.
    const below = publishedCameraKey(camera({ zoom: INDIA_ADM1_ZOOM - 0.01 }));
    const above = publishedCameraKey(camera({ zoom: INDIA_ADM1_ZOOM }));
    expect(below.split(",")).toHaveLength(5);
    expect(above.split(",")).toHaveLength(9);
    expect(below).not.toBe(above);
  });

  it("changes on a degree of bearing, so the deep-link URL keeps up with a rotate", () => {
    // Bearing is rendered nowhere; this exists only so the hash-writing effect
    // fires, and it then writes the exact value rather than this rounded one.
    expect(publishedCameraKey(camera({ bearing: 1 }))).not.toBe(
      publishedCameraKey(camera({ bearing: 0 }))
    );
    expect(publishedCameraKey(camera({ bearing: 0.2 }))).toBe(
      publishedCameraKey(camera({ bearing: 0 }))
    );
  });

  it("changes on a degree of pitch, for the same reason", () => {
    expect(publishedCameraKey(camera({ pitch: 45 }))).not.toBe(
      publishedCameraKey(camera({ pitch: 0 }))
    );
  });

  it("does not confuse a zoom change for a pan, or either for a rotate", () => {
    const base = publishedCameraKey(camera());
    const keys = new Set([
      base,
      publishedCameraKey(camera({ zoom: 2 })),
      publishedCameraKey(camera({ center: [10, 0] })),
      publishedCameraKey(camera({ bearing: 30 })),
      publishedCameraKey(camera({ pitch: 30 })),
    ]);
    expect(keys.size).toBe(5);
  });

  it("gives distinct keys across the whole longitude range", () => {
    const keys = new Set(
      [-180, -90, 0, 90, 179.5].map(longitude =>
        publishedCameraKey(camera({ center: [longitude, 0] }))
      )
    );
    expect(keys.size).toBe(5);
  });

  it("reads the antimeridian wrap as a change, which costs one publish a revolution", () => {
    // ±180° is the same meridian, so this is a key change with no camera change
    // behind it. Left alone rather than special-cased: the spin crosses it once
    // every 164 seconds, and folding longitude would put a branch in the hot path
    // to save a single re-render.
    expect(publishedCameraKey(camera({ center: [-180, 0] }))).not.toBe(
      publishedCameraKey(camera({ center: [180, 0] }))
    );
  });
});
