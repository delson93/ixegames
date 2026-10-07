import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrism,stepPrism,movePrism,rotatePrism,lockPrism,ghostRow,shapes,COLS,ROWS} from '../public/prism.js';
import {defaults,loadSettings} from '../src/settings.js';
import {activeGames,gamePage,adminPage} from '../src/views.js';
import {games} from '../src/content.js';
const random=()=>.25;
test('prism generates independent boards and shuffled bags containing each of eight shapes',()=>{
 const s=createPrism(random);assert.equal(s.next.length,3);assert.equal(s.board.length,ROWS);assert.equal(s.board[0].length,COLS);
 const seen=[];for(let i=0;i<8;i++){seen.push(s.piece.id);s.piece.y=ghostRow(s);lockPrism(s,random);s.board.forEach(r=>r.fill(0));}
 assert.equal(new Set(seen).size,8);s.board[0][0]=1;assert.equal(createPrism(random).board[0][0],0);
});
test('prism respects walls and floor, rotates with a wall adjustment and rejects obstructed rotation',()=>{
 const s=createPrism(random);s.piece={id:0,matrix:[[1],[1],[1],[1]],x:11,y:3};
 assert.equal(movePrism(s,1,0),false);assert.equal(rotatePrism(s),false); // four-wide bar cannot fit with two-cell adjustment
 s.piece.x=10;assert.equal(rotatePrism(s),true);assert.equal(s.piece.x,8);
 s.piece={id:2,matrix:shapes[2].map(r=>[...r]),x:4,y:5};s.board.forEach(r=>r.fill(1));const before=JSON.stringify(s.piece);assert.equal(rotatePrism(s),false);assert.equal(JSON.stringify(s.piece),before);
 s.board.forEach(r=>r.fill(0));s.piece.y=ROWS-2;assert.equal(movePrism(s,0,1),false);
});
function clearRows(s,count){s.board.forEach(r=>r.fill(0));for(let y=ROWS-count;y<ROWS;y++){s.board[y].fill(1);s.board[y][4]=0;}s.piece={id:0,matrix:Array.from({length:count},()=>[1]),x:4,y:ROWS-count};lockPrism(s,random);}
test('prism clears multiple rows, shifts surviving rows, scores combos and increases level',()=>{
 const s=createPrism(random);clearRows(s,4);assert.equal(s.lines,4);assert.equal(s.score,1200);assert.ok(s.board.every(r=>r.every(c=>c===0)));
 clearRows(s,4);assert.equal(s.level,2);assert.equal(s.score,2460);assert.equal(s.combo,2);
 s.piece.y=ghostRow(s);lockPrism(s,random);assert.equal(s.combo,0);
 const t=createPrism(random);t.board[ROWS-2][0]=3;t.board[ROWS-1].fill(1);t.board[ROWS-1][4]=0;t.piece={id:7,matrix:[[1]],x:4,y:ROWS-1};lockPrism(t,random);assert.equal(t.board[ROWS-1][0],3);
});
test('prism hard drop agrees with ghost, scores travel and does not repeat while held',()=>{
 const s=createPrism(random),y=ghostRow(s);stepPrism(s,.02,{fire:true},random);assert.equal(s.locks,1);assert.equal(s.score,y*2);
 for(let i=0;i<5;i++)stepPrism(s,.02,{fire:true},random);assert.equal(s.locks,1);
 stepPrism(s,.02,{},random);stepPrism(s,.02,{fire:true},random);assert.equal(s.locks,2);
});
test('prism rotation is edge-triggered and horizontal movement repeats after its delay',()=>{
 const s=createPrism(random);s.piece={id:0,matrix:[[1,1,1,1]],x:4,y:0};stepPrism(s,.02,{up:true},random);const matrix=JSON.stringify(s.piece.matrix);
 for(let i=0;i<5;i++)stepPrism(s,.02,{up:true},random);assert.equal(JSON.stringify(s.piece.matrix),matrix);
 const x=s.piece.x;stepPrism(s,.02,{left:true},random);assert.equal(s.piece.x,x-1);for(let i=0;i<12;i++)stepPrism(s,.02,{left:true},random);assert.ok(s.piece.x<x-1);
});
test('prism settling delay locks grounded pieces and top-out freezes the run',()=>{
 const s=createPrism(random);s.piece.y=ghostRow(s);for(let i=0;i<5;i++)stepPrism(s,.04,{},random);assert.equal(s.locks,0);for(let i=0;i<6;i++)stepPrism(s,.04,{},random);assert.equal(s.locks,1);
 s.board[0].fill(1);s.board[0][0]=0;s.piece={id:1,matrix:[[1,1],[1,1]],x:0,y:ROWS-2};lockPrism(s,random);assert.equal(s.alive,false);const snapshot=JSON.stringify(s);stepPrism(s,.04,{fire:true},random);assert.equal(JSON.stringify(s),snapshot);
});
test('prism supports admin visibility, original guide and rotate/drop touch buttons',async()=>{
 const s=await loadSettings('/tmp/ixe-prism-settings-not-present');assert.equal(s.prismEnabled,true);const g=games.find(g=>g.id==='prism');assert.ok(activeGames(defaults).includes(g));assert.ok(!activeGames({...defaults,prismEnabled:false}).includes(g));
 assert.match(gamePage(g),/Rotate clockwise/);assert.match(gamePage(g),/DROP ↓/);assert.match(adminPage(defaults,'test'),/name="prismEnabled"/);
});
