import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {loadSettings,defaults} from '../src/settings.js';
import {layout} from '../src/views.js';
test('legacy brand migrates while operator settings and custom names are preserved',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'upgames-brand-'));
 try{await writeFile(path.join(dir,'settings.json'),JSON.stringify({siteName:'ixegames',contactEmail:'owner@example.com',prismEnabled:false}));
 const s=await loadSettings(dir);assert.equal(s.siteName,'UPgames');assert.equal(s.contactEmail,'owner@example.com');assert.equal(s.prismEnabled,false);
 await writeFile(path.join(dir,'settings.json'),JSON.stringify({siteName:'Custom Arcade'}));assert.equal((await loadSettings(dir)).siteName,'Custom Arcade');
 }finally{await rm(dir,{recursive:true,force:true});}
 const html=layout(defaults,{title:'Play',description:'Free games',path:'/games/prism',origin:'https://games.upilinks.in',body:''});
 assert.match(html,/Play \| UPgames/);assert.match(html,/rel="canonical" href="https:\/\/games.upilinks.in\/games\/prism"/);assert.match(html,/site-version">V 1\.2\.0/);assert.doesNotMatch(html,/ixegames/);
});
