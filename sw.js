const CACHE_NAME = 'nuvio-v64-c59865f48f';
const STATIC_ASSETS = [
    './',
    './index.html',
    './ai.html',
    './manifest.json',
    './assets/layer-group.svg',
    // build:assets
    './dist/nuvio.min.css?v=a9003f264d',
    './dist/nuvio.min.js?v=0709317f00',
    // /build:assets
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('nuvio-') && name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith((async () => {
        try {
            const response = await fetch(event.request);
            if (response.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, response.clone());
            }
            return response;
        } catch (error) {
            const cached = await caches.match(event.request);
            if (cached) return cached;

            if (event.request.mode === 'navigate') {
                const fallback = await caches.match('./index.html');
                if (fallback) return fallback;
            }
            return Response.error();
        }
    })());
});
