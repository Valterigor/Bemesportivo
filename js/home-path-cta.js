(() => {
  'use strict';

  const PROFILE_KEY = 'meuCaminhoBeProfileV1';
  const PENDING_KEY = 'meuCaminhoBePendingRegistrationV1';
  const cta = document.getElementById('be-home-path-cta');
  const label = document.getElementById('be-home-path-cta-label');
  if (!cta || !label) return;
  if (cta.dataset.homeCta === 'explore') return;

  let profile = null;
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch {}
  const hasIdentity = String(profile?.name || '').trim().length >= 2 && Boolean(profile?.identityCreatedAt || profile?.objective);


  if (hasIdentity) {
    label.textContent = 'Registrar minha atividade';
    cta.dataset.pathState = 'ready';
  } else {
    cta.dataset.pathState = 'profile';
  }

  cta.addEventListener('click', () => {
    if (hasIdentity) return;
    try { sessionStorage.setItem(PENDING_KEY, 'registrar'); } catch {}
  });
})();
