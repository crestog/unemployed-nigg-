# Every Noise interaction findings

Observed directly at https://everynoise.com/ on 2026-08-14.

The main experience is a large white spatial field rather than a dashboard. The page exposes a very large set of genre labels as independent positioned elements, with the header and controls kept small and out of the field. At the initial viewport, the map is already larger than the screen and the browser page can scroll through it; the labels are not arranged in cards or a bounded chart.

The labels are short names, not numeric counts. Density is communicated by spatial grouping and typography, while meaning comes from the label itself. There are no visible coordinate numbers or generic cluster-count badges competing with the names. At a lower scroll position, the same world continues spatially; labels remain readable and clusters become discoverable through whitespace and proximity rather than a forced “fit everything” layout.

The key design implication for Industry Niche Atlas is that the graph needs a world coordinate system larger than the viewport, scale-aware label admission, and a camera that moves through that world. Overview should show only high-level industry names and a small number of meaningful region labels. Detail names should appear only after zooming into a region. Numeric codes, record counts, and provenance belong in an inspector or on demand, not as default map labels.

## Hands-on node click

Clicking the visible `pop` node did not open a generic details drawer. It appended a small `»` action beside the node, and the page gained a `find artist` control at the upper right. The node itself remained part of the same huge map. This is a critical distinction: selection exposes a local action in place rather than pushing the user into a dashboard panel. The map remains the primary navigation surface.

Clicking the `»` action navigated to `https://everynoise.com/engenremap-pop.html`, a dedicated zoomed genre map. The genre page kept the same global header but changed the map contents to real artist names, with a second band of related genre labels below the artist field. Its controls changed contextually: `playlist`, `intro`, `pulse`, `edge`, and `new` appeared for the selected genre. Clicking `Taylor Swift` appended another `»` action beside that artist; clicking that action points to `https://everynoise.com/artistprofile.html?id=06HL4z0CvFAxyc27GXpf02`.

The reference therefore uses a **map → local action → new map scale → local action → record page** flow. It does not use a persistent inspector to carry the user through every level. The selected item remains visible in place, and the next action is exposed beside the label. Each navigation step changes the dataset and page context while keeping the same spatial language.

The `scan` control toggles to `stop` and changes the map's viewport over time; the map continues to be the main surface while the camera/scroll position changes. The control is a small text link in the header rather than a large overlay. The map can be extremely dense at a given scale, but the labels are the primary content and the numeric red boxes seen in the browser overlay are interaction-debug annotations, not part of the site's actual visual language.

The `list` control opens a separate one-dimensional directory with the same genre dataset. The list offers explicit sort dimensions—popularity, emergence, modernity, youth, femininity, engagement, background, tempo, duration, color, name, and added—and lets a user click a genre to re-sort by similarity. Each row has a playlist action. The list is therefore not a replacement for the map; it is a precision companion for ordering, comparing, and finding records that are difficult to hit spatially.

The `book` control reveals a large editorial note/cover overlay on top of the map, while the map remains visible behind it. This is an example of contextual documentation that does not route the user away from the world. The `more` control is a small in-page escape hatch to the site's notes and updates rather than another chart or dashboard.

## Source mechanics observed in the HTML

The reference uses a fixed-width `body` and a `.canvas` containing absolutely positioned `.genre` elements. Each map record carries inline `top`, `left`, `font-size`, and `color` values, so the world is intentionally much larger than the viewport and is explored with ordinary page scroll. Hover or selection changes only the local record: `.genre.current` becomes bold with a light background and a left border, and its hidden `.navlink` action becomes visible.

The main node click calls `playx(...)`, which plays a short preview and highlights the current genre; it does not move the page. The adjacent `»` link uses `event.stopPropagation()` and routes to a genre-specific page. Keyboard Space/Enter triggers the same node action. `scan` randomly picks unplayed nodes, invokes their normal click behavior, waits six seconds (or twenty seconds with Alt), and stops when exhausted. A scroll listener only adjusts the fixed book overlay's position; the map itself is not trapped inside a small graph card or viewport.

## Local atlas validation

The rebuilt Graph tab was opened in the local preview. The initial world rendered with real industry names, a full-world background, and no modal. Clicking the visible `»` control focused the selected industry branch and revealed its child taxonomy records in place. Entering `software` in the unified search returned real NAICS, ISIC, O*NET occupation, and O*NET task records together in one result surface, confirming that search remains a precision companion to exploration rather than a separate search mode.

A subsequent refresh confirmed the neutral starting state: no record was preselected, the local `»` action was absent, and the Skills shortcut stayed hidden until an occupation branch exists. The Directory tab still exposed the official NAICS and ISIC tree plus the O*NET/BLS work-record browser, preserving the requested two-surface architecture.
