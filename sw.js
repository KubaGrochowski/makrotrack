/* Makrotrack — service worker: aplikacja otwiera się bez internetu. Dane posiłków nie są tu przechowywane
   (są w localStorage i w Supabase; zapytania do Supabase idą zawsze do sieci). */
const VERSION = 'v3';
const CACHE = `makrotrack-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/favicon.png',
  'icons/logo.png',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('makrotrack-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Czcionki: z pamięci, w tle odświeżane.
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  if (url.origin !== location.origin) return; // Supabase i inne: zawsze sieć

  // Pliki aplikacji: najpierw sieć (zmiany docierają od razu), bez sieci z pamięci.
  e.respondWith(
    fetch(req.url, { cache: 'no-cache' }) // GitHub Pages trzyma pliki 10 min, więc zawsze pytamy serwer
      .then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return r;
      })
      .catch(async () => (await caches.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
