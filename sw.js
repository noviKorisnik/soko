const CACHE_NAME = 'soko-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.svg',
    './css/desktop.css',
    './css/mobile.css',
    './js/app.js',
    './js/config.js',
    './js/game.js',
    './js/parser.js',
    './resources/soko.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
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
