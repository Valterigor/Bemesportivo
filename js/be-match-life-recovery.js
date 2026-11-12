(() => {
  const label = document.querySelector('#life-recovery');
  if (!label) return;
  const tick = () => {
    const stored = Number(localStorage.getItem('be-match-lives'));
    const lives = Number.isFinite(stored) ? Math.max(0, Math.min(5, stored)) : 5;
    const stamp = Number(localStorage.getItem('be-match-life-timestamp') || 0);
    if (lives >= 5 || !stamp) { label.hidden = true; return; }
    const left = Math.max(0, 1800000 - (Date.now() - stamp));
    const minutes = String(Math.floor(left / 60000)).padStart(2, '0');
    const seconds = String(Math.floor(left % 60000 / 1000)).padStart(2, '0');
    label.hidden = false;
    label.querySelector('strong').textContent = `${minutes}:${seconds}`;
  };
  tick();
  setInterval(tick, 1000);
  window.addEventListener('be-match-loss', tick);
  window.addEventListener('be-match:life-recovered', tick);
})();
