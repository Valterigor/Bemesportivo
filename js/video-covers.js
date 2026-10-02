'use strict';

// Only the matching videos receive a custom cover; article photography stays intact.
const reportVideoCovers = {
  gBkon6LC2OU: '/img/beplay-capas/tatico-v1.webp',
  Qi1lRW18kvM: '/img/beplay-capas/duda-v1.webp'
};

document.querySelectorAll('.video-container iframe').forEach(player => {
  const source = new URL(player.src);
  const id = source.pathname.split('/').pop();
  const cover = reportVideoCovers[id];
  if (!cover) return;

  const container = player.parentElement;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'be-video-cover';
  button.setAttribute('aria-label', `Reproduzir vídeo: ${player.title}`);
  const image = document.createElement('img');
  image.src = cover;
  image.alt = '';
  image.width = 1280;
  image.height = 720;
  image.loading = 'lazy';
  const label = document.createElement('span');
  label.className = 'be-video-cover-action';
  label.textContent = '▶ Assistir ao vídeo';
  button.append(image, label);
  container.classList.add('be-video-covered');
  player.hidden = true;
  container.append(button);

  button.addEventListener('click', () => {
    source.searchParams.set('autoplay', '1');
    player.src = source.href;
    player.hidden = false;
    button.remove();
    player.focus({ preventScroll: true });
  }, { once: true });
});
