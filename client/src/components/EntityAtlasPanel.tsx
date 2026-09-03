/**
 * The startup-ecosystem panel: search, facet filters, and the records at the selected position.
 *
 * Two decisions here are about honesty rather than layout. First, every marker is an aggregate over
 * an interned coordinate, so the panel always states how many records a marker stands for and at
 * what precision that coordinate was derived — a state-level scheme drawn at a state centroid must
 * not read as a street address. Second, the facet counts come from `facetCounts`, which counts each
 * facet against the *other* filters, so a value that would yield nothing shows as absent instead of
 * silently selecting an empty map.
 */

import { ChevronRight, Filter, Search, X } from "lucide-react";

import type { EntityAtlasState } from "@/lib/useEntityAtlas";
import type { EntityFacet } from "@/lib/entityAtlas";

/** Mirrors `PRECISIONS` in `scripts/build_entity_atlas.mjs`, in plain words. */
const PRECISION_TEXT = [
  "city coordinate",
  "district centroid",
  "state centroid",
  "pan-India",
  "unplaced",
];

const PRECISION_COLOR = ["#45d7c0", "#ffbf69", "#f2825b", "#9db2c8", "#526b84"];

const FACET_TITLE: Record<EntityFacet, string> = {
  type: "Type",
  owner: "Owner",
  sector: "Sector",
  stage: "Stage",
  support: "Support",
  state: "State",
  place: "Place",
  status: "Status",
  host: "Host institute",
  incubatorType: "Incubator type",
};

/** Enough values to choose from without turning the panel into a scroll of 1,805 sectors. */
const FACET_VALUE_CAP = 8;

/**
 * How far to zoom when focusing a record, by the precision of its coordinate. A city coordinate can
 * take a close camera; a state centroid cannot — flying to street level on a state-wide scheme would
 * assert a location the data never had.
 */
const PRECISION_ZOOM = [48, 20, 7, 1, 1];

type Props = {
  state: EntityAtlasState;
  onFocus: (center: [number, number], zoomFactor: number) => void;
};

export default function EntityAtlasPanel({ state, onFocus }: Props) {
  const {
    atlas,
    loading,
    error,
    facets,
    filter,
    toggleFacet,
    clearFilter,
    query,
    setQuery,
    results,
    matched,
    selectedCluster,
    selectedRows,
    setSelected,
    detail,
    requestDetail,
  } = state;
  const activeFacets = Object.keys(filter).length;

  if (error)
    return (
      <div className="rounded-xl border border-[#6b3f3f] bg-[#1d1113]/95 px-3 py-2 text-xs text-[#f0b8b8]">
        {error}
      </div>
    );
  if (!atlas)
    return loading ? (
      <div className="rounded-xl border border-[#31506d] bg-[#0c1d30]/95 px-3 py-2 font-mono text-[10px] uppercase tracking-[.14em] text-[#8fe7d8]">
        Loading ecosystem records…
      </div>
    ) : null;

  return (
    <div className="flex max-h-[min(52dvh,520px)] w-[min(320px,calc(100vw-1.5rem))] min-w-0 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-xl border border-[#31506d] bg-[#0c1d30]/95 p-3 shadow-2xl shadow-black/30 backdrop-blur sm:max-h-[min(64dvh,560px)]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#8fe7d8]">
          Startup ecosystem
        </span>
        <span className="font-mono text-[10px] text-[#9db2c8]" aria-live="polite">
          {matched.toLocaleString()} / {atlas.counts.points.toLocaleString()}
        </span>
      </div>
      <p className="text-[11px] leading-4 text-[#7f95ab]">
        {atlas.counts.points.toLocaleString()} records over{" "}
        {atlas.counts.positions.toLocaleString()} distinct coordinates, plus{" "}
        {atlas.counts.national.toLocaleString()} pan-India programmes with no coordinate. Each marker
        is every record at one coordinate.
      </p>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#526b84]" />
        <span className="sr-only">Search ecosystem records</span>
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by name…"
          className="w-full rounded-lg border border-[#35536f] bg-[#081a2a] py-2 pl-7 pr-2 text-xs text-[#dbe8f4] placeholder:text-[#526b84] focus:border-[#45d7c0] focus:outline-none"
        />
      </label>
      {results.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {results.map(item => (
            <li key={item.record}>
              <button
                type="button"
                onClick={() => {
                  if (item.position < 0) return;
                  setSelected(item.position);
                  requestDetail(item.record);
                  onFocus(
                    [
                      atlas.positions[item.position * 2] ?? 0,
                      atlas.positions[item.position * 2 + 1] ?? 0,
                    ],
                    PRECISION_ZOOM[atlas.precisionOf[item.record] ?? 0] ?? 7
                  );
                }}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] text-[#c7d7e6] hover:bg-[#12304a]"
              >
                <ChevronRight className="h-3 w-3 shrink-0 text-[#526b84]" />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {item.place && <span className="shrink-0 text-[10px] text-[#7f95ab]">{item.place}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-[#1d3a56] pt-2">
        <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[.16em] text-[#8fe7d8]">
          <Filter className="h-3 w-3" />
          Filters
        </span>
        {activeFacets > 0 && (
          <button
            type="button"
            onClick={clearFilter}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#9db2c8] hover:bg-[#12304a] hover:text-[#dbe8f4]"
          >
            <X className="h-3 w-3" />
            Clear {activeFacets}
          </button>
        )}
      </div>
      {facets.map((group, index) => (
        // `<details>` rather than React state: ten facets of eight values is taller than the map, and
        // an open/closed set is exactly what this element already models — for free, and with keyboard
        // and screen-reader behaviour that a div-plus-onClick would have to reimplement.
        <details key={group.facet} open={index < 2} className="min-w-0">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded py-0.5 font-mono text-[9px] uppercase tracking-[.14em] text-[#5f7a94] hover:text-[#8fe7d8]">
            <span className="truncate">{FACET_TITLE[group.facet]}</span>
            <span className="shrink-0 text-[#3f5a73]">
              {group.chosen?.size ? `${group.chosen.size} on` : group.values.length}
            </span>
          </summary>
          <div className="mt-1 flex min-w-0 flex-wrap gap-1">
            {group.values.slice(0, FACET_VALUE_CAP).map(entry => {
              const active = group.chosen?.has(entry.value) ?? false;
              return (
                <button
                  key={entry.value}
                  type="button"
                  aria-pressed={active}
                  title={`${entry.label} — ${entry.count.toLocaleString()} records`}
                  onClick={() => toggleFacet(group.facet, entry.value)}
                  className={`max-w-[150px] truncate rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                    active
                      ? "border-[#45d7c0] bg-[#123f43] text-[#8fe7d8]"
                      : "border-[#2b4a66] bg-[#0a2135] text-[#a8bdd0] hover:border-[#45d7c0]/60 hover:text-[#dbe8f4]"
                  }`}
                >
                  {entry.label || "—"}{" "}
                  <span className="text-[#5f7a94]">{entry.count.toLocaleString()}</span>
                </button>
              );
            })}
            {/* Say what is being withheld: a silently cropped list reads as the whole list. */}
            {group.values.length > FACET_VALUE_CAP && (
              <span className="self-center px-1 text-[10px] text-[#526b84]">
                +{(group.values.length - FACET_VALUE_CAP).toLocaleString()} more, narrow by name
              </span>
            )}
          </div>
        </details>
      ))}
      {selectedCluster && (
        <div className="flex flex-col gap-1.5 border-t border-[#1d3a56] pt-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#8fe7d8]">
              At this coordinate
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded px-1 py-0.5 text-[#9db2c8] hover:bg-[#12304a] hover:text-[#dbe8f4]"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {/*
            The count and the precision are stated together on purpose: "4,541 records at a state
            centroid" is the honest reading of one marker, and either half alone is misleading.
          */}
          <p className="text-[11px] leading-4 text-[#a8bdd0]">
            <strong className="font-semibold text-[#dbe8f4]">
              {selectedCluster.count.toLocaleString()}
            </strong>{" "}
            {selectedCluster.count === 1 ? "record" : "records"}, placed at a{" "}
            <span style={{ color: PRECISION_COLOR[selectedCluster.precision] ?? "#9db2c8" }}>
              {PRECISION_TEXT[selectedCluster.precision] ?? "coordinate"}
            </span>{" "}
            ({selectedCluster.lat.toFixed(3)}, {selectedCluster.lng.toFixed(3)})
            {selectedCluster.count > selectedRows.length &&
              ` — showing the first ${selectedRows.length}`}
          </p>
        </div>
      )}
      {selectedRows.length > 0 && (
        <ul className="flex flex-col gap-1">
          {selectedRows.map(row => {
            const record = detail[row.record];
            return (
              <li
                key={row.record}
                className="rounded-lg border border-[#22405c] bg-[#081a2a] px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => requestDetail(row.record)}
                  className="w-full text-left"
                  aria-expanded={Boolean(record)}
                >
                  <span className="block text-[11px] font-semibold leading-4 text-[#dbe8f4]">
                    {row.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-[#7f95ab]">
                    {[row.type, row.sector, row.place].filter(Boolean).join(" · ")}
                  </span>
                </button>
                {record && (
                  <div className="mt-1 border-t border-[#1d3a56] pt-1">
                    {record.summary && (
                      <p className="text-[10px] leading-4 text-[#a8bdd0]">{record.summary}</p>
                    )}
                    {(record.website || record.url) && (
                      <a
                        href={record.website || record.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 inline-block text-[10px] text-[#45d7c0] underline decoration-dotted hover:text-[#8fe7d8]"
                      >
                        {record.website ? "Website" : "Source record"}
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
