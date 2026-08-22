(function (globalScope, factory) {
  'use strict';

  const library = factory();
  if (typeof module === 'object' && module.exports) module.exports = library;
  if (globalScope) globalScope.BeKnowledgeLibrary = library;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createBeKnowledgeLibrary() {
  'use strict';

  const VERSION = '1.3.0';
  const REVIEWED_AT = '2026-08-21';
  const REVIEW_STATUS = 'editorial-pending-professional';
  const COVERAGE = Object.freeze({
    responseIntents: 9,
    interactionTypes: 18,
    arrivalMoments: 5,
    variantsPerCoreMessage: 3
  });
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

  function hashText(value) {
    let hash = 2166136261;
    const text = String(value || 'bem-esportivo');
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function phraseSeed(namespace, context = {}, offset = 0) {
    return hashText([
      namespace,
      context.variantSeed || context.date || localDateKey(),
      context.activityLabel || '',
      context.mealLabel || '',
      context.duration || '',
      context.entries || '',
      context.streak || '',
      offset
    ].join('|'));
  }

  function choosePhrase(phrases, namespace, context = {}, offset = 0) {
    if (!Array.isArray(phrases) || !phrases.length) return '';
    return phrases[phraseSeed(namespace, context, offset) % phrases.length];
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
      label: choosePhrase(['SEU ESPAÇO PARA COMEÇAR', 'UM COMEÇO DO SEU JEITO', 'SEU CAMINHO COMEÇA AQUI'], 'welcome_empty_label', context),
      message: `${greeting}${choosePhrase([
        'você não precisa ter tudo definido para dar o primeiro passo. Este espaço existe para acompanhar o que faz sentido para a sua vida — esporte, saúde e lazer.',
        'todo caminho começa com algo possível. Registre o que faz sentido hoje e deixe sua história ganhar forma no seu ritmo.',
        'este espaço não exige um começo perfeito. Ele começa a falar com você a partir do que você vive e escolhe registrar.'
      ], 'welcome_empty_message', context)}`,
      goalLabel: choosePhrase(['Começar com calma', 'Dar um passo possível', 'Conhecer seu ritmo'], 'welcome_empty_goal', context),
      goalNote: choosePhrase(['Um registro verdadeiro já é um começo.', 'Seu primeiro passo pode ser simples.', 'O que faz sentido hoje já conta.'], 'welcome_empty_note', context)
    });

    if (!recentEntries) return response({
      label: choosePhrase(['SEU CAMINHO CONTINUA', 'TODA VOLTA TEM VALOR', 'UM NOVO PONTO DE PARTIDA'], 'welcome_return_label', context),
      message: `${greeting}${choosePhrase([
        'voltar depois de uma pausa também é fazer parte da jornada. Não há nada para compensar: escolha apenas o próximo passo que cabe hoje.',
        'sua pausa não apagou a história já construída. Você pode retomar pelo tamanho que a vida permite agora.',
        'recomeçar não significa voltar ao início. Significa continuar com o que você aprendeu sobre si.'
      ], 'welcome_return_message', context)}`,
      goalLabel: choosePhrase(['Retomar no seu ritmo', 'Voltar com presença', 'Escolher o passo de agora'], 'welcome_return_goal', context),
      goalNote: choosePhrase(['Recomeçar é continuar de outro jeito.', 'A pausa também pertence à jornada.', 'Hoje não precisa compensar ontem.'], 'welcome_return_note', context)
    });

    if (streak >= 3) return response({
      label: choosePhrase(['PRESENÇA CONSTRUÍDA', 'SEU RITMO ESTÁ APARECENDO', 'UMA HISTÓRIA EM MOVIMENTO'], 'welcome_streak_label', context),
      message: `${greeting}${choosePhrase([
        'seus registros mostram presença. Use esse histórico para se conhecer melhor, sem transformar a sequência em obrigação.',
        'sua continuidade está ganhando forma. Observe o que ajudou, acolha os ajustes e preserve espaço para descansar.',
        'há um ritmo sendo construído nos seus registros. Ele serve para orientar você, nunca para cobrar perfeição.'
      ], 'welcome_streak_message', context)}`,
      goalLabel: choosePhrase(['Seguir com presença', 'Preservar seu ritmo', 'Continuar se conhecendo'], 'welcome_streak_goal', context),
      goalNote: choosePhrase(['Seu ritmo vale mais do que uma sequência.', 'Constância também inclui adaptação.', 'Continuar não significa fazer sempre igual.'], 'welcome_streak_note', context)
    });

    return response({
      label: choosePhrase(['UM PASSO DE CADA VEZ', 'SEU RITMO, SUA HISTÓRIA', 'O QUE VOCÊ VIVE TAMBÉM CONTA'], 'welcome_active_label', context),
      message: `${greeting}${choosePhrase([
        'cada registro ajuda a enxergar o que apoia sua rotina. Você não está sozinho na busca por mais movimento, saúde e momentos de lazer.',
        'sua história fica mais clara a cada registro. Aos poucos, você descobre o que cabe, o que ajuda e o que precisa mudar.',
        'o seu caminho é feito de movimento, pausas e escolhas reais. Este espaço existe para devolver sentido ao que você registra.'
      ], 'welcome_active_message', context)}`,
      goalLabel: objective === 'saude' ? 'Cuidar de você' : 'Construir seu ritmo',
      goalNote: choosePhrase(['O que cabe hoje também conta.', 'Pequenos registros revelam grandes aprendizados.', 'Seu caminho não precisa parecer com o de ninguém.'], 'welcome_active_note', context)
    });
  }

  function buildArrivalMoment(arrival, context = {}) {
    const moments = {
      ready: {
        messages: ['Que bom ter disposição hoje. Escolha um passo que preserve essa energia também para amanhã.', 'Sua energia chegou com você. Use-a com presença, sem precisar transformar o dia em prova.', 'Hoje parece haver espaço para se movimentar. Escolha algo que faça bem agora e ainda respeite o depois.'],
        focuses: ['Movimento com presença', 'Energia com equilíbrio', 'Aproveitar sem exagerar']
      },
      short: {
        messages: ['Um dia cheio não diminui sua intenção. Uma versão curta, uma pausa ou um registro já podem fazer sentido.', 'Pouco tempo não significa nenhum caminho. Reduza o tamanho do passo até ele caber de verdade.', 'Seu dia está apertado; sua escolha pode ser leve. Alguns minutos ou um registro honesto já contam.'],
        focuses: ['Um passo que caiba hoje', 'Simplificar sem abandonar', 'Cuidar dentro do tempo real']
      },
      tired: {
        messages: ['Cansaço merece escuta, não cobrança. Você pode descansar, observar como está ou apenas registrar este momento.', 'Hoje o corpo pede menos. Respeitar esse sinal também é participar da própria jornada.', 'Nem todo dia precisa avançar do mesmo jeito. Recuperar, adaptar ou pausar são escolhas válidas.'],
        focuses: ['Cuidar da recuperação', 'Escutar antes de decidir', 'Dar espaço ao descanso']
      },
      returning: {
        messages: ['Voltar aos poucos é uma forma corajosa de continuar. Não há nada para compensar.', 'Você não está voltando ao zero. Está retomando com a experiência de quem já percorreu uma parte do caminho.', 'Toda volta pode começar menor. Escolha o passo de agora, sem cobrar o ritmo de antes.'],
        focuses: ['Retomar no seu ritmo', 'Recomeçar sem dívida', 'Continuar de um novo ponto']
      },
      present: {
        messages: ['Estar aqui já é uma escolha por você. Quando quiser, conte uma coisa pequena sobre o seu dia.', 'Você chegou, e isso basta para começar a perceber como está. O próximo passo pode vir depois.', 'Antes de decidir o que fazer, reconheça seu momento. Sua jornada também é feita dessa escuta.'],
        focuses: ['Reconhecer seu momento', 'Estar presente primeiro', 'Perceber antes de escolher']
      }
    };
    const selected = moments[arrival] || { messages: ['Seu momento importa. Escolha a opção que melhor descreve como você chega hoje.'], focuses: ['Um passo possível'] };
    const message = choosePhrase(selected.messages, `arrival_${arrival || 'open'}_message`, context);
    const focus = choosePhrase(selected.focuses, `arrival_${arrival || 'open'}_focus`, context);
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
    const pick = (phrases, part, offset = 0) => choosePhrase(phrases, `interaction_${type}_${part}`, context, offset);
    const interactions = {
      plan_saved: () => interaction({
        interaction: type,
        title: context.isRest
          ? pick(['Seu descanso entrou no plano.', 'Sua pausa agora tem espaço.', 'O cuidado também foi planejado.'], 'title')
          : pick(['Seu plano ganhou forma.', 'Seu próximo passo está combinado.', 'Uma intenção possível para o seu dia.'], 'title'),
        message: context.isRest
          ? `${greeting}${pick(['planejar uma pausa também é cuidar da continuidade da sua jornada.', 'dar lugar ao descanso pode ajudar você a continuar com mais presença.', 'reconhecer a necessidade de recuperar é uma escolha legítima do seu caminho.'], 'message')}`
          : `${greeting}${pick([
            `${context.activityLabel || 'sua atividade'} ficou combinada para ${context.time || 'o horário escolhido'}, por ${Number(context.duration || 0)} minutos.`,
            `você reservou ${context.time || 'um horário'} para ${context.activityLabel || 'sua atividade'}, com ${Number(context.duration || 0)} minutos possíveis.`,
            `há um lugar no seu dia para ${context.activityLabel || 'sua atividade'}: ${context.time || 'no horário escolhido'}, por ${Number(context.duration || 0)} minutos.`
          ], 'message')}`,
        detail: pick(['O plano registra sua intenção. Depois, conte o que realmente aconteceu, mesmo que tenha sido diferente.', 'Esta é uma intenção, não uma cobrança. Quando o dia terminar, registre a experiência real e os ajustes que surgiram.', 'Planejar ajuda a abrir espaço; registrar depois ajuda a entender a realidade. Mudanças no caminho também fazem parte.'], 'detail')
      }),
      first_activity: () => interaction({
        interaction: type,
        title: pick(['Sua história começou.', 'A primeira página do seu caminho.', 'Seu diário agora tem um começo.'], 'title'),
        message: `${greeting}${pick(['este é o primeiro registro do seu diário esportivo. Ele não precisa representar um desempenho perfeito — apenas o que você viveu.', 'você acaba de transformar uma experiência em memória. O valor deste começo está em ser verdadeiro, não perfeito.', 'seu primeiro registro já diz algo importante: existe uma história que merece ser acompanhada do seu jeito.'], 'message')}`,
        detail: pick(['Cada novo registro ajudará a mostrar ritmo, pausas, retornos e descobertas.', 'Daqui em diante, atividades, pausas e mudanças poderão revelar o ritmo que combina com sua vida.', 'O diário vai ganhar significado aos poucos, com acontecimentos reais e sem comparação com outras pessoas.'], 'detail')
      }),
      activity_updated: () => interaction({
        interaction: type,
        title: pick(['Seu registro foi atualizado.', 'Sua história recebeu o ajuste.', 'Agora o registro está como você viveu.'], 'title'),
        message: pick(['A informação corrigida já faz parte da sua linha do tempo.', 'O ajuste foi salvo e sua trajetória agora reflete melhor o que aconteceu.', 'A mudança entrou no diário sem apagar a importância daquele momento.'], 'message'),
        detail: pick(['Sua história continua organizada sem criar uma atividade duplicada.', 'Você pode corrigir seus registros sempre que precisar; a linha do tempo mantém uma única versão da atividade.', 'O diário preservou a organização e substituiu somente a informação que você escolheu atualizar.'], 'detail')
      }),
      return_after_pause: () => interaction({
        interaction: type,
        title: pick(['Seu retorno também é evolução.', 'Você abriu um novo capítulo.', 'Voltar já é parte do caminho.'], 'title'),
        message: `${greeting}${pick([
          `você voltou depois de ${Number(context.gapDays || 0)} dias. A pausa não apagou o que veio antes, e este registro não precisa compensar o tempo parado.`,
          `depois de ${Number(context.gapDays || 0)} dias, sua história ganhou um novo registro. Você não precisa retomar pelo ritmo de antes.`,
          `foram ${Number(context.gapDays || 0)} dias até esta volta. O intervalo pertence à sua trajetória e não criou nenhuma dívida com o esporte.`
        ], 'message')}`,
        detail: pick(['Observe como você se sentiu e escolha o próximo passo pelo momento atual.', 'Use a resposta do corpo e a realidade de agora para decidir o que vem depois, sem pressa para recuperar tempo.', 'Deixe este retorno ser uma referência: o próximo passo pode manter, reduzir ou adaptar o que você fez hoje.'], 'detail')
      }, ['returnToSport', 'iocLoad']),
      low_feeling_activity: () => interaction({
        interaction: type,
        tone: 'care',
        title: pick(['Sua percepção também importa.', 'O modo como você se sentiu merece atenção.', 'Este registro pede um olhar mais cuidadoso.'], 'title'),
        message: `${greeting}${pick(['você registrou a atividade e indicou que ela foi difícil ou cansativa. Isso é informação útil, não falta de compromisso.', 'o esforço de hoje parece ter pesado mais. Reconhecer isso ajuda a cuidar dos próximos passos sem transformar desconforto em cobrança.', 'sua avaliação mostra um dia exigente. Essa percepção serve para orientar cuidado e adaptação, não para julgar sua dedicação.'], 'message')}`,
        detail: pick(['Considere recuperação, sono e desconfortos antes de decidir o próximo esforço.', 'Antes da próxima atividade, observe energia, sono e qualquer desconforto. Se houver piora ou sinal intenso, interrompa e procure avaliação.', 'Dê prioridade à recuperação e compare apenas com seu estado atual. Dor, piora ou insegurança pedem orientação individual.'], 'detail')
      }, ['iocLoad', 'acsmRecovery']),
      personal_milestone: () => interaction({
        interaction: type,
        title: pick(['Um novo marco no seu caminho.', 'Hoje sua história ganhou uma conquista.', 'Vale guardar este momento.'], 'title'),
        message: `${greeting}${pick([`${context.milestone || 'você registrou uma evolução pessoal'} — sem apagar o valor dos dias comuns que tornaram isso possível.`, `${context.milestone || 'esta evolução pessoal'} agora faz parte do seu diário. Ela nasceu de uma trajetória maior do que um único resultado.`, `há um novo marco registrado: ${context.milestone || 'uma evolução pessoal'}. Celebre sem transformar a conquista em exigência permanente.`], 'message')}`,
        detail: pick(['Use o marco como memória, não como obrigação para o próximo registro.', 'Guarde essa referência com carinho; o próximo dia pode ter outro ritmo e continuar tendo valor.', 'A conquista mostra uma possibilidade, não uma meta mínima para todas as próximas atividades.'], 'detail')
      }),
      consistent_week: () => interaction({
        interaction: type,
        title: pick(['Sua semana ganhou ritmo.', 'Sua presença está aparecendo.', 'Há uma continuidade sendo construída.'], 'title'),
        message: `${greeting}${pick([`este é o ${Number(context.weekCount || 0)}º registro em sete dias. Constância também inclui sessões curtas, adaptações e descanso.`, `você chegou ao ${Number(context.weekCount || 0)}º registro desta semana. O valor está em reconhecer o que tornou essa presença possível.`, `já são ${Number(context.weekCount || 0)} registros em sete dias. Esse ritmo pode incluir intensidade diferente, pausas e escolhas mais curtas.`], 'message')}`,
        detail: pick(['Continue observando o que cabe na sua rotina sem aumentar tudo de uma vez.', 'Proteja o que está funcionando e ajuste o que estiver pesado; continuidade não exige crescimento constante.', 'Use a semana como aprendizado. Não é preciso aumentar duração ou esforço só porque a sequência apareceu.'], 'detail')
      }, ['whoMovement', 'iocLoad']),
      activity_saved: () => interaction({
        interaction: type,
        title: pick(['Isso já faz parte da sua história.', 'Mais um momento guardado no seu caminho.', 'Seu movimento virou memória.'], 'title'),
        message: pick([`${context.activityLabel || 'Atividade'} por ${Number(context.duration || 0)} minutos. Mais uma página real do seu caminho esportivo.`, `${Number(context.duration || 0)} minutos de ${String(context.activityLabel || 'atividade').toLocaleLowerCase('pt-BR')} agora fazem parte da sua linha do tempo.`, `Você registrou ${context.activityLabel || 'sua atividade'} e os ${Number(context.duration || 0)} minutos que viveu. Seu diário ficou mais completo.`], 'message'),
        detail: pick(['Você pode complementar ou corrigir este registro quando precisar.', 'Se lembrar de algo diferente, volte e ajuste. Sua história deve refletir você, não uma versão perfeita.', 'O registro fica neste aparelho e pode ser complementado ou corrigido sempre que fizer sentido.'], 'detail')
      }),
      daily_checkin_saved: () => interaction({
        interaction: type,
        title: pick(['Seu dia entrou na trajetória.', 'Hoje também ganhou um lugar na sua história.', 'Seu momento foi registrado.'], 'title'),
        message: `${greeting}${pick(['o que você registrou agora ajuda a mostrar sua rotina como ela aconteceu, sem exigir um dia perfeito.', 'este retrato do seu dia ajuda o site a devolver respostas mais próximas da sua realidade.', 'o registro de hoje acrescenta contexto à sua jornada — inclusive quando o dia foi diferente do planejado.'], 'message')}`,
        detail: pick(['Seu resumo e sua evolução foram atualizados com este contexto.', 'A partir de agora, o painel considera este momento para mostrar uma leitura mais humana da sua trajetória.', 'Seu contexto foi incluído no resumo local e ajudará a reconhecer mudanças, pausas e continuidades.'], 'detail')
      }),
      daily_checkin_updated: () => interaction({
        interaction: type,
        title: pick(['Seu dia foi atualizado.', 'O registro de hoje ficou mais fiel.', 'A mudança já entrou na sua história.'], 'title'),
        message: pick(['As informações corrigidas já aparecem no resumo e na evolução.', 'Seu painel já considera a nova versão do que você contou sobre este dia.', 'A correção foi salva e agora representa melhor o momento que você viveu.'], 'message'),
        detail: pick(['A atualização preserva um único registro para esta data.', 'O sistema substituiu somente o registro deste dia, sem criar uma cópia.', 'Sua linha do tempo continua organizada com uma única versão para a data.'], 'detail')
      }),
      rest_recorded: () => interaction({
        interaction: type,
        title: pick(['A pausa também foi registrada.', 'Seu descanso ganhou espaço na história.', 'Hoje o cuidado teve outro ritmo.'], 'title'),
        message: `${greeting}${pick(['reconhecer um dia sem atividade ajuda a contar sua trajetória sem esconder o que aconteceu de verdade.', 'registrar a pausa torna seu diário mais humano e mais próximo da vida como ela é.', 'seu caminho também é feito dos dias em que descansar, adaptar ou simplesmente parar foi a escolha possível.'], 'message')}`,
        detail: pick(['Descanso não cria dívida e não precisa ser compensado depois.', 'Amanhã não precisa pagar pelo descanso de hoje. Escolha o próximo passo pelo modo como você estiver.', 'Recuperação também sustenta continuidade; não transforme esta pausa em obrigação futura.'], 'detail')
      }, ['iocLoad', 'acsmRecovery']),
      meal_saved: () => interaction({
        interaction: type,
        title: pick(['Refeição registrada.', 'Mais um momento do seu dia guardado.', 'Sua alimentação entrou no diário.'], 'title'),
        message: pick([`${context.mealLabel || 'Sua refeição'} entrou no seu dia como memória, sem nota, culpa ou classificação do prato.`, `${context.mealLabel || 'A refeição'} foi registrada sem nota, culpa ou comparação. O objetivo é lembrar o contexto do seu dia.`, `O diário guardou ${String(context.mealLabel || 'sua refeição').toLocaleLowerCase('pt-BR')} sem nota, culpa ou rótulos de certo e errado.`], 'message'),
        detail: pick(['A Biblioteca BeM registra contexto; não prescreve dieta.', 'Este espaço ajuda a lembrar o que aconteceu, mas não avalia nutrientes nem substitui orientação de nutricionista.', 'O registro é uma memória pessoal. A Biblioteca BeM não classifica alimentos e não oferece prescrição individual.'], 'detail')
      }, ['acsmRecovery']),
      profile_saved: () => interaction({
        interaction: type,
        title: pick(['Seu perfil ficou mais completo.', 'Agora o site conhece melhor o seu momento.', 'Suas escolhas foram atualizadas.'], 'title'),
        message: `${greeting}${pick(['as informações escolhidas por você ajudam a tornar a jornada mais próxima da sua realidade.', 'o seu contexto foi atualizado e passa a orientar os próximos passos apresentados no Meu Caminho Be.', 'as mudanças já ajudam o site a falar com mais sentido sobre seus objetivos e sua prática.'], 'message')}`,
        detail: pick(['Você pode rever ou corrigir esses dados quando quiser.', 'Nada fica definitivo: suas informações podem mudar junto com a sua vida.', 'O perfil é seu e pode ser atualizado sempre que deixar de representar seu momento.'], 'detail')
      }),
      weekly_review_saved: () => interaction({
        interaction: type,
        title: pick(['Sua semana deixou um aprendizado.', 'Você transformou registros em direção.', 'A próxima semana ganhou um ponto de partida.'], 'title'),
        message: `${greeting}${pick(['sua revisão reconhece o que aconteceu de verdade e escolhe um ajuste possível para continuar.', 'você olhou para a semana sem apagar dificuldades e encontrou uma direção para o próximo ciclo.', 'os registros agora viraram uma escolha consciente para a semana que começa.'], 'message')}`,
        detail: pick(['A decisão pode ser revista se a sua realidade mudar.', 'Use essa direção como apoio, não como obrigação. Ajustar também é parte do processo.', 'Na próxima revisão, observe o que ajudou e o que precisa ficar mais simples.'], 'detail')
      }),
      task_completed: () => interaction({
        interaction: type,
        title: pick(['Uma escolha virou ação.', 'Você concluiu o que cabia agora.', 'Mais um passo encontrado no dia real.'], 'title'),
        message: `${greeting}${pick(['a tarefa foi concluída e agora faz parte do que você construiu hoje.', 'você levou uma intenção até o fim sem precisar transformar o resultado em cobrança.', 'este passo está completo. O valor dele está no espaço que encontrou dentro da sua rotina.'], 'message')}`,
        detail: pick(['Reconheça o que ajudou e siga sem pressa para acumular novas tarefas.', 'Uma conclusão não obriga a próxima. Faça uma pausa antes de escolher o que vem depois.', 'Seu caminho pode avançar por ações pequenas, repetidas ou adaptadas.'], 'detail')
      }),
      reminder_saved: () => interaction({
        interaction: type,
        title: pick(['Seu lembrete está combinado.', 'Um cuidado ficou marcado no dia.', 'O horário escolhido ficou guardado.'], 'title'),
        message: `${greeting}${pick([`o lembrete foi preparado para ${context.time || 'o horário escolhido'}.`, `quando chegar ${context.time || 'o momento escolhido'}, o site vai lembrar da prioridade que você definiu.`, `seu aparelho guardou um lembrete para ${context.time || 'mais tarde'}.`], 'message')}`,
        detail: pick(['O lembrete apoia sua intenção, mas você pode adaptar o plano se o dia mudar.', 'Quando ele chegar, observe sua realidade antes de decidir. Adiar ou ajustar também são possibilidades.', 'Você pode alterar ou remover esse horário sempre que ele deixar de ajudar.'], 'detail')
      }),
      local_data_saved: () => interaction({
        interaction: type,
        title: pick(['Salvo neste aparelho.', 'Seu registro ficou guardado aqui.', 'Tudo certo com o armazenamento local.'], 'title'),
        message: pick(['A informação foi salva somente neste navegador e não foi enviada para uma conta online.', 'Seu dado permanece neste aparelho enquanto o acesso por conta está temporariamente pausado.', 'O registro foi guardado localmente para você continuar usando o Meu Caminho Be sem login.'], 'message'),
        detail: pick(['Se os dados do navegador forem apagados ou você trocar de aparelho, este conteúdo poderá ser perdido.', 'Use a opção de backup quando quiser proteger uma cópia antes de limpar o navegador ou mudar de aparelho.', 'Este modo preserva a privacidade local, mas não sincroniza automaticamente com outros dispositivos.'], 'detail')
      }),
      backup_restored: () => interaction({
        interaction: type,
        title: pick(['Seu caminho voltou para este aparelho.', 'Backup restaurado com segurança.', 'Sua história está disponível novamente.'], 'title'),
        message: `${greeting}${pick(['os dados validados do backup já aparecem no Meu Caminho Be.', 'a cópia escolhida foi conferida e sua jornada local foi restaurada.', 'seus registros retornaram e já podem ser consultados neste navegador.'], 'message')}`,
        detail: pick(['Revise o painel para confirmar se as informações esperadas estão presentes.', 'A restauração substitui a leitura local pela cópia validada que você escolheu.', 'Guarde o arquivo de backup em um local seguro e evite compartilhá-lo com outras pessoas.'], 'detail')
      })
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
    const responseContext = Object.assign({}, context, { variantSeed: context.variantSeed || `${localDateKey()}|${normalize(query)}` });
    const pick = (phrases, part, offset = 0) => choosePhrase(phrases, `response_${intent}_${part}`, responseContext, offset);
    const responses = {
      motivation: response(Object.assign({}, common, {
        label: pick(['UM PASSO SEM COBRANÇA', 'MOTIVAÇÃO NÃO É OBRIGAÇÃO', 'O QUE CABE HOJE']),
        title: `${greeting}${pick(['você não precisa fabricar motivação para cuidar da sua jornada.', 'nem todo passo começa com vontade — ele pode começar com uma escolha pequena.', 'um dia sem entusiasmo não diminui quem você é nem o caminho que já construiu.'], 'title')}`,
        message: `${historyMessage} ${pick(['Um dia difícil não apaga o que já foi construído, e uma pausa também pode ser uma escolha consciente.', 'Hoje você pode reduzir, adaptar ou descansar. Nenhuma dessas escolhas transforma sua jornada em fracasso.', 'A falta de vontade é um retrato deste momento, não uma definição sobre sua capacidade de continuar.'], 'message')}`,
        nextTitle: pick([`Escolha entre ${duration} minutos leves ou uma pausa registrada.`, `Diminua o passo até ele caber: até ${duration} minutos ou um descanso consciente.`, 'Registre como você está antes de decidir se hoje pede movimento ou pausa.'], 'next'),
        detail: `${sportNote(context)} A sequência é uma referência, não uma dívida.`,
        primary: ['Escolher movimento leve', 'movement'], secondary: ['Registrar como estou', 'daily']
      })),
      time: response(Object.assign({}, common, {
        label: pick(['POUCO TEMPO · PASSO POSSÍVEL', 'UM PASSO QUE CABE', 'MENOS TEMPO, MAIS REALIDADE']),
        title: `${greeting}${pick(['um passo curto ainda é um passo inteiro.', 'o tamanho do passo pode mudar sem perder o sentido.', 'sua rotina real merece um plano que realmente caiba nela.'], 'title')}`,
        message: pick(['Num dia corrido, reduzir o tamanho da ação é mais coerente do que abandonar o plano ou tentar compensar depois.', 'Pouco tempo pede clareza: escolha uma versão simples e deixe de fora a obrigação de fazer tudo.', 'Adaptar o plano ao dia é uma habilidade de continuidade, não um sinal de pouca dedicação.'], 'message'),
        nextTitle: pick([`Proteja somente ${duration} minutos para a versão mais simples da prática.`, `Escolha uma ação de até ${duration} minutos que não dependa de um dia perfeito.`, 'Defina agora o menor passo que ainda faria sentido para você.'], 'next'),
        detail: sportNote(context), primary: ['Planejar movimento curto', 'movement'], secondary: ['Ver minha jornada', 'journey']
      })),
      fatigue: response(Object.assign({}, common, {
        tone: 'care', label: pick(['ENERGIA E RECUPERAÇÃO', 'HOJE O CORPO PEDE ESCUTA', 'RECUPERAR TAMBÉM É CONTINUAR']),
        title: `${greeting}${pick(['cansaço é informação, não falta de compromisso.', 'perceber o cansaço é cuidado, não falta de compromisso.', 'reduzir diante do cansaço não é falta de compromisso.'], 'title')}`,
        message: lowRecovery || shortSleep
          ? pick(['Seu registro mais recente também indica baixa disposição ou sono curto. Hoje, proteger a recuperação é mais importante do que manter uma sequência a qualquer custo.', 'O contexto recente reforça que sua energia está baixa. Dar espaço à recuperação pode ser a decisão mais coerente agora.', 'Sono curto ou disposição baixa apareceram no seu histórico. Use essa informação para evitar que a sequência fale mais alto que o cuidado.'], 'message')
          : pick(['Sem avaliação individual, o sistema não consegue dizer a causa do cansaço. Observe disposição, sono e desconfortos antes de escolher.', 'O sistema não pode identificar a origem do cansaço. Antes de agir, perceba se há sono insuficiente, desconforto ou piora.', 'Cansaço tem muitas causas e precisa de contexto. Faça uma leitura honesta da sua energia antes de decidir pelo esforço.'], 'message'),
        nextTitle: lowRecovery || shortSleep ? pick(['Planeje descanso e registre como você está.', 'Dê prioridade à recuperação neste momento.', 'Escolha uma pausa e observe como você evolui.'], 'next') : pick(['Faça um check-in honesto antes de decidir.', 'Observe seu corpo antes de escolher movimento ou descanso.', 'Registre sua energia e decida sem pressão pela sequência.'], 'next'),
        detail: 'Se o cansaço vier com sinal intenso, súbito ou piora, interrompa a atividade e procure avaliação.',
        primary: [lowRecovery || shortSleep ? 'Planejar descanso hoje' : 'Registrar como estou', lowRecovery || shortSleep ? 'rest' : 'daily'],
        secondary: ['Ver minha jornada', 'journey']
      }), ['iocLoad', 'acsmRecovery']),
      recovery: response(Object.assign({}, common, {
        tone: 'care', label: pick(['RETOMADA COM CUIDADO', 'VOLTAR É UM PROCESSO', 'UM RETORNO DO TAMANHO DE AGORA']),
        title: `${greeting}${pick(['retomar não é provar que você voltou ao nível anterior.', 'você pode voltar sem reproduzir imediatamente o ritmo de antes.', 'o retorno começa pelo que seu momento atual permite.'], 'title')}`,
        message: pick(['O retorno é um processo e deve considerar sua resposta atual, a exigência da modalidade e o plano construído com quem acompanha você.', 'Cada retomada depende do motivo da pausa, da modalidade e de como você responde agora; uma orientação individual pode ser necessária.', 'Voltar com segurança exige observar o presente, e não apenas lembrar do que você fazia antes.'], 'message'),
        nextTitle: pick(['Mantenha ou reduza o passo anterior antes de pensar em progredir.', 'Escolha uma etapa conhecida e observe a resposta antes de avançar.', 'Retome por um passo conservador e deixe a progressão para depois.'], 'next'),
        detail: 'Registre como o corpo responde durante e depois. Diante de piora, dor ou insegurança, interrompa e procure orientação.',
        primary: ['Ver meu passo atual', 'journey'], secondary: ['Encontrar profissional', 'professional']
      }), ['returnToSport', 'iocLoad']),
      nutrition: response(Object.assign({}, common, {
        label: pick(['ALIMENTAÇÃO SEM JULGAMENTO', 'COMIDA É CONTEXTO, NÃO NOTA', 'UMA MEMÓRIA DO SEU DIA']),
        title: `${greeting}${pick(['registrar uma refeição serve para lembrar, não para dar nota ao seu prato.', 'sua alimentação pode ser observada sem culpa, prêmio ou julgamento.', 'uma refeição conta parte do seu dia, não o seu valor como pessoa.'], 'title')}`,
        message: pick(['A necessidade de cada pessoa muda com rotina, modalidade, saúde, cultura e acesso. O sistema não prescreve dieta nem classifica alimentos como prêmio ou culpa.', 'Rotina, cultura, acesso, saúde e esporte mudam as necessidades. Por isso, a Biblioteca BeM não prescreve dieta e não dá nota ao prato.', 'O registro ajuda a lembrar o contexto, mas não prescreve dieta. Orientação alimentar individual pertence ao trabalho de nutricionista.'], 'message'),
        nextTitle: pick(['Planeje a próxima refeição possível e descreva o que pretende comer.', 'Registre a próxima refeição como ela é, sem precisar justificá-la.', 'Use o diário para guardar contexto, não para procurar uma nota.'], 'next'),
        detail: 'Se você busca mudança de desempenho, composição corporal ou tem condição clínica, prefira orientação individual de nutricionista.',
        primary: ['Planejar alimentação', 'nutrition'], secondary: ['Registrar Meu Hoje', 'daily']
      }), ['acsmRecovery']),
      hydration: response(Object.assign({}, common, {
        label: pick(['HIDRATAÇÃO POSSÍVEL', 'ÁGUA DENTRO DA ROTINA', 'UM CUIDADO QUE CABE NO DIA']),
        title: `${greeting}${pick(['hidratação funciona melhor quando entra no plano do dia.', 'um lembrete concreto pode aproximar a hidratação da sua rotina real.', 'hidratar-se também pode começar por organizar um momento possível.'], 'title')}`,
        message: pick(['Calor, duração, intensidade e resposta individual mudam a necessidade. Por isso, o sistema evita uma quantidade universal.', 'Não existe uma mesma quantidade para toda pessoa e situação: clima, esforço, duração e condições individuais importam.', 'A necessidade varia de acordo com ambiente, atividade e pessoa. Por segurança, o sistema não define um volume universal.'], 'message'),
        nextTitle: pick(['Defina um momento concreto para beber água antes de sair ou começar.', 'Escolha quando a água estará acessível na sua próxima atividade.', 'Inclua um lembrete simples de hidratação no seu plano.'], 'next'),
        detail: 'Em sessões longas, calor intenso ou necessidades clínicas, procure orientação individual para um plano adequado.',
        primary: ['Planejar hidratação', 'hydration'], secondary: ['Registrar Meu Hoje', 'daily']
      }), ['acsmRecovery']),
      consistency: response(Object.assign({}, common, {
        label: pick(['RECOMEÇO TAMBÉM É EVOLUÇÃO', 'SUA HISTÓRIA NÃO FOI APAGADA', 'CONTINUAR DE UM NOVO PONTO']),
        title: `${greeting}${pick(['uma interrupção não apaga sua identidade esportiva.', 'a pausa mudou o ritmo, não o valor do seu caminho.', 'você não precisa chamar de fracasso um período em que a vida pediu outra coisa.'], 'title')}`,
        message: pick(['O diário existe para mostrar a história completa: prática, pausa, retorno e adaptação. Consistência não exige perfeição.', 'Toda trajetória real tem mudanças. A continuidade aparece também na capacidade de adaptar e recomeçar.', 'Seus registros não precisam formar uma linha perfeita. Eles podem contar movimento, pausa, aprendizado e volta.'], 'message'),
        nextTitle: pick([`Escolha um recomeço de até ${duration} minutos, sem compensar o período parado.`, `Retome com até ${duration} minutos e observe o presente, não a dívida imaginada com o passado.`, 'Escolha a menor versão do passo que ainda faria sentido hoje.'], 'next'),
        detail: sportNote(context), primary: ['Planejar meu recomeço', 'movement'], secondary: ['Ver minha história', 'journey']
      }), ['whoMovement', 'iocLoad']),
      next: response(Object.assign({}, common, {
        label: pick(['SEU PRÓXIMO PASSO', 'UMA ESCOLHA DE CADA VEZ', 'O CAMINHO CONTINUA DAQUI']),
        title: `${greeting}${pick(['uma ação de cada vez.', 'o próximo passo não precisa resolver tudo.', 'vamos encontrar a escolha mais clara para este momento.'], 'title')}`,
        message: `${historyMessage} ${pick(['O melhor passo é aquele que cabe no dia, pode ser tentado com segurança e depois registrado.', 'Uma boa direção respeita sua realidade atual e permite adaptação se o dia mudar.', 'O passo mais útil é observável, possível e seguro — não necessariamente o maior.'], 'message')}`,
        nextTitle: context.profile?.nextAction || pick([`Use até ${duration} minutos para continuar a etapa atual.`, `Reserve até ${duration} minutos para experimentar o passo atual.`, 'Abra sua jornada e escolha apenas a próxima ação indicada.'], 'next'),
        detail: 'Abra a jornada para ver o passo combinado. Ao terminar, registre a resposta real — inclusive se precisou adaptar.',
        primary: ['Abrir meu passo atual', 'journey'], secondary: ['Registrar Meu Hoje', 'daily']
      })),
      general: response(Object.assign({}, common, {
        label: pick(['LEITURA DA SUA JORNADA', 'UMA RESPOSTA A PARTIR DO SEU CONTEXTO', 'SEU MOMENTO ORIENTA O PASSO']),
        title: `${greeting}${pick(['vamos transformar sua dúvida em uma escolha observável.', 'sua pergunta pode começar por uma decisão simples e concreta.', 'vamos olhar para o que você contou antes de escolher um caminho.'], 'title')}`,
        message: pick([`Considerei o objetivo de ${context.objective || 'seguir uma jornada possível'}, a prática de ${context.modality || 'atividade física'} e o tempo disponível.`, `A resposta parte do seu objetivo de ${context.objective || 'seguir uma jornada possível'}, da sua prática e do espaço disponível na rotina.`, `Seu momento, a prática de ${context.modality || 'atividade física'} e o objetivo atual ajudam a tornar a orientação menos genérica.`], 'message'),
        nextTitle: pick(['Escolha entre continuar a etapa atual ou registrar como você está hoje.', 'Abra o passo atual ou faça um registro curto do seu momento.', 'Decida se agora faz mais sentido avançar na jornada ou contar como você está.'], 'next'),
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
    coverage: COVERAGE,
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
