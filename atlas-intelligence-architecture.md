# Atlas intelligence architecture

## Decision

Industry Niche Atlas should not become another search page with a career quiz layered on top. Its differentiating proposition is a **traceable world-of-work intelligence system**: a person starts with a real work question, moves through source-labelled evidence, tests a bounded hypothesis through real experience, records their own proof, and revises their route. The system treats uncertainty as normal and leaves facts, interpretations, personal evidence, and external services visibly distinct.

> **Design principle:** No user should have to mistake a data point, a comparison, a recommendation, a self-assessment, or a third-party claim for any other kind of thing.

## Layered model

| Layer | Purpose | Candidate evidence | Atlas behavior | What it must never claim |
|---|---|---|---|---|
| **0. Classification foundation** | Name and connect work consistently | NAICS, ISIC, O*NET-SOC, ISCO, ESCO, source crosswalks | Preserve each native identifier, version, language, and relation | That records are identical merely because a mapping exists |
| **1. Work reality** | Show what roles and industries actually describe | O*NET tasks, skills, activities, work styles, interests, technology skills; BLS OEWS | Graph, Directory, source cards, evidence badges | That a source description defines every employer or person in a role |
| **2. Context and conditions** | Put work into geographic, economic, and temporal context | BLS EP/OEWS; ILOSTAT; Cedefop; national services | Country cards, dated outlook and wage lenses, caveat labels | A guaranteed future outcome or universal salary |
| **3. Paths and preparation** | Make possible routes inspectable | Job Zones; preparation frequencies; ESCO relations; Credential Registry; Scorecard | Preparation context, related-role comparison, training/credential metadata | That a related role is a promotion or a course is necessary/best |
| **4. Personal career lab** | Help a person form, test, and revise a hypothesis | User-owned notes, constraints, experiments, artifacts, reflections | Local hypothesis notebook, time-boxed experiments, evidence ledger | Employability score, personality diagnosis, or verified credential |
| **5. Human and opportunity connectors** | Move from analysis to real-world support | Advisers, apprenticeships, work-based learning, permissioned job APIs, EURES/USAJOBS | Source-labelled external handoffs; later cached connectors | That Atlas controls an application or represents a provider |

## Data contract

Every displayed item should inherit a compact evidence envelope:

```ts
type EvidenceEnvelope = {
  sourceName: string;
  sourceUrl: string;
  sourceVersion?: string;
  sourceDate?: string;
  retrievedAt?: string;
  geography?: string;
  classification?: string;
  relationType?: 'source-record' | 'published-mapping' | 'computed-overlap' | 'user-owned' | 'external-link';
  caveat?: string;
};
```

The UI must render the envelope differently by relation type. **Source records** use the Atlas verified teal; **published mappings** use ochre; **computed comparisons** use coral with a method link; **user-owned evidence** uses graphite; **external links** retain their provider mark and are never absorbed into an Atlas claim.

## Core journeys

### 1. “I do not know what to explore.”

The user should be offered three non-exclusive entry points: **name a possibility**, **browse a world/industry**, or **reflect on a curiosity/constraint**. The third route asks only reversible prompts such as “What type of problem do you want to understand?” and “What kind of experience can you realistically try this month?” It then opens source-backed occupations as hypotheses, not matches.

### 2. “I am considering this role.”

The user opens a Roadmap and sees role reality, preparation context, task and skill evidence, related-occupation differences, labor context when a dated source is available, and a clear “open a Career Lab experiment” action. They can inspect the source for every item.

### 3. “I need to find out whether this work is for me.”

The user creates a time-bounded experiment anchored to one official task, skill, or work activity. The experiment records a hypothesis, constraints, optional support/feedback, a practice plan, a reflection, and an artifact link. It ends with a deliberate choice: deepen, compare, pause, or discard—not an auto-generated next course.

### 4. “I am changing direction.”

The user compares a current and prospective occupation using explicit O*NET evidence overlap: common recorded skills/activities/tasks, distinctive evidence on each side, preparation differences, and a dated context lens where sources exist. No route is called “easy,” “best,” or “likely” without a compatible published transition dataset.

### 5. “I need an opportunity in a place.”

The user selects a country/region lens. Atlas shows only sources it can identify—national service, aggregate labor context, forecast, apprenticeship or permissioned opportunity connector—and explains coverage. It does not fill empty places with generic advice.

## Highest-leverage implementation sequence

| Sequence | Capability | Why first | Static implementation | Future requirement |
|---|---|---|---|---|
| **A** | **Career Lab: hypothesis → experiment → reflection → evidence** | Converts passive Roadmaps into action while requiring no unverified external data | Browser-local, task-anchored records and optional artifact URLs | Optional account sync/storage later |
| **B** | O*NET evidence comparison of two roles | Makes related occupations explainable and supports transition exploration | Deterministic comparison from shipped official records | Publish method and allow future crosswalk variants |
| **C** | Interests/work-style reflection as a lens | Solves the blank-page problem without a “perfect career” score | Voluntary local responses with visible source construct | Accessibility testing and multilingual wording |
| **D** | Dated national outlook lens | Adds real market intelligence without live-job noise | BLS EP first, then Cedefop/ILOSTAT country modules | Source-specific importer and evidence envelope |
| **E** | Training and credential evidence explorer | Adds transparent preparation options and outcomes | External source handoffs and static metadata only | Backend key/cache plus provider agreements |
| **F** | Permissioned opportunity connectors | Supports action without scraping | Outbound links and availability state | Full-stack backend, secrets, rate-limit cache |
| **G** | ESCO multilingual EU module | Establishes the global model with a structured, versioned source | Versioned offline data release | Translation, mapping review, country lenses |

## Build selected now: Career Lab

The next implementation must add a dedicated **Career Lab** panel inside Roadmaps, not a generic to-do list. It should make the existing research operational with user-owned, browser-local records:

| Field | Purpose | Integrity rule |
|---|---|---|
| Hypothesis | A short statement of what the user is testing about a role | User-authored; never interpreted as fact |
| Anchor | One O*NET task, skill, or activity | Stored with source record ID and text snapshot |
| Experiment type | Observe, simulate, practise, contribute, talk to a practitioner | Atlas labels access limits; no invented employer contact |
| Time box | 7, 30, or 90 days | A planning device, not a performance deadline |
| Support | Optional person, service, or feedback route | User-owned free text or source-labelled external service |
| Evidence | Optional URL or note describing an artifact | Self-reported; never styled as a credential |
| Reflection | What was learned, what changed, what remains unknown | User-authored |
| Decision | Deepen, compare, pause, or discard | No automated recommendation |

## Source and operating policy

The free static release continues to ship only compact, redistributable, official source extracts. Sources that need an API key, have rate limits, or require a publisher agreement stay behind a future full-stack backend with cache, attribution, retrieval date, and a source-specific retention policy. The system must never scrape commercial job boards, simulate job openings, create fake reviews, or represent user notes as validated credentials.

## References

This architecture synthesizes the comparative research in [deep-career-systems-research.md](deep-career-systems-research.md), including My Next Move, LinkedIn Career Explorer, JFF, Pathful, National Careers Service, ESCO, ILOSTAT, EURES, USAJOBS, Open Badges, Credential Engine, Cedefop, and College Scorecard. Each external claim retains a numbered reference in that research record.
