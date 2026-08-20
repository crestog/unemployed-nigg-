// Global Venture Atlas style reminder: editorial cartography, warm mineral paper, source-separated geography, teal legal-entity evidence, ochre source notes, coral coverage limits.
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { feature } from "topojson-client";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import worldTopology from "world-atlas/countries-50m.json";
import { ChevronLeft, Copy, ExternalLink, LocateFixed, Search, X, ZoomIn, ZoomOut } from "lucide-react";
import SatelliteWorldPrecision, { countryCentroid } from "@/components/SatelliteWorldPrecision";
import EntityDatasetImport, { type ImportedEntity } from "@/components/EntityDatasetImport";

type LayerId = "legal" | "policy";
type Camera = { x: number; y: number; k: number };
type LegalRecord = { countryCode: string; countryName: string; topologyId: string; total: number | null; goldenCopyPublishedAt: string | null; sourceQuery: string; sourceStatus: "available" | "unavailable"; error?: string };
type Layer = { label: string; publisher: string; sourceUrl: string; termsUrl?: string; license?: string; recordDefinition: string; exclusions: string[]; records?: LegalRecord[]; status?: string };
type WorldRelease = { releaseId: string; generatedAt: string; integrity: { syntheticRecords: number; sourceCountryGeometryCount: number; availableCountryQueries: number; unavailableCountryQueries: number }; geography: { publisher: string; title: string; license: string; sourceUrl: string; use: string }; layers: { legalEntities: Layer; policyInitiatives: Layer } };
type MapFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & { id?: string | number };

const mapCollection = feature(worldTopology as never, (worldTopology as unknown as { objects: { countries: never } }).objects.countries) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const countryFeatures = mapCollection.features as MapFeature[];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const integer = (value: number | null | undefined) => value == null ? "Unavailable" : Math.round(value).toLocaleString();
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Unavailable";
const toTopologyId = (featureItem: MapFeature) => String(featureItem.id ?? "").padStart(3, "0");
const MIN_WORLD_ZOOM = 0.45;
const MAX_WORLD_ZOOM = 36;

function SourceDot({ tone = "teal" }: { tone?: "teal" | "ochre" | "coral" }) {
  const color = tone === "teal" ? "bg-[#0f766e]" : tone === "ochre" ? "bg-[#ba7a48]" : "bg-[#b95c78]";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
}

export default function GlobalVentureAtlas() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const restoredRef = useRef(false);
  const [release, setRelease] = useState<WorldRelease | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 1200, height: 760 });
  const [camera, setCamera] = useState<Camera>({ x: 600, y: 380, k: 1 });
  const [layer, setLayer] = useState<LayerId>(() => new URLSearchParams(window.location.hash.replace(/^#/, "")).get("wl") === "policy" ? "policy" : "legal");
  const [selectedId, setSelectedId] = useState<string | null>(() => new URLSearchParams(window.location.hash.replace(/^#/, "")).get("wc"));
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [drag, setDrag] = useState<{ pointer: number; x: number; y: number } | null>(null);
  const [precisionMode, setPrecisionMode] = useState(() => new URLSearchParams(window.location.hash.replace(/^#/, "")).get("wm") === "hybrid");
  const [precisionNotice, setPrecisionNotice] = useState<string | null>(null);
  const [precisionView, setPrecisionView] = useState(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const lat = Number.parseFloat(params.get("wlat") ?? "20.5937");
    const lng = Number.parseFloat(params.get("wlng") ?? "78.9629");
    const zoom = Number.parseFloat(params.get("wzoom") ?? "3.3");
    return { lat: Number.isFinite(lat) ? lat : 20.5937, lng: Number.isFinite(lng) ? lng : 78.9629, zoom: Number.isFinite(zoom) ? clamp(zoom, 2, 22) : 3.3 };
  });
  const [importedEntities, setImportedEntities] = useState<ImportedEntity[]>([]);

  useEffect(() => { fetch("/data/world-venture.json").then((response) => { if (!response.ok) throw new Error("World source release unavailable"); return response.json(); }).then(setRelease).catch((cause: Error) => setError(cause.message)); }, []);
  useEffect(() => { if (!surfaceRef.current) return; const observer = new ResizeObserver((entries) => { const rect = entries[0]?.contentRect; if (!rect) return; setSize({ width: Math.max(320, rect.width), height: Math.max(560, rect.height) }); }); observer.observe(surfaceRef.current); return () => observer.disconnect(); }, []);
  useEffect(() => { setCamera((current) => current.x === 600 && current.y === 380 ? { ...current, x: size.width / 2, y: size.height / 2 } : current); }, [size.height, size.width]);

  const activeLayer = release ? (layer === "legal" ? release.layers.legalEntities : release.layers.policyInitiatives) : null;
  const recordsById = useMemo(() => new Map((release?.layers.legalEntities.records ?? []).map((record) => [record.topologyId, record])), [release]);
  const maxTotal = useMemo(() => Math.max(1, ...(release?.layers.legalEntities.records ?? []).map((record) => record.total ?? 0)), [release]);
  const selectedFeature = useMemo(() => countryFeatures.find((item) => toTopologyId(item) === selectedId) ?? null, [selectedId]);
  const selectedRecord = selectedId ? recordsById.get(selectedId) ?? null : null;
  const selectedName = selectedRecord?.countryName ?? selectedFeature?.properties?.name ?? "Selected jurisdiction";
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return countryFeatures.filter((item) => `${recordsById.get(toTopologyId(item))?.countryName ?? ""} ${item.properties?.name ?? ""}`.toLowerCase().includes(needle)).slice(0, 9);
  }, [query, recordsById]);
  const compareRecords = compareIds.map((id) => ({ id, feature: countryFeatures.find((item) => toTopologyId(item) === id), record: recordsById.get(id) ?? null })).filter((item) => item.feature);

  const projection = useMemo(() => geoNaturalEarth1().fitExtent([[34, 80], [size.width - 34, size.height - 88]], mapCollection), [size.height, size.width]);
  const pathMaker = useMemo(() => geoPath(projection), [projection]);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (params.get("world") !== "1") return;
    const nextLayer = params.get("wl") === "policy" ? "policy" : "legal";
    const nextId = params.get("wc");
    const nextK = Number.parseFloat(params.get("wk") ?? "");
    const nextX = Number.parseFloat(params.get("wx") ?? "");
    const nextY = Number.parseFloat(params.get("wy") ?? "");
    setLayer(nextLayer);
    setSelectedId(nextId || null);
    setPrecisionMode(params.get("wm") === "hybrid");
    const lat = Number.parseFloat(params.get("wlat") ?? ""); const lng = Number.parseFloat(params.get("wlng") ?? ""); const zoom = Number.parseFloat(params.get("wzoom") ?? "");
    if ([lat, lng, zoom].every(Number.isFinite)) setPrecisionView({ lat, lng, zoom: clamp(zoom, 2, 22) });
    if ([nextK, nextX, nextY].every(Number.isFinite)) setCamera({ k: clamp(nextK, MIN_WORLD_ZOOM, MAX_WORLD_ZOOM), x: nextX, y: nextY });
  }, []);
  useEffect(() => {
    const restoreFromHash = () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      if (params.get("world") !== "1") return;
      setLayer(params.get("wl") === "policy" ? "policy" : "legal");
      setSelectedId(params.get("wc") || null);
      setPrecisionMode(params.get("wm") === "hybrid");
      const lat = Number.parseFloat(params.get("wlat") ?? ""); const lng = Number.parseFloat(params.get("wlng") ?? ""); const zoom = Number.parseFloat(params.get("wzoom") ?? "");
      if ([lat, lng, zoom].every(Number.isFinite)) setPrecisionView({ lat, lng, zoom: clamp(zoom, 2, 22) });
      const nextK = Number.parseFloat(params.get("wk") ?? "");
      const nextX = Number.parseFloat(params.get("wx") ?? "");
      const nextY = Number.parseFloat(params.get("wy") ?? "");
      if ([nextK, nextX, nextY].every(Number.isFinite)) setCamera({ k: clamp(nextK, MIN_WORLD_ZOOM, MAX_WORLD_ZOOM), x: nextX, y: nextY });
    };
    window.addEventListener("hashchange", restoreFromHash);
    return () => window.removeEventListener("hashchange", restoreFromHash);
  }, []);
  useEffect(() => { if (!release) return; const timeout = window.setTimeout(() => { const params = new URLSearchParams(); params.set("world", "1"); params.set("wl", layer); params.set("wx", camera.x.toFixed(1)); params.set("wy", camera.y.toFixed(1)); params.set("wk", camera.k.toFixed(3)); if (precisionMode) { params.set("wm", "hybrid"); params.set("wlat", precisionView.lat.toFixed(6)); params.set("wlng", precisionView.lng.toFixed(6)); params.set("wzoom", precisionView.zoom.toFixed(2)); } if (selectedId) params.set("wc", selectedId); window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${params.toString()}`); }, 260); return () => window.clearTimeout(timeout); }, [camera, layer, precisionMode, precisionView, release, selectedId]);

  const selectCountry = (id: string) => { setSelectedId(id); setQuery(""); setShowResults(false); };
  const focusCountry = (id: string) => { selectCountry(id); if (precisionMode) { const center = countryCentroid(id); if (center) setPrecisionView(center); return; } const center = pathMaker.centroid(countryFeatures.find((item) => toTopologyId(item) === id) as GeoJSON.Feature); if (Number.isFinite(center[0]) && Number.isFinite(center[1])) setCamera({ x: size.width / 2 - (center[0] - size.width / 2) * 2.4, y: size.height / 2 - (center[1] - size.height / 2) * 2.4, k: 2.4 }); };
  const reset = () => { setCamera({ x: size.width / 2, y: size.height / 2, k: 1 }); setPrecisionView({ lat: 20.5937, lng: 78.9629, zoom: 3.3 }); setSelectedId(null); };
  const addCompare = () => { if (!selectedId) return; setCompareIds((current) => current.includes(selectedId) ? current : [...current.slice(-1), selectedId]); };
  const copyTitle = async () => { if (!selectedName) return; try { await navigator.clipboard.writeText(selectedName); } catch { /* Clipboard access is optional and must not affect the map. */ } };
  const overlayTarget = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest("[data-venture-overlay]"));
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => { if (overlayTarget(event.target)) return; movedRef.current = false; event.currentTarget.setPointerCapture(event.pointerId); setDrag({ pointer: event.pointerId, x: event.clientX, y: event.clientY }); };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => { if (!drag || drag.pointer !== event.pointerId) return; const dx = event.clientX - drag.x; const dy = event.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true; setCamera((current) => ({ ...current, x: current.x + dx, y: current.y + dy })); setDrag({ pointer: event.pointerId, x: event.clientX, y: event.clientY }); };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => { if (drag?.pointer === event.pointerId) setDrag(null); };
  const zoomAt = (px: number, py: number, factor: number) => setCamera((current) => { const nextK = clamp(current.k * factor, MIN_WORLD_ZOOM, MAX_WORLD_ZOOM); const mapX = (px - current.x) / current.k + size.width / 2; const mapY = (py - current.y) / current.k + size.height / 2; return { k: nextK, x: px - (mapX - size.width / 2) * nextK, y: py - (mapY - size.height / 2) * nextK }; });
  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => { if (overlayTarget(event.target)) return; event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.0015)); };
  const onDoubleClick = (event: ReactPointerEvent<HTMLDivElement>) => { if (overlayTarget(event.target)) return; const rect = event.currentTarget.getBoundingClientRect(); zoomAt(event.clientX - rect.left, event.clientY - rect.top, 1.8); };
  const layerInfo = layer === "legal" ? { label: "Legal entities", tone: "teal" as const, description: "GLEIF LEI reference records by legal-address country." } : { label: "Policy initiatives", tone: "ochre" as const, description: "EC-OECD STIP Compass snapshot remains source-hosted until its complete release is normalized." };

  if (error) return <div className="grid min-h-[calc(100vh-68px)] place-items-center bg-[#fbfaf8] p-6 text-center"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#b95c78]">World source unavailable</div><h1 className="mt-4 font-display text-4xl">{error}</h1><p className="mt-3 max-w-md text-sm leading-6 text-[#666961]">The existing Industry Atlas remains available. Rebuild the documented world release to retry this source-bounded pilot.</p></div></div>;
  if (!release || !activeLayer) return <div className="grid min-h-[calc(100vh-68px)] place-items-center bg-[#fbfaf8]"><div className="animate-pulse font-display text-3xl text-[#0f766e]">Loading the world source release…</div></div>;

  return <section ref={surfaceRef} className={`relative min-h-[calc(100vh-68px)] overflow-hidden bg-[#fbfaf8] select-none ${drag ? "cursor-grabbing" : "cursor-grab"}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => setDrag(null)} onWheel={onWheel} onDoubleClick={onDoubleClick}>
    {precisionMode ? <SatelliteWorldPrecision records={release.layers.legalEntities.records ?? []} importedEntities={importedEntities} selectedId={selectedId} onSelect={selectCountry} view={precisionView} onViewChange={setPrecisionView} onUnavailable={() => { setPrecisionMode(false); setPrecisionNotice("Satellite visual context could not be loaded. Atlas geometry remains interactive and all source layers are still available."); }} /> : <svg className="absolute inset-0 h-full w-full touch-none" aria-label="World map of source-bounded legal entity and policy evidence" role="img" viewBox={`0 0 ${size.width} ${size.height}`}>
      <defs><pattern id="world-grid" width="52" height="52" patternUnits="userSpaceOnUse"><path d="M 52 0 L 0 0 0 52" fill="none" stroke="rgba(110,105,93,.12)" strokeWidth="1" /></pattern></defs>
      <rect width={size.width} height={size.height} fill="#fbfaf8" /><rect width={size.width} height={size.height} fill="url(#world-grid)" opacity=".58" />
      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.k}) translate(${-size.width / 2} ${-size.height / 2})`}>
        {countryFeatures.map((country) => { const id = toTopologyId(country); const record = recordsById.get(id); const active = selectedId === id; const hasData = layer === "legal" ? record?.sourceStatus === "available" && (record.total ?? 0) > 0 : false; const intensity = record?.total ? 0.1 + Math.min(0.7, Math.log10(record.total + 1) / Math.log10(maxTotal + 1) * 0.7) : 0; const fill = layer === "legal" && hasData ? `rgba(15,118,110,${intensity.toFixed(3)})` : layer === "policy" ? "rgba(186,122,72,.08)" : "rgba(118,119,109,.045)"; return <path key={id} d={pathMaker(country) ?? ""} fill={active ? "rgba(185,92,120,.56)" : fill} stroke={active ? "#8f344f" : hasData ? "rgba(15,118,110,.42)" : "rgba(105,106,98,.24)"} strokeWidth={active ? 1.5 : 0.65} className="cursor-pointer transition-[fill,stroke] duration-150" onClick={(event) => { event.stopPropagation(); if (!movedRef.current) selectCountry(id); }}><title>{record?.countryName ?? country.properties?.name ?? "Jurisdiction"}{layer === "legal" && record?.total != null ? ` · ${integer(record.total)} LEI records` : ""}</title></path>; })}
      </g>
    </svg>}

    <div data-venture-overlay className="absolute left-4 top-4 z-20 max-w-[min(630px,calc(100vw-2rem))] select-none" onPointerDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#d9d6ca] bg-[#fffefb]/95 px-4 py-3 shadow-sm backdrop-blur"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#2f837e]">World</span><span className="text-[#b5b2a8]">/</span><span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#777970]">{layerInfo.label}</span>{selectedId && <><span className="text-[#b5b2a8]">/</span><span className="max-w-[180px] truncate font-mono text-[9px] uppercase tracking-[.14em] text-[#b95c78]">{selectedName}</span></>}</div>
      <div className="mt-2 flex flex-wrap gap-2"><div className="inline-flex rounded-full border border-[#d9d6ca] bg-[#fffefb]/95 p-1 shadow-sm backdrop-blur" role="tablist" aria-label="World evidence layers">
        <button role="tab" aria-selected={layer === "legal"} onClick={() => setLayer("legal")} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${layer === "legal" ? "bg-[#0f766e] text-white" : "text-[#5d6058] hover:bg-[#f0ede3]"}`}>Legal entities</button>
        <button role="tab" aria-selected={layer === "policy"} onClick={() => setLayer("policy")} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${layer === "policy" ? "bg-[#ba7a48] text-white" : "text-[#5d6058] hover:bg-[#f0ede3]"}`}>Policy initiatives</button>
      </div><button onClick={() => { setPrecisionNotice(null); setPrecisionMode((current) => !current); }} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur ${precisionMode ? "border-[#2f837e] bg-[#daf0eb]/95 text-[#16645f]" : "border-[#d9d6ca] bg-[#fffefb]/95 text-[#5d6058] hover:border-[#2f837e]"}`}>{precisionMode ? "Satellite precision · on" : "Satellite precision · off"}</button><EntityDatasetImport onEntitiesChange={setImportedEntities} /></div>
      {precisionNotice && <div className="mt-2 max-w-[460px] border border-[#dfc681] bg-[#fffaf0]/98 px-3 py-2 text-xs leading-5 text-[#765b21] shadow-sm">{precisionNotice}</div>}
    </div>

    <aside data-venture-overlay className="absolute left-4 top-[128px] z-20 hidden w-[310px] border border-[#d5d2c7] bg-[#fffefb]/94 p-4 shadow-sm backdrop-blur lg:block select-none" onPointerDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[.16em] text-[#2f837e]"><span>Field guide / world evidence</span><span className="border border-[#dfc681] bg-[#f6ebc9] px-1.5 py-0.5 text-[#8a6417]">source layers</span></div>
      <p className="mt-3 text-sm leading-6 text-[#5d6058]">{precisionMode ? "Google hybrid imagery gives visual context; Atlas boundaries and evidence retain their own sources, dates, and limits." : "Countries are fields, not containers of “everything.” Zoom to inspect the publisher and its exact inclusion rule."}</p>
      <div className="mt-4 space-y-2 border-t border-[#e4e1d7] pt-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#73766d]"><p><span className="mr-2 text-[#0f766e]">01</span>Teal = GLEIF legal-address coverage</p><p><span className="mr-2 text-[#ba7a48]">02</span>Ochre = policy source context</p><p><span className="mr-2 text-[#b95c78]">03</span>Coral = selected field or coverage limit</p>{precisionMode && <p><span className="mr-2 text-[#455b5a]">04</span>India: geoBoundaries ADM1/ADM2 at zoom; GeoNames places at local zoom</p>}{importedEntities.length > 0 && <p><span className="mr-2 text-[#b95c78]">05</span>{importedEntities.filter((item) => item.disposition === "pin").length} private source-coordinate pins from this browser session</p>}</div>
    </aside>

    <div data-venture-overlay className="absolute bottom-4 left-4 z-30 w-[min(520px,calc(100vw-2rem))] select-none" onPointerDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}>
      <div className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#2f837e]" /><input value={query} onFocus={() => setShowResults(true)} onChange={(event) => { setQuery(event.target.value); setShowResults(true); }} placeholder="Find a country or jurisdiction…" className="w-full rounded-xl border border-[#d6d3c8] bg-[#fffefb]/97 py-3 pl-11 pr-4 text-sm text-[#30332f] shadow-[0_8px_25px_rgba(36,40,34,.09)] outline-none transition focus:border-[#2f837e] focus:ring-2 focus:ring-[#2f837e]/20" />
        {showResults && query && <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 max-h-64 overflow-auto rounded-xl border border-[#d6d3c8] bg-[#fffefb] p-2 shadow-xl"><div className="px-3 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#777970]">Jurisdiction matches</div>{matches.length ? matches.map((item) => { const id = toTopologyId(item); const record = recordsById.get(id); return <button key={id} onClick={() => focusCountry(id)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#eef5f2]"><span className="min-w-0"><span className="block truncate text-sm font-medium text-[#30332f]">{record?.countryName ?? item.properties?.name}</span><span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[.12em] text-[#777970]">{layer === "legal" && record?.total != null ? `${integer(record.total)} LEI records` : layer === "policy" ? "STIP source context" : "No current source record"}</span></span><ChevronLeft className="h-4 w-4 rotate-180 text-[#2f837e]" /></button>; }) : <p className="px-3 py-4 text-sm text-[#777970]">No world-map geometry or current source record matches that search.</p>}</div>}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#d6d3c8] bg-[#fffefb]/95 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#6f7169]">Drag to roam</span><span className="rounded-full border border-[#d6d3c8] bg-[#fffefb]/95 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#6f7169]">Wheel at cursor</span><span className="rounded-full border border-[#d6d3c8] bg-[#fffefb]/95 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#6f7169]">{release.integrity.availableCountryQueries} source fields</span></div>
    </div>

    <div data-venture-overlay className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 select-none" onPointerDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}><button onClick={() => zoomAt(size.width / 2, size.height / 2, 1.55)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d6d3c8] bg-[#fffefb]/95 text-[#51544d] shadow-sm hover:border-[#2f837e]" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button><button onClick={() => zoomAt(size.width / 2, size.height / 2, 1 / 1.55)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d6d3c8] bg-[#fffefb]/95 text-[#51544d] shadow-sm hover:border-[#2f837e]" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button><button onClick={reset} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d6d3c8] bg-[#fffefb]/95 text-[#51544d] shadow-sm hover:border-[#2f837e]" aria-label="Reset world view"><LocateFixed className="h-4 w-4" /></button></div>

    {selectedId && <aside data-venture-overlay className="absolute bottom-4 right-4 top-4 z-40 flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#d8d6cd] bg-[#fffefb]/96 shadow-[0_24px_70px_rgba(36,40,34,.18)] backdrop-blur-xl select-none sm:right-16" onPointerDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#e4e2da] px-5 py-4"><span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#777970]">Jurisdiction inspector</span><button onClick={() => setSelectedId(null)} className="rounded-md p-1.5 text-[#777970] hover:bg-[#f0efe9]" aria-label="Close inspector"><X className="h-4 w-4" /></button></div>
      <div className="flex-1 overflow-auto overscroll-contain p-5 select-none"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#2f837e]"><SourceDot tone={layerInfo.tone} />{layerInfo.label}</div><span className="rounded-full bg-[#f0ece5] px-2 py-1 font-mono text-[8px] uppercase tracking-[.13em] text-[#777970]">{selectedRecord?.countryCode ?? "geometry"}</span></div><h2 className="mt-4 font-display text-4xl leading-[.94] text-[#242822]">{selectedName}</h2><p className="mt-4 text-sm leading-6 text-[#62645d]">{layerInfo.description}</p>
        {layer === "legal" && selectedRecord?.sourceStatus === "available" && <div className="mt-6 grid grid-cols-2 gap-3 border-y border-[#e4e2da] py-5"><div><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#777970]">Source records</div><div className="mt-1 font-display text-3xl text-[#242822]">{integer(selectedRecord.total)}</div></div><div><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#777970]">Golden Copy</div><div className="mt-2 text-xs leading-5 text-[#454740]">{formatDate(selectedRecord.goldenCopyPublishedAt)}</div></div></div>}
        {layer === "legal" && selectedRecord?.sourceStatus === "unavailable" && <div className="mt-6 border-y border-[#e4e2da] py-5 text-sm leading-6 text-[#9d483c]">This country’s query was unavailable in this release. It is not shown as zero businesses or zero entities.</div>}
        {layer === "policy" && <div className="mt-6 border-y border-[#e4e2da] py-5"><div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#ba7a48]">Source snapshot pending</div><p className="mt-3 text-sm leading-6 text-[#62645d]">The official STIP Compass release is documented, but this pilot has not yet normalized a complete source file. No policy count is shown.</p></div>}
        <div className="mt-6"><div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#777970]">Included population</div><p className="mt-2 text-sm leading-6 text-[#555850]">{activeLayer.recordDefinition}</p></div><div className="mt-5"><div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#b95c78]">What this does not establish</div><ul className="mt-2 space-y-2 text-sm leading-5 text-[#62645d]">{activeLayer.exclusions.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b95c78]" />{item}</li>)}</ul></div>
        <div className="mt-6 border-t border-[#e4e2da] pt-5"><div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#777970]">Geography claim</div><p className="mt-2 text-sm leading-6 text-[#555850]">{layer === "legal" ? "Country aggregate from the GLEIF record’s legal-address country. No entity coordinates are placed in this view." : "Country/territory policy context only; no organization location is implied."}</p>{precisionMode && selectedId === "356" && <p className="mt-3 border-l-2 border-[#ba7a48] pl-3 text-xs leading-5 text-[#777970]">At closer zoom, India’s states and districts are geoBoundaries reference layers; city/town points are GeoNames references. Neither allocates this country total to a locality or proves an entity operates there.</p>}</div>
        <div className="mt-6 grid gap-2"><button onClick={addCompare} className="flex items-center justify-between rounded-xl border border-[#d8d6cd] bg-[#f5f1e7] px-4 py-3 text-left text-sm font-semibold text-[#353831] hover:border-[#0f766e]">{compareIds.includes(selectedId) ? "Held for comparison" : "Hold for comparison"}<span aria-hidden>→</span></button><button onClick={copyTitle} className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-xs text-[#777970] hover:bg-[#f0efe9]"><Copy className="h-4 w-4" />Copy jurisdiction name</button><button onClick={() => setSelectedId(null)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-xs text-[#777970] hover:bg-[#f0efe9]"><ChevronLeft className="h-4 w-4" />Back to world field</button></div>
        <a href={layer === "legal" && selectedRecord ? selectedRecord.sourceQuery : activeLayer.sourceUrl} target="_blank" rel="noreferrer" className="mt-7 flex items-center gap-2 border-t border-[#e4e2da] pt-5 font-mono text-[9px] uppercase tracking-[.12em] text-[#2f837e]">{activeLayer.publisher}<ExternalLink className="ml-auto h-3.5 w-3.5" /></a></div>
    </aside>}

    {compareRecords.length > 0 && <div data-venture-overlay className="absolute bottom-4 right-4 z-30 w-[min(500px,calc(100vw-2rem))] border border-[#d8d6cd] bg-[#fffefb]/96 p-4 shadow-xl backdrop-blur select-none sm:right-16" onPointerDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div className="font-mono text-[9px] uppercase tracking-[.16em] text-[#2f837e]">Held jurisdictions / source-separated</div><button onClick={() => setCompareIds([])} className="text-xs text-[#777970] hover:text-[#b95c78]">Clear</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{compareRecords.map(({ id, feature, record }) => <button key={id} onClick={() => focusCountry(id)} className="border border-[#e1ded3] bg-[#f8f5ec] p-3 text-left hover:border-[#2f837e]"><div className="font-display text-xl text-[#242822]">{record?.countryName ?? feature?.properties?.name}</div><div className="mt-3 space-y-2 border-y border-[#e4e1d7] py-2 font-mono text-[9px] uppercase tracking-[.1em] text-[#6f7169]"><div className="flex items-center gap-2"><SourceDot tone="teal" />Legal entities: {record?.total != null ? `${integer(record.total)} LEI records` : "source unavailable"}</div><div className="flex items-center gap-2"><SourceDot tone="ochre" />Policy: snapshot pending</div></div><div className="mt-2 text-xs leading-5 text-[#777970]">Legal-address country aggregate; no all-business, startup, or policy-total claim.</div></button>)}</div></div>}

    <div data-venture-overlay className="absolute right-4 top-[210px] z-20 hidden w-[245px] border border-[#d5d2c7] bg-[#fffefb]/94 p-4 shadow-sm backdrop-blur xl:block select-none" onPointerDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}><div className="font-display text-2xl text-[#242822]">Source key</div><div className="mt-4 space-y-3 text-xs leading-5 text-[#62645d]"><p className="flex gap-2"><SourceDot />Teal shading is a log-scaled visual of source-record count, not market size or business activity.</p><p className="flex gap-2"><SourceDot tone="ochre" />Ochre policy layer remains explicitly source-hosted until its official snapshot is complete.</p><p className="flex gap-2"><SourceDot tone="coral" />Coral marks selection and visible coverage limits.</p></div><a href={release.geography.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 border-t border-[#e4e2da] pt-3 font-mono text-[8px] uppercase tracking-[.12em] text-[#777970]">{release.geography.publisher} geometry<ExternalLink className="ml-auto h-3 w-3" /></a></div>
  </section>;
}
