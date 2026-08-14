---
title: Industry Niche Atlas — Research and Build Packet
tags:
  - industry-niche-atlas
  - workforce-data
  - occupational-taxonomy
  - career-exploration
  - roadmap
created: 2026-08-14
---

# Industry Niche Atlas — Research and Build Packet

> **Positioning:** A provenance-first exploration system that begins with industry structure and ends with the skills, task statements, and learning actions inside real work.

## Current product state

The live Atlas now has three connected surfaces. **Graph** is a pannable, zoomable world of real classifications and work records. **Roadmaps** converts a selected official occupation into a source-labelled profile → skills → tasks study sequence. **Directory** remains the precision view for source records and explicit classification trees. The published release contains official O*NET, BLS OEWS, NAICS, and ISIC data; the application does not fabricate records or infer an unsupported universal industry-to-occupation hierarchy.[1] [2] [3] [4]

| Capability | Current behavior | Integrity boundary |
|---|---|---|
| World exploration | Cursor-centred zoom, drag, local selection, breadcrumb route, URL camera state | Spatial proximity is a navigation layout, not a claim of causal similarity |
| Record history | Active record is coral; visited records are ochre; session trail restores saved locations | Session history is browser-local and does not claim personal competence |
| Focused branches | Official classification children appear around a selected formal parent | Industry → occupation links remain labelled exploratory unless an authoritative crosswalk is added |
| Roadmaps | O*NET profile, recorded skills, and task statements become an ordered path | Sequence is a study aid, not a credential or copied curriculum |
| Learning handoffs | YouTube search and Filmot caption-search entry points | They are visible searches, not endorsements or scraped video results |

## What the reference studies changed

The Every Noise study established the atlas’s local selection then small local-action pattern. The Map of Reddit study established stable view-state URLs, visible selection history, and spatially anchored focus. The roadmap.sh study established the useful transition from open discovery to a bounded next action: a visual route, supporting resources, practical projects, personal progress, and shareable canonical context.[5] [6]

Roadmap.sh’s public content repository models each visual node as an identifier joined to a concise content document and typed external resources. Its contributor guidance explicitly prioritizes relevance over exhaustive lists and limits topic resources, which is a good precedent for the Atlas’s future resource policy.[6]

## Roadmaps tab contract

The Roadmaps tab stands alone: a person can search any current official O*NET occupation and inspect an evidence-labelled path. It also accepts a Graph handoff. Occupations transfer their O*NET ID; selected skills and task statements transfer their parent occupation; an industry transfer carries the industry as an explicit research seed rather than pretending it determines an occupation.

| User intent | Deterministic sequence | Result |
|---|---|---|
| Understand the role | Profile → skills → tasks | Builds a correct vocabulary for the occupation |
| Build skill fluency | Highest-recorded skills → tasks → profile | Starts from O*NET importance and grounds the skill in work |
| Study the work | Tasks → skills → profile | Starts where a person’s week actually begins |

Personal completion states are local browser markers only. They can be cleared and are never shown as certification, mastery, or official-source status.

## Global Atlas architecture

The credible path to a world-scale map is **federated standards plus country modules**, not one scraped global job board. ISCO provides a cross-country occupational backbone; ISIC provides a global activity/industry hierarchy. Country modules should preserve the original national classifications, record their crosswalk version and uncertainty, and make source vintage visible.[4] [7]

| Layer | Global backbone | Country module examples | Refresh and provenance rule |
|---|---|---|---|
| Occupations | ILO ISCO-08 | SOC, NOC, ANZSCO, ESCO mappings | Retain original code, edition, crosswalk method, and source URL |
| Industries | UN ISIC Rev. 5 | NAICS, NACE, national activity codes | Never discard country-specific detail in favour of a forced global code |
| Skills and tasks | ESCO and national competency systems | O*NET, ESCO, sector frameworks | Label asserted, mapped, and derived relationships separately |
| Labour signals | ILOSTAT | National statistics offices and vacancy surveys | Keep measure, geography, period, unit, and suppression rules near the value |
| Job signals | Permissioned APIs and feeds | Adzuna, EURES, USAJOBS, country partners | Use credentials and terms; no unpermitted portal scraping |

### Ingestion rules

Each source package should be immutable and versioned. The processing layer should produce an auditable release manifest containing source URL, version/vintage, license, checksum, import timestamp, mapping confidence, and record counts. Crosswalks must be one of `official`, `publisher-provided`, `reviewed`, or `unresolved`; only the first two may form automatic hierarchy links.

Job boards should be treated as **time-bounded market signals**, not as the canonical definition of a job. A vacancy record needs its source, collection date, country/region, occupation mapping method, original title, employer field if supplied by the permitted API, and an expiry policy. Adzuna’s documented API route is an appropriate credentialed integration candidate; EURES and national public employment services should be assessed country by country.[8]

## Learning-resource design

The Atlas should prevent a dead end without claiming the web is a curriculum. The immediate design is an outbound, provenance-labelled layer: official source first, then explicit YouTube and Filmot search links. The YouTube Data API can later supply compliant query results subject to an API key, quotas, platform policies, and the display of source/channel metadata; it should be used through a backend, never from a static client secret.[9]

Filmot should remain an **external search destination** until it offers a documented, permissioned integration. The current product must not scrape Filmot pages, bypass its CAPTCHA, or present transcript search results as locally sourced data.

## Next build sequence

1. **Stabilize current interaction quality.** Test lasso pins, scan pause/restart, session-trail restoration, extreme zoom, and context transfer on desktop and mobile.
2. **Add country modules.** Start with ESCO + European labour/public-employment feeds, then add national classifications that have public, documented licenses.
3. **Add a small resource registry.** Store hand-curated, type-labelled resources against a source record with `official`, `article`, `course`, `video`, or `book` metadata. Do not bulk-copy third-party editorial lists.
4. **Add compliant job signals.** Introduce one permissioned API through a backend with a cache, usage monitoring, expiry, source attribution, and opt-out/terms review.
5. **Add evaluation.** For each mapping and recommendation, log the source, version, rule, confidence, reviewer, and date so corrections are cheap and public.

## Decisions to make before global launch

| Decision | Why it matters | Recommended default |
|---|---|---|
| First expansion geography | Determines language, classification, and labour-source requirements | European module: ESCO + EURES + ISCO/ISIC crosswalk documentation |
| Job-signal provider | Defines terms, quota, cost, coverage, and employer data | Begin with a single permissioned provider; cache results and expose source date |
| Account model | Enables saved progress, sharing, and comparisons | Keep browser-local progress first; add authentication only when user-owned sync is required |
| Video experience | Avoids opaque or unvetted resource lists | Start with outbound searches; add API results only with policy-compliant backend integration |

## References

[1]: https://www.onetcenter.org/database.html "O*NET Database — O*NET Resource Center"
[2]: https://www.bls.gov/oes/ "Occupational Employment and Wage Statistics — U.S. Bureau of Labor Statistics"
[3]: https://www.census.gov/naics/ "North American Industry Classification System — U.S. Census Bureau"
[4]: https://unstats.un.org/unsd/classifications/Family/Detail/2095 "ISIC Rev. 5 — United Nations Statistics Division"
[5]: https://anvaka.github.io/map-of-reddit/ "Map of Reddit — Anvaka"
[6]: https://github.com/nilbuild/developer-roadmap/blob/master/contributing.md "roadmap.sh Content Contribution Guide"
[7]: https://ilostat.ilo.org/methods/concepts-and-definitions/classification-occupation/ "ISCO Classification — International Labour Organization"
[8]: https://developer.adzuna.com/overview "Adzuna API Overview"
[9]: https://developers.google.com/youtube/v3/docs/search/list "YouTube Data API — Search.list"
