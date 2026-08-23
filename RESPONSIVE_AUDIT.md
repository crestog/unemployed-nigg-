# Responsive audit

## Phone viewport: 390 × 844

### World tab

The hydrated map now renders correctly at phone width. The header wraps into a compact brand plus a four-item pill navigation, and the map remains visible without horizontal overflow. The map itself is intentionally centered with large breathing room around the world geometry. The bottom search/control region is partially below the first viewport, so it needs a mobile-safe bottom inset and tighter control presentation. The desktop field guide is hidden at this width, which is correct; country labels are appropriately suppressed at the initial zoom.

### Graph tab

The graph renders and remains pannable, but the fixed compare-roles control overlaps the Directory navigation item in the header. The Graph canvas shows large empty space and some content nodes are clipped at the right edge, which is expected for an explorable canvas but needs a mobile affordance and a better compact toolbar. The graph search field is usable at the bottom, but the category chips and View all button are close to the viewport edge. The top breadcrumb and controls are not grouped into a dedicated compact mobile toolbar, and the compare control should move into a non-overlapping bottom/overflow menu on phones.

The first screenshot was captured too early and only showed loading; a hydrated capture with a 5-second virtual-time budget confirmed that the World data and Graph data load successfully.

### Roadmaps catalog

The mobile catalog is visually coherent and already uses a compact hamburger navigation. The compare-roles floating button still overlaps the header area at the top-right and should be moved into the page shell so it never covers navigation. Hero copy, Create a learning plan, Browse the library, and the three stat cards fit at 390px without clipping. The stats are tall but acceptable; lower sections require continued scroll testing.

### AI generator

The one-submit AI generator fits cleanly at 390px. Topic input, three format cards, optional customization checkbox, and Generate button are all tappable. The compare-roles floating control again occupies the top-right header area and is visually unrelated to this page; it should be part of a global mobile utility menu or hidden on routes where it is not needed. The format cards are equal width and the Generate button has an appropriate touch target.

### AI result state

At 390px the invalid roadmap state is legible and centered, but the compare-roles floating utility remains detached at the top-right. The error copy and recovery button fit well.

### Desktop baseline

The first desktop baseline was captured before hydration and showed the source-release loading state, so it is not a valid layout comparison. The hydrated phone captures are the reliable audit baseline. Future checks must use an explicit hydration wait or DOM readiness marker before taking screenshots.

## Post-refactor phone check

The World tab continues to render cleanly at 390px with its map, breadcrumb, and search/control surface inside the viewport. The Graph tab now has improved top spacing and its map toolbar is compact. The Compare roles utility no longer overlaps the header navigation, but at 390px it still occupies the bottom-right area adjacent to the graph zoom controls; it should be moved farther from the graph controls or hidden on graph-canvas routes. The graph search and category controls fit, although the canvas content remains intentionally explorable rather than fully contained in one screen.

The post-refactor Roadmaps catalog now has a single-line mobile hero title, tighter stat cards, and no header overlap. Compare roles appears next to the search section rather than over the header; it is still too visually prominent on this page and should be placed as a global utility with route-aware spacing.

The AI generator remains clean at 390px: topic input, format cards, optional customization, Generate, and explanation all fit. Compare roles now sits at the lower-right edge and no longer blocks the form, but the page should reserve safe-area space around that utility.

## Live DOM touch test setup

The deployed local page has two sections; the World map surface is the section whose class starts with `relative h-[calc(100dvh-112px)]`, and it contains the world SVG group. The initial simulation queried the first generic section and correctly reported that the map surface was missing; the DOM probe then located the correct surface. The live map is hydrated and its URL camera state is persisted in the hash.

## Touch and rendering diagnostics

A synthetic one-finger gesture reached the live World page but did not change the SVG transform. The likely blocker is unguarded `setPointerCapture()` when dispatching or when a browser does not expose an active pointer; pointer capture must be best-effort rather than allowed to abort the handler.

The browser console also reports repeated duplicate React keys such as `000`, `036`, and `node-000` from country features. The world-atlas geometry contains multiple feature records sharing topology IDs, so country path keys must include a stable feature index and the source-backed node list must be deduplicated by topology ID. Removing these warnings should reduce unnecessary reconciliation and improve mobile performance.

The World pointer handlers now wrap `setPointerCapture()` in a try/catch for platform-owned and synthetic touch events. Country path keys now include their feature index, and the node list deduplicates topology IDs, addressing the console warnings. InfiniteAtlas receives the same pointer-capture guard.

## Live gesture verification

A live synthetic one-finger touch drag now changes the World SVG transform from `translate(640 380) scale(1)` to `translate(715 420) scale(1)`, confirming touch panning after the pointer-capture guard.

A live two-finger pinch changes the SVG scale from `1` to `2` and updates the translate values around the pinch midpoint, confirming pinch zoom works independently of wheel events.

After clearing and reloading, the World page hydrates with the persisted pinch camera (`wxz=2.000`) and displays the focused zoomed map correctly. The URL camera persistence works across reloads. The screenshot’s red numbered boxes are browser annotation markers, not application UI.

A clean reload after clearing the console shows only the React DevTools informational message; the previous duplicate-key warning flood does not recur. The earlier warnings were stale entries from before the key fix.

## Production phone verification

The Worker returned HTTP 200 and production phone screenshots loaded after the responsive release. The production World tab now shows the map, compact search field, touch instructions, field count, and vertical zoom/reset controls within the 390 × 844 viewport. The production Graph tab shows the compact breadcrumb, map toolbar, search field, layer chips, and zoom controls without header collision. Compare roles is visible below the Graph toolbar rather than covering navigation.

Chromium emitted only its unrelated Google registration warnings during headless capture; no application error or exception was reported.

The production Roadmaps catalog fits the phone viewport with a compact hero, stacked calls to action, three stat cards, and a clean transition into the catalog search. The production AI generator fits with no global compare utility covering the form; its topic input, format cards, optional checkbox, and Generate button remain readable and tappable.

## Smooth-map benchmark notes

The public Map of Reddit renderer uses a GPU-backed scene with separate point, line, polygon, and text collections. It registers pointer events on the scene rather than rerendering the application on every pointer move. Its selection lookup uses an RBush spatial index plus nearest-neighbor search, not a full scan of every node. Camera transforms update a scene view and only persist URL state through a debounced transform callback. Highlighted links recalculate line width from camera distance, and the renderer keeps labels in dedicated text collections rather than recreating DOM/SVG text during movement.

Atlas currently has a good direct SVG camera transform for World and a Canvas renderer for Graph, but World still renders every country path and every node as React SVG children. Graph redraws a large canvas when React camera state changes. The optimization target is to separate the interaction camera from React application state, commit camera state on animation frames or gesture end, cap device pixel ratio, and apply deterministic level-of-detail budgets for entities, labels, glows, and paths.

## Atlas profile baseline

At the local desktop browser viewport, the World SVG currently contains 243 country paths, 237 groups, 472 circles, and no text elements at the initial camera. The surface measured 1265 × 1032 CSS pixels because the home shell plus the map surface still creates a page-height overflow on the desktop browser. World camera motion itself is direct-group based, but all country paths and glow circles remain mounted at all zoom levels. The next optimization will keep the geographic base path stable, reduce mounted field nodes by a level-of-detail budget, and avoid filter-heavy glows for off-screen or low-priority entities.

## Optimized render footprint

After the level-of-detail pass, the World SVG at default zoom contains 243 country paths, 141 groups, and 280 circles, with no labels mounted. This is down from 472 circles and 237 groups before the pass, while preserving all country geometry and the source-backed field count. Labels are now mounted only by a zoom-aware budget, and off-priority glow filters are disabled at overview zoom.

## Extreme zoom verification

The updated World map reaches its maximum 18× zoom clamp after repeated wheel events, with the SVG transform stable at `scale(18)`. A subsequent pinch at the maximum correctly remains clamped rather than exceeding the configured limit. The earlier immediate wheel-transform read occurred before the animation frame; the settled transform confirmed the wheel loop executed.

At the refreshed local max zoom, the World map reaches `scale(18)` and exposes 156 labels rather than mounting every country label. Full zoom detail restores all 236 source-backed field nodes (472 circles including their paired glow/marker circles), while overview zoom stays on the reduced 140-node budget. This creates a stable semantic hierarchy: sparse overview, bounded mid-zoom labels, and full detail only when the user intentionally zooms in.

The local app switches successfully from World to Graph via the tab control. The Graph route exposes a single interactive canvas with compact layer/search/zoom controls and a route-persisted camera hash, making it suitable for the same imperative motion test.

The first synthetic Graph gesture did not change the canvas because it targeted the canvas parent rather than the actual `#atlas-canvas` section that owns the pointer handlers. The DOM ancestry confirms `#atlas-canvas` is the correct interaction surface; the canvas itself is an absolutely positioned child.

The corrected Graph touch test waits one animation frame and confirms the canvas transform changes from `translate(0px, 0px) scale(1)` to `translate(80px, 40px) scale(1)`. The immediate pre-frame read was unchanged by design; motion is now deferred to the next frame to avoid synchronous redraw work.

## Production smoothing release

The optimized motion and visual-scaling code has been pushed as commit `829fac4`, and GitHub Actions run `32607937923` completed successfully with the static build, D1 migration, and Cloudflare Worker deploy steps all green. The production Worker now serves the updated World map release.

## Final production touch test

On the newly deployed Worker, a one-finger touch pan changes the World SVG transform from `translate(640 380) scale(1)` to `translate(690 415) scale(1)` after the animation-frame settle. This confirms the imperative smooth-motion path is present in production, not only in the local development server.


## 2026-08-23 — Reference-loop verification and compositor-first motion

The public Map of Reddit implementation was verified from its actual source, not inferred from screenshots. `createStreamingSVGRenderer.js` creates a persistent `w-gl` scene with separate GPU collections for boundaries, points, links, and text. `createPointerEventsHandler.js` uses an RBush spatial index and nearest-neighbor picking, while `w-gl`'s `createMapControls.ts` applies pan/pinch camera math and calls `scene.renderFrame()`. `createScene.ts` coalesces GPU paints with `requestAnimationFrame`; the key property is that the camera and scene own motion, not a React component tree.

Atlas remains Atlas-owned and does not copy Reddit content or branding. The World surface is still a React/SVG semantic scene and the Graph surface is still a Canvas semantic scene, but both now have a compositor-first motion boundary. World writes a synchronous transform to the already-painted SVG during gestures and reconciles camera-dependent semantic SVG state only at commit. Graph writes the canvas transform synchronously during gestures; its Canvas paint effect is guarded so a React rerender cannot erase that live transform, and semantic redraw waits for pointer-up or the wheel-idle boundary. Both surfaces mark their motion layer with `will-change: transform`.

Local browser measurements with synthetic pointer events after hydration showed the live write completing in approximately 1.4 ms on World and 0.7 ms on Graph. World’s transform remained present after 20 ms (`translate(317.6px, 180.12px) scale(0.48)` in the tested gesture); Graph’s remained present after 20 ms (`translate(80px, 40px) scale(1)`). These are input-to-style-write checks, not claims of end-to-end hardware frame latency. The next architectural step for true Map-of-Reddit-scale growth is a persistent Canvas/WebGL scene with spatial indexing and source-backed geographic LOD, rather than adding more dynamic React SVG nodes.

## 2026-08-23 — Source-backed geographic hierarchy

The active World explorer now keeps the Map-of-Reddit-style compositor-first camera while adding a real geographic hierarchy. The global level remains country-level GLEIF legal-address aggregates. India is the first explicit subnational coverage because the project contains a real source release: 36 ADM1 state/union-territory geometries, 735 ADM2 district geometries, and 6,562 GeoNames populated-place references. The renderer gates these layers by camera scale and viewport/budget-culls district and locality work, with collision-limited labels and bounded marker budgets.

The India asset required a source-format normalization at render time. Its geoBoundaries polygon rings are oriented opposite to the winding expected by d3-geo; unnormalized features produced a world-complement path and `geoBounds()` of `[[-180,-90],[180,90]]`. Reversing the rings for Polygon and MultiPolygon features produced the expected geographic bounds and actual India outlines without changing the source asset. This is a rendering normalization, not synthetic data.

Local browser validation confirmed the source-backed sequence: country focus reaches India; state selection opens a Geographic entity inspector and centers the map; district zoom rendered 261 bounded district paths in the current viewport and district selection opened the district inspector with a real parent state (Madhya Pradesh in the test); locality zoom rendered 420 bounded GeoNames points and locality selection opened a city/locality inspector with a population reference and GeoNames source link. The locality inspector explicitly states that a place reference is not an organization-location or activity claim.

The hierarchy remains intentionally source-bounded: countries without a verified subnational release do not receive invented state, district, or city layers. World still uses React/SVG for semantic rendering, while the live camera transform is applied synchronously to the already-painted SVG; a future truly WebGL-equivalent migration remains the scalable path for very large entity volumes.

## 2026-08-23 — Persistent semantic canvas and release-lineage hardening

The active World explorer now mounts a persistent `WorldSemanticCanvas` for India ADM1, ADM2, and locality boundaries/labels/points. The canvas is connected to the parent camera ref, receives the same live compositor transform during drag and pinch, and leaves pointer handling on the map surface so the existing geographic picker remains available. This is a Canvas2D migration and DOM reduction step, not WebGL or full Map-of-Reddit `w-gl` parity.

At a tested local India state scene on a 1280 × 760 viewport, the semantic SVG loops were removed and the DOM contained approximately 255 base country paths, 6 circles, 1 group, and 0 SVG text nodes; the semantic canvas measured 1280 × 760 CSS pixels and had `will-change: transform`. A direct canvas click opened the Lakshadweep geographic inspector. The narrow result demonstrates event routing and DOM reduction, but it is not a real-phone frame-rate measurement.

India tile requests now resolve from a stable `/data/india-tiles/manifest.json` pointer to a release-versioned base path such as `/data/india-tiles/world-india-geography-20260820/`. The versioned files can receive immutable cache headers and a production service worker caches only those versioned tile files; the manifest remains short-lived and mutable. The source release, source URLs, licenses, precision notice, and tile catalog remain in the manifest, and no new geography is fabricated.

State persistence now queues failed D1 mutations in a bounded local-first FIFO outbox, retries on the browser `online` event and before the next snapshot read, and sends a stable client action ID. Favorite/progress/note writes remain idempotent row mutations, and plan inserts use the namespaced stable action ID so retries do not create duplicate plans. The browser-generated profile remains an identifier rather than authenticated identity; cross-device continuity is not claimed. No API key, new Cloudflare resource, or phone-side setup is required for this release.

The formatted production build and TypeScript check passed after these changes. The build still reports a large World route chunk because d3/world-atlas and related geographic dependencies remain in that route; lazy loading protects initial startup, while the later GPU/vector-tile phase remains necessary for gigabyte-scale semantic datasets. The current release is therefore evidence of reduced startup and DOM work, not proof of end-to-end phone smoothness.

## 2026-08-23 — Production outbox reconnect check

On the production Roadmaps page, a Frontend favorite was toggled while the browser reported offline. The new `atlas-state-outbox-v1` local queue retained one UUID-keyed mutation. After restoring connectivity and dispatching the browser online event, the queue cleared within the test window, confirming that a failed state write is not silently lost. This validates local retry only; the browser-generated profile is still not an authenticated cross-device identity.
