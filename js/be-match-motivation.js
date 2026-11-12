(() => {
  const phrases = {
    victory: [
      'Cada treino conta. Hoje você deu mais um passo!',
      'Foco na jogada, orgulho na conquista. Boa fase!',
      'Sua evolução acontece assim: um movimento de cada vez.',
      'Meta alcançada! Celebre o esforço que trouxe você até aqui.',
      'Você encontrou seu ritmo. Leve essa energia para o próximo desafio!',
      'Consistência se constrói na prática. Mais uma conquista para sua jornada!',
      'Estratégia e atenção fizeram a diferença. Mandou bem!',
      'Um desafio vencido, mais confiança para seguir em frente.'
    ],
    retry: [
      'Respire, ajuste a estratégia e volte no seu ritmo.',
      'Uma tentativa não define sua jornada. Cada treino ensina.',
      'Hoje foi aprendizado. O próximo movimento pode ser diferente.',
      'Evoluir também é perceber o que ajustar. Você segue no jogo!',
      'Faça uma pausa. Recuperar a energia também faz parte do treino.',
      'Nem todo treino termina em recorde. O aprendizado fica.',
      'Recomeçar é uma habilidade. Dê a si mesmo uma nova chance.',
      'Respeite seu ritmo e leve o aprendizado para a próxima tentativa.'
    ]
  };
  for (const [id, kind] of [['result-sheet', 'victory'], ['loss-sheet', 'retry']]) {
    const sheet = document.getElementById(id);
    if (!sheet) continue;
    const message = document.createElement('p');
    message.className = 'phase-motivation';
    message.setAttribute('role', 'status');
    sheet.querySelector('.primary-button').before(message);
    let remaining = [];
    let previous = '';
    let wasHidden = true;
    const update = () => {
      if (!sheet.hidden && wasHidden) {
        if (!remaining.length) remaining = [...phrases[kind]];
        const choices = remaining.filter(text => text !== previous);
        const phrase = choices[Math.floor(Math.random() * choices.length)];
        remaining.splice(remaining.indexOf(phrase), 1);
        message.textContent = phrase;
        previous = phrase;
      }
      wasHidden = sheet.hidden;
    };
    new MutationObserver(update).observe(sheet, {attributes:true, attributeFilter:['hidden']});
    update();
  }
})();
