import assert from 'node:assert/strict';
import esbuild from 'esbuild';
import { summarizeAnalytics } from '../../server/analytics-core.mjs';

const built = await esbuild.build({ entryPoints: ['functions/api/analytics/events.js'], bundle: true, format: 'esm', write: false });
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const entries = new Map();
const store = {
  async put(key, value, options) { entries.set(key, { value: JSON.parse(value), metadata: options.metadata }); },
  async get(key) { return entries.get(key)?.value || null; },
  async list({ prefix, cursor = '0' }) {
    const all = [...entries].filter(([key]) => key.startsWith(prefix));
    const start = Number(cursor);
    return { keys: all.slice(start, start + 7).map(([name, entry]) => ({ name, metadata: entry.metadata })), cursor: String(start + 7), list_complete: start + 7 >= all.length };
  }
};
const responses = await Promise.all(Array.from({ length: 30 }, () => onRequest({
  env: { BE_DATA: store },
  request: new Request('https://bemesportivo.com/api/analytics/events', { method: 'POST', headers: { Origin: 'https://bemesportivo.com' }, body: JSON.stringify({ events: [{ name: 'page_view', page: '/' }, { name: 'search_submit', page: '/' }] }) })
})));
assert.ok(responses.every(response => response.status === 202));
assert.equal(entries.size, 30, 'Concurrent batches must keep distinct keys');
entries.set('analytics:legacy', { value: { createdAt: '2026-09-01T00:00:00Z', events: [{ name: 'page_view' }] } });
entries.set('analytics-summary:legacy', { value: { total: 999 } });
const summary = await summarizeAnalytics(store);
assert.equal(summary.total, 61);
assert.equal(summary.count, 31);
assert.equal(summary.complete, true);
assert.deepEqual(summary.byName, [{ name: 'page_view', count: 31 }, { name: 'search_submit', count: 30 }]);
assert.equal((await summarizeAnalytics(store, 1)).complete, false, 'Bounded reports must declare partial results');
console.log('Analytics aprovado: concorrência, paginação, legado e resultados parciais.');
