// Original side-view arcade flight simulation. All distances use logical game units.
import { overlap } from './engine.js?v=20260926';
export const fighterLevels = [
  {name:'First Sortie',target:3,carrier:false,interval:2.8,color:'#203e62'},
  {name:'Ocean Guardian',target:4,carrier:true,interval:2.6,color:'#194e63'},
  {name:'Desert Patrol',target:5,carrier:false,interval:2.4,color:'#624c63'},
  {name:'Fleet Defender',target:6,carrier:true,interval:2.2,color:'#263c60'},
  {name:'Alpine Strike',target:7,carrier:false,interval:2,color:'#364c67'},
  {name:'Midnight Carrier',target:8,carrier:true,interval:1.8,color:'#171f42'},
  {name:'Crimson Horizon',target:9,carrier:false,interval:1.6,color:'#623c53'},
  {name:'Ace of the Fleet',target:10,carrier:true,interval:1.4,color:'#1c364e'},
];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function createFighter(level=0){return {level,phase:'takeoff',distance:0,altitude:0,speed:0,vertical:0,armor:5,score:0,kills:0,alive:true,won:false,stageComplete:false,enemies:[],bullets:[],sparks:[],spawn:1,cool:0,shots:0,invincible:0,time:0,landing:null,failure:''};}
export function nextFighterLevel(s){
  if(!s.stageComplete||s.won||!s.alive)return false;
  const score=s.score,armor=Math.min(5,s.armor+1);
  Object.assign(s,createFighter(s.level+1),{score,armor});return true;
}
const playerBox=s=>({x:155,y:445-s.altitude,w:54,h:22});
function fail(s,message){s.alive=false;s.failure=message;}
function damage(s){if(s.invincible>0)return;s.armor--;s.invincible=1.4;if(s.armor<=0)fail(s,'Aircraft lost. Evade enemy fire and try again.');}
export function fighterStatus(s){
  if(!s.alive)return s.failure;
  if(s.stageComplete)return s.won?'All eight missions complete. Ace pilot!':'Touchdown confirmed. Mission complete!';
  if(s.phase==='takeoff')return 'TAKEOFF: hold → to accelerate, then ↑ at 130 speed.';
  if(s.speed<100)return 'STALL: hold → now to recover airspeed!';
  if(s.phase==='combat')return `COMBAT: destroy ${fighterLevels[s.level].target-s.kills} enemies. Space / FIRE shoots.`;
  if(s.phase==='rollout')return 'TOUCHDOWN: arresting gear engaged. Braking to a stop.';
  const ahead=Math.ceil(s.landing.start-s.distance);
  return `${s.landing.carrier?'CARRIER':'RUNWAY'} ${ahead>0?ahead+'m ahead':'BELOW'}: land at 100–170 speed. ↓ descends.`;
}
export function stepFighter(s,dt,input={},random=Math.random){
  if(!s.alive||s.stageComplete||s.won)return;
  dt=clamp(dt,0,.04);if(!dt)return;
  const level=fighterLevels[s.level];s.time+=dt;s.invincible=Math.max(0,s.invincible-dt);s.cool=Math.max(0,s.cool-dt);
  s.sparks=s.sparks.filter(p=>(p.life-=dt)>0);
  if(s.phase==='rollout'){
    s.speed=Math.max(0,s.speed-110*dt);s.distance+=s.speed*dt;
    if(s.distance>s.landing.end){fail(s,'Overran the landing surface. Touch down earlier.');return;}
    if(s.speed===0){s.stageComplete=true;s.score+=1000+s.armor*100;s.won=s.level===fighterLevels.length-1;}
    return;
  }
  s.speed=clamp(s.speed+((input.right?65:0)-(input.left?90:0))*dt,0,380+s.level*15);
  s.distance+=s.speed*dt;
  const airborne=s.altitude>0||s.phase!=='takeoff';
  s.vertical=(input.up?65:0)-(input.down?(s.speed<=170?32:80):0);
  if(airborne&&s.speed<100)s.vertical-=85;
  if(!airborne&&s.speed<130)s.vertical=0;
  const previousAltitude=s.altitude;
  s.altitude=clamp(s.altitude+s.vertical*dt,0,340);
  if(s.phase==='takeoff'){
    if(previousAltitude>0&&s.altitude===0){fail(s,'Takeoff aborted. Keep your speed above 130 and climb.');return;}
    if(s.altitude>=70){s.phase='combat';s.spawn=.6;}
    else if(s.distance>1800&&s.altitude<20){fail(s,'Runway ended. Accelerate, then hold ↑ to take off.');return;}
  }else if(s.altitude===0){
    const pad=s.landing;
    if(s.phase==='landing'&&pad&&s.distance>=pad.start&&s.distance<=pad.end-150&&s.speed>=100&&s.speed<=170&&s.vertical>=-45){s.phase='rollout';s.vertical=0;s.bullets=[];return;}
    fail(s,s.phase==='landing'?'Landing failed. Touch down early on the marked surface at 100–170 speed.':'Ground impact. Keep altitude and sufficient airspeed.');return;
  }
  if(s.phase==='landing'){
    if(s.distance>s.landing.end){fail(s,'Landing zone missed. Descend earlier on your next approach.');}
    return;
  }
  if(s.phase!=='combat')return;
  s.spawn-=dt;
  if(s.spawn<=0){s.enemies.push({x:770,y:120+random()*260,w:56,h:22,hp:s.level>=4?3:2,cool:1.6+random()});s.spawn=level.interval;}
  if(input.fire&&s.cool===0){s.bullets.push({x:211,y:453-s.altitude,w:16,h:4,vx:650,vy:0,enemy:false});s.cool=.19;s.shots++;}
  const player=playerBox(s);
  for(const e of s.enemies){
    e.x-=(120+s.level*10+s.speed*.16)*dt;e.cool-=dt;
    if(e.cool<=0&&e.x>player.x+60){const dx=player.x-e.x,dy=player.y-e.y,length=Math.hypot(dx,dy);const velocity=170+s.level*12;s.bullets.push({x:e.x,y:e.y+10,w:9,h:5,vx:dx/length*velocity,vy:dy/length*velocity,enemy:true});e.cool=Math.max(1,2.8-s.level*.17);}
    if(overlap(player,e)){e.hp=0;damage(s);}
  }
  for(const b of s.bullets){
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.enemy){if(overlap(b,player)){b.dead=true;damage(s);}}
    else{const e=s.enemies.find(e=>e.hp>0&&overlap(b,e));if(e){b.dead=true;e.hp--;if(e.hp===0){s.kills++;s.score+=200;s.sparks.push({x:e.x+28,y:e.y+11,life:.45});}}}
  }
  s.enemies=s.enemies.filter(e=>e.hp>0&&e.x>-80);
  s.bullets=s.bullets.filter(b=>!b.dead&&b.x>-30&&b.x<800&&b.y>50&&b.y<480);
  if(s.alive&&s.kills>=level.target){s.phase='landing';s.enemies=[];s.bullets=[];s.landing={start:s.distance+2100,end:s.distance+2100+(level.carrier?560:950),carrier:level.carrier};}
}
function polygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function jet(ctx,x,y,enemy=false,angle=0,gear=false,flame=true){
  ctx.save();ctx.translate(x,y);if(enemy)ctx.scale(-1,1);ctx.rotate(angle);
  if(flame)polygon(ctx,[[-30,-4],[-53,0],[-30,5]],'#ffbd73');
  polygon(ctx,[[-31,-6],[-23,-24],[-14,-7],[10,-7],[35,2],[16,9],[-32,7]],enemy?'#fc8c89':'#dbe8f6');
  polygon(ctx,[[-10,0],[-18,22],[16,4]],enemy?'#aa566f':'#829ab8');
  polygon(ctx,[[0,-8],[10,-14],[22,-6]],'#73e9f5');
  ctx.fillStyle='#25374c';ctx.fillRect(-28,0,15,3);
  if(gear){ctx.fillRect(-18,9,3,12);ctx.fillRect(17,8,3,13);ctx.fillRect(-22,18,10,5);ctx.fillRect(13,18,10,5);}
  ctx.restore();
}
export function drawFighter(ctx,s){
  const level=fighterLevels[s.level],carrier=s.phase==='landing'||s.phase==='rollout'?level.carrier:false;
  ctx.fillStyle=level.color;ctx.fillRect(0,0,720,540);
  ctx.fillStyle='#ffffff10';ctx.beginPath();ctx.arc(570,130,65,0,Math.PI*2);ctx.fill();
  for(let i=0;i<5;i++){const x=((i*193-s.distance*.12)%950+950)%950-100;ctx.fillStyle='#ffffff17';ctx.beginPath();ctx.ellipse(x,110+i%3*65,75,12,0,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<7;i++){const x=((i*170-s.distance*.28)%1190+1190)%1190-170;polygon(ctx,[[x,480],[x+95,320+i%3*35],[x+205,480]],'#10293e55');}
  ctx.fillStyle=carrier?'#123c56':'#263b35';ctx.fillRect(0,480,720,60);
  for(let i=0;i<12;i++){const x=((i*80-s.distance*.6)%960+960)%960-90;ctx.fillStyle=carrier?'#81cfe840':'#64867a';ctx.fillRect(x,496+i%3*12,38,2);}
  const pad=s.phase==='takeoff'?{start:0,end:1800,carrier:false}:s.landing;
  if(pad){const x=180+pad.start-s.distance,w=pad.end-pad.start;
    ctx.fillStyle=pad.carrier?'#657887':'#424e59';ctx.fillRect(x,470,w,14);
    if(pad.carrier){polygon(ctx,[[x-15,484],[x+w+30,484],[x+w-15,520],[x+45,520]],'#344e63');ctx.fillStyle='#526b80';ctx.fillRect(x+w-120,425,70,45);ctx.fillRect(x+w-100,402,9,25);}
    ctx.fillStyle='#edebc9';for(let n=20;n<w;n+=85)ctx.fillRect(x+n,474,40,3);
    ctx.fillStyle='#93f1cd';ctx.fillRect(x,466,6,9);ctx.fillRect(x+w-150,466,6,9);
    if(s.phase==='landing'){ctx.fillStyle='#93f1cd';ctx.font='13px system-ui';ctx.fillText(pad.carrier?'CARRIER DECK':'RUNWAY',clamp(x,15,600),440);}
  }
  for(const e of s.enemies)jet(ctx,e.x+28,e.y+11,true);
  for(const b of s.bullets){ctx.fillStyle=b.enemy?'#ff8b86':'#93fff0';ctx.fillRect(b.x,b.y,b.w,b.h);}
  for(const p of s.sparks){ctx.fillStyle='#ffd099';ctx.beginPath();ctx.arc(p.x,p.y,(.5-p.life)*65,0,Math.PI*2);ctx.fill();}
  if(!s.invincible||Math.floor(s.invincible*12)%2===0)jet(ctx,182,447-s.altitude,false,-s.vertical*.002,s.phase!=='combat',s.speed>10);
  ctx.fillStyle='#0b1326dc';ctx.fillRect(12,12,696,75);ctx.fillStyle='#a9f4dd';ctx.font='bold 13px system-ui';ctx.fillText(`${level.name.toUpperCase()}  /  ${s.phase.toUpperCase()}`,26,33);
  ctx.fillStyle='#edf5ff';ctx.font='14px system-ui';ctx.fillText(`SPEED ${Math.round(s.speed)}    ALT ${Math.round(s.altitude)}m    HULL ${s.armor}/5    TARGETS ${s.kills}/${level.target}`,26,57);
  ctx.fillStyle=s.speed>=100&&s.speed<=170?'#a9f4dd':'#f1c788';ctx.font='12px system-ui';ctx.fillText(s.phase==='landing'?'LANDING WINDOW: 100–170 SPEED  ·  TOUCH DOWN BEFORE LAST MARKER':'↑ CLIMB  ↓ DESCEND  → THROTTLE  ← BRAKE  SPACE FIRE',26,76);
  ctx.fillStyle='#0b1326e8';ctx.fillRect(12,508,696,26);ctx.fillStyle='#f0f5ff';ctx.font='12px system-ui';ctx.fillText(fighterStatus(s),22,525);
  if(s.phase==='landing'){const ratio=clamp((s.landing.start-s.distance)/2100,0,1);ctx.fillStyle='#93f1cd';ctx.fillRect(15,94,690*(1-ratio),3);}
}
