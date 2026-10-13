const assert = require('node:assert/strict');
const { sanitize, progress } = require('../../js/be-diary-goals.js');
const goal = { id: 'goal-1', objective: 'consistency', metric: 'days', sport: 'all', target: 2, start: '2026-10-01', end: '2026-10-07' };
const entries = [
  { id: 'a', date: '2026-10-01', type: 'corrida', duration: 20 },
  { id: 'a', date: '2026-10-01', type: 'corrida', duration: 20 },
  { id: 'b', date: '2026-10-01', type: 'treino', duration: 30 },
  { id: 'c', date: '2026-10-03', type: 'corrida', duration: 15 },
  { id: 'future', date: '2026-10-06', type: 'corrida', duration: 15 },
  { id: 'old', date: '2026-09-30', type: 'corrida', duration: 90 }
];
assert.deepEqual(progress(goal, entries, [], '2026-10-03'), { value: 2, percent: 100, status: 'Alcançada' });
assert.equal(progress({ ...goal, metric: 'sessions', sport: 'corrida' }, entries, [], '2026-10-03').value, 2);
assert.equal(progress({ ...goal, metric: 'minutes' }, entries, [], '2026-10-03').value, 65);
assert.equal(progress(goal, entries.slice(0, 3), [], '2026-10-08').status, 'Prazo encerrado');
assert.equal(progress({ ...goal, paused: true }, entries, [], '2026-10-03').status, 'Pausada');
assert.equal(progress(goal, [], [], '2026-09-30').status, 'Planejada');
assert.equal(progress({ ...goal, metric: 'meals' }, [], [{ id: 'm1', type: 'lunch', date: '2026-10-01' }, { id: 'm2', type: 'dinner', date: '2026-10-01' }], '2026-10-03').value, 1);
assert.equal(sanitize([goal, goal]).length, 1);
for (const invalid of [{ target: -1 }, { target: 1.5 }, { end: '2026-09-30' }, { start: '2026-02-30' }, { metric: '__proto__' }, { id: '<script>' }]) assert.equal(sanitize([{ ...goal, ...invalid }]).length, 0);
assert.deepEqual(sanitize(null), []);
console.log('OK: cálculo de metas, datas, duplicatas, pausa e validação.');
