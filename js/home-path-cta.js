(() => {
  'use strict';

  const PROFILE_KEY = 'meuCaminhoBeProfileV1';
  const PENDING_KEY = 'meuCaminhoBePendingRegistrationV1';
  const cta = document.getElementById('be-home-path-cta');
  const label = document.getElementById('be-home-path-cta-label');
  if (!cta || !label) return;

  let profile = null;
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch {}
  const hasIdentity = String(profile?.name || '').trim().length >= 2 && Boolean(profile?.identityCreatedAt || profile?.objective);
  const hasJourney = Boolean(profile?.objective);


  if (hasIdentity && hasJourney) {
    label.textContent = 'Registrar minha atividade';
    cta.dataset.pathState = 'ready';
  } else if (hasIdentity) {
    label.textContent = 'Continuar meu Caminho Be';
    cta.dataset.pathState = 'map';
  } else {
    cta.dataset.pathState = 'profile';
  }

  cta.addEventListener('click', () => {
    if (hasJourney) return;
    try { sessionStorage.setItem(PENDING_KEY, 'registrar'); } catch {}
  });
})();
