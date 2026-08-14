# Infinite Atlas interaction specification

## Product decision

The main product surface is an **unbounded world**, not a chart card and not a dashboard. The map is allowed to be much larger than the viewport. The first view must show the real top-level industry world as readable names arranged in a spacious, deterministic field. The browser viewport is a window into that world; the user moves through it rather than asking the layout to fit everything into one page.

## Interaction model

The canvas has four real-data layers: official industry trees, O*NET occupations, O*NET skills, and O*NET task statements. The default industry layer is a world of positioned names; no numeric code, cluster count, or debug index is rendered on the map. At overview, only macro industry names and a small number of meaningful labels are admitted. As the camera moves closer, child records become visible. At close range, labels are admitted only when they do not collide with an already visible label. Dot radius and type scale continuously with the camera scale, while inspector metadata stays outside the map.

The industry layer is structural: positions are a deterministic layout of official taxonomy records grouped by their parent codes. Clicking a record selects it in place and reveals a small local “go deeper” action; it then focuses the camera on the selected branch and exposes the next official taxonomy level. At the occupation boundary, the experience must say that the neighborhood is derived from recorded skill overlap rather than pretending it is an official industry parent. Skill and task layers are record-level views attached to the selected occupation. No industry-to-occupation parent edge is invented.

## Controls

The viewport supports ordinary page scrolling through the world, pointer drag where appropriate, cursor-centered wheel/pinch zoom, double-click zoom, reset world, layer switching, and a unified search field. Search is a precision companion: it finds a real record, reveals a local action, and moves the camera to that record without replacing the world with a list. A click on a node should not open a giant modal; it should highlight the node, reveal a small action beside it, and preserve the surrounding map. A separate Directory tab provides ordered lookup and sorting for records that are hard to hit spatially. Contextual notes can appear as an overlay, but the map remains visible behind them.

## References

The interaction references are [Every Noise at Once](https://everynoise.com/), [Map of Reddit](https://anvaka.org/map-of-reddit/), [Observable linked brushing](https://observablehq.com/blog/linked-brushing), [Vega brushing and linking](https://vega.github.io/vega/examples/brushing-scatter-plots/), and [roadmap.sh](https://roadmap.sh/). These references inform interaction patterns, not the atlas data.
