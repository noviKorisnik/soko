importScripts('js/version.js');
const CACHE_NAME = `soko-v${self.SOKO_VERSION}`;
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.svg',
    './css/common.css',
    './css/desktop.css',
    './css/mobile.css',
    './js/app.js',
    './js/config.js',
    './js/game.js',
    './js/parser.js',
    './js/repeater.js',
    './resources/soko.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Never cache the version file itself
    if (event.request.url.includes('js/version.js')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Update cache with fresh version
                if (networkResponse && networkResponse.status === 200) {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, cacheCopy);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fallback to cache if network fails
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});
