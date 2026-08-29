(function (globalScope, factory) {
  'use strict';

  const library = factory();
  if (typeof module === 'object' && module.exports) module.exports = library;
  if (globalScope) globalScope.BeSportsLibrary = library;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createBeSportsLibrary() {
  'use strict';

  const VERSION = '1.0.0';
  const REVIEWED_AT = '2026-08-29';
  const REVIEW_STATUS = 'editorial-educational';

  const sports = Object.freeze([
    {
      id: 'natacao', label: 'natação', grammar: ['na', 'a', 'à'], aliases: ['nadar', 'natacao', 'nado', 'piscina', 'crawl', 'nado livre'],
      guidance: '1. Escolha uma piscina segura e supervisionada. 2. Procure uma aula para iniciantes ou orientação de um profissional de natação. 3. Comece pela adaptação à água, respiração, flutuação e deslize. 4. Avance para distâncias curtas somente quando estiver confortável.',
      benefits: 'A prática reúne resistência cardiorrespiratória, coordenação global e mobilidade, com baixo impacto articular por causa do apoio da água.',
      techniques: [
        { id: 'respiracao', aliases: ['respirar', 'respiracao', 'fôlego', 'folego'], title: 'Respiração mais organizada na natação', tips: 'Expire de forma contínua dentro da água, gire a cabeça sem levantar o tronco e pratique primeiro em distâncias curtas.' },
        { id: 'crawl', aliases: ['crawl', 'nado livre', 'bracada'], title: 'Fundamentos para melhorar o nado crawl', tips: 'Mantenha o corpo alinhado, faça a entrada da mão à frente do ombro e preserve uma braçada contínua antes de buscar velocidade.' }
      ]
    },
    {
      id: 'corrida', label: 'corrida', grammar: ['na', 'a', 'à'], aliases: ['correr', 'corrida', 'trote', 'running', 'corredor'],
      guidance: 'Comece alternando caminhada e corrida em um ritmo confortável, com uma duração que caiba na sua rotina.',
      benefits: 'Pode favorecer resistência cardiorrespiratória, autonomia, disposição e percepção de ritmo quando praticada de forma progressiva.',
      techniques: [
        { id: 'ritmo', aliases: ['pace', 'ritmo', 'velocidade', 'mais rapido', 'mais rápida'], title: 'Como organizar melhor o ritmo de corrida', tips: 'Comece em ritmo conversável, evite acelerar nos primeiros minutos e compare treinos semelhantes antes de ajustar o pace.' },
        { id: 'postura', aliases: ['postura', 'passada', 'pisada'], title: 'Postura e passada durante a corrida', tips: 'Olhe à frente, mantenha braços relaxados e deixe a passada acontecer abaixo do corpo, sem tentar alongá-la artificialmente.' }
      ]
    },
    {
      id: 'caminhada', label: 'caminhada', grammar: ['na', 'a', 'à'], aliases: ['caminhar', 'caminhada', 'andar a pe', 'andar'],
      guidance: 'Escolha um percurso conhecido, uma duração possível e um ritmo em que você ainda consiga conversar.',
      benefits: 'Ajuda a ampliar o movimento diário, a resistência e a autonomia, além de ser uma prática acessível e fácil de adaptar.',
      techniques: [{ id: 'ritmo', aliases: ['ritmo', 'passo', 'postura'], title: 'Uma caminhada mais confortável e eficiente', tips: 'Mantenha olhar à frente, passos naturais e braços soltos; aumente primeiro a duração e só depois o ritmo.' }]
    },
    {
      id: 'ciclismo', label: 'ciclismo', grammar: ['no', 'o', 'ao'], aliases: ['pedalar', 'pedal', 'ciclismo', 'bicicleta', 'bike'],
      guidance: 'Escolha um percurso compatível com o seu momento e confira equipamento, visibilidade e condições do trajeto.',
      benefits: 'Trabalha resistência cardiorrespiratória, coordenação e força de membros inferiores, com possibilidade de uso esportivo, recreativo ou de deslocamento.',
      techniques: [{ id: 'pedalada', aliases: ['cadencia', 'marcha', 'subida', 'pedalada'], title: 'Pedalada mais estável e econômica', tips: 'Use uma marcha que permita cadência confortável, antecipe as trocas antes das subidas e mantenha mãos e ombros relaxados.' }]
    },
    {
      id: 'futebol', label: 'futebol', grammar: ['no', 'o', 'ao'], aliases: ['futebol', 'jogar bola', 'campo', 'society', 'chute', 'chutar'],
      guidance: 'Comece pelos fundamentos e por uma participação compatível com o seu condicionamento atual.',
      benefits: 'Combina resistência, velocidade, coordenação, tomada de decisão e interação coletiva em uma prática dinâmica.',
      techniques: [
        { id: 'chute', aliases: ['chute', 'chutar', 'finalizacao', 'finalizar'], title: 'Dicas para melhorar o chute no futebol', tips: 'Apoie o pé ao lado da bola, mantenha o tornozelo firme e direcione o movimento para o alvo antes de aumentar a força.' },
        { id: 'passe', aliases: ['passe', 'passar a bola'], title: 'Como tornar o passe mais preciso', tips: 'Observe antes de receber, ajuste o corpo para o próximo movimento e use a parte interna do pé nas trocas curtas.' },
        { id: 'drible', aliases: ['drible', 'driblar'], title: 'Fundamentos para evoluir no drible', tips: 'Mantenha a bola próxima, alterne direção e velocidade e treine os dois lados antes de aplicar o gesto no jogo.' }
      ]
    },
    {
      id: 'futsal', label: 'futsal', grammar: ['no', 'o', 'ao'], aliases: ['futsal', 'futebol de salao'],
      guidance: 'Priorize domínio, passe e deslocamentos progressivos antes de aumentar a intensidade do jogo.',
      benefits: 'Estimula agilidade, coordenação, velocidade de decisão e cooperação em espaços reduzidos.',
      techniques: [{ id: 'dominio', aliases: ['dominio', 'passe', 'marcacao'], title: 'Domínio e passe em espaços curtos', tips: 'Receba já orientando o corpo, use a sola para controlar quando necessário e passe depois de observar o próximo espaço.' }]
    },
    {
      id: 'musculacao', label: 'musculação', grammar: ['na', 'a', 'à'], aliases: ['musculacao', 'academia', 'treino de forca', 'levantar peso'],
      guidance: 'Comece com movimentos conhecidos, execução controlada e orientação adequada para ajustar os exercícios.',
      benefits: 'Pode contribuir para força, autonomia, capacidade funcional e manutenção de massa muscular ao longo da vida.',
      techniques: [{ id: 'execucao', aliases: ['execucao', 'carga', 'peso', 'repeticao'], title: 'Como preservar a execução na musculação', tips: 'Use uma carga que permita controle, respeite a amplitude confortável e encerre a série quando a técnica começar a se perder.' }]
    },
    {
      id: 'voleibol', label: 'voleibol', grammar: ['no', 'o', 'ao'], aliases: ['volei', 'voleibol'],
      guidance: 'Comece pelos gestos básicos e por atividades que permitam aprender o posicionamento com calma.',
      benefits: 'Trabalha coordenação, agilidade, impulsão, percepção espacial, comunicação e cooperação entre as pessoas da equipe.',
      techniques: [
        { id: 'saque', aliases: ['saque', 'sacar', 'servico'], title: 'Dicas para um bom saque no voleibol', tips: 'Adote uma base equilibrada, lance a bola sempre na mesma altura e faça o contato com a mão firme, direcionando primeiro antes de buscar potência.' },
        { id: 'manchete', aliases: ['manchete', 'recepcao', 'receber saque'], title: 'Como melhorar a manchete', tips: 'Una os antebraços, flexione as pernas e oriente a plataforma para o alvo sem balançar excessivamente os braços.' },
        { id: 'ataque', aliases: ['cortada', 'ataque', 'atacar', 'bloqueio'], title: 'Fundamentos para ataque e bloqueio', tips: 'Organize os passos de aproximação, sincronize o salto com a bola e priorize o tempo do movimento antes da força.' }
      ]
    },
    {
      id: 'basquete', label: 'basquete', grammar: ['no', 'o', 'ao'], aliases: ['basquete', 'basquetebol', 'basket'],
      guidance: 'Comece por controle de bola, passe e arremesso antes de aumentar a velocidade da prática.',
      benefits: 'Combina resistência, agilidade, coordenação entre mãos e olhos, leitura de jogo e trabalho coletivo.',
      techniques: [
        { id: 'arremesso', aliases: ['arremesso', 'arremessar', 'cesta'], title: 'Como organizar melhor o arremesso', tips: 'Alinhe pés e cotovelo com o alvo, conduza a bola com controle e termine o movimento mantendo o punho apontado para a cesta.' },
        { id: 'drible', aliases: ['drible', 'quicar', 'controle de bola'], title: 'Controle de bola no basquete', tips: 'Mantenha joelhos flexionados, use as pontas dos dedos e alterne altura e direção sem olhar o tempo todo para a bola.' }
      ]
    },
    {
      id: 'handebol', label: 'handebol', grammar: ['no', 'o', 'ao'], aliases: ['handebol', 'andebol'],
      guidance: 'Comece pelos fundamentos de passe, recepção e deslocamento antes de aumentar a intensidade do jogo.',
      benefits: 'Estimula resistência, potência, coordenação, percepção de espaço e cooperação coletiva.',
      techniques: [{ id: 'arremesso', aliases: ['arremesso', 'arremessar', 'passe'], title: 'Arremesso mais coordenado no handebol', tips: 'Ajuste a passada, mantenha o braço preparado acima do ombro e direcione o movimento antes de aumentar a potência.' }]
    },
    {
      id: 'beach-tennis', label: 'beach tennis', grammar: ['no', 'o', 'ao'], aliases: ['beach tennis', 'tenis de praia'],
      guidance: 'Conheça as regras básicas, pratique o controle da raquete e comece por trocas de bola em ritmo confortável.',
      benefits: 'Reúne agilidade, coordenação, equilíbrio na areia, resistência e interação social.',
      techniques: [{ id: 'saque', aliases: ['saque', 'sacar', 'voleio'], title: 'Controle e direção no saque do beach tennis', tips: 'Use um lançamento consistente, mantenha a raquete firme e busque direção e regularidade antes da potência.' }]
    },
    {
      id: 'tenis-mesa', label: 'tênis de mesa', grammar: ['no', 'o', 'ao'], aliases: ['tenis de mesa', 'ping pong'],
      guidance: 'Comece pelo controle da raquete, saque e devolução antes de buscar velocidade.',
      benefits: 'Desenvolve tempo de reação, coordenação, concentração, precisão e tomada rápida de decisão.',
      techniques: [{ id: 'saque', aliases: ['saque', 'sacar', 'efeito'], title: 'Regularidade no saque do tênis de mesa', tips: 'Mantenha um lançamento controlado, varie direção e efeito de forma consciente e recupere a posição logo após o contato.' }]
    },
    {
      id: 'badminton', label: 'badminton', grammar: ['no', 'o', 'ao'], aliases: ['badminton', 'peteca'],
      guidance: 'Conheça a empunhadura, os deslocamentos e o contato com a peteca em uma prática inicial.',
      benefits: 'Trabalha agilidade, reação, coordenação, equilíbrio e resistência em deslocamentos variados.',
      techniques: [{ id: 'saque', aliases: ['saque', 'sacar', 'smash'], title: 'Saque e recuperação no badminton', tips: 'Use uma empunhadura relaxada, direcione a peteca com movimento curto e volte à posição central depois do golpe.' }]
    },
    {
      id: 'tenis', label: 'tênis', grammar: ['no', 'o', 'ao'], aliases: ['tenis', 'tenista', 'raquete'],
      guidance: 'Conheça empunhadura, deslocamento e contato com a bola em uma prática inicial orientada.',
      benefits: 'Estimula resistência, agilidade, coordenação, equilíbrio e tomada de decisão em diferentes situações de jogo.',
      techniques: [
        { id: 'saque', aliases: ['saque', 'sacar', 'servico'], title: 'Dicas para organizar o saque no tênis', tips: 'Estabilize a base, repita o lançamento da bola no mesmo ponto e coordene pernas, tronco e braço antes de buscar velocidade.' },
        { id: 'forehand', aliases: ['forehand', 'direita', 'golpe de direita'], title: 'Contato mais consistente no forehand', tips: 'Prepare a raquete cedo, ajuste a distância para a bola e termine o movimento na direção do alvo.' }
      ]
    },
    {
      id: 'lutas', label: 'lutas', grammar: ['nas', 'as', 'às'], aliases: ['luta', 'lutas', 'boxe', 'judo', 'jiu jitsu', 'karate', 'muay thai'],
      guidance: 'Procure um ambiente orientado, conheça as regras de segurança e comece pelos fundamentos técnicos.',
      benefits: 'Podem desenvolver coordenação, força, mobilidade, disciplina, autocontrole e leitura do movimento, de acordo com cada modalidade.',
      techniques: [{ id: 'base', aliases: ['base', 'guarda', 'defesa', 'golpe'], title: 'Base e controle antes da velocidade', tips: 'Aprenda posição, distância e defesa com supervisão; repita o gesto de forma controlada antes de aumentar intensidade ou contato.' }]
    },
    {
      id: 'danca', label: 'dança', grammar: ['na', 'a', 'à'], aliases: ['dancar', 'danca', 'zumba', 'ballet'],
      guidance: 'Escolha um estilo que faça sentido para você e comece por uma aula de nível iniciante.',
      benefits: 'Reúne coordenação, ritmo, mobilidade, consciência corporal, memória e expressão em uma prática que também pode ser social.',
      techniques: [{ id: 'ritmo', aliases: ['ritmo', 'passo', 'coreografia'], title: 'Como aprender novos passos com mais clareza', tips: 'Divida a sequência em partes, marque primeiro o ritmo e junte braços e deslocamentos somente depois.' }]
    },
    {
      id: 'atletismo', label: 'atletismo', grammar: ['no', 'o', 'ao'], aliases: ['atletismo', 'salto em distancia', 'arremesso de peso'],
      guidance: 'Identifique a prova que deseja conhecer e procure uma iniciação compatível com seu momento.',
      benefits: 'Suas provas podem desenvolver velocidade, resistência, potência, coordenação e domínio de diferentes movimentos fundamentais.',
      techniques: [{ id: 'largada', aliases: ['largada', 'arrancada', 'sprint', 'velocidade'], title: 'Fundamentos para uma largada mais organizada', tips: 'Ajuste a posição inicial, projete o corpo para a frente e aumente a frequência dos passos progressivamente.' }]
    },
    {
      id: 'triatlo', label: 'triatlo', grammar: ['no', 'o', 'ao'], aliases: ['triatlo', 'triathlon'],
      guidance: 'Organize natação, ciclismo e corrida de forma progressiva, com orientação para equilibrar as três modalidades.',
      benefits: 'Combina resistência cardiorrespiratória, versatilidade motora, organização de rotina e adaptação entre diferentes práticas.',
      techniques: [{ id: 'transicao', aliases: ['transicao', 'troca', 't1', 't2'], title: 'Transições mais simples no triatlo', tips: 'Organize previamente o equipamento, ensaie a sequência em baixa intensidade e priorize fluidez antes de buscar velocidade.' }]
    },
    {
      id: 'funcional', label: 'treino funcional', grammar: ['no', 'o', 'ao'], aliases: ['treino funcional', 'funcional', 'crossfit'],
      guidance: 'Comece por movimentos controlados e versões compatíveis com sua experiência e condicionamento atual.',
      benefits: 'Pode integrar força, mobilidade, equilíbrio, coordenação e resistência em movimentos variados.',
      techniques: [{ id: 'agachamento', aliases: ['agachamento', 'squat', 'execucao'], title: 'Controle no agachamento', tips: 'Mantenha os pés estáveis, acompanhe a direção dos joelhos e use uma amplitude que preserve controle e conforto.' }]
    },
    {
      id: 'yoga', label: 'yoga', grammar: ['na', 'a', 'à'], aliases: ['yoga', 'ioga'],
      guidance: 'Escolha uma prática de nível iniciante e respeite amplitude, respiração e conforto em cada posição.',
      benefits: 'Pode favorecer mobilidade, equilíbrio, consciência corporal, respiração e manejo do estresse como prática de bem-estar.',
      techniques: [{ id: 'respiracao', aliases: ['respiracao', 'postura', 'asana'], title: 'Respiração e estabilidade na prática de yoga', tips: 'Mantenha a respiração fluida, reduza a amplitude se houver tensão e priorize estabilidade em vez de copiar uma forma perfeita.' }]
    },
    {
      id: 'pilates', label: 'pilates', grammar: ['no', 'o', 'ao'], aliases: ['pilates'],
      guidance: 'Comece com uma avaliação do seu momento e aprenda os movimentos com orientação e controle.',
      benefits: 'Trabalha controle corporal, mobilidade, força, equilíbrio e coordenação da respiração com o movimento.',
      techniques: [{ id: 'controle', aliases: ['respiracao', 'controle', 'core'], title: 'Controle e respiração no pilates', tips: 'Coordene a expiração com a fase de maior esforço, preserve o alinhamento e reduza a amplitude quando perder o controle.' }]
    },
    {
      id: 'ginastica', label: 'ginástica', grammar: ['na', 'a', 'à'], aliases: ['ginastica', 'ginastica artistica', 'ginastica ritmica'],
      guidance: 'Conheça a modalidade e comece pelos fundamentos em um ambiente preparado e orientado.',
      benefits: 'Pode desenvolver força, mobilidade, equilíbrio, coordenação, ritmo e consciência corporal.',
      techniques: [{ id: 'equilibrio', aliases: ['equilibrio', 'giro', 'salto'], title: 'Base para equilíbrio e novos elementos', tips: 'Domine posições estáveis e aterrissagens simples antes de avançar para giros, saltos ou elementos de maior complexidade.' }]
    },
    {
      id: 'surf', label: 'surfe', grammar: ['no', 'o', 'ao'], aliases: ['surfar', 'surf', 'surfe'],
      guidance: 'Conheça o ambiente, as condições do mar e as regras de segurança antes da primeira prática.',
      benefits: 'Reúne resistência, equilíbrio, coordenação, força de membros superiores e contato atento com o ambiente natural.',
      techniques: [{ id: 'subida', aliases: ['subir na prancha', 'drop', 'take off', 'remada'], title: 'Remada e subida na prancha', tips: 'Posicione o corpo no centro da prancha, reme com constância e pratique a subida primeiro em ambiente controlado.' }]
    },
    {
      id: 'skate', label: 'skate', grammar: ['no', 'o', 'ao'], aliases: ['andar de skate', 'skate', 'skateboard'],
      guidance: 'Use proteção adequada e comece por equilíbrio, base e deslocamentos em um local seguro.',
      benefits: 'Trabalha equilíbrio, coordenação, agilidade, força de membros inferiores e persistência na aprendizagem.',
      techniques: [{ id: 'equilibrio', aliases: ['equilibrio', 'remada', 'frear', 'ollie'], title: 'Base, impulso e frenagem no skate', tips: 'Descubra sua base, mantenha joelhos flexionados e aprenda a desacelerar antes de tentar manobras.' }]
    },
    {
      id: 'escalada', label: 'escalada', grammar: ['na', 'a', 'à'], aliases: ['escalar', 'escalada', 'boulder'],
      guidance: 'Comece em um ambiente preparado, conheça os equipamentos e siga a orientação de segurança do local.',
      benefits: 'Combina força, mobilidade, equilíbrio, coordenação, planejamento de movimentos e concentração.',
      techniques: [{ id: 'apoio', aliases: ['pegada', 'apoio', 'agarras', 'subir'], title: 'Use melhor os apoios na escalada', tips: 'Olhe primeiro para os pés, aproxime o quadril da parede e use as pernas para reduzir o esforço excessivo dos braços.' }]
    },
    {
      id: 'remo', label: 'remo', grammar: ['no', 'o', 'ao'], aliases: ['remar', 'remo'],
      guidance: 'Conheça o equipamento, o ambiente e a técnica básica antes de aumentar distância ou intensidade.',
      benefits: 'Trabalha resistência, coordenação global e força de pernas, tronco e membros superiores.',
      techniques: [{ id: 'remada', aliases: ['remada', 'ritmo', 'cadencia'], title: 'Sequência mais eficiente na remada', tips: 'Inicie o impulso pelas pernas, conecte o tronco e finalize com os braços; faça o retorno na ordem inversa e sem pressa.' }]
    },
    {
      id: 'canoagem', label: 'canoagem', grammar: ['na', 'a', 'à'], aliases: ['canoagem', 'caiaque', 'kayak'],
      guidance: 'Comece em local apropriado, com equipamento de segurança e orientação sobre as condições da água.',
      benefits: 'Pode desenvolver resistência, coordenação, estabilidade de tronco e força de membros superiores em contato com a natureza.',
      techniques: [{ id: 'remada', aliases: ['remada', 'remo', 'direcao'], title: 'Remada e direção na canoagem', tips: 'Mantenha o tronco estável, use a rotação do corpo e faça entradas curtas e próximas à embarcação.' }]
    },
    {
      id: 'rugby', label: 'rugby', grammar: ['no', 'o', 'ao'], aliases: ['rugby', 'rugbi'],
      guidance: 'Conheça as regras, os fundamentos e a progressão de contato em um ambiente orientado.',
      benefits: 'Combina resistência, potência, agilidade, tomada de decisão, cooperação e diferentes funções dentro da equipe.',
      techniques: [{ id: 'passe', aliases: ['passe', 'tackle', 'placagem'], title: 'Passe e apoio no rugby', tips: 'Passe lateralmente com as duas mãos, continue acompanhando a jogada e aprenda qualquer técnica de contato somente com supervisão.' }]
    }
  ]);

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function containsTerm(value, term) {
    return ` ${value} `.includes(` ${normalize(term)} `);
  }

  function findSport(query) {
    const normalized = normalize(query);
    return sports.find(sport => sport.aliases.some(alias => containsTerm(normalized, alias))) || null;
  }

  function findTechnique(sport, query) {
    const normalized = normalize(query);
    return sport?.techniques?.find(technique => technique.aliases.some(alias => containsTerm(normalized, alias))) || sport?.techniques?.[0] || null;
  }

  function possessiveArticle(article) {
    return article === 'a' ? 'da' : article === 'as' ? 'das' : 'do';
  }

  function search(query, sportId) {
    const sport = sports.find(entry => entry.id === sportId) || findSport(query);
    if (!sport) return { sport: null, technique: null, entries: [] };
    const technique = findTechnique(sport, query);
    const entries = [
      technique && {
        kind: 'technique',
        title: technique.title,
        summary: technique.tips
      },
      {
        kind: 'benefits',
        title: `Benefícios ${possessiveArticle(sport.grammar[1])} ${sport.label} para a saúde`,
        summary: sport.benefits
      }
    ].filter(Boolean);
    return { sport, technique, entries };
  }

  return Object.freeze({
    version: VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: REVIEW_STATUS,
    sports,
    normalize,
    findSport,
    findTechnique,
    search
  });
});
