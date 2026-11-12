(() => {
  const board = document.querySelector('#board');
  const message = document.querySelector('#game-message');
  const continueButton = document.querySelector('#continue-game');
  if (!board || !message) return;

  message.classList.add('coach-message');
  let phraseIndex = 0;
  const regularPhrases = [
    'Boa leitura! Agora procure a próxima abertura.',
    'Bom movimento. Mantenha o ritmo e mire nos objetivos.',
    'Execução limpa! Prepare a próxima combinação.'
  ];
  const speak = text => {
    message.textContent = text;
    message.classList.remove('coach-speaking');
    void message.offsetWidth;
    message.classList.add('coach-speaking');
  };

  continueButton?.addEventListener('click', () => {
    const level = document.querySelector('#level')?.textContent || '1';
    speak(`Treino da fase ${level}: observe o tabuleiro antes do primeiro movimento.`);
  });

  board.addEventListener('be-match:points', ({ detail }) => {
    if (detail.power) speak('Potência máxima! Aproveite o espaço aberto no tabuleiro.');
    else if (detail.chain >= 4) speak('Sequência de campeão! Continue lendo as quedas das peças.');
    else if (detail.chain === 3) speak('Excelente cascata! Você antecipou muito bem o tabuleiro.');
    else if (detail.chain === 2) speak('Ótima sequência! Procure manter o combo vivo.');
    else if (detail.bonus === 'cross') speak('Poder BE criado! Guarde-o para alcançar vários objetivos.');
    else if (detail.bonus === 'burst') speak('Explosão criada! Ative perto da maior concentração de alvos.');
    else if (detail.bonus === 'row' || detail.bonus === 'column') speak('Raio criado! Alinhe-o com os relógios.');
    else {
      speak(regularPhrases[phraseIndex % regularPhrases.length]);
      phraseIndex += 1;
    }
  });

  board.addEventListener('be-match:phase-reset', () => {
    phraseIndex = 0;
    setTimeout(() => speak('Respire, observe e execute. Cada movimento deve aproximar você da meta.'), 120);
  });

  window.addEventListener('be-match-win', ({ detail }) => {
    const praise = detail.stars === 3 ? 'Treino perfeito!' : detail.stars === 2 ? 'Ótimo treino!' : 'Missão cumprida!';
    speak(`${praise} Você concluiu a fase com ${detail.stars} estrela${detail.stars === 1 ? '' : 's'}.`);
  });
})();
