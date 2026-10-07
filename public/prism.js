// Prism Stack: original falling-polyomino puzzle with an eight-shape bag.
export const COLS=12,ROWS=18;
export const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0],[1,1]]];
const colors=['#bba2ff','#f9ca80','#81e5c4','#ef9dbb','#81baff','#dbe993','#f49a80','#89dce8'];
function pick(s,random){if(!s.bag.length){s.bag=shapes.map((_,i)=>i);for(let i=s.bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[s.bag[i],s.bag[j]]=[s.bag[j],s.bag[i]];}}return s.bag.pop();}
export function fitsPrism(s,matrix,x,y){return matrix.every((row,j)=>row.every((cell,i)=>!cell||(x+i>=0&&x+i<COLS&&y+j<ROWS&&(y+j<0||!s.board[y+j][x+i]))));}
function spawn(s,random){const id=s.next.shift();s.next.push(pick(s,random));const matrix=shapes[id].map(r=>[...r]);s.piece={id,matrix,x:Math.floor((COLS-matrix[0].length)/2),y:0};s.fall=0;s.lock=0;s.resets=0;if(!fitsPrism(s,matrix,s.piece.x,0))s.alive=false;}
export function createPrism(random=Math.random){const s={board:Array.from({length:ROWS},()=>Array(COLS).fill(0)),bag:[],next:[],piece:null,score:0,lines:0,level:1,combo:0,alive:true,won:false,fall:0,lock:0,resets:0,held:{},repeat:0,locks:0,lastClear:0};for(let i=0;i<3;i++)s.next.push(pick(s,random));spawn(s,random);return s;}
export function movePrism(s,dx,dy){if(!s.alive)return false;const p=s.piece;if(!fitsPrism(s,p.matrix,p.x+dx,p.y+dy))return false;p.x+=dx;p.y+=dy;if(dy>0)s.lock=0;else if(s.resets<12){s.lock=0;s.resets++;}return true;}
export function rotatePrism(s){if(!s.alive)return false;const p=s.piece,m=p.matrix[0].map((_,i)=>p.matrix.map(r=>r[i]).reverse());for(const shift of [0,-1,1,-2,2]){if(fitsPrism(s,m,p.x+shift,p.y)){p.matrix=m;p.x+=shift;if(s.resets<12){s.lock=0;s.resets++;}return true;}}return false;}
export function lockPrism(s,random=Math.random){
 if(!s.alive)return;const p=s.piece;
 if(p.matrix.some((row,j)=>row.some(cell=>cell&&p.y+j<0))){s.alive=false;return;}
 p.matrix.forEach((row,j)=>row.forEach((cell,i)=>{if(cell)s.board[p.y+j][p.x+i]=p.id+1;}));
 const remaining=s.board.filter(row=>row.some(cell=>!cell)),cleared=ROWS-remaining.length;
 s.lastClear=cleared;s.locks++;
 if(cleared){s.combo++;s.score+=([0,120,360,720,1200][cleared]||cleared*400)*s.level+(s.combo-1)*60;s.lines+=cleared;s.level=1+Math.floor(s.lines/8);}else s.combo=0;
 s.board=[...Array.from({length:cleared},()=>Array(COLS).fill(0)),...remaining];spawn(s,random);
}
export function ghostRow(s){let y=s.piece.y;while(fitsPrism(s,s.piece.matrix,s.piece.x,y+1))y++;return y;}
export function stepPrism(s,dt,input={},random=Math.random){
 if(!s.alive)return;dt=Math.max(0,Math.min(.04,dt));
 const direction=(input.right?1:0)-(input.left?1:0),previous=(s.held.right?1:0)-(s.held.left?1:0);
 if(direction){if(direction!==previous){movePrism(s,direction,0);s.repeat=.18;}else{s.repeat-=dt;if(s.repeat<=0){movePrism(s,direction,0);s.repeat=.07;}}}else s.repeat=0;
 if(input.up&&!s.held.up)rotatePrism(s);
 const drop=input.fire&&!s.held.fire;s.held={...input};
 if(drop){const y=ghostRow(s);s.score+=(y-s.piece.y)*2;s.piece.y=y;lockPrism(s,random);return;}
 s.fall+=dt;const interval=input.down?.035:Math.max(.09,.85*Math.pow(.84,s.level-1));
 if(s.fall>=interval){s.fall=0;if(movePrism(s,0,1)&&input.down)s.score++;}
 const p=s.piece;if(!fitsPrism(s,p.matrix,p.x,p.y+1)){s.lock+=dt;if(s.lock>=.38)lockPrism(s,random);}else s.lock=0;
}
function tile(ctx,x,y,size,color,ghost=false){ctx.fillStyle=ghost?'#bba2ff18':color;ctx.fillRect(x+2,y+2,size-4,size-4);ctx.strokeStyle=ghost?'#bba2ff88':'#ffffff35';ctx.lineWidth=1;ctx.strokeRect(x+2.5,y+2.5,size-5,size-5);if(!ghost){ctx.fillStyle='#ffffff35';ctx.fillRect(x+5,y+5,size-10,3);}}
export function drawPrism(ctx,s){
 ctx.fillStyle='#101322';ctx.fillRect(0,0,720,540);const size=26,bx=190,by=35;
 ctx.fillStyle='#090e1b';ctx.fillRect(bx-5,by-5,COLS*size+10,ROWS*size+10);
 ctx.strokeStyle='#222c44';ctx.lineWidth=1;
 for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(bx+x*size,by);ctx.lineTo(bx+x*size,by+ROWS*size);ctx.stroke();}
 for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(bx,by+y*size);ctx.lineTo(bx+COLS*size,by+y*size);ctx.stroke();}
 s.board.forEach((row,y)=>row.forEach((id,x)=>{if(id)tile(ctx,bx+x*size,by+y*size,size,colors[id-1]);}));
 const p=s.piece,ghost=ghostRow(s);for(const [y,isGhost] of [[ghost,true],[p.y,false]])p.matrix.forEach((row,j)=>row.forEach((cell,i)=>{if(cell&&y+j>=0)tile(ctx,bx+(p.x+i)*size,by+(y+j)*size,size,colors[p.id],isGhost);}));
 ctx.fillStyle='#bba2ff';ctx.font='bold 20px system-ui';ctx.fillText('PRISM',25,64);ctx.fillText('STACK',25,90);
 ctx.fillStyle='#b2bdd5';ctx.font='14px system-ui';ctx.fillText('LEVEL',25,146);ctx.fillText('LINES',25,224);ctx.fillText('COMBO',25,302);
 ctx.fillStyle='#f0f4ff';ctx.font='bold 30px system-ui';ctx.fillText(String(s.level).padStart(2,'0'),25,182);ctx.fillText(String(s.lines),25,260);ctx.fillText(s.combo?'×'+s.combo:'—',25,338);
 ctx.fillStyle='#b2bdd5';ctx.font='14px system-ui';ctx.fillText('UP NEXT',535,60);
 s.next.forEach((id,n)=>{shapes[id].forEach((row,j)=>row.forEach((cell,i)=>{if(cell)tile(ctx,535+i*25,85+n*95+j*25,25,colors[id]);}));});
 ctx.fillStyle='#b2bdd5';ctx.font='13px system-ui';ctx.fillText('↑ Rotate',535,402);ctx.fillText('↓ Soft drop',535,428);ctx.fillText('Space: drop',535,454);
 ctx.fillStyle='#9cabc5';ctx.font='13px system-ui';ctx.fillText('FILL ROWS · FIND YOUR RHYTHM',220,526);
}
