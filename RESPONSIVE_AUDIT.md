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
