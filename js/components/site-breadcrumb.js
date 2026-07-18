import { breadcrumbPages, normalizePath, visualBreadcrumbPages } from '../core/routes.js';

export function initSiteBreadcrumb() {
  const path = normalizePath(window.location.pathname);
  const label = breadcrumbPages[path];
  if (!label || document.querySelector('.site-breadcrumb')) return;

  if (visualBreadcrumbPages.has(path)) {
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'site-breadcrumb';
    breadcrumb.setAttribute('aria-label', 'Navegação estrutural');
    breadcrumb.innerHTML = `<a href="/">Início</a><span aria-hidden="true">/</span><span aria-current="page">${label}</span>`;
    const headers = [...document.querySelectorAll('body > header')];
    headers.at(-1)?.insertAdjacentElement('afterend', breadcrumb);
  }

  const structuredData = document.createElement('script');
  structuredData.type = 'application/ld+json';
  structuredData.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://bemesportivo.com/' },
      { '@type': 'ListItem', position: 2, name: label }
    ]
  });
  document.head.appendChild(structuredData);
}
