(() => {
  const menuPairs = [
    ['menu-toggle', 'menu', 'show'],
    ['menu-toggle', 'nav', 'active'],
    ['siteMenuToggle', 'siteNav', 'is-open']
  ];

  menuPairs.forEach(([buttonId, navId, openClass]) => {
    const button = document.getElementById(buttonId);
    const nav = document.getElementById(navId);
    if (!button || !nav || button.dataset.commonMenuBound === 'true') return;

    button.dataset.commonMenuBound = 'true';
    button.addEventListener('click', () => {
      const isOpen = nav.classList.toggle(openClass);
      button.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove(openClass);
        button.setAttribute('aria-expanded', 'false');
      });
    });
  });

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('nav a[href]').forEach(link => {
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#')) return;
    const href = new URL(rawHref, window.location.origin).pathname.replace(/\/$/, '') || '/';
    link.classList.toggle('active', href === currentPath);
    link.classList.toggle('is-active', href === currentPath && link.classList.contains('is-active'));
  });

  const topButton = document.getElementById('topBtn');
  if (topButton && topButton.dataset.commonTopBound !== 'true') {
    topButton.dataset.commonTopBound = 'true';
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();
