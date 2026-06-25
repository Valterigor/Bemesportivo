export class CoinSystem{
  constructor(){
    this.items = [];
    this.pool = [];
    this.timer = 0;
  }

  reset(){
    this.items.length = 0;
    this.timer = 0;
  }

  spawn(game, lanes, lane = Math.floor(Math.random() * 3), count = 4, spacing = 58, yOffset = 0){
    const premium = Math.random() > .9;
    const startY = roadSpawnY(game);
    for(let i=0;i<count;i++){
      const item = this.pool.pop() || {};
      item.lane = lane;
      item.y = startY + yOffset + i * spacing;
      item.x = perspectiveLaneX(game, lanes[lane], item.y);
      item.kind = premium ? 'big-water' : 'water';
      item.value = premium ? 3 : 1;
      item.spin = Math.random() * 8;
      item.collected = false;
      this.items.push(item);
    }
  }

  update(dt, game, lanes, player){
    this.timer -= dt;
    if(!game.directorEnabled && this.timer <= 0){
      this.spawn(game, lanes);
      this.timer = .68 + Math.random() * .52;
    }

    this.items.forEach(item => {
      item.y += game.speed * dt;
      item.spin += dt * 8;
      if(game.activePowerups.magnet){
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const distance = Math.hypot(dx, dy);
        if(distance < 240){
          item.x += dx * dt * 8;
          item.y += dy * dt * 8;
        }
      }else{
        item.x += (perspectiveLaneX(game, lanes[item.lane], item.y) - item.x) * Math.min(1, dt * 10);
      }
    });

    this.items = this.items.filter(item => {
      if(item.y < game.height + 120 && !item.collected) return true;
      this.pool.push(item);
      return false;
    });
  }

  draw(ctx){
    this.items.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      const scale = itemScale(ctx,item.y);
      ctx.scale(scale, scale);
      ctx.rotate(Math.sin(item.spin) * .08);
      drawBottle(ctx, item.kind === 'big-water');
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
  return .18 + Math.pow(p,1.32) * 1.05;
}

function drawBottle(ctx,big){
  const h = big ? 106 : 92;
  const w = big ? 42 : 34;
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(0,h*.55,w*.62,8,0,0,Math.PI*2);
  ctx.fill();
  ctx.shadowColor = '#18c8ff';
  ctx.shadowBlur = 26;

  ctx.fillStyle = '#0869d8';
  ctx.beginPath();
  ctx.roundRect(-w*.23,-h*.61,w*.46,h*.12,4);
  ctx.fill();
  ctx.fillStyle = '#0b8dff';
  ctx.fillRect(-w*.28,-h*.67,w*.56,h*.08);

  const body = ctx.createLinearGradient(-w*.55,-h*.5,w*.55,h*.48);
  body.addColorStop(0,'#f5ffff');
  body.addColorStop(.16,'#d8fbff');
  body.addColorStop(.45,'#65ddff');
  body.addColorStop(.78,'#1286ff');
  body.addColorStop(1,'#075fc8');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-w*.25,-h*.5);
  ctx.quadraticCurveTo(-w*.5,-h*.45,-w*.5,-h*.25);
  ctx.lineTo(-w*.5,h*.36);
  ctx.quadraticCurveTo(-w*.5,h*.52,-w*.34,h*.55);
  ctx.lineTo(w*.34,h*.55);
  ctx.quadraticCurveTo(w*.5,h*.52,w*.5,h*.36);
  ctx.lineTo(w*.5,-h*.25);
  ctx.quadraticCurveTo(w*.5,-h*.45,w*.25,-h*.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.26)';
  ctx.lineWidth = 2;
  for(let y=-h*.15;y<h*.36;y+=h*.14){
    ctx.beginPath();
    ctx.moveTo(-w*.43,y);
    ctx.quadraticCurveTo(0,y+5,w*.43,y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.beginPath();
  ctx.roundRect(-w*.31,-h*.39,w*.18,h*.73,7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.beginPath();
  ctx.ellipse(w*.24,-h*.04,w*.12,h*.35,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle = big ? '#ffd34d' : '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-w*.42,-h*.03,w*.84,h*.22,6);
  ctx.fill();
  ctx.fillStyle = '#0e77dc';
  ctx.font = `900 ${big ? 14 : 12}px Inter, Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('BE',0,h*.115);

  ctx.fillStyle = 'rgba(255,255,255,.32)';
  ctx.beginPath();
  ctx.ellipse(0,h*.49,w*.34,5,0,0,Math.PI*2);
  ctx.fill();
}
