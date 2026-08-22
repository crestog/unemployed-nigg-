# Atlas roadmap architecture

## Product direction

Atlas should begin as a close private prototype of the public roadmap.sh learning experience, then become an Atlas-owned learning system. The prototype will reproduce the useful information architecture and interaction patterns: a roadmap catalog, role-based and skill-based grouping, a dark navigation shell, dropdown menus, roadmap cards, favorites affordances, a roadmap detail view, topic-node exploration, progress indicators, search, filters, and expandable learning notes.

The implementation will not depend on roadmap.sh runtime services, private APIs, credentials, user accounts, or database contents. Atlas will own its data model, branding, route structure, and future personalization layer.

## Implementation options

| Option | What it provides | Strengths | Limits | Recommended use |
|---|---|---|---|---|
| Static snapshot | Bundled roadmap catalog and selected topic content in the Vite app | Fastest prototype, simple Cloudflare Pages deployment, no backend cost | No cross-device progress, no secure user data, rebuild required for content updates | Phase 1 prototype |
| Hybrid static + edge data | Public roadmap catalog remains static; user state and generated plans use Cloudflare D1/KV/R2 or Pages Functions | Keeps public pages fast while enabling accounts, progress, saved plans, and AI requests | Requires schema, migrations, auth, and edge API design | Phase 2 production foundation |
| Full Atlas learning platform | Database-backed content, profiles, progress, assessments, AI planning, recommendations, and community features | Best fit for the long-term Atlas goal | More engineering, moderation, privacy, and operating complexity | Phase 3 expansion |

## Phase 1 prototype

The current Atlas repository is already a React/Vite/Tailwind static application with a Cloudflare Pages workflow. The first implementation will add roadmap routes without removing the existing Estonia ecosystem explorer. The existing explorer remains available at `/` and the roadmap experience is added under `/roadmaps` and `/roadmaps/:slug`.

The catalog is generated from the publicly available roadmap inventory and the cloned public content repository. The catalog stores stable slugs, titles, category, short descriptions, and a small set of representative node topics. The detail page is intentionally data-driven so the catalog can later be replaced by a database or content API without rewriting the UI.

## Phase 2 data model

A future database-backed model should separate authored learning content from user state.

| Entity | Purpose |
|---|---|
| `roadmaps` | Stable roadmap identity, title, category, description, version, and publication status. |
| `roadmap_nodes` | Topic nodes, order, prerequisites, resource links, estimated effort, and learning outcomes. |
| `roadmap_edges` | Explicit prerequisite or dependency relationships for graph rendering and plan generation. |
| `resources` | Books, courses, documentation, projects, exercises, and external references. |
| `users` | Authenticated Atlas identities and preferences. |
| `user_roadmap_progress` | Node status, completion time, confidence, notes, and review schedule. |
| `saved_roadmaps` | Favorites and personal roadmap collections. |
| `learning_plans` | AI-assisted or manually curated plans with goals, pace, and checkpoints. |
| `assessments` | Diagnostic quizzes and skill checks used to personalize recommendations. |

## Personalization path

Atlas can turn a static roadmap into a universal learning engine by treating every roadmap as a graph plus evidence. A user chooses a goal, reports current skills and available time, completes a short diagnostic, and receives a plan composed of prerequisite nodes, resources, projects, and review intervals. Progress updates should be stored as append-only events or normalized status records so the system can later calculate streaks, confidence, spaced review, and skill transfer across roadmaps.

The AI layer should not invent the roadmap graph. It should operate over Atlas-owned nodes, resources, and constraints, using structured output to select and order existing learning units. This keeps recommendations inspectable and makes it possible to show why a topic was selected.

## Hosting strategy

Cloudflare Pages is the best immediate host because the Atlas repository already documents a working static deployment configuration: production branch `main`, build command `pnpm build`, output directory `dist/public`, and Node.js 22. The prototype can remain entirely static. When personalization is added, the least disruptive upgrade is Pages Functions or Workers with D1 for relational state, KV for lightweight caches, R2 for uploaded artifacts, and an AI gateway or server-side LLM integration for plan generation. A separate full-stack deployment can be considered if Atlas eventually needs long-running jobs, heavy background processing, or complex server-side orchestration.

## Deliberate non-goals for the first build

The first build will not attempt to recreate private authentication behavior, premium access, AI tutor backend services, creator tools, personalized dashboards, or hidden application APIs. It will provide faithful public navigation and learning interactions with Atlas-owned data structures, leaving clean seams for those capabilities later.
