(() => {
  const clock = '<svg viewBox="0 0 48 48" fill="none" stroke="#1b1b1b" stroke-width="3" stroke-linecap="round"><rect x="13" y="12" width="22" height="24" rx="8"/><path d="M20 6h8M20 42h8M24 18v7l5 3"/></svg>';
  const paint = () => document.querySelectorAll('.tile-watch').forEach(tile => { tile.setAttribute('aria-label','Relógio a capturar'); const icon=tile.querySelector('svg'); if(icon)icon.outerHTML=clock; });
  new MutationObserver(paint).observe(document.querySelector('#board'), { childList: true }); paint();
})();
