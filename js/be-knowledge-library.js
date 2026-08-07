(function (globalScope, factory) {
  'use strict';

  const library = factory();
  if (typeof module === 'object' && module.exports) module.exports = library;
  if (globalScope) globalScope.BeKnowledgeLibrary = library;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createBeKnowledgeLibrary() {
  'use strict';

  const VERSION = '1.0.0';
  const REVIEWED_AT = '2026-08-06';
  const allowedActions = new Set(['movement', 'rest', 'nutrition', 'hydration', 'daily', 'journey', 'professional', 'profile']);
  const sources = Object.freeze({
    whoMovement: Object.freeze({
      title: 'OMS · Diretrizes sobre atividade física e comportamento sedentário',
      url: 'https://www.who.int/publications/i/item/9789240014886'
    }),
    iocLoad: Object.freeze({
      title: 'COI · Consenso sobre carga, recuperação e risco de adoecimento no esporte',
      url: 'https://bjsm.bmj.com/content/50/17/1043'
    }),
    returnToSport: Object.freeze({
      title: 'Consenso de Berna · Retorno ao esporte centrado na pessoa',
      url: 'https://bjsm.bmj.com/content/50/14/853'
    }),
    acsmRecovery: Object.freeze({
      title: 'ACSM · Fundamentos para recuperação muscular',
      url: 'https://www.acsm.org/docs/default-source/files-for-resource-library/a-road-map-to-effective-muscle-recovery.pdf'
    })
  });

  const intentPatterns = Object.freeze({
    motivation: ['sem vontade', 'desanimado', 'desanimada', 'preguica', 'sem motivacao', 'nao quero treinar', 'desistir'],
    time: ['pouco tempo', 'sem tempo', 'dia corrido', 'rotina corrida', 'quantos minutos'],
    fatigue: ['cansado', 'cansada', 'fadiga', 'exausto', 'exausta', 'dormi mal', 'pouco sono', 'sem energia'],
    recovery: ['voltar depois', 'retomar', 'recuperacao', 'afastamento', 'voltar a treinar'],
    nutrition: ['alimentacao', 'refeicao', 'comida', 'comer', 'cafe da manha', 'almoco', 'jantar', 'lanche'],
    hydration: ['hidratacao', 'hidratar', 'agua', 'sede'],
    consistency: ['parei', 'falhei', 'perdi a sequencia', 'muitos dias sem', 'nao consegui'],
    next: ['proximo passo', 'o que faco', 'o que fazer', 'por onde comeco', 'para hoje']
  });

  const urgentSignals = Object.freeze([
    'dor no peito', 'nao consigo respirar', 'falta de ar intensa', 'falta de ar incomum', 'desmaio', 'desmaiei',
    'confusao repentina', 'fraqueza subita', 'palpitacao com mal estar', 'tontura intensa'
  ]);
  const pauseSignals = Object.freeze([
    'dor forte', 'dor piorando', 'piora da dor', 'lesao recente', 'me machuquei', 'machuquei', 'inchaco importante',
    'febre', 'retorno apos lesao', 'voltar depois da lesao'
  ]);
  const barrierLabels = Object.freeze({
    tempo: 'falta de tempo', energia: 'energia ou recuperação', dificuldade: 'dificuldade do passo',
    acesso: 'acesso a local ou equipamento', apoio: 'companhia ou apoio',
    desconforto: 'dor, desconforto ou insegurança', outro: 'uma barreira pessoal'
  });

  function normalize(value) {
    return String(value || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }

  function hasNonNegatedSignal(text, signal) {
    let index = text.indexOf(signal);
    while (index >= 0) {
      const prefix = text.slice(Math.max(0, index - 24), index);
      const negated = /(?:sem|nao tenho|nao estou com|nao sinto)\s+$/.test(prefix);
      if (!negated || signal.startsWith('nao ')) return true;
      index = text.indexOf(signal, index + signal.length);
    }
    return false;
  }

  function findSignal(text, signals) {
    return signals.find(signal => hasNonNegatedSignal(text, signal)) || '';
  }

  function assessSafety(query, context = {}) {
    const text = normalize(query);
    const urgent = findSignal(text, urgentSignals);
    if (urgent) return { level: 'urgent', signal: urgent, reason: 'A mensagem contém um sinal de alerta que não deve ser avaliado pelo sistema.' };
    const pause = findSignal(text, pauseSignals);
    if (pause) return { level: 'pause', signal: pause, reason: 'A mensagem indica dor, lesão, doença ou retorno que precisa de avaliação individual.' };
    if (context.safetyRestricted) return { level: 'pause', signal: 'restrição do questionário', reason: 'O questionário de segurança registrado recomenda avaliação individual antes de avançar.' };
    if (context.latestBarrier === 'desconforto') return { level: 'pause', signal: 'desconforto recente', reason: 'O relato mais recente registrou dor, desconforto ou insegurança.' };
    return { level: 'clear', signal: '', reason: '' };
  }

  function classifyIntent(query, context = {}) {
    if (assessSafety(query, context).level !== 'clear') return 'safety';
    const text = normalize(query);
    return Object.entries(intentPatterns).find(([, patterns]) => patterns.some(pattern => text.includes(pattern)))?.[0] || 'general';
  }

  function baseReasons(context) {
    const age = context.age || 'faixa etária não informada';
    const objective = context.objective || 'seguir uma jornada esportiva possível';
    const modality = context.modality || 'atividade ainda em definição';
    const reasons = [
      `Momento informado: ${age}.`,
      `Objetivo atual: ${objective}.`,
      `Prática de referência: ${modality}.`,
      `Tempo disponível: ${String(context.availabilityLabel || 'não informado').toLocaleLowerCase('pt-BR')}.`,
      `Ciclo atual: ${Number(context.progressPercent || 0)}% concluído.`
    ];
    if (context.recentLogs?.length) reasons.push(`Nos últimos 7 dias: ${context.recentLogs.length} registro${context.recentLogs.length === 1 ? '' : 's'} e ${Number(context.activeMinutes || 0)} minutos ativos.`);
    else reasons.push('Sem registros nos últimos 7 dias; por isso a orientação evita cobranças e prioriza um passo simples.');
    if (context.latestBarrier) reasons.push(`Barreira recente: ${barrierLabels[context.latestBarrier] || 'ajuste informado pela pessoa'}.`);
    return reasons;
  }

  function sportNote(context) {
    const sport = normalize(context.modality);
    if (/corrida|caminhada/.test(sport)) return 'Em corrida ou caminhada, prefira um ritmo em que você ainda consiga falar frases curtas e encerre antes de transformar o passo em teste.';
    if (/futebol|futsal|volei|luta/.test(sport)) return 'Em práticas com mudanças rápidas de direção ou contato, reserve uma entrada progressiva e não use o início da sessão como teste máximo.';
    if (/musculacao|forca|academia/.test(sport)) return 'No treino de força, priorize execução controlada e uma carga que preserve a técnica; hoje não é dia de compensar sessões perdidas.';
    if (/ciclismo/.test(sport)) return 'No ciclismo, escolha percurso e duração compatíveis com o dia e confira equipamento, visibilidade e condições do trajeto.';
    if (/natacao/.test(sport)) return 'Na natação, respeite o ambiente, a supervisão disponível e a facilidade para interromper a sessão se necessário.';
    return 'Escolha uma versão conhecida, de esforço confortável e que possa ser interrompida sem culpa se o corpo pedir ajuste.';
  }

  function metadata(sourceIds) {
    return {
      libraryVersion: VERSION,
      reviewedAt: REVIEWED_AT,
      sources: sourceIds.map(id => sources[id]).filter(Boolean)
    };
  }

  function response(payload, sourceIds = ['whoMovement', 'iocLoad']) {
    const primaryAction = allowedActions.has(payload.primary?.[1]) ? payload.primary : ['Ver minha jornada', 'journey'];
    const secondaryAction = allowedActions.has(payload.secondary?.[1]) ? payload.secondary : ['Registrar Meu Hoje', 'daily'];
    return Object.assign({}, payload, { primary: primaryAction, secondary: secondaryAction }, metadata(sourceIds));
  }

  function careResponse(context, safety) {
    const greeting = context.name ? `${context.name}, ` : '';
    const urgent = safety.level === 'urgent';
    return response({
      intent: 'safety', tone: 'care', label: urgent ? 'ATENÇÃO IMEDIATA' : 'SEGURANÇA PRIMEIRO',
      title: `${greeting}não continue a atividade agora.`,
      message: urgent
        ? 'O que você escreveu pode representar um sinal de alerta. Este sistema não consegue avaliar a causa ou a gravidade com segurança.'
        : 'O que você registrou pede uma avaliação individual antes de retomar ou aumentar o esforço.',
      nextTitle: urgent ? 'Procure atendimento de urgência.' : 'Interrompa o esforço e procure orientação profissional.',
      detail: urgent
        ? 'Se você estiver sozinho, avise alguém próximo. Não tente terminar o treino, dirigir ou testar seus limites enquanto o sintoma estiver presente.'
        : 'Não tente compensar nem usar outro treino como teste. Registre o que aconteceu para explicar ao profissional que acompanha você.',
      reasons: [...baseReasons(context), safety.reason, 'Segurança sempre tem prioridade sobre sequência, meta ou desempenho.'],
      primary: ['Ver profissionais', 'professional'], secondary: ['Revisar contexto de segurança', 'profile']
    }, ['returnToSport', 'iocLoad']);
  }

  function buildResponse(query, context = {}) {
    const safety = assessSafety(query, context);
    if (safety.level !== 'clear') return careResponse(context, safety);
    const intent = classifyIntent(query, context);
    const greeting = context.name ? `${context.name}, ` : '';
    const duration = Math.max(5, Number(context.shortDuration || 10));
    const activeMinutes = Number(context.activeMinutes || 0);
    const streak = Number(context.streak || 0);
    const historyMessage = context.activeLogs?.length
      ? `Você acumulou ${activeMinutes} minutos ativos nos últimos 7 dias${streak ? ` e uma sequência de ${streak} dia${streak === 1 ? '' : 's'}` : ''}.`
      : 'Seu histórico recente está aberto para um recomeço.';
    const lowRecovery = Number(context.latestLog?.feeling || 0) > 0 && Number(context.latestLog.feeling) <= 2;
    const sleepValue = context.latestLog?.sleep;
    const shortSleep = sleepValue !== null && sleepValue !== undefined && Number(sleepValue) < 6;
    const reasons = baseReasons(context);
    const common = { intent, tone: 'action', reasons };
    const responses = {
      motivation: response(Object.assign({}, common, {
        label: 'UM PASSO SEM COBRANÇA', title: `${greeting}você não precisa fabricar motivação para cuidar da sua jornada.`,
        message: `${historyMessage} Um dia difícil não apaga o que já foi construído, e uma pausa também pode ser uma escolha consciente.`,
        nextTitle: `Escolha entre ${duration} minutos leves ou uma pausa registrada.`,
        detail: `${sportNote(context)} A sequência é uma referência, não uma dívida.`,
        primary: ['Escolher movimento leve', 'movement'], secondary: ['Registrar como estou', 'daily']
      })),
      time: response(Object.assign({}, common, {
        label: 'POUCO TEMPO · PASSO POSSÍVEL', title: `${greeting}um passo curto ainda é um passo inteiro.`,
        message: 'Num dia corrido, reduzir o tamanho da ação é mais coerente do que abandonar o plano ou tentar compensar depois.',
        nextTitle: `Proteja somente ${duration} minutos para a versão mais simples da prática.`,
        detail: sportNote(context), primary: ['Planejar movimento curto', 'movement'], secondary: ['Ver minha jornada', 'journey']
      })),
      fatigue: response(Object.assign({}, common, {
        tone: 'care', label: 'ENERGIA E RECUPERAÇÃO', title: `${greeting}cansaço é informação, não falta de compromisso.`,
        message: lowRecovery || shortSleep
          ? 'Seu registro mais recente também indica baixa disposição ou sono curto. Hoje, proteger a recuperação é mais importante do que manter uma sequência a qualquer custo.'
          : 'Sem avaliação individual, o sistema não consegue dizer a causa do cansaço. Observe disposição, sono e desconfortos antes de escolher.',
        nextTitle: lowRecovery || shortSleep ? 'Planeje descanso e registre como você está.' : 'Faça um check-in honesto antes de decidir.',
        detail: 'Se o cansaço vier com sinal intenso, súbito ou piora, interrompa a atividade e procure avaliação.',
        primary: [lowRecovery || shortSleep ? 'Planejar descanso hoje' : 'Registrar como estou', lowRecovery || shortSleep ? 'rest' : 'daily'],
        secondary: ['Ver minha jornada', 'journey']
      }), ['iocLoad', 'acsmRecovery']),
      recovery: response(Object.assign({}, common, {
        tone: 'care', label: 'RETOMADA COM CUIDADO', title: `${greeting}retomar não é provar que você voltou ao nível anterior.`,
        message: 'O retorno é um processo e deve considerar sua resposta atual, a exigência da modalidade e o plano construído com quem acompanha você.',
        nextTitle: 'Mantenha ou reduza o passo anterior antes de pensar em progredir.',
        detail: 'Registre como o corpo responde durante e depois. Diante de piora, dor ou insegurança, interrompa e procure orientação.',
        primary: ['Ver meu passo atual', 'journey'], secondary: ['Encontrar profissional', 'professional']
      }), ['returnToSport', 'iocLoad']),
      nutrition: response(Object.assign({}, common, {
        label: 'ALIMENTAÇÃO SEM JULGAMENTO', title: `${greeting}registrar uma refeição serve para lembrar, não para dar nota ao seu prato.`,
        message: 'A necessidade de cada pessoa muda com rotina, modalidade, saúde, cultura e acesso. O sistema não prescreve dieta nem classifica alimentos como prêmio ou culpa.',
        nextTitle: 'Planeje a próxima refeição possível e descreva o que pretende comer.',
        detail: 'Se você busca mudança de desempenho, composição corporal ou tem condição clínica, prefira orientação individual de nutricionista.',
        primary: ['Planejar alimentação', 'nutrition'], secondary: ['Registrar Meu Hoje', 'daily']
      }), ['acsmRecovery']),
      hydration: response(Object.assign({}, common, {
        label: 'HIDRATAÇÃO POSSÍVEL', title: `${greeting}hidratação funciona melhor quando entra no plano do dia.`,
        message: 'Calor, duração, intensidade e resposta individual mudam a necessidade. Por isso, o sistema evita uma quantidade universal.',
        nextTitle: 'Defina um momento concreto para beber água antes de sair ou começar.',
        detail: 'Em sessões longas, calor intenso ou necessidades clínicas, procure orientação individual para um plano adequado.',
        primary: ['Planejar hidratação', 'hydration'], secondary: ['Registrar Meu Hoje', 'daily']
      }), ['acsmRecovery']),
      consistency: response(Object.assign({}, common, {
        label: 'RECOMEÇO TAMBÉM É EVOLUÇÃO', title: `${greeting}uma interrupção não apaga sua identidade esportiva.`,
        message: 'O diário existe para mostrar a história completa: prática, pausa, retorno e adaptação. Consistência não exige perfeição.',
        nextTitle: `Escolha um recomeço de até ${duration} minutos, sem compensar o período parado.`,
        detail: sportNote(context), primary: ['Planejar meu recomeço', 'movement'], secondary: ['Ver minha história', 'journey']
      }), ['whoMovement', 'iocLoad']),
      next: response(Object.assign({}, common, {
        label: 'SEU PRÓXIMO PASSO', title: `${greeting}uma ação de cada vez.`,
        message: `${historyMessage} O melhor passo é aquele que cabe no dia, pode ser tentado com segurança e depois registrado.`,
        nextTitle: context.profile?.nextAction || `Use até ${duration} minutos para continuar a etapa atual.`,
        detail: 'Abra a jornada para ver o passo combinado. Ao terminar, registre a resposta real — inclusive se precisou adaptar.',
        primary: ['Abrir meu passo atual', 'journey'], secondary: ['Registrar Meu Hoje', 'daily']
      })),
      general: response(Object.assign({}, common, {
        label: 'LEITURA DA SUA JORNADA', title: `${greeting}vamos transformar sua dúvida em uma escolha observável.`,
        message: `Considerei o objetivo de ${context.objective || 'seguir uma jornada possível'}, a prática de ${context.modality || 'atividade física'} e o tempo disponível.`,
        nextTitle: 'Escolha entre continuar a etapa atual ou registrar como você está hoje.',
        detail: 'Se a dúvida envolver sintomas, lesão, medicação, alimentação clínica ou retorno após afastamento, converse com um profissional antes de agir.',
        primary: ['Ver meu passo atual', 'journey'], secondary: ['Registrar Meu Hoje', 'daily']
      }))
    };
    return responses[intent] || responses.general;
  }

  return Object.freeze({
    version: VERSION,
    reviewedAt: REVIEWED_AT,
    sources,
    normalize,
    assessSafety,
    classifyIntent,
    buildResponse
  });
});
