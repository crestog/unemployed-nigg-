/**
 * localStorage access that cannot throw and cannot hand back the wrong shape.
 *
 * `readJson` existed twice, byte-identical, in AiRoadmapResult.tsx and
 * RoadmapDetail.tsx. It lives here now so there is one definition, and so it is
 * testable under the node test environment — neither page can be imported by a
 * test, because both pull in React and the roadmap catalog.
 *
 * Read these as lazy `useState` initialisers, not from an effect. An effect's
 * setState is deferred until after every passive effect in that commit has run,
 * so a "hydrate in one effect, persist in three more" arrangement fires the
 * persist effects first and writes the empty first-render defaults back to disk
 * on every mount. AtlasRoadmaps.tsx did exactly that.
 */

/**
 * `|| ""` is deliberate: a missing key yields `""`, `JSON.parse("")` throws, and
 * the fallback is returned — one path for absent, corrupt, and storage-denied.
 *
 * `isValid` is optional so the two existing call sites keep their behaviour.
 * Supply it wherever a wrong-typed value would be spread into component state:
 * `JSON.parse` is happy to return `5` where a `string[]` is expected.
 */
export function readJson<T>(
  key: string,
  fallback: T,
  isValid?: (value: unknown) => boolean
): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "") as unknown;
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Quota pressure and private-browsing denials must not reach the error boundary.
 * A failed persist still leaves the in-memory state correct for this session,
 * which is a far better outcome than a blank screen. `writeOutbox` in
 * atlasState.ts already takes this position; this is the same guard.
 */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Intentionally silent: nothing the user can act on, and the session works.
  }
}

/** Guards for the shapes these keys actually hold. */
export const isStringArray = (value: unknown): boolean =>
  Array.isArray(value) && value.every(item => typeof item === "string");

export const isRecord = (value: unknown): boolean =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
