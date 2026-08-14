# Map of Reddit interaction findings

## Live application access

The live application at `https://anvaka.github.io/map-of-reddit/` redirected to a URL containing explicit camera-state query parameters (`x`, `y`, `z`, and `v`), which is itself a useful interaction finding: the map encodes navigable viewport state in the URL. The sandbox browser did not retain the rendered canvas after navigation, so further visual testing must be corroborated against the public source and project documentation rather than inferred from an empty browser frame.

## Source-verified interaction mechanics

The public project explains that each dot is a subreddit and spatial proximity is a graph-layout result based on audience overlap, not a categorical proof. The data is laid out into an SVG and rendered through a custom WebGL pipeline with streaming SVG parsing. Crucially, node circles and their text labels are separate source records: node radius comes from the SVG circle and each label retains an authored `font-size`, allowing size and label importance to be part of the spatial language rather than a generic fixed-size overlay.

The renderer keeps a spatial index for node hit-testing, preserving reliable clicks even in dense fields. Hover finds the nearest hit node and presents a tooltip. Clicking a node clears the prior transient highlight, opens that record in the sidebar, then paints the selected node with a primary highlight color, its linked neighbors with a secondary highlight, and first- and second-degree relationship lines with distinct emphasis. The focused record stays visibly anchored in the world while detail is available beside it.

Camera motion is stateful. The renderer saves `x`, `y`, and `z` to the query string after a short debounce and restores the camera from the URL when the graph version matches. A search focuses the found node by setting a camera view box centered on that node and then applying the same highlight logic as a direct click. Related-view mode deliberately redraws a first/second-degree subgraph and gives an explicit return-to-full-map control, rather than silently replacing the universe.

## Reusable atlas principles

1. **History is visual, not only textual.** Persist clicked real records and color them as a route; use a different color for the active record and preserve prior route nodes as subdued waypoints.
2. **Location is first-class.** Expose a file-explorer-style breadcrumb for the selected route, let every segment restore that exact recorded map context, and preserve the camera state in the URL.
3. **Scale has meaning.** Node radius and label type must be driven by official hierarchy depth and recorded relevance, then clamped so close and distant views remain readable instead of disappearing.
4. **Selection reveals a neighborhood.** Keep selection local, but show the genuine child/record links and a concise next action so the user knows why a node matters and where exploration can go next.
5. **Filtering must be reversible.** A focused branch needs a clear `view all` escape route and must not lose the user’s previous world context.

## References

- [Map of Reddit live application](https://anvaka.github.io/map-of-reddit/)
- [Map of Reddit source repository](https://github.com/anvaka/map-of-reddit)
- [Map of Reddit data repository](https://github.com/anvaka/map-of-reddit-data)

## Local atlas interaction validation notes

The upgraded local atlas initializes with a debounced hash containing `x`, `y`, `k`, and `l`, confirming that the current world location is shareable and restorable. The browser automation’s synthetic pointer sequence did not register as a canvas selection in this environment, so route behavior will be validated through the application’s real search-result controls as well as normal browser-preview rendering. This limitation is specific to automated pointer dispatch; it does not change the component’s pointer event contract.

Selecting the real `Software Publishers` NAICS record through unified search updated the URL with camera, layer, focused-branch, and selected-node state. The visible UI simultaneously showed the file-explorer breadcrumb `Atlas / Industries / Software Publishers`, the active-record status, the `1 explored` route counter, the changed active node color, and the local `»` action. This confirms the new route and location model operates through a real record path.

Selecting the real `Software Developers` O*NET occupation next produced `2 explored`, retained the prior `Software Publishers` step in the clickable route, added `Software Developers` as the active breadcrumb step, and opened the recorded skills neighborhood. The skills map retained a visible active occupation node plus labeled, linked O*NET skills such as Mathematics, Science, Active Learning, Monitoring, Speaking, and Learning Strategies. This validates route continuity across the explicitly non-structural industry-to-occupation boundary without inventing an industry parent relationship.

Clicking the `Software Publishers` breadcrumb restored the saved industry camera, focused branch, selected node, and local action while retaining the two-record exploration count. A subsequent zoom-out retained the active node, its local action, the named immediate child, and the full route chrome; this confirms that selected and visited records are protected from ordinary label suppression as scale changes.

Further low-zoom control testing reduced the route camera to `k=0.698` while the active Software Publishers record, its named immediate child, its local action, the focused-branch indicator, and the two-record history all remained visible. The protected route anchors therefore avoid the previous failure mode in which exploration context disappeared at low scale.

## Atlas interaction expansion validation — 14 August 2026

The Graph now adds a user-controlled `Scan` mode that selects only nodes already visible in the active real-data layer, preserves the route count, updates the active record and hash-based camera state, and can be paused. A live session advanced among official NAICS industry records and produced a restorable local route. The canvas also exposes `Lasso` for pinning real visible records, a `Trail` panel for reviewing recent stops, and clear pin controls. These actions are local exploration aids; they do not manufacture records, classifications, or crosswalks.
