(() => {
  const scenes = [
    ['Parque da largada', '#75e0ac', '#123d35'],
    ['Praia em movimento', '#75ddeb', '#123e55'],
    ['Quadra urbana', '#ffba75', '#412d48'],
    ['Trilha da serra', '#b4db8c', '#243c36'],
    ['Velódromo ao pôr do sol', '#ff9fbd', '#482e50'],
    ['Arena de inverno', '#b5e5ff', '#243959'],
    ['Estádio das estrelas', '#b9a0ff', '#28234f'],
    ['Arena dos campeões', '#ffdb83', '#493a25']
  ];
  window.BeMatchScenes = {
    apply(level) {
      const index = Math.max(0, Math.min(scenes.length - 1, level - 1));
      const [name, accent, surface] = scenes[index];
      document.body.dataset.matchScene = String(index + 1);
      document.body.style.setProperty('--scene-image', `url('/img/be-match/scenes/phase-${index + 1}.svg')`);
      document.body.style.setProperty('--scene-accent', accent);
      document.body.style.setProperty('--scene-surface', surface);
      const label = document.querySelector('#scene-name');
      if (label) label.textContent = name;
      document.querySelector('#board').setAttribute('aria-label', `Tabuleiro BE Match · ${name}`);
    }
  };
})();
