(() => {
  const body = document.querySelector('#ranking-body');
  if (!body) return;
  const nameInput = document.querySelector('#ranking-name');
  const saveButton = document.querySelector('#ranking-save');
  const status = document.querySelector('#ranking-status');
  const positionEl = document.querySelector('#ranking-position');
  const totalEl = document.querySelector('#ranking-total');
  const levelEl = document.querySelector('#ranking-level');
  const deviceId = localStorage.getItem('be-match-device-id') || crypto.randomUUID();
  localStorage.setItem('be-match-device-id', deviceId);
  let playerName = localStorage.getItem('be-match-player-name') || 'Atleta BE';
  let ranking = [];
  nameInput.value = playerName;
  const progress = () => {
    try { return { unlockedLevel: 1, best: {}, stars: {}, ...JSON.parse(localStorage.getItem('be-match-progress') || '{}') }; }
    catch { return { unlockedLevel: 1, best: {}, stars: {} }; }
  };
  const totals = () => {
    const saved = progress();
    return {
      score: Object.values(saved.best || {}).reduce((sum, value) => sum + Number(value || 0), 0),
      stars: Object.values(saved.stars || {}).reduce((sum, value) => sum + Number(value || 0), 0),
      level: Math.min(100, Number(saved.unlockedLevel || 1))
    };
  };
  const render = () => {
    const own = totals();
    const key = entry => entry.deviceId === deviceId;
    const position = ranking.findIndex(key) + 1;
    totalEl.textContent = own.score.toLocaleString('pt-BR');
    levelEl.textContent = `${own.level}/100`;
    positionEl.textContent = position || '—';
    const visible = ranking.slice(0, 50);
    body.replaceChildren(...visible.map((entry, index) => {
      const row = document.createElement('tr');
      if (key(entry)) row.className = 'is-player';
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : String(index + 1);
      row.innerHTML = `<td class="ranking-medal">${medal}</td><td></td><td>${entry.level}/100</td><td>${entry.stars}/300</td><td>${Number(entry.score).toLocaleString('pt-BR')}</td>`;
      row.children[1].textContent = entry.name || 'Atleta BE';
      return row;
    }));
    if (!visible.length) body.innerHTML = '<tr><td colspan="5">Seja o primeiro atleta desta classificação.</td></tr>';
  };
  const load = async () => {
    try {
      const response = await fetch('/api/be-match-ranking', { cache: 'no-store' });
      if (!response.ok) throw new Error('offline');
      const data = await response.json();
      ranking = Array.isArray(data.ranking) ? data.ranking : [];
      status.textContent = 'Classificação online atualizada.';
    } catch {
      ranking = JSON.parse(localStorage.getItem('be-match-local-ranking') || '[]');
      status.textContent = 'Classificação local — o ranking online será sincronizado quando voltar.';
    }
    render();
  };
  const submit = async () => {
    const own = totals();
    const payload = { name: playerName, deviceId, ...own };
    const localEntry = { ...payload, updatedAt: new Date().toISOString() };
    ranking = [...ranking.filter(entry => entry.deviceId !== deviceId), localEntry].sort((a, b) => b.score - a.score || b.stars - a.stars || b.level - a.level);
    localStorage.setItem('be-match-local-ranking', JSON.stringify(ranking.slice(0, 100)));
    render();
    try {
      const response = await fetch('/api/be-match-ranking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('submit');
      const data = await response.json();
      ranking = Array.isArray(data.ranking) ? data.ranking : ranking;
      status.textContent = `Pontuação sincronizada · posição ${data.position || '—'}.`;
      render();
    } catch { status.textContent = 'Pontuação salva neste aparelho; sincronização online pendente.'; }
  };
  saveButton.addEventListener('click', () => {
    playerName = nameInput.value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 16) || 'Atleta BE';
    nameInput.value = playerName;
    localStorage.setItem('be-match-player-name', playerName);
    submit();
  });
  document.querySelectorAll('[data-ranking-open]').forEach(button => button.addEventListener('click', () => document.body.classList.add('ranking-open')));
  document.querySelector('#ranking-close')?.addEventListener('click', () => document.body.classList.remove('ranking-open'));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') document.body.classList.remove('ranking-open'); });
  window.addEventListener('be-match-win', submit);
  load();
})();
