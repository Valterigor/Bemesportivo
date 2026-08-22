/**
 * Componente: Leia Mais/Leia Menos
 * Expande/compacta conteúdo texto
 */

import { DOM } from '../utils/dom.js';

export const ReadMore = {
  init() {
    document.addEventListener('click', (e) => {
      if (!e.target.classList.contains('leia-mais')) return;

      const completo = e.target.previousElementSibling;
      if (!completo) return;

      DOM.toggleClass(completo, 'expandido');
      e.target.textContent = completo.classList.contains('expandido')
        ? 'Leia menos'
        : 'Leia mais';
    });
  }
};

export default ReadMore;
