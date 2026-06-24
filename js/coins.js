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

  spawn(lanes){
    const lane = Math.floor(Math.random() * 3);
    const kindRoll = Math.random();
    const kind = kindRoll > .92 ? 'gold' : kindRoll > .72 ? 'silver' : 'bronze';
    const value = kind === 'gold' ? 10 : kind === 'silver' ? 5 : 1;
    for(let i=0;i<4;i++){
      const item = this.pool.pop() || {};
      item.lane = lane;
      item.x = lanes[lane];
      item.y = -120 - i * 82;
      item.kind = kind;
      item.value = value;
      item.spin = Math.random() * 8;
      item.collected = false;
      this.items.push(item);
    }
  }

  update(dt, game, lanes, player){
    this.timer -= dt;
    if(this.timer <= 0){
      this.spawn(lanes);
      this.timer = .7 + Math.random() * .55;
    }

    this.items.forEach(item => {
      item.y += game.speed * dt;
      item.spin += dt * 8;
      if(game.activePowerups.magnet){
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const distance = Math.hypot(dx, dy);
        if(distance < 210){
          item.x += dx * dt * 7;
          item.y += dy * dt * 7;
        }
      }else{
        item.x += (lanes[item.lane] - item.x) * Math.min(1, dt * 8);
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
      const scale = .45 + item.y / 1800;
      ctx.scale(scale, scale);
      const palette = {
        bronze:['#d67b34','#fff0b8'],
        silver:['#bfc8d9','#ffffff'],
        gold:['#ffd34d','#fff4a3']
      }[item.kind];
      ctx.shadowColor = palette[0];
      ctx.shadowBlur = 18;
      ctx.fillStyle = palette[0];
      ctx.beginPath();
      ctx.ellipse(0,0,24 * Math.abs(Math.cos(item.spin)) + 6,28,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = palette[1];
      ctx.font = '900 22px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('★',0,8);
      ctx.restore();
    });
  }
}
