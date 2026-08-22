import { useMemo, useState } from "react";
import { Check, ChevronRight, Circle, ExternalLink, X } from "lucide-react";

export type GeneratedRoadmapNode = {
  id: string;
  title: string;
  description: string;
  phase: string;
  type: "core" | "alternative" | "optional";
  explanation: string;
  practice: string;
  checkpoint: string;
  sourceTopicIds?: string[];
};

export type GeneratedRoadmapEdge = { source: string; target: string };

export type GeneratedRoadmap = {
  learnerFit?: string;
  title: string;
  description: string;
  nodes: GeneratedRoadmapNode[];
  edges: GeneratedRoadmapEdge[];
  assumptions?: string[];
};

type Props = {
  roadmap: GeneratedRoadmap;
  completedIds: string[];
  onToggleComplete: (nodeId: string, completed: boolean) => void;
};

const COLORS = {
  core: { fill: "#fff800", stroke: "#765f00", text: "#211b00" },
  alternative: { fill: "#ffe9a6", stroke: "#a97f1b", text: "#30250b" },
  optional: { fill: "#e9edf3", stroke: "#8c96a5", text: "#263140" },
};

function safeText(value: string, max = 72) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function CustomRoadmapGraph({
  roadmap,
  completedIds,
  onToggleComplete,
}: Props) {
  const [selected, setSelected] = useState<GeneratedRoadmapNode | null>(null);
  const completed = useMemo(() => new Set(completedIds), [completedIds]);
  const phases = useMemo(() => {
    const grouped = new Map<string, GeneratedRoadmapNode[]>();
    roadmap.nodes.forEach(node => {
      const phase = node.phase || "Next steps";
      grouped.set(phase, [...(grouped.get(phase) || []), node]);
    });
    return Array.from(grouped.entries());
  }, [roadmap.nodes]);
  const nodeById = useMemo(
    () => new Map(roadmap.nodes.map(node => [node.id, node])),
    [roadmap.nodes]
  );
  const width = Math.max(960, phases.length * 260 + 120);
  const height = Math.max(
    620,
    Math.max(...phases.map(([, nodes]) => nodes.length), 1) * 128 + 180
  );
  const positions = useMemo(() => {
    const result = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    phases.forEach(([, nodes], phaseIndex) => {
      const x = 50 + phaseIndex * 260;
      nodes.forEach((node: GeneratedRoadmapNode, nodeIndex: number) =>
        result.set(node.id, {
          x,
          y: 90 + nodeIndex * 128,
          width: 220,
          height: 70,
        })
      );
    });
    return result;
  }, [phases]);

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-[#d8dce3] bg-[#f8fafc] shadow-xl shadow-black/20">
        <div className="border-b border-[#e2e5ea] bg-white px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#7b8492]">
                Atlas AI roadmap
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-[#111827] sm:text-4xl">
                {roadmap.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6472]">
                {roadmap.description}
              </p>
            </div>
            <span className="rounded-lg border border-[#f3c957] bg-[#fff8cf] px-3 py-2 text-[11px] font-bold text-[#604c00]">
              AI-generated starting map
            </span>
          </div>
        </div>
        <div className="overflow-x-auto p-4 sm:p-6">
          <div className="min-w-[960px]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb]"
              role="img"
              aria-label={`${roadmap.title} generated learning roadmap`}
            >
              <defs>
                <pattern
                  id="atlas-dot-grid"
                  width="22"
                  height="22"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1.5" cy="1.5" r="1" fill="#dfe4eb" />
                </pattern>
              </defs>
              <rect width={width} height={height} fill="url(#atlas-dot-grid)" />
              {phases.map(([phase], phaseIndex) => (
                <g key={phase}>
                  <text
                    x={50 + phaseIndex * 260 + 110}
                    y="44"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill="#596579"
                  >
                    {safeText(phase, 30)}
                  </text>
                  <line
                    x1={50 + phaseIndex * 260 + 110}
                    y1="58"
                    x2={50 + phaseIndex * 260 + 110}
                    y2={height - 28}
                    stroke="#b9c2ce"
                    strokeDasharray="3 7"
                  />
                </g>
              ))}
              {roadmap.edges.map((edge, index) => {
                const source = positions.get(edge.source);
                const target = positions.get(edge.target);
                if (!source || !target) return null;
                const sx = source.x + source.width;
                const sy = source.y + source.height / 2;
                const tx = target.x;
                const ty = target.y + target.height / 2;
                const mx = (sx + tx) / 2;
                return (
                  <path
                    key={`${edge.source}-${edge.target}-${index}`}
                    d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`}
                    fill="none"
                    stroke="#91a1b7"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    markerEnd="url(#arrow)"
                  />
                );
              })}
              <defs>
                <marker
                  id="arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L7,3 z" fill="#91a1b7" />
                </marker>
              </defs>
              {roadmap.nodes.map(node => {
                const position = positions.get(node.id);
                if (!position) return null;
                const palette = COLORS[node.type] || COLORS.core;
                const done = completed.has(node.id);
                return (
                  <g
                    key={node.id}
                    transform={`translate(${position.x},${position.y})`}
                    onClick={() => setSelected(node)}
                    className="cursor-pointer"
                  >
                    <rect
                      width={position.width}
                      height={position.height}
                      rx="9"
                      fill={done ? "#d9ccff" : palette.fill}
                      stroke={done ? "#6d4aff" : palette.stroke}
                      strokeWidth={done ? "3" : "1.5"}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="9"
                      fill={done ? "#6d4aff" : palette.stroke}
                    />
                    <text
                      x="18"
                      y="22"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="800"
                      fill={done ? "#fff" : palette.text}
                    >
                      {done ? "✓" : ""}
                    </text>
                    <text
                      x="35"
                      y="27"
                      fontSize="13"
                      fontWeight="750"
                      fill={done ? "#241a52" : palette.text}
                    >
                      {safeText(node.title, 24)}
                    </text>
                    <text
                      x="16"
                      y="49"
                      fontSize="9.5"
                      fill={done ? "#4c4074" : palette.text}
                      opacity=".8"
                    >
                      {safeText(node.description, 34)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-[#e2e5ea] bg-white px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#737e8d]">
          <span className="inline-flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-[#fff800] ring-1 ring-[#765f00]" />{" "}
            Core
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-[#ffe9a6] ring-1 ring-[#a97f1b]" />{" "}
            Alternative
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-[#e9edf3] ring-1 ring-[#8c96a5]" />{" "}
            Optional
          </span>
          <span className="ml-auto">
            {roadmap.nodes.length} nodes · {roadmap.edges.length} relationships
          </span>
        </div>
      </section>
      {selected && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-black/45 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.title} topic`}
        >
          <aside className="h-full w-full max-w-[620px] overflow-y-auto bg-white p-5 text-[#18212e] shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#6d4aff]">
                  {selected.phase} · {selected.type}
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-.04em]">
                  {selected.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-[#5b6472]">
                  {selected.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d9dee7] text-[#667085] hover:border-[#6d4aff] hover:text-[#111827]"
                aria-label="Close topic"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e4e7ec] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#7b8492]">
                  Explanation
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                  {selected.explanation}
                </p>
              </div>
              <div className="rounded-xl border border-[#e4e7ec] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#7b8492]">
                  Practice
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                  {selected.practice}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-[#e4e7ec] bg-[#fffdf0] p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#7b8492]">
                Checkpoint
              </p>
              <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                {selected.checkpoint}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  onToggleComplete(selected.id, !completed.has(selected.id));
                  setSelected(null);
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold ${completed.has(selected.id) ? "bg-[#6d4aff] text-white" : "bg-[#111827] text-white hover:bg-[#2a3443]"}`}
              >
                {completed.has(selected.id) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}{" "}
                {completed.has(selected.id) ? "Done" : "Mark done"}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#d9dee7] px-4 py-3 text-sm font-bold text-[#4b5563] hover:border-[#6d4aff] hover:text-[#111827]"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-8 border-t border-[#e5e7eb] pt-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#7b8492]">
                More on this topic
              </p>
              <p className="mt-2 text-sm text-[#667085]">
                Use Atlas Tutor on the roadmap page to ask follow-up questions,
                or add a note after you practice this step.
              </p>
              <a
                href="https://github.com/nilbuild/developer-roadmap"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#5b3fe0] hover:underline"
              >
                View public roadmap source <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
