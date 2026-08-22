/**
 * Main.js - Inicializador de aplicação
 * Carrega e inicializa todos os módulos
 */

import ScrollToTop from './components/scroll-to-top.js';
import ReadMore from './components/read-more.js';
import MobileMenu from './components/mobile-menu.js';
import ScrollAnimations from './components/scroll-animations.js';

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  ScrollToTop.init();
  ReadMore.init();
  MobileMenu.init();
  ScrollAnimations.init();

  console.log('✓ Aplicação inicializada');
}
