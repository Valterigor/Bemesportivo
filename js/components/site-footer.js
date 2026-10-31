const brand = `<div class="be-global-footer__brand"><a href="/" aria-label="Bem Esportivo — início"><img src="/img/Bem%20Esportivo%20Logo%20Laranja@33x.png" alt="Bem Esportivo" width="2263" height="1937" loading="lazy" decoding="async"></a><p>Histórias e conhecimento para viver o esporte. Um caminho para guardar a sua trajetória.</p></div>`;
const institutional = `<div class="be-global-footer__column"><strong>Institucional</strong><nav aria-label="Links institucionais"><a href="/sobre">Sobre</a><a href="/contato">Contato</a><a href="/politica-de-valores">Política de Valores</a><a href="/diretrizes-da-comunidade">Diretrizes da Comunidade</a><a href="/politica-de-privacidade">Privacidade</a><a href="/termos">Termos</a><button type="button" data-privacy-settings>Gerenciar privacidade</button><a href="https://www.instagram.com/bemesportivo/" target="_blank" rel="noopener noreferrer">Instagram @bemesportivo</a></nav></div>`;
const explore = `<div class="be-global-footer__column"><strong>Explore</strong><nav aria-label="Explore o Bem Esportivo"><a href="/criar-postagem">Criar arte para redes</a><a href="/meu-caminho-be">Meu Diário Be</a><a href="/game">Game 3D</a><a href="/reportagens">Reportagens</a><a href="/beplay">BEplay</a><a href="/profissionais">Profissionais</a><a href="/produtos">Produtos</a></nav></div>`;
const bottom = `<div class="be-global-footer__bottom"><span>© 2026 BEM ESPORTIVO. Todos os direitos reservados.</span><span>O esporte começa com pessoas.</span></div>`;

export function initSiteFooter() {
  if (document.body.matches('.game-page, .admin-page, .ds-page')) return;
  document.querySelectorAll('footer.site-footer, footer.footer, footer.fashion-footer').forEach(footer => {
    if (footer.dataset.globalFooterReady) return;
    const compact = document.body.classList.contains('fala-bem-app-page');
    footer.className = `be-global-footer${compact ? ' be-global-footer--compact' : ''}`;
    footer.dataset.globalFooterReady = 'true';
    footer.innerHTML = compact
      ? `<div class="be-global-footer__grid">${brand}${institutional}</div>${bottom}`
      : `<div class="be-global-footer__grid">${brand}${explore}${institutional}</div>${bottom}`;
  });
}
