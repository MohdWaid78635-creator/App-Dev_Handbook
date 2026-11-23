// Offline cache. Network first, cache only as a fallback, so a deploy can never mix old and new scripts.
// Bump CACHE only when ASSETS changes (check-game.mjs checks the list matches index.html).
const CACHE = 'guide-v2';
const ASSETS = ['./', 'index.html', 'style.css', 'game.css', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png',
  'data.js', 'journey.js', 'game-data.js', 'synonyms.js', 'app.js', 'game.js', 'backup.js', 'fill.js', 'check.js', 'evidence.js',
  'myapp.js', 'facts.js', 'learn-data.js', 'search-index.js', 'help.js', 'learn.js', 'flashcards.js', 'daily.js', 'stats.js', 'moscow.js', 'stackpicker.js', 'bossfight.js', 'scorecard.js', 'tools.css', 'pwa.js',
  'playbook-data.js', 'playbook.js', 'playbook.css'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('.pdf')) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
