(() => {
  const board = document.querySelector('#board');
  const score = document.querySelector('#score');
  if (!board || !score) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'score-flight-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  let pulse;
  const animate = (element, frames, options) => {
    const animation = element.animate(frames, options);
    const cleanup = () => element.remove();
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
    setTimeout(cleanup, 900);
  };
  const lightBurst = (tiles, intensity) => {
    if (!tiles.length || layer.childElementCount > 24) return;
    const rects = tiles.map(tile => tile.getBoundingClientRect());
    const left = Math.min(...rects.map(r => r.left)), right = Math.max(...rects.map(r => r.right));
    const top = Math.min(...rects.map(r => r.top)), bottom = Math.max(...rects.map(r => r.bottom));
    const x = (left + right) / 2, y = (top + bottom) / 2;
    const width = right - left, height = bottom - top;
    const make = (className, px = x, py = y) => {
      const el = document.createElement('i');
      el.className = className;
      el.style.left = `${px}px`;
      el.style.top = `${py}px`;
      layer.append(el);
      return el;
    };
    // Keep light inside the cleared area so it does not imply extra pieces were hit.
    for (const vertical of [false, true]) {
      const beam = make(`match-light-beam${vertical ? ' is-vertical' : ''}`);
      beam.style.width = `${vertical ? 20 + intensity*4 : width + 28}px`;
      beam.style.height = `${vertical ? height + 28 : 20 + intensity*4}px`;
      animate(beam, [
        {transform:`translate(-50%, -50%) scale(${vertical ? '1,.15' : '.15,1'})`, opacity:0},
        {transform:'translate(-50%, -50%) scale(1)', opacity:1, offset:.23},
        {transform:`translate(-50%, -50%) scale(${vertical ? '.3,1.05' : '1.05,.3'})`, opacity:0}
      ], {duration:380, easing:'ease-out'});
    }
    const core = make('match-light-core');
    core.style.width = core.style.height = `${80 + intensity*18}px`;
    animate(core, [
      {transform:'translate(-50%, -50%) scale(.3)', opacity:0},
      {transform:'translate(-50%, -50%) scale(1)', opacity:1, offset:.25},
      {transform:'translate(-50%, -50%) scale(1.5)', opacity:0}
    ], {duration:300});
    for (let ring = 0; ring < (intensity === 4 ? 2 : 1); ring++) {
      const wave = make('match-light-wave');
      wave.style.width = `${Math.min(width + 36, 200)}px`;
      wave.style.height = `${Math.min(height + 36, 200)}px`;
      animate(wave, [
        {transform:'translate(-50%, -50%) scale(.25)', opacity:.9},
        {transform:'translate(-50%, -50%) scale(1.35)', opacity:0}
      ], {duration:420, delay:ring*70, fill:'both', easing:'ease-out'});
    }
    const count = 12 + intensity*3;
    for (let i = 0; i < count; i++) {
      const angle = i * Math.PI * 2 / count;
      const spark = make('match-light-star', x + Math.cos(angle)*width*.3, y + Math.sin(angle)*height*.3);
      spark.style.color = ['#fff3a0', '#ff97fa', '#8feaff'][i%3];
      animate(spark, [
        {transform:'translate(-50%, -50%) scale(.2) rotate(0deg)', opacity:0},
        {transform:'translate(-50%, -50%) scale(1) rotate(45deg)', opacity:1, offset:.25},
        {transform:`translate(calc(-50% + ${Math.cos(angle)*(30+intensity*8)}px), calc(-50% + ${Math.sin(angle)*(30+intensity*8)}px)) scale(.2) rotate(100deg)`, opacity:0}
      ], {duration:380, delay:i*9, fill:'both'});
    }
  };
  board.addEventListener('be-match:points', ({detail}) => {
    if (document.hidden || !detail?.indices?.length) return;
    const target = score.getBoundingClientRect();
    const tx = target.left + target.width / 2;
    const ty = target.top + target.height / 2;
    clearTimeout(pulse);
    pulse = setTimeout(() => {
      score.animate(reducedMotion.matches ? [{opacity:.65}, {opacity:1}] : [
        {transform:'scale(1)', color:'#fff'},
        {transform:'scale(1.3)', color:'#ffe76b', offset:.4},
        {transform:'scale(1)', color:'#fff'}
      ], {duration:220});
    }, reducedMotion.matches ? 0 : 440);
    if (reducedMotion.matches) return;
    const tiles = detail.indices.map(index => board.querySelector(`[data-index="${index}"]`)).filter(Boolean);
    const intensity = detail.power ? 4 : Math.min(3, Math.max(1, Number(detail.chain) || 1));
    lightBurst(tiles, intensity);
    tiles.slice(0, 16).forEach((tile, i) => {
      if (layer.childElementCount >= 60) return;
      const rect = tile.getBoundingClientRect();
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      const particle = document.createElement('span');
      particle.className = 'score-flight-piece';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--trail-angle', `${Math.atan2(ty-y, tx-x)*180/Math.PI + 90}deg`);
      const icon = tile.querySelector('svg');
      if (icon) particle.append(icon.cloneNode(true));
      layer.append(particle);
      const dx = tx - x, dy = ty - y;
      animate(particle, [
        {transform:'translate(-50%, -50%) scale(1)', opacity:1},
        {transform:`translate(calc(-50% + ${dx*.25 + (i%2 ? 22 : -22)}px), calc(-50% + ${dy*.45}px)) scale(.8)`, opacity:1, offset:.38},
        {transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.12)`, opacity:0}
      ], {duration:440, delay:i*8, easing:'cubic-bezier(.2,.65,.45,1)', fill:'both'});
      const flash = document.createElement('span');
      flash.className = 'score-flight-flash';
      flash.style.left = `${x}px`;
      flash.style.top = `${y}px`;
      layer.append(flash);
      animate(flash, [
        {transform:'translate(-50%, -50%) scale(.4)', opacity:.9},
        {transform:'translate(-50%, -50%) scale(1.8)', opacity:0}
      ], {duration:220, easing:'ease-out'});
    });
    if (layer.childElementCount < 62) {
      const bonus = document.createElement('span');
      bonus.className = 'score-flight-bonus';
      bonus.textContent = `+${detail.points}`;
      bonus.style.left = `${tx}px`;
      bonus.style.top = `${ty - 20}px`;
      layer.append(bonus);
      animate(bonus, [{transform:'translate(-50%, 6px)', opacity:0},
        {transform:'translate(-50%, -2px)', opacity:1, offset:.3},
        {transform:'translate(-50%, -18px)', opacity:0}],
      {duration:480, delay:220, fill:'both'});
    }
  });
  board.addEventListener('be-match:phase-reset', () => {
    clearTimeout(pulse);
    layer.getAnimations({subtree:true}).forEach(animation => animation.cancel());
    layer.replaceChildren();
  });
})();
