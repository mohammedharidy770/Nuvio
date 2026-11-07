const CACHE_NAME = 'nuvio-v16';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/layer-group.svg',
    './css/base.css?v=10',
    './css/layout.css',
    './css/components.css',
    './css/dashboard.css?v=7',
    './css/tasks-focus.css?v=3',
    './css/productivity.css',
    './css/tracking.css',
    './css/personal.css',
    './css/responsive.css?v=10',
    './css/auth.css?v=1',
    './css/motion.css?v=1',
    './css/ai-chat.css?v=2',
    './css/ai-page.css?v=7',
    './js/app.js',
    './js/supabase-config.js',
    './js/supabase-client.js',
    './js/auth.js',
    './js/cloud-sync.js?v=2',
    './js/i18n.js',
    './js/storage.js',
    './js/ui.js?v=3',
    './js/dashboard.js',
    './js/tasks.js',
    './js/focus.js?v=2',
    './js/habits.js',
    './js/tracking.js',
    './js/prayer-reports.js',
    './js/main.js',
    './js/ai-page.js?v=9'
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
