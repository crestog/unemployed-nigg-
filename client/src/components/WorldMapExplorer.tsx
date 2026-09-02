import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { feature } from "topojson-client";
import {
  geoArea,
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
import { clamp, tileKeyParts, tileKeysForViewport } from "@/lib/tileMath";
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
type GeoEntityKind = "country" | "adm1" | "adm2" | "adm3" | "adm4" | "adm5" | "locality";
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
const allCountryFeatures = mapCollection.features as MapFeature[];
const countryFeatures = allCountryFeatures;
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
        : kind === "locality"
          ? "City / locality"
          : `Administrative level ${kind.slice(3)}`;
const selectionKindLabel = (selection: Pick<GeoSelection, "scope" | "kind">) =>
  selection.scope === "global" && selection.kind.startsWith("adm")
    ? `Administrative level ${selection.kind.slice(3)}`
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

function geographicGeometryIntersectsBounds(
  geometry: GeoJSON.Geometry,
  bounds: [[number, number], [number, number]] | null | undefined
) {
  if (!bounds) return false;
  const [[west, south], [east, north]] = bounds;
  const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] = geoBounds({ type: "Feature", properties: {}, geometry } as GeoJSON.Feature);
  if (maxLatitude < south || minLatitude > north) return false;
  return west <= east
    ? maxLongitude >= west && minLongitude <= east
    : maxLongitude >= west || minLongitude <= east;
}

export default function WorldMapExplorer() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);
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
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [releaseRetryNonce, setReleaseRetryNonce] = useState(0);
  const [size, setSize] = useState({ width: 1280, height: 760 });
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
    // `{ cache: "no-store" }` used to be set here, which forced a full download
    // of what was then an 8.27 MB manifest on every single load and defeated the
    // Worker's own `max-age`. The `?v=` release stamp already busts the cache
    // when the data changes, so the browser cache is allowed to do its job.
    const controller = new AbortController();
    fetch("/data/world-mvt/manifest.json?v=20260824-global-deep", {
      signal: controller.signal,
    })
      .then(response => response.ok ? response.json() as Promise<GlobalMvtManifest> : null)
      .then(manifest => {
        if (manifest?.format === "atlas-global-geoboundaries-mvt-v1") setGlobalMvtManifest(manifest);
      })
      .catch((thrown: unknown) => {
        if (thrown instanceof DOMException && thrown.name === "AbortError") return;
        console.error("atlas: could not load the world tile manifest", thrown);
      });
    return () => controller.abort();
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

  const mapViewFrameRef = useRef<number | null>(null);
  const mapViewPendingRef = useRef<typeof mapView>(null);
  const onMapViewChange = (next: NonNullable<typeof mapView>) => {
    // MapLibre is the sole camera model. Keep the ref hot for viewport-driven
    // fetches and selection restore; React state is throttled below for UI.
    mapViewRef.current = next;
    mapViewPendingRef.current = next;
    if (mapViewFrameRef.current !== null)
      window.cancelAnimationFrame(mapViewFrameRef.current);
    mapViewFrameRef.current = window.requestAnimationFrame(() => {
      mapViewFrameRef.current = null;
      const pending = mapViewPendingRef.current;
      if (pending) setMapView(pending);
    });
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
      if (mapViewFrameRef.current !== null)
        window.cancelAnimationFrame(mapViewFrameRef.current);
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setReleaseLoading(true);
    setError(null);
    fetch(`/data/world-venture.json?v=20260824`, {
      signal: controller.signal,
      cache: "force-cache",
    })
      .then(response => {
        if (!response.ok) throw new Error("World source release unavailable");
        return response.json() as Promise<WorldRelease>;
      })
      .then(nextRelease => {
        if (!active) return;
        setRelease(nextRelease);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof DOMException && cause.name === "AbortError"
          ? "World data took too long to respond."
          : cause instanceof Error
            ? cause.message
            : "World source release unavailable");
      })
      .finally(() => {
        if (active) setReleaseLoading(false);
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [releaseRetryNonce]);

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
  const mapZoom = mapView?.zoom ?? initialMapView?.zoom ?? 1.25;
  const zoomScale = 2 ** mapZoom;
  const zoomScaleLabel = zoomScale >= 1000000
    ? `${(zoomScale / 1000000).toFixed(1)}M×`
    : zoomScale >= 1000
      ? `${(zoomScale / 1000).toFixed(1)}k×`
      : `${zoomScale.toFixed(1)}×`;
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
  // `mapView.bounds` is a brand-new array on every camera update, and it feeds
  // the India tile effect plus four viewport-culling memos — so its identity
  // alone re-ran all of them on every frame of a drag, and the two memos that
  // early-return `[]` handed a fresh empty array down to the MapLibre scene each
  // time, which re-uploaded every GeoJSON source and restarted symbol placement.
  //
  // Snapping the box outward onto a 1/8° grid keeps the identity stable for as
  // long as the viewport stays inside one cell. Expanding (floor the west/south
  // corner, ceil the east/north one) rather than rounding guarantees the snapped
  // box still contains the real one, so no edge feature is ever culled.
  const rawMapBounds = mapView?.bounds ?? null;
  const boundsGridStep = 8;
  const snappedWest = rawMapBounds ? Math.floor(rawMapBounds[0][0] * boundsGridStep) / boundsGridStep : 0;
  const snappedSouth = rawMapBounds ? Math.floor(rawMapBounds[0][1] * boundsGridStep) / boundsGridStep : 0;
  const snappedEast = rawMapBounds ? Math.ceil(rawMapBounds[1][0] * boundsGridStep) / boundsGridStep : 0;
  const snappedNorth = rawMapBounds ? Math.ceil(rawMapBounds[1][1] * boundsGridStep) / boundsGridStep : 0;
  const hasMapBounds = Boolean(rawMapBounds);
  const viewportGeoBounds = useMemo<[[number, number], [number, number]] | null>(
    () => (hasMapBounds ? [[snappedWest, snappedSouth], [snappedEast, snappedNorth]] : null),
    [hasMapBounds, snappedEast, snappedNorth, snappedSouth, snappedWest]
  );
  useEffect(() => {
    if (!indiaNode || mapZoom < INDIA_ADM1_ZOOM || !indiaInView) return;
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
    if (mapZoom >= INDIA_ADM1_ZOOM)
      tileKeysForViewport(
        indiaTileManifest.layers.adm1,
        viewportGeoBounds
      ).forEach(key => requests.push(["adm1", key]));
    if (mapZoom >= INDIA_ADM2_ZOOM)
      tileKeysForViewport(
        indiaTileManifest.layers.adm2,
        viewportGeoBounds
      ).forEach(key => requests.push(["adm2", key]));
    if (mapZoom >= INDIA_LOCALITY_ZOOM)
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
    indiaInView,
    mapZoom,
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
      indiaInView && mapZoom >= INDIA_ADM1_ZOOM && indiaAdm1Features.length === 0;
    if (mapZoom > 5.4 && !indiaDetailPending) return labels;
    [...nodes]
      .sort((a, b) => {
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
        return (b.total ?? -1) - (a.total ?? -1);
      })
      .forEach(node => labels.add(node.id));
    return labels;
  }, [indiaAdm1Features.length, indiaInView, mapZoom, nodes, selectedId]);
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
    if (mapZoom < 3.25 || mapZoom > 7.6) return labels;
    indiaAdm1Render.forEach(item => labels.add(item.boundary.id));
    return labels;
  }, [indiaAdm1Render, mapZoom]);
  const visibleIndiaAdm2 = useMemo(() => {
    if (mapZoom < 5.15) return [];
    const candidates = indiaAdm2Render.filter(item =>
      geographicGeometryIntersectsBounds(item.boundary.geometry, viewportGeoBounds)
    );
    const budget = mapZoom < 7.5 ? 260 : mapZoom < 11 ? 620 : 1100;
    return candidates
      .sort(
        (a, b) =>
          (a.boundary.id === geoSelection?.id ? -1 : 0) -
          (b.boundary.id === geoSelection?.id ? -1 : 0)
      )
      .slice(0, budget);
  }, [geoSelection?.id, indiaAdm2Render, mapZoom, viewportGeoBounds]);
  const indiaAdm2LabelIds = useMemo(() => {
    const labels = new Set<string>();
    if (mapZoom < 6.1 || mapZoom > 12) return labels;
    const budget = mapZoom < 9.5 ? 54 : 150;
    visibleIndiaAdm2.slice(0, budget).forEach(item => labels.add(item.boundary.id));
    return labels;
  }, [mapZoom, visibleIndiaAdm2]);
  const visibleIndiaLocalities = useMemo(() => {
    if (mapZoom < 8.2) return [];
    const candidates = indiaLocalityPoints.filter(item =>
      geographicPointInBounds(item.record.longitude, item.record.latitude, viewportGeoBounds)
    );
    const budget = mapZoom < 12 ? 420 : mapZoom < 20 ? 900 : 1500;
    return candidates
      .sort((a, b) => b.record.population - a.record.population)
      .slice(0, budget);
  }, [indiaLocalityPoints, mapZoom, viewportGeoBounds]);
  const indiaLocalityLabelIds = useMemo(() => {
    const labels = new Set<string>();
    if (mapZoom < 9 || mapZoom > 22) return labels;
    visibleIndiaLocalities
      .slice(0, mapZoom < 18 ? 90 : 180)
      .forEach(item => labels.add(item.record.id));
    return labels;
  }, [mapZoom, visibleIndiaLocalities]);
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
    setSelectedId(params.get("wxc") || null);
    setNearbyMode(params.get("wxm") === "nearby");
  }, [initialMapView]);

  useEffect(() => {
    const applyHashCamera = () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      if (params.get("world") !== "1") return;
      const lng = Number.parseFloat(params.get("wmlng") ?? "");
      const lat = Number.parseFloat(params.get("wmlat") ?? "");
      const zoom = Number.parseFloat(params.get("wmlz") ?? "");
      if (![lng, lat, zoom].every(Number.isFinite)) return;
      const bearing = Number.parseFloat(params.get("wmlb") ?? "");
      const pitch = Number.parseFloat(params.get("wmlp") ?? "");
      window.setTimeout(() => {
        mapSceneRef.current?.setView({
          center: [lng, lat],
          zoom,
          bearing: Number.isFinite(bearing) ? bearing : 0,
          pitch: Number.isFinite(pitch) ? pitch : 0,
        });
      }, 0);
    };
    window.addEventListener("hashchange", applyHashCamera);
    return () => window.removeEventListener("hashchange", applyHashCamera);
  }, []);

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
  }, [mapView, nearbyMode, release, selectedId]);

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
  const focusGeoPoint = (center: [number, number] | undefined, zoom: number) => {
    // Screen coordinates are retained for search/semantic records only. All
    // camera movement must receive an explicit geographic center from source data.
    if (center) mapSceneRef.current?.focusCenter(center, zoom);
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
    focusGeoPoint(center, kind === "adm1" ? 4.1 : kind === "adm2" ? 7.2 : 12.5);
  };
  const selectGlobalEntity = (
    kind: "adm1" | "adm2" | "adm3" | "adm4" | "adm5" | "locality",
    id: string,
    name: string,
    feature?: GeoJSON.Feature,
    details: { population?: number; featureCode?: string } = {},
  ) => {
    rememberSelectionCamera();
    setSelectedId(null);
    const layerSource = kind === "locality"
      ? globalMvtManifest?.layers.placesLabels?.sourceMetadata?.[0]
      : undefined;
    setGeoSelection({
      scope: "global",
      kind,
      id,
      name,
      parentId: null,
      source: {
        publisher: kind === "locality" ? "GeoNames" : (globalMvtManifest?.source.publisher ?? "geoBoundaries / William & Mary geoLab"),
        sourceUrl: layerSource?.sourceUrl ?? globalMvtManifest?.source.sourceUrl ?? "https://www.geoboundaries.org/globalDownloads.html",
        license: layerSource?.sourceLicense ?? globalMvtManifest?.source.license ?? "Attribution required",
        termsUrl: layerSource?.licenseSource ?? undefined,
      },
      description: kind === "locality"
        ? "GeoNames populated-place reference point. It is a place-name and population reference, not evidence of an organization, business, or activity."
        : kind === "adm1"
        ? "Global administrative level 1 reference geometry from the geoBoundaries CGAZ composite."
        : kind === "adm2"
          ? "Global administrative level 2 reference geometry from the geoBoundaries CGAZ composite."
          : `Country-specific geoBoundaries ${kind.toUpperCase()} reference geometry. Availability and source year vary by country; this record does not claim uniform worldwide coverage.`,
      point: { x: 0, y: 0 },
      ...details,
    });
    setQuery("");
    setShowResults(false);
    if (feature) {
      const focusZoom = kind === "locality"
        ? 9.3
        : { adm1: 4.8, adm2: 7.2, adm3: 9.3, adm4: 11.3, adm5: 13.3 }[kind];
      mapSceneRef.current?.focusFeature(feature, focusZoom);
    }
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

  const indiaDetailActive = mapZoom >= INDIA_ADM1_ZOOM && indiaInView;
  const indiaDetailLoading =
    indiaDetailActive && (indiaManifestLoading || indiaTilePendingCount > 0);
  const indiaDetailReady =
    mapZoom < INDIA_ADM2_ZOOM
      ? indiaAdm1Features.length > 0
      : mapZoom < INDIA_LOCALITY_ZOOM
        ? indiaAdm1Features.length > 0 && indiaAdm2Features.length > 0
        : indiaLocalityRecords.length > 0;
  const indiaDetailWaiting =
    indiaDetailActive &&
    Boolean(indiaTileManifest) &&
    !indiaDetailReady &&
    !indiaGeoError;
  const indiaContextActive = selectedId === INDIA_ID || geoSelection?.scope === "india";
  const showIndiaHierarchy = Boolean(
    indiaGeography && (indiaInView || indiaContextActive) && mapZoom >= INDIA_ADM1_ZOOM
  );
  const showIndiaAdm1 = showIndiaHierarchy && mapZoom >= INDIA_ADM1_ZOOM;
  const showIndiaAdm2 = showIndiaHierarchy && mapZoom >= INDIA_ADM2_ZOOM;
  const showIndiaLocalities = showIndiaHierarchy && mapZoom >= INDIA_LOCALITY_ZOOM;
  const geoParentLabel = geoSelection?.parentId
    ? (indiaAdm1Features.find(item => item.id === geoSelection.parentId)
        ?.name ??
      indiaAdm2Features.find(item => item.id === geoSelection.parentId)?.name ??
      null)
    : null;
  const availableGlobalLevels = useMemo(
    () => Object.keys(globalMvtManifest?.layers ?? {})
      .filter(key => /^adm[1-5]$/.test(key))
      .map(key => Number(key.slice(3)))
      .sort((a, b) => a - b),
    [globalMvtManifest]
  );
  const currentGeoLevel = geoSelection
    ? selectionKindLabel(geoSelection)
      : indiaInView && mapZoom >= INDIA_LOCALITY_ZOOM
      ? "City / locality"
      : indiaInView && mapZoom >= INDIA_ADM2_ZOOM
        ? "District"
        : indiaInView && mapZoom >= INDIA_ADM1_ZOOM
          ? "State / union territory"
          : availableGlobalLevels.length && mapZoom >= GLOBAL_ADM1_MAP_ZOOM
            ? `Global administrative level ${availableGlobalLevels.filter(level => mapZoom >= (globalMvtManifest?.layers[`adm${level}`]?.tileZoom ?? 99)).at(-1) ?? 1}`
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
        mapZoom < 3.8
          ? clamp((mapZoom - 3.2) / 0.6, 0, 0.96)
          : mapZoom < 6.8
            ? 0.96
            : Math.max(0.18, 1 - (mapZoom - 6.8) / 1.4),
      selected:
        geoSelection?.kind === "adm1" && geoSelection.id === item.boundary.id,
      label: indiaAdm1LabelIds.has(item.boundary.id),
    }));
  }, [
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
        mapZoom < 6.2
          ? clamp((mapZoom - 5.15) / 1.05, 0, 0.82)
          : mapZoom < 12
            ? 0.82
            : Math.max(0.16, 1 - (mapZoom - 12) / 8),
      selected:
        geoSelection?.kind === "adm2" && geoSelection.id === item.boundary.id,
      label: indiaAdm2LabelIds.has(item.boundary.id),
    }));
  }, [
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
      if (!node && id !== "010") return [];
      return [{
        id,
        name: node?.name ?? country.properties?.name ?? "Antarctica",
        feature: country as GeoJSON.Feature,
        color: palette[index % palette.length],
        visible: !nearbyMode || nearbyIds.has(id),
        label: id === "010" || countryLabelIds.has(id),
        selected: selectedId === id,
      }];
    });
  }, [countryFeatures, countryLabelIds, nearbyIds, nearbyMode, nodeById, selectedId]);
  const countryLabelLayers = useMemo(() => countryLayers.flatMap(item => {
    const anchor = item.id === "010" ? [0, -82] as [number, number] : safeCountryLabelAnchor(item.feature as MapFeature);
    return anchor ? [{
      id: item.id,
      name: item.name,
      longitude: anchor[0],
      latitude: anchor[1],
      label: item.label,
      selected: item.selected,
      area: Math.abs(geoArea(item.feature as GeoJSON.Feature)),
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
  const onMapPick = (pick: { kind: "country" | "adm1" | "adm2" | "adm3" | "adm4" | "adm5" | "locality"; id: string; feature?: { source?: string; sourceLayer?: string; geometry?: GeoJSON.Geometry; properties?: Record<string, unknown> } }) => {
    if (pick.kind === "country") {
      const node = nodeById.get(pick.id);
      if (node) focusNode(node);
      return;
    }
    const sourceName = String(pick.feature?.source ?? "");
    const sourceLayer = String(pick.feature?.sourceLayer ?? "");
    const isGlobalAdmin = /^adm[1-5]$/.test(pick.kind);
    if (pick.kind === "locality" && sourceName === "atlas-global-places") {
      const properties = pick.feature?.properties ?? {};
      selectGlobalEntity(
        "locality",
        pick.id,
        String(properties.name ?? `Place ${pick.id}`),
        pick.feature?.geometry ? {
          type: "Feature",
          id: pick.id,
          properties,
          geometry: pick.feature.geometry,
        } as GeoJSON.Feature : undefined,
        {
          population: Number.isFinite(Number(properties.population)) ? Number(properties.population) : undefined,
          featureCode: String(properties.featureCode ?? "") || undefined,
        },
      );
      return;
    }
    if (isGlobalAdmin && (sourceName.startsWith("atlas-global-") || sourceLayer === pick.kind)) {
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
      <section className="grid min-h-[calc(100dvh-var(--atlas-header-height,68px))] place-items-center bg-[#08111d] px-6 py-16 text-[#c7d4e4]" aria-busy={releaseLoading}>
        <div className="w-full max-w-md text-center">
          <div className="font-mono text-[10px] uppercase tracking-[.18em] text-[#45d7c0]">World field / source release</div>
          <h1 className="mt-4 font-display text-4xl leading-[.95] text-white sm:text-5xl">
            {releaseLoading ? "Preparing the world field…" : "The world field is unavailable."}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#9db2c8]">
            {releaseLoading
              ? "Loading the versioned geographic release. The map will appear as soon as the source package is ready."
              : error ?? "The geographic release could not be loaded."}
          </p>
          {releaseLoading ? (
            <div className="mx-auto mt-7 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#183149]" role="progressbar" aria-label="Loading world data">
              <div className="h-full w-2/5 animate-pulse rounded-full bg-[#45d7c0]" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReleaseRetryNonce(current => current + 1)}
              className="atlas-button mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#35536f] bg-[#0d2234] px-4 py-3 text-sm font-semibold text-[#8fe7d8] hover:border-[#45d7c0]"
            >
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          )}
        </div>
      </section>
    );

  return (
    <section
      id="atlas-world-map"
      ref={surfaceRef}
      className="atlas-world-map relative h-[calc(100dvh-112px)] min-h-[520px] overflow-hidden bg-[#061423] text-white select-none sm:h-[calc(100dvh-68px)] sm:min-h-[560px]"
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
        className="atlas-world-toolbar absolute left-3 right-3 top-3 z-20 max-w-none sm:left-4 sm:right-auto sm:top-4 sm:max-w-[min(690px,calc(100vw-2rem))]"
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
          <span className="rounded-full border border-[#35536f] bg-[#112b3d] px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#8fe7d8]" aria-live="polite" title="Live MapLibre zoom level and world-scale multiplier">
            Z {mapZoom.toFixed(2)} · {zoomScaleLabel}
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
          precomputed worldwide administrative boundaries at the deepest
          level available for the country, with source-backed place references
          rendered as text-only labels when available.
        </p>
        <section className="mt-4 border border-[#294761] bg-[#0d2234]/80 p-3">
          <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#8fe7d8]">
            <span>Global reference layers</span>
            <span className="text-[#d2dc96]">{globalMvtManifest ? "ready" : "loading"}</span>
          </div>
          {globalMvtManifest ? (
            <>
              <p className="mt-2 text-[11px] leading-5 text-[#b4c4d5]">
                GeoBoundaries static release <span className="font-mono text-[#e6f3f2]">{globalMvtManifest.releaseId}</span> supplies global ADM1/ADM2 plus country-specific deeper levels where the source inventory provides them.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[9px] uppercase tracking-[.08em] text-[#8297ac]">
                <span>{globalMvtManifest.layers.adm1.featureCount.toLocaleString()} ADM1</span>
                <span>{globalMvtManifest.layers.adm2.featureCount.toLocaleString()} ADM2</span>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-[#8297ac]">
                {Object.keys(globalMvtManifest.coveragePolicy.deepLevels ?? {}).length ? `Deep administrative levels available: ${Object.keys(globalMvtManifest.coveragePolicy.deepLevels ?? {}).sort().join(", ").toUpperCase()}.` : "No global deep administrative levels are present in this release yet."} Global place names remain a separate source layer and render as text only; Atlas does not draw place-point markers. {globalMvtManifest.geometryPolicy?.safeVectorLatitude != null ? `One globe projection renders the whole view and hands off to Web Mercator as you zoom in; geometry reaching beyond ${globalMvtManifest.geometryPolicy.safeVectorLatitude}° latitude is excluded from the vector tiles and listed in the geometry audit.` : "One globe projection renders the whole view and hands off to Web Mercator as you zoom in; administrative vectors follow the versioned tile policy."} <a href={globalMvtManifest.source.sourceUrl} target="_blank" rel="noreferrer" className="text-[#45d7c0] underline-offset-2 hover:underline">Source and policy <ExternalLink className="inline h-3 w-3" /></a>
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
            <span className="mr-2 text-[#9babc0]">03</span>Country drill-down:
            deepest source-backed administrative level available
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
        className="atlas-world-search absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-30 w-[calc(100%-6rem)] sm:bottom-4 sm:left-4 sm:w-[min(540px,calc(100vw-2rem))]"
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
            placeholder="Find a place or country…"
            aria-label="Find a country, state, district, or city"
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
        <div className="atlas-world-status mt-2 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          <span className="rounded-full border border-[#35536f] bg-[#0b1a2a]/92 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8da4b8]" aria-live="polite">
            Zoom {mapZoom.toFixed(2)} · scale {zoomScaleLabel}
          </span>
          <span className="rounded-full border border-[#35536f] bg-[#0b1a2a]/92 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8da4b8]">
            Drag to roam
          </span>
          <span className="atlas-desktop-map-hint rounded-full border border-[#35536f] bg-[#0b1a2a]/92 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8da4b8]">
            Wheel at cursor
          </span>
          <span className="atlas-mobile-map-hint rounded-full border border-[#35536f] bg-[#0b1a2a]/92 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8da4b8]">
            Pinch / drag
          </span>
          <span className="rounded-full border border-[#35536f] bg-[#0b1a2a]/92 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8da4b8]">
            {nodes.length} country fields
            {globalMvtManifest
              ? ` · ${availableGlobalLevels.length} global admin levels`
              : ""}
            {indiaGeography
              ? ` · India ${indiaGeography.layers.adm1.features.length} states · ${indiaGeography.layers.adm2.features.length} districts`
              : ""}
          </span>
        </div>
      </div>

      <div
        data-world-overlay
        className="atlas-world-controls absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-20 flex flex-col gap-2 sm:bottom-4 sm:right-4"
        onPointerDown={event => event.stopPropagation()}
        onWheel={event => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setSpinEnabled(current => !current)}
          disabled={reducedMotion}
          aria-pressed={spinEnabled && !reducedMotion}
          aria-label={reducedMotion ? "Automatic rotation disabled" : spinEnabled ? "Turn globe spin off" : "Turn globe spin on"}
          title={reducedMotion ? "Automatic rotation is disabled by reduced-motion preference" : "Toggle automatic globe rotation"}
          className={`atlas-button flex h-10 items-center gap-2 rounded-xl border px-3 text-[9px] font-semibold uppercase tracking-[.1em] shadow-xl ${reducedMotion ? "cursor-not-allowed border-[#2b4054] bg-[#0b1a2a]/80 text-[#64798b]" : spinEnabled ? "border-[#45d7c0] bg-[#123b43]/95 text-[#8fe7d8]" : "border-[#35536f] bg-[#0b1a2a]/95 text-[#c5d7e7] hover:border-[#45d7c0] hover:text-[#45d7c0]"}`}
        >
          <RotateCw className="h-4 w-4" />
          <span>{reducedMotion ? "Reduced" : spinEnabled ? "Spin on" : "Spin off"}</span>
        </button>
        <button
          type="button"
          onClick={() => zoomAt(size.width / 2, size.height / 2, 1.55)}
          className="atlas-button grid h-10 w-10 place-items-center rounded-xl border border-[#35536f] bg-[#0b1a2a]/95 text-[#c5d7e7] shadow-xl hover:border-[#45d7c0] hover:text-[#45d7c0]"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomAt(size.width / 2, size.height / 2, 1 / 1.55)}
          className="atlas-button grid h-10 w-10 place-items-center rounded-xl border border-[#35536f] bg-[#0b1a2a]/95 text-[#c5d7e7] shadow-xl hover:border-[#45d7c0] hover:text-[#45d7c0]"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="atlas-button grid h-10 w-10 place-items-center rounded-xl border border-[#35536f] bg-[#0b1a2a]/95 text-[#c5d7e7] shadow-xl hover:border-[#45d7c0] hover:text-[#45d7c0]"
          aria-label="Reset world view"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      {geoSelection && (
        <aside
          data-world-overlay
          className="atlas-world-inspector absolute bottom-0 left-0 right-0 top-0 z-40 flex w-full flex-col overflow-hidden rounded-none sm:bottom-4 sm:left-auto sm:right-4 sm:top-4 sm:w-[min(410px,calc(100vw-2rem))] sm:rounded-2xl border border-[#35536f] bg-[#0b1a2a]/97 shadow-2xl shadow-black/40 backdrop-blur-xl sm:right-16"
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
          className="atlas-world-inspector absolute bottom-0 left-0 right-0 top-0 z-40 flex w-full flex-col overflow-hidden rounded-none sm:bottom-4 sm:left-auto sm:right-4 sm:top-4 sm:w-[min(410px,calc(100vw-2rem))] sm:rounded-2xl border border-[#35536f] bg-[#0b1a2a]/97 shadow-2xl shadow-black/40 backdrop-blur-xl sm:right-16"
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
