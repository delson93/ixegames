import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
export const defaults = {siteName:'UPgames',tagline:'Small breaks. Big plays.',contactEmail:'',operatorName:'',announcement:'Seven games. A whole arcade on the way.',tankEnabled:true,snakeEnabled:true,racingEnabled:true,bikeEnabled:true,aviationEnabled:true,fighterEnabled:true,prismEnabled:true,adsEnabled:false,publisherId:'',topSlot:'',bottomSlot:'',leftSlot:'',rightSlot:'',cmpReady:false,googleCmp:false,topImage:'',topLink:'',topAlt:'',bottomImage:'',bottomLink:'',bottomAlt:''};
const positions=['top','bottom','left','right'];
function pastedAd(code){
 const tags=code.match(/<ins\b[^>]*>/gi)||[];
 if(tags.length!==1)throw Error('Paste one standard AdSense display ad unit per placement (AMP code is not supported).');
 const tag=tags[0];
 const attribute=name=>tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`,'i'))?.[2]||'';
 if(!attribute('class').split(/\s+/).includes('adsbygoogle'))throw Error('The pasted code must contain an adsbygoogle display unit.');
 const client=attribute('data-ad-client'),slot=attribute('data-ad-slot');
 if(!/^ca-pub-\d{16}$/.test(client)||!/^\d{5,20}$/.test(slot))throw Error('The pasted ad unit needs a valid AdSense publisher and numeric slot ID.');
 return {client,slot};
}
export function validate(input) {
 const out={};
 for(const [key,value] of Object.entries(defaults)) { if(typeof value==='boolean') out[key]=input[key]===true || input[key]==='on'; else out[key]=String(input[key]??'').trim().slice(0,key==='announcement'?200:500); }
 for(const pos of positions){
  const code=String(input[pos+'AdCode']||'').trim();
  if(!code)continue;
  if(code.length>6000)throw Error('Pasted AdSense code is too long.');
  const {client,slot}=pastedAd(code);
  if(out.publisherId&&out.publisherId!==client)throw Error('The pasted AdSense publisher must match the Publisher ID.');
  out.publisherId=client;out[pos+'Slot']=slot;
 }
 if(!out.siteName || out.siteName.length>40) throw Error('Site name must contain 1 to 40 characters.');
 if(out.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.contactEmail)) throw Error('Enter a valid contact email.');
 if(out.publisherId && !/^ca-pub-\d{16}$/.test(out.publisherId)) throw Error('Publisher ID must use ca-pub- followed by 16 digits.');
 for(const pos of positions)if(out[pos+'Slot']&&!/^\d{5,20}$/.test(out[pos+'Slot']))throw Error('Ad slot IDs must be numeric.');
 for(const k of ['topImage','bottomImage','topLink','bottomLink']) if(out[k]) {let u;try{u=new URL(out[k]);}catch{throw Error('Banner URLs must be absolute HTTPS URLs.');}if(u.protocol!=='https:')throw Error('Banner URLs must use HTTPS.');}
 for(const pos of ['top','bottom']) if(out[pos+'Image']&&(!out[pos+'Link']||!out[pos+'Alt']))throw Error('Each banner needs a destination and accessible description.');
 if(out.adsEnabled&&(!out.publisherId||!out.cmpReady||!positions.some(pos=>out[pos+'Slot'])))throw Error('AdSense requires a publisher ID, an ad slot, and certified CMP confirmation.');
 return out;
}
export async function loadSettings(dir) {try{const saved=JSON.parse(await readFile(path.join(dir,'settings.json'),'utf8'));if(saved.siteName==='ixegames')saved.siteName='UPgames';return {...defaults,...saved};}catch(e){if(e.code==='ENOENT')return {...defaults};throw e;}}
export async function saveSettings(dir,settings){await mkdir(dir,{recursive:true});const tmp=path.join(dir,`settings-${crypto.randomUUID()}.tmp`);await writeFile(tmp,JSON.stringify(settings,null,2),{mode:0o600});await rename(tmp,path.join(dir,'settings.json'));}
