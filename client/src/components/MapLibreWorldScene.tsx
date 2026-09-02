import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMapClass, setWorkerUrl } from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature, StyleSpecification } from "maplibre-gl";
import type { GlobalMvtManifest } from "@/lib/worldMvt";
import { globalMvtTileUrl } from "@/lib/worldMvt";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

type Geometry = GeoJSON.Geometry;
type Feature = GeoJSON.Feature<Geometry, GeoJSON.GeoJsonProperties>;
type ViewState = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};
type CountryRecord = {
  id: string;
  name: string;
  feature: Feature;
  color: string;
  visible: boolean;
  label: boolean;
  selected: boolean;
};
type CountryLabelRecord = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  label: boolean;
  selected: boolean;
  area?: number;
};
type BoundaryRecord = {
  id: string;
  name: string;
  geometry: Geometry;
  label: boolean;
  selected: boolean;
};
type LocalityRecord = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  population: number;
  label: boolean;
  selected: boolean;
};

type PickKind = "country" | "adm1" | "adm2" | "adm3" | "adm4" | "adm5" | "locality";

export type MapLibreWorldSceneHandle = {
  setView: (view: ViewState) => void;
  zoomBy: (factor: number) => void;
  reset: () => void;
  focusCenter: (center: [number, number], zoomFactor: number) => void;
  focusFeature: (feature: Feature, zoomFactor: number) => void;
};

type Props = {
  initialView?: ViewState;
  countries: CountryRecord[];
  countryLabels: CountryLabelRecord[];
  adm1: BoundaryRecord[];
  adm2: BoundaryRecord[];
  localities: LocalityRecord[];
  globalMvt?: GlobalMvtManifest | null;
  spinEnabled?: boolean;
  onViewChange?: (view: ViewState & { bounds: [[number, number], [number, number]] }) => void;
  onPick?: (pick: { kind: PickKind; id: string; feature?: MapGeoJSONFeature }) => void;
  onUnavailable?: () => void;
};

const MAP_MAX_ZOOM = 24;

function globalLabelSize(zoom: number) {
  return Math.min(22, 9 + zoom * 0.82);
}

// This scene used to render three disagreeing projections at once: MapLibre's
// own `globe`, a `geoOrthographic` d3 canvas drawn on top of it, and (in the
// sibling SVG explorer) `geoNaturalEarth1`. The d3 canvas was the sphere the
// user actually saw and dragged, while the camera being driven was MapLibre's,
// and they disagreed in four separate ways:
//
//   * the canvas radius was clamped to `max(w, h) * 1.18`, so past roughly
//     zoom 3.4 on a desktop viewport the drawn sphere froze while the camera
//     kept zooming, then hard-cut to mercator at 4.6;
//   * `geoOrthographic().rotate([-lng, -lat, -bearing])` tilts the whole globe
//     by latitude, whereas MapLibre's globe keeps the pole oriented and pans the
//     centre — so anywhere off the equator the two disagreed about what was
//     centred, and bearing was applied as a third Euler angle (roll) rather
//     than as MapLibre's screen-space rotation;
//   * hit-testing inverted the d3 projection and culled anything past
//     `radius - 4`, so clicks near the limb missed, and because overview mode
//     hid *every* MapLibre data layer there was no `queryRenderedFeatures`
//     fallback to catch them;
//   * `pitch` has no representation in `geoOrthographic` at all, so any pitch
//     change invalidated the overlay outright.
//
// MapLibre 6.5 renders a real globe natively and transitions to mercator on its
// own as you zoom in, so the fix is to delete the overlay rather than patch it:
// one projection, one camera, one hit-test path.
function ensureGlobeProjection(map: MapLibreMap) {
  if (!map.getStyle?.()) return;
  if (map.getProjection?.()?.type === "globe") return;
  try {
    map.setProjection({ type: "globe" });
  } catch (error) {
    // MapLibre can expose the style object one tick before its style mutation
    // APIs are ready. Previously this was a bare `catch {}`, which is why none
    // of the projection bugs above ever produced a console error.
    console.warn("atlas: globe projection not applied yet", error);
  }
}

function featureCollection(records: Array<Feature & { properties: Record<string, unknown> }>) {
  return { type: "FeatureCollection", features: records } as GeoJSON.FeatureCollection;
}

function asCountryFeature(item: CountryRecord): Feature {
  return {
    ...item.feature,
    id: item.id,
    properties: {
      ...(item.feature.properties ?? {}),
      atlasId: item.id,
      name: item.name,
      color: item.color,
      visible: item.visible,
      label: item.label,
      selected: item.selected,
    },
  } as Feature;
}

function asCountryLabelFeature(item: CountryLabelRecord): Feature {
  return {
    type: "Feature",
    id: item.id,
    geometry: { type: "Point", coordinates: [item.longitude, item.latitude] },
    properties: {
      atlasId: item.id,
      name: item.name,
      label: item.label,
      selected: item.selected,
    },
  } as Feature;
}

function asBoundaryFeature(item: BoundaryRecord): Feature {
  return {
    type: "Feature",
    id: item.id,
    geometry: item.geometry,
    properties: {
      atlasId: item.id,
      name: item.name,
      label: item.label,
      selected: item.selected,
    },
  } as Feature;
}

function asLocalityFeature(item: LocalityRecord): Feature {
  return {
    type: "Feature",
    id: item.id,
    geometry: { type: "Point", coordinates: [item.longitude, item.latitude] },
    properties: {
      atlasId: item.id,
      name: item.name,
      population: item.population,
      label: item.label,
      selected: item.selected,
    },
  } as Feature;
}

function atlasStyle(input: {
  countries: CountryRecord[];
  countryLabels: CountryLabelRecord[];
  adm1: BoundaryRecord[];
  adm2: BoundaryRecord[];
  localities: LocalityRecord[];
}) {
  return {
    version: 8,
    name: "Atlas Earth",
    // Self-hosted from client/public/fonts (see scripts/vendor-glyphs.mjs).
    // This used to point at demotiles.maplibre.org — MapLibre's demo server —
    // so a third-party outage or rate limit silently removed every map label.
    glyphs: "/fonts/{fontstack}/{range}.pbf",
    sky: {
      "sky-color": "#020817",
      "sky-horizon-blend": 0.22,
      "horizon-color": "#17445f",
      "horizon-fog-blend": 0.12,
      "fog-color": "#061423",
      "fog-ground-blend": 0.18,
    },
    sources: {
      "atlas-countries": { type: "geojson", data: featureCollection(input.countries.map(asCountryFeature) as any) },
      "atlas-country-labels": { type: "geojson", data: featureCollection(input.countryLabels.map(asCountryLabelFeature) as any) },
      "atlas-adm1": { type: "geojson", data: featureCollection(input.adm1.map(asBoundaryFeature) as any) },
      "atlas-adm2": { type: "geojson", data: featureCollection(input.adm2.map(asBoundaryFeature) as any) },
      "atlas-localities": { type: "geojson", data: featureCollection(input.localities.map(asLocalityFeature) as any), maxzoom: 14 },
    },
    layers: [
      { id: "atlas-background", type: "background", paint: { "background-color": "#020817" } },
      {
        id: "atlas-country-fill",
        type: "fill",
        source: "atlas-countries",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["case", ["boolean", ["get", "visible"], true], 0.78, 0.17],
          "fill-antialias": true,
        },
      },
      {
        id: "atlas-country-line",
        type: "line",
        source: "atlas-countries",
        paint: {
          "line-color": ["case", ["boolean", ["get", "selected"], false], "#f5d78c", "#38566a"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.55, 4, 1.35, 8, 2.4],
          "line-opacity": 0.9,
        },
      },
      {
        id: "atlas-country-label",
        type: "symbol",
        source: "atlas-country-labels",
        minzoom: 0.8,
        maxzoom: 5.4,
        layout: {
          "symbol-placement": "point",
          "text-field": ["get", "name"],
          "symbol-sort-key": ["case", ["boolean", ["get", "selected"], false], 0, 1],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 0.8, 11, 2.2, 15, 5.4, 19],
          "text-max-width": 9,
          "text-padding": 5,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-anchor": "center",
          "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
          "text-letter-spacing": 0.015,
        },
        filter: ["==", ["get", "label"], true],
        paint: {
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 0.8, 1, 4.7, 1, 5.4, 0],
          "text-color": "#dbfff6",
          "text-halo-color": "#061423",
          "text-halo-width": 1.8,
          "text-halo-blur": 0.25,
        },
      },
      {
        id: "atlas-adm1-fill",
        type: "fill",
        source: "atlas-adm1",
        minzoom: 3.2,
        paint: {
          "fill-color": "#5f876f",
          "fill-opacity": ["case", ["boolean", ["get", "selected"], false], 0.58, 0.23],
        },
      },
      {
        id: "atlas-adm1-line",
        type: "line",
        source: "atlas-adm1",
        minzoom: 3.2,
        paint: { "line-color": "#bad09e", "line-width": ["interpolate", ["linear"], ["zoom"], 3.2, 0.7, 7, 1.7], "line-opacity": 0.86 },
      },
      {
        id: "atlas-adm1-label",
        type: "symbol",
        source: "atlas-adm1",
        minzoom: 3.25,
        maxzoom: 8.6,
        layout: {
          "symbol-placement": "point",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3.25, 11, 5.8, 15, 8.6, 18],
          "text-max-width": 8,
          "text-padding": 3,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-keep-upright": true,
          "symbol-avoid-edges": true,
          "symbol-sort-key": ["case", ["boolean", ["get", "selected"], false], 0, 1],
        },
        filter: ["==", ["get", "label"], true],
        paint: { "text-color": "#ffe0aa", "text-halo-color": "#071622", "text-halo-width": 1.5 },
      },
      {
        id: "atlas-adm2-fill",
        type: "fill",
        source: "atlas-adm2",
        minzoom: 5.15,
        paint: { "fill-color": "#be8651", "fill-opacity": ["case", ["boolean", ["get", "selected"], false], 0.58, 0.18] },
      },
      {
        id: "atlas-adm2-line",
        type: "line",
        source: "atlas-adm2",
        minzoom: 5.15,
        paint: { "line-color": "#e7bb79", "line-width": ["interpolate", ["linear"], ["zoom"], 5.15, 0.55, 9, 1.25], "line-opacity": 0.82 },
      },
      {
        id: "atlas-adm2-label",
        type: "symbol",
        source: "atlas-adm2",
        minzoom: 6.1,
        maxzoom: 13,
        layout: {
          "symbol-placement": "point",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6.1, 14, 10, 16, 13, 18],
          "text-max-width": 7,
          "text-padding": 2,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-keep-upright": true,
          "symbol-avoid-edges": true,
          "symbol-sort-key": ["case", ["boolean", ["get", "selected"], false], 0, 1],
        },
        filter: ["==", ["get", "label"], true],
        paint: { "text-color": "#ffe7bf", "text-halo-color": "#101516", "text-halo-width": 1.2 },
      },
      {
        id: "atlas-locality-label",
        type: "symbol",
        source: "atlas-localities",
        minzoom: 9,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 9, 14, 14, 16, 24, 19],
          "text-offset": [0.8, 0],
          "text-anchor": "left",
          "text-padding": 2,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-keep-upright": true,
          "symbol-avoid-edges": true,
          "symbol-sort-key": ["-", 1000000000, ["coalesce", ["get", "population"], 0]],
        },
        filter: ["==", ["get", "label"], true],
        paint: { "text-color": "#9fffee", "text-halo-color": "#061423", "text-halo-width": 1.2 },
      },
    ],
  } as StyleSpecification;
}

function toView(map: MapLibreMap): ViewState & { bounds: [[number, number], [number, number]] } {
  const center = map.getCenter();
  const bounds = map.getBounds();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
    bounds: [bounds.getSouthWest().toArray(), bounds.getNorthEast().toArray()],
  };
}

function sourceSetData(map: MapLibreMap, sourceId: string, data: GeoJSON.FeatureCollection) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(data);
}

function addGlobalMvtLayers(map: MapLibreMap, manifest: GlobalMvtManifest) {
  const keys = Object.keys(manifest.layers)
    .filter(key => /^adm[1-5]$/.test(key))
    .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
  if (!keys.length) return;
  const globalNonIndiaFilter = [
    "all",
    ["has", "countryCode"],
    ["!=", ["get", "countryCode"], "IND"],
  ] as any;
  const colors = ["#738b76", "#8a9870", "#9b8365", "#777d9b", "#7d9b8a"];
  const insertBefore = "atlas-adm1-fill";

  keys.forEach((key, index) => {
    const metadata = manifest.layers[key];
    const level = Number(key.slice(3));
    const labelKey = `${key}Labels`;
    const labelMetadata = manifest.layers[labelKey];
    const sourceId = `atlas-global-${key}`;
    const labelSourceId = `atlas-global-${labelKey}`;
    const sourceLayer = metadata.mvtSourceLayer ?? key;
    const labelSourceLayer = labelMetadata?.mvtSourceLayer ?? "labels";
    const sourceFilter = globalNonIndiaFilter;
    const nextKey = keys[index + 1];
    const nextStart = nextKey
      ? Math.max(metadata.tileZoom + 0.4, manifest.layers[nextKey].tileZoom - 0.25)
      : MAP_MAX_ZOOM;
    const minzoom = metadata.tileZoom;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "vector",
        tiles: [globalMvtTileUrl(manifest, key)],
        minzoom: metadata.tileZoom,
        maxzoom: metadata.tileZoom,
        promoteId: "atlasId",
      });
    }
    if (labelMetadata && !map.getSource(labelSourceId)) {
      map.addSource(labelSourceId, {
        type: "vector",
        tiles: [globalMvtTileUrl(manifest, labelKey)],
        minzoom: labelMetadata.tileZoom,
        maxzoom: labelMetadata.tileZoom,
        promoteId: "atlasId",
      });
    }

    const fillId = `atlas-global-${key}-fill`;
    const lineId = `atlas-global-${key}-line`;
    const labelId = `atlas-global-${key}-label`;
    if (!map.getLayer(fillId)) {
      map.addLayer({
        id: fillId,
        type: "fill",
        source: sourceId,
        "source-layer": sourceLayer,
        filter: sourceFilter as any,
        minzoom,
        maxzoom: Math.min(MAP_MAX_ZOOM, nextStart),
        paint: {
          "fill-color": colors[index % colors.length],
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], minzoom, 0.05, minzoom + 0.8, 0.12, nextStart, nextKey ? 0 : 0.1],
        },
      }, insertBefore);
    }
    if (!map.getLayer(lineId)) {
      map.addLayer({
        id: lineId,
        type: "line",
        source: sourceId,
        "source-layer": sourceLayer,
        filter: sourceFilter as any,
        minzoom,
        maxzoom: Math.min(MAP_MAX_ZOOM, nextStart + 0.2),
        paint: {
          "line-color": colors[index % colors.length],
          "line-width": ["interpolate", ["linear"], ["zoom"], minzoom, 0.25, minzoom + 2, 0.9],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], minzoom, 0.45, nextStart, nextKey ? 0 : 0.9],
        },
      }, insertBefore);
    }
    if (labelMetadata && !map.getLayer(labelId)) {
      map.addLayer({
        id: labelId,
        type: "symbol",
        source: labelSourceId,
        "source-layer": labelSourceLayer,
        filter: ["all", sourceFilter, ["==", ["get", "label"], true]] as any,
        minzoom: minzoom + 0.1,
        maxzoom: Math.min(MAP_MAX_ZOOM, nextKey ? Math.max(nextStart + 0.4, manifest.layers[nextKey].tileZoom + 0.15) : MAP_MAX_ZOOM),
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], minzoom + 0.1, globalLabelSize(minzoom + 0.1), minzoom + 2.4, globalLabelSize(minzoom + 2.4), MAP_MAX_ZOOM, globalLabelSize(MAP_MAX_ZOOM)],
          "text-max-width": 7,
          "text-padding": 2,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-keep-upright": true,
          "symbol-avoid-edges": true,
          "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
          "symbol-sort-key": ["case", ["boolean", ["get", "selected"], false], 0, 1],
        },
        paint: { "text-opacity": ["interpolate", ["linear"], ["zoom"], minzoom, 0, minzoom + 0.35, 1, Math.min(MAP_MAX_ZOOM, nextKey ? Math.max(nextStart + 0.4, manifest.layers[nextKey].tileZoom + 0.15) : MAP_MAX_ZOOM), nextKey ? 0 : 1], "text-color": "#d6f4e8", "text-halo-color": "#061423", "text-halo-width": 1.1 },
      }, insertBefore);
    }
  });

  const places = manifest.layers.placesLabels;
  if (places && !map.getSource("atlas-global-places")) {
    map.addSource("atlas-global-places", {
      type: "vector",
      tiles: [globalMvtTileUrl(manifest, "placesLabels")],
      minzoom: places.tileZoom,
      maxzoom: places.tileZoom,
      promoteId: "atlasId",
    });
  }
  if (places && !map.getLayer("atlas-global-places-label")) {
    map.addLayer({
      id: "atlas-global-places-label",
      type: "symbol",
      source: "atlas-global-places",
      "source-layer": places.mvtSourceLayer ?? "labels",
      minzoom: places.tileZoom + 0.5,
      maxzoom: MAP_MAX_ZOOM,
      filter: ["all", ["has", "countryCode"], ["!=", ["get", "countryCode"], "IN"], ["==", ["get", "label"], true]] as any,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Semibold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], places.tileZoom + 0.5, 10, 16, 14, MAP_MAX_ZOOM, 18],
        "text-offset": [0, 0],
        "text-anchor": "center",
        "text-padding": 1,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-keep-upright": true,
        "symbol-avoid-edges": true,
        "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
        "symbol-sort-key": ["-", 1000000000, ["coalesce", ["get", "population"], 0]],
      },
      paint: { "text-color": "#9fffee", "text-halo-color": "#061423", "text-halo-width": 1.1 },
    }, insertBefore);
  }
}


const MapLibreWorldScene = forwardRef<MapLibreWorldSceneHandle, Props>(function MapLibreWorldScene(
  { initialView, countries, countryLabels, adm1, adm2, localities, globalMvt, spinEnabled = true, onViewChange, onPick, onUnavailable },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const baseZoomRef = useRef(1.25);
  const onViewChangeRef = useRef(onViewChange);
  const onPickRef = useRef(onPick);
  const onUnavailableRef = useRef(onUnavailable);
  const spinEnabledRef = useRef(spinEnabled);
  const reducedMotionRef = useRef(false);
  const [styleReady, setStyleReady] = useState(false);
  onViewChangeRef.current = onViewChange;
  onPickRef.current = onPick;
  onUnavailableRef.current = onUnavailable;
  spinEnabledRef.current = spinEnabled;

  useImperativeHandle(ref, () => ({
    setView(view) {
      const map = mapRef.current;
      if (!map) return;
      map.jumpTo({ center: view.center, zoom: view.zoom, bearing: view.bearing, pitch: view.pitch });
    },
    zoomBy(factor) {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ zoom: map.getZoom() + Math.log2(Math.max(0.01, factor)), duration: 260, essential: true });
    },
    reset() {
      const map = mapRef.current;
      if (!map) return;
      map.stop();
      map.jumpTo({ center: [0, 20], zoom: 1.25, bearing: 0, pitch: 0 });
    },
    focusCenter(center, zoomFactor) {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ center, zoom: baseZoomRef.current + Math.log2(Math.max(1, zoomFactor)), duration: 460, essential: true });
    },
    focusFeature(feature, zoomFactor) {
      const map = mapRef.current;
      if (!map) return;
      const bounds = new LngLatBounds();
      const visit = (coordinates: any): void => {
        if (!Array.isArray(coordinates)) return;
        if (typeof coordinates[0] === "number") {
          bounds.extend(coordinates as [number, number]);
          return;
        }
        coordinates.forEach(visit);
      };
      visit((feature.geometry as any).coordinates);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 120, maxZoom: baseZoomRef.current + Math.log2(Math.max(1, zoomFactor)) + 1.4, duration: 460, essential: true });
      }
    },
  }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let map: MapLibreMap;
    try {
      setWorkerUrl(maplibreWorkerUrl);
      map = new MapLibreMapClass({
        container,
        style: atlasStyle({ countries, countryLabels, adm1, adm2, localities }),
        center: initialView?.center ?? [0, 18],
        zoom: initialView?.zoom ?? 1.25,
        bearing: initialView?.bearing ?? 0,
        pitch: initialView?.pitch ?? 0,
        maxZoom: MAP_MAX_ZOOM,
        minZoom: 0,
        renderWorldCopies: false,
        attributionControl: false,
        cooperativeGestures: false,
      });
      mapRef.current = map;
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.touchZoomRotate.enable();
      map.touchZoomRotate.enableRotation();
      map.dragRotate.enable();
      map.touchPitch.disable();
      // `map.on("render", …)` used to re-path the entire countries-50m topology
      // plus every label onto a 2D canvas on every single frame, with two forced
      // reflows per frame from getBoundingClientRect(). The globe is MapLibre's
      // now, so the camera listener only has to report the view upward.
      const syncCamera = () => {
        onViewChangeRef.current?.(toView(map));
      };
      map.on("load", () => {
        syncCamera();
      });
      map.on("style.load", () => {
        ensureGlobeProjection(map);
        if (initialView) map.jumpTo(initialView);
        baseZoomRef.current = initialView?.zoom ?? map.getZoom();
        setStyleReady(true);
        onViewChangeRef.current?.(toView(map));
      });
      map.on("move", syncCamera);
      map.on("resize", () => map.resize());
      map.on("click", event => {
        // Single hit-test path. The d3 `geoContains` branch that used to run
        // first inverted a projection the renderer no longer uses, and culled
        // anything past the drawn limb, so clicks near the edge of the disc
        // selected nothing.
        const feature = map.queryRenderedFeatures(event.point).find((candidate: MapGeoJSONFeature) => {
          const id = candidate.layer.id;
          return id === "atlas-locality-label" || id === "atlas-global-places-label" || id === "atlas-country-fill" || /atlas-global-adm[1-5]-fill$/.test(id) || /^atlas-adm[12]-fill$/.test(id);
        });
        const id = feature?.properties?.atlasId ?? feature?.id;
        if (!feature || id === undefined || id === null) return;
        const layer = feature.layer.id;
        const globalLevel = layer.match(/atlas-global-(adm[1-5])-fill$/)?.[1] as PickKind | undefined;
        const kind: PickKind = layer.includes("locality") || layer.includes("places")
          ? "locality"
          : globalLevel ?? (layer.includes("adm2") ? "adm2" : layer.includes("adm1") ? "adm1" : "country");
        onPickRef.current?.({ kind, id: String(id), feature });
      });
      map.on("error", event => {
        if (event.error && /WebGL|style|source|glyph/i.test(event.error.message)) onUnavailableRef.current?.();
      });
    } catch {
      onUnavailableRef.current?.();
      return;
    }

      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(container);
      const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      reducedMotionRef.current = reducedMotionQuery.matches;
      const updateReducedMotion = () => {
        reducedMotionRef.current = reducedMotionQuery.matches;
      };
      reducedMotionQuery.addEventListener?.("change", updateReducedMotion);
      let spinFrame = 0;
      let previousSpinTime = performance.now();
      let spinPausedUntil = performance.now() + 3000;
      const pauseSpin = () => {
        spinPausedUntil = performance.now() + 7000;
      };
      const spinEvents = ["dragstart", "zoomstart", "rotatestart", "wheel", "mousedown", "touchstart"] as const;
      spinEvents.forEach(eventName => map.on(eventName, pauseSpin));
      const spin = (now: number) => {
        const elapsed = Math.min(80, now - previousSpinTime);
        previousSpinTime = now;
        if (spinEnabledRef.current && !reducedMotionRef.current && now >= spinPausedUntil && !map.isMoving() && map.getZoom() <= 3.2) {
          const center = map.getCenter();
          const longitude = ((((center.lng + elapsed * 0.0022) + 540) % 360) - 180);
          map.setCenter([longitude, center.lat]);
        }
        spinFrame = window.requestAnimationFrame(spin);
      };
      spinFrame = window.requestAnimationFrame(spin);

      return () => {
        window.cancelAnimationFrame(spinFrame);
        reducedMotionQuery.removeEventListener?.("change", updateReducedMotion);
        spinEvents.forEach(eventName => map.off(eventName, pauseSpin));
        resizeObserver.disconnect();
        setStyleReady(false);
        mapRef.current = null;
        map.remove();
      };
  }, [initialView]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    if (globalMvt) {
      addGlobalMvtLayers(map, globalMvt);
      ensureGlobeProjection(map);
    }
    sourceSetData(map, "atlas-countries", featureCollection(countries.map(asCountryFeature) as any));
    sourceSetData(map, "atlas-country-labels", featureCollection(countryLabels.map(asCountryLabelFeature) as any));
    sourceSetData(map, "atlas-adm1", featureCollection(adm1.map(asBoundaryFeature) as any));
    sourceSetData(map, "atlas-adm2", featureCollection(adm2.map(asBoundaryFeature) as any));
    sourceSetData(map, "atlas-localities", featureCollection(localities.map(asLocalityFeature) as any));
  }, [adm1, adm2, countryLabels, countries, globalMvt, localities, styleReady]);

  return (
    <div className="absolute inset-0 h-full w-full" data-maplibre-world>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
});

MapLibreWorldScene.displayName = "MapLibreWorldScene";
export default MapLibreWorldScene;
