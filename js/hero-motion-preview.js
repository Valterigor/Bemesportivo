(() => {
  if (new URLSearchParams(location.search).get('hero') !== 'remotion') return;
  const media = document.querySelector('.home-hero-media');
  const picture = media?.querySelector('picture');
  if (!media || !picture) return;

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/css/hero-motion-preview.css';
  document.head.append(style);

  const video = document.createElement('video');
  video.className = 'hero-motion-preview-video';
  video.src = '/videos/hero-remotion-preview.mp4';
  video.poster = '/img/fala-bem-hero-pessoas-optimized.jpg';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-hidden', 'true');
  media.append(video);

  const toolbar = document.createElement('div');
  toolbar.className = 'hero-motion-preview-toolbar';
  toolbar.setAttribute('aria-label', 'Controles da prévia de movimento');
  toolbar.innerHTML = '<span>Prévia de movimento</span><button type="button" data-motion-play>Pausar</button><button type="button" data-motion-original aria-pressed="false">Comparar com foto</button><a href="/">Fechar prévia</a>';
  document.body.append(toolbar);
  const play = toolbar.querySelector('[data-motion-play]');
  const original = toolbar.querySelector('[data-motion-original]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let wantsPlay = !reduced.matches;
  let showOriginal = false;
  let visible = true;

  function update() {
    video.hidden = showOriginal;
    original.setAttribute('aria-pressed', String(showOriginal));
    original.textContent = showOriginal ? 'Ver movimento' : 'Comparar com foto';
    play.disabled = showOriginal;
    play.textContent = wantsPlay ? 'Pausar' : 'Reproduzir';
    if (wantsPlay && !showOriginal && visible && !document.hidden) {
      video.play().catch(() => { wantsPlay = false; play.textContent = 'Reproduzir'; });
    } else video.pause();
  }
  play.addEventListener('click', () => { wantsPlay = !wantsPlay; update(); });
  original.addEventListener('click', () => { showOriginal = !showOriginal; update(); });
  reduced.addEventListener('change', () => { if (reduced.matches) wantsPlay = false; update(); });
  document.addEventListener('visibilitychange', update);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(media);
  video.addEventListener('error', () => {
    showOriginal = true;
    wantsPlay = false;
    update();
    toolbar.querySelector('span').textContent = 'Vídeo indisponível; exibindo foto';
    original.disabled = true;
  });
  update();
})();
