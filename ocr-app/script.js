// === এলিমেন্ট রেফারেন্স ===
const imageInput = document.getElementById('imageInput');
const previewImg = document.getElementById('previewImg');
const placeholder = document.getElementById('placeholder');
const extractBtn = document.getElementById('extractBtn');
const cropBtn = document.getElementById('cropBtn');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const textOutput = document.getElementById('textOutput');
const languageSelect = document.getElementById('languageSelect');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const status = document.getElementById('status');
const libStatus = document.getElementById('libStatus');

// History
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Crop
const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const cancelCropBtn = document.getElementById('cancelCropBtn');
const confirmCropBtn = document.getElementById('confirmCropBtn');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let currentImageFile = null;
let currentImageDataUrl = null;
let isProcessing = false;
let cropper = null;

// === Tabs ===
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tab + 'Tab').classList.add('active');
        if (tab === 'history') renderHistory();
    });
});

// === Service Worker ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(e => console.log(e));
    });
}

// === OCR Engine Check ===
window.addEventListener('load', () => {
    let attempts = 0;
    const iv = setInterval(() => {
        attempts++;
        if (typeof Tesseract !== 'undefined') {
            clearInterval(iv);
            libStatus.textContent = '✅ OCR ইঞ্জিন প্রস্তুত';
            libStatus.className = 'lib-status ready';
        } else if (attempts > 30) {
            clearInterval(iv);
            libStatus.textContent = '❌ লোড হয়নি! ইন্টারনেট চালু করুন';
            libStatus.className = 'lib-status error';
        }
    }, 500);
});

function showStatus(msg, type) {
    status.textContent = msg;
    status.className = 'status visible ' + type;
    setTimeout(() => status.classList.remove('visible'), 4000);
}

// === ছবি আপলোড ===
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showStatus('❌ শুধু ছবি দিন!', 'error');
        return;
    }
    currentImageFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
        currentImageDataUrl = ev.target.result;
        previewImg.src = ev.target.result;
        previewImg.classList.add('visible');
        placeholder.style.display = 'none';
        extractBtn.disabled = false;
        cropBtn.disabled = false;
        clearBtn.disabled = false;
        textOutput.value = '';
        copyBtn.disabled = true;
        saveBtn.disabled = true;
        showStatus('✅ ছবি আপলোড হয়েছে!', 'success');
    };
    reader.readAsDataURL(file);
});

// === ছবি ক্রপ ===
cropBtn.addEventListener('click', () => {
    if (!currentImageDataUrl) return;
    cropImage.src = currentImageDataUrl;
    cropModal.classList.add('visible');
    
    setTimeout(() => {
        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImage, {
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            background: false
        });
    }, 100);
});

cancelCropBtn.addEventListener('click', () => {
    cropModal.classList.remove('visible');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
});

confirmCropBtn.addEventListener('click', () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas();
    canvas.toBlob((blob) => {
        if (!blob) return;
        currentImageFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
        const reader = new FileReader();
        reader.onload = (ev) => {
            currentImageDataUrl = ev.target.result;
            previewImg.src = ev.target.result;
            previewImg.classList.add('visible');
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.95);
    
    cropModal.classList.remove('visible');
    cropper.destroy();
    cropper = null;
    showStatus('✂️ ছবি কাটা হয়েছে!', 'success');
});

// === টেক্সট এক্সট্রাক্ট ===
extractBtn.addEventListener('click', async () => {
    if (!currentImageFile || isProcessing) return;
    if (typeof Tesseract === 'undefined') {
        showStatus('❌ OCR লোড হয়নি!', 'error');
        return;
    }
    isProcessing = true;
    extractBtn.disabled = true;
    extractBtn.textContent = '⏳ প্রসেস হচ্ছে...';
    progressContainer.classList.add('visible');
    progressFill.style.width = '0%';
    textOutput.value = '';

    const lang = languageSelect.value;

    try {
        const r = await Tesseract.recognize(currentImageFile, lang, {
            logger: m => {
                const p = Math.round((m.progress || 0) * 100);
                progressFill.style.width = p + '%';
                if (m.status === 'recognizing text') {
                    progressText.textContent = `টেক্সট পড়া হচ্ছে... ${p}%`;
                } else if (m.status === 'loading language traineddata') {
                    progressText.textContent = `ভাষা ডেটা লোড হচ্ছে... ${p}%`;
                } else {
                    progressText.textContent = `প্রস্তুত হচ্ছে... ${p}%`;
                }
            }
        });
        const t = r.data.text.trim();
        if (t) {
            textOutput.value = t;
            copyBtn.disabled = false;
            saveBtn.disabled = false;
            showStatus('✅ টেক্সট পাওয়া গেছে!', 'success');
        } else {
            textOutput.value = '⚠️ কোনো টেক্সট পাওয়া যায়নি';
            showStatus('⚠️ টেক্সট পাওয়া যায়নি', 'error');
        }
        setTimeout(() => progressContainer.classList.remove('visible'), 1500);
    } catch (err) {
        showStatus('❌ ত্রুটি: ' + err.message, 'error');
        progressContainer.classList.remove('visible');
    } finally {
        isProcessing = false;
        extractBtn.disabled = false;
        extractBtn.textContent = '✨ টেক্সট আলাদা করুন';
    }
});

// === কপি ===
copyBtn.addEventListener('click', async () => {
    const t = textOutput.value.trim();
    if (!t) return;
    try {
        await navigator.clipboard.writeText(t);
    } catch (e) {
        textOutput.select();
        document.execCommand('copy');
    }
    showStatus('📋 কপি হয়েছে!', 'success');
});

// === সেভ (হিস্ট্রি) ===
saveBtn.addEventListener('click', () => {
    const t = textOutput.value.trim();
    if (!t) return;
    
    const history = JSON.parse(localStorage.getItem('ocrHistory') || '[]');
    const langName = languageSelect.options[languageSelect.selectedIndex].text;
    
    history.unshift({
        text: t,
        lang: langName,
        date: new Date().toLocaleString('bn-BD')
    });
    
    // সর্বোচ্চ ১০০টি সেভ
    if (history.length > 100) history.pop();
    
    localStorage.setItem('ocrHistory', JSON.stringify(history));
    showStatus('💾 হিস্ট্রিতে সেভ হয়েছে!', 'success');
});

// === ক্লিয়ার ===
clearBtn.addEventListener('click', () => {
    imageInput.value = '';
    currentImageFile = null;
    currentImageDataUrl = null;
    previewImg.src = '';
    previewImg.classList.remove('visible');
    placeholder.style.display = 'block';
    textOutput.value = '';
    extractBtn.disabled = true;
    cropBtn.disabled = true;
    copyBtn.disabled = true;
    saveBtn.disabled = true;
    clearBtn.disabled = true;
    progressContainer.classList.remove('visible');
    showStatus('🗑️ ক্লিয়ার হয়েছে!', 'info');
});

// === হিস্ট্রি ===
function renderHistory() {
    const history = JSON.parse(localStorage.getItem('ocrHistory') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">এখনো কোনো হিস্ট্রি নেই</p>';
        return;
    }
    
    historyList.innerHTML = history.map((item, i) => `
        <div class="history-item">
            <div class="history-item-header">
                <span class="history-date">📅 ${item.date}</span>
                <span class="history-lang">${item.lang}</span>
            </div>
            <div class="history-text">${escapeHtml(item.text)}</div>
            <div class="history-actions">
                <button class="history-btn history-copy" data-i="${i}" data-action="copy">📋 কপি</button>
                <button class="history-btn history-view" data-i="${i}" data-action="view">👁️ দেখুন</button>
                <button class="history-btn history-delete" data-i="${i}" data-action="delete">🗑️ মুছুন</button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

historyList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const i = parseInt(btn.dataset.i);
    const action = btn.dataset.action;
    const history = JSON.parse(localStorage.getItem('ocrHistory') || '[]');
    
    if (action === 'copy') {
        try { await navigator.clipboard.writeText(history[i].text); } catch (e) {}
        showStatus('📋 কপি হয়েছে!', 'success');
    } else if (action === 'view') {
        // OCR tab এ যান
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="ocr"]').classList.add('active');
        document.getElementById('ocrTab').classList.add('active');
        textOutput.value = history[i].text;
        copyBtn.disabled = false;
        saveBtn.disabled = false;
        showStatus('✅ হিস্ট্রি থেকে লোড হয়েছে!', 'success');
    } else if (action === 'delete') {
        if (confirm('এই হিস্ট্রি মুছে ফেলবেন?')) {
            history.splice(i, 1);
            localStorage.setItem('ocrHistory', JSON.stringify(history));
            renderHistory();
            showStatus('🗑️ মুছে ফেলা হয়েছে!', 'info');
        }
    }
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('সব হিস্ট্রি মুছে ফেলবেন?')) {
        localStorage.removeItem('ocrHistory');
        renderHistory();
        showStatus('🗑️ সব হিস্ট্রি মুছে ফেলা হয়েছে!', 'info');
    }
});