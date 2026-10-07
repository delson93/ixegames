import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
async function boot(overrides={},ads='enabled'){
 const scripts=[],status={textContent:''};let listener,reloads=0;
 const window={__tcfapi:(cmd,v,fn)=>{listener=fn;}};
 const context={window,document:{body:{dataset:{cmp:'enabled',ads}},querySelector:s=>s==='#consent-status'?status:null,querySelectorAll:s=>s==='.adsbygoogle'?[{},{}]:[],createElement:()=>({}),head:{append:s=>scripts.push(s)}},fetch:async()=>({json:async()=>({enabled:true,googleCmp:true,publisherId:'ca-pub-1234567890123456',...overrides})}),setInterval:()=>1,clearInterval(){},setTimeout(){},location:{reload(){reloads++;}}};
 vm.runInNewContext(source,context);await new Promise(setImmediate);
 return {window,scripts,status,consent:(tc,ok=true)=>listener(tc,ok),reloads:()=>reloads};
}
test('Google CMP bootstraps with requests paused; denial and unknown states do not request ads',async()=>{
 const s=await boot();assert.equal(s.scripts.length,1);assert.match(s.scripts[0].src,/adsbygoogle.js/);assert.equal(s.window.adsbygoogle.pauseAdRequests,1);
 s.scripts[0].onload();s.consent(null,false);assert.equal(s.window.adsbygoogle.pauseAdRequests,1);s.consent({cmpStatus:'error'});assert.equal(s.window.adsbygoogle.length,0);s.consent({eventStatus:'tcloaded'});assert.equal(s.window.adsbygoogle.length,0);
 s.consent({gdprApplies:true,eventStatus:'useractioncomplete',purpose:{consents:{}},vendor:{consents:{}}});assert.equal(s.window.adsbygoogle.pauseAdRequests,1);assert.equal(s.window.adsbygoogle.length,0);
});
test('consent permits slots once, handles non-applicable regions and pauses on withdrawal',async()=>{
 const s=await boot();s.scripts[0].onload();const yes={gdprApplies:true,eventStatus:'useractioncomplete',purpose:{consents:{1:true}},vendor:{consents:{755:true}}};s.consent(yes);s.consent(yes);assert.equal(s.window.adsbygoogle.length,2);assert.equal(s.window.adsbygoogle.pauseAdRequests,0);
 s.consent({...yes,purpose:{consents:{}}});assert.equal(s.window.adsbygoogle.pauseAdRequests,1);assert.equal(s.reloads(),1);
 const t=await boot();t.consent({gdprApplies:false});assert.equal(t.window.adsbygoogle.length,0);t.scripts[0].onload();assert.equal(t.window.adsbygoogle.length,2);
});
test('external CMP keeps Google tag absent until consent; missing config and disabled ads stay closed',async()=>{
 const s=await boot({googleCmp:false,cmpUrl:'https://cmp.example/script.js'});assert.equal(s.scripts.length,1);assert.match(s.scripts[0].src,/cmp.example/);s.consent({gdprApplies:false});assert.equal(s.scripts.length,2);
 const missing=await boot({googleCmp:false,cmpUrl:''});assert.equal(missing.scripts.length,0);
 const disabled=await boot({enabled:false});assert.equal(disabled.scripts.length,0);
});
test('Google tag is not loaded on pages without ad placements',async()=>{const s=await boot({},'disabled');assert.equal(s.scripts.length,0);s.consent({gdprApplies:false});assert.equal(s.scripts.length,0);});
