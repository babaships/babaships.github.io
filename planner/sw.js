// Capy Planner service worker. Makes the app work offline.
// Dad's plumbing: she does not edit this file in Session 1.
//
// HOW TO SHIP AN UPDATE: change CACHE_VERSION, then push.
// The iPad keeps the old files until the new worker installs.
// Open the app twice (close fully between) to see the new version.
const CACHE_VERSION = "capy-v1";

// Every file the app needs offline. If you add a file, add it here.
const FILES = [
  "./",
  "index.html",
  "manifest.json",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first. Only our own files. Only GET.
// shortcut: no network update check, so a new version needs a CACHE_VERSION bump.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === "navigate" ? caches.match("index.html") : Response.error()));
    })
  );
});
