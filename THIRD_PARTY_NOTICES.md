# Third-party notices

## MapLibre GL JS

Atlas uses `maplibre-gl@6.5.0` for the World tab’s persistent WebGL map, globe projection, native pan/pinch/rotate controls, style-driven labels, collision placement, and local feature querying. MapLibre GL JS is distributed under the 3-Clause BSD License. The project and license are available at https://github.com/maplibre/maplibre-gl-js and the installed package includes its full `LICENSE.txt`.

Atlas follows MapLibre’s documented Vite ESM worker setup by importing `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url` and passing the emitted worker URL to `setWorkerUrl()`. No Map of Reddit data, branding, or private system is included. Atlas geographic data, source records, labels, and UI remain Atlas-owned/source-backed and retain their own provenance and license metadata.

## Previous local prototype cleanup

The earlier local w-gl/earcut/MSDF prototype was removed when the implementation pivoted to MapLibre. No w-gl or Map-of-Reddit-derived renderer code is part of the current source tree or production dependency set.
