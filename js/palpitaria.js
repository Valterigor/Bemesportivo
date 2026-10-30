(() => {
  const root = document.getElementById('palpitaria');
  if (!root) return;
  const storageKey = 'bemEsportivoPalpitariaPicksV1';
  const labels = { brasileirao: 'Brasileirão Série A', ingles: 'Campeonato Inglês', espanhol: 'Campeonato Espanhol', champions: 'Champions League' };
  const localLogos = {
    corinthians: '/img/palpitaria/corinthians.png',
    mirassol: '/img/palpitaria/mirassol.svg'
  };
  const tabs = [...root.querySelectorAll('[data-palpitaria-tab]')];
  const panels = [...root.querySelectorAll('[data-palpitaria-panel]')];
  const feedback = document.getElementById('palpitaria-feedback');
  const updated = document.getElementById('palpitaria-updated');
  const nowBox = root.querySelector('.palpitaria-now');
  const liveLabel = document.getElementById('palpitaria-live-label');
  const today = new Date();
  const requestedDate = new URLSearchParams(location.search).get('palpitariaDate') || '';
  const localPreview = ['localhost', '127.0.0.1'].includes(location.hostname) && /^\d{8}$/.test(requestedDate);
  const dateKey = localPreview ? requestedDate : [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('');
  const displayDate = localPreview ? new Date(`${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}T12:00:00`) : today;
  let picks = {};
  let refreshTimer = 0;
  try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) picks = saved; } catch {}
  document.getElementById('palpitaria-date').textContent = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(displayDate).replace('.', '').toUpperCase();
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(picks)); } catch {} };
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const previewMatches = [
    { competition: 'brasileirao', state: 'post', completed: true, detail: 'Encerrado', startsAt: `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}T19:00:00-03:00`, home: { id: 'atletico-mg', name: 'Atlético-MG', logo: '/img/palpitaria/atletico-mg.png', score: '2' }, away: { id: 'cruzeiro', name: 'Cruzeiro', logo: '/img/palpitaria/cruzeiro.png', score: '1' } },
    { competition: 'brasileirao', state: 'in', completed: false, detail: '72 min', startsAt: `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}T20:30:00-03:00`, home: { id: 'vasco', name: 'Vasco', logo: '/img/palpitaria/vasco.png', score: '1' }, away: { id: 'flamengo', name: 'Flamengo', logo: '/img/palpitaria/flamengo.png', score: '1' } },
    { competition: 'brasileirao', state: 'pre', completed: false, detail: '21:30', startsAt: `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}T21:30:00-03:00`, home: { id: 'gremio', name: 'Grêmio', logo: '/img/palpitaria/gremio.png', score: null }, away: { id: 'athletico-pr', name: 'Athletico-PR', logo: '/img/palpitaria/athletico-pr.png', score: null } }
  ];

  function selectTab(tab) {
    const target = tab.dataset.palpitariaTab;
    tabs.forEach(button => button.setAttribute('aria-selected', String(button === tab)));
    panels.forEach(panel => { panel.hidden = panel.dataset.palpitariaPanel !== target; });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(next); next.focus();
    });
  });

  function matchStatus(match) {
    if (match.state === 'in') return { text: `AO VIVO${match.detail ? ` · ${match.detail}` : ''}`, live: true };
    if (match.completed || match.state === 'post') return { text: 'ENCERRADO', live: false };
    const starts = new Date(match.startsAt);
    const time = Number.isNaN(starts.getTime()) ? '' : starts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { text: time || match.detail || 'A CONFIRMAR', live: false };
  }
  function teamMarkup(team) {
    const teamLogo = localLogos[String(team.id || '').toLowerCase()] || team.logo || '';
    const hasLogo = /^(https:\/\/|\/)/.test(teamLogo);
    const initials = String(team.name || '').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
    const crest = hasLogo ? `<img src="${escapeHtml(teamLogo)}" alt="Escudo do ${escapeHtml(team.name)}">` : `<span aria-hidden="true">${escapeHtml(initials)}</span>`;
    return `<span class="team-crest${hasLogo ? '' : ' team-crest-fallback'}">${crest}</span><strong>${escapeHtml(team.name)}</strong><span class="team-score" data-score>${team.score ?? '–'}</span><small>seu palpite</small>`;
  }
  function bindCard(card, match) {
    const key = `${dateKey}:${match.competition}:${match.home.id}:${match.away.id}`;
    const renderPick = () => {
      const selected = picks[key] || '';
      card.classList.toggle('has-pick', Boolean(selected));
      card.querySelectorAll('[data-pick]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pick === selected)));
      card.querySelector('.palpite-status').textContent = selected ? `Seu palpite: ${selected}` : 'Toque no seu escolhido';
    };
    card.querySelectorAll('[data-pick]').forEach(button => button.addEventListener('click', () => {
      const changed = picks[key] && picks[key] !== button.dataset.pick;
      picks[key] = button.dataset.pick; save(); renderPick();
      feedback.textContent = changed ? `Palpite alterado para ${button.dataset.pick}.` : `Seu palpite em ${button.dataset.pick} foi salvo.`;
    }));
    renderPick();
  }
  function renderCompetition(competition, matches) {
    const panel = panels.find(item => item.dataset.palpitariaPanel === competition);
    const tab = tabs.find(item => item.dataset.palpitariaTab === competition);
    tab?.querySelector('span')?.replaceChildren(String(matches.length));
    if (!panel) return;
    panel.replaceChildren();
    if (!matches.length) {
      panel.className = 'palpitaria-panel palpitaria-empty';
      panel.innerHTML = `<span class="champions-mark" aria-hidden="true">✦</span><h3>Sem jogos hoje.</h3><p>Não há partidas de ${escapeHtml(labels[competition])} nesta data. A agenda será atualizada automaticamente.</p>`;
      return;
    }
    panel.className = 'palpitaria-panel';
    const league = document.createElement('p'); league.className = 'palpitaria-league';
    league.innerHTML = `<strong>${escapeHtml(labels[competition])}</strong><span>horário de Brasília · placar em tempo real</span>`;
    const games = document.createElement('div'); games.className = 'palpitaria-games';
    matches.forEach(match => {
      const status = matchStatus(match);
      const card = document.createElement('article'); card.className = `palpite-card${status.live ? ' is-live' : ''}`;
      card.innerHTML = `<p class="palpite-time" data-live-status>${escapeHtml(status.text)}</p><div class="palpite-versus"><button type="button" class="palpite-team" data-pick="${escapeHtml(match.home.name)}" aria-pressed="false">${teamMarkup(match.home)}</button><span class="palpite-x">X</span><button type="button" class="palpite-team" data-pick="${escapeHtml(match.away.name)}" aria-pressed="false">${teamMarkup(match.away)}</button></div><p class="palpite-status" aria-live="polite">Toque no seu escolhido</p>`;
      bindCard(card, match); games.append(card);
    });
    panel.append(league, games);
  }
  async function refreshScores() {
    try {
      const response = await fetch(`/api/palpitaria?date=${dateKey}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || 'Falha ao consultar os placares.');
      let matches = Array.isArray(payload.matches) ? payload.matches : Array.isArray(payload.data) ? payload.data : [];
      if (localPreview && !matches.length) matches = previewMatches;
      Object.keys(labels).forEach(competition => renderCompetition(competition, matches.filter(match => match.competition === competition)));
      const hasLive = matches.some(match => match.state === 'in');
      nowBox.dataset.state = hasLive ? 'live' : 'idle';
      liveLabel.textContent = hasLive ? 'PLACAR AO VIVO' : 'PLACARES ATUALIZADOS';
      const stamp = new Date(payload.updatedAt || Date.now());
      updated.textContent = `Atualizado às ${stamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      nowBox.dataset.state = 'idle'; liveLabel.textContent = 'PLACAR INDISPONÍVEL';
      updated.textContent = 'Não foi possível atualizar agora. Tentaremos novamente.';
    }
  }
  document.getElementById('palpitaria-clear')?.addEventListener('click', () => {
    picks = {}; save();
    root.querySelectorAll('.palpite-status').forEach(status => { status.textContent = 'Toque no seu escolhido'; });
    root.querySelectorAll('[data-pick]').forEach(button => button.setAttribute('aria-pressed', 'false'));
    root.querySelectorAll('.palpite-card').forEach(card => card.classList.remove('has-pick'));
    feedback.textContent = 'Seus palpites foram removidos deste navegador.';
  });
  panels.forEach(panel => { panel.className = 'palpitaria-panel palpitaria-empty'; panel.innerHTML = '<span class="champions-mark" aria-hidden="true">✦</span><h3>Buscando jogos do dia…</h3>'; });
  selectTab(tabs[0]); refreshScores();
  refreshTimer = window.setInterval(() => { if (!document.hidden) refreshScores(); }, 30000);
  window.addEventListener('pagehide', () => window.clearInterval(refreshTimer), { once: true });
})();
