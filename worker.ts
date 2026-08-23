interface AiBinding {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
}

interface Env {
  ASSETS: Fetcher;
  ATLAS_DB: D1Database;
  AI?: AiBinding;
}

type TopicContext = {
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function text(value: unknown, max = 4000) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .slice(0, max);
}

function number(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.max(min, Math.min(max, parsed))
    : fallback;
}

function profileId(request: Request) {
  const url = new URL(request.url);
  const requested =
    url.searchParams.get("profile") ||
    request.headers.get("x-atlas-profile") ||
    "anonymous";
  return requested.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "anonymous";
}

function now() {
  return new Date().toISOString();
}

function compactTopics(topics: unknown, max = 120): TopicContext[] {
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

function parseAiPayload(raw: unknown): Record<string, unknown> | null {
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

function validIds(ids: unknown, topics: TopicContext[], max = 30) {
  const allowed = topicMap(topics);
  if (!Array.isArray(ids)) return [];
  return Array.from(
    new Set(ids.map(id => text(id, 160)).filter(id => allowed.has(id)))
  ).slice(0, max);
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

async function runJsonModel(
  env: Env,
  model: string,
  messages: Array<{ role: string; content: string }>,
  schema: Record<string, unknown>
) {
  if (!env.AI) return null;
  try {
    const response = await Promise.race([
      env.AI.run(model, {
        messages,
        temperature: 0.2,
        max_tokens: 2600,
        response_format: { type: "json_schema", json_schema: schema },
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 18000)),
    ]);
    return parseAiPayload(response);
  } catch {
    return null;
  }
}

async function aiRoadmapResponse(request: Request, env: Env) {
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
  const generated = await runJsonModel(
    env,
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    ROADMAP_SCHEMA
  );
  if (!generated) {
    const slug =
      topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "learning";
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
      edges: defaults.slice(1).map((node, index) => ({
        source: defaults[index].id,
        target: node.id,
      })),
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
      edges: fallbackNodes.slice(1).map((node, index) => ({
        source: fallbackNodes[index].id,
        target: node.id,
      })),
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

async function aiPlanResponse(request: Request, env: Env) {
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
  const generated = await runJsonModel(
    env,
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
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

async function aiChatResponse(request: Request, env: Env) {
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
  const generated = await runJsonModel(
    env,
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
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
    progress: (progress.results || []).reduce<Record<string, boolean>>(
      (map, item) => {
        map[item.topic_id] = Boolean(item.completed);
        return map;
      },
      {}
    ),
    notes: (notes.results || []).reduce<Record<string, string>>((map, item) => {
      map[item.topic_id] = item.note;
      return map;
    }, {}),
    plans: (plans.results || []).map(item => ({
      ...item,
      topicIds: JSON.parse(item.topic_ids_json),
    })),
  };
}

function withAssetCacheHeaders(response: Response, pathname: string) {
  if (!response.ok) return response;
  const headers = new Headers(response.headers);
  if (pathname === "/data/india-tiles/manifest.json") {
    headers.set("cache-control", "public, max-age=60, must-revalidate");
  } else if (new RegExp("^/data/india-tiles/[^/]+/").test(pathname)) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  } else if (pathname === "/data/world-venture.json") {
    headers.set(
      "cache-control",
      "public, max-age=3600, stale-while-revalidate=86400"
    );
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function stateResponse(request: Request, env: Env) {
  if (!env.ATLAS_DB)
    return json({ error: "ATLAS_DB binding is not configured" }, 503);
  const id = profileId(request);
  await ensureProfile(env.ATLAS_DB, id);
  if (request.method === "GET") return json(await snapshot(env.ATLAS_DB, id));
  let input: StateAction;
  try {
    input = (await request.json()) as StateAction;
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }
  const timestamp = now();
  if (input.action === "favorite") {
    if (input.saved)
      await env.ATLAS_DB.prepare(
        "INSERT OR REPLACE INTO atlas_favorites (profile_id, roadmap_slug, created_at) VALUES (?, ?, ?)"
      )
        .bind(id, input.roadmapSlug, timestamp)
        .run();
    else
      await env.ATLAS_DB.prepare(
        "DELETE FROM atlas_favorites WHERE profile_id = ? AND roadmap_slug = ?"
      )
        .bind(id, input.roadmapSlug)
        .run();
  } else if (input.action === "progress") {
    await env.ATLAS_DB.prepare(
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
    await env.ATLAS_DB.prepare(
      "INSERT OR REPLACE INTO atlas_notes (profile_id, roadmap_slug, topic_id, note, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        id,
        input.roadmapSlug,
        input.topicId,
        input.note.slice(0, 20000),
        timestamp
      )
      .run();
  } else if (input.action === "plan") {
    await env.ATLAS_DB.prepare(
      "INSERT OR IGNORE INTO atlas_plans (id, profile_id, goal, roadmap_slug, level, hours, pace, topic_ids_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        `${id}:${input.actionId ?? crypto.randomUUID()}`.slice(0, 200),
        id,
        input.goal.slice(0, 500),
        input.roadmapSlug,
        input.level,
        Math.max(0, Math.min(168, Number(input.hours) || 0)),
        input.pace,
        JSON.stringify(input.topicIds || []),
        timestamp
      )
      .run();
  } else if (input.action !== "snapshot")
    return json({ error: "Unknown action" }, 400);
  return json(await snapshot(env.ATLAS_DB, id));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/state") return stateResponse(request, env);
    if (url.pathname === "/api/ai/roadmap" && request.method === "POST")
      return aiRoadmapResponse(request, env);
    if (url.pathname === "/api/ai/plan" && request.method === "POST")
      return aiPlanResponse(request, env);

    if (url.pathname === "/api/ai/chat" && request.method === "POST")
      return aiChatResponse(request, env);
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          ...jsonHeaders,
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type,x-atlas-profile",
        },
      });
    return withAssetCacheHeaders(await env.ASSETS.fetch(request), url.pathname);
  },
};
