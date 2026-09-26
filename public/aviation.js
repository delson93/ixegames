import { overlap } from './engine.js?v=20260926';
export const flightLevels = [
  {name:'First Flight',rings:5,speed:340,interval:2.6,color:'#214660'},
  {name:'Island Route',rings:6,speed:385,interval:2.4,color:'#215f6a'},
  {name:'Sunset Crossing',rings:7,speed:430,interval:2.2,color:'#6e4157'},
  {name:'Mountain Air',rings:8,speed:475,interval:2,color:'#3c4d68'},
  {name:'Storm Frontier',rings:9,speed:520,interval:1.8,color:'#333951'},
  {name:'Aurora Flight',rings:10,speed:565,interval:1.6,color:'#284f57'},
];
export function createFlight(){return {player:{x:337,y:420,w:46,h:62},items:[],level:0,rings:0,score:0,armor:3,alive:true,won:false,stageComplete:false,invincible:0,ringTimer:.2,stormTimer:2,speed:340,scroll:0};}
export function nextFlightLevel(s){if(!s.stageComplete||s.won||!s.alive)return false;s.level++;s.rings=0;s.items=[];s.stageComplete=false;s.armor=Math.min(3,s.armor+1);s.invincible=1;s.ringTimer=.2;s.stormTimer=2;return true;}
export function stepFlight(s,dt,input={},random=Math.random){
 if(!s.alive||s.stageComplete||s.won)return;dt=Math.max(0,Math.min(.04,dt));const level=flightLevels[s.level];s.speed=level.speed*(input.boost?1.45:1);s.scroll=(s.scroll+s.speed*dt)%180;s.invincible=Math.max(0,s.invincible-dt);
 const dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0),norm=dx&&dy?Math.SQRT1_2:1;
 s.player.x=Math.max(10,Math.min(664,s.player.x+dx*300*dt*norm));s.player.y=Math.max(65,Math.min(468,s.player.y+dy*300*dt*norm));
 s.ringTimer-=dt;s.stormTimer-=dt;
 if(s.ringTimer<=0){s.items.push({kind:'ring',x:35+random()*540,y:-80,w:100,h:55});s.ringTimer=1.65;}
 if(s.stormTimer<=0){s.items.push({kind:'storm',x:20+random()*570,y:-160,w:115,h:66});s.stormTimer=level.interval;}
 for(const item of s.items){item.y+=s.speed*dt;if(!item.used&&overlap(s.player,item)){item.used=true;if(item.kind==='ring'){s.rings++;s.score+=100;}else if(s.invincible===0){s.armor--;s.invincible=1.5;if(s.armor<=0)s.alive=false;}}}
 s.items=s.items.filter(i=>!i.used&&i.y<610);
 if(s.alive&&s.rings>=level.rings){s.score+=500+s.armor*100;s.stageComplete=true;if(s.level===flightLevels.length-1)s.won=true;}
}
export function drawFlight(ctx,s){
 const level=flightLevels[s.level];ctx.fillStyle=level.color;ctx.fillRect(0,0,720,540);
 for(let y=-180+s.scroll;y<600;y+=180){for(const x of [40,260,560]){ctx.fillStyle='#ffffff16';ctx.beginPath();ctx.ellipse(x,y,85,24,0,0,Math.PI*2);ctx.fill();}}
 for(const item of s.items){if(item.kind==='ring'){ctx.strokeStyle='#fbe88d';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(item.x+50,item.y+27,47,24,0,0,Math.PI*2);ctx.stroke();}else{ctx.fillStyle='#222939';ctx.beginPath();ctx.ellipse(item.x+58,item.y+35,57,29,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f7c974';ctx.beginPath();ctx.moveTo(item.x+62,item.y+22);ctx.lineTo(item.x+43,item.y+43);ctx.lineTo(item.x+58,item.y+43);ctx.lineTo(item.x+48,item.y+60);ctx.lineTo(item.x+77,item.y+35);ctx.lineTo(item.x+61,item.y+35);ctx.fill();}}
 if(s.invincible===0||Math.floor(s.invincible*10)%2===0){const x=s.player.x+23,y=s.player.y;ctx.save();ctx.translate(x,y);ctx.fillStyle='#e0e9ff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(9,26);ctx.lineTo(34,43);ctx.lineTo(34,50);ctx.lineTo(7,41);ctx.lineTo(6,53);ctx.lineTo(16,60);ctx.lineTo(16,65);ctx.lineTo(0,61);ctx.lineTo(-16,65);ctx.lineTo(-16,60);ctx.lineTo(-6,53);ctx.lineTo(-7,41);ctx.lineTo(-34,50);ctx.lineTo(-34,43);ctx.lineTo(-9,26);ctx.closePath();ctx.fill();ctx.fillStyle='#71d9f5';ctx.fillRect(-4,15,8,20);ctx.fillStyle='#ffb98a';ctx.fillRect(-3,62,6,10);ctx.restore();}
 ctx.fillStyle='#101722cc';ctx.fillRect(15,15,690,35);ctx.fillStyle='#eef5ff';ctx.font='14px system-ui';ctx.fillText(`${level.name.toUpperCase()} · RINGS ${s.rings}/${level.rings}`,28,38);
}
