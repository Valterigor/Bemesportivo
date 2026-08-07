(() => {
'use strict';

const root = document.getElementById('be-ia');
const form = document.getElementById('be-ia-form');
const input = document.getElementById('be-ia-input');
const answer = document.getElementById('be-ia-answer');
if (!root || !form || !input || !answer) return;

const knowledge = window.BeKnowledgeLibrary;
if (!knowledge) {
  root.hidden = true;
  return;
}

const PROFILE_KEY = 'meuCaminhoBeProfileV1';
const MEMORY_KEY = 'meuCaminhoBeBeIaV1';
const objectiveLabels = {
  comecar: 'começar no esporte',
  saude: 'melhorar a saúde',
  emagrecer: 'criar hábitos saudáveis',
  performance: 'buscar performance',
  modalidade: 'encontrar um esporte',
  recuperacao: 'voltar com segurança'
};
const modalityLabels = {
  futebol: 'futebol', futsal: 'futsal', volei: 'vôlei', corrida: 'corrida', ciclismo: 'ciclismo',
  natacao: 'natação', lutas: 'lutas', musculacao: 'musculação', outro: 'atividade física'
};
let currentResponse = null;

function readProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    return profile && typeof profile === 'object' ? profile : null;
  } catch {
    return null;
  }
}

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getJourneyContext(profile) {
  const logs = Array.isArray(profile?.dailyLogs) ? profile.dailyLogs : [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const recentLogs = logs.filter(log => new Date(`${log.date}T12:00:00`) >= sevenDaysAgo);
  const activeLogs = recentLogs.filter(log => log.activity !== 'none' && Number(log.minutes) > 0);
  const activeMinutes = activeLogs.reduce((total, log) => total + Number(log.minutes || 0), 0);
  const latestLog = [...logs].sort((a, b) => a.date.localeCompare(b.date)).at(-1) || null;
  const activeDays = new Set(logs.filter(log => log.activity !== 'none' && Number(log.minutes) > 0).map(log => log.date));
  const streakCursor = new Date();
  if (!activeDays.has(localDayKey(streakCursor))) streakCursor.setDate(streakCursor.getDate() - 1);
  let streak = 0;
  while (activeDays.has(localDayKey(streakCursor))) {
    streak += 1;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  const checkins = Array.isArray(profile?.checkins) ? profile.checkins : [];
  const latestCheckin = checkins.at(-1) || null;
  const age = profile?.ageLabel || profile?.age || 'faixa etária não informada';
  const objective = objectiveLabels[profile?.objective] || 'seguir uma jornada esportiva possível';
  const modality = profile?.practiceName || profile?.preferredSport?.name ||
    modalityLabels[profile?.sportProfile?.modality] || profile?.practiceLabel || 'atividade ainda em definição';
  const availability = Math.max(10, Number(profile?.availability || 20));
  const shortDuration = availability <= 15 ? availability : 20;
  const completed = Math.max(1, Math.min(5, Number(profile?.progress) || 1));
  return {
    profile,
    name: String(profile?.name || '').trim(),
    age,
    objective,
    modality,
    availability,
    availabilityLabel: profile?.availabilityLabel || `até ${availability} minutos`,
    shortDuration,
    completed,
    progressPercent: completed * 20,
    recentLogs,
    activeLogs,
    activeMinutes,
    streak,
    latestLog,
    latestCheckin,
    latestBarrier: latestCheckin?.barrier || '',
    safetyRestricted: Boolean(profile?.safety?.restricted)
  };
}

function contextFacts(context) {
  const history = context.recentLogs.length
    ? `${context.recentLogs.length} registro${context.recentLogs.length === 1 ? '' : 's'}, ${context.activeMinutes} minutos ativos e sequência de ${context.streak} dia${context.streak === 1 ? '' : 's'}`
    : 'nenhum registro nos últimos 7 dias';
  return [
    ['Momento', context.age],
    ['Objetivo', context.objective],
    ['Prática', context.modality],
    ['Jornada', `${context.progressPercent}% do ciclo atual`],
    ['Tempo', context.availabilityLabel],
    ['Histórico', history]
  ];
}

function renderContext(context) {
  const target = document.getElementById('be-ia-context');
  if (!target) return;
  target.replaceChildren(...contextFacts(context).map(([label, value]) => {
    const item = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    item.append(strong, value);
    return item;
  }));
}

function runAction(action) {
  if (['movement', 'rest', 'nutrition', 'hydration'].includes(action)) {
    const intention = { movement: 'movimento', rest: 'descanso', nutrition: 'alimentacao', hydration: 'hidratacao' }[action];
    document.querySelector(`[data-day-intent="${intention}"]`)?.click();
    document.getElementById('fb-day-guide')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (action === 'daily') {
    document.getElementById('fb-open-daily-form')?.click();
    document.getElementById('fb-daily-journal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const view = action === 'professional' ? 'especialistas' : action === 'profile' ? 'perfil' : 'progresso';
  document.querySelector(`[data-fb-view="${view}"]`)?.click();
}

function renderAnswer(response) {
  currentResponse = response;
  root.dataset.tone = response.tone;
  document.getElementById('be-ia-answer-tone').textContent = response.label;
  document.getElementById('be-ia-answer-time').textContent = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  document.getElementById('be-ia-answer-title').textContent = response.title;
  document.getElementById('be-ia-answer-message').textContent = response.message;
  document.getElementById('be-ia-next-title').textContent = response.nextTitle;
  document.getElementById('be-ia-next-detail').textContent = response.detail;
  const source = document.getElementById('be-ia-source');
  if (source) {
    const sourceNames = response.sources.map(item => item.title.split(' · ')[0]).join(', ');
    source.textContent = `Biblioteca BeM ${response.libraryVersion} · revisão ${new Intl.DateTimeFormat('pt-BR').format(new Date(`${response.reviewedAt}T12:00:00`))} · referências: ${sourceNames}.`;
  }
  const reasons = document.getElementById('be-ia-reasons');
  reasons.replaceChildren(...response.reasons.map(reason => {
    const item = document.createElement('li');
    item.textContent = reason;
    return item;
  }));
  const primary = document.getElementById('be-ia-primary');
  const secondary = document.getElementById('be-ia-secondary');
  primary.textContent = response.primary[0];
  primary.dataset.beIaAction = response.primary[1];
  secondary.textContent = response.secondary[0];
  secondary.dataset.beIaAction = response.secondary[1];
  answer.hidden = false;
  document.querySelectorAll('[data-be-ia-feedback]').forEach(button => button.removeAttribute('aria-pressed'));
  document.getElementById('be-ia-feedback-status').textContent = '';
  answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const heading = answer.querySelector('h3');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
  }
}

function saveInteraction(feedback = '') {
  if (!currentResponse) return;
  try {
    const memory = JSON.parse(localStorage.getItem(MEMORY_KEY) || '{"interactions":[]}');
    const interactions = Array.isArray(memory.interactions) ? memory.interactions : [];
    const last = interactions.at(-1);
    if (feedback && last && last.id === currentResponse.id) last.feedback = feedback;
    else interactions.push({ id: currentResponse.id, intent: currentResponse.intent, safety: currentResponse.tone === 'care', createdAt: new Date().toISOString(), feedback: '' });
    localStorage.setItem(MEMORY_KEY, JSON.stringify({ version: 1, interactions: interactions.slice(-20) }));
  } catch {}
}

function render() {
  const profile = readProfile();
  const allowed = Boolean(profile?.objective) && !['under-18', 'ate-17'].includes(profile?.age);
  root.hidden = !allowed;
  if (!allowed) return;
  renderContext(getJourneyContext(profile));
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const query = input.value.trim();
  if (query.length < 3) {
    input.focus();
    return;
  }
  const context = getJourneyContext(readProfile());
  const response = knowledge.buildResponse(query, context);
  response.id = `${Date.now()}-${response.intent}`;
  renderAnswer(response);
  saveInteraction();
  window.dispatchEvent(new CustomEvent('bemEsportivo:analytics', { detail: { name: 'be_ia_guidance', detail: response.intent } }));
});

document.querySelectorAll('[data-be-ia-prompt]').forEach(button => {
  button.addEventListener('click', () => {
    input.value = button.dataset.beIaPrompt;
    form.requestSubmit();
  });
});

document.querySelectorAll('#be-ia-primary,#be-ia-secondary').forEach(button => {
  button.addEventListener('click', () => runAction(button.dataset.beIaAction));
});

document.querySelectorAll('[data-be-ia-feedback]').forEach(button => {
  button.addEventListener('click', () => {
    const feedback = button.dataset.beIaFeedback;
    document.querySelectorAll('[data-be-ia-feedback]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('be-ia-feedback-status').textContent = feedback === 'yes'
      ? 'Obrigado. Esta resposta será usada para melhorar as próximas orientações.'
      : 'Obrigado. Vamos considerar que esta orientação precisa melhorar.';
    saveInteraction(feedback);
    window.dispatchEvent(new CustomEvent('bemEsportivo:analytics', { detail: { name: 'be_ia_feedback', detail: feedback } }));
  });
});

window.addEventListener('meuCaminhoBe:profile-updated', render);
window.addEventListener('storage', event => { if (event.key === PROFILE_KEY) render(); });
render();
})();
