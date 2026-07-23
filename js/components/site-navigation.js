import { normalizePath, primaryNavigation } from '../core/routes.js';

const navigationSelector = [
  '.menu nav',
  '.site-menu nav',
  'body > header:not(.site-header):not(.topbar) > nav'
].join(',');

function createNavigationLink([href, label, icon]) {
  const link = document.createElement('a');
  link.href = href;
  link.innerHTML = `<svg class="be-nav-icon" aria-hidden="true" viewBox="0 0 24 24">${icon}</svg><span>${label}</span>`;
  return link;
}

function markCurrentLinks() {
  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll('nav a[href]').forEach(link => {
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#')) return;
    const href = normalizePath(rawHref);
    const isReportArticle = href === '/reportagens'
      && (currentPath.startsWith('/reportagens/') || currentPath.startsWith('/reportagem-'));
    const isCurrent = href === currentPath || isReportArticle;
    link.classList.toggle('active', isCurrent);
    link.classList.toggle('is-active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function bindLegacyMenuButtons() {
  [
    ['menu-toggle', 'menu', 'show'],
    ['menu-toggle', 'nav', 'active'],
    ['siteMenuToggle', 'siteNav', 'is-open']
  ].forEach(([buttonId, navId, openClass]) => {
    const button = document.getElementById(buttonId);
    const nav = document.getElementById(navId);
    if (!button || !nav || button.dataset.commonMenuBound === 'true') return;
    button.dataset.commonMenuBound = 'true';
    button.addEventListener('click', () => {
      const isOpen = nav.classList.toggle(openClass);
      button.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove(openClass);
      button.setAttribute('aria-expanded', 'false');
    }));
  });
}

export function initSiteNavigation() {
  if (!document.body.classList.contains('fala-bem-app-page')) {
    document.body.classList.add('be-standard-page');
  }
  const navigations = [...document.querySelectorAll(navigationSelector)];
  navigations.forEach(nav => {
    nav.setAttribute('aria-label', 'Menu principal');
    nav.replaceChildren(...primaryNavigation.map(createNavigationLink));
  });
  bindLegacyMenuButtons();
  markCurrentLinks();
  navigations.forEach(nav => {
    const activeLink = nav.querySelector('a[aria-current="page"]');
    if (!activeLink) {
      nav.scrollLeft = 0;
      return;
    }
    const compactViewport = window.matchMedia('(max-width: 720px)').matches;
    const navRect = nav.getBoundingClientRect();
    const activeRect = activeLink.getBoundingClientRect();
    const relativeLeft = activeRect.left - navRect.left + nav.scrollLeft;
    nav.scrollLeft = compactViewport
      ? Math.max(0, relativeLeft - 8)
      : Math.max(0, relativeLeft - (nav.clientWidth - activeRect.width) / 2);
  });
}
