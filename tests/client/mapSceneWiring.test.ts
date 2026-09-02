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
