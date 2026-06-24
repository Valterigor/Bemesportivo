import { Player, KOBEMS } from './player.js';
import { createObstacle, drawObstacle } from './obstacles.js';
import { createCoin, drawCoin } from './coins.js';
import { createPowerup, drawPowerup } from './powerups.js';
import {
  achievements,
  createStore,
  saveStore,
  updateRunUi,
  renderRanking,
  renderAchievements,
  renderKobems,
  formatScore,
  formatDistance
} from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const elements = {
  score:document.getElementById('score'),
  coins:document.getElementById('coinsCount'),
  combo:document.getElementById('combo'),
  energy:document.getElementById('energy'),
  energyBar:document.getElementById('energyBar'),
  distance:document.getElementById('distance'),
  lives:document.getElementById('lives')
};
const menu = document.getElementById('menu');
const menuText = document.getElementById('menuText');
const callout = document.getElementById('callout');
const bestScore = document.getElementById('bestScore');
const walletCoins = document.getElementById('walletCoins');
const bestDistance = document.getElementById('bestDistance');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const runBtn = document.getElementById('runBtn');
const kobemsBtn = document.getElementById('kobemsBtn');
const rankingBtn = document.getElementById('rankingBtn');
const achievementsBtn = document.getElementById('achievementsBtn');
const kobemsPanel = document.getElementById('kobemsPanel');
const rankingPanel = document.getElementById('rankingPanel');
const achievementsPanel = document.getElementById('achievementsPanel');
const kobemsList = document.getElementById('kobemsList');
const rankingList = document.getElementById('rankingList');
const achievementsList = document.getElementById('achievementsList');

const lanes = [0.22,0.5,0.78];
const player = new Player(lanes);
const store = createStore();
let width = 0;
let height = 0;
let frame = 0;
let animationId = null;
let running = false;
let paused = false;
let turboPressed = false;
let obstacles = [];
let coins = [];
let powerups = [];
let particles = [];
let state = createRunState();

function createRunState(){
  return {
    score:0,
    coins:0,
    combo:1,
    comboTimer:0,
    maxCombo:1,
    lives:3,
    energy:100,
    distance:0,
    speed:5.4,
    dodges:0
  };
}

function resize(){
  const ratio = window.devicePixelRatio || 1;
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
}

function getSkin(){
  return KOBEMS.find(k => k.id === store.selected) || KOBEMS[0];
}

function syncMenu(){
  bestScore.textContent = formatScore(store.best);
  walletCoins.textContent = formatScore(store.wallet);
  bestDistance.textContent = Number(store.distance || 0).toFixed(1).replace('.', ',');
  renderRanking(rankingList, store.ranking);
  renderAchievements(achievementsList, store.achievements);
  renderKobems(kobemsList, KOBEMS, store, selectKobem, buyKobem);
}

function selectKobem(id){
  store.selected = id;
  saveStore(store);
  syncMenu();
  showCallout('Kobem selecionado!');
}

function buyKobem(id){
  const kobem = KOBEMS.find(k => k.id === id);
  if(!kobem) return;
  if(store.wallet < kobem.price){
    showCallout('Moedas insuficientes');
    return;
  }
  store.wallet -= kobem.price;
  store.unlocked.push(id);
  store.selected = id;
  saveStore(store);
  syncMenu();
  showCallout('Novo Kobem liberado!');
}

function startGame(){
  cancelAnimationFrame(animationId);
  state = createRunState();
  frame = 0;
  obstacles = [];
  coins = [];
  powerups = [];
  particles = [];
  running = true;
  paused = false;
  turboPressed = false;
  player.reset(getSkin());
  menu.classList.add('is-hidden');
  closePanels();
  pauseBtn.textContent = 'II';
  showCallout('Desvie dos marcadores!');
  updateRunUi(elements,state);
  loop();
}

function togglePause(){
  if(!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '>' : 'II';
  setTurbo(false);
  if(paused) showCallout('Jogo pausado');
  else loop();
}

function setTurbo(value){
  turboPressed = Boolean(value) && running && !paused;
  runBtn.classList.toggle('is-pressed', turboPressed);
}

function showCallout(text){
  callout.textContent = text;
  callout.classList.remove('is-hidden');
  clearTimeout(showCallout.timer);
  showCallout.timer = setTimeout(() => callout.classList.add('is-hidden'), 1500);
}

function closePanels(){
  [kobemsPanel, rankingPanel, achievementsPanel].forEach(panel => {
    panel.classList.add('is-hidden');
    panel.setAttribute('aria-hidden','true');
  });
}

function openPanel(panel){
  closePanels();
  panel.classList.remove('is-hidden');
  panel.setAttribute('aria-hidden','false');
}

function drawBackground(){
  const sky = ctx.createLinearGradient(0,0,0,height * .58);
  sky.addColorStop(0,'#0c58c9');
  sky.addColorStop(.55,'#80caff');
  sky.addColorStop(1,'#ffe18b');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,width,height);

  ctx.fillStyle = 'rgba(255,255,255,.2)';
  for(let i=0;i<7;i++){
    const x = (i * 67 + frame * .18) % (width + 80) - 40;
    ctx.fillRect(x, height * .18 + (i % 3) * 18, 34, 78 + (i % 4) * 18);
  }

  ctx.fillStyle = '#114d2d';
  ctx.beginPath();
  ctx.moveTo(0,height * .36);
  ctx.quadraticCurveTo(width * .5,height * .28,width,height * .36);
  ctx.lineTo(width,height);
  ctx.lineTo(0,height);
  ctx.fill();

  ctx.fillStyle = 'rgba(252,110,2,.94)';
  for(let i=0;i<8;i++){
    const y = height * .34 + ((i * 70 + frame * state.speed) % (height * .58));
    const scale = .35 + y / height;
    ctx.fillRect(width * .08,y,8 * scale,38 * scale);
    ctx.fillRect(width * .92,y,8 * scale,38 * scale);
  }
}

function drawField(){
  drawBackground();
  const topY = height * .31;
  const road = ctx.createLinearGradient(0,topY,0,height);
  road.addColorStop(0,'#61d64c');
  road.addColorStop(.55,'#31972d');
  road.addColorStop(1,'#125017');
  ctx.fillStyle = road;
  ctx.beginPath();
  ctx.moveTo(width * .23,topY);
  ctx.lineTo(width * .77,topY);
  ctx.lineTo(width * 1.08,height);
  ctx.lineTo(width * -.08,height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([18,18]);
  for(let i=1;i<3;i++){
    const start = width * (.23 + (.54 / 3) * i);
    const end = width * (i / 3);
    ctx.beginPath();
    ctx.moveTo(start,topY);
    ctx.lineTo(end,height);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(252,110,2,.95)';
  ctx.fillRect(0,height*.43,12,height*.57);
  ctx.fillRect(width-12,height*.43,12,height*.57);
}

function spawn(){
  if(frame % Math.max(42, 86 - Math.floor(state.distance * 2)) === 0) obstacles.push(createObstacle(width, lanes));
  if(frame % 43 === 0) coins.push(createCoin(width, lanes));
  if(frame % 320 === 0) powerups.push(createPowerup(width, lanes));
}

function addParticles(x,y,color){
  particles.push({x,y,life:24,color});
}

function drawParticles(){
  particles.forEach((p,i) => {
    ctx.fillStyle = p.color.replace('ALPHA', String(p.life / 24));
    ctx.beginPath();
    ctx.arc(p.x,p.y,24 - p.life / 2,0,Math.PI*2);
    ctx.fill();
    p.life -= 1;
    if(p.life <= 0) particles.splice(i,1);
  });
}

function bumpCombo(){
  const steps = [1,2,3,4,5,10];
  const index = Math.min(steps.length - 1, steps.indexOf(state.combo) + 1);
  state.combo = steps[index] || 2;
  state.comboTimer = 180;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
}

function resetCombo(){
  state.combo = 1;
  state.comboTimer = 0;
}

function applyPowerup(type){
  if(type === 'shield') player.shield = 480;
  if(type === 'magnet') player.magnet = 520;
  if(type === 'multiplier') player.multiplier = 520;
  if(type === 'turbo') state.energy = Math.min(100, state.energy + 45);
  showCallout(type === 'shield' ? 'Escudo ativado!' : type === 'magnet' ? 'Ima de moedas!' : type === 'multiplier' ? 'Pontos x2!' : 'Turbo recarregado!');
}

function checkCollisions(){
  const px = player.getX(width);
  const py = height - 178;

  obstacles.forEach((o,index) => {
    if(!o.passed && o.y > py + 65){
      o.passed = true;
      state.dodges += 1;
      state.score += 30 * state.combo;
      bumpCombo();
    }
    if(Math.abs(px - o.x) < 42 && Math.abs(py - o.y) < 62){
      obstacles.splice(index,1);
      if(player.shield > 0){
        player.shield = 0;
        addParticles(o.x,o.y,'rgba(36,216,255,ALPHA)');
        showCallout('Escudo salvou!');
        return;
      }
      state.lives -= 1;
      resetCombo();
      shake();
      addParticles(o.x,o.y,'rgba(252,110,2,ALPHA)');
      showCallout(state.lives > 0 ? 'Colisao!' : 'Game over');
      if(state.lives <= 0) gameOver();
    }
  });

  coins.forEach((c,index) => {
    if(player.magnet > 0 && Math.abs(px - c.x) < 150 && c.y > height * .35){
      c.x += (px - c.x) * .16;
      c.y += (py - c.y) * .08;
    }
    if(Math.abs(px - c.x) < 42 && Math.abs(py - c.y) < 60){
      coins.splice(index,1);
      state.coins += c.value;
      state.score += c.points * state.combo * (player.multiplier > 0 ? 2 : 1);
      bumpCombo();
      addParticles(c.x,c.y,'rgba(255,201,40,ALPHA)');
      if(state.coins % 25 === 0) showCallout(`${state.coins} moedas!`);
    }
  });

  powerups.forEach((p,index) => {
    if(Math.abs(px - p.x) < 44 && Math.abs(py - p.y) < 62){
      powerups.splice(index,1);
      applyPowerup(p.type);
      state.score += 180 * state.combo;
      addParticles(p.x,p.y,'rgba(36,216,255,ALPHA)');
    }
  });
}

function update(){
  frame += 1;
  player.update();
  if(state.comboTimer > 0) state.comboTimer -= 1;
  if(state.comboTimer <= 0 && state.combo > 1) resetCombo();

  if(turboPressed && state.energy > 0){
    state.speed = player.multiplier > 0 ? 10.8 : 9.4;
    state.energy -= .48;
  }else{
    state.speed = 5.4 + Math.min(3.2, state.distance * .08);
    state.energy += .2;
  }
  state.energy = Math.max(0,Math.min(100,state.energy));

  spawn();
  obstacles.forEach(o => o.y += state.speed * o.speed);
  coins.forEach(c => c.y += state.speed);
  powerups.forEach(p => p.y += state.speed);
  obstacles = obstacles.filter(o => o.y < height + 100);
  coins = coins.filter(c => c.y < height + 60);
  powerups = powerups.filter(p => p.y < height + 70);
  checkCollisions();

  state.distance += state.speed / 1800;
  state.score += Math.ceil(state.speed * state.combo * (player.multiplier > 0 ? 2 : 1));
  updateRunUi(elements,state);
}

function shake(){
  canvas.style.transform = 'translateX(8px)';
  setTimeout(() => canvas.style.transform = 'translateX(-8px)',60);
  setTimeout(() => canvas.style.transform = 'translateX(0)',120);
}

function gameOver(){
  running = false;
  setTurbo(false);
  const run = {...state, date:new Date().toLocaleDateString('pt-BR')};
  store.best = Math.max(store.best, run.score);
  store.wallet += run.coins;
  store.distance = Math.max(store.distance, run.distance);
  store.ranking = [run, ...store.ranking].sort((a,b) => b.score - a.score).slice(0,10);
  achievements.forEach(item => {
    if(!store.achievements.includes(item.id) && item.test(run)) store.achievements.push(item.id);
  });
  saveStore(store);
  syncMenu();
  menu.querySelector('h1').innerHTML = '<span>FIM DE</span>JOGO';
  menuText.innerHTML = `Pontuacao: <strong>${formatScore(run.score)}</strong><br>Moedas: <strong>${run.coins}</strong> · Distancia: <strong>${formatDistance(run.distance)}</strong>`;
  startBtn.textContent = 'Jogar de novo';
  menu.classList.remove('is-hidden');
}

function loop(){
  if(!running || paused) return;
  ctx.clearRect(0,0,width,height);
  drawField();
  obstacles.forEach(o => drawObstacle(ctx,o));
  coins.forEach(c => drawCoin(ctx,c));
  powerups.forEach(p => drawPowerup(ctx,p,frame));
  drawParticles();
  player.draw(ctx,width,height,frame);
  update();
  animationId = requestAnimationFrame(loop);
}

startBtn.addEventListener('click', startGame);
kobemsBtn.addEventListener('click', () => openPanel(kobemsPanel));
rankingBtn.addEventListener('click', () => openPanel(rankingPanel));
achievementsBtn.addEventListener('click', () => openPanel(achievementsPanel));
document.querySelectorAll('[data-close-panel]').forEach(button => button.addEventListener('click', closePanels));
leftBtn.addEventListener('click', () => running && !paused && player.moveLeft());
rightBtn.addEventListener('click', () => running && !paused && player.moveRight());
pauseBtn.addEventListener('click', togglePause);
runBtn.addEventListener('pointerdown', event => {
  event.preventDefault();
  setTurbo(true);
});
window.addEventListener('pointerup', () => setTurbo(false));
window.addEventListener('pointercancel', () => setTurbo(false));
window.addEventListener('keydown', event => {
  if(event.key === 'ArrowLeft' && running && !paused) player.moveLeft();
  if(event.key === 'ArrowRight' && running && !paused) player.moveRight();
  if(event.key === 'p' || event.key === 'P') togglePause();
  if(event.key === ' '){
    event.preventDefault();
    setTurbo(true);
  }
});
window.addEventListener('keyup', event => {
  if(event.key === ' ') setTurbo(false);
});
window.addEventListener('resize', resize);

resize();
syncMenu();
updateRunUi(elements,state);
showCallout('Drible, corra e evolua!');
