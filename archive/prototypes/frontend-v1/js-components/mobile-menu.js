/**
 * Componente: Menu Responsivo
 * Abre/fecha menu em dispositivos móveis
 */

import { DOM } from '../utils/dom.js';

export const MobileMenu = {
  init() {
    const toggle = DOM.get('#menu-toggle');
    const nav = DOM.get('nav');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      DOM.toggleClass(nav, 'show');
    });

    // Fechar menu ao clicar em link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        DOM.removeClass(nav, 'show');
      });
    });
  }
};

export default MobileMenu;
