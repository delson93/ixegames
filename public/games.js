import {createSnake,turnSnake,stepSnake,createTank,spawnWave,stepTank,vectors} from './engine.js';
import {createRace,nextRaceLevel,stepRace,drawRace,raceLevels} from './racing.js';
import {ArcadeAudio} from './audio.js';
const sound=new ArcadeAudio();
const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d'),type=$('.game-shell').dataset.game;
let state,running=false,paused=false,last=0,acc=0,best=0,keys=new Set(),touchDir=null,touchFire=false,touchKeys=new Set();
const difficulty=()=>$('#difficulty')?.value||'normal';const bestKey=()=>`ixe-best-${type}-${type==='snake'?difficulty():'arcade'}`;
function loadBest(){try{best=Number(localStorage.getItem(bestKey())||0);}catch{best=0;}$('#best').textContent=best;}
function saveBest(){if(state.score>best){best=state.score;try{localStorage.setItem(bestKey(),String(best));}catch{}$('#best').textContent=best;}}
function soundLabel(){$('#sound').textContent=sound.muted?'Sound: off':'Sound: on';$('#sound').setAttribute('aria-pressed',String(!sound.muted));$('#sound').setAttribute('aria-label',sound.muted?'Sound disabled. Enable game audio':'Sound enabled. Mute game audio');}
soundLabel();$('#sound').onclick=()=>{sound.unlock();sound.setMuted(!sound.muted);soundLabel();canvas.focus();};
function clearInput(){keys.clear();touchKeys.clear();touchDir=null;touchFire=false;}
function fresh(){state=type==='snake'?createSnake():type==='racing'?createRace():createTank();if(type==='tank')spawnWave(state);acc=0;loadBest();updateStats();draw();}
function updateStats(){$('#score').textContent=state.score;$('#extra-stat').textContent=type==='tank'?`ARMOR ${state.armor} · WAVE ${state.wave}`:type==='racing'?`LEVEL ${state.level+1}/5 · CONDITION ${state.armor} · ${Math.floor(state.distance)}/${raceLevels[state.level].target}m`:difficulty().toUpperCase();}
function start(advance=false){sound.unlock();sound.silence();if(advance&&type==='racing'&&nextRaceLevel(state)){acc=0;updateStats();}else fresh();sound.cue('start');running=true;paused=false;clearInput();$('#overlay').hidden=true;$('#pause').disabled=false;$('#pause').textContent='Pause';if($('#difficulty'))$('#difficulty').disabled=true;$('#game-status').textContent='Game started';canvas.focus();}
function togglePause(){if(!running)return;paused=!paused;clearInput();sound.silence();if(!paused)sound.unlock();$('#pause').textContent=paused?'Resume':'Pause';$('#overlay').hidden=!paused;$('#overlay-title').textContent='Take a breather.';$('#overlay-copy').textContent='Your next move can wait.';$('#start').textContent='Resume play';$('#game-status').textContent=paused?'Game paused':'Game resumed';if(!paused)canvas.focus();}
function end(){running=false;sound.stopEngine();sound.cue(state.won?'win':'over');saveBest();clearInput();$('#overlay').hidden=false;$('#overlay-title').textContent=state.won?(type==='racing'?'Championship complete!':'Board complete!'):'One more round?';$('#overlay-copy').textContent=`You scored ${state.score}. Personal best: ${best}.`;$('#start').textContent='Play again ↗';$('#pause').disabled=true;if($('#difficulty'))$('#difficulty').disabled=false;$('#game-status').textContent=`Game over. Score ${state.score}.`;}
function completeStage(){running=false;clearInput();sound.stopEngine();sound.cue('level');saveBest();$('#overlay').hidden=false;$('#overlay-title').textContent=`Stage ${state.level+1} complete!`;$('#overlay-copy').textContent=`Next: ${raceLevels[state.level+1].name}. One condition point repaired.`;$('#start').textContent='Next stage →';$('#pause').disabled=true;$('#game-status').textContent=`Stage ${state.level+1} complete. Score ${state.score}.`; }
$('#start').onclick=()=>paused?togglePause():start(type==='racing'&&state.stageComplete&&!state.won&&state.alive);$('#restart').onclick=()=>start();$('#pause').onclick=togglePause;
$('#difficulty')?.addEventListener('change',()=>{loadBest();updateStats();});
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.game-shell').requestFullscreen();}catch{$('#game-status').textContent='Full screen is unavailable in this browser.';}};
const mapping={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const dir=mapping[e.key]||mapping[e.key.toLowerCase()];if((dir||e.code==='Space')&&running&&(document.activeElement===canvas||document.activeElement===document.body)){e.preventDefault();if(paused)return;keys.add(e.code==='Space'?'fire':dir);if(type==='snake'&&dir)turnSnake(state,dir);}if(e.key.toLowerCase()==='p'&&!e.repeat)togglePause();});
document.addEventListener('keyup',e=>{keys.delete(mapping[e.key]||mapping[e.key.toLowerCase()]);if(e.code==='Space')keys.delete('fire');});
for(const b of document.querySelectorAll('[data-dir]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!running||paused)return;touchDir=b.dataset.dir;touchKeys.add(touchDir);if(type==='snake')turnSnake(state,touchDir);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{touchKeys.delete(b.dataset.dir);if(touchDir===b.dataset.dir)touchDir=null;});}
$('#fire')?.addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touchFire=true;});for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('#fire')?.addEventListener(ev,()=>touchFire=false);
let touchStart;canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',e=>{if(type!=='snake'||!touchStart||!running||paused)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>15)turnSnake(state,Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');touchStart=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){sound.silence();if(running&&!paused)togglePause();}});window.addEventListener('blur',()=>{sound.silence();clearInput();if(running&&!paused)togglePause();});
function roundRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function tank(t,color){ctx.save();ctx.translate(t.x+15,t.y+15);ctx.rotate({up:0,right:Math.PI/2,down:Math.PI,left:-Math.PI/2}[t.dir]);roundRect(-16,-15,8,30,2,'#384352');roundRect(8,-15,8,30,2,'#384352');roundRect(-10,-13,20,26,4,color);ctx.fillStyle='#d8f9ff';ctx.fillRect(-3,-25,6,23);roundRect(-7,-7,14,14,3,color);ctx.restore();}
function draw(){if(type==='racing'){drawRace(ctx,state);return;}ctx.fillStyle=type==='snake'?'#0b1818':'#10171f';ctx.fillRect(0,0,720,540);ctx.strokeStyle=type==='snake'?'#18302a':'#1b2733';ctx.lineWidth=1;for(let x=0;x<=720;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<=540;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(720,y);ctx.stroke();}
 if(type==='snake'){if(state.food){ctx.shadowBlur=18;ctx.shadowColor='#f380b5';roundRect(state.food.x*30+6,state.food.y*30+6,18,18,6,'#ff87bd');ctx.shadowBlur=0;}state.body.forEach((p,i)=>roundRect(p.x*30+2,p.y*30+2,26,26,7,i===0?'#d5ff90':'#86d950'));const h=state.body[0],v=vectors[state.dir];ctx.fillStyle='#183423';const cx=h.x*30+15+v.x*6,cy=h.y*30+15+v.y*6;ctx.fillRect(cx+(v.y?5:-2),cy+(v.x?5:-2),4,4);ctx.fillRect(cx+(v.y?-7:-2),cy+(v.x?-7:-2),4,4);
 }else{for(const w of state.walls){roundRect(w.x+1,w.y+1,28,28,2,w.steel?'#536576':'#966247');ctx.fillStyle=w.steel?'#8092a1':'#be8869';ctx.fillRect(w.x+3,w.y+3,24,3);if(!w.steel){ctx.fillStyle='#493527';ctx.fillRect(w.x,w.y+14,30,2);ctx.fillRect(w.x+14,w.y,2,14);}}if(state.invincible===0||Math.floor(state.invincible*10)%2===0)tank(state.player,'#76d9ee');for(const e of state.enemies)tank(e,'#ee886d');for(const b of state.bullets){ctx.shadowBlur=10;ctx.shadowColor=b.enemy?'#ff816c':'#70e4ff';roundRect(b.x,b.y,6,6,2,b.enemy?'#ff816c':'#70e4ff');ctx.shadowBlur=0;}}
}
function frame(now){
 const dt=Math.min(.04,(now-last)/1000||0);last=now;
 if(running&&!paused){
  const before={score:state.score,armor:state.armor,wave:state.wave,shots:state.player?.cool};
  if(type==='snake'){
   acc+=dt;const speed=Math.max(.065,({relaxed:.2,normal:.145,fast:.1}[difficulty()])-state.score*.0003);
   if(acc>=speed){acc-=speed;stepSnake(state);if(state.score>before.score)sound.cue('eat');}
  }else if(type==='racing'){
   stepRace(state,dt,{left:touchKeys.has('left')||keys.has('left'),right:touchKeys.has('right')||keys.has('right'),accelerate:touchKeys.has('up')||keys.has('up'),brake:touchKeys.has('down')||keys.has('down')});
   sound.setEngine(state.speed);
   if(state.armor<before.armor)sound.cue('hit');else if(state.score>before.score&&!state.stageComplete)sound.cue('pass');
  }else{
   const dir=touchDir||[...keys].filter(k=>k!=='fire').at(-1);
   stepTank(state,dt,{dir,fire:keys.has('fire')||touchFire});
   if(state.player.cool>before.shots)sound.cue('shot');
   if(state.armor<before.armor)sound.cue('hit');
   if(state.score>before.score)sound.cue('destroy');
   if(state.wave>before.wave)sound.cue('level');
  }
  updateStats();saveBest();
  if(!state.alive||state.won)end();else if(type==='racing'&&state.stageComplete)completeStage();
 }
 draw();requestAnimationFrame(frame);
}
window.addEventListener('pagehide',()=>sound.silence());
fresh();requestAnimationFrame(frame);
