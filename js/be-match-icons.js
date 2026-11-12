(() => {
  const icons = {
    cap: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="16"/><path d="m24 16 6 4-2 7h-8l-2-7 6-4Z"/><path d="m24 16-2-8M30 20l8-3M28 27l5 8M20 27l-5 8M18 20l-8-3"/></svg>',
    shoe: '<svg viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c3 6 7 12 14 15l9 4c5 2 6 7 0 7H12c-5 0-7-4-4-8l7-8" fill="#b51f24"/><path d="M15 22c4 2 8 4 12 5" stroke="#ffb5a7"/><path d="M20 20l6 3M17 24l7 3M13 29l8 3" stroke="#fff"/><path d="M10 36h28" stroke="#ffd4c6" stroke-width="4"/></svg>'
  };
  const paint = () => { document.querySelectorAll('.tile-cap').forEach(tile => { tile.setAttribute('aria-label','Peça bola'); const svg=tile.querySelector('svg'); if(svg)svg.outerHTML=icons.cap; }); document.querySelectorAll('.tile-shoe').forEach(tile => { tile.setAttribute('aria-label','Peça tênis de corrida'); const svg=tile.querySelector('svg'); if(svg)svg.outerHTML=icons.shoe; }); };
  new MutationObserver(paint).observe(document.querySelector('#board'), { childList: true });
  paint();
})();
