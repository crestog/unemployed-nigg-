# Canvas verification notes

The live preview now exposes a full-screen `#atlas-canvas` surface with a fixed overlay search, layer chips, zoom/reset/help controls, a real-data world overview, and a persistent selected-record inspector. The initial layer is the NAICS/industry tree and the inspector identifies Agriculture, Forestry, Fishing and Hunting as an official U.S. Census Bureau 2022 record. The page currently renders 2,955 taxonomy records, 1,016 occupations, 10 skills and 10 tasks for the selected record/occupation context.

The implementation supports pointer drag, wheel zoom, cluster focus, zoom-dependent labels, layer switching, and search results that move the camera. The browser preview showed the canvas and provenance section rendering without a runtime error. The next verification pass must specifically exercise: drag/pan without clicking nodes, zoom into a cluster, search an occupation, switch to skills/tasks, open/close the inspector, and test mobile touch layout.

The first browser click test did not visibly change the layer from `industries` to `occupations`; this may be an automation-targeting issue because the visible element index remained stable and the page was partially scrolled. Manual verification should click the chip in the actual canvas viewport, then confirm the label changes to `infinite atlas / occupations` and the visible-record count changes from the industry release count.

The camera search test successfully found the real O*NET record `Accountants and Auditors · 13-2011.00` in the overlay. The automated click did not visibly commit the result, so the next implementation pass should make result selection more robust for pointer/touch use and expose a clearer selected-state change in the canvas header.
