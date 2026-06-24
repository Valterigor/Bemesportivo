import { roundRect } from './player.js';

export const OBSTACLE_TYPES = [
  {id:'marker', label:'Marcador', speed:1, w:50, h:70},
  {id:'fast-marker', label:'Marcador rapido', speed:1.35, w:48, h:68},
  {id:'cone', label:'Cone', speed:1, w:46, h:58},
  {id:'barrier', label:'Barreira', speed:1.08, w:66, h:42},
  {id:'crate', label:'Caixa', speed:1, w:52, h:54}
];

export function createObstacle(width, lanes){
  const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  const lane = Math.floor(Math.random() * lanes.length);
  return {kind:type.id, lane, x:width * lanes[lane], y:-90, w:type.w, h:type.h, speed:type.speed, passed:false};
}

export function drawObstacle(ctx,o){
  ctx.save();
  ctx.translate(o.x,o.y);
  if(o.kind === 'crate'){
    ctx.fillStyle = '#9b4d18';
    roundRect(ctx,-26,-30,52,52,6);
    ctx.fill();
    ctx.strokeStyle = '#5c2b0e';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-22,-24);
    ctx.lineTo(22,18);
    ctx.moveTo(22,-24);
    ctx.lineTo(-22,18);
    ctx.stroke();
  }else if(o.kind === 'cone'){
    ctx.fillStyle = '#fff';
    ctx.fillRect(-24,20,48,8);
    ctx.fillStyle = '#fc6e02';
    ctx.beginPath();
    ctx.moveTo(0,-42);
    ctx.lineTo(-24,22);
    ctx.lineTo(24,22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-14,-5,28,8);
  }else if(o.kind === 'barrier'){
    ctx.fillStyle = '#111';
    roundRect(ctx,-33,-20,66,40,8);
    ctx.fill();
    ctx.fillStyle = '#fc6e02';
    for(let i=-26;i<28;i+=18) ctx.fillRect(i,-18,9,36);
  }else{
    const fast = o.kind === 'fast-marker';
    ctx.fillStyle = '#151515';
    roundRect(ctx,-22,-36,44,58,9);
    ctx.fill();
    ctx.fillStyle = fast ? '#5417bd' : '#bd171d';
    ctx.fillRect(-20,-26,40,27);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(fast ? '9' : '5',0,-7);
    ctx.fillStyle = '#8b4a22';
    ctx.beginPath();
    ctx.arc(0,-50,15,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-12,22);
    ctx.lineTo(-23,45);
    ctx.moveTo(12,22);
    ctx.lineTo(23,45);
    ctx.stroke();
  }
  ctx.restore();
}
