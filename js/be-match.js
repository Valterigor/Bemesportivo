(() => {
  const boardEl = document.querySelector('#board');
  if (!boardEl || !window.BeMatchRules) return;

  const size = 8;
  const regularTypes = ['halter', 'bottle', 'cap', 'shoe', 'fruit'];
  const levelEl = document.querySelector('#level');
  const scoreEl = document.querySelector('#score');
  const movesEl = document.querySelector('#moves');
  const remainingClocksEl = document.querySelector('#remaining-clocks');
  const secondaryGoalEl = document.querySelector('#secondary-goal');
  const secondaryGoalIconEl = document.querySelector('#secondary-goal-icon');
  const secondaryGoalCountEl = document.querySelector('#secondary-goal-count');
  const secondaryGoalLabelEl = document.querySelector('#secondary-goal-label');
  const progressEl = document.querySelector('#progress-bar');
  const messageEl = document.querySelector('#game-message');
  const goalEl = document.querySelector('#goal');
  const livesEl = document.querySelector('#lives');
  const sheet = document.querySelector('#result-sheet');
  const lossSheet = document.querySelector('#loss-sheet');
  const mapEl = document.querySelector('#phase-nodes');
  const mapStatus = document.querySelector('#map-status');
  const powerEl = document.querySelector('#power');
  const powerNames = { row: 'Raio horizontal', column: 'Raio vertical', burst: 'Explosão 3×3', cross: 'Poder BE cruzado' };
  const icons = {
    halter: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M10 18v12M15 14v20M20 20h8M28 20h5M33 14v20M38 18v12"/></svg>',
    bottle: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M19 11h10M21 11v6l-5 7v13a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V24l-5-7v-6M17 26h16"/></svg>',
    watch: '<svg viewBox="0 0 48 48" fill="none" stroke="#161616" stroke-width="3"><rect x="14" y="13" width="20" height="22" rx="7"/><path d="M20 7h8M20 41h8M24 18v6l4 3"/></svg>',
    cap: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M10 29c2-9 8-14 15-14 7 0 12 4 14 11-8-2-17-1-29 3Z"/><path d="M10 29c-3 1-4 4-1 5 8 2 18 0 27-3"/></svg>',
    shoe: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13c4 5 7 10 13 13l9 4c4 2 5 6 0 6H12c-5 0-6-4-3-7l6-6"/><path d="m20 20 5 2M16 24l5 2M13 28l5 2"/></svg>',
    fruit: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M24 17c-8-5-15 2-13 11 2 9 8 13 13 7 5 6 11 2 13-7 2-9-5-16-13-11Z"/><path d="M24 16c0-5 4-8 8-8M28 9c3-2 6-1 8 1"/></svg>'
  };

  let savedProgress;
  try { savedProgress = JSON.parse(localStorage.getItem('be-match-progress') || '{}'); } catch { savedProgress = {}; }
  savedProgress = { unlockedLevel: 1, completed: [], best: {}, stars: {}, ...savedProgress };
  const state = {
    grid: [], score: 0, moves: 20, movesUsed: 0,
    level: Math.min(8, Math.max(1, Number(savedProgress.unlockedLevel || localStorage.getItem('be-match-level') || 1))),
    lives: Math.max(0, Math.min(5, Number(localStorage.getItem('be-match-lives') || 5))),
    combos: 0, bestChain: 0, power: Number(localStorage.getItem('be-match-power') || 0),
    juiceDestroyed: 0, collected: {}, specialKinds: new Map(), locked: false
  };
  const key = (x, y) => y * size + x;
  let animationScale = 1;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms * animationScale));
  const randomType = () => regularTypes[Math.floor(Math.random() * regularTypes.length)];
  const movesForLevel = () => window.BeMatchRules.levelConfig(state.level).moves;
  const missionTarget = () => window.BeMatchRules.levelConfig(state.level).target;
  const collectGoal = () => window.BeMatchRules.levelConfig(state.level).collect || null;
  const collectedForGoal = () => collectGoal() ? Number(state.collected[collectGoal().type] || 0) : 0;
  const missionComplete = () => (state.juiceDestroyed >= missionTarget() || !state.grid.includes('watch')) && (!collectGoal() || collectedForGoal() >= collectGoal().target);
  const adjacent = (a, b) => Math.abs(a % size - b % size) + Math.abs(Math.floor(a / size) - Math.floor(b / size)) === 1;

  function recoverLives() {
    const interval = 1800000;
    const now = Date.now();
    const last = Number(localStorage.getItem('be-match-life-timestamp') || now);
    if (state.lives < 5 && now - last >= interval) {
      const recovered = Math.min(5 - state.lives, Math.floor((now - last) / interval));
      state.lives += recovered;
      localStorage.setItem('be-match-life-timestamp', String(last + recovered * interval));
      localStorage.setItem('be-match-lives', String(state.lives));
    }
    if (state.lives < 5 && !localStorage.getItem('be-match-life-timestamp')) localStorage.setItem('be-match-life-timestamp', String(now));
  }

  function findMatchInfo() {
    const groups = [];
    for (let y = 0; y < size; y += 1) {
      let x = 0;
      while (x < size) {
        const start = x;
        const type = state.grid[key(x, y)];
        while (x + 1 < size && type !== 'watch' && state.grid[key(x + 1, y)] === type) x += 1;
        if (type !== 'watch' && x - start + 1 >= 3) groups.push(Array.from({ length: x - start + 1 }, (_, n) => key(start + n, y)));
        x += 1;
      }
    }
    for (let x = 0; x < size; x += 1) {
      let y = 0;
      while (y < size) {
        const start = y;
        const type = state.grid[key(x, y)];
        while (y + 1 < size && type !== 'watch' && state.grid[key(x, y + 1)] === type) y += 1;
        if (type !== 'watch' && y - start + 1 >= 3) groups.push(Array.from({ length: y - start + 1 }, (_, n) => key(x, start + n)));
        y += 1;
      }
    }
    const base = new Set(groups.flat());
    const affected = new Set(base);
    base.forEach(index => {
      const x = index % size;
      const y = Math.floor(index / size);
      [index - 1, index + 1, index - size, index + size].forEach(next => {
        if (next >= 0 && next < state.grid.length && Math.abs(next % size - x) + Math.abs(Math.floor(next / size) - y) === 1 && state.grid[next] === 'watch') affected.add(next);
      });
    });
    return { groups, base, affected };
  }

  function hasValidMove() {
    if (state.specialKinds.size) return true;
    for (let index = 0; index < state.grid.length; index += 1) {
      for (const next of [index + 1, index + size]) {
        if (next >= state.grid.length || !adjacent(index, next)) continue;
        if (state.grid[index] === 'watch' || state.grid[next] === 'watch') continue;
        [state.grid[index], state.grid[next]] = [state.grid[next], state.grid[index]];
        const valid = findMatchInfo().base.size > 0;
        [state.grid[index], state.grid[next]] = [state.grid[next], state.grid[index]];
        if (valid) return true;
      }
    }
    return false;
  }

  function productiveMoves() {
    const moves = [];
    for (let index = 0; index < state.grid.length; index += 1) {
      for (const next of [index + 1, index + size]) {
        if (next >= state.grid.length || !adjacent(index, next)) continue;
        if (state.grid[index] === 'watch' || state.grid[next] === 'watch') continue;
        [state.grid[index], state.grid[next]] = [state.grid[next], state.grid[index]];
        const info = findMatchInfo();
        const captures = [...info.affected].filter(cell => state.grid[cell] === 'watch').length;
        const collect = collectGoal();
        const collects = collect ? [...info.affected].filter(cell => state.grid[cell] === collect.type).length : 0;
        const createsPower = Boolean(window.BeMatchRules.powerForGroups(info.groups));
        [state.grid[index], state.grid[next]] = [state.grid[next], state.grid[index]];
        if (info.base.size) moves.push({ from: index, to: next, captures, collects, createsPower, matched: info.base.size });
      }
    }
    return moves.sort((a, b) => b.captures - a.captures || b.collects - a.collects || Number(b.createsPower) - Number(a.createsPower) || b.matched - a.matched);
  }

  const hasProductiveMove = () => state.specialKinds.size > 0 || productiveMoves().some(move => move.captures > 0 || move.collects > 0 || move.createsPower);

  function createGrid() {
    state.specialKinds.clear();
    let attempts = 0;
    do {
      state.grid = Array.from({ length: size * size }, randomType);
      Array.from({ length: size * size }, (_, index) => index).sort(() => Math.random() - .5)
        .slice(0, Math.min(missionTarget(), size * size - 1)).forEach(index => { state.grid[index] = 'watch'; });
      attempts += 1;
    } while ((findMatchInfo().base.size || !hasValidMove() || !hasProductiveMove()) && attempts < 500);
  }

  function renderMap() {
    const completed = new Set(savedProgress.completed || []);
    const totalStars = Object.values(savedProgress.stars || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    mapEl.replaceChildren(...Array.from({ length: 8 }, (_, n) => {
      const level = n + 1;
      const done = completed.has(level);
      const open = level <= Number(savedProgress.unlockedLevel || state.level);
      const stars = '★'.repeat(Number(savedProgress.stars[level] || 0)) || '☆';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `phase-node ${done ? 'is-done' : ''} ${level === state.level ? 'is-current' : ''}`;
      button.disabled = !open;
      button.innerHTML = `<strong>${done ? '✓' : level}</strong><small>${done ? stars : level === state.level ? 'Jogar agora' : 'Bloqueada'}</small>`;
      button.addEventListener('click', () => { if (open && level !== state.level) { state.level = level; resetPhase(false); } });
      return button;
    }));
    mapStatus.textContent = `Fase ${state.level} de 8 · ${completed.size} concluída${completed.size === 1 ? '' : 's'} · ${totalStars}/24 estrelas`;
  }

  function render() {
    boardEl.replaceChildren(...state.grid.map((type, index) => {
      const button = document.createElement('button');
      const kind = state.specialKinds.get(index);
      button.className = `tile tile-${type}`;
      button.dataset.index = index;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', kind ? `${powerNames[kind]}. Toque para ativar ou arraste para combinar.` : `Peça ${type}`);
      if (kind) { button.dataset.special = 'true'; button.dataset.powerKind = kind; }
      button.innerHTML = icons[type];
      button.addEventListener('pointerdown', event => startDrag(event, index));
      button.addEventListener('touchstart', event => startTouch(event, index), { passive: false });
      button.addEventListener('touchend', endTouch, { passive: false });
      return button;
    }));
    levelEl.textContent = state.level;
    scoreEl.textContent = state.score;
    movesEl.textContent = state.moves;
    if (powerEl) powerEl.textContent = state.specialKinds.size;
    livesEl.textContent = '● '.repeat(Math.max(0, state.lives)).trim() || 'Sem vidas';
    const target = missionTarget();
    const remaining = Math.max(0, target - state.juiceDestroyed);
    remainingClocksEl.textContent = remaining;
    progressEl.style.width = `${Math.min(100, state.juiceDestroyed / target * 100)}%`;
    const collect = collectGoal();
    if (secondaryGoalEl) {
      secondaryGoalEl.hidden = !collect;
      if (collect) {
        const collectRemaining = Math.max(0, collect.target - collectedForGoal());
        secondaryGoalCountEl.textContent = collectRemaining;
        secondaryGoalLabelEl.textContent = collect.label;
        secondaryGoalIconEl.className = `mission-piece mission-piece-${collect.type}`;
        secondaryGoalIconEl.innerHTML = icons[collect.type] || '';
        secondaryGoalEl.setAttribute('aria-label', `${collectRemaining} ${collect.label} restantes`);
      }
    }
    const collectText = collect ? ` · ${Math.min(collectedForGoal(), collect.target)}/${collect.target} ${collect.label}` : '';
    goalEl.textContent = `Restam ${remaining} relógios · ${state.juiceDestroyed}/${target}${collectText}`;
    boardEl.classList.toggle('is-low-moves', state.moves <= 5 && !missionComplete());
    renderMap();
  }

  function movePowerKind(from, to) {
    const first = state.specialKinds.get(from);
    const second = state.specialKinds.get(to);
    state.specialKinds.delete(from);
    state.specialKinds.delete(to);
    if (first) state.specialKinds.set(to, first);
    if (second) state.specialKinds.set(from, second);
  }
  function swapCells(a, b) {
    [state.grid[a], state.grid[b]] = [state.grid[b], state.grid[a]];
    movePowerKind(a, b);
  }

  function expandTriggeredPowers(affected) {
    const queue = [...affected].filter(index => state.specialKinds.has(index));
    const triggered = new Set();
    while (queue.length) {
      const index = queue.shift();
      if (triggered.has(index)) continue;
      triggered.add(index);
      window.BeMatchRules.affectedByPower(index, state.specialKinds.get(index)).forEach(next => {
        if (!affected.has(next)) { affected.add(next); if (state.specialKinds.has(next)) queue.push(next); }
      });
    }
    return triggered;
  }

  function collapseAndFill() {
    for (let x = 0; x < size; x += 1) {
      const column = [];
      for (let y = size - 1; y >= 0; y -= 1) {
        const index = key(x, y);
        if (state.grid[index]) column.push({ type: state.grid[index], kind: state.specialKinds.get(index) });
      }
      for (let y = size - 1; y >= 0; y -= 1) {
        const index = key(x, y);
        const item = column[size - 1 - y];
        state.grid[index] = item?.type || randomType();
        state.specialKinds.delete(index);
        if (item?.kind) state.specialKinds.set(index, item.kind);
      }
    }
  }

  async function clearCells(affected, points, chain, power = false, bonus = null) {
    const indexes = [...affected];
    const collect = collectGoal();
    if (collect) state.collected[collect.type] = collectedForGoal() + indexes.filter(index => state.grid[index] === collect.type).length;
    indexes.forEach(index => boardEl.querySelector(`[data-index="${index}"]`)?.classList.add(power ? 'power-hit' : 'matching'));
    state.score += points;
    boardEl.dispatchEvent(new CustomEvent('be-match:points', { detail: { indices: indexes, points, total: state.score, chain, power, bonus } }));
    await wait(power ? 380 : 250);
    indexes.forEach(index => { state.grid[index] = null; state.specialKinds.delete(index); });
    collapseAndFill();
    render();
    await wait(170);
  }

  async function resolve(preferredIndex = null, initialChain = 0) {
    let info = findMatchInfo();
    let chain = initialChain;
    while (info.base.size) {
      chain += 1;
      state.combos += 1;
      state.bestChain = Math.max(state.bestChain, chain);
      const createdKind = window.BeMatchRules.powerForGroups(info.groups);
      const candidates = [...info.base];
      const specialIndex = createdKind && preferredIndex !== null && info.base.has(preferredIndex) ? preferredIndex : createdKind ? candidates[Math.floor(candidates.length / 2)] : null;
      const affected = new Set(info.affected);
      const triggered = expandTriggeredPowers(affected);
      state.juiceDestroyed += [...affected].filter(index => state.grid[index] === 'watch').length;
      const points = window.BeMatchRules.scoreForClear(affected.size, chain, createdKind, triggered.size > 0);
      await clearCells(affected, points, chain, triggered.size > 0, createdKind);
      if (createdKind && specialIndex !== null) {
        const placement = [specialIndex, ...candidates].find(index => state.grid[index] !== 'watch') ?? specialIndex;
        state.grid[placement] = randomType();
        state.specialKinds.set(placement, createdKind);
        state.power += 1;
        localStorage.setItem('be-match-power', String(state.power));
        messageEl.textContent = `${powerNames[createdKind]} criado! Toque nele ou combine para ativar.`;
        render();
      }
      preferredIndex = null;
      info = findMatchInfo();
    }
    if (chain > 1) messageEl.textContent = `Combo ×${chain}! Multiplicador de ${1 + (chain - 1) * .5}× aplicado.`;
    return chain;
  }

  async function activatePower(index, consumeMove = true, forcedKind = null) {
    if (state.locked || state.moves <= 0 || (!state.specialKinds.has(index) && !forcedKind)) return;
    state.locked = true;
    if (consumeMove) { state.moves -= 1; state.movesUsed += 1; }
    const kind = forcedKind || state.specialKinds.get(index);
    const affected = new Set(window.BeMatchRules.affectedByPower(index, kind));
    const triggered = expandTriggeredPowers(affected);
    state.juiceDestroyed += [...affected].filter(cell => state.grid[cell] === 'watch').length;
    const points = window.BeMatchRules.scoreForClear(affected.size, 1, null, true);
    messageEl.textContent = `${powerNames[kind]} ativado · ${affected.size} peças alcançadas!`;
    messageEl.classList.add('power-notice');
    await clearCells(affected, points, 1, true);
    await resolve(null, triggered.size > 1 ? 1 : 0);
    setTimeout(() => messageEl.classList.remove('power-notice'), 800);
    state.locked = false;
    finishMove();
  }

  function shuffleBoard() {
    const movable = state.grid.map((type, index) => ({ type, index })).filter(item => item.type !== 'watch' && !state.specialKinds.has(item.index));
    const values = movable.map(item => item.type);
    let attempts = 0;
    do {
      values.sort(() => Math.random() - .5);
      movable.forEach((item, position) => { state.grid[item.index] = values[position]; });
      attempts += 1;
    } while ((!hasValidMove() || !hasProductiveMove() || findMatchInfo().base.size) && attempts < 250);
    messageEl.textContent = 'Sem jogadas disponíveis. Reorganizando sem gastar movimento.';
    render();
    boardEl.classList.add('is-shuffling');
    setTimeout(() => boardEl.classList.remove('is-shuffling'), 450);
  }

  function finishMove() {
    render();
    if (missionComplete()) complete();
    else if (state.moves <= 0) endLife();
    else if (!hasValidMove()) shuffleBoard();
    else if (state.moves <= 5) {
      const remaining = Math.max(0, missionTarget() - state.juiceDestroyed);
      messageEl.textContent = `Reta final: ${state.moves} movimentos para capturar ${remaining} relógio${remaining === 1 ? '' : 's'}.`;
    }
  }

  async function swap(a, b) {
    if (state.locked || state.moves <= 0 || !adjacent(a, b)) return;
    if (state.grid[a] === 'watch' || state.grid[b] === 'watch') {
      messageEl.textContent = 'Os relógios são alvos fixos. Faça combinações ao lado deles para capturá-los.';
      return;
    }
    const firstPower = state.specialKinds.get(a);
    const secondPower = state.specialKinds.get(b);
    swapCells(a, b);
    if (firstPower || secondPower) {
      const target = firstPower ? b : a;
      const combinedKind = firstPower && secondPower ? 'cross' : null;
      if (combinedKind) state.specialKinds.set(target, combinedKind);
      await activatePower(target, true, combinedKind);
      return;
    }
    if (!findMatchInfo().base.size) {
      swapCells(a, b);
      render();
      [a, b].forEach(index => boardEl.querySelector(`[data-index="${index}"]`)?.classList.add('invalid-swap'));
      messageEl.textContent = 'Essa troca não forma combinação. Tente aproximar três peças iguais.';
      return;
    }
    state.moves -= 1;
    state.movesUsed += 1;
    state.locked = true;
    await resolve(b);
    state.locked = false;
    finishMove();
  }

  let dragStart = null;
  function startTouch(event, index) {
    if (state.locked) return;
    event.preventDefault();
    const touch = event.touches[0];
    dragStart = { index, x: touch.clientX, y: touch.clientY, touch: true };
  }
  function endTouch(event) {
    if (!dragStart?.touch) return;
    event.preventDefault();
    const start = dragStart;
    dragStart = null;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) {
      if (state.specialKinds.has(start.index)) activatePower(start.index);
      else messageEl.textContent = 'Deslize a peça. Poderes BE podem ser ativados com um toque.';
      return;
    }
    const target = start.index + (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? size : -size));
    if (target >= 0 && target < state.grid.length && adjacent(start.index, target)) swap(start.index, target);
  }
  function startDrag(event, index) {
    if (state.locked || event.pointerType === 'touch' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    dragStart = { index, x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointerup', endDrag, { once: true });
    window.addEventListener('pointercancel', cancelDrag, { once: true });
  }
  function cancelDrag() { dragStart = null; window.removeEventListener('pointerup', endDrag); }
  function endDrag(event) {
    if (!dragStart || dragStart.touch || event.pointerId !== dragStart.pointerId) return;
    const start = dragStart;
    dragStart = null;
    window.removeEventListener('pointercancel', cancelDrag);
    event.preventDefault();
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
      if (state.specialKinds.has(start.index)) activatePower(start.index);
      else messageEl.textContent = 'Arraste a peça. Poderes BE podem ser ativados com um clique.';
      return;
    }
    const target = start.index + (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? size : -size));
    if (target >= 0 && target < state.grid.length && adjacent(start.index, target)) swap(start.index, target);
  }

  function resetPhase(hideSheet = true) {
    boardEl.dispatchEvent(new CustomEvent('be-match:phase-reset'));
    window.BeMatchScenes?.apply(state.level);
    Object.assign(state, { score: 0, moves: movesForLevel(), movesUsed: 0, combos: 0, bestChain: 0, juiceDestroyed: 0, collected: {}, locked: false });
    state.specialKinds.clear();
    if (hideSheet) sheet.hidden = true;
    createGrid();
    render();
    messageEl.textContent = window.BeMatchRules.levelConfig(state.level).tutorial;
  }

  function complete() {
    if (!missionComplete() || !sheet.hidden) return;
    const completed = new Set(savedProgress.completed || []);
    completed.add(state.level);
    const remainingRatio = state.moves / movesForLevel();
    const stars = remainingRatio >= .4 ? 3 : remainingRatio >= .15 ? 2 : 1;
    const efficient = stars === 3;
    const best = Math.max(Number(savedProgress.best[state.level] || 0), state.score);
    savedProgress.best[state.level] = best;
    savedProgress.stars[state.level] = Math.max(Number(savedProgress.stars[state.level] || 0), stars);
    savedProgress.completed = [...completed].sort((a, b) => a - b);
    savedProgress.unlockedLevel = Math.max(Number(savedProgress.unlockedLevel || 1), Math.min(8, state.level + 1));
    localStorage.setItem('be-match-progress', JSON.stringify(savedProgress));
    localStorage.setItem('be-match-level', String(savedProgress.unlockedLevel));
    renderMap();
    document.querySelector('#result-score').textContent = state.score;
    document.querySelector('#result-best').textContent = best;
    document.querySelector('#result-combos').textContent = `×${Math.max(1, state.bestChain)}`;
    document.querySelector('#result-moves').textContent = state.movesUsed;
    document.querySelector('#result-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    const collect = collectGoal();
    const secondary = collect ? ` e ${Math.min(collectedForGoal(), collect.target)}/${collect.target} ${collect.label}` : '';
    document.querySelector('#result-copy').textContent = `Missão concluída: ${state.juiceDestroyed}/${missionTarget()} relógios${secondary}. ${state.moves} movimento${state.moves === 1 ? '' : 's'} restante${state.moves === 1 ? '' : 's'}. Estrelas: 1 por concluir, 2 com 15% e 3 com 40% dos movimentos restantes.`;
    document.querySelector('#next-level').textContent = state.level === 8 ? 'Jogar novamente' : 'Próxima fase →';
    sheet.hidden = false;
    window.dispatchEvent(new CustomEvent('be-match-win', { detail: { stars, level: state.level } }));
  }

  function endLife() {
    state.lives = Math.max(0, state.lives - 1);
    localStorage.setItem('be-match-lives', String(state.lives));
    localStorage.setItem('be-match-life-timestamp', String(Date.now()));
    state.moves = 0;
    document.querySelector('#loss-clocks').textContent = `${state.juiceDestroyed}/${missionTarget()}`;
    document.querySelector('#loss-lives').textContent = state.lives;
    const remaining = Math.max(0, missionTarget() - state.juiceDestroyed);
    const collect = collectGoal();
    const collectRemaining = collect ? Math.max(0, collect.target - collectedForGoal()) : 0;
    const missing = `${remaining} relógio${remaining === 1 ? '' : 's'}${collect && collectRemaining ? ` e ${collectRemaining} ${collect.label}` : ''}`;
    document.querySelector('#loss-copy').textContent = state.lives > 0 ? `Faltaram ${missing}. Combine ao lado dos alvos e use os Poderes BE para alcançar mais de um por vez.` : 'Suas vidas acabaram por agora. Elas serão recuperadas com o tempo.';
    lossSheet.hidden = false;
    render();
  }

  document.querySelector('#restart').addEventListener('click', () => resetPhase());
  document.querySelector('#next-level').addEventListener('click', () => {
    state.level = Math.min(8, state.level + 1);
    savedProgress.unlockedLevel = Math.max(savedProgress.unlockedLevel || 1, state.level);
    localStorage.setItem('be-match-progress', JSON.stringify(savedProgress));
    resetPhase();
  });
  document.querySelector('#retry-level').addEventListener('click', () => {
    lossSheet.hidden = true;
    if (state.lives > 0) resetPhase(false);
    else messageEl.textContent = 'Suas vidas acabaram por agora. Volte quando uma vida for recuperada.';
  });
  document.querySelector('#close-loss').addEventListener('click', () => { lossSheet.hidden = true; });
  document.querySelector('#close-sheet').addEventListener('click', () => { sheet.hidden = true; });
  document.querySelector('#sound-toggle').addEventListener('click', event => { event.currentTarget.textContent = event.currentTarget.textContent === 'Som' ? 'Som: off' : 'Som'; });

  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    window.__beMatchDebug = {
      setBoard(grid, specials = []) {
        if (!Array.isArray(grid) || grid.length !== size * size) throw new Error('O tabuleiro de teste precisa ter 64 peças.');
        state.grid = [...grid];
        state.specialKinds.clear();
        specials.forEach(({ index, kind }) => state.specialKinds.set(index, kind));
        state.score = 0;
        state.moves = 26;
        state.movesUsed = 0;
        state.juiceDestroyed = 0;
        state.collected = {};
        state.locked = false;
        render();
      },
      snapshot: () => ({ ...state, grid: [...state.grid], specials: [...state.specialKinds.entries()] }),
      listMoves: productiveMoves,
      setAnimationScale(value) { animationScale = Math.max(0, Number(value) || 0); },
      resetLevel(level) {
        state.level = Math.max(1, Math.min(8, Number(level) || 1));
        state.lives = 5;
        sheet.hidden = true;
        lossSheet.hidden = true;
        resetPhase(false);
      },
      swap,
      activatePower
    };
  }

  recoverLives();
  resetPhase(false);
  setInterval(() => { recoverLives(); render(); }, 60000);
})();
