/**
 * Componente: Botão Voltar ao Topo
 * Mostra/oculta botão ao rolar página
 */

import { DOM } from '../utils/dom.js';

export const ScrollToTop = {
  init() {
    const button = DOM.get('#voltar-topo');
    if (!button) return;

    // Mostrar/ocultar botão ao rolar
    window.addEventListener('scroll', () => {
      if (window.scrollY > 200) {
        DOM.show(button);
      } else {
        DOM.hide(button);
      }
    });

    // Clique para voltar ao topo
    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
};

export default ScrollToTop;
