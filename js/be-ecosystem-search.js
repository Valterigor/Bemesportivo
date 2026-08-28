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

  function rankItems(normalized, primaryId) {
    const ranked = SEARCH_ITEMS.map((item, position) => {
      const score = item.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? (keyword.includes(' ') ? 7 : 4) : 0), item.product === primaryId ? 3 : 0);
      return { item, score, position };
    }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score || a.position - b.position);
    const selected = [];
    const productsSeen = new Set();
    for (const entry of ranked) {
      if (productsSeen.has(entry.item.product)) continue;
      selected.push(entry.item);
      productsSeen.add(entry.item.product);
      if (selected.length === 6) break;
    }
    if (selected.length < 4) {
      for (const item of SEARCH_ITEMS) {
        if (productsSeen.has(item.product)) continue;
        selected.push(item);
        productsSeen.add(item.product);
        if (selected.length === 6) break;
      }
    }
    return selected;
  }

  function search(query) {
    const normalized = normalize(query);
    if (!normalized) return { query: '', primary: null, related: PRODUCTS.slice(0, 4), items: [] };
    const phraseMatch = EXPLICIT_PHRASES.find(([phrase]) => normalized.includes(phrase));
    const ranked = PRODUCTS.map((product, position) => ({ product, score: product.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? (keyword.includes(' ') ? 5 : 3) : 0), 0), position })).sort((a, b) => b.score - a.score || a.position - b.position);
    const matchedProduct = phraseMatch ? findProduct(phraseMatch[1]) : ranked[0].score > 0 ? ranked[0].product : null;
    const primary = matchedProduct ? contextualize(matchedProduct, normalized) : null;
    const related = ranked.filter(item => item.product.id !== primary?.id).slice(0, primary ? 3 : 4).map(item => item.product);
    return { query: normalized, primary, related, items: rankItems(normalized, primary?.id) };
  }

  function createResultCard(item) {
    const product = findProduct(item.product);
    const link = document.createElement('a');
    link.className = `be-search-result-card is-${item.product}`;
    link.href = item.href;
    const media = document.createElement('span');
    media.className = 'be-search-result-media';
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    media.append(image);
    const body = document.createElement('span');
    body.className = 'be-search-result-body';
    const label = document.createElement('small');
    label.textContent = product.name;
    const title = document.createElement('strong');
    title.textContent = item.title;
    const summary = document.createElement('span');
    summary.textContent = item.summary;
    const action = document.createElement('b');
    action.textContent = `${item.action} →`;
    body.append(label, title, summary, action);
    link.append(media, body);
    return link;
  }

  function render(result, container) {
    const section = container.closest('.be-search-discovery');
    const title = document.getElementById('be-search-result-title');
    const queryLabel = document.getElementById('be-search-result-query');
    container.replaceChildren();
    result.items.forEach(item => container.append(createResultCard(item)));
    if (title) title.textContent = 'Encontramos para você';
    if (queryLabel) queryLabel.textContent = result.primary ? `Resultados para “${result.query}”` : 'Possibilidades dentro do Bem Esportivo';
    if (section) section.hidden = false;
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

  const api = Object.freeze({ PRODUCTS, SEARCH_ITEMS, normalize, search });
  global.BeEcosystemSearch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
