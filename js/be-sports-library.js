(function (globalScope, factory) {
  'use strict';

  const library = factory();
  if (typeof module === 'object' && module.exports) module.exports = library;
  if (globalScope) globalScope.BeSportsLibrary = library;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createBeSportsLibrary() {
  'use strict';

  const VERSION = '1.2.0';
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

  const sources = Object.freeze({
    acsmResistance: 'https://pubmed.ncbi.nlm.nih.gov/41843416/',
    cdcWeight: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html',
    nihSupplements: 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/',
    whoActivity: 'https://www.who.int/publications/i/item/9789240015128'
  });

  const topics = Object.freeze([
    {
      id: 'muscle-gain', label: 'ganho de massa muscular', kind: 'training', tool: null,
      aliases: ['ganhar massa muscular', 'ganhar musculo rapido', 'aumentar a massa muscular', 'crescer o braco', 'aumentar o biceps', 'aumentar o triceps', 'aumentar o peito', 'desenvolver o peitoral', 'aumentar os ombros', 'ombro mais largo', 'aumentar as costas', 'costas largas', 'engrossar as pernas', 'aumentar as pernas', 'aumentar o quadriceps', 'aumentar a panturrilha', 'aumentar o gluteo', 'crescer o bumbum', 'fortalecer o gluteo', 'ganhar massa em casa', 'ganhar musculo sem academia', 'ganhar musculo com calistenia'],
      title: 'Como construir massa muscular com consistência',
      summary: '1. Faça treino de força com movimentos que você consegue executar bem. 2. Aumente gradualmente repetições, séries ou carga, sem mudar tudo ao mesmo tempo. 3. Garanta alimentação suficiente, fontes variadas de proteína e sono regular. 4. Compare sua evolução ao longo de semanas, não de poucos dias. Ganho rápido não é uma promessa segura e cada região do corpo responde ao conjunto do treino.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'strength-progression', label: 'força e progressão', kind: 'training', tool: null,
      aliases: ['ficar mais forte', 'ganhar forca', 'aumentar a carga', 'aumentar minhas repeticoes', 'nao consigo aumentar minha carga', 'quanto tempo devo descansar entre series'],
      title: 'Como evoluir força, carga e repetições',
      summary: '1. Registre exercício, carga, repetições e qualidade da execução. 2. Primeiro complete a faixa planejada com controle. 3. Depois aumente somente uma variável em um passo pequeno. 4. Preserve descanso e recuperação antes de testar outra progressão. Se a técnica piorar, a carga ainda não representa evolução.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'lower-body-training', label: 'treino de pernas e glúteos', kind: 'training', tool: null,
      aliases: ['treinar pernas', 'treinar perna', 'treino de pernas', 'exercicios para pernas', 'fortalecer as pernas', 'fortalecer pernas', 'treinar membros inferiores', 'treinar inferiores', 'treinar coxas', 'treinar coxa', 'treinar quadriceps', 'treino de quadriceps', 'treinar posterior de coxa', 'treinar panturrilha', 'treino de panturrilha', 'treinar gluteos', 'treino de gluteos', 'fortalecer gluteos', 'treinar bumbum'],
      title: 'Como organizar um treino de pernas e glúteos',
      summary: '1. Combine um movimento de agachar, um de quadril, um unilateral e um para panturrilhas, usando versões que você controle. 2. Comece com amplitude confortável e repetições estáveis. 3. Aumente repetições, séries ou carga aos poucos, sem alterar tudo junto. 4. Dê tempo para recuperação antes de repetir um treino intenso. Dor aguda ou perda de controle pede interrupção e avaliação.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'chest-training', label: 'treino de peito', kind: 'training', tool: null,
      aliases: ['treinar peito', 'treino de peito', 'treinar peitoral', 'treino de peitoral', 'fortalecer o peito', 'fortalecer peitoral', 'exercicios para peito', 'exercicios para peitoral'],
      title: 'Como organizar um treino de peito',
      summary: '1. Escolha um movimento de empurrar compatível com sua experiência, como flexão inclinada, flexão ou supino orientado. 2. Mantenha pés e tronco estáveis e controle a posição dos ombros. 3. Use uma amplitude confortável e pare antes de perder a execução. 4. Progrida uma variável por vez e equilibre o treino com movimentos para as costas. Dor no ombro ou no peito não deve ser ignorada.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'back-training', label: 'treino de costas', kind: 'training', tool: null,
      aliases: ['treinar costas', 'treino de costas', 'fortalecer as costas', 'exercicios para costas', 'treinar dorsal', 'treino de dorsal', 'fortalecer a lombar', 'treinar lombar'],
      title: 'Como organizar um treino de costas',
      summary: '1. Combine uma puxada horizontal, como remada, com uma puxada vertical ou sua progressão. 2. Estabilize o tronco e mova os braços sem transformar cada repetição em balanço. 3. Use variações e cargas que permitam controlar ombros e coluna. 4. Progrida aos poucos e inclua recuperação. Desconforto muscular de esforço é diferente de dor aguda, irradiada ou persistente, que merece avaliação.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'upper-body-training', label: 'treino de braços e membros superiores', kind: 'training', tool: null,
      aliases: ['treinar bracos', 'treino de bracos', 'fortalecer os bracos', 'fortalecer bracos', 'treinar biceps', 'treino de biceps', 'treinar triceps', 'treino de triceps', 'treinar ombros', 'treino de ombros', 'fortalecer ombros', 'treinar membros superiores', 'treinar superiores'],
      title: 'Como organizar um treino de braços e superiores',
      summary: '1. Monte uma base com movimentos de empurrar e puxar antes de concentrar tudo em bíceps ou tríceps. 2. Acrescente um exercício direto para braços ou ombros quando conseguir manter postura e amplitude. 3. Evite usar impulso para completar repetições. 4. Aumente o trabalho gradualmente e permita recuperação entre sessões intensas. Dor articular pede ajuste ou avaliação, não mais carga.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'core-training', label: 'treino de abdômen e core', kind: 'training', tool: null,
      aliases: ['treinar abdomen', 'treino de abdomen', 'treinar abdominal', 'treino abdominal', 'fortalecer o abdomen', 'fortalecer abdomen', 'treinar core', 'treino de core', 'fortalecer o core', 'exercicios para abdomen'],
      title: 'Como organizar um treino de abdômen e core',
      summary: '1. Combine exercícios de estabilidade, flexão controlada e resistência à rotação, conforme sua experiência. 2. Respire durante o movimento e mantenha a amplitude que consegue controlar. 3. Aumente tempo, repetições ou dificuldade gradualmente. 4. Integre o core ao treino do corpo todo, em vez de repetir apenas abdominais todos os dias. Treinar abdômen fortalece a região, mas não remove gordura localizada.',
      sourceIds: ['acsmResistance', 'cdcWeight']
    },
    {
      id: 'full-body-training', label: 'treino do corpo inteiro', kind: 'training', tool: null,
      aliases: ['treinar o corpo todo', 'treinar corpo todo', 'treino de corpo inteiro', 'treino do corpo inteiro', 'full body', 'treinar todos os musculos', 'treino completo do corpo'],
      title: 'Como organizar um treino do corpo inteiro',
      summary: '1. Escolha movimentos para pernas, quadril, empurrar, puxar e estabilizar o tronco. 2. Use poucas variações que consiga executar com qualidade. 3. Distribua as séries para terminar o treino sem perda importante de técnica. 4. Registre o que fez e progrida somente uma variável por vez. Um treino completo não precisa usar todos os exercícios; precisa cobrir os principais padrões com regularidade e recuperação.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'fat-loss', label: 'emagrecimento e composição corporal', kind: 'nutrition', tool: 'imc',
      aliases: ['emagrecer', 'emagrecer rapido', 'perder peso', 'perder gordura', 'perder barriga', 'secar a barriga', 'secar o abdomen', 'definir o abdomen', 'queimar gordura', 'acelerar o metabolismo', 'emagrecer treinando', 'exercicio mais emagrece', 'perder gordura sem perder musculo', 'ficar definido', 'queimar mais calorias', 'emagrecer fazendo cardio', 'emagrecer em casa', 'definir o corpo em casa', 'nao consigo emagrecer', 'nao consigo perder barriga'],
      title: 'Emagrecimento sem promessa de atalho',
      summary: '1. Combine alimentação possível de manter, movimento regular, sono e manejo do estresse. 2. Use treino de força para preservar capacidade e massa muscular. 3. Escolha atividades que consiga repetir durante a semana. 4. Avalie tendências ao longo do tempo; não existe exercício que retire gordura apenas da barriga. Mudanças rápidas e restrições extremas merecem orientação profissional.',
      sourceIds: ['cdcWeight', 'whoActivity']
    },
    {
      id: 'running', label: 'corrida', kind: 'training', tool: 'pace',
      aliases: ['correr mais rapido', 'correr sem cansar', 'correr por mais tempo', 'melhorar meu pace', 'aumentar minha resistencia correndo', 'correr 5 km', 'correr 5 km mais rapido', 'correr 10 km', 'melhorar meu tempo', 'comecar a correr', 'correr todos os dias', 'respirar melhor correndo', 'aumentar minha velocidade correndo', 'melhorar minha passada', 'fazer sprint', 'melhorar minha aceleracao', 'correr uma meia maratona', 'fico cansado correndo'],
      title: 'Como evoluir na corrida',
      summary: '1. Construa primeiro uma duração confortável, alternando caminhada e corrida quando necessário. 2. Faça a maior parte dos treinos em ritmo no qual ainda consiga falar frases curtas. 3. Trabalhe velocidade em sessões separadas e progressivas, com recuperação. 4. Para 5 km, 10 km ou meia maratona, aumente o volume aos poucos e planeje dias leves. Dor, tontura, falta de ar fora do esperado ou dor no peito exigem interrupção e avaliação.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'football-skills', label: 'fundamentos do futebol', kind: 'training', tool: null,
      aliases: ['correr mais rapido no futebol', 'ficar mais rapido no futebol', 'resistencia no futebol', 'jogar futebol melhor', 'melhorar minha finalizacao', 'melhorar a finalizacao', 'driblar melhor', 'dominar a bola', 'melhorar o passe', 'marcar melhor', 'fazer embaixadinhas', 'fazer dribles', 'bater falta', 'cobrar penalti', 'cruzar melhor', 'cabecear melhor', 'proteger a bola'],
      title: 'Como evoluir nos fundamentos do futebol',
      summary: '1. Escolha um fundamento por sessão: domínio, passe, condução, finalização ou marcação. 2. Comece sem oposição e aumente velocidade e pressão gradualmente. 3. Treine os dois lados e observe antes de receber a bola. 4. Leve o gesto para situações pequenas de jogo. Velocidade no futebol depende também de decisão, posicionamento, força e recuperação.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'ambiguous-kick', label: 'técnica de chute', kind: 'training', tool: null,
      aliases: ['chutar mais forte', 'chutar mais rapido', 'chutar melhor', 'melhorar meus golpes'],
      title: 'Chutar melhor depende da modalidade',
      summary: 'No futebol, o trabalho envolve pé de apoio, contato com a bola e direção. Em lutas, envolve base, rotação, distância e supervisão técnica. Escolha a modalidade na busca para receber a orientação correta; não aumente força ou velocidade antes de controlar o gesto.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'jump-basketball', label: 'salto e basquete', kind: 'training', tool: null,
      aliases: ['pular mais alto', 'aumentar o salto vertical', 'fazer uma enterrada', 'aumentar minha impulsao', 'arremessar melhor', 'acertar mais arremessos', 'melhorar minha defesa', 'nao consigo pular mais alto'],
      title: 'Como desenvolver salto e fundamentos do basquete',
      summary: '1. Construa força de pernas e estabilidade antes de aumentar saltos. 2. Pratique aterrissagens silenciosas e alinhadas. 3. No arremesso, repita base, alinhamento e finalização perto da cesta antes de afastar. 4. Na defesa, trabalhe postura, deslocamentos curtos e leitura do adversário. Enterrada e pliometria avançada pedem progressão e orientação.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'ambiguous-serve', label: 'técnica de saque', kind: 'training', tool: null,
      aliases: ['sacar mais forte', 'sacar melhor', 'melhorar meu saque'],
      title: 'O saque muda entre vôlei, tênis e outros esportes',
      summary: 'Regularidade vem antes da potência. No vôlei, observe base, lançamento e contato com a mão firme. No tênis, empunhadura, lançamento e cadeia de movimento são diferentes. Informe a modalidade na busca para abrir a resposta técnica correspondente.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'volleyball-skills', label: 'fundamentos do voleibol', kind: 'training', tool: null,
      aliases: ['melhorar minha recepcao', 'bloquear melhor', 'cortar mais forte'],
      title: 'Como evoluir na recepção, bloqueio e ataque',
      summary: '1. Na recepção, estabilize a plataforma dos antebraços e use as pernas. 2. No bloqueio, ajuste os passos e o tempo antes da altura. 3. No ataque, coordene aproximação, salto e contato antes de buscar força. 4. Pratique com lançamentos previsíveis e aumente a dificuldade gradualmente.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'swimming-performance', label: 'evolução na natação', kind: 'training', tool: null,
      aliases: ['nadar mais rapido', 'nadar sem cansar', 'resistencia na agua', 'respiracao na natacao', 'nadar por mais tempo', 'tecnica de natacao', 'crawl mais rapido', 'tempo na natacao'],
      title: 'Como nadar com mais eficiência',
      summary: '1. Priorize alinhamento, expiração contínua dentro da água e deslize. 2. Faça séries curtas com pausas suficientes para preservar a técnica. 3. Aumente distância antes de acelerar todas as séries. 4. Treine em ambiente supervisionado; dificuldade respiratória intensa ou perda de controle na água exige parar imediatamente.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'cycling-performance', label: 'evolução no ciclismo', kind: 'training', tool: 'pace',
      aliases: ['pedalar mais rapido', 'resistencia no ciclismo', 'subir morro de bicicleta', 'velocidade no ciclismo', 'pedalar por mais tempo', 'potencia no ciclismo', 'melhorar minha cadencia', 'desempenho no ciclismo'],
      title: 'Como evoluir velocidade e resistência no ciclismo',
      summary: '1. Ajuste bicicleta, capacete e percurso antes de aumentar o esforço. 2. Construa tempo de pedal em intensidade confortável. 3. Use marchas que mantenham uma cadência controlada e antecipe trocas nas subidas. 4. Separe treinos de subida ou velocidade dos pedais longos e preserve recuperação.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'tennis-skills', label: 'fundamentos do tênis', kind: 'training', tool: null,
      aliases: ['saque no tenis', 'melhorar o forehand', 'melhorar o backhand', 'movimentacao no tenis', 'jogar tenis melhor'],
      title: 'Como evoluir nos fundamentos do tênis',
      summary: '1. Treine posição de espera e passos de ajuste antes dos golpes. 2. Busque contato à frente do corpo no forehand e no backhand. 3. No saque, estabilize o lançamento antes de aumentar velocidade. 4. Alterne exercícios de regularidade, direção e situações de ponto.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'combat-sports', label: 'boxe e lutas', kind: 'training', tool: null,
      aliases: ['soco mais forte', 'socar mais rapido', 'bater mais forte', 'velocidade dos golpes', 'melhorar minha esquiva', 'movimentacao no boxe', 'aprender boxe', 'treinar boxe em casa', 'treinar muay thai em casa', 'comecar no muay thai'],
      title: 'Como começar e evoluir nas lutas com segurança',
      summary: '1. Aprenda base, guarda, deslocamento e retorno da mão antes de buscar potência. 2. Faça sombra e exercícios técnicos sem impacto quando estiver sozinho. 3. Contato, manopla, saco e sparring exigem orientação, equipamento e progressão. 4. Não pratique golpes em outra pessoa sem supervisão e regras claras.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'calisthenics', label: 'calistenia', kind: 'training', tool: null,
      aliases: ['fazer barra', 'fazer mais barras', 'fazer flexao', 'fazer mais flexoes', 'fazer muscle-up', 'fazer handstand', 'parada de mao', 'handstand push-up', 'forca na calistenia', 'comecar na calistenia', 'front lever', 'back lever', 'nao consigo fazer barra', 'nao consigo fazer flexao'],
      title: 'Como progredir na calistenia',
      summary: '1. Escolha uma versão que permita repetições controladas: inclinação para flexão, remada ou assistência para barra. 2. Aumente amplitude e repetições antes de reduzir a ajuda. 3. Fortaleça escápulas, tronco e punhos. 4. Muscle-up, handstand push-up e alavancas são habilidades avançadas; use progressões, espaço seguro e orientação.',
      sourceIds: ['acsmResistance']
    },
    {
      id: 'pilates', label: 'Pilates', kind: 'training', tool: null,
      aliases: ['pilates emagrece', 'pilates perder barriga', 'pilates fortalece', 'pilates melhora a postura', 'pilates melhora a flexibilidade', 'pilates fortalece o abdomen', 'pilates em casa'],
      title: 'O que o Pilates pode desenvolver',
      summary: 'Pilates pode trabalhar controle, força, mobilidade, equilíbrio e percepção corporal. Ele participa de uma rotina ativa, mas não remove gordura de uma região específica. Para começar em casa, use exercícios básicos que consiga controlar e procure orientação quando houver dor, lesão, gestação ou condição clínica.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'mobility-yoga', label: 'yoga, flexibilidade e mobilidade', kind: 'training', tool: null,
      aliases: ['comecar yoga', 'yoga emagrece', 'ficar mais flexivel', 'abrir o espacate', 'melhorar minha mobilidade', 'mobilidade do quadril', 'mobilidade dos ombros', 'mobilidade do tornozelo', 'alongar corretamente', 'melhorar minha postura', 'melhorar meu equilibrio'],
      title: 'Como desenvolver mobilidade e flexibilidade',
      summary: '1. Aqueça com movimentos leves antes de sustentar posições. 2. Trabalhe amplitudes confortáveis, sem rebotes ou dor aguda. 3. Repita poucas posições com regularidade e controle da respiração. 4. Para espacate, postura ou limitações específicas, avance em meses, não em dias, e considere avaliação profissional.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'cardio-hiit', label: 'cardio e HIIT', kind: 'training', tool: 'pace',
      aliases: ['fazer hiit', 'hiit emagrece', 'melhor cardio', 'tempo de cardio', 'fazer cardio em casa', 'hiit ou corrida', 'hiit ou musculacao'],
      title: 'Como escolher entre cardio, HIIT e musculação',
      summary: 'Cardio contínuo ajuda a construir resistência; HIIT concentra estímulos intensos e pausas; musculação desenvolve força. Nenhum formato é obrigatório ou sempre superior. Escolha pelo objetivo, experiência, recuperação e preferência. Quem está começando deve construir uma base antes de usar intervalos muito intensos.',
      sourceIds: ['whoActivity']
    },
    {
      id: 'home-training', label: 'treino em casa', kind: 'training', tool: null,
      aliases: ['treinar em casa', 'treinar sem equipamentos', 'treinar abdomen em casa', 'treinar pernas em casa', 'treinar bracos em casa', 'treinar costas em casa', 'treino de 10 minutos', 'treino de 15 minutos', 'treino de 20 minutos', 'treino de 30 minutos', 'melhor treino rapido', 'treinar quando nao tenho tempo', 'treinando 15 minutos', 'treinando pouco'],
      title: 'Como montar um treino curto em casa',
      summary: '1. Escolha quatro movimentos: pernas, empurrar, puxar ou estabilizar, e deslocar-se. 2. Use versões compatíveis com o espaço e sua experiência. 3. Faça poucas séries com execução controlada e pausas suficientes. 4. Registre o que conseguiu fazer e progrida aos poucos. Dez ou quinze minutos contam quando fazem parte de uma rotina possível.',
      sourceIds: ['whoActivity', 'acsmResistance']
    },
    {
      id: 'sports-nutrition', label: 'alimentação para treino', kind: 'nutrition', tool: 'agua',
      aliases: ['comer para ganhar massa muscular', 'comer antes do treino', 'comer depois do treino', 'proteina preciso por dia', 'alimento tem mais proteina', 'meta de proteina', 'comer para emagrecer', 'comer para ganhar musculo', 'carboidrato consumir', 'proteina consumir para hipertrofia', 'proteina para hipertrofia', 'preciso comer antes de treinar', 'preciso comer depois do treino'],
      title: 'Como organizar alimentação ao redor do treino',
      summary: 'Priorize uma rotina alimentar variada e suficiente, com fontes de proteína, carboidratos, frutas, verduras e líquidos. Antes e depois do treino, horário, quantidade e escolha dependem da duração, intensidade, tolerância e restante do dia. Meta de proteína ou carboidrato é individual e não deve ser definida por uma resposta genérica; procure nutricionista para cálculo e ajustes.',
      sourceIds: ['nihSupplements']
    },
    {
      id: 'energy-balance', label: 'calorias e balanço energético', kind: 'nutrition', tool: 'imc',
      aliases: ['calorias devo consumir', 'calcular minhas calorias', 'deficit calorico', 'superavit calorico'],
      title: 'Déficit, superávit e calorias precisam de contexto',
      summary: 'Déficit significa consumir menos energia do que o corpo utiliza; superávit, consumir mais. A estimativa muda com idade, corpo, rotina, saúde e objetivo. Calculadoras são apenas referências e não substituem avaliação. Evite cortes ou aumentos extremos e procure nutricionista para uma meta individual, especialmente se houver doença, gestação ou histórico de transtorno alimentar.',
      sourceIds: ['cdcWeight']
    },
    {
      id: 'supplements', label: 'suplementos esportivos', kind: 'supplement', tool: null,
      aliases: ['creatina funciona', 'como tomar creatina', 'creatina engorda', 'creatina faz mal', 'whey protein engorda', 'whey ajuda a ganhar massa', 'quanto de whey tomar', 'melhor suplemento para ganhar massa', 'preciso tomar whey', 'preciso tomar creatina', 'pre-treino funciona', 'bcaa funciona'],
      title: 'Suplemento não substitui alimentação e treino',
      summary: 'Creatina tem evidência para esforços intensos repetidos e pode aumentar o peso corporal por retenção de água, mas o efeito varia. Whey é uma fonte prática de proteína, não uma obrigação. Pré-treinos e outros produtos podem combinar estimulantes e ingredientes em doses diferentes; BCAA isolado costuma acrescentar pouco quando a alimentação já fornece proteína adequada. Uso, dose, qualidade e contraindicações devem ser avaliados com profissional de saúde.',
      sourceIds: ['nihSupplements']
    },
    {
      id: 'performance', label: 'performance física', kind: 'training', tool: null,
      aliases: ['ficar mais rapido', 'aumentar minha velocidade', 'ganhar explosao', 'ter mais explosao', 'aumentar minha potencia', 'aumentar minha resistencia', 'melhorar minha agilidade', 'melhorar minha coordenacao', 'melhorar minha movimentacao', 'melhorar meus reflexos', 'melhorar minha performance', 'melhorar meu condicionamento', 'treinar velocidade', 'treinar explosao', 'resistencia cardiovascular', 'ter mais folego', 'treinar resistencia', 'treinar por mais tempo', 'nao ficar cansado durante o treino'],
      title: 'Como desenvolver condicionamento e performance',
      summary: '1. Defina uma qualidade por vez: força, velocidade, potência, resistência ou coordenação. 2. Mantenha uma base de treino regular e técnica estável. 3. Coloque estímulos intensos quando estiver recuperado e preserve sessões leves. 4. Registre medidas comparáveis. Performance melhora com treino específico, recuperação e tempo, não com intensidade máxima todos os dias.',
      sourceIds: ['acsmResistance', 'whoActivity']
    },
    {
      id: 'recovery', label: 'descanso e recuperação', kind: 'recovery', tool: 'agua',
      aliases: ['melhorar minha recuperacao', 'dias devo descansar', 'musculo demora para se recuperar', 'recuperar mais rapido', 'dormir ajuda a ganhar musculo', 'horas devo dormir', 'treinar o mesmo musculo todos os dias', 'treinar cansado'],
      title: 'Recuperação também faz parte do treino',
      summary: 'Sono regular, alimentação suficiente, hidratação e alternância de estímulos ajudam a recuperar. O tempo necessário varia conforme sessão, experiência e pessoa. Evite repetir treino intenso do mesmo grupo quando ainda houver queda de desempenho, dor importante ou cansaço acumulado. Treinar cansado pede redução ou descanso; sintomas persistentes merecem avaliação.',
      sourceIds: ['cdcWeight', 'acsmResistance']
    },
    {
      id: 'plateau-results', label: 'estagnação e resultados', kind: 'training', tool: null,
      aliases: ['nao estou ganhando massa muscular', 'meu braco nao cresce', 'meu gluteo nao cresce', 'treino nao esta dando resultado', 'treinando e nao vejo resultado', 'parei de evoluir', 'tempo leva para ganhar musculo', 'tempo demora para aparecer resultado'],
      title: 'Quando o resultado parece ter parado',
      summary: '1. Compare registros de várias semanas, não apenas aparência ou um treino. 2. Confira regularidade, progressão, execução, alimentação e sono. 3. Mude uma variável por vez e acompanhe a resposta. 4. Ajuste expectativas: força, habilidade, medidas e composição corporal evoluem em ritmos diferentes. Se não houver mudança apesar de consistência, procure avaliação profissional individual.',
      sourceIds: ['acsmResistance', 'cdcWeight']
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

  function findTopic(query) {
    const normalized = normalize(query);
    let best = null;
    let bestScore = 0;
    topics.forEach(topic => {
      topic.aliases.forEach(alias => {
        const term = normalize(alias);
        if (!containsTerm(normalized, term)) return;
        const score = term.length;
        if (score > bestScore) {
          best = topic;
          bestScore = score;
        }
      });
    });
    return best;
  }

  function searchTopic(query) {
    const topic = findTopic(query);
    if (!topic) return { topic: null, entries: [] };
    return {
      topic,
      entries: [{ kind: 'topic', title: topic.title, summary: topic.summary }]
    };
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
    topics,
    sources,
    normalize,
    findSport,
    findTechnique,
    findTopic,
    search,
    searchTopic
  });
});
