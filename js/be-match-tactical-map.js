(() => {
  const sheet = document.querySelector('#tactical-sheet');
  const startSheet = document.querySelector('#start-sheet');
  const openButton = document.querySelector('#continue-game');
  const backButton = document.querySelector('#tactical-back');
  const nextButton = document.querySelector('#next-level');
  const nodesEl = document.querySelector('#tactical-nodes');
  if (!sheet || !nodesEl) return;
  const scenes = ['Parque da largada','Praia em movimento','Quadra urbana','Trilha da serra','Velódromo ao pôr do sol','Arena de inverno','Estádio das estrelas','Arena dos campeões'];
  const positions = [[50,88],[24,68],[50,65],[76,68],[18,42],[40,38],[62,38],[82,42]];
  let progress = {};
  let selected = 1;
  const readProgress = () => { try { progress = JSON.parse(localStorage.getItem('be-match-progress') || '{}'); } catch { progress = {}; } progress = { unlockedLevel:1, completed:[], stars:{}, ...progress }; };
  const renderBriefing = () => {
    const config = window.BeMatchRules.levelConfig(selected);
    const collect = config.collect ? ` e colete ${config.collect.target} ${config.collect.label}` : '';
    const done = (progress.completed || []).includes(selected);
    document.querySelector('#tactical-number').textContent = String(selected).padStart(2,'0');
    document.querySelector('#tactical-name').textContent = scenes[selected - 1];
    document.querySelector('#tactical-goal').textContent = `Capture ${config.target} relógios${collect} em até ${config.moves} movimentos.`;
    document.querySelector('#tactical-stars').textContent = `${Number(progress.stars?.[selected] || 0)}/3`;
    document.querySelector('#tactical-status').textContent = done ? 'Concluída' : selected === Number(progress.unlockedLevel || 1) ? 'Atual' : 'Disponível';
    document.querySelector('#tactical-tip').textContent = config.tutorial;
    nodesEl.querySelectorAll('.tactical-node').forEach(node => node.classList.toggle('is-selected', Number(node.dataset.level) === selected));
  };
  const enterLevel = level => {
    selected = level;
    window.dispatchEvent(new CustomEvent('be-match:select-level', { detail: { level } }));
    close();
    window.dispatchEvent(new CustomEvent('be-match:enter-game', { detail: { level } }));
  };
  const renderNodes = () => {
    const completed = new Set(progress.completed || []);
    nodesEl.replaceChildren(...positions.map(([x,y], index) => {
      const level = index + 1;
      const button = document.createElement('button');
      const current = level === Number(progress.unlockedLevel || 1);
      const done = completed.has(level);
      const open = done || current;
      button.type = 'button'; button.className = `tactical-node ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`; button.dataset.level = level;
      button.style.left = `${x}%`; button.style.top = `${y}%`; button.disabled = !open;
      button.setAttribute('aria-label', open ? `Fase ${level}, ${scenes[index]}` : `Fase ${level} bloqueada`);
      button.innerHTML = `<strong>${level}</strong><small>${current ? 'ATUAL' : done ? `✓ ${Number(progress.stars?.[level] || 0)}★` : 'BLOQ.'}</small>`;
      button.addEventListener('click', () => enterLevel(level));
      return button;
    }));
    renderBriefing();
  };
  const open = () => { readProgress(); selected = Math.min(8, Math.max(1, Number(progress.unlockedLevel || 1))); renderNodes(); sheet.hidden = false; document.body.classList.add('tactical-open'); window.dispatchEvent(new CustomEvent('be-match:tactical-open')); };
  const close = () => { sheet.hidden = true; document.body.classList.remove('tactical-open'); };
  openButton?.addEventListener('click', open);
  nextButton?.addEventListener('click', () => setTimeout(open, 0));
  backButton?.addEventListener('click', () => { close(); startSheet.hidden = false; document.body.classList.add('game-start-open'); window.dispatchEvent(new CustomEvent('be-match:return-menu')); });
})();
