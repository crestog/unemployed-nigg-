/**
 * The facet rail: every value of every column, with counts, searchable.
 *
 * The map's panel caps each facet at eight values and says "narrow by name" — but the name search
 * there searches *records*, not facet values, so there is no way to reach the ninth of 1,474 host
 * institutes. That dead end is the thing this replaces: each facet gets its own value search, chosen
 * values are always rendered whether or not they fall inside the cap, and the number withheld is
 * stated rather than implied.
 */

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import type { EntityFacet } from "@/lib/entityAtlas";
import { FACET_TITLE } from "@/lib/entityLabels";
import { foldText } from "@/lib/entityDirectory";

/** Enough to choose from without scrolling past the next facet; the rest is one click away. */
const COLLAPSED = 10;
/** A ceiling on the expanded list too: 1,474 chips is not a chooser, it is a wall. */
const EXPANDED = 80;
/** Below this a search box is noise — the whole list already fits. */
const SEARCHABLE = 12;

type FacetValue = { value: number; label: string; count: number };

export type FacetGroup = {
  facet: EntityFacet;
  values: FacetValue[];
  chosen: ReadonlySet<number> | null;
};

type Props = {
  groups: FacetGroup[];
  activeValues: number;
  onToggle: (facet: EntityFacet, value: number) => void;
  onClearFacet: (facet: EntityFacet) => void;
  onClearAll: () => void;
};

export default function DirectoryFacetRail({
  groups,
  activeValues,
  onToggle,
  onClearFacet,
  onClearAll,
}: Props) {
  return (
    <div className="flex flex-col gap-1 p-3">
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#77766d]">
          Filters
        </span>
        {activeValues > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#c75b4a] hover:bg-[#f0ede3]"
          >
            <X className="h-3 w-3" />
            Clear {activeValues}
          </button>
        )}
      </div>
      {groups.map((group, index) => (
        <FacetSection
          key={group.facet}
          group={group}
          initialOpen={index < 2 || Boolean(group.chosen?.size)}
          onToggle={onToggle}
          onClear={onClearFacet}
        />
      ))}
      {groups.length === 0 && (
        <p className="text-[11px] leading-4 text-[#77766d]">
          No column has more than one value left. Widen the search or clear a filter.
        </p>
      )}
    </div>
  );
}

function FacetSection({
  group,
  initialOpen,
  onToggle,
  onClear,
}: {
  group: FacetGroup;
  initialOpen: boolean;
  onToggle: (facet: EntityFacet, value: number) => void;
  onClear: (facet: EntityFacet) => void;
}) {
  // `open` is held here rather than passed as a prop: a `<details open={derived}>` reopens itself the
  // moment the derived value changes, which overrides the reader having just closed it by hand.
  const [open, setOpen] = useState(initialOpen);
  const [needle, setNeedle] = useState("");
  const [expanded, setExpanded] = useState(false);
  const chosen = group.chosen;

  const { shown, withheld } = useMemo(() => {
    const folded = foldText(needle).trim();
    const matching = folded
      ? group.values.filter(entry => foldText(entry.label).includes(folded))
      : group.values;
    const cap = expanded ? EXPANDED : COLLAPSED;
    // Chosen values first and unconditionally. A chosen value that fell outside the cap would look
    // like it had been cleared, while still filtering the list — the filter panel would be lying.
    const picked = matching.filter(entry => chosen?.has(entry.value));
    const rest = matching.filter(entry => !chosen?.has(entry.value));
    return { shown: [...picked, ...rest.slice(0, cap)], withheld: Math.max(0, rest.length - cap) };
  }, [chosen, expanded, group.values, needle]);

  return (
    <details
      open={open}
      onToggle={event => setOpen(event.currentTarget.open)}
      className="min-w-0 border-b border-[#e4e1d6] pb-1.5 last:border-b-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded py-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#666960] hover:text-[#242822]">
        <span className="truncate">{FACET_TITLE[group.facet]}</span>
        <span className="shrink-0 tabular-nums text-[#9a998e]">
          {chosen?.size ? `${chosen.size} on` : group.values.length.toLocaleString()}
        </span>
      </summary>
      {group.values.length >= SEARCHABLE && (
        <label className="relative mt-1 block">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9a998e]" />
          <span className="sr-only">Find a value in {FACET_TITLE[group.facet]}</span>
          <input
            value={needle}
            onChange={event => setNeedle(event.target.value)}
            placeholder={`Find in ${FACET_TITLE[group.facet].toLowerCase()}…`}
            className="w-full rounded-md border border-[#d1cec2] bg-[#fbfaf5] py-1 pl-6 pr-2 text-[11px] text-[#242822] placeholder:text-[#9a998e] focus:border-[#0f766e] focus:outline-none"
          />
        </label>
      )}
      {Boolean(chosen?.size) && (
        <button
          type="button"
          onClick={() => onClear(group.facet)}
          className="mt-1 flex items-center gap-1 rounded px-1 py-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#c75b4a] hover:bg-[#f0ede3]"
        >
          <X className="h-3 w-3" />
          Clear this column
        </button>
      )}
      <div className="mt-1 flex min-w-0 flex-wrap gap-1">
        {shown.map(entry => {
          const active = chosen?.has(entry.value) ?? false;
          return (
            <button
              key={entry.value}
              type="button"
              aria-pressed={active}
              title={`${entry.label || "unlabelled"} — ${entry.count.toLocaleString()} records`}
              onClick={() => onToggle(group.facet, entry.value)}
              className={`flex max-w-full items-baseline gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                active
                  ? "border-[#0f766e] bg-[#e0f0eb] text-[#0f766e]"
                  : "border-[#d1cec2] bg-[#fbfaf5] text-[#4a4d45] hover:border-[#9acdc1] hover:text-[#242822]"
              }`}
            >
              <span className="truncate">{entry.label || "—"}</span>
              <span className="shrink-0 tabular-nums text-[#9a998e]">
                {entry.count.toLocaleString()}
              </span>
            </button>
          );
        })}
        {shown.length === 0 && (
          <span className="px-1 text-[10px] text-[#9a998e]">No value matches that.</span>
        )}
      </div>
      {/* Say what is being withheld, and offer the way to reach it. A silently cropped list reads
          as the whole list, which is how the map panel's ninth value became unreachable. */}
      {withheld > 0 &&
        (expanded ? (
          <p className="mt-1 px-1 text-[10px] text-[#9a998e]">
            {withheld.toLocaleString()} more — search this column to reach them.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-1 rounded px-1 py-0.5 text-[10px] text-[#0f766e] underline decoration-dotted hover:bg-[#e0f0eb]"
          >
            Show {Math.min(withheld, EXPANDED - COLLAPSED).toLocaleString()} more of{" "}
            {withheld.toLocaleString()}
          </button>
        ))}
    </details>
  );
}
