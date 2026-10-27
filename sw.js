
const CACHE_NAME = "gympilot-offline-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
    "./app.js",
  "./manifest.json",
  "./gympilot-icon-180.png",
  "./gympilot-icon-192.png",
  "./gympilot-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("gympilot-offline-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (
        await cache.match("./index.html") ||
        Response.error()
      );
    })
  );
  return;
}

  
event.respondWith(
  fetch(event.request)
    .then((response) => {
      if (response.ok && response.type === "basic") {
        const responseCopy = response.clone();

        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => {
            return cache.put(event.request, responseCopy);
          })
        );
      }

      return response;
    })
    .catch(() => caches.match(event.request))
);
});
