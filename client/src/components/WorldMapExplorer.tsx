import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { feature } from "topojson-client";
import {
  geoBounds,
  geoCentroid,
  geoDistance,
  geoContains,
  geoNaturalEarth1,
  geoPath,
} from "d3-geo";
import worldTopology from "world-atlas/countries-50m.json";
import { type SemanticBoundary, type SemanticLocality } from "@/lib/worldSemanticTypes";
import type { GlobalMvtManifest } from "@/lib/worldMvt";
import MapLibreWorldScene, {
  type MapLibreWorldSceneHandle,
} from "./MapLibreWorldScene";
import {
  ChevronLeft,
  Copy,
  Crosshair,
  ExternalLink,
  LocateFixed,
  Map as MapIcon,
  RotateCw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type Camera = { x: number; y: number; k: number };
type MapViewState = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  bounds: [[number, number], [number, number]];
};
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
  scope: "global" | "india";
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


const mapCollection = feature(
  worldTopology as never,
  (worldTopology as unknown as { objects: { countries: never } }).objects
    .countries
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const countryFeatures = mapCollection.features as MapFeature[];
const safeCountryLabelAnchor = (country: MapFeature): [number, number] | null => {
  try {
    const centroid = geoCentroid(country as GeoJSON.Feature);
    if (centroid.every(Number.isFinite) && geoContains(country as GeoJSON.Feature, centroid)) {
      return [centroid[0], centroid[1]];
    }
    const [[west, south], [east, north]] = geoBounds(country as GeoJSON.Feature);
    const wrappedEast = east < west ? east + 360 : east;
    const midpoint: [number, number] = [
      ((((west + wrappedEast) / 2 + 540) % 360) - 180),
      (south + north) / 2,
    ];
    if (midpoint.every(Number.isFinite) && geoContains(country as GeoJSON.Feature, midpoint)) {
      return midpoint;
    }
    return centroid.every(Number.isFinite) ? [centroid[0], centroid[1]] : null;
  } catch {
    return null;
  }
};
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
const GLOBAL_ADM1_MAP_ZOOM = 5;
const GLOBAL_ADM2_MAP_ZOOM = 7.2;
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
const selectionKindLabel = (selection: Pick<GeoSelection, "scope" | "kind">) =>
  selection.scope === "global"
    ? selection.kind === "adm1"
      ? "Administrative level 1"
      : selection.kind === "adm2"
        ? "Administrative level 2"
        : geoKindLabel(selection.kind)
    : geoKindLabel(selection.kind);
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

function geographicPointInBounds(
  longitude: number,
  latitude: number,
  bounds: [[number, number], [number, number]] | null | undefined
) {
  if (!bounds) return false;
  const [[west, south], [east, north]] = bounds;
  const longitudeVisible = west <= east
    ? longitude >= west && longitude <= east
    : longitude >= west || longitude <= east;
  return longitudeVisible && latitude >= south && latitude <= north;
}

export default function WorldMapExplorer() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);
  const cameraRef = useRef<Camera>({ x: 640, y: 380, k: 1 });
  const mapSceneRef = useRef<MapLibreWorldSceneHandle>(null);
  const mapViewRef = useRef<MapViewState | null>(null);
  const selectionCameraRef = useRef<MapViewState | null>(null);
  const indiaManifestRequestedRef = useRef(false);
  const indiaTileCacheRef = useRef(new Set<string>());
  const indiaTileWorkerRef = useRef<Worker | null>(null);
  const indiaTileWorkerRequestRef = useRef(0);
  const indiaTileWorkerPendingRef = useRef(new Map<number, string>());
  const indiaTileRetryAttemptsRef = useRef(new Map<string, number>());
  const indiaTileRetryTimersRef = useRef(new Map<string, number>());
  const indiaTileFailedRef = useRef(new Set<string>());
  const [release, setRelease] = useState<WorldRelease | null>(null);
  const [globalMvtManifest, setGlobalMvtManifest] = useState<GlobalMvtManifest | null>(null);
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
  const [indiaManifestLoading, setIndiaManifestLoading] = useState(false);
  const [indiaTilePendingCount, setIndiaTilePendingCount] = useState(0);
  const [indiaTileRetryNonce, setIndiaTileRetryNonce] = useState(0);
  const [geoSelection, setGeoSelection] = useState<GeoSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 1280, height: 760 });
  const [camera, setCamera] = useState<Camera>({ x: 640, y: 380, k: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapView, setMapView] = useState<{
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
    bounds: [[number, number], [number, number]];
    baseZoom?: number;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [spinEnabled, setSpinEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const initialMapView = useMemo<MapViewState | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (params.get("world") !== "1") return undefined;
    const lng = Number.parseFloat(params.get("wmlng") ?? "");
    const lat = Number.parseFloat(params.get("wmlat") ?? "");
    const zoom = Number.parseFloat(params.get("wmlz") ?? "");
    const bearing = Number.parseFloat(params.get("wmlb") ?? "");
    const pitch = Number.parseFloat(params.get("wmlp") ?? "");
    if ([lng, lat, zoom].every(Number.isFinite)) {
      return {
        center: [lng, lat],
        zoom,
        bearing: Number.isFinite(bearing) ? bearing : 0,
        pitch: Number.isFinite(pitch) ? pitch : 0,
        bounds: [[-180, -58], [180, 84]],
      };
    }
    const legacyK = Number.parseFloat(params.get("wxz") ?? "");
    if (Number.isFinite(legacyK)) {
      return {
        center: [0, 18],
        zoom: 1.25 + Math.log2(Math.max(0.2, legacyK)),
        bearing: 0,
        pitch: 0,
        bounds: [[-180, -58], [180, 84]],
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/data/world-mvt/manifest.json", { cache: "force-cache" })
      .then(response => response.ok ? response.json() as Promise<GlobalMvtManifest> : null)
      .then(manifest => {
        if (active && manifest?.format === "atlas-global-geoboundaries-mvt-v1") setGlobalMvtManifest(manifest);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(mediaQuery.matches);
      if (mediaQuery.matches) setSpinEnabled(false);
    };
    update();
    mediaQuery.addEventListener?.("change", update);
    return () => mediaQuery.removeEventListener?.("change", update);
  }, []);

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
      if (!indiaTileWorkerPendingRef.current.delete(id)) return;
      setIndiaTilePendingCount(current => Math.max(0, current - 1));
      if (!ok || !tile) {
        indiaTileCacheRef.current.delete(cacheKey);
        indiaTileFailedRef.current.add(cacheKey);
        setIndiaGeoError(workerError ?? "India tile parsing failed");
        const attempts =
          (indiaTileRetryAttemptsRef.current.get(cacheKey) ?? 0) + 1;
        indiaTileRetryAttemptsRef.current.set(cacheKey, attempts);
        if (attempts <= 3 && !indiaTileRetryTimersRef.current.has(cacheKey)) {
          const timer = window.setTimeout(
            () => {
              indiaTileRetryTimersRef.current.delete(cacheKey);
              indiaTileFailedRef.current.delete(cacheKey);
              setIndiaTileRetryNonce(current => current + 1);
            },
            Math.min(8000, 700 * 2 ** (attempts - 1))
          );
          indiaTileRetryTimersRef.current.set(cacheKey, timer);
        }
        return;
      }
      indiaTileFailedRef.current.delete(cacheKey);
      indiaTileRetryAttemptsRef.current.delete(cacheKey);
      if (!indiaTileFailedRef.current.size) setIndiaGeoError(null);
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
    worker.onerror = () => {
      indiaTileWorkerPendingRef.current.forEach(cacheKey =>
        indiaTileCacheRef.current.delete(cacheKey)
      );
      indiaTileWorkerPendingRef.current.clear();
      setIndiaTilePendingCount(0);
      setIndiaGeoError("India detail worker failed");
    };
    return () => {
      worker.terminate();
      indiaTileWorkerRef.current = null;
      indiaTileWorkerPendingRef.current.clear();
      indiaTileRetryTimersRef.current.forEach(timer =>
        window.clearTimeout(timer)
      );
      indiaTileRetryTimersRef.current.clear();
    };
  }, []);

  const mapViewCommitRef = useRef<number | null>(null);
  const mapViewPendingRef = useRef<typeof mapView>(null);
  const cameraFromMapView = (next: NonNullable<typeof mapView>): Camera => ({
    x: size.width / 2,
    y: size.height / 2,
    k: clamp(2 ** (next.zoom - 1.25), MIN_ZOOM, MAX_ZOOM),
  });
  const onMapViewChange = (next: NonNullable<typeof mapView>) => {
    cameraRef.current = cameraFromMapView(next);
    mapViewRef.current = next;
    mapViewPendingRef.current = next;
    if (mapViewCommitRef.current !== null)
      window.clearTimeout(mapViewCommitRef.current);
    mapViewCommitRef.current = window.setTimeout(() => {
      mapViewCommitRef.current = null;
      const pending = mapViewPendingRef.current;
      if (pending) {
        setMapView(pending);
        setCamera(cameraFromMapView(pending));
      }
    }, 120);
  };
  const rememberSelectionCamera = () => {
    if (!selectionCameraRef.current && mapViewRef.current)
      selectionCameraRef.current = { ...mapViewRef.current };
  };
  const closeInspector = () => {
    const previous = selectionCameraRef.current;
    selectionCameraRef.current = null;
    setSelectedId(null);
    setGeoSelection(null);
    setNearbyMode(false);
    if (previous) mapSceneRef.current?.setView(previous);
  };
  useEffect(
    () => () => {
      if (mapViewCommitRef.current !== null)
        window.clearTimeout(mapViewCommitRef.current);
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
    if (!mapView) return false;
    const angularDistance = geoDistance(mapView.center, [79, 23]) * (180 / Math.PI);
    const visibleRadius = mapView.zoom <= 2.8
      ? 55
      : mapView.zoom <= 3.8
        ? 38
        : mapView.zoom <= 4.8
          ? 25
          : mapView.zoom <= 6
            ? 17
            : 12;
    return angularDistance <= visibleRadius;
  }, [mapView]);
  const viewportGeoBounds = mapView?.bounds ?? null;
  useEffect(() => {
    if (!indiaNode || camera.k < 1.45 || !indiaInView) return;
    if (!indiaTileManifest && !indiaManifestRequestedRef.current) {
      indiaManifestRequestedRef.current = true;
      setIndiaManifestLoading(true);
      fetch("/data/india-tiles/manifest.json")
        .then(response => {
          if (!response.ok) throw new Error("India tile manifest unavailable");
          return response.json() as Promise<IndiaTileManifest>;
        })
        .then(setIndiaTileManifest)
        .catch((cause: Error) => {
          indiaManifestRequestedRef.current = false;
          setIndiaGeoError(cause.message);
        })
        .finally(() => setIndiaManifestLoading(false));
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
    const neededCacheKeys = new Set(
      requests.map(([layer, key]) => `${layer}:${key}`)
    );
    indiaTileWorkerPendingRef.current.forEach((cacheKey, requestId) => {
      if (neededCacheKeys.has(cacheKey)) return;
      indiaTileWorkerRef.current?.postMessage({
        type: "cancel",
        id: requestId,
        cacheKey,
      });
      indiaTileWorkerPendingRef.current.delete(requestId);
      indiaTileCacheRef.current.delete(cacheKey);
      setIndiaTilePendingCount(current => Math.max(0, current - 1));
    });
    requests.forEach(([layer, key]) => {
      const cacheKey = `${layer}:${key}`;
      if (indiaTileCacheRef.current.has(cacheKey)) return;
      indiaTileCacheRef.current.add(cacheKey);
      setIndiaTilePendingCount(current => current + 1);
      const { x, y } = tileKeyParts(key);
      const worker = indiaTileWorkerRef.current;
      if (!worker) {
        indiaTileCacheRef.current.delete(cacheKey);
        setIndiaTilePendingCount(current => Math.max(0, current - 1));
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
    indiaInView,
    indiaNode,
    indiaTileManifest,
    indiaTileRetryNonce,
    projection,
    size.height,
    size.width,
    viewportGeoBounds,
  ]);
  const selected = selectedId ? (nodeById.get(selectedId) ?? null) : null;
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
  const countryLabelIds = useMemo(() => {
    const labels = new Set<string>();
    const indiaDetailPending =
      indiaInView && camera.k >= 1.45 && indiaAdm1Features.length === 0;
    if (camera.k > 2.45 && !indiaDetailPending) return labels;
    [...nodes]
      .sort((a, b) => {
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
        return (b.total ?? -1) - (a.total ?? -1);
      })
      .forEach(node => labels.add(node.id));
    return labels;
  }, [camera.k, indiaAdm1Features.length, indiaInView, nodes, selectedId]);
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
    indiaAdm1Render.forEach(item => labels.add(item.boundary.id));
    return labels;
  }, [camera.k, indiaAdm1Render]);
  const visibleIndiaAdm2 = useMemo(() => {
    if (camera.k < 4.9) return [];
    const candidates = indiaAdm2Render.filter(item => {
      const [longitude, latitude] = geoCentroid(boundaryToFeature(item.boundary));
      return geographicPointInBounds(longitude, latitude, viewportGeoBounds);
    });
    const budget = camera.k < 7.5 ? 260 : camera.k < 11 ? 620 : 1100;
    return candidates
      .sort(
        (a, b) =>
          (a.boundary.id === geoSelection?.id ? -1 : 0) -
          (b.boundary.id === geoSelection?.id ? -1 : 0)
      )
      .slice(0, budget);
  }, [camera.k, geoSelection?.id, indiaAdm2Render, viewportGeoBounds]);
  const indiaAdm2LabelIds = useMemo(() => {
    const labels = new Set<string>();
    if (camera.k < 6.4) return labels;
    const budget = camera.k < 9.5 ? 54 : 150;
    visibleIndiaAdm2.slice(0, budget).forEach(item => labels.add(item.boundary.id));
    return labels;
  }, [camera.k, visibleIndiaAdm2]);
  const visibleIndiaLocalities = useMemo(() => {
    if (camera.k < 8.9) return [];
    const candidates = indiaLocalityPoints.filter(item =>
      geographicPointInBounds(item.record.longitude, item.record.latitude, viewportGeoBounds)
    );
    const budget = camera.k < 12 ? 420 : camera.k < 20 ? 900 : 1500;
    return candidates
      .sort((a, b) => b.record.population - a.record.population)
      .slice(0, budget);
  }, [camera.k, indiaLocalityPoints, viewportGeoBounds]);
  const indiaLocalityLabelIds = useMemo(() => {
    const labels = new Set<string>();
    if (camera.k < 12) return labels;
    visibleIndiaLocalities
      .slice(0, camera.k < 18 ? 90 : 180)
      .forEach(item => labels.add(item.record.id));
    return labels;
  }, [camera.k, visibleIndiaLocalities]);
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
    const legacyK = Number.parseFloat(params.get("wxz") ?? "");
    if (!initialMapView && Number.isFinite(legacyK)) {
      setCamera(current => ({ ...current, k: clamp(legacyK, MIN_ZOOM, MAX_ZOOM) }));
    }
    setSelectedId(params.get("wxc") || null);
    setNearbyMode(params.get("wxm") === "nearby");
  }, [initialMapView]);

  useEffect(() => {
    if (!release) return;
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("world", "1");
      const view = mapViewRef.current;
      params.set("wmlng", (view?.center[0] ?? 0).toFixed(6));
      params.set("wmlat", (view?.center[1] ?? 18).toFixed(6));
      params.set("wmlz", (view?.zoom ?? 1.25).toFixed(4));
      params.set("wmlb", (view?.bearing ?? 0).toFixed(2));
      params.set("wmlp", (view?.pitch ?? 0).toFixed(2));
      if (selectedId) params.set("wxc", selectedId);
      if (nearbyMode) params.set("wxm", "nearby");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${params.toString()}`
      );
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [camera, mapView, nearbyMode, release, selectedId]);

  const zoomAt = (_px: number, _py: number, factor: number, _commit = false) => {
    mapSceneRef.current?.zoomBy(factor);
  };

  const focusNode = (node: WorldNode, zoom = 3.8) => {
    rememberSelectionCamera();
    setGeoSelection(null);
    setSelectedId(node.id);
    setQuery("");
    setShowResults(false);
    mapSceneRef.current?.focusFeature(node.feature as GeoJSON.Feature, zoom);
  };
  const focusGeoPoint = (
    point: { x: number; y: number },
    zoom: number,
    center?: [number, number]
  ) => {
    if (center) {
      mapSceneRef.current?.focusCenter(center, zoom);
      return;
    }
    const geographicPoint = projection.invert?.([point.x, point.y]);
    if (geographicPoint) mapSceneRef.current?.focusCenter(geographicPoint, zoom);
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
    rememberSelectionCamera();
    setSelectedId(INDIA_ID);
    setGeoSelection({
      scope: "india",
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
    const center =
      kind === "locality"
        ? (() => {
            const locality = indiaLocalityRecords.find(item => item.id === id);
            return locality ? [locality.longitude, locality.latitude] as [number, number] : undefined;
          })()
        : (() => {
            const boundary = [...indiaAdm1Features, ...indiaAdm2Features].find(item => item.id === id);
            if (!boundary) return undefined;
            const [longitude, latitude] = geoCentroid(boundaryToFeature(boundary));
            return Number.isFinite(longitude) && Number.isFinite(latitude)
              ? [longitude, latitude] as [number, number]
              : undefined;
          })();
    focusGeoPoint(point, kind === "adm1" ? 4.1 : kind === "adm2" ? 7.2 : 12.5, center);
  };
  const selectGlobalEntity = (
    kind: "adm1" | "adm2",
    id: string,
    name: string,
    feature?: GeoJSON.Feature
  ) => {
    rememberSelectionCamera();
    setSelectedId(null);
    setGeoSelection({
      scope: "global",
      kind,
      id,
      name,
      parentId: null,
      source: {
        publisher: globalMvtManifest?.source.publisher ?? "geoBoundaries / William & Mary geoLab",
        sourceUrl: globalMvtManifest?.source.sourceUrl ?? "https://www.geoboundaries.org/globalDownloads.html",
        license: globalMvtManifest?.source.license ?? "Attribution required",
      },
      description: kind === "adm1"
        ? "Global administrative level 1 reference geometry from the geoBoundaries CGAZ composite."
        : "Global administrative level 2 reference geometry from the geoBoundaries CGAZ composite.",
      point: { x: 0, y: 0 },
    });
    setQuery("");
    setShowResults(false);
    if (feature) mapSceneRef.current?.focusFeature(feature, kind === "adm1" ? 4.8 : 7.2);
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
    if (!geoSelection) return;
    if (geoSelection.scope === "global") {
      setGeoSelection(null);
      selectionCameraRef.current = null;
      return;
    }
    if (!indiaGeography) return;
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
    selectionCameraRef.current = null;
    setGeoSelection(null);
    mapSceneRef.current?.reset();
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
  const retryIndiaDetails = () => {
    indiaManifestRequestedRef.current = false;
    indiaTileRetryAttemptsRef.current.clear();
    indiaTileFailedRef.current.clear();
    setIndiaGeoError(null);
    setIndiaTileRetryNonce(current => current + 1);
  };
  const copyName = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.name);
    } catch {
      // Clipboard access is optional and must never block map exploration.
    }
  };

  const indiaDetailActive = camera.k >= 1.45 && indiaInView;
  const indiaDetailLoading =
    indiaDetailActive && (indiaManifestLoading || indiaTilePendingCount > 0);
  const indiaDetailReady =
    camera.k < 4.8
      ? indiaAdm1Features.length > 0
      : camera.k < 8.2
        ? indiaAdm1Features.length > 0 && indiaAdm2Features.length > 0
        : indiaLocalityRecords.length > 0;
  const indiaDetailWaiting =
    indiaDetailActive &&
    Boolean(indiaTileManifest) &&
    !indiaDetailReady &&
    !indiaGeoError;
  const indiaContextActive = selectedId === INDIA_ID || Boolean(geoSelection);
  const showIndiaHierarchy = Boolean(
    indiaGeography && (indiaInView || indiaContextActive) && camera.k >= 1.85
  );
  const showIndiaAdm1 = showIndiaHierarchy && camera.k >= 1.85;
  const showIndiaAdm2 = showIndiaHierarchy && camera.k >= 4.8;
  const showIndiaLocalities = showIndiaHierarchy && camera.k >= 8.9;
  const geoParentLabel = geoSelection?.parentId
    ? (indiaAdm1Features.find(item => item.id === geoSelection.parentId)
        ?.name ??
      indiaAdm2Features.find(item => item.id === geoSelection.parentId)?.name ??
      null)
    : null;
  const estimatedMapZoom = 1.25 + Math.log2(Math.max(MIN_ZOOM, camera.k));
  const currentGeoLevel = geoSelection
    ? selectionKindLabel(geoSelection)
    : indiaInView && camera.k >= INDIA_LOCALITY_ZOOM
      ? "City / locality"
      : indiaInView && camera.k >= INDIA_ADM2_ZOOM
        ? "District"
        : indiaInView && camera.k >= INDIA_ADM1_ZOOM
          ? "State / union territory"
          : estimatedMapZoom >= GLOBAL_ADM2_MAP_ZOOM
            ? "Global administrative level 2"
            : estimatedMapZoom >= GLOBAL_ADM1_MAP_ZOOM
              ? "Global administrative level 1"
              : "Country overview";
  const semanticAdm1 = useMemo<SemanticBoundary[]>(() => {
    if (!showIndiaAdm1) return [];
    return indiaAdm1Render.map(item => ({
      id: item.boundary.id,
      name: item.boundary.name,
      d: item.d,
      geometry: item.boundary.geometry,
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
      geometry: item.boundary.geometry,
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
  const countryLayers = useMemo(() => {
    const palette = ["#6e8f78", "#9a9d6d", "#7894a0", "#a08368", "#7d9270", "#8a8b9f", "#b09a70", "#6c8f88"];
    return countryFeatures.flatMap((country, index) => {
      const id = topologyId(country);
      const node = nodeById.get(id);
      if (!node) return [];
      return [{
        id,
        name: node.name,
        feature: country as GeoJSON.Feature,
        color: palette[index % palette.length],
        visible: !nearbyMode || nearbyIds.has(id),
        label: countryLabelIds.has(id),
        selected: selectedId === id,
      }];
    });
  }, [countryFeatures, countryLabelIds, nearbyIds, nearbyMode, nodeById, selectedId]);
  const countryLabelLayers = useMemo(() => countryLayers.flatMap(item => {
    const anchor = safeCountryLabelAnchor(item.feature as MapFeature);
    return anchor ? [{
      id: item.id,
      name: item.name,
      longitude: anchor[0],
      latitude: anchor[1],
      label: item.label,
      selected: item.selected,
    }] : [];
  }), [countryLayers]);
  const adm1Layers = useMemo(() => semanticAdm1.flatMap(item => item.geometry ? [{
    id: item.id,
    name: item.name,
    geometry: item.geometry,
    label: item.label,
    selected: item.selected,
  }] : []), [semanticAdm1]);
  const adm2Layers = useMemo(() => semanticAdm2.flatMap(item => item.geometry ? [{
    id: item.id,
    name: item.name,
    geometry: item.geometry,
    label: item.label,
    selected: item.selected,
  }] : []), [semanticAdm2]);
  const localityLayers = useMemo(() => visibleIndiaLocalities.map(item => ({
    id: item.record.id,
    name: item.record.name,
    longitude: item.record.longitude,
    latitude: item.record.latitude,
    population: item.record.population,
    label: indiaLocalityLabelIds.has(item.record.id),
    selected: geoSelection?.kind === "locality" && geoSelection.id === item.record.id,
  })), [geoSelection, indiaLocalityLabelIds, visibleIndiaLocalities]);
  const onMapPick = (pick: { kind: "country" | "adm1" | "adm2" | "locality"; id: string; feature?: { source?: string; sourceLayer?: string; geometry?: GeoJSON.Geometry; properties?: Record<string, unknown> } }) => {
    if (pick.kind === "country") {
      const node = nodeById.get(pick.id);
      if (node) focusNode(node, Math.max(2.2, cameraRef.current.k));
      return;
    }
    const sourceName = String(pick.feature?.source ?? "");
    const sourceLayer = String(pick.feature?.sourceLayer ?? "");
    if ((pick.kind === "adm1" || pick.kind === "adm2") && (sourceName.startsWith("atlas-global-") || sourceLayer === pick.kind)) {
      const name = String(pick.feature?.properties?.name ?? `${pick.kind.toUpperCase()} ${pick.id}`);
      selectGlobalEntity(pick.kind, pick.id, name, pick.feature?.geometry ? {
        type: "Feature",
        id: pick.id,
        properties: pick.feature.properties ?? {},
        geometry: pick.feature.geometry,
      } as GeoJSON.Feature : undefined);
      return;
    }
    if (!indiaGeography) return;
    if (pick.kind === "adm1") {
      const item = indiaAdm1Render.find(candidate => candidate.boundary.id === pick.id);
      if (item) selectGeoEntity("adm1", item.boundary.id, item.boundary.name, { x: item.x, y: item.y }, indiaGeography.layers.adm1.source, INDIA_ID);
      return;
    }
    if (pick.kind === "adm2") {
      const item = visibleIndiaAdm2.find(candidate => candidate.boundary.id === pick.id);
      if (item) selectGeoEntity("adm2", item.boundary.id, item.boundary.name, { x: item.x, y: item.y }, indiaGeography.layers.adm2.source, indiaAdm2ParentById.get(item.boundary.id) ?? INDIA_ID);
      return;
    }
    const item = visibleIndiaLocalities.find(candidate => candidate.record.id === pick.id);
    if (item) {
      const parentDistrict = indiaAdm2Features.find(boundary => geoContains(boundaryToFeature(boundary), [item.record.longitude, item.record.latitude]));
      selectGeoEntity("locality", item.record.id, item.record.name, { x: item.x, y: item.y }, indiaGeography.layers.localities.source, parentDistrict?.id ?? item.record.admin2Code ?? item.record.admin1Code ?? INDIA_ID, { population: item.record.population, featureCode: item.record.featureCode });
    }
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
      className="relative h-[calc(100dvh-112px)] min-h-[520px] overflow-hidden bg-[#061423] text-white select-none sm:h-[calc(100dvh-68px)] sm:min-h-[560px]"
    >
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          backgroundColor: "#020817",
          backgroundImage:
            "radial-gradient(circle at 18% 24%, rgba(188,220,213,.22) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 68%, rgba(239,204,151,.18) 0 1px, transparent 1.5px), radial-gradient(ellipse at center, rgba(15,58,78,.34), transparent 68%)",
          backgroundSize: "132px 132px, 188px 188px, 100% 100%",
        }}
      >
        <MapLibreWorldScene
          ref={mapSceneRef}
          initialView={initialMapView}
          countries={countryLayers}
          countryLabels={countryLabelLayers}
          globalMvt={globalMvtManifest}
          spinEnabled={spinEnabled && !reducedMotion}
          adm1={adm1Layers}
          adm2={adm2Layers}
          localities={localityLayers}
          onViewChange={onMapViewChange}
          onPick={onMapPick}
          onUnavailable={() => setError("Map renderer unavailable")}
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
                {geoSelection.scope === "india" ? "India / " : "Global / "}{geoSelection.name}
              </span>
            </>
          )}
        </div>
        {indiaDetailActive &&
          (indiaDetailLoading || indiaDetailWaiting || indiaGeoError) && (
            <div className="mt-2 flex max-w-[min(430px,calc(100vw-1.5rem))] items-center gap-3 rounded-lg border border-[#35536f] bg-[#0b1a2a]/95 px-3 py-2 text-xs text-[#b9ccdc] shadow-xl backdrop-blur">
              <span className="min-w-0 flex-1">
                {indiaGeoError
                  ? "India detail could not be loaded."
                  : indiaManifestLoading
                    ? "Fetching India detail index…"
                    : indiaTilePendingCount > 0
                      ? `Loading India detail · ${indiaTilePendingCount} tile${indiaTilePendingCount === 1 ? "" : "s"}…`
                      : "India detail is ready to retry for this viewport."}
              </span>
              {indiaGeoError || indiaDetailWaiting ? (
                <button
                  type="button"
                  onClick={retryIndiaDetails}
                  className="shrink-0 font-semibold text-[#45d7c0] underline-offset-2 hover:underline"
                >
                  Retry
                </button>
              ) : null}
            </div>
          )}
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
          Drag to roam. Zoom at the cursor. Country labels give way to
          precomputed worldwide administrative boundaries, with India’s
          specialized states, districts, and GeoNames place references at
          deeper scale.
        </p>
        <section className="mt-4 border border-[#294761] bg-[#0d2234]/80 p-3">
          <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#8fe7d8]">
            <span>Global reference layers</span>
            <span className="text-[#d2dc96]">{globalMvtManifest ? "ready" : "loading"}</span>
          </div>
          {globalMvtManifest ? (
            <>
              <p className="mt-2 text-[11px] leading-5 text-[#b4c4d5]">
                GeoBoundaries CGAZ static release <span className="font-mono text-[#e6f3f2]">{globalMvtManifest.releaseId}</span> supplies worldwide ADM1 and ADM2 reference geometry.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[9px] uppercase tracking-[.08em] text-[#8297ac]">
                <span>{globalMvtManifest.layers.adm1.featureCount.toLocaleString()} ADM1</span>
                <span>{globalMvtManifest.layers.adm2.featureCount.toLocaleString()} ADM2</span>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-[#8297ac]">
                Global localities are not included yet. <a href={globalMvtManifest.source.sourceUrl} target="_blank" rel="noreferrer" className="text-[#45d7c0] underline-offset-2 hover:underline">Source and policy <ExternalLink className="inline h-3 w-3" /></a>
              </p>
            </>
          ) : (
            <p className="mt-2 text-[11px] leading-5 text-[#8297ac]">Fetching the small versioned tile manifest; map navigation remains static and viewport-loaded.</p>
          )}
        </section>
        <div className="mt-4 space-y-2 border-t border-[#203b54] pt-3 font-mono text-[9px] uppercase tracking-[.1em] text-[#8297ac]">
          <p>
            <span className="mr-2 text-[#45d7c0]">01</span>Search moves the
            camera to a field
          </p>
          <p>
            <span className="mr-2 text-[#ffbf69]">02</span>Click a country area
            to inspect the source record
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
          onClick={() => setSpinEnabled(current => !current)}
          disabled={reducedMotion}
          aria-pressed={spinEnabled && !reducedMotion}
          title={reducedMotion ? "Automatic rotation is disabled by reduced-motion preference" : "Toggle automatic globe rotation"}
          className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-[9px] font-semibold uppercase tracking-[.1em] shadow-xl ${reducedMotion ? "cursor-not-allowed border-[#2b4054] bg-[#0b1a2a]/80 text-[#64798b]" : spinEnabled ? "border-[#45d7c0] bg-[#123b43]/95 text-[#8fe7d8]" : "border-[#35536f] bg-[#0b1a2a]/95 text-[#c5d7e7] hover:border-[#45d7c0] hover:text-[#45d7c0]"}`}
        >
          <RotateCw className="h-4 w-4" />
          <span>{reducedMotion ? "Reduced" : spinEnabled ? "Spin on" : "Spin off"}</span>
        </button>
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
              onClick={closeInspector}
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
                {selectionKindLabel(geoSelection)}
              </div>
              <span className="rounded-full bg-[#122b40] px-2 py-1 font-mono text-[8px] uppercase tracking-[.13em] text-[#a1b6c8]">
                {geoSelection.source.publisher}
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
                  {selectionKindLabel(geoSelection)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8097ad]">
                  Parent
                </div>
                <div className="mt-1 text-sm text-[#b4c4d5]">
                  {geoParentLabel ??
                    (geoSelection.scope === "india" && geoSelection.parentId === INDIA_ID
                      ? "India"
                      : geoSelection.scope === "global"
                        ? "Global source release"
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
                onClick={closeInspector}
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
              onClick={closeInspector}
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
