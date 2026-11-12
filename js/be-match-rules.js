(() => {
  const size = 8;
  const levels = [
    { moves: 24, target: 6, tutorial: 'Combine 4 peças para criar um raio esportivo.' },
    { moves: 25, target: 7, tutorial: 'Raios limpam uma linha inteira e alcançam relógios distantes.' },
    { moves: 26, target: 8, collect: { type: 'bottle', target: 6, label: 'garrafas' }, tutorial: 'Nova meta: combine garrafas enquanto captura os relógios.' },
    { moves: 28, target: 10, collect: { type: 'shoe', target: 7, label: 'tênis' }, tutorial: 'Formatos T ou L criam uma explosão 3×3.' },
    { moves: 29, target: 11, collect: { type: 'fruit', target: 8, label: 'frutas' }, tutorial: 'Combine 5 peças para criar o Poder BE cruzado.' },
    { moves: 30, target: 12, collect: { type: 'bottle', target: 9, label: 'garrafas' }, tutorial: 'Combine dois poderes para ampliar o efeito.' },
    { moves: 32, target: 14, collect: { type: 'cap', target: 10, label: 'bolas' }, tutorial: 'Planeje cascatas para cumprir as duas metas juntas.' },
    { moves: 34, target: 16, collect: { type: 'shoe', target: 12, label: 'tênis' }, tutorial: 'Desafio final: use poderes e cascatas com estratégia.' }
  ];
  const levelConfig = level => levels[Math.max(0, Math.min(levels.length - 1, level - 1))];
  const powerGuide = Object.freeze([
    { trigger: '4 peças em linha', name: 'Raio', effect: 'limpa uma linha ou coluna inteira' },
    { trigger: 'formato T ou L', name: 'Explosão', effect: 'limpa uma área 3×3' },
    { trigger: '5 ou mais peças em linha', name: 'Poder BE cruzado', effect: 'limpa a linha e a coluna' }
  ]);

  const powerForGroups = groups => {
    const regularGroups = groups.filter(group => group.length >= 3);
    if (regularGroups.some(group => group.length >= 5)) return 'cross';
    const membership = new Map();
    regularGroups.forEach(group => group.forEach(index => membership.set(index, (membership.get(index) || 0) + 1)));
    if ([...membership.values()].some(count => count > 1)) return 'burst';
    const four = regularGroups.find(group => group.length === 4);
    if (!four) return null;
    return Math.floor(four[0] / size) === Math.floor(four[1] / size) ? 'row' : 'column';
  };

  const affectedByPower = (index, kind) => {
    const x = index % size;
    const y = Math.floor(index / size);
    const affected = new Set();
    if (kind === 'row' || kind === 'cross') for (let column = 0; column < size; column += 1) affected.add(y * size + column);
    if (kind === 'column' || kind === 'cross') for (let row = 0; row < size; row += 1) affected.add(row * size + x);
    if (kind === 'burst') {
      for (let row = Math.max(0, y - 1); row <= Math.min(size - 1, y + 1); row += 1) {
        for (let column = Math.max(0, x - 1); column <= Math.min(size - 1, x + 1); column += 1) affected.add(row * size + column);
      }
    }
    return [...affected];
  };

  const scoreForClear = (count, chain, createdPower, activatedPower) => {
    const matchBonus = createdPower === 'cross' ? 180 : createdPower === 'burst' ? 130 : createdPower ? 80 : 30;
    const powerBonus = activatedPower ? 120 : 0;
    return Math.round((count * 10 + matchBonus + powerBonus) * (1 + Math.max(0, chain - 1) * .5));
  };

  window.BeMatchRules = { powerForGroups, affectedByPower, scoreForClear, levelConfig, powerGuide };
})();
