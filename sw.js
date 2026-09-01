const CACHE = "polymath-v1-18-1";
const APP = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./index.js",
  "./manifest.json",
  "./icons/icon-180.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // App shell: cache first.
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
          return response;
        })
      )
    );
    return;
  }

  // KaTeX CDN: network first, then cached copy, allowing first-load offline use
  // after the resource has been fetched once.
  if (url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request))
    );
  }
});
