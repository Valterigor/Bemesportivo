export const KOBEMS = [
  {id:'classic',name:'Classico',price:0,color:'#fc6e02',accent:'#42e8ff'},
  {id:'athlete',name:'Atleta',price:180,color:'#f04d23',accent:'#ffffff'},
  {id:'gold',name:'Ouro',price:500,color:'#ffd34d',accent:'#42e8ff'},
  {id:'neon',name:'Neon',price:900,color:'#141414',accent:'#42e8ff'},
  {id:'legendary',name:'Campeao',price:1600,color:'#42e8ff',accent:'#ffd34d'}
];

const robotSprite = new Image();
robotSprite.src = 'assets/img/kobem-runner-robot.png';
const robotRunSheet = new Image();
robotRunSheet.src = 'assets/img/kobem-runner-robot-sheet.png';

export class Player{
  constructor(){
    this.lane = 1;
    this.targetLane = 1;
    this.x = 0;
    this.y = 0;
    this.anim = 0;
    this.invulnerable = 0;
    this.jump = 0;
    this.jumpVelocity = 0;
    this.slide = 0;
    this.tilt = 0;
    this.lastLane = 1;
    this.skin = KOBEMS[0];
  }

  reset(){
    this.lane = 1;
    this.targetLane = 1;
    this.invulnerable = 0;
    this.jump = 0;
    this.jumpVelocity = 0;
    this.slide = 0;
    this.tilt = 0;
    this.lastLane = 1;
  }

  setSkin(skin){
    this.skin = skin || KOBEMS[0];
  }

  move(dir){
    const next = Math.max(0, Math.min(2, this.targetLane + dir));
    if(next !== this.targetLane){
      this.lastLane = this.targetLane;
      this.targetLane = next;
      this.tilt = dir * .18;
    }
  }

  jumpStart(){
    if(this.jump <= 0.02){
      this.jumpVelocity = 820;
      this.slide = 0;
    }
  }

  slideStart(){
    if(this.jump <= 0.08){
      this.slide = .55;
      this.jumpVelocity = 0;
      this.jump = 0;
    }
  }

  update(dt, lanes, height, gameSpeed = 620){
    const runRate = 8.6 + Math.min(8, (gameSpeed - 620) / 90);
    this.anim += dt * runRate;
    this.lane += (this.targetLane - this.lane) * Math.min(1, dt * 15);
    this.x = lanes[0] + (lanes[2] - lanes[0]) * (this.lane / 2);
    this.y = height * .79;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.slide = Math.max(0, this.slide - dt);
    this.tilt += (0 - this.tilt) * Math.min(1, dt * 9);
    if(this.jump > 0 || this.jumpVelocity > 0){
      this.jump += this.jumpVelocity * dt;
      this.jumpVelocity -= 2300 * dt;
      if(this.jump <= 0){
        this.jump = 0;
        this.jumpVelocity = 0;
      }
    }
  }

  getHitbox(){
    if(this.slide > 0) return {x:this.x - 48, y:this.y - 84, w:96, h:88};
    return {x:this.x - 43, y:this.y - 132 - this.jump, w:86, h:154};
  }

  isJumping(){
    return this.jump > 72;
  }

  isSliding(){
    return this.slide > 0;
  }

  draw(ctx, activePowerups){
    const bob = Math.sin(this.anim) * (this.slide > 0 ? 2 : 5);
    const stride = Math.sin(this.anim);
    const color = this.skin.color;
    const accent = this.skin.accent;
    if(robotRunSheet.complete && robotRunSheet.naturalWidth){
      drawRobotRunSheet(ctx, robotRunSheet, this.x, this.y, bob, this.anim, activePowerups, accent, this.jump, this.slide, this.tilt);
      return;
    }
    if(robotSprite.complete && robotSprite.naturalWidth){
      drawRobotSprite(ctx, robotSprite, this.x, this.y, bob, stride, activePowerups, accent, this.jump, this.slide, this.tilt);
      return;
    }
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.scale(1.18,1.18);
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

    ctx.shadowColor = 'rgba(0,0,0,.75)';
    ctx.shadowBlur = 22;
    ctx.fillStyle = 'rgba(0,0,0,.38)';
    ctx.beginPath();
    ctx.ellipse(0,150,72,24,0,0,Math.PI*2);
    ctx.fill();

    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = 18;
    const core = ctx.createLinearGradient(-46,-56,46,58);
    core.addColorStop(0,'#27303a');
    core.addColorStop(.45,'#0d0f14');
    core.addColorStop(1,'#030406');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0,18,54,76,0,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    const body = ctx.createLinearGradient(-43,-50,43,42);
    body.addColorStop(0,'#ffc168');
    body.addColorStop(.28,color);
    body.addColorStop(.72,'#b53f04');
    body.addColorStop(1,'#11151d');
    ctx.fillStyle = body;
    roundRect(ctx,-43,-50,86,92,22);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    roundRect(ctx,-31,-42,20,58,10);
    ctx.fill();
    ctx.fillStyle = '#10151d';
    roundRect(ctx,-26,-24,52,34,10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 22px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BE',0,0);

    const head = ctx.createLinearGradient(-68,-154,68,-50);
    head.addColorStop(0,'#ffbd68');
    head.addColorStop(.36,color);
    head.addColorStop(.82,'#141922');
    ctx.fillStyle = head;
    roundRect(ctx,-68,-154,136,104,40);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 4;
    ctx.stroke();
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

    drawLimb(ctx, -42, -25, -82, 20 + stride * 18, color, accent);
    drawLimb(ctx, 42, -25, 82, 20 - stride * 18, color, accent);
    drawLimb(ctx, -24, 74, -52, 130 + stride * 22, color, accent);
    drawLimb(ctx, 24, 74, 52, 130 - stride * 22, color, accent);
    drawFlame(ctx,-48,132 + stride * 8,accent);
    drawFlame(ctx,48,132 - stride * 8,accent);
    ctx.restore();
  }
}

function drawRobotRunSheet(ctx,image,x,y,bob,anim,activePowerups,accent,jump,slide,tilt){
  const frameCount = 4;
  const frameW = image.naturalWidth / frameCount;
  const frameH = image.naturalHeight;
  const frame = slide > 0 ? 1 : Math.floor(anim * 1.35) % frameCount;
  const spriteHeight = Math.min(405, Math.max(310, ctx.canvas.clientHeight ? ctx.canvas.clientHeight * .42 : 365));
  const spriteWidth = spriteHeight * frameW / frameH;
  const squash = slide > 0 ? .72 : 1;
  const lean = slide > 0 ? .12 : tilt;
  const drawX = x - spriteWidth * .5;
  const drawY = y - spriteHeight * squash + 54 + bob - jump;

  ctx.save();
  if(activePowerups.shield){
    ctx.strokeStyle = 'rgba(66,232,255,.84)';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#42e8ff';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(x,y - jump - spriteHeight*.43,spriteWidth*.46,spriteHeight*.42,0,0,Math.PI*2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = 'rgba(0,0,0,.34)';
  ctx.beginPath();
  ctx.ellipse(x + 20,y + 42,spriteWidth*.34 * (1 - Math.min(.45,jump/360)),18 * (1 - Math.min(.55,jump/260)),0,0,Math.PI*2);
  ctx.fill();

  ctx.shadowColor = 'rgba(0,0,0,.28)';
  ctx.shadowBlur = 14;
  ctx.translate(x, drawY + spriteHeight*squash*.54);
  ctx.rotate(lean);
  ctx.translate(-x, -(drawY + spriteHeight*squash*.54));
  ctx.drawImage(image,frame * frameW,0,frameW,frameH,drawX,drawY,spriteWidth,spriteHeight*squash);

  const footPhase = Math.sin(anim * 1.35);
  drawSpriteFlame(ctx,x - spriteWidth*.17,y + 30 - jump + footPhase*9,accent,slide);
  drawSpriteFlame(ctx,x + spriteWidth*.18,y + 25 - jump - footPhase*9,accent,slide);
  ctx.restore();
}

function drawRobotSprite(ctx,image,x,y,bob,stride,activePowerups,accent,jump,slide,tilt){
  const spriteHeight = Math.min(470, Math.max(360, ctx.canvas.clientHeight ? ctx.canvas.clientHeight * .49 : 420));
  const spriteWidth = spriteHeight * image.naturalWidth / image.naturalHeight;
  const squash = slide > 0 ? .72 : 1;
  const lean = slide > 0 ? .1 : tilt;
  const drawX = x - spriteWidth * .5 + stride * 3;
  const drawY = y - spriteHeight * squash + 52 + bob - jump;
  ctx.save();
  if(activePowerups.shield){
    ctx.strokeStyle = 'rgba(66,232,255,.84)';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#42e8ff';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(x,y - jump - spriteHeight*.43,spriteWidth*.46,spriteHeight*.42,0,0,Math.PI*2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = 'rgba(0,0,0,.36)';
  ctx.beginPath();
  ctx.ellipse(x + 24,y + 42,spriteWidth*.34 * (1 - Math.min(.45,jump/360)),18 * (1 - Math.min(.55,jump/260)),0,0,Math.PI*2);
  ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,.32)';
  ctx.shadowBlur = 18;
  ctx.translate(x, drawY + spriteHeight*squash*.54);
  ctx.rotate(lean);
  ctx.translate(-x, -(drawY + spriteHeight*squash*.54));
  drawAnimatedRobot(ctx,image,drawX,drawY,spriteWidth,spriteHeight*squash,stride,slide);
  drawSpriteFlame(ctx,x - spriteWidth*.17,y + 29 - jump + stride*9,accent,slide);
  drawSpriteFlame(ctx,x + spriteWidth*.18,y + 24 - jump - stride*9,accent,slide);
  ctx.restore();
}

function drawAnimatedRobot(ctx,image,x,y,w,h,stride,slide){
  const sourceW = image.naturalWidth;
  const sourceH = image.naturalHeight;
  const upperCut = sourceH * .55;
  const legTop = sourceH * .50;
  const legH = sourceH - legTop;
  const legSW = sourceW * .35;
  const legDXW = w * .36;
  const legDY = y + h * .49;
  const legDH = h * .51;

  ctx.drawImage(image,0,0,sourceW,upperCut,x,y,w,h*(upperCut/sourceH));

  if(slide > 0){
    ctx.save();
    ctx.translate(x + w*.5, legDY + legDH*.1);
    ctx.rotate(-.12);
    ctx.drawImage(image,0,legTop,sourceW,legH,-w*.5,0,w,legDH*.72);
    ctx.restore();
    return;
  }

  drawLegSlice(ctx,image,sourceW*.16,legTop,legSW,legH,x+w*.21,legDY,legDXW,legDH,stride*.16,-stride*18);
  drawLegSlice(ctx,image,sourceW*.49,legTop,legSW,legH,x+w*.43,legDY,legDXW,legDH,-stride*.16,stride*18);
}

function drawLegSlice(ctx,image,sx,sy,sw,sh,dx,dy,dw,dh,rot,offsetY){
  ctx.save();
  ctx.translate(dx + dw*.5, dy + dh*.12);
  ctx.rotate(rot);
  ctx.drawImage(image,sx,sy,sw,sh,-dw*.5,offsetY,dw,dh);
  ctx.restore();
}

function drawSpriteFlame(ctx,x,y,color,slide=0){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(slide > 0 ? .9 : .65, slide > 0 ? .46 : 1);
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  const flame = ctx.createLinearGradient(0,-26,0,34);
  flame.addColorStop(0,'rgba(255,255,255,.9)');
  flame.addColorStop(.35,color);
  flame.addColorStop(1,'rgba(252,110,2,0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(0,36);
  ctx.quadraticCurveTo(-16,10,-6,-28);
  ctx.quadraticCurveTo(8,-4,12,-34);
  ctx.quadraticCurveTo(24,4,0,36);
  ctx.fill();
  ctx.restore();
}

function drawLimb(ctx,x1,y1,x2,y2,color,accent){
  ctx.strokeStyle = '#151515';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo((x1+x2)/2,(y1+y2)/2); ctx.stroke();
}

function drawFlame(ctx,x,y,color){
  ctx.save();
  ctx.translate(x,y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0,22);
  ctx.quadraticCurveTo(-14,4,-5,-18);
  ctx.quadraticCurveTo(4,-6,9,-24);
  ctx.quadraticCurveTo(18,-2,0,22);
  ctx.fill();
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
