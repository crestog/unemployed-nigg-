# Canvas verification notes

The live preview now exposes a full-screen `#atlas-canvas` surface with a fixed overlay search, layer chips, zoom/reset/help controls, a real-data world overview, and a persistent selected-record inspector. The initial layer is the NAICS/industry tree and the inspector identifies Agriculture, Forestry, Fishing and Hunting as an official U.S. Census Bureau 2022 record. The page currently renders 2,955 taxonomy records, 1,016 occupations, 10 skills and 10 tasks for the selected record/occupation context.

The implementation supports pointer drag, wheel zoom, cluster focus, zoom-dependent labels, layer switching, and search results that move the camera. The browser preview showed the canvas and provenance section rendering without a runtime error. The next verification pass must specifically exercise: drag/pan without clicking nodes, zoom into a cluster, search an occupation, switch to skills/tasks, open/close the inspector, and test mobile touch layout.

The first browser click test did not visibly change the layer from `industries` to `occupations`; this may be an automation-targeting issue because the visible element index remained stable and the page was partially scrolled. Manual verification should click the chip in the actual canvas viewport, then confirm the label changes to `infinite atlas / occupations` and the visible-record count changes from the industry release count.

The camera search test successfully found the real O*NET record `Accountants and Auditors · 13-2011.00` in the overlay. The automated click did not visibly commit the result, so the next implementation pass should make result selection more robust for pointer/touch use and expose a clearer selected-state change in the canvas header.

The new local preview now has only two primary tabs: `Graph` opens directly to the map, while `Directory` restores the official taxonomy browser and occupation record explorer. The Directory tab was successfully opened in the browser and showed NAICS 2022 source records, next-level children, and the Accountants and Auditors profile with O*NET/BLS metrics.

After returning to Graph, the unified search again found `Accountants and Auditors · 13-2011.00`. This confirms the search index still works after the shell refactor; the remaining behavior check is selecting the result and confirming the selected inspector changes on the canvas.

The selection check is now successful: clicking the search result switches the canvas to the `occupations` layer, sets zoom to 105%, updates the selected record, and opens the Accountants and Auditors inspector with its real O*NET description, 29 task statements, and $83,680 median wage.
