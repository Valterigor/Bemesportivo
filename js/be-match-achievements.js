(() => {
  const board = document.querySelector('#board');
  if (!board) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const milestones = [500, 1000, 2000, 3000, 5000];
  const nextGoal = score => milestones.find(value => value > score) || (Math.floor(score / 2500) + 1) * 2500;
  const format = value => value.toLocaleString('pt-BR');
  const goal = document.createElement('div');
  goal.className = 'match-score-goal';
  const goalText = document.createElement('span');
  const meter = document.createElement('span');
  meter.className = 'match-score-meter';
  const fill = document.createElement('i');
  meter.append(fill);
  goal.append(goalText, meter);
  board.before(goal);
  const layer = document.createElement('div');
  layer.className = 'match-achievement-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const notice = document.createElement('div');
  notice.className = 'match-achievement-notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  document.body.append(notice);
  let target = 500, baseline = 0, lastScore = 0, timer;
  const updateGoal = score => {
    goalText.textContent = `Próximo marco: ${format(target)} pontos · ${format(score)}/${format(target)}`;
    fill.style.width = `${Math.min(100, Math.max(0, (score-baseline)/(target-baseline)*100))}%`;
  };
  const reset = () => {
    clearTimeout(timer);
    target = 500; baseline = 0; lastScore = 0;
    notice.classList.remove('is-visible');
    notice.textContent = '';
    layer.replaceChildren();
    updateGoal(0);
  };
  const celebrate = (text, tier, milestone) => {
    clearTimeout(timer);
    const rect = board.getBoundingClientRect();
    const x = rect.left + rect.width/2, y = rect.top + 28;
    notice.textContent = text;
    notice.dataset.tier = String(tier);
    notice.style.left = `${x}px`;
    notice.style.top = `${Math.max(8, rect.top - 14)}px`;
    notice.classList.add('is-visible');
    timer = setTimeout(() => notice.classList.remove('is-visible'), milestone ? 1500 : 950);
    if (reduced.matches || document.hidden) return;
    // Bound the number of transient elements even during long cascades.
    layer.replaceChildren();
    const halo = document.createElement('i');
    halo.className = 'achievement-halo';
    halo.style.left = `${x}px`; halo.style.top = `${y}px`;
    layer.append(halo);
    const haloAnimation = halo.animate([
      {transform:'translate(-50%, -50%) scale(.3)', opacity:.85},
      {transform:`translate(-50%, -50%) scale(${milestone ? 2 : 1.4})`, opacity:0}
    ], {duration:550, easing:'ease-out'});
    haloAnimation.onfinish = () => halo.remove();
    setTimeout(() => halo.remove(), 900);
    notice.getAnimations().forEach(animation => animation.cancel());
    notice.animate([
      {transform:'translate(-50%,-100%) scale(.85)'},
      {transform:'translate(-50%,-100%) scale(1.06)', offset:.45},
      {transform:'translate(-50%,-100%) scale(1)'}
    ], {duration:280, easing:'ease-out'});
    for (let i = 0; i < (milestone ? 32 : 12 + tier*4); i++) {
      const spark = document.createElement('i');
      spark.className = milestone ? 'achievement-confetti' : 'achievement-spark';
      spark.style.left = `${x}px`; spark.style.top = `${y}px`;
      spark.style.background = ['#ffdf75', '#a5f7ff', '#ff9eef'][i%3];
      layer.append(spark);
      const angle = i * 2.39996;
      const dx = Math.cos(angle) * Math.min(rect.width*.46, 70+tier*22);
      const dy = Math.sin(angle) * 90;
      const animation = spark.animate([
        {transform:'translate(-50%, -50%) scale(.2)', opacity:0},
        {transform:`translate(${dx*.6}px, ${dy-25}px) scale(1) rotate(90deg)`, opacity:1, offset:.35},
        {transform:`translate(${dx}px, ${dy+65}px) scale(.3) rotate(230deg)`, opacity:0}
      ], {duration:milestone ? 700 : 480, delay:i*6, fill:'both', easing:'ease-out'});
      animation.onfinish = () => spark.remove();
      animation.oncancel = () => spark.remove();
      setTimeout(() => spark.remove(), 1000);
    }
  };
  board.addEventListener('be-match:phase-reset', reset);
  board.addEventListener('be-match:points', ({detail}) => {
    if (!Number.isFinite(detail?.total) || detail.total < lastScore) return;
    const score = detail.total;
    const chain = Number(detail.chain) || 1;
    const tier = Math.min(3, Math.max(1, chain-1));
    const combo = chain >= 4 ? `Combo épico · ${chain} em sequência!` : chain === 3 ? 'Supercombo · 3 em sequência!' : chain === 2 ? 'Combo · 2 em sequência!' : '';
    if (score >= target) {
      const reached = [...milestones, Math.floor(score/2500)*2500].filter(value => value <= score && value >= target);
      baseline = Math.max(...reached);
      target = nextGoal(score);
      celebrate(`${format(baseline)} pontos! Meta alcançada!${combo ? ` ${combo}` : ''}`, 3, true);
    } else if (combo) celebrate(combo, tier, false);
    lastScore = score;
    updateGoal(score);
  });
  reset();
})();
