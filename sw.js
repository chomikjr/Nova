/* Nova OS service worker.
   Everything comes from the network (so updates are never stale). The one exception:
   when a page can't load because there's no internet, it shows Nova's offline screen. */
const OFFLINE = 'nova-offline-v1';
const OFFLINE_URL = 'offline.html';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(OFFLINE).then((c) => c.addAll([OFFLINE_URL, 'assets/icons/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('nova-offline') && k !== OFFLINE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  // Only top-level page loads; games, the proxy and everything else are left alone.
  if (r.mode !== 'navigate' || r.destination !== 'document') return;
  e.respondWith(fetch(r).catch(() => caches.match(OFFLINE_URL, { cacheName: OFFLINE })));
});
