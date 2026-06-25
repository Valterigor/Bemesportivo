const TYPES = [
  {id:'bus',w:104,h:166,color:'#171d25',speed:1,move:false,dodge:null,hitbox:{w:.76,h:.82,y:.62}},
  {id:'fast-marker',w:78,h:124,color:'#181818',speed:1.24,move:true,dodge:null,hitbox:{w:.72,h:.78,y:.64}},
  {id:'cone',w:72,h:86,color:'#fc6e02',speed:1,move:false,dodge:'jump',hitbox:{w:.7,h:.64,y:.66}},
  {id:'barrier',w:136,h:92,color:'#ffd34d',speed:1,move:false,dodge:'jump',hitbox:{w:.82,h:.62,y:.68}},
  {id:'hole',w:128,h:72,color:'#080808',speed:1,move:false,dodge:'jump',hitbox:{w:.82,h:.44,y:.82}},
  {id:'rival',w:86,h:138,color:'#1976d2',speed:1.02,move:true,dodge:null,hitbox:{w:.68,h:.76,y:.66}},
  {id:'cart',w:118,h:82,color:'#fc6e02',speed:1.13,move:true,dodge:null,hitbox:{w:.78,h:.58,y:.7}},
  {id:'gate',w:136,h:150,color:'#42e8ff',speed:1,move:false,dodge:'slide',hitbox:{w:.78,h:.72,y:.58}},
  {id:'box',w:108,h:108,color:'#8b4a19',speed:1,move:false,dodge:null,hitbox:{w:.74,h:.72,y:.66}}
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

  spawn(game, lanes, lane = Math.floor(Math.random() * 3), typeId = null, yOffset = 0, options = {}){
    const type = typeId ? TYPES.find(item => item.id === typeId) || TYPES[0] : TYPES[Math.floor(Math.random() * TYPES.length)];
    const item = this.pool.pop() || {};
    item.type = type;
    item.lane = lane;
    item.fromLane = lane;
    item.targetLane = Number.isInteger(options.targetLane) ? options.targetLane : lane;
    if(type.move && item.targetLane === lane) item.targetLane = lane === 2 ? 1 : lane + 1;
    item.moveDelay = options.moveDelay ?? .25;
    item.moveProgress = 0;
    item.y = roadSpawnY(game) + yOffset;
    item.x = perspectiveLaneX(game, lanes[item.lane], item.y);
    item.w = type.w;
    item.h = type.h;
    item.phase = options.phase ?? 0;
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
      if(item.type.move){
        item.phase += dt;
        const nearPlayer = item.y > game.height * .48;
        if(nearPlayer && item.moveDelay <= 0){
          item.moveProgress = Math.min(1, item.moveProgress + dt * 1.15);
        }else{
          item.moveDelay -= dt;
        }
      }
      item.y += game.speed * item.type.speed * dt;
      const laneIndex = item.type.move ? lerp(item.fromLane, item.targetLane, smoothstep(item.moveProgress)) : item.lane;
      item.x += (perspectiveLaneX(game, lanePosition(lanes, laneIndex), item.y) - item.x) * Math.min(1, dt * 10);
    });

    this.items = this.items.filter(item => {
      if(item.y < game.height + 220) return true;
      this.pool.push(item);
      return false;
    });
  }

  draw(ctx){
    this.items.forEach(item => {
      drawGroundWarning(ctx,item);
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
      if(item.type.id === 'hole') drawHole(ctx);
      if(item.type.id === 'rival') drawRival(ctx,item.type.color);
      if(item.type.id === 'cart') drawCart(ctx,item.type.color);
      if(item.type.id === 'gate') drawGate(ctx);
      if(item.type.id === 'box') drawBox(ctx);
      ctx.restore();
    });
  }
}

function lanePosition(lanes,laneIndex){
  const left = Math.floor(laneIndex);
  const right = Math.min(2, left + 1);
  return lerp(lanes[left], lanes[right], laneIndex - left);
}

function smoothstep(t){
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function lerp(a,b,t){
  return a + (b - a) * t;
}

function drawGroundWarning(ctx,item){
  const scale = itemScale(ctx,item.y);
  const alpha = Math.max(0, Math.min(.48, (item.y / (ctx.canvas.clientHeight || ctx.canvas.height || 800)) * .42));
  ctx.save();
  ctx.translate(item.x,item.y);
  ctx.scale(scale,scale);
  ctx.fillStyle = `rgba(252,110,2,${alpha})`;
  ctx.strokeStyle = `rgba(255,211,77,${alpha + .16})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0,item.h*.46,item.w*.54,13,0,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();
  if(item.type.move){
    ctx.strokeStyle = `rgba(66,232,255,${alpha + .2})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([12,10]);
    ctx.beginPath();
    ctx.moveTo(0,item.h*.46);
    ctx.lineTo((item.targetLane - item.fromLane) * 120,item.h*.46);
    ctx.stroke();
  }
  ctx.restore();
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

function drawHole(ctx){
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(0,34,82,16,0,0,Math.PI*2); ctx.fill();
  const pit = ctx.createRadialGradient(0,0,8,0,0,70);
  pit.addColorStop(0,'#020202');
  pit.addColorStop(.58,'#07090f');
  pit.addColorStop(1,'rgba(252,110,2,.62)');
  ctx.fillStyle = pit;
  ctx.beginPath();
  ctx.ellipse(0,0,72,38,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#ff9f1c';
  ctx.lineWidth = 5;
  ctx.stroke();
}

function drawRival(ctx,color){
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(0,68,46,12,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0,-58,24,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-8,-63,5,0,Math.PI*2); ctx.arc(8,-63,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.roundRect(-32,-32,64,70,16); ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-24,-20,48,12);
  ctx.fillStyle = '#fff';
  ctx.font = '900 22px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('10',0,16);
  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-28,-10); ctx.lineTo(-52,16);
  ctx.moveTo(28,-10); ctx.lineTo(52,18);
  ctx.moveTo(-15,36); ctx.lineTo(-34,70);
  ctx.moveTo(15,36); ctx.lineTo(34,70);
  ctx.stroke();
}

function drawCart(ctx,color){
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.ellipse(0,46,72,13,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-58,-28,116,56,14);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.fillRect(-44,-44,88,20);
  ctx.fillStyle = '#fff';
  ctx.font = '900 18px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BE',0,11);
  ctx.fillStyle = '#1b1f28';
  ctx.beginPath(); ctx.arc(-36,32,16,0,Math.PI*2); ctx.arc(36,32,16,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#42e8ff';
  ctx.beginPath(); ctx.arc(-36,32,7,0,Math.PI*2); ctx.arc(36,32,7,0,Math.PI*2); ctx.fill();
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
