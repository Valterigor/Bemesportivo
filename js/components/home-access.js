export function initHomeAccess() {
  const path = window.location.pathname.replace(/index\.html$/i, '').replace(/\/$/, '') || '/';
  if (path === '/' || document.querySelector('.be-home-access')) return;
  const stylesheetHref = '/css/components/home-access.css?v=20260919-2';
  if (!document.querySelector(`link[href="${stylesheetHref}"]`)) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = stylesheetHref;
    document.head.append(stylesheet);
  }
  const link = document.createElement('a');
  link.className = 'be-home-access';
  link.href = '/';
  link.setAttribute('aria-label', 'Voltar ao início do Bem Esportivo');
  link.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7"></path><path d="M5 10v10h14V10"></path></svg><span>Início</span>';
  document.body.append(link);
}
