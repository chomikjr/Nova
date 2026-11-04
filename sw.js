/* Nova OS service worker — network only (no caching), so updates are never stale.
   It exists so browsers offer "Install app". */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
