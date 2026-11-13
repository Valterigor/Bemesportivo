(() => {
  const sheet = document.querySelector('#tactical-sheet');
  const startSheet = document.querySelector('#start-sheet');
  const openButton = document.querySelector('#continue-game');
  const backButton = document.querySelector('#tactical-back');
  const gameBackButton = document.querySelector('#game-back');
  const nextButton = document.querySelector('#next-level');
  const nodesEl = document.querySelector('#tactical-nodes');
  if (!sheet || !nodesEl) return;
  const scenes = ['Parque da largada','Praia em movimento','Quadra urbana','Trilha da serra','Velódromo ao pôr do sol','Arena de inverno','Estádio das estrelas','Arena dos campeões'];
  let progress = {};
  let selected = 1;
  const readProgress = () => {
    try { progress = JSON.parse(localStorage.getItem('be-match-progress') || '{}'); } catch { progress = {}; }
    progress = { unlockedLevel: 1, completed: [], stars: {}, ...progress };
  };
  const phaseName = level => `${scenes[(level - 1) % scenes.length]} · ${window.BeMatchRules.roundName(level)}`;
  const renderBriefing = () => {
    const config = window.BeMatchRules.levelConfig(selected);
    const collect = config.collect ? ` e colete ${config.collect.target} ${config.collect.label}` : '';
    const done = (progress.completed || []).includes(selected);
    document.querySelector('#tactical-number').textContent = String(selected).padStart(3, '0');
    document.querySelector('#tactical-name').textContent = phaseName(selected);
    document.querySelector('#tactical-goal').textContent = `Capture ${config.target} relógios${collect} em até ${config.moves} movimentos.`;
    document.querySelector('#tactical-stars').textContent = `${Number(progress.stars?.[selected] || 0)}/3`;
    document.querySelector('#tactical-status').textContent = done ? 'Concluída' : selected === Number(progress.unlockedLevel || 1) ? 'Atual' : 'Disponível';
    document.querySelector('#tactical-tip').textContent = config.tutorial;
  };
  const enterLevel = level => {
    selected = level;
    window.dispatchEvent(new CustomEvent('be-match:select-level', { detail: { level } }));
    close();
    window.dispatchEvent(new CustomEvent('be-match:enter-game', { detail: { level } }));
  };
  const renderNodes = () => {
    const completed = new Set(progress.completed || []);
    const fragment = document.createDocumentFragment();
    for (let round = 1; round <= 10; round += 1) {
      const group = document.createElement('section');
      group.className = 'tactical-round';
      group.innerHTML = `<header><span>RODADA ${round} · ${window.BeMatchRules.roundName(round * 10)}</span><small>Fases ${(round - 1) * 10 + 1}–${round * 10}</small></header>`;
      const track = document.createElement('div');
      track.className = 'tactical-round-track';
      for (let offset = 1; offset <= 10; offset += 1) {
        const level = (round - 1) * 10 + offset;
        const current = level === Number(progress.unlockedLevel || 1);
        const done = completed.has(level);
        const open = done || current;
        const button = document.createElement('button');
        button.type = 'button';
        const finalRound = offset === 10;
        button.className = `tactical-node ${done ? 'is-done' : ''} ${current ? 'is-current' : ''} ${finalRound ? 'is-trophy' : ''}`;
        button.dataset.level = level;
        button.disabled = !open;
        button.setAttribute('aria-label', open ? `Fase ${level}, ${phaseName(level)}` : `Fase ${level} bloqueada`);
        button.innerHTML = `<i aria-hidden="true">${finalRound ? '🏆' : ''}</i><strong>${level}</strong><small>${current ? 'ATUAL' : done ? `✓ ${Number(progress.stars?.[level] || 0)}★` : finalRound ? 'FINAL' : 'BLOQ.'}</small>`;
        button.addEventListener('click', () => enterLevel(level));
        track.append(button);
      }
      group.append(track);
      fragment.append(group);
    }
    nodesEl.replaceChildren(fragment);
    renderBriefing();
    requestAnimationFrame(() => nodesEl.querySelector('.is-current')?.scrollIntoView({ block: 'center', inline: 'center' }));
  };
  const open = () => {
    readProgress();
    selected = Math.min(100, Math.max(1, Number(progress.unlockedLevel || 1)));
    renderNodes();
    sheet.hidden = false;
    document.body.classList.add('tactical-open');
    window.dispatchEvent(new CustomEvent('be-match:tactical-open'));
  };
  const close = () => { sheet.hidden = true; document.body.classList.remove('tactical-open'); };
  openButton?.addEventListener('click', open);
  nextButton?.addEventListener('click', () => setTimeout(open, 0));
  backButton?.addEventListener('click', () => { close(); startSheet.hidden = false; document.body.classList.add('game-start-open'); window.dispatchEvent(new CustomEvent('be-match:return-menu')); });
  gameBackButton?.addEventListener('click', () => { document.body.classList.remove('game-playing'); open(); });
})();
