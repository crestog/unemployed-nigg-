# Infinite Atlas interaction specification

## Product decision

The main product surface is a full-screen map, not a dashboard. Search is a camera-jump tool; it is never the only way to discover. The default state opens on the broadest real industry layer, with a few large clusters and labels. Scrolling changes scale, dragging changes place, and clicking a cluster zooms into its neighborhood.

## Interaction model

The canvas has four real-data layers: official industry trees, O*NET occupations, O*NET skills, and O*NET task statements. A layer switch changes the population shown without changing the camera language. Each layer has a zoom-dependent density rule: macro clusters at low zoom, named records at medium zoom, and full labels plus the inspector at high zoom. Search finds a record and animates the camera to it; it does not replace the map.

The industry layer is structural: positions are a deterministic layout of official taxonomy records grouped by their parent codes. The occupation layer is an explicitly derived neighborhood: positions are calculated from shared O*NET skill labels and the inspector labels this as a derived similarity view. The skill and task layers are record-level views attached to the selected occupation. No industry-to-occupation parent edge is invented.

## Controls

The viewport supports pointer drag, wheel/pinch zoom, double-click zoom, zoom controls, reset world, layer switching, a unified search field, a compact legend, and an inspector that can collapse. A route chip shows the last selected nodes. A cluster click focuses the camera; a record click opens evidence and reveals the next available level.

## References

The interaction references are [Every Noise at Once](https://everynoise.com/), [Map of Reddit](https://anvaka.org/map-of-reddit/), [Observable linked brushing](https://observablehq.com/blog/linked-brushing), [Vega brushing and linking](https://vega.github.io/vega/examples/brushing-scatter-plots/), and [roadmap.sh](https://roadmap.sh/). These references inform interaction patterns, not the atlas data.
