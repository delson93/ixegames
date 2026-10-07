const all=(s)=>[...document.querySelectorAll(s)];
let filter='all';
function filterGames(){let count=0;const q=document.querySelector('#game-search')?.value.toLowerCase()||'';all('[data-category]').forEach(el=>{el.hidden=!((filter==='all'||el.dataset.category===filter)&&el.dataset.name.includes(q));if(!el.hidden)count++;});const empty=document.querySelector('#no-games');if(empty)empty.hidden=count>0;}
all('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;all('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});filterGames();}));
document.querySelector('#game-search')?.addEventListener('input',filterGames);
document.querySelector('#clear-data')?.addEventListener('click',()=>{try{Object.keys(localStorage).filter(k=>k.startsWith('ixe-best-')).forEach(k=>localStorage.removeItem(k));document.querySelector('#storage-status').textContent='Saved game scores have been cleared.';}catch{document.querySelector('#storage-status').textContent='Your browser blocked access to local storage.';}});
document.querySelector('#ad-choices')?.addEventListener('click',()=>{const status=document.querySelector('#consent-status');if(typeof window.googlefc?.showRevocationMessage==='function'){window.googlefc.showRevocationMessage();status.textContent='Advertising preferences opened.';}else if(typeof window.__tcfapi==='function'){window.__tcfapi('displayConsentUi',2,()=>{});status.textContent='Opening advertising choices. If no panel appears, use your consent provider’s settings control.';}else status.textContent='Google advertising is not active on this page.';});
async function setupAds(){
 if(document.body.dataset.cmp!=='enabled')return;
 const config=await fetch('/api/ad-config').then(r=>r.json());
 if(!config.enabled||!/^ca-pub-\d{16}$/.test(config.publisherId))return;
 const status=document.querySelector('#consent-status');
 const report=message=>{if(status)status.textContent=message;};
 const queue=window.adsbygoogle=window.adsbygoogle||[];
 queue.pauseAdRequests=1;
 let tagLoaded=false,tagStarted=false,allowed=false,requested=false,subscribed=false;
 const request=()=>{
  if(!allowed||!tagLoaded||requested||document.body.dataset.ads!=='enabled')return;
  queue.pauseAdRequests=0;requested=true;
  all('.adsbygoogle').forEach(()=>{try{queue.push({});}catch{report('An ad slot could not initialize.');}});
 };
 const loadTag=()=>{
  if(tagStarted||document.body.dataset.ads!=='enabled')return;
  tagStarted=true;
  const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';
  script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(config.publisherId);
  script.onload=()=>{tagLoaded=true;request();};
  script.onerror=()=>report('Advertising script unavailable or blocked.');
  document.head.append(script);
 };
 const subscribe=()=>{
  if(subscribed||typeof window.__tcfapi!=='function')return;
  subscribed=true;clearInterval(timer);
  window.__tcfapi('addEventListener',2,(tc,ok)=>{
   if(!ok||!tc||tc.cmpStatus==='error'){allowed=false;queue.pauseAdRequests=1;report('Consent unavailable. Advertising remains paused.');return;}
   if(tc.gdprApplies!==false&&!['tcloaded','useractioncomplete'].includes(tc.eventStatus))return;
   allowed=tc.gdprApplies===false||(tc.gdprApplies===true&&!!tc.purpose?.consents?.[1]&&!!tc.vendor?.consents?.[755]);
   if(allowed){report('Advertising consent checked.');loadTag();request();}
   else{queue.pauseAdRequests=1;report('Optional advertising is paused.');if(requested)location.reload();}
  });
 };
 const timer=setInterval(subscribe,250);
 setTimeout(()=>{clearInterval(timer);if(!subscribed)report('Consent service unavailable. Advertising remains paused.');},15000);
 if(config.googleCmp){
  // The AdSense tag bootstraps Google's published message. Pause before loading it.
  // Do not load this tag on policy/admin/error pages where ads are prohibited.
  window.googlefc=window.googlefc||{};window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];
  window.googlefc.callbackQueue.push({CONSENT_API_READY:subscribe});
  loadTag();
 }else{
  if(!config.cmpUrl){clearInterval(timer);report('Consent provider is not configured.');return;}
  const cmp=document.createElement('script');cmp.src=config.cmpUrl;cmp.async=true;
  cmp.onerror=()=>report('Consent service unavailable. Advertising remains paused.');
  document.head.append(cmp);
 }
 subscribe();
}
setupAds().catch(()=>{const status=document.querySelector('#consent-status');if(status)status.textContent='Advertising configuration could not load.';});
