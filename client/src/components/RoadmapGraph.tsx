import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw, Search } from "lucide-react";
import type { RoadmapTopic } from "@/data/roadmapCatalog";

type GraphNode = {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  positionAbsolute?: { x: number; y: number };
  width?: number;
  height?: number;
  data?: { label?: string; style?: Record<string, string | number>; legend?: { label?: string; color?: string } };
};
type GraphEdge = { id?: string; source?: string; target?: string; type?: string; style?: Record<string, string | number> };
type GraphDocument = { nodes: GraphNode[]; edges: GraphEdge[]; dimensions?: { width: number; height: number } };
type GraphPayload = { roadmaps: Record<string, GraphDocument> };
type TopicWithMarkdown = RoadmapTopic & { id: string; roadmapSlug: string; markdown?: string };

type Props = {
  slug: string;
  topics: TopicWithMarkdown[];
  progress: Record<string, boolean>;
  onTopicSelect: (topic: TopicWithMarkdown) => void;
};

const LEGEND_COLORS = {
  recommended: "#a78bfa",
  alternative: "#78a64a",
  flexible: "#929292",
  default: "#2B78E4",
};

function nodePosition(node: GraphNode) {
  return node.positionAbsolute || node.position || { x: 0, y: 0 };
}

function nodeWidth(node: GraphNode) {
  return Math.max(118, Math.min(280, Number(node.width || node.data?.style?.width || 240)));
}

function nodeHeight(node: GraphNode) {
  return Math.max(38, Math.min(72, Number(node.height || node.data?.style?.height || 49)));
}

function legendKey(node: GraphNode) {
  const label = node.data?.legend?.label?.toLowerCase() || "";
  if (label.includes("alternative")) return "alternative" as const;
  if (label.includes("order not strict")) return "flexible" as const;
  if (label.includes("recommendation")) return "recommended" as const;
  return "default" as const;
}

export default function RoadmapGraph({ slug, topics, progress, onTopicSelect }: Props) {
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [legendFilter, setLegendFilter] = useState<"all" | "recommended" | "alternative" | "flexible">("all");
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    fetch("/data/roadmap-graphs.json")
      .then((response) => response.json() as Promise<GraphPayload>)
      .then(setPayload)
      .catch(() => setPayload(null));
  }, []);

  const graph = payload?.roadmaps?.[slug];
  const topicById = useMemo(() => new Map(topics.map((topic) => [topic.id.split("@").pop() || topic.id, topic])), [topics]);
  const bounds = useMemo(() => {
    const visibleNodes = graph?.nodes.filter((node) => node.data?.label && node.type !== "vertical" && node.type !== "horizontal") || [];
    if (!visibleNodes.length) return { minX: -500, minY: -200, width: 1800, height: 2400 };
    const points = visibleNodes.map((node) => nodePosition(node));
    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxX = Math.max(...points.map((point) => point.x + nodeWidth(nodeFromPoint(visibleNodes, point.x, point.y))));
    const maxY = Math.max(...points.map((point) => point.y + nodeHeight(nodeFromPoint(visibleNodes, point.x, point.y))));
    return { minX: minX - 180, minY: minY - 140, width: Math.max(1200, maxX - minX + 360), height: Math.max(900, maxY - minY + 300) };
  }, [graph]);

  const visibleNodes = useMemo(() => (graph?.nodes || []).filter((node) => {
    if (!node.data?.label || ["vertical", "horizontal", "section", "paragraph", "title"].includes(node.type || "")) return false;
    if (legendFilter !== "all" && legendKey(node) !== legendFilter) return false;
    if (query.trim() && !node.data.label.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  }), [graph, legendFilter, query]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const nodeMap = useMemo(() => new Map((graph?.nodes || []).map((node) => [node.id, node])), [graph]);
  const renderEdges = (graph?.edges || []).filter((edge) => edge.source && edge.target && visibleIds.has(edge.source) && visibleIds.has(edge.target));

  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setOffset({ x: dragStart.current.offsetX - (event.clientX - dragStart.current.x) / Math.max(scale, 0.3), y: dragStart.current.offsetY - (event.clientY - dragStart.current.y) / Math.max(scale, 0.3) });
  }

  function handlePointerUp() {
    setDragging(false);
  }

  if (!graph) return <div className="grid min-h-[600px] place-items-center rounded-2xl border border-white/10 bg-[#0f182a] text-center"><div><Search className="mx-auto h-7 w-7 text-[#9a8bff]" /><p className="mt-3 font-bold text-white">Loading the public roadmap graph…</p><p className="mt-2 text-sm text-[#8492ad]">Atlas is loading nodes, relationships, and layout metadata.</p></div></div>;

  return <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111a2c] shadow-2xl shadow-black/30"><div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-lg border border-white/10 bg-[#0b1220] p-1"><button type="button" onClick={() => setLegendFilter("all")} className={`rounded-md px-3 py-2 text-xs font-bold ${legendFilter === "all" ? "bg-white/[.1] text-white" : "text-[#8190ac] hover:text-white"}`}>All nodes</button><button type="button" onClick={() => setLegendFilter("recommended")} className={`rounded-md px-3 py-2 text-xs font-bold ${legendFilter === "recommended" ? "bg-[#a78bfa]/20 text-[#d8b4fe]" : "text-[#8190ac] hover:text-white"}`}>Recommended</button><button type="button" onClick={() => setLegendFilter("alternative")} className={`rounded-md px-3 py-2 text-xs font-bold ${legendFilter === "alternative" ? "bg-[#78a64a]/20 text-[#b9dc8d]" : "text-[#8190ac] hover:text-white"}`}>Alternatives</button></div><label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2"><Search className="h-3.5 w-3.5 text-[#c084fc]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a node…" className="w-32 bg-transparent text-xs text-white outline-none placeholder:text-[#66748f] sm:w-44" /></label></div><div className="flex items-center gap-1"><button type="button" onClick={() => setScale((value) => Math.max(0.3, value - 0.1))} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-[#aab6cd] hover:border-[#c084fc] hover:text-white" aria-label="Zoom out"><Minus className="h-4 w-4" /></button><span className="w-12 text-center text-xs font-bold text-[#8492ad]">{Math.round(scale * 100)}%</span><button type="button" onClick={() => setScale((value) => Math.min(1.5, value + 0.1))} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-[#aab6cd] hover:border-[#c084fc] hover:text-white" aria-label="Zoom in"><Plus className="h-4 w-4" /></button><button type="button" onClick={resetView} className="ml-1 grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-[#aab6cd] hover:border-[#c084fc] hover:text-white" aria-label="Reset map view"><RotateCcw className="h-4 w-4" /></button><button type="button" onClick={() => setScale(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-[#aab6cd] hover:border-[#c084fc] hover:text-white" aria-label="Fit map"><Maximize2 className="h-4 w-4" /></button></div></div><div className="border-b border-white/10 bg-[#0d1627] px-4 py-3 text-xs text-[#8290ac]">Drag to pan. Click any topic node to open its full content. Graph data mirrors the public roadmap layout; progress and recommendations are Atlas-owned.</div><div className={`relative h-[720px] overflow-hidden bg-[radial-gradient(circle_at_50%_15%,rgba(139,92,246,.12),transparent_55%)] ${dragging ? "cursor-grabbing" : "cursor-grab"}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}><div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "32px 32px" }} /><svg className="absolute inset-0 h-full w-full" viewBox={`${bounds.minX + offset.x} ${bounds.minY + offset.y} ${bounds.width / scale} ${bounds.height / scale}`} preserveAspectRatio="xMidYMid meet" style={{ transition: dragging ? "none" : "view-box 180ms cubic-bezier(.23,1,.32,1)" }} onPointerDown={(event) => event.stopPropagation()}>
      <g opacity="0.7">{renderEdges.map((edge, index) => { const source = nodeMap.get(edge.source || ""); const target = nodeMap.get(edge.target || ""); if (!source || !target) return null; const sp = nodePosition(source); const tp = nodePosition(target); const sx = sp.x + nodeWidth(source) / 2; const sy = sp.y + nodeHeight(source) / 2; const tx = tp.x + nodeWidth(target) / 2; const ty = tp.y + nodeHeight(target) / 2; const mx = (sx + tx) / 2; return <path key={edge.id || `${edge.source}-${edge.target}-${index}`} d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`} fill="none" stroke="#53617d" strokeWidth="1.8" strokeOpacity=".65" />; })}</g>
      {visibleNodes.map((node) => { const position = nodePosition(node); const width = nodeWidth(node); const height = nodeHeight(node); const key = legendKey(node); const color = LEGEND_COLORS[key]; const topicId = node.id; const topic = topicById.get(topicId) || topics.find((item) => item.title.toLowerCase() === (node.data?.label || "").toLowerCase()); const done = topic ? Boolean(progress[topic.id]) : false; return <g key={node.id} transform={`translate(${position.x}, ${position.y})`} onClick={() => topic && onTopicSelect(topic)} className={topic ? "cursor-pointer" : ""}><rect width={width} height={height} rx="10" fill={done ? "rgba(139,92,246,.25)" : "#172238"} stroke={color} strokeWidth={done ? "3" : "1.7"} /><rect width="4" height={height} rx="2" fill={color} opacity=".9" /><text x="16" y={height / 2 + 5} fill={done ? "#f0e9ff" : "#eef0f8"} fontSize="14" fontWeight="650">{(node.data?.label || "Untitled node").slice(0, 34)}{(node.data?.label || "").length > 34 ? "…" : ""}</text>{topic && <circle cx={width - 16} cy="16" r="4" fill={done ? "#c084fc" : "#64748b"} />}</g>; })}
    </svg></div><div className="flex flex-wrap items-center gap-4 border-t border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#8492ad]"><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#a78bfa]" /> Recommended</span><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#78a64a]" /> Alternative</span><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#929292]" /> Flexible order</span><span className="ml-auto">{visibleNodes.length.toLocaleString()} nodes · {renderEdges.length.toLocaleString()} relationships</span></div></section>;
}

function nodeFromPoint(nodes: GraphNode[], x: number, y: number) {
  return nodes.find((node) => { const point = nodePosition(node); return point.x === x && point.y === y; }) || nodes[0];
}
