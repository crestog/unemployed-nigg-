/**
 * Editorial Cartography evidence contract.
 * Source records, mappings, computations, user-owned notes, and external links must remain visibly distinct.
 */

export type EvidenceRelationType = "source-record" | "published-mapping" | "computed-overlap" | "user-owned" | "external-link";

export type EvidenceEnvelope = {
  sourceName: string;
  sourceUrl: string;
  sourceVersion?: string;
  sourceDate?: string;
  retrievedAt?: string;
  geography?: string;
  classification?: string;
  relationType: EvidenceRelationType;
  caveat?: string;
  method?: string;
};

export const evidencePresentation: Record<EvidenceRelationType, { label: string; className: string }> = {
  "source-record": { label: "source record", className: "border-[#9acdc1] bg-[#e0f0eb] text-[#0f625b]" },
  "published-mapping": { label: "published mapping", className: "border-[#dfc681] bg-[#f6ebc9] text-[#8a6417]" },
  "computed-overlap": { label: "computed overlap", className: "border-[#edb6a7] bg-[#fff1ef] text-[#9d483c]" },
  "user-owned": { label: "local note", className: "border-[#c9c6ba] bg-[#f0ede3] text-[#45483f]" },
  "external-link": { label: "external handoff", className: "border-[#c4d3e8] bg-[#f0f5fb] text-[#3d5f85]" },
};

export function sourceRecordEnvelope(source: { publisher: string; url: string; vintage?: string }, options: Omit<EvidenceEnvelope, "sourceName" | "sourceUrl" | "sourceVersion" | "relationType"> = {}): EvidenceEnvelope {
  return {
    sourceName: source.publisher,
    sourceUrl: source.url,
    sourceVersion: source.vintage,
    relationType: "source-record",
    ...options,
  };
}

export function computedOverlapEnvelope(source: { publisher: string; url: string; vintage?: string }, method: string, caveat: string): EvidenceEnvelope {
  return {
    sourceName: source.publisher,
    sourceUrl: source.url,
    sourceVersion: source.vintage,
    relationType: "computed-overlap",
    method,
    caveat,
  };
}
