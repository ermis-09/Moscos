/* ============================================
   SERVICE WORKER — Kurul Soru Bankası
   ============================================ */

const CACHE_NAME = 'kurul-v1';

const CACHE_FILES = [
  '/MobilSoru/',
  '/MobilSoru/index.html',
  '/MobilSoru/sinav.html',
  '/MobilSoru/sonuc.html',
  '/MobilSoru/admin.html',
  '/MobilSoru/firebase.js',
  '/MobilSoru/css/style.css',
  '/MobilSoru/css/admin.css',
  '/MobilSoru/js/app.js',
  '/MobilSoru/js/sinav.js',
  '/MobilSoru/js/sonuc.js',
  '/MobilSoru/js/admin.js',
  '/MobilSoru/data/kurullar.json'
];

// Kurulum — dosyaları cache'e al
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// Aktivasyon — eski cache'leri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — önce cache, yoksa network
self.addEventListener('fetch', e => {
  // Firebase isteklerini cache'leme
  if (e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request);
    })
  );
});
