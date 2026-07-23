const footerContent = `
  <div class="site-footer-brand">
    <a class="site-footer-logo" href="/" aria-label="Ir para a página inicial do Bem Esportivo">
      <img src="/img/Bem Esportivo Logo Laranja@33x.png" alt="Bem Esportivo" width="54" height="46" loading="lazy" decoding="async">
    </a>
    <p>O lugar onde esporte, conhecimento e pessoas evoluem juntos.</p>
  </div>
  <div class="site-footer-group">
    <strong>Explore</strong>
    <nav aria-label="Links principais">
      <a href="/meu-caminho-be">Meu Caminho Be</a><a href="/game.html">Game 3D</a>
      <a href="/reportagens">Reportagens</a><a href="/beplay">BEplay</a>
      <a href="/profissionais">Profissionais</a><a href="/produtos">Produtos</a>
    </nav>
  </div>
  <div class="site-footer-group">
    <strong>Institucional</strong>
    <nav aria-label="Links institucionais">
      <a href="/sobre">Sobre</a><a href="/contato">Contato</a>
      <a href="/politica-de-valores">Política de Valores</a>
      <a href="/politica-de-privacidade">Privacidade</a><a href="/termos">Termos</a>
      <a href="/diretrizes-da-comunidade">Diretrizes da Comunidade</a>
      <button type="button" data-privacy-settings>Gerenciar privacidade</button>
      <a href="https://www.instagram.com/bemesportivo/" target="_blank" rel="noopener noreferrer">Instagram @bemesportivo</a>
    </nav>
  </div>
  <div class="site-footer-bottom">
    <span>© 2026 BEM ESPORTIVO. Todos os direitos reservados.</span>
    <span>Esporte, saúde, informação e comunidade.</span>
  </div>`;

export function initSiteFooter() {
  document.querySelectorAll('.site-footer-inner').forEach(inner => { inner.innerHTML = footerContent; });
}
