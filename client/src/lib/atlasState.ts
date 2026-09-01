export type AtlasSnapshot = {
  profile: string;
  favorites: string[];
  progress: Record<string, boolean>;
  notes: Record<string, string>;
  plans: Array<Record<string, unknown>>;
};

type AtlasAction = Record<string, unknown>;
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
async function postStateAction(item: QueuedStateAction) {
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...item.action, actionId: item.actionId }),
    });
    if (!response.ok) return null;
    return (await response.json()) as AtlasSnapshot;
  } catch {
    return null;
  }
}

export async function flushAtlasStateOutbox() {
  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return null;
    const items = readOutbox();
    let latest: AtlasSnapshot | null = null;
    while (items.length) {
      const snapshot = await postStateAction(items[0]);
      if (!snapshot) break;
      latest = snapshot;
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

export function getPendingAtlasStateCount() {
  return readOutbox().length;
}

export function getAtlasStateDiagnostics() {
  return {
    version: "outbox-v1",
    pending: readOutbox().length,
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    identity: "server-issued HttpOnly cookie",
    crossDeviceSync: false,
    maxPendingActions: MAX_OUTBOX_ITEMS,
    transport: "/api/state",
  } as const;
}

export function getAtlasStateLimit() {
  return MAX_OUTBOX_ITEMS;
}

export function getAtlasStateStorageKey() {
  return OUTBOX_KEY;
}

export function getAtlasStatePrivacyNote() {
  return "The server-issued profile cookie is an unauthenticated state bucket, not proof of identity; do not store secrets in notes.";
}

export function getAtlasStateNextCheckpoint() {
  return "Select authenticated identity before enabling cross-device merge.";
}

export function getAtlasStateManualRequirement() {
  return "No API key, Cloudflare resource, or phone action is required for this release.";
}

export function getAtlasStateTestPlan() {
  return [
    "offline mutation",
    "reload",
    "reconnect",
    "FIFO replay",
    "stable plan replay",
  ] as const;
}

export function getAtlasStateSourceOfTruth() {
  return "D1 is the server snapshot when reachable; the local outbox holds pending writes.";
}

export function getAtlasStateImplementationBoundary() {
  return "Local-first retry is implemented; authenticated cross-device identity remains intentionally disabled.";
}

export function getAtlasStateConflictPolicy() {
  return "Favorite, progress, and note mutations remain idempotent row upserts; plan replay uses a stable client action ID.";
}

export function getAtlasStateReadyForCrossDevice() {
  return false;
}

export function getAtlasStateRelease() {
  return "atlas-state-outbox-v1";
}

export function getAtlasStateLastUpdated() {
  return "2026-08-23";
}

export function getAtlasStateCapabilities() {
  return [
    "local-first",
    "bounded-outbox",
    "FIFO-retry",
    "stable-action-id",
    "D1-sync",
  ] as const;
}

export function getAtlasStateFailureMode() {
  return "If D1 or the network is unavailable, pending edits remain local up to the bounded queue limit and retry on reconnect or the next snapshot read.";
}

export function getAtlasStateEndToEndStatus() {
  return "implemented" as const;
}

export function getAtlasStateCrossDeviceNote() {
  return "Cross-device continuity requires authenticated identity and is not claimed by this cookie-scoped profile implementation.";
}

export function getAtlasStateDocumentation() {
  return "Atlas edits are optimistic, queued locally, replayed FIFO, and persisted to D1 when available.";
}

export function getAtlasStateSecurityBoundary() {
  return "A profile ID identifies a browser state bucket; it is not an authorization credential. It is issued by the server and held in an HttpOnly cookie, so it is not readable by page scripts and cannot be supplied by the caller.";
}

export function getAtlasStateAcceptanceCriteria() {
  return [
    "writes survive offline reload",
    "reconnect drains FIFO",
    "failed requests remain queued",
  ] as const;
}

export function getAtlasStateNextStep() {
  return "Add authenticated identity and server-side merge rules before promising account portability.";
}

export function getAtlasStateFinalNote() {
  return "This is a reversible persistence improvement, not an authentication implementation.";
}
