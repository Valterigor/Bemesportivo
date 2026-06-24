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
      item.y = startY + yOffset - i * spacing;
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
  return game.height * .36;
}

function itemScale(ctx,y){
  const h = ctx.canvas.clientHeight || ctx.canvas.height || 800;
  const p = Math.max(0, Math.min(1, y / h));
  return .14 + Math.pow(p,1.35) * .9;
}

function drawBottle(ctx,big){
  const h = big ? 92 : 78;
  const w = big ? 38 : 30;
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(0,h*.56,w*.6,8,0,0,Math.PI*2);
  ctx.fill();
  ctx.shadowColor = '#18c8ff';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#0e77dc';
  ctx.beginPath();
  ctx.roundRect(-w*.22,-h*.62,w*.44,14,5);
  ctx.fill();
  const body = ctx.createLinearGradient(-w*.5,-h*.42,w*.5,h*.5);
  body.addColorStop(0,'#f1ffff');
  body.addColorStop(.2,'#d9fbff');
  body.addColorStop(.5,'#5edcff');
  body.addColorStop(1,'#0869d8');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(-w*.5,-h*.45,w,h,12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.beginPath();
  ctx.roundRect(-w*.3,-h*.3,w*.22,h*.55,7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.beginPath();
  ctx.ellipse(w*.23,-h*.08,w*.13,h*.28,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = big ? '#ffd34d' : '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-w*.4,-4,w*.8,18,6);
  ctx.fill();
  ctx.fillStyle = '#0e77dc';
  ctx.font = '900 13px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BE',0,9);
}
