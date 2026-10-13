(function (scope) {
  'use strict';
  const KEY = 'meuCaminhoBeGoalsV1';
  const metrics = { days: 'dias com atividade', sessions: 'atividades', minutes: 'minutos registrados', meals: 'dias com refeições registradas' };
  const objectives = { consistency: 'Criar constância', training: 'Acompanhar meus treinos', nutrition: 'Observar minha alimentação', movement: 'Movimentar-me mais' };
  const sports = ['all', 'corrida', 'treino', 'jogo', 'caminhada', 'ciclismo', 'natacao', 'outro'];
  function day(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(`${value}T12:00:00`).getTime()) && day(new Date(`${value}T12:00:00`)) === value;
  }
  function sanitize(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value.slice(-100).filter(g => g && /^[a-zA-Z0-9-]{1,80}$/.test(g.id) && !seen.has(g.id) && seen.add(g.id)
      && Object.hasOwn(metrics, g.metric) && Object.hasOwn(objectives, g.objective) && sports.includes(g.sport)
      && Number.isInteger(g.target) && g.target > 0 && g.target <= 100000
      && validDate(g.start) && validDate(g.end) && g.end >= g.start).map(g => ({
      id: g.id, objective: g.objective, metric: g.metric, sport: g.metric === 'meals' ? 'all' : g.sport,
      target: g.target, start: g.start, end: g.end, paused: g.paused === true
    }));
  }
  function progress(goal, entries = [], meals = [], today = day()) {
    const seen = new Set();
    const records = (goal.metric === 'meals' ? meals : entries).filter(r => {
      if (!r || !validDate(r.date) || r.date < goal.start || r.date > goal.end || r.date > today) return false;
      if (r.id && seen.has(r.id)) return false;
      if (r.id) seen.add(r.id);
      return goal.metric === 'meals' ? ['breakfast', 'snack', 'lunch', 'dinner'].includes(r.type)
        : Number.isFinite(Number(r.duration)) && Number(r.duration) > 0 && (goal.sport === 'all' || r.type === goal.sport);
    });
    const value = ['days', 'meals'].includes(goal.metric) ? new Set(records.map(r => r.date)).size
      : goal.metric === 'sessions' ? records.length : records.reduce((sum, r) => sum + Math.min(1440, Number(r.duration)), 0);
    return { value, percent: Math.min(100, Math.round(value / goal.target * 100)), status: goal.paused ? 'Pausada' : value >= goal.target ? 'Alcançada' : today < goal.start ? 'Planejada' : today > goal.end ? 'Prazo encerrado' : 'Em andamento' };
  }
  const api = { KEY, sanitize, progress, day };
  if (typeof module === 'object' && module.exports) module.exports = api;
  scope.BeDiaryGoals = api;
  if (typeof document === 'undefined') return;
  const root = document.getElementById('be-goals');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const readArray = key => { const v = read(key); return Array.isArray(v) ? v : []; };
  const node = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };
  const form = $('be-goal-form');
  let editId = '';
  function save(goals) {
    try { localStorage.setItem(KEY, JSON.stringify(sanitize(goals))); }
    catch { $('be-goal-status').textContent = 'Não foi possível salvar. Verifique o espaço do navegador e tente novamente.'; return false; }
    render();
    return true;
  }
  function resetForm() {
    editId = ''; form.reset(); form.elements.sport.disabled = false; form.elements.start.value = day();
    const end = new Date(); end.setDate(end.getDate() + 6); form.elements.end.value = day(end);
    $('be-goal-save').textContent = 'Salvar meta';
    $('be-goal-cancel').hidden = true;
  }
  function render() {
    const list = $('be-goal-list'); list.replaceChildren();
    const goals = sanitize(read(KEY));
    if (!goals.length) list.append(node('p', 'Escolha um objetivo e crie sua primeira meta. Você decide a quantidade e o prazo.'));
    for (const goal of goals) {
      const result = progress(goal, readArray('meuCaminhoBeDiaryV1'), readArray('meuCaminhoBeMealsV1'));
      const card = node('article');
      card.append(node('small', result.status), node('h3', objectives[goal.objective]));
      const sport = [...form.elements.sport.options].find(option => option.value === goal.sport)?.textContent;
      card.append(node('p', `${result.value} de ${goal.target} ${metrics[goal.metric]}${goal.sport !== 'all' ? ` · ${sport}` : ''}`));
      const bar = node('progress'); bar.max = goal.target; bar.value = Math.min(goal.target, result.value); bar.setAttribute('aria-label', `Progresso: ${objectives[goal.objective]}`); card.append(bar);
      const format = d => d.split('-').reverse().join('/');
      card.append(node('p', `${format(goal.start)} a ${format(goal.end)}`));
      if (result.status === 'Alcançada') card.append(node('p', 'Meta alcançada! Esse marco faz parte da sua história.'));
      if (goal.paused) card.append(node('p', 'Pausada para acompanhamento. Os registros do período continuam preservados.'));
      const actions = node('div'); actions.className = 'be-goal-actions';
      for (const [label, action] of [['Editar', () => {
        editId = goal.id;
        for (const key of ['objective', 'metric', 'sport', 'target', 'start', 'end']) form.elements[key].value = goal[key];
        form.elements.sport.disabled = goal.metric === 'meals';
        $('be-goal-save').textContent = 'Salvar alterações'; $('be-goal-cancel').hidden = false;
        form.elements.objective.focus();
      }], [goal.paused ? 'Retomar' : 'Pausar', () => save(goals.map(g => g.id === goal.id ? { ...g, paused: !g.paused } : g))], ['Excluir', () => {
        if (window.confirm('Excluir esta meta? Seus registros do diário serão mantidos.')) {
          if (save(goals.filter(g => g.id !== goal.id)) && editId === goal.id) resetForm();
        }
      }]]) {
        const button = node('button', label); button.type = 'button'; button.addEventListener('click', action); actions.append(button);
      }
      card.append(actions); list.append(card);
    }
    renderTips();
  }
  function renderTips() {
    const target = $('be-goal-tip'); target.replaceChildren();
    const library = scope.BeKnowledgeLibrary;
    if (!library) { target.append(node('p', 'A biblioteca está indisponível neste momento.')); return; }
    const profile = read('meuCaminhoBeProfileV1', {}) || {};
    const entries = readArray('meuCaminhoBeDiaryV1').filter(r => r && validDate(r.date) && r.date <= day()).sort((a, b) => b.date.localeCompare(a.date));
    const week = new Date(); week.setDate(week.getDate() - 6);
    const recent = entries.filter(r => r.date >= day(week));
    const selectedTopic = $('be-tip-topic').value;
    const query = { training: 'próximo passo', nutrition: 'alimentação', movement: 'por onde começo', recovery: 'recuperação' }[selectedTopic];
    const context = {
      name: profile.name || '', modality: profile.sportProfile?.modality || '',
      safetyRestricted: profile.safety?.restricted === true,
      latestLog: recent[0] || null, recentLogs: recent, activeLogs: recent,
      activeMinutes: recent.reduce((sum, r) => sum + (Number(r.duration) || 0), 0)
    };
    let response = library.buildResponse(query, context);
    const trainingTopics = { corrida: 'running', musculacao: 'strength-progression', futebol: 'football-skills', futsal: 'football-skills', volei: 'volleyball-skills', natacao: 'swimming-performance', ciclismo: 'cycling-performance', lutas: 'combat-sports' };
    const topicId = { training: trainingTopics[context.modality] || 'start-active-life', nutrition: 'sports-nutrition', movement: 'start-active-life', recovery: 'recovery' }[selectedTopic];
    const sportsLibrary = scope.BeSportsLibrary;
    const topic = sportsLibrary?.topics.find(t => t.id === topicId);
    if (topic && library.assessSafety('', context).level === 'clear') {
      response = { title: topic.title, message: topic.summary, detail: '', sources: topic.sourceIds.map(id => sportsLibrary.sources[id]).filter(Boolean).map(url => ({ url, title: `Fonte: ${new URL(url).hostname}` })) };
    }
    target.append(node('h3', response.title), node('p', response.message), node('p', response.detail));
    const details = node('details'); details.append(node('summary', 'Fontes da Biblioteca BeM'));
    for (const source of response.sources || []) {
      if (!/^https:\/\//.test(source.url)) continue;
      const link = node('a', source.title); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const p = node('p'); p.append(link); details.append(p);
    }
    details.append(node('p', 'Conteúdo educativo. Revisão profissional da biblioteca pendente.'));
    target.append(details);
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const goals = sanitize(read(KEY));
    const previous = goals.find(g => g.id === editId);
    const candidate = { id: editId || `goal-${Date.now()}-${Math.random().toString(16).slice(2)}`, paused: previous?.paused || false };
    for (const key of ['objective', 'metric', 'sport', 'start', 'end']) candidate[key] = form.elements[key].value;
    candidate.target = Number(form.elements.target.value);
    if (!sanitize([candidate]).length) { $('be-goal-status').textContent = 'Confira a quantidade e as datas. O prazo deve terminar no dia de início ou depois dele.'; return; }
    if (!editId && goals.length >= 100) { $('be-goal-status').textContent = 'Você atingiu o limite de 100 metas. Exclua uma meta antiga para continuar.'; return; }
    if (save(editId ? goals.map(g => g.id === editId ? candidate : g) : [...goals, candidate])) {
      resetForm(); $('be-goal-status').textContent = 'Meta salva neste navegador. O progresso acompanha os registros do período.';
    }
  });
  $('be-goal-cancel').addEventListener('click', resetForm);
  form.elements.objective.addEventListener('change', () => {
    const objective = form.elements.objective.value;
    form.elements.metric.value = objective === 'nutrition' ? 'meals' : objective === 'training' ? 'sessions' : 'days';
    form.elements.sport.disabled = objective === 'nutrition';
    $('be-tip-topic').value = objective === 'nutrition' ? 'nutrition' : objective === 'training' ? 'training' : 'movement';
    renderTips();
  });
  form.elements.metric.addEventListener('change', () => { form.elements.sport.disabled = form.elements.metric.value === 'meals'; });
  $('be-tip-topic').addEventListener('change', renderTips);
  for (const event of ['diary-changed', 'meals-changed', 'diary-imported', 'meals-imported', 'profile-updated', 'goals-imported']) window.addEventListener(`meuCaminhoBe:${event}`, render);
  window.addEventListener('meuCaminhoBe:reset', () => { resetForm(); render(); });
  window.addEventListener('storage', render);
  window.addEventListener('focus', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  resetForm(); render();
})(typeof globalThis !== 'undefined' ? globalThis : this);
