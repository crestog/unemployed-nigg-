# Map of Reddit capture

Source URL: https://anvaka.github.io/map-of-reddit/?x=14077.5&y=17622.5&z=84115.58113690981&v=3

The sandbox browser navigated to the public Map of Reddit URL, but the interactive canvas did not expose readable DOM controls in the first capture and the visual screenshot was blank/unavailable. The page title was `Map of Reddit`. Further behavior and architecture inspection must use the public repository, downloaded page HTML/JavaScript, and direct browser interaction where rendering succeeds.

User requirement: reproduce the interaction concept for Atlas's World tab, not Reddit branding/content: a zoomable/pannable spatial field, searchable nodes/clusters, click-to-inspect, readable detail context, URL-persisted viewport, and a world map base instead of a subreddit map.

Current Atlas World tab: `client/src/pages/RealHome.tsx` selects `GlobalVentureAtlas` for the World tab; this is the component to replace or substantially refactor. Existing map-related components include `InfiniteAtlas.tsx`, `SatelliteWorldPrecision.tsx`, `Map.tsx`, and `RouteMap.tsx`.

Current blank roadmap symptom: `CustomRoadmapGraph.tsx` renders zero nodes when `roadmap.nodes` is empty; the screenshot's `0 nodes · 0 relationships` indicates the client received/stored an empty graph rather than a renderer-only issue. The graph should be hardened with an explicit empty/error state and the endpoint response should be validated before navigation.

## Public architecture findings

The public application is a Vue 2 shell around a custom WebGL renderer. `src/App.vue` mounts a canvas, loads an SVG graph through `createStreamingSVGRenderer`, renders a typeahead search, a selected subreddit preview, a sidebar, tooltips, progress messages, and optional related/street-view modes.

`src/lib/createStreamingSVGRenderer.js` is the key design: it creates WebGL point/polygon/text layers, streams/parses the SVG instead of building a large DOM tree, wires pointer events for pan/zoom/hover, saves camera position to URL query parameters, focuses searched nodes, exposes neighbor lookup, and can create a temporary related-only subgraph. `src/appState.js` stores query, graph version, and camera `x/y/z` state in the URL. The public data repository stores the main graph as editable SVG with country boundary paths, country groups, subreddit circles, and text labels.

The public data README states that the map was built from 176,178,986 Reddit comments from 2020–2021, Jaccard similarity between subreddits, graph clustering, graph layout, SVG generation, and custom WebGL/streaming-SVG rendering. It explicitly warns that spatial proximity is not proof of a relationship. The public data repository is separate from the renderer and contains `svg/graph.svg` (~2.77 MB, 41,842 circles, 94 paths, 96 groups), editable DOT graph sources, and a build script.

## Atlas adaptation decision

Atlas will not copy Reddit content or branding. The World tab will use the existing source-bounded world release (`client/public/data/world-venture.json`, 235 country records and 235 world geometries, zero synthetic records) plus the bundled `world-atlas` country geometry. The replacement will preserve the public concept—single explorable canvas, pan/zoom, zoom-at-cursor, URL-persisted camera, typeahead search/focus, selected-node inspector, and a related/local view—but make the spatial field an actual world map with source-backed country nodes and cluster overlays. The existing legal-entity count remains a source metric, not a claim about total businesses or economic size.

## Blank custom roadmap finding

The supplied screenshot shows `0 nodes · 0 relationships`, confirming the custom graph component is rendering an empty response rather than merely having invisible SVG strokes. The result page must reject empty/invalid stored payloads, show an actionable error/empty state, and the graph endpoint must validate node and edge counts before navigation. A missing AI result should not be presented as a successful empty AI roadmap.

## Local visual verification

The local Vite build rendered the new World tab successfully at `http://localhost:3000/#world=1`. The canvas shows a dark zoomable world map with 241 glowing country fields, country outlines, source overlays, search field, zoom-in/zoom-out/reset controls, a field guide, and the Atlas World breadcrumb. Browser extraction exposed all 235 country geometries and the UI text, confirming the blank canvas is not caused by a missing world data asset.

The browser screenshot was visibly populated with the world map and glowing nodes. The browser’s annotated screenshot overlays red numbered boxes on interactive elements; those boxes are browser annotations, not application UI. Coordinate-based typeahead input did not visibly populate in this capture, so search should receive a further keyboard/DOM-focused test before release.

DOM verification: the local World explorer contains one search input with placeholder `Find a country field…`, mounted in the bottom-left overlay and currently empty. The first console probe used TypeScript-only syntax and failed; the corrected browser-compatible query succeeded. Search is implemented as a controlled React input with Enter-to-focus behavior and suggestion buttons.

Second local browser check: the World canvas remains populated and stable after a search-input attempt, but the browser input helper did not visibly update the controlled React search value. This is a test-harness interaction issue rather than a render failure; the mounted input was confirmed separately with DOM inspection. A native input event will be used for the final search verification.

DOM-level search verification succeeded: setting the controlled input to `India` and dispatching native `input`/`change` events produced matching suggestion buttons including `India IN · 387,112 records`. Other text matches such as British Indian Ocean Territory and Indian Ocean Territory also appear, which is consistent with the current includes-based typeahead behavior.

Interaction verification: after a native search event, the World explorer visibly rendered the country-field dropdown with India and its source count. The annotated browser click at the visible suggestion coordinate did not change selection, likely because the screenshot coordinate layer includes browser annotations and the overlay moved; the DOM search buttons themselves are present and wired to `focusNode`.

DOM selection verification succeeded: clicking the exact `IndiaIN · 387,112 records` suggestion focused the map and, after the React state settled, persisted `wxx`, `wxy`, `wxz`, and `wxc=356` in the URL hash. The page body exposed India and the `Show nearby fields` control. The inspector heading itself was not detected by the body-text probe because the current drawer/overlay extraction is partial, but the selected state and nearby action were present.

Nearby-mode verification succeeded: clicking `Show nearby fields` switched the camera to a local visual neighborhood around India, persisted `wxm=nearby` in the URL hash, and exposed both `Only nearby fields are shown` and `Nearby fields shown` in the rendered page text. This adapts Map of Reddit’s related-subgraph concept using geographic proximity only; Atlas labels it as a visual navigation aid rather than a semantic or causal relationship.

Roadmap regression fix verification: opening `/ai/roadmap/result` without a valid stored graph now renders `ROADMAP RESPONSE UNAVAILABLE`, explains that an empty/incomplete response was not saved as a valid roadmap, and provides a `Create a roadmap` recovery button. The old misleading `0 nodes · 0 relationships` blank canvas is no longer shown for invalid session data.
