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
let currentProfile = readStoredProfile();
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
  comecar: ['Perfil e objetivo definidos','Escolher uma prática acessível','Realizar a primeira experiência','Repetir em um dia possível','Revisar e escolher o próximo ciclo'],
  saude: ['Perfil e objetivo definidos','Reservar horários possíveis','Fazer uma prática leve','Repetir com regularidade','Revisar disposição e rotina'],
  emagrecer: ['Perfil e objetivo definidos','Escolher uma atividade prazerosa','Organizar uma semana possível','Registrar sua constância','Revisar hábitos e próximo ciclo'],
  performance: ['Perfil e objetivo definidos','Definir uma meta mensurável','Registrar o ponto de partida','Acompanhar treino e recuperação','Revisar a evolução do ciclo'],
  modalidade: ['Perfil e objetivo definidos','Selecionar duas modalidades','Experimentar a primeira opção','Experimentar a segunda opção','Escolher a prática que convida a voltar'],
  recuperacao: ['Perfil e objetivo definidos','Planejar uma retomada gradual','Realizar uma prática mais leve','Observar as respostas do corpo','Revisar a retomada com segurança']
};

function readStoredProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null');
    return profile && typeof profile === 'object' ? profile : null;
  } catch (error) {
    return null;
  }
}

function saveProfile(updates) {
  currentProfile = { ...(currentProfile || {}), ...updates, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(currentProfile)); } catch (error) {}
  renderPersonalizedExperience();
  return currentProfile;
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
    const selected = buttonView === view ||
      (view === 'progresso' && buttonView === 'jornada') ||
      (view === 'perfil' && buttonView === 'inicio') ||
      (view === 'comunidade' && buttonView === 'perguntar') ||
      (view === 'especialistas' && buttonView === 'conteudos') ||
      (view === 'modalidades' && buttonView === 'conteudos') ||
      (view === 'trilhas' && buttonView === 'jornada');
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

  if (view === 'perguntar' && options.focus !== false) {
    window.setTimeout(() => document.getElementById('fb-answer-input')?.focus(), 260);
  }
  return true;
}

window.falaBemOpenView = openView;
window.falaBemOpenTarget = target => {
  const targetViews = {
    'minha-jornada': 'jornada', trilhas: 'trilhas', ferramentas: 'ferramentas',
    especialistas: 'especialistas', modalidades: 'modalidades', ideias: 'conteudos',
    historias: 'conteudos', 'participe-agora': 'perguntar'
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
    const view = requestedView === 'jornada' && currentProfile && isContinueControl ? 'progresso' : requestedView;
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

const stopWords = new Set(['a','ao','aos','as','com','como','da','das','de','do','dos','e','em','eu','me','na','nas','no','nos','o','os','para','por','que','se','um','uma']);
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
  const params = new URLSearchParams({ query, format: 'json', pageSize: '3', resultType: 'core' });
  const data = await fetchWithTimeout(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params}`);
  return (data.resultList?.result || []).map(item => {
    const articleId = item.pmid || item.pmcid || item.id;
    const sourceId = item.source || (item.pmcid ? 'PMC' : 'MED');
    const details = [item.authorString, item.journalTitle, item.pubYear].filter(Boolean).join(' · ');
    return {
      source: 'Europe PMC',
      title: plainText(item.title),
      summary: plainText(item.abstractText || details || 'Registro científico relacionado à sua busca.'),
      date: item.pubYear || '',
      url: `https://europepmc.org/article/${encodeURIComponent(sourceId)}/${encodeURIComponent(articleId)}`
    };
  }).filter(item => item.title && item.url);
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
  if (result.date) {
    const time = document.createElement('time');
    time.textContent = result.date;
    header.append(time);
  }
  const title = document.createElement('h3');
  title.textContent = result.title;
  const summary = document.createElement('p');
  summary.textContent = result.summary;
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

async function answerQuestion(query) {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) return;
  resultsContainer.replaceChildren();
  answerStatus.textContent = 'Procurando primeiro no conteúdo do BeMEsportivo…';

  const localResults = searchLocal(cleanQuery);
  if (localResults.length) {
    resultsContainer.replaceChildren(...localResults.map(result => createResultCard(result, true)));
    answerStatus.textContent = `${localResults.length} resposta${localResults.length > 1 ? 's' : ''} encontrada${localResults.length > 1 ? 's' : ''} no próprio site.`;
    return;
  }

  answerStatus.textContent = 'Não encontramos no site. Consultando bases externas…';
  const settled = await Promise.allSettled([searchWikipedia(cleanQuery), searchEuropePmc(cleanQuery)]);
  const externalResults = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []).slice(0, 6);

  if (!externalResults.length) {
    answerStatus.textContent = 'Não foi possível encontrar uma resposta agora. Tente usar outras palavras.';
    return;
  }
  resultsContainer.replaceChildren(...externalResults.map(result => createResultCard(result)));
  const sources = [...new Set(externalResults.map(result => result.source))].join(' e ');
  answerStatus.textContent = `Resultados externos encontrados em ${sources}. Confira a fonte antes de tomar decisões.`;
}

function getJourneySteps(profile = currentProfile) {
  return journeyStepTemplates[profile?.objective] || journeyStepTemplates.comecar;
}

function getCompletedSteps(profile = currentProfile) {
  return Math.max(1, Math.min(5, Number(profile?.progress) || 1));
}

function renderProfileSummary() {
  const container = document.getElementById('fb-profile-summary');
  if (!container) return;
  if (!currentProfile?.objective) {
    const message = document.createElement('p');
    message.textContent = 'Complete sua jornada inicial para formar o perfil esportivo.';
    container.replaceChildren(message);
    return;
  }
  const fields = [
    ['OBJETIVO', objectiveLabels[currentProfile.objective] || 'Seu caminho'],
    ['MOMENTO', currentProfile.ageLabel || 'Não informado'],
    ['TEMPO', currentProfile.availabilityLabel || 'Não informado']
  ];
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

function renderProgress() {
  const list = document.getElementById('fb-progress-steps');
  if (!list) return;
  if (!currentProfile?.objective) {
    list.replaceChildren();
    document.getElementById('fb-progress-summary').textContent = 'Crie seu perfil para iniciar uma jornada personalizada.';
    return;
  }

  const steps = getJourneySteps();
  const completed = getCompletedSteps();
  const percent = completed * 20;
  document.getElementById('fb-progress-title').textContent = currentProfile.title || 'Seu caminho continua aqui.';
  document.getElementById('fb-progress-summary').textContent = currentProfile.rhythm || 'Avance uma etapa por vez.';
  document.getElementById('fb-progress-percent').textContent = `${percent}%`;
  document.getElementById('fb-progress-bar').style.width = `${percent}%`;

  list.replaceChildren(...steps.map((step, index) => {
    const item = document.createElement('li');
    const content = document.createElement('div');
    const title = document.createElement('strong');
    const detail = document.createElement('small');
    const isComplete = index < completed;
    const isCurrent = index === completed && completed < steps.length;
    item.classList.toggle('complete', isComplete);
    item.classList.toggle('current', isCurrent);
    title.textContent = step;
    detail.textContent = index === 0
      ? 'Definido pelas respostas do seu perfil.'
      : index === 1 && currentProfile.nextAction
        ? currentProfile.nextAction
        : isComplete ? 'Etapa concluída.' : isCurrent ? 'Este é o seu próximo passo.' : 'Será liberada na sequência da jornada.';
    content.append(title, detail);
    item.append(content);
    return item;
  }));

  const completeButton = document.getElementById('fb-complete-step');
  completeButton.textContent = completed >= steps.length ? 'Iniciar novo ciclo' : 'Concluir etapa atual';
}

function renderPersonalizedExperience() {
  const kicker = document.getElementById('fb-today-kicker');
  const title = document.getElementById('fb-today-title');
  const summary = document.getElementById('fb-today-summary');
  const progress = document.getElementById('fb-today-progress');
  const primary = document.getElementById('fb-today-primary');
  const avatar = shell.querySelector('.fb-app-avatar');
  const nameInput = document.getElementById('fb-profile-name');
  const pathEntry = document.getElementById('fb-path-entry');
  const todayCard = document.getElementById('fb-today-card');
  const appTitle = document.getElementById('fb-app-title');
  const appSubtitle = document.getElementById('fb-app-subtitle');

  if (!currentProfile?.objective) {
    pathEntry.hidden = false;
    todayCard.hidden = true;
    appTitle.textContent = 'Existe um jeito de viver o esporte que combina com você.';
    appSubtitle.textContent = 'Encontre seu ponto de partida e construa uma jornada possível.';
    kicker.textContent = 'SEU PRIMEIRO PASSO';
    title.textContent = 'Crie seu perfil esportivo.';
    summary.textContent = '3 perguntas · menos de 1 minuto';
    progress.hidden = true;
    primary.textContent = 'Criar meu caminho';
    primary.dataset.fbView = 'jornada';
    if (avatar) avatar.textContent = 'BE';
  } else {
    const completed = getCompletedSteps();
    const steps = getJourneySteps();
    const percent = completed * 20;
    const displayName = currentProfile.name?.trim();
    pathEntry.hidden = true;
    todayCard.hidden = false;
    appTitle.textContent = displayName ? `${displayName}, sua jornada continua.` : 'Sua jornada continua.';
    appSubtitle.textContent = 'Um próximo passo de cada vez, no seu ritmo.';
    kicker.textContent = displayName ? `OLÁ, ${displayName.toLocaleUpperCase('pt-BR')}` : 'MEU HOJE';
    title.textContent = objectiveLabels[currentProfile.objective] || 'Seu caminho está pronto.';
    summary.textContent = completed >= steps.length ? 'Ciclo concluído.' : 'Seu próximo passo já está disponível.';
    progress.hidden = false;
    document.getElementById('fb-today-progress-label').textContent = `${percent}%`;
    document.getElementById('fb-today-progress-bar').style.width = `${percent}%`;
    document.getElementById('fb-today-next-action').textContent = completed >= steps.length
      ? 'Ciclo concluído. Você pode iniciar uma nova sequência.'
      : `Próximo passo: ${steps[completed]}`;
    primary.textContent = completed >= steps.length ? 'Ver jornada concluída' : 'Continuar jornada';
    primary.dataset.fbView = 'progresso';
    if (avatar) avatar.textContent = displayName ? displayName.charAt(0).toLocaleUpperCase('pt-BR') : 'BE';
  }

  if (nameInput && document.activeElement !== nameInput) nameInput.value = currentProfile?.name || '';
  renderProfileSummary();
  renderProgress();
}

window.addEventListener('meuCaminhoBe:profile-updated', event => {
  const details = event.detail || {};
  const sameObjective = currentProfile?.objective === details.objective;
  saveProfile({
    ...details,
    name: currentProfile?.name || '',
    progress: sameObjective ? getCompletedSteps() : 1
  });
});

document.getElementById('fb-complete-step')?.addEventListener('click', () => {
  if (!currentProfile?.objective) {
    openView('jornada');
    return;
  }
  const completed = getCompletedSteps();
  const nextProgress = completed >= 5 ? 1 : completed + 1;
  saveProfile({ progress: nextProgress });
  document.getElementById('fb-progress-feedback').textContent = completed >= 5
    ? 'Novo ciclo iniciado. O primeiro passo já está concluído.'
    : 'Etapa concluída. Seu próximo passo já está disponível.';
});

document.getElementById('fb-profile-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const name = document.getElementById('fb-profile-name').value.trim();
  saveProfile({ name });
  document.getElementById('fb-profile-feedback').textContent = name
    ? `Perfil salvo, ${name}.` : 'Perfil salvo neste navegador.';
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

document.querySelector('[data-fb-open-search]')?.addEventListener('submit', event => {
  event.preventDefault();
  const query = document.getElementById('fb-home-question').value.trim();
  openView('perguntar', { focus: false });
  answerInput.value = query;
  if (query) answerForm.requestSubmit();
  else answerInput.focus();
});

document.getElementById('journey-see-content')?.addEventListener('click', () => {
  window.setTimeout(() => openView('conteudos'), 0);
});

document.querySelectorAll('[data-modality]').forEach(button => {
  button.addEventListener('click', () => window.setTimeout(() => openView('jornada'), 0));
});

renderPersonalizedExperience();
openView('inicio', { scroll: false, focus: false, instant: true });
})();
