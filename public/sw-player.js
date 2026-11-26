const CACHE_NAME = "seetuads-player-media-v1";
const APP_CACHE_NAME = "seetuads-player-shell-v1";

let currentPlaylistUrls = [];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_PLAYER_SHELL") {
    const assets = Array.isArray(event.data.assets)
      ? event.data.assets.filter((url) => typeof url === "string")
      : [];

    event.waitUntil(cachePlayerShell(assets));
    return;
  }

  if (event.data && event.data.type === "UPDATE_PLAYLIST") {
    const urls = Array.isArray(event.data.urls)
      ? event.data.urls.filter((url) => typeof url === "string")
      : [];

    // Keep old assets until the new playlist is fully cached.
    currentPlaylistUrls = [
      ...new Set([...currentPlaylistUrls, ...urls]),
    ];

    event.waitUntil(
      (async () => {
        const allCached = await prefetchUrls(urls);

        if (allCached) {
          currentPlaylistUrls = urls;
          await cleanupOldMedia();
        }

        event.ports[0]?.postMessage({ allCached });
      })()
    );

    return;
  }

  // Retain compatibility with an already-open older player page.
  if (event.data && event.data.type === "SET_PLAYLIST_URLS") {
    currentPlaylistUrls = event.data.urls || [];
    cleanupOldMedia();
  }

  if (event.data && event.data.type === "PREFETCH_URLS") {
    event.waitUntil(prefetchUrls(event.data.urls || []));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname === "/player") {
    event.respondWith(servePlayerShell(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(serveAppAsset(request));
    return;
  }

  const isMediaFile = /\.(mp4|webm|mov|jpg|jpeg|png|webp|gif)(\?|$)/i.test(request.url);
  const isPlaylistMedia = currentPlaylistUrls.includes(request.url);

  // Exact playlist URLs also catch blob URLs without file extensions.
  if (!isMediaFile && !isPlaylistMedia) return;

  event.respondWith(serveMedia(request));
});

async function servePlayerShell(request) {
  const cache = await caches.open(APP_CACHE_NAME);
  const cacheKey = new Request(new URL("/player", self.location.origin).href);

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(cacheKey, response.clone());
    return response;
  } catch {
    const cached = await cache.match(cacheKey);
    return cached || new Response("Player non disponible hors ligne", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function serveAppAsset(request) {
  const cache = await caches.open(APP_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("Ressource player indisponible hors ligne", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cachePlayerShell(assets) {
  const cache = await caches.open(APP_CACHE_NAME);
  const shellUrl = new URL("/player", self.location.origin);
  let shellCached = false;

  try {
    const response = await fetch(new Request(shellUrl.href, { cache: "no-store" }));
    if (response.ok) {
      await cache.put(new Request(shellUrl.href), response.clone());
      shellCached = true;
    }
  } catch (error) {
    console.warn("Player shell prefetch failed:", error);
  }

  for (const assetUrl of assets) {
    try {
      const parsed = new URL(assetUrl);
      if (
        parsed.origin !== self.location.origin ||
        !parsed.pathname.startsWith("/_next/static/")
      ) continue;

      const request = new Request(parsed.href);
      if (await cache.match(request)) continue;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
    } catch (error) {
      console.warn("Player asset prefetch failed:", assetUrl, error);
    }
  }

  return shellCached;
}

async function serveMedia(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = request.url;
  const cacheKey = new Request(url, { method: "GET" });
  const rangeHeader = request.headers.get("range");
  const cached = await cache.match(cacheKey);

  if (cached) {
    if (rangeHeader && cached.type !== "opaque") {
      return makeRangeResponse(cached.clone(), rangeHeader);
    }

    return cached;
  }

  try {
    let networkRequest = request;

    // Fetch a complete video once so the service worker can cache it.
    if (rangeHeader) {
      const headers = new Headers(request.headers);
      headers.delete("range");
      networkRequest = new Request(request, {
        headers,
        cache: "no-store",
      });
    }

    const response = await fetch(networkRequest);

    if (response.status === 200) {
      try {
        await cache.put(cacheKey, response.clone());
      } catch (error) {
        console.warn("Media cache write failed:", url, error);
      }

      if (rangeHeader && response.type !== "opaque") {
        return makeRangeResponse(response, rangeHeader);
      }
    }

    return response;
  } catch (error) {
    console.warn("Media unavailable offline:", url, error);

    return new Response("Media unavailable offline", {
      status: 504,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function makeRangeResponse(response, rangeHeader) {
  const blob = await response.blob();
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);

  if (!match) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${blob.size}` },
    });
  }

  const total = blob.size;
  const requestedStart = match[1] ? Number(match[1]) : null;
  const requestedEnd = match[2] ? Number(match[2]) : null;

  let start;
  let end;

  if (requestedStart === null) {
    const suffixLength = requestedEnd ?? 0;
    start = Math.max(0, total - suffixLength);
    end = total - 1;
  } else {
    start = requestedStart;
    end = requestedEnd === null
      ? total - 1
      : Math.min(requestedEnd, total - 1);
  }

  if (start < 0 || start >= total || end < start) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }

  const chunk = blob.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ||
        blob.type ||
        "application/octet-stream",
      "Content-Length": String(chunk.size),
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
    },
  });
}

async function prefetchUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  let allCached = true;

  for (const url of urls) {
    const cacheKey = new Request(url, { method: "GET" });

    try {
      const existing = await cache.match(cacheKey);
      if (existing) continue;

      const response = await fetch(
        new Request(url, { method: "GET", cache: "no-store" })
      );

      if (response.status === 200) {
        await cache.put(cacheKey, response);
      } else {
        allCached = false;
        console.warn("Prefetch returned non-200:", url, response.status);
      }
    } catch (error) {
      allCached = false;
      console.warn("Prefetch failed:", url, error);
    }
  }

  return allCached;
}

async function cleanupOldMedia() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();

  for (const request of requests) {
    const isStillNeeded = currentPlaylistUrls.includes(request.url);

    if (!isStillNeeded) {
      await cache.delete(request);
    }
  }
                      }