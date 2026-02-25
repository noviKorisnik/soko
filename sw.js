const CACHE_NAME = 'soko-v1.4';
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
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
