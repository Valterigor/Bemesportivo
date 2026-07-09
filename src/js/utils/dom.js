/**
 * Utilitários para manipulação de DOM
 * Funções auxiliares reutilizáveis
 */

export const DOM = {
  // Buscar elemento
  get: (selector) => document.querySelector(selector),
  
  // Buscar múltiplos elementos
  getAll: (selector) => document.querySelectorAll(selector),
  
  // Verificar se elemento existe
  exists: (selector) => document.querySelector(selector) !== null,
  
  // Adicionar classe
  addClass: (el, className) => el?.classList.add(className),
  
  // Remover classe
  removeClass: (el, className) => el?.classList.remove(className),
  
  // Toggle classe
  toggleClass: (el, className) => el?.classList.toggle(className),
  
  // Atribuir atributos
  setAttr: (el, attr, value) => el?.setAttribute(attr, value),
  
  // Pegar atributo
  getAttr: (el, attr) => el?.getAttribute(attr),
  
  // Show/Hide
  show: (el) => el && (el.style.display = 'block'),
  hide: (el) => el && (el.style.display = 'none'),
  
  // Adicionar event listener
  on: (el, event, callback) => el?.addEventListener(event, callback),
  
  // Remover event listener
  off: (el, event, callback) => el?.removeEventListener(event, callback)
};

export default DOM;
