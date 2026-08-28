const CACHE = 'route-tape-shell-v3';
const SHELL = ['/privacy/', '/terms/', '/offline.html', '/manifest.webmanifest', '/art/route-tape-hero.webp', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const home = await fetch('/', { cache: 'reload' });
    const html = await home.clone().text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
    await cache.put('/', home);
    await cache.addAll([...SHELL, ...builtAssets]);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const path = new URL(event.request.url).pathname;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(async () => (await caches.match(path, { ignoreSearch: true, ignoreVary: true })) || (await caches.match('/', { ignoreSearch: true, ignoreVary: true })) || caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(path, { ignoreSearch: true, ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
