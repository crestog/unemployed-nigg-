// The three Workers AI endpoints were originally unauthenticated *and*
// unmetered: any caller could spend the account's inference budget at
// AI_MAX_TOKENS per request, without limit. The counter that closed that was
// first keyed on the identity cookie and the client IP *together*, which reads
// as strict but is the one shape that does not work — a caller who simply
// discards the Set-Cookie is a brand-new identity on every request, so every
// request is hit #1 of its own bucket. Probing the local worker confirmed it:
// 65 cookieless POSTs to /api/ai/roadmap all returned 200.
//
// So there are two counters now, and both must be under their ceiling. These
// tests pin that, because the bypass is invisible from any single request.

import { beforeEach, describe, expect, it, vi } from "vitest";

import { consumeAiQuota, type Env, type Identity } from "../../worker";

/**
 * Enough of D1 to run the two statements `consumeAiQuota` issues: the
 * upsert-and-return-hits, and the prune of expired windows. `rows` is exposed so
 * a test can assert on which buckets were touched.
 */
function fakeDb() {
  const rows = new Map<string, { windowStart: number; hits: number }>();
  const statement = (sql: string, args: unknown[]) => ({
    async first<T>() {
      return run(sql, args) as T;
    },
    async run() {
      return { results: [run(sql, args)].filter(Boolean) };
    },
  });
  const run = (sql: string, args: unknown[]) => {
    if (sql.startsWith("INSERT INTO atlas_ai_usage")) {
      const key = String(args[0]);
      const existing = rows.get(key);
      const hits = (existing?.hits ?? 0) + 1;
      rows.set(key, { windowStart: Number(args[1]), hits });
      return { hits };
    }
    if (sql.startsWith("DELETE FROM atlas_ai_usage")) {
      for (const [key, value] of rows) {
        if (value.windowStart < Number(args[0])) rows.delete(key);
      }
      return null;
    }
    throw new Error(`unexpected SQL: ${sql}`);
  };
  const db = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => statement(sql, args),
    }),
    batch: async (statements: Array<{ run: () => Promise<unknown> }>) =>
      Promise.all(statements.map(entry => entry.run())),
  };
  return { rows, env: { ATLAS_DB: db } as unknown as Env };
}

const identity = (id: string): Identity => ({ id, issued: false });

const request = (ip: string | null) =>
  new Request("https://example.com/api/ai/roadmap", {
    method: "POST",
    headers: ip ? { "cf-connecting-ip": ip } : {},
  });

/** How many consecutive requests are allowed before the first refusal. */
async function allowedRun(
  env: Env,
  nextIdentity: (index: number) => Identity,
  ip: string | null,
  attempts: number
) {
  let allowed = 0;
  for (let index = 0; index < attempts; index += 1) {
    const verdict = await consumeAiQuota(env, nextIdentity(index), request(ip));
    if (!verdict.allowed) break;
    allowed += 1;
  }
  return allowed;
}

describe("consumeAiQuota", () => {
  it("allows 20 generations per identity, then refuses", async () => {
    const { env } = fakeDb();
    const one = identity("a".repeat(32));
    expect(await allowedRun(env, () => one, "203.0.113.7", 30)).toBe(20);
  });

  it("does not reset when the caller throws its cookie away", async () => {
    // The bypass, exactly: a fresh identity every request. The per-IP ceiling is
    // what stops it, so the run is 60 long rather than unbounded.
    const { env, rows } = fakeDb();
    const allowed = await allowedRun(
      env,
      // The index is zero-padded before the id is padded out to length, so no
      // two indices can pad into the same string.
      index =>
        identity(`identity-${String(index).padStart(3, "0")}-`.padEnd(32, "x")),
      "203.0.113.7",
      120
    );
    expect(allowed).toBe(60);
    // 61 distinct identity buckets (the 61st is what tipped the IP bucket over)
    // against a single shared IP bucket — the shape that makes the limit hold.
    const identityBuckets = [...rows.keys()].filter(key =>
      key.startsWith("id:")
    );
    const ipBuckets = [...rows.keys()].filter(key => key.startsWith("ip:"));
    expect(identityBuckets).toHaveLength(61);
    expect(ipBuckets).toHaveLength(1);
    expect(rows.get(ipBuckets[0]!)?.hits).toBe(61);
  });

  it("keeps separate addresses independent", async () => {
    const { env } = fakeDb();
    const one = identity("a".repeat(32));
    expect(await allowedRun(env, () => one, "203.0.113.7", 25)).toBe(20);
    // Same identity, different address: still capped at its own 20, and the
    // first address's exhaustion has not leaked across.
    const two = identity("b".repeat(32));
    expect(await allowedRun(env, () => two, "198.51.100.4", 25)).toBe(20);
  });

  it("counts requests that arrive without an address under one bucket", async () => {
    // `wrangler dev --local` sends no cf-connecting-ip. Falling back to a shared
    // "unknown" key keeps local runs metered rather than silently unlimited.
    const { env, rows } = fakeDb();
    await consumeAiQuota(env, identity("a".repeat(32)), request(null));
    expect([...rows.keys()].some(key => key.endsWith(":unknown"))).toBe(true);
  });

  it("reports how long the window has left", async () => {
    const { env } = fakeDb();
    const verdict = await consumeAiQuota(
      env,
      identity("a".repeat(32)),
      request("203.0.113.7")
    );
    expect(verdict.retryAfterSeconds).toBeGreaterThan(0);
    expect(verdict.retryAfterSeconds).toBeLessThanOrEqual(3600);
  });

  it("starts a fresh budget in the next window", async () => {
    // The window is baked into the bucket key, so the rollover needs no reset
    // pass. Faking the clock is the only way to observe that.
    vi.useFakeTimers();
    try {
      const { env } = fakeDb();
      const one = identity("a".repeat(32));
      vi.setSystemTime(new Date("2026-09-02T10:30:00.000Z"));
      expect(await allowedRun(env, () => one, "203.0.113.7", 25)).toBe(20);
      vi.setSystemTime(new Date("2026-09-02T11:00:01.000Z"));
      expect(await allowedRun(env, () => one, "203.0.113.7", 25)).toBe(20);
    } finally {
      vi.useRealTimers();
    }
  });

  it("fails open, loudly, when the counter cannot be read", async () => {
    // Deliberate: the AI call is already bounded by a token cap and an 18 s
    // timeout, so a brief unmetered window costs less than the feature being
    // down on every D1 hiccup. It must not be silent, though.
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = {
      prepare: () => ({
        bind: () => ({
          run: async () => {
            throw new Error("D1_ERROR");
          },
        }),
      }),
      batch: async () => {
        throw new Error("D1_ERROR");
      },
    } as unknown as Env["ATLAS_DB"];
    const verdict = await consumeAiQuota(
      { ATLAS_DB: broken } as unknown as Env,
      identity("a".repeat(32)),
      request("203.0.113.7")
    );
    expect(verdict.allowed).toBe(true);
    expect(logged).toHaveBeenCalledOnce();
    expect(logged.mock.calls[0]?.[0]).toContain("quota check failed");
    logged.mockRestore();
  });

  it("allows the request when there is no database bound at all", async () => {
    const verdict = await consumeAiQuota(
      {} as unknown as Env,
      identity("a".repeat(32)),
      request("203.0.113.7")
    );
    expect(verdict.allowed).toBe(true);
  });
});

beforeEach(() => {
  vi.useRealTimers();
});
