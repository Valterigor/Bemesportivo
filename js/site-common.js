(() => {
  const primaryNavigation = [
    ['/', 'Início', '<path d="m3 10 9-7 9 7"></path><path d="M5 10v10h14V10"></path>'],
    ['/meu-caminho-be', 'Meu Caminho Be', '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>'],
    ['/game.html', 'Game 3D', '<path d="M6 8h12a4 4 0 0 1 4 4v3a3 3 0 0 1-5 2l-2-2H9l-2 2a3 3 0 0 1-5-2v-3a4 4 0 0 1 4-4Z"></path><path d="M7 11v4M5 13h4M16 12h.01M19 14h.01"></path>'],
    ['/reportagens', 'Reportagens', '<path d="M5 4h14v16H5z"></path><path d="M8 8h8M8 12h8M8 16h5"></path>'],
    ['/#treinos', 'Treinos', '<path d="M4 7h16M4 12h11M4 17h16"></path>'],
    ['/beplay', 'BEplay', '<path d="M6 8h12l-1 12H7L6 8Z"></path><path d="M9 8a3 3 0 0 1 6 0"></path>'],
    ['/profissionais', 'Profissionais', '<path d="M16 21v-2a4 4 0 0 0-8 0v2"></path><circle cx="12" cy="7" r="4"></circle>'],
    ['/produtos', 'Produtos', '<path d="M20 7 12 3 4 7l8 4 8-4Z"></path><path d="M4 7v10l8 4 8-4V7M12 11v10"></path>']
  ];

  if (!document.body.classList.contains('fala-bem-app-page')) {
    document.body.classList.add('be-standard-page');
  }

  const normalizePath = value => {
    const path = new URL(value, window.location.origin).pathname
      .replace(/index\.html$/i, '')
      .replace(/\.html$/i, '')
      .replace(/\/$/, '')
      .toLowerCase();
    return path || '/';
  };

  const sharedNavigations = document.querySelectorAll([
    '.menu nav',
    '.site-menu nav',
    'body > header:not(.site-header):not(.topbar) > nav'
  ].join(','));

  sharedNavigations.forEach(nav => {
    nav.setAttribute('aria-label', 'Menu principal');
    nav.replaceChildren(...primaryNavigation.map(([href, label, icon]) => {
      const link = document.createElement('a');
      link.href = href;
      link.innerHTML = `<svg class="be-nav-icon" aria-hidden="true" viewBox="0 0 24 24">${icon}</svg><span>${label}</span>`;
      return link;
    }));
  });

  const breadcrumbPages = {
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

  const breadcrumbPath = normalizePath(window.location.pathname);
  const breadcrumbLabel = breadcrumbPages[breadcrumbPath];
  if (breadcrumbLabel && !document.querySelector('.site-breadcrumb')) {
    const pagesWithVisualBreadcrumb = new Set([
      '/reportagens', '/produtos', '/profissionais', '/sobre', '/contato',
      '/politica-de-valores', '/politica-de-privacidade', '/termos'
    ]);
    if (pagesWithVisualBreadcrumb.has(breadcrumbPath)) {
      const breadcrumb = document.createElement('nav');
      breadcrumb.className = 'site-breadcrumb';
      breadcrumb.setAttribute('aria-label', 'Navegação estrutural');
      breadcrumb.innerHTML = `<a href="/">Início</a><span aria-hidden="true">/</span><span aria-current="page">${breadcrumbLabel}</span>`;
      const headers = [...document.querySelectorAll('body > header')];
      const anchor = headers[headers.length - 1];
      if (anchor) anchor.insertAdjacentElement('afterend', breadcrumb);
    }

    const structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://bemesportivo.com/' },
        { '@type': 'ListItem', position: 2, name: breadcrumbLabel }
      ]
    });
    document.head.appendChild(structuredData);
  }

  document.querySelectorAll('.site-footer').forEach(footer => {
    const inner = footer.querySelector('.site-footer-inner');
    if (!inner) return;
    inner.innerHTML = `
      <div class="site-footer-brand">
        <a class="site-footer-logo" href="/" aria-label="Ir para a página inicial do Bem Esportivo">
          <img src="/img/Bem Esportivo Logo Laranja@33x.png" alt="Bem Esportivo">
        </a>
        <p>O lugar onde esporte, conhecimento e pessoas evoluem juntos.</p>
      </div>
      <div class="site-footer-group">
        <strong>Explore</strong>
        <nav aria-label="Links principais">
          <a href="/meu-caminho-be">Meu Caminho Be</a>
          <a href="/game.html">Game 3D</a>
          <a href="/reportagens">Reportagens</a>
          <a href="/beplay">BEplay</a>
          <a href="/profissionais">Profissionais</a>
          <a href="/produtos">Produtos</a>
        </nav>
      </div>
      <div class="site-footer-group">
        <strong>Institucional</strong>
        <nav aria-label="Links institucionais">
          <a href="/sobre">Sobre</a>
          <a href="/contato">Contato</a>
          <a href="/politica-de-valores">Política de Valores</a>
          <a href="/politica-de-privacidade">Privacidade</a>
          <a href="/termos">Termos</a>
        </nav>
      </div>
      <small>© 2026 Bem Esportivo. Todos os direitos reservados.</small>`;
  });

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

  sharedNavigations.forEach(nav => {
    const activeLink = nav.querySelector('a[aria-current="page"]');
    if (!activeLink) return;
    nav.scrollLeft = Math.max(0, activeLink.offsetLeft - (nav.clientWidth - activeLink.offsetWidth) / 2);
  });

  let topButton = document.getElementById('topBtn') || document.getElementById('backToTop');
  if (!topButton) {
    topButton = document.createElement('button');
    topButton.id = 'topBtn';
    topButton.type = 'button';
    document.body.appendChild(topButton);
  }

  topButton.classList.add('be-back-to-top');
  topButton.setAttribute('aria-label', 'Voltar ao início da página');
  topButton.title = 'Voltar ao início';
  if (topButton.id === 'topBtn') {
    topButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>';
  }

  if (topButton.dataset.commonTopBound !== 'true') {
    topButton.dataset.commonTopBound = 'true';
    const updateTopButton = () => topButton.classList.toggle('show', window.scrollY > 320);
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', updateTopButton, { passive: true });
    updateTopButton();
  }
})();
