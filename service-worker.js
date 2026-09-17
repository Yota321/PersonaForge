/* =============================================================================
   PERSONAFORGE — SERVICE WORKER
   =============================================================================
   PersonaForge is a 100% client-side app: no backend, no accounts, no
   database, no analytics. This worker exists purely to make the app shell
   installable and usable offline. It never talks to a server, never sees a
   profile code, and never touches localStorage — all of that stays inside
   the page itself.

   Strategy summary:
     - HTML / navigations  -> Network First  (always try to serve the latest
                               app, fall back to the cached shell offline)
     - Static app assets   -> Cache First    (icons, css, js, fonts, audio,
                               images — content-hashed or rarely-changing,
                               so a cache hit is safe and fast)
     - Cross-origin fonts  -> Stale While Revalidate (serve instantly from
                               cache, refresh quietly in the background)
     - Anything else       -> left alone, untouched by this worker

   Portability — nothing in this file assumes a repo name, branch, or
   hosting path. `SCOPE` (below) is read from `self.registration.scope`,
   which the browser sets to wherever this worker was actually registered
   from (a GitHub Pages project subpath like "/PersonaForge/", a user/org
   page at the domain root, or a custom domain — all work unchanged). If
   the repo is renamed, forked, or moved to a custom domain, this file
   does not need to be touched.

   GitHub Pages routing — GitHub Pages has no server-side routing, so a
   direct visit to a "deep" URL (e.g. a shared "/Name-PF2-xxxx" profile
   link) would normally 404. The repo's 404.html handles that case by
   redirecting back to this app's scope with the route folded into
   "?code=" (see 404.html for details) — this worker only ever sees
   ordinary navigations to the scope root after that redirect happens,
   so its Network-First shell logic doesn't need any special-casing for it.
   ============================================================================= */

/* -----------------------------------------------------------------------
   CACHE VERSIONING — the only thing you should need to touch when the
   app shell or its cached asset list changes.

   Bump CACHE_VERSION (e.g. "v1" -> "v2") whenever:
     - APP_SHELL or STATIC_ASSETS below gains, loses, or renames an entry
     - index.html, manifest.json, or any cached asset's *content* changes
       in a way that isn't already reflected by a new filename
     - the caching strategy itself changes in a way old caches wouldn't
       reflect

   You do NOT need to bump it for:
     - server-side/content changes to things this worker never caches
       (there are none — everything client-side is covered above)

   Bumping the constant changes every derived cache name at once (see
   CURRENT_CACHES below), which makes the *next* activate event delete
   every cache from the old version automatically — see the "activate"
   handler further down. Combined with skipWaiting()/clients.claim(),
   this is what stops a returning visitor from ever getting stuck on a
   stale app shell: the moment a new worker installs, it takes over and
   clears the old caches, rather than waiting for every tab to close.
   ----------------------------------------------------------------------- */
const CACHE_VERSION = "v1.0.0";

const SHELL_CACHE = `personaforge-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `personaforge-static-${CACHE_VERSION}`;
const FONT_CACHE = `personaforge-fonts-${CACHE_VERSION}`;

// Every cache this version of the worker owns. Anything else found on
// activate belongs to an older version and gets deleted.
const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE, FONT_CACHE];

/* -----------------------------------------------------------------------
   UPDATE FLOW — a freshly installed worker no longer calls skipWaiting()
   itself (see "install" below). Instead it sits in the "waiting" state,
   which is what lets the page detect it and show a "new version
   available" toast (see global.js's service worker registration block)
   instead of silently swapping the app out from under an open tab. Two
   ways a waiting worker actually takes over:
     1. The user clicks "Refresh" in that toast -> the page postMessages
        "SKIP_WAITING" to it (handled below) -> it activates -> the page
        reloads once control changes.
     2. Every tab is closed/navigated away without clicking Refresh -> the
        browser activates the waiting worker on its own the next time the
        app is opened. No extra code needed for this part; it's the
        platform's default behavior once skipWaiting() isn't called early.
   ----------------------------------------------------------------------- */

/* -----------------------------------------------------------------------
   SCOPE — resolved at runtime from the browser itself, never hardcoded.
   This is what makes the whole file portable: `self.registration.scope`
   is always the actual directory this worker was registered from,
   whatever that happens to be (GitHub Pages project subpath, a user/org
   page at the root, or a custom domain). `toURL()` just resolves a
   scope-relative path against it, so every cached URL below is correct
   no matter where the app is deployed.
   ----------------------------------------------------------------------- */
const SCOPE = self.registration.scope;
const toURL = (path) => new URL(path, SCOPE).toString();

// The app shell: the minimum needed to boot the app with zero network.
// Every page is now a real, separately-navigable document (see the
// multi-file refactor), so each one is listed here rather than relying on
// a single index.html to stand in for the whole app.
const APP_SHELL = [
  toURL("./"),
  toURL("index.html"),
  toURL("quiz.html"),
  toURL("result.html"),
  toURL("compare.html"),
  toURL("legal.html"),
  toURL("manifest.json"),
];

/* -----------------------------------------------------------------------
   STATIC ASSET MANIFEST — the single place to edit when a shared/page CSS
   or JS file, or an icon/branding asset, is added, renamed, or removed.
   Every page-specific css/js file is listed here too (not just the ones
   shared across all pages) because APP_SHELL above precaches every page's
   HTML on install, and that HTML is useless offline without its own
   stylesheet and script also already being cached — nothing fetches a
   document's own <link>/<script> tags just by precaching the document
   itself. Nothing else in this file (or manifest.json / 404.html)
   duplicates these strings by hand — each references its own copy of the
   filenames it needs. Cached opportunistically on install so the very
   first visit already primes the offline experience; an entry missing
   from this list is still picked up on first request by the runtime
   cache-first handler below, so the list doesn't need to be perfectly
   exhaustive to keep the app working, only to keep it working *offline
   before that first request has happened*.
   ----------------------------------------------------------------------- */
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
  // Vendored (never CDN-loaded, see js/result.js's loadJsPDF()) so "Save
  // as PDF" keeps working offline even on its very first use — without
  // this, an offline visitor who'd never clicked it online yet would hit
  // a network error the moment result.js tries to inject this <script>.
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

// File extensions treated as long-lived static assets (cache-first).
const STATIC_EXTENSIONS = /\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|mp3|wav|ogg|woff2?|ttf|otf|json)$/i;

/* -----------------------------------------------------------------------
   CLEAN URLS — quiz.html/result.html/compare.html/legal.html are also
   reachable at extensionless paths ("/quiz", "/result", ...): each page
   rewrites its own address bar to that form on load (see global.js's
   useCleanURL()), and 404.html redirects a direct/refreshed load of one
   of those paths back to the real .html file. Neither of those two
   pieces run when there's no network at all, so this worker needs its
   own tiny copy of the same route map purely for the OFFLINE case:
   without it, a navigation whose URL is already the clean form (a
   bookmark, or a refresh after the address bar was already rewritten)
   would miss the cache lookup below (which is keyed by the real
   "quiz.html" URL from APP_SHELL) and silently fall back to the index
   shell instead of the page actually being asked for. Every other file
   that knows about these routes keeps its own copy the same way
   STATIC_ASSETS above does for filenames — nothing here is shared code.
   ----------------------------------------------------------------------- */
const CLEAN_ROUTES = { quiz: "quiz.html", result: "result.html", compare: "compare.html", legal: "legal.html" };
function cleanRouteShellURL(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const last = (segments[segments.length - 1] || "").toLowerCase();
  const mapped = CLEAN_ROUTES[last];
  return mapped ? toURL(mapped) : null;
}

// Cross-origin hosts the app pulls webfonts from (see index.html <head>).
const FONT_HOSTS = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "api.fontshare.com",
]);

/* -------------------------------------------------------------------------
   INSTALL
   Pre-cache the app shell and known static assets. Deliberately does NOT
   call skipWaiting() here — see the "UPDATE FLOW" comment above. A newly
   installed worker (when an older one is already controlling the page)
   sits in the "waiting" state until the page tells it to take over, so
   the update toast has something real to offer before the swap happens.
   ------------------------------------------------------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.addAll(APP_SHELL);

      const staticCache = await caches.open(STATIC_CACHE);
      // Cache assets individually rather than via addAll() so a single
      // missing/renamed file doesn't fail the entire install step.
      await Promise.all(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((res) => (res && res.ok ? staticCache.put(url, res) : null))
            .catch(() => null)
        )
      );
    })()
  );
});

/* -------------------------------------------------------------------------
   ACTIVATE
   Clean up any cache left behind by a previous CACHE_VERSION, then
   clients.claim() so this worker starts controlling already-open tabs
   right away instead of only on their next load.
   ------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------
   Optional message hook: lets the page force an already-installed,
   waiting worker to activate immediately (a common "Update available,
   tap to refresh" UX pattern). Entirely opt-in — the page doesn't have to
   send this for the worker to function normally.
   ------------------------------------------------------------------------- */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* -------------------------------------------------------------------------
   FETCH
   Routes every same-origin GET request to a strategy. Non-GET requests
   (there are none in this app — no backend to POST to) and cross-origin
   requests outside the known font hosts are left untouched and go
   straight to the network, unintercepted.
   ------------------------------------------------------------------------- */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Non-GET requests are left untouched. PersonaForge has no backend to
  // POST to, so in practice this branch never fires — it's here so the
  // worker fails safe rather than by omission if that ever changes.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Why profile data is never cached here, structurally rather than by
  // convention: this worker only intercepts *network requests* (the
  // fetch event) and stores responses in the Cache Storage API. Profile
  // codes, quiz answers, and comparison results all live in
  // localStorage, which this worker never reads, writes, or has access
  // to — there is no code path here that could cache them even by
  // accident. The line below is an explicit escape hatch on top of that:
  // any request tagged "?no-cache" is passed straight to the network,
  // untouched, for anything that should never be intercepted at all.
  if (url.searchParams.has("no-cache")) return;

  // --- 1. Navigations & HTML: Network First -----------------------------
  // Always prefer the freshest app shell. A profile code arrives as
  // ?code=... or a trailing path segment (see index.html's
  // getProfileCodeFromURL / 404.html's redirect) — none of that affects
  // which shell document we serve, so cache lookups ignore the query
  // string and just fall back to the one cached shell document.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstShell(request));
    return;
  }

  if (!isSameOrigin) {
    // --- 2. Cross-origin webfonts: Stale While Revalidate ---------------
    if (FONT_HOSTS.has(url.hostname)) {
      event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    }
    // Any other cross-origin request (there shouldn't be any) is left
    // alone entirely.
    return;
  }

  // --- 3. Same-origin static assets: Cache First -------------------------
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Anything same-origin and unrecognized falls through to the network
  // untouched rather than being force-fit into a caching strategy.
});

/* -------------------------------------------------------------------------
   STRATEGIES
   ------------------------------------------------------------------------- */

// Network First, used for the HTML document / navigations. Each page is
// cached under its own URL (index.html, result.html, compare.html, ...)
// rather than everything collapsing onto one shell key, since the app is
// now several real documents, not one SPA standing in for all routes.
// Falls back to the specific page's cached copy when offline (matched by
// ignoring query/hash, so a deep link like "?code=Name-PF2-xxxx" or a path
// restored by 404.html still boots the right page), and as a last resort
// to the cached index.html shell for a page that was never visited online.
async function networkFirstShell(request) {
  const shellCache = await caches.open(SHELL_CACHE);

  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      shellCache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    // A clean-URL navigation ("/quiz") is matched to its real cached
    // page (see CLEAN_ROUTES above) before the generic ignoreSearch
    // lookup, which is keyed by the literal .html URL and would never
    // match "/quiz" on its own.
    const cleanShellURL = cleanRouteShellURL(new URL(request.url).pathname);
    const cached =
      (cleanShellURL && (await shellCache.match(cleanShellURL))) ||
      (await shellCache.match(request, { ignoreSearch: true })) ||
      (await shellCache.match(toURL("index.html")));
    if (cached) return cached;
    // No network and nothing cached yet — nothing more we can do.
    return Response.error();
  }
}

// Cache First, used for static, rarely-changing assets. A cache hit is
// served instantly with no network round trip; a miss is fetched, cached
// for next time, and returned.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    // Offline and never cached — let the browser surface its normal
    // network-error handling for this asset.
    return Response.error();
  }
}

// Stale While Revalidate, used for cross-origin webfonts: return the
// cached version immediately if we have one (fonts rarely change), while
// quietly fetching an update in the background for next time.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  return cached || (await networkFetch) || Response.error();
}
