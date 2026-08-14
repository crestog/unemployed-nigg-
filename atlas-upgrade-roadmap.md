# Industry Niche Atlas: Global Expansion and Learning Roadmap

> **Product purpose.** The Atlas should help a person understand how economic activity, occupations, skills, tasks, and learning paths connect. It is not merely a directory or job board. Every route must either deepen into a source-backed record or explain the boundary and offer a transparent next action.

## 1. What exists today

The current real-source release is a strong U.S.-centred prototype, not yet a map of all work in all countries. It includes **2,125 NAICS records**, **830 ISIC records**, **1,016 O*NET occupations**, **18,796 task statements**, **8,940 occupation–skill links**, **36,654 work-activity links**, and **961 occupation records with BLS wage coverage**. The release manifest records zero synthetic records and explicitly flags the unresolved industry-to-occupation crosswalk; the product should preserve that honesty rather than fabricate a link.

| Product layer | Current state | What it establishes | Principal gap |
|---|---|---|---|
| Industry taxonomy | NAICS 2022 and ISIC Rev. 5 | Formal economic-activity tree | Country-specific industry extensions and concordances |
| Occupations | O*NET 30.3 plus BLS context | Work profiles, tasks, skills, activities, titles | Global occupation spine and national mappings |
| Exploration | Infinite Canvas, search, route history, breadcrumbs, directory | Discoverability and recoverable navigation | Comparison, scanning, and a learning next step |
| Learning resources | External source links only | Transparent provenance | Source-labelled, carefully governed resource routing |
| Job market | BLS national wage context | One reliable national signal | Country-specific labour signals and permissioned vacancy feeds |

## 2. The global data spine

The world version should use **ISCO-08** as the occupation backbone and **ISIC Rev. 5** as the industry backbone. ISCO is designed for internationally comparable occupation statistics and has 10 major groups, 43 sub-major groups, 130 minor groups, and 436 unit groups.[1] ISIC Rev. 5 supplies a four-level economic activity hierarchy of 22 sections, 87 divisions, 258 groups, and 463 classes.[2]

The key design rule is that a global code is not a claim that every national occupation is identical. National systems remain first-class, versioned overlays. A German occupation, an Indian national occupation code, a U.S. O*NET-SOC profile, and an Australian occupation record can point to an ISCO unit group through an explicit source crosswalk with a relationship type and confidence/provenance. The Atlas should never silently merge them.

| Data category | Base standard | First official additions | Intended use |
|---|---|---|---|
| Occupation | ISCO-08 | ESCO for European multilingual skills/occupations; national systems through published mappings | World occupation tree and local translation |
| Industry | ISIC Rev. 5 | NACE, NAICS, ANZSIC, national statistical agency systems | Country and regional economic-activity map |
| Skills | ESCO + O*NET | National skills frameworks only where licence and mappings permit | Skill graph and learning vocabulary |
| Labour signals | ILOSTAT | Eurostat, OECD, national statistical offices | Employment, unemployment, wages and vacancy rates by country/industry/occupation |
| Live demand | Permissioned provider API or partner feed | Adzuna evaluation; USAJOBS; country public employment services | Time-stamped vacancies and demand indicators |

## 3. A no-dead-end exploration rule

Every selected record should resolve into an **Explore**, **Compare**, or **Learn** action. This prevents the current experience of reaching a narrow task and not knowing what to do next.

| Record selected | Explore next | Compare next | Learn next |
|---|---|---|---|
| Industry | Official children, country employment signals | Other countries or adjacent industries | Industry literacy and qualification pathways when source-backed |
| Occupation | Skills, tasks, work activities, alternate titles | Up to four occupations against shared skills/tasks | Skill sequence and transparent video/document searches |
| Skill | Attached occupations and related tasks | Similar skills across chosen occupations | Curated resource sources, external search links, and a user-owned study path |
| Task | Parent occupation, sibling tasks, tools and activities | Tasks across comparable occupations | Task vocabulary, practice-project prompts, and external learning searches |

roadmap.sh demonstrates a useful interaction pattern: role- and skill-based paths, click-through topics, attached resources, and progress tracking.[3] The Atlas should borrow this **model of progression**, but not redistribute roadmap.sh content. Its public site states that its content may be used personally or linked to, not redistributed.[4]

## 4. Video and learning-resource layer

The initial release should use clear outbound links rather than copied third-party results:

1. **YouTube search link:** selected record title + record type + an optional country/language qualifier.
2. **Filmot search link:** selected task or skill as a quoted subtitle/transcript query, labelled as an external Filmot search.
3. **Source links:** O*NET, ESCO, ILO, national agencies, public course providers, and official documentation where a specific source has been reviewed.

Filmot presents public search over YouTube subtitles, captions, and transcripts, but its public page does not present a documented first-party integration API. The safe product choice is therefore an outbound query link, not copied Filmot search results or scraped transcript data.[5] The YouTube Data API can later supply in-product video results with a `type=video` search and country-aware availability through `regionCode`, but that requires credentials, a secure backend, and compliance with YouTube API policies.[6] [7]

## 5. Job-market data: what is realistic and compliant

The Atlas should not bulk-scrape job portals. Pages can change, rates can be blocked, terms can prohibit automated collection, and job posting text often contains personal or employer-sensitive information. Instead, it should combine slow, authoritative statistics with fast, permissioned feeds.

| Layer | Source route | Refresh | Product representation |
|---|---|---|---|
| Official global statistics | ILOSTAT bulk CSV plus metadata | Monthly/quarterly/annual by indicator | Country coverage, employment and unemployment context |
| Regional statistics | Eurostat/OECD APIs and bulk tables | Provider-defined | Vacancy rates and activity trends, visibly dated |
| Country public jobs | Official APIs such as USAJOBS and public employment services | Daily where terms allow | Clearly sourced opportunity cards or counts |
| Permissioned commercial feed | Adzuna or a licensed partner API | Provider-defined | Time-stamped demand trend, salary range, or result links |
| Direct user research | External site links opened by the user | Live | No stored portal copy; user remains on source site |

ILOSTAT provides bulk datasets, code dictionaries, and metadata by indicator or country/reference area, supporting replicable ingestion instead of one-off downloads.[8] Adzuna documents a credentialed REST API for job-ad search and vacancy/salary signals; it requires an application ID and key, so it belongs behind a backend proxy and its results must retain provider attribution and refresh timestamps.[9]

## 6. Build order

### Now: ship without new credentials

Implement the exploration improvements directly in the static atlas: lasso selection with linked highlighting, scan mode, a session timeline, a comparison tray, a selected-record `Learn next` panel, and transparent external YouTube/Filmot query links. These features operate only on the release’s official records and do not manufacture data.

### Next: add the global reference release

Ingest ISCO-08 and ESCO as separate labelled collections. Build source-versioned crosswalk tables for NAICS↔ISIC and O*NET-SOC↔ISCO/ESCO only where a published mapping exists. Add country, language, and classification-version fields to every record before adding any national data.

### Then: add country modules

Treat a country as an independently reviewable package: national occupation system, national industry system, official labour statistics, supported languages, available vacancy feed, update cadence, licence, and source notes. Start with one or two fully evidenced country modules rather than a misleadingly broad partial world map.

### Finally: enable dynamic market data

Upgrade to a backend-enabled project only when a permitted provider API is selected. Store keys as server secrets, cache provider outputs by query and country, show provider/time/source labels, enforce rate limits, and keep raw job ads out of the permanent public bundle unless the source terms explicitly allow it.

## 7. Product features to complete in the present release

| Feature | Why it matters | Real-data boundary |
|---|---|---|
| Lasso + linked highlighting | Compare a cluster of skills/tasks without losing context | Selections contain only currently rendered source records |
| Scan mode | Provides a guided way to discover the world | It walks existing official hierarchy and O*NET links only |
| Session timeline | Makes curiosity reviewable and comparable | Stores the user’s clicked records locally in their browser |
| Comparison tray | Turns wandering into insight | Compares observed measures only; missing values stay missing |
| Learn next panel | Prevents a narrow record from becoming a dead end | Uses source-marked external searches or reviewed links |
| Country selector (future) | Makes coverage visible and honest | Shows `not yet available` rather than implying global coverage |

## References

[1]: https://ilostat.ilo.org/methods/concepts-and-definitions/classification-occupation/ "ILO: International Standard Classification of Occupations"
[2]: https://unstats.un.org/unsd/classifications/Family/Detail/2095 "UNSD: ISIC Rev. 5 Classification Detail"
[3]: https://roadmap.sh/about "roadmap.sh: About"
[4]: https://roadmap.sh/about "roadmap.sh: Content redistribution statement"
[5]: https://filmot.com/ "Filmot: Search in YouTube subtitles, captions and transcripts"
[6]: https://developers.google.com/youtube/v3/docs/search/list "YouTube Data API: Search list"
[7]: https://developers.google.com/youtube/terms/developer-policies "YouTube API Services Developer Policies"
[8]: https://ilostat.ilo.org/data/bulk/ "ILOSTAT: Bulk download facility"
[9]: https://developer.adzuna.com/overview "Adzuna API: Overview"
