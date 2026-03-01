/**
 * Service Worker for Tambola Master PWA
 * Strategy: Network-first for API calls, Cache-first for static assets.
 */

const CACHE_NAME = 'tambola-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/icon.svg',
    '/manifest.json',
];

// ─── Install: Pre-cache critical shell ──────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching app shell');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// ─── Activate: Clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ─── Fetch: Network-first with cache fallback ───────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests and chrome-extension URLs
    if (request.method !== 'GET') return;
    if (request.url.startsWith('chrome-extension://')) return;

    // Skip Firebase/Firestore real-time calls (they manage their own caching)
    if (request.url.includes('firestore.googleapis.com')) return;
    if (request.url.includes('googleapis.com/identitytoolkit')) return;

    // Skip AdSense/AdMob network calls
    if (request.url.includes('pagead2.googlesyndication.com')) return;
    if (request.url.includes('googleads.g.doubleclick.net')) return;

    // For everything else: network-first, fallback to cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone and cache successful responses
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed — serve from cache
                return caches.match(request).then((cached) => {
                    if (cached) return cached;
                    // If it's a navigation request, serve the index.html shell
                    if (request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                });
            })
    );
});
