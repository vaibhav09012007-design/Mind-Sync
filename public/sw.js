// Service Worker for MindSync PWA
// Handles caching and offline functionality

const CACHE_NAME = "mindsync-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/focus",
  "/kanban",
  "/analytics",
  "/notes",
  "/calendar",
  "/manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API requests - always go to network
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline", offline: true }), {
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // For navigation requests (pages), try network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version
          return caches.match(request).then((cached) => {
            return cached || caches.match("/dashboard");
          });
        })
    );
    return;
  }

  // For other assets, try cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tasks") {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // This would sync any queued offline actions
  console.log("[SW] Syncing tasks...");
  // Implementation depends on IndexedDB queue
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || "MindSync", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: data.tag || "default",
      data: data.url,
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});
