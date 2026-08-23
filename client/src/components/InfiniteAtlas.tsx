// Editorial Cartography / Map of Reddit-informed atlas: a camera into a large real-data world with visual visit history and file-explorer navigation.
// Size always represents official hierarchy depth or recorded O*NET coverage; selection, route and labels remain stable across zoom extremes.
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  ChevronLeft,
  Crosshair,
  ExternalLink,
  LocateFixed,
  PanelRight,
  RotateCcw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type SourceRef = {
  id: string;
  publisher: string;
  vintage: string;
  url: string;
};
type Taxonomy = {
  id: string;
  code: string;
  title: string;
  level: number;
  taxonomy: string;
  source: SourceRef;
};
type Occupation = {
  id: string;
  soc: string;
  title: string;
  description: string;
  metrics: {
    taskCount: number;
    skillCount: number;
    workActivityCount: number;
    softwareCount: number;
    alternateTitleCount: number;
  };
  tasks: { id: string; text: string; type: string; date: string }[];
  skills: { name: string; importance: number | null; date: string }[];
  workActivities: string[];
  software: string[];
  alternateTitles: string[];
  laborMarket?: {
    employment: number | null;
    medianAnnualWage: number | null;
    meanAnnualWage: number | null;
    locationQuotient: number | null;
    source: SourceRef;
  } | null;
  source: SourceRef;
};
type Release = {
  manifest: unknown;
  taxonomies: Taxonomy[];
  occupations: Occupation[];
};
type Layer = "industries" | "occupations" | "skills" | "tasks";
type NodeKind = "industry" | "occupation" | "skill" | "task";
type Camera = { x: number; y: number; k: number };
type AtlasNode = {
  key: string;
  kind: NodeKind;
  label: string;
  code?: string;
  taxonomy?: string;
  x: number;
  y: number;
  depth: number;
  radius: number;
  labelBase: number;
  color: string;
  source?: SourceRef;
  description?: string;
  occupationId?: string;
  importance?: number | null;
  parentCode?: string;
  measureLabel: string;
};
type RouteStep = {
  node: AtlasNode;
  layer: Layer;
  focusCode: string | null;
  selectedOccupationId: string | null;
  camera: Camera;
};

const WORLD_W = 30000;
const WORLD_H = 18000;
const WORLD_CX = WORLD_W / 2;
const WORLD_CY = WORLD_H / 2;
const MIN_ZOOM = 0.08;
const MAX_ZOOM = 9;
const colors: Record<NodeKind, string> = {
  industry: "#0f766e",
  occupation: "#397f77",
  skill: "#ba7a48",
  task: "#b95c78",
};
const ACTIVE_COLOR = "#b64362";
const VISITED_COLOR = "#b7813d";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const short = (text: string, length = 32) =>
  text.length > length ? `${text.slice(0, Math.max(1, length - 1))}…` : text;
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const integer = (value?: number | null) =>
  value == null ? "—" : Math.round(value).toLocaleString();
const money = (value?: number | null) =>
  value == null ? "Not available" : `$${Math.round(value).toLocaleString()}`;
const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1)
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
};
const point = (value: string, radius: number, drift = 0) => {
  const seed = hash(value);
  const angle = ((seed % 3600) / 3600) * Math.PI * 2 + drift;
  const distance = radius * (0.2 + ((seed >>> 8) % 1000) / 1000);
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance * 0.68,
  };
};
const layerName = (layer: Layer) =>
  layer === "industries"
    ? "Industry world"
    : layer === "occupations"
      ? "Occupation world"
      : layer === "skills"
        ? "Skill neighborhood"
        : "Task neighborhood";
const layerShortName = (layer: Layer) =>
  layer === "industries"
    ? "Industry fields"
    : layer === "occupations"
      ? "Role fields"
      : layer === "skills"
        ? "Evidence skills"
        : "Work tasks";

function positionForOccupation(occupation: Occupation): {
  x: number;
  y: number;
} {
  const group =
    normalize(
      occupation.skills
        .slice(0, 2)
        .map(item => item.name)
        .join(" ")
    ) || "unclassified";
  const center = point(`occupation-cluster:${group}`, 6200, 0.4);
  const jitter = point(
    `occupation:${occupation.id}`,
    Math.min(
      1850,
      240 +
        occupation.metrics.skillCount * 36 +
        Math.sqrt(occupation.metrics.taskCount || 0) * 48
    ),
    1.8
  );
  return { x: WORLD_CX + center.x, y: WORLD_CY + center.y };
}

function industryPosition(
  item: Taxonomy,
  data: Release,
  focusCode: string | null
): { x: number; y: number } {
  if (focusCode && item.code !== focusCode && item.code.startsWith(focusCode)) {
    const parent = data.taxonomies.find(
      candidate =>
        candidate.taxonomy === item.taxonomy && candidate.code === focusCode
    );
    const parentPoint = parent
      ? industryPosition(parent, data, null)
      : { x: WORLD_CX, y: WORLD_CY };
    const depthDelta = Math.max(
      1,
      item.level - (parent?.level ?? item.level - 1)
    );
    const branch = point(
      `branch:${item.taxonomy}:${item.code}`,
      500 + depthDelta * 280,
      item.level * 0.6
    );
    return { x: parentPoint.x + branch.x, y: parentPoint.y + branch.y };
  }
  const sectorCode = item.code.length <= 2 ? item.code : item.code.slice(0, 2);
  const cluster = point(
    `industry-sector:${item.taxonomy}:${sectorCode}`,
    4200,
    item.level * 0.35
  );
  const jitter = point(
    `industry:${item.taxonomy}:${item.code}`,
    item.level <= 2 ? 520 : 1040 + item.level * 190,
    item.level
  );
  return {
    x: WORLD_CX + cluster.x + jitter.x,
    y: WORLD_CY + cluster.y + jitter.y,
  };
}

function makeTaxonomyNode(
  item: Taxonomy,
  data: Release,
  focusCode: string | null
): AtlasNode {
  const position = industryPosition(item, data, focusCode);
  const structuralRadius =
    item.level <= 2
      ? 13
      : item.level === 3
        ? 9
        : item.level === 4
          ? 6.5
          : item.level === 5
            ? 4.5
            : 3.2;
  const labelBase =
    item.level <= 2
      ? 13
      : item.level === 3
        ? 11.5
        : item.level === 4
          ? 10.5
          : 9.5;
  return {
    key: `${item.id}:industry`,
    kind: "industry",
    label: item.title,
    code: item.code,
    taxonomy: item.taxonomy,
    x: position.x,
    y: position.y,
    depth: item.level,
    radius: structuralRadius,
    labelBase,
    color: colors.industry,
    source: item.source,
    parentCode: item.code.slice(0, Math.max(2, item.code.length - 1)),
    measureLabel: `official level ${item.level}`,
  };
}

function makeOccupationNode(item: Occupation): AtlasNode {
  const position = positionForOccupation(item);
  const coverage =
    Math.sqrt(item.metrics.taskCount || 0) +
    (item.metrics.skillCount || 0) * 0.7 +
    (item.metrics.workActivityCount || 0) * 0.12;
  return {
    key: `${item.id}:occupation`,
    kind: "occupation",
    label: item.title,
    code: item.id,
    x: position.x,
    y: position.y,
    depth: 2,
    radius: clamp(5.5 + coverage * 0.6, 7, 19),
    labelBase: clamp(11 + coverage * 0.24, 12, 17),
    color: colors.occupation,
    source: item.source,
    description: item.description,
    occupationId: item.id,
    measureLabel: `${item.metrics.skillCount} skills · ${item.metrics.taskCount} tasks`,
  };
}

function makeSkillNode(
  item: { name: string; importance: number | null },
  occupation: Occupation
): AtlasNode {
  const center = positionForOccupation(occupation);
  const offset = point(`skill:${occupation.id}:${item.name}`, 620, 0.3);
  const importance = item.importance ?? 0;
  return {
    key: `${occupation.id}:skill:${item.name}`,
    kind: "skill",
    label: item.name,
    x: center.x + offset.x,
    y: center.y + offset.y,
    depth: 3,
    radius: 8 + Math.min(10, importance * 1.8),
    labelBase: 13 + Math.min(3, importance * 0.35),
    color: colors.skill,
    source: occupation.source,
    occupationId: occupation.id,
    importance,
    measureLabel: importance
      ? `recorded importance ${importance.toFixed(1)}`
      : "recorded essential skill",
  };
}

function makeTaskNode(
  item: { id: string; text: string },
  occupation: Occupation
): AtlasNode {
  const center = positionForOccupation(occupation);
  const offset = point(`task:${occupation.id}:${item.id}`, 820, 0.2);
  return {
    key: `${occupation.id}:task:${item.id}`,
    kind: "task",
    label: item.text,
    code: item.id,
    x: center.x + offset.x,
    y: center.y + offset.y,
    depth: 4,
    radius: 7.5,
    labelBase: 11.5,
    color: colors.task,
    source: occupation.source,
    occupationId: occupation.id,
    measureLabel: "official task statement",
  };
}

function resolveNode(
  data: Release,
  key: string,
  focusCode: string | null
): AtlasNode | null {
  const taxonomy = data.taxonomies.find(item => `${item.id}:industry` === key);
  if (taxonomy) return makeTaxonomyNode(taxonomy, data, focusCode);
  const occupation = data.occupations.find(
    item => `${item.id}:occupation` === key
  );
  if (occupation) return makeOccupationNode(occupation);
  for (const candidate of data.occupations) {
    const skill = candidate.skills.find(
      item => `${candidate.id}:skill:${item.name}` === key
    );
    if (skill) return makeSkillNode(skill, candidate);
    const task = candidate.tasks.find(
      item => `${candidate.id}:task:${item.id}` === key
    );
    if (task) return makeTaskNode(task, candidate);
  }
  return null;
}

function Inspector({
  node,
  occupation,
  onClose,
  onDescend,
  onBack,
  visitedCount,
}: {
  node: AtlasNode;
  occupation?: Occupation;
  onClose: () => void;
  onDescend: () => void;
  onBack: () => void;
  visitedCount: number;
}) {
  return (
    <aside
      data-atlas-overlay
      className="absolute bottom-4 right-4 top-4 z-40 flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#d8d6cd] bg-[#fffefb]/96 shadow-[0_24px_70px_rgba(36,40,34,.18)] backdrop-blur-xl select-text"
    >
      <div className="flex items-center justify-between border-b border-[#e4e2da] px-5 py-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#777970]">
          Record inspector
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-[#777970] hover:bg-[#f0efe9]"
          aria-label="Close inspector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto overscroll-contain p-5">
        <div className="flex items-center justify-between gap-3">
          <div
            className="font-mono text-[9px] uppercase tracking-[0.16em]"
            style={{ color: node.color }}
          >
            {node.kind}
            {node.code ? ` · ${node.code}` : ""}
          </div>
          <div className="rounded-full bg-[#f0ece5] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.13em] text-[#777970]">
            {visitedCount} explored
          </div>
        </div>
        <h2 className="mt-4 font-display text-4xl leading-[0.94] text-[#242822]">
          {node.label}
        </h2>
        {node.description && (
          <p className="mt-4 text-sm leading-6 text-[#62645d]">
            {node.description}
          </p>
        )}
        <div className="mt-6 border-y border-[#e4e2da] py-5">
          <p className="text-xs leading-5 text-[#666961]">
            {node.kind === "industry"
              ? "Official classification record. Its visual size reflects formal classification depth, never a popularity score."
              : node.kind === "occupation"
                ? "Official O*NET occupation profile. Its visual size reflects recorded task, skill, and work-activity coverage."
                : node.kind === "skill"
                  ? "Essential skill recorded for the selected occupation. Continue to the occupation’s attached task statements."
                  : "Official O*NET task statement attached to the selected occupation."}
          </p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a8b83]">
            Map measure · {node.measureLabel}
          </p>
        </div>
        {node.kind === "occupation" && occupation && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <div className="font-mono text-[9px] uppercase text-[#777970]">
                Tasks
              </div>
              <div className="mt-1 font-display text-2xl">
                {integer(occupation.metrics.taskCount)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase text-[#777970]">
                Median wage
              </div>
              <div className="mt-1 font-display text-2xl">
                {money(occupation.laborMarket?.medianAnnualWage)}
              </div>
            </div>
          </div>
        )}
        {node.kind !== "task" && (
          <button
            onClick={onDescend}
            className="mt-6 flex w-full items-center justify-between rounded-xl border border-[#d8d6cd] bg-[#f5f1e7] px-4 py-3 text-left text-sm font-semibold text-[#353831] hover:border-[#0f766e]"
          >
            Open the next real layer <span aria-hidden>→</span>
          </button>
        )}
        <button
          onClick={onBack}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-xs text-[#777970] hover:bg-[#f0efe9]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back through my exploration route
        </button>
        {node.source && (
          <a
            href={node.source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-7 flex items-center gap-2 border-t border-[#e4e2da] pt-5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#2f837e]"
          >
            {node.source.publisher} · {node.source.vintage}
            <ExternalLink className="ml-auto h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </aside>
  );
}

export default function InfiniteAtlas({
  data,
  onOpenRoadmap,
}: {
  data: Release;
  onOpenRoadmap?: (context: {
    occupationId?: string | null;
    seed?: string;
    recordLabel?: string;
    recordSource?: SourceRef;
    kind?: NodeKind;
  }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoredHash = useRef(false);
  const cameraRef = useRef<Camera>({ x: WORLD_CX, y: WORLD_CY, k: 0.22 });
  const queuedCameraRef = useRef<Camera | null>(null);
  const cameraFrameRef = useRef<number | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    distance: number;
    midpoint: { x: number; y: number };
    camera: Camera;
  } | null>(null);
  const dragRef = useRef<{
    pointer: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(
    null
  );
  const [size, setSize] = useState({ width: 1200, height: 760 });
  const [camera, setCamera] = useState<Camera>({
    x: WORLD_CX,
    y: WORLD_CY,
    k: 0.22,
  });
  const [layer, setLayer] = useState<Layer>("industries");
  const [focusCode, setFocusCode] = useState<string | null>(null);
  const [selectedOccupationId, setSelectedOccupationId] = useState<
    string | null
  >(null);
  const [selected, setSelected] = useState<AtlasNode | null>(null);
  const [visitedKeys, setVisitedKeys] = useState<string[]>([]);
  const [trail, setTrail] = useState<RouteStep[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [drag, setDrag] = useState<{
    pointer: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [lassoMode, setLassoMode] = useState(false);
  const [lasso, setLasso] = useState<{
    pointer: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const queueCamera = (next: Camera) => {
    cameraRef.current = next;
    queuedCameraRef.current = next;
    if (cameraFrameRef.current !== null) return;
    cameraFrameRef.current = window.requestAnimationFrame(() => {
      cameraFrameRef.current = null;
      const queued = queuedCameraRef.current;
      if (queued) setCamera(queued);
    });
  };
  const commitCamera = () => setCamera(cameraRef.current);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);
  useEffect(
    () => () => {
      if (cameraFrameRef.current !== null)
        window.cancelAnimationFrame(cameraFrameRef.current);
    },
    []
  );

  const currentOccupation = data.occupations.find(
    item => item.id === selectedOccupationId
  );
  const visited = useMemo(() => new Set(visitedKeys), [visitedKeys]);
  const pinned = useMemo(() => new Set(pinnedKeys), [pinnedKeys]);
  const nodes = useMemo<AtlasNode[]>(() => {
    if (layer === "industries")
      return data.taxonomies.map(item =>
        makeTaxonomyNode(item, data, focusCode)
      );
    if (layer === "occupations")
      return data.occupations.map(makeOccupationNode);
    if (!currentOccupation) return [];
    return layer === "skills"
      ? currentOccupation.skills.map(item =>
          makeSkillNode(item, currentOccupation)
        )
      : currentOccupation.tasks.map(item =>
          makeTaskNode(item, currentOccupation)
        );
  }, [currentOccupation, data, focusCode, layer]);
  const searchResults = useMemo<AtlasNode[]>(() => {
    const needle = normalize(query);
    if (!needle) return [];
    const results: AtlasNode[] = [];
    data.taxonomies.forEach(item => {
      if (
        results.length < 9 &&
        normalize(`${item.code} ${item.title}`).includes(needle)
      )
        results.push(makeTaxonomyNode(item, data, focusCode));
    });
    data.occupations.forEach(item => {
      if (
        results.length < 16 &&
        normalize(
          `${item.id} ${item.title} ${item.alternateTitles.join(" ")}`
        ).includes(needle)
      )
        results.push(makeOccupationNode(item));
    });
    data.occupations.some(occupation => {
      const skill = occupation.skills.find(item =>
        normalize(item.name).includes(needle)
      );
      if (skill && results.length < 20) {
        results.push(makeSkillNode(skill, occupation));
        return false;
      }
      return false;
    });
    data.occupations.some(occupation => {
      const task = occupation.tasks.find(item =>
        normalize(item.text).includes(needle)
      );
      if (task && results.length < 24) {
        results.push(makeTaskNode(task, occupation));
        return false;
      }
      return false;
    });
    return results;
  }, [data, focusCode, query]);

  useEffect(() => {
    if (!surfaceRef.current) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect)
        setSize({
          width: Math.max(320, rect.width),
          height: Math.max(560, rect.height),
        });
    });
    observer.observe(surfaceRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (restoredHash.current) return;
    restoredHash.current = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const x = Number.parseFloat(params.get("x") ?? "");
    const y = Number.parseFloat(params.get("y") ?? "");
    const k = Number.parseFloat(params.get("k") ?? "");
    const nextLayer = params.get("l");
    const nextFocus = params.get("f");
    const selectedKey = params.get("n");
    const safeLayer: Layer =
      nextLayer === "occupations" ||
      nextLayer === "skills" ||
      nextLayer === "tasks"
        ? nextLayer
        : "industries";
    const restoredCamera =
      Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(k)
        ? { x, y, k: clamp(k, MIN_ZOOM, MAX_ZOOM) }
        : null;
    setLayer(safeLayer);
    setFocusCode(nextFocus || null);
    if (restoredCamera) setCamera(restoredCamera);
    if (selectedKey) {
      const node = resolveNode(data, selectedKey, nextFocus || null);
      if (node) {
        const occupationId =
          node.occupationId ??
          (node.kind === "occupation" ? (node.code ?? null) : null);
        setSelected(node);
        setSelectedOccupationId(occupationId);
        setVisitedKeys([node.key]);
        setTrail([
          {
            node,
            layer: safeLayer,
            focusCode: nextFocus || null,
            selectedOccupationId: occupationId,
            camera: restoredCamera ?? camera,
          },
        ]);
      }
    }
  }, [camera, data]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("x", camera.x.toFixed(1));
      params.set("y", camera.y.toFixed(1));
      params.set("k", camera.k.toFixed(3));
      params.set("l", layer);
      if (focusCode) params.set("f", focusCode);
      if (selected) params.set("n", selected.key);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${params.toString()}`
      );
    }, 320);
    return () => window.clearTimeout(timeout);
  }, [camera, focusCode, layer, selected]);

  const screenPoint = (node: AtlasNode) => ({
    x: (node.x - camera.x) * camera.k + size.width / 2,
    y: (node.y - camera.y) * camera.k + size.height / 2,
  });
  const revealDepth =
    camera.k < 0.31
      ? 2
      : camera.k < 0.56
        ? 3
        : camera.k < 1.02
          ? 4
          : camera.k < 1.8
            ? 5
            : 6;
  const nodeVisible = (node: AtlasNode) => {
    if (
      selected?.key === node.key ||
      visited.has(node.key) ||
      pinned.has(node.key)
    )
      return true;
    if (layer !== "industries") return true;
    if (focusCode) {
      const depthLimit = Math.max(
        revealDepth,
        (selected?.depth ?? revealDepth) + 1
      );
      return (
        node.code === focusCode ||
        Boolean(node.code?.startsWith(focusCode) && node.depth <= depthLimit)
      );
    }
    return node.taxonomy === "NAICS 2022"
      ? node.depth <= revealDepth
      : camera.k >= 2.6 && node.depth <= revealDepth;
  };
  const labelVisible = (node: AtlasNode) => {
    if (selected?.key === node.key || hoveredKey === node.key) return true;
    if (layer === "industries")
      return focusCode && node.code?.startsWith(focusCode)
        ? node.depth <=
            Math.max(revealDepth, (selected?.depth ?? revealDepth) + 1)
        : node.depth <= revealDepth;
    return layer === "occupations" ? camera.k >= 0.42 : camera.k >= 0.64;
  };
  const visualRadius = (node: AtlasNode) =>
    clamp(node.radius * Math.pow(camera.k / 0.18, 0.4), 1.7, 38);
  const visualLabelSize = (node: AtlasNode) =>
    clamp(node.labelBase * Math.pow(camera.k / 0.18, 0.17), 9.5, 23);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    context.fillStyle = "#fbfaf8";
    context.fillRect(0, 0, size.width, size.height);
    const grid = clamp(66 * camera.k, 28, 140);
    context.strokeStyle = "rgba(110,105,93,.07)";
    context.lineWidth = 1;
    const offsetX =
      (((-camera.x * camera.k + size.width / 2) % grid) + grid) % grid;
    const offsetY =
      (((-camera.y * camera.k + size.height / 2) % grid) + grid) % grid;
    for (let x = offsetX; x < size.width; x += grid) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, size.height);
      context.stroke();
    }
    for (let y = offsetY; y < size.height; y += grid) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(size.width, y);
      context.stroke();
    }
    if (layer === "industries" && !focusCode) {
      const anchors = nodes
        .filter(node => node.taxonomy === "NAICS 2022" && node.depth <= 2)
        .filter(nodeVisible);
      anchors.forEach(node => {
        const screen = screenPoint(node);
        if (
          screen.x < -100 ||
          screen.x > size.width + 100 ||
          screen.y < -100 ||
          screen.y > size.height + 100
        )
          return;
        const contour = clamp(visualRadius(node) * 2.8, 23, 48);
        context.beginPath();
        context.ellipse(
          screen.x,
          screen.y,
          contour,
          contour * 0.62,
          -0.4,
          0,
          Math.PI * 2
        );
        context.strokeStyle = "rgba(15,118,110,.16)";
        context.lineWidth = 1;
        context.setLineDash([2, 7]);
        context.stroke();
        context.setLineDash([]);
        const towardCenter = screen.x < size.width / 2 ? 1 : -1;
        const stubX = screen.x + towardCenter * (contour + 34);
        const stubY = screen.y - 13;
        context.beginPath();
        context.moveTo(screen.x + towardCenter * contour, screen.y);
        context.lineTo(stubX, stubY);
        context.strokeStyle = "rgba(15,118,110,.38)";
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = "#ba7a48";
        context.fillRect(stubX - 2, stubY - 2, 4, 4);
      });
      if (size.width >= 760) {
        const unresolvedX = size.width - 270;
        const unresolvedY = size.height - 114;
        context.fillStyle = "rgba(255,241,239,.88)";
        context.fillRect(unresolvedX, unresolvedY, 242, 48);
        context.strokeStyle = "rgba(185,92,120,.52)";
        context.strokeRect(unresolvedX, unresolvedY, 242, 48);
        context.fillStyle = "#b95c78";
        context.fillRect(unresolvedX + 12, unresolvedY + 13, 6, 6);
        context.font = '8px "IBM Plex Mono", monospace';
        context.fillText("UNRESOLVED EDGE", unresolvedX + 28, unresolvedY + 19);
        context.font = '10px "IBM Plex Sans", sans-serif';
        context.fillStyle = "#7c4b42";
        context.fillText(
          "No official industry → occupation crosswalk",
          unresolvedX + 12,
          unresolvedY + 37
        );
      }
      if (size.width >= 620) {
        const keyX = Math.max(18, size.width - 244);
        const keyY = 146;
        context.fillStyle = "rgba(255,254,251,.9)";
        context.fillRect(keyX, keyY, 226, 92);
        context.strokeStyle = "rgba(183,179,165,.72)";
        context.strokeRect(keyX, keyY, 226, 92);
        context.fillStyle = "#242822";
        context.font = '18px "DM Serif Display", Georgia, serif';
        context.fillText("Map key", keyX + 14, keyY + 26);
        [
          ["#0f766e", "official classification field"],
          ["#ba7a48", "visited or pinned record"],
          ["#b95c78", "active record and next action"],
        ].forEach(([color, label], index) => {
          const y = keyY + 47 + index * 14;
          context.fillStyle = color;
          context.fillRect(keyX + 14, y - 7, 6, 6);
          context.fillStyle = "#6e7069";
          context.font = '9px "IBM Plex Mono", monospace';
          context.fillText(label, keyX + 28, y);
        });
      }
    }
    if (layer === "industries" && focusCode && selected) {
      const parent = screenPoint(selected);
      context.strokeStyle = "rgba(15,118,110,.32)";
      context.lineWidth = clamp(1.6 / Math.sqrt(camera.k), 0.5, 1.6);
      nodes
        .filter(
          node =>
            node.code?.startsWith(focusCode) &&
            node.code !== focusCode &&
            node.depth <= selected.depth + 1 &&
            nodeVisible(node)
        )
        .slice(0, 180)
        .forEach(node => {
          const child = screenPoint(node);
          context.beginPath();
          context.moveTo(parent.x, parent.y);
          context.lineTo(child.x, child.y);
          context.stroke();
        });
    }
    if ((layer === "skills" || layer === "tasks") && currentOccupation) {
      const center = screenPoint(makeOccupationNode(currentOccupation));
      context.strokeStyle = "rgba(47,131,126,.17)";
      context.lineWidth = clamp(1.4 / Math.sqrt(camera.k), 0.45, 1.4);
      nodes.forEach(node => {
        const child = screenPoint(node);
        context.beginPath();
        context.moveTo(center.x, center.y);
        context.lineTo(child.x, child.y);
        context.stroke();
      });
    }
    nodes
      .filter(node => pinned.has(node.key))
      .forEach(node => {
        const screen = screenPoint(node);
        const radius = visualRadius(node) + 5;
        context.beginPath();
        context.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        context.strokeStyle = "#ba7a48";
        context.lineWidth = 2;
        context.setLineDash([3, 3]);
        context.stroke();
        context.setLineDash([]);
      });
    const labelBoxes: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];
    const labelPriority = (node: AtlasNode) =>
      selected?.key === node.key
        ? 6
        : hoveredKey === node.key
          ? 5
          : pinned.has(node.key)
            ? 4
            : visited.has(node.key)
              ? 3
              : 2;
    const candidates = nodes
      .filter(nodeVisible)
      .sort(
        (a, b) =>
          labelPriority(b) - labelPriority(a) ||
          a.depth - b.depth ||
          b.radius - a.radius
      );
    candidates.forEach(node => {
      const screen = screenPoint(node);
      if (
        screen.x < -80 ||
        screen.x > size.width + 80 ||
        screen.y < -80 ||
        screen.y > size.height + 80
      )
        return;
      const active = selected?.key === node.key;
      const wasVisited = !active && visited.has(node.key);
      const hovered = hoveredKey === node.key;
      const radius = visualRadius(node);
      const color = active
        ? ACTIVE_COLOR
        : wasVisited
          ? VISITED_COLOR
          : node.color;
      context.beginPath();
      context.arc(
        screen.x,
        screen.y,
        active ? radius + 4 : hovered ? radius + 2 : radius,
        0,
        Math.PI * 2
      );
      context.fillStyle = `${color}${active ? "f5" : wasVisited ? "de" : "b8"}`;
      context.fill();
      if (active || hovered) {
        context.strokeStyle = active ? "#242822" : color;
        context.lineWidth = active ? 2.2 : 1.2;
        context.stroke();
      }
      if (!labelVisible(node)) return;
      const labelSize = visualLabelSize(node);
      const label = short(
        node.label,
        camera.k > 2.8 ? 64 : camera.k > 1.15 ? 42 : camera.k > 0.46 ? 30 : 22
      );
      context.font = `${active ? 700 : wasVisited ? 650 : 500} ${labelSize}px "IBM Plex Sans", sans-serif`;
      const width = context.measureText(label).width + 12;
      const height = labelSize + 8;
      const candidatePositions = [
        { left: screen.x - width / 2, top: screen.y + radius + 7 },
        { left: screen.x - width / 2, top: screen.y - radius - height - 7 },
        { left: screen.x + radius + 8, top: screen.y - height / 2 },
        { left: screen.x - radius - width - 8, top: screen.y - height / 2 },
      ];
      const placement = candidatePositions.find(
        ({ left, top }) =>
          left >= -8 &&
          top >= 54 &&
          left + width <= size.width + 8 &&
          top + height <= size.height + 8 &&
          !labelBoxes.some(
            box =>
              left < box.x + box.width &&
              left + width > box.x &&
              top < box.y + box.height &&
              top + height > box.y
          )
      );
      if (!placement) return;
      labelBoxes.push({ x: placement.left, y: placement.top, width, height });
      context.fillStyle = active
        ? "rgba(255,247,244,.98)"
        : wasVisited
          ? "rgba(253,246,249,.94)"
          : "rgba(251,250,248,.9)";
      context.fillRect(placement.left, placement.top, width, height);
      context.fillStyle = color;
      context.fillText(label, placement.left + 6, placement.top + labelSize);
    });
  }, [
    camera,
    currentOccupation,
    focusCode,
    hoveredKey,
    labelVisible,
    layer,
    nodes,
    pinned,
    selected,
    size,
    visited,
  ]);

  const zoomAt = (
    clientX: number,
    clientY: number,
    factor: number,
    immediate = false
  ) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const current = cameraRef.current;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const worldX = current.x + (px - size.width / 2) / current.k;
    const worldY = current.y + (py - size.height / 2) / current.k;
    const nextK = clamp(current.k * factor, MIN_ZOOM, MAX_ZOOM);
    const next = {
      x: worldX - (px - size.width / 2) / nextK,
      y: worldY - (py - size.height / 2) / nextK,
      k: nextK,
    };
    if (immediate) {
      cameraRef.current = next;
      setCamera(next);
    } else queueCamera(next);
  };
  const hitNode = (clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    return (
      nodes
        .filter(nodeVisible)
        .map(node => ({ node, screen: screenPoint(node) }))
        .filter(
          ({ node, screen }) =>
            Math.hypot(screen.x - px, screen.y - py) <=
            Math.max(15, visualRadius(node) + 8)
        )
        .sort(
          (a, b) =>
            Math.hypot(a.screen.x - px, a.screen.y - py) -
            Math.hypot(b.screen.x - px, b.screen.y - py)
        )[0]?.node ?? null
    );
  };
  const pushRoute = (
    node: AtlasNode,
    nextLayer: Layer,
    nextFocusCode: string | null,
    nextOccupationId: string | null,
    nextCamera: Camera
  ) => {
    setVisitedKeys(value =>
      value.includes(node.key) ? value : [...value, node.key]
    );
    setTrail(value => {
      const step = {
        node,
        layer: nextLayer,
        focusCode: nextFocusCode,
        selectedOccupationId: nextOccupationId,
        camera: nextCamera,
      };
      const last = value[value.length - 1];
      return last?.node.key === node.key
        ? [...value.slice(0, -1), step]
        : [...value, step].slice(-24);
    });
  };
  const selectNode = (node: AtlasNode) => {
    setSelected(node);
    setDrawer(false);
    setHoveredKey(node.key);
    pushRoute(node, layer, focusCode, selectedOccupationId, camera);
  };
  const activate = (node: AtlasNode) => {
    setQuery("");
    setShowResults(false);
    if (node.kind === "industry") {
      const nextCamera = {
        x: node.x,
        y: node.y,
        k: clamp(Math.max(camera.k * 1.55, 0.88), MIN_ZOOM, 3.1),
      };
      setSelected(node);
      setLayer("industries");
      setFocusCode(node.code ?? null);
      setCamera(nextCamera);
      pushRoute(node, "industries", node.code ?? null, null, nextCamera);
    } else if (node.kind === "occupation") {
      const occupationId = node.occupationId ?? node.code ?? null;
      const nextCamera = { x: node.x, y: node.y, k: Math.max(1.15, camera.k) };
      setSelected(node);
      setLayer("skills");
      setFocusCode(null);
      setSelectedOccupationId(occupationId);
      setCamera(nextCamera);
      pushRoute(node, "skills", null, occupationId, nextCamera);
    } else if (node.kind === "skill") {
      const occupationId = node.occupationId ?? selectedOccupationId;
      const nextCamera = { x: node.x, y: node.y, k: Math.max(1.35, camera.k) };
      setSelected(node);
      setLayer("tasks");
      setCamera(nextCamera);
      pushRoute(node, "tasks", null, occupationId, nextCamera);
    } else {
      const nextCamera = { x: node.x, y: node.y, k: Math.max(1.55, camera.k) };
      setSelected(node);
      setLayer("tasks");
      setCamera(nextCamera);
      pushRoute(
        node,
        "tasks",
        null,
        node.occupationId ?? selectedOccupationId,
        nextCamera
      );
    }
    setDrawer(false);
  };
  const viewAll = () => {
    setLayer("industries");
    setFocusCode(null);
    setSelectedOccupationId(null);
    setSelected(null);
    setDrawer(false);
    setCamera({ x: WORLD_CX, y: WORLD_CY, k: 0.22 });
  };
  const restoreStep = (step: RouteStep, length?: number) => {
    setLayer(step.layer);
    setFocusCode(step.focusCode);
    setSelectedOccupationId(step.selectedOccupationId);
    setSelected(resolveNode(data, step.node.key, step.focusCode) ?? step.node);
    setCamera(step.camera);
    setDrawer(false);
    if (length !== undefined) setTrail(value => value.slice(0, length));
  };
  const backRoute = () => {
    if (trail.length < 2) {
      viewAll();
      return;
    }
    const previousIndex = trail.length - 2;
    restoreStep(trail[previousIndex], previousIndex + 1);
  };
  const switchLayer = (nextLayer: Layer) => {
    if (nextLayer === "industries") {
      viewAll();
      return;
    }
    if (nextLayer === "occupations") {
      setLayer("occupations");
      setFocusCode(null);
      setSelectedOccupationId(null);
      setSelected(null);
      setDrawer(false);
      setCamera({ x: WORLD_CX, y: WORLD_CY, k: 0.34 });
      return;
    }
    if (currentOccupation) {
      const occupationNode = makeOccupationNode(currentOccupation);
      setLayer(nextLayer);
      setSelected(occupationNode);
      setCamera({ x: occupationNode.x, y: occupationNode.y, k: 1.18 });
      pushRoute(occupationNode, nextLayer, null, currentOccupation.id, {
        x: occupationNode.x,
        y: occupationNode.y,
        k: 1.18,
      });
    }
  };
  const isOverlayTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(
      target.closest(
        "button, input, a, aside, nav, [data-atlas-overlay], .z-30, .z-35, .z-40"
      )
    );
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (isOverlayTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    zoomAt(event.clientX, event.clientY, event.deltaY > 0 ? 0.88 : 1.15);
  };
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      isOverlayTarget(event.target) ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable for synthetic or platform-owned touch events.
    }
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (lassoMode && pointersRef.current.size === 1) {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      setLasso({
        pointer: event.pointerId,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        width: 0,
        height: 0,
      });
      return;
    }
    if (pointersRef.current.size === 1) {
      const nextDrag = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
      dragRef.current = nextDrag;
      setDrag(nextDrag);
    } else if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        distance: Math.max(
          1,
          Math.hypot(second.x - first.x, second.y - first.y)
        ),
        midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        camera: cameraRef.current,
      };
      dragRef.current = null;
      setDrag(null);
    }
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const previous = pointersRef.current.get(event.pointerId);
    if (!previous) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (lasso) {
      if (lasso.pointer !== event.pointerId) return;
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      setLasso(value =>
        value
          ? {
              ...value,
              width: event.clientX - rect.left - value.x,
              height: event.clientY - rect.top - value.y,
            }
          : value
      );
      return;
    }
    if (pointersRef.current.size >= 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const pinch = pinchRef.current;
      if (!pinch) return;
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      const distance = Math.max(
        1,
        Math.hypot(second.x - first.x, second.y - first.y)
      );
      const midpoint = {
        x: (first.x + second.x) / 2 - rect.left,
        y: (first.y + second.y) / 2 - rect.top,
      };
      const startMidpoint = {
        x: pinch.midpoint.x - rect.left,
        y: pinch.midpoint.y - rect.top,
      };
      const startCamera = pinch.camera;
      const nextK = clamp(
        startCamera.k * (distance / pinch.distance),
        MIN_ZOOM,
        MAX_ZOOM
      );
      const worldX =
        startCamera.x + (startMidpoint.x - size.width / 2) / startCamera.k;
      const worldY =
        startCamera.y + (startMidpoint.y - size.height / 2) / startCamera.k;
      queueCamera({
        x: worldX - (midpoint.x - size.width / 2) / nextK,
        y: worldY - (midpoint.y - size.height / 2) / nextK,
        k: nextK,
      });
      return;
    }
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointer !== event.pointerId) {
      setHoveredKey(hitNode(event.clientX, event.clientY)?.key ?? null);
      return;
    }
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    const moved = activeDrag.moved || Math.abs(dx) + Math.abs(dy) > 3;
    dragRef.current = {
      ...activeDrag,
      x: event.clientX,
      y: event.clientY,
      moved,
    };
    const current = cameraRef.current;
    queueCamera({
      ...current,
      x: current.x - dx / current.k,
      y: current.y - dy / current.k,
    });
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lasso) {
      if (lasso.pointer !== event.pointerId) return;
      const left = Math.min(lasso.x, lasso.x + lasso.width);
      const right = Math.max(lasso.x, lasso.x + lasso.width);
      const top = Math.min(lasso.y, lasso.y + lasso.height);
      const bottom = Math.max(lasso.y, lasso.y + lasso.height);
      setPinnedKeys(
        nodes
          .filter(nodeVisible)
          .filter(node => {
            const screen = screenPoint(node);
            return (
              screen.x >= left &&
              screen.x <= right &&
              screen.y >= top &&
              screen.y <= bottom
            );
          })
          .map(node => node.key)
      );
      pointersRef.current.delete(event.pointerId);
      setLasso(null);
      return;
    }
    const activeDrag = dragRef.current;
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (activeDrag?.pointer !== event.pointerId) return;
    dragRef.current = null;
    setDrag(null);
    if (activeDrag.moved) {
      commitCamera();
      return;
    }
    const now = performance.now();
    const lastTap = lastTapRef.current;
    const isDoubleTap =
      lastTap &&
      now - lastTap.time < 320 &&
      Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 32;
    if (isDoubleTap) {
      zoomAt(event.clientX, event.clientY, 1.55);
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { time: now, x: event.clientX, y: event.clientY };
    const node = hitNode(event.clientX, event.clientY);
    if (node) selectNode(node);
  };
  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    dragRef.current = null;
    setDrag(null);
    setLasso(null);
    commitCamera();
  };
  const scanNext = () => {
    const pool = nodes
      .filter(nodeVisible)
      .filter(node => node.key !== selected?.key);
    if (!pool.length) return;
    const node = pool[Math.floor(Math.random() * pool.length)];
    const nextCamera = {
      x: node.x,
      y: node.y,
      k: clamp(
        Math.max(camera.k, node.kind === "industry" ? 0.42 : 0.82),
        MIN_ZOOM,
        MAX_ZOOM
      ),
    };
    setSelected(node);
    setDrawer(false);
    setHoveredKey(node.key);
    setCamera(nextCamera);
    pushRoute(node, layer, focusCode, selectedOccupationId, nextCamera);
  };
  useEffect(() => {
    if (!scanning) return;
    scanNext();
    const timer = window.setInterval(scanNext, 3200);
    return () => window.clearInterval(timer);
  }, [scanning, layer, focusCode, selectedOccupationId]);
  const selectedScreen = selected ? screenPoint(selected) : null;
  const breadcrumb = trail.slice(-4);
  const meaningfulRoute = breadcrumb.length ? breadcrumb : [];

  return (
    <section
      id="atlas-canvas"
      ref={surfaceRef}
      className={`relative h-[calc(100dvh-68px)] min-h-[520px] touch-none overscroll-contain overflow-hidden bg-[#fbfaf8] text-[#242822] select-none ${lassoMode ? "cursor-crosshair" : ""}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => !drag && !lasso && setHoveredKey(null)}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Interactive industry and occupation atlas"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(251,250,248,.06)_60%,rgba(251,250,248,.72)_100%)]" />
      <div className="absolute left-3 right-3 top-3 z-30 flex flex-wrap items-start justify-between gap-2 pointer-events-none sm:left-4 sm:right-4 sm:top-4 sm:gap-3">
        <div className="pointer-events-auto min-w-0 max-w-[calc(100%-5rem)] sm:max-w-[min(840px,calc(100vw-2rem))]">
          <nav
            aria-label="Atlas location"
            className="flex max-w-full flex-wrap items-center gap-x-1 gap-y-1 rounded-xl border border-[#d8d6cd] bg-white/92 px-2.5 py-2 shadow-sm backdrop-blur"
          >
            <button
              onClick={viewAll}
              className="rounded px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#2f837e] hover:bg-[#edf5f3]"
            >
              Atlas
            </button>
            <span className="font-mono text-xs text-[#b4b4ad]">/</span>
            <button
              onClick={() =>
                layer === "industries" ? viewAll() : switchLayer("industries")
              }
              className="rounded px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#666961] hover:bg-[#f0efe9]"
            >
              {layerShortName(layer)}
            </button>
            {meaningfulRoute.map((step, index) => (
              <span
                key={`${step.node.key}:${index}`}
                className="flex items-center gap-x-1"
              >
                <span className="font-mono text-xs text-[#b4b4ad]">/</span>
                <button
                  onClick={() =>
                    restoreStep(
                      step,
                      trail.length - meaningfulRoute.length + index + 1
                    )
                  }
                  className={`max-w-40 truncate rounded px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] hover:bg-[#f0efe9] ${index === meaningfulRoute.length - 1 && selected ? "text-[#b64362]" : "text-[#777970]"}`}
                >
                  {short(step.node.label, 24)}
                </button>
              </span>
            ))}
          </nav>
          <div className="mt-2 hidden flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-[#777970] sm:flex">
            <span className="rounded-full border border-[#ddd9d0] bg-white/78 px-2 py-1.5">
              {focusCode
                ? "focused branch · view all restores the world"
                : "world overview · click a name to open its path"}
            </span>
            {selected && (
              <span className="rounded-full border border-[#ecd2da] bg-[#fff5f7]/88 px-2 py-1.5 text-[#a34863]">
                active · {selected.kind}
              </span>
            )}
          </div>
        </div>
        <div className="pointer-events-auto ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden rounded-full border border-[#e5dce1] bg-white/92 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8a6274] shadow-sm sm:flex">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-[#b77a95]" />
            {visitedKeys.length} explored
          </div>
          <button
            onClick={() => setDrawer(value => !value)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#d2d0c7] bg-white/92 text-[#666961] shadow-sm hover:bg-white"
            aria-label="Toggle inspector"
          >
            <PanelRight className="h-4 w-4" />
          </button>
          <button
            onClick={viewAll}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#d2d0c7] bg-white/92 text-[#666961] shadow-sm hover:bg-white"
            aria-label="View all industries"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      {selectedScreen &&
        selectedScreen.x > -80 &&
        selectedScreen.x < size.width + 80 &&
        selectedScreen.y > -80 &&
        selectedScreen.y < size.height + 80 && (
          <>
            <button
              onPointerDown={event => event.stopPropagation()}
              onClick={() => selected && activate(selected)}
              className="absolute z-40 rounded-md border border-[#b64362] bg-white px-2 py-0.5 font-mono text-sm font-bold text-[#b64362] shadow-sm hover:bg-[#b64362] hover:text-white"
              style={{
                left: Math.max(
                  12,
                  Math.min(size.width - 42, selectedScreen.x + 13)
                ),
                top: Math.max(
                  72,
                  Math.min(size.height - 30, selectedScreen.y - 15)
                ),
              }}
              aria-label={`Open the next layer for ${selected?.label ?? "selected record"}`}
            >
              »
            </button>
            {onOpenRoadmap && (
              <button
                onPointerDown={event => event.stopPropagation()}
                onClick={() =>
                  selected &&
                  onOpenRoadmap({
                    occupationId:
                      selected.occupationId ??
                      selectedOccupationId ??
                      (selected.kind === "occupation"
                        ? (selected.code ?? null)
                        : null),
                    recordLabel: selected.label,
                    recordSource: selected.source,
                    kind: selected.kind,
                    seed: selected.label,
                  })
                }
                className="absolute z-40 rounded-md border border-[#0f766e] bg-white px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#0f766e] shadow-sm hover:bg-[#0f766e] hover:text-white"
                style={{
                  left: Math.max(
                    12,
                    Math.min(size.width - 76, selectedScreen.x + 39)
                  ),
                  top: Math.max(
                    72,
                    Math.min(size.height - 30, selectedScreen.y - 15)
                  ),
                }}
                aria-label={`Open an Atlas roadmap for ${selected?.label ?? "selected record"}`}
              >
                path
              </button>
            )}
          </>
        )}
      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-30 w-[calc(100%-6rem)] sm:bottom-5 sm:left-5 sm:w-[min(560px,calc(100vw-2rem))]">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-xl border border-[#d2d0c7] bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur">
            <Search className="h-4 w-4 text-[#2f837e]" />
            <input
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Find a real industry, role, skill, or task…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#96978f]"
            />
          </div>
          {showResults && query && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 max-h-80 overflow-auto rounded-xl border border-[#d8d6cd] bg-white shadow-2xl">
              {searchResults.length ? (
                searchResults.map(node => (
                  <button
                    key={node.key}
                    onPointerDown={event => event.stopPropagation()}
                    onClick={() => activate(node)}
                    className="flex w-full items-center gap-3 border-b border-[#eeece6] px-4 py-3 text-left hover:bg-[#f7f6f1]"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: node.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-[#353831]">
                        {node.label}
                      </span>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[#85877e]">
                        {node.kind}
                        {node.code ? ` · ${node.code}` : ""}
                      </span>
                    </span>
                    <span className="text-[#8d8e86]">→</span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-xs text-[#777970]">
                  No official record matches. Try a classification name,
                  occupation title, skill, or task phrase.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => switchLayer("industries")}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${layer === "industries" ? "border-[#0f766e] bg-[#0f766e] text-white" : "border-[#d2d0c7] bg-white/88 text-[#666961]"}`}
          >
            Industries
          </button>
          <button
            onClick={() => switchLayer("occupations")}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${layer === "occupations" ? "border-[#2f837e] bg-[#2f837e] text-white" : "border-[#d2d0c7] bg-white/88 text-[#666961]"}`}
          >
            Occupations
          </button>
          {currentOccupation && (
            <button
              onClick={() => switchLayer("skills")}
              className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${layer === "skills" ? "border-[#ba7a48] bg-[#ba7a48] text-white" : "border-[#d2d0c7] bg-white/88 text-[#666961]"}`}
            >
              Skills
            </button>
          )}
          <button
            onClick={() => setToolsOpen(value => !value)}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${toolsOpen ? "border-[#242822] bg-[#242822] text-white" : "border-[#d2d0c7] bg-white/88 text-[#666961]"}`}
          >
            Tools
          </button>
          <button
            onClick={backRoute}
            className="ml-auto rounded-full border border-[#d2d0c7] bg-white/88 px-3 py-2 text-[10px] font-semibold text-[#666961] hover:bg-white"
          >
            {trail.length > 1 ? "Back" : "View all"}
          </button>
        </div>
        {toolsOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 flex max-w-full flex-wrap gap-2 rounded-xl border border-[#d8d6cd] bg-white/96 p-3 shadow-xl backdrop-blur">
            <button
              onClick={() => setLassoMode(value => !value)}
              className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${lassoMode ? "border-[#ba7a48] bg-[#ba7a48] text-white" : "border-[#d2d0c7] bg-white text-[#666961]"}`}
            >
              {lassoMode ? "Lasso on" : "Lasso"}
            </button>
            <button
              onClick={() => setScanning(value => !value)}
              className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${scanning ? "border-[#b95c78] bg-[#b95c78] text-white" : "border-[#d2d0c7] bg-white text-[#666961]"}`}
            >
              {scanning ? "Pause scan" : "Scan"}
            </button>
            <button
              onClick={() => setTimelineOpen(value => !value)}
              className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${timelineOpen ? "border-[#242822] bg-[#242822] text-white" : "border-[#d2d0c7] bg-white text-[#666961]"}`}
            >
              Trail {trail.length}
            </button>
            {pinnedKeys.length > 0 && (
              <button
                onClick={() => setPinnedKeys([])}
                className="rounded-full border border-[#dfc681] bg-[#f6ebc9] px-3 py-2 text-[10px] font-semibold text-[#8a6417]"
              >
                Clear {pinnedKeys.length} pins
              </button>
            )}
          </div>
        )}
      </div>
      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-30 flex flex-col gap-1 sm:bottom-5 sm:right-5">
        <button
          onClick={() => zoomAt(size.width / 2, size.height / 2, 1.25)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[#d2d0c7] bg-white/92 text-[#666961] shadow-sm"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoomAt(size.width / 2, size.height / 2, 0.8)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[#d2d0c7] bg-white/92 text-[#666961] shadow-sm"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() =>
            setCamera({
              x: selected?.x ?? WORLD_CX,
              y: selected?.y ?? WORLD_CY,
              k: Math.max(camera.k, selected ? 0.95 : 0.38),
            })
          }
          className="grid h-9 w-9 place-items-center rounded-lg border border-[#d2d0c7] bg-white/92 text-[#666961] shadow-sm"
          aria-label="Center selected"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>
      {timelineOpen && (
        <aside className="absolute right-3 top-16 z-40 w-[min(330px,calc(100vw-1.5rem))] border border-[#d8d6cd] bg-[#fffefb]/96 p-4 shadow-[0_18px_45px_rgba(36,40,34,.16)] backdrop-blur sm:right-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#0f766e]">
              Session trail / {trail.length} records
            </span>
            <button
              onClick={() => setTimelineOpen(false)}
              className="text-[#777970] hover:text-[#b95c78]"
              aria-label="Close session trail"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#62645d]">
            Your local route through real records. Select any stop to restore
            its saved map context.
          </p>
          <div className="mt-3 max-h-64 space-y-1 overflow-auto">
            {trail.length ? (
              [...trail]
                .slice(-12)
                .reverse()
                .map((step, index) => (
                  <button
                    key={`${step.node.key}:${index}`}
                    onClick={() => restoreStep(step)}
                    className="flex w-full items-center gap-2 border-b border-[#eceae3] px-2 py-2 text-left hover:bg-[#f4f1e8]"
                  >
                    <span className="font-mono text-[9px] text-[#ba7a48]">
                      {String(trail.length - index).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#3e413c]">
                      {step.node.label}
                    </span>
                    <span className="font-mono text-[8px] uppercase text-[#85877e]">
                      {step.node.kind}
                    </span>
                  </button>
                ))
            ) : (
              <p className="py-3 text-xs text-[#777970]">
                Click a real record to begin your trail.
              </p>
            )}
          </div>
        </aside>
      )}
      {lasso && (
        <div
          className="pointer-events-none absolute z-35 border border-dashed border-[#ba7a48] bg-[#f6ebc9]/20"
          style={{
            left: `${Math.min(lasso.x, lasso.x + lasso.width)}px`,
            top: `${Math.min(lasso.y, lasso.y + lasso.height)}px`,
            width: `${Math.abs(lasso.width)}px`,
            height: `${Math.abs(lasso.height)}px`,
          }}
        />
      )}
      {selected && drawer && (
        <Inspector
          node={selected}
          occupation={currentOccupation}
          onClose={() => setDrawer(false)}
          onDescend={() => activate(selected)}
          onBack={backRoute}
          visitedCount={visitedKeys.length}
        />
      )}
      <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-[#d2d0c7] bg-white/78 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8a8b83] sm:flex">
        <Crosshair className="h-3.5 w-3.5" /> drag to roam · wheel at cursor ·
        tools reveal lasso, scan, and trail
      </div>
      {!selected && (
        <aside className="pointer-events-none absolute left-4 top-32 z-30 hidden w-[min(342px,calc(100vw-2rem))] border border-[#b8d8d1] bg-[#fffefb]/94 p-4 shadow-[0_14px_35px_rgba(36,40,34,.08)] backdrop-blur sm:block">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.17em] text-[#0f766e]">
              Field guide / world scale
            </span>
            <span className="border border-[#dfc681] bg-[#f6ebc9] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#8a6417]">
              Official sources
            </span>
          </div>
          <p className="mt-3 text-sm leading-5 text-[#4e514b]">
            At this scale, each teal name is a verified industry field. Zoom
            closer for formal child records; the map never invents a link to a
            role.
          </p>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 border-t border-[#e3e1d8] pt-3 font-mono text-[9px] uppercase tracking-[0.1em]">
            <span className="text-[#0f766e]">01</span>
            <span className="text-[#6f716b]">
              Click a field to trace its formal lineage
            </span>
            <span className="text-[#b95c78]">02</span>
            <span className="text-[#6f716b]">
              Use <strong className="text-[#b95c78]">»</strong> to reveal the
              next real layer
            </span>
            <span className="text-[#ba7a48]">03</span>
            <span className="text-[#6f716b]">
              Search moves the camera; it never invents a connection
            </span>
          </div>
        </aside>
      )}
      {!selected && (
        <aside
          data-atlas-overlay
          className="atlas-evidence-drawer absolute right-4 top-[260px] z-30 hidden w-[min(286px,calc(100vw-2rem))] border border-[#d8d6cd] bg-[#fffefb]/96 shadow-[0_18px_46px_rgba(36,40,34,.12)] backdrop-blur xl:block"
        >
          <div className="border-b border-[#e4e2da] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-sans text-xs font-semibold uppercase tracking-[.12em] text-[#45483f]">
                Evidence desk
              </span>
              <span className="rounded-full border border-[#dfc681] bg-[#fffaf0] px-2 py-1 font-mono text-[8px] uppercase tracking-[.12em] text-[#8a6417]">
                Method open
              </span>
            </div>
            <p className="mt-2 text-sm leading-5 text-[#62645d]">
              Read the spatial field with its evidence boundary beside it—not
              after the fact.
            </p>
          </div>
          <div className="space-y-0 px-5 py-2">
            <div className="flex gap-3 border-b border-[#eeece6] py-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0f766e]" />
              <div>
                <strong className="block text-sm text-[#353831]">
                  Verified structure
                </strong>
                <span className="mt-0.5 block text-xs leading-5 text-[#6b6d66]">
                  Teal fields trace official classifications and supplied
                  profiles.
                </span>
              </div>
            </div>
            <div className="flex gap-3 border-b border-[#eeece6] py-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ba7a48]" />
              <div>
                <strong className="block text-sm text-[#353831]">
                  Context to inspect
                </strong>
                <span className="mt-0.5 block text-xs leading-5 text-[#6b6d66]">
                  Ochre marks source context and the route you have pinned
                  locally.
                </span>
              </div>
            </div>
            <div className="flex gap-3 py-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b95c78]" />
              <div>
                <strong className="block text-sm text-[#353831]">
                  Unresolved boundary
                </strong>
                <span className="mt-0.5 block text-xs leading-5 text-[#6b6d66]">
                  Coral signals a missing published bridge; Atlas will not fill
                  it with a guess.
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-[#e4e2da] bg-[#f7f5ef] p-3">
            <button
              onClick={() => setTimelineOpen(true)}
              className="flex w-full items-center justify-between border border-[#cfcbc0] bg-[#fffefb] px-3 py-2.5 text-left text-xs font-semibold text-[#42453f] transition hover:border-[#0f766e] hover:text-[#0f766e]"
            >
              Inspect my route evidence <span aria-hidden>→</span>
            </button>
            <button
              onClick={viewAll}
              className="mt-2 w-full text-left text-xs text-[#5e756f] hover:text-[#0f766e]"
            >
              Return to the full classification field
            </button>
          </div>
        </aside>
      )}
    </section>
  );
}
