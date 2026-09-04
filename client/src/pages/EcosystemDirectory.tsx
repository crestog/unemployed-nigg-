/**
 * The whole India ecosystem as a list — searchable, filterable, sortable, and navigable by relationship.
 *
 * The map answers "what is near here", and it reaches a record by clicking a pin. That leaves the
 * 1,951 pan-India programmes unreachable, because they have no coordinate to pin, and it makes
 * "find the one I mean" a hunt through 366 positions. This page addresses the same corpus as a list
 * instead: one query object drives the facet rail, the grid, the record panel and the URL together,
 * so any view of the list is a link somebody else can open and see the same rows.
 */

import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowUpDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import DirectoryFacetRail from "@/components/DirectoryFacetRail";
import DirectoryGrid from "@/components/DirectoryGrid";
import DirectoryRecordPanel from "@/components/DirectoryRecordPanel";
import { FACET_TITLE } from "@/lib/entityLabels";
import {
  DIRECTORY_SORTS,
  countActiveFacetValues,
  type DirectoryScope,
  type DirectorySort,
} from "@/lib/entityDirectory";
import { useEntityDirectory } from "@/lib/useEntityDirectory";

/** The grid's column headers reach five of these; this select is the only way to the other four. */
const SORT_TITLE: Record<DirectorySort, string> = {
  relevance: "Best match",
  name: "Name",
  type: FACET_TITLE.type,
  sector: FACET_TITLE.sector,
  state: FACET_TITLE.state,
  place: FACET_TITLE.place,
  host: FACET_TITLE.host,
  owner: FACET_TITLE.owner,
  precision: "Where it is",
};

/**
 * The scope tabs exist because "13,321 records" and "what the map can show" are different numbers,
 * and a reader who has only ever seen the map is entitled to know which half they are looking at.
 */
const SCOPES: { scope: DirectoryScope; title: string }[] = [
  { scope: "all", title: "All" },
  { scope: "mapped", title: "On the map" },
  { scope: "national", title: "Pan-India" },
];

const TAB = "rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] transition-colors";

export default function EcosystemDirectory() {
  const directory = useEntityDirectory();
  const { atlas, error, query, selection } = directory;
  // Held here rather than in the rail: on a phone the rail is a sheet over the list, and the button
  // that opens it lives in the header, so the two would otherwise have to talk through a ref.
  const [railOpen, setRailOpen] = useState(false);
  const activeValues = countActiveFacetValues(query.filter);
  const matched = selection?.rows.length ?? 0;
  const narrowed = Boolean(query.text.trim()) || activeValues > 0;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#fbfaf5] text-[#242822]">
      <header className="shrink-0 border-b border-[#d8d5c8] bg-[#f8f5ec] px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[.16em] text-[#77766d] hover:text-[#0f766e]"
          >
            <ArrowLeft className="h-3 w-3" />
            Atlas
          </Link>
          <h1 className="font-display text-2xl leading-none tracking-[-0.02em]">
            India startup ecosystem
          </h1>
          <p className="font-mono text-[10px] text-[#77766d]">
            {atlas
              ? `${matched.toLocaleString()} of ${directory.total.toLocaleString()} records`
              : error
                ? "records unavailable"
                : "loading records…"}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[13rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9a998e]" />
            <span className="sr-only">
              Search every record by name, place, state, host institute or owner
            </span>
            <input
              value={query.text}
              onChange={event => directory.setText(event.target.value)}
              placeholder={
                atlas
                  ? `Search ${directory.total.toLocaleString()} records — name, place, host, owner…`
                  : "Search the ecosystem…"
              }
              className="w-full rounded-md border border-[#d1cec2] bg-[#fbfaf5] py-1.5 pl-8 pr-2 text-[13px] text-[#242822] placeholder:text-[#9a998e] focus:border-[#0f766e] focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-0.5 rounded-md border border-[#d1cec2] bg-[#f5f1e7] p-0.5">
            {SCOPES.map(entry => {
              // Real counts, taken from the same pass that built the rows, so a tab never invites a
              // reader into an empty list — and "On the map" states how much the map leaves out.
              const count = !selection
                ? null
                : entry.scope === "mapped"
                  ? selection.mappedMatches
                  : entry.scope === "national"
                    ? selection.nationalMatches
                    : selection.mappedMatches + selection.nationalMatches;
              const on = query.scope === entry.scope;
              return (
                <button
                  key={entry.scope}
                  type="button"
                  aria-pressed={on}
                  onClick={() => directory.setScope(entry.scope)}
                  className={`${TAB} ${on ? "bg-[#0f766e] text-[#f8f5ec]" : "text-[#666960] hover:bg-[#ebe7db] hover:text-[#242822]"}`}
                >
                  {entry.title}
                  {count !== null && (
                    <span className={`ml-1 tabular-nums ${on ? "text-[#9acdc1]" : "text-[#9a998e]"}`}>
                      {count.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#77766d]">
            Sort
            <select
              value={query.sort}
              onChange={event => directory.setSort(event.target.value as DirectorySort)}
              className="rounded-md border border-[#d1cec2] bg-[#fbfaf5] px-1.5 py-1 font-sans text-[11px] normal-case tracking-normal text-[#242822] focus:border-[#0f766e] focus:outline-none"
            >
              {DIRECTORY_SORTS.map(sort => (
                <option key={sort} value={sort}>
                  {SORT_TITLE[sort]}
                </option>
              ))}
            </select>
          </label>
          {/* Re-picking the current column is what flips direction, so this button is that, not a
              separate piece of state that could disagree with the column headers. */}
          <button
            type="button"
            onClick={() => directory.setSort(query.sort)}
            title={
              query.descending
                ? "Sorted last to first — click for first to last"
                : "Sorted first to last — click for last to first"
            }
            className={`${TAB} flex items-center gap-1 border border-[#d1cec2] bg-[#fbfaf5] text-[#666960] hover:border-[#9acdc1] hover:text-[#242822]`}
          >
            <ArrowUpDown className="h-3 w-3" />
            {query.descending ? "Desc" : "Asc"}
          </button>
          <button
            type="button"
            onClick={() => setRailOpen(open => !open)}
            aria-expanded={railOpen}
            className={`${TAB} flex items-center gap-1 border border-[#d1cec2] bg-[#fbfaf5] text-[#666960] hover:border-[#9acdc1] hover:text-[#242822] lg:hidden`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filters
            {activeValues > 0 && <span className="tabular-nums text-[#0f766e]">{activeValues}</span>}
          </button>
          {narrowed && (
            <button
              type="button"
              onClick={directory.clearAll}
              className={`${TAB} flex items-center gap-1 text-[#c75b4a] hover:bg-[#f0ede3]`}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </header>
      {error ? (
        <p className="m-4 rounded-md border border-[#c75b4a]/40 bg-[#f8ece9] px-3 py-2 text-[12px] text-[#c75b4a]">
          {error}
        </p>
      ) : !atlas || !selection ? (
        <p className="m-4 font-mono text-[10px] uppercase tracking-[.16em] text-[#77766d]">
          Loading the ecosystem records…
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Below `lg` the rail is a sheet the Filters button opens; from `lg` it is always a
              column, because a filter panel you have to remember to open is a filter panel nobody
              uses. `hidden`/`block` rather than unmounting, so its per-facet searches survive. */}
          <aside
            className={`${railOpen ? "block" : "hidden"} min-h-0 shrink-0 overflow-y-auto border-b border-[#d8d5c8] bg-[#f8f5ec] lg:block lg:w-[17rem] lg:border-b-0 lg:border-r`}
          >
            <DirectoryFacetRail
              groups={directory.facetGroups}
              activeValues={activeValues}
              onToggle={directory.toggleFacet}
              onClearFacet={directory.clearFacet}
              onClearAll={directory.clearFilter}
            />
          </aside>
          <div className="flex min-h-0 flex-1 flex-col">
            <DirectoryGrid
              atlas={atlas}
              rows={selection.rows}
              sort={query.sort}
              descending={query.descending}
              onSort={directory.setSort}
              selected={directory.selected}
              onSelect={directory.select}
            />
          </div>
          {directory.selected !== null && (
            <aside className="min-h-0 max-h-[42dvh] shrink-0 overflow-y-auto border-t border-[#d8d5c8] bg-[#f8f5ec] lg:max-h-none lg:w-[19rem] lg:border-l lg:border-t-0 xl:w-[22rem]">
              <DirectoryRecordPanel
                atlas={atlas}
                row={directory.selected}
                relationships={directory.relationships}
                detail={directory.detail[directory.selected]}
                pending={directory.detailPending}
                // A pivot answers a new question, so on a phone the rail must get out of the way of
                // the answer rather than sitting on top of it.
                onPivot={(facet, value) => {
                  directory.pivot(facet, value);
                  setRailOpen(false);
                }}
                onClose={() => directory.select(null)}
              />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
