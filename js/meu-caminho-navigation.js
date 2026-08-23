(function initializeMeuCaminhoNavigation(global) {
  'use strict';

  const mapRequiredViews = new Set(['registrar', 'progresso', 'evolucao', 'explorar']);

  function isMapRequired(view) {
    return mapRequiredViews.has(String(view || ''));
  }

  function resolveRequestedView(view, { hasIdentity = false, hasJourney = false } = {}) {
    const requested = String(view || 'inicio');
    if (!hasIdentity && requested !== 'perfil') {
      return { view: 'perfil', reason: 'profile', message: 'Primeiro, conclua seu Perfil Be para continuar.' };
    }
    if (hasIdentity && !hasJourney && isMapRequired(requested)) {
      return { view: 'jornada', reason: 'map', message: 'Conclua seu Mapa BeM para liberar Registrar e Jornada.' };
    }
    return { view: requested, reason: '', message: '' };
  }

  function updateGates(buttons, { hasIdentity = false, hasJourney = false, minorRestricted = false } = {}) {
    const gateNote = document.getElementById('fb-map-gate-note');
    if (gateNote) {
      gateNote.textContent = !hasIdentity
        ? 'Conclua o Perfil Be para continuar.'
        : !hasJourney
          ? 'Registrar e Jornada serão liberados após o Mapa BeM.'
          : 'Todas as etapas do seu caminho estão disponíveis.';
      gateNote.hidden = hasJourney || minorRestricted;
    }

    buttons.forEach(button => {
      const view = button.dataset.fbView;
      const gated = !minorRestricted && (!hasIdentity ? view !== 'perfil' : !hasJourney && isMapRequired(view));
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
