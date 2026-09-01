import { describe, expect, it } from "vitest";

import {
  chainEdges,
  compactTopics,
  number,
  parseAiPayload,
  parseStateAction,
  readCookie,
  resolveIdentity,
  sanitiseProfileId,
  text,
  validIds,
  withIdentityCookie,
  type TopicContext,
} from "../../worker";

const NUL = String.fromCharCode(0);

const topic = (id: string, title = `Title ${id}`): TopicContext => ({
  id,
  title,
  summary: "",
  slug: id,
});

describe("text", () => {
  it("coerces non-strings instead of throwing", () => {
    // This is the guard the mutation handlers are missing: `input.note.slice()`
    // on a number is a TypeError, while text() returns a string.
    expect(text(123)).toBe("123");
    expect(text(null)).toBe("");
    expect(text(undefined)).toBe("");
    expect(text(false)).toBe("false");
    expect(text({})).toBe("[object Object]");
  });

  it("truncates to the requested maximum", () => {
    expect(text("abcdef", 3)).toBe("abc");
    expect(text("abc", 10)).toBe("abc");
    expect(text("", 10)).toBe("");
  });

  it("strips embedded NUL, which would otherwise truncate the D1 value", () => {
    expect(text(`a${NUL}b`)).toBe("ab");
    expect(text(`${NUL}${NUL}`)).toBe("");
  });

  it("truncates after stripping, so a NUL does not consume budget", () => {
    expect(text(`ab${NUL}cd`, 4)).toBe("abcd");
  });
});

describe("number", () => {
  it("clamps into range", () => {
    expect(number(5, 0, 10, 1)).toBe(5);
    expect(number(-5, 0, 10, 1)).toBe(0);
    expect(number(50, 0, 10, 1)).toBe(10);
  });

  it("falls back for values that are not finite numbers", () => {
    expect(number("nope", 0, 10, 3)).toBe(3);
    expect(number(undefined, 0, 10, 3)).toBe(3);
    expect(number(null, 0, 10, 3)).toBe(0); // Number(null) === 0, in range
    expect(number(NaN, 0, 10, 3)).toBe(3);
    expect(number(Infinity, 0, 10, 3)).toBe(3);
  });

  it("accepts numeric strings", () => {
    expect(number("7", 0, 10, 1)).toBe(7);
    expect(number("7.5", 0, 10, 1)).toBe(7.5);
  });
});

describe("sanitiseProfileId", () => {
  const valid = "a".repeat(32);

  it("accepts an id of the issued shape", () => {
    expect(sanitiseProfileId(valid)).toBe(valid);
  });

  it("rejects anything shorter than the minimum length", () => {
    // Short ids are the guessable ones, so they are refused rather than padded.
    expect(sanitiseProfileId("abc")).toBeNull();
    expect(sanitiseProfileId("a".repeat(15))).toBeNull();
    expect(sanitiseProfileId("a".repeat(16))).toBe("a".repeat(16));
  });

  it("rejects a value that only becomes valid after stripping", () => {
    // "victim" padded with punctuation must not sanitise into a usable id.
    expect(sanitiseProfileId("./victim")).toBeNull();
  });

  it("truncates an over-long id to the 80-character cap", () => {
    expect(sanitiseProfileId("x".repeat(200))).toHaveLength(80);
  });

  it("returns null for empty and missing values", () => {
    expect(sanitiseProfileId("")).toBeNull();
    expect(sanitiseProfileId(null)).toBeNull();
    expect(sanitiseProfileId(undefined)).toBeNull();
  });
});

describe("readCookie", () => {
  it("reads a named cookie from the header", () => {
    expect(readCookie("atlas_pid=abc; other=1", "atlas_pid")).toBe("abc");
    expect(readCookie("other=1; atlas_pid=abc", "atlas_pid")).toBe("abc");
  });

  it("tolerates whitespace and missing values", () => {
    expect(readCookie("  atlas_pid = abc  ", "atlas_pid")).toBe("abc");
    expect(readCookie("other=1", "atlas_pid")).toBeNull();
    expect(readCookie(null, "atlas_pid")).toBeNull();
  });

  it("keeps a value containing an equals sign intact", () => {
    expect(readCookie("t=a=b=c", "t")).toBe("a=b=c");
  });
});

describe("resolveIdentity", () => {
  const request = (headers?: Record<string, string>) =>
    new Request("https://example.com/api/state", headers ? { headers } : {});

  it("reuses a valid cookie without reissuing", () => {
    const id = "b".repeat(32);
    expect(resolveIdentity(request({ cookie: `atlas_pid=${id}` }))).toEqual({
      id,
      issued: false,
    });
  });

  it("mints a fresh id when no cookie is present", () => {
    const identity = resolveIdentity(request());
    expect(identity.issued).toBe(true);
    expect(sanitiseProfileId(identity.id)).toBe(identity.id);
  });

  it("mints a fresh id rather than trusting a malformed cookie", () => {
    const identity = resolveIdentity(request({ cookie: "atlas_pid=short" }));
    expect(identity.issued).toBe(true);
    expect(identity.id).not.toBe("short");
  });

  it("ignores caller-supplied identity entirely", () => {
    // This is the fix for the open read/write store: `?profile=` and
    // `x-atlas-profile` used to name the profile being acted on, so any caller
    // could address any other. Neither is consulted now.
    const victim = "v".repeat(32);
    const fromQuery = resolveIdentity(
      new Request(`https://example.com/api/state?profile=${victim}`)
    );
    expect(fromQuery.id).not.toBe(victim);
    expect(fromQuery.issued).toBe(true);

    const fromHeader = resolveIdentity(request({ "x-atlas-profile": victim }));
    expect(fromHeader.id).not.toBe(victim);
    expect(fromHeader.issued).toBe(true);
  });
});

describe("withIdentityCookie", () => {
  const id = "c".repeat(32);

  it("sets an HttpOnly cookie only for a freshly issued identity", () => {
    const cookie = withIdentityCookie(new Response("{}"), {
      id,
      issued: true,
    }).headers.get("set-cookie");
    expect(cookie).toContain(`atlas_pid=${id}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("leaves a response untouched when the cookie already existed", () => {
    const response = new Response("{}");
    expect(withIdentityCookie(response, { id, issued: false })).toBe(response);
  });

  it("preserves the original status and body", async () => {
    const wrapped = withIdentityCookie(
      new Response('{"ok":true}', { status: 201 }),
      { id, issued: true }
    );
    expect(wrapped.status).toBe(201);
    await expect(wrapped.text()).resolves.toBe('{"ok":true}');
  });
});

describe("parseStateAction", () => {
  it("rejects non-objects and unknown actions", () => {
    expect(parseStateAction(null)).toBeNull();
    expect(parseStateAction("snapshot")).toBeNull();
    expect(parseStateAction({})).toBeNull();
    expect(parseStateAction({ action: "drop-tables" })).toBeNull();
  });

  it("requires the identifiers each action actually writes", () => {
    expect(parseStateAction({ action: "favorite" })).toBeNull();
    expect(
      parseStateAction({ action: "progress", roadmapSlug: "a" })
    ).toBeNull();
    expect(parseStateAction({ action: "note", topicId: "t" })).toBeNull();
    expect(parseStateAction({ action: "plan" })).toBeNull();
  });

  it("coerces a non-string note instead of throwing", () => {
    // `input.note.slice(0, 20000)` on a number was a TypeError inside the
    // handler, which surfaced as a 500.
    expect(
      parseStateAction({
        action: "note",
        roadmapSlug: "a",
        topicId: "t",
        note: 123,
      })
    ).toEqual({
      action: "note",
      roadmapSlug: "a",
      topicId: "t",
      note: "123",
      actionId: undefined,
    });
  });

  it("truncates an oversized note", () => {
    const parsed = parseStateAction({
      action: "note",
      roadmapSlug: "a",
      topicId: "t",
      note: "x".repeat(30000),
    });
    expect(parsed?.action === "note" && parsed.note).toHaveLength(20000);
  });

  it("treats only real booleans and their common spellings as true", () => {
    const saved = (value: unknown) => {
      const parsed = parseStateAction({
        action: "favorite",
        roadmapSlug: "a",
        saved: value,
      });
      return parsed?.action === "favorite" ? parsed.saved : null;
    };
    expect(saved(true)).toBe(true);
    expect(saved(1)).toBe(true);
    expect(saved("true")).toBe(true);
    expect(saved(false)).toBe(false);
    expect(saved("false")).toBe(false);
    expect(saved(undefined)).toBe(false);
  });

  it("clamps plan hours and bounds the topic id list", () => {
    const parsed = parseStateAction({
      action: "plan",
      roadmapSlug: "frontend",
      goal: 42,
      hours: 9999,
      topicIds: Array.from({ length: 500 }, (_, index) => `t${index}`),
    });
    if (parsed?.action !== "plan") throw new Error("expected a plan action");
    expect(parsed.hours).toBe(168);
    expect(parsed.goal).toBe("42");
    expect(parsed.level).toBe("beginner");
    expect(parsed.pace).toBe("balanced");
    expect(parsed.topicIds).toHaveLength(200);
  });

  it("defaults a non-array topicIds to empty rather than failing", () => {
    const parsed = parseStateAction({
      action: "plan",
      roadmapSlug: "frontend",
      topicIds: "html",
    });
    expect(parsed?.action === "plan" && parsed.topicIds).toEqual([]);
  });

  it("accepts a bare snapshot", () => {
    expect(parseStateAction({ action: "snapshot" })).toEqual({
      action: "snapshot",
      actionId: undefined,
    });
  });
});

describe("compactTopics", () => {
  it("returns an empty list for non-arrays", () => {
    expect(compactTopics(null)).toEqual([]);
    expect(compactTopics("nope")).toEqual([]);
    expect(compactTopics({ id: "a" })).toEqual([]);
  });

  it("drops entries missing an id or title", () => {
    expect(
      compactTopics([
        { id: "a", title: "A" },
        { id: "", title: "B" },
        { id: "c", title: "" },
        null,
      ])
    ).toEqual([{ id: "a", title: "A", summary: "", slug: "" }]);
  });

  it("caps the number of topics", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      id: `t${i}`,
      title: `T${i}`,
    }));
    expect(compactTopics(many)).toHaveLength(120);
    expect(compactTopics(many, 5)).toHaveLength(5);
  });

  it("coerces hostile field types instead of throwing", () => {
    expect(compactTopics([{ id: 7, title: 8, summary: {}, slug: [] }])).toEqual(
      [{ id: "7", title: "8", summary: "[object Object]", slug: "" }]
    );
  });
});

describe("validIds", () => {
  const topics = [topic("a"), topic("b"), topic("c")];

  it("keeps only ids present in the topic list", () => {
    expect(validIds(["a", "zzz", "c"], topics)).toEqual(["a", "c"]);
  });

  it("deduplicates while preserving first-seen order", () => {
    expect(validIds(["c", "a", "c", "a"], topics)).toEqual(["c", "a"]);
  });

  it("returns an empty list for non-arrays and caps the result", () => {
    expect(validIds("a", topics)).toEqual([]);
    expect(validIds(null, topics)).toEqual([]);
    expect(validIds(["a", "b", "c"], topics, 2)).toEqual(["a", "b"]);
  });
});

describe("chainEdges", () => {
  it("links consecutive nodes and leaves a short list edgeless", () => {
    expect(chainEdges([{ id: "a" }, { id: "b" }, { id: "c" }])).toEqual([
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ]);
    expect(chainEdges([{ id: "a" }])).toEqual([]);
    expect(chainEdges([])).toEqual([]);
  });
});

describe("parseAiPayload", () => {
  it("unwraps the provider envelope", () => {
    expect(parseAiPayload({ response: { answer: "hi" } })).toEqual({
      answer: "hi",
    });
    expect(parseAiPayload({ result: { answer: "hi" } })).toEqual({
      answer: "hi",
    });
    expect(parseAiPayload({ answer: "hi" })).toEqual({ answer: "hi" });
  });

  it("parses a JSON string response", () => {
    expect(parseAiPayload({ response: '{"answer":"hi"}' })).toEqual({
      answer: "hi",
    });
  });

  it("recovers JSON from a fenced code block", () => {
    expect(
      parseAiPayload({ response: '```json\n{"answer":"hi"}\n```' })
    ).toEqual({ answer: "hi" });
  });

  it("returns null for unparseable text", () => {
    expect(parseAiPayload({ response: "not json at all" })).toBeNull();
    expect(
      parseAiPayload({ response: "```json\nstill not json\n```" })
    ).toBeNull();
  });
});
