# Industry Niche Atlas — Research & Build Plan

## 1. Executive answer: how many industries exist?

There is **no single universal count of industries**. “Industry” changes meaning depending on whether the classification is for national statistics, global investment analysis, business directories, labor-market research, or consumer discovery. The right product answer is therefore to expose multiple official spines instead of pretending one taxonomy is complete.

| System | Primary use | Hierarchy | Current count / coverage | What it is good for |
| --- | --- | --- | --- | --- |
| **GICS** | Global public-company and investment analysis | Sector → Industry Group → Industry → Sub-Industry | **11 sectors → 25 groups → 74 industries → 163 sub-industries** | A compact global “choose an industry” starting point; stable and easy to scan. [S&P DJI](https://www.spglobal.com/spdji/en/landing/topic/gics/) |
| **NAICS 2022** | U.S., Canada, and Mexico business statistics | Sector → Subsector → Industry Group → NAICS Industry → National Industry | **20 sectors; five official levels down to a six-digit national industry** | Establishment-level economic data, business counts, employment, payroll, and regional comparisons. [U.S. Census](https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html) |
| **ISIC Rev. 5** | International economic statistics | Section → Division → Group → Class | **22 sections → 87 divisions → 258 groups → 463 classes** | A global economic-activity spine and crosswalk anchor. [UN Statistics Division](https://unstats.un.org/unsd/classifications/Family/Detail/2095) |
| **NACE Rev. 2.1** | European Union economic statistics | Section → Division → Group → Class | Four-level EU classification; official for EU statistics from 2025 onward | EU-localized detail and transition/backcasting. [Eurostat](https://ec.europa.eu/eurostat/web/nace) |
| **O*NET-SOC** | U.S. occupations and work requirements | Broad occupation groups → data-level occupations → tasks, activities, skills, context | **1,016 occupation titles/codes; 923 data-level occupations; 18,796 task statements** in O*NET 30.3 | The best open foundation for “what does this person actually do?” [O*NET database](https://www.onetcenter.org/database.html) |
| **ESCO** | European skills, competences, qualifications, and occupations | Occupations + a separate skills/knowledge hierarchy | **13,939 skills/knowledge/competence concepts** in v1.2.1; downloadable in CSV, RDF, TTL, ODS, XML, and JSON-LD | Multilingual labor-market crosswalks and skill relationships. [ESCO skills](https://esco.ec.europa.eu/en/classification/skill_main) |
| **ISCO-08** | International occupations | Major → Sub-major → Minor → Unit group | **43 sub-major groups, 131 minor groups, 436 unit groups** | A global occupation backbone that can sit beside ISIC. [ILO](https://ilostat.ilo.org/methods/concepts-and-definitions/classification-occupation/) |

**Interpretation:** a defensible first page can offer 11 GICS sectors, 20 NAICS sectors, or 22 ISIC sections as different “front doors.” The atlas should not claim that there are “X industries in the world.” It should say: **“This depends on the taxonomy. Pick a lens, then follow the work.”**

## 2. How many levels can the product go down?

The source taxonomies provide four or five formal classification levels. The product can go deeper by adding linked labor-market and work-practice layers, but those deeper layers are **not one universal hierarchy**. They are a graph of relationships.

### Recommended exploration stack

| Level | Product label | Typical question | Best source or method |
| --- | --- | --- | --- |
| 0 | **Economic universe** | What lens am I using? | GICS, NAICS, ISIC, NACE |
| 1 | **Sector / section** | What broad part of the economy? | Official classification |
| 2 | **Subsector / industry group** | What family of activities? | Official classification |
| 3 | **Industry / class** | What production or service activity? | Official classification |
| 4 | **Sub-industry / national industry** | What narrower business activity? | GICS or NAICS terminal code |
| 5 | **Domain** | What subject-matter or operating domain exists inside it? | Curated domain ontology + sector literature |
| 6 | **Occupation / profession** | Who performs the work? | O*NET-SOC, ESCO, ISCO, BLS |
| 7 | **Specialization / job title** | What narrower version of the role? | O*NET alternate titles, ESCO labels, job-posting normalization, expert review |
| 8 | **Skill / tool / credential** | What capabilities and technologies are needed? | O*NET, ESCO, BLS skills, job postings |
| 9 | **Task / activity** | What actions are performed? | O*NET task statements, work activities, work context |
| 10 | **Work rhythm** | How does a day, week, month, or season unfold? | O*NET context + task frequency where available; workflow research; interviews; diaries; expert review |
| 11 | **Evidence trail** | Why should I believe this? | Source link, vintage, definition, confidence, provenance, change log |

The “rabbit hole” should therefore stop at a **work profile**, not a fake tenth-level taxonomy. A user can travel 8–10 clicks, but each click after formal industry classification should be labeled as a relationship such as **“performed by,” “requires,” “specializes into,” “uses,” or “observed as.”**

## 3. The core product concept

**Industry Niche Atlas** is a research-backed, node-based directory that lets a user choose a broad economic lens, trace into a specific industry, pivot into domains and occupations, then open a human-scale work profile showing tasks, tools, time allocation, cadence, constraints, and evidence.

The product should feel like a map plus a field guide. It is not merely a scatter plot or directory. It is a **crosswalk explorer** that makes the relationship between economic activity and human work legible.

### Primary user journeys

1. **Broad-to-narrow discovery:** Choose GICS, NAICS, or ISIC; select a sector; descend to a sub-industry; see connected roles and domains; open one niche.
2. **Occupation-to-industry reverse search:** Start with a profession or task; see which industries use it and how the work changes across contexts.
3. **Trend scan:** Use a scatter plot or treemap to compare growth, pay, employment, skill intensity, or emerging-skill signals.
4. **Evidence-first investigation:** Open a node and inspect the exact source, vintage, definition, crosswalk, confidence, and limitations.
5. **Save and share:** Pin a route, export a concise brief, or share a URL encoding the selected path and visual lens.

## 4. Visualization system: use each view for a specific question

| View | Best question | Interaction | Data contract |
| --- | --- | --- | --- |
| **Scatter plot** | Which occupations or sub-industries are high-growth, high-pay, high-employment, or high-skill? | X/Y selector, size, color, lasso/hover, compare | Numeric values with units, source date, missing-data behavior |
| **Semantic map** | What concepts are close or connected even across different taxonomies? | Pan, zoom, search, click-to-open, relationship filters | Nodes + typed edges + provenance; do not imply causal meaning from proximity alone |
| **Word cloud** | What terms, tools, or tasks dominate a selected niche? | Weight toggle, stop-word control, click term to filter | Token frequency plus source/method; use as a secondary view, not the primary evidence |
| **Cluster map** | What groups of skills, tasks, or occupations co-occur? | Cluster count, metric switch, highlight lineage | Explain algorithm, sample, date, and uncertainty; default to transparent curated groupings before ML clusters |
| **Treemap / directory** | Where is the scale or density? | Drilldown, metric toggle, click tile | Area must map to a meaningful quantity such as employment, establishments, or postings |
| **Work rhythm strip** | How does time move through the job? | Day/week/month tabs; task segments; context notes | Use observed or source-backed estimates with explicit confidence; avoid invented precision |
| **Evidence drawer** | Why is this node here? | Source list, definition, crosswalk, vintage, caveat | Every claim should be traceable to a source or marked as editorial synthesis |

The first release should combine **scatter plot + semantic map + word cloud + cluster map + directory tree** in one workspace. The work-profile page should add the time-rhythm strip and evidence drawer.

## 5. Data strategy and source hierarchy

### Phase 1: open, stable backbone

Use **ISIC Rev. 5** or **NAICS 2022** for economic-activity nodes, **ISCO-08 / O*NET-SOC / ESCO** for occupations, and **O*NET 30.3** for tasks, work activities, skills, work context, job zones, software skills, and alternate titles. O*NET is available in CSV, JSON, SQL, RDF, and web services; the database is updated quarterly and is licensed CC BY 4.0 with attribution. [O*NET database](https://www.onetcenter.org/database.html) [O*NET license](https://www.onetonline.org/help/license)

### Phase 2: labor-market measures

Add BLS Employment Projections, Occupational Employment and Wage Statistics, Current Employment Statistics, Quarterly Census of Employment and Wages, and Census County Business Patterns / Statistics of U.S. Businesses. These provide employment, growth, wages, establishments, payroll, geography, and industry context. Use the vintage and geography as first-class fields.

### Phase 3: emerging niches

Add job-posting evidence only after a license and reproducible ingestion process are in place. Normalize raw titles to occupations, extract skills and tools, and aggregate at a geography/time window. Lightcast demonstrates the value of monthly skills updates and specialized occupation layers, while JobCannon demonstrates a useful provenance rule: every edge should be traceable to a source and a stated threshold. These should be **references for method**, not copied data.

### Phase 4: work-pattern evidence

O*NET can describe tasks and work context but cannot, by itself, provide a literal diary of a person’s calendar. Build this layer from a mix of task statements, work-activity ratings, work-context variables, employer workflow documents, professional associations, occupational interviews, and opt-in diary studies. Store the result as a **work-pattern synthesis** with confidence bands and explicit “illustrative, not universal” language.

### Suggested node and edge model

```text
Node {
  id, type, preferred_name, aliases[], definition, taxonomy, code,
  parent_ids[], source_ids[], vintage, geography, status,
  metrics{}, confidence, editorial_notes[]
}

Edge {
  id, from_id, to_id, relation,
  weight, evidence_ids[], method, vintage, confidence,
  notes
}

Evidence {
  id, publisher, title, url, license, retrieved_at,
  vintage, excerpt, supports[], limitations
}

WorkProfile {
  occupation_id, context, tasks[], tools[], skills[],
  day_rhythm[], week_rhythm[], month_rhythm[],
  constraints[], deliverables[], collaboration_map[],
  confidence, evidence_ids[]
}
```

## 6. Similar products and what to learn from them

| Product | What it proves | How the atlas should respond |
| --- | --- | --- |
| **O*NET OnLine** | People want browse-by-industry, job family, job zone, skills, activities, and software skills in one system. | Use O*NET as the work-profile backbone, but add an industry-first spatial journey and stronger provenance. |
| **Occupational Mobility Explorer** | Location + occupation + transferable skills is a compelling path-building interaction. | Add geography as an optional lens and make “what can I move into?” a later journey. [Explorer](https://www.philadelphiafed.org/surveys-and-data/community-development-data/occupational-mobility-explorer) |
| **US Job Market Visualizer** | Treemaps and metric toggles make large occupational datasets scannable. | Use multiple lenses in a shared canvas, but add semantic links and a narrative evidence drawer. [Visualizer](https://karpathy.ai/jobs/) |
| **Lightcast Taxonomies** | Market-facing detail needs separate layers for skills, occupations, and raw job titles. | Model titles as noisy aliases that map to a more stable occupation node; keep emerging roles in a dated “signal” layer. [Taxonomies](https://lightcast.io/our-data/taxonomies) |
| **JobCannon Knowledge Graph** | Auditable edges and explicit thresholds build trust. | Attach provenance and confidence to every relationship; never hide a derived similarity score. [Methodology](https://jobcannon.io/methodology/knowledge-graph) |
| **CareerExplorer** | Users respond to guided assessment and large career libraries. | Keep the atlas exploratory and evidence-led; later add a separate “find paths that fit me” layer rather than mixing it into the taxonomy. |

## 7. Recommended information architecture

### Route A — Atlas landing / choose a lens

Show the three main spines (GICS, NAICS, ISIC), a short explanation of why counts differ, a searchable directory, and a visual preview. The CTA should be “Start broad. Follow the work.”

### Route B — Explorer workspace

Three-column desktop layout: hierarchy rail on the left, map/chart canvas in the center, evidence drawer on the right. Tabs switch between directory, scatter, semantic, word cloud, cluster, and saved paths without losing the current lineage.

### Route C — Work profile

Show the selected niche as a clear title, lineage, “what this work is,” tasks, tools, skills, work rhythm, typical deliverables, collaboration map, entry path, adjacent roles, metrics, and sources. Use a day/week/month tab bar for time-scale exploration.

### Route D — Research / methodology

Explain the count problem, formal taxonomy levels, data-source matrix, licensing, update cadence, crosswalk rules, confidence labels, and known gaps. Include the full build plan as a downloadable Markdown file.

## 8. Static prototype scope (this delivery)

The static website should be a **research prototype**, not a live data pipeline. It should contain a curated sample of nodes and relationships across a handful of industries so that the interaction is real without pretending that the entire world has already been ingested.

### Curated demo path

Use a path such as **Information Technology → Software → Data & Analytics → Data Scientist → Healthcare analytics → Clinical data quality analyst**. The final page should show an illustrative work rhythm, clearly labeled as a prototype synthesis and not as a universal schedule.

### Prototype data included

Use a small but coherent set of sectors, domains, occupations, skills, tasks, and evidence references. Numeric visualizations should be labeled as **illustrative index values** unless they come directly from a cited official source. Avoid fabricated reviews, testimonials, or personal outcomes.

## 9. Implementation plan

### Milestone 1 — Research and ontology contract

Freeze the source vintages, define node/edge types, create crosswalk rules, and write data dictionaries. Decide which claims are direct source facts, derived metrics, or editorial synthesis.

### Milestone 2 — Ingestion and normalization

Download the open taxonomies, normalize identifiers, preserve original codes, deduplicate aliases, generate crosswalk tables, and keep source snapshots. Add automated checks for orphan nodes, duplicate codes, missing licenses, and invalid parent-child relationships.

### Milestone 3 — Graph and metrics layer

Build a graph index, create searchable labels, compute node degrees and cluster inputs, and attach time/geography to every metric. Store precomputed static JSON for the frontend in the first release.

### Milestone 4 — Explorer interaction

Implement breadcrumb lineage, drill-down navigation, node selection, compare/pin state, search, metric toggles, URL state, evidence drawer, and a small-screen bottom sheet.

### Milestone 5 — Visualization layer

Implement deterministic SVG/Canvas views for scatter, semantic map, word cloud, and cluster map. Each chart should have accessible labels or an adjacent directory/table representation. Recharts can cover numeric charts; custom SVG is appropriate for the node map.

### Milestone 6 — Work-profile content

Create day/week/month rhythm views with confidence labels and source callouts. Add adjacent occupations, tools, skills, deliverables, and “what changes by employer/context” notes.

### Milestone 7 — Production pipeline

Move from curated JSON to scheduled ingestion with versioned releases, change logs, tests, data quality reports, and a source-attribution page. Upgrade from static hosting only if server-side APIs, search indexing, authentication, or large data storage are required.

## 10. Success metrics

| Metric | What success looks like |
| --- | --- |
| Discovery depth | Users can move from a broad sector to a final work profile in 4–8 deliberate clicks without losing context. |
| Orientation | Every selected node visibly shows its lineage, level, and next available moves. |
| Evidence trust | Every factual node or edge has a source, vintage, and limitation label. |
| Crosswalk clarity | Users can tell whether they are moving within a formal taxonomy or across a linked relationship. |
| Visualization usefulness | Each chart answers a distinct question and has a directory/table fallback. |
| Shareability | A saved path can be copied as a URL or exported as a concise research brief. |
| Work realism | The final page describes tasks and rhythms with uncertainty rather than false precision. |

## 11. Risks and guardrails

**False precision:** Do not claim one global industry count. Always name the taxonomy and vintage.

**Taxonomy mismatch:** Do not force industry and occupation trees into one parent-child tree. Use typed crosswalk edges.

**Stale data:** Store retrieval date and source vintage; display update cadence.

**Emerging-role lag:** Mark new roles as signals until sufficient evidence or expert review exists.

**Invented work schedules:** Present time allocation as illustrative or evidence-backed ranges, never as a universal diary.

**Black-box clustering:** Explain the inputs and method for every cluster map; prefer transparent groupings first.

**Licensing:** Preserve attribution and use only data whose license permits the intended use. O*NET is CC BY 4.0; ESCO is downloadable and offers a semantic model, but each source’s terms must still be checked before redistribution.

## 12. Source register

1. [U.S. Census Bureau — NAICS](https://www.census.gov/naics/)
2. [U.S. Census Bureau — Understanding NAICS](https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html)
3. [Bureau of Labor Statistics — Industry Classification Overview](https://www.bls.gov/ces/naics/)
4. [UN Statistics Division — ISIC Rev. 5](https://unstats.un.org/unsd/classifications/Family/Detail/2095)
5. [Eurostat — NACE](https://ec.europa.eu/eurostat/web/nace)
6. [S&P Dow Jones Indices — GICS](https://www.spglobal.com/spdji/en/landing/topic/gics/)
7. [MSCI — GICS overview](https://www.msci.com/indexes/index-resources/gics)
8. [O*NET OnLine](https://www.onetonline.org/)
9. [O*NET Database 30.3](https://www.onetcenter.org/database.html)
10. [O*NET Content License](https://www.onetonline.org/help/license)
11. [O*NET Web Services](https://services.onetcenter.org/about)
12. [ESCO skills](https://esco.ec.europa.eu/en/classification/skill_main)
13. [ESCO download and semantic model](https://esco.ec.europa.eu/en/use-esco/download)
14. [ILO — ISCO-08](https://ilostat.ilo.org/methods/concepts-and-definitions/classification-occupation/)
15. [BLS Employment Projections](https://www.bls.gov/emp/)
16. [Philadelphia Fed — Occupational Mobility Explorer](https://www.philadelphiafed.org/surveys-and-data/community-development-data/occupational-mobility-explorer)
17. [US Job Market Visualizer](https://karpathy.ai/jobs/)
18. [Lightcast Taxonomies](https://lightcast.io/our-data/taxonomies)
19. [JobCannon Knowledge Graph methodology](https://jobcannon.io/methodology/knowledge-graph)
20. [CareerExplorer](https://www.careerexplorer.com/)

