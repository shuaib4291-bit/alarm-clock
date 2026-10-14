const imageInput=document.getElementById('imageInput');
const previewImg=document.getElementById('previewImg');
const placeholder=document.getElementById('placeholder');
const extractBtn=document.getElementById('extractBtn');
const copyBtn=document.getElementById('copyBtn');
const clearBtn=document.getElementById('clearBtn');
const textOutput=document.getElementById('textOutput');
const languageSelect=document.getElementById('languageSelect');
const progressContainer=document.getElementById('progressContainer');
const progressFill=document.getElementById('progressFill');
const progressText=document.getElementById('progressText');
const status=document.getElementById('status');
const libStatus=document.getElementById('libStatus');
let currentImageFile=null, isProcessing=false;
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(e=>console.log(e))})}
window.addEventListener('load',()=>{let a=0;const iv=setInterval(()=>{a++;if(typeof Tesseract!=='undefined'){clearInterval(iv);libStatus.textContent='✅ OCR ইঞ্জিন প্রস্তুত';libStatus.className='lib-status ready'}else if(a>30){clearInterval(iv);libStatus.textContent='❌ লোড হয়নি! ইন্টারনেট চালু করুন';libStatus.className='lib-status error'}},500)});
function showStatus(m,t){status.textContent=m;status.className='status visible '+t;setTimeout(()=>status.classList.remove('visible'),4000)}
imageInput.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){showStatus('❌ শুধু ছবি দিন!','error');return}currentImageFile=f;const r=new FileReader();r.onload=ev=>{previewImg.src=ev.target.result;previewImg.classList.add('visible');placeholder.style.display='none';extractBtn.disabled=false;clearBtn.disabled=false;textOutput.value='';copyBtn.disabled=true;showStatus('✅ ছবি আপলোড হয়েছে!','success')};r.readAsDataURL(f)});
extractBtn.addEventListener('click',async()=>{if(!currentImageFile||isProcessing)return;if(typeof Tesseract==='undefined'){showStatus('❌ OCR লোড হয়নি!','error');return}isProcessing=true;extractBtn.disabled=true;extractBtn.textContent='⏳ প্রসেস হচ্ছে...';progressContainer.classList.add('visible');progressFill.style.width='0%';textOutput.value='';try{const r=await Tesseract.recognize(currentImageFile,languageSelect.value,{logger:m=>{const p=Math.round((m.progress||0)*100);progressFill.style.width=p+'%';progressText.textContent=m.status==='recognizing text'?'টেক্সট পড়া হচ্ছে... '+p+'%':'প্রস্তুত হচ্ছে... '+p+'%'}});const t=r.data.text.trim();if(t){textOutput.value=t;copyBtn.disabled=false;showStatus('✅ টেক্সট পাওয়া গেছে!','success')}else{textOutput.value='⚠️ কোনো টেক্সট পাওয়া যায়নি';showStatus('⚠️ টেক্সট পাওয়া যায়নি','error')}setTimeout(()=>progressContainer.classList.remove('visible'),1500)}catch(e){showStatus('❌ ত্রুটি: '+e.message,'error');progressContainer.classList.remove('visible')}finally{isProcessing=false;extractBtn.disabled=false;extractBtn.textContent='✨ টেক্সট আলাদা করুন'}});
copyBtn.addEventListener('click',async()=>{const t=textOutput.value.trim();if(!t)return;try{await navigator.clipboard.writeText(t)}catch(e){textOutput.select();document.execCommand('copy')}showStatus('📋 কপি হয়েছে!','success')});
clearBtn.addEventListener('click',()=>{imageInput.value='';currentImageFile=null;previewImg.src='';previewImg.classList.remove('visible');placeholder.style.display='block';textOutput.value='';extractBtn.disabled=true;copyBtn.disabled=true;clearBtn.disabled=true;progressContainer.classList.remove('visible');showStatus('🗑️ ক্লিয়ার হয়েছে!','info')});