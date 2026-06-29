const POWERUPS = [
  {id:'turbo',icon:'SPR',color:'#42e8ff'},
  {id:'shield',icon:'ESC',color:'#42e8ff'},
  {id:'magnet',icon:'IMA',color:'#fc6e02'},
  {id:'multiplier',icon:'x2',color:'#ffd34d'},
  {id:'slow',icon:'SLO',color:'#7dff8a'},
  {id:'energy',icon:'H2O',color:'#18c8ff'}
];

export class PowerupSystem{
  constructor(){
    this.items = [];
    this.pool = [];
    this.timer = 4;
  }

  reset(){
    this.pool.push(...this.items);
    this.items.length = 0;
    this.timer = 3;
  }

  update(dt, game, lanes){
    this.timer -= dt;
    if(!game.directorEnabled && this.timer <= 0){
      const def = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
      const lane = Math.floor(Math.random()*3);
      const y = roadSpawnY(game);
      this.addItem(def,lane,perspectiveLaneX(game,lanes[lane],y),y);
      this.timer = 5 + Math.random() * 4;
    }
    this.items.forEach(item => {
      item.y += game.speed * dt;
      item.x += (perspectiveLaneX(game, lanes[item.lane], item.y) - item.x) * Math.min(1, dt * 9);
      item.spin += dt * 4;
    });
    this.items = this.items.filter(item => {
      if(item.y < game.height + 140) return true;
      this.pool.push(item);
      return false;
    });
  }

  spawn(game, lanes, lane = Math.floor(Math.random()*3), id = null, yOffset = 0){
    const def = id ? POWERUPS.find(item => item.id === id) || POWERUPS[0] : POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    const y = roadSpawnY(game) + Math.min(Math.max(0, yOffset), game.height * .34);
    this.addItem(def,lane,perspectiveLaneX(game,lanes[lane],y),y);
  }

  addItem(def,lane,x,y){
    const item = this.pool.pop() || {};
    item.def = def;
    item.lane = lane;
    item.x = x;
    item.y = y;
    item.spin = 0;
    item.collected = false;
    this.items.push(item);
  }

  draw(ctx){
    this.items.forEach(item => {
      ctx.save();
      ctx.translate(item.x,item.y);
      const scale = itemScale(ctx,item.y);
      ctx.scale(scale, scale);
      ctx.rotate(Math.sin(item.spin)*.1);
      ctx.shadowColor = item.def.color;
      ctx.shadowBlur = 28;
      ctx.fillStyle = 'rgba(6,10,18,.9)';
      ctx.beginPath();
      ctx.roundRect(-42,-42,84,84,18);
      ctx.fill();
      ctx.strokeStyle = item.def.color;
      ctx.lineWidth = 5;
      ctx.stroke();
      if(item.def.id === 'magnet') drawMagnet(ctx,item.def.color);
      else if(item.def.id === 'shield') drawShield(ctx,item.def.color);
      else if(item.def.id === 'energy') drawDrop(ctx,item.def.color);
      else{
        ctx.fillStyle = item.def.color;
        ctx.font = '900 24px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.def.icon,0,0);
      }
      ctx.restore();
    });
  }
}

function perspectiveLaneX(game,laneX,y){
  const p = Math.max(0, Math.min(1, y / game.height));
  const spread = .16 + Math.pow(p,1.35) * .92;
  return game.width * .5 + (laneX - game.width * .5) * spread;
}

function roadSpawnY(game){
  return game.height * .34;
}

function itemScale(ctx,y){
  const h = ctx.canvas.clientHeight || ctx.canvas.height || 800;
  const p = Math.max(0, Math.min(1, y / h));
  return .16 + Math.pow(p,1.35) * .92;
}

function drawMagnet(ctx,color){
  ctx.strokeStyle = color;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0,-2,26,Math.PI*.08,Math.PI*.92);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-34,-1,16,20);
  ctx.fillRect(18,-1,16,20);
}

function drawShield(ctx,color){
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0,-34);
  ctx.lineTo(30,-20);
  ctx.quadraticCurveTo(24,22,0,36);
  ctx.quadraticCurveTo(-24,22,-30,-20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.moveTo(0,-22);
  ctx.lineTo(15,-14);
  ctx.quadraticCurveTo(12,12,0,22);
  ctx.closePath();
  ctx.fill();
}

function drawDrop(ctx,color){
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0,-34);
  ctx.bezierCurveTo(28,0,24,34,0,38);
  ctx.bezierCurveTo(-24,34,-28,0,0,-34);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ctx.beginPath();
  ctx.ellipse(-8,4,7,16,-.35,0,Math.PI*2);
  ctx.fill();
}
