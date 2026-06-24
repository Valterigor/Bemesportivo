export const KOBEMS = [
  {id:'classic', name:'Kobem Classico', price:0, color:'#fc6e02', accent:'#57e8ff'},
  {id:'champion', name:'Kobem Champion', price:250, color:'#d71920', accent:'#ffeb3b'},
  {id:'gold', name:'Kobem Gold', price:600, color:'#ffcf28', accent:'#ffffff'},
  {id:'elite', name:'Kobem Elite', price:1200, color:'#111111', accent:'#24d8ff'}
];

export class Player {
  constructor(lanes){
    this.lanes = lanes;
    this.lane = 1;
    this.shield = 0;
    this.magnet = 0;
    this.multiplier = 0;
    this.skin = KOBEMS[0];
  }

  reset(skin){
    this.lane = 1;
    this.shield = 0;
    this.magnet = 0;
    this.multiplier = 0;
    this.skin = skin || KOBEMS[0];
  }

  moveLeft(){
    if(this.lane > 0) this.lane -= 1;
  }

  moveRight(){
    if(this.lane < this.lanes.length - 1) this.lane += 1;
  }

  update(){
    if(this.shield > 0) this.shield -= 1;
    if(this.magnet > 0) this.magnet -= 1;
    if(this.multiplier > 0) this.multiplier -= 1;
  }

  getX(width){
    return width * this.lanes[this.lane];
  }

  draw(ctx,width,height,frame){
    const x = this.getX(width);
    const y = height - 178;
    const step = Math.sin(frame / 5) * 5;
    const color = this.skin.color;

    ctx.save();
    ctx.translate(x,y);

    if(this.shield > 0){
      ctx.strokeStyle = 'rgba(36,216,255,.72)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0,-8,58 + Math.sin(frame/6)*3,0,Math.PI*2);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    roundRect(ctx,-26,-58,52,46,14);
    ctx.fill();

    ctx.fillStyle = '#111';
    roundRect(ctx,-20,-51,40,27,10);
    ctx.fill();

    ctx.fillStyle = this.skin.accent;
    roundRect(ctx,-12,-43,8,11,4);
    ctx.fill();
    roundRect(ctx,4,-43,8,11,4);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-15,-57);
    ctx.lineTo(-24,-73);
    ctx.moveTo(15,-57);
    ctx.lineTo(24,-73);
    ctx.stroke();

    ctx.fillStyle = '#202020';
    roundRect(ctx,-20,-14,40,52,13);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(-16,-8,32,22);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('KOBEM',0,6);

    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-21,-6);
    ctx.lineTo(-38,18 + step);
    ctx.moveTo(21,-6);
    ctx.lineTo(38,18 - step);
    ctx.stroke();

    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-11,35);
    ctx.lineTo(-22,62 - step);
    ctx.moveTo(11,35);
    ctx.lineTo(22,62 + step);
    ctx.stroke();

    drawBall(ctx,40,58,15);
    ctx.restore();
  }
}

export function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function drawBall(ctx,x,y,r){
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(x,y,5,0,Math.PI*2);
  ctx.fill();
}
