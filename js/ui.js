export const achievements = [
  {id:'first-run', label:'Primeira partida', test:run => run.score > 0},
  {id:'thousand', label:'Primeiros 1000 pontos', test:run => run.score >= 1000},
  {id:'five-km', label:'Primeiros 5 km', test:run => run.distance >= 5},
  {id:'hundred-dodges', label:'100 marcadores evitados', test:run => run.dodges >= 100},
  {id:'dribble-master', label:'Mestre do Drible', test:run => run.maxCombo >= 10},
  {id:'legend', label:'Lenda Kobem', test:run => run.score >= 12500}
];

export function formatScore(value){
  return Number(value || 0).toLocaleString('pt-BR');
}

export function formatDistance(value){
  return `${Number(value || 0).toFixed(1).replace('.', ',')} km`;
}

export function createStore(){
  return {
    best:Number(localStorage.getItem('kobemRunnerBest') || 0),
    wallet:Number(localStorage.getItem('kobemRunnerWallet') || 0),
    distance:Number(localStorage.getItem('kobemRunnerBestDistance') || 0),
    selected:localStorage.getItem('kobemRunnerSelected') || 'classic',
    unlocked:JSON.parse(localStorage.getItem('kobemRunnerUnlocked') || '["classic"]'),
    achievements:JSON.parse(localStorage.getItem('kobemRunnerAchievements') || '[]'),
    ranking:JSON.parse(localStorage.getItem('kobemRunnerRanking') || '[]')
  };
}

export function saveStore(store){
  localStorage.setItem('kobemRunnerBest',String(store.best));
  localStorage.setItem('kobemRunnerWallet',String(store.wallet));
  localStorage.setItem('kobemRunnerBestDistance',String(store.distance));
  localStorage.setItem('kobemRunnerSelected',store.selected);
  localStorage.setItem('kobemRunnerUnlocked',JSON.stringify(store.unlocked));
  localStorage.setItem('kobemRunnerAchievements',JSON.stringify(store.achievements));
  localStorage.setItem('kobemRunnerRanking',JSON.stringify(store.ranking));
}

export function updateRunUi(elements,state){
  elements.score.textContent = formatScore(state.score);
  elements.coins.textContent = state.coins;
  elements.combo.textContent = state.combo;
  elements.energy.textContent = Math.floor(state.energy);
  elements.energyBar.style.transform = `scaleX(${state.energy / 100})`;
  elements.distance.textContent = formatDistance(state.distance);
  elements.lives.textContent = '♥'.repeat(Math.max(0,state.lives));
}

export function renderRanking(container,ranking){
  const fallback = [
    {score:15240, coins:76, distance:4.3, date:'Top'},
    {score:12880, coins:62, distance:3.8, date:'Top'},
    {score:11320, coins:55, distance:3.1, date:'Top'}
  ];
  const rows = (ranking.length ? ranking : fallback).slice(0,10);
  container.innerHTML = rows.map((item,index) => `
    <div>
      <strong>${index + 1}</strong>
      <span>${ranking.length ? (index === 0 ? 'Voce' : `Corrida ${index + 1}`) : ['Valter','Lucas','Ana Paula'][index]}</span>
      <strong>${formatScore(item.score)}</strong>
    </div>
  `).join('');
}

export function renderAchievements(container,unlocked){
  container.innerHTML = achievements.map(item => {
    const ok = unlocked.includes(item.id);
    return `
      <div class="${ok ? '' : 'is-locked'}">
        <strong>${ok ? 'OK' : '--'}</strong>
        <span>${item.label}</span>
        <strong>${ok ? 'Livre' : 'Bloq.'}</strong>
      </div>
    `;
  }).join('');
}

export function renderKobems(container,kobems,store,onSelect,onBuy){
  container.innerHTML = kobems.map(kobem => {
    const unlocked = store.unlocked.includes(kobem.id);
    const selected = store.selected === kobem.id;
    return `
      <div class="runner-kobem-card ${unlocked ? '' : 'is-locked'} ${selected ? 'is-selected' : ''}" data-kobem="${kobem.id}">
        <span class="runner-kobem-avatar" style="background:linear-gradient(180deg,${kobem.color},#111)">K</span>
        <span><strong>${kobem.name}</strong><br><small>${unlocked ? 'Desbloqueado' : `${kobem.price} moedas`}</small></span>
        <button type="button">${selected ? 'Ativo' : unlocked ? 'Usar' : 'Comprar'}</button>
      </div>
    `;
  }).join('');
  container.querySelectorAll('.runner-kobem-card').forEach(card => {
    card.querySelector('button').addEventListener('click', () => {
      const id = card.dataset.kobem;
      store.unlocked.includes(id) ? onSelect(id) : onBuy(id);
    });
  });
}
