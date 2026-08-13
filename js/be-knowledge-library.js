(function (globalScope, factory) {
  'use strict';

  const library = factory();
  if (typeof module === 'object' && module.exports) module.exports = library;
  if (globalScope) globalScope.BeKnowledgeLibrary = library;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createBeKnowledgeLibrary() {
  'use strict';

  const VERSION = '1.2.0';
  const REVIEWED_AT = '2026-08-07';
  const REVIEW_STATUS = 'editorial-pending-professional';
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
      reviewStatus: REVIEW_STATUS,
      sources: sourceIds.map(id => sources[id]).filter(Boolean)
    };
  }

  function response(payload, sourceIds = ['whoMovement', 'iocLoad']) {
    const primaryAction = allowedActions.has(payload.primary?.[1]) ? payload.primary : ['Ver minha jornada', 'journey'];
    const secondaryAction = allowedActions.has(payload.secondary?.[1]) ? payload.secondary : ['Registrar Meu Hoje', 'daily'];
    return Object.assign({}, payload, { primary: primaryAction, secondary: secondaryAction }, metadata(sourceIds));
  }

  function buildDashboardWelcome(context = {}) {
    const name = String(context.name || '').trim().split(/\s+/)[0];
    const greeting = name ? `${name}, ` : '';
    const entries = Math.max(0, Number(context.entries || 0));
    const streak = Math.max(0, Number(context.streak || 0));
    const recentEntries = Math.max(0, Number(context.recentEntries || 0));
    const objective = String(context.objective || '').trim();

    if (!entries) return response({
      label: 'SEU ESPAÇO PARA COMEÇAR',
      message: `${greeting}você não precisa ter tudo definido para dar o primeiro passo. Este espaço existe para acompanhar o que faz sentido para a sua vida — esporte, saúde e lazer.`,
      goalLabel: 'Começar com calma',
      goalNote: 'Um registro verdadeiro já é um começo.'
    });

    if (!recentEntries) return response({
      label: 'SEU CAMINHO CONTINUA',
      message: `${greeting}voltar depois de uma pausa também é fazer parte da jornada. Não há nada para compensar: escolha apenas o próximo passo que cabe hoje.`,
      goalLabel: 'Retomar no seu ritmo',
      goalNote: 'Recomeçar é continuar de outro jeito.'
    });

    if (streak >= 3) return response({
      label: 'PRESENÇA CONSTRUÍDA',
      message: `${greeting}seus registros mostram presença. Use esse histórico para se conhecer melhor, sem transformar a sequência em obrigação.`,
      goalLabel: 'Seguir com presença',
      goalNote: 'Seu ritmo vale mais do que uma sequência.'
    });

    return response({
      label: 'UM PASSO DE CADA VEZ',
      message: `${greeting}cada registro ajuda a enxergar o que apoia sua rotina. Você não está sozinho na busca por mais movimento, saúde e momentos de lazer.`,
      goalLabel: objective === 'saude' ? 'Cuidar de você' : 'Construir seu ritmo',
      goalNote: 'O que cabe hoje também conta.'
    });
  }

  function buildArrivalMoment(arrival) {
    const moments = {
      ready: ['Que bom ter disposição hoje. Escolha um passo que preserve essa energia também para amanhã.', 'Movimento com presença'],
      short: ['Um dia cheio não diminui sua intenção. Uma versão curta, uma pausa ou um registro já podem fazer sentido.', 'Um passo que caiba hoje'],
      tired: ['Cansaço merece escuta, não cobrança. Você pode descansar, observar como está ou apenas registrar este momento.', 'Cuidar da recuperação'],
      returning: ['Voltar aos poucos é uma forma corajosa de continuar. Não há nada para compensar.', 'Retomar no seu ritmo'],
      present: ['Estar aqui já é uma escolha por você. Quando quiser, conte uma coisa pequena sobre o seu dia.', 'Reconhecer seu momento']
    };
    const [message, focus] = moments[arrival] || ['Seu momento importa. Escolha a opção que melhor descreve como você chega hoje.', 'Um passo possível'];
    return response({ label: 'SEU MOMENTO DE HOJE', message, focus });
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

  function interaction(payload, sourceIds = ['whoMovement', 'iocLoad']) {
    return Object.assign({ tone: 'success', detail: '' }, payload, metadata(sourceIds));
  }

  function buildInteraction(type, context = {}) {
    const name = String(context.name || '').trim();
    const greeting = name ? `${name}, ` : '';
    const interactions = {
      plan_saved: () => interaction({
        interaction: type,
        title: context.isRest ? 'Seu descanso entrou no plano.' : 'Seu plano ganhou forma.',
        message: context.isRest
          ? `${greeting}planejar uma pausa também é cuidar da continuidade da sua jornada.`
          : `${greeting}${context.activityLabel || 'sua atividade'} ficou combinada para ${context.time || 'o horário escolhido'}, por ${Number(context.duration || 0)} minutos.`,
        detail: 'O plano registra sua intenção. Depois, conte o que realmente aconteceu, mesmo que tenha sido diferente.'
      }),
      first_activity: () => interaction({
        interaction: type,
        title: 'Sua história começou.',
        message: `${greeting}este é o primeiro registro do seu diário esportivo. Ele não precisa representar um desempenho perfeito — apenas o que você viveu.`,
        detail: 'Cada novo registro ajudará a mostrar ritmo, pausas, retornos e descobertas.'
      }),
      activity_updated: () => interaction({
        interaction: type,
        title: 'Seu registro foi atualizado.',
        message: 'A informação corrigida já faz parte da sua linha do tempo.',
        detail: 'Sua história continua organizada sem criar uma atividade duplicada.'
      }),
      return_after_pause: () => interaction({
        interaction: type,
        title: 'Seu retorno também é evolução.',
        message: `${greeting}você voltou depois de ${Number(context.gapDays || 0)} dias. A pausa não apagou o que veio antes, e este registro não precisa compensar o tempo parado.`,
        detail: 'Observe como você se sentiu e escolha o próximo passo pelo momento atual.'
      }, ['returnToSport', 'iocLoad']),
      low_feeling_activity: () => interaction({
        interaction: type,
        tone: 'care',
        title: 'Sua percepção também importa.',
        message: `${greeting}você registrou a atividade e indicou que ela foi difícil ou cansativa. Isso é informação útil, não falta de compromisso.`,
        detail: 'Considere recuperação, sono e desconfortos antes de decidir o próximo esforço.'
      }, ['iocLoad', 'acsmRecovery']),
      personal_milestone: () => interaction({
        interaction: type,
        title: 'Um novo marco no seu caminho.',
        message: `${greeting}${context.milestone || 'você registrou uma evolução pessoal'} — sem apagar o valor dos dias comuns que tornaram isso possível.`,
        detail: 'Use o marco como memória, não como obrigação para o próximo registro.'
      }),
      consistent_week: () => interaction({
        interaction: type,
        title: 'Sua semana ganhou ritmo.',
        message: `${greeting}este é o ${Number(context.weekCount || 0)}º registro em sete dias. Constância também inclui sessões curtas, adaptações e descanso.`,
        detail: 'Continue observando o que cabe na sua rotina sem aumentar tudo de uma vez.'
      }, ['whoMovement', 'iocLoad']),
      activity_saved: () => interaction({
        interaction: type,
        title: 'Isso já faz parte da sua história.',
        message: `${context.activityLabel || 'Atividade'} por ${Number(context.duration || 0)} minutos. Mais uma página real do seu caminho esportivo.`,
        detail: 'Você pode complementar ou corrigir este registro quando precisar.'
      }),
      daily_checkin_saved: () => interaction({
        interaction: type,
        title: 'Seu dia entrou na trajetória.',
        message: `${greeting}o que você registrou agora ajuda a mostrar sua rotina como ela aconteceu, sem exigir um dia perfeito.`,
        detail: 'Seu resumo e sua evolução foram atualizados com este contexto.'
      }),
      daily_checkin_updated: () => interaction({
        interaction: type,
        title: 'Seu dia foi atualizado.',
        message: 'As informações corrigidas já aparecem no resumo e na evolução.',
        detail: 'A atualização preserva um único registro para esta data.'
      }),
      rest_recorded: () => interaction({
        interaction: type,
        title: 'A pausa também foi registrada.',
        message: `${greeting}reconhecer um dia sem atividade ajuda a contar sua trajetória sem esconder o que aconteceu de verdade.`,
        detail: 'Descanso não cria dívida e não precisa ser compensado depois.'
      }, ['iocLoad', 'acsmRecovery']),
      meal_saved: () => interaction({
        interaction: type,
        title: 'Refeição registrada.',
        message: `${context.mealLabel || 'Sua refeição'} entrou no seu dia como memória, sem nota, culpa ou classificação do prato.`,
        detail: 'A Biblioteca BeM registra contexto; não prescreve dieta.'
      }, ['acsmRecovery'])
    };
    return (interactions[type] || interactions.activity_saved)();
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
    reviewStatus: REVIEW_STATUS,
    sources,
    normalize,
    assessSafety,
    classifyIntent,
    buildResponse,
    buildInteraction,
    buildDashboardWelcome,
    buildArrivalMoment
  });
});
