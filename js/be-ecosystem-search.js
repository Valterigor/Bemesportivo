(function (global) {
  'use strict';

  const PRODUCTS = Object.freeze([
    { id: 'conteudo', name: 'Conhecimento', purpose: 'Aprenda com conteúdos especiais.', response: 'Encontre orientações e trilhas da Biblioteca BeM.', action: 'Explorar conhecimento', href: '/meu-caminho-be/ferramentas/conteudos', keywords: ['aprender', 'melhorar', 'como fazer', 'como posso', 'saber', 'conteudo', 'conhecimento', 'dica', 'tecnica', 'chute', 'passe', 'comecar', 'retomar'] },
    { id: 'beplay', name: 'BEplay', purpose: 'Assista ao esporte.', response: 'Assista a vídeos, treinos, entrevistas e histórias em movimento.', action: 'Abrir o BEplay', href: '/beplay', keywords: ['assistir', 'video', 'ver video', 'filme', 'entrevista', 'beplay', 'play'] },
    { id: 'reportagens', name: 'Reportagens', purpose: 'Conheça histórias reais do esporte.', response: 'Leia histórias de pessoas, projetos e comunidades do esporte.', action: 'Explorar reportagens', href: '/reportagens', keywords: ['reportagem', 'historia', 'historias', 'ler', 'noticia', 'materia', 'trajetoria', 'inspiracao'] },
    { id: 'comunidade', name: 'Comunidade', purpose: 'Converse sobre esporte.', response: 'Pergunte, compartilhe experiências e ouça outras pessoas.', action: 'Abrir a Comunidade', href: '/meu-caminho-be/ferramentas/comunidade', keywords: ['conversar', 'conversa', 'comunidade', 'perguntar', 'pergunta', 'duvida', 'opinar', 'opiniao', 'debater', 'compartilhar', 'pessoas'] },
    { id: 'profissionais', name: 'Profissionais', purpose: 'Encontre quem pode ajudar.', response: 'Conheça profissionais apresentados pelo Bem Esportivo.', action: 'Encontrar profissionais', href: '/profissionais', keywords: ['profissional', 'especialista', 'personal', 'treinador', 'tecnico', 'psicologo', 'fisioterapeuta', 'fotografo', 'ajuda profissional', 'orientacao'] },
    { id: 'ferramentas', name: 'Ferramentas', purpose: 'Entenda melhor sua prática.', response: 'Use recursos educativos para compreender ritmo, hidratação e outros indicadores.', action: 'Ver ferramentas', href: '/meu-caminho-be/ferramentas', keywords: ['ferramenta', 'calcular', 'calculadora', 'pace', 'ritmo', 'imc', 'hidratacao', 'agua', 'medir', 'entender minha pratica'] },
    { id: 'produtos', name: 'Produtos', purpose: 'Encontre o que precisa para praticar.', response: 'Explore produtos relacionados à sua prática esportiva.', action: 'Explorar produtos', href: '/produtos', keywords: ['produto', 'comprar', 'equipamento', 'material', 'acessorio', 'roupa', 'tenis', 'chuteira', 'bola', 'loja'] },
    { id: 'meu-caminho', name: 'Meu Caminho Be', purpose: 'Acompanhe o seu esporte.', response: 'Registre o que fez, organize sua rotina e acompanhe sua evolução.', action: 'Abrir Meu Caminho Be', href: '/meu-caminho-be', keywords: ['registrar', 'registro', 'atividade', 'fiz hoje', 'treinei hoje', 'meu treino', 'meu caminho', 'diario', 'jornada', 'evolucao', 'progresso', 'acompanhar', 'rotina', 'perfil'] }
  ]);

  /*
   * Taxonomia editorial revisada pela equipe. Ela aproxima maneiras
   * diferentes de falar sobre a mesma modalidade, sem gerar respostas por IA.
   */
  const SPORTS_FALLBACK = Object.freeze([
    { id: 'natacao', label: 'natação', grammar: ['na', 'a', 'à'], aliases: ['nadar', 'natacao', 'nado', 'piscina', 'crawl', 'nado livre'], guidance: 'Defina onde irá praticar, confirme horários e supervisão disponíveis e comece pela adaptação ao ambiente aquático.' },
    { id: 'corrida', label: 'corrida', grammar: ['na', 'a', 'à'], aliases: ['correr', 'corrida', 'trote', 'running', 'corredor'], guidance: 'Comece alternando caminhada e corrida em um ritmo confortável, com uma duração que caiba na sua rotina.' },
    { id: 'caminhada', label: 'caminhada', grammar: ['na', 'a', 'à'], aliases: ['caminhar', 'caminhada', 'andar a pe', 'andar'], guidance: 'Escolha um percurso conhecido, uma duração possível e um ritmo em que você ainda consiga conversar.' },
    { id: 'ciclismo', label: 'ciclismo', grammar: ['no', 'o', 'ao'], aliases: ['pedalar', 'pedal', 'ciclismo', 'bicicleta', 'bike'], guidance: 'Escolha um percurso compatível com o seu momento e confira equipamento, visibilidade e condições do trajeto.' },
    { id: 'futebol', label: 'futebol', grammar: ['no', 'o', 'ao'], aliases: ['futebol', 'jogar bola', 'campo', 'society', 'chute', 'chutar'], guidance: 'Comece pelos fundamentos e por uma participação compatível com o seu condicionamento atual.' },
    { id: 'futsal', label: 'futsal', grammar: ['no', 'o', 'ao'], aliases: ['futsal', 'futebol de salao'], guidance: 'Priorize domínio, passe e deslocamentos progressivos antes de aumentar a intensidade do jogo.' },
    { id: 'musculacao', label: 'musculação', grammar: ['na', 'a', 'à'], aliases: ['musculacao', 'academia', 'treino de forca', 'levantar peso'], guidance: 'Comece com movimentos conhecidos, execução controlada e orientação adequada para ajustar os exercícios.' },
    { id: 'voleibol', label: 'voleibol', grammar: ['no', 'o', 'ao'], aliases: ['volei', 'voleibol'], guidance: 'Comece pelos gestos básicos e por atividades que permitam aprender o posicionamento com calma.' },
    { id: 'basquete', label: 'basquete', grammar: ['no', 'o', 'ao'], aliases: ['basquete', 'basquetebol', 'basket'], guidance: 'Comece por controle de bola, passe e arremesso antes de aumentar a velocidade da prática.' },
    { id: 'handebol', label: 'handebol', grammar: ['no', 'o', 'ao'], aliases: ['handebol', 'andebol'], guidance: 'Comece pelos fundamentos de passe, recepção e deslocamento antes de aumentar a intensidade do jogo.' },
    { id: 'beach-tennis', label: 'beach tennis', grammar: ['no', 'o', 'ao'], aliases: ['beach tennis', 'tenis de praia'], guidance: 'Conheça as regras básicas, pratique o controle da raquete e comece por trocas de bola em ritmo confortável.' },
    { id: 'tenis-mesa', label: 'tênis de mesa', grammar: ['no', 'o', 'ao'], aliases: ['tenis de mesa', 'ping pong'], guidance: 'Comece pelo controle da raquete, saque e devolução antes de buscar velocidade.' },
    { id: 'badminton', label: 'badminton', grammar: ['no', 'o', 'ao'], aliases: ['badminton', 'peteca'], guidance: 'Conheça a empunhadura, os deslocamentos e o contato com a peteca em uma prática inicial.' },
    { id: 'tenis', label: 'tênis', grammar: ['no', 'o', 'ao'], aliases: ['tenis', 'tenista', 'raquete'], guidance: 'Conheça empunhadura, deslocamento e contato com a bola em uma prática inicial orientada.' },
    { id: 'lutas', label: 'lutas', grammar: ['nas', 'as', 'às'], aliases: ['luta', 'lutas', 'boxe', 'judo', 'jiu jitsu', 'karate', 'muay thai'], guidance: 'Procure um ambiente orientado, conheça as regras de segurança e comece pelos fundamentos técnicos.' },
    { id: 'danca', label: 'dança', grammar: ['na', 'a', 'à'], aliases: ['dancar', 'danca', 'zumba', 'ballet'], guidance: 'Escolha um estilo que faça sentido para você e comece por uma aula de nível iniciante.' },
    { id: 'atletismo', label: 'atletismo', grammar: ['no', 'o', 'ao'], aliases: ['atletismo', 'salto em distancia', 'arremesso de peso'], guidance: 'Identifique a prova que deseja conhecer e procure uma iniciação compatível com seu momento.' },
    { id: 'triatlo', label: 'triatlo', grammar: ['no', 'o', 'ao'], aliases: ['triatlo', 'triathlon'], guidance: 'Organize natação, ciclismo e corrida de forma progressiva, com orientação para equilibrar as três modalidades.' },
    { id: 'funcional', label: 'treino funcional', grammar: ['no', 'o', 'ao'], aliases: ['treino funcional', 'funcional', 'crossfit'], guidance: 'Comece por movimentos controlados e versões compatíveis com sua experiência e condicionamento atual.' },
    { id: 'yoga', label: 'yoga', grammar: ['na', 'a', 'à'], aliases: ['yoga', 'ioga'], guidance: 'Escolha uma prática de nível iniciante e respeite amplitude, respiração e conforto em cada posição.' },
    { id: 'pilates', label: 'pilates', grammar: ['no', 'o', 'ao'], aliases: ['pilates'], guidance: 'Comece com uma avaliação do seu momento e aprenda os movimentos com orientação e controle.' },
    { id: 'ginastica', label: 'ginástica', grammar: ['na', 'a', 'à'], aliases: ['ginastica', 'ginastica artistica', 'ginastica ritmica'], guidance: 'Conheça a modalidade e comece pelos fundamentos em um ambiente preparado e orientado.' },
    { id: 'surf', label: 'surfe', grammar: ['no', 'o', 'ao'], aliases: ['surfar', 'surf', 'surfe'], guidance: 'Conheça o ambiente, as condições do mar e as regras de segurança antes da primeira prática.' },
    { id: 'skate', label: 'skate', grammar: ['no', 'o', 'ao'], aliases: ['andar de skate', 'skate', 'skateboard'], guidance: 'Use proteção adequada e comece por equilíbrio, base e deslocamentos em um local seguro.' },
    { id: 'escalada', label: 'escalada', grammar: ['na', 'a', 'à'], aliases: ['escalar', 'escalada', 'boulder'], guidance: 'Comece em um ambiente preparado, conheça os equipamentos e siga a orientação de segurança do local.' },
    { id: 'remo', label: 'remo', grammar: ['no', 'o', 'ao'], aliases: ['remar', 'remo'], guidance: 'Conheça o equipamento, o ambiente e a técnica básica antes de aumentar distância ou intensidade.' },
    { id: 'canoagem', label: 'canoagem', grammar: ['na', 'a', 'à'], aliases: ['canoagem', 'caiaque', 'kayak'], guidance: 'Comece em local apropriado, com equipamento de segurança e orientação sobre as condições da água.' },
    { id: 'rugby', label: 'rugby', grammar: ['no', 'o', 'ao'], aliases: ['rugby', 'rugbi'], guidance: 'Conheça as regras, os fundamentos e a progressão de contato em um ambiente orientado.' }
  ]);

  const SPORTS_LIBRARY = global.BeSportsLibrary || (typeof module === 'object' && module.exports
    ? require('./be-sports-library.js')
    : null);
  const SPORTS = SPORTS_LIBRARY?.sports || SPORTS_FALLBACK;
  const TOPICS = SPORTS_LIBRARY?.topics || [];

  const INTENTS = Object.freeze([
    { id: 'register', aliases: ['registrar', 'anotar', 'guardar', 'fiz hoje', 'treinei hoje'] },
    { id: 'watch', aliases: ['assistir', 'ver video', 'video', 'beplay'] },
    { id: 'professional', aliases: ['profissional', 'treinador', 'tecnico', 'especialista', 'orientacao'] },
    { id: 'improve', aliases: ['melhorar', 'evoluir', 'aperfeicoar', 'desenvolver', 'tecnica'] },
    { id: 'return', aliases: ['voltar', 'retomar', 'recomecar'] },
    { id: 'start', aliases: ['comecar', 'iniciar', 'aprender', 'experimentar', 'quero praticar'] }
  ]);

  const EDITORIAL_IMAGES = Object.freeze({
    guidance: '/img/posts/post-pratica-esportes.png',
    journey: '/img/jornada-esportiva-atleta-por-do-sol.webp',
    professional: '/img/profissionais/bruno.jpg'
  });

  const SEARCH_ITEMS = Object.freeze([
    { product: 'conteudo', title: 'Minha primeira corrida', summary: 'Uma trilha em quatro passos para organizar o começo da prática.', href: '/meu-caminho-be/ferramentas/trilhas', image: '/img/fala-bem-hero-pessoas-optimized-480.webp', action: 'Abrir trilha', keywords: ['corrida', 'correr', 'comecar', 'parado', 'primeiro passo', 'retomar'] },
    { product: 'conteudo', title: 'Futebol com inteligência', summary: 'Uma trilha sobre fundamentos, leitura de jogo e evolução no futebol.', href: '/meu-caminho-be/ferramentas/trilhas', image: '/img/IMG_0957-optimized.webp', action: 'Abrir trilha', keywords: ['futebol', 'chute', 'passe', 'tecnica', 'jogo', 'melhorar'] },
    { product: 'conteudo', title: 'Comece pelo que cabe na sua rotina', summary: 'Orientações curtas para construir uma prática possível no dia a dia.', href: '/meu-caminho-be/ferramentas/dicas', image: '/img/app-treino-card.png', action: 'Ler orientação', keywords: ['rotina', 'tempo', 'comecar', 'voltar', 'retomar', 'constancia', 'parado'] },
    { product: 'beplay', title: 'Resultado não acontece por acaso', summary: 'Treino de agilidade no futebol, disciplina e evolução.', href: '/beplay?video=treino-agilidade-futebol', image: '/img/beplay-capa-agilidade-futebol.webp', action: 'Assistir', keywords: ['assistir', 'video', 'futebol', 'chute', 'tecnica', 'agilidade', 'treino'] },
    { product: 'beplay', title: 'Treine por você. Sua saúde agradece.', summary: 'Um vídeo sobre treino, saúde e compromisso com a própria prática.', href: '/beplay?video=treino-forca-performance', image: '/img/beplay-capa-forca-performance.webp', action: 'Assistir', keywords: ['assistir', 'video', 'treino', 'saude', 'voltar', 'retomar', 'performance'] },
    { product: 'beplay', title: 'Treino técnico e tático', summary: 'Leitura de jogo, ocupação de espaços e ajustes técnicos.', href: '/beplay?video=gBkon6LC2OU', image: '/img/banner-home-nova-fase-futebol.jpg', action: 'Assistir', keywords: ['assistir', 'video', 'futebol', 'tecnica', 'tatico', 'jogo', 'passe', 'chute'] },
    { product: 'reportagens', title: 'Dedicação e Talento Mirim em Campo', summary: 'Técnica, disciplina e personalidade sob orientação responsável.', href: '/reportagens/dedicacao-talento-mirim', image: '/img/IMG_0957-optimized.webp', action: 'Ler reportagem', keywords: ['futebol', 'chute', 'tecnica', 'treino', 'talento', 'jovem', 'historia', 'reportagem'] },
    { product: 'reportagens', title: 'Duda e o Futebol', summary: 'Uma trajetória de dedicação, apoio e oportunidades no futebol.', href: '/reportagens/duda-e-o-futebol', image: '/img/duda.jpg', action: 'Ler reportagem', keywords: ['futebol', 'feminino', 'trajetoria', 'historia', 'reportagem', 'inspiracao'] },
    { product: 'reportagens', title: 'Thais Garcez, uma nova versão', summary: 'Disciplina, conhecimento e uma nova forma de viver a musculação.', href: '/reportagens/thais-garcez-metamorfose', image: '/img/Thais%20Garcez/thais-garcez-capa.jpg', action: 'Ler reportagem', keywords: ['musculacao', 'academia', 'transformacao', 'saude', 'historia', 'reportagem', 'treino'] },
    { product: 'reportagens', title: 'Sergio Lima, aos 61 anos, grande exemplo de vida', summary: 'Formação, vontade e dedicação abrindo novos caminhos no esporte.', href: '/reportagens/sergio-lima-exemplo-de-vida', image: '/img/sergio-lima-exemplo-de-vida.jpg', action: 'Ler reportagem', keywords: ['idade', 'mais velho', 'recomecar', 'comecar', 'historia', 'reportagem', 'inspiracao'] },
    { product: 'ferramentas', title: 'Calculadora Pace', summary: 'Calcule o seu ritmo por quilômetro como referência educativa.', href: '/meu-caminho-be/ferramentas?ferramenta=pace', image: '/img/calculadora-pace-relogio-esportivo.webp', action: 'Usar ferramenta', keywords: ['corrida', 'correr', 'pace', 'ritmo', 'quilometro', 'tempo', 'calcular'] },
    { product: 'ferramentas', title: 'Água diária', summary: 'Organize uma referência diária de hidratação.', href: '/meu-caminho-be/ferramentas?ferramenta=agua', image: '/img/app-nutricao-card.png', action: 'Usar ferramenta', keywords: ['agua', 'hidratacao', 'hidratar', 'treino', 'saude'] },
    { product: 'ferramentas', title: 'Calculadora IMC', summary: 'Use peso e altura como uma referência educativa.', href: '/meu-caminho-be/ferramentas?ferramenta=imc', image: '/img/app-nutricao-card.png', action: 'Usar ferramenta', keywords: ['imc', 'peso', 'altura', 'calcular', 'saude'] },
    { product: 'profissionais', title: 'Bruno Rezende — Personal Trainer', summary: 'Treinamento funcional, condicionamento e performance.', href: '/profissionais', image: '/img/profissionais/bruno.jpg', action: 'Ver profissional', keywords: ['corrida', 'correr', 'funcional', 'condicionamento', 'performance', 'personal', 'profissional', 'treinador'] },
    { product: 'profissionais', title: 'Luciano — Personal Soccer', summary: 'Treinamento técnico e desenvolvimento no futebol.', href: '/profissionais', image: '/img/profissionais/luciano.jpg', action: 'Ver profissional', keywords: ['futebol', 'chute', 'passe', 'tecnica', 'personal', 'profissional', 'treinador'] },
    { product: 'profissionais', title: 'Grasiele — Psicóloga', summary: 'Psicologia esportiva, performance mental e psicoterapia.', href: '/profissionais', image: '/img/profissionais/grasiele.jpg', action: 'Ver profissional', keywords: ['psicologia', 'mental', 'emocional', 'motivacao', 'profissional', 'ajuda'] },
    { product: 'produtos', title: 'Tênis Running', summary: 'Produto apresentado na área de corrida do Bem Esportivo.', href: '/produtos', image: '/img/tenis.jpg', action: 'Ver produto', keywords: ['corrida', 'correr', 'tenis', 'comprar', 'produto', 'equipamento'] },
    { product: 'produtos', title: 'Chuteira Society', summary: 'Produto apresentado na área de futebol do Bem Esportivo.', href: '/produtos', image: '/img/chuteira.jpg', action: 'Ver produto', keywords: ['futebol', 'chute', 'chuteira', 'comprar', 'produto', 'equipamento'] },
    { product: 'meu-caminho', title: 'Registrar uma atividade', summary: 'Guarde o treino, jogo, caminhada ou movimento que viveu hoje.', href: '/meu-caminho-be/registrar', image: '/img/jornada-esportiva-atleta-por-do-sol.webp', action: 'Registrar agora', keywords: ['registrar', 'registro', 'atividade', 'fiz hoje', 'treinei hoje', 'treino', 'jogo', 'caminhada'] },
    { product: 'meu-caminho', title: 'Acompanhar minha jornada', summary: 'Veja seus registros e reconheça sua evolução no seu ritmo.', href: '/meu-caminho-be/jornada', image: '/img/jornada-esportiva-atleta-por-do-sol.webp', action: 'Ver jornada', keywords: ['acompanhar', 'jornada', 'evolucao', 'progresso', 'historico', 'rotina'] },
    { product: 'comunidade', title: 'Conversas da Comunidade', summary: 'Faça perguntas e compartilhe experiências sobre esporte.', href: '/meu-caminho-be/ferramentas/comunidade', image: '/img/fala-bem-hero-pessoas-optimized-480.webp', action: 'Participar', keywords: ['conversar', 'conversa', 'comunidade', 'perguntar', 'pergunta', 'duvida', 'opiniao', 'compartilhar'] }
  ]);

  const EXPLICIT_PHRASES = Object.freeze([
    ['quero registrar o que fiz hoje', 'meu-caminho'], ['quero encontrar um profissional', 'profissionais'], ['quero falar com um profissional', 'profissionais'], ['quero saber como melhorar', 'conteudo'], ['quero assistir', 'beplay'], ['quero conversar', 'comunidade']
  ]);

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
  }

  function findProduct(id) {
    return PRODUCTS.find(product => product.id === id) || PRODUCTS[0];
  }

  function contextualize(product, normalized) {
    if (product.id !== 'meu-caminho') return product;
    if (/(registr|atividade|fiz hoje|treinei hoje|meu treino)/.test(normalized)) return { ...product, href: '/meu-caminho-be/registrar', action: 'Registrar atividade' };
    if (/(jornada|evolucao|progresso|acompanhar)/.test(normalized)) return { ...product, href: '/meu-caminho-be/jornada', action: 'Ver minha jornada' };
    if (/perfil/.test(normalized)) return { ...product, href: '/meu-caminho-be/perfil', action: 'Abrir Perfil Be' };
    return product;
  }

  function detectFromTaxonomy(normalized, taxonomy) {
    const searchable = ` ${normalized} `;
    return taxonomy.find(entry => entry.aliases.some(alias => searchable.includes(` ${normalize(alias)} `))) || null;
  }

  function inferPrimaryFromIntent(intent) {
    if (intent?.id === 'register') return findProduct('meu-caminho');
    if (intent?.id === 'watch') return findProduct('beplay');
    if (intent?.id === 'professional') return findProduct('profissionais');
    if (intent) return findProduct('conteudo');
    return null;
  }

  function libraryItemsForSport(normalized, sport, intent) {
    const response = SPORTS_LIBRARY?.search(normalized, sport.id);
    if (!response?.entries?.length) return [];
    const entries = intent?.id === 'start'
      ? [
          {
            kind: 'guidance',
            title: `Primeiros passos para começar ${sport.grammar[0]} ${sport.label}`,
            summary: sport.guidance
          },
          ...response.entries.filter(entry => entry.kind === 'benefits')
        ]
      : response.entries;
    return entries.map(entry => ({
      product: 'conteudo',
      sourceLabel: 'Biblioteca BeM',
      sourceKind: entry.kind,
      opensAnswer: true,
      title: entry.title,
      summary: entry.summary,
      href: `/meu-caminho-be/ferramentas/modalidades?modalidade=${encodeURIComponent(sport.id)}`,
      image: null,
      visualLabel: sport.label,
      action: entry.kind === 'benefits' ? 'Conhecer benefícios' : entry.kind === 'guidance' ? 'Ver primeiros passos' : 'Ler as dicas',
      keywords: [sport.id]
    }));
  }

  function libraryItemForTopic(topic) {
    return {
      product: 'conteudo',
      sourceLabel: 'Biblioteca BeM',
      sourceKind: 'topic',
      opensAnswer: true,
      title: topic.title,
      summary: topic.summary,
      href: '/meu-caminho-be/ferramentas/conteudos',
      image: null,
      visualLabel: topic.label,
      action: 'Ler orientação',
      keywords: [topic.id]
    };
  }

  function supportingItemsForTopic(topic) {
    const items = [{
      product: 'meu-caminho', sourceLabel: 'Meu Caminho Be',
      title: 'Acompanhar meu objetivo',
      summary: 'Registre sua prática e acompanhe a evolução ao longo das semanas.',
      href: '/meu-caminho-be/jornada', image: EDITORIAL_IMAGES.journey,
      action: 'Ver minha jornada', keywords: [topic.id]
    }];
    if (topic.tool === 'pace') items.push({
      product: 'ferramentas', sourceLabel: 'Ferramenta relacionada',
      title: 'Calculadora Pace', summary: 'Calcule seu ritmo por quilômetro como referência educativa.',
      href: '/meu-caminho-be/ferramentas?ferramenta=pace', image: '/img/calculadora-pace-relogio-esportivo.webp',
      action: 'Calcular meu ritmo', keywords: [topic.id]
    });
    if (topic.tool === 'agua') items.push({
      product: 'ferramentas', sourceLabel: 'Ferramenta relacionada',
      title: 'Água diária', summary: 'Organize uma referência educativa de hidratação para sua rotina.',
      href: '/meu-caminho-be/ferramentas?ferramenta=agua', image: '/img/app-nutricao-card.png',
      action: 'Usar ferramenta', keywords: [topic.id]
    });
    if (topic.tool === 'imc') items.push({
      product: 'ferramentas', sourceLabel: 'Ferramenta relacionada',
      title: 'Calculadora IMC', summary: 'Use peso e altura apenas como uma referência educativa, sem diagnóstico.',
      href: '/meu-caminho-be/ferramentas?ferramenta=imc', image: '/img/app-nutricao-card.png',
      action: 'Usar ferramenta', keywords: [topic.id]
    });
    if (topic.kind === 'training') items.push({
      product: 'profissionais', sourceLabel: 'Profissional relacionado',
      title: 'Bruno Rezende — Personal Trainer',
      summary: 'Pode apoiar a organização e a progressão do treinamento. Confirme diretamente a experiência adequada ao seu objetivo.',
      href: '/profissionais?categoria=personal', image: EDITORIAL_IMAGES.professional,
      action: 'Solicitar informações', keywords: [topic.id]
    });
    return items;
  }

  function professionalItemForSport(normalized, sport) {
    const mentalTopic = /(mental|emocional|ansiedade|ansioso|ansiosa|nervoso|nervosa|estresse|estressado|estressada|confianca|motivacao|medo|pressao)/.test(normalized);
    if (mentalTopic) return {
      product: 'profissionais', sourceLabel: 'Profissional relacionado',
      title: 'Grasiele — Psicóloga',
      summary: `Psicologia esportiva e cuidado com aspectos emocionais relacionados ${sport.grammar[2]} ${sport.label}.`,
      href: '/profissionais?categoria=psicologia', image: '/img/profissionais/grasiele.jpg',
      action: 'Solicitar informações', keywords: [sport.id]
    };
    if (['futebol', 'futsal'].includes(sport.id)) return {
      product: 'profissionais', sourceLabel: 'Profissional relacionado',
      title: 'Luciano — Personal Soccer',
      summary: 'Treinamento técnico e desenvolvimento no futebol. Consulte diretamente a disponibilidade e o formato de atendimento.',
      href: '/profissionais?categoria=personal', image: '/img/profissionais/luciano.jpg',
      action: 'Solicitar informações', keywords: [sport.id]
    };
    return {
      product: 'profissionais', sourceLabel: 'Profissional relacionado',
      title: 'Bruno Rezende — Personal Trainer',
      summary: `Pode apoiar o condicionamento físico geral. Confirme diretamente a experiência e o atendimento relacionados ${sport.grammar[2]} ${sport.label}.`,
      href: '/profissionais?categoria=personal', image: EDITORIAL_IMAGES.professional,
      action: 'Solicitar informações', keywords: [sport.id]
    };
  }

  function toolItemForSport(normalized, sport, intent) {
    if (intent?.id === 'start' || intent?.id === 'return') return {
      product: 'ferramentas', sourceLabel: 'Ferramenta relacionada',
      title: 'Dicas práticas para começar',
      summary: `Use orientações curtas para organizar o primeiro passo ${sport.grammar[0]} ${sport.label} com segurança e dentro da sua rotina.`,
      href: '/meu-caminho-be/ferramentas/dicas', image: EDITORIAL_IMAGES.journey,
      action: 'Abrir dicas práticas', keywords: [sport.id]
    };
    const usePace = ['corrida', 'caminhada', 'ciclismo', 'triatlo'].includes(sport.id) || /(pace|ritmo|tempo|distancia|quilometro)/.test(normalized);
    if (usePace) return {
      product: 'ferramentas', sourceLabel: 'Ferramenta relacionada',
      title: 'Calculadora Pace',
      summary: 'Calcule o ritmo por quilômetro e use o resultado como referência educativa para acompanhar sua prática.',
      href: '/meu-caminho-be/ferramentas?ferramenta=pace', image: '/img/calculadora-pace-relogio-esportivo.webp',
      action: 'Calcular meu ritmo', keywords: [sport.id]
    };
    return {
      product: 'ferramentas', sourceLabel: 'Ferramenta relacionada',
      title: 'Água diária',
      summary: `Organize uma referência de hidratação para os dias em que pratica ${sport.grammar[1]} ${sport.label}.`,
      href: '/meu-caminho-be/ferramentas?ferramenta=agua', image: '/img/app-nutricao-card.png',
      action: 'Usar ferramenta', keywords: [sport.id]
    };
  }

  function journeyItemForSport(sport) {
    return {
      product: 'meu-caminho', sourceLabel: 'Meu Caminho Be',
      title: `Registrar uma atividade de ${sport.label}`,
      summary: 'Guarde o que fez hoje e acompanhe sua continuidade no esporte.',
      href: '/meu-caminho-be/registrar', image: EDITORIAL_IMAGES.journey,
      action: 'Registrar agora', keywords: [sport.id]
    };
  }

  function watchItemForSport(sport) {
    return {
      product: 'beplay', sourceLabel: 'BEplay',
      title: `Assistir conteúdos sobre ${sport.label}`,
      summary: `Veja os vídeos disponíveis e encontre conteúdos relacionados ${sport.grammar[2]} ${sport.label}.`,
      href: '/beplay', image: '/img/beplay-capa-pessoas.webp',
      action: 'Abrir o BEplay', keywords: [sport.id]
    };
  }

  function uniqueItems(items) {
    const titlesSeen = new Set();
    return items.filter(item => {
      const title = normalize(item.title);
      if (titlesSeen.has(title)) return false;
      titlesSeen.add(title);
      return true;
    });
  }

  function generalFallbackItems() {
    return [
      {
        product: 'conteudo', title: 'Explore a Biblioteca BeM',
        summary: 'Veja as orientações e trilhas que já fazem parte do Bem Esportivo.',
        href: '/meu-caminho-be/ferramentas/conteudos', image: EDITORIAL_IMAGES.guidance,
        action: 'Explorar conhecimento', keywords: []
      },
      {
        product: 'meu-caminho', title: 'Conte o seu momento no Perfil Be',
        summary: 'Organize quem você é no esporte e o que deseja fazer agora.',
        href: '/meu-caminho-be/perfil', image: EDITORIAL_IMAGES.journey,
        action: 'Abrir Perfil Be', keywords: []
      },
      {
        product: 'comunidade', title: 'Leve sua dúvida para a comunidade',
        summary: 'Converse sobre esporte usando o espaço de participação do Bem Esportivo.',
        href: '/meu-caminho-be/ferramentas/comunidade', image: EDITORIAL_IMAGES.guidance,
        action: 'Abrir comunidade', keywords: []
      }
    ];
  }

  function rankItems(normalized, primaryId, sport, intent, topic) {
    const searchable = sport ? `${normalized} ${sport.id}` : normalized;
    const ranked = SEARCH_ITEMS.map((item, position) => {
      const itemTerms = item.keywords.join(' ');
      const itemSport = detectFromTaxonomy(itemTerms, SPORTS);
      const conflictsWithSport = Boolean(sport && itemSport && itemSport.id !== sport.id);
      const keywordScore = conflictsWithSport ? 0 : item.keywords.reduce((total, keyword) => total + (searchable.includes(keyword) ? (keyword.includes(' ') ? 7 : 4) : 0), 0);
      const score = keywordScore > 0 && item.product === primaryId ? keywordScore + 3 : keywordScore;
      return { item, score, position, sportMatch: Boolean(sport && itemSport?.id === sport.id) };
    }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score || a.position - b.position);

    if (sport) {
      const published = ranked.filter(entry => entry.sportMatch).slice(0, 2).map(entry => ({
        ...entry.item,
        sourceLabel: 'Conteúdo publicado'
      }));
      const topicItems = topic ? [libraryItemForTopic(topic)] : [];
      const libraryItems = libraryItemsForSport(normalized, sport, intent);
      const supportingItems = [professionalItemForSport(normalized, sport), toolItemForSport(normalized, sport, intent)];
      const journeyItems = intent?.id === 'register' ? [journeyItemForSport(sport)] : [];
      const watchItems = intent?.id === 'watch' && !published.some(item => item.product === 'beplay')
        ? [watchItemForSport(sport)]
        : [];
      return {
        items: uniqueItems([...topicItems, ...published, ...libraryItems, ...journeyItems, ...watchItems, ...supportingItems]).slice(0, 6),
        coverage: published.length ? 'mixed' : 'library'
      };
    }

    if (topic) {
      return {
        items: uniqueItems([libraryItemForTopic(topic), ...supportingItemsForTopic(topic)]).slice(0, 6),
        coverage: 'library'
      };
    }

    const selected = [];
    const productsSeen = new Set();
    for (const entry of ranked) {
      if (productsSeen.has(entry.item.product)) continue;
      selected.push(entry.item);
      productsSeen.add(entry.item.product);
      if (selected.length === 6) break;
    }
    return {
      items: selected.length ? selected : generalFallbackItems(),
      coverage: ranked.length ? 'exact' : 'general'
    };
  }

  function search(query) {
    const normalized = normalize(query);
    const displayQuery = String(query || '').trim().slice(0, 180);
    if (!normalized) return { query: '', displayQuery: '', primary: null, related: PRODUCTS.slice(0, 4), items: [], coverage: 'empty', sport: null, intent: null };
    const sport = detectFromTaxonomy(normalized, SPORTS);
    const topic = SPORTS_LIBRARY?.findTopic?.(normalized) || null;
    const intent = detectFromTaxonomy(normalized, INTENTS) || (sport && /\bquero\b/.test(normalized) ? INTENTS.find(entry => entry.id === 'start') : null);
    const phraseMatch = EXPLICIT_PHRASES.find(([phrase]) => normalized.includes(phrase));
    const ranked = PRODUCTS.map((product, position) => ({ product, score: product.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? (keyword.includes(' ') ? 5 : 3) : 0), 0), position })).sort((a, b) => b.score - a.score || a.position - b.position);
    const matchedProduct = phraseMatch ? findProduct(phraseMatch[1]) : ranked[0].score > 0 ? ranked[0].product : inferPrimaryFromIntent(intent) || (sport || topic ? findProduct('conteudo') : null);
    const primary = matchedProduct ? contextualize(matchedProduct, normalized) : null;
    const related = ranked.filter(item => item.product.id !== primary?.id && item.score > 0).slice(0, primary ? 3 : 4).map(item => item.product);
    const rankedItems = rankItems(normalized, primary?.id, sport, intent, topic);
    return { query: normalized, displayQuery, primary, related, items: rankedItems.items, coverage: rankedItems.coverage, sport, topic, intent };
  }

  function createResultCard(item) {
    const product = findProduct(item.product);
    const card = document.createElement(item.opensAnswer ? 'button' : 'a');
    card.className = `be-search-result-card is-${item.product}`;
    if (item.opensAnswer) {
      card.type = 'button';
      card.addEventListener('click', () => openAnswer(item));
    } else {
      card.href = item.href;
    }
    const media = document.createElement('span');
    media.className = 'be-search-result-media';
    if (item.image) {
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      media.append(image);
    } else {
      const visual = document.createElement('span');
      visual.className = 'be-search-result-placeholder';
      const brand = document.createElement('b');
      brand.textContent = 'Be';
      const label = document.createElement('small');
      label.textContent = item.visualLabel || 'esporte';
      visual.append(brand, label);
      media.append(visual);
    }
    const body = document.createElement('span');
    body.className = 'be-search-result-body';
    const label = document.createElement('small');
    label.textContent = item.sourceLabel || product.name;
    const title = document.createElement('strong');
    title.textContent = item.title;
    const summary = document.createElement('span');
    summary.textContent = item.summary;
    const action = document.createElement('b');
    action.textContent = `${item.action} →`;
    body.append(label, title, summary, action);
    card.append(media, body);
    return card;
  }

  function answerSteps(summary) {
    const numbered = String(summary || '').split(/(?:^|\s)\d+\.\s+/).map(step => step.trim()).filter(Boolean);
    return numbered.length > 1 ? numbered : [];
  }

  function ensureAnswerDialog() {
    let dialog = document.getElementById('be-search-answer-dialog');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.id = 'be-search-answer-dialog';
    dialog.className = 'be-search-answer-dialog';
    dialog.setAttribute('aria-labelledby', 'be-search-answer-title');

    const article = document.createElement('article');
    article.className = 'be-search-answer-panel';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'be-search-answer-close';
    close.setAttribute('aria-label', 'Fechar resposta');
    close.textContent = '×';
    close.addEventListener('click', () => dialog.close());

    const kicker = document.createElement('span');
    kicker.className = 'be-search-answer-kicker';
    kicker.id = 'be-search-answer-kicker';
    const title = document.createElement('h2');
    title.id = 'be-search-answer-title';
    const lead = document.createElement('p');
    lead.className = 'be-search-answer-lead';
    lead.id = 'be-search-answer-lead';
    const content = document.createElement('div');
    content.className = 'be-search-answer-content';
    content.id = 'be-search-answer-content';
    const note = document.createElement('p');
    note.className = 'be-search-answer-note';
    note.textContent = 'Orientação educativa da Biblioteca BeM. Respeite o seu momento e procure acompanhamento adequado quando necessário.';
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'be-search-answer-done';
    done.textContent = 'Voltar aos resultados';
    done.addEventListener('click', () => dialog.close());

    article.append(close, kicker, title, lead, content, note, done);
    dialog.append(article);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    document.body.append(dialog);
    return dialog;
  }

  function openAnswer(item) {
    const dialog = ensureAnswerDialog();
    const kicker = dialog.querySelector('#be-search-answer-kicker');
    const title = dialog.querySelector('#be-search-answer-title');
    const lead = dialog.querySelector('#be-search-answer-lead');
    const content = dialog.querySelector('#be-search-answer-content');
    const steps = answerSteps(item.summary);
    kicker.textContent = `Biblioteca BeM · ${item.visualLabel || 'Esporte'}`;
    title.textContent = item.title;
    lead.textContent = item.sourceKind === 'guidance'
      ? 'Um caminho simples e direto para dar o primeiro passo.'
      : item.sourceKind === 'benefits'
        ? 'O que essa prática pode acrescentar à sua rotina.'
        : item.sourceKind === 'topic'
          ? 'Uma resposta educativa para organizar o próximo passo com segurança.'
          : 'Uma orientação prática para entender e treinar esse fundamento.';
    content.replaceChildren();
    if (steps.length) {
      const list = document.createElement('ol');
      steps.forEach(step => {
        const entry = document.createElement('li');
        entry.textContent = step;
        list.append(entry);
      });
      content.append(list);
    } else {
      const paragraph = document.createElement('p');
      paragraph.textContent = item.summary;
      content.append(paragraph);
    }
    dialog.showModal();
  }

  function render(result, container) {
    const section = container.closest('.be-search-discovery');
    const title = document.getElementById('be-search-result-title');
    const queryLabel = document.getElementById('be-search-result-query');
    container.replaceChildren();
    result.items.forEach(item => container.append(createResultCard(item)));
    if (title) {
      title.textContent = result.coverage === 'library'
        ? 'A Biblioteca BeM encontrou este caminho'
        : result.coverage === 'mixed'
          ? 'Conteúdo e Biblioteca BeM para você'
        : result.coverage === 'general'
          ? 'Vamos direcionar sua busca'
          : 'Encontramos para você';
    }
    if (queryLabel) {
      const subject = result.sport?.label || result.topic?.label || result.displayQuery;
      if (result.coverage === 'library') {
        queryLabel.textContent = `A Biblioteca BeM reuniu uma resposta educativa sobre ${subject} e caminhos relacionados para você continuar.`;
      } else if (result.coverage === 'mixed') {
        queryLabel.textContent = `Reunimos conteúdo publicado e informações da Biblioteca BeM sobre ${subject}, além de caminhos relacionados.`;
      } else if (result.coverage === 'general') {
        queryLabel.textContent = `Ainda não encontramos conteúdo específico para “${result.displayQuery}”. Veja caminhos que podem ajudar a continuar.`;
      } else {
        queryLabel.textContent = result.primary ? `Resultados para “${result.displayQuery}”` : 'Possibilidades dentro do Bem Esportivo';
      }
    }
    if (section) {
      section.hidden = false;
      section.dataset.searchCoverage = result.coverage;
    }
    container.setAttribute('aria-label', `${result.items.length} resultados encontrados`);
  }

  function init() {
    const form = document.getElementById('be-ecosystem-search-form');
    const input = document.getElementById('be-ecosystem-search-input');
    const results = document.getElementById('be-ecosystem-search-results');
    if (!form || !input || !results) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const result = search(input.value);
      if (!result.query) {
        input.focus();
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      input.removeAttribute('aria-invalid');
      render(result, results);
      results.closest('.be-search-discovery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.querySelectorAll('[data-be-search-example]').forEach(button => {
      button.addEventListener('click', () => {
        input.value = button.dataset.beSearchExample || button.textContent.trim();
        form.requestSubmit();
      });
    });
  }

  const api = Object.freeze({ PRODUCTS, SPORTS, TOPICS, INTENTS, SEARCH_ITEMS, normalize, search });
  global.BeEcosystemSearch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
