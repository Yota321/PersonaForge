/* PersonaForge service worker.
   Bump CACHE_VERSION when cached files or shell behavior changes.
   Profile data stays in localStorage; this worker only handles network responses. */

const CACHE_VERSION = "v1.0.2";

const SHELL_CACHE = `personaforge-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `personaforge-static-${CACHE_VERSION}`;
const FONT_CACHE = `personaforge-fonts-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE, FONT_CACHE];

const SCOPE = self.registration.scope;
const toURL = (path) => new URL(path, SCOPE).toString();

const APP_SHELL = [toURL("./"), toURL("index.html"), toURL("manifest.json")];

const STATIC_ASSETS = [
  "assets/BG.mp3",
  "assets/Logo_black.svg",
  "assets/Logo_white.svg",
  "assets/Logo_black_192.png",
  "assets/Logo_white_512.png",
  "assets/Icon_black.svg",
  "assets/Icon_white.svg",
  "assets/Icon_black_192.png",
  "assets/Icon_black_512.png",
  "assets/Icon_white_192.png",
  "assets/Icon_white_512.png",
  "assets/Open_Graph.png",
].map(toURL);

const STATIC_EXTENSIONS =
  /\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|mp3|wav|ogg|woff2?|ttf|otf|json)$/i;

const FONT_HOSTS = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "api.fontshare.com",
]);

// Install: cache the shell and static assets.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.addAll(APP_SHELL);

      const staticCache = await caches.open(STATIC_CACHE);
      await Promise.all(
        STATIC_ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res && res.ok && res.status === 200 && !res.headers.get("Content-Range")) {
              await staticCache.put(url, res.clone());
            }
          } catch {
            // Ignore install-time misses; runtime fetch can still cache them later.
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

// Activate: remove old caches and take control immediately.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("personaforge-") && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Optional: let the page force an update to activate.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch: navigations are network-first, static assets are cache-first.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Explicit bypass for anything that must not be intercepted.
  if (url.searchParams.has("no-cache")) return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstShell(request));
    return;
  }

  if (!isSameOrigin) {
    if (FONT_HOSTS.has(url.hostname)) {
      event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    }
    return;
  }

  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
});

async function networkFirstShell(request) {
  const shellCache = await caches.open(SHELL_CACHE);

  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && fresh.status === 200) {
      await shellCache.put(toURL("index.html"), fresh.clone());
    }
    return fresh;
  } catch {
    const cached =
      (await shellCache.match(request, { ignoreSearch: true })) ||
      (await shellCache.match(toURL("index.html")));
    if (cached) return cached;
    return Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    if (request.headers.get("range")) {
      return fetch(request);
    }

    const fresh = await fetch(request);
    if (fresh && fresh.ok && fresh.status === 200 && !fresh.headers.get("Content-Range")) {
      await cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok && fresh.status === 200) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    })
    .catch(() => null);

  return cached || (await networkFetch) || Response.error();
}
