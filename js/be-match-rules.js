(() => {
  const size = 8;
  const levels = [
    { moves: 24, target: 6, walls: [], tutorial: 'Combine 4 peças para criar um raio esportivo.' },
    { moves: 25, target: 7, walls: [27,28,35,36], tutorial: 'Novo campo: as barreiras centrais dividem as jogadas.' },
    { moves: 26, target: 8, walls: [18,21,42,45], collect: { type: 'bottle', target: 6, label: 'garrafas' }, tutorial: 'Use as laterais para contornar as quatro barreiras.' },
    { moves: 28, target: 10, walls: [11,12,19,20,43,44,51,52], collect: { type: 'shoe', target: 7, label: 'tênis' }, tutorial: 'Formatos T ou L criam uma explosão capaz de alcançar áreas separadas.' },
    { moves: 29, target: 11, walls: [24,31,32,39], collect: { type: 'fruit', target: 8, label: 'frutas' }, tutorial: 'Combine 5 peças para criar o Poder BE cruzado entre os corredores.' },
    { moves: 30, target: 12, walls: [10,13,26,29,34,37,50,53], collect: { type: 'bottle', target: 9, label: 'garrafas' }, tutorial: 'Combine dois poderes para romper o desenho em zigue-zague.' },
    { moves: 32, target: 14, walls: [17,22,25,30,33,38,41,46], collect: { type: 'cap', target: 10, label: 'bolas' }, tutorial: 'Planeje cascatas entre os portões laterais.' },
    { moves: 34, target: 16, walls: [9,14,18,21,42,45,49,54], collect: { type: 'shoe', target: 12, label: 'tênis' }, tutorial: 'Desafio final: supere a fortaleza com poderes e cascatas.' }
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
