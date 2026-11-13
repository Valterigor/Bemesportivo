(() => {
  const localStorage = window.BeMatchStorage;
  const board = document.querySelector('#board');
  const settings = document.querySelector('#feedback-settings');
  const settingsToggles = [...document.querySelectorAll('#feedback-settings-toggle,#feedback-game-toggle')];
  const effectsButton = document.querySelector('[data-feedback-control="effects"]');
  const musicButton = document.querySelector('[data-feedback-control="music"]');
  const vibrationButton = document.querySelector('[data-feedback-control="vibration"]');
  const soundToggle = document.querySelector('#sound-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!board) return;

  const effectEnabled = () => localStorage.getItem('be-match-sound') !== 'off';
  const musicEnabled = () => localStorage.getItem('be-match-music') === 'on';
  const vibrationSupported = typeof navigator.vibrate === 'function';
  const vibrationEnabled = () => vibrationSupported && localStorage.getItem('be-match-vibration') !== 'off';
  const syncControls = () => {
    if (effectsButton) { effectsButton.textContent = `Efeitos: ${effectEnabled() ? 'ligados' : 'desligados'}`; effectsButton.setAttribute('aria-pressed', String(effectEnabled())); }
    if (musicButton) { musicButton.textContent = `Música: ${musicEnabled() ? 'ligada' : 'desligada'}`; musicButton.setAttribute('aria-pressed', String(musicEnabled())); }
    if (vibrationButton) {
      vibrationButton.textContent = vibrationSupported ? `Vibração: ${vibrationEnabled() ? 'ligada' : 'desligada'}` : 'Vibração: indisponível';
      vibrationButton.disabled = !vibrationSupported;
      vibrationButton.setAttribute('aria-pressed', String(vibrationEnabled()));
    }
  };
  const closeSettings = () => { if (settings) settings.hidden = true; settingsToggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'false')); };
  settingsToggles.forEach(toggle => toggle.addEventListener('click', event => {
    event.stopPropagation();
    settings.hidden = !settings.hidden;
    settingsToggles.forEach(button => button.setAttribute('aria-expanded', String(!settings.hidden)));
    if (!settings.hidden) settings.querySelector('button:not(:disabled)')?.focus();
  }));
  document.addEventListener('click', event => { if (!event.target.closest('.feedback-settings') && !event.target.closest('#feedback-settings-toggle,#feedback-game-toggle,#sound-toggle')) closeSettings(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeSettings(); });
  effectsButton?.addEventListener('click', () => soundToggle?.click());
  musicButton?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('be-match:music-setting', { detail: { enabled: !musicEnabled() } })));
  vibrationButton?.addEventListener('click', () => { localStorage.setItem('be-match-vibration', vibrationEnabled() ? 'off' : 'on'); syncControls(); if (vibrationEnabled()) navigator.vibrate(18); });
  window.addEventListener('be-match:effects-setting', syncControls);
  window.addEventListener('be-match:music-state', syncControls);

  const vibrate = pattern => { if (vibrationEnabled() && !document.hidden) navigator.vibrate(pattern); };
  board.addEventListener('be-match:points', event => {
    const detail = event.detail || {};
    if (detail.power) vibrate([18, 24, 26]);
    else if ((detail.chain || 1) >= 3) vibrate([12, 20, 16]);
    else if (detail.captured || detail.collected) vibrate(12);
  });
  board.addEventListener('be-match:power-combo', () => vibrate([24, 30, 38]));
  window.addEventListener('be-match-win', () => vibrate([16, 30, 20]));
  window.addEventListener('be-match:round-complete', () => vibrate([20, 35, 24, 35, 42]));

  const comboLayer = document.createElement('div');
  comboLayer.className = 'power-combo-layer';
  comboLayer.setAttribute('aria-hidden', 'true');
  document.body.append(comboLayer);
  board.addEventListener('be-match:power-combo', event => {
    if (reduced.matches || document.hidden) return;
    comboLayer.replaceChildren();
    const { first, second, index } = event.detail || {};
    const tile = board.querySelector(`[data-index="${index}"]`);
    if (!tile) return;
    const rect = tile.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const impact = first === 'burst' || second === 'burst';
    const storm = first === 'cross' || second === 'cross';
    const choreography = document.createElement('div');
    choreography.className = `power-combo-choreo ${impact ? 'is-impact' : ''} ${storm ? 'is-storm' : ''}`;
    choreography.style.left = `${x}px`; choreography.style.top = `${y}px`;
    choreography.innerHTML = '<i class="combo-beam combo-beam-x"></i><i class="combo-beam combo-beam-y"></i><i class="combo-impact"></i><strong></strong>';
    choreography.querySelector('strong').textContent = storm ? 'TEMPESTADE BE!' : impact ? 'IMPACTO BE!' : 'DUPLO PODER!';
    comboLayer.append(choreography);
    setTimeout(() => choreography.remove(), 850);
  });

  const stars = document.querySelector('#result-stars');
  window.addEventListener('be-match-win', event => {
    if (!stars) return;
    const count = Math.max(1, Math.min(3, Number(event.detail?.stars) || 1));
    stars.replaceChildren(...Array.from({ length: 3 }, (_, index) => {
      const star = document.createElement('span');
      star.textContent = index < count ? '★' : '☆';
      star.style.setProperty('--star-delay', `${index * 120}ms`);
      return star;
    }));
    stars.setAttribute('aria-label', `${count} de 3 estrelas conquistadas`);
  });
  syncControls();
})();
