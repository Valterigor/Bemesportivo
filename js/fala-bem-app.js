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
  comecar: ['Perfil esportivo definido','Escolher uma prática acessível','Realizar a primeira experiência','Repetir em um dia possível','Revisar e escolher o próximo ciclo'],
  saude: ['Perfil esportivo definido','Reservar horários possíveis','Fazer uma prática leve','Repetir com regularidade','Revisar disposição e rotina'],
  emagrecer: ['Perfil esportivo definido','Escolher uma atividade prazerosa','Organizar uma semana possível','Registrar sua constância','Revisar hábitos e próximo ciclo'],
  performance: ['Perfil esportivo definido','Definir uma meta mensurável','Registrar o ponto de partida','Acompanhar treino e recuperação','Revisar a evolução do ciclo'],
  modalidade: ['Perfil esportivo definido','Selecionar duas modalidades','Experimentar a primeira opção','Experimentar a segunda opção','Escolher a prática que convida a voltar'],
  recuperacao: ['Perfil esportivo definido','Planejar uma retomada gradual','Realizar uma prática mais leve','Observar as respostas do corpo','Revisar a retomada com segurança']
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
    lastAccessAt: now.toISOString(),
    lastGreetingDate: shouldWelcome ? today : previous.lastGreetingDate
  };
  saveAccessState(nextState);
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
  label.textContent = 'ORIENTAÇÃO INICIAL';
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
    ? `A busca encontrou ${guidance.evidenceCount} fonte${guidance.evidenceCount > 1 ? 's' : ''} científica${guidance.evidenceCount > 1 ? 's' : ''} relacionada${guidance.evidenceCount > 1 ? 's' : ''}.`
    : 'Orientação educativa geral; nenhuma fonte científica específica foi recuperada agora.';
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
  const checkin = document.getElementById('fb-progress-checkin');
  const status = document.getElementById('fb-checkin-status');
  const note = document.getElementById('fb-checkin-note');
  const form = document.getElementById('fb-progress-checkin');
  if (!button) return;
  const cycleComplete = currentProfile?.objective && getCompletedSteps() >= getJourneySteps().length;
  if (checkin) checkin.hidden = !currentProfile?.objective || cycleComplete;
  if (newCycleButton) newCycleButton.hidden = !cycleComplete;
  const requiresCheckin = Boolean(currentProfile?.objective && !cycleComplete);
  if (status) status.disabled = !requiresCheckin;
  if (note) note.disabled = !requiresCheckin;
  const hasValidData = Boolean(form?.checkValidity() && status?.value && (note?.value.trim().length || 0) >= 3);
  button.disabled = !currentProfile?.objective || (requiresCheckin && !hasValidData);
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
    ['PRÁTICA ATUAL', currentProfile.practiceName || currentProfile.practiceLabel || 'Não informado'],
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
  const checkin = document.getElementById('fb-progress-checkin');
  const checkinHost = document.getElementById('fb-progress-checkin-host');
  if (!list) return;
  if (checkin && checkinHost && checkin.parentElement !== checkinHost) checkinHost.append(checkin);
  if (!currentProfile?.objective) {
    list.replaceChildren();
    document.getElementById('fb-progress-summary').textContent = 'Crie seu perfil para iniciar uma jornada personalizada.';
    updateProgressActionState();
    return;
  }

  const steps = getJourneySteps();
  const completed = getCompletedSteps();
  const savedCheckins = Array.isArray(currentProfile.checkins) ? currentProfile.checkins : [];
  const checkinStatusLabels = { concluida: 'Realizada', parcial: 'Realizada parcialmente', ajustar: 'Caminho ajustado' };
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
        : isComplete ? 'Etapa concluída.' : isCurrent ? 'Este é o seu próximo passo.' : 'Será liberada na sequência da jornada.';
    content.append(title, detail);
    item.append(content);
    return item;
  }));

  const currentStepItem = list.querySelector('li.current');
  if (currentStepItem && checkin) currentStepItem.append(checkin);

  const completeButton = document.getElementById('fb-complete-step');
  completeButton.textContent = 'Registrar e concluir esta etapa';
  const checkinStep = document.getElementById('fb-checkin-step');
  if (checkinStep && completed < steps.length) checkinStep.textContent = steps[completed];
  updateProgressActionState();
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
    if (heroAction) {
      heroAction.textContent = completed >= steps.length ? 'Rever minha jornada' : 'Continuar jornada';
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
}

window.addEventListener('meuCaminhoBe:profile-updated', event => {
  const details = event.detail || {};
  const sameObjective = currentProfile?.objective === details.objective;
  saveProfile({
    ...details,
    name: details.name || currentProfile?.name || '',
    progress: sameObjective ? getCompletedSteps() : 1,
    checkins: sameObjective ? (currentProfile?.checkins || []) : []
  });
});

window.addEventListener('meuCaminhoBe:identity-captured', event => {
  const name = String(event.detail?.name || '').trim().slice(0, 40);
  if (name.length < 2) return;
  saveProfile({ name, identityCreatedAt: currentProfile?.identityCreatedAt || new Date().toISOString() });
  registerFirstIdentityAccess();
});

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
  const checkins = [...(currentProfile.checkins || []), {
    step: steps[completed],
    status: status.value,
    note: note.value.trim(),
    completedAt: new Date().toISOString()
  }];
  if (status) status.value = '';
  if (note) note.value = '';
  saveProfile({ progress: nextProgress, checkins });
  document.getElementById('fb-progress-feedback').textContent = 'Etapa registrada. Seu próximo passo já está disponível.';
});

document.getElementById('fb-new-cycle')?.addEventListener('click', () => {
  saveProfile({ progress: 1, checkins: [] });
  document.getElementById('fb-progress-feedback').textContent = 'Novo ciclo iniciado. Seu próximo passo já está disponível.';
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

document.getElementById('journey-ask-next')?.addEventListener('click', () => {
  if (!currentProfile?.objective) return;
  const action = currentProfile.nextAction || objectiveLabels[currentProfile.objective] || 'meu próximo passo';
  const query = `Como fazer com segurança este próximo passo: ${action}`.slice(0, 180);
  openView('perguntar', { focus: false });
  answerInput.value = query;
  answerForm.requestSubmit();
});

document.querySelectorAll('[data-modality]').forEach(button => {
  button.addEventListener('click', () => window.setTimeout(() => openView('jornada'), 0));
});

renderPersonalizedExperience();
openView('inicio', { scroll: false, focus: false, instant: true });
registerDailyAccess();
document.getElementById('fb-welcome-close')?.addEventListener('click', () => document.getElementById('fb-daily-welcome')?.close());
document.getElementById('fb-welcome-later')?.addEventListener('click', () => document.getElementById('fb-daily-welcome')?.close());
document.getElementById('fb-welcome-continue')?.addEventListener('click', () => {
  document.getElementById('fb-daily-welcome')?.close();
  openView(currentProfile?.objective ? 'progresso' : 'jornada');
});
const sharedQuestion = new URLSearchParams(window.location.search).get('pergunta')?.trim();
if (sharedQuestion && sharedQuestion.length >= 3) {
  openView('perguntar', { scroll: false, focus: false, instant: true });
  answerInput.value = sharedQuestion.slice(0, 180);
  answerQuestion(answerInput.value).catch(() => {
    answerStatus.textContent = 'A busca externa está indisponível no momento. Tente novamente mais tarde.';
  });
}
})();
