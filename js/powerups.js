const POWERUPS = [
  {id:'turbo',icon:'⚡',color:'#42e8ff'},
  {id:'shield',icon:'S',color:'#42e8ff'},
  {id:'magnet',icon:'M',color:'#fc6e02'},
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
    if(this.timer <= 0){
      const def = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
      this.items.push({def,lane:Math.floor(Math.random()*3),x:lanes[1],y:-180,spin:0});
      this.timer = 5 + Math.random() * 4;
    }
    this.items.forEach(item => {
      item.x += (lanes[item.lane] - item.x) * Math.min(1, dt * 8);
      item.y += game.speed * dt;
      item.spin += dt * 4;
    });
    this.items = this.items.filter(item => item.y < game.height + 140);
  }

  draw(ctx){
    this.items.forEach(item => {
      ctx.save();
      ctx.translate(item.x,item.y);
      const scale = .5 + item.y / 1900;
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
      ctx.fillStyle = item.def.color;
      ctx.font = '900 34px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.def.icon,0,0);
      ctx.restore();
    });
  }
}
