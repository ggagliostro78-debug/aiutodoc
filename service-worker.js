// Beta does not cache pages, scripts, legal documents or API responses.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('aiutodoc-beta-')).map(k => caches.delete(k)))).then(() => self.clients.claim())));
