const arrowIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>';

export function initBackToTop() {
  let button = document.getElementById('topBtn') || document.getElementById('backToTop');
  if (!button) {
    button = document.createElement('button');
    button.id = 'topBtn';
    button.type = 'button';
    document.body.appendChild(button);
  }
  button.classList.add('be-back-to-top');
  button.setAttribute('aria-label', 'Voltar ao início da página');
  button.title = 'Voltar ao início';
  if (button.id === 'topBtn') button.innerHTML = arrowIcon;
  if (button.dataset.commonTopBound === 'true') return;
  button.dataset.commonTopBound = 'true';
  const update = () => button.classList.toggle('show', window.scrollY > 320);
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', update, { passive: true });
  update();
}
