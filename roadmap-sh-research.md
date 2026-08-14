# Hands-on Roadmap.sh Research

## Scope and boundary

This log records observed product mechanics, not content to reproduce. roadmap.sh’s public terms state that its content is not available for redistribution, so the Atlas will borrow interaction principles and use independently sourced learning actions rather than copy its roadmap copy, node text, resource lists, or layouts.

## Catalogue observations — 14 August 2026

The `/roadmaps` catalogue uses a two-column discovery layout: a persistent left rail with text search and category filters, and a categorized right-side list of role-based, skill-based, beginner, and best-practice roadmaps. Every roadmap card has a favourite affordance. The design makes the user choose a bounded path before seeing detailed content, rather than placing all learning routes on one map.

## Frontend roadmap observations — 14 August 2026

The `/frontend` page has a hierarchy of controls before the visual roadmap: return to catalogue, favourite, newsletter subscription, download, share, Roadmap/Projects/AI Tutor tabs, personalise, and a sign-up invitation for progress tracking. The visual roadmap is a readable directional dependency graph, not a zoomable world. Nodes are grouped into a progression with annotations for personal recommendations, alternatives, and non-strict ordering; related roadmaps and beginner/intermediate/advanced project ideas form explicit exits from the main graph.

The core interaction principle applicable to the Atlas is **bounded learning guidance after open-ended discovery**: a user may roam freely in the world map, then enter a focused, readable path for one selected occupation, skill, or task. The Atlas Roadmaps tab should keep current official-record provenance visible and present an ordered user-owned study sequence, not claim to reproduce roadmap.sh’s developer curriculum.

## Projects view observations — 14 August 2026

The `/frontend/projects` view preserves the same roadmap header and replaces the graph with a catalogue of practical milestone cards. Its filters separate beginner, intermediate, and advanced projects; each card presents a level, a focused topic label, a one-sentence brief, and a visible community uptake count. The useful pattern is an explicit **practice exit**: after a learning path, a person can choose an observable project-sized action. The Atlas should adapt this as source-labelled "practice prompts" based on a selected real task or skill, while clearly distinguishing a product-generated prompt from a verified external course or job requirement.

## AI Tutor observations — 14 August 2026

The roadmap-specific AI Tutor opens alongside the visual roadmap and explicitly frames its roles as explaining concepts, recording statuses (`done`, `learning`, `skipped`), recommending what to learn next, finding resources, and sharing progress. It can see the route context, so it makes progression advice contextual rather than generic. The separate AI Plan flow first asks the learner’s goal (get a job, grow in the current role, build projects/side hustles, strengthen fundamentals, or explore a new field) and shows a five-step questionnaire before generating a plan.

The Atlas can adopt two parts without needing an LLM: a small, visible **intent selector** and user-owned statuses for source-backed records. It should not promise AI-generated explanations or personalized assessment until a secure, auditable service is added. In the first Roadmaps tab, goals select the order and emphasis of existing real skills/tasks; recommendations remain rule-based and visibly explain their source.

## Guides and generic creation observations — 14 August 2026

The Guides catalogue is a searchable stream of short-form educational pages, each visibly classified as textual or question-oriented. It is a distinct format from the roadmap: browseable reading rather than a dependency graph. The Atlas can mirror the separation by treating evidence notes, source definitions, and external videos as supporting material attached to a step—not as a replacement for the step itself.

The generic AI Course entry asks for one topic, lets the user choose a `Course`, `Guide`, or `Roadmap` format, and offers an optional questionnaire for better output before generation. The durable product lesson is format choice: a selected occupation or task might need an ordered path, a concise explainer, or a practical plan. The first Atlas release will implement a deterministic selector between those modes and defer generative formats until a secure backend and an explicitly chosen model policy exist.

## Sharing observation — 14 August 2026

The role-roadmap header’s share control opens a compact local menu offering copy-link and precomposed links for major social platforms. The shared unit is a stable canonical roadmap URL and its summary text, not a private learning history. The Atlas equivalent should provide a copyable URL containing the selected real record and Roadmaps-tab context; personal completion statuses should remain local unless the user explicitly chooses a future account-backed sharing feature.

## Public source and DOM observations — 14 August 2026

The public `nilbuild/developer-roadmap` repository is a **content repository**, not the application source. Its contribution guide states that the deployed content lives in `roadmaps/<roadmap-slug>/content/<topic-slug>@<node-id>.md`; the stable node identifier in the filename joins a topic document to a rendered roadmap node. A representative topic file contains a concise explanation followed by typed external resources (`official`, `opensource`, `article`, `course`, `podcast`, `video`, or `book`). The contribution rules intentionally cap a topic at eight links and emphasize relevance rather than exhaustive lists.

Live DOM inspection confirms that the visual roadmap renders as an SVG inside `#resource-svg-wrap`, with a `data-node-id` on each node group. The observed node IDs include the same identifier embedded in the topic filename, confirming the content-to-canvas join. The renderer/application code itself is not present in the public content repository, so the Atlas will use this as a **data-model pattern** only: its own nodes will join locally authored, provenance-tagged resource metadata to official occupation and task records.

Sources: <https://github.com/nilbuild/developer-roadmap>; <https://github.com/nilbuild/developer-roadmap/blob/master/contributing.md>.

## Atlas implementation validation — 14 August 2026

The Atlas Roadmaps tab opens independently from the top-level shell, exposes an official-occupation search rail, presents an ordered O*NET profile → recorded skills → official task sequence, stores personal completion markers locally, and labels external YouTube and Filmot actions as searches rather than recommendations. A live Graph search for **Software Developers** produced the expected local `PATH` action; activating it opened the Roadmaps tab with the Software Developers O*NET record, source-preserved skills and tasks, and a visible `Opened from Graph` context strip. The return action restored the Graph tab.

Sources: <https://roadmap.sh/roadmaps/>; <https://roadmap.sh/frontend>.
