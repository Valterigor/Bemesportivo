export const siteNavigation = [
  ['/', 'Início'], ['/reportagens', 'Reportagens'], ['/beplay', 'BePlay'],
  ['/fala-bem', 'Fala Bem!']
];

// A shared visual shell, with navigation specific to each area.
export const pageNavigation = {
  'reportagens.html': { label: 'Menu de reportagens', links: [['/', 'Início'], ['/reportagens', 'Reportagens'], ['#report-featured-title', 'Destaque'], ['#report-more-title', 'Mais histórias']] },
  'beplay.html': { label: 'Menu do BePlay', links: [['/', 'Início'], ['#videos', 'Assistir'], ['#relatedVideos', 'Playlist'], ['#opinioes', 'Comentários'], ['#perfil', 'Minha lista']] },
  'fala-bem.html': { label: 'Menu do Fala Bem!', links: [['/', 'Início'], ['/fala-bem', 'Fala Bem!'], ['#editoria-title', 'A editoria'], ['#colunas', 'Colunas'], ['/contato', 'Enviar uma ideia']] },
  'fala-bem-selecao-australia.html': { label: 'Menu da opinião', links: [['/', 'Início'], ['/fala-bem', 'Fala Bem!'], ['#conteudo', 'Ler opinião'], ['#comments-title', 'Comentários']] },
  'moda-fitness.html': { label: 'Menu de Moda Fitness', links: [['/', 'Início'], ['#conceito', 'Conceito'], ['#editorial', 'Editorial'], ['#catalogo', 'Catálogo'], ['/contato', 'Contato']] },
  'radar-esportivo.html': { label: 'Menu do Radar SP', links: [['/', 'Início'], ['/radar-esportivo', 'Radar SP'], ['#opportunities-title', 'Onde praticar'], ['#contribute-title', 'Indicar um local']] },
  'profissionais.html': { label: 'Menu de profissionais', links: [['/', 'Início'], ['#como-funciona', 'Como funciona'], ['#profissionais', 'Encontrar apoio'], ['/contato', 'Contato']] },
  'produtos.html': { label: 'Menu de produtos', links: [['/', 'Início'], ['#productsGrid', 'Produtos'], ['/moda-fitness', 'Moda Fitness'], ['/contato', 'Contato']] },
  'criar-postagem.html': { label: 'Menu de criação de postagem', links: [['/', 'Início'], ['#post-maker-form', 'Criar postagem'], ['#be-maker-preview-title', 'Ver prévia'], ['/meu-caminho-be', 'Meu diário']] },
  'perfil-publico.html': { label: 'Menu do perfil público', links: [['/', 'Início'], ['/meu-caminho-be', 'Meu diário'], ['/meu-caminho-be/perfil', 'Meu perfil'], ['/diretrizes-da-comunidade', 'Comunidade']] }
};

export const institutionalNavigation = {
  label: 'Menu institucional',
  links: [['/', 'Início'], ['/sobre', 'Sobre'], ['/contato', 'Contato']],
  moreLabel: 'Políticas',
  groups: [{ label: 'Transparência e comunidade', links: [
    ['/politica-de-valores', 'Nossos valores', 'Compromissos do Bem Esportivo'],
    ['/diretrizes-da-comunidade', 'Diretrizes da comunidade', 'Convivência e participação'],
    ['/politica-de-privacidade', 'Privacidade', 'Dados e preferências'],
    ['/termos', 'Termos de uso', 'Condições de uso do site']
  ] }]
};

export const navigationGroups = [
  { label: 'Praticar e aprender', links: [
    ['/radar-esportivo', 'Radar SP', 'Onde praticar em São Paulo'],
    ['/meu-caminho-be?tela=conteudos', 'Conhecimento', 'Guias e dicas para aprender'],
    ['/meu-caminho-be?tela=ferramentas', 'Ferramentas', 'Pace, hidratação e outras referências'],
    ['/profissionais', 'Profissionais', 'Encontre apoio para sua prática']
  ] },
  { label: 'Sua jornada', links: [
    ['/meu-caminho-be', 'Meu Caminho Be', 'Seu diário esportivo digital'],
    ['/meu-caminho-be/perfil', 'Meu perfil', 'Seu espaço no diário']
  ] },
  { label: 'Estilo e recursos', links: [
    ['/moda-fitness', 'Moda Fitness', 'Editorial e catálogo de looks'],
    ['/produtos', 'Produtos', 'Curadoria de itens esportivos'],
    ['/game', 'Game 3D', 'Corrida da Hidratação'],
    ['/criar-postagem', 'Criar postagem', 'Prepare uma imagem para suas redes']
  ] }
];

export const breadcrumbPages = {
  '/reportagens': 'Reportagens',
  '/fala-bem': 'Fala Bem!',
  '/beplay': 'BEplay',
  '/produtos': 'Produtos',
  '/profissionais': 'Profissionais',
  '/sobre': 'Sobre',
  '/contato': 'Contato',
  '/politica-de-valores': 'Política de Valores',
  '/politica-de-privacidade': 'Política de Privacidade',
  '/termos': 'Termos de Uso',
  '/diretrizes-da-comunidade': 'Diretrizes da Comunidade'
};

export const visualBreadcrumbPages = new Set([
  '/reportagens', '/fala-bem', '/produtos', '/profissionais', '/sobre', '/contato',
  '/politica-de-valores', '/politica-de-privacidade', '/termos', '/diretrizes-da-comunidade'
]);

export function normalizePath(value) {
  const path = new URL(value, window.location.origin).pathname
    .replace(/index\.html$/i, '')
    .replace(/\.html$/i, '')
    .replace(/\/$/, '')
    .toLowerCase();
  return path || '/';
}
