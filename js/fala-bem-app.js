(() => {
'use strict';

const shell = document.getElementById('fala-bem-app');
if (!shell) return;

const toolsMount = document.getElementById('fb-tools-mount');
const toolsSection = document.getElementById('ferramentas');
if (toolsMount && toolsSection) toolsMount.append(toolsSection);
const panels = [...shell.querySelectorAll('[data-fb-panel]')];
const navigationButtons = [...document.querySelectorAll('[data-fb-view]')];
const appNavButtons = [...shell.querySelectorAll('.fb-app-nav [data-fb-view]')];
const mobileDrawerViewButtons = [...shell.querySelectorAll('.fb-mobile-drawer [data-fb-view]')];
const managedSections = [...document.querySelectorAll('.container.page > :not(.fb-app-shell)')];
const PROFILE_STORAGE_KEY = 'meuCaminhoBeProfileV1';
const ACCESS_STORAGE_KEY = 'meuCaminhoBeAccessV1';
const BE_NOW_TIMER_KEY = 'meuCaminhoBeTimerV1';
const SAFETY_CONSENT_VERSION = '2026-07-21';
const PUBLIC_PROFILE_TERMS_VERSION = '2026-08-15';
const PROFILE_SCHEMA_VERSION = 10;
const BACKUP_KIND = 'meu-caminho-be-backup';
const BACKUP_VERSION = 1;
const BACKUP_MAX_BYTES = 5 * 1024 * 1024;
const APP_BASE_PATH = '/meu-caminho-be';
const dailyActivityLabels = {
  none: 'Sem treino', caminhada: 'Caminhada', corrida: 'Corrida', musculacao: 'Musculação',
  funcional: 'Treino funcional', futebol: 'Futebol', ciclismo: 'Ciclismo', natacao: 'Natação', outra: 'Outra atividade'
};
const dailyIntentions = {
  movimento: 'Me movimentar', descanso: 'Descansar', alimentacao: 'Cuidar da alimentação',
  hidratacao: 'Melhorar a hidratação', registro: 'Só registrar meu dia'
};
const dayPlanActivityLabels = {
  corrida: 'Corrida', caminhada: 'Caminhada', musculacao: 'Academia ou musculação', futebol: 'Futebol',
  ciclismo: 'Ciclismo', natacao: 'Natação', descanso: 'Descanso ou recuperação', outra: 'Outra atividade'
};
const checkinBarrierLabels = {
  tempo: 'faltou tempo',
  energia: 'energia ou recuperação',
  dificuldade: 'o passo estava difícil',
  acesso: 'local ou equipamento',
  apoio: 'companhia ou apoio',
  desconforto: 'dor, desconforto ou insegurança',
  outro: 'outro motivo'
};
const weeklyDecisionLabels = {
  manter: 'manter o que funcionou',
  simplificar: 'fazer uma versão menor',
  reorganizar: 'trocar horário ou organização',
  orientacao: 'buscar orientação profissional'
};
const sportVisualLabels = {
  energia: 'Energia',
  equilibrio: 'Equilíbrio',
  discreto: 'Discreto',
  vibrante: 'Vibrante'
};
const sportIdentityPresets = {
  futebol: { label: 'Futebol', metric: 'Gols', role: 'Atacante, meia, defensor ou goleiro' },
  futsal: { label: 'Futsal', metric: 'Gols', role: 'Fixo, ala, pivô ou goleiro' },
  volei: { label: 'Vôlei', metric: 'Pontos', role: 'Ponteiro, central, líbero ou levantador' },
  corrida: { label: 'Corrida', metric: 'Tempo e ritmo', role: 'Velocista, fondista ou corredor de rua' },
  ciclismo: { label: 'Ciclismo', metric: 'Distância e potência', role: 'Estrada, MTB ou passeio' },
  natacao: { label: 'Natação', metric: 'Tempos e séries', role: 'Piscina, mar ou águas abertas' },
  lutas: { label: 'Lutas', metric: 'Vitórias e rounds', role: 'Boxe, judô, jiu-jítsu ou karatê' },
  musculacao: { label: 'Musculação', metric: 'Carga e progressão', role: 'Força, hipertrofia ou condicionamento' },
  outro: { label: 'Outro esporte', metric: 'Progresso', role: 'Descreva a modalidade ou atividade' }
};
let currentProfile = readStoredProfile();
let pendingProfileUpdate = null;
let pendingProfilePhoto;
let lastBeNowTransition = null;
let journeyStepSaving = false;
let beNowCompactMode = false;
let pendingBeNowStatus = '';
let beNowTimerInterval = null;
let profileEditMode = false;
let activeSaveSubmitter = null;
let saveButtonRestoreTimer = null;
const viewTargets = {
  jornada: ['#minha-jornada'],
  ferramentas: ['#ferramentas'],
  especialistas: ['#especialistas'],
  modalidades: ['.container.page > .platform-duo'],
  comunidade: ['.container.page > .platform-engagement'],
  trilhas: ['#trilhas']
};
const appPathForView = {
  inicio: APP_BASE_PATH,
  registrar: `${APP_BASE_PATH}/registrar`,
  progresso: `${APP_BASE_PATH}/jornada`,
  jornada: `${APP_BASE_PATH}/jornada/mapa`,
  evolucao: `${APP_BASE_PATH}/jornada/evolucao`,
  explorar: `${APP_BASE_PATH}/jornada/historia`,
  perfil: `${APP_BASE_PATH}/perfil`,
  ferramentas: `${APP_BASE_PATH}/ferramentas`,
  conteudos: `${APP_BASE_PATH}/ferramentas/conteudos`,
  especialistas: `${APP_BASE_PATH}/ferramentas/profissionais`,
  modalidades: `${APP_BASE_PATH}/ferramentas/modalidades`,
  comunidade: `${APP_BASE_PATH}/ferramentas/comunidade`,
  trilhas: `${APP_BASE_PATH}/ferramentas/trilhas`,
  dicas: `${APP_BASE_PATH}/ferramentas/guias`,
  gols: `${APP_BASE_PATH}/ferramentas/contador-de-gols`
};
const legacyViewForRoute = {
  hoje: 'inicio',
  jornada: 'progresso',
  evolucao: 'evolucao',
  explorar: 'explorar',
  aprender: 'conteudos',
  perfil: 'perfil'
};
const primarySectionForView = {
  inicio: 'inicio',
  registrar: 'registrar',
  jornada: 'progresso',
  progresso: 'progresso',
  evolucao: 'progresso',
  explorar: 'progresso',
  ferramentas: 'ferramentas',
  conteudos: 'ferramentas',
  especialistas: 'ferramentas',
  modalidades: 'ferramentas',
  comunidade: 'ferramentas',
  trilhas: 'ferramentas',
  dicas: 'ferramentas',
  gols: 'ferramentas',
  perfil: 'perfil'
};
const viewPresentation = {
  inicio: ['Início', '#be-dashboard-greeting'],
  registrar: ['Registrar', '#be-register-page-title'],
  progresso: ['Minha Jornada', '#be-diary-title'],
  jornada: ['Criar meu Mapa BeM', '#journey-title'],
  evolucao: ['Minha evolução', '#be-evolution-main-title'],
  explorar: ['Minha história', '#be-history-title'],
  perfil: ['Meu perfil', '#fb-profile-title'],
  conteudos: ['Aprender', '#be-learn-title'],
  ferramentas: ['Ferramentas', '#tools-title'],
  especialistas: ['Profissionais', '#specialists-title'],
  modalidades: ['Modalidades', '#modalidades-title'],
  comunidade: ['Comunidade', '#comunidade-title'],
  trilhas: ['Trilhas', '#trilhas-title'],
  dicas: ['Dicas', '#fb-tips-title'],
  gols: ['Contador de gols', '#fb-goals-view-title']
};
const sectionBannerContent = {
  registrar: {
    kicker: 'UM MOMENTO DA SUA HISTÓRIA',
    title: 'Registrar',
    text: 'Conte o que aconteceu de verdade e transforme cada atividade em parte da sua trajetória esportiva.',
    mark: '+'
  },
  progresso: {
    kicker: 'SUA TRAJETÓRIA ESPORTIVA',
    title: 'Jornada',
    text: 'Diário, evolução e história reunidos para você compreender seu caminho sem transformar cada dia em cobrança.',
    mark: '01'
  },
  ferramentas: {
    kicker: 'RECURSOS PARA O DIA A DIA',
    title: 'Ferramentas',
    text: 'Planeje, calcule referências e encontre apoio para tomar decisões mais claras sobre sua rotina esportiva.',
    mark: '02'
  },
  perfil: {
    kicker: 'SUA IDENTIDADE NO ESPORTE',
    title: 'Perfil',
    text: 'Organize seu cadastro, sua modalidade e a forma como sua trajetória aparece no Meu Caminho Be.',
    mark: '03'
  }
};

const objectiveLabels = {
  comecar: 'Começar no esporte', saude: 'Melhorar a saúde', emagrecer: 'Criar hábitos saudáveis',
  performance: 'Buscar performance', modalidade: 'Encontrar um esporte', recuperacao: 'Voltar com segurança'
};

function isMinorRestrictedProfile(profile = currentProfile) {
  return ['ate-17', 'under-18'].includes(profile?.age);
}

function normalizeSportProfile(profile = {}) {
  const modality = Object.prototype.hasOwnProperty.call(sportIdentityPresets, profile?.modality) ? profile.modality : 'outro';
  const visual = Object.prototype.hasOwnProperty.call(sportVisualLabels, profile?.visual) ? profile.visual : 'energia';
  return {
    modality,
    role: String(profile?.role || '').trim().slice(0, 60),
    visual,
    createdAt: String(profile?.createdAt || ''),
    updatedAt: String(profile?.updatedAt || '')
  };
}

function normalizeGoalHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history.map(entry => {
    if (!entry || typeof entry !== 'object') return null;
    const added = Math.max(0, Math.trunc(Number(entry.added || entry.delta || 0)));
    const total = Math.max(0, Math.trunc(Number(entry.total || 0)));
    const recordedAt = String(entry.recordedAt || entry.updatedAt || entry.createdAt || '').trim();
    const goalDate = String(entry.goalDate || entry.date || '').trim();
    const team = String(entry.team || entry.goalTeam || '').trim().slice(0, 60);
    if (!added && !total && !recordedAt && !goalDate && !team) return null;
    return {
      added,
      total,
      recordedAt: recordedAt && !Number.isNaN(new Date(recordedAt).getTime()) ? recordedAt : new Date().toISOString(),
      goalDate: goalDate && /^\d{4}-\d{2}-\d{2}$/.test(goalDate) ? goalDate : '',
      team
    };
  }).filter(Boolean).slice(-60);
}

function rebuildGoalState(baseline = 0, history = [], fallbackTotal = 0, fallbackUpdatedAt = '') {
  const normalizedBaseline = Math.max(0, Math.trunc(Number(baseline || 0)));
  const normalizedHistory = normalizeGoalHistory(history);
  if (!normalizedHistory.length) {
    return {
      baseline: normalizedBaseline,
      total: Math.max(normalizedBaseline, Math.trunc(Number(fallbackTotal || 0))),
      updatedAt: fallbackUpdatedAt || '',
      history: normalizedHistory
    };
  }
  let runningTotal = normalizedBaseline;
  const rebuiltHistory = normalizedHistory.map(entry => {
    runningTotal += entry.added;
    return { ...entry, total: runningTotal };
  });
  return {
    baseline: normalizedBaseline,
    total: runningTotal,
    updatedAt: rebuiltHistory.at(-1)?.recordedAt || fallbackUpdatedAt || '',
    history: rebuiltHistory
  };
}

function normalizeSportStats(stats = {}) {
  const goals = stats?.goals && typeof stats.goals === 'object' ? stats.goals : {};
  const history = normalizeGoalHistory(goals.history || stats?.goalHistory || []);
  const baseline = Math.max(0, Math.trunc(Number(goals.baseline ?? stats?.goalBaseline ?? 0)));
  const total = Math.max(baseline, Math.trunc(Number(goals.total ?? stats?.goalTotal ?? baseline)));
  const updatedAt = String(goals.updatedAt || stats?.goalUpdatedAt || '').trim();
  const rebuilt = rebuildGoalState(baseline, history, total, updatedAt);
  return {
    goals: {
      baseline: rebuilt.baseline,
      total: rebuilt.total,
      updatedAt: rebuilt.updatedAt
    },
    history: rebuilt.history
  };
}

function getSportProfile(profile = currentProfile) {
  const normalized = normalizeSportProfile(profile?.sportProfile);
  const preset = sportIdentityPresets[normalized.modality] || sportIdentityPresets.outro;
  return {
    ...normalized,
    label: preset.label,
    metric: preset.metric,
    fallbackRole: preset.role,
    modalityLabel: preset.label,
    roleLabel: normalized.role || preset.role,
    visualLabel: sportVisualLabels[normalized.visual]
  };
}

function getGoalTracker(profile = currentProfile) {
  const stats = normalizeSportStats(profile?.sportStats);
  return {
    baseline: stats.goals.baseline,
    total: stats.goals.total,
    updatedAt: stats.goals.updatedAt,
    history: stats.history
  };
}

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
      schemaVersion: PROFILE_SCHEMA_VERSION,
      email: String(profile.email || '').trim().toLocaleLowerCase('pt-BR').slice(0, 120),
      publicAge: Number.isFinite(Number(profile.publicAge)) && Number(profile.publicAge) >= 18 && Number(profile.publicAge) <= 120 ? Math.round(Number(profile.publicAge)) : null,
      profession: String(profile.profession || '').trim().slice(0, 60),
      publicEnabled: profile.publicEnabled === true,
      publicTermsAccepted: profile.publicTermsAccepted === true && profile.publicTermsVersion === PUBLIC_PROFILE_TERMS_VERSION,
      publicTermsVersion: String(profile.publicTermsVersion || ''),
      publicTermsAcceptedAt: String(profile.publicTermsAcceptedAt || ''),
      location: {
        city: String(profile.location?.city || '').trim().slice(0, 60),
        state: String(profile.location?.state || '').trim().toLocaleUpperCase('pt-BR').slice(0, 2)
      },
      photoDataUrl: sanitizeProfilePhoto(profile.photoDataUrl),
      story: sanitizeProfileStory(profile.story),
      sportProfile: normalizeSportProfile(profile.sportProfile),
      sportStats: normalizeSportStats(profile.sportStats),
      checkins: Array.isArray(profile.checkins) ? profile.checkins : [],
      cycles: Array.isArray(profile.cycles) ? profile.cycles : [],
      dailyLogs: Array.isArray(profile.dailyLogs) ? profile.dailyLogs.map(sanitizeDailyLog).filter(Boolean).slice(-180) : [],
      dailyPlans: Array.isArray(profile.dailyPlans) ? profile.dailyPlans.map(sanitizeDailyPlan).filter(Boolean).slice(-60) : [],
      weeklyReviews: Array.isArray(profile.weeklyReviews) ? profile.weeklyReviews.map(sanitizeWeeklyReview).filter(Boolean).slice(-26) : [],
      activityHistory: Array.isArray(profile.activityHistory) ? profile.activityHistory : [],
      gamificationStats: profile.gamificationStats && typeof profile.gamificationStats === 'object' ? profile.gamificationStats : {}
    };
  } catch (error) {
    return null;
  }
}

function sanitizeProfilePhoto(value) {
  const photo = String(value || '');
  return /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(photo) && photo.length <= 250000 ? photo : '';
}

function sanitizeProfileStory(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim().slice(0, 600);
}

function saveProfile(updates) {
  const previousProfile = currentProfile;
  const now = new Date().toISOString();
  const sportProfile = normalizeSportProfile(updates?.sportProfile ?? currentProfile?.sportProfile);
  const sportStats = normalizeSportStats(updates?.sportStats ?? currentProfile?.sportStats);
  currentProfile = {
    ...(currentProfile || {}),
    ...updates,
    sportProfile,
    sportStats,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    createdAt: currentProfile?.createdAt || updates.createdAt || now,
    updatedAt: now
  };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(currentProfile));
  } catch (error) {
    currentProfile = previousProfile;
    showProductFeedback({
      type: 'warning', title: 'Não foi possível salvar neste aparelho.',
      message: 'Libere espaço no navegador ou verifique se o armazenamento do site está bloqueado e tente novamente.'
    });
    return null;
  }
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:profile-updated', { detail: { ready: Boolean(currentProfile?.objective) } }));
  try {
    renderPersonalizedExperience();
  } catch (error) {
    console.error('O perfil foi salvo, mas a interface não conseguiu ser atualizada.', error);
  }
  return currentProfile;
}

let celebrationTimer = null;
let celebrationHideTimer = null;
let saveReceiptHideTimer = null;

function hideSaveReceipt() {
  const receipt = document.getElementById('fb-save-receipt');
  window.clearTimeout(saveReceiptHideTimer);
  if (receipt) receipt.hidden = true;
}

function hideCelebration() {
  const toast = document.getElementById('fb-celebration-toast');
  if (!toast) return;
  window.clearTimeout(celebrationTimer);
  window.clearTimeout(celebrationHideTimer);
  toast.classList.remove('show');
  celebrationHideTimer = window.setTimeout(() => { toast.hidden = true; }, 240);
}

function showProductFeedback({ type = 'success', title = '', message = '', reward = '', detail = '' } = {}) {
  const toast = document.getElementById('fb-celebration-toast');
  const titleTarget = document.getElementById('fb-celebration-title');
  const messageTarget = document.getElementById('fb-celebration-message');
  const iconTarget = toast?.querySelector('.fb-celebration-icon');
  const metaTarget = document.getElementById('fb-celebration-meta');
  const rewardTarget = document.getElementById('fb-celebration-reward');
  const detailTarget = document.getElementById('fb-celebration-detail');
  if (!toast || !titleTarget || !messageTarget || !iconTarget || !metaTarget || !rewardTarget || !detailTarget) return;
  const feedbackType = ['success', 'progress', 'warning', 'danger', 'info'].includes(type) ? type : 'info';
  const icons = { success: '✓', progress: '↗', warning: '!', danger: '×', info: 'i' };
  window.clearTimeout(celebrationTimer);
  window.clearTimeout(celebrationHideTimer);
  titleTarget.textContent = title;
  messageTarget.textContent = message;
  iconTarget.textContent = icons[feedbackType];
  rewardTarget.textContent = reward;
  detailTarget.textContent = detail;
  metaTarget.hidden = !reward && !detail;
  rewardTarget.hidden = !reward;
  detailTarget.hidden = !detail;
  toast.dataset.feedbackType = feedbackType;
  toast.hidden = false;
  toast.classList.remove('show');
  window.requestAnimationFrame(() => {
    toast.classList.add('show');
    celebrationTimer = window.setTimeout(hideCelebration, feedbackType === 'progress' ? 6000 : 4800);
  });
  if (['success', 'progress'].includes(feedbackType)) {
    if (window.matchMedia('(max-width: 760px)').matches) hideSaveReceipt();
    else showSaveReceipt(title, message, detail);
  }
}

function nextStepForFeedback(title = '') {
  const normalized = String(title).toLocaleLowerCase('pt-BR');
  if (/perfil|mapa bem|esportivo concluído/.test(normalized)) return { view: 'progresso', label: 'Ver meu próximo passo →' };
  if (/plano do dia|prioridade|lembrete/.test(normalized)) return { view: 'registrar', label: 'Registrar o que aconteceu →' };
  if (/atividade|meu hoje|pausa|registro/.test(normalized)) return { view: 'progresso', label: 'Ver minha evolução →' };
  if (/tarefa|aliment|refeição/.test(normalized)) return { view: 'inicio', label: 'Continuar no Meu Hoje →' };
  return { view: currentProfile?.objective ? 'inicio' : 'jornada', label: currentProfile?.objective ? 'Continuar no Meu Hoje →' : 'Criar meu caminho →' };
}

function showSaveReceipt(title, message, detail = '') {
  const receipt = document.getElementById('fb-save-receipt');
  const receiptTitle = document.getElementById('fb-save-receipt-title');
  const receiptMessage = document.getElementById('fb-save-receipt-message');
  const nextButton = document.getElementById('fb-save-receipt-next');
  if (!receipt || !receiptTitle || !receiptMessage || !nextButton) return;
  const next = nextStepForFeedback(title);
  receiptTitle.textContent = title || 'Tudo certo. Seus dados foram salvos.';
  receiptMessage.textContent = [message, detail].filter(Boolean).join(' · ') || 'Seu painel já foi atualizado.';
  nextButton.dataset.nextView = next.view;
  nextButton.textContent = next.label;
  receipt.hidden = false;
  window.clearTimeout(saveReceiptHideTimer);
  saveReceiptHideTimer = window.setTimeout(hideSaveReceipt, 7000);
  const submitter = activeSaveSubmitter || (document.activeElement?.matches?.('button, input[type="submit"]') ? document.activeElement : null);
  if (submitter) {
    const idleLabel = submitter.dataset.saveIdleLabel || submitter.textContent.trim();
    submitter.dataset.saveIdleLabel = idleLabel;
    submitter.textContent = 'Salvo';
    submitter.classList.add('fb-save-confirmed');
    window.clearTimeout(saveButtonRestoreTimer);
    saveButtonRestoreTimer = window.setTimeout(() => {
      submitter.textContent = idleLabel;
      submitter.classList.remove('fb-save-confirmed');
    }, 2600);
  }
}

function showCelebration(title, message, options = {}) {
  showProductFeedback({ type: 'success', title, message, ...options });
}

function buildLocalInteraction(type, context, fallback) {
  return window.BeKnowledgeLibrary?.buildInteraction?.(type, context) || fallback;
}

window.addEventListener('meuCaminhoBe:feedback', event => showProductFeedback(event.detail || {}));

document.getElementById('fb-celebration-close')?.addEventListener('click', hideCelebration);
document.addEventListener('submit', event => {
  const submitter = event.submitter;
  if (!submitter || !/salvar|registrar|concluir|atualizar/i.test(submitter.textContent || submitter.value || '')) return;
  activeSaveSubmitter = submitter;
  const idleLabel = submitter.dataset.saveIdleLabel || submitter.textContent.trim();
  submitter.dataset.saveIdleLabel = idleLabel;
  submitter.textContent = 'Salvando…';
  window.setTimeout(() => {
    if (activeSaveSubmitter === submitter) activeSaveSubmitter = null;
    if (!submitter.classList.contains('fb-save-confirmed') && submitter.textContent === 'Salvando…') submitter.textContent = idleLabel;
  }, 5000);
}, true);
document.getElementById('fb-save-receipt-next')?.addEventListener('click', event => {
  const view = event.currentTarget.dataset.nextView || 'inicio';
  openView(view);
  hideSaveReceipt();
});

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

function sanitizeDailyPlan(plan) {
  if (!plan || typeof plan !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(plan.date || ''))) return null;
  if (!Object.hasOwn(dailyIntentions, plan.intention)) return null;
  const cleanDateTime = value => {
    const text = String(value || '').slice(0, 40);
    return text && !Number.isNaN(new Date(text).getTime()) ? text : '';
  };
  return {
    date: String(plan.date), intention: plan.intention,
    arrival: ['ready', 'short', 'tired', 'returning', 'present'].includes(plan.arrival) ? plan.arrival : '',
    activity: Object.hasOwn(dayPlanActivityLabels, plan.activity) ? plan.activity : '',
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(plan.time || '')) ? String(plan.time) : '',
    duration: Math.min(600, Math.max(0, Math.round(Number(plan.duration) || 0))),
    note: String(plan.note || '').trim().slice(0, 100),
    status: ['planned', 'done', 'snoozed'].includes(plan.status) ? plan.status : 'planned',
    selectedAt: cleanDateTime(plan.selectedAt) || new Date().toISOString(),
    remindAt: cleanDateTime(plan.remindAt), notifiedAt: cleanDateTime(plan.notifiedAt),
    completedAt: cleanDateTime(plan.completedAt)
  };
}

function sanitizeWeeklyReview(review) {
  if (!review || typeof review !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(review.weekStart || ''))) return null;
  if (!['horario', 'companhia', 'curta', 'descanso', 'planejamento', 'outro'].includes(review.helper)) return null;
  if (!Object.hasOwn(weeklyDecisionLabels, review.decision)) return null;
  return {
    weekStart: String(review.weekStart),
    helper: review.helper,
    decision: review.decision,
    registeredActions: Math.max(0, Math.min(7, Number(review.registeredActions) || 0)),
    updatedAt: String(review.updatedAt || new Date().toISOString()).slice(0, 40)
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
    && profile.safety.consentVersion === SAFETY_CONSENT_VERSION
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
  const feedback = document.getElementById('fb-safety-feedback');
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
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

async function resetLocalJourney() {
  clearBeNowExecution();
  const resetButton = document.getElementById('fb-reset-confirm');
  if (resetButton) { resetButton.disabled = true; resetButton.textContent = 'Zerando…'; }
  try {
    await window.BePublicProfile?.deleteProfile?.();
  } catch (error) {
    showProductFeedback({ type: 'warning', title: 'Não foi possível retirar sua página pública.', message: 'Conecte-se à internet e tente novamente antes de apagar os dados deste aparelho.' });
    if (resetButton) { resetButton.disabled = false; resetButton.textContent = 'Sim, zerar e recomeçar'; }
    return;
  }
  try {
    const localKeys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (/^meuCaminhoBe/i.test(String(key || ''))) localKeys.push(key);
    }
    localKeys.forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem(BE_NOW_TIMER_KEY);
    const remainingJourneyKeys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (/^meuCaminhoBe/i.test(String(key || ''))) remainingJourneyKeys.push(key);
    }
    if (remainingJourneyKeys.length) throw new Error('reset-incomplete');
  } catch (error) {
    showProductFeedback({ type: 'warning', title: 'Não foi possível apagar todos os dados.', message: 'Verifique as permissões de armazenamento do navegador e tente novamente.' });
    if (resetButton) { resetButton.disabled = false; resetButton.textContent = 'Sim, zerar e recomeçar'; }
    return;
  }
  currentProfile = null;
  const status = document.getElementById('fb-checkin-status');
  const note = document.getElementById('fb-checkin-note');
  if (status) status.value = '';
  if (note) note.value = '';
  resultsContainer?.replaceChildren();
  if (answerStatus) answerStatus.textContent = '';
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:reset'));
  closeDialog(document.getElementById('fb-daily-welcome'));
  closeDialog(document.getElementById('fb-reset-dialog'));
  closeMobileDrawer(false);
  try { sessionStorage.setItem('meuCaminhoBeResetNotice', '1'); } catch (error) {}
  window.location.replace(APP_BASE_PATH);
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

function renderSectionBanner(primarySection) {
  const banner = document.getElementById('be-section-banner');
  const content = sectionBannerContent[primarySection];
  if (!banner) return;
  banner.hidden = !content;
  if (!content) {
    delete banner.dataset.section;
    return;
  }
  banner.dataset.section = primarySection;
  document.getElementById('be-section-banner-kicker').textContent = content.kicker;
  document.getElementById('be-section-banner-title').textContent = content.title;
  document.getElementById('be-section-banner-text').textContent = content.text;
  document.getElementById('be-section-banner-mark').textContent = content.mark;
}

function openView(requestedView, options = {}) {
  if (isMinorRestrictedProfile() && ['jornada', 'progresso', 'perfil'].includes(requestedView)) requestedView = 'inicio';
  const view = resolveView(requestedView);
  const activePanel = panels.find(panel => panel.dataset.fbPanel === view);
  const isShellPanel = Boolean(activePanel);
  const primarySection = primarySectionForView[view] || 'inicio';

  panels.forEach(panel => {
    const selected = panel.dataset.fbPanel === view;
    panel.hidden = !selected;
    panel.classList.toggle('active', selected);
  });

  managedSections.forEach(section => section.classList.remove('fb-app-visible'));
  (viewTargets[view] || []).forEach(selector => {
    document.querySelector(selector)?.classList.add('fb-app-visible');
  });

  shell.classList.toggle('fb-app-shell-compact', view !== 'inicio');
  document.body.classList.forEach(className => {
    if (className.startsWith('fb-view-')) document.body.classList.remove(className);
  });
  document.body.classList.add(`fb-view-${view}`);
  renderSectionBanner(primarySection);

  appNavButtons.forEach(button => {
    const selected = button.dataset.fbView === primarySection;
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  mobileDrawerViewButtons.forEach(button => {
    const selected = button.dataset.fbView === primarySection;
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (options.scroll !== false) {
    const destination = isShellPanel
      ? (view === 'inicio' ? shell : activePanel)
      : document.querySelector(viewTargets[view][0]);
    destination?.scrollIntoView({ behavior: options.instant ? 'auto' : 'smooth', block: 'start' });
  }

  if (options.route !== false) updateAppRoute(view, options.replaceRoute === true);
  const [viewLabel, headingSelector] = viewPresentation[view] || ['Meu Caminho Be', ''];
  document.title = `${viewLabel} | Meu Caminho Be`;
  const announcer = document.getElementById('fb-view-announcer');
  if (announcer) announcer.textContent = `Tela ${viewLabel} aberta.`;
  if (options.focus !== false) {
    const heading = headingSelector ? document.querySelector(headingSelector) : null;
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      window.setTimeout(() => {
        heading.focus({ preventScroll: true });
        heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
      }, options.instant ? 0 : 180);
    }
  }
  return true;
}

function normalizeAppPath(pathname = location.pathname) {
  const normalized = String(pathname || '').replace(/\.html$/i, '').replace(/\/+$/, '');
  return normalized || '/';
}

function viewFromAppPath(pathname = location.pathname) {
  const path = normalizeAppPath(pathname);
  if (path === APP_BASE_PATH) return 'inicio';
  if (path === `${APP_BASE_PATH}/jornada`) return 'progresso';
  const match = Object.entries(appPathForView).find(([, routePath]) => routePath === path);
  return match?.[0] || null;
}

function updateAppRoute(view, replace = false) {
  const routePath = view === 'jornada' && !currentProfile?.objective
    ? `${APP_BASE_PATH}/jornada`
    : appPathForView[view];
  if (!routePath || location.protocol === 'file:') return;
  const url = new URL(location.href);
  url.hash = '';
  url.pathname = routePath;
  url.searchParams.delete('tela');
  if (url.href === location.href) return;
  history[replace ? 'replaceState' : 'pushState']({ meuCaminhoView: view }, '', url);
}

function openViewFromRoute() {
  const url = new URL(location.href);
  const legacyRoute = url.searchParams.get('tela');
  const legacyView = legacyRoute === 'jornada' && !currentProfile?.objective ? 'jornada' : legacyViewForRoute[legacyRoute];
  const view = legacyView || viewFromAppPath(url.pathname);
  if (!view) return false;
  openView(view, { scroll: false, focus: false, instant: true, route: false });
  if (legacyRoute) updateAppRoute(view, true);
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
  button.addEventListener('click', event => {
    if (button instanceof HTMLAnchorElement) event.preventDefault();
    if (button.dataset.fbDailyAction === 'true') {
      openDailyJournal();
      return;
    }
    openView(button.dataset.fbView);
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
  const nodes = [...document.querySelectorAll('.article-grid .post, .journey-guidance-card, .professional-voice')];
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
  const barrierGuidance = {
    tempo: 'Como faltou tempo, escolha uma versão mais curta e defina antes em qual momento ela cabe.',
    energia: 'Como energia ou recuperação dificultaram, mantenha uma versão leve e observe sua resposta antes de avançar.',
    dificuldade: 'Como o passo estava difícil, reduza somente tempo, intensidade ou complexidade.',
    acesso: 'Como houve uma barreira de acesso, escolha uma alternativa que use o local e os recursos disponíveis.',
    apoio: 'Como companhia ou apoio fizeram falta, combine o momento com alguém ou escolha uma opção que você consiga iniciar com segurança.',
    desconforto: 'Como houve dor, desconforto ou insegurança, não avance agora. Interrompa diante de sinais importantes e procure orientação profissional.',
    outro: 'Use o que você registrou para escolher uma versão menor e possível antes de tentar novamente.'
  };
  if (previous?.barrier && barrierGuidance[previous.barrier]) return barrierGuidance[previous.barrier];
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

function recordJourneyStep({ status, note, barrier = '', source = 'journey' } = {}) {
  if (journeyStepSaving) return { ok: false, reason: 'saving' };
  if (!currentProfile?.objective) return { ok: false, reason: 'no-journey' };
  if (isSafetyPending() || isSafetyRestricted()) return { ok: false, reason: 'safety' };
  const normalizedStatus = ['concluida', 'parcial', 'ajustar'].includes(status) ? status : '';
  const normalizedNote = String(note || '').trim().slice(0, 500);
  const normalizedBarrier = ['parcial', 'ajustar'].includes(normalizedStatus) ? String(barrier || '') : '';
  if (!normalizedStatus || normalizedNote.length < 3 || (['parcial', 'ajustar'].includes(normalizedStatus) && !checkinBarrierLabels[normalizedBarrier])) {
    return { ok: false, reason: 'invalid' };
  }

  const completed = getCompletedSteps();
  const steps = getJourneySteps();
  if (completed >= steps.length) return { ok: false, reason: 'cycle-complete' };
  const completedStep = steps[completed];
  const pausedForSafety = normalizedBarrier === 'desconforto';
  const nextProgress = pausedForSafety ? completed : completed + 1;
  const nextStep = pausedForSafety ? completedStep : steps[nextProgress] || '';
  const checkins = [...(currentProfile.checkins || []), {
    step: completedStep,
    status: normalizedStatus,
    barrier: normalizedBarrier,
    note: normalizedNote,
    source,
    completedAt: new Date().toISOString()
  }];
  const archivedCheckinCount = (currentProfile?.cycles || []).reduce((total, cycle) => total + (Array.isArray(cycle?.checkins) ? cycle.checkins.length : 0), 0);
  const previousCheckinTotal = Math.max(Number(currentProfile?.gamificationStats?.completedCheckins || 0), archivedCheckinCount + (currentProfile?.checkins || []).length);
  const gameBeforeCheckin = getGamificationState();
  lastBeNowTransition = { completedStep, nextStep, cycleComplete: !nextStep, pausedForSafety };
  journeyStepSaving = true;
  clearBeNowExecution();
  saveProfile({
    progress: nextProgress,
    checkins,
    gamificationStats: { ...(currentProfile?.gamificationStats || {}), completedCheckins: previousCheckinTotal + 1 }
  });
  const gameAfterCheckin = getGamificationState();
  window.setTimeout(() => { journeyStepSaving = false; }, 250);
  showCelebration(
    pausedForSafety ? 'Etapa pausada com segurança' : gameAfterCheckin.level > gameBeforeCheckin.level ? 'Seu nível aumentou!' : (nextStep ? 'Passo concluído!' : 'Ciclo concluído!'),
    pausedForSafety ? 'Dor, desconforto ou insegurança pedem orientação antes de continuar.' : nextStep ? `Próximo passo liberado: ${nextStep}.` : 'Seu ciclo foi concluído e ficou salvo.',
    { type: pausedForSafety ? 'warning' : 'progress', reward: pausedForSafety ? '' : '+50 XP', detail: pausedForSafety ? 'Seu progresso foi preservado.' : nextStep || `${gameAfterCheckin.xp} XP no total` }
  );
  window.dispatchEvent(new CustomEvent('bemEsportivo:analytics', {
    detail: { name: 'journey_checkin', detail: `${source}:${normalizedBarrier || normalizedStatus}` }
  }));
  return { ok: true, completedStep, nextStep, cycleComplete: !nextStep, pausedForSafety };
}

function updateProgressActionState() {
  const button = document.getElementById('fb-complete-step');
  const newCycleButton = document.getElementById('fb-new-cycle');
  const calendarButton = document.getElementById('fb-calendar-next');
  const checkin = document.getElementById('fb-progress-checkin');
  const status = document.getElementById('fb-checkin-status');
  const note = document.getElementById('fb-checkin-note');
  const barrier = document.getElementById('fb-checkin-barrier');
  const barrierField = document.getElementById('fb-checkin-barrier-field');
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
  const needsBarrier = ['parcial', 'ajustar'].includes(status?.value);
  if (barrierField) barrierField.hidden = !needsBarrier;
  if (barrier) {
    barrier.disabled = !requiresCheckin || !needsBarrier;
    barrier.required = needsBarrier;
    if (!needsBarrier) barrier.value = '';
  }
  const hasValidData = Boolean(form?.checkValidity() && status?.value && (note?.value.trim().length || 0) >= 3 && (!needsBarrier || barrier?.value));
  button.disabled = !currentProfile?.objective || cycleComplete || safetyRestricted || safetyPending || !hasValidData;
  button.setAttribute('aria-disabled', String(button.disabled));
  if (help && requiresCheckin) {
    help.classList.toggle('ready', hasValidData);
    help.textContent = !status?.value
      ? 'Selecione como foi esta etapa para continuar.'
      : needsBarrier && !barrier?.value
        ? 'Selecione o principal motivo para receber um próximo passo mais adequado.'
      : (note?.value.trim().length || 0) < 3
        ? 'Agora escreva uma observação com pelo menos 3 caracteres.'
        : 'Tudo certo. O botão está liberado para registrar e concluir.';
  }
}

function getProfileDiaryEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1') || '[]');
    return Array.isArray(entries) ? entries.filter(entry => entry && typeof entry === 'object') : [];
  } catch {
    return [];
  }
}

function profileHandle(name = '') {
  const normalized = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '').slice(0, 24);
  return `@${normalized || 'meucaminhobe'}`;
}

function profileTimeLabel(createdAt) {
  const created = new Date(createdAt || '');
  if (Number.isNaN(created.getTime())) return 'Hoje';
  const days = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
  if (days < 1) return 'Hoje';
  if (days < 30) return `${days} dia${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

function renderProfilePresentation() {
  const presentation = document.getElementById('be-profile-presentation');
  const form = document.getElementById('fb-profile-form');
  const cancelButton = document.getElementById('be-profile-cancel-edit');
  if (!presentation || !form) return;
  const name = String(currentProfile?.name || '').trim();
  const email = String(currentProfile?.email || '').trim();
  const hasSavedProfile = name.length >= 2 && Boolean(email);
  presentation.hidden = !hasSavedProfile;
  form.hidden = hasSavedProfile && !profileEditMode;
  if (cancelButton) cancelButton.hidden = !hasSavedProfile;
  if (!hasSavedProfile) return;

  const sportProfile = getSportProfile();
  const location = [currentProfile?.location?.city, currentProfile?.location?.state].filter(Boolean).join(' · ');
  const diary = getProfileDiaryEntries();
  const activeDays = new Set(diary.map(entry => entry.date).filter(Boolean)).size;
  const sports = new Set([sportProfile.modality, ...diary.map(entry => entry.type)].filter(Boolean)).size || 1;
  const photo = sanitizeProfilePhoto(currentProfile?.photoDataUrl);
  const photoElement = document.getElementById('be-profile-card-photo');
  const fallback = document.getElementById('be-profile-card-fallback');
  if (photoElement) {
    photoElement.hidden = !photo;
    if (photo) photoElement.src = photo;
    else photoElement.removeAttribute('src');
  }
  if (fallback) {
    fallback.hidden = Boolean(photo);
    fallback.textContent = name.charAt(0).toLocaleUpperCase('pt-BR') || 'BE';
  }
  document.getElementById('be-profile-display-name').textContent = name;
  document.getElementById('be-profile-display-handle').textContent = profileHandle(name);
  document.getElementById('be-profile-display-bio').textContent = sanitizeProfileStory(currentProfile?.story) || `${sportProfile.modalityLabel}${sportProfile.roleLabel ? ` · ${sportProfile.roleLabel}` : ''}. O esporte faz parte da minha história.`;
  document.getElementById('be-profile-stat-records').textContent = String(diary.length);
  document.getElementById('be-profile-stat-days').textContent = String(activeDays);
  document.getElementById('be-profile-stat-sports').textContent = String(sports);
  document.getElementById('be-profile-stat-since').textContent = profileTimeLabel(currentProfile?.createdAt);
  const tags = document.getElementById('be-profile-display-tags');
  if (tags) {
    const values = [sportProfile.modalityLabel, sportProfile.roleLabel, location].filter(Boolean);
    tags.replaceChildren(...values.map(value => {
      const tag = document.createElement('span');
      tag.textContent = value;
      return tag;
    }));
  }
  const status = document.getElementById('be-profile-presentation-status');
  if (status) status.textContent = currentProfile?.updatedAt
    ? `Perfil atualizado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(currentProfile.updatedAt))}. Seus dados permanecem neste aparelho.`
    : 'Perfil salvo neste aparelho.';
}

function renderProfileSummary() {
  const container = document.getElementById('fb-profile-summary');
  const nextStep = document.getElementById('fb-profile-next-step');
  if (nextStep) nextStep.hidden = !isSafetyRestricted();
  if (!container) return;
  syncProfileFormValues();
  renderProfilePresentation();
  const sportProfile = getSportProfile();
  const hasBaseIdentity = Boolean(currentProfile?.name?.trim() || currentProfile?.email || currentProfile?.objective || sportProfile.role || sportProfile.modality !== 'outro');
  if (!hasBaseIdentity) {
    const message = document.createElement('p');
    message.textContent = 'Comece pelo nome e pela modalidade principal para formar a base do perfil.';
    container.replaceChildren(message);
    return;
  }
  const fields = [
    ['NOME', currentProfile.name || 'Não informado'],
    ['E-MAIL', currentProfile.email || 'Não informado'],
    ['MODALIDADE', sportProfile.modalityLabel],
    ['FUNÇÃO', sportProfile.roleLabel],
    ['IDENTIDADE VISUAL', sportProfile.visualLabel],
    ['MÉTRICA BASE', sportProfile.metric]
  ];
  if (currentProfile?.location?.city || currentProfile?.location?.state) fields.splice(2, 0, ['LOCAL', [currentProfile.location.city, currentProfile.location.state].filter(Boolean).join(' · ')]);
  if (currentProfile?.objective) fields.push(['OBJETIVO', objectiveLabels[currentProfile.objective] || 'Seu caminho']);
  if (currentProfile?.practiceName || currentProfile?.practiceLabel) fields.push(['PRÁTICA ATUAL', currentProfile.practiceName || currentProfile.practiceLabel]);
  if (currentProfile?.ageLabel) fields.push(['MOMENTO', currentProfile.ageLabel]);
  if (currentProfile?.availabilityLabel) fields.push(['TEMPO', currentProfile.availabilityLabel]);
  fields.push(['SEGURANÇA', isSafetyRestricted() ? 'Revisão profissional recomendada' : currentProfile.safety?.consent ? 'Contexto concluído' : 'Contexto pendente']);
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

function syncProfileFormValues() {
  const nameInput = document.getElementById('fb-profile-name');
  const emailInput = document.getElementById('fb-profile-email');
  const cityInput = document.getElementById('fb-profile-city');
  const stateInput = document.getElementById('fb-profile-state');
  const ageInput = document.getElementById('fb-profile-age');
  const professionInput = document.getElementById('fb-profile-profession');
  const publicInput = document.getElementById('fb-profile-public-enabled');
  const publicConsentInput = document.getElementById('fb-profile-public-consent');
  const sportInput = document.getElementById('fb-profile-sport');
  const roleInput = document.getElementById('fb-profile-role');
  const visualInput = document.getElementById('fb-profile-visual');
  const storyInput = document.getElementById('fb-profile-story');
  const storyCount = document.getElementById('fb-profile-story-count');
  const sportProfile = getSportProfile();
  if (nameInput && document.activeElement !== nameInput) nameInput.value = currentProfile?.name || '';
  if (emailInput && document.activeElement !== emailInput) emailInput.value = currentProfile?.email || '';
  if (cityInput && document.activeElement !== cityInput) cityInput.value = currentProfile?.location?.city || '';
  if (stateInput && document.activeElement !== stateInput) stateInput.value = currentProfile?.location?.state || '';
  if (ageInput && document.activeElement !== ageInput) ageInput.value = currentProfile?.publicAge || '';
  if (professionInput && document.activeElement !== professionInput) professionInput.value = currentProfile?.profession || '';
  if (publicInput && document.activeElement !== publicInput) publicInput.checked = currentProfile?.publicEnabled === true;
  if (publicConsentInput && document.activeElement !== publicConsentInput) publicConsentInput.checked = currentProfile?.publicTermsAccepted === true && currentProfile?.publicTermsVersion === PUBLIC_PROFILE_TERMS_VERSION;
  const publicConsentWrap = document.getElementById('fb-profile-public-consent-wrap');
  if (publicConsentWrap) publicConsentWrap.hidden = !publicInput?.checked;
  if (sportInput && document.activeElement !== sportInput) sportInput.value = sportProfile.modality;
  if (roleInput && document.activeElement !== roleInput) roleInput.value = sportProfile.roleLabel === sportProfile.fallbackRole ? '' : sportProfile.roleLabel;
  if (visualInput && document.activeElement !== visualInput) visualInput.value = sportProfile.visual;
  if (storyInput && document.activeElement !== storyInput) storyInput.value = sanitizeProfileStory(currentProfile?.story);
  if (storyCount) storyCount.textContent = String(storyInput?.value.length || 0);
  renderProfilePhoto();
}

function renderProfilePhoto(photo = pendingProfilePhoto === undefined ? currentProfile?.photoDataUrl : pendingProfilePhoto) {
  const cleanPhoto = sanitizeProfilePhoto(photo);
  const preview = document.getElementById('fb-profile-photo-preview');
  const fallback = document.getElementById('fb-profile-photo-fallback');
  const removeButton = document.getElementById('fb-profile-photo-remove');
  const avatar = shell.querySelector('.fb-app-avatar');
  const initial = currentProfile?.name?.trim()?.charAt(0).toLocaleUpperCase('pt-BR') || 'BE';
  if (preview) {
    preview.hidden = !cleanPhoto;
    if (cleanPhoto) preview.src = cleanPhoto;
    else preview.removeAttribute('src');
  }
  if (fallback) {
    fallback.hidden = Boolean(cleanPhoto);
    fallback.textContent = initial;
  }
  if (removeButton) removeButton.hidden = !cleanPhoto;
  if (!avatar) return;
  avatar.classList.toggle('has-photo', Boolean(cleanPhoto));
  avatar.style.backgroundImage = cleanPhoto ? `url("${cleanPhoto}")` : '';
  if (!cleanPhoto) avatar.textContent = initial;
}

async function resizeProfilePhoto(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    throw new Error('invalid-photo');
  }
  let bitmap;
  let objectUrl = '';
  if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file);
  else {
    objectUrl = URL.createObjectURL(file);
    bitmap = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = objectUrl;
    });
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const sourceX = (bitmap.width - side) / 2;
  const sourceY = (bitmap.height - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 360;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  const photo = canvas.toDataURL('image/jpeg', 0.82);
  if (!sanitizeProfilePhoto(photo)) throw new Error('photo-too-large');
  return photo;
}

function formatGoalDate(value) {
  if (!value) return 'Agora';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function renderGoalTracker() {
  const tracker = getGoalTracker();
  const summaryTarget = document.getElementById('fb-goals-summary');
  const totalTarget = document.getElementById('fb-goals-total');
  const updatedTarget = document.getElementById('fb-goals-updated');
  const historyCountTarget = document.getElementById('fb-goals-history-count');
  const historyList = document.getElementById('fb-goals-history-list');
  const startInput = document.getElementById('fb-goals-start');
  const dateInput = document.getElementById('fb-goals-date');
  const teamInput = document.getElementById('fb-goals-team');
  if (totalTarget) totalTarget.textContent = String(tracker.total);
  if (summaryTarget) {
    const addedGoals = tracker.history.reduce((total, entry) => total + Math.max(0, Number(entry.added || 0)), 0);
    summaryTarget.textContent = tracker.history.length
      ? `Você começou com ${tracker.baseline} e já somou ${addedGoals} gol${addedGoals === 1 ? '' : 's'} aqui.`
      : tracker.baseline > 0
        ? `Base salva: ${tracker.baseline} gol${tracker.baseline === 1 ? '' : 's'}. Agora registre o primeiro gol neste aparelho.`
        : 'Informe seu total inicial para começar a acompanhar os próximos gols.';
  }
  if (updatedTarget) updatedTarget.textContent = tracker.updatedAt ? formatGoalDate(tracker.updatedAt) : 'Ainda sem registro';
  if (historyCountTarget) historyCountTarget.textContent = tracker.history.length
    ? `${tracker.history.length} registro${tracker.history.length === 1 ? '' : 's'}`
    : 'Nenhum registro ainda';
  if (historyList) {
    historyList.replaceChildren(...tracker.history.slice().reverse().map((entry, displayIndex) => {
      const actualIndex = tracker.history.length - 1 - displayIndex;
      const item = document.createElement('li');
      const content = document.createElement('div');
      const amount = document.createElement('strong');
      const meta = document.createElement('span');
      const actions = document.createElement('div');
      const editButton = document.createElement('button');
      const deleteButton = document.createElement('button');
      const dateText = entry.goalDate ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(`${entry.goalDate}T12:00:00`)) : formatGoalDate(entry.recordedAt);
      amount.textContent = `+${entry.added}`;
      meta.textContent = `${dateText}${entry.team ? ` · ${entry.team}` : ''} · total ${entry.total}`;
      actions.className = 'fb-goals-item-actions';
      editButton.type = 'button';
      editButton.textContent = 'Editar';
      editButton.dataset.goalAction = 'edit';
      editButton.dataset.goalIndex = String(actualIndex);
      deleteButton.type = 'button';
      deleteButton.textContent = 'Apagar';
      deleteButton.dataset.goalAction = 'delete';
      deleteButton.dataset.goalIndex = String(actualIndex);
      actions.append(editButton, deleteButton);
      content.className = 'fb-goals-item-content';
      content.append(amount, meta);
      item.append(content, actions);
      return item;
    }));
    if (!tracker.history.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Nenhum gol registrado ainda.';
      historyList.replaceChildren(empty);
    }
  }
  if (startInput && document.activeElement !== startInput) startInput.value = tracker.baseline ? String(tracker.baseline) : '';
  if (dateInput && document.activeElement !== dateInput && !dateInput.value) dateInput.value = localDayKey();
  if (teamInput && document.activeElement !== teamInput) teamInput.value = '';
}

function saveGoalTracker({ baseline, history, updatedAt } = {}) {
  const current = getGoalTracker();
  const now = new Date().toISOString();
  const nextBaseline = Number.isFinite(baseline) ? Math.max(0, Math.trunc(baseline)) : current.baseline;
  const nextHistory = Array.isArray(history) ? history : current.history;
  const rebuilt = rebuildGoalState(nextBaseline, nextHistory, current.total, updatedAt || now);
  saveProfile({
    sportStats: {
      goals: {
        baseline: rebuilt.baseline,
        total: rebuilt.total,
        updatedAt: rebuilt.updatedAt || now,
        history: rebuilt.history
      }
    }
  });
  renderGoalTracker();
  const feedback = document.getElementById('fb-profile-feedback');
  if (feedback) {
    feedback.textContent = rebuilt.history.length
      ? `Total atualizado. Agora você tem ${rebuilt.total} gol${rebuilt.total === 1 ? '' : 's'} registrados.`
      : `Total inicial salvo com ${nextBaseline} gol${nextBaseline === 1 ? '' : 's'}.`;
  }
  showCelebration(
    rebuilt.history.length ? 'Gols atualizados!' : 'Total inicial salvo!',
    rebuilt.history.length ? `O total atual agora é ${rebuilt.total} gol${rebuilt.total === 1 ? '' : 's'}.` : `O ponto de partida ficou salvo em ${nextBaseline} gol${nextBaseline === 1 ? '' : 's'}.`
  );
}

function addGoalMarker() {
  const current = getGoalTracker();
  const goalDate = document.getElementById('fb-goals-date')?.value || localDayKey();
  const team = document.getElementById('fb-goals-team')?.value.trim().slice(0, 60) || '';
  const now = new Date().toISOString();
  saveGoalTracker({
    baseline: current.baseline,
    history: [...current.history, { added: 1, recordedAt: now, goalDate, team }].slice(-60),
    updatedAt: now
  });
}

function editGoalMarker(index) {
  const current = getGoalTracker();
  const entry = current.history[index];
  if (!entry) return;
  const amountInput = window.prompt('Quantos gols foram neste registro?', String(entry.added || 1));
  if (amountInput === null) return;
  const amount = Math.max(1, Math.trunc(Number(amountInput)));
  if (!Number.isFinite(amount)) return;
  const dateInput = window.prompt('Data do gol (YYYY-MM-DD)', entry.goalDate || localDayKey());
  if (dateInput === null) return;
  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim()) ? dateInput.trim() : '';
  const teamInput = window.prompt('Time na partida', entry.team || '');
  if (teamInput === null) return;
  const updatedHistory = current.history.slice();
  updatedHistory[index] = {
    ...entry,
    added: amount,
    goalDate: normalizedDate,
    team: String(teamInput).trim().slice(0, 60)
  };
  saveGoalTracker({ baseline: current.baseline, history: updatedHistory, updatedAt: new Date().toISOString() });
}

function deleteGoalMarker(index) {
  const current = getGoalTracker();
  const entry = current.history[index];
  if (!entry) return;
  if (!window.confirm(`Apagar este registro de ${entry.added} gol${entry.added === 1 ? '' : 's'}?`)) return;
  const updatedHistory = current.history.filter((_, historyIndex) => historyIndex !== index);
  saveGoalTracker({ baseline: current.baseline, history: updatedHistory, updatedAt: new Date().toISOString() });
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

  const barrierCounts = records.reduce((counts, record) => {
    if (record.barrier && checkinBarrierLabels[record.barrier]) counts[record.barrier] = (counts[record.barrier] || 0) + 1;
    return counts;
  }, {});
  const mainBarrier = Object.entries(barrierCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const barrierInsight = document.createElement('p');
  barrierInsight.className = 'fb-cycle-barrier';
  barrierInsight.hidden = !mainBarrier;
  if (mainBarrier) barrierInsight.textContent = `Principal barreira registrada: ${checkinBarrierLabels[mainBarrier]}. Use esse dado para escolher somente um ajuste no próximo ciclo.`;

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

  summary.replaceChildren(header, metrics, barrierInsight, recap, evidence);
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
      strong.textContent = safetyPending ? 'Complete o questionário de contexto e segurança antes de continuar.' : 'Sua segurança vem antes do progresso.';
      text.textContent = safetyPending
        ? 'São três pontos rápidos para adaptar sua jornada e verificar se existe algum sinal que exige orientação profissional.'
        : 'Os sinais informados pedem avaliação profissional antes de iniciar ou retomar exercícios. Sua jornada está preservada e poderá continuar depois da revisão.';
      action.type = 'button';
      action.textContent = safetyPending ? 'Responder contexto e segurança' : 'Revisar contexto e segurança';
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
      const todayIsRegistered = getDailyLogs().some(item => item.date === localDayKey());
      nextMission.classList.toggle('fb-prioritize-today', !todayIsRegistered);
      document.getElementById('fb-next-mission-kicker').textContent = todayIsRegistered
        ? 'MEU HOJE ATUALIZADO · CONTINUE SUA JORNADA'
        : 'PERFIL CONCLUÍDO · COMECE PELO MEU HOJE';
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
      document.getElementById('fb-next-mission-today').textContent = todayIsRegistered ? 'Atualizar Meu Hoje' : 'Atualizar Meu Hoje agora';
      document.getElementById('fb-next-mission-note').textContent = todayIsRegistered
        ? 'Seu registro de hoje está atualizado. Agora você pode avançar para a primeira missão.'
        : 'Comece pelo Meu Hoje para ativar seu painel. Depois, siga para a missão quando quiser.';
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

function renderEvolution() {
  const panel = document.querySelector('[data-fb-panel="evolucao"]');
  if (!panel) return;
  const logs = getDailyLogs().slice().sort((a, b) => a.date.localeCompare(b.date));
  const game = getGamificationState();
  const weekStart = startOfLocalWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const registeredThisWeek = new Set(logs.filter(log => {
    const date = new Date(`${log.date}T12:00:00`);
    return date >= weekStart && date < weekEnd;
  }).map(log => log.date)).size;
  const weeklyPercent = Math.min(100, Math.round(registeredThisWeek / 3 * 100));

  document.getElementById('fb-evolution-week').textContent = `${weeklyPercent}%`;
  document.getElementById('fb-evolution-streak').textContent = `${game.streak} dia${game.streak === 1 ? '' : 's'}`;
  document.getElementById('fb-evolution-logs').textContent = String(new Set(logs.map(log => log.date)).size);
  document.getElementById('fb-evolution-level').textContent = String(game.level);
  document.getElementById('fb-evolution-level-name').textContent = game.levelName;

  const logsByDate = new Map(logs.map(log => [log.date, log]));
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = localDayKey(date);
    const log = logsByDate.get(key);
    const active = Boolean(log);
    const activity = log?.activity === 'none' ? 'Pausa' : log?.activity ? dailyActivityLabels[log.activity] || 'Atividade' : 'Sem registro';
    const day = document.createElement('div');
    day.className = 'fb-evolution-day';
    day.dataset.active = String(active);
    day.style.setProperty('--fb-day-level', active ? log.activity === 'none' ? '38%' : '88%' : '12%');
    day.setAttribute('aria-label', `${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}: ${activity}`);
    const bar = document.createElement('i');
    bar.setAttribute('aria-hidden', 'true');
    const label = document.createElement('strong');
    label.textContent = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const number = document.createElement('small');
    number.textContent = String(date.getDate());
    day.append(bar, label, number);
    days.push(day);
  }
  document.getElementById('fb-evolution-days').replaceChildren(...days);

  const insightTitle = document.getElementById('fb-evolution-insight-title');
  const insightText = document.getElementById('fb-evolution-insight-text');
  if (!logs.length) {
    insightTitle.textContent = 'Seu primeiro registro inicia a evolução.';
    insightText.textContent = 'Registre como foi seu dia. A partir daí, esta tela começa a mostrar sequência, ritmo semanal e conquistas.';
  } else if (registeredThisWeek >= 3) {
    insightTitle.textContent = 'Sua semana já tem uma base de constância.';
    insightText.textContent = `Você registrou ${registeredThisWeek} dias nesta semana. Agora vale manter o ritmo possível e observar o que ajuda você a continuar.`;
  } else if (game.streak > 1) {
    insightTitle.textContent = `Você construiu uma sequência de ${game.streak} dias.`;
    insightText.textContent = 'A sequência mostra presença, não intensidade. Dias leves e descanso também fazem parte de uma evolução sustentável.';
  } else {
    insightTitle.textContent = 'Seu histórico começou a ganhar forma.';
    insightText.textContent = 'Continue registrando sem buscar perfeição. Três dias na semana já criam uma visão mais útil do seu ritmo.';
  }
}

function getHomeIdentityLabel(profile = currentProfile, game = getGamificationState(profile)) {
  if (profile?.sportDiscovery?.completedAt) return 'Explorador';
  if (profile?.objective) return game.levelName;
  return 'Primeiro passo';
}

function buildHomeNextActions(profile = currentProfile, todayLog = null, nextMission = '', completed = 0) {
  const mealCount = Object.values(todayLog?.meals || {}).filter(Boolean).length;
  return [
    { label: todayLog?.activity && todayLog.activity !== 'none' ? dailyActivityLabels[todayLog.activity] : 'Registrar meu dia', note: todayLog?.activity && todayLog.activity !== 'none' ? `${todayLog.minutes} min registrados` : 'Ainda não registrado', done: Boolean(todayLog?.activity && todayLog.activity !== 'none') },
    { label: 'Hidratação', note: todayLog?.water !== null ? `${String(todayLog.water).replace('.', ',')} L` : 'Ainda sem água informada', done: todayLog?.water !== null },
    { label: 'Próximo passo', note: nextMission || (mealCount ? `${mealCount} refeição${mealCount === 1 ? '' : 'ões'} registradas` : 'Seu próximo passo aparece aqui'), done: completed >= getJourneySteps(profile).length }
  ];
}

function renderHomeDashboard() {
  const section = document.getElementById('fb-home-dashboard');
  if (!section) return;
  const hasJourney = Boolean(currentProfile?.objective);
  section.hidden = !hasJourney;
  if (!hasJourney) return;

  const logs = getDailyLogs().slice().sort((a, b) => a.date.localeCompare(b.date));
  const weekStart = startOfLocalWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekLogs = logs.filter(item => {
    const date = new Date(`${item.date}T12:00:00`);
    return date >= weekStart && date < weekEnd;
  });
  const registeredDays = new Set(weekLogs.map(item => item.date)).size;
  const weeklyTarget = 3;
  const weeklyPercent = Math.min(100, Math.round(registeredDays / weeklyTarget * 100));
  const todayLog = logs.find(item => item.date === localDayKey());
  const latestLog = logs[logs.length - 1];
  const game = getGamificationState();
  const completed = getCompletedSteps();
  const steps = getJourneySteps();
  const nextMission = completed >= steps.length ? 'Seu ciclo está concluído. Revise a semana e escolha como continuar.' : steps[completed];
  const objectiveLabel = currentProfile?.objective ? objectiveLabels[currentProfile.objective] || 'Seu caminho' : 'Seu caminho';
  const identityLabel = getHomeIdentityLabel(currentProfile, game);
  const unlockedMedals = game.medals.filter(([, unlocked]) => unlocked).length;
  const levelXp = game.xp % 250;
  const levelPercent = Math.round(levelXp / 250 * 100);
  const asciiFilled = Math.max(0, Math.min(16, Math.round(levelPercent / 100 * 16)));
  const asciiBar = `${'█'.repeat(asciiFilled)}${'░'.repeat(16 - asciiFilled)}`;
  const remainingMissionCount = Math.max(0, steps.length - completed);
  const checklist = buildHomeNextActions(currentProfile, todayLog, nextMission, completed);

  const ring = document.getElementById('fb-home-progress-ring');
  ring.style.setProperty('--fb-home-progress', `${weeklyPercent}%`);
  ring.setAttribute('aria-label', `${weeklyPercent}% da meta semanal de registros`);
  document.getElementById('fb-home-week-percent').textContent = `${weeklyPercent}%`;
  document.getElementById('fb-home-week-count').textContent = `${registeredDays} de ${weeklyTarget} dias registrado${registeredDays === 1 ? '' : 's'}`;
  document.getElementById('fb-home-streak').textContent = `${game.streak} dia${game.streak === 1 ? '' : 's'}`;
  document.getElementById('fb-home-streak-message').textContent = game.streak
    ? 'Sua sequência mostra presença, não obrigação.'
    : 'Seu primeiro registro não precisa ser perfeito. Só precisa ser verdadeiro.';
  document.getElementById('fb-home-level').textContent = `Nível ${game.level}`;
  document.getElementById('fb-home-xp').textContent = `${game.xp} XP · ${game.levelName}`;
  document.getElementById('fb-home-dashboard-title').textContent = currentProfile?.name ? `Olá, ${currentProfile.name} 👋` : 'Olá 👋';
  document.getElementById('fb-home-return-message').textContent = currentProfile?.name
    ? `Este é o retrato do seu momento: ${identityLabel.toLocaleLowerCase('pt-BR')}, com o objetivo de ${objectiveLabel.toLocaleLowerCase('pt-BR')}.`
    : 'Este é o lugar para reconhecer seu momento e escolher como continuar.';
  document.getElementById('fb-home-hero-title').textContent = currentProfile?.name
    ? `${currentProfile.name}, cada registro ajuda você a entender a própria história.`
    : 'Cada registro ajuda você a entender a própria história.';
  document.getElementById('fb-home-hero-text').textContent = todayLog
    ? `Hoje já existe um registro. O painel abaixo está refletindo seu ritmo, sua sequência e seu próximo passo.`
    : `Complete um registro simples para ver progresso, sequência, nível e próximos passos mudarem em tempo real.`;
  document.getElementById('fb-home-ascii-bar').textContent = asciiBar;
  document.getElementById('fb-home-progress-note').textContent = remainingMissionCount
    ? `Faltam ${remainingMissionCount} atividade${remainingMissionCount === 1 ? '' : 's'} para concluir sua jornada atual.`
    : 'Sua jornada atual já foi concluída. Você pode começar um novo ciclo.';
  document.getElementById('fb-home-objective-label').textContent = objectiveLabel;
  document.getElementById('fb-home-identity-label').textContent = identityLabel;
  document.getElementById('fb-home-medals-label').textContent = `${unlockedMedals} aberta${unlockedMedals === 1 ? '' : 's'}`;

  if (latestLog) {
    document.getElementById('fb-home-last-title').textContent = latestLog.activity === 'none' ? 'Dia de pausa' : dailyActivityLabels[latestLog.activity];
    document.getElementById('fb-home-last-detail').textContent = latestLog.activity === 'none'
      ? formatDailyDate(latestLog.date, { day: 'numeric', month: 'short' })
      : `${latestLog.minutes} min · ${formatDailyDate(latestLog.date, { day: 'numeric', month: 'short' })}`;
  } else {
    document.getElementById('fb-home-last-title').textContent = 'Nenhum ainda';
    document.getElementById('fb-home-last-detail').textContent = 'Seu histórico aparecerá aqui.';
  }

  const primary = document.getElementById('fb-home-primary');
  primary.textContent = todayLog ? 'Atualizar Meu Hoje' : 'Registrar Meu Hoje';
  document.getElementById('fb-home-return-message').textContent = currentProfile?.name
    ? `Este é o retrato do seu momento: ${identityLabel.toLocaleLowerCase('pt-BR')}, com o objetivo de ${objectiveLabel.toLocaleLowerCase('pt-BR')}.`
    : 'Este é o lugar para reconhecer seu momento e escolher como continuar.';
  document.getElementById('fb-home-next-title').textContent = todayLog ? nextMission : 'Comece pelo registro de hoje.';
  document.getElementById('fb-home-next-summary').textContent = todayLog
    ? 'Sua próxima missão continua disponível na Jornada da Semana.'
    : 'Leva cerca de dois minutos e atualiza todo o painel.';

  const checklistTarget = document.getElementById('fb-home-next-actions');
  if (checklistTarget) {
    checklistTarget.replaceChildren(...checklist.map(item => {
      const entry = document.createElement('li');
      const label = document.createElement('strong');
      const note = document.createElement('small');
      const status = document.createElement('span');
      label.textContent = item.label;
      note.textContent = item.note;
      status.textContent = item.done ? '✓' : '•';
      status.setAttribute('aria-hidden', 'true');
      entry.className = item.done ? 'done' : 'pending';
      entry.append(status, label, note);
      return entry;
    }));
  }
}

function formatDailyDate(value, options = { weekday: 'short', day: '2-digit', month: 'short' }) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', options).format(date);
}

function getDailyLogs() {
  return Array.isArray(currentProfile?.dailyLogs) ? currentProfile.dailyLogs : [];
}

function getDailyPlans() {
  return Array.isArray(currentProfile?.dailyPlans) ? currentProfile.dailyPlans : [];
}

function renderWeeklyReview(weekLogs = []) {
  const section = document.getElementById('fb-week-review');
  const form = document.getElementById('fb-week-review-form');
  if (!section || !form) return;
  const weekStart = localDayKey(startOfLocalWeek());
  const reviews = Array.isArray(currentProfile?.weeklyReviews) ? currentProfile.weeklyReviews : [];
  const saved = reviews.find(item => item.weekStart === weekStart) || null;
  const eligible = weekLogs.length >= 2;
  const state = document.getElementById('fb-week-review-state');
  const intro = document.getElementById('fb-week-review-intro');
  const result = document.getElementById('fb-week-review-result');
  [...form.elements].forEach(control => { control.disabled = !eligible; });
  if (state) {
    state.textContent = saved ? 'Decisão salva ✓' : eligible ? 'Pronto para revisar' : `${weekLogs.length}/2 registros`;
    state.classList.toggle('complete', Boolean(saved));
  }
  if (intro) intro.textContent = eligible
    ? 'Use o que aconteceu de verdade para escolher somente um ajuste para a próxima semana.'
    : `Registre mais ${2 - weekLogs.length} dia${2 - weekLogs.length === 1 ? '' : 's'} para liberar uma revisão baseada na sua rotina.`;
  if (saved) {
    form.elements[0].value = saved.helper;
    form.elements[1].value = saved.decision;
    if (result) result.textContent = `Próxima direção: ${weeklyDecisionLabels[saved.decision]}. Você pode mudar essa decisão até o fim da semana.`;
  } else {
    if (result) result.textContent = '';
    form.reset();
  }
}

function getDayPhase(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}

function saveDailyPlan(updates) {
  const date = updates.date || localDayKey();
  const existing = getDailyPlans().find(item => item.date === date) || {};
  const plan = sanitizeDailyPlan({ ...existing, ...updates, date, selectedAt: existing.selectedAt || updates.selectedAt || new Date().toISOString() });
  if (!plan) return null;
  const dailyPlans = [...getDailyPlans().filter(item => item.date !== date), plan].sort((a, b) => a.date.localeCompare(b.date)).slice(-60);
  saveProfile({ dailyPlans });
  return plan;
}

function renderArrivalCheckin() {
  const message = document.getElementById('be-arrival-message');
  if (!message) return;
  const plan = getDailyPlans().find(item => item.date === localDayKey()) || null;
  const moment = window.BeKnowledgeLibrary?.buildArrivalMoment?.(plan?.arrival, { date: plan?.date || localDayKey() });
  if (moment?.message) message.textContent = moment.message;
  document.querySelectorAll('[data-be-arrival]').forEach(button => {
    const selected = button.dataset.beArrival === plan?.arrival;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('is-selected', selected);
  });
}

function renderDashboardPlan() {
  const card = document.getElementById('be-dashboard-plan');
  const title = document.getElementById('be-dashboard-plan-title');
  const detail = document.getElementById('be-dashboard-plan-detail');
  const action = document.getElementById('be-dashboard-plan-action');
  if (!card || !title || !detail || !action) return;
  renderArrivalCheckin();
  const plan = getDailyPlans().find(item => item.date === localDayKey()) || null;
  const hasScheduledActivity = Boolean(plan?.activity && plan?.time && plan?.duration);
  card.classList.toggle('is-planned', hasScheduledActivity);
  if (!hasScheduledActivity) {
    title.textContent = 'O que você pretende fazer hoje?';
    detail.textContent = plan?.intention
      ? `Prioridade escolhida: ${dailyIntentions[plan.intention]}. Agora defina como ela cabe no seu dia.`
      : 'Escolha uma atividade, um horário e uma duração possível.';
    action.textContent = 'Planejar meu dia';
    return;
  }
  title.textContent = dayPlanActivityLabels[plan.activity];
  detail.textContent = `${plan.time} · ${plan.duration} min${plan.note ? ` · ${plan.note}` : ''}`;
  action.textContent = 'Editar plano';
}

function openDayPlanDialog() {
  const dialog = document.getElementById('be-day-plan-dialog');
  const form = document.getElementById('be-day-plan-form');
  if (!dialog || !form) return;
  const plan = getDailyPlans().find(item => item.date === localDayKey()) || null;
  form.reset();
  form.elements.activity.value = plan?.activity || '';
  form.elements.time.value = plan?.time || '';
  form.elements.duration.value = plan?.duration || '';
  form.elements.note.value = plan?.note || '';
  document.getElementById('be-day-plan-feedback').textContent = '';
  dialog.showModal();
  window.setTimeout(() => form.elements.activity.focus(), 40);
}

function getDayGuideRecommendation(plan, log, phase = getDayPhase()) {
  const phaseLabels = { morning: 'MANHÃ', afternoon: 'TARDE', evening: 'NOITE' };
  if (log) return {
    kicker: 'MEU HOJE REGISTRADO', title: 'Seu dia já está salvo.',
    text: 'O resumo e a Jornada da Semana foram atualizados. Você ainda pode complementar qualquer informação.',
    why: 'Esta mensagem aparece porque já existe um registro para hoje.', action: 'summary', actionLabel: 'Ver meu resumo'
  };
  if (!plan) {
    const latestReview = [...(currentProfile?.weeklyReviews || [])].sort((a, b) => a.weekStart.localeCompare(b.weekStart)).at(-1);
    return {
    kicker: 'COMECE ESCOLHENDO', title: 'Qual é a prioridade possível para hoje?',
    text: latestReview
      ? `Na última revisão, você decidiu ${weeklyDecisionLabels[latestReview.decision]}. Escolha uma prioridade para aplicar essa direção hoje.`
      : 'Sua escolha ajuda o sistema a mostrar apenas uma orientação por vez.',
    why: latestReview
      ? `Esta orientação considera sua decisão semanal de ${weeklyDecisionLabels[latestReview.decision]}.`
      : 'Ainda não há uma prioridade selecionada para hoje.'
    };
  }
  if (plan.status === 'done') return {
    kicker: 'INTENÇÃO REALIZADA', title: 'Muito bem por reconhecer o que você fez.',
    text: 'Agora um registro rápido transforma essa ação em histórico e atualiza seus resumos.',
    why: `Você marcou “${dailyIntentions[plan.intention]}” como realizada.`, action: 'record', actionLabel: 'Registrar Meu Hoje'
  };
  const reminderDate = plan.remindAt ? new Date(plan.remindAt) : null;
  if (plan.status === 'snoozed' && reminderDate && reminderDate > new Date()) return {
    kicker: 'LEMBRETE PROGRAMADO', title: `Combinado para ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(reminderDate)}.`,
    text: 'A orientação continuará disponível caso você queira agir antes.',
    why: `Você escolheu receber um lembrete para a prioridade “${dailyIntentions[plan.intention]}”.`, action: plan.intention === 'movimento' ? 'journey' : 'record', actionLabel: 'Fazer agora', allowLater: true, allowDone: true
  };
  const recommendations = {
    movimento: {
      morning: ['Reserve um momento possível para se movimentar.', 'Escolha um horário realista e uma versão que caiba no seu dia.'],
      afternoon: ['Ainda cabe uma versão possível no seu dia.', 'Se o plano original não couber, reduza o tempo em vez de abandonar a intenção.'],
      evening: ['Escolha entre uma versão curta ou um registro honesto.', 'Não é necessário compensar. Faça apenas o que ainda for adequado ao seu momento.']
    },
    descanso: {
      morning: ['Seu descanso também pode ter intenção.', 'Observe energia, sono e disposição sem transformar o dia de pausa em culpa.'],
      afternoon: ['Uma pausa consciente também constrói constância.', 'Use o restante do dia para perceber o que ajuda sua recuperação.'],
      evening: ['Registre como o descanso fez parte do seu dia.', 'Sono, disposição e uma observação curta já formam um registro útil.']
    },
    alimentacao: {
      morning: ['Comece registrando uma refeição, sem buscar perfeição.', 'Uma anotação simples já ajuda a enxergar o contexto do dia.'],
      afternoon: ['Registre o que já aconteceu, sem julgamento.', 'Você pode anotar almoço e lanches agora e completar o restante mais tarde.'],
      evening: ['Feche o dia com uma visão simples das refeições.', 'Não é necessário calcular calorias: apenas registre o que você lembra.']
    },
    hidratacao: {
      morning: ['Torne a hidratação visível no seu dia.', 'Deixe água acessível e registre a quantidade quando for conveniente.'],
      afternoon: ['Faça uma pausa e observe sua hidratação até aqui.', 'Registre uma estimativa possível, sem buscar precisão perfeita.'],
      evening: ['Complete o registro de água do dia.', 'Uma estimativa honesta ajuda mais do que deixar o campo em branco.']
    },
    registro: {
      morning: ['Seu dia pode começar com uma intenção simples.', 'Registre agora ou volte mais tarde para contar o que aconteceu.'],
      afternoon: ['Dois minutos já organizam o que aconteceu até aqui.', 'Faça o registro rápido e complete os detalhes quando quiser.'],
      evening: ['Antes de encerrar, registre como foi seu dia.', 'Atividade, pausa e disposição já são suficientes para começar.']
    }
  };
  const [title, text] = recommendations[plan.intention][phase];
  return {
    kicker: `PARA AGORA · ${phaseLabels[phase]}`, title, text,
    why: `Esta orientação considera o horário atual e sua prioridade “${dailyIntentions[plan.intention]}”.`,
    action: plan.intention === 'movimento' ? 'journey' : plan.intention === 'descanso' ? 'rest' : plan.intention === 'alimentacao' || plan.intention === 'hidratacao' ? 'details' : 'record',
    actionLabel: plan.intention === 'movimento' ? 'Ver meu próximo passo' : plan.intention === 'descanso' ? 'Registrar meu descanso' : plan.intention === 'registro' ? 'Registrar Meu Hoje' : 'Abrir registro completo',
    allowLater: true, allowDone: true
  };
}

function renderDailyGuide() {
  const section = document.getElementById('fb-day-guide');
  if (!section) return;
  renderDashboardPlan();
  section.hidden = !currentProfile?.objective;
  if (!currentProfile?.objective) return;
  const today = localDayKey();
  const phase = getDayPhase();
  const plan = getDailyPlans().find(item => item.date === today) || null;
  const log = getDailyLogs().find(item => item.date === today) || null;
  const recommendation = getDayGuideRecommendation(plan, log, phase);
  const phaseLabels = { morning: 'MANHÃ', afternoon: 'TARDE', evening: 'NOITE' };
  document.getElementById('fb-day-guide-phase').textContent = phaseLabels[phase];
  document.getElementById('fb-day-recommendation-kicker').textContent = recommendation.kicker;
  document.getElementById('fb-day-recommendation-title').textContent = recommendation.title;
  document.getElementById('fb-day-recommendation-text').textContent = recommendation.text;
  document.getElementById('fb-day-why').textContent = recommendation.why;
  const intentions = section.querySelector('.fb-day-intentions');
  if (intentions) intentions.hidden = Boolean(log);
  document.querySelectorAll('[data-day-intent]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.dayIntent === plan?.intention)));
  const actions = document.getElementById('fb-day-recommendation-actions');
  actions.hidden = !recommendation.action;
  if (recommendation.action) {
    const primary = document.getElementById('fb-day-guide-primary');
    primary.textContent = recommendation.actionLabel;
    primary.dataset.guideAction = recommendation.action;
    document.getElementById('fb-day-guide-later').hidden = !recommendation.allowLater;
    document.getElementById('fb-day-guide-done').hidden = !recommendation.allowDone;
  }
  document.getElementById('fb-day-reminder-options').hidden = true;
  const periods = ['morning', 'afternoon', 'evening'];
  const currentIndex = periods.indexOf(phase);
  document.querySelectorAll('#fb-day-timeline [data-day-period]').forEach((item, index) => {
    item.classList.toggle('past', index < currentIndex);
    item.classList.toggle('current', index === currentIndex);
    item.classList.toggle('future', index > currentIndex);
    if (index === currentIndex) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  });
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
  const optional = document.getElementById('fb-daily-optional');
  if (optional) optional.open = Boolean(log && (log.intensity || log.water !== null || log.sleep !== null || Object.values(log.meals || {}).some(Boolean) || log.note));
  const deleteButton = document.getElementById('fb-delete-daily-log');
  if (deleteButton) deleteButton.hidden = !log;
}

function dailyNextStep(log) {
  if (!log) return 'Próximo passo: conte como foi seu dia.';
  return 'Registro salvo neste aparelho. Você pode atualizá-lo quando quiser.';
}

function getDailyGuidance(log) {
  if (!log) return null;
  const feeling = Number(log.feeling || 0);
  const mealCount = Object.values(log.meals || {}).filter(Boolean).length;
  const missingDetails = log.water === null || log.sleep === null || mealCount === 0;
  if (feeling > 0 && feeling <= 2) return {
    insight: 'Você registrou disposição abaixo do habitual. Esse dado ganha valor quando observado junto com sono, rotina e atividade.',
    next: 'Evite compensações. Observe como você se sente nas próximas horas e ajuste o ritmo se precisar.',
    action: 'tip', topic: 'recuperacao', label: 'Ver orientação de recuperação'
  };
  if (log.sleep !== null && log.sleep < 6) return {
    insight: 'Seu registro mostra uma noite mais curta. Sono e recuperação ajudam a contextualizar disposição e resposta ao esforço.',
    next: 'Considere um próximo passo compatível com sua energia e observe como seu corpo responde.',
    action: 'tip', topic: 'recuperacao', label: 'Ver orientação de recuperação'
  };
  if (log.activity === 'none') return {
    insight: 'Hoje ficou registrado como dia sem treino. Pausas também fazem parte de uma rotina sustentável.',
    next: missingDetails ? 'Complete sono, água ou refeições se quiser entender melhor o contexto deste dia.' : 'Amanhã pode ser um novo começo, sem necessidade de compensar hoje.',
    action: missingDetails ? 'complete' : 'tip', topic: 'constancia', label: missingDetails ? 'Completar meu registro' : 'Ver dica de constância'
  };
  if (missingDetails) return {
    insight: `Você registrou ${dailyActivityLabels[log.activity].toLocaleLowerCase('pt-BR')} por ${log.minutes} minutos. Seu movimento de hoje já faz parte do histórico.`,
    next: 'Complete água, sono ou refeições quando puder para enriquecer a leitura do dia.',
    action: 'complete', label: 'Completar meu registro'
  };
  return {
    insight: `Seu dia reuniu ${log.minutes} minutos de ${dailyActivityLabels[log.activity].toLocaleLowerCase('pt-BR')} e informações de rotina.`,
    next: 'Volte amanhã e observe quais condições ajudam você a continuar com equilíbrio.',
    action: 'tip', topic: currentProfile?.objective === 'performance' ? 'evoluir' : 'constancia', label: 'Ver próximo passo recomendado'
  };
}

function renderDailyJournal() {
  const section = document.getElementById('fb-daily-journal');
  const form = document.getElementById('fb-daily-form');
  if (!section || !form) return;
  section.hidden = !currentProfile?.objective;
  if (!currentProfile?.objective) return;
  const today = localDayKey();
  const todayContext = document.getElementById('fb-today-context-date');
  if (todayContext) {
    const formattedToday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    todayContext.dateTime = today;
    todayContext.textContent = formattedToday.charAt(0).toLocaleUpperCase('pt-BR') + formattedToday.slice(1);
  }
  form.elements.date.max = today;
  if (!form.elements.date.value) form.elements.date.value = today;
  const logs = getDailyLogs().slice().sort((a, b) => a.date.localeCompare(b.date));
  const todayLog = logs.find(item => item.date === today);
  const dailyTrigger = document.getElementById('fb-open-daily-form');
  if (dailyTrigger && dailyTrigger.getAttribute('aria-expanded') !== 'true') dailyTrigger.textContent = todayLog ? 'Atualizar meu dia' : 'Registrar meu dia';
  const summaryTitle = document.getElementById('fb-daily-summary-title');
  const summaryText = document.getElementById('fb-daily-summary-text');
  const summaryWater = document.getElementById('fb-daily-summary-water');
  const summaryWaterNote = document.getElementById('fb-daily-summary-water-note');
  const summaryMeals = document.getElementById('fb-daily-summary-meals');
  const summaryMealsNote = document.getElementById('fb-daily-summary-meals-note');
  const summarySleep = document.getElementById('fb-daily-summary-sleep');
  const summarySleepNote = document.getElementById('fb-daily-summary-sleep-note');
  const openDetailsButton = document.getElementById('fb-daily-open-details');
  if (todayLog) {
    const mealCount = Object.values(todayLog.meals || {}).filter(Boolean).length;
    summaryTitle.textContent = todayLog.activity === 'none' ? 'Dia de pausa registrado.' : `${dailyActivityLabels[todayLog.activity]} · ${todayLog.minutes} min`;
    summaryText.textContent = mealCount || todayLog.water !== null || todayLog.sleep !== null
      ? 'Os detalhes abaixo mostram o que você já registrou e o que ainda pode complementar.'
      : 'Você já tem um registro salvo; complete água, sono e refeições quando quiser.';
    if (summaryWater) summaryWater.textContent = todayLog.water !== null ? `${String(todayLog.water).replace('.', ',')} L` : '—';
    if (summaryWaterNote) summaryWaterNote.textContent = todayLog.water !== null ? 'Hidratação registrada hoje.' : 'Ainda sem quantidade informada.';
    if (summaryMeals) summaryMeals.textContent = mealCount ? `${mealCount} registro${mealCount === 1 ? '' : 's'}` : '—';
    if (summaryMealsNote) summaryMealsNote.textContent = mealCount ? 'Refeições já salvas no diário.' : 'Use o bloco de refeições para registrar o que comeu.';
    if (summarySleep) summarySleep.textContent = todayLog.sleep !== null ? `${String(todayLog.sleep).replace('.', ',')} h` : '—';
    if (summarySleepNote) summarySleepNote.textContent = todayLog.sleep !== null ? 'Sono registrado hoje.' : 'Informe as horas dormidas quando puder.';
  } else {
    summaryTitle.textContent = 'Seu dia ainda está em aberto.';
    summaryText.textContent = 'Faça um registro rápido. Água e refeições ficam no bloco “Completar meu registro”.';
    if (summaryWater) summaryWater.textContent = '—';
    if (summaryWaterNote) summaryWaterNote.textContent = 'Informe sua água no registro completo.';
    if (summaryMeals) summaryMeals.textContent = '—';
    if (summaryMealsNote) summaryMealsNote.textContent = 'Café, almoço, lanches e jantar.';
    if (summarySleep) summarySleep.textContent = '—';
    if (summarySleepNote) summarySleepNote.textContent = 'Horas dormidas ao final do dia.';
  }
  if (openDetailsButton) openDetailsButton.textContent = todayLog ? 'Abrir água, sono e refeições' : 'Completar água e refeições';
  document.getElementById('fb-daily-next-step').textContent = dailyNextStep(todayLog);
  const guidance = getDailyGuidance(todayLog);
  const guidanceBox = document.getElementById('fb-daily-guidance');
  if (guidanceBox) {
    guidanceBox.hidden = !guidance;
    if (guidance) {
      document.getElementById('fb-daily-insight').textContent = guidance.insight;
      document.getElementById('fb-daily-guidance-next').textContent = guidance.next;
      const action = document.getElementById('fb-daily-recommendation-action');
      action.textContent = guidance.label;
      action.dataset.dailyRecommendation = guidance.action;
      action.dataset.topic = guidance.topic || '';
    }
  }

  const weekStart = startOfLocalWeek();
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekLastDay = new Date(weekEnd); weekLastDay.setDate(weekLastDay.getDate() - 1);
  const weekContext = document.getElementById('fb-week-context-range');
  if (weekContext) {
    const startLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(weekStart).replace('.', '');
    const endLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(weekLastDay).replace('.', '');
    weekContext.dateTime = localDayKey(weekStart);
    weekContext.textContent = `${startLabel} — ${endLabel}`;
  }
  const weekLogs = logs.filter(item => { const date = new Date(`${item.date}T12:00:00`); return date >= weekStart && date < weekEnd; });
  const weekStrip = document.getElementById('fb-daily-week-strip');
  if (weekStrip) {
    const todayDate = new Date(`${today}T12:00:00`);
    const weekLogKeys = new Set(weekLogs.map(item => item.date));
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      const key = localDayKey(date);
      const isLogged = weekLogKeys.has(key);
      const isToday = key === today;
      const isFuture = date > todayDate;
      const item = document.createElement('li');
      const weekday = document.createElement('span');
      const day = document.createElement('strong');
      const state = document.createElement('i');
      weekday.textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '').slice(0, 3);
      day.textContent = String(date.getDate());
      state.textContent = isLogged ? '✓' : '•';
      state.setAttribute('aria-hidden', 'true');
      item.classList.toggle('logged', isLogged);
      item.classList.toggle('today', isToday);
      item.classList.toggle('future', isFuture);
      item.setAttribute('aria-label', `${formatDailyDate(key, { weekday: 'long', day: 'numeric', month: 'long' })}: ${isLogged ? 'registrado' : isFuture ? 'dia futuro' : 'sem registro'}`);
      item.append(weekday, day, state);
      return item;
    });
    weekStrip.replaceChildren(...days);
  }
  const todayState = document.getElementById('fb-daily-today-state');
  if (todayState) {
    todayState.textContent = todayLog ? 'Meu Hoje concluído ✓' : 'Hoje ainda não registrado';
    todayState.classList.toggle('complete', Boolean(todayLog));
  }
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
  renderWeeklyReview(weekLogs);

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

const beNowVisuals = {
  comecar: {
    src: 'img/fala-bem-hero-pessoas-optimized.jpg',
    alt: 'Duas pessoas correndo juntas ao ar livre',
    caption: 'Começar fica mais leve quando o passo cabe no dia.'
  },
  saude: {
    src: 'img/fala-bem-hero-pessoas-optimized.jpg',
    alt: 'Duas pessoas se movimentando ao ar livre',
    caption: 'Movimento possível também é cuidado.'
  },
  emagrecer: {
    src: 'img/fala-bem-hero-pessoas-optimized.jpg',
    alt: 'Pessoas praticando atividade física ao ar livre',
    caption: 'Constância vale mais do que pressa.'
  },
  performance: {
    src: 'img/fala-bem-hero-pessoas-optimized.jpg',
    alt: 'Um homem e uma mulher correndo juntos ao ar livre',
    caption: 'Evoluir é repetir bem antes de aumentar.'
  },
  modalidade: {
    src: 'img/fala-bem-hero-pessoas-optimized.jpg',
    alt: 'Um homem e uma mulher correndo juntos ao ar livre',
    caption: 'Experimentar ajuda você a descobrir onde quer continuar.'
  },
  recuperacao: {
    src: 'img/fala-bem-hero-pessoas-optimized.jpg',
    alt: 'Pessoas fazendo uma atividade leve ao ar livre',
    caption: 'Retomar também é respeitar os sinais do corpo.'
  }
};

function getBeNowDuration() {
  const availability = Number(currentProfile?.availability);
  return beNowCompactMode ? Math.min(10, availability || 10) : availability > 0 ? Math.min(20, availability) : 15;
}

function readBeNowExecution() {
  try {
    const value = JSON.parse(sessionStorage.getItem(BE_NOW_TIMER_KEY) || 'null');
    return value && typeof value === 'object' ? value : null;
  } catch (error) {
    return null;
  }
}

function saveBeNowExecution(value) {
  try {
    if (value) sessionStorage.setItem(BE_NOW_TIMER_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(BE_NOW_TIMER_KEY);
  } catch (error) {}
}

function clearBeNowExecution() {
  window.clearInterval(beNowTimerInterval);
  beNowTimerInterval = null;
  saveBeNowExecution(null);
}

function getBeNowRemaining(state) {
  if (!state) return 0;
  return state.running
    ? Math.max(0, Math.ceil((Number(state.endAt) - Date.now()) / 1000))
    : Math.max(0, Number(state.remainingSeconds) || 0);
}

function formatBeNowTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function setBeNowPhase(phase) {
  const phases = ['prepare', 'move', 'register'];
  const activeIndex = phases.indexOf(phase);
  document.querySelectorAll('[data-fb-now-phase]').forEach(item => {
    const index = phases.indexOf(item.dataset.fbNowPhase);
    item.classList.toggle('current', index === activeIndex);
    item.classList.toggle('done', index < activeIndex);
  });
}

function updateBeNowTimerUi() {
  const state = readBeNowExecution();
  if (!state) return;
  const remaining = getBeNowRemaining(state);
  if (state.running && remaining <= 0) {
    saveBeNowExecution({ ...state, running: false, awaitingResult: true, remainingSeconds: 0 });
    renderBeNow();
    document.getElementById('fb-now-outcome')?.querySelector('button')?.focus();
    return;
  }
  const timer = document.getElementById('fb-now-timer');
  const bar = document.getElementById('fb-now-timer-bar');
  if (timer) timer.textContent = formatBeNowTime(remaining);
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, (remaining / Math.max(1, Number(state.totalSeconds))) * 100))}%`;
}

function renderBeNowExecution(step, safetyBlocked, cycleComplete) {
  const actions = document.getElementById('fb-now-actions');
  const execution = document.getElementById('fb-now-execution');
  const outcome = document.getElementById('fb-now-outcome');
  const barrierWrap = document.getElementById('fb-now-barrier-wrap');
  let state = readBeNowExecution();
  if (state && (state.step !== step || state.objective !== currentProfile?.objective || cycleComplete || safetyBlocked)) {
    clearBeNowExecution();
    state = null;
  }
  window.clearInterval(beNowTimerInterval);
  beNowTimerInterval = null;
  barrierWrap.hidden = true;
  if (state?.awaitingResult) {
    actions.hidden = true;
    execution.hidden = true;
    outcome.hidden = false;
    setBeNowPhase('register');
    return;
  }
  if (state) {
    actions.hidden = true;
    execution.hidden = false;
    outcome.hidden = true;
    setBeNowPhase('move');
    document.getElementById('fb-now-pause').textContent = state.running ? 'Pausar' : 'Retomar';
    document.getElementById('fb-now-execution-note').textContent = state.running
      ? 'Siga no seu ritmo. Você pode pausar ou concluir quando terminar.'
      : 'A ação está pausada. Retome quando estiver pronto.';
    updateBeNowTimerUi();
    if (state.running) beNowTimerInterval = window.setInterval(updateBeNowTimerUi, 1000);
    return;
  }
  actions.hidden = safetyBlocked;
  execution.hidden = true;
  outcome.hidden = true;
  setBeNowPhase(cycleComplete ? 'register' : 'prepare');
}

function renderHumanMoment() {
  const section = document.getElementById('fb-human-moment');
  if (!section) return;
  section.hidden = !currentProfile?.objective;
  if (!currentProfile?.objective) return;
  const performance = currentProfile.objective === 'performance';
  const recovery = currentProfile.objective === 'recuperacao';
  document.getElementById('fb-human-kicker').textContent = performance ? 'TREINO COM DIREÇÃO' : recovery ? 'RETORNO COM CUIDADO' : 'PESSOAS QUE MOVEM O ESPORTE';
  document.getElementById('fb-human-title').textContent = performance
    ? 'Método transforma esforço em evolução.'
    : recovery
      ? 'Você não precisa decidir a retomada sozinho.'
      : 'Orientação também faz parte do caminho.';
  document.getElementById('fb-human-text').textContent = performance
    ? 'Conheça profissionais e conteúdos que ajudam a organizar objetivos, prática e recuperação.'
    : recovery
      ? 'Encontre profissionais para conversar sobre uma volta gradual e adequada ao seu momento.'
      : 'Conheça experiências e profissionais que podem ajudar sua jornada a continuar.';
}

function renderBeNow() {
  const section = document.getElementById('fb-now');
  if (!section) return;
  const hasJourney = Boolean(currentProfile?.objective);
  section.hidden = !hasJourney;
  renderHumanMoment();
  if (!hasJourney) return;

  const steps = getJourneySteps();
  const completed = getCompletedSteps();
  const cycleComplete = completed >= steps.length;
  const safetyPending = isSafetyPending();
  const safetyRestricted = isSafetyRestricted();
  const stepIndex = Math.min(completed, steps.length - 1);
  const currentStep = steps[stepIndex];
  const latestCheckin = [...(currentProfile?.checkins || [])].reverse().find(item => item?.step === currentStep);
  const discomfortPaused = latestCheckin?.barrier === 'desconforto';
  const safetyBlocked = safetyPending || safetyRestricted || discomfortPaused;
  const guidance = getStepGuidance(stepIndex);
  const actionTitle = cycleComplete
    ? 'Você concluiu este ciclo.'
    : beNowCompactMode
      ? `Versão menor: ${guidance?.task || currentProfile?.nextAction || currentStep}`
      : guidance?.task || currentProfile?.nextAction || currentStep;
  const adaptiveNote = getAdaptiveStepNote(stepIndex, currentProfile?.checkins || []);
  const duration = getBeNowDuration();
  const percent = Math.min(100, completed * 20);
  const weekStart = localDayKey(startOfLocalWeek());
  const weekLogs = getDailyLogs().filter(item => item.date >= weekStart).length;
  const game = getGamificationState();
  const visual = beNowVisuals[currentProfile.objective] || beNowVisuals.comecar;

  section.dataset.fbNowStep = currentStep || '';
  section.dataset.fbNowDuration = String(duration);
  document.getElementById('fb-now-duration').textContent = cycleComplete ? '100%' : `${duration} MIN`;
  document.getElementById('fb-now-step-label').textContent = cycleComplete ? 'CICLO CONCLUÍDO' : `PASSO ${completed} DE ${steps.length - 1}`;
  document.getElementById('fb-now-progress-bar').style.width = `${percent}%`;
  document.getElementById('fb-now-percent').textContent = `${percent}%`;
  document.getElementById('fb-now-week').textContent = `${Math.min(3, game.weeklyActions)}/3 dias`;
  document.getElementById('fb-now-streak').textContent = `${game.streak} dia${game.streak === 1 ? '' : 's'}`;
  document.getElementById('fb-now-xp').textContent = `${game.xp} XP`;
  document.getElementById('fb-now-image').src = visual.src;
  document.getElementById('fb-now-image').alt = visual.alt;
  document.getElementById('fb-now-image-caption').textContent = visual.caption;
  document.getElementById('fb-now-kicker').textContent = cycleComplete ? 'VOCÊ CHEGOU ATÉ O FIM' : beNowCompactMode ? 'VERSÃO MENOR' : 'PARA HOJE';
  document.getElementById('fb-now-action-title').textContent = actionTitle;
  document.getElementById('fb-now-action-detail').textContent = cycleComplete
    ? 'Seu histórico foi preservado. Inicie outro ciclo quando quiser continuar.'
    : adaptiveNote || `Faça por até ${duration} minutos. Depois, conte como foi em um toque.`;
  document.getElementById('fb-now-reason').textContent = cycleComplete
    ? `Você registrou as ${steps.length - 1} etapas deste ciclo.`
    : `Esta ação considera seu objetivo (${objectiveLabels[currentProfile.objective] || 'jornada esportiva'}), seu tempo disponível e o que aconteceu no passo anterior. Nesta semana: ${weekLogs} registro${weekLogs === 1 ? '' : 's'} e sequência de ${game.streak} dia${game.streak === 1 ? '' : 's'}.`;

  const start = document.getElementById('fb-now-start');
  const adapt = document.getElementById('fb-now-adapt');
  const safety = document.getElementById('fb-now-safety');
  safety.hidden = !safetyBlocked;
  start.disabled = false;
  start.dataset.fbNowAction = cycleComplete ? 'new-cycle' : 'start';
  start.textContent = cycleComplete ? 'Iniciar novo ciclo' : 'Começar agora';
  adapt.hidden = cycleComplete;
  adapt.textContent = beNowCompactMode ? 'Voltar à versão original' : 'Fazer versão menor';
  if (safetyBlocked) {
    document.getElementById('fb-now-safety-text').textContent = safetyPending
      ? 'Responda três pontos rápidos antes de iniciar sua próxima ação.'
      : discomfortPaused
        ? 'Você relatou dor, desconforto ou insegurança. Não avance antes de receber orientação adequada.'
        : 'Os sinais informados pedem orientação profissional antes de continuar.';
    const safetyAction = document.getElementById('fb-now-safety-action');
    safetyAction.dataset.fbNowSafetyAction = discomfortPaused ? 'professionals' : 'screening';
    safetyAction.textContent = discomfortPaused ? 'Encontrar profissionais' : 'Revisar contexto e segurança';
  }
  renderBeNowExecution(currentStep, safetyBlocked, cycleComplete);

  const transition = document.getElementById('fb-now-transition');
  transition.hidden = !lastBeNowTransition;
  transition.classList.toggle('is-warning', Boolean(lastBeNowTransition?.pausedForSafety));
  if (lastBeNowTransition) {
    transition.textContent = lastBeNowTransition.pausedForSafety
      ? `! ${lastBeNowTransition.completedStep} foi pausado. Seu progresso está preservado.`
      : lastBeNowTransition.nextStep
        ? `✓ ${lastBeNowTransition.completedStep} concluído. Agora: ${lastBeNowTransition.nextStep}.`
        : `✓ ${lastBeNowTransition.completedStep} concluído. Ciclo completo.`;
  }
}

function renderPersonalizedExperience() {
  const kicker = document.getElementById('fb-today-kicker');
  const title = document.getElementById('fb-today-title');
  const summary = document.getElementById('fb-today-summary');
  const progress = document.getElementById('fb-today-progress');
  const primary = document.getElementById('fb-today-primary');
  const secondaryTodayAction = document.getElementById('fb-today-profile');
  const avatar = shell.querySelector('.fb-app-avatar');
  const profileTriggerLabel = shell.querySelector('.fb-profile-trigger>span:last-child');
  const nameInput = document.getElementById('fb-profile-name');
  const journeyNameInput = document.getElementById('journey-name');
  const firstAccessGuide = document.getElementById('be-first-access-guide');
  const pathEntry = document.getElementById('fb-path-entry');
  const todayCard = document.getElementById('fb-today-card');
  const todayZone = document.getElementById('fb-today-zone');
  const weekZone = document.getElementById('fb-week-zone');
  const appTitle = document.getElementById('fb-app-title');
  const appSubtitle = document.getElementById('fb-app-subtitle');
  const heroAction = document.getElementById('fb-hero-action');
  const heroStatus = document.getElementById('fb-hero-status');
  const heroProgress = document.getElementById('fb-hero-progress');
  const heroProgressValue = document.getElementById('fb-hero-progress-value');
  const minorRestriction = document.getElementById('fb-minor-restriction');
  const minorRestricted = isMinorRestrictedProfile();
  const hasJourney = Boolean(currentProfile?.objective);
  shell.classList.toggle('fb-first-access', !hasJourney && !minorRestricted);
  if (minorRestriction) minorRestriction.hidden = !minorRestricted;
  if (firstAccessGuide) firstAccessGuide.hidden = hasJourney || minorRestricted;
  if (minorRestricted) {
    pathEntry.hidden = true;
    todayCard.hidden = true;
    if (todayZone) todayZone.hidden = true;
    if (weekZone) weekZone.hidden = true;
    appTitle.textContent = 'Conteúdos esportivos continuam disponíveis para você.';
    appSubtitle.textContent = 'A jornada personalizada está temporariamente reservada a maiores de 18 anos.';
    if (heroAction) { heroAction.textContent = 'Explorar conteúdos públicos'; heroAction.dataset.fbView = 'conteudos'; delete heroAction.dataset.fbDailyAction; }
    if (heroStatus) heroStatus.textContent = 'Privacidade e proteção primeiro.';
    if (heroProgress) heroProgress.style.setProperty('--fb-hero-progress', '0%');
    if (heroProgressValue) heroProgressValue.textContent = '—';
    if (profileTriggerLabel) profileTriggerLabel.textContent = 'Dados locais';
    return;
  }
  if (todayZone) todayZone.hidden = !hasJourney;
  if (weekZone) weekZone.hidden = !hasJourney;

  if (!hasJourney) {
    const displayName = currentProfile?.name?.trim();
    pathEntry.hidden = false;
    todayCard.hidden = true;
    appTitle.textContent = displayName ? `${displayName}, seu próximo passo começa pelo seu momento.` : 'O próximo passo começa pelo seu momento.';
    appSubtitle.textContent = 'Crie seu Mapa BeM e organize uma jornada possível, sem diagnóstico ou prescrição.';
    kicker.textContent = 'SEU PRIMEIRO PASSO';
    title.textContent = 'Crie seu perfil esportivo.';
    summary.textContent = 'Perfil rápido · dados salvos neste aparelho';
    progress.hidden = true;
    primary.textContent = 'Criar meu Mapa BeM';
    primary.dataset.fbView = 'jornada';
    delete primary.dataset.fbDailyAction;
    if (heroAction) {
      heroAction.textContent = 'Criar meu Mapa BeM';
      heroAction.dataset.fbView = 'jornada';
      delete heroAction.dataset.fbDailyAction;
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
    const todayIsRegistered = getDailyLogs().some(item => item.date === localDayKey());
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    pathEntry.hidden = true;
    todayCard.hidden = true;
    appTitle.textContent = displayName ? `${greeting}, ${displayName}.` : `${greeting}. Sua semana continua em movimento.`;
    appSubtitle.textContent = 'Registre seu dia e acompanhe o que ajuda sua constância.';
    kicker.textContent = 'MEU HOJE';
    title.textContent = todayIsRegistered ? 'Seu dia já está registrado.' : displayName ? `${displayName}, como foi seu dia até aqui?` : 'Como foi seu dia até aqui?';
    summary.textContent = todayIsRegistered ? 'Seu resumo está atualizado. Você pode complementar o registro quando quiser.' : 'Leva cerca de dois minutos e pode ser preenchido agora ou no final do dia.';
    progress.hidden = false;
    document.getElementById('fb-today-progress-label').textContent = `${percent}%`;
    document.getElementById('fb-today-progress-bar').style.width = `${percent}%`;
    document.getElementById('fb-today-next-action').textContent = completed >= steps.length
      ? 'Ciclo concluído. Você pode iniciar uma nova sequência.'
      : `Próxima missão: ${steps[completed]}`;
    primary.textContent = todayIsRegistered ? 'Atualizar Meu Hoje' : 'Registrar Meu Hoje';
    primary.dataset.fbView = 'inicio';
    primary.dataset.fbDailyAction = 'true';
    if (secondaryTodayAction) {
      secondaryTodayAction.textContent = completed >= steps.length ? 'Ver semana concluída' : 'Ver Jornada da Semana';
      secondaryTodayAction.dataset.fbView = 'progresso';
    }
    if (heroAction) {
      heroAction.textContent = todayIsRegistered ? 'Atualizar Meu Hoje' : 'Registrar Meu Hoje';
      heroAction.dataset.fbView = 'inicio';
      heroAction.dataset.fbDailyAction = 'true';
    }
    if (heroStatus) heroStatus.textContent = todayIsRegistered ? 'Registro de hoje concluído.' : 'Seu registro de hoje está aberto.';
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
  renderGoalTracker();
  renderProgress();
  renderBeNow();
  renderDashboardRecommendations();
  renderGamification();
  renderEvolution();
  renderDailyGuide();
  renderDailyJournal();
  renderHomeDashboard();
  renderHistory();
  renderTrails();
  renderSportDiscovery();
}

window.addEventListener('meuCaminhoBe:profile-updated', event => {
  const details = event.detail || {};
  if (['ate-17', 'under-18'].includes(details.age)) return;
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
  const gameBefore = getGamificationState();
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
  const gameAfter = getGamificationState();
  const earnedXp = Math.max(0, gameAfter.xp - gameBefore.xp);
  if (earnedXp > 0) {
    const levelUp = gameAfter.level > gameBefore.level;
    const titles = { tool: 'Ferramenta registrada!', content: 'Conteúdo concluído!', community: 'Participação registrada!' };
    const messages = {
      tool: 'O resultado entrou no seu histórico e ajuda a personalizar os próximos passos.',
      content: 'Esta leitura agora faz parte da sua evolução no Meu Caminho Be.',
      community: 'Sua contribuição fortalece a comunidade e também registra sua participação.'
    };
    showProductFeedback({
      type: 'progress',
      title: levelUp ? 'Seu nível aumentou!' : titles[detail.type],
      message: levelUp ? `Você chegou ao nível ${gameAfter.level}: ${gameAfter.levelName}.` : messages[detail.type],
      reward: `+${earnedXp} XP`,
      detail: `${gameAfter.xp} XP no total${gameAfter.streak ? ` · sequência de ${gameAfter.streak} dia${gameAfter.streak === 1 ? '' : 's'}` : ''}`
    });
  }
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
  const gameBeforeDiscovery = getGamificationState();
  saveProfile({ sportDiscovery: { preferences, results, completedAt: new Date().toISOString() }, preferredSport: null });
  const gameAfterDiscovery = getGamificationState();
  const discoveryXp = Math.max(0, gameAfterDiscovery.xp - gameBeforeDiscovery.xp);
  showCelebration(gameAfterDiscovery.level > gameBeforeDiscovery.level ? 'Seu nível aumentou!' : 'Descoberta concluída!', gameAfterDiscovery.level > gameBeforeDiscovery.level ? `Você chegou ao nível ${gameAfterDiscovery.level}: ${gameAfterDiscovery.levelName}.` : 'Suas preferências foram salvas e já ajudam a personalizar seu caminho.', {
    type: discoveryXp ? 'progress' : 'success', reward: discoveryXp ? `+${discoveryXp} XP` : '', detail: `${gameAfterDiscovery.xp} XP no total`
  });
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
  const status = document.getElementById('fb-checkin-status');
  const note = document.getElementById('fb-checkin-note');
  const barrier = document.getElementById('fb-checkin-barrier');
  const form = document.getElementById('fb-progress-checkin');
  const needsBarrier = ['parcial', 'ajustar'].includes(status?.value);
  if (!form?.checkValidity() || !status?.value || (note?.value.trim().length || 0) < 3 || (needsBarrier && !barrier?.value)) {
    document.getElementById('fb-progress-feedback').textContent = 'Complete os pontos destacados para receber o próximo passo.';
    form?.reportValidity();
    (!status?.value ? status : needsBarrier && !barrier?.value ? barrier : note)?.focus();
    updateProgressActionState();
    return;
  }
  const barrierValue = needsBarrier ? barrier.value : '';
  const result = recordJourneyStep({
    status: status.value,
    note: note.value.trim(),
    barrier: barrierValue,
    source: 'journey_form'
  });
  if (!result.ok) {
    document.getElementById('fb-progress-feedback').textContent = result.reason === 'safety'
      ? 'Revise o contexto e a segurança antes de continuar.'
      : 'Não foi possível registrar agora. Revise os dados e tente novamente.';
    return;
  }
  if (status) status.value = '';
  if (barrier) barrier.value = '';
  if (note) note.value = '';
  updateProgressActionState();
  const feedbackName = currentProfile?.name ? `${currentProfile.name}, ` : '';
  document.getElementById('fb-progress-feedback').textContent = result.pausedForSafety
    ? `${feedbackName}sua etapa foi pausada e o progresso foi preservado. Procure orientação adequada antes de continuar.`
    : result.nextStep
    ? `${feedbackName}obrigado por contar como foi. Seu próximo passo já está pronto: ${result.nextStep}.`
    : `${feedbackName}você concluiu este ciclo. Sua experiência está registrada e já pode orientar sua próxima escolha.`;
});

document.getElementById('fb-new-cycle')?.addEventListener('click', () => {
  lastBeNowTransition = null;
  beNowCompactMode = false;
  clearBeNowExecution();
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
  const gameBeforeCycle = getGamificationState();
  saveProfile({ progress: 1, checkins: [], cycles, cycleAdjustment, gamificationStats: { ...(currentProfile?.gamificationStats || {}), completedCycles: previousCycleTotal + 1 } });
  const gameAfterCycle = getGamificationState();
  document.getElementById('fb-progress-feedback').textContent = cycleAdjustment === 'reduce'
    ? 'Novo ciclo iniciado com uma versão menor e mais segura do caminho anterior.'
    : cycleAdjustment === 'maintain'
      ? 'Novo ciclo iniciado mantendo o que foi possível no ciclo anterior.'
      : 'Novo ciclo iniciado. Você poderá evoluir uma variável por vez.';
  showCelebration(gameAfterCycle.level > gameBeforeCycle.level ? 'Seu nível aumentou!' : 'Novo ciclo iniciado!', gameAfterCycle.level > gameBeforeCycle.level ? `Você chegou ao nível ${gameAfterCycle.level}: ${gameAfterCycle.levelName}.` : 'Seu progresso anterior foi preservado e um novo caminho já está disponível.', {
    type: 'progress', reward: gameAfterCycle.xp > gameBeforeCycle.xp ? `+${gameAfterCycle.xp - gameBeforeCycle.xp} XP` : '', detail: `${gameAfterCycle.xp} XP no total`
  });
});

document.getElementById('fb-calendar-next')?.addEventListener('click', () => {
  const feedback = document.getElementById('fb-progress-feedback');
  if (!currentProfile?.objective || isSafetyRestricted() || isSafetyPending()) {
    if (feedback) feedback.textContent = currentProfile?.objective ? 'Conclua ou revise o questionário de contexto e segurança antes de agendar uma prática.' : 'Crie seu caminho antes de adicionar um lembrete.';
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
document.getElementById('fb-checkin-barrier')?.addEventListener('change', updateProgressActionState);

document.getElementById('fb-week-review-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const weekStart = localDayKey(startOfLocalWeek());
  const weekEnd = new Date(startOfLocalWeek()); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekLogs = getDailyLogs().filter(item => {
    const date = new Date(`${item.date}T12:00:00`);
    return date >= startOfLocalWeek() && date < weekEnd;
  });
  if (weekLogs.length < 2 || !form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const review = sanitizeWeeklyReview({
    weekStart,
    helper: document.getElementById('fb-week-helper')?.value,
    decision: document.getElementById('fb-week-decision')?.value,
    registeredActions: weekLogs.length,
    updatedAt: new Date().toISOString()
  });
  if (!review) return;
  const weeklyReviews = [...(currentProfile?.weeklyReviews || []).filter(item => item.weekStart !== weekStart), review].slice(-26);
  saveProfile({ weeklyReviews });
  window.dispatchEvent(new CustomEvent('bemEsportivo:analytics', { detail: { name: 'weekly_review', detail: review.decision } }));
  const interaction = buildLocalInteraction('weekly_review_saved', {
    name: currentProfile?.name,
    date: weekStart,
    decision: review.decision
  }, {
    title: 'Semana revisada!',
    message: `Sua próxima direção é ${weeklyDecisionLabels[review.decision]}.`,
    detail: 'Você pode rever essa escolha se a sua realidade mudar.'
  });
  showCelebration(interaction.title, interaction.message, { detail: interaction.detail });
});

document.getElementById('be-profile-edit')?.addEventListener('click', () => {
  profileEditMode = true;
  renderProfilePresentation();
  window.setTimeout(() => {
    document.getElementById('fb-profile-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('fb-profile-name')?.focus({ preventScroll: true });
  }, 120);
});

document.getElementById('be-profile-cancel-edit')?.addEventListener('click', () => {
  profileEditMode = false;
  pendingProfilePhoto = undefined;
  syncProfileFormValues();
  renderProfilePresentation();
  document.getElementById('be-profile-presentation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('fb-profile-story')?.addEventListener('input', event => {
  const counter = document.getElementById('fb-profile-story-count');
  if (counter) counter.textContent = String(event.currentTarget.value.length);
});

document.getElementById('fb-profile-public-enabled')?.addEventListener('change', event => {
  const consent = document.getElementById('fb-profile-public-consent-wrap');
  if (consent) consent.hidden = !event.currentTarget.checked;
});

document.getElementById('fb-profile-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const name = document.getElementById('fb-profile-name').value.trim();
  const email = document.getElementById('fb-profile-email')?.value.trim().toLocaleLowerCase('pt-BR') || '';
  const location = {
    city: document.getElementById('fb-profile-city')?.value.trim().slice(0, 60) || '',
    state: document.getElementById('fb-profile-state')?.value.trim().toLocaleUpperCase('pt-BR').slice(0, 2) || ''
  };
  const publicAgeValue = Number(document.getElementById('fb-profile-age')?.value || 0);
  const publicAge = Number.isFinite(publicAgeValue) && publicAgeValue >= 18 && publicAgeValue <= 120 ? Math.round(publicAgeValue) : null;
  const profession = document.getElementById('fb-profile-profession')?.value.trim().slice(0, 60) || '';
  const publicEnabled = document.getElementById('fb-profile-public-enabled')?.checked === true;
  const publicTermsAccepted = document.getElementById('fb-profile-public-consent')?.checked === true;
  if (publicEnabled && (!publicAge || !profession)) {
    document.getElementById('fb-profile-feedback').textContent = 'Para ativar o Meu Diário BE, informe sua idade e profissão.';
    document.getElementById(!publicAge ? 'fb-profile-age' : 'fb-profile-profession')?.focus();
    return;
  }
  if (publicEnabled && !publicTermsAccepted) {
    document.getElementById('fb-profile-feedback').textContent = 'Confirme que você tem 18 anos ou mais e aceite os termos para ativar o Meu Diário BE.';
    document.getElementById('fb-profile-public-consent')?.focus();
    return;
  }
  const sportProfile = {
    modality: document.getElementById('fb-profile-sport')?.value || 'outro',
    role: document.getElementById('fb-profile-role')?.value.trim() || '',
    visual: document.getElementById('fb-profile-visual')?.value || 'energia'
  };
  const story = sanitizeProfileStory(document.getElementById('fb-profile-story')?.value);
  const photoDataUrl = pendingProfilePhoto === undefined
    ? sanitizeProfilePhoto(currentProfile?.photoDataUrl)
    : sanitizeProfilePhoto(pendingProfilePhoto);
  profileEditMode = false;
  saveProfile({
    name, email, location, photoDataUrl, sportProfile, story, publicAge, profession, publicEnabled,
    publicTermsAccepted: publicEnabled ? publicTermsAccepted : currentProfile?.publicTermsAccepted === true,
    publicTermsVersion: publicEnabled ? PUBLIC_PROFILE_TERMS_VERSION : currentProfile?.publicTermsVersion || '',
    publicTermsAcceptedAt: publicEnabled && publicTermsAccepted
      ? currentProfile?.publicTermsVersion === PUBLIC_PROFILE_TERMS_VERSION && currentProfile?.publicTermsAcceptedAt
        ? currentProfile.publicTermsAcceptedAt
        : new Date().toISOString()
      : currentProfile?.publicTermsAcceptedAt || '',
    identityCreatedAt: currentProfile?.identityCreatedAt || new Date().toISOString()
  });
  pendingProfilePhoto = undefined;
  renderProfilePhoto();
  if (name) registerFirstIdentityAccess();
  const sportLabel = getSportProfile({ sportProfile }).modalityLabel;
  document.getElementById('fb-profile-feedback').textContent = name
    ? `Perfil salvo, ${name}.${publicEnabled ? ' Sua página pública já pode ser aberta e compartilhada.' : story ? ' Sua história também foi guardada.' : ` Modalidade base: ${sportLabel}.`}`
    : `Perfil salvo neste navegador. Modalidade base: ${sportLabel}.`;
  const interaction = buildLocalInteraction('profile_saved', { name, activityLabel: sportLabel }, {
    title: 'Perfil atualizado!',
    message: name ? `Muito bem, ${name}. Seu perfil agora tem uma identidade por modalidade.` : 'Seu perfil agora tem uma identidade por modalidade.',
    detail: 'Você pode atualizar essas informações quando quiser.'
  });
  showCelebration(interaction.title, interaction.message, { detail: interaction.detail });
  window.setTimeout(() => {
    const presentation = document.getElementById('be-profile-presentation');
    presentation?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('be-profile-display-name')?.focus({ preventScroll: true });
  }, 180);
});

document.getElementById('fb-profile-photo')?.addEventListener('change', async event => {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  const feedback = document.getElementById('fb-profile-feedback');
  const saveButton = document.getElementById('fb-profile-save');
  if (saveButton) saveButton.disabled = true;
  if (feedback) feedback.textContent = 'Preparando sua foto…';
  try {
    pendingProfilePhoto = await resizeProfilePhoto(file);
    renderProfilePhoto();
    if (feedback) feedback.textContent = 'Foto pronta. Clique em “Salvar meu cadastro” para concluir.';
  } catch (error) {
    if (feedback) feedback.textContent = 'Escolha uma imagem JPG, PNG ou WebP de até 8 MB.';
  } finally {
    input.value = '';
    if (saveButton) saveButton.disabled = false;
  }
});

document.getElementById('fb-profile-photo-remove')?.addEventListener('click', () => {
  pendingProfilePhoto = null;
  renderProfilePhoto();
  document.getElementById('fb-profile-feedback').textContent = 'Foto removida da prévia. Salve o cadastro para confirmar.';
});

document.getElementById('fb-goals-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const startValue = Number(document.getElementById('fb-goals-start')?.value);
  saveGoalTracker({
    baseline: Number.isFinite(startValue) ? startValue : undefined
  });
});

document.getElementById('fb-goals-add-btn')?.addEventListener('click', () => {
  addGoalMarker();
});

document.getElementById('fb-goals-history-list')?.addEventListener('click', event => {
  const button = event.target.closest('button[data-goal-action]');
  if (!button) return;
  const index = Number(button.dataset.goalIndex);
  if (!Number.isInteger(index) || index < 0) return;
  if (button.dataset.goalAction === 'edit') editGoalMarker(index);
  if (button.dataset.goalAction === 'delete') deleteGoalMarker(index);
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

function openDailyJournal(options = {}) {
  openView('inicio');
  document.getElementById('fb-daily-journal')?.classList.add('fb-progressive-open');
  const todayLog = getDailyLogs().find(item => item.date === localDayKey()) || null;
  fillDailyForm(todayLog);
  if (options.details) document.getElementById('fb-daily-optional').open = true;
  setDailyFormVisibility(true);
  window.setTimeout(() => document.getElementById(options.details ? 'fb-daily-optional' : 'fb-daily-journal')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 220);
}

document.getElementById('fb-now-start')?.addEventListener('click', event => {
  if (event.currentTarget.dataset.fbNowAction === 'new-cycle') {
    document.getElementById('fb-new-cycle')?.click();
    return;
  }
  const section = document.getElementById('fb-now');
  const durationSeconds = Math.max(60, Number(section?.dataset.fbNowDuration || 15) * 60);
  saveBeNowExecution({
    objective: currentProfile?.objective,
    step: section?.dataset.fbNowStep || '',
    totalSeconds: durationSeconds,
    remainingSeconds: durationSeconds,
    endAt: Date.now() + durationSeconds * 1000,
    running: true,
    awaitingResult: false
  });
  renderBeNow();
  window.setTimeout(() => document.getElementById('fb-now-timer')?.focus?.(), 80);
});

document.getElementById('fb-now-adapt')?.addEventListener('click', () => {
  beNowCompactMode = !beNowCompactMode;
  renderBeNow();
});

document.getElementById('fb-now-pause')?.addEventListener('click', () => {
  const state = readBeNowExecution();
  if (!state || state.awaitingResult) return;
  const remainingSeconds = getBeNowRemaining(state);
  const running = !state.running;
  saveBeNowExecution({
    ...state,
    running,
    remainingSeconds,
    endAt: running ? Date.now() + remainingSeconds * 1000 : 0
  });
  renderBeNow();
});

document.getElementById('fb-now-finish')?.addEventListener('click', () => {
  const state = readBeNowExecution();
  if (!state) return;
  saveBeNowExecution({ ...state, running: false, awaitingResult: true, remainingSeconds: getBeNowRemaining(state), endAt: 0 });
  renderBeNow();
  window.setTimeout(() => document.getElementById('fb-now-outcome')?.querySelector('button')?.focus(), 80);
});

document.querySelectorAll('[data-fb-now-status]').forEach(button => {
  button.addEventListener('click', () => {
    pendingBeNowStatus = button.dataset.fbNowStatus;
    if (pendingBeNowStatus === 'concluida') {
      const step = getJourneySteps()[getCompletedSteps()];
      recordJourneyStep({
        status: 'concluida',
        note: `Realizei o passo "${step}" pelo Be Agora.`,
        source: 'be_now'
      });
      return;
    }
    const barrierWrap = document.getElementById('fb-now-barrier-wrap');
    barrierWrap.hidden = false;
    window.setTimeout(() => document.getElementById('fb-now-barrier')?.focus(), 80);
  });
});

document.getElementById('fb-now-save-adaptation')?.addEventListener('click', () => {
  const barrier = document.getElementById('fb-now-barrier');
  if (!barrier?.value) {
    barrier?.setCustomValidity('Escolha o principal motivo.');
    barrier?.reportValidity();
    barrier?.focus();
    return;
  }
  barrier.setCustomValidity('');
  const step = getJourneySteps()[getCompletedSteps()];
  const label = checkinBarrierLabels[barrier.value] || 'outro motivo';
  const result = recordJourneyStep({
    status: pendingBeNowStatus,
    barrier: barrier.value,
    note: `${pendingBeNowStatus === 'parcial' ? 'Realizei uma parte' : 'Não consegui realizar'} do passo "${step}"; principal barreira: ${label}.`,
    source: 'be_now'
  });
  if (result.ok) {
    pendingBeNowStatus = '';
    barrier.value = '';
  }
});

document.getElementById('fb-now-help')?.addEventListener('click', () => {
  const assistant = document.getElementById('be-ia');
  if (!assistant) return;
  assistant.hidden = false;
  assistant.classList.add('fb-progressive-open');
  assistant.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => document.getElementById('be-ia-input')?.focus({ preventScroll: true }), 240);
});

document.getElementById('fb-now-details')?.addEventListener('click', () => openDailyJournal());
document.getElementById('fb-human-action')?.addEventListener('click', () => openView('especialistas'));
document.getElementById('fb-now-safety-action')?.addEventListener('click', event => {
  if (event.currentTarget.dataset.fbNowSafetyAction === 'professionals') openView('especialistas');
  else openSafetyDialog(currentProfile, true);
});

document.getElementById('be-dashboard-plan-action')?.addEventListener('click', openDayPlanDialog);
document.getElementById('be-day-plan-close')?.addEventListener('click', () => closeDialog(document.getElementById('be-day-plan-dialog')));
document.getElementById('be-day-plan-cancel')?.addEventListener('click', () => closeDialog(document.getElementById('be-day-plan-dialog')));
document.getElementById('be-day-plan-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const activity = form.elements.activity.value;
  const time = form.elements.time.value;
  const duration = Math.round(Number(form.elements.duration.value));
  const note = form.elements.note.value.trim();
  if (!Object.hasOwn(dayPlanActivityLabels, activity) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || duration < 5 || duration > 600) {
    document.getElementById('be-day-plan-feedback').textContent = 'Escolha a atividade, o horário e uma duração entre 5 e 600 minutos.';
    return;
  }
  saveDailyPlan({
    activity,
    time,
    duration,
    note,
    intention: activity === 'descanso' ? 'descanso' : 'movimento',
    status: 'planned',
    remindAt: '',
    notifiedAt: '',
    completedAt: ''
  });
  closeDialog(document.getElementById('be-day-plan-dialog'));
  const interaction = buildLocalInteraction('plan_saved', {
    name: currentProfile?.name,
    activityLabel: dayPlanActivityLabels[activity],
    time,
    duration,
    isRest: activity === 'descanso'
  }, {
    title: 'Plano do dia salvo!',
    message: `${dayPlanActivityLabels[activity]} às ${time}, por ${duration} minutos.`,
    detail: 'Depois, registre o que realmente aconteceu.'
  });
  showCelebration(interaction.title, interaction.message, { detail: interaction.detail });
});

document.querySelectorAll('[data-day-intent]').forEach(button => {
  button.addEventListener('click', () => {
    saveDailyPlan({ intention: button.dataset.dayIntent, status: 'planned', remindAt: '', notifiedAt: '', completedAt: '' });
    showCelebration('Prioridade escolhida!', `O Guia do Meu Hoje agora considera: ${dailyIntentions[button.dataset.dayIntent]}.`);
  });
});

document.querySelectorAll('[data-be-arrival]').forEach(button => {
  button.addEventListener('click', () => {
    const arrival = button.dataset.beArrival;
    const existing = getDailyPlans().find(item => item.date === localDayKey()) || null;
    const defaultIntentions = { ready: 'movimento', short: 'movimento', tired: 'descanso', returning: 'movimento', present: 'registro' };
    saveDailyPlan({
      intention: existing?.intention || defaultIntentions[arrival], arrival,
      status: existing?.status || 'planned', remindAt: existing?.remindAt || '',
      notifiedAt: existing?.notifiedAt || '', completedAt: existing?.completedAt || ''
    });
    renderDailyGuide();
  });
});

document.getElementById('fb-day-why-toggle')?.addEventListener('click', event => {
  const why = document.getElementById('fb-day-why');
  const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!expanded));
  event.currentTarget.textContent = expanded ? 'Por que estou vendo isso?' : 'Ocultar explicação';
  why.hidden = expanded;
});

document.getElementById('fb-day-guide-primary')?.addEventListener('click', event => {
  const action = event.currentTarget.dataset.guideAction;
  if (action === 'summary') {
    document.querySelector('.fb-daily-overview')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (action === 'journey') { openView('progresso'); return; }
  if (action === 'details') { openDailyJournal({ details: true }); return; }
  openDailyJournal();
});

document.getElementById('fb-day-guide-later')?.addEventListener('click', () => {
  const options = document.getElementById('fb-day-reminder-options');
  options.hidden = !options.hidden;
  if (!options.hidden) options.querySelector('button')?.focus();
});

document.querySelectorAll('#fb-day-reminder-options [data-reminder-minutes],#fb-day-reminder-options [data-reminder-period]').forEach(button => {
  button.addEventListener('click', () => {
    const plan = getDailyPlans().find(item => item.date === localDayKey());
    if (!plan) return;
    const remindAt = new Date();
    if (button.dataset.reminderMinutes) remindAt.setMinutes(remindAt.getMinutes() + Number(button.dataset.reminderMinutes));
    else {
      remindAt.setHours(20, 0, 0, 0);
      if (remindAt <= new Date()) remindAt.setHours(new Date().getHours() + 1, 0, 0, 0);
    }
    saveDailyPlan({ ...plan, status: 'snoozed', remindAt: remindAt.toISOString(), notifiedAt: '' });
    const reminderTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(remindAt);
    const interaction = buildLocalInteraction('reminder_saved', {
      name: currentProfile?.name,
      time: reminderTime,
      date: localDayKey()
    }, {
      title: 'Lembrete combinado!',
      message: `Vamos lembrar você às ${reminderTime}.`,
      detail: 'Você pode adaptar o plano se o dia mudar.'
    });
    showCelebration(interaction.title, interaction.message, { detail: interaction.detail });
  });
});

document.getElementById('fb-day-reminder-cancel')?.addEventListener('click', () => { document.getElementById('fb-day-reminder-options').hidden = true; });
document.getElementById('fb-day-guide-done')?.addEventListener('click', () => {
  openDailyJournal();
});

document.getElementById('fb-open-daily-form')?.addEventListener('click', () => {
  const wrap = document.getElementById('fb-daily-form-wrap');
  const todayLog = getDailyLogs().find(item => item.date === localDayKey()) || null;
  fillDailyForm(todayLog);
  setDailyFormVisibility(Boolean(wrap?.hidden));
});
document.getElementById('fb-daily-open-details')?.addEventListener('click', () => openDailyJournal({ details: true }));
document.getElementById('fb-home-guide-action')?.addEventListener('click', () => {
  openView('inicio', { scroll: false });
  document.getElementById('be-ia')?.classList.add('fb-progressive-open');
  document.getElementById('be-ia')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => document.getElementById('be-ia-input')?.focus({ preventScroll: true }), 220);
});
document.getElementById('fb-daily-view-mission')?.addEventListener('click', () => openView('progresso'));
document.getElementById('fb-daily-recommendation-action')?.addEventListener('click', event => {
  const action = event.currentTarget.dataset.dailyRecommendation;
  if (action === 'complete') {
    openDailyJournal({ details: true });
    return;
  }
  if (action === 'tip') showPracticalTip(event.currentTarget.dataset.topic || 'constancia');
});
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
  const isNewDailyLog = !getDailyLogs().some(item => item.date === log.date);
  const gameBeforeDailyLog = getGamificationState();
  const dailyLogs = [...getDailyLogs().filter(item => item.date !== log.date), log].sort((a, b) => a.date.localeCompare(b.date)).slice(-180);
  saveProfile({ dailyLogs });
  fillDailyForm(log);
  feedback.textContent = `${formatDailyDate(log.date, { day: '2-digit', month: 'long' })} foi salvo. Seus resumos já foram atualizados.`;
  setDailyFormVisibility(false);
  const resultTarget = log.date === localDayKey() ? '.fb-daily-overview' : '.fb-daily-history';
  window.setTimeout(() => document.querySelector(resultTarget)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 180);
  const weekStart = startOfLocalWeek();
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const registeredThisWeek = new Set(dailyLogs.filter(item => {
    const date = new Date(`${item.date}T12:00:00`);
    return date >= weekStart && date < weekEnd;
  }).map(item => item.date)).size;
  const weeklyPercent = Math.min(100, Math.round(registeredThisWeek / 3 * 100));
  const gameAfterDailyLog = getGamificationState();
  const dailyLevelUp = gameAfterDailyLog.level > gameBeforeDailyLog.level;
  const interactionType = !isNewDailyLog
    ? 'daily_checkin_updated'
    : log.activity === 'none' ? 'rest_recorded' : 'daily_checkin_saved';
  const interaction = buildLocalInteraction(interactionType, { name: currentProfile?.name }, {
    title: isNewDailyLog ? (log.activity === 'none' ? 'Pausa registrada!' : 'Meu Hoje concluído!') : 'Meu Hoje atualizado!',
    message: isNewDailyLog ? 'Seu painel, sua sequência e o resumo da semana já foram atualizados.' : 'As novas informações já aparecem no resumo do dia e da semana.',
    detail: ''
  });
  showCelebration(
    dailyLevelUp ? 'Seu nível aumentou!' : interaction.title,
    dailyLevelUp ? `Você chegou ao nível ${gameAfterDailyLog.level}: ${gameAfterDailyLog.levelName}.` : interaction.message,
    isNewDailyLog ? {
      type: 'progress', reward: '+15 XP',
      detail: `${interaction.detail}${interaction.detail ? ' · ' : ''}Meta semanal: ${weeklyPercent}%${gameAfterDailyLog.streak ? ` · sequência: ${gameAfterDailyLog.streak} dia${gameAfterDailyLog.streak === 1 ? '' : 's'}` : ''}`
    } : { detail: interaction.detail || `Meta semanal: ${weeklyPercent}%` }
  );
});
document.getElementById('fb-delete-daily-log')?.addEventListener('click', () => {
  const date = document.getElementById('fb-daily-date')?.value;
  if (!date || !getDailyLogs().some(item => item.date === date)) return;
  if (!window.confirm(`Excluir o registro de ${formatDailyDate(date, { day: '2-digit', month: 'long' })}?`)) return;
  saveProfile({ dailyLogs: getDailyLogs().filter(item => item.date !== date) });
  fillDailyForm({ date });
  document.getElementById('fb-daily-feedback').textContent = 'Registro excluído deste aparelho.';
});

function readBackupArray(key, limit, keepNewest = false) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(value)) return [];
    return keepNewest ? value.slice(-limit) : value.slice(0, limit);
  } catch {
    return [];
  }
}

function sanitizeBackupDiary(entries) {
  const allowedTypes = new Set(['corrida', 'treino', 'jogo', 'caminhada', 'ciclismo', 'natacao', 'outro']);
  return (Array.isArray(entries) ? entries : []).map((entry, index) => {
    if (!entry || typeof entry !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || ''))) return null;
    const rawDuration = Math.round(Number(entry.duration));
    if (!Number.isFinite(rawDuration) || rawDuration < 1) return null;
    const duration = Math.min(1440, rawDuration);
    const distance = Number(entry.distance);
    return {
      id: String(entry.id || `imported-${Date.now()}-${index}`).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80),
      date: String(entry.date),
      type: allowedTypes.has(entry.type) ? entry.type : 'outro',
      title: String(entry.title || '').trim().slice(0, 60),
      duration,
      distance: Number.isFinite(distance) && distance > 0 ? Math.round(Math.min(distance, 10000) * 100) / 100 : null,
      result: String(entry.result || '').trim().slice(0, 60),
      feeling: ['1', '2', '3', '4', '5'].includes(String(entry.feeling)) ? String(entry.feeling) : '3',
      note: String(entry.note || '').trim().slice(0, 280),
      createdAt: String(entry.createdAt || new Date().toISOString()).slice(0, 40),
      updatedAt: String(entry.updatedAt || entry.createdAt || new Date().toISOString()).slice(0, 40)
    };
  }).filter(Boolean).slice(0, 3000);
}

function sanitizeBackupMeals(records) {
  const allowedMeals = new Set(['breakfast', 'snack', 'lunch', 'dinner']);
  const singleMeals = new Set(['breakfast', 'lunch', 'dinner']);
  const seen = new Set();
  return (Array.isArray(records) ? records : []).map((item, index) => {
    if (!item || typeof item !== 'object' || !allowedMeals.has(item.type) || !/^\d{4}-\d{2}-\d{2}$/.test(String(item.date || ''))) return null;
    const uniqueKey = `${item.date}:${item.type}`;
    if (singleMeals.has(item.type) && seen.has(uniqueKey)) return null;
    if (singleMeals.has(item.type)) seen.add(uniqueKey);
    return {
      id: String(item.id || `meal-imported-${Date.now()}-${index}`).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80),
      type: item.type,
      date: String(item.date),
      description: String(item.description || '').trim().slice(0, 240),
      createdAt: String(item.createdAt || new Date().toISOString()).slice(0, 40)
    };
  }).filter(Boolean).slice(-1200);
}

function restoreLocalBackup(values) {
  Object.entries(values).forEach(([key, value]) => {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  });
}

document.getElementById('fb-export-profile')?.addEventListener('click', () => {
  const routineTasks = readBackupArray('meuCaminhoBeTasksV1', 250, true);
  const diary = sanitizeBackupDiary(readBackupArray('meuCaminhoBeDiaryV1', 3000));
  const meals = sanitizeBackupMeals(readBackupArray('meuCaminhoBeMealsV1', 1200, true));
  if (!currentProfile && !routineTasks.length && !diary.length && !meals.length) {
    document.getElementById('fb-profile-feedback').textContent = 'Ainda não há dados para exportar.';
    return;
  }
  const payload = JSON.stringify({
    kind: BACKUP_KIND,
    backupVersion: BACKUP_VERSION,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile: currentProfile,
    routineTasks,
    diary,
    meals
  }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = String(currentProfile?.name || 'meu-caminho').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
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
    if (file.size > BACKUP_MAX_BYTES) throw new Error('too-large');
    const parsed = JSON.parse(await file.text());
    const profile = parsed?.profile;
    const allowedObjectives = Object.keys(journeyStepTemplates);
    if (!parsed || typeof parsed !== 'object' || (parsed.kind && parsed.kind !== BACKUP_KIND) || Number(parsed.backupVersion || 1) > BACKUP_VERSION) throw new Error('invalid');
    if (profile && (typeof profile !== 'object' || !allowedObjectives.includes(profile.objective) || typeof profile.name !== 'string' || ['ate-17', 'under-18'].includes(profile.age))) throw new Error('invalid');
    const sanitized = profile ? {
      ...profile,
      schemaVersion: PROFILE_SCHEMA_VERSION,
      createdAt: profile.createdAt || new Date().toISOString(),
      name: profile.name.trim().slice(0, 40),
      email: String(profile.email || '').trim().toLocaleLowerCase('pt-BR').slice(0, 120),
      publicAge: Number.isFinite(Number(profile.publicAge)) && Number(profile.publicAge) >= 18 && Number(profile.publicAge) <= 120 ? Math.round(Number(profile.publicAge)) : null,
      profession: String(profile.profession || '').trim().slice(0, 60),
      publicEnabled: profile.publicEnabled === true,
      publicTermsAccepted: profile.publicTermsAccepted === true && profile.publicTermsVersion === PUBLIC_PROFILE_TERMS_VERSION,
      publicTermsVersion: String(profile.publicTermsVersion || ''),
      publicTermsAcceptedAt: String(profile.publicTermsAcceptedAt || ''),
      location: {
        city: String(profile.location?.city || '').trim().slice(0, 60),
        state: String(profile.location?.state || '').trim().toLocaleUpperCase('pt-BR').slice(0, 2)
      },
      photoDataUrl: sanitizeProfilePhoto(profile.photoDataUrl),
      story: sanitizeProfileStory(profile.story),
      sportProfile: normalizeSportProfile(profile.sportProfile),
      sportStats: normalizeSportStats(profile.sportStats),
      checkins: Array.isArray(profile.checkins) ? profile.checkins.slice(-10) : [],
      cycles: Array.isArray(profile.cycles) ? profile.cycles.slice(-6) : [],
      dailyLogs: Array.isArray(profile.dailyLogs) ? profile.dailyLogs.map(sanitizeDailyLog).filter(Boolean).slice(-180) : [],
      dailyPlans: Array.isArray(profile.dailyPlans) ? profile.dailyPlans.map(sanitizeDailyPlan).filter(Boolean).slice(-60) : [],
      weeklyReviews: Array.isArray(profile.weeklyReviews) ? profile.weeklyReviews.map(sanitizeWeeklyReview).filter(Boolean).slice(-26) : [],
      activityHistory: Array.isArray(profile.activityHistory) ? profile.activityHistory.slice(-40) : [],
      gamificationStats: profile.gamificationStats && typeof profile.gamificationStats === 'object' ? {
        completedCheckins: Math.max(0, Number(profile.gamificationStats.completedCheckins || 0)),
        completedCycles: Math.max(0, Number(profile.gamificationStats.completedCycles || 0)),
        communityActions: Math.max(0, Number(profile.gamificationStats.communityActions || 0)),
        tools: Array.isArray(profile.gamificationStats.tools) ? profile.gamificationStats.tools.slice(-20).map(value => String(value).slice(0, 80)) : [],
        contents: Array.isArray(profile.gamificationStats.contents) ? profile.gamificationStats.contents.slice(-40).map(value => String(value).slice(0, 80)) : []
      } : {},
      sportDiscovery: profile.sportDiscovery && typeof profile.sportDiscovery === 'object' ? profile.sportDiscovery : undefined
    } : null;
    const routineTasks = Array.isArray(parsed.routineTasks) ? parsed.routineTasks.filter(item => item && typeof item === 'object').slice(-250) : [];
    const diary = sanitizeBackupDiary(parsed.diary);
    const meals = sanitizeBackupMeals(parsed.meals);
    if (!sanitized && !routineTasks.length && !diary.length && !meals.length) throw new Error('empty');
    const hasCurrentData = Boolean(currentProfile)
      || readBackupArray('meuCaminhoBeTasksV1', 1).length
      || readBackupArray('meuCaminhoBeDiaryV1', 1).length
      || readBackupArray('meuCaminhoBeMealsV1', 1).length;
    if (hasCurrentData && !window.confirm('Importar este backup substituirá os dados atuais deste aparelho. Deseja continuar?')) {
      document.getElementById('fb-profile-feedback').textContent = 'Importação cancelada. Seus dados atuais foram mantidos.';
      return;
    }
    const keys = [PROFILE_STORAGE_KEY, 'meuCaminhoBeTasksV1', 'meuCaminhoBeDiaryV1', 'meuCaminhoBeMealsV1'];
    const previousValues = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    try {
      if (sanitized) localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(sanitized));
      else localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.setItem('meuCaminhoBeTasksV1', JSON.stringify(routineTasks));
      localStorage.setItem('meuCaminhoBeDiaryV1', JSON.stringify(diary));
      localStorage.setItem('meuCaminhoBeMealsV1', JSON.stringify(meals));
    } catch (storageError) {
      restoreLocalBackup(previousValues);
      throw storageError;
    }
    currentProfile = sanitized;
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:diary-imported'));
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:meals-imported'));
    renderPersonalizedExperience();
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:tasks-imported'));
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:profile-updated', { detail: { ready: Boolean(sanitized?.objective), source: 'backup' } }));
    document.getElementById('fb-profile-feedback').textContent = `Backup restaurado: ${diary.length} ${diary.length === 1 ? 'atividade' : 'atividades'} e ${meals.length} ${meals.length === 1 ? 'refeição' : 'refeições'}.`;
    const interaction = buildLocalInteraction('backup_restored', { name: sanitized?.name }, {
      title: 'Backup restaurado!',
      message: 'Tudo certo. Seus dados foram validados e já estão disponíveis neste aparelho.',
      detail: 'Revise o painel para confirmar as informações restauradas.'
    });
    showCelebration(interaction.title, interaction.message, { detail: interaction.detail });
    if (sanitized) window.dispatchEvent(new CustomEvent('meuCaminhoBe:edit-onboarding', { detail: { ...sanitized } }));
  } catch (error) {
    const message = String(error?.message || error);
    document.getElementById('fb-profile-feedback').textContent = message === 'too-large'
      ? 'Esse arquivo ultrapassa 5 MB. Escolha um backup menor do Meu Caminho Be.'
      : /quota|storage/i.test(message) || error?.name === 'QuotaExceededError'
        ? 'Não há espaço suficiente neste aparelho. Seus dados anteriores foram preservados.'
        : 'Não foi possível importar. Escolha um backup válido do Meu Caminho Be.';
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

document.getElementById('be-first-access-start')?.addEventListener('click', () => {
  const pathEntry = document.getElementById('fb-path-entry');
  pathEntry?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => pathEntry?.querySelector('[data-fb-start-objective]')?.focus({ preventScroll: true }), 350);
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

function validateSafetyForm(form, profileUpdate) {
  const feedback = document.getElementById('fb-safety-feedback');
  const guardianWrap = document.getElementById('fb-safety-guardian-wrap');
  const fields = [
    {
      valid: Boolean(form.elements.symptoms.value),
      message: 'Responda a primeira pergunta sobre sinais durante o esforço.',
      target: form.querySelector('[name="symptoms"]')
    },
    {
      valid: Boolean(form.elements.condition.value),
      message: 'Responda a segunda pergunta sobre condição de saúde ou retorno.',
      target: form.querySelector('[name="condition"]')
    },
    {
      valid: form.elements.condition.value !== 'yes' || Boolean(form.elements.clearance.value),
      message: 'Informe se um profissional já orientou ou liberou a retomada.',
      target: form.querySelector('[name="clearance"]')
    },
    {
      valid: Boolean(document.getElementById('fb-safety-consent')?.checked),
      message: 'Marque a autorização de armazenamento para salvar estas respostas.',
      target: document.getElementById('fb-safety-consent')
    },
    {
      valid: Boolean(guardianWrap?.hidden || document.getElementById('fb-safety-guardian')?.checked),
      message: 'Confirme o conhecimento e acompanhamento de um responsável.',
      target: document.getElementById('fb-safety-guardian')
    },
    {
      valid: Boolean(profileUpdate?.objective),
      message: 'Não foi possível recuperar seu objetivo. Clique em “Revisar respostas” e confirme novamente seu caminho.',
      target: document.getElementById('fb-safety-later')
    }
  ];
  form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.removeAttribute('aria-invalid'));
  const invalid = fields.find(field => !field.valid);
  if (!invalid) {
    if (feedback) {
      feedback.hidden = true;
      feedback.textContent = '';
    }
    return true;
  }
  if (feedback) {
    feedback.textContent = invalid.message;
    feedback.hidden = false;
    feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  invalid.target?.setAttribute('aria-invalid', 'true');
  window.setTimeout(() => invalid.target?.focus(), 180);
  return false;
}

document.getElementById('fb-safety-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const profileUpdate = pendingProfileUpdate?.objective
    ? pendingProfileUpdate
    : currentProfile?.objective
      ? { ...currentProfile }
      : null;
  if (!validateSafetyForm(form, profileUpdate)) return;
  const data = new FormData(form);
  const symptoms = String(data.get('symptoms') || '');
  const condition = String(data.get('condition') || '');
  const clearance = condition === 'yes' ? String(data.get('clearance') || '') : 'not-needed';
  const restricted = symptoms === 'yes' || (condition === 'yes' && clearance !== 'yes');
  const sameObjective = currentProfile?.objective === profileUpdate.objective;
  const safety = {
    consent: true,
    consentVersion: SAFETY_CONSENT_VERSION,
    consentedAt: new Date().toISOString(),
    symptoms,
    condition,
    clearance,
    restricted,
    objective: profileUpdate.objective,
    age: profileUpdate.age,
    screenedAt: new Date().toISOString()
  };
  const submitButton = document.getElementById('fb-safety-submit');
  const feedback = document.getElementById('fb-safety-feedback');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';
  }
  try {
    const savedProfile = saveProfile({
      ...profileUpdate,
      safety,
      progress: sameObjective ? getCompletedSteps() : 1,
      checkins: sameObjective ? (currentProfile?.checkins || []) : []
    });
    if (!savedProfile) throw new Error('profile-storage-failed');
  } catch (error) {
    console.error('Falha ao salvar o contexto e segurança.', error);
    if (feedback) {
      feedback.textContent = 'Não foi possível salvar agora. Seus dados não foram apagados; tente novamente.';
      feedback.hidden = false;
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Salvar e continuar';
    }
    return;
  }
  pendingProfileUpdate = null;
  closeDialog(document.getElementById('fb-safety-dialog'));
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar e continuar';
  }
  openView(restricted ? 'perfil' : 'progresso');
  const viewFeedback = document.getElementById(restricted ? 'fb-profile-feedback' : 'fb-progress-feedback');
  if (viewFeedback) viewFeedback.textContent = restricted
    ? 'Perfil salvo. Siga a indicação acima para revisar os sinais informados antes de começar.'
    : 'Mapa BeM concluído. Escolha realizar seu próximo passo agora ou começar o registro no Meu Hoje.';
  showCelebration(
    restricted ? 'Perfil salvo com segurança.' : 'Perfil esportivo concluído!',
    restricted ? 'Obrigado por registrar essas informações. Confira a orientação indicada antes de continuar.' : 'Muito bem! Agora escolha seu próximo passo ou comece a preencher o Meu Hoje.'
  );
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
    const requestedView = decodeURIComponent(window.location.hash.slice(1));
    if (requestedView === 'registrar') {
      openView('inicio', { scroll: false, focus: false, instant: true, route: false });
      window.setTimeout(() => document.querySelector('[data-be-new-entry]')?.click(), 220);
      return true;
    }
    const legacyView = {
      gols: 'gols',
      perfil: 'perfil',
      ferramentas: 'ferramentas',
      participe: 'comunidade',
      'minha-jornada': 'jornada'
    }[requestedView];
    if (legacyView) {
      openView(legacyView, { scroll: legacyView !== 'gols', focus: false, instant: true, route: false });
      updateAppRoute(legacyView, true);
      if (legacyView === 'gols') window.setTimeout(() => document.getElementById('fb-goals-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
      return true;
    }

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

function checkDailyGuideReminder() {
  if (!currentProfile?.objective || getDailyLogs().some(item => item.date === localDayKey())) return;
  const plan = getDailyPlans().find(item => item.date === localDayKey());
  if (!plan?.remindAt || plan.notifiedAt || new Date(plan.remindAt) > new Date()) return;
  saveDailyPlan({ ...plan, status: 'planned', notifiedAt: new Date().toISOString() });
  showCelebration('Seu lembrete chegou!', `Prioridade de hoje: ${dailyIntentions[plan.intention]}.`);
}

renderPersonalizedExperience();
try {
  if (sessionStorage.getItem('meuCaminhoBeResetNotice') === '1') {
    sessionStorage.removeItem('meuCaminhoBeResetNotice');
    showProductFeedback({
      type: 'success',
      title: 'Processo zerado com sucesso.',
      message: 'Seu aparelho está pronto para uma nova jornada. Comece dizendo como quer ser chamado.',
      detail: 'Nenhum dado anterior será restaurado automaticamente.'
    });
  }
} catch (error) {}
if (!openLinkedContentFromHash()) {
  if (!openViewFromRoute()) openView('inicio', { scroll: false, focus: false, instant: true, route: false });
}
window.addEventListener('popstate', () => {
  if (!openLinkedContentFromHash() && !openViewFromRoute()) {
    openView('inicio', { scroll: false, focus: false, instant: true, route: false });
  }
});
registerDailyAccess();
let renderedLocalDay = localDayKey();
function maintainCurrentDayState() {
  const currentLocalDay = localDayKey();
  if (currentLocalDay !== renderedLocalDay) {
    renderedLocalDay = currentLocalDay;
    renderPersonalizedExperience();
  }
  checkDailyGuideReminder();
}
window.setTimeout(maintainCurrentDayState, 1200);
window.setInterval(maintainCurrentDayState, 60000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') maintainCurrentDayState();
});
document.getElementById('fb-welcome-close')?.addEventListener('click', () => document.getElementById('fb-daily-welcome')?.close());
document.getElementById('fb-welcome-later')?.addEventListener('click', () => document.getElementById('fb-daily-welcome')?.close());
document.getElementById('fb-welcome-continue')?.addEventListener('click', () => {
  document.getElementById('fb-daily-welcome')?.close();
  openView(currentProfile?.objective ? 'inicio' : 'jornada');
  if (currentProfile?.objective) window.setTimeout(() => document.getElementById('fb-home-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
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
const sharedTool = new URLSearchParams(window.location.search).get('ferramenta')?.trim();
if (['imc', 'pace', 'calorias', 'agua', 'proteina'].includes(sharedTool)) {
  openView('ferramentas');
  window.setTimeout(() => document.querySelector(`[data-tool="${sharedTool}"]`)?.click(), 180);
}
})();
