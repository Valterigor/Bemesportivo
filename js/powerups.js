export const POWERUP_TYPES = [
  {id:'turbo', label:'Turbo', color:'#2fd13f'},
  {id:'shield', label:'Escudo', color:'#24d8ff'},
  {id:'magnet', label:'Ima', color:'#ff4cc2'},
  {id:'multiplier', label:'Multiplicador', color:'#ffcf28'}
];

export function createPowerup(width, lanes){
  const lane = Math.floor(Math.random() * lanes.length);
  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  return {type:type.id, label:type.label, color:type.color, lane, x:width * lanes[lane], y:-48, r:20};
}

export function drawPowerup(ctx,p,frame){
  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.shadowBlur = 18;
  ctx.shadowColor = p.color;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(0,0,p.r + Math.sin(frame/8)*2,0,Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#071326';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  const icon = p.type === 'shield' ? 'S' : p.type === 'turbo' ? 'T' : p.type === 'magnet' ? 'M' : 'x2';
  ctx.fillText(icon,0,6);
  ctx.restore();
}
