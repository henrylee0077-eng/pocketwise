// PocketWise service worker — minimal, hand-written (no build-tool
// dependency) so it works the same regardless of bundler.
//
// Strategy:
// - Same-origin static assets (_next/static, /icons, fonts): cache-first,
//   since content-hashed filenames never change under the same URL.
// - Same-origin page navigations: network-first, falling back to a cached
//   copy or the offline page if the network is unavailable.
// - Anything cross-origin (Supabase, Google Gemini, etc.) or under /api/:
//   never intercepted. Financial data must always be fresh, never served
//   stale from a cache.
const CACHE_VERSION = "pocketwise-v1";
const OFFLINE_URL = "/offline.html";
const APP_SHELL = [OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin requests
  if (url.pathname.startsWith("/api/")) return; // never cache our own API routes

  const isStaticAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))),
    );
  }
});
