(() => {
  'use strict';
  const filters = document.querySelector('.feed-filters');
  const cards = [...document.querySelectorAll('[data-feed-category]')];
  const status = document.getElementById('feed-status');
  if (filters && cards.length) {
    filters.hidden = false;
    filters.addEventListener('click', event => {
      const button = event.target.closest('[data-feed-filter]');
      if (!button) return;
      const filter = button.dataset.feedFilter;
      filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.feedCategory !== filter; });
      const count = cards.filter(card => !card.hidden).length;
      if (status) status.textContent = `${count} ${count === 1 ? 'conteúdo disponível' : 'conteúdos disponíveis'} em ${button.textContent}.`;
    });
  }
  const top = document.getElementById('topBtn');
  if (top) {
    const update = () => { top.hidden = window.scrollY < 600; };
    window.addEventListener('scroll', update, { passive: true });
    update();
    top.addEventListener('click', () => {
      document.getElementById('main-content')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
})();
