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
  /** Country geometry used only by the globe-safe polar canvas. Includes Antarctica. */
  polarCountries: CountryRecord[];
  polarCountryLabels: CountryLabelRecord[];
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

const EMPTY_COLLECTION = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

const MAP_MAX_ZOOM = 24;
const POLAR_CANVAS_LATITUDE = 70;
const POLAR_CANVAS_SOURCE_LATITUDE = 65;
const POLAR_CANVAS_STROKE = "rgba(7, 22, 34, 0.82)";

function geometryLatitudeBounds(geometry: Geometry): [number, number] {
  let min = 90;
  let max = -90;
  const visit = (coordinates: any): void => {
    if (!Array.isArray(coordinates)) return;
    if (typeof coordinates[0] === "number") {
      const latitude = Number(coordinates[1]);
      if (Number.isFinite(latitude)) {
        min = Math.min(min, latitude);
        max = Math.max(max, latitude);
      }
      return;
    }
    coordinates.forEach(visit);
  };
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach(child => visit((child as any).coordinates));
  } else {
    visit((geometry as any).coordinates);
  }
  return min <= max ? [min, max] : [0, 0];
}

function wrapLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function pointInRing(longitude: number, latitude: number, ring: any[]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const current = ring[index];
    const prior = ring[previous];
    if (!Array.isArray(current) || !Array.isArray(prior)) continue;
    const currentLongitude = Number(current[0]);
    const priorLongitude = Number(prior[0]);
    const longitudeDelta = currentLongitude - priorLongitude;
    const adjustedLongitude = longitude + (Math.abs(longitudeDelta) > 180 ? (longitudeDelta > 0 ? 360 : -360) : 0);
    const adjustedPriorLongitude = priorLongitude;
    const crosses = ((Number(current[1]) > latitude) !== (Number(prior[1]) > latitude)) &&
      longitude < (adjustedPriorLongitude + (adjustedLongitude - adjustedPriorLongitude) * (latitude - Number(prior[1])) / (Number(current[1]) - Number(prior[1])));
    if (crosses) inside = !inside;
  }
  return inside;
}

function geometryContainsPoint(geometry: Geometry, longitude: number, latitude: number): boolean {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.length > 0 && pointInRing(longitude, latitude, geometry.coordinates[0]) && geometry.coordinates.slice(1).every(ring => !pointInRing(longitude, latitude, ring));
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(polygon => polygon.length > 0 && pointInRing(longitude, latitude, polygon[0]) && polygon.slice(1).every(ring => !pointInRing(longitude, latitude, ring)));
  }
  if (geometry.type === "GeometryCollection") return geometry.geometries.some(child => geometryContainsPoint(child, longitude, latitude));
  return false;
}

function screenSamplesInsideGeometry(map: MapLibreMap, geometry: Geometry, width: number, height: number) {
  const samples = [[width * 0.08, height * 0.08], [width * 0.5, height * 0.08], [width * 0.92, height * 0.08], [width * 0.08, height * 0.5], [width * 0.5, height * 0.5], [width * 0.92, height * 0.5], [width * 0.08, height * 0.92], [width * 0.5, height * 0.92], [width * 0.92, height * 0.92]];
  try {
    return samples.every(([x, y]) => {
      const coordinate = map.unproject([x, y]);
      return geometryContainsPoint(geometry, coordinate.lng, coordinate.lat);
    });
  } catch {
    return false;
  }
}

function projectPolarCoordinate(map: MapLibreMap, longitude: number, latitude: number, width: number, height: number) {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  const center = map.getCenter();
  const centerLongitude = (center.lng * Math.PI) / 180;
  const centerLatitude = (center.lat * Math.PI) / 180;
  const pointLongitude = (wrapLongitude(longitude) * Math.PI) / 180;
  const pointLatitude = (Math.max(-89.999, Math.min(89.999, latitude)) * Math.PI) / 180;
  const deltaLongitude = pointLongitude - centerLongitude;
  const visibleDot = Math.sin(centerLatitude) * Math.sin(pointLatitude) + Math.cos(centerLatitude) * Math.cos(pointLatitude) * Math.cos(deltaLongitude);
  if (visibleDot < -0.02) return null;
  const centerPoint = map.project(center);
  const horizonPoint = map.project([wrapLongitude(center.lng + 89.99), 0]);
  const measuredRadius = Math.hypot(horizonPoint.x - centerPoint.x, horizonPoint.y - centerPoint.y);
  const radius = Number.isFinite(measuredRadius) && measuredRadius > 40 ? measuredRadius : Math.min(width, height) * 0.5;
  const x = centerPoint.x + radius * Math.cos(pointLatitude) * Math.sin(deltaLongitude);
  const y = centerPoint.y - radius * (Math.sin(pointLatitude) * Math.cos(centerLatitude) - Math.cos(pointLatitude) * Math.sin(centerLatitude) * Math.cos(deltaLongitude));
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function drawPolarRing(
  context: CanvasRenderingContext2D,
  map: MapLibreMap,
  ring: any[],
  width: number,
  height: number,
) {
  if (!ring.length) return;
  let previous: { x: number; y: number } | null = null;
  let segment: Array<{ x: number; y: number }> = [];
  const steps = 8;
  const flush = () => {
    if (segment.length >= 3) {
      context.moveTo(segment[0].x, segment[0].y);
      segment.slice(1).forEach(point => context.lineTo(point.x, point.y));
      context.closePath();
    }
    segment = [];
    previous = null;
  };
  ring.forEach((coordinate, index) => {
    const next = ring[(index + 1) % ring.length];
    if (!Array.isArray(coordinate) || !Array.isArray(next)) return;
    for (let step = index === 0 ? 0 : 1; step <= steps; step += 1) {
      const ratio = step / steps;
      const longitudeDelta = Number(next[0]) - Number(coordinate[0]);
      const shortestDelta = longitudeDelta > 180 ? longitudeDelta - 360 : longitudeDelta < -180 ? longitudeDelta + 360 : longitudeDelta;
      const point = projectPolarCoordinate(
        map,
        Number(coordinate[0]) + shortestDelta * ratio,
        Number(coordinate[1]) + (Number(next[1]) - Number(coordinate[1])) * ratio,
        width,
        height,
      );
      const outside = !point;
      if (outside) {
        flush();
        continue;
      }
      const seamJump = previous && Math.hypot(point.x - previous.x, point.y - previous.y) > Math.max(width, height) * 0.72;
      if (seamJump) flush();
      segment.push(point);
      previous = point;
    }
  });
  flush();
}

function drawPolarGeometry(
  context: CanvasRenderingContext2D,
  map: MapLibreMap,
  geometry: Geometry,
  width: number,
  height: number,
) {
  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach(ring => drawPolarRing(context, map, ring, width, height));
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach(polygon => polygon.forEach(ring => drawPolarRing(context, map, ring, width, height)));
  } else if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach(child => drawPolarGeometry(context, map, child, width, height));
  }
}

function drawPolarCanvas(
  canvas: HTMLCanvasElement,
  map: MapLibreMap,
  countries: CountryRecord[],
  labels: CountryLabelRecord[],
) {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const backingWidth = Math.max(1, Math.round(width * pixelRatio));
  const backingHeight = Math.max(1, Math.round(height * pixelRatio));
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const north = map.getCenter().lat >= 0;
  const candidates = countries.filter(country => {
    const [minLatitude, maxLatitude] = geometryLatitudeBounds(country.feature.geometry);
    return north ? maxLatitude >= POLAR_CANVAS_SOURCE_LATITUDE : minLatitude <= -POLAR_CANVAS_SOURCE_LATITUDE;
  });
  const polarCountryIds = new Set(candidates.map(country => country.id));
  candidates.forEach(country => {
    context.beginPath();
    drawPolarGeometry(context, map, country.feature.geometry, width, height);
    context.fillStyle = country.color;
    context.globalAlpha = country.id === "010" ? 0.76 : 0.62;
    context.fill("evenodd");
    context.strokeStyle = POLAR_CANVAS_STROKE;
    context.lineWidth = Math.max(0.65, Math.min(1.55, map.getZoom() * 0.12));
    context.globalAlpha = 0.9;
    context.stroke();
  });

  const labelSize = Math.max(10, Math.min(18, 10 + (map.getZoom() - 1.4) * 1.8));
  context.font = `600 ${labelSize}px "Open Sans", Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  labels.forEach(label => {
    if (!label.label || !polarCountryIds.has(label.id)) return;
    const point = projectPolarCoordinate(map, label.longitude, label.latitude, width, height);
    if (!point || point.x < -80 || point.x > width + 80 || point.y < -40 || point.y > height + 40) return;
    context.lineWidth = 3;
    context.strokeStyle = "rgba(6, 20, 35, 0.92)";
    context.strokeText(label.name, point.x, point.y);
    context.fillStyle = "#dbfff6";
    context.fillText(label.name, point.x, point.y);
  });
  context.globalAlpha = 1;
}

function isPolarCamera(map: MapLibreMap) {
  return map.getProjection?.()?.type === "globe" && Math.abs(map.getCenter().lat) >= POLAR_CANVAS_LATITUDE;
}

function applyPolarLayerVisibility(map: MapLibreMap, polar: boolean) {
  const layers = map.getStyle().layers ?? [];
  layers.forEach(layer => {
    const hideInPolar =
      layer.id === "atlas-country-fill" ||
      layer.id === "atlas-country-line" ||
      layer.id === "atlas-country-label" ||
      layer.id === "atlas-locality-label" ||
      /^atlas-adm[12]-(fill|line|label)$/.test(layer.id) ||
      /^atlas-global-adm[1-5]-(fill|line|label)$/.test(layer.id) ||
      layer.id === "atlas-global-places-label";
    if (!hideInPolar || !map.getLayer(layer.id)) return;
    const visibility = polar ? "none" : "visible";
    if (map.getLayoutProperty(layer.id, "visibility") !== visibility) {
      map.setLayoutProperty(layer.id, "visibility", visibility);
    }
  });
}

function globalLabelSize(zoom: number) {
  return Math.min(22, 9 + zoom * 0.82);
}

function desiredProjection(map: MapLibreMap): "globe" | "mercator" {
  const centerLatitude = Math.abs(map.getCenter().lat);
  if (centerLatitude >= POLAR_CANVAS_LATITUDE) return "globe";
  return map.getZoom() >= 4.6 ? "mercator" : "globe";
}

function updateProjectionAndPolarMode(map: MapLibreMap) {
  if (!map.getStyle?.()) return;
  const nextProjection = desiredProjection(map);
  const currentProjection = map.getProjection?.()?.type;
  try {
    if (currentProjection !== nextProjection) {
      map.setProjection({ type: nextProjection });
    }
    applyPolarLayerVisibility(map, nextProjection === "globe" && Math.abs(map.getCenter().lat) >= POLAR_CANVAS_LATITUDE);
  } catch {
    // MapLibre can expose the style object one tick before its style mutation APIs are ready.
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
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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
          "text-allow-overlap": true,
          "text-ignore-placement": true,
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
          "text-allow-overlap": true,
          "text-ignore-placement": true,
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
          "text-allow-overlap": true,
          "text-ignore-placement": true,
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
          "text-allow-overlap": true,
          "text-ignore-placement": true,
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
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
        "symbol-sort-key": ["-", 1000000000, ["coalesce", ["get", "population"], 0]],
      },
      paint: { "text-color": "#9fffee", "text-halo-color": "#061423", "text-halo-width": 1.1 },
    }, insertBefore);
  }
}


const MapLibreWorldScene = forwardRef<MapLibreWorldSceneHandle, Props>(function MapLibreWorldScene(
  { initialView, countries, polarCountries, polarCountryLabels, countryLabels, adm1, adm2, localities, globalMvt, spinEnabled = true, onViewChange, onPick, onUnavailable },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const polarCanvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const polarCountriesRef = useRef(polarCountries);
  const polarLabelsRef = useRef(polarCountryLabels);
  polarCountriesRef.current = polarCountries;
  polarLabelsRef.current = polarCountryLabels;
  const baseZoomRef = useRef(1.25);
  const onViewChangeRef = useRef(onViewChange);
  const onPickRef = useRef(onPick);
  const onUnavailableRef = useRef(onUnavailable);
  const spinEnabledRef = useRef(spinEnabled);
  const reducedMotionRef = useRef(false);
  const [styleReady, setStyleReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
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
      const redrawPolarCanvas = () => {
        const canvas = polarCanvasRef.current;
        if (!canvas) return;
        const polar = isPolarCamera(map);
        canvas.style.opacity = polar ? "1" : "0";
        canvas.style.visibility = polar ? "visible" : "hidden";
        if (polar) {
          drawPolarCanvas(canvas, map, polarCountriesRef.current, polarLabelsRef.current);
        } else {
          const context = canvas.getContext("2d");
          context?.clearRect(0, 0, canvas.width, canvas.height);
        }
      };
      const syncCamera = () => {
        updateProjectionAndPolarMode(map);
        redrawPolarCanvas();
        onViewChangeRef.current?.(toView(map));
      };
      map.on("load", () => {
        setMapLoaded(true);
        syncCamera();
      });
      map.on("style.load", () => {
        map.setProjection({ type: "globe" });
        map.fitBounds([[-180, -58], [180, 84]], { padding: { top: 78, right: 36, bottom: 40, left: 36 }, duration: 0 });
        baseZoomRef.current = map.getZoom();
        if (initialView) map.jumpTo(initialView);
        updateProjectionAndPolarMode(map);
        setStyleReady(true);
        redrawPolarCanvas();
        onViewChangeRef.current?.(toView(map));
      });
      map.on("move", syncCamera);
      map.on("render", redrawPolarCanvas);
      map.on("resize", redrawPolarCanvas);
      map.on("click", event => {
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
      setMapLoaded(false);
      mapRef.current = null;
      map.remove();
    };
  }, [initialView]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    if (globalMvt) {
      addGlobalMvtLayers(map, globalMvt);
      updateProjectionAndPolarMode(map);
    }
    sourceSetData(map, "atlas-countries", featureCollection(countries.map(asCountryFeature) as any));
    sourceSetData(map, "atlas-country-labels", featureCollection(countryLabels.map(asCountryLabelFeature) as any));
    sourceSetData(map, "atlas-adm1", featureCollection(adm1.map(asBoundaryFeature) as any));
    sourceSetData(map, "atlas-adm2", featureCollection(adm2.map(asBoundaryFeature) as any));
    sourceSetData(map, "atlas-localities", featureCollection(localities.map(asLocalityFeature) as any));
  }, [adm1, adm2, countryLabels, countries, globalMvt, localities, styleReady]);

  return       <div className="absolute inset-0 h-full w-full" data-maplibre-world>
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        <canvas ref={polarCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" aria-hidden="true" />
      </div>;
});

MapLibreWorldScene.displayName = "MapLibreWorldScene";
export default MapLibreWorldScene;
