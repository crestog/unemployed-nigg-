import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { feature } from "topojson-client";
import {
  geoBounds,
  geoCentroid,
  geoContains,
  geoNaturalEarth1,
  geoPath,
} from "d3-geo";
import worldTopology from "world-atlas/countries-50m.json";
import WorldSemanticCanvas, {
  type SemanticBoundary,
  type SemanticLocality,
} from "./WorldSemanticCanvas";
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
type IndiaBoundary = {
  id: string;
  name: string;
  isoCode: string | null;
  geometry: GeoJSON.Geometry;
};
type IndiaLocality = {
  id: string;
  name: string;
  asciiName: string;
  latitude: number;
  longitude: number;
  featureCode: string;
  admin1Code: string | null;
  admin2Code: string | null;
  population: number;
  modificationDate: string | null;
};
type IndiaGeography = {
  releaseId: string;
  generatedAt: string;
  jurisdiction: { isoAlpha2: string; isoAlpha3: string; label: string };
  layers: {
    adm1: {
      label: string;
      source: GeographySource;
      features: IndiaBoundary[];
      precisionNotice: string;
    };
    adm2: {
      label: string;
      source: GeographySource;
      features: IndiaBoundary[];
      precisionNotice: string;
    };
    localities: {
      label: string;
      source: GeographySource;
      records: IndiaLocality[];
      precisionNotice: string;
    };
  };
};
type IndiaTileLayer = {
  tileZoom: number;
  count: number;
  tileCount: number;
  tiles: string[];
  label: string;
  source: GeographySource;
  precisionNotice: string;
};
type IndiaTileManifest = {
  format: "atlas-india-spatial-tiles-v1";
  releaseId: string;
  generatedAt: string;
  jurisdiction: { isoAlpha2: string; isoAlpha3: string; label: string };
  baseUrl: string;
  layers: {
    adm1: IndiaTileLayer;
    adm2: IndiaTileLayer;
    localities: IndiaTileLayer;
  };
};
type IndiaTileRecord = {
  releaseId: string;
  layer: "adm1" | "adm2" | "localities";
  z: number;
  x: number;
  y: number;
  records: IndiaBoundary[] | IndiaLocality[];
};
type GeographySource = {
  publisher: string;
  sourceUrl: string;
  license: string;
  termsUrl?: string;
  extract?: string | null;
};
type GeoEntityKind = "country" | "adm1" | "adm2" | "locality";
type GeoSelection = {
  kind: GeoEntityKind;
  id: string;
  name: string;
  parentId: string | null;
  source: GeographySource;
  description: string;
  point: { x: number; y: number };
  population?: number;
  featureCode?: string;
};
type GeoSearchResult = {
  type: "geo";
  kind: Exclude<GeoEntityKind, "country">;
  id: string;
  name: string;
  parentId: string | null;
  point: { x: number; y: number };
  source: GeographySource;
  population?: number;
  featureCode?: string;
};

type HoverState = { id: string } | null;

const mapCollection = feature(
  worldTopology as never,
  (worldTopology as unknown as { objects: { countries: never } }).objects
    .countries
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const countryFeatures = mapCollection.features as MapFeature[];
// Keep the interaction effectively unbounded while remaining inside CSS/IEEE-754
// safety. The reference map reaches five-figure zoom values; this leaves room
// for many more gestures without allowing non-finite transforms.
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 1e7;
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
const INDIA_ID = "356";
const INDIA_ADM1_ZOOM = 2.4;
const INDIA_ADM2_ZOOM = 6.2;
const INDIA_LOCALITY_ZOOM = 10.2;
const longitudeToTileX = (longitude: number, zoom: number) =>
  clamp(Math.floor(((longitude + 180) / 360) * 2 ** zoom), 0, 2 ** zoom - 1);
const latitudeToTileY = (latitude: number, zoom: number) => {
  const phi = (clamp(latitude, -85.05112878, 85.05112878) * Math.PI) / 180;
  const normalized =
    (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2;
  return clamp(Math.floor(normalized * 2 ** zoom), 0, 2 ** zoom - 1);
};
const tileKeyParts = (key: string) => {
  const [z, x, y] = key.split("/").map(Number);
  return { z, x, y };
};
const tileKeysForViewport = (
  layer: IndiaTileLayer,
  bounds: [[number, number], [number, number]] | null
) => {
  if (!bounds) return [];
  const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] = bounds;
  const minX = longitudeToTileX(minLongitude, layer.tileZoom);
  const maxX = longitudeToTileX(maxLongitude, layer.tileZoom);
  const minY = latitudeToTileY(maxLatitude, layer.tileZoom);
  const maxY = latitudeToTileY(minLatitude, layer.tileZoom);
  return layer.tiles.filter(key => {
    const { x, y } = tileKeyParts(key);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  });
};
const mergeUniqueById = <T extends { id: string }>(
  current: T[],
  incoming: T[]
) => {
  const byId = new Map(current.map(item => [String(item.id), item]));
  incoming.forEach(item => byId.set(String(item.id), item));
  return Array.from(byId.values());
};
const geoKindLabel = (kind: GeoEntityKind) =>
  kind === "country"
    ? "Country"
    : kind === "adm1"
      ? "State / union territory"
      : kind === "adm2"
        ? "District"
        : "City / locality";
const normalizeD3Geometry = (geometry: GeoJSON.Geometry): GeoJSON.Geometry => {
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(ring => [...ring].reverse()),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(polygon =>
        polygon.map(ring => [...ring].reverse())
      ),
    };
  }
  if (geometry.type === "GeometryCollection") {
    return {
      ...geometry,
      geometries: geometry.geometries.map(normalizeD3Geometry),
    };
  }
  return geometry;
};
const boundaryToFeature = (boundary: IndiaBoundary): MapFeature => ({
  type: "Feature",
  id: boundary.id,
  properties: { name: boundary.name },
  geometry: normalizeD3Geometry(boundary.geometry),
});

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
  const wheelCommitRef = useRef<number | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointer: number; x: number; y: number } | null>(
    null
  );
  const indiaManifestRequestedRef = useRef(false);
  const indiaTileCacheRef = useRef(new Set<string>());
  const indiaTileWorkerRef = useRef<Worker | null>(null);
  const indiaTileWorkerRequestRef = useRef(0);
  const indiaTileWorkerPendingRef = useRef(new Map<number, string>());
  const [release, setRelease] = useState<WorldRelease | null>(null);
  const [indiaTileManifest, setIndiaTileManifest] =
    useState<IndiaTileManifest | null>(null);
  const [indiaAdm1Features, setIndiaAdm1Features] = useState<IndiaBoundary[]>(
    []
  );
  const [indiaAdm2Features, setIndiaAdm2Features] = useState<IndiaBoundary[]>(
    []
  );
  const [indiaLocalityRecords, setIndiaLocalityRecords] = useState<
    IndiaLocality[]
  >([]);
  const [indiaGeoError, setIndiaGeoError] = useState<string | null>(null);
  const [geoSelection, setGeoSelection] = useState<GeoSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previousSizeRef = useRef({ width: 1280, height: 760 });
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

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/indiaTileWorker.ts", import.meta.url),
      { type: "module" }
    );
    indiaTileWorkerRef.current = worker;
    worker.onmessage = (
      event: MessageEvent<{
        id: number;
        cacheKey: string;
        ok: boolean;
        tile?: IndiaTileRecord;
        error?: string;
      }>
    ) => {
      const { id, cacheKey, ok, tile, error: workerError } = event.data;
      indiaTileWorkerPendingRef.current.delete(id);
      if (!ok || !tile) {
        indiaTileCacheRef.current.delete(cacheKey);
        setIndiaGeoError(workerError ?? "India tile parsing failed");
        return;
      }
      if (tile.layer === "adm1")
        setIndiaAdm1Features(current =>
          mergeUniqueById(current, tile.records as IndiaBoundary[])
        );
      if (tile.layer === "adm2")
        setIndiaAdm2Features(current =>
          mergeUniqueById(current, tile.records as IndiaBoundary[])
        );
      if (tile.layer === "localities")
        setIndiaLocalityRecords(current =>
          mergeUniqueById(current, tile.records as IndiaLocality[])
        );
    };
    return () => {
      worker.terminate();
      indiaTileWorkerRef.current = null;
      indiaTileWorkerPendingRef.current.clear();
    };
  }, []);

  const cameraTransform = (next: Camera) =>
    `translate(${next.x - (size.width / 2) * next.k}px, ${next.y - (size.height / 2) * next.k}px) scale(${next.k})`;
  const writeCamera = (next: Camera) => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.transformOrigin = "0 0";
    scene.style.transform = cameraTransform(next);
  };
  const applyCamera = (next: Camera, commit = false) => {
    const current = cameraRef.current;
    const normalized: Camera = {
      k: clamp(
        Number.isFinite(next.k) ? next.k : current.k,
        MIN_ZOOM,
        MAX_ZOOM
      ),
      x: Number.isFinite(next.x) ? next.x : current.x,
      y: Number.isFinite(next.y) ? next.y : current.y,
    };
    cameraRef.current = normalized;
    // One compositor-owned scene contains both SVG geography and Canvas2D
    // semantics. React/Lod work waits for the gesture commit.
    writeCamera(normalized);
    if (commit) setCamera(normalized);
  };
  const commitCamera = () => setCamera(cameraRef.current);

  useEffect(() => {
    cameraRef.current = camera;
    writeCamera(camera);
  }, [camera, size.height, size.width]);

  useEffect(
    () => () => {
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
    const previous = previousSizeRef.current;
    if (previous.width === size.width && previous.height === size.height)
      return;
    previousSizeRef.current = size;
    const current = cameraRef.current;
    const next = {
      ...current,
      x: current.x + ((size.width - previous.width) / 2) * current.k,
      y: current.y + ((size.height - previous.height) / 2) * current.k,
    };
    applyCamera(next, true);
  }, [size]);

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
  const indiaNode = nodeById.get(INDIA_ID) ?? null;
  const indiaGeography = useMemo<IndiaGeography | null>(() => {
    if (!indiaTileManifest) return null;
    return {
      releaseId: indiaTileManifest.releaseId,
      generatedAt: indiaTileManifest.generatedAt,
      jurisdiction: indiaTileManifest.jurisdiction,
      layers: {
        adm1: {
          label: indiaTileManifest.layers.adm1.label,
          source: indiaTileManifest.layers.adm1.source,
          features: indiaAdm1Features,
          precisionNotice: indiaTileManifest.layers.adm1.precisionNotice,
        },
        adm2: {
          label: indiaTileManifest.layers.adm2.label,
          source: indiaTileManifest.layers.adm2.source,
          features: indiaAdm2Features,
          precisionNotice: indiaTileManifest.layers.adm2.precisionNotice,
        },
        localities: {
          label: indiaTileManifest.layers.localities.label,
          source: indiaTileManifest.layers.localities.source,
          records: indiaLocalityRecords,
          precisionNotice: indiaTileManifest.layers.localities.precisionNotice,
        },
      },
    };
  }, [
    indiaAdm1Features,
    indiaAdm2Features,
    indiaLocalityRecords,
    indiaTileManifest,
  ]);
  const indiaAdm2ParentById = useMemo(() => {
    if (!indiaAdm1Features.length || !indiaAdm2Features.length)
      return new Map<string, string | null>();
    return new Map(
      indiaAdm2Features.map(district => {
        const [longitude, latitude] = geoCentroid(boundaryToFeature(district));
        const parent = indiaAdm1Features.find(state =>
          geoContains(boundaryToFeature(state), [longitude, latitude])
        );
        return [
          district.id ? String(district.id) : "",
          parent?.id ? String(parent.id) : null,
        ] as const;
      })
    );
  }, [indiaAdm1Features, indiaAdm2Features]);
  const indiaLocalityPoints = useMemo(
    () =>
      indiaLocalityRecords.flatMap(record => {
        const point = projection([record.longitude, record.latitude]);
        if (!point || !point.every(Number.isFinite)) return [];
        return [{ record, x: point[0], y: point[1] }];
      }),
    [indiaLocalityRecords, projection]
  );
  const indiaInView = useMemo(() => {
    if (!indiaNode) return false;
    const screenX = camera.x + (indiaNode.x - size.width / 2) * camera.k;
    const screenY = camera.y + (indiaNode.y - size.height / 2) * camera.k;
    return (
      screenX >= -size.width * 0.45 &&
      screenX <= size.width * 1.45 &&
      screenY >= 54 - size.height * 0.45 &&
      screenY <= size.height * 1.45
    );
  }, [camera, indiaNode, size.height, size.width]);
  const viewportGeoBounds = useMemo(() => {
    const inverse = projection.invert;
    if (!inverse) return null;
    const points = [
      [0, 54],
      [size.width, 54],
      [0, size.height],
      [size.width, size.height],
    ].map(([screenX, screenY]) =>
      inverse([
        size.width / 2 + (screenX - camera.x) / camera.k,
        size.height / 2 + (screenY - camera.y) / camera.k,
      ])
    );
    const valid = points.filter((point): point is [number, number] => {
      if (!point) return false;
      return point.every(value => Number.isFinite(value));
    });
    if (!valid.length) return null;
    return [
      [
        Math.min(...valid.map(point => point[0])),
        Math.min(...valid.map(point => point[1])),
      ],
      [
        Math.max(...valid.map(point => point[0])),
        Math.max(...valid.map(point => point[1])),
      ],
    ] as [[number, number], [number, number]];
  }, [camera, projection, size.height, size.width]);
  useEffect(() => {
    if (!indiaNode) return;
    const screenX = camera.x + (indiaNode.x - size.width / 2) * camera.k;
    const screenY = camera.y + (indiaNode.y - size.height / 2) * camera.k;
    const nearViewport =
      camera.k >= 1.45 &&
      screenX >= -size.width * 0.35 &&
      screenX <= size.width * 1.35 &&
      screenY >= -size.height * 0.35 &&
      screenY <= size.height * 1.35;
    if (!nearViewport) return;
    if (!indiaTileManifest && !indiaManifestRequestedRef.current) {
      indiaManifestRequestedRef.current = true;
      fetch("/data/india-tiles/manifest.json")
        .then(response => {
          if (!response.ok) throw new Error("India tile manifest unavailable");
          return response.json() as Promise<IndiaTileManifest>;
        })
        .then(setIndiaTileManifest)
        .catch((cause: Error) => setIndiaGeoError(cause.message));
      return;
    }
    if (!indiaTileManifest || !viewportGeoBounds) return;
    const requests: ["adm1" | "adm2" | "localities", string][] = [];
    if (camera.k >= INDIA_ADM1_ZOOM)
      tileKeysForViewport(
        indiaTileManifest.layers.adm1,
        viewportGeoBounds
      ).forEach(key => requests.push(["adm1", key]));
    if (camera.k >= 4.6)
      tileKeysForViewport(
        indiaTileManifest.layers.adm2,
        viewportGeoBounds
      ).forEach(key => requests.push(["adm2", key]));
    if (camera.k >= 8.2)
      tileKeysForViewport(
        indiaTileManifest.layers.localities,
        viewportGeoBounds
      ).forEach(key => requests.push(["localities", key]));
    requests.forEach(([layer, key]) => {
      const cacheKey = `${layer}:${key}`;
      if (indiaTileCacheRef.current.has(cacheKey)) return;
      indiaTileCacheRef.current.add(cacheKey);
      const { x, y } = tileKeyParts(key);
      const worker = indiaTileWorkerRef.current;
      if (!worker) {
        indiaTileCacheRef.current.delete(cacheKey);
        setIndiaGeoError("India tile worker unavailable");
        return;
      }
      const requestId = indiaTileWorkerRequestRef.current + 1;
      indiaTileWorkerRequestRef.current = requestId;
      indiaTileWorkerPendingRef.current.set(requestId, cacheKey);
      worker.postMessage({
        id: requestId,
        cacheKey,
        url: `${indiaTileManifest.baseUrl}/${layer}/${x}-${y}.json`,
      });
    });
  }, [
    camera,
    indiaNode,
    indiaTileManifest,
    projection,
    size.height,
    size.width,
    viewportGeoBounds,
  ]);
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
  const nodeBudget =
    camera.k < 1.2
      ? 140
      : camera.k < 2.8
        ? 220
        : Math.min(nodes.length, camera.k < 6 ? 600 : 1200);
  const visibleNodes = useMemo(() => {
    if (nearbyMode) return nodes.filter(node => nearbyIds.has(node.id));
    const viewportNodes = nodes.filter(node => {
      if (node.id === selectedId) return true;
      const screenX = camera.x + (node.x - size.width / 2) * camera.k;
      const screenY = camera.y + (node.y - size.height / 2) * camera.k;
      return (
        screenX >= -100 &&
        screenX <= size.width + 100 &&
        screenY >= -100 &&
        screenY <= size.height + 100
      );
    });
    return [...viewportNodes]
      .sort((a, b) => {
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
        return (b.total ?? -1) - (a.total ?? -1);
      })
      .slice(0, nodeBudget);
  }, [
    camera.k,
    camera.x,
    camera.y,
    nearbyIds,
    nearbyMode,
    nodeBudget,
    nodes,
    selectedId,
    size.height,
    size.width,
  ]);
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
  const countryLabelIds = useMemo(() => {
    const labels = new Set<string>();
    if (camera.k > 2.45) return labels;
    const boxes: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    const candidates = [...nodes]
      .sort((a, b) => (b.total ?? -1) - (a.total ?? -1))
      .slice(0, camera.k < 1.35 ? 52 : 36);
    candidates.forEach(node => {
      const screenX = camera.x + (node.x - size.width / 2) * camera.k;
      const screenY = camera.y + (node.y - size.height / 2) * camera.k;
      const width = clamp(node.name.length * 5.2 + 12, 28, 118);
      const height = 18;
      const box = {
        left: screenX - width / 2,
        top: screenY - height / 2,
        right: screenX + width / 2,
        bottom: screenY + height / 2,
      };
      if (
        box.right < -24 ||
        box.left > size.width + 24 ||
        box.bottom < 58 ||
        box.top > size.height + 24
      )
        return;
      if (
        boxes.some(
          other =>
            box.left < other.right &&
            box.right > other.left &&
            box.top < other.bottom &&
            box.bottom > other.top
        )
      )
        return;
      labels.add(node.id);
      boxes.push(box);
    });
    return labels;
  }, [camera, nodes, size.height, size.width]);
  const indiaAdm1Render = useMemo(
    () =>
      indiaAdm1Features.flatMap(boundary => {
        const feature = boundaryToFeature(boundary);
        const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] =
          geoBounds(feature);
        const point = projection([
          (minLongitude + maxLongitude) / 2,
          (minLatitude + maxLatitude) / 2,
        ]);
        const d = pathMaker(feature) ?? "";
        if (!d || !point || !point.every(Number.isFinite)) return [];
        return [{ boundary, d, x: point[0], y: point[1] }];
      }),
    [indiaAdm1Features, pathMaker, projection]
  );
  const indiaAdm2Render = useMemo(
    () =>
      indiaAdm2Features.flatMap(boundary => {
        const feature = boundaryToFeature(boundary);
        const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] =
          geoBounds(feature);
        const point = projection([
          (minLongitude + maxLongitude) / 2,
          (minLatitude + maxLatitude) / 2,
        ]);
        const d = pathMaker(feature) ?? "";
        if (!d || !point || !point.every(Number.isFinite)) return [];
        return [{ boundary, d, x: point[0], y: point[1] }];
      }),
    [indiaAdm2Features, pathMaker, projection]
  );
  const indiaAdm1LabelIds = useMemo(() => {
    const labels = new Set<string>();
    if (camera.k < 1.95 || camera.k > 7.8) return labels;
    const boxes: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    for (const item of indiaAdm1Render) {
      const screenX = camera.x + (item.x - size.width / 2) * camera.k;
      const screenY = camera.y + (item.y - size.height / 2) * camera.k;
      const width = clamp(item.boundary.name.length * 5.4 + 12, 48, 142);
      const height = 18;
      const box = {
        left: screenX - width / 2,
        top: screenY - height / 2,
        right: screenX + width / 2,
        bottom: screenY + height / 2,
      };
      if (
        box.right < -20 ||
        box.left > size.width + 20 ||
        box.bottom < 58 ||
        box.top > size.height + 20
      )
        continue;
      if (
        boxes.some(
          other =>
            box.left < other.right &&
            box.right > other.left &&
            box.top < other.bottom &&
            box.bottom > other.top
        )
      )
        continue;
      labels.add(item.boundary.id);
      boxes.push(box);
    }
    return labels;
  }, [camera, indiaAdm1Render, size.height, size.width]);
  const visibleIndiaAdm2 = useMemo(() => {
    if (camera.k < 4.9) return [];
    const candidates = indiaAdm2Render.filter(item => {
      const screenX = camera.x + (item.x - size.width / 2) * camera.k;
      const screenY = camera.y + (item.y - size.height / 2) * camera.k;
      return (
        screenX >= -120 &&
        screenX <= size.width + 120 &&
        screenY >= 54 &&
        screenY <= size.height + 120
      );
    });
    const budget = camera.k < 7.5 ? 260 : camera.k < 11 ? 620 : 1100;
    return candidates
      .sort(
        (a, b) =>
          (a.boundary.id === geoSelection?.id ? -1 : 0) -
          (b.boundary.id === geoSelection?.id ? -1 : 0)
      )
      .slice(0, budget);
  }, [camera, geoSelection?.id, indiaAdm2Render, size.height, size.width]);
  const indiaAdm2LabelIds = useMemo(() => {
    const labels = new Set<string>();
    if (camera.k < 6.4) return labels;
    const boxes: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    const budget = camera.k < 9.5 ? 54 : 150;
    for (const item of visibleIndiaAdm2.slice(0, budget * 2)) {
      const screenX = camera.x + (item.x - size.width / 2) * camera.k;
      const screenY = camera.y + (item.y - size.height / 2) * camera.k;
      const width = clamp(item.boundary.name.length * 4.8 + 10, 34, 112);
      const height = 15;
      const box = {
        left: screenX - width / 2,
        top: screenY - height / 2,
        right: screenX + width / 2,
        bottom: screenY + height / 2,
      };
      if (
        box.right < -12 ||
        box.left > size.width + 12 ||
        box.bottom < 58 ||
        box.top > size.height + 12
      )
        continue;
      if (
        boxes.some(
          other =>
            box.left < other.right &&
            box.right > other.left &&
            box.top < other.bottom &&
            box.bottom > other.top
        )
      )
        continue;
      labels.add(item.boundary.id);
      boxes.push(box);
      if (labels.size >= budget) break;
    }
    return labels;
  }, [camera, size.height, size.width, visibleIndiaAdm2]);
  const visibleIndiaLocalities = useMemo(() => {
    if (camera.k < 8.9) return [];
    const candidates = indiaLocalityPoints.filter(item => {
      const screenX = camera.x + (item.x - size.width / 2) * camera.k;
      const screenY = camera.y + (item.y - size.height / 2) * camera.k;
      return (
        screenX >= -80 &&
        screenX <= size.width + 80 &&
        screenY >= 54 &&
        screenY <= size.height + 80
      );
    });
    const budget = camera.k < 12 ? 420 : camera.k < 20 ? 900 : 1500;
    return candidates
      .sort((a, b) => b.record.population - a.record.population)
      .slice(0, budget);
  }, [camera, indiaLocalityPoints, size.height, size.width]);
  const indiaLocalityLabelIds = useMemo(() => {
    const labels = new Set<string>();
    if (camera.k < 12) return labels;
    const boxes: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    for (const item of visibleIndiaLocalities) {
      const screenX = camera.x + (item.x - size.width / 2) * camera.k;
      const screenY = camera.y + (item.y - size.height / 2) * camera.k;
      const width = clamp(item.record.name.length * 4.6 + 10, 36, 120);
      const height = 15;
      const box = {
        left: screenX + 5,
        top: screenY - height / 2,
        right: screenX + 5 + width,
        bottom: screenY + height / 2,
      };
      if (
        box.right < -12 ||
        box.left > size.width + 12 ||
        box.bottom < 58 ||
        box.top > size.height + 12
      )
        continue;
      if (
        boxes.some(
          other =>
            box.left < other.right &&
            box.right > other.left &&
            box.top < other.bottom &&
            box.bottom > other.top
        )
      )
        continue;
      labels.add(item.record.id);
      boxes.push(box);
      if (labels.size >= (camera.k < 18 ? 90 : 180)) break;
    }
    return labels;
  }, [camera, size.height, size.width, visibleIndiaLocalities]);
  const geoMatches = useMemo<GeoSearchResult[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!indiaGeography || needle.length < 2) return [];
    const stateResults: GeoSearchResult[] = indiaAdm1Render
      .filter(item => item.boundary.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .map(item => ({
        type: "geo",
        kind: "adm1",
        id: item.boundary.id,
        name: item.boundary.name,
        parentId: INDIA_ID,
        point: { x: item.x, y: item.y },
        source: indiaGeography.layers.adm1.source,
      }));
    const districtResults: GeoSearchResult[] = indiaAdm2Render
      .filter(item => item.boundary.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .map(item => ({
        type: "geo",
        kind: "adm2",
        id: item.boundary.id,
        name: item.boundary.name,
        parentId: indiaAdm2ParentById.get(item.boundary.id) ?? INDIA_ID,
        point: { x: item.x, y: item.y },
        source: indiaGeography.layers.adm2.source,
      }));
    const localityResults: GeoSearchResult[] = indiaLocalityPoints
      .filter(item =>
        `${item.record.name} ${item.record.asciiName}`
          .toLowerCase()
          .includes(needle)
      )
      .sort((a, b) => b.record.population - a.record.population)
      .slice(0, 4)
      .map(item => ({
        type: "geo",
        kind: "locality",
        id: item.record.id,
        name: item.record.name,
        parentId: item.record.admin2Code ?? item.record.admin1Code ?? INDIA_ID,
        point: { x: item.x, y: item.y },
        source: indiaGeography.layers.localities.source,
        population: item.record.population,
        featureCode: item.record.featureCode,
      }));
    return [...stateResults, ...districtResults, ...localityResults].slice(
      0,
      8
    );
  }, [
    indiaAdm1Render,
    indiaAdm2ParentById,
    indiaAdm2Render,
    indiaGeography,
    indiaLocalityPoints,
    query,
  ]);

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
    setGeoSelection(null);
    setSelectedId(node.id);
    setQuery("");
    setShowResults(false);
    const next = {
      k: zoom,
      x: size.width / 2 - (node.x - size.width / 2) * zoom,
      y: size.height / 2 - (node.y - size.height / 2) * zoom,
    };
    applyCamera(next, true);
  };
  const focusGeoPoint = (point: { x: number; y: number }, zoom: number) => {
    const nextK = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    const next = {
      k: nextK,
      x: size.width / 2 - (point.x - size.width / 2) * nextK,
      y: size.height / 2 - (point.y - size.height / 2) * nextK,
    };
    applyCamera(next, true);
  };
  const selectGeoEntity = (
    kind: Exclude<GeoEntityKind, "country">,
    id: string,
    name: string,
    point: { x: number; y: number },
    source: GeographySource,
    parentId: string | null,
    details: { population?: number; featureCode?: string } = {}
  ) => {
    setSelectedId(INDIA_ID);
    setGeoSelection({
      kind,
      id,
      name,
      parentId,
      source,
      description:
        kind === "adm1"
          ? "Administrative reference geometry for an Indian state or union territory."
          : kind === "adm2"
            ? "Administrative reference geometry for an Indian district."
            : "GeoNames place reference; this point does not assert organization location or activity.",
      point,
      ...details,
    });
    setQuery("");
    setShowResults(false);
    focusGeoPoint(point, kind === "adm1" ? 4.1 : kind === "adm2" ? 7.2 : 12.5);
  };
  const focusGeoResult = (result: GeoSearchResult) => {
    selectGeoEntity(
      result.kind,
      result.id,
      result.name,
      result.point,
      result.source,
      result.parentId,
      { population: result.population, featureCode: result.featureCode }
    );
  };
  const goToGeoParent = () => {
    if (!geoSelection || !indiaGeography) return;
    if (geoSelection.kind === "adm1" || geoSelection.parentId === INDIA_ID) {
      setGeoSelection(null);
      if (indiaNode) focusNode(indiaNode, 3.8);
      return;
    }
    const parent = indiaAdm1Render.find(
      item => item.boundary.id === geoSelection.parentId
    );
    if (parent) {
      selectGeoEntity(
        "adm1",
        parent.boundary.id,
        parent.boundary.name,
        { x: parent.x, y: parent.y },
        indiaGeography.layers.adm1.source,
        INDIA_ID
      );
      return;
    }
    setGeoSelection(null);
  };
  const reset = () => {
    setGeoSelection(null);
    const next = { x: size.width / 2, y: size.height / 2, k: 1 };
    applyCamera(next, true);
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
    setGeoSelection(null);
    setNearbyMode(false);
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
  const pickSemanticEntity = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scenePoint: [number, number] = [
      (event.clientX - rect.left - camera.x) / camera.k + size.width / 2,
      (event.clientY - rect.top - camera.y) / camera.k + size.height / 2,
    ];
    const geographicPoint = projection.invert?.(scenePoint);
    if (!geographicPoint) return false;
    if (showIndiaLocalities) {
      const hitRadius = 18 / camera.k;
      const nearest = visibleIndiaLocalities
        .map(item => ({
          item,
          distance: Math.hypot(item.x - scenePoint[0], item.y - scenePoint[1]),
        }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest && nearest.distance <= hitRadius && indiaGeography) {
        const { item } = nearest;
        const [longitude, latitude] = [
          item.record.longitude,
          item.record.latitude,
        ];
        const parentDistrict = indiaAdm2Features.find(boundary =>
          geoContains(boundaryToFeature(boundary), [longitude, latitude])
        );
        selectGeoEntity(
          "locality",
          item.record.id,
          item.record.name,
          { x: item.x, y: item.y },
          indiaGeography.layers.localities.source,
          parentDistrict?.id ??
            item.record.admin2Code ??
            item.record.admin1Code ??
            INDIA_ID,
          {
            population: item.record.population,
            featureCode: item.record.featureCode,
          }
        );
        return true;
      }
    }
    if (showIndiaAdm2 && indiaGeography) {
      const district = visibleIndiaAdm2.find(item =>
        geoContains(boundaryToFeature(item.boundary), geographicPoint)
      );
      if (district) {
        selectGeoEntity(
          "adm2",
          district.boundary.id,
          district.boundary.name,
          { x: district.x, y: district.y },
          indiaGeography.layers.adm2.source,
          indiaAdm2ParentById.get(district.boundary.id) ?? INDIA_ID
        );
        return true;
      }
    }
    if (showIndiaAdm1 && indiaGeography) {
      const state = indiaAdm1Render.find(item =>
        geoContains(boundaryToFeature(item.boundary), geographicPoint)
      );
      if (state) {
        selectGeoEntity(
          "adm1",
          state.boundary.id,
          state.boundary.name,
          { x: state.x, y: state.y },
          indiaGeography.layers.adm1.source,
          INDIA_ID
        );
        return true;
      }
    }
    return false;
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
      if (pickSemanticEntity(event)) {
        suppressClickUntilRef.current = now + 260;
        lastTapRef.current = null;
        return;
      }
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
  const indiaContextActive = selectedId === INDIA_ID || Boolean(geoSelection);
  const showIndiaHierarchy = Boolean(
    indiaGeography && (indiaInView || indiaContextActive) && camera.k >= 1.85
  );
  const showCountryFieldMarkers = !(showIndiaHierarchy && camera.k >= 2.15);
  const showIndiaAdm1 = showIndiaHierarchy && camera.k >= 1.85;
  const showIndiaAdm2 = showIndiaHierarchy && camera.k >= 4.8;
  const showIndiaLocalities = showIndiaHierarchy && camera.k >= 8.9;
  const geoParentLabel = geoSelection?.parentId
    ? (indiaAdm1Features.find(item => item.id === geoSelection.parentId)
        ?.name ??
      indiaAdm2Features.find(item => item.id === geoSelection.parentId)?.name ??
      null)
    : null;
  const currentGeoLevel = geoSelection
    ? geoKindLabel(geoSelection.kind)
    : camera.k >= INDIA_LOCALITY_ZOOM
      ? "City / locality"
      : camera.k >= INDIA_ADM2_ZOOM
        ? "District"
        : camera.k >= INDIA_ADM1_ZOOM
          ? "State / union territory"
          : "Country overview";
  const semanticAdm1 = useMemo<SemanticBoundary[]>(() => {
    if (!showIndiaAdm1) return [];
    return indiaAdm1Render.map(item => ({
      id: item.boundary.id,
      name: item.boundary.name,
      d: item.d,
      x: item.x,
      y: item.y,
      kind: "adm1",
      opacity:
        camera.k < 2.25
          ? clamp((camera.k - 1.85) / 0.4, 0, 0.96)
          : camera.k < 6.8
            ? 0.96
            : Math.max(0.18, 1 - (camera.k - 6.8) / 1.4),
      selected:
        geoSelection?.kind === "adm1" && geoSelection.id === item.boundary.id,
      label: indiaAdm1LabelIds.has(item.boundary.id),
    }));
  }, [
    camera.k,
    geoSelection,
    indiaAdm1LabelIds,
    indiaAdm1Render,
    showIndiaAdm1,
  ]);
  const semanticAdm2 = useMemo<SemanticBoundary[]>(() => {
    if (!showIndiaAdm2) return [];
    return visibleIndiaAdm2.map(item => ({
      id: item.boundary.id,
      name: item.boundary.name,
      d: item.d,
      x: item.x,
      y: item.y,
      kind: "adm2",
      opacity:
        camera.k < 5.8
          ? clamp((camera.k - 4.8) / 1, 0, 0.82)
          : camera.k < 12
            ? 0.82
            : Math.max(0.16, 1 - (camera.k - 12) / 8),
      selected:
        geoSelection?.kind === "adm2" && geoSelection.id === item.boundary.id,
      label: indiaAdm2LabelIds.has(item.boundary.id),
    }));
  }, [
    camera.k,
    geoSelection,
    indiaAdm2LabelIds,
    showIndiaAdm2,
    visibleIndiaAdm2,
  ]);
  const semanticLocalities = useMemo<SemanticLocality[]>(() => {
    if (!showIndiaLocalities) return [];
    return visibleIndiaLocalities.map(item => ({
      id: item.record.id,
      name: item.record.name,
      x: item.x,
      y: item.y,
      population: item.record.population,
      selected:
        geoSelection?.kind === "locality" && geoSelection.id === item.record.id,
      label: indiaLocalityLabelIds.has(item.record.id),
    }));
  }, [
    geoSelection,
    indiaLocalityLabelIds,
    showIndiaLocalities,
    visibleIndiaLocalities,
  ]);
  const worldDevicePixelRatio =
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
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
      <div
        ref={sceneRef}
        className="absolute left-0 top-0 h-full w-full will-change-transform"
        style={{
          backgroundColor: "#08111d",
          backgroundImage:
            "linear-gradient(rgba(41,68,94,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(41,68,94,.18) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      >
        <svg
          className="absolute left-0 top-0 h-full w-full touch-none"
          role="img"
          aria-label="Interactive source-backed world map"
          viewBox={`0 0 ${size.width} ${size.height}`}
        >
          <defs>
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
          <g>
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
                  fill={
                    isSelected ? "#263c5c" : visible ? "#10263a" : "#0a1624"
                  }
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
            {countryLabelIds.size > 0 &&
              nodes.map(node => {
                if (!countryLabelIds.has(node.id)) return null;
                const labelSize =
                  clamp(16 + Math.log2(Math.max(1, camera.k)) * 5, 16, 34) /
                  camera.k;
                return (
                  <text
                    key={`country-label-${node.id}`}
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={labelSize}
                    fontWeight={700}
                    fill="#c5e8e1"
                    opacity={clamp(
                      1.1 - Math.max(0, camera.k - 1) * 0.42,
                      0.12,
                      1
                    )}
                    pointerEvents="none"
                    style={{
                      paintOrder: "stroke",
                      stroke: "#08111d",
                      strokeWidth: 3 / camera.k,
                    }}
                  >
                    {shortText(node.name, 20)}
                  </text>
                );
              })}
            {showCountryFieldMarkers &&
              visibleNodes.map((node, index) => {
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
        <WorldSemanticCanvas
          cameraK={camera.k}
          width={size.width}
          height={size.height}
          dpr={worldDevicePixelRatio}
          adm1={semanticAdm1}
          adm2={semanticAdm2}
          localities={semanticLocalities}
        />
      </div>

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
            {nearbyMode ? "nearby fields" : currentGeoLevel.toLowerCase()}
          </span>
          {selected && !geoSelection && (
            <>
              <span className="text-[#526b84]">/</span>
              <span className="max-w-[190px] truncate font-mono text-[9px] uppercase tracking-[.14em] text-[#ffbf69]">
                {selected.name}
              </span>
            </>
          )}
          {geoSelection && (
            <>
              <span className="text-[#526b84]">/</span>
              <span className="max-w-[210px] truncate font-mono text-[9px] uppercase tracking-[.14em] text-[#ffbf69]">
                India / {geoSelection.name}
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
          Drag to roam. Zoom at the cursor. Country labels give way to India’s
          sourced states, districts, and GeoNames place references as scale
          increases. The global map stays country-level where subnational
          coverage is unavailable.
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
            <span className="mr-2 text-[#9babc0]">03</span>India drill-down:
            state → district → city
          </p>
          <p>
            <span className="mr-2 text-[#9babc0]">04</span>Every geographic
            point opens its source boundary
          </p>
          {indiaGeoError && (
            <p className="text-[#efb0a2]">
              India detail source unavailable in this session.
            </p>
          )}
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
              if (event.key !== "Enter") return;
              if (geoMatches[0]) focusGeoResult(geoMatches[0]);
              else if (matches[0]) focusNode(matches[0]);
            }}
            placeholder="Find a country, state, district, or city…"
            className="w-full rounded-xl border border-[#35536f] bg-[#0b1a2a]/96 py-3 pl-11 pr-4 text-sm text-[#e8f2f5] shadow-2xl shadow-black/25 outline-none transition placeholder:text-[#738aa0] focus:border-[#45d7c0] focus:ring-4 focus:ring-[#45d7c0]/10"
          />
          {showResults && query && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 max-h-72 overflow-auto rounded-xl border border-[#35536f] bg-[#0b1a2a] p-2 shadow-2xl">
              <div className="px-3 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#7189a0]">
                {geoMatches.length
                  ? "Sourced geographic entities"
                  : "Country fields"}
              </div>
              {geoMatches.map(result => (
                <button
                  key={`${result.kind}-${result.id}`}
                  type="button"
                  onClick={() => focusGeoResult(result)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#122b40]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#e6f3f2]">
                      {result.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[.12em] text-[#7991a6]">
                      {geoKindLabel(result.kind)} ·{" "}
                      {result.population != null
                        ? `${formatNumber(result.population)} population reference`
                        : "India source layer"}
                    </span>
                  </span>
                  <ChevronLeft className="h-4 w-4 rotate-180 text-[#45d7c0]" />
                </button>
              ))}
              {matches.map(node => (
                <button
                  key={`country-${node.id}`}
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
              ))}
              {!geoMatches.length && !matches.length && (
                <p className="px-3 py-4 text-sm text-[#9ab0c3]">
                  No sourced country or India geographic entity matches that
                  search.
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
            {nodes.length} country fields
            {indiaGeography
              ? ` · ${indiaGeography.layers.adm1.features.length} states · ${indiaGeography.layers.adm2.features.length} districts`
              : ""}
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

      {geoSelection && (
        <aside
          data-world-overlay
          className="absolute bottom-0 left-0 right-0 top-0 z-40 flex w-full flex-col overflow-hidden rounded-none sm:bottom-4 sm:left-auto sm:right-4 sm:top-4 sm:w-[min(410px,calc(100vw-2rem))] sm:rounded-2xl border border-[#35536f] bg-[#0b1a2a]/97 shadow-2xl shadow-black/40 backdrop-blur-xl sm:right-16"
          onPointerDown={event => event.stopPropagation()}
          onWheel={event => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[#203b54] px-4 py-3 pb-[max(.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4">
            <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#8fa7bc]">
              Geographic entity inspector
            </span>
            <button
              type="button"
              onClick={() => setGeoSelection(null)}
              className="rounded-md p-1.5 text-[#8da4b8] hover:bg-[#122b40] hover:text-white"
              aria-label="Close geographic inspector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#ffbf69]">
                <span className="h-2 w-2 rounded-full bg-[#ffbf69]" />
                {geoKindLabel(geoSelection.kind)}
              </div>
              <span className="rounded-full bg-[#122b40] px-2 py-1 font-mono text-[8px] uppercase tracking-[.13em] text-[#a1b6c8]">
                India source layer
              </span>
            </div>
            <h2 className="mt-4 font-display text-4xl leading-[.94] text-white">
              {geoSelection.name}
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#b4c4d5]">
              {geoSelection.description}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 border-y border-[#203b54] py-5">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8097ad]">
                  Current level
                </div>
                <div className="mt-1 text-sm font-semibold text-[#e6f3f2]">
                  {geoKindLabel(geoSelection.kind)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8097ad]">
                  Parent
                </div>
                <div className="mt-1 text-sm text-[#b4c4d5]">
                  {geoParentLabel ??
                    (geoSelection.parentId === INDIA_ID
                      ? "India"
                      : "Source code")}
                </div>
              </div>
            </div>
            {geoSelection.population != null && (
              <div className="mt-5 rounded-xl border border-[#294761] bg-[#0d2234] p-4">
                <div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8097ad]">
                  GeoNames population reference
                </div>
                <div className="mt-1 font-display text-3xl text-[#e6f3f2]">
                  {formatNumber(geoSelection.population)}
                </div>
                {geoSelection.featureCode && (
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#7890a7]">
                    Feature code · {geoSelection.featureCode}
                  </div>
                )}
              </div>
            )}
            <p className="mt-5 border-l-2 border-[#ffbf69] pl-3 text-sm leading-6 text-[#efcf9f]">
              This layer describes a geographic reference, not a count of
              businesses, startups, jobs, or entity activity.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={goToGeoParent}
                className="flex items-center gap-2 rounded-xl border border-[#685031] bg-[#221c14] px-4 py-3 text-left text-sm font-semibold text-[#f3d49f] hover:border-[#ffbf69]"
              >
                <ChevronLeft className="h-4 w-4" /> Back to parent level
              </button>
              <button
                type="button"
                onClick={() => setGeoSelection(null)}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-xs text-[#9cb1c3] hover:bg-[#122b40] hover:text-white"
              >
                <X className="h-4 w-4" /> Close inspector
              </button>
            </div>
            <a
              href={geoSelection.source.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 flex items-center gap-2 border-t border-[#203b54] pt-5 font-mono text-[9px] uppercase tracking-[.12em] text-[#45d7c0] hover:text-[#b7fff0]"
            >
              Open {geoSelection.source.publisher} source{" "}
              <ExternalLink className="ml-auto h-3.5 w-3.5" />
            </a>
          </div>
        </aside>
      )}
      {selected && !geoSelection && (
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
              onClick={() => {
                setSelectedId(null);
                setGeoSelection(null);
              }}
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
