const TILE_CACHE = "atlas-india-tiles-v1";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith("atlas-india-tiles-") && key !== TILE_CACHE)
            .map(key => caches.delete(key))
        )
      ),
    ])
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!/^\/data\/india-tiles\/[^/]+\//.test(url.pathname)) return;

  event.respondWith(
    caches.open(TILE_CACHE).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return cached ?? new Response("Offline tile unavailable", { status: 503 });
      }
    })
  );
});
