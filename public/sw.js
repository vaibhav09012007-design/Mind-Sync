// Enhanced Service Worker for MindSync PWA
// Handles caching, offline functionality, background sync, and push notifications

const CACHE_NAME = "mindsync-v2";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/focus",
  "/kanban",
  "/analytics",
  "/notes",
  "/calendar",
  "/settings",
  "/manifest.json",
];

const DYNAMIC_CACHE = "mindsync-dynamic-v1";
const API_CACHE = "mindsync-api-v1";

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
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // API requests - network first with offline fallback
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET API responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Try cache, then return offline response
          const cached = await caches.match(request);
          if (cached) return cached;

          return new Response(
            JSON.stringify({
              error: "You are offline",
              offline: true,
              cached: false,
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        })
    );
    return;
  }

  // Navigation requests - network first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          // Fallback to dashboard for SPA
          return caches.match("/dashboard");
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "sync-tasks") {
    event.waitUntil(syncOfflineTasks());
  } else if (event.tag === "sync-calendar") {
    event.waitUntil(syncCalendarEvents());
  }
});

// Sync offline task changes
async function syncOfflineTasks() {
  console.log("[SW] Syncing offline tasks...");

  try {
    // Get queued actions from IndexedDB
    const db = await openDB();
    const tx = db.transaction("offlineQueue", "readonly");
    const store = tx.objectStore("offlineQueue");
    const actions = await store.getAll();

    for (const action of actions) {
      try {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });

        // Remove from queue after success
        const deleteTx = db.transaction("offlineQueue", "readwrite");
        deleteTx.objectStore("offlineQueue").delete(action.id);
      } catch (e) {
        console.error("[SW] Failed to sync action:", action, e);
      }
    }

    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_COMPLETE", count: actions.length });
    });
  } catch (e) {
    console.error("[SW] Sync failed:", e);
  }
}

// Sync calendar events
async function syncCalendarEvents() {
  console.log("[SW] Syncing calendar events...");
  // Calendar sync is handled by the main app
  // This is a placeholder for background calendar refresh
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mindsync-offline", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("offlineQueue")) {
        db.createObjectStore("offlineQueue", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

// Push notification event
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "MindSync", body: event.data.text() };
  }

  const options = {
    body: data.body || "You have a notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: data.tag || "default",
    data: {
      url: data.url || "/dashboard",
      taskId: data.taskId,
      type: data.type,
    },
    actions: [],
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
  };

  // Add actions based on notification type
  if (data.type === "task-reminder") {
    options.actions = [
      { action: "complete", title: "✓ Complete" },
      { action: "snooze", title: "⏰ Snooze 15m" },
    ];
  } else if (data.type === "event-reminder") {
    options.actions = [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "MindSync", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === "complete" && data.taskId) {
    // Mark task as complete via API
    event.waitUntil(
      fetch(`/api/tasks/${data.taskId}/complete`, { method: "POST" })
        .then(() => {
          // Show confirmation
          return self.registration.showNotification("Task Completed", {
            body: "Great job! Task marked as done.",
            icon: "/icons/icon-192.png",
            tag: "task-completed",
          });
        })
        .catch(console.error)
    );
    return;
  }

  if (action === "snooze" && data.taskId) {
    // Schedule new notification in 15 minutes
    event.waitUntil(
      scheduleNotification(data.taskId, 15 * 60 * 1000)
    );
    return;
  }

  // Default: open the app
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes("/") && "focus" in client) {
          client.navigate(data.url || "/dashboard");
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(data.url || "/dashboard");
      }
    })
  );
});

// Schedule a notification (for snooze)
async function scheduleNotification(taskId, delay) {
  // This would use the Notification Triggers API when available
  // For now, we rely on the server to reschedule
  console.log(`[SW] Snooze task ${taskId} for ${delay}ms`);
}

// Periodic background sync (for calendar updates)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "calendar-sync") {
    event.waitUntil(syncCalendarEvents());
  }
});

// Message handler for communication with main thread
self.addEventListener("message", (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CACHE_URLS":
      event.waitUntil(
        caches.open(DYNAMIC_CACHE).then((cache) => cache.addAll(payload.urls))
      );
      break;

    case "CLEAR_CACHE":
      event.waitUntil(
        caches.keys().then((names) =>
          Promise.all(names.map((name) => caches.delete(name)))
        )
      );
      break;

    case "GET_CACHE_SIZE":
      event.waitUntil(
        getCacheSize().then((size) => {
          event.source.postMessage({ type: "CACHE_SIZE", size });
        })
      );
      break;
  }
});

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}
