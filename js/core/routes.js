export const primaryNavigation = [
  ['/', 'Início', '<path d="m3 10 9-7 9 7"></path><path d="M5 10v10h14V10"></path>'],
  ['/meu-caminho-be', 'Meu Caminho Be', '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>'],
  ['/game.html', 'Game 3D', '<path d="M6 8h12a4 4 0 0 1 4 4v3a3 3 0 0 1-5 2l-2-2H9l-2 2a3 3 0 0 1-5-2v-3a4 4 0 0 1 4-4Z"></path><path d="M7 11v4M5 13h4M16 12h.01M19 14h.01"></path>'],
  ['/reportagens', 'Reportagens', '<path d="M5 4h14v16H5z"></path><path d="M8 8h8M8 12h8M8 16h5"></path>'],
  ['/#treinos', 'Treinos', '<path d="M4 7h16M4 12h11M4 17h16"></path>'],
  ['/beplay', 'BEplay', '<path d="M6 8h12l-1 12H7L6 8Z"></path><path d="M9 8a3 3 0 0 1 6 0"></path>'],
  ['/profissionais', 'Profissionais', '<path d="M16 21v-2a4 4 0 0 0-8 0v2"></path><circle cx="12" cy="7" r="4"></circle>'],
  ['/produtos', 'Produtos', '<path d="M20 7 12 3 4 7l8 4 8-4Z"></path><path d="M4 7v10l8 4 8-4V7M12 11v10"></path>']
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
  '/termos': 'Termos de Uso'
};

export const visualBreadcrumbPages = new Set([
  '/reportagens', '/produtos', '/profissionais', '/sobre', '/contato',
  '/politica-de-valores', '/politica-de-privacidade', '/termos'
]);

export function normalizePath(value) {
  const path = new URL(value, window.location.origin).pathname
    .replace(/index\.html$/i, '')
    .replace(/\.html$/i, '')
    .replace(/\/$/, '')
    .toLowerCase();
  return path || '/';
}
