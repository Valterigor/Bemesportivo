/**
 * Componente: Animações ao Rolar
 * Usa Intersection Observer para triggers
 */

export const ScrollAnimations = {
  init() {
    // Elemento para observar (.animate-on-scroll)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Observar todos os elementos com classe
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }
};

export default ScrollAnimations;
