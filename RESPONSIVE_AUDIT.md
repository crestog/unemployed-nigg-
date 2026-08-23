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
