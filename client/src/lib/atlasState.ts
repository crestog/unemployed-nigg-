/**
 * `progress` and `notes` are keyed by roadmap slug first, then topic id.
 *
 * They used to be flat `Record<topicId, …>`, matching a server snapshot that
 * flattened the same way. Topic ids are not unique across roadmaps — `html`,
 * `git`, `sql` and `docker` appear in most of the catalog — so completing a
 * shared topic in one roadmap showed it as complete in every other roadmap that
 * used the same id, and the underlying D1 rows overwrote each other as well
 * (fixed in migrations/0003_scope_state_by_roadmap.sql).
 */
export type AtlasSnapshot = {
  profile: string;
  favorites: string[];
  progress: Record<string, Record<string, boolean>>;
  notes: Record<string, Record<string, string>>;
  plans: Array<Record<string, unknown>>;
};

// Mirrors the five cases `parseStateAction` accepts in worker.ts. This was
// `Record<string, unknown>`, which is the reason a plan could be posted with
// `hours` as a string: there was no compile-time contract between the callers
// and the server's validator, so every shape mismatch became a runtime 400 —
// and a 400 used to wedge the outbox permanently (see flushAtlasStateOutbox).
export type AtlasAction =
  | { action: "snapshot" }
  | { action: "favorite"; roadmapSlug: string; saved: boolean }
  | {
      action: "progress";
      roadmapSlug: string;
      topicId: string;
      completed: boolean;
    }
  | { action: "note"; roadmapSlug: string; topicId: string; note: string }
  | {
      action: "plan";
      roadmapSlug: string;
      goal: string;
      level: string;
      // Not a string. `bodyNumber` in worker.ts rejects a non-number outright
      // rather than coercing it, so `"5"` is a 400, not a five.
      hours: number;
      pace: string;
      topicIds: string[];
      // Accepted and ignored by the server; kept so the local plan record can
      // be spread into this call without an excess-property error.
      createdAt?: string;
      mode?: string;
    };

type QueuedStateAction = { actionId: string; action: AtlasAction };

export type AiPlanInput = {
  goal: string;
  level: string;
  hours: number;
  pace: string;
  roadmap: { slug: string; title: string; description: string };
  topics: Array<{ id: string; title: string; summary: string; slug: string }>;
  completedIds?: string[];
  notes?: Record<string, string>;
};

export type AiRoadmap = {
  mode: "ai" | "fallback";
  title: string;
  description: string;
  learnerFit: string;
  assumptions: string[];
  nodes: Array<{
    id: string;
    title: string;
    description: string;
    phase: string;
    type: "core" | "alternative" | "optional";
    explanation: string;
    practice: string;
    checkpoint: string;
  }>;
  edges: Array<{ source: string; target: string }>;
};

export type AiPlan = {
  mode: "ai" | "fallback";
  roadmapSlug: string;
  interpretation: string;
  confidence: number;
  clarifyingNeeded: boolean;
  followUpQuestions: string[];
  assumptions: string[];
  weeklyRhythm: string;
  phases: Array<{
    title: string;
    outcome: string;
    topicIds: string[];
    why: string;
    project: string;
    checkpoint: string;
    hours: number;
  }>;
};

export type AiChatInput = {
  roadmap: { slug: string; title: string; description: string };
  question: string;
  topics: Array<{ id: string; title: string; summary: string; slug: string }>;
  progress?: Record<string, boolean>;
  notes?: Record<string, string>;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export type AiChatResponse = {
  mode: "ai" | "fallback";
  answer: string;
  topicIds: string[];
  suggestedPrompts: string[];
  actions: Array<{ type: string; topicId: string; note: string }>;
};

const OUTBOX_KEY = "atlas-state-outbox-v1";
const MAX_OUTBOX_ITEMS = 500;
let flushPromise: Promise<AtlasSnapshot | null> | null = null;

/**
 * Thrown when an AI endpoint answers with an error status. Previously any
 * non-OK response became `null`, so a 429 was indistinguishable from the model
 * returning nothing and the user was told to "please try again" in a loop.
 */
export class AtlasAiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number;

  constructor(status: number, message: string, retryAfterSeconds = 0) {
    super(message);
    this.name = "AtlasAiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function readOutbox(): QueuedStateAction[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(OUTBOX_KEY) ?? "[]"
    ) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QueuedStateAction =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as QueuedStateAction).actionId === "string" &&
        Boolean((item as QueuedStateAction).action)
    );
  } catch {
    return [];
  }
}

function writeOutbox(items: QueuedStateAction[]) {
  try {
    if (items.length) localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
    else localStorage.removeItem(OUTBOX_KEY);
  } catch {
    // Private browsing and quota pressure must not break optimistic UI.
  }
}

function enqueueStateAction(action: AtlasAction) {
  const items = readOutbox();
  items.push({ actionId: crypto.randomUUID(), action });
  writeOutbox(items.slice(-MAX_OUTBOX_ITEMS));
}

// The profile is identified by an HttpOnly cookie the Worker issues on first
// contact. The client no longer names the profile it is acting on: sending it as
// `?profile=` / `x-atlas-profile` let any caller address anyone else's state.
// `credentials` is spelled out because the whole mechanism depends on it.
/**
 * Why this is not a boolean: `postStateAction` used to answer `null` for both a
 * thrown fetch and any non-OK status, and the drain loop below treated that one
 * value as "stop". A permanently-rejected action therefore sat at the head of
 * the queue forever, blocking every later favorite, tick and note, with nothing
 * logged and the optimistic UI still showing success.
 */
type StateActionOutcome =
  | { kind: "ok"; snapshot: AtlasSnapshot }
  | { kind: "retry" }
  | { kind: "drop"; status: number };

/**
 * 400 and 422 are the only statuses that mean "this body will never be
 * accepted" — on this route a 400 is exactly `parseStateAction` returning null.
 * Everything else has to be retried: a 403 may be a Cloudflare challenge, a 429
 * is backpressure, 5xx is the server's problem, and a thrown fetch is offline.
 * Dropping those would trade a stuck queue for silently discarded user data.
 */
export function isPermanentStateRejection(status: number): boolean {
  return status === 400 || status === 422;
}

async function postStateAction(
  item: QueuedStateAction
): Promise<StateActionOutcome> {
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...item.action, actionId: item.actionId }),
    });
    if (!response.ok) {
      return isPermanentStateRejection(response.status)
        ? { kind: "drop", status: response.status }
        : { kind: "retry" };
    }
    return { kind: "ok", snapshot: (await response.json()) as AtlasSnapshot };
  } catch {
    // Offline, DNS, or a malformed body on an OK response. All retryable: the
    // server dedupes on `actionId`, so replaying one is free.
    return { kind: "retry" };
  }
}

export async function flushAtlasStateOutbox() {
  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return null;
    const items = readOutbox();
    let latest: AtlasSnapshot | null = null;
    while (items.length) {
      const outcome = await postStateAction(items[0]);
      // Retry keeps the head in place so the action survives a reload. Drop
      // shifts it so one bad action cannot wedge the queue behind it.
      if (outcome.kind === "retry") break;
      if (outcome.kind === "drop") {
        console.error("atlas: server rejected a queued state action", {
          status: outcome.status,
          action: items[0].action.action,
        });
      } else {
        latest = outcome.snapshot;
      }
      items.shift();
      writeOutbox(items);
    }
    return latest;
  })().finally(() => {
    flushPromise = null;
  });
  return flushPromise;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushAtlasStateOutbox());
}

export async function syncAtlasAction(action: AtlasAction) {
  enqueueStateAction(action);
  return flushAtlasStateOutbox();
}

export async function loadAtlasSnapshot() {
  await flushAtlasStateOutbox();
  try {
    const response = await fetch("/api/state", {
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    return (await response.json()) as AtlasSnapshot;
  } catch {
    return null;
  }
}

/**
 * Per-roadmap views of a snapshot. Callers work with one roadmap at a time, so
 * the slug lookup lives here rather than being repeated (and getting the
 * `noUncheckedIndexedAccess` fallback wrong) at each call site.
 */
export function progressForRoadmap(
  snapshot: AtlasSnapshot | null,
  slug: string
): Record<string, boolean> {
  return snapshot?.progress?.[slug] ?? {};
}

export function notesForRoadmap(
  snapshot: AtlasSnapshot | null,
  slug: string
): Record<string, string> {
  return snapshot?.notes?.[slug] ?? {};
}

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Offline or a dropped connection: not an error worth a dialog, the caller
    // already has a "try again" path for a null result.
    return null;
  }
  if (response.status === 429) {
    const retryAfterSeconds = Number(response.headers.get("retry-after")) || 0;
    const minutes = Math.ceil(retryAfterSeconds / 60);
    throw new AtlasAiError(
      429,
      minutes > 1
        ? `You have reached the hourly limit for AI generations. Try again in about ${minutes} minutes.`
        : "You have reached the hourly limit for AI generations. Try again shortly.",
      retryAfterSeconds
    );
  }
  if (!response.ok)
    throw new AtlasAiError(
      response.status,
      response.status >= 500
        ? "Atlas could not reach the model. Please try again."
        : "Atlas rejected that request. Please check the details and try again."
    );
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function generateAiRoadmap(input: {
  topic: string;
  level?: string;
  goal?: string;
  hours?: number;
  customise?: boolean;
  referenceTopics?: Array<{
    id: string;
    title: string;
    summary: string;
    slug: string;
  }>;
}) {
  return postJson<AiRoadmap>("/api/ai/roadmap", input);
}

export function generateAiPlan(input: AiPlanInput) {
  return postJson<AiPlan>("/api/ai/plan", input);
}

export function askAtlasTutor(input: AiChatInput) {
  return postJson<AiChatResponse>("/api/ai/chat", input);
}

// Twenty-four exports used to live below this point, all of them unreferenced:
// `getAtlasStateSecurityBoundary()`, `getAtlasStateConflictPolicy()`,
// `getAtlasStateTestPlan()` and the like returned English sentences describing
// the module. That is documentation shaped like code — it cannot go stale
// visibly, cannot be checked, and shipped in the bundle. The sentences worth
// keeping are now comments on the code they describe: identity is a
// server-issued HttpOnly cookie and an unauthenticated state bucket rather than
// an authorization credential (see `postStateAction`), and the outbox is a
// bounded FIFO that replays on reconnect (see `flushAtlasStateOutbox`).
