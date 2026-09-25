import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
export const defaults = {siteName:'ixegames',tagline:'Small breaks. Big plays.',contactEmail:'',operatorName:'',announcement:'Three games. A whole arcade on the way.',tankEnabled:true,snakeEnabled:true,racingEnabled:true,adsEnabled:false,publisherId:'',topSlot:'',bottomSlot:'',cmpReady:false,topImage:'',topLink:'',topAlt:'',bottomImage:'',bottomLink:'',bottomAlt:''};
export function validate(input) {
 const out={};
 for(const [key,value] of Object.entries(defaults)) { if(typeof value==='boolean') out[key]=input[key]===true || input[key]==='on'; else out[key]=String(input[key]??'').trim().slice(0,key==='announcement'?200:500); }
 if(!out.siteName || out.siteName.length>40) throw Error('Site name must contain 1 to 40 characters.');
 if(out.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.contactEmail)) throw Error('Enter a valid contact email.');
 if(out.publisherId && !/^ca-pub-\d{16}$/.test(out.publisherId)) throw Error('Publisher ID must use ca-pub- followed by 16 digits.');
 for(const k of ['topSlot','bottomSlot']) if(out[k]&&!/^\d{5,20}$/.test(out[k])) throw Error('Ad slot IDs must be numeric.');
 for(const k of ['topImage','bottomImage','topLink','bottomLink']) if(out[k]) {let u;try{u=new URL(out[k]);}catch{throw Error('Banner URLs must be absolute HTTPS URLs.');}if(u.protocol!=='https:')throw Error('Banner URLs must use HTTPS.');}
 for(const pos of ['top','bottom']) if(out[pos+'Image']&&(!out[pos+'Link']||!out[pos+'Alt']))throw Error('Each banner needs a destination and accessible description.');
 if(out.adsEnabled&&(!out.publisherId||!out.cmpReady||(!out.topSlot&&!out.bottomSlot)))throw Error('AdSense requires a publisher ID, an ad slot, and certified CMP confirmation.');
 return out;
}
export async function loadSettings(dir) {try{return {...defaults,...JSON.parse(await readFile(path.join(dir,'settings.json'),'utf8'))};}catch(e){if(e.code==='ENOENT')return {...defaults};throw e;}}
export async function saveSettings(dir,settings){await mkdir(dir,{recursive:true});const tmp=path.join(dir,`settings-${crypto.randomUUID()}.tmp`);await writeFile(tmp,JSON.stringify(settings,null,2),{mode:0o600});await rename(tmp,path.join(dir,'settings.json'));}
