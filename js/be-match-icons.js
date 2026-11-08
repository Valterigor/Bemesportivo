(() => {
  const icons = {
    cap: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 28c1-8 7-14 15-14 7 0 12 4 15 11-8-2-18-1-30 3Z" fill="#111"/><path d="M9 28c-4 1-5 5-1 6 8 2 18 0 29-4" fill="#080808"/><path d="M19 18c3-2 7-2 10 0" stroke="#aaa"/><path d="M31 25c2 0 4 0 6 1" stroke="#fa8a01"/></svg>',
    shoe: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c3 6 7 12 14 15l9 4c5 2 6 7 0 7H12c-5 0-7-4-4-8l7-8" fill="#b51f24"/><path d="M15 22c4 2 8 4 12 5" stroke="#ffb5a7"/><path d="M20 20l6 3M17 24l7 3M13 29l8 3" stroke="#fff"/><path d="M10 36h28" stroke="#ffd4c6" stroke-width="4"/></svg>'
  };
  const paint = () => { document.querySelectorAll('.tile-cap').forEach(tile => { tile.setAttribute('aria-label','Peça boné'); const svg=tile.querySelector('svg'); if(svg)svg.outerHTML=icons.cap; }); document.querySelectorAll('.tile-shoe').forEach(tile => { tile.setAttribute('aria-label','Peça tênis de corrida'); const svg=tile.querySelector('svg'); if(svg)svg.outerHTML=icons.shoe; }); };
  new MutationObserver(paint).observe(document.querySelector('#board'), { childList: true });
  paint();
})();
