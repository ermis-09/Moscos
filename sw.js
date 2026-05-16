const CACHE_NAME = 'moscos-v1.1';

const CACHE_FILES = [
  '/',
  '/index.html',
  '/sinav.html',
  '/sonuc.html',
  '/admin.html',
  '/simulasyon.html',
  '/profil.html',
  '/firebase.js',
  '/css/style.css',
  '/css/admin.css',
  '/js/app.js',
  '/js/sinav.js',
  '/js/sonuc.js',
  '/js/admin.js',
  '/js/simulasyon.js',
  '/js/profil.js',
  '/data/kurullar.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

sself.addEventListener('fetch', e => {
  // Firebase ve dış istekleri atla
  if (e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('gstatic.com') ||
      e.request.url.includes('fonts.')) {
    return;
  }

  // Sadece GET isteklerini cache'le
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).catch(() => cached);
    })
  );
});

