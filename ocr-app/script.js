// === Service Worker রেজিস্ট্রেশন (উন্নত সংস্করণ) ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js', { scope: './' })
            .then(function(registration) {
                console.log('✅ Service Worker সফলভাবে রেজিস্টার:', registration.scope);
                
                // আপডেট চেক
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 নতুন সংস্করণ পাওয়া গেছে!');
                        }
                    });
                });
            })
            .catch(function(error) {
                console.error('❌ Service Worker ত্রুটি:', error);
            });
    });
}

// PWA ইনস্টল প্রম্পট
let deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
    console.log('📱 PWA ইনস্টল প্রম্পট দেখা যাচ্ছে!');
    e.preventDefault();
    deferredPrompt = e;
    
    // ইনস্টল বাটন দেখান
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', function() {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function(choice) {
                if (choice.outcome === 'accepted') {
                    console.log('✅ ইনস্টল গৃহীত');
                } else {
                    console.log('❌ ইনস্টল বাতিল');
                }
                deferredPrompt = null;
                installBtn.style.display = 'none';
            });
        });
    }
});

// ইনস্টল সম্পন্ন হলে
window.addEventListener('appinstalled', function() {
    console.log('🎉 অ্যাপ ইনস্টল হয়েছে!');
});