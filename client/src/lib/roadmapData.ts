/**
 * Per-roadmap data loading.
 *
 * `roadmap-content.json` (19.9 MB, 10,499 topics across 92 roadmaps) and
 * `roadmap-graphs.json` (5.7 MB) used to be fetched whole and filtered in the
 * browser, so opening one roadmap downloaded all 92. `scripts/split-roadmap-data.mjs`
 * now emits one shard per roadmap at build time — roughly 193 KB of topics and
 * 61 KB of graph — and these helpers read those.
 *
 * Every call takes an AbortSignal. Navigating away used to leave ~25 MB in
 * flight with nothing waiting for it.
 */

import type { RoadmapTopic } from "@/data/roadmapCatalog";

export type RoadmapTopicRecord = RoadmapTopic & {
  id: string;
  roadmapSlug: string;
  markdown: string;
  links: { label: string; url: string }[];
  sourceUrl: string;
};

export type RoadmapGraphNode = {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  positionAbsolute?: { x: number; y: number };
  width?: number;
  height?: number;
  data?: {
    label?: string;
    style?: Record<string, string | number>;
    legend?: { label?: string; color?: string };
  };
};

export type RoadmapGraphEdge = {
  id?: string;
  source?: string;
  target?: string;
  type?: string;
  style?: Record<string, string | number>;
};

export type RoadmapGraphDocument = {
  nodes: RoadmapGraphNode[];
  edges: RoadmapGraphEdge[];
  dimensions?: { width: number; height: number };
};

/**
 * `not_found_handling: single-page-application` in wrangler.jsonc means a
 * missing asset is answered with the SPA shell at status 200, so a 404 never
 * reaches us — an unsplit deployment would look like a roadmap whose topics
 * parse as HTML. The content-type check turns that into a legible failure.
 */
async function getJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  const response = await fetch(path, { signal });
  if (!response.ok) return null;
  if (!response.headers.get("content-type")?.includes("json")) {
    console.error(
      `atlas: ${path} was answered with the SPA shell, not JSON — has scripts/split-roadmap-data.mjs run?`
    );
    return null;
  }
  return (await response.json()) as T;
}

export async function fetchRoadmapTopics(
  slug: string,
  signal?: AbortSignal
): Promise<RoadmapTopicRecord[]> {
  const records = await getJson<RoadmapTopicRecord[]>(
    `/data/roadmaps/${encodeURIComponent(slug)}/topics.json`,
    signal
  );
  return Array.isArray(records) ? records : [];
}

export async function fetchRoadmapGraph(
  slug: string,
  signal?: AbortSignal
): Promise<RoadmapGraphDocument | null> {
  const payload = await getJson<{ roadmap?: RoadmapGraphDocument }>(
    `/data/roadmaps/${encodeURIComponent(slug)}/graph.json`,
    signal
  );
  const graph = payload?.roadmap;
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
    return null;
  return graph;
}

/** An aborted fetch is a navigation, not a failure worth surfacing. */
export function isAbort(thrown: unknown) {
  return thrown instanceof DOMException && thrown.name === "AbortError";
}
