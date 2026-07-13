const CACHE = 'hamasla-v4';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const isHTML = e.request.mode === 'navigate' || e.request.destination === 'document';

  if (isHTML) {
    // network-first for the app shell: always try to get the latest version.
    // only fall back to cache if there's truly no connection.
    e.respondWith(
      fetch(e.request).then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // static assets (icons, manifest): cache-first is fine, they rarely change
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const resClone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, resClone));
      return res;
    }).catch(() => cached))
  );
});
