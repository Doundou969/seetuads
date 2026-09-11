const CACHE_NAME = "seetuads-player-media-v1";

let currentPlaylistUrls = [];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_PLAYLIST_URLS") {
    currentPlaylistUrls = event.data.urls || [];
    cleanupOldMedia();
  }

  if (event.data && event.data.type === "PREFETCH_URLS") {
    prefetchUrls(event.data.urls || []);
  }
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  const isMediaFile = /\.(mp4|webm|mov|jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

  if (!isMediaFile) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(event.request);

        if (response && response.status === 200) {
          cache.put(event.request, response.clone());
        }

        return response;
      } catch (err) {
        return new Response("", { status: 504, statusText: "Offline and not cached" });
      }
    })
  );
});

async function prefetchUrls(urls) {
  const cache = await caches.open(CACHE_NAME);

  for (const url of urls) {
    try {
      const existing = await cache.match(url);

      if (existing) {
        continue;
      }

      const response = await fetch(url);

      if (response && response.status === 200) {
        await cache.put(url, response);
      }
    } catch (err) {
      console.warn("Prefetch echoue :", url, err);
    }
  }
}

async function cleanupOldMedia() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();

  for (const request of requests) {
    const isStillNeeded = currentPlaylistUrls.some((url) =>
      request.url.includes(url) || url.includes(request.url)
    );

    if (!isStillNeeded) {
      await cache.delete(request);
    }
  }
}