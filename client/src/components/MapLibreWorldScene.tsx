import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMapClass, setWorkerUrl } from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature, StyleSpecification } from "maplibre-gl";
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

type PickKind = "country" | "adm1" | "adm2" | "locality";

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
  adm1: BoundaryRecord[];
  adm2: BoundaryRecord[];
  localities: LocalityRecord[];
  onViewChange?: (view: ViewState & { bounds: [[number, number], [number, number]] }) => void;
  onPick?: (pick: { kind: PickKind; id: string; feature?: MapGeoJSONFeature }) => void;
  onUnavailable?: () => void;
};

const EMPTY_COLLECTION = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

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
  adm1: BoundaryRecord[];
  adm2: BoundaryRecord[];
  localities: LocalityRecord[];
}) {
  return {
    version: 8,
    name: "Atlas Earth",
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      "atlas-countries": { type: "geojson", data: featureCollection(input.countries.map(asCountryFeature) as any) },
      "atlas-adm1": { type: "geojson", data: featureCollection(input.adm1.map(asBoundaryFeature) as any) },
      "atlas-adm2": { type: "geojson", data: featureCollection(input.adm2.map(asBoundaryFeature) as any) },
      "atlas-localities": { type: "geojson", data: featureCollection(input.localities.map(asLocalityFeature) as any), maxzoom: 14 },
    },
    layers: [
      { id: "atlas-background", type: "background", paint: { "background-color": "#061423" } },
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
          "line-color": ["case", ["boolean", ["get", "selected"], false], "#ffd28a", "#3a6685"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.55, 4, 1.35, 8, 2.4],
          "line-opacity": 0.9,
        },
      },
      {
        id: "atlas-country-label",
        type: "symbol",
        source: "atlas-countries",
        minzoom: 0.8,
        maxzoom: 3.55,
        layout: {
          "symbol-placement": "point",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 0.8, 11, 2, 15, 3.55, 18],
          "text-max-width": 9,
          "text-padding": 5,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#dbfff6",
          "text-halo-color": "#061423",
          "text-halo-width": 1.8,
          "text-halo-blur": 0.25,
          "text-opacity": ["case", ["boolean", ["get", "label"], true], 1, 0],
        },
      },
      {
        id: "atlas-adm1-fill",
        type: "fill",
        source: "atlas-adm1",
        minzoom: 3.2,
        paint: {
          "fill-color": "#2f8f86",
          "fill-opacity": ["case", ["boolean", ["get", "selected"], false], 0.58, 0.23],
        },
      },
      {
        id: "atlas-adm1-line",
        type: "line",
        source: "atlas-adm1",
        minzoom: 3.2,
        paint: { "line-color": "#63d6be", "line-width": ["interpolate", ["linear"], ["zoom"], 3.2, 0.7, 7, 1.7], "line-opacity": 0.86 },
      },
      {
        id: "atlas-adm1-label",
        type: "symbol",
        source: "atlas-adm1",
        minzoom: 3.25,
        maxzoom: 7.6,
        layout: {
          "symbol-placement": "point",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3.25, 11, 6, 15, 7.6, 17],
          "text-max-width": 8,
          "text-padding": 4,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
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
        maxzoom: 12,
        layout: {
          "symbol-placement": "point",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6.1, 9, 10, 12, 12, 14],
          "text-max-width": 7,
          "text-padding": 3,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        filter: ["==", ["get", "label"], true],
        paint: { "text-color": "#ffe7bf", "text-halo-color": "#101516", "text-halo-width": 1.2 },
      },
      {
        id: "atlas-locality-circle",
        type: "circle",
        source: "atlas-localities",
        minzoom: 8.2,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8.2, 2.2, 12, 4.3, 18, 6.8],
          "circle-color": ["case", ["boolean", ["get", "selected"], false], "#ffd28a", "#45d7c0"],
          "circle-stroke-color": "#061423",
          "circle-stroke-width": 1,
          "circle-opacity": 0.92,
        },
      },
      {
        id: "atlas-locality-label",
        type: "symbol",
        source: "atlas-localities",
        minzoom: 9,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 9, 9, 14, 12, 18, 15],
          "text-offset": [0.8, 0],
          "text-anchor": "left",
          "text-padding": 3,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
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

const MapLibreWorldScene = forwardRef<MapLibreWorldSceneHandle, Props>(function MapLibreWorldScene(
  { initialView, countries, adm1, adm2, localities, onViewChange, onPick, onUnavailable },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const baseZoomRef = useRef(1.25);
  const onViewChangeRef = useRef(onViewChange);
  const onPickRef = useRef(onPick);
  const onUnavailableRef = useRef(onUnavailable);
  const [styleReady, setStyleReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  onViewChangeRef.current = onViewChange;
  onPickRef.current = onPick;
  onUnavailableRef.current = onUnavailable;

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
      map.fitBounds([[-180, -58], [180, 84]], { padding: { top: 78, right: 36, bottom: 40, left: 36 }, duration: 420, essential: true });
      map.setBearing(0);
      map.setPitch(0);
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
        style: atlasStyle({ countries, adm1, adm2, localities }),
        center: initialView?.center ?? [0, 18],
        zoom: initialView?.zoom ?? 1.25,
        bearing: initialView?.bearing ?? 0,
        pitch: initialView?.pitch ?? 0,
        maxZoom: 22,
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
      map.on("load", () => {
        setMapLoaded(true);
      });
      map.on("style.load", () => {
        map.setProjection({ type: "globe" });
        map.fitBounds([[-180, -58], [180, 84]], { padding: { top: 78, right: 36, bottom: 40, left: 36 }, duration: 0 });
        baseZoomRef.current = map.getZoom();
        if (initialView) map.jumpTo(initialView);
        setStyleReady(true);
        onViewChangeRef.current?.(toView(map));
      });
      map.on("move", () => onViewChangeRef.current?.(toView(map)));
      const pickLayers = ["atlas-locality-circle", "atlas-adm2-fill", "atlas-adm1-fill", "atlas-country-fill"];
      map.on("click", pickLayers, event => {
        const feature = event.features?.[0];
        const id = feature?.properties?.atlasId ?? feature?.id;
        if (!feature || id === undefined || id === null) return;
        const layer = feature.layer.id;
        const kind: PickKind = layer.includes("locality") ? "locality" : layer.includes("adm2") ? "adm2" : layer.includes("adm1") ? "adm1" : "country";
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

    return () => {
      resizeObserver.disconnect();
      setStyleReady(false);
      setMapLoaded(false);
      mapRef.current = null;
      map.remove();
    };
  }, [initialView]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !mapLoaded) return;
    sourceSetData(map, "atlas-countries", featureCollection(countries.map(asCountryFeature) as any));
    sourceSetData(map, "atlas-adm1", featureCollection(adm1.map(asBoundaryFeature) as any));
    sourceSetData(map, "atlas-adm2", featureCollection(adm2.map(asBoundaryFeature) as any));
    sourceSetData(map, "atlas-localities", featureCollection(localities.map(asLocalityFeature) as any));
  }, [adm1, adm2, countries, localities, mapLoaded, styleReady]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" data-maplibre-world />;
});

MapLibreWorldScene.displayName = "MapLibreWorldScene";
export default MapLibreWorldScene;
