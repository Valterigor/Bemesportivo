(() => {
  'use strict';

  const track = document.querySelector('.be-ecosystem-products');
  const hint = document.getElementById('be-products-scroll-hint');
  const dotsHost = hint?.querySelector('.be-products-scroll-dots');
  const items = track ? [...track.querySelectorAll('.be-ecosystem-product')] : [];
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!track || !hint || !dotsHost || items.length < 2) return;

  const dots = items.map((_, index) => {
    const dot = document.createElement('i');
    dot.className = 'be-products-scroll-dot';
    dot.dataset.index = String(index);
    dotsHost.appendChild(dot);
    return dot;
  });

  let activeIndex = 0;
  let autoplayTimer = 0;
  let resumeTimer = 0;
  let scrollFrame = 0;

  const canScroll = () => mobileQuery.matches && track.scrollWidth > track.clientWidth + 2;

  const update = () => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const progress = maxScroll ? track.scrollLeft / maxScroll : 0;
    activeIndex = Math.round(progress * (items.length - 1));
    dots.forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
    hint.hidden = !canScroll();
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = 0;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (!canScroll() || reducedMotionQuery.matches || document.hidden) return;
    autoplayTimer = window.setInterval(() => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const step = items[0].getBoundingClientRect().width;
      const nextLeft = track.scrollLeft >= maxScroll - 2 ? 0 : Math.min(maxScroll, track.scrollLeft + step);
      track.scrollTo({ left: nextLeft, behavior: 'smooth' });
    }, 5000);
  };

  const pauseForInteraction = () => {
    stopAutoplay();
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(startAutoplay, 12000);
  };

  track.addEventListener('scroll', () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(update);
  }, { passive: true });
  track.addEventListener('pointerdown', pauseForInteraction, { passive: true });
  track.addEventListener('wheel', pauseForInteraction, { passive: true });
  track.addEventListener('keydown', pauseForInteraction);
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);
  track.addEventListener('focusin', stopAutoplay);
  track.addEventListener('focusout', startAutoplay);

  const refresh = () => {
    update();
    startAutoplay();
  };

  mobileQuery.addEventListener?.('change', refresh);
  reducedMotionQuery.addEventListener?.('change', refresh);
  window.addEventListener('resize', refresh, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? stopAutoplay() : startAutoplay());

  update();
  startAutoplay();
})();
