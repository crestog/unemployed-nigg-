import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// `MapLibreWorldScene` needs a WebGL context, so its event wiring cannot be
// exercised in jsdom. These assertions read the source instead, and they exist
// because one specific mistake in that wiring is both silent and unbounded:
// `map.resize()` fires MapLibre's own `resize` event, so a `resize` handler that
// calls `map.resize()` re-enters itself until the stack is exhausted. The
// browser recorded 128 nested `Map.resize → Map.fire → handler` frames ending in
// `RangeError: Maximum call stack size exceeded` inside
// `GlobeTransform._calcMatrices`, with no visible symptom on the map — nothing
// else in the gate catches it, and the line was written twice in this file's
// history before it was found.
const sceneSource = readFileSync(
  fileURLToPath(new URL("../../client/src/components/MapLibreWorldScene.tsx", import.meta.url)),
  "utf8"
);

// The file documents each removed mechanism by name, so matching raw source
// would find `map.on("resize", …)` inside the comment that explains why it must
// not exist. These assertions are about code; strip comments before matching.
const scene = sceneSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");

describe("MapLibreWorldScene event wiring", () => {
  it("does not subscribe to MapLibre's own resize event", () => {
    const resizeSubscriptions = scene.match(/\bmap\s*\.\s*on\s*\(\s*(["'])resize\1/g) ?? [];
    expect(resizeSubscriptions).toEqual([]);
  });

  it("drives resize from a ResizeObserver on the container instead", () => {
    expect(scene).toMatch(/new ResizeObserver\(\s*\(\)\s*=>\s*map\.resize\(\)\s*\)/);
    expect(scene).toMatch(/resizeObserver\.observe\(container\)/);
    expect(scene).toMatch(/resizeObserver\.disconnect\(\)/);
  });

  it("keeps the camera listener free of camera writes, so `move` cannot re-enter itself", () => {
    const syncCamera = scene.match(/const syncCamera = \(\) => \{[\s\S]*?\n {6}\};/)?.[0] ?? "";
    expect(syncCamera).not.toBe("");
    expect(syncCamera).not.toMatch(/map\.(jumpTo|easeTo|flyTo|setCenter|setZoom|fitBounds|resize)\(/);
  });

  it("renders one projection: no d3 overlay canvas and no per-frame render handler", () => {
    expect(scene).not.toMatch(/\bmap\s*\.\s*on\s*\(\s*(["'])render\1/);
    expect(scene).not.toMatch(/geoOrthographic\(/);
    expect(scene).toMatch(/setProjection\(\{ type: "globe" \}\)/);
  });
});

// The idle spin was a `requestAnimationFrame` loop calling `map.setCenter` once a frame.
// `setCenter` delegates to `jumpTo`, which fires `moveend` *synchronously*, and the loop
// re-armed from `moveend` as well as from its own rAF while clearing its in-flight handle
// at the top of the callback — so each frame scheduled two callbacks and overwrote the
// first handle without cancelling it. Two per frame, then four, then eight: the profile
// caught a 29,005 ms main-thread block and 3 fps against 60 fps with the spin off. Like
// the resize recursion above, nothing else in the gate sees it, so the shape of the
// scheduler is asserted here.
describe("MapLibreWorldScene spin scheduling", () => {
  it("never drives the camera from an animation frame", () => {
    expect(scene).not.toMatch(/requestAnimationFrame/);
  });

  it("issues the spin's camera animation from exactly one place, and flags it as in flight", () => {
    // Every arming path funnels into `spinSegment`, so a second `easeTo` inside it is how
    // a segment starts landing on top of the one already running. The other two `easeTo`
    // call sites in the file are the imperative zoom/focus handles, which are gestures as
    // far as the spin is concerned — they must not set `spinEasing`, or `syncSpin` would
    // call `map.stop()` on the user's own animation.
    const segment = scene.match(/function spinSegment\(\) \{[\s\S]*?\n {6}\}/)?.[0] ?? "";
    expect(segment).not.toBe("");
    expect(segment.match(/map\.easeTo\(/g) ?? []).toHaveLength(1);
    expect(segment).toMatch(/spinEasing = true;\s*map\.easeTo\(/);
    expect(scene.match(/spinEasing = true;/g) ?? []).toHaveLength(1);
  });

  it("cancels the pending timer before arming another, so only one is ever live", () => {
    const arm = scene.match(/const armSpin = \([\s\S]*?\n {6}\};/)?.[0] ?? "";
    expect(arm).not.toBe("");
    expect(arm).toMatch(/if \(spinTimer !== null\) window\.clearTimeout\(spinTimer\);/);
    expect(arm).toMatch(/spinTimer = window\.setTimeout\(spinSegment,/);
  });

  it("re-checks the spin on both edges of the toggle, not just when it is switched on", () => {
    // A segment runs for 41 seconds. `if (spinEnabled)` here left the globe turning
    // that long after the button said it had stopped.
    const effect = scene.match(/useEffect\(\(\) => \{\s*startSpinRef\.current\?\.\(\);\s*\}, \[spinEnabled\]\);/);
    expect(effect).not.toBeNull();
  });

  it("halts only its own segment, never a gesture", () => {
    const sync = scene.match(/const syncSpin = \(\) => \{[\s\S]*?\n {6}\};/)?.[0] ?? "";
    expect(sync).not.toBe("");
    expect(sync).toMatch(/if \(spinEasing && ineligible\)/);
    expect(sync).toMatch(/map\.stop\(\)/);
    expect(scene).toMatch(/spinEasing = false;/);
  });
});

// Web Mercator. Three features in world-atlas' countries-50m step straight across
// the antimeridian, which on a sphere is a short hop and in the plane is a
// 359.9°-wide edge: Russia's Wrangel Island painted a band across the Arctic (a
// probe in northern Canada returned "Russian Federation"), Fiji's Vanua Levu drew
// the same band across the South Pacific, and Antarctica's pole-encircling coast
// filled a strip instead of a cap. The conditioning has to be applied to *every*
// geometry handed to a MapLibre source, so assert the call sites rather than the
// helper.
describe("MapLibreWorldScene geometry conditioning", () => {
  it("conditions country and boundary geometry for a planar tiler", () => {
    expect(scene).toMatch(/geometry: splitGeometryAtAntimeridian\(item\.feature\.geometry\)/);
    expect(scene).toMatch(/geometry: splitGeometryAtAntimeridian\(item\.geometry\)/);
    expect(scene).not.toMatch(/geometry: item\.geometry,/);
  });
});

// Every array reaching this component is derived upstream from `mapView.bounds`,
// a fresh array on every camera update, so keying uploads on object identity
// re-tiled all five sources on every frame of a drag — and each `setData`
// restarts symbol placement, which is what made labels appear at positions
// computed for an older camera.
describe("MapLibreWorldScene source uploads", () => {
  it("routes every source through one content-keyed upload path", () => {
    const uploads = scene.match(/useGeoJsonSource\(mapRef, styleReady, "[^"]+"/g) ?? [];
    expect(uploads).toHaveLength(6);
    expect(scene.match(/sourceSetData\(map,/g) ?? []).toHaveLength(1);
  });

  it("keys the upload effect on the signature, not on the records array", () => {
    const hook = scene.match(/function useGeoJsonSource<T>\([\s\S]*?\n\}/)?.[0] ?? "";
    expect(hook).not.toBe("");
    const syncEffect = hook.match(/const map = mapRef\.current;[\s\S]*?\]\);/)?.[0] ?? "";
    expect(syncEffect).toMatch(/\}, \[mapRef, ready, signature, sourceId, toFeature\]\);/);
    expect(syncEffect).toMatch(/recordsRef\.current/);
  });
});

// The entity layer aggregates by interned position: 11,370 records sit on 366 coordinates, so a
// marker stands for a *group*, and two things about it are load-bearing rather than cosmetic.
describe("MapLibreWorldScene entity markers", () => {
  it("encodes count as area, not as radius", () => {
    // `weight` is sqrt(count) upstream. Interpolating radius on ["get", "count"] instead would give
    // a 4,541-record position 4,541x the ink of a single one.
    const core = scene.match(/id: "atlas-entity-core",[\s\S]*?\n {6}\},/)?.[0] ?? "";
    expect(core).not.toBe("");
    expect(core).toMatch(/\["\*", [\d.]+, \["get", "weight"\]\]/);
    expect(core).not.toMatch(/\["get", "count"\]/);
  });

  it("draws the approximation ring only where the coordinate is a centroid", () => {
    // precision 0 is a real city coordinate; 1 and 2 are district and state centroids, where the
    // marker stands for an area and a bare pin would claim precision the data does not have.
    const halo = scene.match(/id: "atlas-entity-halo",[\s\S]*?\n {6}\},/)?.[0] ?? "";
    expect(halo).toMatch(/filter: \[">", \["get", "precision"\], 0\]/);
  });

  it("hit-tests markers above the geography they sit on", () => {
    const pick = scene.match(/queryRenderedFeatures\(event\.point\)[\s\S]*?\}\);/)?.[0] ?? "";
    expect(pick).toMatch(/id === "atlas-entity-core"/);
  });

  it("labels an aggregate with its place name, not with a bare count", () => {
    // The regression this guards: `text-field` used to resolve to ["to-string", ["get", "count"]]
    // for every position holding more than one record, which is 272 of 366 — so the map was mostly
    // unlabelled integers. The place name must be the first section of the label, and the count may
    // only appear alongside it.
    const label = scene.match(/id: "atlas-entity-label",[\s\S]*?\n {6}\},/)?.[0] ?? "";
    expect(label).not.toBe("");
    const textField = label.match(/"text-field": \[[\s\S]*?\n {10}\],/)?.[0] ?? "";
    expect(textField).toMatch(/"format"/);
    // Order has to be compared *inside* the `format` sections. The `case` predicate that selects
    // them is itself `[">", ["get", "count"], 1]`, so a search over the whole expression always
    // finds `count` before `name` and the check can never pass, whatever the label really says.
    const format = textField.match(/"format",[\s\S]*?\n {12}\],/)?.[0] ?? "";
    expect(format).not.toBe("");
    expect(format).toContain('["get", "name"]');
    // The name section must precede the count section, or the count is still what reads as the label.
    expect(format.indexOf('["get", "name"]')).toBeLessThan(format.indexOf('["get", "count"]'));
    expect(textField).not.toMatch(/\[">", \["get", "count"\], 1\], \["to-string"/);
  });
});
