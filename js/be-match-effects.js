(() => {
  const board = document.querySelector('#board');
  const message = document.querySelector('#game-message');
  const goal = document.querySelector('#goal');
  if (!board) return;
  const burst = (x, y, amount = 12) => { for (let i = 0; i < amount; i++) { const p = document.createElement('i'); p.className = 'fx-particle'; p.style.left = `${x}px`; p.style.top = `${y}px`; p.style.setProperty('--dx', `${Math.round(Math.cos(i / amount * Math.PI * 2) * (28 + Math.random() * 34))}px`); p.style.setProperty('--dy', `${Math.round(Math.sin(i / amount * Math.PI * 2) * (28 + Math.random() * 34))}px`); document.body.append(p); p.addEventListener('animationend', () => p.remove(), { once: true }); } };
  const label = (text, x, y) => { const el = document.createElement('strong'); el.className = 'fx-label'; el.textContent = text; el.style.left = `${x}px`; el.style.top = `${y}px`; document.body.append(el); el.addEventListener('animationend', () => el.remove(), { once: true }); };
  const ring = () => {};
  const trail = (x, y) => { for (let i = 0; i < 5; i++) { const el = document.createElement('i'); el.className = 'fx-trail'; el.style.left = `${x + (Math.random() * 34 - 17)}px`; el.style.top = `${y + (Math.random() * 34 - 17)}px`; el.style.animationDelay = `${i * 25}ms`; document.body.append(el); el.addEventListener('animationend', () => el.remove(), { once: true }); } };
  const callout = (text, tier = 'good') => {
    document.querySelector('.fx-callout')?.remove();
    const rect = board.getBoundingClientRect();
    const el = document.createElement('strong');
    el.className = `fx-callout is-${tier}`;
    el.textContent = text;
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + rect.height / 2}px`;
    document.body.append(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };
  board.addEventListener('be-match:points', ({ detail }) => {
    if (detail.power) { const rect = board.getBoundingClientRect(); const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2; callout('PODER BE!', 'power'); burst(x, y, 20); ring(x, y, true); trail(x, y); }
    else if (detail.chain >= 4) callout('LENDÁRIO!', 'legendary');
    else if (detail.chain === 3) callout('ESPETACULAR!', 'spectacular');
    else if (detail.chain === 2) callout('INCRÍVEL!', 'amazing');
    else if (detail.bonus === 'cross') callout('PODER BE!', 'power');
    else if (detail.bonus === 'burst') callout('EXPLOSÃO!', 'spectacular');
    else if (detail.bonus === 'row' || detail.bonus === 'column') callout('RAIO!', 'amazing');
  });
  board.addEventListener('be-match:cascade-reward', ({ detail }) => {
    const tile = board.querySelector(`[data-index="${detail.index}"]`);
    const rect = tile?.getBoundingClientRect() || board.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    callout(detail.kind === 'cross' ? 'PODER BE!' : detail.kind === 'burst' ? 'EXPLOSÃO!' : 'RAIO EXTRA!', detail.kind === 'cross' ? 'power' : 'spectacular');
    burst(x, y, 18); ring(x, y, true); trail(x, y);
  });
  const observer = new MutationObserver(records => { let matches = []; let special = false; records.forEach(record => { if (record.type === 'attributes' && record.target instanceof HTMLElement && record.target.classList.contains('tile')) { if (record.target.dataset.special === 'true') special = true; if (record.target.classList.contains('matching')) matches.push(record.target); } record.addedNodes.forEach(node => { if (!(node instanceof HTMLElement)) return; if (node.classList.contains('tile')) { if (node.dataset.special === 'true') special = true; if (node.classList.contains('matching')) matches.push(node); } }); }); if (matches.length) { const rect = matches[Math.floor(matches.length / 2)].getBoundingClientRect(); board.classList.remove('combo-pulse'); void board.offsetWidth; board.classList.add('combo-pulse'); burst(rect.left + rect.width / 2, rect.top + rect.height / 2, Math.min(20, matches.length * 4)); ring(rect.left + rect.width / 2, rect.top + rect.height / 2); trail(rect.left + rect.width / 2, rect.top + rect.height / 2); if (matches.length >= 5) { label('PODER BE!', rect.left + rect.width / 2, rect.top + rect.height / 2); ring(rect.left + rect.width / 2, rect.top + rect.height / 2, true); } else if (matches.length >= 3) label(`COMBO ×${matches.length}`, rect.left + rect.width / 2, rect.top + rect.height / 2); } if (special) { const tile = board.querySelector('[data-special]'); if (tile) { const rect = tile.getBoundingClientRect(); board.classList.add('explosion-pulse'); burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 18); ring(rect.left + rect.width / 2, rect.top + rect.height / 2, true); } } });
  observer.observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-special'] });
  let lastGoal = '';
  const goalObserver = new MutationObserver(() => { const value = goal?.textContent || ''; if (value && value !== lastGoal) { lastGoal = value; goal.classList.remove('mission-flash'); void goal.offsetWidth; goal.classList.add('mission-flash'); } });
  if (goal) goalObserver.observe(goal, { childList: true, characterData: true, subtree: true });
  let hintTimer; const clearHint = () => { board.querySelectorAll('.hint').forEach(tile => tile.classList.remove('hint')); document.querySelector('.hint-label')?.remove(); clearTimeout(hintTimer); hintTimer = setTimeout(showHint, 10000); };
  const typesFromBoard = () => [...board.querySelectorAll('.tile')].map(tile => [...tile.classList].find(name => name.startsWith('tile-'))?.replace('tile-', '') || '');
  const matchSet = grid => { const set = new Set(); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const i = y * 8 + x, t = grid[i]; if (t==='watch'||t==='wall')continue;if (x < 6 && t && t === grid[i + 1] && t === grid[i + 2]) { set.add(i); set.add(i + 1); set.add(i + 2); } if (y < 6 && t && t === grid[i + 8] && t === grid[i + 16]) { set.add(i); set.add(i + 8); set.add(i + 16); } } return set; };
  const showHint = () => { const grid = typesFromBoard();const special=board.querySelector('[data-special]');if(special){special.classList.add('hint');const rect=special.getBoundingClientRect();const el=document.createElement('strong');el.className='hint-label';el.textContent='Toque para ativar';el.style.left=`${rect.left}px`;el.style.top=`${rect.top-34}px`;document.body.append(el);setTimeout(()=>el.remove(),900);return} for (let i = 0; i < 64; i++) { for (const j of [i + 1, i + 8]) { if (j >= 64 || (j === i + 1 && i % 8 === 7) || ['watch','wall'].includes(grid[i]) || ['watch','wall'].includes(grid[j])) continue; [grid[i], grid[j]] = [grid[j], grid[i]]; const valid = matchSet(grid).size > 0; [grid[i], grid[j]] = [grid[j], grid[i]]; if (valid) { const a = board.querySelector(`[data-index="${i}"]`); const b = board.querySelector(`[data-index="${j}"]`); a?.classList.add('hint'); b?.classList.add('hint'); const rect = a?.getBoundingClientRect(); if (rect) { const el = document.createElement('strong'); el.className = 'hint-label'; el.textContent = 'Tente esta troca'; el.style.left = `${rect.left}px`; el.style.top = `${rect.top - 34}px`; document.body.append(el); setTimeout(() => el.remove(), 900); } return; } } } };
  board.addEventListener('pointerdown', clearHint); board.addEventListener('touchstart', clearHint, { passive: true }); clearHint();
})();
