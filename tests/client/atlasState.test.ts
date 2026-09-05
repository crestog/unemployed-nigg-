// The client half of the per-roadmap scoping fix. `progressForRoadmap` and
// `notesForRoadmap` are the only readers of the nested snapshot shape, so an
// error here reintroduces the cross-roadmap bleed that
// tests/worker/stateScoping.test.ts covers on the server side.

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  flushAtlasStateOutbox,
  isPermanentStateRejection,
  notesForRoadmap,
  progressForRoadmap,
  type AtlasSnapshot,
} from "../../client/src/lib/atlasState";

const snapshot = (
  overrides: Partial<AtlasSnapshot> = {}
): AtlasSnapshot => ({
  profile: "test-profile",
  favorites: [],
  progress: {},
  notes: {},
  plans: [],
  ...overrides,
});

describe("progressForRoadmap", () => {
  it("returns only the requested roadmap's topics", () => {
    const state = snapshot({
      progress: { frontend: { html: true }, backend: { html: false } },
    });
    expect(progressForRoadmap(state, "frontend")).toEqual({ html: true });
    expect(progressForRoadmap(state, "backend")).toEqual({ html: false });
  });

  it("returns an empty object for a roadmap with no saved progress", () => {
    // Not undefined: call sites spread the result into component state, and a
    // spread of undefined is a silent no-op that would look like data loss.
    expect(progressForRoadmap(snapshot(), "frontend")).toEqual({});
  });

  it("tolerates a null snapshot, which is what a failed or offline load gives", () => {
    expect(progressForRoadmap(null, "frontend")).toEqual({});
  });

  it("tolerates a snapshot with the field missing entirely", () => {
    // A server older than migrations/0003 answers with the flat shape. Reading a
    // slug out of it must come back empty rather than yielding a boolean.
    const legacy = { profile: "p", favorites: [], plans: [] } as unknown as AtlasSnapshot;
    expect(progressForRoadmap(legacy, "frontend")).toEqual({});
    expect(notesForRoadmap(legacy, "frontend")).toEqual({});
  });
});

describe("notesForRoadmap", () => {
  it("keeps a note on one roadmap out of another", () => {
    const state = snapshot({
      notes: {
        frontend: { html: "revise semantic elements" },
        devops: { html: "skip" },
      },
    });
    expect(notesForRoadmap(state, "frontend")).toEqual({
      html: "revise semantic elements",
    });
    expect(notesForRoadmap(state, "devops")).toEqual({ html: "skip" });
    expect(notesForRoadmap(state, "android")).toEqual({});
  });
});

// The outbox drain. `postStateAction` used to answer `null` for both a thrown
// fetch and any non-OK status, and the loop `break`s on that value *without*
// shifting the item — so one permanently-rejected action blocked every later
// sync forever, silently. The live trigger was RoadmapPlan sending `hours` as a
// <select> string into a validator that rejects non-numbers.
const OUTBOX_KEY = "atlas-state-outbox-v1";

function stubStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  return store;
}

const queued = (id: string, slug: string) =>
  JSON.stringify([
    { actionId: id, action: { action: "favorite", roadmapSlug: slug, saved: true } },
  ]);

describe("isPermanentStateRejection", () => {
  it("drops only the statuses that can never succeed on a retry", () => {
    expect(isPermanentStateRejection(400)).toBe(true);
    expect(isPermanentStateRejection(422)).toBe(true);
  });

  it("retries everything else, including other 4xx", () => {
    // 403 can be a Cloudflare challenge and 429 is backpressure. Treating "any
    // 4xx" as permanent would trade a stuck queue for discarded user data.
    for (const status of [401, 403, 404, 429, 500, 502, 503]) {
      expect(isPermanentStateRejection(status)).toBe(false);
    }
  });
});

describe("flushAtlasStateOutbox", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    // Node 24 defines `navigator` but not `onLine`, which would otherwise make
    // the drain return early and pass this suite for the wrong reason.
    vi.stubGlobal("navigator", { onLine: true });
  });

  it("drops a permanently-rejected head and keeps draining behind it", async () => {
    const store = stubStorage({
      [OUTBOX_KEY]: JSON.stringify([
        { actionId: "poisoned", action: { action: "plan", roadmapSlug: "frontend", goal: "g", level: "beginner", hours: 5, pace: "steady", topicIds: [] } },
        { actionId: "innocent", action: { action: "favorite", roadmapSlug: "backend", saved: true } },
      ]),
    });
    const seen: string[] = [];
    const errors = vi.fn();
    vi.stubGlobal("console", { ...console, error: errors });
    vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
      const { actionId } = JSON.parse(init.body) as { actionId: string };
      seen.push(actionId);
      if (actionId === "poisoned") return { ok: false, status: 400 };
      return { ok: true, status: 200, json: async () => snapshot() };
    });

    await flushAtlasStateOutbox();

    // The second action must have reached the server, and the queue must empty.
    expect(seen).toEqual(["poisoned", "innocent"]);
    expect(store.get(OUTBOX_KEY)).toBeUndefined();
    expect(errors).toHaveBeenCalledOnce();
  });

  it("keeps a transiently-failed action queued rather than discarding it", async () => {
    const store = stubStorage({ [OUTBOX_KEY]: queued("later", "devops") });
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 503 }));

    await flushAtlasStateOutbox();

    expect(store.get(OUTBOX_KEY)).toBe(queued("later", "devops"));
  });

  it("keeps the action queued when the network throws", async () => {
    const store = stubStorage({ [OUTBOX_KEY]: queued("offline", "ai") });
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });

    await flushAtlasStateOutbox();

    expect(store.get(OUTBOX_KEY)).toBe(queued("offline", "ai"));
  });
});
