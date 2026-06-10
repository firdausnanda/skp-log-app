const CACHE_NAME = "worklog-skp-v1";

const PRECACHE_ASSETS = [
  "/",
  "/login",
  "/favicon.ico",
  "/img/logo-new.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-192x192-maskable.png",
  "/icon-512x512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing Old Cache");
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Exclude Next.js hot-reloading/HMR and Dev Server scripts
  if (url.pathname.startsWith("/_next/webpack-hmr") || url.pathname.includes("hot-update")) {
    return;
  }

  // Skip caching for APIs, file uploads, chrome extensions, Google Profile images
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/") ||
    event.request.url.includes("googleusercontent.com") ||
    event.request.url.includes("chrome-extension")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-While-Revalidate: serve cached version, fetch fresh copy in background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Silently ignore background refresh errors (offline/cellular drops)
          });
        return cachedResponse;
      }

      // Network First: fetch from network, cache if successful, fallback to cache/offline
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline navigation fallback: serve cached home page
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});
