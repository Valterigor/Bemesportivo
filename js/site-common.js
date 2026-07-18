(() => {
  const primaryNavigation = [
    ['/', 'Início'],
    ['/meu-caminho-be', 'Meu Caminho Be'],
    ['/game.html', 'Game 3D'],
    ['/#jogos', 'Partidas'],
    ['/#pessoas', 'Pessoas'],
    ['/reportagens', 'Reportagens'],
    ['/#treinos', 'Treinos'],
    ['/beplay', 'BEplay'],
    ['/profissionais', 'Profissionais'],
    ['/produtos', 'Produtos']
  ];

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
    nav.replaceChildren(...primaryNavigation.map(([href, label]) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      return link;
    }));
  });

  document.querySelectorAll('.site-footer').forEach(footer => {
    const inner = footer.querySelector('.site-footer-inner');
    if (!inner) return;
    inner.innerHTML = `
      <div class="site-footer-brand">
        <a class="site-footer-logo" href="/" aria-label="Ir para a página inicial do Bem Esportivo">
          <img src="img/Bem Esportivo Logo Laranja@33x.png" alt="Bem Esportivo">
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
    const isCurrent = href === currentPath;
    link.classList.toggle('active', isCurrent);
    link.classList.toggle('is-active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const topButton = document.getElementById('topBtn');
  if (topButton && topButton.dataset.commonTopBound !== 'true') {
    topButton.dataset.commonTopBound = 'true';
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();
