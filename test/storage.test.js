import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createStorage} from '../src/storage.js';
import {saveSettings,defaults} from '../src/settings.js';

test('PostgreSQL seeds legacy settings and password hash once, then retains database edits',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'upgames-storage-'));
 const state={settings:null,admin:null,queries:[]};
 class Pool{
  async query(sql,values=[]){state.queries.push([sql,values]);
   if(sql.startsWith('INSERT INTO upgames_settings'))state.settings??=JSON.parse(values[0]);
   if(sql.startsWith('INSERT INTO upgames_admin'))state.admin??={username:values[0],password_hash:values[1]};
   if(sql.startsWith('SELECT data'))return {rows:[{data:state.settings}]};
   if(sql.startsWith('SELECT username'))return {rows:state.admin?[state.admin]:[]};
   if(sql.startsWith('UPDATE upgames_settings'))state.settings=JSON.parse(values[0]);
   if(sql.startsWith('UPDATE upgames_admin'))state.admin={username:values[0],password_hash:values[1]};
   return {rows:[]};
  }
  async end(){}
 }
 try{
  await saveSettings(dir,{...defaults,siteName:'Legacy',publisherId:'ca-pub-1234567890123456',topSlot:'1234567890',adsEnabled:true,cmpReady:true,googleCmp:true});
  const env={PGDATABASE:'upgames',ADMIN_PASSWORD_HASH:'hash-only'};
  const store=await createStorage({dataDir:dir,env,Pool});
  assert.equal(store.mode,'postgres');assert.equal((await store.loadSettings()).siteName,'Legacy');
  assert.equal((await store.loadSettings()).publisherId,'ca-pub-1234567890123456');
  assert.deepEqual(await store.getAdmin(),{username:'admin',password_hash:'hash-only'});
  await store.saveSettings({...await store.loadSettings(),siteName:'DB value'});
  await store.updateAdmin('operator','changed-hash');
  const again=await createStorage({dataDir:dir,env,Pool});
  assert.equal((await again.loadSettings()).siteName,'DB value');
  assert.deepEqual(await again.getAdmin(),{username:'operator',password_hash:'changed-hash'});
  assert.equal(state.queries.filter(([sql])=>sql.startsWith('INSERT INTO upgames_admin')).length,2);
  assert.ok(state.queries.every(([sql])=>!sql.includes('hash-only')));
 }finally{await rm(dir,{recursive:true,force:true});}
});
