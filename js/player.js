export const KOBEMS = [
  {id:'classic',name:'Clássico',price:0,color:'#fc6e02',accent:'#42e8ff'},
  {id:'champion',name:'Champion',price:250,color:'#d91f1f',accent:'#42e8ff'},
  {id:'gold',name:'Gold',price:600,color:'#ffd34d',accent:'#42e8ff'},
  {id:'elite',name:'Elite',price:1200,color:'#141414',accent:'#fc6e02'},
  {id:'legendary',name:'Lendário',price:2400,color:'#42e8ff',accent:'#ffd34d'}
];

export class Player{
  constructor(){
    this.lane = 1;
    this.targetLane = 1;
    this.x = 0;
    this.y = 0;
    this.anim = 0;
    this.invulnerable = 0;
    this.skin = KOBEMS[0];
  }

  reset(){
    this.lane = 1;
    this.targetLane = 1;
    this.invulnerable = 0;
  }

  setSkin(skin){
    this.skin = skin || KOBEMS[0];
  }

  move(dir){
    this.targetLane = Math.max(0, Math.min(2, this.targetLane + dir));
  }

  update(dt, lanes, height){
    this.anim += dt * 9;
    this.lane += (this.targetLane - this.lane) * Math.min(1, dt * 12);
    this.x = lanes[0] + (lanes[2] - lanes[0]) * (this.lane / 2);
    this.y = height * .73;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  getHitbox(){
    return {x:this.x - 38, y:this.y - 94, w:76, h:132};
  }

  draw(ctx, activePowerups){
    const bob = Math.sin(this.anim) * 5;
    const color = this.skin.color;
    const accent = this.skin.accent;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    if(activePowerups.shield){
      ctx.strokeStyle = 'rgba(66,232,255,.8)';
      ctx.lineWidth = 8;
      ctx.shadowColor = '#42e8ff';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.ellipse(0,-82,82,112,0,0,Math.PI*2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(0, 20, 50, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx,-42,-48,84,88,24);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx,-68,-154,136,104,40);
    ctx.fill();
    ctx.fillStyle = '#071018';
    roundRect(ctx,-48,-134,96,62,24);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    roundRect(ctx,-29,-110,20,28,10);
    roundRect(ctx,9,-110,20,28,10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-42,-152); ctx.lineTo(-58,-188);
    ctx.moveTo(42,-152); ctx.lineTo(58,-188);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(-60,-192,7,0,Math.PI*2);
    ctx.arc(60,-192,7,0,Math.PI*2);
    ctx.fill();
    drawLimb(ctx, -42, -25, -78, 18, color);
    drawLimb(ctx, 42, -25, 78, 18, color);
    drawLimb(ctx, -24, 74, -48, 125 + Math.sin(this.anim)*10, color);
    drawLimb(ctx, 24, 74, 48, 125 - Math.sin(this.anim)*10, color);
    drawBall(ctx, 56, 100);
    ctx.fillStyle = '#101010';
    ctx.font = '900 18px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('KOBEM',0,6);
    ctx.restore();
  }
}

function drawLimb(ctx,x1,y1,x2,y2,color){
  ctx.strokeStyle = '#151515';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
}

function drawBall(ctx,x,y){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#111';
  for(let i=0;i<5;i++){
    const a = i * Math.PI * .4;
    ctx.beginPath(); ctx.arc(Math.cos(a)*13,Math.sin(a)*13,8,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

export function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
