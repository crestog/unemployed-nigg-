interface Env {
  ASSETS: Fetcher;
  ATLAS_DB: D1Database;
}

type StateAction =
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
      goal: string;
      roadmapSlug: string;
      level: string;
      hours: number;
      pace: string;
      topicIds: string[];
    };

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
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
      "INSERT INTO atlas_plans (id, profile_id, goal, roadmap_slug, level, hours, pace, topic_ids_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        crypto.randomUUID(),
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
  } else if (input.action !== "snapshot") {
    return json({ error: "Unknown action" }, 400);
  }
  return json(await snapshot(env.ATLAS_DB, id));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/state") return stateResponse(request, env);
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
    return env.ASSETS.fetch(request);
  },
};
