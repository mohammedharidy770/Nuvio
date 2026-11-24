const CACHE_NAME = 'nuvio-v56';
const STATIC_ASSETS = [
    './',
    './index.html',
    './ai.html',
    './manifest.json',
    './assets/layer-group.svg',
    './css/base.css?v=10',
    './css/layout.css',
    './css/components.css?v=2',
    './css/dashboard.css?v=7',
    './css/tasks-focus.css?v=4',
    './css/productivity.css',
    './css/tracking.css',
    './css/personal.css',
    './css/responsive.css?v=11',
    './css/auth.css?v=2',
    './css/motion.css?v=2',
    './css/ai-chat.css?v=3',
    './css/ai-page.css?v=14',
    './js/app.js?v=4',
    './js/supabase-config.js',
    './js/supabase-client.js',
    './js/auth.js?v=8',
    './js/cloud-sync.js?v=8',
    './js/i18n.js?v=6',
    './js/storage.js',
    './js/ui.js?v=8',
    './js/dashboard.js?v=2',
    './js/tasks.js?v=5',
    './js/focus.js?v=7',
    './js/habits.js',
    './js/tracking.js',
    './js/prayer-reports.js',
    './js/main.js?v=2',
    './js/ai-page.js?v=32'
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
