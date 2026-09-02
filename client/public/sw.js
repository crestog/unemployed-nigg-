// Atlas service worker.
//
// This used to cache India tiles and nothing else, which meant the app shipped a
// service worker that could not serve the app: with the network off, the
// navigation request for `/` failed and the user got the browser's offline page
// while a cache full of vector tiles sat unused. A worker that implies offline
// support without providing it is worse than none, so the shell and its hashed
// assets are cached too.
//
// Three strategies, by what the thing is:
//
//   navigations   network first, fall back to the cached shell. A deploy must
//                 never be masked by a stale shell, so the network always wins
//                 when it answers; the cache is the offline path only.
//   /assets/*     cache first. Vite fingerprints these, so a hit is by
//                 definition the right bytes and can never be stale.
//   tiles         cache first. Release-scoped paths, served `immutable`.
//
// Everything else — /api/*, cross-origin, non-GET — is left to the network.

const VERSION = "v2";
const SHELL_CACHE = `atlas-shell-${VERSION}`;
const ASSET_CACHE = `atlas-assets-${VERSION}`;
const TILE_CACHE = `atlas-tiles-${VERSION}`;
const CACHES = [SHELL_CACHE, ASSET_CACHE, TILE_CACHE];

/** `/` is the SPA shell for every route: wrangler.jsonc sets
 * `not_found_handling: single-page-application`, so any navigation resolves to
 * it. Caching the one entry therefore covers every path in the app. */
const SHELL_URL = "/";

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // `reload` so an install triggered by a new deploy cannot pick the old
      // shell out of the HTTP cache.
      await cache.add(new Request(SHELL_URL, { cache: "reload" })).catch(() => {
        // First load offline, or the shell 500s. Neither is worth failing the
        // install over — the fetch handler degrades to network-only.
      });
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key.startsWith("atlas-") && !CACHES.includes(key))
          .map(key => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/** Release-scoped tile paths: `/data/<release-dir>/<layer>/<z>/<x>/<y>.pbf` for
 * the world set, `/data/india-tiles/<release>/…` for India. Both are immutable
 * per release, which is what makes cache-first safe. */
const isTile = pathname =>
  /^\/data\/india-tiles\/[^/]+\//.test(pathname) ||
  /^\/data\/world-mvt\/[^/]+\//.test(pathname);

const isHashedAsset = pathname =>
  pathname.startsWith("/assets/") || pathname.startsWith("/fonts/");

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  // Opaque and error responses are not worth storing: a cached 404 outlives the
  // deploy that would have fixed it.
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(SHELL_URL, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(SHELL_URL);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // State and AI generation are never useful from a cache, and a cached reply
  // here would be a correctness bug rather than a stale pixel.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstShell(request));
    return;
  }
  if (isTile(url.pathname)) {
    event.respondWith(
      cacheFirst(TILE_CACHE, request).catch(
        () => new Response("Offline tile unavailable", { status: 503 })
      )
    );
    return;
  }
  if (isHashedAsset(url.pathname)) {
    event.respondWith(cacheFirst(ASSET_CACHE, request));
  }
});
