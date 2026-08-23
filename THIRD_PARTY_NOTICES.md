# Third-party notices

## MapLibre GL JS

Atlas uses `maplibre-gl@6.5.0` for the World tab’s persistent WebGL map, globe projection, native pan/pinch/rotate controls, style-driven labels, collision placement, and local feature querying. MapLibre GL JS is distributed under the 3-Clause BSD License. The project and license are available at https://github.com/maplibre/maplibre-gl-js and the installed package includes its full `LICENSE.txt`.

Atlas follows MapLibre’s documented Vite ESM worker setup by importing `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url` and passing the emitted worker URL to `setWorkerUrl()`. No Map of Reddit data, branding, or private system is included. Atlas geographic data, source records, labels, and UI remain Atlas-owned/source-backed and retain their own provenance and license metadata.

## GeoBoundaries CGAZ global administrative reference data

Atlas includes a versioned, precomputed worldwide administrative-boundary release derived from the official GeoBoundaries Composite Global Administrative Zones (CGAZ) ADM1 and ADM2 GeoJSON snapshots. The release is used as reference geometry for global first- and second-level administrative boundaries; it does not add global localities or imply that every boundary is legally undisputed. GeoBoundaries documents its global coverage, extensive simplification, and disputed-area policy based on U.S. Department of State definitions at https://www.geoboundaries.org/globalEndpoints.html and https://www.geoboundaries.org/.

The source snapshots, retrieval date, SHA-256 hashes, source URLs, feature counts, tile zooms, and coverage policy are preserved in `client/public/data/world-mvt/world-global-geoboundaries-20260823/manifest.json`. The generated release is served as static Mapbox Vector Tiles and includes the required GeoBoundaries attribution in the World interface. GeoBoundaries individual gbOpen datasets are licensed CC BY 4.0; the CGAZ composite is treated as source-backed reference data under the attribution and policy stated by its provider.

The current global release intentionally does not claim worldwide city/locality coverage. India retains its existing specialized locality layer; a separate GeoNames-based global locality phase would be required before making a global cities claim.

## Natural Earth / world-atlas overview geometry

The country-level overview remains based on the existing `world-atlas/countries-50m.json` / Natural Earth-derived data already present in the project. The World interface keeps its source and license metadata in the existing data manifests and provenance records.

## GeoNames scope note

GeoNames is not included in the new global administrative tile release. If worldwide locality data is added later, the project must preserve GeoNames attribution and license terms, source snapshots, and an offline-build manifest before deployment.

## Previous local prototype cleanup

The earlier local w-gl/earcut/MSDF prototype was removed when the implementation pivoted to MapLibre. No w-gl or Map-of-Reddit-derived renderer code is part of the current source tree or production dependency set.

## Atlas-owned presentation

The new space backdrop, palette, label placement, and idle globe rotation are Atlas-owned presentation behavior. No satellite imagery, terrain texture, external basemap tiles, or Map-of-Reddit data is claimed or embedded.
