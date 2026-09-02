interface AiBinding {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
}

interface Env {
  ASSETS: Fetcher;
  ATLAS_DB: D1Database;
  AI?: AiBinding;
}

export type TopicContext = {
  id: string;
  title: string;
  summary: string;
  slug: string;
};

type StateAction =
  | { action: "snapshot"; actionId?: string }
  | {
      action: "favorite";
      roadmapSlug: string;
      saved: boolean;
      actionId?: string;
    }
  | {
      action: "progress";
      roadmapSlug: string;
      topicId: string;
      completed: boolean;
      actionId?: string;
    }
  | {
      action: "note";
      roadmapSlug: string;
      topicId: string;
      note: string;
      actionId?: string;
    }
  | {
      action: "plan";
      goal: string;
      roadmapSlug: string;
      level: string;
      hours: number;
      pace: string;
      topicIds: string[];
      actionId?: string;
    };

type AiPlanRequest = {
  goal: string;
  level: string;
  hours: number;
  pace: string;
  roadmap: { slug: string; title: string; description: string };
  topics: TopicContext[];
  completedIds?: string[];
  notes?: Record<string, string>;
};

type AiRoadmapRequest = {
  topic: string;
  level?: string;
  goal?: string;
  hours?: number;
  customise?: boolean;
  referenceTopics?: TopicContext[];
};

type AiChatRequest = {
  roadmap: { slug: string; title: string; description: string };
  question: string;
  topics: TopicContext[];
  progress?: Record<string, boolean>;
  notes?: Record<string, string>;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    interpretation: { type: "string" },
    confidence: { type: "number" },
    clarifyingNeeded: { type: "boolean" },
    followUpQuestions: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    weeklyRhythm: { type: "string" },
    phases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          outcome: { type: "string" },
          topicIds: { type: "array", items: { type: "string" } },
          why: { type: "string" },
          project: { type: "string" },
          checkpoint: { type: "string" },
          hours: { type: "number" },
        },
        required: [
          "title",
          "outcome",
          "topicIds",
          "why",
          "project",
          "checkpoint",
          "hours",
        ],
        additionalProperties: false,
      },
    },
  },
  required: [
    "interpretation",
    "confidence",
    "clarifyingNeeded",
    "followUpQuestions",
    "assumptions",
    "weeklyRhythm",
    "phases",
  ],
  additionalProperties: false,
};

const ROADMAP_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    learnerFit: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    nodes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          phase: { type: "string" },
          type: { type: "string", enum: ["core", "alternative", "optional"] },
          explanation: { type: "string" },
          practice: { type: "string" },
          checkpoint: { type: "string" },
        },
        required: [
          "id",
          "title",
          "description",
          "phase",
          "type",
          "explanation",
          "practice",
          "checkpoint",
        ],
        additionalProperties: false,
      },
      minItems: 12,
      maxItems: 16,
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        properties: { source: { type: "string" }, target: { type: "string" } },
        required: ["source", "target"],
        additionalProperties: false,
      },
      minItems: 11,
      maxItems: 24,
    },
  },
  required: [
    "title",
    "description",
    "learnerFit",
    "assumptions",
    "nodes",
    "edges",
  ],
  additionalProperties: false,
};

const CHAT_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    topicIds: { type: "array", items: { type: "string" } },
    suggestedPrompts: { type: "array", items: { type: "string" } },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["complete", "uncomplete", "save_note", "recommend_next"],
          },
          topicId: { type: "string" },
          note: { type: "string" },
        },
        required: ["type", "topicId", "note"],
        additionalProperties: false,
      },
    },
  },
  required: ["answer", "topicIds", "suggestedPrompts", "actions"],
  additionalProperties: false,
};

function json(data: unknown, status = 200, extraHeaders?: HeadersInit) {
  const headers = new Headers(jsonHeaders);
  if (extraHeaders)
    new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  return new Response(JSON.stringify(data), { status, headers });
}

export function text(value: unknown, max = 4000) {
  // Stripping NUL is deliberate: D1 truncates a TEXT value at an embedded NUL,
  // so a note containing one would be silently cut short on write.
  return (
    String(value ?? "")
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/g, "")
      .slice(0, max)
  );
}

export function number(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.max(min, Math.min(max, parsed))
    : fallback;
}

// -----------------------------------------------------------------------------
// Identity
//
// The profile ID is server-issued and lives in an HttpOnly cookie. It used to be
// read from `?profile=` / `x-atlas-profile`, which made every profile's
// favorites, progress, notes and plans readable and writable by any caller that
// guessed an ID. Those inputs are deliberately gone: a caller can no longer name
// the profile it is acting on. Anonymous state written before this change is
// unreachable, which is correct — it was never provably the caller's.
// -----------------------------------------------------------------------------

const PROFILE_COOKIE = "atlas_pid";
/** ~13 months, long enough that anonymous state survives normal use. */
const PROFILE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;
const PROFILE_ID_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/;

export type Identity = { id: string; issued: boolean };

export function sanitiseProfileId(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return PROFILE_ID_PATTERN.test(cleaned) ? cleaned : null;
}

export function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim();
  }
  return null;
}

/**
 * Resolves the caller's profile from its cookie, minting a fresh one when the
 * cookie is absent or malformed. `issued: true` means the caller must be sent a
 * `Set-Cookie` — see {@link withIdentityCookie}.
 */
export function resolveIdentity(request: Request): Identity {
  const existing = sanitiseProfileId(
    readCookie(request.headers.get("cookie"), PROFILE_COOKIE)
  );
  if (existing) return { id: existing, issued: false };
  return { id: crypto.randomUUID().replace(/-/g, ""), issued: true };
}

export function withIdentityCookie(response: Response, identity: Identity) {
  if (!identity.issued) return response;
  // `DELETE /api/state` expires the cookie itself. Minting a replacement in the
  // same response would hand the caller a new profile they did not ask for.
  if (response.headers.get("set-cookie")?.includes(`${PROFILE_COOKIE}=`))
    return response;
  const headers = new Headers(response.headers);
  headers.append(
    "set-cookie",
    `${PROFILE_COOKIE}=${identity.id}; Path=/; Max-Age=${PROFILE_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function now() {
  return new Date().toISOString();
}

export function compactTopics(topics: unknown, max = 120): TopicContext[] {
  if (!Array.isArray(topics)) return [];
  return topics
    .slice(0, max)
    .map(topic => {
      const item = (topic || {}) as Record<string, unknown>;
      return {
        id: text(item.id, 160),
        title: text(item.title, 160),
        summary: text(item.summary, 600),
        slug: text(item.slug, 160),
      };
    })
    .filter(topic => topic.id && topic.title);
}

export function parseAiPayload(raw: unknown): Record<string, unknown> | null {
  const result = (raw || {}) as Record<string, unknown>;
  const candidate = result.response ?? result.result ?? result.output ?? result;
  if (typeof candidate === "object" && candidate !== null)
    return candidate as Record<string, unknown>;
  if (typeof candidate === "string") {
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
      if (fenced) {
        try {
          return JSON.parse(fenced) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function topicMap(topics: TopicContext[]) {
  return new Map(topics.map(topic => [topic.id, topic]));
}

export function validIds(ids: unknown, topics: TopicContext[], max = 30) {
  const allowed = topicMap(topics);
  if (!Array.isArray(ids)) return [];
  return Array.from(
    new Set(ids.map(id => text(id, 160)).filter(id => allowed.has(id)))
  ).slice(0, max);
}

export function chainEdges<T extends { id: string }>(nodes: T[]) {
  const edges: Array<{ source: string; target: string }> = [];
  for (let index = 1; index < nodes.length; index += 1) {
    const previous = nodes[index - 1];
    const current = nodes[index];
    if (previous && current)
      edges.push({ source: previous.id, target: current.id });
  }
  return edges;
}

function fallbackPlan(input: AiPlanRequest, topics: TopicContext[]) {
  const count = input.pace === "fast" ? 8 : input.pace === "deep" ? 4 : 6;
  const chosen = topics.slice(0, count);
  return {
    mode: "fallback",
    interpretation: `A ${input.pace} ${input.hours}-hour weekly starting route for ${input.level} learners focused on ${input.goal}.`,
    confidence: 0.35,
    clarifyingNeeded: false,
    followUpQuestions: [],
    assumptions: [
      "Atlas used the first available public topic sequence because the AI service was unavailable.",
    ],
    weeklyRhythm: `${Math.max(1, Math.round(Number(input.hours) / Math.max(1, chosen.length)))} focused hours per topic, plus one short review session each week.`,
    phases: [
      {
        title: "Start with the foundations",
        outcome:
          "Build enough vocabulary and mental models to navigate the roadmap confidently.",
        topicIds: chosen.map(topic => topic.id),
        why: "These are the first public topic records available for the selected roadmap.",
        project: `Create a small ${input.goal} learning artifact that demonstrates the first concepts you understand.`,
        checkpoint:
          "Explain the first three topics in your own words and link them to one working example.",
        hours: Number(input.hours),
      },
    ],
  };
}

// -----------------------------------------------------------------------------
// Workers AI cost surface
//
// Every knob that costs money lives here, in one place, rather than being
// repeated inline at each of the three call sites.
// -----------------------------------------------------------------------------

const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const AI_MAX_TOKENS = 2600;
const AI_TEMPERATURE = 0.2;
const AI_TIMEOUT_MS = 18_000;
/** Generations per rolling hour, per identity+IP pair. */
const AI_REQUESTS_PER_WINDOW = 20;
const AI_WINDOW_MS = 60 * 60 * 1000;

type QuotaVerdict = { allowed: boolean; retryAfterSeconds: number };

/**
 * D1-backed fixed-window counter keyed on the identity cookie *and* the client
 * IP, so clearing cookies does not reset the budget.
 *
 * Fails open on a storage error, deliberately: the AI call already carries a
 * hard token cap and an 18 s timeout, so a brief unmetered window is a bounded
 * cost, whereas failing closed would take the feature down on any D1 hiccup.
 * The failure is logged rather than swallowed so it is visible in tail logs.
 */
async function consumeAiQuota(
  env: Env,
  identity: Identity,
  request: Request
): Promise<QuotaVerdict> {
  const windowStartMs = Math.floor(Date.now() / AI_WINDOW_MS) * AI_WINDOW_MS;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStartMs + AI_WINDOW_MS - Date.now()) / 1000)
  );
  if (!env.ATLAS_DB) return { allowed: true, retryAfterSeconds };
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const bucketKey = `${windowStartMs}:${identity.id}:${ip}`.slice(0, 200);
  try {
    const row = await env.ATLAS_DB.prepare(
      "INSERT INTO atlas_ai_usage (bucket_key, window_start, hits) VALUES (?, ?, 1) ON CONFLICT(bucket_key) DO UPDATE SET hits = hits + 1 RETURNING hits"
    )
      .bind(bucketKey, windowStartMs)
      .first<{ hits: number }>();
    const hits = row?.hits ?? 1;
    if (hits === 1) {
      // First hit of a new window: drop counters from windows that can no
      // longer be consulted. Once per hour per caller, so effectively free.
      await env.ATLAS_DB.prepare(
        "DELETE FROM atlas_ai_usage WHERE window_start < ?"
      )
        .bind(windowStartMs - AI_WINDOW_MS)
        .run();
    }
    return { allowed: hits <= AI_REQUESTS_PER_WINDOW, retryAfterSeconds };
  } catch (error) {
    console.error("atlas: AI quota check failed, allowing request", error);
    return { allowed: true, retryAfterSeconds };
  }
}

function rateLimited(retryAfterSeconds: number) {
  return json(
    {
      error: "Too many AI generations. Try again shortly.",
      retryAfterSeconds,
    },
    429,
    { "retry-after": String(retryAfterSeconds) }
  );
}

async function runJsonModel(
  env: Env,
  messages: Array<{ role: string; content: string }>,
  schema: Record<string, unknown>
) {
  if (!env.AI) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const generation = env.AI.run(AI_MODEL, {
      messages,
      temperature: AI_TEMPERATURE,
      max_tokens: AI_MAX_TOKENS,
      response_format: { type: "json_schema", json_schema: schema },
    });
    // A rejection arriving after the timeout has already won the race would
    // otherwise surface as an unhandled rejection, so it is absorbed here.
    generation.catch(error => {
      console.error("atlas: AI generation failed", error);
    });
    const response = await Promise.race([
      generation,
      new Promise<null>(resolve => {
        timer = setTimeout(() => resolve(null), AI_TIMEOUT_MS);
      }),
    ]);
    return parseAiPayload(response);
  } catch (error) {
    console.error("atlas: AI generation error", error);
    return null;
  } finally {
    // Without this the timer keeps the invocation alive for the full 18 s even
    // when the model answered in 400 ms.
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function aiRoadmapResponse(
  request: Request,
  env: Env,
  identity: Identity
) {
  let input: AiRoadmapRequest;
  try {
    input = (await request.json()) as AiRoadmapRequest;
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }
  const topic = text(input.topic, 240).trim();
  if (!topic) return json({ error: "A topic is required" }, 400);
  const level = text(input.level, 60) || "beginner";
  const goal =
    text(input.goal, 500) || `Build a practical foundation in ${topic}`;
  const hours = number(input.hours, 1, 168, 5);
  const referenceTopics = compactTopics(input.referenceTopics, 40);
  const reference = referenceTopics.length
    ? `\nRelated public topic candidates (use only if genuinely relevant; do not copy their IDs):\n${referenceTopics.map(item => `${item.title}: ${item.summary}`).join("\n")}`
    : "";
  const system = `You are Atlas, a fast roadmap generator. Create a useful learning roadmap in one response for the requested topic. Do not ask follow-up questions. Make sensible beginner-friendly assumptions and state them. Return exactly 12 to 16 concise nodes grouped into 4 to 5 sequential phases. Use stable ids like phase-1-topic-1, with no spaces. Each node must have a short description, explanation, practice task, and observable checkpoint; keep each field to one sentence. Prefer a clear core spine with a few alternatives or optional nodes. Edges must connect only existing node IDs and form a readable progression. This is an AI-generated roadmap, so do not claim it is official or that resources were verified.`;
  const user = `Topic: ${topic}\nLearner level: ${level}\nLearner goal: ${goal}\nAvailable time: ${hours} hours per week${reference}`;
  // Metered before the model call, not before validation: a malformed body
  // should not cost the caller part of their hourly budget.
  const quota = await consumeAiQuota(env, identity, request);
  if (!quota.allowed) return rateLimited(quota.retryAfterSeconds);
  const generated = await runJsonModel(
    env,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    ROADMAP_SCHEMA
  );
  if (!generated) {
    const defaults = [
      "Foundations",
      "Core concepts",
      "Guided practice",
      "Build and review",
    ].flatMap((phase, phaseIndex) =>
      [1, 2, 3].map(itemIndex => ({
        id: `phase-${phaseIndex + 1}-topic-${itemIndex}`,
        title: `${phase} ${itemIndex}`,
        description: `A practical ${topic} building block.`,
        phase,
        type: itemIndex === 1 ? "core" : "optional",
        explanation: `Understand how ${topic} connects to ${phase.toLowerCase()}.`,
        practice: `Create a small example that demonstrates ${topic} through ${phase.toLowerCase()}.`,
        checkpoint: `Explain and demonstrate ${phase.toLowerCase()} without copying a template.`,
      }))
    );
    return json({
      mode: "fallback",
      title: topic,
      description: `A quick starting roadmap for learning ${topic}.`,
      learnerFit: `Designed for a ${level} learner with about ${hours} hours per week.`,
      assumptions: [
        "Atlas used a general-purpose progression because the AI service was unavailable.",
      ],
      nodes: defaults,
      edges: chainEdges(defaults),
    });
  }
  const rawNodes = Array.isArray(generated.nodes)
    ? generated.nodes.slice(0, 24)
    : [];
  const seen = new Set<string>();
  const nodes = rawNodes
    .map((node, index) => {
      const item = (node || {}) as Record<string, unknown>;
      let id =
        text(item.id, 80)
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || `node-${index + 1}`;
      while (seen.has(id)) id = `${id}-${index + 1}`;
      seen.add(id);
      const kind = text(item.type, 20);
      return {
        id,
        title: text(item.title, 100),
        description: text(item.description, 300),
        phase: text(item.phase, 80),
        type: ["core", "alternative", "optional"].includes(kind)
          ? kind
          : "core",
        explanation: text(item.explanation, 700),
        practice: text(item.practice, 700),
        checkpoint: text(item.checkpoint, 700),
      };
    })
    .filter(node => node.title && node.phase);
  if (nodes.length < 6) {
    const fallbackPhases = [
      "Foundations",
      "Core concepts",
      "Guided practice",
      "Build and review",
    ];
    const fallbackNodes = fallbackPhases.flatMap((phase, phaseIndex) =>
      [1, 2, 3].map(itemIndex => ({
        id: `phase-${phaseIndex + 1}-topic-${itemIndex}`,
        title: `${phase} ${itemIndex}`,
        description: `A practical ${topic} building block.`,
        phase,
        type: itemIndex === 1 ? "core" : "optional",
        explanation: `Understand how ${topic} connects to ${phase.toLowerCase()}.`,
        practice: `Create a small example that demonstrates ${topic} through ${phase.toLowerCase()}.`,
        checkpoint: `Explain and demonstrate ${phase.toLowerCase()} without copying a template.`,
      }))
    );
    return json({
      mode: "fallback",
      title: topic,
      description: `A quick starting roadmap for learning ${topic}.`,
      learnerFit: `Designed for a ${level} learner with about ${hours} hours per week.`,
      assumptions: [
        "Atlas replaced an incomplete provider response with a general-purpose progression.",
      ],
      nodes: fallbackNodes,
      edges: chainEdges(fallbackNodes),
    });
  }
  const valid = new Set(nodes.map(node => node.id));
  const edges = Array.isArray(generated.edges)
    ? generated.edges
        .map(edge => {
          const item = (edge || {}) as Record<string, unknown>;
          return {
            source: text(item.source, 80),
            target: text(item.target, 80),
          };
        })
        .filter(
          edge =>
            valid.has(edge.source) &&
            valid.has(edge.target) &&
            edge.source !== edge.target
        )
        .slice(0, 60)
    : [];
  return json({
    mode: "ai",
    title: text(generated.title, 180) || topic,
    description: text(generated.description, 600),
    learnerFit: text(generated.learnerFit, 600),
    assumptions: Array.isArray(generated.assumptions)
      ? generated.assumptions.map(item => text(item, 300)).slice(0, 6)
      : [],
    nodes,
    edges,
  });
}

async function aiPlanResponse(request: Request, env: Env, identity: Identity) {
  let input: AiPlanRequest;
  try {
    input = (await request.json()) as AiPlanRequest;
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }
  const goal = text(input.goal, 500).trim();
  const level = text(input.level, 60) || "beginner";
  const hours = number(input.hours, 1, 168, 5);
  const pace = text(input.pace, 60) || "steady";
  const roadmap = {
    slug: text(input.roadmap?.slug, 120),
    title: text(input.roadmap?.title, 160),
    description: text(input.roadmap?.description, 500),
  };
  if (!goal || !roadmap.slug)
    return json({ error: "Goal and roadmap are required" }, 400);
  const topics = compactTopics(input.topics);
  if (!topics.length)
    return json({ error: "At least one roadmap topic is required" }, 400);
  const completedIds = validIds(input.completedIds, topics, 120);
  const notes = Object.entries(input.notes || {})
    .slice(0, 20)
    .map(([id, note]) => `${id}: ${text(note, 400)}`)
    .join("\n");
  const context = topics
    .map(
      (topic, index) =>
        `${index + 1}. ${topic.id} | ${topic.title} | ${topic.summary}`
    )
    .join("\n");
  const system = `You are Atlas, a careful AI learning coach. Generate an explainable learning plan grounded only in the supplied roadmap metadata and topic candidates. Never invent topic IDs, topic titles, prerequisites, resources, or facts not supported by the input. Select only topic IDs from the candidates. Prefer a coherent progression: foundations before applications when the supplied sequence suggests it. Treat the learner's goal, current level, available hours, pace, completed topics, and notes as constraints. If the goal is ambiguous, set clarifyingNeeded true and ask at most two high-value follow-up questions, but still provide a useful provisional plan. Keep each phase concrete and actionable. Do not mention private roadmap.sh internals.`;
  const user = `Learner goal: ${goal}\nCurrent level: ${level}\nHours per week: ${hours}\nDepth/pace: ${pace}\nRoadmap: ${roadmap.title} (${roadmap.slug})\nDescription: ${roadmap.description}\nCompleted topic IDs: ${completedIds.join(", ") || "none"}\nLearner notes:\n${notes || "none"}\n\nCandidate topics:\n${context}`;
  // Metered before the model call, not before validation: a malformed body
  // should not cost the caller part of their hourly budget.
  const quota = await consumeAiQuota(env, identity, request);
  if (!quota.allowed) return rateLimited(quota.retryAfterSeconds);
  const generated = await runJsonModel(
    env,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    PLAN_SCHEMA
  );
  if (!generated)
    return json({
      ...fallbackPlan({ goal, level, hours, pace, roadmap, topics }, topics),
      roadmapSlug: roadmap.slug,
    });
  const phases = Array.isArray(generated.phases) ? generated.phases : [];
  const safePhases = phases
    .slice(0, 8)
    .map(phase => {
      const item = (phase || {}) as Record<string, unknown>;
      return {
        title: text(item.title, 160),
        outcome: text(item.outcome, 500),
        topicIds: validIds(item.topicIds, topics, 12),
        why: text(item.why, 700),
        project: text(item.project, 700),
        checkpoint: text(item.checkpoint, 700),
        hours: number(item.hours, 0.5, 168, hours),
      };
    })
    .filter(phase => phase.title && phase.topicIds.length);
  return json({
    mode: "ai",
    roadmapSlug: roadmap.slug,
    interpretation: text(generated.interpretation, 800),
    confidence: number(generated.confidence, 0, 1, 0.6),
    clarifyingNeeded: Boolean(generated.clarifyingNeeded),
    followUpQuestions: Array.isArray(generated.followUpQuestions)
      ? generated.followUpQuestions.map(item => text(item, 300)).slice(0, 2)
      : [],
    assumptions: Array.isArray(generated.assumptions)
      ? generated.assumptions.map(item => text(item, 300)).slice(0, 6)
      : [],
    weeklyRhythm: text(generated.weeklyRhythm, 700),
    phases: safePhases.length
      ? safePhases
      : fallbackPlan({ goal, level, hours, pace, roadmap, topics }, topics)
          .phases,
  });
}

async function aiChatResponse(request: Request, env: Env, identity: Identity) {
  let input: AiChatRequest;
  try {
    input = (await request.json()) as AiChatRequest;
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }
  const question = text(input.question, 1000).trim();
  const roadmap = {
    slug: text(input.roadmap?.slug, 120),
    title: text(input.roadmap?.title, 160),
    description: text(input.roadmap?.description, 500),
  };
  const topics = compactTopics(input.topics, 80);
  if (!question || !roadmap.slug || !topics.length)
    return json(
      { error: "Roadmap, question, and topic context are required" },
      400
    );
  const progress = Object.entries(input.progress || {})
    .filter(([, done]) => Boolean(done))
    .map(([id]) => id)
    .filter(id => topicMap(topics).has(id))
    .slice(0, 120);
  const notes = Object.entries(input.notes || {})
    .slice(0, 20)
    .map(([id, note]) => `${id}: ${text(note, 400)}`)
    .join("\n");
  const history = (input.history || [])
    .slice(-8)
    .map(message => `${message.role}: ${text(message.content, 1200)}`)
    .join("\n");
  const context = topics
    .map(topic => `${topic.id} | ${topic.title} | ${topic.summary}`)
    .join("\n");
  const system = `You are Atlas AI Tutor inside the ${roadmap.title} roadmap. Answer as a precise, encouraging learning coach. You can explain concepts, recommend what to learn next, use progress to avoid completed topics, surface public topic resources only when the user asks and the client can display them, and suggest a small action. Ground claims in the supplied roadmap context. Never invent a topic ID, resource, or roadmap fact. If you propose an action, use only complete, uncomplete, save_note, or recommend_next. Keep the answer under 350 words and include 2-3 useful suggested prompts.`;
  const user = `Roadmap: ${roadmap.title} (${roadmap.slug})\nDescription: ${roadmap.description}\nCompleted topic IDs: ${progress.join(", ") || "none"}\nLearner notes:\n${notes || "none"}\nRecent conversation:\n${history || "none"}\n\nTopic context:\n${context}\n\nLearner question: ${question}`;
  // Metered before the model call, not before validation: a malformed body
  // should not cost the caller part of their hourly budget.
  const quota = await consumeAiQuota(env, identity, request);
  if (!quota.allowed) return rateLimited(quota.retryAfterSeconds);
  const generated = await runJsonModel(
    env,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    CHAT_SCHEMA
  );
  if (!generated)
    return json({
      mode: "fallback",
      answer:
        "The AI tutor is temporarily unavailable. Try asking about a specific topic, or open the topic list and mark the next unfinished item as complete.",
      topicIds: [],
      suggestedPrompts: [
        "What should I learn next?",
        "Explain the first unfinished topic",
        "Show me the most important foundation",
      ],
      actions: [],
    });
  const allowedIds = topicMap(topics);
  const actions = Array.isArray(generated.actions)
    ? generated.actions
        .slice(0, 4)
        .map(action => {
          const item = (action || {}) as Record<string, unknown>;
          const topicId = text(item.topicId, 160);
          return {
            type: text(item.type, 40),
            topicId: allowedIds.has(topicId) ? topicId : "",
            note: text(item.note, 1000),
          };
        })
        .filter(
          action =>
            action.topicId &&
            ["complete", "uncomplete", "save_note", "recommend_next"].includes(
              action.type
            )
        )
    : [];
  return json({
    mode: "ai",
    answer: text(generated.answer, 2400),
    topicIds: validIds(generated.topicIds, topics, 8),
    suggestedPrompts: Array.isArray(generated.suggestedPrompts)
      ? generated.suggestedPrompts.map(item => text(item, 180)).slice(0, 4)
      : [],
    actions,
  });
}

async function ensureProfile(db: D1Database, id: string) {
  const timestamp = now();
  await db
    .prepare(
      "INSERT INTO atlas_profiles (profile_id, created_at, updated_at) VALUES (?, ?, ?) ON CONFLICT(profile_id) DO UPDATE SET updated_at = excluded.updated_at"
    )
    .bind(id, timestamp, timestamp)
    .run();
}

/**
 * Groups rows by roadmap slug.
 *
 * `progress` and `notes` used to be flattened onto `topic_id` alone, which threw
 * away the roadmap the row belonged to. Combined with the 0001 primary key that
 * did the same thing, a topic id shared between two roadmaps (`html`, `git`,
 * `sql` — most of the catalog shares these) meant one roadmap's state showed up
 * on another. Rows arrive `ORDER BY updated_at DESC`, so within a slug the first
 * write wins and that is the newest one.
 */
export function groupBySlug<
  Row extends { roadmap_slug: string; topic_id: string },
  Value,
>(rows: Row[], value: (row: Row) => Value) {
  const grouped: Record<string, Record<string, Value>> = {};
  for (const row of rows) {
    if (!row.roadmap_slug || !row.topic_id) continue;
    const bucket = (grouped[row.roadmap_slug] ??= {});
    if (row.topic_id in bucket) continue;
    bucket[row.topic_id] = value(row);
  }
  return grouped;
}

async function snapshot(db: D1Database, id: string) {
  const [favorites, progress, notes, plans] = await Promise.all([
    db
      .prepare(
        "SELECT roadmap_slug FROM atlas_favorites WHERE profile_id = ? ORDER BY created_at DESC"
      )
      .bind(id)
      .all<{ roadmap_slug: string }>(),
    db
      .prepare(
        "SELECT roadmap_slug, topic_id, completed, updated_at FROM atlas_progress WHERE profile_id = ? ORDER BY updated_at DESC"
      )
      .bind(id)
      .all<{
        roadmap_slug: string;
        topic_id: string;
        completed: number;
        updated_at: string;
      }>(),
    db
      .prepare(
        "SELECT roadmap_slug, topic_id, note, updated_at FROM atlas_notes WHERE profile_id = ? ORDER BY updated_at DESC"
      )
      .bind(id)
      .all<{
        roadmap_slug: string;
        topic_id: string;
        note: string;
        updated_at: string;
      }>(),
    db
      .prepare(
        "SELECT id, goal, roadmap_slug, level, hours, pace, topic_ids_json, created_at FROM atlas_plans WHERE profile_id = ? ORDER BY created_at DESC LIMIT 20"
      )
      .bind(id)
      .all<{
        id: string;
        goal: string;
        roadmap_slug: string;
        level: string;
        hours: number;
        pace: string;
        topic_ids_json: string;
        created_at: string;
      }>(),
  ]);
  return {
    profile: id,
    favorites: (favorites.results || []).map(item => item.roadmap_slug),
    progress: groupBySlug(progress.results || [], item =>
      Boolean(item.completed)
    ),
    notes: groupBySlug(notes.results || [], item => item.note),
    plans: (plans.results || []).map(item => {
      const { topic_ids_json, ...rest } = item;
      return { ...rest, topicIds: parseTopicIds(topic_ids_json, item.id) };
    }),
  };
}

/**
 * A single malformed `topic_ids_json` row used to throw inside `snapshot()` and
 * therefore break every read for that profile permanently — favourites,
 * progress and notes included. The bad row is now skipped instead.
 */
export function parseTopicIds(raw: string, planId: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch (error) {
    console.error(`atlas: unparseable topic_ids_json on plan ${planId}`, error);
    return [];
  }
}

/**
 * Tolerant boolean coercion. The typed client sends real booleans, but `1` and
 * `"true"` are common enough from hand-rolled callers to be worth accepting;
 * anything else is false rather than truthy, so the string `"false"` no longer
 * marks a topic complete.
 */
const flag = (value: unknown) =>
  value === true || value === 1 || value === "true";

/**
 * Reads a string field out of an untrusted request body.
 *
 * `text()` coerces — `String(value ?? "")` — which is right for a query
 * parameter or a model's output, where something string-shaped is all that is
 * on offer. It is wrong for a JSON body, because coercion succeeds on values
 * that cannot have been meant: `{"action":"note","note":{"a":1}}` returned 200
 * and persisted the literal string `"[object Object]"` under the caller's
 * profile. Storing nonsense is worse than refusing it, so a present field of
 * the wrong type is a malformed request and gets a 400.
 *
 * Absent is not wrong: `undefined` and `null` read as `""` so optional fields
 * keep their defaults, which is what the typed client relies on.
 *
 * Returns `null` for "present but not a string" — the caller turns that into a
 * 400 the same way it does an unknown action.
 */
export function bodyText(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  return text(value, max);
}

/**
 * The numeric counterpart. `number()` falls back on anything unparseable, so
 * `{"hours":"whenever"}` silently became 0 hours; a plan built on a number the
 * caller never sent is not a plan it can trust. Absent still falls back.
 */
export function bodyNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number | null {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(min, Math.min(max, value));
}

/**
 * Parses an untrusted request body into a `StateAction`, returning null for
 * anything unrecognised so the caller can answer 400.
 *
 * Every field goes through `bodyText()` / `bodyNumber()`, which refuse a present
 * value of the wrong type. The first version of this handler called `.slice()`
 * straight on `input.note` and `input.goal`, so a number in either field threw a
 * TypeError mid-handler and surfaced as a 500; routing them through `text()`
 * stopped the crash but coerced instead, storing `"[object Object]"`. Neither is
 * right — a malformed body is a 400 and nothing is written.
 */
export function parseStateAction(body: unknown): StateAction | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  const actionId = bodyText(raw.actionId, 120);
  const roadmapSlugRaw = bodyText(raw.roadmapSlug, 160);
  const topicIdRaw = bodyText(raw.topicId, 200);
  if (actionId === null || roadmapSlugRaw === null || topicIdRaw === null) {
    return null;
  }
  const roadmapSlug = roadmapSlugRaw.trim();
  const topicId = topicIdRaw.trim();
  switch (text(raw.action, 40)) {
    case "snapshot":
      return { action: "snapshot", actionId: actionId || undefined };
    case "favorite":
      if (!roadmapSlug) return null;
      return {
        action: "favorite",
        roadmapSlug,
        saved: flag(raw.saved),
        actionId: actionId || undefined,
      };
    case "progress":
      if (!roadmapSlug || !topicId) return null;
      return {
        action: "progress",
        roadmapSlug,
        topicId,
        completed: flag(raw.completed),
        actionId: actionId || undefined,
      };
    case "note": {
      if (!roadmapSlug || !topicId) return null;
      const note = bodyText(raw.note, 20000);
      if (note === null) return null;
      return {
        action: "note",
        roadmapSlug,
        topicId,
        note,
        actionId: actionId || undefined,
      };
    }
    case "plan": {
      if (!roadmapSlug) return null;
      const goal = bodyText(raw.goal, 500);
      const level = bodyText(raw.level, 60);
      const pace = bodyText(raw.pace, 60);
      const hours = bodyNumber(raw.hours, 0, 168, 0);
      if (goal === null || level === null || pace === null || hours === null) {
        return null;
      }
      // Bounded before it is serialised: an unbounded array would let one
      // request write an arbitrarily large TEXT blob. A non-array `topicIds`,
      // or one holding anything but strings, is a malformed request rather
      // than an empty plan — the old code accepted both silently.
      let topicIds: string[] = [];
      if (raw.topicIds !== undefined && raw.topicIds !== null) {
        if (!Array.isArray(raw.topicIds)) return null;
        // Entries are checked directly rather than through bodyText(): inside a
        // list, `null` is not the "field omitted" case that bodyText() forgives,
        // so routing it through there would read as `""` and quietly vanish in
        // the filter below.
        if (raw.topicIds.some(entry => typeof entry !== "string")) return null;
        topicIds = raw.topicIds
          .slice(0, 200)
          .map(entry => text(entry, 200).trim())
          .filter(Boolean);
      }
      return {
        action: "plan",
        goal,
        roadmapSlug,
        level: level || "beginner",
        hours,
        pace: pace || "balanced",
        topicIds,
        actionId: actionId || undefined,
      };
    }
    default:
      return null;
  }
}

async function stateResponse(request: Request, env: Env, identity: Identity) {
  if (!env.ATLAS_DB)
    return json({ error: "ATLAS_DB binding is not configured" }, 503);
  // This route used to accept any method, so a GET could carry a mutation body
  // and a DELETE was silently treated as one too.
  if (
    request.method !== "GET" &&
    request.method !== "POST" &&
    request.method !== "DELETE"
  )
    return json({ error: "Method not allowed" }, 405, {
      allow: "GET, POST, DELETE",
    });
  const db = env.ATLAS_DB;
  const id = identity.id;
  // Reads no longer write. ensureProfile() ran on every request including
  // GETs, which meant a D1 write on every page load.
  if (request.method === "GET") return json(await snapshot(db, id));
  if (request.method === "DELETE") return forgetProfile(db, identity);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }
  const input = parseStateAction(body);
  if (!input) return json({ error: "Unknown or invalid action" }, 400);

  await ensureProfile(db, id);
  const timestamp = now();
  if (input.action === "favorite") {
    if (input.saved)
      await db
        .prepare(
          "INSERT OR REPLACE INTO atlas_favorites (profile_id, roadmap_slug, created_at) VALUES (?, ?, ?)"
        )
        .bind(id, input.roadmapSlug, timestamp)
        .run();
    else
      await db
        .prepare(
          "DELETE FROM atlas_favorites WHERE profile_id = ? AND roadmap_slug = ?"
        )
        .bind(id, input.roadmapSlug)
        .run();
  } else if (input.action === "progress") {
    await db
      .prepare(
        "INSERT OR REPLACE INTO atlas_progress (profile_id, roadmap_slug, topic_id, completed, updated_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(
        id,
        input.roadmapSlug,
        input.topicId,
        input.completed ? 1 : 0,
        timestamp
      )
      .run();
  } else if (input.action === "note") {
    await db
      .prepare(
        "INSERT OR REPLACE INTO atlas_notes (profile_id, roadmap_slug, topic_id, note, updated_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(id, input.roadmapSlug, input.topicId, input.note, timestamp)
      .run();
  } else if (input.action === "plan") {
    await db
      .prepare(
        "INSERT OR IGNORE INTO atlas_plans (id, profile_id, goal, roadmap_slug, level, hours, pace, topic_ids_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        `${id}:${input.actionId ?? crypto.randomUUID()}`.slice(0, 200),
        id,
        input.goal,
        input.roadmapSlug,
        input.level,
        input.hours,
        input.pace,
        JSON.stringify(input.topicIds),
        timestamp
      )
      .run();
  }
  return json(await snapshot(db, id));
}

/**
 * `DELETE /api/state` — erases everything stored against the caller's profile and
 * expires the identity cookie, so the next request mints a fresh anonymous one.
 *
 * There was previously no way to delete a profile's data at all, which is both a
 * data-protection gap and a testability one: there was no way to return the store
 * to a known-empty state.
 *
 * The child tables declare `ON DELETE CASCADE`, but they are deleted explicitly
 * so the result does not depend on whether foreign-key enforcement is on for the
 * connection.
 */
async function forgetProfile(db: D1Database, identity: Identity) {
  const id = identity.id;
  await db.batch([
    db.prepare("DELETE FROM atlas_favorites WHERE profile_id = ?").bind(id),
    db.prepare("DELETE FROM atlas_progress WHERE profile_id = ?").bind(id),
    db.prepare("DELETE FROM atlas_notes WHERE profile_id = ?").bind(id),
    db.prepare("DELETE FROM atlas_plans WHERE profile_id = ?").bind(id),
    db.prepare("DELETE FROM atlas_profiles WHERE profile_id = ?").bind(id),
  ]);
  return json({ deleted: true }, 200, {
    "set-cookie": `${PROFILE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
  });
}

const PACKED_MVT_PATH =
  /^\/data\/world-mvt\/([^/]+)\/([^/]+)\/(\d+)\/(\d+)\/(\d+)\.pbf$/;

/**
 * Tiles were never cached anywhere. The response already carried
 * `max-age=31536000, immutable`, but a Worker response is not stored at the
 * edge unless the Worker puts it in the Cache API itself — so every tile was a
 * full origin round-trip forever (measured at 0.55-1.07 s each against the live
 * deployment, with no `CF-Cache-Status` header at all). At 10-30 tiles per
 * viewport that is the dominant cost of panning the map.
 *
 * Both hits and misses are cached: the release id is part of the path, so a data
 * refresh publishes new URLs rather than invalidating these, and caching the
 * misses matters because the client computes its tile range arithmetically and
 * therefore asks for tiles that legitimately do not exist.
 */
const TILE_MISS_CACHE_SECONDS = 3600;

async function packedMvtResponse(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response | null> {
  const match = new URL(request.url).pathname.match(PACKED_MVT_PATH);
  if (!match) return null;
  const [, releaseId = "", layerDirectory = "", zoom = "", x = "", y = ""] =
    match;
  if (!releaseId || !layerDirectory || !zoom || !x || !y) return null;

  // The Cache API only accepts GET keys, so HEAD shares the GET entry and the
  // body is dropped on the way out.
  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return stripBodyForHead(cached, request.method);

  const built = await buildPackedMvtResponse(request, env, {
    releaseId,
    layerDirectory,
    zoom,
    x,
    y,
  });
  if (built.status === 200 || built.status === 404)
    ctx.waitUntil(cache.put(cacheKey, built.clone()));
  return stripBodyForHead(built, request.method);
}

function stripBodyForHead(response: Response, method: string) {
  if (method !== "HEAD") return response;
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}

async function buildPackedMvtResponse(
  request: Request,
  env: Env,
  tile: {
    releaseId: string;
    layerDirectory: string;
    zoom: string;
    x: string;
    y: string;
  }
): Promise<Response> {
  const { releaseId, layerDirectory, zoom, x, y } = tile;
  const basePath = `/data/world-mvt/${releaseId}/packed/${layerDirectory}/${zoom}/${x}`;
  const noCompression = { "accept-encoding": "identity" };
  const missHeaders = {
    "cache-control": `public, max-age=${TILE_MISS_CACHE_SECONDS}`,
  };
  // The current build emits exactly one part per column (verified: zero
  // `<x>.<n>.json` files across all 4,844 shards), and a missing part index is
  // served the SPA shell rather than a 404, so this loop already exits after two
  // subrequests. The bound stays as forward compatibility for a build that does
  // split a column.
  for (let part = 0; part < 32; part += 1) {
    const suffix = part === 0 ? "" : `.${part}`;
    const indexResponse = await env.ASSETS.fetch(
      new Request(new URL(`${basePath}${suffix}.json`, request.url), {
        headers: noCompression,
      })
    );
    const contentType = indexResponse.headers.get("content-type") || "";
    if (!indexResponse.ok || !contentType.includes("json")) {
      if (part === 0)
        return new Response(null, { status: 404, headers: missHeaders });
      break;
    }
    const index = (await indexResponse.json()) as Record<
      string,
      [number, number]
    >;
    const entry = index[y];
    if (!entry) continue;
    const [offset, length] = entry;
    if (
      !Number.isInteger(offset) ||
      !Number.isInteger(length) ||
      offset < 0 ||
      length <= 0
    )
      return new Response(null, { status: 502 });
    const shardResponse = await env.ASSETS.fetch(
      new Request(new URL(`${basePath}${suffix}.bin`, request.url), {
        headers: {
          ...noCompression,
          range: `bytes=${offset}-${offset + length - 1}`,
        },
      })
    );
    if (!shardResponse.ok)
      return new Response(null, { status: 404, headers: missHeaders });
    const payload = new Uint8Array(await shardResponse.arrayBuffer());
    const ranged =
      shardResponse.status === 206 || payload.byteLength === length;
    const start = ranged ? 0 : offset;
    if (!ranged) {
      // The whole shard came back (up to 2.7 MB) because Range was ignored. The
      // slice below still yields the correct tile, so this stays a warning
      // rather than a 502 — turning it into an error would break every tile the
      // moment the asset layer stopped honouring Range — but it is now visible
      // instead of silent.
      console.warn(
        `atlas: range ignored for ${basePath}${suffix}.bin, buffered ${payload.byteLength} B for a ${length} B tile`
      );
    }
    if (start + length > payload.byteLength)
      return new Response(null, { status: 502 });
    const headers = new Headers({
      "content-type": "application/x-protobuf",
      "cache-control": "public, max-age=31536000, immutable",
      "content-length": String(length),
    });
    return new Response(payload.slice(start, start + length), {
      status: 200,
      headers,
    });
  }
  return new Response(null, { status: 404, headers: missHeaders });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.match(PACKED_MVT_PATH)) {
      const packed = await packedMvtResponse(request, env, ctx);
      if (packed) return packed;
    }
    // Identity is resolved once per request and the Set-Cookie attached on the
    // way out, so an AI call from a first-time visitor mints the same profile
    // the following /api/state read will use.
    //
    // The CORS preflight handler that used to live here returned
    // `access-control-allow-origin: *` while every real response returned no
    // such header, so it advertised cross-origin access the API never granted.
    // This API has one consumer — the SPA served from the same origin — so
    // same-origin only is the correct policy and the preflight is gone.
    if (url.pathname.startsWith("/api/")) {
      const identity = resolveIdentity(request);
      const handled = await apiResponse(request, env, url, identity);
      if (handled) return withIdentityCookie(handled, identity);
    }
    // Everything that is not an API call and not an assembled tile is a real
    // file, and a real file never reaches this line in production: the asset
    // layer answers it first. Cache-Control for those responses is configured
    // in `client/public/_headers`, which is where it has to be — a header set
    // here would only ever apply to a request that missed and fell through to
    // the single-page-application shell.
    return env.ASSETS.fetch(request);
  },
};

async function apiResponse(
  request: Request,
  env: Env,
  url: URL,
  identity: Identity
): Promise<Response | null> {
  if (url.pathname === "/api/state")
    return stateResponse(request, env, identity);
  // These used to fall through to the SPA shell on a non-POST, answering 200
  // with HTML where a client expected either JSON or a method error.
  if (url.pathname === "/api/ai/roadmap")
    return request.method === "POST"
      ? aiRoadmapResponse(request, env, identity)
      : json({ error: "Method not allowed" }, 405, { allow: "POST" });
  if (url.pathname === "/api/ai/plan")
    return request.method === "POST"
      ? aiPlanResponse(request, env, identity)
      : json({ error: "Method not allowed" }, 405, { allow: "POST" });
  if (url.pathname === "/api/ai/chat")
    return request.method === "POST"
      ? aiChatResponse(request, env, identity)
      : json({ error: "Method not allowed" }, 405, { allow: "POST" });
  return null;
}
