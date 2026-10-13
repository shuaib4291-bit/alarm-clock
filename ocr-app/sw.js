// Service Worker - সম্পূর্ণ নতুন ভার্সন
const CACHE_NAME = 'ocr-app-v2';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js'
];

// ইনস্টল
self.addEventListener('install', function(event) {
    console.log('📦 SW: ইনস্টল হচ্ছে...');
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('📦 SW: ক্যাশ খোলা হয়েছে');
            return Promise.all(
                urlsToCache.map(function(url) {
                    return cache.add(url).catch(function(err) {
                        console.log('⚠️ ক্যাশ ব্যর্থ:', url, err);
                    });
                })
            );
        })
    );
});

// অ্যাক্টিভেট
self.addEventListener('activate', function(event) {
    console.log('🚀 SW: অ্যাক্টিভেট হচ্ছে...');
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.map(function(name) {
                    if (name !== CACHE_NAME) {
                        console.log('🗑️ পুরনো ক্যাশ মুছছি:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// ফেচ - নেটওয়ার্ক আগে, ক্যাশ পরে
self.addEventListener('fetch', function(event) {
    // শুধু GET রিকোয়েস্ট হ্যান্ডেল করব
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // ভালো রেসপন্স ক্যাশে রাখি
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(function() {
                // নেটওয়ার্ক নেই - ক্যাশ থেকে দাও
                return caches.match(event.request).then(function(cached) {
                    if (cached) return cached;
                    // ক্যাশেও নেই - HTML ফেরত দাও
                    return caches.match('./index.html');
                });
            })
    );
});

// মেসেজ হ্যান্ডলিং (ডিবাগিং)
self.addEventListener('message', function(event) {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});