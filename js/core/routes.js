export const primaryNavigation = [
  ['/', 'Início', '<path d="m3 10 9-7 9 7"></path><path d="M5 10v10h14V10"></path>'],
  ['/reportagens', 'Reportagens', '<path d="M5 4h14v16H5z"></path><path d="M8 8h8M8 12h8M8 16h5"></path>'],
  ['/#pessoas', 'Histórias', '<path d="M4 5h16v14H4z"></path><path d="M8 9h8M8 13h5"></path>'],
  ['/#treinos', 'Conteúdos', '<path d="M4 7h16M4 12h11M4 17h16"></path>'],
  ['/beplay', 'BEplay', '<path d="M6 8h12l-1 12H7L6 8Z"></path><path d="M9 8a3 3 0 0 1 6 0"></path>'],
  ['/profissionais', 'Profissionais', '<path d="M16 21v-2a4 4 0 0 0-8 0v2"></path><circle cx="12" cy="7" r="4"></circle>'],
  ['/meu-caminho-be', 'Meu Caminho Be', '<path d="M4 18c4-1 5-4 6-8s3-6 7-6h3"></path><path d="m16 2 4 2-2 4"></path><circle cx="5" cy="18" r="2"></circle>']
];

export const breadcrumbPages = {
  '/reportagens': 'Reportagens',
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
  '/reportagens', '/produtos', '/profissionais', '/sobre', '/contato',
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
