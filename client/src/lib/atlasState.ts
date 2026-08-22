export type AtlasSnapshot = {
  profile: string;
  favorites: string[];
  progress: Record<string, boolean>;
  notes: Record<string, string>;
  plans: Array<Record<string, unknown>>;
};

type AtlasAction = Record<string, unknown>;

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

const PROFILE_KEY = "atlas-profile-id";

export function getAtlasProfileId() {
  const existing = localStorage.getItem(PROFILE_KEY);
  if (existing) return existing;
  const generated = `private-${crypto.randomUUID()}`;
  localStorage.setItem(PROFILE_KEY, generated);
  return generated;
}

export async function syncAtlasAction(
  action: AtlasAction
): Promise<AtlasSnapshot | null> {
  try {
    const response = await fetch(
      `/api/state?profile=${encodeURIComponent(getAtlasProfileId())}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-atlas-profile": getAtlasProfileId(),
        },
        body: JSON.stringify(action),
      }
    );
    if (!response.ok) return null;
    return (await response.json()) as AtlasSnapshot;
  } catch {
    return null;
  }
}

export async function loadAtlasSnapshot(): Promise<AtlasSnapshot | null> {
  try {
    const response = await fetch(
      `/api/state?profile=${encodeURIComponent(getAtlasProfileId())}`,
      { headers: { "x-atlas-profile": getAtlasProfileId() } }
    );
    if (!response.ok) return null;
    return (await response.json()) as AtlasSnapshot;
  } catch {
    return null;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-atlas-profile": getAtlasProfileId(),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
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
