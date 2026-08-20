# Roadmap and Entity Import Decision — 2026-08-20

**Status:** Implement-now, reversible pilot.
**Primary user:** The Atlas owner exploring a real industry or inspecting a personally held startup/business dataset.
**Core job:** Starting from an industry record or a small, provenance-rich entity file, decide what verified role or geographic evidence can be inspected next—without mistaking a classification, directory row, or AI suggestion for proof.

## Evidence, inference, and decisions

| Item | Classification | Decision |
| --- | --- | --- |
| Roadmap.sh separates an interactive graph, projects, practical requirements, user progress, and an AI conversation. | Evidence: EV-040–EV-042 | Recreate the **information architecture principles** using original UI and independent source records; never copy Roadmap.sh content, node layouts, illustrations, resource lists, or code. |
| Current Atlas industries and O*NET occupations are independently sourced but lack a stored crosswalk. | Evidence: existing data model and `atlas-roadmaps-spec.md` | Remove the opaque dead-end wording now. Offer a transparent **industry research route** and label it as awaiting a formal bridge. |
| BLS publishes a 2024 National Employment Matrix keyed to 2022 NAICS industries and an OEWS-based 2018 SOC occupation structure. | Evidence: EV-043 | Build a dedicated, versioned BLS matrix ingestion as the first official United States industry-to-occupation route. Do not pretend it applies internationally or outside its vintage/scope. |
| The user holds scraped startup/business data for Uttar Pradesh, Estonia, and Singapore. | User statement; content not yet received | Add a browser-local validator and preview contract now. Do not show, retain, upload, geocode, or publicly publish any records until the user provides data and each row passes its provenance and coordinate checks. |
| A model can organize or explain a user’s intent but cannot establish a career fact or an entity’s status/location. | Product-safety inference | Keep the initial “intelligence” deterministic: source-backed route assembly, explicit unknowns, and user-owned evidence. A later model-backed assistant requires a full-stack upgrade, a privacy/data-retention decision, and a falsifiable user-value test. |

## Implement-now core loop

> **Select a real record → see the strongest supported next route → inspect sources and limits → mark personal evidence or import a provenance-complete file → return to the map.**

The Roadmaps tab will show an **Industry research route** when Graph opens an industry. It will name the selected classification, preserve its taxonomy/source, state that an occupation bridge is not yet loaded, offer a constrained official-occupation search, and reserve a visible slot for the BLS National Employment Matrix. This replaces an unhelpful dead end without fabricating a relationship.

The World tab will expose **Import held dataset**. The initial import works entirely in the browser: the user chooses a CSV/JSON file, maps or validates required evidence-envelope fields, sees only a row-quality summary and client-local preview, and may place a pin only if a row carries source-provided or separately permitted coordinates plus precision. The file is never transmitted by this static build. Country/admin-only rows remain aggregates.

## Entity evidence envelope

| Required field | Why it is mandatory | Point placement rule |
| --- | --- | --- |
| `name` and `source_record_id` | Identifies the record without treating a display name as unique. | Required for every valid row. |
| `publisher` and `source_url` | Makes the source and review path visible. | Required for every valid row. |
| `acquisition_method`, `access_timestamp`, and `reuse_status` | Captures how the data was obtained and whether public display is allowed. | Required for every valid row. |
| `entity_category` and `activity_status_basis` | Separates a startup/business label from proof of current operation. | Required for every valid row. |
| `country_code`, `admin1`, `admin2`, and locality fields where available | Retains the source geography claim. | Country/admin-only values cannot create a point. |
| `latitude`, `longitude`, `coordinate_source`, and `coordinate_precision` | Enables a reviewable geographic claim. | A point is eligible only if coordinates are source-provided or documented as permitted; otherwise it is excluded from pins. |

## Measurable pilot outcome

The pilot passes if, using the owner’s own dataset, the importer correctly classifies **100% of a manually reviewed sample of 25 rows** as either **pin eligible**, **aggregate only**, or **blocked for missing evidence**, and every pin-eligible sample row exposes its publisher, source URL, access timestamp, coordinate source, and precision in the preview. The roadmap portion passes if an industry selection exposes a named source, a stated limitation, and at least one defensible next action without asserting an unsupported industry-to-occupation link.

## Explicit non-goals in this increment

This build will not scrape directory sites, bulk geocode addresses, infer activity status, distribute user-held records, promise global map completeness, create a predictive career score, or claim an AI-generated sequence is a certified curriculum. It will not use the user’s dataset until the file is deliberately selected within the browser.

## Next checkpoint

Implement the industry-route state and browser-local import validator, then test the World and Roadmaps interactions using a minimal synthetic **schema-only** fixture with no entity records. The first real-record test waits for the user’s uploaded Uttar Pradesh, Estonia, or Singapore dataset and its source/reuse documentation.
