import { Player, KOBEMS, roundRect } from './player.js';
import { ObstacleSystem } from './obstacles.js';
import { CoinSystem } from './coins.js';
import { PowerupSystem } from './powerups.js';
import { AudioBus } from './audio.js';
import { loadStore, saveStore, addRanking, unlockAchievement } from './storage.js';
import { updateHud, renderRanking, renderAchievements, renderKobems } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shell = document.getElementById('runnerShell');
const menu = document.getElementById('menu');
const gameOverPanel = document.getElementById('gameOverPanel');
const runnerHud = document.getElementById('runnerHud');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const pauseBtn = document.getElementById('pauseBtn');
const playBtn = document.getElementById('playBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const rankingBtn = document.getElementById('rankingBtn');
const achievementsBtn = document.getElementById('achievementsBtn');
const settingsBtn = document.getElementById('settingsBtn');
const kobemsBtn = document.getElementById('kobemsBtn');
const rankingPanel = document.getElementById('rankingPanel');
const achievementsPanel = document.getElementById('achievementsPanel');
const settingsPanel = document.getElementById('settingsPanel');
const kobemsPanel = document.getElementById('kobemsPanel');
const soundToggle = document.getElementById('soundToggle');
const vibrationToggle = document.getElementById('vibrationToggle');
const playerName = document.getElementById('playerName');
const gameOverSummary = document.getElementById('gameOverSummary');
const rewardToast = document.getElementById('rewardToast');
const store = loadStore();
const audio = new AudioBus(store);
const player = new Player();
const obstacles = new ObstacleSystem();
const coins = new CoinSystem();
const powerups = new PowerupSystem();
const sceneImage = new Image();
sceneImage.src = 'assets/img/kobem-runner-scene-clean.png';

const game = {
  width:900,
  height:1600,
  running:false,
  paused:false,
  score:0,
  coins:0,
  gems:0,
  nextGemKm:5,
  toastTimer:0,
  combo:1,
  lives:5,
  distance:0,
  energy:100,
  speed:620,
  baseSpeed:620,
  level:0,
  turbo:false,
  shake:0,
  time:0,
  last:0,
  activePowerups:{turbo:0,shield:0,magnet:0,multiplier:0}
};

const particles = [];
const lanes = [300,450,600];
let pointerStartX = 0;
let pointerStartY = 0;

function resize(){
  const rect = shell.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  game.width = rect.width;
  game.height = rect.height;
  lanes[0] = game.width * .28;
  lanes[1] = game.width * .5;
  lanes[2] = game.width * .72;
}

function reset(){
  game.running = true;
  game.paused = false;
  game.score = 0;
  game.coins = 0;
  game.gems = 0;
  game.nextGemKm = 5;
  game.toastTimer = 0;
  game.combo = 1;
  game.lives = 5;
  game.distance = 0;
  game.energy = 100;
  game.baseSpeed = 620;
  game.speed = 620;
  game.level = 0;
  game.turbo = false;
  game.shake = 0;
  game.time = 0;
  game.activePowerups = {turbo:0,shield:0,magnet:0,multiplier:0};
  rewardToast.classList.add('is-hidden');
  particles.length = 0;
  player.reset();
  player.setSkin(KOBEMS.find(item => item.id === store.selected));
  obstacles.reset();
  coins.reset();
  powerups.reset();
  setScreen('game');
  updateHud(game);
}

function setScreen(name){
  menu.classList.toggle('is-hidden', name !== 'menu');
  gameOverPanel.classList.toggle('is-hidden', name !== 'gameover');
  runnerHud.style.display = name === 'menu' ? 'none' : '';
  document.querySelector('.runner-bottom-hud').style.display = name === 'menu' ? 'none' : '';
  document.querySelector('.runner-controls').style.display = name === 'menu' ? 'none' : '';
}

function openPanel(panel){
  audio.play('button');
  document.querySelectorAll('.runner-panel').forEach(item => {
    item.classList.add('is-hidden');
    item.setAttribute('aria-hidden','true');
  });
  panel.classList.remove('is-hidden');
  panel.setAttribute('aria-hidden','false');
  renderPanels();
}

function closePanels(){
  document.querySelectorAll('.runner-panel').forEach(item => {
    item.classList.add('is-hidden');
    item.setAttribute('aria-hidden','true');
  });
}

function renderPanels(){
  renderRanking(store.ranking, playerName.value || 'Voce');
  renderAchievements(store);
  renderKobems(store, selectKobem, buyKobem);
  soundToggle.checked = store.sound;
  vibrationToggle.checked = store.vibration;
}

function selectKobem(id){
  store.selected = id;
  player.setSkin(KOBEMS.find(item => item.id === id));
  saveStore(store);
  renderPanels();
  audio.play('button');
}

function buyKobem(id){
  const kobem = KOBEMS.find(item => item.id === id);
  if(!kobem || store.wallet < kobem.price) return;
  store.wallet -= kobem.price;
  store.unlocked.push(id);
  store.selected = id;
  if(id === 'legendary') unlockAchievement(store,'legend');
  saveStore(store);
  renderPanels();
  audio.play('powerup');
}

function drawBackground(){
  const w = game.width;
  const h = game.height;
  if(sceneImage.complete && sceneImage.naturalWidth){
    drawCoverImage(sceneImage,w,h);
    drawPremiumMotionOverlay(w,h);
    return;
  }
  const horizon = h * .25;
  const sky = ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,'#0871df');
  sky.addColorStop(.24,'#83d6ff');
  sky.addColorStop(.48,'#cdefff');
  sky.addColorStop(.49,'#1d3448');
  sky.addColorStop(1,'#070b13');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,w,h);

  drawSunAndClouds(w,h);
  drawCity(w,h,horizon);
  drawEventSides(w,h,horizon);

  const roadTop = horizon + 18;
  const road = ctx.createLinearGradient(0,roadTop,0,h);
  road.addColorStop(0,'#59606a');
  road.addColorStop(.35,'#2b3039');
  road.addColorStop(1,'#11151d');
  ctx.fillStyle = road;
  ctx.beginPath();
  ctx.moveTo(w*.42,roadTop);
  ctx.lineTo(w*.58,roadTop);
  ctx.lineTo(w*.98,h);
  ctx.lineTo(w*.02,h);
  ctx.closePath();
  ctx.fill();

  drawRoadDetails(w,h,roadTop);
  drawPortal(w,h,roadTop);
  drawTraffic(w,h,roadTop);
  drawGemRibbon(w,h,roadTop);
}

function drawCoverImage(image,w,h){
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const iw = image.naturalWidth * scale;
  const ih = image.naturalHeight * scale;
  ctx.drawImage(image,(w - iw) * .5,(h - ih) * .5,iw,ih);
}

function drawPremiumMotionOverlay(w,h){
  const roadTop = h * .33;
  for(let y = (game.time * game.speed * .1) % 130; y < h*1.04; y += 130){
    const p = Math.max(0,(y - roadTop) / (h - roadTop));
    ctx.strokeStyle = `rgba(255,255,255,${.08 + p*.34})`;
    ctx.lineWidth = 2 + p * 10;
    ctx.beginPath();
    ctx.moveTo(w*.5,y);
    ctx.lineTo(w*.5,y + 34 + p*80);
    ctx.stroke();
  }
  const vignette = ctx.createRadialGradient(w*.5,h*.58,w*.18,w*.5,h*.58,h*.74);
  vignette.addColorStop(0,'rgba(255,255,255,0)');
  vignette.addColorStop(.65,'rgba(0,0,0,0)');
  vignette.addColorStop(1,'rgba(0,0,0,.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0,0,w,h);
}

function drawSunAndClouds(w,h){
  const glow = ctx.createRadialGradient(w*.68,h*.11,8,w*.68,h*.11,w*.42);
  glow.addColorStop(0,'rgba(255,255,255,.78)');
  glow.addColorStop(.22,'rgba(255,255,255,.28)');
  glow.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,w,h*.45);
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  for(let i=0;i<5;i++){
    const x = w * (.08 + i*.2);
    const y = h * (.09 + (i%2)*.045);
    ctx.beginPath();
    ctx.ellipse(x,y,42,15,0,0,Math.PI*2);
    ctx.ellipse(x+35,y+6,30,12,0,0,Math.PI*2);
    ctx.fill();
  }
}

function drawCity(w,h,horizon){
  for(let i=0;i<18;i++){
    const x = (i - 1) * w / 16;
    const bw = 22 + (i % 4) * 9;
    const bh = 70 + (i % 7) * 22;
    const top = horizon - bh * (.62 + (i % 3) * .06);
    ctx.fillStyle = i % 2 ? 'rgba(18,70,130,.62)' : 'rgba(13,42,85,.72)';
    ctx.fillRect(x - bw/2, top, bw, horizon - top + 16);
    ctx.fillStyle = 'rgba(255,236,143,.22)';
    for(let y=top+12;y<horizon;y+=18){
      ctx.fillRect(x-bw*.26,y,3,7);
      ctx.fillRect(x+bw*.14,y+5,3,7);
    }
  }
  drawPalm(w*.12,h*.26,1.15);
  drawPalm(w*.88,h*.27,-1.08);
}

function drawEventSides(w,h,horizon){
  for(let side=0;side<2;side++){
    const left = side === 0;
    const nearInner = left ? w*.18 : w*.82;
    const farInner = left ? w*.42 : w*.58;
    const outer = left ? -w*.04 : w*1.04;
    ctx.fillStyle = '#15212b';
    ctx.beginPath();
    ctx.moveTo(outer,horizon+22);
    ctx.lineTo(farInner,horizon+45);
    ctx.lineTo(nearInner,h);
    ctx.lineTo(outer,h);
    ctx.closePath();
    ctx.fill();

    for(let i=0;i<9;i++){
      const p = i / 8;
      const y = horizon + 55 + p * h*.58;
      const inner = lerp(farInner,nearInner,p);
      const scale = .55 + p*1.45;
      drawBanner(left ? inner - 94*scale : inner + 14*scale, y, 76*scale, 25*scale, 'BE', left ? -.1 : .1);
    }
    ctx.fillStyle = 'rgba(255,255,255,.24)';
    for(let i=0;i<100;i++){
      const p = (i % 50) / 50;
      const x = lerp(left ? w*.02 : w*.98, left ? w*.18 : w*.82, p) + Math.sin(i*2.1)*18;
      const y = horizon + 70 + p*h*.58;
      ctx.fillRect(x,y,2,2);
    }
  }
}

function drawBanner(x,y,w,h,label,tilt=0){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(tilt);
  ctx.fillStyle = '#101010';
  ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#fc6e02';
  ctx.fillRect(0,0,Math.max(4,w*.1),h);
  ctx.fillRect(w-Math.max(4,w*.1),0,Math.max(4,w*.1),h);
  ctx.fillStyle = '#ff7b16';
  ctx.font = `900 ${Math.max(12,h*.58)}px Inter`;
  ctx.textAlign = 'center';
  ctx.fillText(label,w/2,h*.68);
  ctx.restore();
}

function drawRoadDetails(w,h,roadTop){
  const lanePoints = [.36,.46,.54,.64];
  ctx.strokeStyle = 'rgba(255,255,255,.65)';
  lanePoints.forEach((x,index) => {
    ctx.lineWidth = index === 0 || index === lanePoints.length - 1 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(w*.5 + (w*x-w*.5)*.17, roadTop);
    ctx.lineTo(w*x + (index-1.5)*42, h);
    ctx.stroke();
  });

  for(let y = (game.time * game.speed * .095) % 126; y < h*1.02; y += 126){
    const p = Math.max(0,(y - roadTop) / (h - roadTop));
    const centerY = roadTop + y * .72;
    ctx.strokeStyle = `rgba(255,255,255,${.24 + p*.54})`;
    ctx.lineWidth = 2 + p * 12;
    ctx.beginPath();
    ctx.moveTo(w*.5, centerY);
    ctx.lineTo(w*.5, centerY + 42 + p*80);
    ctx.stroke();
  }

  const rail = ctx.createLinearGradient(0,roadTop,0,h);
  rail.addColorStop(0,'rgba(252,110,2,.25)');
  rail.addColorStop(1,'rgba(252,110,2,.95)');
  ctx.fillStyle = rail;
  [[.30,.34,.05,.09],[.66,.70,.91,.95]].forEach(([a,b,c,d]) => {
    ctx.beginPath();
    ctx.moveTo(w*a,roadTop);
    ctx.lineTo(w*b,roadTop);
    ctx.lineTo(w*d,h);
    ctx.lineTo(w*c,h);
    ctx.closePath();
    ctx.fill();
  });
}

function drawPortal(w,h,roadTop){
  ctx.save();
  ctx.translate(w*.5,roadTop + 20);
  ctx.strokeStyle = '#fc6e02';
  ctx.lineWidth = 8;
  ctx.shadowColor = '#fc6e02';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(0,54,98,Math.PI,0);
  ctx.lineTo(98,115);
  ctx.moveTo(-98,54);
  ctx.lineTo(-98,115);
  ctx.stroke();
  ctx.fillStyle = '#fc6e02';
  roundRect(ctx,-84,24,168,34,8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '900 14px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('BEM ESPORTIVO',0,46);
  ctx.restore();
}

function drawTraffic(w,h,roadTop){
  const cars = [
    {lane:.58,depth:.23,color:'#141923',w:42,h:76},
    {lane:.46,depth:.37,color:'#fc6e02',w:34,h:58},
    {lane:.62,depth:.49,color:'#222a35',w:56,h:104}
  ];
  cars.forEach(car => {
    const y = lerp(roadTop + 40,h*.68,car.depth);
    const x = lerp(w*.5,w*car.lane,car.depth);
    const s = .25 + car.depth * .8;
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(s,s);
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(-car.w*.5,-car.h*.5,car.w,car.h,10);
    ctx.fill();
    ctx.fillStyle = '#ff7b16';
    ctx.fillRect(-car.w*.32,-car.h*.18,car.w*.64,8);
    ctx.fillStyle = '#8fefff';
    ctx.fillRect(-car.w*.28,-car.h*.36,car.w*.56,12);
    ctx.restore();
  });
}

function drawGemRibbon(w,h,roadTop){
  for(let i=0;i<6;i++){
    const y = roadTop + 84 + i * 74 + ((game.time * game.speed * .04) % 74);
    if(y > h*.67) continue;
    const p = (y - roadTop) / (h - roadTop);
    const x = w*.5 + Math.sin(i*.9) * 12 * (1+p);
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(.35 + p*.92,.35 + p*.92);
    drawGem(ctx);
    ctx.restore();
  }
}

function drawGem(ctx){
  ctx.shadowColor = '#42e8ff';
  ctx.shadowBlur = 24;
  const gem = ctx.createLinearGradient(-22,-20,22,26);
  gem.addColorStop(0,'#eaffff');
  gem.addColorStop(.35,'#42e8ff');
  gem.addColorStop(1,'#0874e8');
  ctx.fillStyle = gem;
  ctx.beginPath();
  ctx.moveTo(-26,-8);
  ctx.lineTo(-12,-24);
  ctx.lineTo(14,-24);
  ctx.lineTo(28,-8);
  ctx.lineTo(0,28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.65)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawPalm(x,y,scale){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,Math.abs(scale));
  ctx.strokeStyle = '#4d2b13';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0,88);
  ctx.quadraticCurveTo(12,38,0,0);
  ctx.stroke();
  ctx.fillStyle = '#1f8f54';
  for(let i=0;i<7;i++){
    const a = -Math.PI*.85 + i*Math.PI*.28;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a)*25,Math.sin(a)*20,36,8,a,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function lerp(a,b,t){
  return a + (b - a) * t;
}

function update(dt){
  if(!game.running || game.paused) return;
  game.time += dt;
  game.level = Math.floor(game.distance / 1.2);
  const turboActive = (game.turbo || game.activePowerups.turbo > 0) && game.energy > 0;
  shell.classList.toggle('is-turbo', turboActive);
  game.speed = game.baseSpeed + game.level * 28;
  if(turboActive) game.speed *= 1.5;
  game.energy = Math.max(0, Math.min(100, game.energy + (turboActive ? -35 : -2.8) * dt));
  if(game.energy <= 0) game.turbo = false;

  Object.keys(game.activePowerups).forEach(key => {
    game.activePowerups[key] = Math.max(0, game.activePowerups[key] - dt);
  });

  player.update(dt, lanes, game.height, game.speed);
  obstacles.update(dt, game, lanes);
  coins.update(dt, game, lanes, player);
  powerups.update(dt, game, lanes);
  updateParticles(dt);
  checkCollisions();

  const multiplier = game.activePowerups.multiplier ? 2 : 1;
  game.score += game.speed * game.combo * multiplier * dt * .11;
  game.distance += game.speed * dt / 3000;
  if(game.distance >= game.nextGemKm) awardGem();
  game.toastTimer = Math.max(0, game.toastTimer - dt);
  if(game.toastTimer <= 0) rewardToast.classList.add('is-hidden');
  game.shake = Math.max(0, game.shake - dt * 22);
  updateHud(game);
}

function awardGem(){
  game.gems += 1;
  game.nextGemKm += 5;
  game.toastTimer = 2.4;
  rewardToast.classList.remove('is-hidden');
  impact(game.width * .5, game.height * .25, '#42e8ff');
  audio.play('powerup');
}

function checkCollisions(){
  const hb = player.getHitbox();
  obstacles.items.forEach(item => {
    if(item.hit) return;
    const scale = .45 + item.y / 1800;
    const box = {x:item.x - item.w*scale*.5, y:item.y - item.h*scale*.65, w:item.w*scale, h:item.h*scale};
    if(item.type.dodge === 'jump' && player.isJumping()) return;
    if(item.type.dodge === 'slide' && player.isSliding()) return;
    if(intersects(hb,box)){
      item.hit = true;
      impact(item.x,item.y,'#fc6e02');
      if(game.activePowerups.shield || player.invulnerable) return;
      game.lives -= 1;
      game.combo = 1;
      player.invulnerable = 1.4;
      game.shake = 12;
      audio.play('hit');
      vibrate(90);
      if(game.lives <= 0) endGame();
    }
  });

  coins.items.forEach(item => {
    if(Math.hypot(player.x - item.x, player.y - item.y) < 58){
      item.collected = true;
      game.coins += item.value;
      game.energy = Math.min(100, game.energy + 4 + item.value * 2);
      game.combo = Math.min(10, game.combo + 1);
      impact(item.x,item.y,'#18c8ff');
      audio.play('coin');
    }
  });

  powerups.items.forEach(item => {
    if(item.collected) return;
    if(Math.hypot(player.x - item.x, player.y - item.y) < 68){
      item.collected = true;
      item.y = game.height + 200;
      game.activePowerups[item.def.id] = 8;
      impact(item.x,item.y,item.def.color);
      audio.play('powerup');
    }
  });
}

function endGame(){
  game.running = false;
  gameOverSummary.textContent = `Voce fez ${Math.floor(game.score).toLocaleString('pt-BR')} pontos, coletou ${game.coins} garrafas, ganhou ${game.gems} joia(s) e correu ${game.distance.toFixed(1).replace('.', ',')} km.`;
  store.best = Math.max(store.best, Math.floor(game.score));
  store.wallet += game.coins;
  store.gems = (store.gems || 0) + game.gems;
  store.bestDistance = Math.max(store.bestDistance, game.distance);
  addRanking(store, {
    name:playerName.value || 'Voce',
    score:Math.floor(game.score),
    distance:Number(game.distance.toFixed(1)),
    date:new Date().toLocaleDateString('pt-BR')
  });
  unlockAchievement(store,'first-run');
  if(game.score >= 1000) unlockAchievement(store,'score-1000');
  if(game.score >= 5000) unlockAchievement(store,'score-5000');
  if(game.distance >= 5) unlockAchievement(store,'dist-5');
  if(store.bestDistance >= 50) unlockAchievement(store,'dist-50');
  if(store.wallet >= 100) unlockAchievement(store,'bottles-100');
  if(store.wallet >= 500) unlockAchievement(store,'bottles-500');
  if(game.energy >= 80) unlockAchievement(store,'hydration-hero');
  if(game.combo >= 10) unlockAchievement(store,'dribble-master');
  saveStore(store);
  renderPanels();
  setScreen('gameover');
  audio.play('gameover');
}

function impact(x,y,color){
  for(let i=0;i<18;i++){
    particles.push({x,y,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*260,life:.55,color});
  }
}

function updateParticles(dt){
  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 250 * dt;
    p.life -= dt;
  });
  for(let i=particles.length-1;i>=0;i--){
    if(particles[i].life <= 0) particles.splice(i,1);
  }
}

function drawParticles(){
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0,p.life/.55);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,5 + p.life*8,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function draw(){
  ctx.save();
  if(game.shake){
    ctx.translate((Math.random()-.5)*game.shake,(Math.random()-.5)*game.shake);
  }
  drawBackground();
  coins.draw(ctx);
  powerups.draw(ctx);
  obstacles.draw(ctx);
  player.draw(ctx, game.activePowerups);
  drawParticles();
  ctx.restore();
  if(game.paused && game.running){
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0,0,game.width,game.height);
    ctx.fillStyle = '#fff';
    ctx.font = '900 42px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSADO',game.width/2,game.height/2);
  }
}

function loop(now){
  const dt = Math.min(.033, (now - game.last) / 1000 || 0);
  game.last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function intersects(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function vibrate(ms){
  if(store.vibration && navigator.vibrate) navigator.vibrate(ms);
}

function bindControls(){
  leftBtn.addEventListener('click', () => player.move(-1));
  rightBtn.addEventListener('click', () => player.move(1));
  pauseBtn.addEventListener('click', () => { game.paused = !game.paused; audio.play('button'); });
  playBtn.addEventListener('click', () => { audio.play('button'); reset(); });
  restartBtn.addEventListener('click', reset);
  menuBtn.addEventListener('click', () => setScreen('menu'));
  rankingBtn.addEventListener('click', () => openPanel(rankingPanel));
  achievementsBtn.addEventListener('click', () => openPanel(achievementsPanel));
  settingsBtn.addEventListener('click', () => openPanel(settingsPanel));
  kobemsBtn.addEventListener('click', () => openPanel(kobemsPanel));
  document.querySelectorAll('[data-close-panel]').forEach(button => button.addEventListener('click', closePanels));
  soundToggle.addEventListener('change', () => { store.sound = soundToggle.checked; saveStore(store); });
  vibrationToggle.addEventListener('change', () => { store.vibration = vibrationToggle.checked; saveStore(store); });
  playerName.addEventListener('input', () => renderRanking(store.ranking, playerName.value || 'Voce'));

  window.addEventListener('keydown', event => {
    if(event.key === 'ArrowLeft') player.move(-1);
    if(event.key === 'ArrowRight') player.move(1);
    if(event.key === 'ArrowUp') player.jumpStart();
    if(event.key === 'ArrowDown') player.slideStart();
    if(event.key === ' ') game.turbo = true;
    if(event.key === 'w' || event.key === 'W') player.jumpStart();
    if(event.key === 's' || event.key === 'S') player.slideStart();
  });
  window.addEventListener('keyup', event => {
    if(event.key === ' ') game.turbo = false;
  });
  canvas.addEventListener('pointerdown', event => {
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
  });
  canvas.addEventListener('pointerup', event => {
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 28) player.move(dx > 0 ? 1 : -1);
    if(dy > 34 && Math.abs(dy) > Math.abs(dx)){
      player.slideStart();
      audio.play('turbo');
    }
    if(dy < -34 && Math.abs(dy) > Math.abs(dx)){
      player.jumpStart();
      game.activePowerups.turbo = Math.max(game.activePowerups.turbo, .65);
      audio.play('turbo');
    }
  });
}

window.addEventListener('resize', resize);
resize();
bindControls();
renderPanels();
setScreen('menu');
requestAnimationFrame(loop);

