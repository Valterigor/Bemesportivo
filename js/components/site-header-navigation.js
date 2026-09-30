import { normalizePath } from '../core/routes.js?v=20260929-1';

export function initSiteNavigation() {
  if (!document.body.classList.contains('fala-bem-app-page') && document.querySelector('.site-footer')) {
    document.body.classList.add('be-standard-page');
  }
  const header = document.getElementById('be-site-header');
  if (!header || header.dataset.navigationReady) return;
  header.dataset.navigationReady = 'true';
  const nav = header.querySelector('#be-site-navigation');
  const more = header.querySelector('details');
  const current = normalizePath(location.pathname);
  const section = current.startsWith('/reportagens/') || current.startsWith('/reportagem-') ? '/reportagens'
    : current.startsWith('/fala-bem-') ? '/fala-bem'
    : current.startsWith('/meu-caminho-be/') ? '/meu-caminho-be' : current;
  header.querySelectorAll('a[data-site-link]').forEach(link => {
    const target = new URL(link.href);
    const isPrimary = link.parentElement === nav || link.classList.contains('be-site-journey');
    const localAnchor = link.getAttribute('href').startsWith('#');
    const active = localAnchor ? target.hash === location.hash
      : isPrimary ? normalizePath(target.pathname) === section
      : !target.hash && normalizePath(target.pathname) === current && target.search === location.search;
    if (active) link.setAttribute('aria-current', isPrimary && current !== section ? 'location' : 'page');
    else link.removeAttribute('aria-current');
  });
  if (more?.querySelector('[aria-current]')) more.classList.add('has-current');
  function closeMenu() {
    if (more) more.open = false;
  }
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !more?.open) return;
    closeMenu();
    more.querySelector('summary').focus();
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  window.addEventListener('hashchange', () => {
    nav.querySelectorAll('a[href^="#"]').forEach(link => {
      if (link.hash === location.hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
  document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
  document.addEventListener('focusin', event => { if (!header.contains(event.target)) closeMenu(); });
  matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);
}
