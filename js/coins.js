export const COIN_TYPES = [
  {id:'bronze', value:1, points:80, color:'#cd7f32'},
  {id:'silver', value:3, points:160, color:'#d9e5f2'},
  {id:'gold', value:5, points:260, color:'#ffcf28'}
];

export function createCoin(width, lanes){
  const lane = Math.floor(Math.random() * lanes.length);
  const roll = Math.random();
  const type = roll > .88 ? COIN_TYPES[2] : roll > .58 ? COIN_TYPES[1] : COIN_TYPES[0];
  return {type:type.id, value:type.value, points:type.points, color:type.color, lane, x:width * lanes[lane], y:-40, r:15, spin:0};
}

export function drawCoin(ctx,c){
  c.spin += .18;
  ctx.save();
  ctx.translate(c.x,c.y);
  ctx.scale(Math.max(.28,Math.cos(c.spin)),1);
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.arc(0,0,c.r,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#ff8a00';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff7b0';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('$',0,5);
  ctx.restore();
}
