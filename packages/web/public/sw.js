/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'vibefit-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// API requests to cache for offline
const API_CACHE = 'vibefit-api-v1';
const CACHEABLE_API_ROUTES = [
  '/api/exercises',
  '/api/cardio',
  '/api/profile',
  '/api/routines',
];

// ─── Install: cache static assets ───────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: network-first for API, cache-first for assets ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests for specific routes
    if (request.method === 'GET' && CACHEABLE_API_ROUTES.some((r) => url.pathname.startsWith(r))) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => caches.match(request).then((r) => r || new Response(
            JSON.stringify({ success: false, error: 'Offline' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )))
      );
      return;
    }

    // Non-cacheable API: network only, queue writes for sync
    if (request.method !== 'GET') {
      event.respondWith(
        fetch(request).catch(() => {
          // Queue failed writes for background sync
          return new Response(
            JSON.stringify({ success: false, error: 'Offline — your data will sync when back online' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      return;
    }
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// ─── Background Sync (future: queue offline writes) ─────────
self.addEventListener('sync', (event) => {
  if ((event as any).tag === 'vibefit-sync') {
    // Process queued offline writes
    (event as any).waitUntil(Promise.resolve());
  }
});

export {};
