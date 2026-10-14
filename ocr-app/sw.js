const CACHE_NAME = 'ocr-app-v3';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
    'https://cdn.jsdelivr.net/npm/cropperjs@1.6.1/dist/cropper.min.js',
    'https://cdn.jsdelivr.net/npm/cropperjs@1.6.1/dist/cropper.min.css'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache).catch(e => console.log(e))));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(n => Promise.all(n.map(x => x !== CACHE_NAME ? caches.delete(x) : null)))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(c => c || fetch(e.request).then(r => {
            if (r.status === 200) {
                const cl = r.clone();
                caches.open(CACHE_NAME).then(ca => ca.put(e.request, cl));
            }
            return r;
        }).catch(() => caches.match('./index.html')))
    );
});