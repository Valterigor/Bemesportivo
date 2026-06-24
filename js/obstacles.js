const TYPES = [
  {id:'marker',w:74,h:132,color:'#9b1111',speed:1,shift:false},
  {id:'fast-marker',w:68,h:122,color:'#181818',speed:1.35,shift:true},
  {id:'cone',w:72,h:86,color:'#fc6e02',speed:1,shift:false},
  {id:'barrier',w:116,h:96,color:'#ffd34d',speed:1,shift:false},
  {id:'box',w:108,h:108,color:'#8b4a19',speed:1,shift:false}
];

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

  spawn(lanes){
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const item = this.pool.pop() || {};
    item.type = type;
    item.lane = Math.floor(Math.random() * 3);
    item.x = lanes[item.lane];
    item.y = -160;
    item.w = type.w;
    item.h = type.h;
    item.phase = Math.random() * Math.PI * 2;
    item.hit = false;
    this.items.push(item);
  }

  update(dt, game, lanes){
    this.timer -= dt;
    if(this.timer <= 0){
      this.spawn(lanes);
      this.timer = Math.max(.42, 1.08 - game.level * .045);
    }

    this.items.forEach(item => {
      if(item.type.shift){
        item.phase += dt * 4.2;
        if(Math.sin(item.phase) > .86){
          item.lane = Math.max(0, Math.min(2, item.lane + (Math.random() > .5 ? 1 : -1)));
        }
      }
      item.x += (lanes[item.lane] - item.x) * Math.min(1, dt * 8);
      item.y += game.speed * item.type.speed * dt;
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
      const scale = .45 + item.y / 1800;
      ctx.scale(scale, scale);
      ctx.shadowColor = 'rgba(0,0,0,.45)';
      ctx.shadowBlur = 18;
      if(item.type.id.includes('marker')) drawMarker(ctx,item.type.color,item.type.id === 'fast-marker');
      if(item.type.id === 'cone') drawCone(ctx);
      if(item.type.id === 'barrier') drawBarrier(ctx);
      if(item.type.id === 'box') drawBox(ctx);
      ctx.restore();
    });
  }
}

function drawMarker(ctx,color,fast){
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

function drawCone(ctx){
  ctx.fillStyle = '#fc6e02';
  ctx.beginPath(); ctx.moveTo(0,-62); ctx.lineTo(44,42); ctx.lineTo(-44,42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-26,-4,52,14);
  ctx.fillStyle = '#242424';
  ctx.fillRect(-54,38,108,18);
}

function drawBarrier(ctx){
  ctx.fillStyle = '#111';
  ctx.fillRect(-68,-30,136,70);
  ctx.fillStyle = '#ffd34d';
  for(let i=-56;i<60;i+=38) ctx.fillRect(i,-28,20,68);
}

function drawBox(ctx){
  ctx.fillStyle = '#9a561c';
  ctx.fillRect(-54,-54,108,108);
  ctx.strokeStyle = '#5b2b0a';
  ctx.lineWidth = 8;
  ctx.strokeRect(-50,-50,100,100);
  ctx.beginPath(); ctx.moveTo(-48,-48); ctx.lineTo(48,48); ctx.moveTo(48,-48); ctx.lineTo(-48,48); ctx.stroke();
}
