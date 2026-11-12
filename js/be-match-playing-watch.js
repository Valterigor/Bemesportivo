(() => {
  const start = document.querySelector('#start-sheet');
  const tactical = document.querySelector('#tactical-sheet');
  const sync = () => {
    const isPlaying = Boolean(start?.hidden && tactical?.hidden);
    document.body.classList.toggle('game-playing', isPlaying);
  };
  sync();
  setInterval(sync, 250);
  window.addEventListener('be-match:enter-game', sync);
  window.addEventListener('be-match:tactical-open', sync);
  window.addEventListener('be-match:return-menu', sync);
})();
