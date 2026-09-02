# Atlas performance budget

## Scope

These budgets apply to the World and Graph explorers on a representative
low/mid-range mobile device, and to desktop smoke tests. The browser sandbox
desktop probe is a diagnostic only, not the mobile acceptance gate.

Every number in the payload table below was measured from `dist/public` after
`pnpm build`, gzipped at level 9, by walking the built static-import graph from
`index.html` — so a route's figure is what the browser must have before that
route can paint, not a chunk name guessed at from the source tree. Re-measure
after any change to lazy boundaries; the numbers move when a `lazy()` becomes a
static import.

## Interaction budgets

| Metric                                             |                      Target | Release gate                                                                                                          |
| -------------------------------------------------- | --------------------------: | --------------------------------------------------------------------------------------------------------------------- |
| Camera input handler work during active drag/pinch |            ≤ 2 ms per event | No event may exceed 8 ms in the sustained gesture sample                                                              |
| Input-to-next-paint p95 during active motion       |                     ≤ 50 ms | Must not exceed 100 ms                                                                                                |
| Sustained frame interval p95                       |                     ≤ 20 ms | Must not exceed 33 ms                                                                                                 |
| Long tasks caused by map interaction               |             0 tasks > 50 ms | Any repeated >50 ms task requires investigation                                                                       |
| Main-thread blocking during tile/asset load        |              ≤ 20 ms chunks | Work must be chunked or moved to a Worker                                                                             |
| Map geometry in the DOM                            |                     0 nodes | Country, boundary and locality geometry renders in the MapLibre canvas. Any geometry reaching the DOM is a regression |
| Interactive DOM nodes outside the canvas           |                 ≤ 700 nodes | Panels, lists and controls. Virtualize a list rather than raise this                                                  |
| Active client spatial entities                     | ≤ 20,000 visible candidates | Use tile-local index and GPU buffers above this                                                                       |
| Camera commit work                                 |                  ≤ 8 ms p95 | React/semantic updates must be deferred and bounded                                                                   |

The two DOM lines replace a single "≤ 200 semantic DOM nodes" budget that the
document's own baseline recorded at roughly 698 — a budget contradicted by its
own measurement on the page that declared it. The contradiction came from
counting two different things as one: SVG map geometry, which is now gone
entirely, and interface chrome, which is what the 700 covers.

## Payload budgets

Code and data are budgeted separately, because they behave differently: code is
fingerprinted and cached until the next deploy, while a data release is cached
until its own `?v=` stamp changes. Lumping them together is what let a 507 KB
map bundle hide inside a "250 KB world payload" line.

### Code, per route

| Route                                              |   Target |   Measured | Notes                                                 |
| -------------------------------------------------- | -------: | ---------: | ----------------------------------------------------- |
| Shared shell (`index.html` + entry JS + entry CSS) | ≤ 150 KB | **126 KB** | Paid once, on any route                               |
| `/` landing                                        | ≤ 200 KB | **135 KB** | Shell + 9 KB                                          |
| `/roadmaps`                                        | ≤ 250 KB | **225 KB** | The roadmap catalogue is 91 KB of it                  |
| `/roadmaps/:slug`                                  | ≤ 250 KB | **229 KB** | Was ~500 KB; the markdown and tutor stack is deferred |
| `/roadmaps/plan`                                   | ≤ 250 KB | **225 KB** |                                                       |
| World map chunk                                    | ≤ 550 KB | **503 KB** | MapLibre GL, plus a 756 KB bundled topology           |

Deferred behind an interaction, and therefore outside the route budgets: the
markdown/diagram/highlighting stack (271 KB, on opening a topic or the tutor)
and the role-comparison overlay.

The world map chunk is the one number here that is large because it has to be,
not because something is misplaced: a vector-tile renderer is not divisible.
The remaining fat in it is `world-atlas/countries-50m.json`, 756 KB imported as
a JavaScript module, which is parsed as JS rather than JSON and is re-downloaded
on every deploy because it shares a fingerprint with the code. Serving it from
`/data` instead would cut the chunk and let it outlive a deploy; it would not
improve a cold first view, since the overview needs it to draw.

### Data, per fetch

| Payload                             |                     Target |                      Measured (gzip) | Notes                                                                                              |
| ----------------------------------- | -------------------------: | -----------------------------------: | -------------------------------------------------------------------------------------------------- |
| World tile manifest                 |                    ≤ 10 KB |                           **3.5 KB** | 12.9 KB raw, from 8.27 MB — the exhaustive tile list nothing read is gone                          |
| India tile manifest                 |                    ≤ 10 KB |                           **1.7 KB** |                                                                                                    |
| Landing catalogue on tab activation |                   ≤ 250 KB |                           **228 KB** | Taxonomies 96 KB + occupation index 132 KB                                                         |
| Occupation detail, behind the index |                     ≤ 1 MB |                           **872 KB** | Non-blocking; the index carries the record shape so nothing waits on it                            |
| One roadmap (topics + graph)        |                   ≤ 150 KB | **46 KB** median, **119 KB** largest | `cyber-security` is the largest                                                                    |
| Venture overlay                     |                    ≤ 25 KB |                             **6 KB** |                                                                                                    |
| One vector tile                     |                   ≤ 300 KB |  **6 KB** median, **263 KB** largest | 234 India tiles; world tiles are release-scoped and `immutable`                                    |
| India hierarchy entry payload       | ≤ 500 KB per viewport/zoom |                           tiles only | The 12 MB monolith has no client fetch at all now, which is the only durable way to hold this line |
| Inspector payload                   |                    ≤ 25 KB |          source rows in the manifest | Long source descriptions remain cold data                                                          |

## Caching

Payload size only matters once. These are the rules that keep it that way, and
each one was absent at some point and cost a full re-download when it was:

- Vector tiles are release-scoped and served `immutable`, and the Worker puts
  both the part index and the assembled tile in `caches.default`. Without the
  Cache API a Worker response is not edge-cached at all, whatever its headers
  say — an `immutable` tile was still a full origin round-trip on every request.
- Data releases under `/data/**` get cache headers from the Worker generally,
  not from a list of enumerated paths.
- The world manifest is fetched with the browser cache allowed to work. It used
  to carry `cache: "no-store"`, which defeated the Worker's own `max-age`; the
  `?v=` release stamp is what invalidates it.
- The service worker caches the app shell and the fingerprinted assets, so the
  app loads offline. Navigations are network-first, so a deploy is never masked
  by a stale shell.

## Current baseline

The last full desktop probe was run on a 1280 × 1100 viewport at DPR 1. It
measured a synthetic pointer-move handler at about 0.03 ms average and 0.20 ms
maximum, with a direct transform write visible immediately, and observed no long
task during the sample.

That probe's DOM figures — roughly 247 paths, 286 circles, 24 text nodes and 141
groups — described an SVG map layer that no longer exists. Country, boundary and
locality geometry now goes to MapLibre as GeoJSON sources and renders in the
canvas, so the geometry-in-DOM budget is 0 by construction rather than by
restraint.

The desktop baseline does not meet the mobile gate by itself. The first required
mobile checkpoint is a cold-load and 10-second drag/pinch trace on one
representative Android device and one iPhone, recording Interaction to Next
Paint (INP), long tasks, frame intervals, JS heap, asset bytes and JSON parse
time. That checkpoint is still outstanding.

## Release policy

A release may improve one metric while temporarily regressing another only when
the regression is recorded with a reason, a rollback path, and a next
checkpoint. Source-backed geographic correctness and provenance are
non-negotiable: no performance optimization may replace missing source data with
synthetic entities or hide data-quality limitations.
