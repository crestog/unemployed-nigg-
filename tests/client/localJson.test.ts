// `readJson` was duplicated byte-for-byte in two pages and neither copy was
// reachable from a test, because both pages import React. The extraction exists
// so this file can exist: the three localStorage keys in AtlasRoadmaps used to
// be hydrated in an effect that wiped all three when any one of them was
// corrupt, then persisted the wipe.

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isRecord,
  isStringArray,
  readJson,
  writeJson,
} from "../../client/src/lib/localJson";

function stubStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  return store;
}

describe("readJson", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("returns the stored value when it parses", () => {
    stubStorage({ k: JSON.stringify(["a", "b"]) });
    expect(readJson("k", [], isStringArray)).toEqual(["a", "b"]);
  });

  it("returns the fallback for an absent key", () => {
    stubStorage();
    expect(readJson("k", ["default"])).toEqual(["default"]);
  });

  it("returns the fallback for corrupt JSON instead of throwing", () => {
    stubStorage({ k: "{not json" });
    expect(readJson("k", [])).toEqual([]);
  });

  it("returns the fallback when localStorage itself throws", () => {
    // Safari in private mode, and any browser with storage denied by policy.
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
    });
    expect(readJson("k", { safe: true })).toEqual({ safe: true });
  });

  it("rejects a value of the wrong shape when a guard is supplied", () => {
    // The reason the guard exists: JSON.parse is happy to hand back a number
    // where component state will be spread as an array.
    stubStorage({ k: "5" });
    expect(readJson("k", [], isStringArray)).toEqual([]);
    expect(readJson("k", {}, isRecord)).toEqual({});
  });

  it("accepts a wrong-shaped value when no guard is supplied", () => {
    // Documents the two pre-existing call sites, which pass no guard.
    stubStorage({ k: "5" });
    expect(readJson<unknown>("k", [])).toBe(5);
  });

  it("rejects an array of non-strings", () => {
    stubStorage({ k: JSON.stringify(["a", 2]) });
    expect(readJson("k", [], isStringArray)).toEqual([]);
  });

  it("treats an array as not a record, so a swapped key cannot leak through", () => {
    stubStorage({ k: JSON.stringify(["a"]) });
    expect(readJson("k", { fallback: 1 }, isRecord)).toEqual({ fallback: 1 });
  });
});

describe("writeJson", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("persists the serialised value", () => {
    const store = stubStorage();
    writeJson("k", { a: 1 });
    expect(store.get("k")).toBe('{"a":1}');
  });

  it("swallows a quota or permission failure rather than reaching the error boundary", () => {
    // This ran in a useEffect, so an uncaught throw took the whole page down.
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
    });
    expect(() => writeJson("k", { a: 1 })).not.toThrow();
  });
});
