const POWERUPS = [
  {id:'turbo',icon:'SPR',color:'#42e8ff'},
  {id:'shield',icon:'ESC',color:'#42e8ff'},
  {id:'magnet',icon:'IMA',color:'#fc6e02'},
  {id:'multiplier',icon:'x2',color:'#ffd34d'}
];

export class PowerupSystem{
  constructor(){
    this.items = [];
    this.timer = 4;
  }

  reset(){
    this.items.length = 0;
    this.timer = 3;
  }

  update(dt, game, lanes){
    this.timer -= dt;
    if(!game.directorEnabled && this.timer <= 0){
      const def = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
      const lane = Math.floor(Math.random()*3);
      const y = roadSpawnY(game);
      this.items.push({def,lane,x:perspectiveLaneX(game,lanes[lane],y),y,spin:0});
      this.timer = 5 + Math.random() * 4;
    }
    this.items.forEach(item => {
      item.y += game.speed * dt;
      item.x += (perspectiveLaneX(game, lanes[item.lane], item.y) - item.x) * Math.min(1, dt * 9);
      item.spin += dt * 4;
    });
    this.items = this.items.filter(item => item.y < game.height + 140);
  }

  spawn(game, lanes, lane = Math.floor(Math.random()*3), id = null, yOffset = 0){
    const def = id ? POWERUPS.find(item => item.id === id) || POWERUPS[0] : POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    const y = roadSpawnY(game) + yOffset;
    this.items.push({def,lane,x:perspectiveLaneX(game,lanes[lane],y),y,spin:0});
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
  return game.height * .40;
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
