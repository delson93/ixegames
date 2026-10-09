import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {scryptSync} from 'node:crypto';
const dir=await mkdtemp(path.join(tmpdir(),'ixe-test-'));process.env.DATA_DIR=dir;
process.env.SITE_URL='http://localhost:3000';const salt='ab'.repeat(16),password='test-passphrase-very-long';process.env.ADMIN_PASSWORD_HASH=salt+':'+scryptSync(password,salt,64).toString('hex');
const {server}=await import('../server.js');let base,cookie,csrf;
before(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;});
after(async()=>{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});});
const post=(url,data,extra={})=>fetch(base+url,{method:'POST',redirect:'manual',headers:{origin:'http://localhost:3000','content-type':'application/x-www-form-urlencoded',...(cookie?{cookie}:{}),...extra},body:new URLSearchParams(data)});
test('public pages render HTML, descriptions, canonicals and no ad scripts by default',async()=>{for(const p of ['/','/games/tank','/games/snake','/games/racing','/games/bike','/games/aviation','/games/fighter','/games/prism','/about','/contact','/privacy','/terms','/cookies','/accessibility']){const r=await fetch(base+p);assert.equal(r.status,200,p);const html=await r.text();assert.match(html,/<h1>/);assert.match(html,/rel="canonical"/);assert.match(html,/name="description"/);assert.doesNotMatch(html,/<script[^>]+pagead2/);}assert.equal((await fetch(base+'/missing')).status,404);});
test('admin requires authentication and same-origin requests',async()=>{assert.equal((await post('/admin/settings',{})).status,401);assert.equal((await post('/admin/login',{password},{origin:'https://evil.example'})).status,403);assert.equal((await post('/admin/login',{username:'admin',password},{origin:'https://games.upilinks.in'})).status,303);cookie=(await post('/admin/login',{password})).headers.get('set-cookie').split(';')[0];assert.match(cookie,/ixe_session=/);assert.match((await fetch(base+'/admin',{headers:{cookie}})).headers.get('cache-control'),/no-store/);const html=await fetch(base+'/admin',{headers:{cookie}}).then(r=>r.text());csrf=html.match(/name="csrf" value="([a-f0-9]+)"/)[1];assert.ok(csrf);});
test('Google CMP settings save without a separate loader but external CMP requires one',async()=>{
 const fields={csrf,siteName:'UPgames',adsEnabled:'on',cmpReady:'on',publisherId:'ca-pub-1234567890123456',topSlot:'1234567890'};
 assert.equal((await post('/admin/settings',fields)).status,400);
 assert.equal((await post('/admin/settings',{...fields,googleCmp:'on'})).status,303);
 const config=await fetch(base+'/api/ad-config').then(r=>r.json());assert.equal(config.enabled,true);assert.equal(config.googleCmp,true);assert.equal(config.cmpUrl,'');
});
test('admin CSRF protection, persistence, escaping, visibility and logout',async()=>{assert.equal((await post('/admin/settings',{csrf:'bad'})).status,403);const r=await post('/admin/settings',{csrf,siteName:'<script>alert(1)</script>',contactEmail:'hello@example.com',snakeEnabled:'on',announcement:'More games soon'});assert.equal(r.status,303);const html=await fetch(base+'/').then(r=>r.text());assert.match(html,/&lt;script&gt;alert/);assert.doesNotMatch(html,/<script>alert/);assert.equal((await fetch(base+'/games/tank')).status,404);assert.equal((await fetch(base+'/games/racing')).status,404);assert.equal((await fetch(base+'/games/bike')).status,404);assert.equal((await fetch(base+'/games/aviation')).status,404);assert.equal((await fetch(base+'/games/fighter')).status,404);assert.equal((await fetch(base+'/games/prism')).status,404);const sitemap=await fetch(base+'/sitemap.xml').then(r=>r.text());assert.doesNotMatch(sitemap,/games\/prism/);assert.doesNotMatch(sitemap,/games\/fighter/);assert.doesNotMatch(sitemap,/games\/tank/);assert.doesNotMatch(sitemap,/games\/racing/);const persisted=JSON.parse(await (await import('node:fs/promises')).readFile(path.join(dir,'settings.json'),'utf8'));assert.equal(persisted.tankEnabled,false);assert.equal(persisted.snakeEnabled,true);assert.equal((await post('/admin/logout',{csrf})).status,303);assert.equal((await post('/admin/settings',{csrf})).status,401);});
test('password attempts are rate limited',async()=>{for(let i=0;i<5;i++)assert.equal((await post('/admin/login',{password:'wrong'})).status,401);assert.equal((await post('/admin/login',{password})).status,429);});

test('all browser modules including versioned URLs have JavaScript MIME types',async()=>{
 for(const name of ['app','games','engine','audio','racing','aviation','fighter','prism']){
  for(const method of ['GET','HEAD']){
   const r=await fetch(`${base}/${name}.js?v=20261007-upgames`,{method});
   assert.equal(r.status,200,name);assert.match(r.headers.get('content-type'),/^text\/javascript/);
   assert.equal(r.headers.get('cache-control'),'no-cache');
   if(method==='GET')assert.doesNotMatch(await r.text(),/^\s*<!doctype html/i);
  }
 }
 const r=await fetch(base+'/missing.js?v=1');assert.equal(r.status,404);assert.match(r.headers.get('content-type'),/^text\/plain/);
});
