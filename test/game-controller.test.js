import {mkdtemp,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
// DOM adapter smoke test, not a substitute for real-browser visual/touch QA.
test('all seven controllers initialize, start, resize, pause, resume and restart',async()=>{
 const isolated=await mkdtemp(path.join(tmpdir(),'upgames-modules-'));
 await cp(new URL('../public/',import.meta.url),isolated,{recursive:true});
 await rm(path.join(isolated,'prism.js'));
 const saved=new Map(['document','window','localStorage','requestAnimationFrame','ResizeObserver'].map(k=>[k,globalThis[k]]));
 try{
 for(const variant of ['tank','snake','racing','bike','aviation','fighter','prism','bike-without-prism']){
  const type=variant==='bike-without-prism'?'bike':variant;
  const callbacks=new Map();let nextFrame;
  const classes=()=>{const s=new Set();return {toggle(k,v){if(v)s.add(k);else s.delete(k);},contains:k=>s.has(k)};};
  const ctx=new Proxy({},{get(o,k){return o[k]??(()=>{});},set(o,k,v){o[k]=v;return true;}});
  const elements=new Map();
  function element(id){if(!elements.has(id))elements.set(id,{dataset:{},classList:classes(),textContent:'',hidden:false,width:720,height:540,value:'normal',tagName:'BUTTON',addEventListener(){},setAttribute(){},focus(){document.activeElement=this;},getContext:()=>ctx,getBoundingClientRect:()=>({width:1200,height:900})});return elements.get(id);}
  const canvas=element('#game');canvas.tagName='CANVAS';element('.game-shell').dataset.game=type;
  globalThis.document={body:element('body'),activeElement:null,querySelector:s=>s==='#difficulty'&&type!=='snake'?null:element(s),querySelectorAll:()=>[],addEventListener:(event,cb)=>{const list=callbacks.get(event)||[];list.push(cb);callbacks.set(event,list);}};
  globalThis.window={devicePixelRatio:2,addEventListener(){}};
  globalThis.localStorage={getItem:()=>null,setItem(){}};
  globalThis.requestAnimationFrame=fn=>{nextFrame=fn;};globalThis.ResizeObserver=class{observe(){}};
  await import(variant==='bike-without-prism'?pathToFileURL(path.join(isolated,'games.js')).href:`../public/games.js?controller=${type}`);
  assert.equal(canvas.width,2400);assert.equal(canvas.height,1800);
  element('#start').onclick();assert.equal(element('#overlay').hidden,true);
  for(let i=0;i<5;i++)nextFrame(i*16);
  element('#pause').onclick();assert.equal(element('#pause').textContent,'Resume');
  element('#start').onclick();assert.equal(element('#pause').textContent,'Pause');
  element('#restart').onclick();assert.equal(element('#score').textContent,0);
  await element('#fullscreen').onclick();assert.equal(element('.game-shell').classList.contains('theater'),true);
  await element('#fullscreen').onclick();assert.equal(element('.game-shell').classList.contains('theater'),false);
 }
 }finally{await rm(isolated,{recursive:true,force:true});for(const[k,v]of saved){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
