# Deep career-system investigation

## Research question

> What would make Industry Niche Atlas useful for a person who wants to understand the world of work, choose a direction, build capability, demonstrate it, and navigate change—without replacing verified facts with generic advice or pretending to predict individual outcomes?

## Current-system audit

The Atlas already provides a strong **discovery and evidence substrate**. Its Graph lets a user traverse real NAICS/ISIC classifications and O*NET occupations, skills, and task statements; Directory provides deliberate source-record browsing; Roadmaps turns an occupation into an O*NET-backed preparation, skills, tasks, related-role, and local readiness workspace. The system also preserves source vintage, does not manufacture industry-to-occupation crosswalks, separates official facts from browser-local evidence, and supports session trails, lasso pinning, scan, and contextual Graph-to-Roadmaps handoff.

The missing layer is **decision intelligence**. A serious career-building system needs to help a user form and revise a hypothesis; discover constraints and pathways; translate recorded work into practice and proof; compare options and trade-offs; see the conditions of a local or national market; locate credible programs, experiences, communities, and openings; then update their plan without losing provenance. The current Atlas does not yet offer a personal hypothesis workspace, interests/work-style reflection, role transition comparison, requirements-vs-evidence differential, projects/portfolio evidence ledger, applications or outreach tracking, location filter, dated labor outlook, credential/program comparison, opportunity feed, or a transparent way to coordinate this information across countries.

| Career-building journey | What the Atlas currently does | Material gap | Research test |
|---|---|---|---|
| Explore the world of work | Strong taxonomic and occupational traversal | No user purpose or comparison frame | How do serious systems support exploratory identity formation without overclaiming fit? |
| Form a career hypothesis | Related O*NET occupations; Roadmaps role selector | No saved “I am considering X because…” decision model | What minimum plan structure helps users compare paths? |
| Understand the work | Official task, skill, work-activity, software, title, wage, and preparation data | No life/work context, market outlook, or caveat synthesis | Which official sources add context without synthetic inference? |
| Prepare and practise | Local skill evidence states, checklist, practice prompt, video-search handoffs | No sequenced project evidence or feedback loop | How do work-simulation and portfolio systems bound real practice? |
| Demonstrate capability | “Can evidence” state | No artifact, reflection, or verification schema | What should a proof-of-work ledger store while staying user-owned? |
| Choose education/training | Preparation frequency only | No program/credential/cost/outcome comparison | Which open or permissioned registries are viable? |
| Act in the market | Static BLS OEWS wage/employment data | No dated outlook, local context, opportunity feeds, or outreach actions | What data can be added lawfully and maintained? |
| Transition and adapt | O*NET related occupations | No transferable-skill differential or scenario comparison | How should adjacent roles be represented without falsely calling them ladders? |
| Globalize | ISIC is present; global expansion plan exists | No country modules, languages, national occupation data, or regional labor data | Which standards and country sources combine cleanly? |

## Research safeguards

This investigation will distinguish four layers throughout: **official/primary facts**, **transparent derived comparisons**, **user-owned evidence and preferences**, and **permissioned external integrations**. It will not label a user employable, recommend a job or course as personally optimal, fabricate review/testimonial data, scrape prohibited job portals, copy protected roadmap content, or obscure geography, source vintage, uncertainty, or licensing.

## Comparative product findings

### My Next Move: three entry modes reduce the blank-page problem

My Next Move, sponsored by the U.S. Department of Labor and developed by the National Center for O*NET Development, uses three deliberately different entrances: keyword search for users who can name a target, industry browse for users who recognize a domain, and an interest profiler for users who cannot yet name a role. It also exposes secondary routes through bright outlook, career clusters, interest groupings, job preparation, veteran-to-civilian translation, Spanish-language content, and a direct Apprenticeship.gov handoff.[1]

The relevant pattern is not its visual design. It is its acknowledgement that users arrive with **different degrees of career clarity**. Atlas currently assumes a person can make sense of a huge world by browsing or searching. It needs an explicit “I am not sure yet” orientation path, designed as voluntary reflection rather than a diagnosis, plus transparent onward paths to recorded occupations and external apprenticeship resources.

### LinkedIn Career Explorer: transitions should be comparative, not declarative

LinkedIn’s open Career Explorer explains role transition using a 0–100 skills-similarity score built from overlap and relative importance of role skills, alongside observed member job-history transitions. It also separates the similarity concept from popularity of transitions.[2] The underlying pattern is powerful: a user should see **why** a neighboring role is plausibly adjacent and **which capability differences** remain. However, the Atlas cannot reproduce LinkedIn’s behavioral-transition claims because it lacks the private job-history data and a compatible skills ontology.

Atlas can still build a transparent alternative using only O*NET evidence: compare two occupations’ recorded essential skills, work activities, preparation facts, and shared tasks; label the result as an **O*NET evidence overlap**, not a labor-market transition probability. This would turn related-occupation browsing into an inspectable comparison rather than an unexplained short list.

### Public user discussions: a plan must be an experiment, not a course catalogue

Two public Reddit discussions are not representative research samples, but they illuminate recurring hypotheses that should be tested rather than ignored. In a thread about AI career-planning tools, multiple contributors criticized outputs that reduce a career plan to a course playlist. One commenter proposed a 90-day experiment grounded in a user’s role/level, capability gap, feedback environment, and realistically available experiences.[3] In a separate career-confusion thread, commenters repeatedly emphasized trying bounded work, noticing preferences, using inventories as prompts, and adjusting rather than waiting for certainty.[4]

The Atlas implication is concrete: Roadmaps should add a **reversible experiment layer**. A user should be able to save a hypothesis, choose a small evidence-producing experiment connected to an official task or skill, record a reflection, and compare the result with alternative hypotheses. This is more useful than presenting an infinitely long list of learning links, and it avoids pretending the application can choose a career for the user.

The evidence limit matters: these are public opinions, not validated outcome studies. They justify a product-design hypothesis, not a factual claim about what every person needs.

### Public career services: connect exploration to human help and local action

The UK National Careers Service uses a deliberately connected navigation model: explore jobs by term, sector, or category; take a skills assessment when unsure; find a course; obtain careers advice; and reach a human adviser by phone or webchat. It frames job profiles around qualifications, salary, progression opportunities, and daily tasks, while making the service’s public-information licensing explicit.[5]

This points to an important limitation in the current Atlas: an evidence-rich map should not imply it replaces advisers, mentors, employers, or local services. The Roadmaps action area should eventually include a clearly separated **“talk to people / verify locally”** route rather than only content and video searches. In country modules, official national career-service handoffs may be more valuable than a generic global recommendation.

CareerOneStop’s live exploration page was inaccessible from this research environment because its delivery configuration returned a geographic CloudFront block. Its documented public Web API was already reviewed separately; the access failure reinforces the need for resilient, source-labelled connectors and honest unavailable states rather than assuming every external source is universally accessible.[6]

### Open skills infrastructure: future interoperability is a product choice, not only a data choice

Western Governors University’s announcement of the Open Skills Network transition describes the Open Skills Management Tool as free, open-source tooling for creating, managing, and sharing Rich Skill Descriptor-based libraries. It positions standardized skill definitions as a bridge among employers, education providers, and workforce systems, with Credential Engine’s linked-data schema and registry as the interoperability destination.[7]

The Atlas should not ingest a second skill vocabulary merely to claim scale. Instead, it should preserve the source skill language, attach stable identifiers where mapping is licensed and defensible, and model the relationship among **skill definition**, **role relevance**, **learning evidence**, **credential**, and **user artifact** separately. That structure would allow a future export/import path without collapsing different frameworks into falsely identical skills.

### Jobs and Skills Australia Atlas: valuable reference, unavailable interactive session

Jobs and Skills Australia publicly describes its Jobs and Skills Atlas as a way to navigate labour-market data, and links it alongside an occupation-shortage list and a monthly Internet Vacancy Index.[8] The current interactive route did not progress beyond a zero-percent loading state in this research environment, even after a wait. That prevents a reliable interaction claim. Its public positioning still strengthens the country-module hypothesis: a serious national module should combine occupation, industry, regional, shortage, and vacancy evidence while allowing unavailable-layer states.

### Commercial assessment tools: useful reflection, unacceptable certainty claims

Prospects’ Career Planner asks users to register for a quiz and claims to match skills, motivations, and desires to a career “that’s perfect for you”; its newer Job Match beta offers a shorter interest/reward/purpose question flow and more than 400 job profiles.[9] This is a useful contrast for Atlas. Reflection prompts can reduce the blank-page problem, but Atlas should reject the “perfect career” framing. A future **Career hypothesis notebook** should ask users to record interests, values, constraints, available experiments, and curiosity; then show explainable role evidence and alternatives rather than a compatibility verdict.

### Pathful: career readiness is a longitudinal lifecycle

Pathful’s public product framing organizes a learner journey into awareness, exploration, preparation, and placement, explicitly combining self-discovery, career/pathway research, skills/experiences/connections, and launch readiness.[10] This four-part lifecycle is a stronger organizing model than a sequence of courses. Atlas can adapt the *lifecycle*, not the proprietary product: Graph primarily supports awareness/exploration; Roadmaps supports preparation; a future user-owned evidence and opportunity layer supports placement. Each stage needs visible escape routes back to evidence and revision.

### Work-based learning research: tasks need an experience and reflection loop

Jobs for the Future’s work-based learning framework describes a non-linear journey through awareness, exploration, preparation, and career experience. It distinguishes activities such as career research and counseling, job shadows and simulations, internships and pre-apprenticeships, and sustained paid work or registered apprenticeships. Its quality indicators add universal access, intentional alignment, financial support, personalized mentorship, pathway integration, and collaboration—reminders that “experience” is not simply a free project assignment.[11]

A 2024 peer-reviewed study of 340 Vietnamese university students likewise treats career exploration as combined self- and environmental exploration involving contextual, subjective, and personal factors, opportunities, and experiments. Its setting and sample limit generalization, but it reinforces the product principle that information alone is insufficient; exploration is active, contextual, and social.[12]

For Atlas, a practice prompt must therefore become a **bounded experiment record** with: a hypothesis, an official task/skill anchor, an accessible activity type, a support/feedback option, a time boundary, an artifact or reflection, and a next decision. The application must also show when an action needs local access, a mentor, money, or an employer—not pretend every user can complete the same experience.

### Australia’s myfuture: relevant public-service reference, unavailable rendered session

Australia’s myfuture identifies itself as a national career-information service and its public description emphasizes self-knowledge resources, career-pathway exploration, and decision-making tools. Its client-rendered site remained in a loading state in this research environment, so no claim is made here about its internal interaction mechanics. It remains a follow-up source for a later Australia country module, especially because it represents the public-service pattern of connecting self-understanding and career information rather than a purely occupational database.[13]

## Global data ecosystem findings

### ESCO: the first viable multilingual occupation–skill country module

The European Commission’s current ESCO v1.2.1 provides web-service and downloadable local APIs for applications in career guidance, job matching, and skills intelligence. The Commission describes the service APIs as access to the classification and relationships, and distributes the API software under EUPL 1.2 with several Apache-licensed components.[14] ESCO is therefore the strongest near-term candidate for a separately versioned European module. It should sit beside—not overwrite—the existing O*NET release: preserve ESCO identifiers, language labels, essential/optional relation semantics, version, and source; expose mappings only when a published crosswalk supports them.

### ILOSTAT: global aggregates require metadata-aware ingestion

ILOSTAT’s bulk facility offers compressed CSV data, dictionaries, source notes, classifications, indicator and reference-area table structures, and programmatic rerun options through Rilostat. It distinguishes country-level, regional, and global estimates; indicator, frequency, unit, classifications, and source metadata are part of the record structure. Its page notes roughly 500 indicator and 700 reference-area datasets, depending on the organisation scheme.[15]

This makes ILOSTAT appropriate for carefully scoped **country and regional context cards**—for example employment, unemployment, labor-force, or sector indicators—not for a live job board or individual predictions. An Atlas importer must select a tiny, declared indicator catalog; persist unit, frequency, time, source, notes, classification, geography, retrieval date, and revision status; and show missingness rather than interpolate country data.

### Opportunity systems: use permissioned connectors and geographic context, not scraping

The official USAJOBS developer portal offers documented dynamic search, RSS feeds, job exports, REST services, code lists, and past-announcement resources. Its search endpoints require an API key through an access request, so a future U.S. federal-opportunity layer must be a backend-cached, opt-in connector rather than a browser-side workaround.[16]

The public EURES portal organizes its service around job searching, candidates, country-specific living and working conditions, European Job Days, and support channels. Its front-page framing explicitly links skills-based recruitment with cross-border mobility and maintains multiple languages.[17] Atlas should treat a job result as only one action within a **mobility context**: country conditions, language, legal/work authorization, local support, and source-linked application route need their own labeled context. No unofficial scraping route should be used.

### Credentials and proof: distinguish self-evidence from issuer claims

1EdTech’s Open Badges 3.0 and Comprehensive Learner Record standards describe a verifiable achievement as a claim about a particular earner, achievement, issuer, and possible evidence. An OpenBadgeCredential is digitally signed by an issuing organisation; it is not a generic self-completed checklist.[18]

Credential Engine’s Credential Registry uses linked-open CTDL JSON-LD data, globally unique CTIDs, publisher accounts, and a minimum-data policy to connect credentials, competencies, outcomes, market values, pathways, attainment, and quality assurance.[19] This creates a strict product boundary: Atlas may let a person record **self-owned artifact evidence** and link it to official skills/tasks, but it must never issue or visually mimic an externally verified credential. A later integration can display external credential metadata, issuer, criteria, location, cost/outcomes (where supplied), and source/refresh date; it should not invent rankings or imply credential validity beyond the issuing system.

### Forecast and education data: essential context, never a promise

Cedefop’s Skills Forecast covers EU-27 Member States plus Norway, Iceland, North Macedonia, Switzerland, and Türkiye, with labour-force, employment, replacement-demand, country, occupation, and sector views. It uses harmonised sources and methods for cross-country comparability but explicitly says it does not substitute national forecasts, cautions that detailed estimates can have large and uncertain margins of error, and flags low-employment cells as especially uncertain.[20] Atlas should carry these caveats into every future forecast visualization; forecast data belongs in a dated **context lens**, not a “future-proof career” score.

The U.S. Department of Education’s College Scorecard API exposes institution and field-of-study data such as programs, costs, graduation rates, admissions, debt, repayment, and earnings. It requires an API key and warns through its documentation that fields can have different publication years and cohorts; a `latest` response may mix the latest available year by metric.[21] A transparent education-comparison layer must show field versus institution granularity, cohort, metric year, missingness, and source. It should let users filter and inspect trade-offs, never claim a universally best school or predict an individual’s earnings.

## Implemented research-to-product test: Career Lab

The first architecture capability now ships inside Roadmaps. A user can choose a real O*NET task or skill anchor, state a hypothesis, select a reversible experiment mode (observe, simulate, practise, contribute, or talk), pick a 7/30/90-day planning horizon, record an optional support route and evidence link, and write a reflection. The browser validation created and then removed a temporary experiment anchored to the official O*NET task “Prepare detailed reports on audit findings.”

The implementation persists only in the browser’s local storage. It displays a clear local-only disclaimer, keeps O*NET anchor text separate from user prose, does not create a score, and does not represent an artifact as externally verified. The next comparative capability should build on this same boundary: identify recorded overlap and differences between two source occupations, while leaving any judgment about suitability or feasibility to the user and cited sources.

## References

[1]: https://www.mynextmove.org/ "My Next Move — U.S. Department of Labor / O*NET"
[2]: https://linkedin.github.io/career-explorer/ "LinkedIn Career Explorer — Economic Graph"
[3]: https://www.reddit.com/r/careerguidance/comments/1tafecv/has_anyone_actually_found_an_ai_tool_that_builds/ "Public discussion: AI career plans and course catalogues"
[4]: https://www.reddit.com/r/careeradvice/comments/1pfp40n/how_do_you_choose_a_career_path_when_you_dont/ "Public discussion: career confusion and exploratory action"
[5]: https://nationalcareers.service.gov.uk/explore-careers "National Careers Service — Explore careers"
[6]: https://www.careeronestop.org/Developers/WebAPI/Occupation/get-occupation-details.aspx "CareerOneStop — Occupation Details API"
[7]: https://www.wgu.edu/newsroom/press-release/2025/02/osn-transition-rich-skills.html "Open Skills Network transition announcement — WGU"
[8]: https://www.jobsandskills.gov.au/jobs-and-skills-atlas "Jobs and Skills Australia Atlas"
[9]: https://www.prospects.ac.uk/planner "Prospects — Career Planner"
[10]: https://pathful.com/ "Pathful — Career readiness platform"
[11]: https://www.jff.org/idea/work-based-learning-framework/the-framework/ "Jobs for the Future — Work-Based Learning Framework"
[12]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11153200/ "Pham, Lam, and Bui (2024) — Career exploration and career choice"
[13]: https://myfuture.edu.au/home "myfuture — Australia’s National Career Information Service"
[14]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api "European Commission — ESCO Services API"
[15]: https://ilostat.ilo.org/data/bulk/ "ILOSTAT — Bulk download facility"
[16]: https://developer.usajobs.gov/ "USAJOBS — Developer Portal"
[17]: https://eures.europa.eu/index_en "EURES — European Employment Services"
[18]: https://www.1edtech.org/standards/open-badges "1EdTech — Open Badges"
[19]: https://credentialengine.org/credential-transparency/credential-registry/ "Credential Engine — Credential Registry"
[20]: https://www.cedefop.europa.eu/en/tools/skills-forecast "Cedefop — Skills Forecast"
[21]: https://collegescorecard.ed.gov/data/api-documentation/ "U.S. Department of Education — College Scorecard API"
