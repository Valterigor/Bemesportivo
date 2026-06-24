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
const store = loadStore();
const audio = new AudioBus(store);
const player = new Player();
const obstacles = new ObstacleSystem();
const coins = new CoinSystem();
const powerups = new PowerupSystem();

const game = {
  width:900,
  height:1600,
  running:false,
  paused:false,
  score:0,
  coins:0,
  combo:1,
  lives:3,
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
  game.combo = 1;
  game.lives = 3;
  game.distance = 0;
  game.energy = 100;
  game.baseSpeed = 620;
  game.speed = 620;
  game.level = 0;
  game.turbo = false;
  game.shake = 0;
  game.time = 0;
  game.activePowerups = {turbo:0,shield:0,magnet:0,multiplier:0};
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
  renderRanking(store.ranking, playerName.value || 'Você');
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
  const sky = ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,'#0a58d6');
  sky.addColorStop(.36,'#74c8ff');
  sky.addColorStop(.55,'#28536b');
  sky.addColorStop(1,'#0b141f');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,w,h);

  drawCity(w,h);
  drawCrowd(w,h);

  const roadTop = h * .27;
  ctx.fillStyle = '#2b313c';
  ctx.beginPath();
  ctx.moveTo(w*.35,roadTop);
  ctx.lineTo(w*.65,roadTop);
  ctx.lineTo(w*.96,h);
  ctx.lineTo(w*.04,h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,.68)';
  ctx.lineWidth = 3;
  [w*.4,w*.5,w*.6].forEach((x,i) => {
    ctx.beginPath();
    ctx.moveTo(w*.5 + (x-w*.5)*.25, roadTop);
    ctx.lineTo(x + (i-1)*70, h);
    ctx.stroke();
  });

  for(let y = (game.time * game.speed * .08) % 120; y < h; y += 120){
    const p = y / h;
    ctx.strokeStyle = `rgba(255,211,77,${.2 + p*.6})`;
    ctx.lineWidth = 2 + p * 10;
    ctx.beginPath();
    ctx.moveTo(w*.5, roadTop + y * .72);
    ctx.lineTo(w*.5, roadTop + y * .72 + 50 + p*60);
    ctx.stroke();
  }

  drawPortal(w,h,roadTop);
}

function drawCity(w,h){
  for(let i=0;i<10;i++){
    const x = i * w / 9;
    const bh = 80 + (i % 4) * 34;
    ctx.fillStyle = i % 2 ? 'rgba(27,82,145,.55)' : 'rgba(14,48,102,.62)';
    ctx.fillRect(x - 28, h*.19 - bh*.25, 56, bh);
  }
}

function drawCrowd(w,h){
  ctx.fillStyle = '#17341f';
  ctx.fillRect(0,h*.33,w*.19,h*.45);
  ctx.fillRect(w*.81,h*.33,w*.19,h*.45);
  ctx.fillStyle = '#fc6e02';
  for(let i=0;i<7;i++){
    const y = h*.38 + i*54;
    ctx.fillRect(12,y,w*.16,22);
    ctx.fillRect(w*.82,y,w*.16,22);
  }
}

function drawPortal(w,h,roadTop){
  ctx.save();
  ctx.translate(w*.5,roadTop + 34);
  ctx.strokeStyle = '#fc6e02';
  ctx.lineWidth = 10;
  ctx.shadowColor = '#fc6e02';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(0,44,88,Math.PI,0);
  ctx.lineTo(88,98);
  ctx.moveTo(-88,44);
  ctx.lineTo(-88,98);
  ctx.stroke();
  ctx.fillStyle = '#fc6e02';
  roundRect(ctx,-70,18,140,36,8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '900 15px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('BEM ESPORTIVO',0,42);
  ctx.restore();
}

function update(dt){
  if(!game.running || game.paused) return;
  game.time += dt;
  game.level = Math.floor(game.distance / 1.2);
  const turboActive = (game.turbo || game.activePowerups.turbo > 0) && game.energy > 0;
  shell.classList.toggle('is-turbo', turboActive);
  game.speed = game.baseSpeed + game.level * 28;
  if(turboActive) game.speed *= 1.5;
  game.energy = Math.max(0, Math.min(100, game.energy + (turboActive ? -34 : 17) * dt));
  if(game.energy <= 0) game.turbo = false;

  Object.keys(game.activePowerups).forEach(key => {
    game.activePowerups[key] = Math.max(0, game.activePowerups[key] - dt);
  });

  player.update(dt, lanes, game.height);
  obstacles.update(dt, game, lanes);
  coins.update(dt, game, lanes, player);
  powerups.update(dt, game, lanes);
  updateParticles(dt);
  checkCollisions();

  const multiplier = game.activePowerups.multiplier ? 2 : 1;
  game.score += game.speed * game.combo * multiplier * dt * .11;
  game.distance += game.speed * dt / 3000;
  game.shake = Math.max(0, game.shake - dt * 22);
  updateHud(game);
}

function checkCollisions(){
  const hb = player.getHitbox();
  obstacles.items.forEach(item => {
    if(item.hit) return;
    const scale = .45 + item.y / 1800;
    const box = {x:item.x - item.w*scale*.5, y:item.y - item.h*scale*.65, w:item.w*scale, h:item.h*scale};
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
      game.combo = Math.min(10, game.combo + 1);
      impact(item.x,item.y,item.kind === 'gold' ? '#ffd34d' : '#42e8ff');
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
  gameOverSummary.textContent = `Você fez ${Math.floor(game.score).toLocaleString('pt-BR')} pontos e correu ${game.distance.toFixed(1).replace('.', ',')} km.`;
  store.best = Math.max(store.best, Math.floor(game.score));
  store.wallet += game.coins;
  store.bestDistance = Math.max(store.bestDistance, game.distance);
  addRanking(store, {
    name:playerName.value || 'Você',
    score:Math.floor(game.score),
    distance:Number(game.distance.toFixed(1)),
    date:new Date().toLocaleDateString('pt-BR')
  });
  unlockAchievement(store,'first-run');
  if(game.score >= 1000) unlockAchievement(store,'score-1000');
  if(game.score >= 5000) unlockAchievement(store,'score-5000');
  if(game.distance >= 5) unlockAchievement(store,'dist-5');
  if(store.bestDistance >= 50) unlockAchievement(store,'dist-50');
  if(store.wallet >= 100) unlockAchievement(store,'coins-100');
  if(store.wallet >= 500) unlockAchievement(store,'coins-500');
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
  playerName.addEventListener('input', () => renderRanking(store.ranking, playerName.value || 'Você'));

  window.addEventListener('keydown', event => {
    if(event.key === 'ArrowLeft') player.move(-1);
    if(event.key === 'ArrowRight') player.move(1);
    if(event.key === ' ' || event.key === 'ArrowUp') game.turbo = true;
  });
  window.addEventListener('keyup', event => {
    if(event.key === ' ' || event.key === 'ArrowUp') game.turbo = false;
  });
  canvas.addEventListener('pointerdown', event => {
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
  });
  canvas.addEventListener('pointerup', event => {
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 28) player.move(dx > 0 ? 1 : -1);
    if(dy < -34 && game.energy > 0){
      game.activePowerups.turbo = Math.max(game.activePowerups.turbo, 1.8);
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
