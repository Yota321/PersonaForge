/* =============================================================================
   PERSONAFORGE — SERVICE WORKER
   =============================================================================
   PersonaForge is a 100% client-side app: no backend, no accounts, no
   database, no analytics. This worker exists purely to make the app shell
   installable and usable offline. It never talks to a server, never sees a
   profile code, and never touches localStorage — all of that stays inside
   the page itself.
   ============================================================================= */

const CACHE_VERSION = "v20";

const SHELL_CACHE = `personaforge-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `personaforge-static-${CACHE_VERSION}`;
const FONT_CACHE = `personaforge-fonts-${CACHE_VERSION}`;

const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE, FONT_CACHE];

const SCOPE = self.registration.scope;
const toURL = (path) => new URL(path, SCOPE).toString();

const APP_SHELL = [
  toURL("./"),
  toURL("index.html"),
  toURL("quiz.html"),
  toURL("result.html"),
  toURL("compare.html"),
  toURL("legal.html"),
  toURL("manifest.json"),
];

const STATIC_ASSETS = [
  "css/global.css",
  "css/pages.css",
  "js/engine.js",
  "js/global.js",
  "js/home.js",
  "js/quiz.js",
  "js/compatibility.js",
  "js/result.js",
  "js/compare.js",
  "js/legal.js",
  "js/vendor/jspdf.umd.min.js",
  "assets/BG.mp3",
  "assets/Hero_Home.jpg",
  "assets/Avatar_1.jpg",
  "assets/Avatar_2.jpg",
  "assets/Avatar_3.jpg",
  "assets/Avatar_4.jpg",
  "assets/Avatar_5.jpg",
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

const STATIC_EXTENSIONS = /\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|mp3|wav|ogg|woff2?|ttf|otf|json)$/i;

const CLEAN_ROUTES = {
  quiz: "quiz.html",
  result: "result.html",
  compare: "compare.html",
  legal: "legal.html",
};

function cleanRouteShellURL(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const last = (segments[segments.length - 1] || "").toLowerCase();
  const mapped = CLEAN_ROUTES[last];
  return mapped ? toURL(mapped) : null;
}

function shouldCacheResponse(res) {
  return !!res && res.ok && res.status === 200;
}

const FONT_HOSTS = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "api.fontshare.com",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.addAll(APP_SHELL);

      const staticCache = await caches.open(STATIC_CACHE);
      await Promise.all(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((res) => (shouldCacheResponse(res) ? staticCache.put(url, res) : null))
            .catch(() => null)
        )
      );
    })()
  );
});

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

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  // Range requests can produce 206 partial responses, which Cache Storage
  // cannot store. Let those go straight to the network.
  if (request.headers.has("range")) return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

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
    if (shouldCacheResponse(fresh)) {
      await shellCache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cleanShellURL = cleanRouteShellURL(new URL(request.url).pathname);
    const cached =
      (cleanShellURL && (await shellCache.match(cleanShellURL))) ||
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
    const fresh = await fetch(request);

    if (shouldCacheResponse(fresh)) {
      await cache.put(request, fresh.clone());
    }

    return fresh;
  } catch (err) {
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((fresh) => {
      if (shouldCacheResponse(fresh)) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  return cached || (await networkFetch) || Response.error();
}
