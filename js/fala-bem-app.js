(() => {
'use strict';

const shell = document.getElementById('fala-bem-app');
if (!shell) return;

const panels = [...shell.querySelectorAll('[data-fb-panel]')];
const navigationButtons = [...document.querySelectorAll('[data-fb-view]')];
const appNavButtons = [...shell.querySelectorAll('.fb-app-nav [data-fb-view]')];
const mobileDrawerViewButtons = [...shell.querySelectorAll('.fb-mobile-drawer [data-fb-view]')];
const managedSections = [...document.querySelectorAll('.container.page > :not(.fb-app-shell)')];
const PROFILE_STORAGE_KEY = 'meuCaminhoBeProfileV1';
const ACCESS_STORAGE_KEY = 'meuCaminhoBeAccessV1';
const dailyActivityLabels = {
  none: 'Sem treino', caminhada: 'Caminhada', corrida: 'Corrida', musculacao: 'Musculação',
  funcional: 'Treino funcional', futebol: 'Futebol', ciclismo: 'Ciclismo', natacao: 'Natação', outra: 'Outra atividade'
};
let currentProfile = readStoredProfile();
let pendingProfileUpdate = null;
const viewTargets = {
  jornada: ['#minha-jornada'],
  ferramentas: ['#ferramentas'],
  conteudos: ['.container.page > .layout'],
  especialistas: ['#especialistas'],
  modalidades: ['.container.page > .platform-duo'],
  comunidade: ['.container.page > .platform-engagement'],
  trilhas: ['#trilhas']
};

const objectiveLabels = {
  comecar: 'Começar no esporte', saude: 'Melhorar a saúde', emagrecer: 'Criar hábitos saudáveis',
  performance: 'Buscar performance', modalidade: 'Encontrar um esporte', recuperacao: 'Voltar com segurança'
};

const journeyStepTemplates = {
  comecar: ['Perfil esportivo definido','Escolher uma prática acessível','Realizar a primeira experiência','Repetir em um dia possível','Revisar e escolher o próximo ciclo'],
  saude: ['Perfil esportivo definido','Reservar horários possíveis','Fazer uma prática leve','Repetir com regularidade','Revisar disposição e rotina'],
  emagrecer: ['Perfil esportivo definido','Escolher uma atividade prazerosa','Organizar uma semana possível','Registrar sua constância','Revisar hábitos e próximo ciclo'],
  performance: ['Perfil esportivo definido','Definir uma meta mensurável','Registrar o ponto de partida','Acompanhar treino e recuperação','Revisar a evolução do ciclo'],
  modalidade: ['Perfil esportivo definido','Selecionar duas modalidades','Experimentar a primeira opção','Experimentar a segunda opção','Escolher a prática que convida a voltar'],
  recuperacao: ['Perfil esportivo definido','Planejar uma retomada gradual','Realizar uma prática mais leve','Observar as respostas do corpo','Revisar a retomada com segurança']
};

const journeyStepGuidance = {
  comecar: {
    2: { task: 'Faça uma sessão da prática escolhida, de 20 a 40 minutos, em ritmo leve e sem cobrança por desempenho.', doneWhen: 'Você tiver tentado a atividade uma vez e observado como se sentiu durante e depois.', message: 'A primeira experiência não precisa ser um teste. Ela serve para você conhecer a prática sem cobrança.', actions: ['Escolha um local, aula ou atividade que pareça acolhedora.', 'Separe de 20 a 40 minutos e vá em intensidade leve.', 'Ao terminar, observe como seu corpo e sua vontade responderam.'], question: 'O que tornou essa primeira experiência mais fácil ou mais difícil?', placeholder: 'Ex.: caminhei 25 minutos e me senti bem, mas cansei no final' },
    3: { message: 'Agora vamos transformar uma tentativa em começo de rotina, repetindo apenas o que foi possível.', actions: ['Escolha um dia realista nos próximos 7 dias.', 'Repita a atividade com tempo e intensidade parecidos.', 'Se algo incomodou, reduza o ritmo em vez de abandonar.'], question: 'O que ajudou ou atrapalhou você a repetir?', placeholder: 'Ex.: deixei a roupa pronta e consegui repetir na quinta-feira' },
    4: { message: 'Você já tem experiência suficiente para decidir o próximo ciclo sem aumentar tudo de uma vez.', actions: ['Compare como se sentiu na primeira e na segunda vez.', 'Escolha manter, reduzir ou aumentar apenas um ponto.', 'Defina dois dias possíveis para a próxima semana.'], question: 'Qual ajuste deixa seu próximo ciclo realmente possível?', placeholder: 'Ex.: vou manter 25 minutos, às terças e sábados' }
  },
  saude: {
    2: { task: 'Faça uma sessão leve da atividade escolhida, no horário reservado, mantendo um ritmo em que consiga conversar.', doneWhen: 'Você concluir uma tentativa e observar disposição, respiração e bem-estar após a atividade.', message: 'O objetivo agora é terminar melhor do que começou, sem buscar cansaço máximo.', actions: ['Faça a atividade leve que você escolheu.', 'Mantenha um ritmo em que ainda consiga conversar.', 'Pare e procure orientação se sentir dor, tontura ou mal-estar.'], question: 'Como ficaram sua disposição, respiração e bem-estar depois?', placeholder: 'Ex.: respirei bem e terminei com mais disposição' },
    3: { message: 'Saúde melhora com regularidade. Vamos repetir de um jeito que caiba na vida real.', actions: ['Use um dos horários reservados no seu plano.', 'Repita a prática leve, sem compensar dias perdidos.', 'Marque qual horário foi mais fácil de cumprir.'], question: 'Qual horário e condição facilitaram sua regularidade?', placeholder: 'Ex.: de manhã foi mais fácil porque tive menos imprevistos' },
    4: { message: 'É hora de olhar para o efeito da rotina, não apenas para o número de sessões.', actions: ['Compare energia, sono e disposição com o início.', 'Identifique o horário que funcionou melhor.', 'Escolha a frequência que consegue manter no próximo ciclo.'], question: 'O que melhorou e o que precisa mudar na próxima semana?', placeholder: 'Ex.: dormi melhor; vou trocar o treino de sexta por sábado' }
  },
  emagrecer: {
    2: { task: 'Escolha dois ou três horários reais para a semana e realize a primeira sessão da atividade prazerosa que você definiu.', doneWhen: 'Os horários estiverem definidos e pelo menos a primeira sessão tiver sido tentada.', message: 'Uma semana possível vale mais do que um plano perfeito que não cabe na rotina.', actions: ['Escolha de dois a três momentos disponíveis na semana.', 'Comece pela atividade prazerosa que você definiu.', 'Evite compensações: alimentação e treino não são punição.'], question: 'Quais momentos você conseguiu reservar de verdade?', placeholder: 'Ex.: consegui caminhar na terça e no sábado' },
    3: { message: 'Vamos observar constância, não apenas peso ou calorias.', actions: ['Conte quantas vezes você se movimentou nesta semana.', 'Registre também sessões curtas ou realizadas parcialmente.', 'Perceba qual escolha ajudou você a continuar.'], question: 'O que mais contribuiu para você manter a constância?', placeholder: 'Ex.: fiz 2 sessões; ter companhia ajudou bastante' },
    4: { message: 'O próximo ciclo deve preservar o que funcionou e ajustar somente o necessário.', actions: ['Revise atividade, sono, fome e disposição sem julgamento.', 'Mantenha o hábito mais fácil de repetir.', 'Escolha uma única mudança para a próxima semana.'], question: 'Qual hábito você mantém e qual pequeno ajuste fará agora?', placeholder: 'Ex.: mantenho as caminhadas e vou organizar o horário do jantar' }
  },
  performance: {
    2: { task: 'Faça um treino conhecido sem buscar recorde e registre uma medida simples: tempo, distância, carga ou esforço de 0 a 10.', doneWhen: 'Você tiver uma referência do treino e uma observação sobre recuperação, sono ou desconforto.', message: 'Antes de evoluir, precisamos de uma referência honesta do seu momento atual.', actions: ['Repita um treino conhecido, sem buscar recorde.', 'Registre tempo, distância, carga ou percepção de esforço.', 'Anote também sono, dor e recuperação do dia seguinte.'], question: 'Qual foi seu ponto de partida e como seu corpo respondeu?', placeholder: 'Ex.: corri 5 km em 31 min, esforço 7/10 e sem dor' },
    3: { message: 'Performance sustentável equilibra estímulo e recuperação. Os dois contam como treino.', actions: ['Cumpra as sessões previstas sem adicionar volume por impulso.', 'Após cada treino, registre esforço de 0 a 10.', 'Observe sono, dor persistente e vontade de treinar.'], question: 'Qual padrão você percebeu entre treino e recuperação?', placeholder: 'Ex.: rendi melhor após 8 horas de sono; esforço médio 6/10' },
    4: { message: 'Agora compare o ciclo com a referência inicial antes de decidir aumentar a carga.', actions: ['Compare a mesma medida usada no ponto de partida.', 'Valorize evolução técnica e recuperação, não só números.', 'Altere apenas volume, intensidade ou frequência — um por vez.'], question: 'O que evoluiu e qual variável você ajustará no próximo ciclo?', placeholder: 'Ex.: mantive o ritmo com menos esforço; aumentarei 5 minutos' }
  },
  modalidade: {
    2: { task: 'Experimente uma aula ou sessão iniciante da primeira modalidade selecionada e dê uma nota de 0 a 10 para sua vontade de voltar.', doneWhen: 'Você tiver experimentado uma opção e avaliado acesso, acolhimento, diversão e esforço.', message: 'A primeira experiência é uma descoberta, não uma decisão definitiva.', actions: ['Faça uma aula experimental ou prática introdutória.', 'Observe acesso, acolhimento, diversão e exigência física.', 'Dê uma nota de 0 a 10 para sua vontade de voltar.'], question: 'Como foi a primeira opção e qual foi sua vontade de voltar?', placeholder: 'Ex.: gostei do ambiente e minha vontade de voltar é 8/10' },
    3: { message: 'Experimente a segunda opção com os mesmos critérios para comparar com justiça.', actions: ['Faça uma aula ou sessão de nível iniciante.', 'Observe custo, deslocamento, ambiente e prazer.', 'Dê uma nota de 0 a 10 para sua vontade de voltar.'], question: 'Como a segunda opção se compara à primeira?', placeholder: 'Ex.: foi mais divertida, mas o horário é menos acessível' },
    4: { message: 'A melhor modalidade é aquela que combina interesse com possibilidade de continuar.', actions: ['Compare prazer, acesso, segurança e vontade de voltar.', 'Escolha a opção que cabe melhor na sua vida atual.', 'Defina quando será a próxima prática.'], question: 'Qual prática você escolheu e quando pretende voltar?', placeholder: 'Ex.: escolhi natação e marquei a próxima aula para quarta' }
  },
  recuperacao: {
    2: { task: 'Faça uma prática mais leve dentro dos limites combinados com o profissional que acompanha sua recuperação.', doneWhen: 'Você tiver tentado a atividade e observado a resposta do corpo durante e nas horas seguintes.', message: 'Retomar é testar tolerância com cuidado, não provar que você voltou ao nível anterior.', actions: ['Siga os limites dados pelo profissional que acompanha você.', 'Reduza tempo, carga ou intensidade em relação ao habitual.', 'Interrompa diante de dor aguda, piora importante ou insegurança.'], question: 'Como seu corpo respondeu durante e após a prática leve?', placeholder: 'Ex.: fiz 20 minutos sem dor; senti apenas cansaço leve' },
    3: { message: 'A resposta nas horas seguintes ajuda a decidir se o ritmo está adequado.', actions: ['Observe dor, inchaço, fadiga e confiança por até 24 horas.', 'Compare os sinais com os de antes da atividade.', 'Se houver piora importante, não avance e procure orientação.'], question: 'O que mudou no seu corpo nas horas seguintes?', placeholder: 'Ex.: não houve dor; a fadiga passou após algumas horas' },
    4: { message: 'Vamos escolher o próximo passo pelo que seu corpo mostrou, não pela pressa de voltar.', actions: ['Mantenha o nível se a resposta foi boa e estável.', 'Reduza ou pause se houve piora relevante.', 'Combine qualquer progressão com o profissional responsável.'], question: 'Qual decisão é mais segura para o próximo ciclo?', placeholder: 'Ex.: vou repetir a mesma carga e conversar com meu fisioterapeuta' }
  }
};

function readStoredProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null');
    if (!profile || typeof profile !== 'object') return null;
    return {
      ...profile,
      schemaVersion: 5,
      checkins: Array.isArray(profile.checkins) ? profile.checkins : [],
      cycles: Array.isArray(profile.cycles) ? profile.cycles : [],
      dailyLogs: Array.isArray(profile.dailyLogs) ? profile.dailyLogs.map(sanitizeDailyLog).filter(Boolean).slice(-180) : [],
      activityHistory: Array.isArray(profile.activityHistory) ? profile.activityHistory : [],
      gamificationStats: profile.gamificationStats && typeof profile.gamificationStats === 'object' ? profile.gamificationStats : {}
    };
  } catch (error) {
    return null;
  }
}

function saveProfile(updates) {
  const now = new Date().toISOString();
  currentProfile = {
    ...(currentProfile || {}),
    ...updates,
    schemaVersion: 5,
    createdAt: currentProfile?.createdAt || updates.createdAt || now,
    updatedAt: now
  };
  try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(currentProfile)); } catch (error) {}
  renderPersonalizedExperience();
  return currentProfile;
}

function readAccessState() {
  try {
    const state = JSON.parse(localStorage.getItem(ACCESS_STORAGE_KEY) || 'null');
    return state && typeof state === 'object' ? state : null;
  } catch (error) {
    return null;
  }
}

function saveAccessState(state) {
  try { localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
}

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sanitizeDailyLog(log) {
  if (!log || typeof log !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(log.date || ''))) return null;
  const activity = Object.hasOwn(dailyActivityLabels, log.activity) ? log.activity : 'none';
  const cleanText = (value, limit) => String(value || '').trim().slice(0, limit);
  const cleanNumber = (value, minimum, maximum) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : null;
  };
  return {
    date: String(log.date), activity,
    minutes: activity === 'none' ? 0 : Math.round(cleanNumber(log.minutes, 0, 600) || 0),
    intensity: ['leve', 'moderada', 'intensa'].includes(log.intensity) ? log.intensity : '',
    water: cleanNumber(log.water, 0, 15), sleep: cleanNumber(log.sleep, 0, 24),
    feeling: ['1', '2', '3', '4', '5'].includes(String(log.feeling || '')) ? String(log.feeling) : '',
    meals: {
      breakfast: cleanText(log.meals?.breakfast, 240), lunch: cleanText(log.meals?.lunch, 240),
      snacks: cleanText(log.meals?.snacks, 240), dinner: cleanText(log.meals?.dinner, 240)
    },
    note: cleanText(log.note, 300), updatedAt: cleanText(log.updatedAt, 40) || new Date().toISOString()
  };
}

function registerFirstIdentityAccess() {
  if (readAccessState()) return;
  saveAccessState({ accessCount: 1, firstAccessAt: new Date().toISOString(), lastGreetingDate: '' });
}

function showDailyWelcome(name) {
  const dialog = document.getElementById('fb-daily-welcome');
  const nameTarget = document.getElementById('fb-welcome-name');
  if (!dialog || !nameTarget || dialog.open) return;
  nameTarget.textContent = name;
  try { dialog.showModal(); } catch (error) { dialog.setAttribute('open', ''); }
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (dialog.open && typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

function safetyScreeningIsCurrent(profile = currentProfile, details = profile) {
  return Boolean(profile?.safety?.consent
    && profile.safety.objective === details?.objective
    && profile.safety.age === details?.age);
}

function openSafetyDialog(details = currentProfile, force = false) {
  const dialog = document.getElementById('fb-safety-dialog');
  const form = document.getElementById('fb-safety-form');
  if (!dialog || !form || !details?.objective) return;
  pendingProfileUpdate = { ...details };
  if (force || !safetyScreeningIsCurrent(currentProfile, details)) form.reset();
  const savedSafety = !force && safetyScreeningIsCurrent(currentProfile, details) ? currentProfile.safety : null;
  if (savedSafety) {
    form.elements.symptoms.value = savedSafety.symptoms || '';
    form.elements.condition.value = savedSafety.condition || '';
    form.elements.clearance.value = savedSafety.clearance || '';
    document.getElementById('fb-safety-consent').checked = true;
  }
  const condition = form.elements.condition.value;
  const clearanceGroup = document.getElementById('fb-safety-clearance-group');
  if (clearanceGroup) clearanceGroup.hidden = condition !== 'yes';
  const clearanceInputs = [...form.querySelectorAll('[name="clearance"]')];
  clearanceInputs.forEach(input => { input.required = condition === 'yes'; });
  const guardianWrap = document.getElementById('fb-safety-guardian-wrap');
  const guardian = document.getElementById('fb-safety-guardian');
  const needsGuardian = details.age === 'ate-17';
  if (guardianWrap) guardianWrap.hidden = !needsGuardian;
  if (guardian) guardian.required = needsGuardian;
  try { dialog.showModal(); } catch (error) { dialog.setAttribute('open', ''); }
}

function isSafetyRestricted(profile = currentProfile) {
  return Boolean(profile?.safety?.restricted);
}

function isSafetyPending(profile = currentProfile) {
  return Boolean(profile?.objective && !safetyScreeningIsCurrent(profile, profile));
}

function openResetDialog() {
  const dialog = document.getElementById('fb-reset-dialog');
  if (!dialog || dialog.open) return;
  try { dialog.showModal(); } catch (error) { dialog.setAttribute('open', ''); }
}

function resetLocalJourney() {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(ACCESS_STORAGE_KEY);
    localStorage.removeItem('meuCaminhoBeCommunityName');
  } catch (error) {}
  currentProfile = null;
  const status = document.getElementById('fb-checkin-status');
  const note = document.getElementById('fb-checkin-note');
  if (status) status.value = '';
  if (note) note.value = '';
  resultsContainer?.replaceChildren();
  if (answerStatus) answerStatus.textContent = '';
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:reset'));
  renderPersonalizedExperience();
  closeDialog(document.getElementById('fb-daily-welcome'));
  closeDialog(document.getElementById('fb-reset-dialog'));
  closeMobileDrawer(false);
  openView('jornada');
  window.setTimeout(() => document.getElementById('journey-name')?.focus(), 280);
}

function registerDailyAccess() {
  const name = currentProfile?.name?.trim();
  if (!name) return;
  const now = new Date();
  const today = localDayKey(now);
  const previous = readAccessState();
  if (!previous) {
    registerFirstIdentityAccess();
    return;
  }
  const shouldWelcome = Number(previous.accessCount || 0) >= 1 && previous.lastGreetingDate !== today;
  const nextState = {
    ...previous,
    accessCount: Number(previous.accessCount || 0) + 1,
    previousAccessAt: previous.lastAccessAt || previous.firstAccessAt || '',
    lastAccessAt: now.toISOString(),
    lastGreetingDate: shouldWelcome ? today : previous.lastGreetingDate
  };
  saveAccessState(nextState);
  renderHistory();
  if (shouldWelcome) window.setTimeout(() => showDailyWelcome(name), 350);
}

function resolveView(view) {
  if (panels.some(panel => panel.dataset.fbPanel === view)) return view;
  return viewTargets[view] ? view : 'inicio';
}

function openView(requestedView, options = {}) {
  const view = resolveView(requestedView);
  const isShellPanel = panels.some(panel => panel.dataset.fbPanel === view);

  panels.forEach(panel => {
    const selected = panel.dataset.fbPanel === view;
    panel.hidden = !selected;
    panel.classList.toggle('active', selected);
  });

  managedSections.forEach(section => section.classList.remove('fb-app-visible'));
  (viewTargets[view] || []).forEach(selector => {
    document.querySelector(selector)?.classList.add('fb-app-visible');
  });

  shell.classList.toggle('fb-app-shell-compact', !isShellPanel);
  document.body.classList.forEach(className => {
    if (className.startsWith('fb-view-')) document.body.classList.remove(className);
  });
  document.body.classList.add(`fb-view-${view}`);

  appNavButtons.forEach(button => {
    const buttonView = button.dataset.fbView;
    const hasDirectNavigation = appNavButtons.some(item => item.dataset.fbView === view);
    const selected = buttonView === view || (!hasDirectNavigation && (
      (view === 'progresso' && buttonView === 'jornada') ||
      (view === 'perfil' && buttonView === 'inicio') ||
      (view === 'comunidade' && buttonView === 'conteudos') ||
      (view === 'especialistas' && buttonView === 'conteudos') ||
      (view === 'modalidades' && buttonView === 'conteudos') ||
      (view === 'trilhas' && buttonView === 'jornada')
    ));
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  mobileDrawerViewButtons.forEach(button => {
    const buttonView = button.dataset.fbView;
    const selected = buttonView === view ||
      (view === 'progresso' && buttonView === 'jornada') ||
      (view === 'comunidade' && buttonView === 'comunidade');
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (options.scroll !== false) {
    const destination = isShellPanel ? shell : document.querySelector(viewTargets[view][0]);
    destination?.scrollIntoView({ behavior: options.instant ? 'auto' : 'smooth', block: 'start' });
  }

  return true;
}

window.falaBemOpenView = openView;
window.falaBemOpenTarget = target => {
  const targetViews = {
    'minha-jornada': 'jornada', trilhas: 'trilhas', ferramentas: 'ferramentas',
    especialistas: 'especialistas', modalidades: 'modalidades', ideias: 'conteudos',
    historias: 'conteudos', 'participe-agora': 'comunidade'
  };
  const view = targetViews[target];
  if (!view) return false;
  openView(view);
  return true;
};

navigationButtons.forEach(button => {
  button.addEventListener('click', () => {
    const requestedView = button.dataset.fbView;
    const isContinueControl = button.closest('.fb-app-nav,.fb-mobile-drawer');
    const view = requestedView === 'jornada' && currentProfile?.objective && isContinueControl ? 'progresso' : requestedView;
    openView(view);
  });
});

const mobileMenuToggle = document.getElementById('fb-mobile-menu-toggle');
const mobileDrawer = document.getElementById('fb-mobile-drawer');
const mobileDrawerOverlay = document.getElementById('fb-mobile-drawer-overlay');
const mobileDrawerClose = document.getElementById('fb-mobile-drawer-close');

function openMobileDrawer() {
  if (!mobileDrawer || !mobileDrawerOverlay) return;
  mobileDrawer.hidden = false;
  mobileDrawerOverlay.hidden = false;
  document.body.classList.add('fb-mobile-menu-open');
  mobileMenuToggle?.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => {
    mobileDrawer.classList.add('open');
    mobileDrawerOverlay.classList.add('open');
    mobileDrawer.querySelector('button[data-fb-view]')?.focus();
  });
}

function closeMobileDrawer(restoreFocus = true) {
  if (!mobileDrawer || !mobileDrawerOverlay || mobileDrawer.hidden) return;
  mobileDrawer.classList.remove('open');
  mobileDrawerOverlay.classList.remove('open');
  document.body.classList.remove('fb-mobile-menu-open');
  mobileMenuToggle?.setAttribute('aria-expanded', 'false');
  window.setTimeout(() => {
    mobileDrawer.hidden = true;
    mobileDrawerOverlay.hidden = true;
    if (restoreFocus) mobileMenuToggle?.focus();
  }, 220);
}

mobileMenuToggle?.addEventListener('click', openMobileDrawer);
mobileDrawerClose?.addEventListener('click', () => closeMobileDrawer());
mobileDrawerOverlay?.addEventListener('click', () => closeMobileDrawer());
mobileDrawer?.querySelectorAll('[data-fb-view], a').forEach(control => {
  control.addEventListener('click', () => closeMobileDrawer(false));
});
const desktopViewport = window.matchMedia('(min-width: 761px)');
desktopViewport.addEventListener?.('change', event => {
  if (event.matches) closeMobileDrawer(false);
});
document.addEventListener('keydown', event => {
  if (!mobileDrawer || mobileDrawer.hidden) return;
  if (event.key === 'Escape') {
    closeMobileDrawer();
    return;
  }
  if (event.key === 'Tab') {
    const focusable = [...mobileDrawer.querySelectorAll('button:not([disabled]),a[href]')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

const normalize = value => String(value || '')
  .toLocaleLowerCase('pt-BR')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const stopWords = new Set(['a','ao','aos','anos','as','com','como','da','das','de','devo','depois','dia','dias','do','dos','durante','e','em','eu','fazer','idade','me','melhor','na','nas','no','nos','o','os','para','pode','posso','por','qual','quais','quando','quantas','quanto','quantos','que','se','semana','tenho','um','uma','vez','vezes','onde','porque']);
const searchTokens = query => [...new Set(normalize(query).split(' ').filter(token => token.length > 2 && !stopWords.has(token)))];

function buildLocalIndex() {
  const nodes = [...document.querySelectorAll('.article-grid .post, .journey-guidance-card, .feature-opiniao, .professional-voice')];
  return nodes.map((node, index) => {
    if (!node.id) node.id = `fala-bem-conteudo-${index + 1}`;
    const title = node.querySelector('h2, h3')?.textContent.trim() || 'Conteúdo BeMEsportivo';
    const summaryNode = node.querySelector('.excerpt, .professional-voice-copy p, .full-text p, p');
    const summary = summaryNode?.textContent.trim() || '';
    return {
      node,
      title,
      summary,
      titleSearch: normalize(title),
      tagsSearch: normalize(node.dataset.tags || ''),
      bodySearch: normalize(node.textContent),
      url: `#${node.id}`
    };
  });
}

const localIndex = buildLocalIndex();

function searchLocal(query) {
  const phrase = normalize(query);
  const tokens = searchTokens(query);
  if (!tokens.length) return [];

  return localIndex.map(item => {
    let score = item.titleSearch.includes(phrase) ? 14 : 0;
    tokens.forEach(token => {
      if (item.titleSearch.includes(token)) score += 5;
      if (item.tagsSearch.includes(token)) score += 4;
      if (item.bodySearch.includes(token)) score += 1;
    });
    return { ...item, score };
  }).filter(item => item.score >= Math.max(3, Math.min(tokens.length * 2, 6)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function plainText(value) {
  const parsed = new DOMParser().parseFromString(String(value || ''), 'text/html');
  return parsed.body.textContent.replace(/\s+/g, ' ').trim();
}

async function fetchWithTimeout(url, timeout = 9000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

const scientificVocabulary = {
  exercicio: 'exercise', exercicios: 'exercise', esporte: 'sport', esportiva: 'sports', esportivo: 'sports',
  correr: 'running', corrida: 'running', caminhada: 'walking', caminhar: 'walking', iniciante: 'beginner', comecar: 'beginner',
  treino: 'training', treinar: 'training', musculacao: 'resistance training', forca: 'strength', hipertrofia: 'muscle hypertrophy', massa: 'muscle mass',
  emagrecer: 'weight loss', emagrecimento: 'weight loss', gordura: 'body fat', recuperacao: 'recovery', descanso: 'recovery',
  hidratacao: 'hydration', agua: 'hydration', alimentacao: 'nutrition', nutricao: 'nutrition', proteina: 'protein', creatina: 'creatine',
  saude: 'health', melhorar: 'improve', desempenho: 'performance', velocidade: 'speed', resistencia: 'endurance', flexibilidade: 'flexibility', mobilidade: 'mobility',
  sono: 'sleep', dormir: 'sleep', ansiedade: 'anxiety', depressao: 'depression', estresse: 'stress', motivacao: 'motivation', constancia: 'adherence',
  dor: 'pain', lesao: 'injury', joelho: 'knee', coluna: 'spine', ombro: 'shoulder', tornozelo: 'ankle', tendinite: 'tendinopathy',
  coracao: 'cardiovascular', cardiaco: 'cardiac', pressao: 'blood pressure', hipertensao: 'hypertension', diabetes: 'diabetes', obesidade: 'obesity',
  gestante: 'pregnancy', gravidez: 'pregnancy', idoso: 'older adults', idosos: 'older adults', crianca: 'children', criancas: 'children', adolescente: 'adolescents', adolescentes: 'adolescents', sedentario: 'physically inactive'
};

const evidenceDomains = [
  { id: 'injury', label: 'Dor e lesões', patterns: ['dor','lesao','machuc','tendinite','entorse','joelho','ombro','coluna','tornozelo'], terms: ['sports injury','exercise related pain','rehabilitation'] },
  { id: 'clinical', label: 'Exercício e saúde', patterns: ['saude','hipertens','diabetes','obesidade','cardiac','coracao','pressao','doenca','asma','colesterol'], terms: ['exercise therapy','physical activity','clinical guideline'] },
  { id: 'running', label: 'Corrida', patterns: ['corrida','correr','trote','maratona'], terms: ['running','running training','aerobic exercise'] },
  { id: 'strength', label: 'Força e hipertrofia', patterns: ['musculacao','hipertrofia','massa muscular','forca','academia'], terms: ['resistance training','strength training','muscle hypertrophy'] },
  { id: 'weight', label: 'Emagrecimento', patterns: ['para emagrecer','emagrec','perder peso','perda de peso','gordura','peso corporal'], terms: ['weight loss','body composition','physical activity'] },
  { id: 'recovery', label: 'Recuperação', patterns: ['recuper','descanso','fadiga','cansaco','pos treino'], terms: ['exercise recovery','muscle soreness','training load'] },
  { id: 'hydration', label: 'Hidratação', patterns: ['hidrat','agua','desidrat'], terms: ['hydration','exercise fluid replacement','dehydration'] },
  { id: 'nutrition', label: 'Nutrição esportiva', patterns: ['aliment','nutri','proteina','creatina','suplement','carboidrato'], terms: ['sports nutrition','exercise nutrition','dietary supplement'] },
  { id: 'sleep', label: 'Sono', patterns: ['sono','dormir','insonia'], terms: ['sleep','exercise recovery','physical activity'] },
  { id: 'mental', label: 'Saúde mental', patterns: ['ansiedade','depressao','estresse','autoestima','saude mental'], terms: ['mental health','exercise','physical activity'] },
  { id: 'adherence', label: 'Constância', patterns: ['constancia','habito','motivacao','desistir','rotina'], terms: ['exercise adherence','behavior change','physical activity'] },
  { id: 'special-population', label: 'Prática segura', patterns: ['gestante','gravidez','idoso','idosos','terceira idade','60 anos','crianca','criancas','adolescente'], terms: ['exercise prescription','physical activity guideline','safety'] }
];

const questionIntents = [
  { id: 'safety', label: 'segurança', patterns: ['posso','seguro','seguranca','risco','contraindic','cuidado','perigoso'], terms: ['safety','contraindications'] },
  { id: 'frequency', label: 'frequência e volume', patterns: ['quantas vezes','frequencia','por semana','quanto tempo','quantos minutos','todo dia','todos os dias'], terms: ['frequency','dose response'] },
  { id: 'start', label: 'como começar', patterns: ['como comecar','quero comecar','iniciar','iniciante','primeiro passo','voltar a'], terms: ['beginner','exercise prescription'] },
  { id: 'performance', label: 'como evoluir', patterns: ['melhorar','evoluir','aumentar','desempenho','performance','mais rapido','mais forte'], terms: ['performance','progression'] },
  { id: 'choice', label: 'escolha', patterns: ['qual melhor','melhor exercicio','o que escolher','qual esporte','vale mais','ou'], terms: ['comparison','recommendation'] },
  { id: 'recovery', label: 'recuperação', patterns: ['recuperar','recuperacao','depois do treino','pos treino','descansar'], terms: ['recovery','training load'] }
];

const populationPatterns = [
  { id: 'child', label: 'crianças e adolescentes', patterns: ['crianca','criancas','adolescente','ate 17'], terms: ['children','adolescents'] },
  { id: 'older', label: 'pessoas com 60 anos ou mais', patterns: ['idoso','idosos','terceira idade','60 anos','depois dos 60'], terms: ['older adults'] },
  { id: 'pregnancy', label: 'gestantes', patterns: ['gestante','gravidez','gravida'], terms: ['pregnancy'] },
  { id: 'beginner', label: 'iniciantes', patterns: ['iniciante','comecar','primeiro passo','sedentario'], terms: ['beginner'] }
];

function matchesPattern(text, pattern) {
  if (pattern.includes(' ') || pattern.length > 3) return text.includes(pattern);
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`).test(text);
}

function classifyQuestion(query) {
  const normalized = normalize(query);
  const domains = evidenceDomains.map(domain => ({
    ...domain,
    score: domain.patterns.reduce((score, pattern) => score + (matchesPattern(normalized, pattern) ? Math.max(2, pattern.split(' ').length * 2) : 0), 0)
  })).filter(domain => domain.score > 0).sort((a, b) => b.score - a.score);
  const primary = domains[0] || { id: 'general', label: 'Atividade física', terms: ['physical activity','exercise'] };
  let intent = questionIntents.map(item => ({
    ...item,
    score: item.patterns.reduce((score, pattern) => score + (matchesPattern(normalized, pattern) ? Math.max(2, pattern.split(' ').length * 2) : 0), 0)
  })).filter(item => item.score > 0).sort((a, b) => b.score - a.score)[0] || { id: 'general', label: 'orientação', terms: [] };
  const explicitPerformance = ['desempenho','performance','evoluir','mais rapido','mais forte'].some(pattern => normalized.includes(pattern));
  if (intent.id === 'performance' && ['injury','clinical','sleep','mental','adherence'].includes(primary.id) && !explicitPerformance) {
    intent = { id: 'general', label: 'orientação', terms: [] };
  }
  if (primary.id === 'recovery' && ['general','performance'].includes(intent.id) && !explicitPerformance) {
    intent = questionIntents.find(item => item.id === 'recovery');
  }
  const population = populationPatterns.find(item => item.patterns.some(pattern => matchesPattern(normalized, pattern))) || null;
  return { normalized, domains, intent, population, primary };
}

function buildScientificQuery(query, classification) {
  const translatedTokens = searchTokens(query).map(token => scientificVocabulary[token] || token).filter(Boolean);
  const concepts = classification.domains.flatMap(domain => domain.terms);
  const terms = [...new Set([...translatedTokens, ...concepts, ...(classification.intent.terms || []), ...(classification.population?.terms || [])])].slice(0, 12);
  return terms.join(' ');
}

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const words = [];
  Object.entries(invertedIndex).forEach(([word, positions]) => {
    (positions || []).forEach(position => { words[position] = word; });
  });
  return words.filter(Boolean).join(' ');
}

function evidenceTypeLabel(value) {
  const text = normalize(Array.isArray(value) ? value.join(' ') : value);
  if (text.includes('meta-analysis') || text.includes('meta analysis')) return 'Meta-análise';
  if (text.includes('systematic review')) return 'Revisão sistemática';
  if (text.includes('guideline')) return 'Diretriz';
  if (text.includes('randomized') || text.includes('clinical trial')) return 'Ensaio clínico';
  if (text.includes('review')) return 'Revisão';
  return 'Estudo científico';
}

function evidenceBonus(result) {
  const label = normalize(result.evidenceType || '');
  if (label.includes('meta-analise') || label.includes('revisao sistematica') || label.includes('diretriz')) return 8;
  if (label.includes('ensaio clinico')) return 5;
  if (label.includes('revisao')) return 3;
  return 1;
}

function containsConcept(text, term) {
  if (text.includes(term)) return true;
  const roots = {
    running: 'runn', runner: 'runn', runners: 'runn',
    injury: 'injur', injuries: 'injur',
    hydration: 'hydrat', hydrated: 'hydrat',
    recovery: 'recover', recovered: 'recover',
    hypertension: 'hypertens', hypertensive: 'hypertens',
    strength: 'strength', hypertrophy: 'hypertroph',
    adherence: 'adher', motivation: 'motivat'
  };
  const root = roots[term];
  return root ? text.includes(root) : false;
}

function rankScientificResults(results, scientificQuery, classification, originalQuery = '') {
  const terms = [...new Set(searchTokens(scientificQuery))];
  const domainTerms = (classification.domains.length ? classification.domains : [classification.primary]).flatMap(domain => domain.terms).map(normalize);
  const broadTerms = new Set(['exercise','training','sport','sports','physical','activity','therapy','guideline','beginner','best','better','improve','melhor']);
  const focusTerms = [...new Set(searchTokens(originalQuery).flatMap(token => searchTokens(scientificVocabulary[token] || token)))].filter(term => !broadTerms.has(term));
  const scored = results.map(result => {
    const title = normalize(result.title);
    const summary = normalize(result.summary);
    let relevance = evidenceBonus(result);
    let focusMatches = 0;
    let focusTitleMatches = 0;
    let domainMatches = 0;
    terms.forEach(term => {
      if (containsConcept(title, term)) {
        relevance += 5;
        if (focusTerms.includes(term)) {
          focusMatches += 2;
          focusTitleMatches += 1;
        }
      } else if (containsConcept(summary, term)) {
        relevance += 1;
        if (focusTerms.includes(term)) focusMatches += 1;
      }
    });
    domainTerms.forEach(term => {
      if (containsConcept(title, term)) {
        relevance += 6;
        domainMatches += 2;
      } else if (containsConcept(summary, term)) {
        relevance += 2;
        domainMatches += 1;
      }
    });
    relevance += Math.min(4, Math.log10((result.citations || 0) + 1));
    if (Number(result.date) >= new Date().getFullYear() - 7) relevance += 1;
    return { ...result, relevance, focusMatches, focusTitleMatches, domainMatches };
  });
  const hasFocusedTitles = focusTerms.length && scored.some(result => result.focusTitleMatches > 0);
  const ranked = scored.filter(result => {
    const topicMatch = focusTerms.length
      ? (hasFocusedTitles ? result.focusTitleMatches > 0 : result.focusMatches > 0)
      : result.domainMatches > 0;
    return topicMatch && result.relevance >= 6;
  })
    .sort((a, b) => b.relevance - a.relevance);

  const seen = new Set();
  return ranked.filter(result => {
    const key = normalize(result.doi || result.title).slice(0, 160);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

async function searchWikipedia(query) {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '0', gsrlimit: '4',
    prop: 'extracts|info', exintro: '1', explaintext: '1', exsentences: '3',
    inprop: 'url', format: 'json', origin: '*'
  });
  const data = await fetchWithTimeout(`https://pt.wikipedia.org/w/api.php?${params}`);
  return Object.values(data.query?.pages || {})
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map(page => ({
      source: 'Wikipédia', title: page.title, summary: plainText(page.extract),
      url: page.fullurl || `https://pt.wikipedia.org/?curid=${page.pageid}`
    })).filter(item => item.summary);
}

async function searchEuropePmc(query) {
  const params = new URLSearchParams({ query, format: 'json', pageSize: '8', resultType: 'core' });
  const data = await fetchWithTimeout(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params}`);
  return (data.resultList?.result || []).map(item => {
    const articleId = item.pmid || item.pmcid || item.id;
    const sourceId = item.source || (item.pmcid ? 'PMC' : 'MED');
    const details = [item.authorString, item.journalTitle, item.pubYear].filter(Boolean).join(' · ');
    const publicationTypes = item.pubTypeList?.pubType || [];
    return {
      source: item.pmid ? 'PubMed / Europe PMC' : 'Europe PMC',
      title: plainText(item.title),
      summary: plainText(item.abstractText || details || 'Registro científico relacionado à sua busca.'),
      date: item.pubYear || '',
      evidenceType: evidenceTypeLabel(publicationTypes),
      doi: item.doi || '',
      citations: Number(item.citedByCount) || 0,
      url: `https://europepmc.org/article/${encodeURIComponent(sourceId)}/${encodeURIComponent(articleId)}`
    };
  }).filter(item => item.title && item.url);
}

async function searchOpenAlex(query) {
  const params = new URLSearchParams({ search: query, 'per-page': '8', filter: 'has_abstract:true' });
  const data = await fetchWithTimeout(`https://api.openalex.org/works?${params}`, 10000);
  return (data.results || []).map(work => {
    const authors = (work.authorships || []).slice(0, 3).map(item => item.author?.display_name).filter(Boolean).join(', ');
    const venue = work.primary_location?.source?.display_name || '';
    const details = [authors, venue, work.publication_year].filter(Boolean).join(' · ');
    const abstract = reconstructAbstract(work.abstract_inverted_index);
    return {
      source: 'OpenAlex',
      title: plainText(work.display_name || work.title),
      summary: plainText(abstract || details || 'Registro acadêmico relacionado à sua busca.'),
      date: work.publication_year || '',
      evidenceType: evidenceTypeLabel(work.type_crossref || work.type),
      doi: work.doi || '',
      citations: Number(work.cited_by_count) || 0,
      url: work.doi || work.primary_location?.landing_page_url || work.id
    };
  }).filter(item => item.title && item.url);
}

const guidanceByDomain = {
  running: {
    title: 'Comece pela regularidade, não pela velocidade.',
    intro: 'Para iniciar ou evoluir na corrida, a orientação mais segura é aumentar o esforço gradualmente e observar como o corpo responde entre as sessões.',
    actions: ['Alterne caminhada e corrida em intensidade confortável.', 'Mantenha dias de recuperação e aumente o volume aos poucos.', 'Dor persistente ou que altera o movimento precisa de avaliação profissional.']
  },
  strength: {
    title: 'Técnica, progressão e recuperação constroem resultado.',
    intro: 'Treinos de força funcionam melhor quando a carga evolui de forma planejada, os movimentos são bem executados e há tempo suficiente para recuperação.',
    actions: ['Priorize movimentos que você consegue executar com controle.', 'Registre carga, repetições e percepção de esforço.', 'Sono e alimentação fazem parte da adaptação ao treino.']
  },
  injury: {
    title: 'Dor relacionada ao esporte precisa de contexto.',
    intro: 'Uma busca online não consegue diagnosticar uma lesão. A conduta depende do local, intensidade, duração, mecanismo e impacto da dor no movimento.',
    actions: ['Reduza ou interrompa a atividade que piora os sintomas.', 'Observe inchaço, perda de força, limitação ou dor progressiva.', 'Procure avaliação qualificada se a dor persistir ou houver trauma importante.']
  },
  clinical: {
    title: 'Exercício pode ajudar, mas a prescrição deve respeitar sua condição.',
    intro: 'Atividade física costuma integrar o cuidado de diversas condições de saúde, porém tipo, intensidade e progressão precisam considerar sintomas, tratamento e histórico individual.',
    actions: ['Confirme restrições e sinais de alerta com a equipe de saúde.', 'Comece em intensidade tolerável e acompanhe a resposta do organismo.', 'Não altere medicamentos ou tratamento com base apenas nesta busca.']
  },
  weight: {
    title: 'Emagrecimento sustentável combina movimento e rotina.',
    intro: 'O exercício contribui para gasto energético, condicionamento e manutenção de massa muscular, mas resultados duradouros dependem do conjunto de hábitos.',
    actions: ['Escolha atividades que você consiga repetir semanalmente.', 'Combine exercícios aeróbicos e de força quando possível.', 'Evite metas extremas e acompanhe indicadores além do peso.']
  },
  recovery: {
    title: 'Recuperar também é parte do treinamento.',
    intro: 'A recuperação depende da carga realizada, sono, alimentação, hidratação e intervalo entre estímulos. Mais treino nem sempre significa mais evolução.',
    actions: ['Alterne dias mais exigentes e mais leves.', 'Observe fadiga, queda de desempenho e qualidade do sono.', 'Ajuste a carga antes que o cansaço se transforme em interrupção.']
  },
  hydration: {
    title: 'A necessidade de hidratação muda com esforço e ambiente.',
    intro: 'Duração, intensidade, temperatura, suor e características individuais influenciam a reposição de líquidos durante a prática esportiva.',
    actions: ['Comece a atividade já hidratado.', 'Em sessões longas ou muito quentes, planeje a reposição.', 'Evite tanto a desidratação quanto o consumo excessivo de água.']
  },
  nutrition: {
    title: 'Nutrição esportiva deve acompanhar objetivo e rotina.',
    intro: 'Alimentação, quantidade de treino, recuperação e contexto de saúde precisam ser analisados em conjunto antes de recomendar suplementos ou estratégias específicas.',
    actions: ['Priorize uma alimentação adequada antes de buscar suplementos.', 'Considere dose, segurança e evidência de cada produto.', 'Condições clínicas exigem orientação individualizada.']
  },
  sleep: {
    title: 'Sono influencia recuperação, disposição e desempenho.',
    intro: 'Regularidade, duração e qualidade do sono afetam a adaptação ao exercício e a capacidade de manter uma rotina ativa.',
    actions: ['Mantenha horários consistentes sempre que possível.', 'Evite treinos intensos muito próximos do sono se isso atrapalhar você.', 'Insônia persistente merece avaliação profissional.']
  },
  mental: {
    title: 'Movimento pode apoiar o bem-estar mental.',
    intro: 'Atividade física regular pode contribuir para humor, sono e qualidade de vida, mas não substitui cuidado psicológico ou médico quando necessário.',
    actions: ['Comece com uma prática possível e de que você goste.', 'Use metas pequenas para favorecer continuidade.', 'Procure ajuda se os sintomas forem intensos ou persistentes.']
  },
  adherence: {
    title: 'Constância nasce de uma rotina possível.',
    intro: 'Planos simples, metas específicas e atividades prazerosas tendem a ser mais sustentáveis do que mudanças grandes e difíceis de repetir.',
    actions: ['Defina dias e horários realistas.', 'Reduza a meta nos dias difíceis em vez de abandonar o plano.', 'Registre pequenas vitórias para enxergar evolução.']
  },
  'special-population': {
    title: 'A prática deve respeitar fase de vida e necessidades individuais.',
    intro: 'Crianças, gestantes e pessoas idosas podem se beneficiar do movimento, mas recomendações e cuidados mudam conforme desenvolvimento, saúde e experiência.',
    actions: ['Escolha atividades adequadas à condição e ao nível atual.', 'Priorize supervisão quando houver risco ou pouca experiência.', 'Use diretrizes específicas para a população pesquisada.']
  },
  general: {
    title: 'A melhor orientação depende do seu objetivo e do seu momento.',
    intro: 'Selecionamos conteúdos e estudos diretamente relacionados aos termos da pergunta para você comparar orientações e entender a qualidade das fontes.',
    actions: ['Observe se a fonte responde à mesma população e objetivo.', 'Dê preferência a revisões, diretrizes e estudos bem descritos.', 'Em decisões de saúde, confirme a orientação com um profissional.']
  }
};

const intentGuidance = {
  start: {
    title: domain => `Um começo possível em ${domain.toLocaleLowerCase('pt-BR')}.`,
    lead: 'O melhor primeiro passo é aquele que cabe na rotina, pode ser repetido e permite observar a resposta do corpo.',
    action: 'Comece com uma versão curta e confortável e só progrida quando conseguir repeti-la bem.'
  },
  frequency: {
    title: domain => `A quantidade adequada em ${domain.toLocaleLowerCase('pt-BR')} depende do seu momento.`,
    lead: 'Frequência e duração não têm um único número ideal: experiência, intensidade, recuperação e objetivo mudam a recomendação.',
    action: 'Distribua a prática na semana e ajuste uma variável por vez: frequência, duração ou intensidade.'
  },
  safety: {
    title: domain => `Segurança vem antes da progressão em ${domain.toLocaleLowerCase('pt-BR')}.`,
    lead: 'A resposta depende do histórico, dos sintomas atuais e da intensidade pretendida; uma busca não substitui avaliação individual.',
    action: 'Interrompa a prática e procure avaliação diante de dor forte, falta de ar incomum, desmaio ou piora progressiva.'
  },
  performance: {
    title: domain => `Para evoluir em ${domain.toLocaleLowerCase('pt-BR')}, acompanhe o processo.`,
    lead: 'Melhora consistente costuma vir de estímulo progressivo, recuperação suficiente e uma meta que possa ser medida.',
    action: 'Escolha um indicador de evolução e revise-o após algumas semanas, sem aumentar tudo ao mesmo tempo.'
  },
  choice: {
    title: domain => `A melhor escolha em ${domain.toLocaleLowerCase('pt-BR')} precisa combinar com você.`,
    lead: 'A opção mais útil não é apenas a mais eficiente no papel: segurança, acesso, preferência e possibilidade de manter a prática também contam.',
    action: 'Compare as opções por objetivo, prazer, acesso e tolerância; experimente antes de decidir quando for seguro.'
  },
  recovery: {
    title: () => 'Recuperação faz parte do resultado.',
    lead: 'A resposta ao treino depende do equilíbrio entre esforço e recuperação, e não apenas da quantidade de atividade realizada.',
    action: 'Observe sono, disposição, dor e desempenho antes de repetir uma sessão exigente.'
  }
};

function objectiveForGuidance(classification) {
  if (classification.primary.id === 'injury' || classification.intent.id === 'recovery') return 'recuperacao';
  if (classification.primary.id === 'weight') return 'emagrecer';
  if (classification.intent.id === 'start' || classification.population?.id === 'beginner') return 'comecar';
  if (classification.intent.id === 'performance') return 'performance';
  if (['clinical','mental','sleep','adherence','special-population'].includes(classification.primary.id)) return 'saude';
  return 'comecar';
}

function buildGuidance(classification, evidenceCount, query) {
  const domainGuidance = guidanceByDomain[classification.primary.id] || guidanceByDomain.general;
  const intent = intentGuidance[classification.intent.id];
  const populationNote = classification.population
    ? ` A orientação deve considerar especificamente ${classification.population.label}.`
    : '';
  return {
    ...domainGuidance,
    title: intent ? intent.title(classification.primary.label) : domainGuidance.title,
    intro: `${intent?.lead || domainGuidance.intro}${populationNote}`,
    actions: intent ? [intent.action, ...domainGuidance.actions.slice(0, 2)] : domainGuidance.actions,
    domain: classification.primary.label,
    intent: classification.intent.label,
    evidenceCount,
    query,
    objective: objectiveForGuidance(classification)
  };
}

function createGuidanceCard(guidance) {
  const article = document.createElement('article');
  article.className = 'fb-evidence-summary';
  const header = document.createElement('header');
  const label = document.createElement('span');
  label.textContent = 'ORIENTAÇÃO EDUCATIVA GERAL';
  const domain = document.createElement('span');
  domain.textContent = `${guidance.domain} · ${guidance.intent}`;
  header.append(label, domain);
  const title = document.createElement('h3');
  title.textContent = guidance.title;
  const intro = document.createElement('p');
  intro.textContent = guidance.intro;
  const list = document.createElement('ul');
  guidance.actions.forEach(action => {
    const item = document.createElement('li');
    item.textContent = action;
    list.append(item);
  });
  const footer = document.createElement('footer');
  footer.textContent = guidance.evidenceCount
    ? `Este texto é uma orientação geral do Meu Caminho Be, não uma síntese clínica. Abaixo estão ${guidance.evidenceCount} fonte${guidance.evidenceCount > 1 ? 's' : ''} científica${guidance.evidenceCount > 1 ? 's' : ''} relacionada${guidance.evidenceCount > 1 ? 's' : ''} para consulta.`
    : 'Orientação educativa geral, não derivada de uma avaliação clínica. Nenhuma fonte científica específica foi recuperada agora.';
  const nextStep = document.createElement('button');
  nextStep.type = 'button';
  nextStep.className = 'fb-guidance-next';
  nextStep.textContent = 'Levar para minha trajetória →';
  nextStep.addEventListener('click', () => {
    openView('jornada');
    const option = document.querySelector(`[data-journey-field="objective"][data-journey-value="${guidance.objective}"]`);
    window.setTimeout(() => {
      option?.click();
      document.getElementById('journey-assistant')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
  });
  article.append(header, title, intro, list, footer, nextStep);
  return article;
}

function createResultsHeading(title, detail = '') {
  const header = document.createElement('header');
  header.className = 'fb-results-heading';
  const heading = document.createElement('h3');
  heading.textContent = title;
  header.append(heading);
  if (detail) {
    const paragraph = document.createElement('p');
    paragraph.textContent = detail;
    header.append(paragraph);
  }
  return header;
}

function resultExcerpt(value, limit = 520) {
  const text = plainText(value);
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit);
  const sentenceEnd = Math.max(shortened.lastIndexOf('. '), shortened.lastIndexOf('; '));
  return `${shortened.slice(0, sentenceEnd > 260 ? sentenceEnd + 1 : limit).trim()}…`;
}

const resultsContainer = document.getElementById('fb-answer-results');
const answerStatus = document.getElementById('fb-answer-status');
const answerInput = document.getElementById('fb-answer-input');
const answerForm = document.getElementById('fb-answer-form');

function createResultCard(result, local = false) {
  const article = document.createElement('article');
  article.className = 'fb-answer-card';
  const header = document.createElement('header');
  const source = document.createElement('span');
  source.className = 'fb-answer-source';
  source.textContent = local ? 'NO BEMESPORTIVO' : result.source.toLocaleUpperCase('pt-BR');
  header.append(source);
  if (!local && result.evidenceType) {
    const evidenceType = document.createElement('span');
    evidenceType.className = 'fb-evidence-type';
    evidenceType.textContent = result.evidenceType;
    header.append(evidenceType);
  }
  if (result.date) {
    const time = document.createElement('time');
    time.textContent = result.date;
    header.append(time);
  }
  const title = document.createElement('h3');
  title.textContent = result.title;
  const summary = document.createElement('p');
  summary.textContent = resultExcerpt(result.summary);
  const action = document.createElement(local ? 'button' : 'a');
  action.textContent = local ? 'Ler no Meu Caminho Be →' : 'Consultar fonte →';
  if (local) {
    action.type = 'button';
    action.addEventListener('click', () => {
      openView('conteudos');
      const target = document.querySelector(result.url);
      const fullText = target?.querySelector('.full-text');
      const toggle = target?.querySelector('.read-toggle');
      if (fullText && toggle && getComputedStyle(fullText).display === 'none') toggle.click();
      window.setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 280);
    });
  } else {
    action.href = result.url;
    action.target = '_blank';
    action.rel = 'noopener noreferrer';
  }
  article.append(header, title, summary, action);
  return article;
}

const evidenceCache = new Map();
let answerRequestId = 0;

async function answerQuestion(query) {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) return;
  const requestId = ++answerRequestId;
  resultsContainer.replaceChildren();
  answerStatus.textContent = 'Entendendo sua pergunta e procurando evidências relacionadas…';
  const classification = classifyQuestion(cleanQuery);
  const scientificQuery = buildScientificQuery(cleanQuery, classification);
  const localResults = searchLocal(cleanQuery);
  const cacheKey = normalize(`${cleanQuery} ${scientificQuery}`);
  let externalData = evidenceCache.get(cacheKey);

  if (!externalData) {
    const settled = await Promise.allSettled([
      searchEuropePmc(scientificQuery),
      searchOpenAlex(scientificQuery),
      searchWikipedia(cleanQuery)
    ]);
    externalData = {
      scientific: settled.slice(0, 2).flatMap(result => result.status === 'fulfilled' ? result.value : []),
      context: settled[2]?.status === 'fulfilled' ? settled[2].value : [],
      failed: settled.filter(result => result.status === 'rejected').length
    };
    evidenceCache.set(cacheKey, externalData);
    if (evidenceCache.size > 12) evidenceCache.delete(evidenceCache.keys().next().value);
  }

  if (requestId !== answerRequestId) return;
  const scientificResults = rankScientificResults(externalData.scientific, scientificQuery, classification, cleanQuery);
  const contextResults = externalData.context.slice(0, scientificResults.length ? 1 : 2);
  const guidance = buildGuidance(classification, scientificResults.length, cleanQuery);
  const output = [createGuidanceCard(guidance)];

  if (localResults.length) {
    output.push(createResultsHeading('No BeMEsportivo', 'Conteúdos do próprio site que correspondem ao tema da pergunta.'));
    output.push(...localResults.slice(0, 3).map(result => createResultCard(result, true)));
  }
  if (scientificResults.length) {
    output.push(createResultsHeading('Evidências científicas', 'Priorizamos revisões, diretrizes e estudos com maior relação com o tema.'));
    output.push(...scientificResults.map(result => createResultCard(result)));
  }
  if (contextResults.length) {
    output.push(createResultsHeading('Contexto geral', 'Material introdutório para compreender conceitos; não substitui evidência científica.'));
    output.push(...contextResults.map(result => createResultCard(result)));
  }

  resultsContainer.replaceChildren(...output);
  const sources = [...new Set(scientificResults.map(result => result.source))];
  if (scientificResults.length) {
    answerStatus.textContent = `Entendemos sua pergunta como “${classification.primary.label}” com foco em ${classification.intent.label}. ${scientificResults.length} evidência${scientificResults.length > 1 ? 's' : ''} selecionada${scientificResults.length > 1 ? 's' : ''} em ${sources.join(' e ')}.`;
  } else if (localResults.length || contextResults.length) {
    answerStatus.textContent = `Encontramos conteúdo relacionado a “${classification.primary.label}”, mas nenhuma evidência científica específica foi recuperada agora.`;
  } else {
    answerStatus.textContent = 'Não encontramos fontes específicas agora. Reformule a pergunta incluindo atividade, objetivo e população.';
  }
}

function getJourneySteps(profile = currentProfile) {
  return journeyStepTemplates[profile?.objective] || journeyStepTemplates.comecar;
}

function getStepGuidance(stepIndex, profile = currentProfile) {
  const objective = journeyStepGuidance[profile?.objective] || journeyStepGuidance.comecar;
  return objective?.[stepIndex] || null;
}

function createCurrentStepGuide(guidance, adaptiveNote = '') {
  const guide = document.createElement('section');
  const kicker = document.createElement('span');
  const heading = document.createElement('h4');
  const message = document.createElement('p');
  const actions = document.createElement('ol');
  const prompt = document.createElement('p');
  guide.className = 'fb-current-step-guide';
  kicker.textContent = 'VAMOS FAZER JUNTOS';
  heading.textContent = currentProfile?.name ? `${currentProfile.name}, seu passo a passo é este:` : 'Seu passo a passo é este:';
  message.textContent = guidance.message;
  if (guidance.task) {
    const task = document.createElement('div');
    const taskLabel = document.createElement('span');
    const taskText = document.createElement('strong');
    task.className = 'fb-current-step-task';
    taskLabel.textContent = 'FAÇA ISTO AGORA';
    taskText.textContent = guidance.task;
    task.append(taskLabel, taskText);
    guide.append(kicker, heading, task);
  } else {
    guide.append(kicker, heading);
  }
  if (adaptiveNote) {
    const adaptation = document.createElement('p');
    adaptation.className = 'fb-current-step-adaptation';
    adaptation.textContent = adaptiveNote;
    guide.append(adaptation);
  }
  guide.append(message);
  guidance.actions.forEach(action => {
    const item = document.createElement('li');
    item.textContent = action;
    actions.append(item);
  });
  prompt.className = 'fb-current-step-prompt';
  prompt.textContent = guidance.doneWhen
    ? `Considere esta etapa concluída quando: ${guidance.doneWhen}`
    : 'Depois de tentar, conte como foi logo abaixo. Não existe resposta perfeita: seu relato ajuda a ajustar o próximo passo.';
  guide.append(actions, prompt);
  return guide;
}

function getAdaptiveStepNote(stepIndex, savedCheckins = [], profile = currentProfile) {
  if (stepIndex === 1 && profile?.cycleAdjustment === 'reduce') return 'Ajuste deste novo ciclo: comece com metade do tempo ou da carga anterior e observe a resposta antes de aumentar.';
  if (stepIndex === 1 && profile?.cycleAdjustment === 'maintain') return 'Ajuste deste novo ciclo: mantenha o nível anterior. O objetivo agora é tornar a repetição mais estável.';
  if (stepIndex < 2) return '';
  const previousStep = getJourneySteps(profile)[stepIndex - 1];
  const previous = [...savedCheckins].reverse().find(item => item?.step === previousStep);
  if (previous?.status === 'ajustar') return 'Você pediu um ajuste no passo anterior. Faça uma versão menor: reduza tempo, intensidade ou dificuldade e preserve apenas o que foi confortável.';
  if (previous?.status === 'parcial') return 'Você realizou parte do passo anterior. Continue a partir do que funcionou, sem compensar o que ficou faltando.';
  if (previous?.status === 'concluida') return 'O passo anterior foi realizado. Mantenha a base e, se estiver se sentindo bem, altere somente uma variável por vez.';
  return '';
}

function getCompletedSteps(profile = currentProfile) {
  const requestedProgress = Math.max(1, Math.min(5, Number(profile?.progress) || 1));
  const checkins = Array.isArray(profile?.checkins) ? profile.checkins : [];
  const requiredSteps = getJourneySteps(profile).slice(1);
  let verifiedProgress = 1;
  for (const step of requiredSteps) {
    const hasValidRecord = checkins.some(item => item?.step === step && item?.status && String(item?.note || '').trim().length >= 3);
    if (!hasValidRecord) break;
    verifiedProgress += 1;
  }
  return Math.min(requestedProgress, verifiedProgress);
}

function updateProgressActionState() {
  const button = document.getElementById('fb-complete-step');
  const newCycleButton = document.getElementById('fb-new-cycle');
  const calendarButton = document.getElementById('fb-calendar-next');
  const checkin = document.getElementById('fb-progress-checkin');
  const status = document.getElementById('fb-checkin-status');
  const note = document.getElementById('fb-checkin-note');
  const form = document.getElementById('fb-progress-checkin');
  const help = document.getElementById('fb-checkin-help');
  if (!button) return;
  const cycleComplete = currentProfile?.objective && getCompletedSteps() >= getJourneySteps().length;
  const safetyRestricted = isSafetyRestricted();
  const safetyPending = isSafetyPending();
  if (checkin) checkin.hidden = !currentProfile?.objective || cycleComplete || safetyRestricted || safetyPending;
  if (newCycleButton) newCycleButton.hidden = !cycleComplete;
  if (calendarButton) calendarButton.hidden = !currentProfile?.objective || cycleComplete || safetyRestricted || safetyPending;
  const requiresCheckin = Boolean(currentProfile?.objective && !cycleComplete && !safetyRestricted && !safetyPending);
  if (status) status.disabled = !requiresCheckin;
  if (note) note.disabled = !requiresCheckin;
  const hasValidData = Boolean(form?.checkValidity() && status?.value && (note?.value.trim().length || 0) >= 3);
  button.disabled = !currentProfile?.objective || cycleComplete || safetyRestricted || safetyPending || !hasValidData;
  button.setAttribute('aria-disabled', String(button.disabled));
  if (help && requiresCheckin) {
    help.classList.toggle('ready', hasValidData);
    help.textContent = !status?.value
      ? 'Selecione como foi esta etapa para continuar.'
      : (note?.value.trim().length || 0) < 3
        ? 'Agora escreva uma observação com pelo menos 3 caracteres.'
        : 'Tudo certo. O botão está liberado para registrar e concluir.';
  }
}

function renderProfileSummary() {
  const container = document.getElementById('fb-profile-summary');
  const nextStep = document.getElementById('fb-profile-next-step');
  if (nextStep) nextStep.hidden = !isSafetyRestricted();
  if (!container) return;
  if (!currentProfile?.objective) {
    const message = document.createElement('p');
    message.textContent = 'Complete sua jornada inicial para formar o perfil esportivo.';
    container.replaceChildren(message);
    return;
  }
  const fields = [
    ['OBJETIVO', objectiveLabels[currentProfile.objective] || 'Seu caminho'],
    ['PRÁTICA ATUAL', currentProfile.practiceName || currentProfile.practiceLabel || 'Não informado'],
    ['MOMENTO', currentProfile.ageLabel || 'Não informado'],
    ['TEMPO', currentProfile.availabilityLabel || 'Não informado'],
    ['SEGURANÇA', isSafetyRestricted() ? 'Revisão profissional recomendada' : currentProfile.safety?.consent ? 'Triagem concluída' : 'Triagem pendente']
  ];
  if (currentProfile.preferredSport?.name) fields.splice(2, 0, ['ESPORTE ESCOLHIDO', currentProfile.preferredSport.name]);
  container.replaceChildren(...fields.map(([label, value]) => {
    const item = document.createElement('div');
    const span = document.createElement('span');
    const strong = document.createElement('strong');
    span.textContent = label;
    strong.textContent = value;
    item.append(span, strong);
    return item;
  }));
}

function renderCycleSummary(steps, completed, savedCheckins) {
  const summary = document.getElementById('fb-cycle-summary');
  if (!summary) return;
  const cycleComplete = steps.length > 0 && completed >= steps.length;
  summary.hidden = !cycleComplete;
  if (!cycleComplete) {
    summary.replaceChildren();
    return;
  }

  const records = steps.slice(1).map(step => [...savedCheckins].reverse().find(item => item?.step === step)).filter(Boolean);
  const completedCount = records.filter(item => item.status === 'concluida').length;
  const partialCount = records.filter(item => item.status === 'parcial').length;
  const adjustCount = records.filter(item => item.status === 'ajustar').length;
  const isRecoveryCaution = currentProfile?.objective === 'recuperacao' && adjustCount > 0;
  let tone = 'celebrate';
  let kicker = 'CICLO CONCLUÍDO · PARABÉNS';
  let title = 'Você transformou intenção em movimento.';
  let message = 'Seu registro mostra um ciclo consistente. No próximo, mantenha o que funcionou e aumente apenas um ponto por vez.';

  if (isRecoveryCaution) {
    tone = 'care';
    kicker = 'CICLO CONCLUÍDO · COM CUIDADO';
    title = 'Você avançou respeitando os sinais do corpo.';
    message = 'Sua conquista foi perceber a necessidade de ajustar. Antes de progredir, mantenha ou reduza a carga e converse com o profissional que acompanha você.';
  } else if (adjustCount >= 2) {
    tone = 'care';
    kicker = 'CICLO CONCLUÍDO · NOVA DIREÇÃO';
    title = 'Você descobriu onde seu caminho precisa mudar.';
    message = 'Isso também é progresso. Comece o próximo ciclo menor, mais simples e compatível com o que você registrou.';
  } else if (partialCount > 0 || adjustCount > 0) {
    tone = 'adapt';
    kicker = 'CICLO CONCLUÍDO · BOA CONQUISTA';
    title = 'Você continuou mesmo precisando adaptar.';
    message = 'Regularidade não exige perfeição. Preserve o que foi possível e escolha apenas um ajuste para o próximo ciclo.';
  }

  const header = document.createElement('header');
  const headerCopy = document.createElement('div');
  const label = document.createElement('span');
  const heading = document.createElement('h3');
  const body = document.createElement('p');
  const mark = document.createElement('span');
  summary.dataset.tone = tone;
  label.textContent = kicker;
  heading.id = 'fb-cycle-summary-title';
  heading.textContent = title;
  body.textContent = message;
  mark.className = 'fb-cycle-summary-mark';
  mark.textContent = tone === 'celebrate' ? '✓' : tone === 'adapt' ? '↗' : '!';
  headerCopy.append(label, heading, body);
  header.append(headerCopy, mark);

  const metrics = document.createElement('div');
  metrics.className = 'fb-cycle-metrics';
  [[records.length, 'passos registrados'], [completedCount, 'realizados'], [partialCount + adjustCount, 'adaptados']].forEach(([value, text]) => {
    const item = document.createElement('div');
    const strong = document.createElement('strong');
    const span = document.createElement('span');
    strong.textContent = value;
    span.textContent = text;
    item.append(strong, span);
    metrics.append(item);
  });

  const recap = document.createElement('div');
  const recapTitle = document.createElement('h4');
  const recapList = document.createElement('ol');
  recap.className = 'fb-cycle-recap';
  recapTitle.textContent = 'O que você construiu neste ciclo';
  records.forEach(record => {
    const item = document.createElement('li');
    const strong = document.createElement('strong');
    const span = document.createElement('span');
    strong.textContent = record.step;
    span.textContent = record.note;
    item.append(strong, span);
    recapList.append(item);
  });
  recap.append(recapTitle, recapList);

  const evidence = document.createElement('p');
  evidence.className = 'fb-cycle-evidence';
  evidence.append('Análise educativa baseada em progresso gradual, resposta individual e revisão de carga: ');
  [
    ['OMS', 'https://www.who.int/publications/i/item/9789240014886'],
    ['Diretrizes de Atividade Física', 'https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines/about-physical-activity-guidelines/questions-answers'],
    ['Consenso de retorno ao esporte', 'https://bjsm.bmj.com/content/50/14/853']
  ].forEach(([text, href], index, sources) => {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = text;
    evidence.append(link, index < sources.length - 1 ? ' · ' : '.');
  });

  summary.replaceChildren(header, metrics, recap, evidence);
}

function renderProgress() {
  const list = document.getElementById('fb-progress-steps');
  const checkin = document.getElementById('fb-progress-checkin');
  const checkinHost = document.getElementById('fb-progress-checkin-host');
  const nextMission = document.getElementById('fb-next-mission');
  if (!list) return;
  if (checkin && checkinHost && checkin.parentElement !== checkinHost) checkinHost.append(checkin);
  if (!currentProfile?.objective) {
    if (nextMission) nextMission.hidden = true;
    list.replaceChildren();
    document.getElementById('fb-progress-summary').textContent = 'Crie seu perfil para iniciar sua Jornada da Semana.';
    const safetyStatus = document.getElementById('fb-safety-status');
    if (safetyStatus) { safetyStatus.hidden = true; safetyStatus.replaceChildren(); }
    renderCycleSummary([], 0, []);
    updateProgressActionState();
    return;
  }

  const steps = getJourneySteps();
  const completed = getCompletedSteps();
  const safetyPending = isSafetyPending();
  const safetyRestricted = isSafetyRestricted();
  const savedCheckins = Array.isArray(currentProfile.checkins) ? currentProfile.checkins : [];
  const checkinStatusLabels = { concluida: 'Realizada', parcial: 'Realizada parcialmente', ajustar: 'Caminho ajustado' };
  const percent = completed * 20;
  const safetyStatus = document.getElementById('fb-safety-status');
  if (safetyStatus) {
    safetyStatus.hidden = !safetyPending && !safetyRestricted;
    if (safetyPending || safetyRestricted) {
      const strong = document.createElement('strong');
      const text = document.createElement('span');
      const action = document.createElement('button');
      strong.textContent = safetyPending ? 'Complete a triagem antes de continuar.' : 'Sua segurança vem antes do progresso.';
      text.textContent = safetyPending
        ? 'São três pontos rápidos para adaptar sua jornada e verificar se existe algum sinal que exige orientação profissional.'
        : 'Os sinais informados pedem avaliação profissional antes de iniciar ou retomar exercícios. Sua jornada está preservada e poderá continuar depois da revisão.';
      action.type = 'button';
      action.textContent = safetyPending ? 'Fazer triagem de segurança' : 'Revisar minha triagem';
      action.addEventListener('click', () => openSafetyDialog(currentProfile, true));
      safetyStatus.replaceChildren(strong, text, action);
    } else {
      safetyStatus.replaceChildren();
    }
  }
  document.getElementById('fb-progress-title').textContent = currentProfile.title || 'Seu caminho continua aqui.';
  document.getElementById('fb-progress-summary').textContent = currentProfile.rhythm || 'Avance uma etapa por vez.';
  document.getElementById('fb-progress-percent').textContent = `${percent}%`;
  document.getElementById('fb-progress-bar').style.width = `${percent}%`;
  if (nextMission) {
    const showFirstMission = completed === 1 && !safetyPending && !safetyRestricted;
    nextMission.hidden = !showFirstMission;
    if (showFirstMission) {
      const guidance = getStepGuidance(completed);
      const preferredSport = currentProfile?.preferredSport?.name;
      const needsDiscovery = currentProfile?.objective === 'modalidade' && !preferredSport;
      document.getElementById('fb-next-mission-title').textContent = needsDiscovery
        ? 'Sua primeira missão: descobrir esportes compatíveis'
        : preferredSport && currentProfile?.objective === 'modalidade'
          ? `Sua primeira missão: experimentar ${preferredSport}`
          : `Sua primeira missão: ${steps[completed]}`;
      document.getElementById('fb-next-mission-summary').textContent = needsDiscovery
        ? 'Responda três preferências para comparar modalidades e escolher uma experiência para esta semana.'
        : preferredSport && currentProfile?.objective === 'modalidade'
          ? `Faça uma primeira experiência com ${preferredSport}, observando acesso, acolhimento, diversão e vontade de voltar.`
          : guidance?.task || currentProfile.nextAction || 'Comece no seu ritmo e registre como foi para liberar o próximo passo.';
      document.getElementById('fb-next-mission-action').textContent = needsDiscovery ? 'Descobrir meu esporte agora' : 'Realizar próximo passo agora';
      document.getElementById('fb-next-mission-today').textContent = getDailyLogs().some(item => item.date === localDayKey()) ? 'Atualizar Meu Hoje' : 'Preencher Meu Hoje';
    }
  }
  renderCycleSummary(steps, completed, savedCheckins);

  list.replaceChildren(...steps.map((step, index) => {
    const item = document.createElement('li');
    const content = document.createElement('div');
    const title = document.createElement('strong');
    const detail = document.createElement('small');
    const isComplete = index < completed;
    const isCurrent = index === completed && completed < steps.length;
    const savedCheckin = [...savedCheckins].reverse().find(item => item.step === step);
    item.classList.toggle('complete', isComplete);
    item.classList.toggle('current', isCurrent);
    title.textContent = step;
    detail.textContent = index === 0
      ? 'Definido pelas respostas do seu perfil.'
      : isComplete && savedCheckin
        ? `${checkinStatusLabels[savedCheckin.status] || 'Registrada'}: ${savedCheckin.note}`
      : index === 1 && currentProfile.nextAction
        ? currentProfile.nextAction
        : isComplete ? 'Etapa concluída.' : isCurrent ? 'Este é o seu próximo passo.' : 'Será liberada na sequência da Jornada da Semana.';
    if (isCurrent && index === 1) {
      const cycleNote = getAdaptiveStepNote(index, savedCheckins);
      if (cycleNote) detail.textContent = `${detail.textContent} ${cycleNote}`;
    }
    content.append(title, detail);
    const guidance = isCurrent ? getStepGuidance(index) : null;
    if (guidance) content.append(createCurrentStepGuide(guidance, getAdaptiveStepNote(index, savedCheckins)));
    item.append(content);
    return item;
  }));

  const currentStepItem = list.querySelector('li.current');
  if (currentStepItem && checkin) currentStepItem.append(checkin);

  const completeButton = document.getElementById('fb-complete-step');
  completeButton.textContent = getStepGuidance(completed) ? 'Salvar meu relato e ver o próximo passo' : 'Salvar meu relato e seguir';
  const checkinStep = document.getElementById('fb-checkin-step');
  const checkinTitle = document.getElementById('fb-checkin-title');
  const statusLabel = document.getElementById('fb-checkin-status-label');
  const noteLabel = document.getElementById('fb-checkin-note-label');
  const noteInput = document.getElementById('fb-checkin-note');
  const currentGuidance = completed < steps.length ? getStepGuidance(completed) : null;
  if (checkinStep && completed < steps.length) checkinStep.textContent = steps[completed];
  if (checkinTitle) checkinTitle.textContent = currentGuidance ? 'Agora me conte como foi.' : 'Me conte como foi para seguirmos.';
  if (statusLabel) statusLabel.textContent = currentGuidance ? 'Você conseguiu realizar este passo?' : 'Você conseguiu fazer o passo combinado?';
  if (noteLabel) noteLabel.textContent = currentGuidance?.question || 'O que aconteceu na prática?';
  if (noteInput) noteInput.placeholder = currentGuidance?.placeholder || 'Escreva uma observação curta';
  const newCycleButton = document.getElementById('fb-new-cycle');
  if (newCycleButton) newCycleButton.textContent = completed >= steps.length ? 'Começar meu próximo ciclo' : 'Iniciar novo ciclo';
  updateProgressActionState();
}

const dashboardRecommendationMap = {
  comecar: {
    content: ['Comece pelo que cabe na sua rotina', 'Um começo seguro nasce de uma prática simples, repetível e compatível com sua semana.', 'comecar'],
    tool: ['agua', 'Organize uma referência inicial de hidratação para sua rotina ativa.'],
    professional: ['Profissional de Educação Física', 'Pode avaliar seu ponto de partida e transformar disponibilidade em um plano possível.']
  },
  saude: {
    content: ['Saúde e performance caminham juntas', 'Entenda como movimento, recuperação e constância podem apoiar seu bem-estar.', 'saude'],
    tool: ['cardiaca', 'Conheça uma faixa educativa de intensidade moderada para conversar com um profissional.'],
    professional: ['Profissional de Educação Física', 'Pode adaptar frequência, intensidade e modalidade ao seu momento de saúde.']
  },
  emagrecer: {
    content: ['Constância antes da pressa', 'Veja por que uma rotina sustentável vale mais do que compensações isoladas.', 'saude'],
    tool: ['imc', 'Use o IMC apenas como referência inicial, junto de contexto e acompanhamento adequado.'],
    professional: ['Nutricionista esportivo', 'Pode integrar alimentação, rotina, preferências e prática física sem soluções extremas.']
  },
  performance: {
    content: ['Evolução com método e recuperação', 'Aprenda a ajustar uma variável por vez e acompanhar a resposta do corpo.', 'evoluir'],
    tool: ['pace', 'Registre seu ritmo médio e acompanhe evolução sem transformar um número em julgamento.'],
    professional: ['Treinador ou profissional de Educação Física', 'Pode avaliar técnica, carga e recuperação para planejar uma progressão mensurável.']
  },
  modalidade: {
    content: ['O esporte certo convida você a voltar', 'Compare prazer, acesso, acolhimento e possibilidade de continuidade.', 'comecar'],
    tool: ['calorias', 'Conheça diferenças aproximadas entre atividades sem escolher apenas pelo gasto energético.'],
    professional: ['Profissional de Educação Física', 'Pode apresentar modalidades e adaptar a primeira experiência ao seu nível atual.']
  },
  recuperacao: {
    content: ['Retomar também é uma forma de evoluir', 'Reconstrua confiança e carga de maneira gradual, observando os sinais do corpo.', 'saude'],
    tool: ['cardiaca', 'Use referências de intensidade somente depois de alinhar sua retomada com quem acompanha você.'],
    professional: ['Fisioterapeuta ou médico do esporte', 'É a recomendação prioritária para avaliar sintomas, restrições e critérios seguros de retorno.']
  }
};

const trailRecommendationMap = {
  comecar: ['Minha primeira corrida', 'Uma trilha prática para transformar intenção em uma primeira experiência possível.', 'trail-running'],
  saude: ['Vida mais saudável', 'Organize movimento leve, rotina e observação do bem-estar sem buscar extremos.', 'trail-health'],
  emagrecer: ['Vida mais saudável', 'Construa hábitos que possam ser repetidos e avaliados sem usar exercício como punição.', 'trail-health'],
  performance: ['Performance sustentável', 'Evolua uma variável por vez, acompanhando técnica, carga e recuperação.', 'trail-performance'],
  modalidade: ['Descobrir minha prática', 'Compare modalidades por acesso, prazer, segurança e vontade de voltar.', 'trail-running'],
  recuperacao: ['Performance sustentável', 'Retome com progressão cuidadosa e critérios claros para manter, reduzir ou pausar.', 'trail-performance']
};

function getDashboardRecommendations(profile = currentProfile) {
  const recommendation = dashboardRecommendationMap[profile?.objective] || dashboardRecommendationMap.comecar;
  const availableTime = profile?.availabilityLabel ? ` Considerando ${profile.availabilityLabel.toLocaleLowerCase('pt-BR')} por prática.` : '';
  const discoveredSport = profile?.preferredSport?.name || profile?.sportDiscovery?.results?.[0]?.name;
  const content = [...recommendation.content];
  const professional = [...recommendation.professional];
  if (profile?.objective !== 'recuperacao') {
    professional[0] = 'Bruno Rezende · Personal Trainer';
    professional[1] = 'Atua com treinamento funcional, condicionamento e performance em formatos online e presencial.';
  }
  if (profile?.practice === 'returning') {
    content[0] = 'Volte com consistência, não com pressa';
    content[1] = 'Sua experiência anterior ajuda, mas a carga atual precisa respeitar o momento de retomada.';
    content[2] = 'saude';
  } else if (profile?.practice === 'regular' && profile?.objective !== 'recuperacao') {
    content[0] = 'Evolua uma variável por vez';
    content[1] = 'Use técnica, recuperação e uma medida simples para orientar o próximo ciclo.';
    content[2] = 'evoluir';
  }
  if (profile?.age === '60-mais' && profile?.objective !== 'recuperacao') {
    professional[0] = 'Profissional com experiência em pessoas 60+';
    professional[1] = 'Pode adaptar intensidade, equilíbrio, força e progressão ao seu contexto atual.';
  }
  if (profile?.preferredSport?.id === 'futebol' && profile?.age !== '60-mais') {
    professional[0] = 'Luciano · Personal Soccer';
    professional[1] = 'Atua com técnica individual, fundamentos e desenvolvimento esportivo no futebol presencial.';
  } else if (discoveredSport) {
    professional[1] += ` Sua descoberta atual aponta maior compatibilidade com ${discoveredSport}.`;
  }
  const trail = [...(trailRecommendationMap[profile?.objective] || trailRecommendationMap.comecar)];
  if (profile?.preferredSport?.id === 'futebol') trail.splice(0, 3, 'Futebol com inteligência', 'Use leitura de jogo, técnica e constância para orientar sua evolução.', 'trail-football');
  if (profile?.preferredSport?.id === 'corrida') trail.splice(0, 3, 'Minha primeira corrida', 'Comece ou evolua com ritmo controlado, repetição e recuperação.', 'trail-running');
  return {
    content,
    tool: [recommendation.tool[0], `${recommendation.tool[1]}${availableTime}`],
    professional,
    trail
  };
}

window.falaBemGetRecommendationContext = () => {
  const recommendation = getDashboardRecommendations();
  return {
    contentTitle: recommendation.content[0],
    contentTag: recommendation.content[2],
    professionalTitle: recommendation.professional[0]
  };
};

function formatHistoryDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function renderHistory() {
  const lastVisit = document.getElementById('fb-history-last-visit');
  const tools = document.getElementById('fb-history-tools');
  const contents = document.getElementById('fb-history-content');
  const access = readAccessState();
  const history = Array.isArray(currentProfile?.activityHistory) ? currentProfile.activityHistory : [];
  const toolHistory = history.filter(item => item?.type === 'tool');
  const contentHistory = history.filter(item => item?.type === 'content');
  const latestTool = toolHistory[toolHistory.length - 1];
  const latestContent = contentHistory[contentHistory.length - 1];
  if (lastVisit) lastVisit.textContent = formatHistoryDate(access?.previousAccessAt) || 'Primeiro acesso neste aparelho';
  if (tools) tools.textContent = toolHistory.length
    ? `${toolHistory.length} uso${toolHistory.length > 1 ? 's' : ''} · Última: ${latestTool.label}`
    : 'Nenhuma registrada ainda';
  if (contents) contents.textContent = contentHistory.length
    ? `${contentHistory.length} leitura${contentHistory.length > 1 ? 's' : ''} · Última: ${latestContent.label}`
    : 'Nenhum registrado ainda';
}

function renderDashboardRecommendations() {
  const dashboard = document.getElementById('fb-dashboard-recommendations');
  if (!dashboard) return;
  dashboard.hidden = !currentProfile?.objective;
  if (!currentProfile?.objective) return;
  const recommendation = getDashboardRecommendations();
  const contentTitle = document.getElementById('fb-recommended-content-title');
  const contentSummary = document.getElementById('fb-recommended-content-summary');
  const toolTitle = document.getElementById('fb-recommended-tool-title');
  const toolSummary = document.getElementById('fb-recommended-tool-summary');
  const professionalTitle = document.getElementById('fb-recommended-professional-title');
  const professionalSummary = document.getElementById('fb-recommended-professional-summary');
  const trailTitle = document.getElementById('fb-recommended-trail-title');
  const trailSummary = document.getElementById('fb-recommended-trail-summary');
  contentTitle.textContent = recommendation.content[0];
  contentSummary.textContent = recommendation.content[1];
  toolTitle.textContent = document.querySelector(`[data-tool="${recommendation.tool[0]}"] strong`)?.textContent || 'Ferramenta recomendada';
  toolSummary.textContent = recommendation.tool[1];
  professionalTitle.textContent = recommendation.professional[0];
  professionalSummary.textContent = recommendation.professional[1];
  trailTitle.textContent = recommendation.trail[0];
  trailSummary.textContent = recommendation.trail[1];
  dashboard.dataset.contentTag = recommendation.content[2];
  dashboard.dataset.tool = recommendation.tool[0];
  dashboard.dataset.trail = recommendation.trail[2];
}

function startOfLocalWeek(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getActivityDates(profile = currentProfile) {
  const dates = [profile?.createdAt, profile?.sportDiscovery?.completedAt];
  (profile?.checkins || []).forEach(item => dates.push(item?.completedAt));
  (profile?.cycles || []).forEach(item => {
    dates.push(item?.completedAt);
    (item?.checkins || []).forEach(checkin => dates.push(checkin?.completedAt));
  });
  (profile?.activityHistory || []).forEach(item => dates.push(item?.occurredAt));
  (profile?.dailyLogs || []).forEach(item => dates.push(`${item?.date}T12:00:00`));
  return dates.map(value => new Date(value)).filter(date => !Number.isNaN(date.getTime()));
}

function calculateActivityStreak(profile = currentProfile) {
  const keys = [...new Set(getActivityDates(profile).map(date => localDayKey(date)))].sort().reverse();
  if (!keys.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latest = new Date(`${keys[0]}T00:00:00`);
  const gap = Math.round((today - latest) / 86400000);
  if (gap > 1) return 0;
  let streak = 1;
  let cursor = latest;
  for (let index = 1; index < keys.length; index += 1) {
    const expected = new Date(cursor);
    expected.setDate(expected.getDate() - 1);
    if (keys[index] !== localDayKey(expected)) break;
    streak += 1;
    cursor = expected;
  }
  return streak;
}

function getGamificationState(profile = currentProfile) {
  const history = Array.isArray(profile?.activityHistory) ? profile.activityHistory : [];
  const checkins = Array.isArray(profile?.checkins) ? profile.checkins : [];
  const cycles = Array.isArray(profile?.cycles) ? profile.cycles : [];
  const allCheckins = [...cycles.flatMap(cycle => Array.isArray(cycle?.checkins) ? cycle.checkins : []), ...checkins];
  const stats = profile?.gamificationStats || {};
  const toolCount = Math.max(new Set(history.filter(item => item?.type === 'tool').map(item => item.key)).size, Array.isArray(stats.tools) ? stats.tools.length : 0);
  const contentCount = Math.max(new Set(history.filter(item => item?.type === 'content').map(item => item.key)).size, Array.isArray(stats.contents) ? stats.contents.length : 0);
  const communityCount = Math.max(history.filter(item => item?.type === 'community').length, Number(stats.communityActions || 0));
  const totalCheckins = Math.max(allCheckins.length, Number(stats.completedCheckins || 0));
  const totalCycles = Math.max(cycles.length, Number(stats.completedCycles || 0));
  const dailyLogCount = Array.isArray(profile?.dailyLogs) ? profile.dailyLogs.length : 0;
  const xp = (profile?.name ? 10 : 0) + (profile?.objective ? 40 : 0) + (profile?.safety?.consent ? 20 : 0)
    + totalCheckins * 50 + totalCycles * 100 + toolCount * 25 + contentCount * 20
    + (profile?.sportDiscovery?.completedAt ? 60 : 0) + (profile?.preferredSport ? 30 : 0) + communityCount * 25 + dailyLogCount * 15;
  const level = Math.floor(xp / 250) + 1;
  const levelNames = ['Primeiro passo', 'Em movimento', 'Criando constância', 'Evolução consciente', 'Jornada ativa'];
  const weekStart = startOfLocalWeek();
  const weeklyActions = getActivityDates(profile).filter(date => date >= weekStart).length;
  const medals = [
    ['Primeiro passo', Boolean(profile?.objective)],
    ['Em movimento', totalCheckins >= 2],
    ['Explorador', Boolean(profile?.sportDiscovery?.completedAt)],
    ['Conhecimento aplicado', toolCount >= 3],
    ['Leitor ativo', contentCount >= 3],
    ['Semana registrada', dailyLogCount >= 5],
    ['Ciclo concluído', totalCycles >= 1 || getCompletedSteps() >= 5]
  ];
  return { xp, level, levelName: levelNames[Math.min(level - 1, levelNames.length - 1)], streak: calculateActivityStreak(profile), weeklyActions, medals };
}

function renderGamification() {
  const section = document.getElementById('fb-gamification');
  if (!section) return;
  section.hidden = !currentProfile?.objective;
  if (!currentProfile?.objective) return;
  const game = getGamificationState();
  const levelXp = game.xp % 250;
  const percent = Math.round(levelXp / 250 * 100);
  document.getElementById('fb-game-xp').textContent = String(game.xp);
  document.getElementById('fb-game-xp-next').textContent = `${250 - levelXp} XP para o próximo nível`;
  document.getElementById('fb-game-level').textContent = String(game.level);
  document.getElementById('fb-game-level-name').textContent = game.levelName;
  document.getElementById('fb-game-streak').textContent = `${game.streak} dia${game.streak === 1 ? '' : 's'}`;
  document.getElementById('fb-game-level-progress-label').textContent = `${levelXp} de 250 XP`;
  document.getElementById('fb-game-level-progress-percent').textContent = `${percent}%`;
  document.getElementById('fb-game-level-progress-bar').style.width = `${percent}%`;
  document.getElementById('fb-weekly-challenge-progress').textContent = `${Math.min(3, game.weeklyActions)}/3`;
  const nextAction = currentProfile?.nextAction ? `${currentProfile.nextAction} ` : '';
  document.getElementById('fb-weekly-challenge-summary').textContent = `${nextAction}Some três ações registradas nesta semana, no seu ritmo.`;
  const medalList = document.getElementById('fb-medal-list');
  medalList.replaceChildren(...game.medals.map(([label, unlocked]) => {
    const item = document.createElement('li');
    item.textContent = label;
    item.classList.toggle('locked', !unlocked);
    item.title = unlocked ? 'Medalha conquistada' : 'Ainda não conquistada';
    item.setAttribute('aria-label', `${label}: ${unlocked ? 'conquistada' : 'a conquistar'}`);
    return item;
  }));
}

function formatDailyDate(value, options = { weekday: 'short', day: '2-digit', month: 'short' }) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', options).format(date);
}

function getDailyLogs() {
  return Array.isArray(currentProfile?.dailyLogs) ? currentProfile.dailyLogs : [];
}

function fillDailyForm(log = null) {
  const form = document.getElementById('fb-daily-form');
  if (!form) return;
  const date = log?.date || form.elements.date.value || localDayKey();
  form.reset();
  form.elements.date.value = date;
  form.elements.activity.value = log?.activity || 'none';
  form.elements.minutes.value = String(log?.minutes || 0);
  form.elements.intensity.value = log?.intensity || '';
  form.elements.water.value = log?.water ?? '';
  form.elements.sleep.value = log?.sleep ?? '';
  form.elements.feeling.value = log?.feeling || '';
  form.elements.breakfast.value = log?.meals?.breakfast || '';
  form.elements.lunch.value = log?.meals?.lunch || '';
  form.elements.snacks.value = log?.meals?.snacks || '';
  form.elements.dinner.value = log?.meals?.dinner || '';
  form.elements.note.value = log?.note || '';
  const deleteButton = document.getElementById('fb-delete-daily-log');
  if (deleteButton) deleteButton.hidden = !log;
}

function dailyNextStep(log) {
  if (!log) return 'Próximo passo: conte como foi seu dia.';
  if (log.activity === 'none') return 'Próximo passo: amanhã pode ser um novo começo, sem precisar compensar hoje.';
  if (log.sleep === null) return 'Próximo passo: registre também seu sono para observar a relação com sua disposição.';
  if (log.water === null) return 'Próximo passo: registre também sua hidratação para completar a visão do dia.';
  if (!Object.values(log.meals || {}).some(Boolean)) return 'Próximo passo: anote ao menos uma refeição para completar o contexto do dia.';
  return 'Próximo passo: volte amanhã e observe o que ajuda sua constância.';
}

function renderDailyJournal() {
  const section = document.getElementById('fb-daily-journal');
  const form = document.getElementById('fb-daily-form');
  if (!section || !form) return;
  section.hidden = !currentProfile?.objective;
  if (!currentProfile?.objective) return;
  const today = localDayKey();
  form.elements.date.max = today;
  if (!form.elements.date.value) form.elements.date.value = today;
  const logs = getDailyLogs().slice().sort((a, b) => a.date.localeCompare(b.date));
  const todayLog = logs.find(item => item.date === today);
  const dailyTrigger = document.getElementById('fb-open-daily-form');
  if (dailyTrigger && dailyTrigger.getAttribute('aria-expanded') !== 'true') dailyTrigger.textContent = todayLog ? 'Atualizar meu dia' : 'Registrar meu dia';
  const summaryTitle = document.getElementById('fb-daily-summary-title');
  const summaryText = document.getElementById('fb-daily-summary-text');
  if (todayLog) {
    const mealCount = Object.values(todayLog.meals || {}).filter(Boolean).length;
    summaryTitle.textContent = todayLog.activity === 'none' ? 'Dia de pausa registrado.' : `${dailyActivityLabels[todayLog.activity]} · ${todayLog.minutes} min`;
    const details = [
      mealCount ? `${mealCount} refeição${mealCount === 1 ? '' : 'ões'}` : 'refeições não informadas',
      todayLog.water !== null ? `${String(todayLog.water).replace('.', ',')} L de água` : 'água não informada',
      todayLog.sleep !== null ? `${String(todayLog.sleep).replace('.', ',')} h de sono` : 'sono não informado'
    ];
    summaryText.textContent = details.join(' · ');
  } else {
    summaryTitle.textContent = 'Seu dia ainda está em aberto.';
    summaryText.textContent = 'Faça um registro rápido para visualizar atividade, alimentação, hidratação e descanso.';
  }
  document.getElementById('fb-daily-next-step').textContent = dailyNextStep(todayLog);

  const weekStart = startOfLocalWeek();
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekLogs = logs.filter(item => { const date = new Date(`${item.date}T12:00:00`); return date >= weekStart && date < weekEnd; });
  const activeLogs = weekLogs.filter(item => item.activity !== 'none' && item.minutes > 0);
  const totalMinutes = activeLogs.reduce((total, item) => total + item.minutes, 0);
  const waterValues = weekLogs.map(item => item.water).filter(value => value !== null);
  const sleepValues = weekLogs.map(item => item.sleep).filter(value => value !== null);
  const average = values => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
  const averageWater = average(waterValues); const averageSleep = average(sleepValues);
  document.getElementById('fb-week-days').textContent = `${weekLogs.length}/7`;
  document.getElementById('fb-week-minutes').textContent = `${totalMinutes} min`;
  document.getElementById('fb-week-water').textContent = averageWater === null ? '—' : `${averageWater.toFixed(1).replace('.', ',')} L/dia`;
  document.getElementById('fb-week-sleep').textContent = averageSleep === null ? '—' : `${averageSleep.toFixed(1).replace('.', ',')} h/dia`;
  document.getElementById('fb-week-summary-title').textContent = weekLogs.length
    ? `${weekLogs.length} dia${weekLogs.length === 1 ? '' : 's'} registrado${weekLogs.length === 1 ? '' : 's'} nesta semana.`
    : 'Sua semana começa com o primeiro registro.';
  document.getElementById('fb-week-summary-text').textContent = activeLogs.length
    ? `Você se movimentou em ${activeLogs.length} dia${activeLogs.length === 1 ? '' : 's'}. Continue observando sua rotina, sem buscar perfeição.`
    : weekLogs.length ? 'Você registrou sua rotina. Dias de pausa também ajudam a entender sua semana.' : 'Os indicadores serão atualizados a cada registro.';

  const historyList = document.getElementById('fb-daily-history-list');
  const recentLogs = logs.slice(-7).reverse();
  if (!recentLogs.length) {
    historyList.innerHTML = '<li class="fb-daily-history-empty">Nenhum dia registrado ainda.</li>';
  } else {
    historyList.replaceChildren(...recentLogs.map(log => {
      const item = document.createElement('li');
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      const detail = document.createElement('span');
      const edit = document.createElement('button');
      title.textContent = formatDailyDate(log.date);
      detail.textContent = log.activity === 'none' ? 'Dia sem treino' : `${dailyActivityLabels[log.activity]} · ${log.minutes} min${log.intensity ? ` · ${log.intensity}` : ''}`;
      edit.type = 'button'; edit.textContent = 'Ver ou editar'; edit.dataset.dailyEdit = log.date;
      copy.append(title, detail); item.append(copy, edit); return item;
    }));
  }
}

function renderTrails() {
  const completed = currentProfile?.objective ? getCompletedSteps() : 0;
  const percent = completed * 20;
  document.querySelectorAll('[data-trail-objectives]').forEach(card => {
    let matches = String(card.dataset.trailObjectives || '').split(',').includes(currentProfile?.objective || '');
    if (currentProfile?.objective === 'modalidade') {
      const sportTrail = { corrida: 'trail-running', futebol: 'trail-football' }[currentProfile?.preferredSport?.id];
      matches = Boolean(sportTrail && card.classList.contains(sportTrail));
    }
    const trailPercent = matches ? percent : 0;
    const status = card.querySelector(':scope > span');
    const detail = card.querySelector(':scope > small');
    const bar = card.querySelector('.trail-progress i');
    const button = card.querySelector('button');
    if (bar) bar.style.width = `${trailPercent}%`;
    if (status) status.textContent = trailPercent >= 100 ? 'CONCLUÍDA' : trailPercent > 0 ? 'CONTINUAR' : 'COMEÇAR';
    if (detail) detail.textContent = matches ? `${trailPercent}% da trilha` : detail.dataset.defaultText || (detail.dataset.defaultText = detail.textContent);
    if (button) button.textContent = trailPercent >= 100 ? 'Rever trilha' : trailPercent > 0 ? 'Continuar trilha' : 'Começar trilha';
    card.dataset.state = trailPercent >= 100 ? 'complete' : trailPercent > 0 ? 'active' : 'new';
  });
}

const sportCatalog = [
  { id: 'corrida', name: 'Corrida ou caminhada', environment: 'outdoor', social: 'individual', intensity: ['light', 'moderate', 'vigorous'], short: true, reason: 'É acessível, flexível e permite controlar tempo e intensidade.' },
  { id: 'futebol', name: 'Futebol', environment: 'outdoor', social: 'team', intensity: ['moderate', 'vigorous'], short: false, reason: 'Combina convivência, tomada de decisão e esforço variado.' },
  { id: 'basquete', name: 'Basquete', environment: 'indoor', social: 'team', intensity: ['moderate', 'vigorous'], short: true, reason: 'Reúne habilidade, equipe e sessões que podem ser adaptadas.' },
  { id: 'bike', name: 'Ciclismo', environment: 'outdoor', social: 'individual', intensity: ['light', 'moderate', 'vigorous'], short: false, reason: 'Permite explorar percursos e ajustar o esforço ao condicionamento.' },
  { id: 'natacao', name: 'Natação', environment: 'water', social: 'individual', intensity: ['light', 'moderate', 'vigorous'], short: false, reason: 'Trabalha o corpo inteiro com baixo impacto articular.' },
  { id: 'musculacao', name: 'Treinamento de força', environment: 'indoor', social: 'individual', intensity: ['light', 'moderate', 'vigorous'], short: true, reason: 'Facilita progressão mensurável e adaptação a diferentes objetivos.' }
];

function calculateSportCompatibility(preferences, profile = currentProfile) {
  return sportCatalog.map(sport => {
    let score = 42;
    score += preferences.environment === 'any' ? 8 : preferences.environment === sport.environment ? 18 : 0;
    score += preferences.social === 'any' ? 7 : preferences.social === sport.social ? 15 : 0;
    score += sport.intensity.includes(preferences.intensity) ? 15 : 0;
    if (profile?.availability === '15' && sport.short) score += 7;
    if (profile?.age === 'ate-17' && sport.social === 'team') score += 5;
    if (profile?.age === '60-mais' && sport.intensity.includes('light')) score += 7;
    if (profile?.objective === 'performance' && sport.intensity.includes('vigorous')) score += 5;
    if (profile?.objective === 'saude' && sport.intensity.includes('moderate')) score += 5;
    if (profile?.objective === 'recuperacao' && sport.intensity.includes('light')) score += 5;
    return { ...sport, compatibility: Math.min(96, score) };
  }).sort((a, b) => b.compatibility - a.compatibility).slice(0, 3);
}

function renderSportDiscovery() {
  const form = document.getElementById('fb-sport-finder');
  const container = document.getElementById('fb-sport-result');
  const discovery = currentProfile?.sportDiscovery;
  if (!form || !container) return;
  if (!discovery?.results?.length) {
    container.hidden = true;
    container.replaceChildren();
    if (!currentProfile) form.reset();
    return;
  }
  ['environment', 'social', 'intensity'].forEach(field => {
    if (form.elements[field] && discovery.preferences?.[field]) form.elements[field].value = discovery.preferences[field];
  });
  const heading = document.createElement('h3');
  const intro = document.createElement('p');
  const list = document.createElement('ol');
  heading.textContent = 'Esportes com maior compatibilidade agora';
  intro.textContent = 'O resultado é um ponto de partida educativo. Experimente, observe como você se sente e ajuste com orientação quando necessário.';
  discovery.results.forEach(result => {
    const item = document.createElement('li');
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    const reason = document.createElement('span');
    const score = document.createElement('b');
    const action = document.createElement('button');
    const selected = currentProfile?.preferredSport?.id === result.id;
    title.textContent = result.name;
    reason.textContent = result.reason;
    score.textContent = `${result.compatibility}% compatível`;
    action.type = 'button';
    action.textContent = selected ? 'Escolhido para minha semana' : 'Escolher para minha semana';
    action.setAttribute('aria-pressed', String(selected));
    action.addEventListener('click', () => {
      const nextAction = currentProfile?.objective === 'modalidade'
        ? `Experimente ${result.name} nesta semana e registre sua vontade de voltar.`
        : currentProfile?.nextAction;
      saveProfile({
        preferredSport: { id: result.id, name: result.name, compatibility: result.compatibility, selectedAt: new Date().toISOString() },
        nextAction
      });
      if (currentProfile?.objective) {
        openView(currentProfile.objective === 'modalidade' ? 'progresso' : 'inicio');
      } else {
        openView('jornada');
        window.setTimeout(() => {
          document.querySelector('[data-journey-field="objective"][data-journey-value="modalidade"]')?.click();
        }, 180);
      }
      const feedback = document.getElementById('fb-progress-feedback');
      if (feedback && currentProfile?.objective === 'modalidade') feedback.textContent = `${result.name} foi incluído na sua Jornada da Semana.`;
    });
    copy.append(title, reason);
    item.append(copy, score, action);
    list.append(item);
  });
  container.replaceChildren(heading, intro, list);
  container.hidden = false;
}

function renderPersonalizedExperience() {
  const kicker = document.getElementById('fb-today-kicker');
  const title = document.getElementById('fb-today-title');
  const summary = document.getElementById('fb-today-summary');
  const progress = document.getElementById('fb-today-progress');
  const primary = document.getElementById('fb-today-primary');
  const avatar = shell.querySelector('.fb-app-avatar');
  const profileTriggerLabel = shell.querySelector('.fb-profile-trigger>span:last-child');
  const nameInput = document.getElementById('fb-profile-name');
  const journeyNameInput = document.getElementById('journey-name');
  const pathEntry = document.getElementById('fb-path-entry');
  const todayCard = document.getElementById('fb-today-card');
  const appTitle = document.getElementById('fb-app-title');
  const appSubtitle = document.getElementById('fb-app-subtitle');
  const heroAction = document.getElementById('fb-hero-action');
  const heroStatus = document.getElementById('fb-hero-status');
  const heroProgress = document.getElementById('fb-hero-progress');
  const heroProgressValue = document.getElementById('fb-hero-progress-value');

  if (!currentProfile?.objective) {
    const displayName = currentProfile?.name?.trim();
    pathEntry.hidden = false;
    todayCard.hidden = true;
    appTitle.textContent = displayName ? `${displayName}, vamos encontrar seu caminho no esporte.` : 'Existe um jeito de viver o esporte que combina com você.';
    appSubtitle.textContent = 'Encontre seu ponto de partida e construa uma jornada possível.';
    kicker.textContent = 'SEU PRIMEIRO PASSO';
    title.textContent = 'Crie seu perfil esportivo.';
    summary.textContent = 'Perfil rápido · dados salvos neste aparelho';
    progress.hidden = true;
    primary.textContent = 'Criar meu caminho';
    primary.dataset.fbView = 'jornada';
    if (heroAction) {
      heroAction.textContent = 'Montar meu caminho';
      heroAction.dataset.fbView = 'jornada';
    }
    if (heroStatus) heroStatus.textContent = 'Comece de onde você está.';
    if (heroProgress) heroProgress.style.setProperty('--fb-hero-progress', '0%');
    if (heroProgressValue) heroProgressValue.textContent = '0%';
    if (avatar) avatar.textContent = displayName ? displayName.charAt(0).toLocaleUpperCase('pt-BR') : 'BE';
  } else {
    const completed = getCompletedSteps();
    const steps = getJourneySteps();
    const percent = completed * 20;
    const displayName = currentProfile.name?.trim();
    pathEntry.hidden = true;
    todayCard.hidden = false;
    appTitle.textContent = displayName ? `Olá, ${displayName}.` : 'Sua semana continua em movimento.';
    appSubtitle.textContent = 'Um próximo passo de cada vez, no seu ritmo.';
    kicker.textContent = displayName ? `OLÁ, ${displayName.toLocaleUpperCase('pt-BR')}` : 'MEU HOJE';
    title.textContent = objectiveLabels[currentProfile.objective] || 'Seu caminho está pronto.';
    summary.textContent = completed >= steps.length ? 'Ciclo concluído.' : 'Seu próximo passo já está disponível.';
    progress.hidden = false;
    document.getElementById('fb-today-progress-label').textContent = `${percent}%`;
    document.getElementById('fb-today-progress-bar').style.width = `${percent}%`;
    document.getElementById('fb-today-next-action').textContent = completed >= steps.length
      ? 'Ciclo concluído. Você pode iniciar uma nova sequência.'
      : `Próxima missão: ${steps[completed]}`;
    primary.textContent = completed >= steps.length ? 'Ver semana concluída' : 'Continuar Jornada da Semana';
    primary.dataset.fbView = 'progresso';
    if (heroAction) {
      heroAction.textContent = completed >= steps.length ? 'Rever semana concluída' : 'Continuar Jornada da Semana';
      heroAction.dataset.fbView = 'progresso';
    }
    if (heroStatus) heroStatus.textContent = completed >= steps.length ? 'Ciclo concluído. Celebre sua evolução.' : `Próximo: ${steps[completed]}`;
    if (heroProgress) heroProgress.style.setProperty('--fb-hero-progress', `${percent}%`);
    if (heroProgressValue) heroProgressValue.textContent = `${percent}%`;
    if (avatar) avatar.textContent = displayName ? displayName.charAt(0).toLocaleUpperCase('pt-BR') : 'BE';
  }

  if (nameInput && document.activeElement !== nameInput) nameInput.value = currentProfile?.name || '';
  if (profileTriggerLabel) profileTriggerLabel.textContent = currentProfile?.name?.trim() || 'Meu perfil';
  if (journeyNameInput && document.activeElement !== journeyNameInput && currentProfile?.name && !journeyNameInput.value) {
    journeyNameInput.value = currentProfile.name;
    journeyNameInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  renderProfileSummary();
  renderProgress();
  renderDashboardRecommendations();
  renderGamification();
  renderDailyJournal();
  renderHistory();
  renderTrails();
  renderSportDiscovery();
}

window.addEventListener('meuCaminhoBe:profile-updated', event => {
  const details = event.detail || {};
  const normalizedDetails = { ...details, name: details.name || currentProfile?.name || '' };
  if (!safetyScreeningIsCurrent(currentProfile, normalizedDetails)) {
    openSafetyDialog(normalizedDetails);
    return;
  }
  const sameObjective = currentProfile?.objective === normalizedDetails.objective;
  saveProfile({ ...normalizedDetails, progress: sameObjective ? getCompletedSteps() : 1, checkins: sameObjective ? (currentProfile?.checkins || []) : [] });
});

window.addEventListener('meuCaminhoBe:identity-captured', event => {
  const name = String(event.detail?.name || '').trim().slice(0, 40);
  if (name.length < 2) return;
  saveProfile({ name, identityCreatedAt: currentProfile?.identityCreatedAt || new Date().toISOString() });
  registerFirstIdentityAccess();
});

window.addEventListener('meuCaminhoBe:activity', event => {
  const detail = event.detail || {};
  if (!['tool', 'content', 'community'].includes(detail.type) || !String(detail.label || '').trim()) return;
  const activityHistory = [...(currentProfile?.activityHistory || []), {
    type: detail.type,
    key: String(detail.key || '').slice(0, 80),
    label: String(detail.label).trim().slice(0, 120),
    result: String(detail.result || '').trim().slice(0, 160),
    occurredAt: new Date().toISOString()
  }].slice(-40);
  const previousStats = currentProfile?.gamificationStats || {};
  const knownTools = [...new Set((currentProfile?.activityHistory || []).filter(item => item?.type === 'tool').map(item => String(item.key || '').slice(0, 80)))];
  const knownContents = [...new Set((currentProfile?.activityHistory || []).filter(item => item?.type === 'content').map(item => String(item.key || '').slice(0, 80)))];
  const knownCommunityActions = (currentProfile?.activityHistory || []).filter(item => item?.type === 'community').length;
  const gamificationStats = {
    ...previousStats,
    tools: [...new Set([...(previousStats.tools || []), ...knownTools, ...(detail.type === 'tool' ? [String(detail.key || '').slice(0, 80)] : [])])],
    contents: [...new Set([...(previousStats.contents || []), ...knownContents, ...(detail.type === 'content' ? [String(detail.key || '').slice(0, 80)] : [])])],
    communityActions: Math.max(Number(previousStats.communityActions || 0), knownCommunityActions) + (detail.type === 'community' ? 1 : 0)
  };
  saveProfile({ activityHistory, gamificationStats });
});

document.querySelectorAll('[data-dashboard-action]').forEach(button => {
  button.addEventListener('click', () => {
    const dashboard = document.getElementById('fb-dashboard-recommendations');
    if (button.dataset.dashboardAction === 'conteudo') {
      openView('conteudos');
      const tag = dashboard?.dataset.contentTag || '';
      const target = [...document.querySelectorAll('.article-grid .post')].find(post => String(post.dataset.tags || '').includes(tag));
      const toggle = target?.querySelector('.read-toggle');
      const fullText = target?.querySelector('.full-text');
      if (toggle && fullText && getComputedStyle(fullText).display === 'none') toggle.click();
      window.setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 280);
      return;
    }
    if (button.dataset.dashboardAction === 'ferramenta') {
      openView('ferramentas');
      const tool = dashboard?.dataset.tool;
      window.setTimeout(() => document.querySelector(`[data-tool="${tool}"]`)?.click(), 180);
      return;
    }
    if (button.dataset.dashboardAction === 'trilha') {
      openView('trilhas');
      const trail = dashboard?.dataset.trail;
      window.setTimeout(() => document.querySelector(`.${trail}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 220);
      return;
    }
    openView('especialistas');
  });
});

document.getElementById('fb-sport-finder')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const preferences = Object.fromEntries(new FormData(form));
  const results = calculateSportCompatibility(preferences);
  saveProfile({ sportDiscovery: { preferences, results, completedAt: new Date().toISOString() }, preferredSport: null });
  document.getElementById('fb-sport-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.getElementById('fb-next-mission-action')?.addEventListener('click', () => {
  if (currentProfile?.objective === 'modalidade' && !currentProfile?.preferredSport) {
    openView('modalidades');
    window.setTimeout(() => document.getElementById('fb-sport-finder')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 220);
    return;
  }
  const mission = document.querySelector('#fb-progress-steps li.current');
  mission?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => mission?.querySelector('select, input, button')?.focus(), 320);
});

document.getElementById('fb-next-mission-today')?.addEventListener('click', () => openDailyJournal());

document.getElementById('fb-profile-next-professionals')?.addEventListener('click', () => openView('especialistas'));

document.getElementById('fb-progress-checkin')?.addEventListener('submit', event => {
  event.preventDefault();
  if (!currentProfile?.objective) {
    openView('jornada');
    return;
  }
  const completed = getCompletedSteps();
  const steps = getJourneySteps();
  const status = document.getElementById('fb-checkin-status');
  const note = document.getElementById('fb-checkin-note');
  const form = document.getElementById('fb-progress-checkin');
  if (!form?.checkValidity() || !status?.value || (note?.value.trim().length || 0) < 3) {
    document.getElementById('fb-progress-feedback').textContent = 'Preencha os dois pontos importantes antes de concluir esta etapa.';
    form?.reportValidity();
    (!status?.value ? status : note)?.focus();
    updateProgressActionState();
    return;
  }
  const nextProgress = completed + 1;
  const nextStep = steps[nextProgress];
  const checkins = [...(currentProfile.checkins || []), {
    step: steps[completed],
    status: status.value,
    note: note.value.trim(),
    completedAt: new Date().toISOString()
  }];
  if (status) status.value = '';
  if (note) note.value = '';
  const archivedCheckinCount = (currentProfile?.cycles || []).reduce((total, cycle) => total + (Array.isArray(cycle?.checkins) ? cycle.checkins.length : 0), 0);
  const previousCheckinTotal = Math.max(Number(currentProfile?.gamificationStats?.completedCheckins || 0), archivedCheckinCount + (currentProfile?.checkins || []).length);
  saveProfile({ progress: nextProgress, checkins, gamificationStats: { ...(currentProfile?.gamificationStats || {}), completedCheckins: previousCheckinTotal + 1 } });
  const feedbackName = currentProfile?.name ? `${currentProfile.name}, ` : '';
  document.getElementById('fb-progress-feedback').textContent = nextStep
    ? `${feedbackName}obrigado por contar como foi. Registrei sua experiência e preparei o próximo passo: ${nextStep}.`
    : `${feedbackName}você concluiu este ciclo. Sua experiência está registrada e já pode orientar sua próxima escolha.`;
});

document.getElementById('fb-new-cycle')?.addEventListener('click', () => {
  const records = Array.isArray(currentProfile?.checkins) ? currentProfile.checkins : [];
  const adjustCount = records.filter(item => item?.status === 'ajustar').length;
  const partialCount = records.filter(item => item?.status === 'parcial').length;
  const archive = {
    objective: currentProfile?.objective,
    startedAt: records[0]?.completedAt || currentProfile?.updatedAt,
    completedAt: new Date().toISOString(),
    checkins: records
  };
  const cycles = [...(Array.isArray(currentProfile?.cycles) ? currentProfile.cycles : []), archive].slice(-6);
  const cycleAdjustment = adjustCount >= 2 ? 'reduce' : (adjustCount || partialCount ? 'maintain' : 'progress');
  const previousCycleTotal = Math.max(Number(currentProfile?.gamificationStats?.completedCycles || 0), (currentProfile?.cycles || []).length);
  saveProfile({ progress: 1, checkins: [], cycles, cycleAdjustment, gamificationStats: { ...(currentProfile?.gamificationStats || {}), completedCycles: previousCycleTotal + 1 } });
  document.getElementById('fb-progress-feedback').textContent = cycleAdjustment === 'reduce'
    ? 'Novo ciclo iniciado com uma versão menor e mais segura do caminho anterior.'
    : cycleAdjustment === 'maintain'
      ? 'Novo ciclo iniciado mantendo o que foi possível no ciclo anterior.'
      : 'Novo ciclo iniciado. Você poderá evoluir uma variável por vez.';
});

document.getElementById('fb-calendar-next')?.addEventListener('click', () => {
  const feedback = document.getElementById('fb-progress-feedback');
  if (!currentProfile?.objective || isSafetyRestricted() || isSafetyPending()) {
    if (feedback) feedback.textContent = currentProfile?.objective ? 'Conclua ou revise a triagem de segurança antes de agendar uma prática.' : 'Crie seu caminho antes de adicionar um lembrete.';
    return;
  }
  const completed = getCompletedSteps();
  const steps = getJourneySteps();
  const step = steps[Math.min(completed, steps.length - 1)];
  const guidance = getStepGuidance(Math.min(completed, steps.length - 1));
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  const formatIcsDate = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escapeIcs = value => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const description = guidance?.task || currentProfile.nextAction || 'Reserve um momento possível para continuar sua jornada.';
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//BeMEsportivo//Meu Caminho Be//PT-BR','BEGIN:VEVENT',`UID:${Date.now()}@bemesportivo.com`,`DTSTAMP:${formatIcsDate(new Date())}`,`DTSTART:${formatIcsDate(start)}`,`DTEND:${formatIcsDate(end)}`,`SUMMARY:${escapeIcs(`Jornada da Semana: ${step}`)}`,`DESCRIPTION:${escapeIcs(description)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'meu-proximo-passo.ics';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (feedback) feedback.textContent = 'Lembrete criado para daqui a dois dias, às 18h. Você pode ajustar o horário no seu calendário.';
});

document.getElementById('fb-checkin-status')?.addEventListener('change', updateProgressActionState);
document.getElementById('fb-checkin-note')?.addEventListener('input', updateProgressActionState);

document.getElementById('fb-profile-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const name = document.getElementById('fb-profile-name').value.trim();
  saveProfile({ name });
  if (name) registerFirstIdentityAccess();
  document.getElementById('fb-profile-feedback').textContent = name
    ? `Perfil salvo, ${name}.` : 'Perfil salvo neste navegador.';
});

function setDailyFormVisibility(open) {
  const wrap = document.getElementById('fb-daily-form-wrap');
  const trigger = document.getElementById('fb-open-daily-form');
  if (!wrap || !trigger) return;
  wrap.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
  const hasTodayLog = getDailyLogs().some(item => item.date === localDayKey());
  trigger.textContent = open ? 'Registro aberto' : hasTodayLog ? 'Atualizar meu dia' : 'Registrar meu dia';
  if (open) window.setTimeout(() => document.getElementById('fb-daily-date')?.focus(), 50);
}

function openDailyJournal() {
  openView('inicio');
  const todayLog = getDailyLogs().find(item => item.date === localDayKey()) || null;
  fillDailyForm(todayLog);
  setDailyFormVisibility(true);
  window.setTimeout(() => document.getElementById('fb-daily-journal')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 220);
}

document.getElementById('fb-open-daily-form')?.addEventListener('click', () => {
  const wrap = document.getElementById('fb-daily-form-wrap');
  const todayLog = getDailyLogs().find(item => item.date === localDayKey()) || null;
  fillDailyForm(todayLog);
  setDailyFormVisibility(Boolean(wrap?.hidden));
});
document.getElementById('fb-daily-view-mission')?.addEventListener('click', () => openView('progresso'));
document.getElementById('fb-close-daily-form')?.addEventListener('click', () => setDailyFormVisibility(false));
document.getElementById('fb-daily-date')?.addEventListener('change', event => {
  const log = getDailyLogs().find(item => item.date === event.currentTarget.value) || null;
  fillDailyForm(log || { date: event.currentTarget.value });
});
document.getElementById('fb-daily-activity')?.addEventListener('change', event => {
  const minutes = document.getElementById('fb-daily-minutes');
  if (event.currentTarget.value === 'none') minutes.value = '0';
});
document.getElementById('fb-daily-history-list')?.addEventListener('click', event => {
  const button = event.target.closest('[data-daily-edit]');
  if (!button) return;
  const log = getDailyLogs().find(item => item.date === button.dataset.dailyEdit);
  if (!log) return;
  fillDailyForm(log); setDailyFormVisibility(true);
  document.getElementById('fb-daily-form-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('fb-daily-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const activity = String(data.get('activity') || 'none');
  const minutes = Number(data.get('minutes') || 0);
  const feedback = document.getElementById('fb-daily-feedback');
  if (activity !== 'none' && minutes < 1) {
    feedback.textContent = 'Informe quanto tempo durou sua atividade.';
    form.elements.minutes.focus(); return;
  }
  const log = sanitizeDailyLog({
    date: data.get('date'), activity, minutes, intensity: data.get('intensity'), water: data.get('water'),
    sleep: data.get('sleep'), feeling: data.get('feeling'), note: data.get('note'),
    meals: { breakfast: data.get('breakfast'), lunch: data.get('lunch'), snacks: data.get('snacks'), dinner: data.get('dinner') },
    updatedAt: new Date().toISOString()
  });
  if (!log || log.date > localDayKey()) { feedback.textContent = 'Escolha uma data válida, sem usar dias futuros.'; return; }
  const dailyLogs = [...getDailyLogs().filter(item => item.date !== log.date), log].sort((a, b) => a.date.localeCompare(b.date)).slice(-180);
  saveProfile({ dailyLogs });
  fillDailyForm(log);
  feedback.textContent = `${formatDailyDate(log.date, { day: '2-digit', month: 'long' })} foi salvo. Seus resumos já foram atualizados.`;
});
document.getElementById('fb-delete-daily-log')?.addEventListener('click', () => {
  const date = document.getElementById('fb-daily-date')?.value;
  if (!date || !getDailyLogs().some(item => item.date === date)) return;
  if (!window.confirm(`Excluir o registro de ${formatDailyDate(date, { day: '2-digit', month: 'long' })}?`)) return;
  saveProfile({ dailyLogs: getDailyLogs().filter(item => item.date !== date) });
  fillDailyForm({ date });
  document.getElementById('fb-daily-feedback').textContent = 'Registro excluído deste aparelho.';
});

document.getElementById('fb-export-profile')?.addEventListener('click', () => {
  if (!currentProfile) {
    document.getElementById('fb-profile-feedback').textContent = 'Ainda não há um perfil para exportar.';
    return;
  }
  const payload = JSON.stringify({ schemaVersion: 5, exportedAt: new Date().toISOString(), profile: currentProfile }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = String(currentProfile.name || 'meu-caminho').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  link.href = url;
  link.download = `${safeName || 'meu-caminho'}-backup.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.getElementById('fb-profile-feedback').textContent = 'Cópia dos seus dados criada. Guarde o arquivo em local seguro.';
});

document.getElementById('fb-import-profile')?.addEventListener('change', async event => {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw new Error('too-large');
    const parsed = JSON.parse(await file.text());
    const profile = parsed?.profile;
    const allowedObjectives = Object.keys(journeyStepTemplates);
    if (!profile || typeof profile !== 'object' || !allowedObjectives.includes(profile.objective) || typeof profile.name !== 'string') throw new Error('invalid');
    const sanitized = {
      ...profile,
      schemaVersion: 5,
      createdAt: profile.createdAt || new Date().toISOString(),
      name: profile.name.trim().slice(0, 40),
      checkins: Array.isArray(profile.checkins) ? profile.checkins.slice(-10) : [],
      cycles: Array.isArray(profile.cycles) ? profile.cycles.slice(-6) : [],
      dailyLogs: Array.isArray(profile.dailyLogs) ? profile.dailyLogs.map(sanitizeDailyLog).filter(Boolean).slice(-180) : [],
      activityHistory: Array.isArray(profile.activityHistory) ? profile.activityHistory.slice(-40) : [],
      gamificationStats: profile.gamificationStats && typeof profile.gamificationStats === 'object' ? {
        completedCheckins: Math.max(0, Number(profile.gamificationStats.completedCheckins || 0)),
        completedCycles: Math.max(0, Number(profile.gamificationStats.completedCycles || 0)),
        communityActions: Math.max(0, Number(profile.gamificationStats.communityActions || 0)),
        tools: Array.isArray(profile.gamificationStats.tools) ? profile.gamificationStats.tools.slice(-20).map(value => String(value).slice(0, 80)) : [],
        contents: Array.isArray(profile.gamificationStats.contents) ? profile.gamificationStats.contents.slice(-40).map(value => String(value).slice(0, 80)) : []
      } : {},
      sportDiscovery: profile.sportDiscovery && typeof profile.sportDiscovery === 'object' ? profile.sportDiscovery : undefined
    };
    currentProfile = sanitized;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(sanitized));
    renderPersonalizedExperience();
    document.getElementById('fb-profile-feedback').textContent = 'Backup restaurado neste aparelho.';
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:edit-onboarding', { detail: { ...sanitized } }));
  } catch (error) {
    document.getElementById('fb-profile-feedback').textContent = 'Não foi possível importar. Escolha um backup válido do Meu Caminho Be.';
  } finally {
    input.value = '';
  }
});

answerForm?.addEventListener('submit', event => {
  event.preventDefault();
  answerQuestion(answerInput.value).catch(() => {
    answerStatus.textContent = 'A busca externa está indisponível no momento. Tente novamente mais tarde.';
  });
});

document.querySelectorAll('[data-fb-question]').forEach(button => {
  button.addEventListener('click', () => {
    answerInput.value = button.dataset.fbQuestion;
    answerForm.requestSubmit();
  });
});

document.querySelectorAll('[data-fb-start-objective]').forEach(button => {
  button.addEventListener('click', () => {
    openView('jornada');
    const option = document.querySelector(`[data-journey-field="objective"][data-journey-value="${button.dataset.fbStartObjective}"]`);
    window.setTimeout(() => {
      option?.click();
      document.getElementById('journey-assistant')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
  });
});

const practicalTips = {
  correr: { kicker: 'COMEÇAR A CORRER', title: 'Alterne caminhada e corrida para construir sua base.', intro: 'O começo deve parecer controlado o suficiente para você conseguir repetir, não uma prova de velocidade.', steps: ['Escolha um percurso plano e seguro.', 'Faça 5 minutos de caminhada leve para aquecer.', 'Alterne 1 minuto de corrida confortável com 2 minutos de caminhada por 18 a 24 minutos.', 'Descanse ou faça uma atividade leve no dia seguinte e repita de 2 a 3 vezes na semana.'], next: 'Quando completar duas semanas sem dor persistente e recuperando-se bem, aumente primeiro os minutos correndo — não a velocidade.', specialist: 'Um profissional de Educação Física pode avaliar seu nível atual, organizar a progressão e ajustar técnica, volume e intensidade.' },
  recuperacao: { kicker: 'RECUPERAÇÃO', title: 'Recuperar também faz parte do treino.', intro: 'Sono, alimentação, hidratação e intervalo entre sessões ajudam o corpo a responder ao estímulo recebido.', steps: ['Observe como estão energia, sono, dor e vontade de treinar.', 'Após uma sessão exigente, faça descanso ou movimento leve antes de repetir a mesma carga.', 'Mantenha hidratação e refeições regulares, sem tentar compensar o treino.', 'Se o desempenho cair ou o desconforto aumentar por vários dias, reduza a carga e procure orientação.'], next: 'Volte ao treino intenso quando as atividades do dia a dia estiverem confortáveis e sua disposição tiver retornado.', specialist: 'Em caso de dor, lesão ou retorno após afastamento, procure fisioterapeuta ou médico do esporte. Para recuperação entre treinos, Educação Física e Nutrição também podem ajudar.' },
  constancia: { kicker: 'CRIAR CONSTÂNCIA', title: 'Faça o esporte caber na semana real.', intro: 'Uma rotina pequena e repetível costuma ser mais útil do que um plano perfeito que depende de motivação todos os dias.', steps: ['Escolha dois dias e horários que normalmente estão livres.', 'Defina uma versão mínima de 10 a 20 minutos para dias difíceis.', 'Deixe roupa, local ou equipamento preparados com antecedência.', 'Ao terminar, registre apenas: fiz, fiz parcialmente ou preciso ajustar.'], next: 'Mantenha os mesmos horários por duas semanas antes de acrescentar um terceiro dia.', specialist: 'Um profissional de Educação Física pode transformar sua disponibilidade em um plano realista. Se barreiras emocionais dificultarem a continuidade, a Psicologia pode complementar esse cuidado.' },
  evoluir: { kicker: 'EVOLUIR', title: 'Mude uma variável por vez e acompanhe a resposta.', intro: 'Evolução sustentável combina estímulo progressivo, técnica, recuperação e uma medida simples de acompanhamento.', steps: ['Escolha uma meta para as próximas quatro semanas.', 'Registre seu ponto de partida: tempo, distância, carga, repetições ou esforço de 0 a 10.', 'Ajuste somente duração, frequência ou intensidade — nunca tudo de uma vez.', 'Compare o resultado e a recuperação ao final de cada semana.'], next: 'Se você manteve boa técnica e recuperação, faça um pequeno avanço; se não, mantenha ou reduza a carga.', specialist: 'Procure um profissional de Educação Física ou treinador da modalidade para avaliar sua técnica e planejar a progressão; Nutrição e Medicina do Esporte podem complementar conforme a necessidade.' }
};

function showPracticalTip(topic, options = {}) {
  const guide = practicalTips[topic] || practicalTips.constancia;
  const host = document.getElementById('fb-practical-guide');
  if (!host) return;
  if (options.open !== false) openView('dicas', { focus: false });
  const kicker = document.createElement('span');
  const title = document.createElement('h3');
  const intro = document.createElement('p');
  const list = document.createElement('ol');
  const next = document.createElement('div');
  const specialist = document.createElement('aside');
  const nextLabel = document.createElement('strong');
  const nextText = document.createElement('p');
  kicker.textContent = guide.kicker;
  title.textContent = guide.title;
  intro.textContent = guide.intro;
  guide.steps.forEach(step => { const item = document.createElement('li'); item.textContent = step; list.append(item); });
  nextLabel.textContent = 'QUANDO AVANÇAR';
  nextText.textContent = guide.next;
  next.append(nextLabel, nextText);
  const specialistLabel = document.createElement('strong');
  const specialistText = document.createElement('p');
  const specialistButton = document.createElement('button');
  specialistLabel.textContent = 'ORIENTAÇÃO PROFISSIONAL';
  specialistText.textContent = guide.specialist;
  specialistButton.type = 'button';
  specialistButton.textContent = 'Conhecer especialistas →';
  specialistButton.addEventListener('click', () => openView('especialistas'));
  specialist.append(specialistLabel, specialistText, specialistButton);
  host.replaceChildren(kicker, title, intro, list, next, specialist);
  document.querySelectorAll('[data-fb-tip]').forEach(button => {
    const selected = button.dataset.fbTip === topic;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  window.setTimeout(() => host.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 180);
}

document.querySelectorAll('[data-fb-tip]').forEach(button => button.addEventListener('click', () => showPracticalTip(button.dataset.fbTip)));

document.getElementById('journey-see-content')?.addEventListener('click', () => {
  window.setTimeout(() => openView('conteudos'), 0);
});

document.getElementById('journey-ask-next')?.addEventListener('click', () => {
  if (!currentProfile?.objective) return;
  const tipByObjective = { comecar: 'constancia', saude: 'constancia', emagrecer: 'constancia', performance: 'evoluir', modalidade: 'constancia', recuperacao: 'recuperacao' };
  showPracticalTip(tipByObjective[currentProfile.objective] || 'constancia');
});

document.querySelectorAll('[data-modality]').forEach(button => {
  button.addEventListener('click', () => window.setTimeout(() => openView('jornada'), 0));
});

document.querySelectorAll('#fb-safety-form [name="condition"]').forEach(input => {
  input.addEventListener('change', () => {
    const form = document.getElementById('fb-safety-form');
    const hasCondition = form?.elements.condition.value === 'yes';
    const group = document.getElementById('fb-safety-clearance-group');
    if (group) group.hidden = !hasCondition;
    form?.querySelectorAll('[name="clearance"]').forEach(field => {
      field.required = hasCondition;
      if (!hasCondition) field.checked = false;
    });
  });
});

document.getElementById('fb-safety-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity() || !pendingProfileUpdate?.objective) {
    form.reportValidity();
    return;
  }
  const data = new FormData(form);
  const symptoms = String(data.get('symptoms') || '');
  const condition = String(data.get('condition') || '');
  const clearance = condition === 'yes' ? String(data.get('clearance') || '') : 'not-needed';
  const restricted = symptoms === 'yes' || (condition === 'yes' && clearance !== 'yes');
  const sameObjective = currentProfile?.objective === pendingProfileUpdate.objective;
  const safety = {
    consent: true,
    symptoms,
    condition,
    clearance,
    restricted,
    objective: pendingProfileUpdate.objective,
    age: pendingProfileUpdate.age,
    screenedAt: new Date().toISOString()
  };
  saveProfile({
    ...pendingProfileUpdate,
    safety,
    progress: sameObjective ? getCompletedSteps() : 1,
    checkins: sameObjective ? (currentProfile?.checkins || []) : []
  });
  pendingProfileUpdate = null;
  closeDialog(document.getElementById('fb-safety-dialog'));
  openView(restricted ? 'perfil' : 'progresso');
  const feedback = document.getElementById(restricted ? 'fb-profile-feedback' : 'fb-progress-feedback');
  if (feedback) feedback.textContent = restricted
    ? 'Perfil salvo. Siga a indicação acima para revisar os sinais informados antes de começar.'
    : 'Perfil e triagem concluídos. Escolha realizar seu próximo passo agora ou começar o registro no Meu Hoje.';
  window.setTimeout(() => {
    document.getElementById(restricted ? 'fb-profile-next-step' : 'fb-next-mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 220);
});

document.getElementById('fb-safety-later')?.addEventListener('click', () => {
  closeDialog(document.getElementById('fb-safety-dialog'));
  openView('jornada');
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:edit-onboarding', { detail: { ...(pendingProfileUpdate || currentProfile || {}) } }));
});

document.getElementById('fb-review-safety')?.addEventListener('click', () => openSafetyDialog(currentProfile, true));

function updateConnectivityStatus() {
  const status = document.getElementById('fb-connectivity-status');
  if (!status) return;
  status.classList.toggle('offline', !navigator.onLine);
  status.lastChild.textContent = navigator.onLine ? 'Dados ficam neste aparelho' : 'Modo offline · Jornada da Semana disponível';
}

window.addEventListener('online', updateConnectivityStatus);
window.addEventListener('offline', updateConnectivityStatus);
updateConnectivityStatus();

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const installButton = document.getElementById('fb-install-app');
  if (installButton) installButton.hidden = false;
});
document.getElementById('fb-install-app')?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('fb-install-app').hidden = true;
});

function openLinkedContentFromHash() {
  if (!window.location.hash) return false;

  try {
    const target = document.querySelector(window.location.hash);
    if (!target?.classList.contains('post')) return false;

    openView('conteudos', { scroll: false, focus: false, instant: true });
    const fullText = target.querySelector('.full-text');
    const toggle = target.querySelector('.read-toggle');
    if (fullText && toggle && getComputedStyle(fullText).display === 'none') toggle.click();
    window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 280);
    if (fullText && getComputedStyle(fullText).display !== 'none') {
      window.dispatchEvent(new CustomEvent('meuCaminhoBe:activity', { detail: {
        type: 'content',
        key: target.dataset.postId || target.id,
        label: target.querySelector('h3')?.textContent || 'Conteúdo Meu Caminho Be'
      } }));
    }
    return true;
  } catch (error) {
    return false;
  }
}

renderPersonalizedExperience();
if (!openLinkedContentFromHash()) {
  openView('inicio', { scroll: false, focus: false, instant: true });
}
registerDailyAccess();
document.getElementById('fb-welcome-close')?.addEventListener('click', () => document.getElementById('fb-daily-welcome')?.close());
document.getElementById('fb-welcome-later')?.addEventListener('click', () => document.getElementById('fb-daily-welcome')?.close());
document.getElementById('fb-welcome-continue')?.addEventListener('click', () => {
  document.getElementById('fb-daily-welcome')?.close();
  openView(currentProfile?.objective ? 'progresso' : 'jornada');
});
document.querySelectorAll('[data-fb-edit-onboarding]').forEach(button => {
  button.addEventListener('click', () => {
    openView('jornada');
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:edit-onboarding', { detail: { ...(currentProfile || {}) } }));
    window.setTimeout(() => document.getElementById('journey-assistant')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  });
});
document.querySelectorAll('[data-fb-reset]').forEach(button => {
  button.addEventListener('click', () => {
    closeMobileDrawer(false);
    openResetDialog();
  });
});
document.getElementById('fb-reset-cancel')?.addEventListener('click', () => closeDialog(document.getElementById('fb-reset-dialog')));
document.getElementById('fb-reset-confirm')?.addEventListener('click', resetLocalJourney);
showPracticalTip('correr', { open: false });
const sharedQuestion = new URLSearchParams(window.location.search).get('pergunta')?.trim();
if (sharedQuestion && sharedQuestion.length >= 3) {
  showPracticalTip('constancia');
}
})();
