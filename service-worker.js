const CACHE_NAME = 'aiutodoc-static-v20260628-analytics-bootstrap-1';
const ASSETS = [
  './',
  './index.html',
  './logo.jpg',
  './assets/header-sito.png',
  './assets/logo-aiutodoc.png',
  './assets/favicon-32.png',
  './assets/favicon-192.png',
  './assets/favicon-512.png',
  './assets/logo-aiutodoc-full.jpg',
  './assets/about.png',
  './assets/glossary.png',
  './assets/practices.png',
  './manifest.webmanifest',
  './privacy-policy/',
  './cookie-policy/',
  './disclaimer-medico/',
  './termini-condizioni/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(networkFirst(event.request));
});
