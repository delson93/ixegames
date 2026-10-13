import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {defaults,validate} from '../src/settings.js';
import {games} from '../src/content.js';
import {layout,gamePage,adminPage} from '../src/views.js';
const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
async function boot(overrides={},ads='enabled',placements=['top','bottom']){
 const scripts=[],status={textContent:''},units=placements.map(placement=>({dataset:{placement}}));let listener,reloads=0,resize,wide=false;
 const window={__tcfapi:(cmd,v,fn)=>{listener=fn;},matchMedia:()=>({matches:wide}),addEventListener:(event,fn)=>{if(event==='resize')resize=fn;}};
 const context={window,document:{body:{dataset:{cmp:'enabled',ads}},querySelector:s=>s==='#consent-status'?status:null,querySelectorAll:s=>s==='.adsbygoogle'?units:[],createElement:()=>({}),head:{append:s=>scripts.push(s)}},fetch:async()=>({json:async()=>({enabled:true,googleCmp:true,publisherId:'ca-pub-1234567890123456',...overrides})}),setInterval:()=>1,clearInterval(){},setTimeout(){},location:{reload(){reloads++;}}};
 vm.runInNewContext(source,context);await new Promise(setImmediate);
 return {window,scripts,status,consent:(tc,ok=true)=>listener(tc,ok),resize:()=>resize(),setWide:value=>{wide=value;},reloads:()=>reloads};
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
test('side ads initialize only on wide screens after consent, once per slot',async()=>{
 const s=await boot({},'enabled',['top','left','right','bottom']);s.scripts[0].onload();s.consent({gdprApplies:false});
 assert.equal(s.window.adsbygoogle.length,2);
 s.setWide(true);s.resize();assert.equal(s.window.adsbygoogle.length,4);
 s.resize();s.consent({gdprApplies:false});assert.equal(s.window.adsbygoogle.length,4);
 const mobile=await boot({},'enabled',['left','right']);mobile.scripts[0].onload();mobile.consent({gdprApplies:false});assert.equal(mobile.window.adsbygoogle.length,0);
 assert.equal(mobile.window.adsbygoogle.pauseAdRequests,1);
});
test('game pages omit inactive ads and retain top and bottom slots with custom banner priority',()=>{
 const render=s=>layout(s,{title:'Play',description:'Game',origin:'https://games.upilinks.in',path:'/games/tank',body:gamePage(games[0]),game:true,ads:true});
 assert.doesNotMatch(render(defaults),/class="ad-zone/);
 const enabled={...defaults,adsEnabled:true,publisherId:'ca-pub-1234567890123456',topSlot:'1234567890',bottomSlot:'9876543210'};
 const html=render(enabled);
 assert.equal((html.match(/class="ad-zone google-ad-zone"/g)||[]).length,2);
 assert.ok(html.indexOf('data-ad-slot="1234567890"')<html.indexOf('class="game-section"'));
 assert.ok(html.indexOf('data-ad-slot="9876543210"')>html.indexOf('class="game-section"'));
 const custom=render({...enabled,topImage:'https://example.com/banner.png',topLink:'https://example.com',topAlt:'Sponsor'});
 assert.equal((custom.match(/class="ad-zone google-ad-zone"/g)||[]).length,1);
 assert.match(custom,/alt="Sponsor"/);
});
test('desktop side ads flank game content; mobile and policy pages omit active side placements',()=>{
 const enabled={...defaults,adsEnabled:true,publisherId:'ca-pub-1234567890123456',topSlot:'1234567890',leftSlot:'1111111111',rightSlot:'2222222222'};
 const render=(s,ads=true)=>layout(s,{title:'Play',description:'Game',origin:'https://games.upilinks.in',path:'/games/tank',body:gamePage(games[0]),game:true,ads});
 const html=render(enabled);
 assert.match(html,/data-placement="left"[^>]*data-ad-slot="1111111111"[^>]*data-ad-format="vertical"/);
 assert.match(html,/data-placement="right"[^>]*data-ad-slot="2222222222"[^>]*data-ad-format="vertical"/);
 assert.ok(html.indexOf('data-placement="left"')<html.indexOf('class="game-section"'));
 assert.ok(html.indexOf('data-placement="right"')>html.indexOf('class="game-section"'));
 assert.doesNotMatch(render(enabled,false),/data-placement="left"/);
 assert.match(html,/style\.css\?v=20261013-four-ads/);
});
test('Admin extracts identifiers from pasted standard snippets without storing executable HTML',()=>{
 const snippet=`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"></script>
<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-1234567890123456" data-ad-slot="1357272408" data-ad-format="auto"></ins>
<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>`;
 const settings=validate({...defaults,publisherId:'',adsEnabled:'on',cmpReady:'on',topAdCode:snippet,leftAdCode:snippet});
 assert.equal(settings.publisherId,'ca-pub-1234567890123456');assert.equal(settings.topSlot,'1357272408');assert.equal(settings.leftSlot,'1357272408');
 assert.equal(Object.hasOwn(settings,'topAdCode'),false);
 assert.match(adminPage(settings,'csrf'),/name="rightAdCode"/);
 assert.throws(()=>validate({...defaults,leftAdCode:snippet,publisherId:'ca-pub-9999999999999999'}),/publisher must match/);
 assert.throws(()=>validate({...defaults,leftAdCode:'<amp-ad data-ad-slot="1234567890"></amp-ad>'}),/standard AdSense/);
 const malicious=snippet.replace('data-ad-client="ca-pub-1234567890123456"','data-ad-client="ca-pub-1234567890123456" onload="alert(1)"');
 assert.doesNotMatch(JSON.stringify(validate({...defaults,leftAdCode:malicious})),/onload|alert/);
});
