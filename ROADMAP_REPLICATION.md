# Roadmap.sh reproduction inside unemployed-nigg

## Objective

This project integrates the publicly observable roadmap.sh experience into the existing **Industry Niche Atlas** application hosted as the `unemployed-nigg` Cloudflare Worker. The implementation uses the user-provided public repository [`nilbuild/developer-roadmap`](https://github.com/nilbuild/developer-roadmap) as the canonical content source and the public roadmap graph endpoint as the canonical layout source.

## What the public repository reveals

The repository is **content-first**, not the roadmap.sh frontend. It contains roadmap directories under `roadmaps/<roadmap-slug>/content/` and topic files named `<topic-slug>@<node-id>.md`. The node ID in each filename is the join key between Markdown topic content and the graph node exposed by the public API. The repository includes synchronization scripts that parse Markdown, identify resource markers such as `@official@`, `@opensource@`, `@article@`, `@video@`, `@course@`, `@podcast@`, and `@book@`, and maintain consistency between repository files and the public roadmap database.

The public API endpoint used by the repository is `GET https://roadmap.sh/api/v1-official-roadmap/{slug}`. The imported documents contain roadmap metadata, dimensions, React Flow-style nodes, edges, node labels, node types, positions, dimensions, optional styles, legend metadata, and draft graph data. The current import covers **92 roadmaps**, **14,284 graph nodes**, **4,410 graph edges**, and **10,499 Markdown topic records** with **24,930 resource links**.

## Current unemployed-nigg implementation

The public roadmap catalog is served from `client/src/data/roadmapCatalog.ts`. Full public topic content is lazy-loaded from `client/public/data/roadmap-content.json`, and graph documents are lazy-loaded from `client/public/data/roadmap-graphs.json`. The routes are:

| Route | Function |
|---|---|
| `/roadmaps` | Searchable role-based and skill-based roadmap catalog with favorites. |
| `/roadmaps/:slug` | Roadmap detail view with map/list toggle, graph nodes, edges, search, filters, progress, topic drawer, notes, and resource links. |
| `/roadmaps/plan` | Goal, level, time, and depth form that creates an explainable starting sequence from public topics. |
| `/` | Existing Industry Niche Atlas application; its header now links to `/roadmaps`. |

The graph viewer uses the real public node positions and edges rather than an invented sample arrangement. It exposes pan, zoom, reset, fit, node search, recommendation filters, progress-aware node styling, and click-to-open topic content. The topic drawer renders the corresponding public Markdown and resource list through the existing `streamdown` dependency.

## Atlas-owned state layer

The browser remains usable offline through local storage. When the deployed Worker has a D1 binding, the client also syncs favorites, topic completion, topic notes, and generated plan records through `POST /api/state` and hydrates them through `GET /api/state`. The Worker is implemented in `worker.ts`; the schema is in `migrations/0001_atlas_state.sql`.

The state API deliberately uses a locally generated profile identifier rather than claiming to reproduce roadmap.sh accounts or authentication. A future Atlas account layer can replace that identifier with an authenticated user ID and add explicit session, privacy, export, and deletion controls.

## Deployment configuration

`wrangler.jsonc` configures `unemployed-nigg` as a Cloudflare Worker with static assets from `dist/public`, SPA fallback handling, and a D1 binding named `ATLAS_DB`. The existing GitHub Actions workflow still builds with `pnpm build` and deploys through Wrangler. The active Cloudflare project is `unemployed-nigg`, not `estonia-ecosystem-atlas`.

## Boundaries

This implementation reproduces the public content and observable graph surface as closely as the available public sources allow. The provided repository does **not** contain roadmap.sh’s private frontend application or server implementation. Private synchronization secrets, authenticated account state, premium content, internal database access, and non-public services are not extractable from the public materials and are not bypassed. Their user-facing equivalents are implemented as Atlas-owned code and data where practical.

The source content remains attributed to the public repository and its upstream roadmap pages. Atlas owns the route shell, state layer, graph renderer, plan interaction, deployment configuration, and future personalization architecture.
