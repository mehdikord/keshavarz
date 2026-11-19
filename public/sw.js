/**
 * Keshavarz service worker.
 *
 * Registered as `/sw.js?v=<build id>`: every deploy changes the script URL, so
 * the browser installs a fresh worker and the page can offer an in-app update.
 *
 * Strategy (privacy first — nothing user-specific is ever stored):
 *   navigations          network-first (navigation preload) → offline page
 *   /_next/static/*      cache-first (content-hashed, immutable)
 *   images               stale-while-revalidate (bounded)
 *   fonts                cache-first (bounded)
 *   /api, /admins, RSC   never touched — straight to the network
 */

const VERSION = new URL(self.location.href).searchParams.get("v") || "0";
const PREFIX = "keshavarz";
const CACHES = {
  precache: `${PREFIX}-precache-${VERSION}`,
  static: `${PREFIX}-static`,
  images: `${PREFIX}-images`,
  fonts: `${PREFIX}-fonts`,
};
const LIMITS = { static: 300, images: 150, fonts: 20 };

const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/badge-96.png"];

const BYPASS_PREFIXES = ["/api/", "/admins", "/_next/webpack-hmr", "/__nextjs"];

/* ------------------------------------------------------------------ lifecycle */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHES.precache)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })))),
  );
  // No skipWaiting here: an update waits until the user accepts it in-app, so a
  // running session never swaps workers underneath itself.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keep = new Set(Object.values(CACHES));
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith(`${PREFIX}-`) && !keep.has(name)).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* -------------------------------------------------------------------- routing */

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;
  // React Server Component payloads are tied to a build and a session.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, CACHES.static, LIMITS.static));
    return;
  }

  if (request.destination === "font") {
    event.respondWith(cacheFirst(request, CACHES.fonts, LIMITS.fonts));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(event, CACHES.images, LIMITS.images));
  }
});

async function handleNavigation(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    const cache = await caches.open(CACHES.precache);
    return (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

function isCacheable(response) {
  return response && response.ok && response.type === "basic";
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    await cache.put(request, response.clone());
    void trim(cache, limit);
  }
  return response;
}

async function staleWhileRevalidate(event, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);

  const network = fetch(event.request)
    .then(async (response) => {
      if (isCacheable(response)) {
        await cache.put(event.request, response.clone());
        void trim(cache, limit);
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}

/** Evicts the oldest entries (insertion order) beyond `limit`. */
async function trim(cache, limit) {
  const keys = await cache.keys();
  const excess = keys.length - limit;
  if (excess > 0) {
    await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
  }
}

/* ---------------------------------------------------------------------- push */
/*
 * Ready for Web Push: the server sends JSON { title, body, url?, tag?, icon? }.
 * (Subscription + VAPID wiring lives in the app, not here.)
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() };
  }

  const title = data.title || "کشاورز";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      dir: "rtl",
      lang: "fa",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        if ("navigate" in existing && existing.url !== target) {
          await existing.navigate(target);
        }
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
