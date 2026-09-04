/**
 * One record, and the relationships you can travel along from it.
 *
 * The relationship list is the part that matters. Every value in it is a fact the source data states
 * — this programme's host institute, its owner, its state — and each carries how many records
 * corpus-wide share it, counted *unfiltered*: "IIM Bangalore runs 4,540 of these" is true regardless
 * of what is currently filtered, and reporting it as 12 because a sector filter happens to be on
 * would misdescribe the thing the reader is about to open. A value only this record holds is written
 * as plain text, because there is nothing to pivot to.
 */

import { ArrowRight, ExternalLink, X } from "lucide-react";

import type { EntityAtlas, EntityDetail, EntityFacet } from "@/lib/entityAtlas";
import { FACET_TITLE, PRECISION_INK, PRECISION_TEXT } from "@/lib/entityLabels";
import {
  isNationalRow,
  rowLngLat,
  rowName,
  rowPrecision,
  type RowRelationship,
} from "@/lib/entityDirectory";

const PROSE: { key: keyof EntityDetail; title: string }[] = [
  { key: "summary", title: "Summary" },
  { key: "eligibility", title: "Eligibility" },
  { key: "funding", title: "Funding" },
  { key: "route", title: "How to apply" },
];

type Props = {
  atlas: EntityAtlas;
  row: number;
  relationships: RowRelationship[];
  detail: EntityDetail | undefined;
  pending: boolean;
  onPivot: (facet: EntityFacet, value: number) => void;
  onClose: () => void;
};

export default function DirectoryRecordPanel({
  atlas,
  row,
  relationships,
  detail,
  pending,
  onPivot,
  onClose,
}: Props) {
  const precision = rowPrecision(atlas, row);
  const lngLat = rowLngLat(atlas, row);
  const national = isNationalRow(atlas, row);
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 font-display text-xl leading-tight tracking-[-0.02em] text-[#242822]">
          {rowName(atlas, row)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close record"
          className="shrink-0 rounded p-1 text-[#77766d] hover:bg-[#f0ede3] hover:text-[#242822]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Where the coordinate came from, stated with the record rather than inferred from a pin: a
          state-wide scheme drawn at a state centroid must not read as a street address. */}
      <p className="font-mono text-[10px] leading-4 text-[#77766d]">
        <span style={{ color: PRECISION_INK[precision] ?? "#77766d" }}>
          {PRECISION_TEXT[precision] ?? "coordinate"}
        </span>
        {national
          ? " — a pan-India programme, so it has no coordinate and never appears on the map"
          : lngLat
            ? ` — ${lngLat[1].toFixed(4)}, ${lngLat[0].toFixed(4)}`
            : " — no coordinate resolved"}
      </p>
      <section className="flex flex-col gap-1.5">
        <h3 className="font-mono text-[9px] uppercase tracking-[.18em] text-[#0f766e]">
          Shares with
        </h3>
        {relationships.length === 0 && (
          <p className="text-[11px] text-[#77766d]">This record carries no classified values.</p>
        )}
        <ul className="flex flex-col gap-1">
          {relationships.map(entry => (
            <li key={entry.facet}>
              {entry.shared > 1 ? (
                <button
                  type="button"
                  onClick={() => onPivot(entry.facet, entry.value)}
                  title={`Show all ${entry.shared.toLocaleString()} records with ${FACET_TITLE[entry.facet].toLowerCase()} “${entry.label}”`}
                  className="group flex w-full items-baseline gap-2 rounded border border-transparent px-1.5 py-1 text-left hover:border-[#9acdc1] hover:bg-[#e0f0eb]"
                >
                  <span className="w-[5.5rem] shrink-0 font-mono text-[9px] uppercase tracking-[.1em] text-[#9a998e]">
                    {FACET_TITLE[entry.facet]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[#242822]">
                    {entry.label || "—"}
                  </span>
                  <span className="shrink-0 tabular-nums text-[10px] text-[#0f766e]">
                    {entry.shared.toLocaleString()}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-[#c9c6ba] group-hover:text-[#0f766e]" />
                </button>
              ) : (
                <div className="flex items-baseline gap-2 px-1.5 py-1">
                  <span className="w-[5.5rem] shrink-0 font-mono text-[9px] uppercase tracking-[.1em] text-[#9a998e]">
                    {FACET_TITLE[entry.facet]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[#242822]">
                    {entry.label || "—"}
                  </span>
                  <span className="shrink-0 text-[10px] text-[#9a998e]">only this one</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2 border-t border-[#e4e1d6] pt-3">
        {!detail && pending && (
          <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#77766d]">
            Loading the source record…
          </p>
        )}
        {!detail && !pending && (
          <p className="text-[11px] text-[#77766d]">No source detail is held for this record.</p>
        )}
        {detail &&
          PROSE.filter(field => detail[field.key]).map(field => (
            <div key={field.key}>
              <h3 className="font-mono text-[9px] uppercase tracking-[.18em] text-[#77766d]">
                {field.title}
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-[#4a4d45]">{detail[field.key]}</p>
            </div>
          ))}
        {detail && (detail.website || detail.url) && (
          <div className="flex flex-wrap gap-3 pt-1">
            {detail.website && (
              <a
                href={detail.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[11px] text-[#0f766e] underline decoration-dotted hover:text-[#242822]"
              >
                Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {detail.url && (
              <a
                href={detail.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[11px] text-[#0f766e] underline decoration-dotted hover:text-[#242822]"
              >
                Source record
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
        {/* Only the prose is missing until the 6.3 MB detail file lands, so the record above stays
            readable while it does — and if it never arrives, the classified values still stand. */}
        {detail && !PROSE.some(field => detail[field.key]) && (
          <p className="text-[11px] leading-4 text-[#77766d]">
            The source lists no description for this record. Its classification above is what the
            inventory states.
          </p>
        )}
      </section>
    </div>
  );
}
