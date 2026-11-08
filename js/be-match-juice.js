(() => {
  const juice = '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18h18l-2 22H17l-2-22Z"/><path d="M18 18c0-5 3-8 6-8s6 3 6 8M24 10V6M20 26h8M20 32h8"/></svg>';
  const paint = () => document.querySelectorAll('.tile-watch').forEach(tile => { tile.setAttribute('aria-label','Peça suco'); const icon = tile.querySelector('svg'); if (icon) icon.outerHTML = juice; });
  new MutationObserver(paint).observe(document.querySelector('#board'), { childList: true });
  paint();
})();
