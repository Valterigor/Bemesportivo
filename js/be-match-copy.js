(() => {
  const rules = window.BeMatchRules;
  const message = document.querySelector('#game-message');
  const goal = document.querySelector('#goal');
  const guide = document.querySelector('.game-guide p:not(.kicker)');
  const guideDetail = document.querySelector('.game-guide small');
  const powerGuide = document.querySelector('.power-guide');
  const summary = rules?.powerGuide || [];
  if (message) message.textContent = 'Combine 3 ou mais. Trocas sem combinação voltam ao lugar e não gastam movimentos.';
  if (guide) guide.innerHTML = 'Deslize para formar <strong>3 ou mais peças</strong>. Apenas combinações válidas gastam um movimento.';
  if (guideDetail && summary.length) guideDetail.textContent = summary.map(item => `${item.trigger}: ${item.name}, que ${item.effect}`).join('; ') + '.';
  if (goal) {
    const note = goal.parentElement?.querySelector('small');
    if (note && summary.length) note.textContent = summary.map(item => `${item.name}: ${item.effect}`).join(' · ') + '.';
  }
  if (powerGuide && summary.length) {
    powerGuide.replaceChildren(...summary.map(item => {
      const entry = document.createElement('span');
      const trigger = document.createElement('b');
      trigger.textContent = item.trigger.replace(' peças em linha', '').replace('formato ', '');
      entry.append(trigger, item.name);
      return entry;
    }));
  }
})();
