const TYPES = [
  {id:'bus',w:104,h:166,color:'#171d25',speed:1,shift:false,dodge:null},
  {id:'fast-marker',w:78,h:124,color:'#181818',speed:1.32,shift:true,dodge:null},
  {id:'cone',w:72,h:86,color:'#fc6e02',speed:1,shift:false,dodge:'jump'},
  {id:'barrier',w:136,h:92,color:'#ffd34d',speed:1,shift:false,dodge:'jump'},
  {id:'gate',w:136,h:150,color:'#42e8ff',speed:1,shift:false,dodge:'slide'},
  {id:'box',w:108,h:108,color:'#8b4a19',speed:1,shift:false,dodge:null}
];
export const OBSTACLE_TYPES = TYPES;

export class ObstacleSystem{
  constructor(){
    this.items = [];
    this.pool = [];
    this.timer = 0;
  }

  reset(){
    this.items.length = 0;
    this.timer = 0;
  }

  spawn(game, lanes, lane = Math.floor(Math.random() * 3), typeId = null, yOffset = 0){
    const type = typeId ? TYPES.find(item => item.id === typeId) || TYPES[0] : TYPES[Math.floor(Math.random() * TYPES.length)];
    const item = this.pool.pop() || {};
    item.type = type;
    item.lane = lane;
    item.y = roadSpawnY(game) + yOffset;
    item.x = perspectiveLaneX(game, lanes[item.lane], item.y);
    item.w = type.w;
    item.h = type.h;
    item.phase = Math.random() * Math.PI * 2;
    item.hit = false;
    this.items.push(item);
  }

  update(dt, game, lanes){
    this.timer -= dt;
    if(!game.directorEnabled && this.timer <= 0){
      this.spawn(game, lanes);
      this.timer = Math.max(.42, 1.08 - game.level * .045);
    }

    this.items.forEach(item => {
      if(item.type.shift){
        item.phase += dt * 4.2;
        if(Math.sin(item.phase) > .86){
          item.lane = Math.max(0, Math.min(2, item.lane + (Math.random() > .5 ? 1 : -1)));
        }
      }
      item.y += game.speed * item.type.speed * dt;
      item.x += (perspectiveLaneX(game, lanes[item.lane], item.y) - item.x) * Math.min(1, dt * 9);
    });

    this.items = this.items.filter(item => {
      if(item.y < game.height + 220) return true;
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
      ctx.shadowColor = 'rgba(0,0,0,.45)';
      ctx.shadowBlur = 18;
      if(item.type.id === 'bus') drawBus(ctx);
      if(item.type.id === 'fast-marker') drawMarker(ctx,item.type.color,true);
      if(item.type.id === 'cone') drawCone(ctx);
      if(item.type.id === 'barrier') drawBarrier(ctx);
      if(item.type.id === 'gate') drawGate(ctx);
      if(item.type.id === 'box') drawBox(ctx);
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

function drawMarker(ctx,color,fast){
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(0,54,52,12,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0,-54,28,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = fast ? '#42e8ff' : '#fc6e02';
  ctx.fillRect(-12,-28,24,60);
  ctx.fillStyle = '#111';
  ctx.fillRect(-38,28,76,18);
  ctx.fillStyle = '#fff';
  ctx.font = '900 28px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(fast ? '7' : '5',0,8);
}

function drawBus(ctx){
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.ellipse(0,82,62,16,0,0,Math.PI*2); ctx.fill();
  const body = ctx.createLinearGradient(-52,-80,52,86);
  body.addColorStop(0,'#3c4652');
  body.addColorStop(.42,'#151b23');
  body.addColorStop(1,'#07090d');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(-52,-84,104,168,18);
  ctx.fill();
  ctx.fillStyle = '#ff6e00';
  ctx.fillRect(-42,-80,84,10);
  ctx.fillRect(-42,58,84,12);
  ctx.fillStyle = '#8fefff';
  ctx.fillRect(-34,-58,68,44);
  ctx.fillStyle = '#fc6e02';
  ctx.font = '900 26px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BE',0,27);
  ctx.fillStyle = '#ffd34d';
  ctx.fillRect(-38,74,20,7);
  ctx.fillRect(18,74,20,7);
}

function drawCone(ctx){
  ctx.fillStyle = '#fc6e02';
  ctx.beginPath(); ctx.moveTo(0,-62); ctx.lineTo(44,42); ctx.lineTo(-44,42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-26,-4,52,14);
  ctx.fillStyle = '#242424';
  ctx.fillRect(-54,38,108,18);
}

function drawBarrier(ctx){
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(0,48,78,13,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.roundRect(-76,-34,152,76,10);
  ctx.fill();
  ctx.fillStyle = '#ffd34d';
  for(let i=-68;i<68;i+=40){
    ctx.save();
    ctx.translate(i,0);
    ctx.rotate(.28);
    ctx.fillRect(-10,-40,20,84);
    ctx.restore();
  }
  ctx.fillStyle = '#fc6e02';
  ctx.fillRect(-76,-44,152,10);
}

function drawGate(ctx){
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(0,76,86,14,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#42e8ff';
  ctx.lineWidth = 10;
  ctx.shadowColor = '#42e8ff';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(-62,76);
  ctx.lineTo(-62,-54);
  ctx.quadraticCurveTo(0,-94,62,-54);
  ctx.lineTo(62,76);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#101010';
  ctx.beginPath();
  ctx.roundRect(-72,-42,144,36,10);
  ctx.fill();
  ctx.fillStyle = '#42e8ff';
  ctx.font = '900 18px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('DESLIZE',0,-18);
}

function drawBox(ctx){
  ctx.fillStyle = '#9a561c';
  ctx.fillRect(-54,-54,108,108);
  ctx.strokeStyle = '#5b2b0a';
  ctx.lineWidth = 8;
  ctx.strokeRect(-50,-50,100,100);
  ctx.beginPath(); ctx.moveTo(-48,-48); ctx.lineTo(48,48); ctx.moveTo(48,-48); ctx.lineTo(-48,48); ctx.stroke();
}
