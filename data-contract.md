# Atlas data and evidence contract

## Intent

Industry Niche Atlas is a multi-source navigation system, not a single universal taxonomy. This contract prevents a source classification, a crosswalk, a computed comparison, a personal note, and an outbound provider link from being rendered as the same kind of fact. All future importers and interface features must implement this contract.

## Evidence envelope

Every displayable claim uses the following envelope. Source fields describe the record’s own publisher and version; a computed relation must disclose its method; a user-owned record must not acquire an official-source visual style.

```ts
type EvidenceRelationType =
  | "source-record"
  | "published-mapping"
  | "computed-overlap"
  | "user-owned"
  | "external-link";

type EvidenceEnvelope = {
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
```

| Relation type | Meaning | Required interface treatment | Forbidden interpretation |
|---|---|---|---|
| `source-record` | A value or text directly distributed by the named publisher. | Teal source badge with publisher, version/date, and source link. | That it describes every employer, person, or country. |
| `published-mapping` | A publisher’s named crosswalk between vocabularies. | Ochre mapping badge with both source systems and mapping version. | That the mapped concepts are identical or interchangeable. |
| `computed-overlap` | A deterministic result calculated by Atlas from named source records. | Coral method badge with equation/rule, source release, and caveat. | A transition probability, prediction, recommendation, or causal relationship. |
| `user-owned` | A browser-local or authenticated-user hypothesis, evidence link, constraint, or reflection. | Graphite local-evidence styling; never a source seal. | A credential, assessment outcome, or independently validated claim. |
| `external-link` | A handoff to a provider, search, service, or application route. | Provider-labelled blue handoff style and destination URL. | That Atlas operates the service, vets every outcome, or controls an application. |

## Versioned record families

| Family | Stable fields | Required provenance | Current plan |
|---|---|---|---|
| Classification | Native identifier, title, level, parent identifier, language, hierarchy version. | Source publisher, version, language, retrieval/release date, classification name. | NAICS/ISIC shipped; add ISCO as a distinct global spine. |
| Occupation profile | Native identifier, title, definition/scope, tasks, skills/activities, relation types. | Source version/date and country/region scope. | O*NET shipped; ESCO only after official acquisition. |
| Published mapping | Mapping identifier, source concept, target concept, map relation, direction, version. | Mapping publisher, source and target versions, scope/caveat. | Do not generate mappings from title matching. |
| Labor context observation | Indicator, value, unit, geography, time period, population/cohort, source channel, classification level. | Publisher, retrieval date, data revision, method/source notes. | First candidate: declared ILOSTAT indicator subset. |
| Opportunity handoff | Provider, destination URL, query terms, geography, accessed date, availability status. | Provider terms/API agreement, rate-limit/cache policy. | Use static outgoing links until a backend connector is authorized. |
| Personal evidence | Hypothesis, selected anchor ID/text snapshot, activity boundary, time box, access constraints, evidence note/link, reflection, decision. | `user-owned` only; local storage or later account identifier. | Do not issue a badge, score, certificate, or employer claim. |

## Global module requirements

An ISCO/ESCO/ILOSTAT release must be a separately versioned module rather than a silent amendment to the U.S. base release. The module manifest must state language coverage, geography, classification system, source version, retrieval date, license/terms note, records count, importer revision, and the exact source files or request definition.

Country context must preserve whether an observation is national, regional, global, or modeled. It must record observation period and unit and must expose missingness. The visual interface may compare observations only when geography, indicator definition, unit, and time basis are compatible.

## Current computed-overlap method

The first comparison feature may compute an O*NET skill/activity overlap only with normalized exact labels. It should show common labels, source-only labels, target-only labels, and a source-specific recorded-importance difference where available. It may not use semantic embeddings, title similarity, salary, task counts, or self-reported user evidence to create a single transition score. Task statements remain side-by-side source records unless an authoritative shared task identity is supplied.
