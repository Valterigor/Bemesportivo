import { KOBEMS } from './player.js';
import { ACHIEVEMENTS } from './storage.js';

export function formatNumber(value){
  return Math.floor(value).toLocaleString('pt-BR');
}

export function updateHud(game){
  document.getElementById('score').textContent = formatNumber(game.score);
  document.getElementById('coinsCount').textContent = formatNumber(game.coins);
  document.getElementById('gemsCount').textContent = formatNumber(game.gems);
  document.getElementById('combo').textContent = game.combo;
  document.getElementById('energy').textContent = Math.round(game.energy);
  document.getElementById('energyBar').style.width = `${Math.max(0, game.energy)}%`;
  document.getElementById('distance').textContent = `${game.distance.toFixed(2).replace('.', ',')} km`;
  document.getElementById('lives').textContent = '♥'.repeat(Math.max(0, game.lives));
  document.getElementById('magnetTimer').textContent = `${Math.ceil(game.activePowerups.magnet || 0)}s`;
  const mission = Math.min(50, game.coins);
  document.getElementById('missionText').textContent = `${mission}/50`;
  document.getElementById('missionBar').style.width = `${mission * 2}%`;
}

export function renderRanking(list, currentName){
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = (list.length ? list : [
    {name:'Valter',score:15240,distance:4.3,date:'Hoje'},
    {name:'Lucas',score:12880,distance:3.8,date:'Hoje'},
    {name:'Ana Paula',score:11320,distance:3.2,date:'Hoje'}
  ]).slice(0,10).map((item,index) => (
    `<li class="${item.name === currentName ? 'is-you' : ''}"><strong>${index + 1}</strong><span>${item.name}</span><b>${formatNumber(item.score)}</b></li>`
  )).join('');
}

export function renderAchievements(store){
  const achievementsList = document.getElementById('achievementsList');
  achievementsList.innerHTML = ACHIEVEMENTS.map(item => {
    const unlocked = store.achievements.includes(item.id);
    return `<article class="achievement-card ${unlocked ? 'is-unlocked' : ''}"><strong>${unlocked ? '🏆' : '🔒'} ${item.name}</strong><span>${item.desc}</span></article>`;
  }).join('');
}

export function renderKobems(store, onSelect, onBuy){
  const kobemsList = document.getElementById('kobemsList');
  kobemsList.innerHTML = KOBEMS.map(kobem => {
    const unlocked = store.unlocked.includes(kobem.id);
    const selected = store.selected === kobem.id;
    return `<article class="kobem-card ${selected ? 'is-selected' : ''}" style="--skin:${kobem.color}">
      <div class="kobem-avatar">🤖</div>
      <strong>${kobem.name}</strong>
      <span>${unlocked ? 'Desbloqueado' : `${kobem.price} garrafas`}</span>
      <button data-kobem="${kobem.id}" type="button">${selected ? 'Selecionado' : unlocked ? 'Usar' : 'Comprar'}</button>
    </article>`;
  }).join('');

  kobemsList.querySelectorAll('[data-kobem]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.kobem;
      if(store.unlocked.includes(id)) onSelect(id);
      else onBuy(id);
    });
  });
}
