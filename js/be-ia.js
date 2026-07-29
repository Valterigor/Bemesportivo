(() => {
'use strict';

const root = document.getElementById('be-ia');
const form = document.getElementById('be-ia-form');
const input = document.getElementById('be-ia-input');
const answer = document.getElementById('be-ia-answer');
if (!root || !form || !input || !answer) return;

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
const barrierLabels = {
  tempo: 'falta de tempo', energia: 'energia ou recuperação', dificuldade: 'dificuldade do passo',
  acesso: 'acesso a local ou equipamento', apoio: 'companhia ou apoio',
  desconforto: 'dor, desconforto ou insegurança', outro: 'uma barreira pessoal'
};
const safetyPatterns = [
  'dor forte', 'dor no peito', 'falta de ar', 'desmaio', 'desmaiei', 'tontura forte',
  'lesao', 'machuquei', 'piora', 'palpitacao', 'nao consigo respirar'
];
let currentResponse = null;

function normalize(value) {
  return String(value || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

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

function classifyIntent(query, context) {
  const text = normalize(query);
  if (context.safetyRestricted || safetyPatterns.some(pattern => text.includes(pattern))) return 'safety';
  if (['sem vontade', 'desanimado', 'desanimada', 'preguica', 'sem motivacao', 'nao quero treinar'].some(pattern => text.includes(pattern))) return 'motivation';
  if (['pouco tempo', 'sem tempo', 'corrido', 'corrida hoje', 'quantos minutos'].some(pattern => text.includes(pattern))) return 'time';
  if (['cansado', 'cansada', 'fadiga', 'exausto', 'exausta', 'dormi mal', 'sono'].some(pattern => text.includes(pattern))) return 'fatigue';
  if (['proximo passo', 'o que faco', 'o que fazer', 'hoje'].some(pattern => text.includes(pattern))) return 'next';
  if (['voltar', 'retomar', 'recuperar', 'recuperacao'].some(pattern => text.includes(pattern))) return 'recovery';
  return 'general';
}

function baseReasons(context) {
  const reasons = [
    `Sua faixa etária registrada é ${context.age}.`,
    `Seu objetivo atual é ${context.objective}.`,
    `Sua prática de referência é ${context.modality}.`,
    `Você informou ${context.availabilityLabel.toLocaleLowerCase('pt-BR')} disponíveis por prática.`,
    `Sua jornada está em ${context.progressPercent}% do ciclo atual.`
  ];
  if (context.recentLogs.length) reasons.push(`Nos últimos 7 dias há ${context.recentLogs.length} registro${context.recentLogs.length === 1 ? '' : 's'} e ${context.activeMinutes} minutos ativos.`);
  else reasons.push('Ainda não há registros nos últimos 7 dias; por isso a orientação prioriza um recomeço simples.');
  if (context.latestBarrier) reasons.push(`A barreira mais recente foi ${barrierLabels[context.latestBarrier] || 'um ajuste informado por você'}.`);
  return reasons;
}

function careResponse(context, triggeredBySignal = false) {
  return {
    intent: 'safety',
    tone: 'care',
    label: 'SEGURANÇA PRIMEIRO',
    title: `${context.name ? `${context.name}, ` : ''}não é momento de avançar o treino.`,
    message: triggeredBySignal
      ? 'O que você escreveu pode indicar um sinal que precisa de avaliação individual. A Be IA não consegue determinar a causa nem dizer se é seguro continuar.'
      : 'Seu questionário de segurança já indicou que a jornada deve aguardar uma avaliação individual.',
    nextTitle: 'Interrompa a atividade e procure orientação profissional.',
    detail: 'Se o sintoma for intenso, súbito ou estiver piorando, procure atendimento de urgência. Não tente compensar nem testar seus limites.',
    reasons: [...baseReasons(context), 'Sinais de atenção sempre têm prioridade sobre sequência, meta ou desempenho.'],
    primary: ['Ver profissionais', 'professional'],
    secondary: ['Revisar meu perfil', 'profile']
  };
}

function buildResponse(query, context) {
  const intent = classifyIntent(query, context);
  if (intent === 'safety') return careResponse(context, safetyPatterns.some(pattern => normalize(query).includes(pattern)));
  const lowRecovery = Number(context.latestLog?.feeling || 0) > 0 && Number(context.latestLog.feeling) <= 2;
  const shortSleep = context.latestLog?.sleep !== null && context.latestLog?.sleep !== undefined && Number(context.latestLog.sleep) < 6;
  const hasDiscomfortBarrier = context.latestBarrier === 'desconforto';
  if (hasDiscomfortBarrier) return careResponse(context, false);

  const greeting = context.name ? `${context.name}, ` : '';
  const historyMessage = context.activeLogs.length
    ? `Você já acumulou ${context.activeMinutes} minutos ativos nos últimos 7 dias${context.streak ? ` e construiu uma sequência de ${context.streak} dia${context.streak === 1 ? '' : 's'}` : ''}.`
    : 'Seu histórico recente ainda está aberto para um novo começo.';
  const responses = {
    motivation: {
      intent, tone: 'action', label: 'ORIENTAÇÃO PARA AGORA',
      title: `${greeting}você não precisa esperar a vontade aparecer.`,
      message: `${historyMessage} Hoje, o objetivo não é fazer o treino perfeito, mas preservar uma relação possível com sua jornada.`,
      nextTitle: context.streak
        ? `Hoje, ${context.shortDuration} minutos são suficientes para manter sua sequência visível.`
        : `Reserve ${context.shortDuration} minutos para uma versão curta de ${context.modality}.`,
      detail: 'Mantenha um ritmo confortável, sem buscar recorde ou compensação. A sequência é uma referência, não uma cobrança. Ao terminar, registre como você se sentiu; se começar não parecer adequado, registre a pausa sem culpa.',
      reasons: baseReasons(context),
      primary: ['Usar como prioridade de hoje', 'movement'],
      secondary: ['Registrar como estou', 'daily']
    },
    time: {
      intent, tone: 'action', label: 'POUCO TEMPO · PASSO POSSÍVEL',
      title: `${greeting}${context.shortDuration} minutos já podem manter o caminho visível.`,
      message: `Seu tempo informado é ${context.availabilityLabel.toLocaleLowerCase('pt-BR')}. Em um dia corrido, uma versão menor é mais coerente do que abandonar ou tentar compensar depois.`,
      nextTitle: `Faça somente ${context.shortDuration} minutos da versão mais simples de ${context.modality}.`,
      detail: 'Escolha uma parte que você já conhece, mantenha esforço confortável e encerre no tempo combinado.',
      reasons: baseReasons(context),
      primary: ['Definir movimento como prioridade', 'movement'],
      secondary: ['Ver minha jornada', 'journey']
    },
    fatigue: {
      intent, tone: 'care', label: 'ENERGIA E RECUPERAÇÃO',
      title: `${greeting}cansaço também é informação da jornada.`,
      message: lowRecovery || shortSleep
        ? 'Seu registro mais recente também mostra disposição baixa ou sono curto. Hoje, preservar recuperação é mais importante do que manter uma sequência a qualquer custo.'
        : 'Sem uma avaliação individual, a Be IA não pode dizer se o cansaço é normal. Observe sono, disposição e qualquer desconforto antes de decidir.',
      nextTitle: lowRecovery || shortSleep ? 'Escolha descanso consciente e registre como você está.' : 'Faça primeiro um check-in honesto do seu estado.',
      detail: 'Se houver dor forte, falta de ar incomum, tontura, desmaio ou piora, não treine e procure avaliação profissional.',
      reasons: baseReasons(context),
      primary: [lowRecovery || shortSleep ? 'Priorizar descanso hoje' : 'Registrar como estou', lowRecovery || shortSleep ? 'rest' : 'daily'],
      secondary: ['Ver minha jornada', 'journey']
    },
    recovery: {
      intent, tone: 'care', label: 'RETOMADA COM CUIDADO',
      title: `${greeting}retomar não é provar que você voltou ao nível anterior.`,
      message: 'A decisão precisa respeitar sua resposta atual e os limites combinados com o profissional que acompanha você.',
      nextTitle: 'Mantenha ou reduza o passo anterior antes de pensar em progredir.',
      detail: 'Registre como o corpo responde durante e depois. Diante de piora ou insegurança, interrompa e procure orientação.',
      reasons: baseReasons(context),
      primary: ['Ver meu passo atual', 'journey'],
      secondary: ['Encontrar profissional', 'professional']
    },
    next: {
      intent, tone: 'action', label: 'SEU PRÓXIMO PASSO',
      title: `${greeting}sua jornada pede uma ação de cada vez.`,
      message: `${historyMessage} A etapa atual e o tempo disponível indicam que o melhor passo é aquele que você consegue tentar e depois registrar.`,
      nextTitle: context.profile?.nextAction || `Use até ${context.shortDuration} minutos para continuar sua etapa atual.`,
      detail: 'Abra a Jornada da Semana para ver o passo a passo e conte como foi ao terminar.',
      reasons: baseReasons(context),
      primary: ['Abrir meu passo atual', 'journey'],
      secondary: ['Registrar Meu Hoje', 'daily']
    },
    general: {
      intent, tone: 'action', label: 'LEITURA DA SUA JORNADA',
      title: `${greeting}vamos transformar sua dúvida em um passo observável.`,
      message: `Considerei seu objetivo de ${context.objective}, sua prática de ${context.modality} e o que cabe na sua rotina agora.`,
      nextTitle: `Escolha entre continuar sua etapa atual ou registrar como você está hoje.`,
      detail: 'Se sua dúvida envolver sintomas, lesão, medicação ou retorno após afastamento, converse com um profissional antes de agir.',
      reasons: baseReasons(context),
      primary: ['Ver meu passo atual', 'journey'],
      secondary: ['Registrar Meu Hoje', 'daily']
    }
  };
  return responses[intent] || responses.general;
}

function runAction(action) {
  if (action === 'movement' || action === 'rest') {
    const intention = action === 'movement' ? 'movimento' : 'descanso';
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
  const response = buildResponse(query, context);
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
