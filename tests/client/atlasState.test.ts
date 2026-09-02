// The client half of the per-roadmap scoping fix. `progressForRoadmap` and
// `notesForRoadmap` are the only readers of the nested snapshot shape, so an
// error here reintroduces the cross-roadmap bleed that
// tests/worker/stateScoping.test.ts covers on the server side.

import { describe, expect, it } from "vitest";

import {
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
