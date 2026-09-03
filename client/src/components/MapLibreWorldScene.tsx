import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMapClass, setWorkerUrl } from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature, StyleSpecification } from "maplibre-gl";
import type { GlobalMvtManifest } from "@/lib/worldMvt";
import { globalMvtTileUrl } from "@/lib/worldMvt";
import { splitGeometryAtAntimeridian } from "@/lib/antimeridian";
import {
  SPIN_RESUME_DELAY_MS,
  SPIN_START_DELAY_MS,
  planSpinSegment,
  spinIneligibility,
} from "@/lib/globeSpin";
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
/**
 * One marker per *interned position*, not per record. The entity source resolves 11,370 records to
 * 366 distinct coordinates, because a state-level scheme lands on its state's centroid — drawing one
 * marker per record would stack thousands on single pixels and claim precision the data lacks. See
 * `clusterEntities` in `lib/entityAtlas.ts`.
 */
export type EntityMarker = {
  /** Interned position index, and the id handed back on pick. */
  id: string;
  longitude: number;
  latitude: number;
  /** Records at this position. Never truncated, so the marker size cannot lie. */
  count: number;
  /** Marker radius basis: `sqrt(count)`, clamped. Area then reads as count. */
  weight: number;
  /** Best `EntityPrecision` index present here; drives colour, so approximation stays visible. */
  precision: number;
  label: string;
  selected: boolean;
};

type PickKind = "country" | "adm1" | "adm2" | "adm3" | "adm4" | "adm5" | "locality" | "entity";

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
  entities?: EntityMarker[];
  globalMvt?: GlobalMvtManifest | null;
  spinEnabled?: boolean;
  onViewChange?: (view: ViewState & { bounds: [[number, number], [number, number]] }) => void;
  onPick?: (pick: { kind: PickKind; id: string; feature?: MapGeoJSONFeature }) => void;
  onUnavailable?: () => void;
};

const MAP_MAX_ZOOM = 24;

// A stable default: a fresh `[]` in the parameter list would be a new identity every render, and
// every memo downstream of `entities` keys on it.
const EMPTY_ENTITIES: EntityMarker[] = [];

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
    geometry: splitGeometryAtAntimeridian(item.feature.geometry),
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
    geometry: splitGeometryAtAntimeridian(item.geometry),
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

function asEntityFeature(item: EntityMarker): Feature {
  return {
    type: "Feature",
    id: item.id,
    geometry: { type: "Point", coordinates: [item.longitude, item.latitude] },
    properties: {
      atlasId: item.id,
      name: item.label,
      count: item.count,
      weight: item.weight,
      precision: item.precision,
      selected: item.selected,
    },
  } as Feature;
}

// Content signatures for the five GeoJSON sources. See `useGeoJsonSource` for why
// these exist rather than keying the uploads on the arrays' object identities.
type FlaggedRecord = { id: string; label: boolean; selected: boolean };

function flagSignature(records: FlaggedRecord[]) {
  return records.map(item => `${item.id}~${+item.label}${+item.selected}`).join("|");
}

function countriesSignature(records: CountryRecord[]) {
  return records
    .map(item => `${item.id}~${item.color}~${+item.visible}${+item.label}${+item.selected}`)
    .join("|");
}

function entitiesSignature(records: EntityMarker[]) {
  return records.map(item => `${item.id}~${item.count}~${item.precision}${+item.selected}`).join("|");
}

function atlasStyle(input: {
  countries: CountryRecord[];
  countryLabels: CountryLabelRecord[];
  adm1: BoundaryRecord[];
  adm2: BoundaryRecord[];
  localities: LocalityRecord[];
  entities: EntityMarker[];
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
      "atlas-entities": { type: "geojson", data: featureCollection(input.entities.map(asEntityFeature) as any) },
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
      // Entity markers last, so they sit above every geography layer. Three layers rather than one
      // because the three things a marker has to say are independent: *where* (the ring, drawn only
      // for approximate placements so an aggregate never looks like a street address), *how many*
      // (radius, area-proportional to count), and *which* (the label, once there is room).
      {
        id: "atlas-entity-halo",
        type: "circle",
        source: "atlas-entities",
        // precision 0 is `point_city` — a real coordinate, so no ring. 1/2 are district and state
        // centroids, where the marker stands for an area and must not read as a pin.
        filter: [">", ["get", "precision"], 0],
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            1, ["*", 2.6, ["get", "weight"]],
            4, ["*", 4.0, ["get", "weight"]],
            8, ["*", 6.2, ["get", "weight"]],
            14, ["*", 8.4, ["get", "weight"]],
          ],
          "circle-color": "transparent",
          "circle-stroke-color": ["match", ["get", "precision"], 1, "#ffbf69", "#f2825b"],
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.34,
        },
      },
      {
        id: "atlas-entity-core",
        type: "circle",
        source: "atlas-entities",
        paint: {
          // sqrt(count) is baked into `weight` upstream, so radius grows with the square root of
          // the count and the *area* reads as the count. Linear radius would make a 4,541-record
          // position 4,541× the ink of a single one.
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            1, ["*", 1.5, ["get", "weight"]],
            4, ["*", 2.3, ["get", "weight"]],
            8, ["*", 3.5, ["get", "weight"]],
            14, ["*", 4.8, ["get", "weight"]],
          ],
          "circle-color": ["match", ["get", "precision"], 0, "#45d7c0", 1, "#ffbf69", "#f2825b"],
          "circle-opacity": 0.66,
          "circle-stroke-color": ["case", ["boolean", ["get", "selected"], false], "#ffffff", "#061423"],
          "circle-stroke-width": ["case", ["boolean", ["get", "selected"], false], 2, 0.8],
          "circle-stroke-opacity": 0.9,
        },
      },
      {
        id: "atlas-entity-label",
        type: "symbol",
        source: "atlas-entities",
        minzoom: 3.4,
        layout: {
          // The count on aggregates, the name on singletons: at a state centroid holding 4,541
          // records the one useful fact is the number, and one record's name is only readable when
          // it is the only thing there.
          "text-field": [
            "case",
            [">", ["get", "count"], 1], ["to-string", ["get", "count"]],
            ["get", "name"],
          ],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3.4, 10, 8, 12, 14, 14],
          "text-offset": [0, 0.1],
          "text-padding": 2,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-keep-upright": true,
          "symbol-avoid-edges": true,
          // Busiest first, so when placement has to drop labels it drops the quiet positions.
          "symbol-sort-key": ["-", 1000000000, ["get", "count"]],
        },
        paint: { "text-color": "#f4fbff", "text-halo-color": "#061423", "text-halo-width": 1.3 },
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

/**
 * Uploads `records` to one GeoJSON source, but only when their *content* changed.
 *
 * All five arrays are derived upstream from `mapView.bounds` — a fresh array on
 * every camera update — and the memos feeding adm2/localities hand back a
 * brand-new `[]` whenever it changes. While all five were pushed from a single
 * effect keyed on all five identities, one drag re-uploaded every source per view
 * update, the whole 241-country topology included.
 *
 * That is not a cheap no-op: each `setData` re-serialises to the worker, re-runs
 * geojson-vt, re-subdivides the result for the globe, and restarts symbol
 * placement. Restarted placement is why labels faded in at positions computed for
 * an older camera — the far-side label that looked like missing occlusion — and
 * the re-tiling is why fast rotation stuttered instead of feeling solid.
 *
 * Geometry is deliberately absent from the signatures: it is keyed by record id,
 * and every geometry source here is load-once — the static countries topology,
 * and India's tiles, which are requested at one zoom per layer, so a given id's
 * geometry never arrives twice at a different level of detail.
 */
function useGeoJsonSource<T>(
  mapRef: { current: MapLibreMap | null },
  ready: boolean,
  sourceId: string,
  records: T[],
  signature: string,
  toFeature: (item: T) => Feature
) {
  const recordsRef = useRef(records);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    sourceSetData(map, sourceId, featureCollection(recordsRef.current.map(toFeature) as any));
  }, [mapRef, ready, signature, sourceId, toFeature]);
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
  { initialView, countries, countryLabels, adm1, adm2, localities, entities = EMPTY_ENTITIES, globalMvt, spinEnabled = true, onViewChange, onPick, onUnavailable },
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
  // The idle-spin loop ends itself whenever spinning is not wanted, so it has to be re-armed from
  // outside. The map effect publishes its starter here.
  const startSpinRef = useRef<(() => void) | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  onViewChangeRef.current = onViewChange;
  onPickRef.current = onPick;
  onUnavailableRef.current = onUnavailable;
  spinEnabledRef.current = spinEnabled;

  // Both directions matter. Switching the spin on has to wake the scheduler, because it
  // stopped itself when it went off; switching it off has to cut the segment already in
  // flight, because that segment runs for 41 seconds.
  useEffect(() => {
    startSpinRef.current?.();
  }, [spinEnabled]);

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
        style: atlasStyle({ countries, countryLabels, adm1, adm2, localities, entities }),
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
      // No `map.on("resize", …)` here. `map.resize()` fires MapLibre's own
      // `resize` event, so a handler that calls `map.resize()` re-enters itself
      // and only stops by exhausting the stack: the browser console recorded 128
      // nested Map.resize → Map.fire → handler frames ending in
      // `RangeError: Maximum call stack size exceeded` inside
      // GlobeTransform._calcMatrices. Container size changes are already driven
      // by the ResizeObserver below, which is the non-recursive edge of the same
      // loop; MapLibre's own `trackResize` covers the window.
      map.on("click", event => {
        // Single hit-test path. The d3 `geoContains` branch that used to run
        // first inverted a projection the renderer no longer uses, and culled
        // anything past the drawn limb, so clicks near the edge of the disc
        // selected nothing.
        const feature = map.queryRenderedFeatures(event.point).find((candidate: MapGeoJSONFeature) => {
          const id = candidate.layer.id;
          // `atlas-entity-core` first in intent as well as in paint order: it is the topmost layer,
          // so queryRenderedFeatures already returns it ahead of the geography underneath, and a
          // click on a marker must not fall through to the state it happens to sit on.
          return id === "atlas-entity-core" || id === "atlas-locality-label" || id === "atlas-global-places-label" || id === "atlas-country-fill" || /atlas-global-adm[1-5]-fill$/.test(id) || /^atlas-adm[12]-fill$/.test(id);
        });
        const id = feature?.properties?.atlasId ?? feature?.id;
        if (!feature || id === undefined || id === null) return;
        const layer = feature.layer.id;
        const globalLevel = layer.match(/atlas-global-(adm[1-5])-fill$/)?.[1] as PickKind | undefined;
        const kind: PickKind = layer === "atlas-entity-core"
          ? "entity"
          : layer.includes("locality") || layer.includes("places")
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
      let spinTimer: number | null = null;
      let spinEasing = false;
      let spinPausedUntil = performance.now() + SPIN_START_DELAY_MS;
      // Always go through a timer rather than calling `spinSegment` inline. Two of the
      // three callers are MapLibre event handlers and `easeTo` fires `movestart`
      // synchronously, so deferring by a macrotask keeps a segment from ever being
      // issued from inside the teardown of the one before it. Cancelling first is the
      // other half: exactly one timer is ever pending, so no caller can leave a second
      // one armed behind the first.
      const armSpin = (delayMs = 0) => {
        if (spinTimer !== null) window.clearTimeout(spinTimer);
        spinTimer = window.setTimeout(spinSegment, Math.max(0, delayMs));
      };
      function spinSegment() {
        spinTimer = null;
        const plan = planSpinSegment({
          enabled: spinEnabledRef.current,
          reducedMotion: reducedMotionRef.current,
          zoom: map.getZoom(),
          moving: map.isMoving(),
          now: performance.now(),
          pausedUntil: spinPausedUntil,
          center: map.getCenter().toArray() as [number, number],
        });
        // `idle` schedules nothing at all: either the spin is off, or a gesture owns
        // the camera and its own `moveend` will re-arm us. The old loop parked a frame
        // callback in both cases and woke 60 times a second to re-learn it.
        if (plan.kind === "idle") return;
        if (plan.kind === "wait") return armSpin(plan.delayMs);
        spinEasing = true;
        map.easeTo({
          center: plan.center,
          duration: plan.durationMs,
          easing: progress => progress,
        });
      }
      // Switching the spin off, or asking for reduced motion, has to cut the segment
      // that is already running — it lasts 41 seconds, and leaving it to finish would
      // keep the globe turning long after the button said it stopped. Only ever our own
      // segment: a gesture owning the camera clears `spinEasing` through its `moveend`
      // before it starts, so `map.stop()` here can never interrupt the user.
      const syncSpin = () => {
        const ineligible = spinIneligibility({
          enabled: spinEnabledRef.current,
          reducedMotion: reducedMotionRef.current,
          zoom: map.getZoom(),
        });
        if (spinEasing && ineligible) {
          // `stop()` fires `moveend`, which clears the flag and re-runs the plan; that
          // plan will be `idle` for the same reason, so nothing is left armed.
          map.stop();
          return;
        }
        armSpin();
      };
      startSpinRef.current = syncSpin;
      const updateReducedMotion = () => {
        reducedMotionRef.current = reducedMotionQuery.matches;
        syncSpin();
      };
      reducedMotionQuery.addEventListener?.("change", updateReducedMotion);
      const pauseSpin = () => {
        spinPausedUntil = performance.now() + SPIN_RESUME_DELAY_MS;
      };
      const spinEvents = ["dragstart", "zoomstart", "rotatestart", "wheel", "mousedown", "touchstart"] as const;
      spinEvents.forEach(eventName => map.on(eventName, pauseSpin));
      // The end of any movement is when to consider the next segment: our own segment
      // finishing, a segment cut short by a gesture, and a gesture settling back
      // inside the spin-eligible range all arrive here.
      const onMoveEnd = () => {
        spinEasing = false;
        armSpin();
      };
      map.on("moveend", onMoveEnd);
      armSpin();

      return () => {
        if (spinTimer !== null) window.clearTimeout(spinTimer);
        startSpinRef.current = null;
        reducedMotionQuery.removeEventListener?.("change", updateReducedMotion);
        spinEvents.forEach(eventName => map.off(eventName, pauseSpin));
        map.off("moveend", onMoveEnd);
        resizeObserver.disconnect();
        setStyleReady(false);
        mapRef.current = null;
        map.remove();
      };
  }, [initialView]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !globalMvt) return;
    addGlobalMvtLayers(map, globalMvt);
    ensureGlobeProjection(map);
  }, [globalMvt, styleReady]);

  const countriesKey = useMemo(() => countriesSignature(countries), [countries]);
  const countryLabelsKey = useMemo(() => flagSignature(countryLabels), [countryLabels]);
  const adm1Key = useMemo(() => flagSignature(adm1), [adm1]);
  const adm2Key = useMemo(() => flagSignature(adm2), [adm2]);
  const localitiesKey = useMemo(() => flagSignature(localities), [localities]);
  const entitiesKey = useMemo(() => entitiesSignature(entities), [entities]);

  useGeoJsonSource(mapRef, styleReady, "atlas-countries", countries, countriesKey, asCountryFeature);
  useGeoJsonSource(mapRef, styleReady, "atlas-country-labels", countryLabels, countryLabelsKey, asCountryLabelFeature);
  useGeoJsonSource(mapRef, styleReady, "atlas-adm1", adm1, adm1Key, asBoundaryFeature);
  useGeoJsonSource(mapRef, styleReady, "atlas-adm2", adm2, adm2Key, asBoundaryFeature);
  useGeoJsonSource(mapRef, styleReady, "atlas-localities", localities, localitiesKey, asLocalityFeature);
  useGeoJsonSource(mapRef, styleReady, "atlas-entities", entities, entitiesKey, asEntityFeature);

  return (
    <div className="absolute inset-0 h-full w-full" data-maplibre-world>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
});

MapLibreWorldScene.displayName = "MapLibreWorldScene";
export default MapLibreWorldScene;
