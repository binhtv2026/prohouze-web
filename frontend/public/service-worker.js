/**
 * service-worker.js — E9
 * Offline cache strategy cho ProHouzing PWA
 * Cache-First cho static, Network-First cho API, Stale-While-Revalidate cho pages
 */

const CACHE_VERSION = 'prohouzing-v2.1.0';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;
const PAGES_CACHE   = `${CACHE_VERSION}-pages`;

// Assets to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/js/main.chunk.js',
  '/static/css/main.chunk.css',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS.filter(url => !url.includes('chunk'))))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate — cleanup old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name.startsWith('prohouzing-') && !name.startsWith(CACHE_VERSION))
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin (except API)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api/')) return;

  // API calls: Network-first (fresh data), fallback to cache
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.prohouzing')) {
    event.respondWith(networkFirst(request, API_CACHE, 60 * 1000));
    return;
  }

  // Static assets (JS, CSS, images): Cache-first
  if (url.pathname.startsWith('/static/') || /\.(png|jpg|svg|woff|woff2|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, PAGES_CACHE));
});

// ─── Strategies ───────────────────────────────────────────────────────────────
async function networkFirst(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(id);

    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Offline fallback for API
    return new Response(JSON.stringify({ error: 'offline', cached: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'x-offline': 'true' },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ─── Push notification handling ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data.body = event.data.text(); }

  const options = {
    body: data.body || 'Bạn có thông báo mới từ ProHouzing',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'prohouzing-notif',
    requireInteraction: data.priority === 'critical',
    data: { url: data.url || '/', ...data },
    actions: data.actions || [
      { action: 'open', title: 'Xem ngay' },
      { action: 'dismiss', title: 'Bỏ qua' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ProHouzing', options)
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const existing = clientList.find(c => c.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.postMessage({ type: 'NAVIGATE', url });
        } else {
          clients.openWindow(url);
        }
      })
  );
});

// ─── Background sync (offline actions) ───────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Retry queued API calls from IndexedDB
  // Implementation: read from IDB → replay POST/PATCH requests
  console.log('[SW] Syncing offline actions...');
}
