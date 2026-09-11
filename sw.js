// Minimal PWA service worker: makes the member environment installable and
// gives it an offline shell. Deliberately conservative — it only caches
// static assets (HTML/CSS/JS/images) and never touches anything that must
// always be fresh: Netlify Functions (auth, entitlements, downloads),
// /content/*.json (CMS-edited copy and pricing), or /admin.
const CACHE_VERSION = 'collab-shell-v2';

const SHELL_ASSETS = [
  '/pages/account.html',
  '/pages/library.html',
  '/css/base.css',
  '/css/member-console.css',
  '/css/library.css',
  '/js/main.js',
  '/js/account.js',
  '/js/library.js',
  '/manifest.webmanifest',
  '/assets/img/logo-mark.png',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.svg',
];

const BYPASS_PATTERNS = [/^\/\.netlify\/functions\//, /^\/content\//, /^\/admin/];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (BYPASS_PATTERNS.some((re) => re.test(url.pathname))) return; // always network, never cached

  // Cache-first for the static shell, falling back to network (and caching
  // the result) for anything else same-origin — e.g. other pages a member
  // visits, so the site still works offline after the first load.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match('/pages/account.html'));
    })
  );
});
