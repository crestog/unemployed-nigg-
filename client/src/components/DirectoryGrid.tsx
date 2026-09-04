/**
 * The record grid: 13,321 rows, about twenty of them in the DOM.
 *
 * Windowed by hand (see `useWindowedRows`) because the project has no virtualisation dependency, and
 * addressed as a `role="grid"` with a real `aria-rowcount` so the row you are on and how many there
 * are is available to a screen reader rather than only to the eye. Arrow keys move a cursor that is
 * pinned into the rendered window, which is the part a naive windowed list gets wrong: the active
 * element unmounts under `aria-activedescendant` and the grid reports no position at all.
 */

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";

import type { EntityAtlas } from "@/lib/entityAtlas";
import { PRECISION_INK } from "@/lib/entityLabels";
import { rowFacetLabel, rowName, rowPrecision, type DirectorySort } from "@/lib/entityDirectory";
import { useWindowedRows } from "@/lib/useWindowedRows";

/** Fixed, because windowing needs to know where row 9,000 is without measuring rows 0…8,999. */
const ROW_HEIGHT = 44;

/** Short enough for a 5.5rem column; the full wording is in the record panel. */
const PRECISION_SHORT = ["city", "district", "state", "pan-India", "unplaced"];

/**
 * Track widths per breakpoint. The count of tracks has to equal the count of *visible* cells at that
 * breakpoint, so each column below carries the matching `hidden … :block` and the two lists move
 * together or the grid shears.
 */
const TEMPLATE =
  "grid-cols-[minmax(0,1fr)_5.5rem] sm:grid-cols-[minmax(0,1fr)_9rem_5.5rem] lg:grid-cols-[minmax(0,1fr)_9rem_7.5rem_5.5rem] xl:grid-cols-[minmax(0,1fr)_10rem_7.5rem_9rem_5.5rem]";

const COLUMNS = [
  { sort: "name" as DirectorySort, title: "Name", show: "", align: "text-left" },
  { sort: "place" as DirectorySort, title: "Place", show: "hidden sm:block", align: "text-left" },
  { sort: "type" as DirectorySort, title: "Type", show: "hidden lg:block", align: "text-left" },
  { sort: "sector" as DirectorySort, title: "Sector", show: "hidden xl:block", align: "text-left" },
  { sort: "precision" as DirectorySort, title: "Where", show: "", align: "text-right" },
];

type Props = {
  atlas: EntityAtlas;
  rows: Int32Array;
  sort: DirectorySort;
  descending: boolean;
  onSort: (sort: DirectorySort) => void;
  selected: number | null;
  onSelect: (row: number) => void;
};

export default function DirectoryGrid({
  atlas,
  rows,
  sort,
  descending,
  onSort,
  selected,
  onSelect,
}: Props) {
  const count = rows.length;
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  // Filtering can shorten the list under the cursor; clamp on read rather than resetting it, so
  // widening the query again puts the reader back roughly where they were.
  const active = count === 0 ? -1 : Math.min(cursor, count - 1);
  const { start, end, totalHeight, setContainer, scrollToRow } = useWindowedRows(
    count,
    ROW_HEIGHT,
    6,
    active < 0 ? undefined : active
  );

  useEffect(() => {
    if (active >= 0) scrollToRow(active);
  }, [active, scrollToRow]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (count === 0) return;
      const page = Math.max(1, Math.floor(event.currentTarget.clientHeight / ROW_HEIGHT) - 1);
      const clamp = (row: number) => Math.min(count - 1, Math.max(0, row));
      const to = (next: number) => {
        event.preventDefault();
        setCursor(clamp(next));
      };
      // A step resolves against whatever the cursor is when React applies it, not against the
      // `active` this closure captured: if two keydowns land before a commit, the second one has to
      // move on from the first rather than repeat it.
      const step = (delta: number) => {
        event.preventDefault();
        setCursor(current => clamp(Math.min(current, count - 1) + delta));
      };
      if (event.key === "ArrowDown") step(1);
      else if (event.key === "ArrowUp") step(-1);
      else if (event.key === "PageDown") step(page);
      else if (event.key === "PageUp") step(-page);
      else if (event.key === "Home") to(0);
      else if (event.key === "End") to(count - 1);
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const row = rows[active];
        if (row !== undefined) onSelect(row);
      }
    },
    [active, count, onSelect, rows]
  );

  const visible: number[] = [];
  for (let index = start; index < end; index += 1) visible.push(index);

  return (
    <div
      ref={setContainer}
      role="grid"
      aria-label="Ecosystem records"
      aria-rowcount={count + 1}
      aria-activedescendant={focused && active >= 0 ? `dir-row-${active}` : undefined}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#0f766e]"
    >
      <div role="rowgroup" className="sticky top-0 z-10 border-b border-[#d1cec2] bg-[#f5f1e7]">
        <div role="row" aria-rowindex={1} className={`grid ${TEMPLATE} items-center gap-3 px-3 py-2`}>
          {COLUMNS.map(column => (
            <div
              key={column.sort}
              role="columnheader"
              aria-sort={
                sort === column.sort ? (descending ? "descending" : "ascending") : "none"
              }
              className={`${column.show} min-w-0 ${column.align}`}
            >
              <button
                type="button"
                onClick={() => onSort(column.sort)}
                className={`max-w-full truncate rounded px-1 py-0.5 font-mono text-[9px] uppercase tracking-[.14em] transition-colors hover:bg-[#ebe7db] ${
                  sort === column.sort ? "text-[#0f766e]" : "text-[#77766d]"
                }`}
              >
                {column.title}
                {sort === column.sort && <span aria-hidden="true">{descending ? " ↓" : " ↑"}</span>}
              </button>
            </div>
          ))}
        </div>
      </div>
      {count === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[#77766d]">
          Nothing matches. Clear a filter, or widen the search.
        </p>
      ) : (
        <div role="rowgroup" className="relative" style={{ height: totalHeight }}>
          {visible.map(index => (
            <GridRow
              key={index}
              atlas={atlas}
              index={index}
              row={rows[index]!}
              selected={rows[index] === selected}
              cursor={focused && index === active}
              onSelect={onSelect}
              onCursor={setCursor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GridRow({
  atlas,
  index,
  row,
  selected,
  cursor,
  onSelect,
  onCursor,
}: {
  atlas: EntityAtlas;
  index: number;
  row: number;
  selected: boolean;
  cursor: boolean;
  onSelect: (row: number) => void;
  onCursor: (index: number) => void;
}) {
  const precision = rowPrecision(atlas, row);
  return (
    <div
      id={`dir-row-${index}`}
      role="row"
      aria-rowindex={index + 2}
      aria-selected={selected}
      onClick={() => {
        onCursor(index);
        onSelect(row);
      }}
      style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
      className={`absolute inset-x-0 grid ${TEMPLATE} cursor-pointer items-center gap-3 border-b border-[#e4e1d6] px-3 text-left ${
        selected ? "bg-[#e0f0eb]" : cursor ? "bg-[#f0ede3]" : "hover:bg-[#f5f1e7]"
      } ${cursor ? "ring-1 ring-inset ring-[#0f766e]" : ""}`}
    >
      <div role="gridcell" className="min-w-0">
        <span className="block truncate text-[13px] leading-4 text-[#242822]">
          {rowName(atlas, row)}
        </span>
        {/* Below `sm` the place column is gone, so the place rides under the name instead of
            vanishing — it is the field that tells two similarly-named programmes apart. */}
        <span className="block truncate text-[10px] leading-4 text-[#8a897f] sm:hidden">
          {rowFacetLabel(atlas, row, "place") || rowFacetLabel(atlas, row, "type")}
        </span>
      </div>
      <div role="gridcell" className="hidden min-w-0 truncate text-[11px] text-[#666960] sm:block">
        {rowFacetLabel(atlas, row, "place")}
      </div>
      <div role="gridcell" className="hidden min-w-0 truncate text-[11px] text-[#666960] lg:block">
        {rowFacetLabel(atlas, row, "type")}
      </div>
      <div role="gridcell" className="hidden min-w-0 truncate text-[11px] text-[#666960] xl:block">
        {rowFacetLabel(atlas, row, "sector")}
      </div>
      <div
        role="gridcell"
        className="min-w-0 truncate text-right font-mono text-[9px] uppercase tracking-[.1em]"
        style={{ color: PRECISION_INK[precision] ?? "#77766d" }}
      >
        {PRECISION_SHORT[precision] ?? "—"}
      </div>
    </div>
  );
}
