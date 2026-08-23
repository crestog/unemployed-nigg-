import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { feature } from "topojson-client";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import worldTopology from "world-atlas/countries-50m.json";
import {
  ChevronLeft,
  Copy,
  Crosshair,
  ExternalLink,
  LocateFixed,
  Map as MapIcon,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type Camera = { x: number; y: number; k: number };
type MapFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & {
  id?: string | number;
};
type LegalRecord = {
  countryCode: string;
  countryName: string;
  topologyId: string;
  total: number | null;
  goldenCopyPublishedAt: string | null;
  sourceQuery: string;
  sourceStatus: "available" | "unavailable";
};
type WorldRelease = {
  releaseId: string;
  generatedAt: string;
  integrity: {
    syntheticRecords: number;
    sourceCountryGeometryCount: number;
    availableCountryQueries: number;
    unavailableCountryQueries: number;
  };
  geography: {
    publisher: string;
    title: string;
    license: string;
    sourceUrl: string;
    use: string;
  };
  layers: {
    legalEntities: {
      label: string;
      publisher: string;
      sourceUrl: string;
      recordDefinition: string;
      exclusions: string[];
      records?: LegalRecord[];
    };
  };
};
type WorldNode = {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  total: number | null;
  record: LegalRecord | null;
  feature: MapFeature;
};

type HoverState = { id: string } | null;

const mapCollection = feature(
  worldTopology as never,
  (worldTopology as unknown as { objects: { countries: never } }).objects
    .countries
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const countryFeatures = mapCollection.features as MapFeature[];
const MIN_ZOOM = 0.72;
const MAX_ZOOM = 18;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const topologyId = (item: MapFeature) => String(item.id ?? "").padStart(3, "0");
const formatNumber = (value: number | null | undefined) =>
  value == null ? "Unavailable" : Math.round(value).toLocaleString();
const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unavailable";
const shortText = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

function overlayTarget(target: EventTarget | null) {
  return (
    target instanceof Element && Boolean(target.closest("[data-world-overlay]"))
  );
}

function touchDistance(
  first: { x: number; y: number },
  second: { x: number; y: number }
) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function touchMidpoint(
  first: { x: number; y: number },
  second: { x: number; y: number }
) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

export default function WorldMapExplorer() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const restoredRef = useRef(false);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    distance: number;
    midpoint: { x: number; y: number };
    camera: Camera;
  } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(
    null
  );
  const suppressClickUntilRef = useRef(0);
  const cameraRef = useRef<Camera>({ x: 640, y: 380, k: 1 });
  const queuedCameraRef = useRef<Camera | null>(null);
  const cameraFrameRef = useRef<number | null>(null);
  const wheelCommitRef = useRef<number | null>(null);
  const mapGroupRef = useRef<SVGGElement>(null);
  const dragRef = useRef<{ pointer: number; x: number; y: number } | null>(
    null
  );
  const [release, setRelease] = useState<WorldRelease | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 1280, height: 760 });
  const [camera, setCamera] = useState<Camera>({ x: 640, y: 380, k: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<HoverState>(null);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [drag, setDrag] = useState<{
    pointer: number;
    x: number;
    y: number;
  } | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);

  const applyCamera = (next: Camera, commit = false) => {
    cameraRef.current = next;
    queuedCameraRef.current = next;
    if (cameraFrameRef.current === null) {
      cameraFrameRef.current = window.requestAnimationFrame(() => {
        cameraFrameRef.current = null;
        const queued = queuedCameraRef.current;
        if (!queued || !mapGroupRef.current) return;
        mapGroupRef.current.setAttribute(
          "transform",
          `translate(${queued.x} ${queued.y}) scale(${queued.k}) translate(${-size.width / 2} ${-size.height / 2})`
        );
      });
    }
    if (commit) setCamera(next);
  };
  const commitCamera = () => setCamera(cameraRef.current);

  useEffect(() => {
    cameraRef.current = camera;
    if (mapGroupRef.current) {
      mapGroupRef.current.setAttribute(
        "transform",
        `translate(${camera.x} ${camera.y}) scale(${camera.k}) translate(${-size.width / 2} ${-size.height / 2})`
      );
    }
  }, [camera, size.height, size.width]);

  useEffect(
    () => () => {
      if (cameraFrameRef.current !== null)
        window.cancelAnimationFrame(cameraFrameRef.current);
      if (wheelCommitRef.current !== null)
        window.clearTimeout(wheelCommitRef.current);
    },
    []
  );

  useEffect(() => {
    fetch("/data/world-venture.json")
      .then(response => {
        if (!response.ok) throw new Error("World source release unavailable");
        return response.json() as Promise<WorldRelease>;
      })
      .then(setRelease)
      .catch((cause: Error) => setError(cause.message));
  }, []);

  useEffect(() => {
    if (!surfaceRef.current) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize({
        width: Math.max(320, rect.width),
        height: Math.max(620, rect.height),
      });
    });
    observer.observe(surfaceRef.current);
    return () => observer.disconnect();
  }, []);

  const projection = useMemo(
    () =>
      geoNaturalEarth1().fitExtent(
        [
          [30, 68],
          [size.width - 30, size.height - 76],
        ],
        mapCollection
      ),
    [size.height, size.width]
  );
  const pathMaker = useMemo(() => geoPath(projection), [projection]);
  const worldPath = useMemo(() => pathMaker(mapCollection) ?? "", [pathMaker]);
  const countryPaths = useMemo(
    () =>
      countryFeatures.map((country, index) => ({
        country,
        id: topologyId(country),
        key: `country-${index}-${topologyId(country)}`,
        d: pathMaker(country) ?? "",
      })),
    [pathMaker]
  );

  const recordsById = useMemo(
    () =>
      new Map(
        (release?.layers.legalEntities.records ?? []).map(record => [
          record.topologyId,
          record,
        ])
      ),
    [release]
  );
  const nodes = useMemo<WorldNode[]>(() => {
    const seen = new Set<string>();
    return countryFeatures.flatMap(country => {
      const id = topologyId(country);
      if (seen.has(id)) return [];
      seen.add(id);
      const [x, y] = pathMaker.centroid(country as GeoJSON.Feature);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
      const record = recordsById.get(id) ?? null;
      return [
        {
          id,
          name: record?.countryName ?? country.properties?.name ?? "Country",
          code: record?.countryCode ?? id,
          x,
          y,
          total: record?.total ?? null,
          record,
          feature: country,
        },
      ];
    });
  }, [pathMaker, recordsById]);
  const nodeById = useMemo(
    () => new Map(nodes.map(node => [node.id, node])),
    [nodes]
  );
  const maxTotal = useMemo(
    () => Math.max(1, ...nodes.map(node => node.total ?? 0)),
    [nodes]
  );
  const selected = selectedId ? (nodeById.get(selectedId) ?? null) : null;
  const hoveredNode = hovered ? (nodeById.get(hovered.id) ?? null) : null;
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return nodes
      .filter(node =>
        `${node.name} ${node.code}`.toLowerCase().includes(needle)
      )
      .slice(0, 8);
  }, [nodes, query]);
  const nearbyIds = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(
      nodes
        .map(node => ({
          id: node.id,
          distance: Math.hypot(node.x - selected.x, node.y - selected.y),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 28)
        .map(item => item.id)
    );
  }, [nodes, selected]);
  const nodeBudget = camera.k < 1.2 ? 140 : camera.k < 2.8 ? 220 : nodes.length;
  const visibleNodes = useMemo(() => {
    if (nearbyMode) return nodes.filter(node => nearbyIds.has(node.id));
    return [...nodes]
      .sort((a, b) => {
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
        return (b.total ?? -1) - (a.total ?? -1);
      })
      .slice(0, nodeBudget);
  }, [nearbyIds, nearbyMode, nodeBudget, nodes, selectedId]);
  const labelIds = useMemo(() => {
    const labelBudget =
      camera.k < 1.6 ? 0 : camera.k < 2.8 ? 44 : camera.k < 6 ? 96 : 160;
    const labels = new Set<string>();
    const boxes: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    visibleNodes.forEach((node, index) => {
      const isSelected = selectedId === node.id;
      if (!isSelected && (camera.k < 1.6 || index >= labelBudget)) return;
      const screenX = camera.x + (node.x - size.width / 2) * camera.k;
      const screenY = camera.y + (node.y - size.height / 2) * camera.k;
      const width = clamp(node.name.length * 5.9 + 18, 42, 154);
      const height = 18;
      const box = {
        left: screenX + 8,
        top: screenY - height / 2,
        right: screenX + 8 + width,
        bottom: screenY + height / 2,
      };
      const overlaps = boxes.some(
        other =>
          box.left < other.right &&
          box.right > other.left &&
          box.top < other.bottom &&
          box.bottom > other.top
      );
      if (overlaps && !isSelected) return;
      labels.add(node.id);
      boxes.push(box);
    });
    return labels;
  }, [camera, selectedId, size.height, size.width, visibleNodes]);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (params.get("world") !== "1") return;
    const nextK = Number.parseFloat(params.get("wxz") ?? "");
    const nextX = Number.parseFloat(params.get("wxx") ?? "");
    const nextY = Number.parseFloat(params.get("wxy") ?? "");
    if ([nextK, nextX, nextY].every(Number.isFinite)) {
      setCamera({
        k: clamp(nextK, MIN_ZOOM, MAX_ZOOM),
        x: nextX,
        y: nextY,
      });
    }
    setSelectedId(params.get("wxc") || null);
    setNearbyMode(params.get("wxm") === "nearby");
  }, []);

  useEffect(() => {
    if (!release) return;
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("world", "1");
      params.set("wxx", camera.x.toFixed(1));
      params.set("wxy", camera.y.toFixed(1));
      params.set("wxz", camera.k.toFixed(3));
      if (selectedId) params.set("wxc", selectedId);
      if (nearbyMode) params.set("wxm", "nearby");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${params.toString()}`
      );
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [camera, nearbyMode, release, selectedId]);

  const zoomAt = (px: number, py: number, factor: number, commit = false) => {
    const current = cameraRef.current;
    const nextK = clamp(current.k * factor, MIN_ZOOM, MAX_ZOOM);
    const mapX = (px - current.x) / current.k + size.width / 2;
    const mapY = (py - current.y) / current.k + size.height / 2;
    applyCamera(
      {
        k: nextK,
        x: px - (mapX - size.width / 2) * nextK,
        y: py - (mapY - size.height / 2) * nextK,
      },
      commit
    );
  };

  const focusNode = (node: WorldNode, zoom = 3.8) => {
    setSelectedId(node.id);
    setQuery("");
    setShowResults(false);
    setCamera({
      k: zoom,
      x: size.width / 2 - (node.x - size.width / 2) * zoom,
      y: size.height / 2 - (node.y - size.height / 2) * zoom,
    });
  };
  const reset = () => {
    setCamera({ x: size.width / 2, y: size.height / 2, k: 1 });
    setSelectedId(null);
    setNearbyMode(false);
    setQuery("");
    setShowResults(false);
  };
  const toggleNearby = () => {
    if (!selected) return;
    setNearbyMode(true);
    focusNode(selected, 2.25);
  };
  const viewAll = () => {
    setNearbyMode(false);
    setSelectedId(null);
    reset();
  };
  const copyName = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.name);
    } catch {
      // Clipboard access is optional and must never block map exploration.
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (overlayTarget(event.target)) return;
    movedRef.current = false;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable for synthetic or platform-owned touch events.
    }
    if (pointersRef.current.size === 1) {
      const nextDrag = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      dragRef.current = nextDrag;
      setDrag(nextDrag);
    } else if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        distance: touchDistance(first, second),
        midpoint: touchMidpoint(first, second),
        camera: cameraRef.current,
      };
      movedRef.current = true;
      dragRef.current = null;
      setDrag(null);
    }
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const previous = pointersRef.current.get(event.pointerId);
    if (!previous) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointersRef.current.size >= 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const pinch = pinchRef.current;
      if (!pinch) return;
      const distance = Math.max(1, touchDistance(first, second));
      const midpoint = touchMidpoint(first, second);
      const rect = event.currentTarget.getBoundingClientRect();
      const midpointX = midpoint.x - rect.left;
      const midpointY = midpoint.y - rect.top;
      const startMidpointX = pinch.midpoint.x - rect.left;
      const startMidpointY = pinch.midpoint.y - rect.top;
      const startCamera = pinch.camera;
      const nextK = clamp(
        startCamera.k * (distance / Math.max(1, pinch.distance)),
        MIN_ZOOM,
        MAX_ZOOM
      );
      const worldX =
        (startMidpointX - startCamera.x) / startCamera.k + size.width / 2;
      const worldY =
        (startMidpointY - startCamera.y) / startCamera.k + size.height / 2;
      applyCamera({
        k: nextK,
        x: midpointX - (worldX - size.width / 2) * nextK,
        y: midpointY - (worldY - size.height / 2) * nextK,
      });
      movedRef.current = true;
      return;
    }
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointer !== event.pointerId) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    const current = cameraRef.current;
    applyCamera({ ...current, x: current.x + dx, y: current.y + dy });
    dragRef.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointersRef.current.get(event.pointerId);
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (dragRef.current?.pointer === event.pointerId) {
      dragRef.current = null;
      setDrag(null);
    }
    if (movedRef.current) {
      commitCamera();
      return;
    }
    if (!pointer || pointersRef.current.size > 0) return;
    const now = performance.now();
    const lastTap = lastTapRef.current;
    const isDoubleTap =
      lastTap &&
      now - lastTap.time < 320 &&
      Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 32;
    if (isDoubleTap) {
      const rect = event.currentTarget.getBoundingClientRect();
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, 1.8, true);
      suppressClickUntilRef.current = now + 260;
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: event.clientX, y: event.clientY };
    }
  };
  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    dragRef.current = null;
    setDrag(null);
  };
  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (overlayTarget(event.target)) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    zoomAt(
      event.clientX - rect.left,
      event.clientY - rect.top,
      Math.exp(-event.deltaY * 0.0015),
      false
    );
    if (wheelCommitRef.current !== null)
      window.clearTimeout(wheelCommitRef.current);
    wheelCommitRef.current = window.setTimeout(() => {
      wheelCommitRef.current = null;
      commitCamera();
    }, 140);
  };
  if (error)
    return (
      <div className="grid min-h-[calc(100vh-68px)] place-items-center bg-[#08111d] p-6 text-center text-white">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#f2b35b]">
            World source unavailable
          </p>
          <h1 className="mt-4 font-display text-4xl">{error}</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#aebdce]">
            The Atlas source release could not be loaded. The map is
            source-bound and will not invent a replacement dataset.
          </p>
        </div>
      </div>
    );
  if (!release)
    return (
      <div className="grid min-h-[calc(100vh-68px)] place-items-center bg-[#08111d] text-[#c7d4e4]">
        <div className="animate-pulse font-display text-3xl">
          Loading world field…
        </div>
      </div>
    );

  return (
    <section
      ref={surfaceRef}
      className={`relative h-[calc(100dvh-112px)] min-h-[520px] touch-none overflow-hidden sm:h-[calc(100dvh-68px)] sm:min-h-[560px] bg-[#08111d] text-white select-none ${drag ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onWheel={onWheel}
    >
      <svg
        className="absolute inset-0 h-full w-full touch-none"
        role="img"
        aria-label="Interactive source-backed world map"
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        <defs>
          <pattern
            id="atlas-world-grid"
            width="42"
            height="42"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 42 0 L 0 0 0 42"
              fill="none"
              stroke="#b4c9df"
              strokeOpacity=".08"
            />
          </pattern>
          <filter
            id="atlas-world-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={size.width} height={size.height} fill="#08111d" />
        <rect
          width={size.width}
          height={size.height}
          fill="url(#atlas-world-grid)"
        />
        <g
          ref={mapGroupRef}
          transform={`translate(${camera.x} ${camera.y}) scale(${camera.k}) translate(${-size.width / 2} ${-size.height / 2})`}
        >
          <path
            d={worldPath}
            fill="#0c1c2d"
            stroke="#29445e"
            strokeWidth={1.2 / camera.k}
          />
          {countryPaths.map(({ country, id, key, d }) => {
            const node = nodeById.get(id);
            const visible = !nearbyMode || nearbyIds.has(id);
            const isSelected = selectedId === id;
            return (
              <path
                key={key}
                d={d}
                fill={isSelected ? "#263c5c" : visible ? "#10263a" : "#0a1624"}
                fillOpacity={isSelected ? 0.95 : visible ? 0.72 : 0.18}
                stroke={
                  isSelected ? "#ffbf69" : visible ? "#2c4b66" : "#16293c"
                }
                strokeWidth={(isSelected ? 2 : 0.7) / camera.k}
                className="transition-[fill,stroke] duration-150"
                onPointerEnter={() => node && setHovered({ id })}
                onPointerLeave={() => setHovered(null)}
                onClick={event => {
                  event.stopPropagation();
                  if (
                    !movedRef.current &&
                    performance.now() >= suppressClickUntilRef.current &&
                    node
                  )
                    focusNode(node, Math.max(2.2, camera.k));
                }}
              >
                <title>
                  {node?.name ?? country.properties?.name ?? "Country"}
                </title>
              </path>
            );
          })}
          {visibleNodes.map((node, index) => {
            const visible = !nearbyMode || nearbyIds.has(node.id);
            if (!visible) return null;
            const isSelected = selectedId === node.id;
            const total = node.total ?? 0;
            const screenRadius = isSelected
              ? 8
              : clamp(
                  3.4 +
                    (Math.log10(total + 1) / Math.log10(maxTotal + 1)) * 7 +
                    Math.log2(Math.max(1, camera.k)) * 0.9,
                  3.4,
                  12
                );
            const radius = screenRadius / camera.k;
            const showGlow = isSelected || (camera.k > 1.2 && index < 80);
            const fill = isSelected
              ? "#ffbf69"
              : total > 0
                ? "#45d7c0"
                : "#647c91";
            const showLabel = labelIds.has(node.id);
            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer"
                onPointerEnter={() => setHovered({ id: node.id })}
                onPointerLeave={() => setHovered(null)}
                onClick={event => {
                  event.stopPropagation();
                  if (
                    !movedRef.current &&
                    performance.now() >= suppressClickUntilRef.current
                  )
                    focusNode(node, Math.max(3, camera.k));
                }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius * 2.6}
                  fill={fill}
                  opacity={isSelected ? 0.17 : 0.08}
                  filter={showGlow ? "url(#atlas-world-glow)" : undefined}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={fill}
                  stroke={isSelected ? "#fff4d8" : "#092033"}
                  strokeWidth={1 / camera.k}
                />
                {showLabel && (
                  <text
                    x={node.x + radius * 1.6}
                    y={node.y + 3 / camera.k}
                    fontSize={
                      clamp(
                        11 + Math.log2(Math.max(1, camera.k)) * 1.6,
                        11,
                        17
                      ) / camera.k
                    }
                    fontWeight={700}
                    fill={isSelected ? "#fff2d4" : "#b9e9e1"}
                    style={{
                      paintOrder: "stroke",
                      stroke: "#08111d",
                      strokeWidth: 3 / camera.k,
                    }}
                  >
                    {shortText(node.name, 22)}
                  </text>
                )}
              </g>
            );
          })}
          {nearbyMode && selected && (
            <circle
              cx={selected.x}
              cy={selected.y}
              r={42 / camera.k}
              fill="none"
              stroke="#ffbf69"
              strokeDasharray={`${5 / camera.k} ${4 / camera.k}`}
              strokeWidth={1.2 / camera.k}
              opacity=".7"
            />
          )}
        </g>
      </svg>

      <div
        data-world-overlay
        className="absolute left-3 right-3 top-3 z-20 max-w-none sm:left-4 sm:right-auto sm:top-4 sm:max-w-[min(690px,calc(100vw-2rem))]"
        onPointerDown={event => event.stopPropagation()}
        onWheel={event => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#31506d] bg-[#0c1d30]/95 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur">
          <MapIcon className="h-4 w-4 text-[#45d7c0]" />
          <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#8fe7d8]">
            Atlas World
          </span>
          <span className="text-[#526b84]">/</span>
          <span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#9db2c8]">
            {nearbyMode ? "nearby fields" : "all country fields"}
          </span>
          {selected && (
            <>
              <span className="text-[#526b84]">/</span>
              <span className="max-w-[190px] truncate font-mono text-[9px] uppercase tracking-[.14em] text-[#ffbf69]">
                {selected.name}
              </span>
            </>
          )}
        </div>
        {nearbyMode && selected && (
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#685031] bg-[#1f1a14]/95 px-3 py-2 text-xs text-[#f3d49f] shadow-xl">
            <span>Only nearby fields are shown.</span>
            <button
              type="button"
              onClick={viewAll}
              className="font-semibold text-[#ffbf69] underline-offset-2 hover:underline"
            >
              View all
            </button>
          </div>
        )}
      </div>

      <aside
        data-world-overlay
        className="absolute left-4 top-[112px] z-20 hidden w-[306px] border border-[#294761] bg-[#0b1a2a]/94 p-4 shadow-2xl shadow-black/20 backdrop-blur lg:block"
        onPointerDown={event => event.stopPropagation()}
        onWheel={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[.16em] text-[#8fe7d8]">
          <span>Field guide / world scale</span>
          <span className="border border-[#4f604f] bg-[#20291e] px-1.5 py-0.5 text-[#d2dc96]">
            source-backed
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#b4c4d5]">
          Drag to roam. Zoom at the cursor. Each glowing field is a
          country-level GLEIF record aggregate; proximity is a visual cue, not a
          causal claim.
        </p>
        <div className="mt-4 space-y-2 border-t border-[#203b54] pt-3 font-mono text-[9px] uppercase tracking-[.1em] text-[#8297ac]">
          <p>
            <span className="mr-2 text-[#45d7c0]">01</span>Search moves the
            camera to a field
          </p>
          <p>
            <span className="mr-2 text-[#ffbf69]">02</span>Click a node to
            inspect the source record
          </p>
          <p>
            <span className="mr-2 text-[#9babc0]">03</span>Show nearby focuses a
            local visual subgraph
          </p>
        </div>
      </aside>

      {hoveredNode && (
        <div
          data-world-overlay
          className="pointer-events-none absolute z-30 hidden min-w-[176px] rounded-lg border border-[#3b5a76] bg-[#08111d]/96 px-3 py-2 shadow-xl backdrop-blur sm:block"
          style={{
            left: Math.min(
              size.width - 210,
              Math.max(
                12,
                camera.x + (hoveredNode.x - size.width / 2) * camera.k + 16
              )
            ),
            top: Math.min(
              size.height - 92,
              Math.max(
                82,
                camera.y + (hoveredNode.y - size.height / 2) * camera.k - 72
              )
            ),
          }}
        >
          <div className="font-semibold text-[#e6f3f2]">{hoveredNode.name}</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#7f9ab1]">
            {hoveredNode.total != null
              ? `${formatNumber(hoveredNode.total)} LEI records`
              : "No current record"}
          </div>
        </div>
      )}

      <div
        data-world-overlay
        className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-30 w-[calc(100%-6rem)] sm:bottom-4 sm:left-4 sm:w-[min(540px,calc(100vw-2rem))]"
        onPointerDown={event => event.stopPropagation()}
        onWheel={event => event.stopPropagation()}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#45d7c0]" />
          <input
            value={query}
            onFocus={() => setShowResults(true)}
            onChange={event => {
              setQuery(event.target.value);
              setShowResults(true);
            }}
            onKeyDown={event => {
              if (event.key === "Enter" && matches[0]) focusNode(matches[0]);
            }}
            placeholder="Find a country field…"
            className="w-full rounded-xl border border-[#35536f] bg-[#0b1a2a]/96 py-3 pl-11 pr-4 text-sm text-[#e8f2f5] shadow-2xl shadow-black/25 outline-none transition placeholder:text-[#738aa0] focus:border-[#45d7c0] focus:ring-4 focus:ring-[#45d7c0]/10"
          />
          {showResults && query && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 max-h-72 overflow-auto rounded-xl border border-[#35536f] bg-[#0b1a2a] p-2 shadow-2xl">
              <div className="px-3 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#7189a0]">
                Country fields
              </div>
              {matches.length ? (
                matches.map(node => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => focusNode(node)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#122b40]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[#e6f3f2]">
                        {node.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[.12em] text-[#7991a6]">
                        {node.code} ·{" "}
                        {node.total != null
                          ? `${formatNumber(node.total)} records`
                          : "unavailable"}
                      </span>
                    </span>
                    <ChevronLeft className="h-4 w-4 rotate-180 text-[#45d7c0]" />
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-[#9ab0c3]">
                  No country field matches that search.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          <span className="rounded-full border border-[#35536f] bg-[#0b1a2a]/92 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8da4b8]">
            Drag to roam
          </span>
          <span className="rounded-full border border-[#35536f] bg-[#0b1a2a]/92 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8da4b8]">
            Wheel at cursor
          </span>
          <span className="rounded-full border border-[#35536f] bg-[#0b1a2a]/92 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8da4b8]">
            {nodes.length} fields
          </span>
        </div>
      </div>

      <div
        data-world-overlay
        className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-20 flex flex-col gap-2 sm:bottom-4 sm:right-4"
        onPointerDown={event => event.stopPropagation()}
        onWheel={event => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomAt(size.width / 2, size.height / 2, 1.55)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#35536f] bg-[#0b1a2a]/95 text-[#c5d7e7] shadow-xl hover:border-[#45d7c0] hover:text-[#45d7c0]"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomAt(size.width / 2, size.height / 2, 1 / 1.55)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#35536f] bg-[#0b1a2a]/95 text-[#c5d7e7] shadow-xl hover:border-[#45d7c0] hover:text-[#45d7c0]"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#35536f] bg-[#0b1a2a]/95 text-[#c5d7e7] shadow-xl hover:border-[#45d7c0] hover:text-[#45d7c0]"
          aria-label="Reset world view"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      {selected && (
        <aside
          data-world-overlay
          className="absolute bottom-0 left-0 right-0 top-0 z-40 flex w-full flex-col overflow-hidden rounded-none sm:bottom-4 sm:left-auto sm:right-4 sm:top-4 sm:w-[min(410px,calc(100vw-2rem))] sm:rounded-2xl border border-[#35536f] bg-[#0b1a2a]/97 shadow-2xl shadow-black/40 backdrop-blur-xl sm:right-16"
          onPointerDown={event => event.stopPropagation()}
          onWheel={event => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[#203b54] px-4 py-3 pb-[max(.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4">
            <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#8fa7bc]">
              Country field inspector
            </span>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-md p-1.5 text-[#8da4b8] hover:bg-[#122b40] hover:text-white"
              aria-label="Close country inspector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#45d7c0]">
                <span className="h-2 w-2 rounded-full bg-[#45d7c0]" />
                GLEIF legal-address aggregate
              </div>
              <span className="rounded-full bg-[#122b40] px-2 py-1 font-mono text-[8px] uppercase tracking-[.13em] text-[#a1b6c8]">
                {selected.code}
              </span>
            </div>
            <h2 className="mt-4 font-display text-4xl leading-[.94] text-white">
              {selected.name}
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#b4c4d5]">
              This field is a country-level aggregate of available GLEIF legal
              entity records by legal-address country. It is not a count of all
              businesses, startups, jobs, or economic activity.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 border-y border-[#203b54] py-5">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8097ad]">
                  Source records
                </div>
                <div className="mt-1 font-display text-3xl text-[#e6f3f2]">
                  {formatNumber(selected.total)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8097ad]">
                  Golden Copy
                </div>
                <div className="mt-2 text-xs leading-5 text-[#b4c4d5]">
                  {formatDate(selected.record?.goldenCopyPublishedAt)}
                </div>
              </div>
            </div>
            {selected.record?.sourceStatus === "unavailable" && (
              <p className="mt-5 border-l-2 border-[#ef8b76] pl-3 text-sm leading-6 text-[#efb0a2]">
                The publisher query was unavailable in this release. Atlas does
                not convert an unavailable query into zero records.
              </p>
            )}
            <div className="mt-6">
              <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#8097ad]">
                Spatial reading
              </div>
              <p className="mt-2 text-sm leading-6 text-[#b4c4d5]">
                The ring shows the nearby visual neighborhood used by Atlas’s
                local view. Spatial proximity is a navigation aid, not a proven
                relationship between countries.
              </p>
            </div>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={toggleNearby}
                className="flex items-center justify-between rounded-xl border border-[#685031] bg-[#221c14] px-4 py-3 text-left text-sm font-semibold text-[#f3d49f] hover:border-[#ffbf69]"
              >
                {nearbyMode ? "Nearby fields shown" : "Show nearby fields"}
                <Crosshair className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={copyName}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-xs text-[#9cb1c3] hover:bg-[#122b40] hover:text-white"
              >
                <Copy className="h-4 w-4" /> Copy country name
              </button>
              <button
                type="button"
                onClick={viewAll}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-xs text-[#9cb1c3] hover:bg-[#122b40] hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" /> Back to full world field
              </button>
            </div>
            <a
              href={selected.record?.sourceQuery ?? release.geography.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 flex items-center gap-2 border-t border-[#203b54] pt-5 font-mono text-[9px] uppercase tracking-[.12em] text-[#45d7c0] hover:text-[#b7fff0]"
            >
              Open source query <ExternalLink className="ml-auto h-3.5 w-3.5" />
            </a>
          </div>
        </aside>
      )}

      <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-[#2c4861] bg-[#08111d]/70 px-4 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#7890a7] backdrop-blur sm:flex">
        <Crosshair className="h-3.5 w-3.5" /> zoom to reveal country labels ·
        click a field to inspect
      </div>
    </section>
  );
}
