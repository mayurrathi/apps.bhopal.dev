/**
 * Service Worker for Tambola Master PWA
 * Version: 3.0.0
 * 
 * Strategies:
 *   - Cache First: App shell (HTML, CSS, JS, icons)
 *   - Network First: API calls, dynamic content
 *   - Stale While Revalidate: Audio files, images
 */

const CACHE_VERSION = 'tambola-v3';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const MAX_DYNAMIC_ENTRIES = 100;

// App shell — critical resources to pre-cache
const APP_SHELL = [
    '/tambola/',
    '/tambola/index.html',
    '/tambola/manifest.json',
    '/tambola/favicon.png',
    '/tambola/icon-192.png',
    '/tambola/icon-512.png',
];

// ─── Install: Pre-cache app shell ────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => {
            console.log('[SW] Pre-caching app shell v3');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// ─── Activate: Clean old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => !k.startsWith(CACHE_VERSION))
                    .map((k) => {
                        console.log('[SW] Deleting old cache:', k);
                        return caches.delete(k);
                    })
            )
        )
    );
    self.clients.claim();
});

// ─── Fetch: Strategy-based routing ───────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension, Firebase, and ad network URLs
    if (url.protocol === 'chrome-extension:') return;
    if (url.hostname.includes('firestore.googleapis.com')) return;
    if (url.hostname.includes('identitytoolkit.googleapis.com')) return;
    if (url.hostname.includes('googlesyndication.com')) return;
    if (url.hostname.includes('doubleclick.net')) return;
    if (url.hostname.includes('googleadservices.com')) return;

    // Audio files: Stale-While-Revalidate
    if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.wav') || url.pathname.endsWith('.ogg')) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Images: Stale-While-Revalidate
    if (request.destination === 'image') {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Navigation & App Shell: Network First with cache fallback
    event.respondWith(networkFirst(request));
});

// ─── Strategy: Network First ─────────────────────────────────────────────────
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
            await trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
        }
        return response;
    } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Navigation fallback to app shell
        if (request.mode === 'navigate') {
            return caches.match('/tambola/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
}

// ─── Strategy: Stale While Revalidate ────────────────────────────────────────
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then(async (response) => {
        if (response && response.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

// ─── LRU Cache Trimming ──────────────────────────────────────────────────────
async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        await cache.delete(keys[0]);
        await trimCache(cacheName, maxEntries);
    }
}
