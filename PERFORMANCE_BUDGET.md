# Atlas performance budget

## Scope

These budgets apply to the World and Graph explorers on a representative low/mid-range mobile device and to desktop smoke tests. The browser sandbox desktop probe is a diagnostic only, not the mobile acceptance gate.

## Interaction budgets

| Metric | Target | Release gate |
|---|---:|---|
| Camera input handler work during active drag/pinch | ≤ 2 ms per event | No event may exceed 8 ms in the sustained gesture sample |
| Input-to-next-paint p95 during active motion | ≤ 50 ms | Must not exceed 100 ms |
| Sustained frame interval p95 | ≤ 20 ms | Must not exceed 33 ms |
| Long tasks caused by map interaction | 0 tasks > 50 ms | Any repeated >50 ms task requires investigation |
| Main-thread blocking during tile/asset load | ≤ 20 ms chunks | Work must be chunked or moved to a Worker |
| Active World DOM map nodes | ≤ 200 semantic DOM nodes | Map geometry/points must use GPU/canvas layers beyond this budget |
| World interaction payload on first view | ≤ 250 KB compressed | Do not send subnational or inspector data until needed |
| India hierarchy entry payload | ≤ 500 KB compressed per viewport/zoom request | Never fetch the 12 MB monolith in the browser |
| Inspector payload | ≤ 25 KB compressed | Long source descriptions remain cold data |
| Active client spatial entities | ≤ 20,000 visible candidates | Use tile-local index and GPU buffers above this |
| Camera commit work | ≤ 8 ms p95 | React/semantic updates must be deferred and bounded |

## Current baseline

The latest production browser probe was run on a 1280 × 1100 desktop viewport at DPR 1. It measured a synthetic pointer-move handler at approximately 0.03 ms average and 0.20 ms maximum for both World and Graph, with a direct transform write visible immediately. It observed no long task during the short sample. The World DOM contained approximately 247 paths, 286 circles, 24 text nodes, and 141 groups at the tested state. The Graph canvas was approximately 1265 × 1032 CSS/device pixels.

The desktop baseline does not meet the mobile gate by itself. The first required mobile checkpoint is a cold-load and 10-second drag/pinch trace on one representative Android device and one iPhone, recording Interaction to Next Paint (INP), long tasks, frame intervals, JS heap, asset bytes, and JSON parse time.

## Release policy

A release may improve one metric while temporarily regressing another only when the regression is recorded with a reason, a rollback path, and a next checkpoint. Source-backed geographic correctness and provenance are non-negotiable: no performance optimization may replace missing source data with synthetic entities or hide data-quality limitations.
