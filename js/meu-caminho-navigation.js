(function initializeMeuCaminhoNavigation(global) {
  'use strict';

  const mapRequiredViews = new Set(['explorar']);
  const identityRequiredViews = new Set(['inicio', 'registrar', 'progresso', 'jornada', 'evolucao', 'explorar']);

  function isMapRequired(view) {
    return mapRequiredViews.has(String(view || ''));
  }

  function resolveRequestedView(view, { hasIdentity = false, hasJourney = false } = {}) {
    const requested = String(view || 'inicio');
    if (!hasIdentity && identityRequiredViews.has(requested)) {
      return { view: 'perfil', reason: 'profile', message: 'Primeiro, conclua seu Perfil Be para continuar.' };
    }
    if (hasIdentity && !hasJourney && isMapRequired(requested)) {
      return { view: 'jornada', reason: 'map', message: 'Prepare seu Mapa BeM para receber os próximos passos da jornada. Seu diário já está disponível.' };
    }
    return { view: requested, reason: '', message: '' };
  }

  function updateGates(buttons, { hasIdentity = false, hasJourney = false, minorRestricted = false } = {}) {
    const gateNote = document.getElementById('fb-map-gate-note');
    if (gateNote) {
      gateNote.textContent = !hasIdentity
        ? 'Conclua o Perfil Be para continuar.'
        : !hasJourney
          ? 'Você já pode registrar atividades e consultar sua história. Complete o Mapa BeM quando quiser orientação personalizada.'
          : 'Todas as etapas do seu caminho estão disponíveis.';
      gateNote.hidden = hasJourney || minorRestricted;
    }

    buttons.forEach(button => {
      const view = button.dataset.fbView;
      const gated = !minorRestricted && (!hasIdentity ? identityRequiredViews.has(view) : !hasJourney && isMapRequired(view));
      if (gated) {
        button.dataset.fbGated = 'true';
        button.setAttribute('aria-describedby', 'fb-map-gate-note');
        button.title = hasIdentity ? 'Conclua o Mapa BeM para abrir esta etapa.' : 'Conclua primeiro o Perfil Be.';
      } else {
        delete button.dataset.fbGated;
        button.removeAttribute('aria-describedby');
        button.removeAttribute('title');
      }
    });
  }

  global.MeuCaminhoNavigation = Object.freeze({ isMapRequired, resolveRequestedView, updateGates });
})(window);
