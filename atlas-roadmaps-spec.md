# Atlas Roadmaps Tab Contract

## Purpose

The **Roadmaps** tab is the Atlas’s focused-learning surface. The Graph answers **what exists and how it connects**; Roadmaps answers **what can I examine next for this real record**. It must work without Graph context and accept Graph context when a user requests a more detailed path.

## Interaction model

| Entry | Starting context | User outcome |
|---|---|---|
| Top-level Roadmaps tab | Occupation search and catalogue | User selects any official O*NET occupation and opens its path |
| Graph inspector | Selected industry, occupation, skill, or task | Tab opens with the selected record’s parent occupation where available; otherwise with a transparent exploration/search seed |
| Directory | Future enhancement | Selected occupation opens the same path state |
| Shared link | Record key and optional step state in URL | Opens the focused Roadmaps view without exposing private progress |

## Data boundary

The first implementation has **no copied roadmap.sh content** and no invented curriculum facts. Its steps are deterministic arrangements of current source records:

1. The selected O*NET occupation profile.
2. Its recorded essential skills, ordered by recorded importance where present.
3. Its attached O*NET task statements.
4. Transparent external learning actions: the O*NET source, a YouTube search, and a Filmot subtitle-search destination.

Each step shows a record type, its official source, and the reason it appears. User progress is local to the browser and never claims that a source agency certified completion.

## Visual and navigation rules

The tab uses a narrow left explorer rail and a vertically sequenced path with visible stages, mirroring the useful roadmap.sh principle of bounded progression after discovery. It does **not** reproduce roadmap.sh’s visual graph, editorial text, resource lists, or project catalogue. A small intent selector changes emphasis between understanding the role, building skill fluency, and studying actual tasks. This is rule-based—not AI-generated.

## Graph handoff

The Graph inspector offers **Open Atlas roadmap**. For an occupation, it transfers the official O*NET occupation ID. For a skill or task, it transfers the parent occupation ID and highlights the originating record. For an industry without an authoritative occupation crosswalk, it transfers the industry name as a research seed and states that a formal industry-to-occupation path is not inferred.

## Completion rules

Completion is a personal marker stored in local browser storage. It is not reported as mastery, certification, job readiness, employer validation, or official source status. A person may clear the local plan at any time.
