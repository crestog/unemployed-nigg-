// The regression these cover is the one that was live: progress and notes keyed
// on topic id alone. Topic ids are not unique across roadmaps — `html`, `git`,
// `sql` and `docker` appear in most of the 92-roadmap catalog — so completing a
// shared topic in one roadmap surfaced as complete in every other roadmap using
// the same id, and the D1 rows overwrote each other besides
// (migrations/0003_scope_state_by_roadmap.sql).

import { describe, expect, it, vi } from "vitest";

import { groupBySlug, parseTopicIds } from "../../worker";

type ProgressRow = {
  roadmap_slug: string;
  topic_id: string;
  completed: number;
  updated_at: string;
};

const row = (
  slug: string,
  topic: string,
  completed = 1,
  updated_at = "2026-01-01T00:00:00.000Z"
): ProgressRow => ({
  roadmap_slug: slug,
  topic_id: topic,
  completed,
  updated_at,
});

describe("groupBySlug", () => {
  it("keeps the same topic id separate per roadmap", () => {
    const grouped = groupBySlug(
      [row("frontend", "html", 1), row("backend", "html", 0)],
      r => Boolean(r.completed)
    );
    expect(grouped).toEqual({
      frontend: { html: true },
      backend: { html: false },
    });
  });

  it("returns an empty object for no rows rather than undefined", () => {
    expect(groupBySlug([] as ProgressRow[], r => r.completed)).toEqual({});
  });

  it("takes the first row per (slug, topic), which is the newest", () => {
    // The query orders by `updated_at DESC`. If a pre-migration collision left
    // two rows for one pair, the newest must win — the old snapshot took the
    // oldest, so a stale value could outlive the correction.
    const grouped = groupBySlug(
      [
        row("frontend", "html", 1, "2026-06-01T00:00:00.000Z"),
        row("frontend", "html", 0, "2026-01-01T00:00:00.000Z"),
      ],
      r => Boolean(r.completed)
    );
    expect(grouped.frontend).toEqual({ html: true });
  });

  it("skips rows with a missing slug or topic id", () => {
    const grouped = groupBySlug(
      [row("", "html"), row("frontend", ""), row("frontend", "css")],
      r => Boolean(r.completed)
    );
    expect(grouped).toEqual({ frontend: { css: true } });
  });

  it("groups notes with the same shape as progress", () => {
    const notes = [
      { roadmap_slug: "frontend", topic_id: "html", note: "revise forms" },
      { roadmap_slug: "devops", topic_id: "html", note: "not relevant" },
    ];
    expect(groupBySlug(notes, r => r.note)).toEqual({
      frontend: { html: "revise forms" },
      devops: { html: "not relevant" },
    });
  });
});

describe("parseTopicIds", () => {
  it("reads a well-formed array", () => {
    expect(parseTopicIds('["html","css"]', "plan-1")).toEqual(["html", "css"]);
  });

  it("drops non-string members instead of passing them through", () => {
    expect(parseTopicIds('["html",7,null,{"id":"css"}]', "plan-1")).toEqual([
      "html",
    ]);
  });

  it("returns empty for JSON that is not an array", () => {
    expect(parseTopicIds('{"html":true}', "plan-1")).toEqual([]);
    expect(parseTopicIds('"html"', "plan-1")).toEqual([]);
  });

  it("survives malformed JSON, which used to break every read for a profile", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseTopicIds("{not json", "plan-9")).toEqual([]);
    expect(parseTopicIds("", "plan-9")).toEqual([]);
    // The row is skipped, but not silently: a bad row is a data bug worth seeing.
    expect(logged).toHaveBeenCalledTimes(2);
    expect(logged.mock.calls[0]?.[0]).toContain("plan-9");
    logged.mockRestore();
  });
});
