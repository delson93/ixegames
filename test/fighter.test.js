import test from 'node:test';
import assert from 'node:assert/strict';
import {createFighter,stepFighter,nextFighterLevel,fighterLevels} from '../public/fighter.js';
import {defaults,loadSettings} from '../src/settings.js';
import {games} from '../src/content.js';
import {gamePage,adminPage,activeGames} from '../src/views.js';
const tick=(s,input={},seconds=1)=>{for(let n=0;n<seconds*50;n++)stepFighter(s,.02,input,()=>.5);};
function airborne(){const s=createFighter();tick(s,{right:true,up:true},4);assert.equal(s.phase,'combat');return s;}
test('fighter requires runway speed, climbs into combat and holds speed on release',()=>{
 const s=createFighter();tick(s,{up:true},1);assert.equal(s.altitude,0);tick(s,{right:true,up:true},4);assert.equal(s.phase,'combat');assert.ok(s.altitude>=70);
 const speed=s.speed,alt=s.altitude;tick(s,{},.2);assert.equal(s.speed,speed);assert.equal(s.altitude,alt);tick(s,{left:true},.2);assert.ok(s.speed<speed);
 const stalled=createFighter();stalled.phase='combat';stalled.altitude=2;tick(stalled,{},.2);assert.equal(stalled.alive,false);
 const overrun=createFighter();tick(overrun,{right:true},12);assert.equal(overrun.alive,false);assert.match(overrun.failure,/Runway/);
});
test('fighter cannon cooldown, enemy destruction and approach transition',()=>{
 const s=airborne();s.enemies=[];s.spawn=100;const y=453-s.altitude;
 s.enemies.push({x:270,y:y-8,w:56,h:22,hp:2,cool:100});
 tick(s,{fire:true},.3);assert.equal(s.kills,1);assert.equal(s.score,200);assert.equal(s.shots,2);
 s.kills=fighterLevels[0].target;tick(s,{},.02);assert.equal(s.phase,'landing');assert.equal(s.enemies.length,0);assert.equal(s.bullets.length,0);assert.ok(s.landing.start>s.distance+2000);
});
test('enemy fire damages hull once during invulnerability and can end a sortie',()=>{
 const s=airborne();s.enemies=[];s.spawn=100;
 const bullet=()=>({x:165,y:453-s.altitude,w:9,h:5,vx:0,vy:0,enemy:true});
 s.bullets=[bullet(),bullet()];stepFighter(s,.02);assert.equal(s.armor,4);
 s.invincible=0;s.armor=1;s.bullets=[bullet()];stepFighter(s,.02);assert.equal(s.alive,false);
});
function approach(carrier=false){const s=createFighter(carrier?1:0);Object.assign(s,{phase:'landing',altitude:.3,speed:140,distance:1100,landing:{start:1000,end:carrier?1560:1950,carrier}});return s;}
test('runway and carrier landings require safe speed, surface and early touchdown',()=>{
 for(const carrier of [false,true]){const s=approach(carrier);stepFighter(s,.02,{down:true});assert.equal(s.phase,'rollout');tick(s,{},2);assert.equal(s.stageComplete,true);assert.equal(s.score,1500);}
 for(const changes of [{speed:190},{speed:90},{distance:800},{distance:1900},{vertical:-80,speed:200}]){const s=approach();Object.assign(s,changes);stepFighter(s,.02,{down:true});assert.equal(s.alive,false,JSON.stringify(changes));assert.equal(s.stageComplete,false);}
 const missed=approach();missed.distance=2000;missed.altitude=100;stepFighter(missed,.02);assert.equal(missed.alive,false);
});
test('a full approach is reachable from maximum altitude and cruise speed using normal controls',()=>{
 for(const carrier of [false,true]){
  const s=approach(carrier);Object.assign(s,{altitude:340,speed:380,distance:0,landing:{start:2100,end:carrier?2660:3050,carrier}});
  // Brake to approach speed, hold altitude, then time descent into the first half of the deck.
  for(let n=0;n<3000&&s.alive&&!s.stageComplete;n++){
   const down=s.distance>=2100-s.altitude/32*140+40;
   stepFighter(s,.02,{left:s.speed>140,down});
  }
  assert.equal(s.stageComplete,true,s.failure);assert.equal(s.alive,true);
 }
});
test('eight missions alternate landing surfaces, freeze when complete and preserve progress',()=>{
 const s=createFighter();assert.equal(nextFighterLevel(s),false);
 for(let i=0;i<8;i++){
  assert.equal(fighterLevels[i].carrier,i%2===1);
  Object.assign(s,{phase:'landing',altitude:.3,speed:140,distance:1100,landing:{start:1000,end:2000,carrier:i%2===1}});
  stepFighter(s,.02,{down:true});tick(s,{},2);assert.equal(s.stageComplete,true);
  const score=s.score;tick(s,{fire:true,right:true},1);assert.equal(s.score,score);
  if(i<7){s.armor=3;assert.equal(nextFighterLevel(s),true);assert.equal(s.score,score);assert.equal(s.armor,4);assert.equal(s.phase,'takeoff');assert.equal(s.speed,0);assert.equal(s.kills,0);}else{assert.equal(s.won,true);assert.equal(nextFighterLevel(s),false);}
 }
 assert.equal(createFighter().score,0);
});
test('fighter publishes with guides, touch fire, metadata and independent admin visibility',async()=>{
 assert.equal(defaults.fighterEnabled,true);const s=await loadSettings('/tmp/ixe-nonexistent-fighter-test');assert.equal(s.fighterEnabled,true);
 const game=games.find(g=>g.id==='fighter'),html=gamePage(game);assert.match(html,/aircraft carrier/);assert.match(html,/id="fire"/);assert.match(html,/aria-label="Increase speed"/);assert.match(adminPage(defaults,'test'),/name="fighterEnabled"/);
 assert.ok(activeGames(defaults).includes(game));assert.ok(!activeGames({...defaults,fighterEnabled:false}).includes(game));
});
