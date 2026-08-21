const CACHE_NAME = 'seetuads-v2';
const API_CACHE = 'seetuads-api-v2';
const MAX_CACHE_ITEMS = 50;

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const toDelete = keys.slice(0, Math.max(0, keys.length - maxItems));
  await Promise.all(toDelete.map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;
  if (request.mode === 'navigate') return;
  if (request.method !== 'GET') return;

  // API player → Network First, PAS de cache si playlist vide
  if (url.pathname.startsWith('/api/player/')) {
    e.respondWith(
      fetch(request)
        .then(async (res) => {
          if (!res.ok) {
            const cache = await caches.open(API_CACHE);
            const cached = await cache.match(request);
            return cached || res;
          }

          const cache = await caches.open(API_CACHE);
          const clone = res.clone();
          const data = await clone.json();

          // Si playlist vide → SUPPRIME du cache (pas de fallback)
          if (!data.playlist || data.playlist.length === 0) {
            await cache.delete(request);
            return res;
          }

          // Playlist non vide → met en cache
          cache.put(request, res.clone());
          trimCache(API_CACHE, MAX_CACHE_ITEMS).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(API_CACHE);
          return cache.match(request);
        })
    );
    return;
  }

  // Médias → Cache First
  if (url.pathname.match(/\.(jpg|jpeg|png|webp|gif|mp4|webm|svg)$/i)) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) {
            cache.put(request, res.clone());
            trimCache(CACHE_NAME, MAX_CACHE_ITEMS).catch(() => {});
          }
          return res;
        } catch {
          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      })
    );
    return;
  }
});