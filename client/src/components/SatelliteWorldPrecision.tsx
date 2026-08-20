// World precision surface: Google satellite/hybrid visual context stays distinct from Atlas source overlays; only GLEIF, geoBoundaries, and GeoNames records make data claims.
/// <reference types="@types/google.maps" />
import { useCallback, useEffect, useMemo, useRef } from "react";
import { feature } from "topojson-client";
import { geoCentroid } from "d3-geo";
import worldTopology from "world-atlas/countries-50m.json";
import { MapView } from "@/components/Map";
import type { ImportedEntity } from "@/components/EntityDatasetImport";

type LegalRecord = { countryCode: string; countryName: string; topologyId: string; total: number | null; sourceStatus: "available" | "unavailable" };
type PrecisionView = { lat: number; lng: number; zoom: number };
type MapFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & { id?: string | number };
type GeographyLayer = { features: Array<{ id: string; name: string; isoCode: string | null; geometry: GeoJSON.Geometry }>; source: { publisher: string; boundaryType: string; representedYear: string; license: string } };
type IndiaGeography = { layers: { adm1: GeographyLayer; adm2: GeographyLayer; localities: { records: Array<{ id: string; name: string; latitude: number; longitude: number; population: number; featureCode: string }>; source: { publisher: string; license: string } } } };

const mapCollection = feature(worldTopology as never, (worldTopology as unknown as { objects: { countries: never } }).objects.countries) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const countryFeatures = mapCollection.features as MapFeature[];
const countryId = (item: MapFeature) => String(item.id ?? "").padStart(3, "0");
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function countryCollection() {
  return {
    type: "FeatureCollection" as const,
    features: countryFeatures.map((item) => ({ ...item, properties: { ...item.properties, atlasLayer: "country", atlasId: countryId(item) } })),
  };
}

function boundaryCollection(layerName: "adm1" | "adm2", layer: GeographyLayer) {
  return {
    type: "FeatureCollection" as const,
    features: layer.features.map((item) => ({ type: "Feature" as const, properties: { atlasLayer: layerName, atlasId: item.id, atlasName: item.name, atlasIso: item.isoCode }, geometry: item.geometry })),
  };
}

function localityCollection(records: IndiaGeography["layers"]["localities"]["records"]) {
  return {
    type: "FeatureCollection" as const,
    features: records.map((item) => ({ type: "Feature" as const, properties: { atlasLayer: "locality", atlasId: item.id, atlasName: item.name, atlasPopulation: item.population, atlasFeatureCode: item.featureCode }, geometry: { type: "Point" as const, coordinates: [item.longitude, item.latitude] } })),
  };
}

export function countryCentroid(id: string): PrecisionView | null {
  const item = countryFeatures.find((candidate) => countryId(candidate) === id);
  if (!item) return null;
  const [lng, lat] = geoCentroid(item);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, zoom: id === "356" ? 4.6 : 4.1 } : null;
}

export default function SatelliteWorldPrecision({ records, importedEntities, selectedId, onSelect, view, onViewChange, onUnavailable }: { records: LegalRecord[]; importedEntities: ImportedEntity[]; selectedId: string | null; onSelect: (id: string) => void; view: PrecisionView; onViewChange: (view: PrecisionView) => void; onUnavailable: () => void }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const initializedRef = useRef(false);
  const indiaLoadedRef = useRef(false);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const entityMarkersRef = useRef<google.maps.Marker[]>([]);
  const importedEntitiesRef = useRef(importedEntities);
  const recordsById = useMemo(() => new Map(records.map((item) => [item.topologyId, item])), [records]);
  const maxTotal = useMemo(() => Math.max(1, ...records.map((item) => item.total ?? 0)), [records]);

  const clearEntityMarkers = useCallback(() => { entityMarkersRef.current.forEach((marker) => marker.setMap(null)); entityMarkersRef.current = []; }, []);
  const refreshEntityMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !initializedRef.current) return;
    clearEntityMarkers();
    importedEntitiesRef.current.filter((item) => item.disposition === "pin" && item.latitude != null && item.longitude != null).forEach((entity) => {
      const marker = new google.maps.Marker({ map, position: { lat: entity.latitude as number, lng: entity.longitude as number }, title: entity.name, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5.3, fillColor: "#b95c78", fillOpacity: 0.95, strokeColor: "#fffefb", strokeWeight: 1.6 }, zIndex: 6 });
      marker.addListener("click", () => {
        const holder = document.createElement("div"); holder.style.cssText = "font-family:Arial,sans-serif;max-width:250px";
        const name = document.createElement("strong"); name.textContent = entity.name || "Imported entity"; holder.append(name);
        const line = document.createElement("div"); line.style.color = "#56605a"; line.textContent = `${entity.entityCategory || "Entity"} · ${entity.coordinatePrecision || "precision not supplied"}`; holder.append(line);
        const note = document.createElement("small"); note.textContent = `Private browser-local preview · ${entity.publisher || "publisher missing"} · ${entity.coordinateSource || "coordinate source missing"}`; holder.append(note);
        infoWindowRef.current?.setContent(holder); infoWindowRef.current?.open({ map, anchor: marker });
      });
      entityMarkersRef.current.push(marker);
    });
  }, [clearEntityMarkers]);

  const applyStyle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom() ?? view.zoom;
    map.data.setStyle((dataFeature) => {
      const atlasLayer = dataFeature.getProperty("atlasLayer");
      if (atlasLayer === "country") {
        const id = String(dataFeature.getProperty("atlasId"));
        const record = recordsById.get(id);
        const intensity = record?.total ? 0.04 + Math.min(0.34, Math.log10(record.total + 1) / Math.log10(maxTotal + 1) * 0.34) : 0.025;
        return { fillColor: id === selectedId ? "#b95c78" : "#0f766e", fillOpacity: id === selectedId ? 0.42 : intensity, strokeColor: id === selectedId ? "#8f344f" : "#0f766e", strokeOpacity: id === selectedId ? 0.9 : 0.34, strokeWeight: id === selectedId ? 2 : 0.6, clickable: true };
      }
      if (atlasLayer === "adm1") return { visible: selectedId === "356" && zoom >= 4.9, fillOpacity: 0.015, fillColor: "#ba7a48", strokeColor: "#ba7a48", strokeOpacity: 0.8, strokeWeight: 1.15, clickable: true };
      if (atlasLayer === "adm2") return { visible: selectedId === "356" && zoom >= 6.6, fillOpacity: 0.006, fillColor: "#d4ae54", strokeColor: "#d4ae54", strokeOpacity: 0.7, strokeWeight: 0.7, clickable: true };
      if (atlasLayer === "locality") return { visible: selectedId === "356" && zoom >= 9.5, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 2.3, fillColor: "#2f837e", fillOpacity: 0.82, strokeColor: "#fffefb", strokeWeight: 1 }, clickable: true };
      return { visible: false };
    });
  }, [maxTotal, recordsById, selectedId, view.zoom]);

  const loadIndiaGeography = useCallback(async () => {
    if (indiaLoadedRef.current || !mapRef.current) return;
    const response = await fetch("/data/world-india-geography.json");
    if (!response.ok) return;
    const geography = await response.json() as IndiaGeography;
    const map = mapRef.current;
    map.data.addGeoJson(boundaryCollection("adm1", geography.layers.adm1));
    map.data.addGeoJson(boundaryCollection("adm2", geography.layers.adm2));
    map.data.addGeoJson(localityCollection(geography.layers.localities.records));
    indiaLoadedRef.current = true;
    applyStyle();
  }, [applyStyle]);

  const onMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.setMapTypeId(google.maps.MapTypeId.HYBRID);
    map.setOptions({ minZoom: 2, maxZoom: 22, disableDefaultUI: true, mapTypeControl: false, fullscreenControl: false, zoomControl: false, streetViewControl: false, keyboardShortcuts: false, gestureHandling: "greedy", clickableIcons: false });
    map.data.addGeoJson(countryCollection());
    infoWindowRef.current = new google.maps.InfoWindow();
    map.data.addListener("click", (event: google.maps.Data.MouseEvent) => {
      const atlasLayer = event.feature.getProperty("atlasLayer");
      if (atlasLayer === "country") {
        onSelect(String(event.feature.getProperty("atlasId")));
        return;
      }
      if (atlasLayer === "locality" && event.latLng) {
        const label = String(event.feature.getProperty("atlasName"));
        const population = Number(event.feature.getProperty("atlasPopulation") ?? 0).toLocaleString();
        infoWindowRef.current?.setContent(`<div style="font-family:Arial,sans-serif;max-width:240px"><strong>${label}</strong><br/><span style="color:#56605a">GeoNames locality reference · population ${population}</span><br/><small>This is a place reference, not an entity location claim.</small></div>`);
        infoWindowRef.current?.setPosition(event.latLng);
        infoWindowRef.current?.open({ map });
      }
    });
    map.addListener("zoom_changed", applyStyle);
    map.addListener("idle", () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (center && zoom != null) onViewChange({ lat: Number(center.lat().toFixed(6)), lng: Number(center.lng().toFixed(6)), zoom: Number(clamp(zoom, 2, 22).toFixed(2)) });
    });
    initializedRef.current = true;
    applyStyle();
    refreshEntityMarkers();
  }, [applyStyle, onSelect, onViewChange, refreshEntityMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initializedRef.current) return;
    map.panTo({ lat: view.lat, lng: view.lng });
    if (Math.abs((map.getZoom() ?? 0) - view.zoom) > 0.08) map.setZoom(view.zoom);
  }, [view.lat, view.lng, view.zoom]);
  useEffect(() => { applyStyle(); if (selectedId === "356") void loadIndiaGeography(); }, [applyStyle, loadIndiaGeography, selectedId]);
  useEffect(() => { importedEntitiesRef.current = importedEntities; refreshEntityMarkers(); }, [importedEntities, refreshEntityMarkers]);
  useEffect(() => () => clearEntityMarkers(), [clearEntityMarkers]);

  return <div data-venture-overlay className="absolute inset-0 z-0 bg-[#20281f] select-none" onPointerDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}>
    <MapView className="atlas-precision-map h-full w-full" initialCenter={{ lat: view.lat, lng: view.lng }} initialZoom={view.zoom} options={{ minZoom: 2, maxZoom: 22, disableDefaultUI: true, mapTypeControl: false, fullscreenControl: false, zoomControl: false, streetViewControl: false, keyboardShortcuts: false, gestureHandling: "greedy", clickableIcons: false }} onMapReady={onMapReady} onMapUnavailable={onUnavailable} />
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/20 bg-[#172018]/90 px-4 py-2 font-mono text-[9px] uppercase tracking-[.13em] text-white/90 shadow-lg">Google hybrid visual context · imagery to zoom 22 · Atlas overlays retain their own source and precision</div>
  </div>;
}
