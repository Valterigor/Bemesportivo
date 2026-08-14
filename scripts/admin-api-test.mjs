import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const build = await esbuild.build({
  entryPoints: [path.resolve(currentDirectory, '../functions/api/admin/[[path]].js')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString('base64')}`;
const { onRequest } = await import(moduleUrl);

class MemoryKv {
  constructor(entries = {}) { this.entries = new Map(Object.entries(entries)); }
  async get(key, options = {}) {
    const value = this.entries.get(key);
    if (value === undefined) return null;
    return options?.type === 'json' ? JSON.parse(value) : value;
  }
  async put(key, value) { this.entries.set(key, value); }
  async delete(key) { this.entries.delete(key); }
  async list({ prefix = '', cursor } = {}) {
    const keys = [...this.entries.keys()].filter(key => key.startsWith(prefix)).sort();
    return { keys: keys.map(name => ({ name })), list_complete: true, cursor: cursor || '' };
  }
}

const token = 'admin-test-token-with-more-than-32-characters';
const comment = {
  id: 'comment-test-1',
  name: 'Pessoa de teste',
  text: 'Conteúdo aguardando análise.',
  createdAt: '2026-08-13T12:00:00.000Z',
  reports: ['hash-1'],
  replies: []
};
const store = new MemoryKv({
  'community:state': JSON.stringify({
    schemaVersion: 2,
    updatedAt: '2026-08-13T12:00:00.000Z',
    comments: { 'path:meu-caminho-be': [comment] }
  }),
  'game:ranking': JSON.stringify({ entries: [{ name: 'Atleta' }], updatedAt: '2026-08-13T12:00:00.000Z' }),
  'sync:test': '{}',
  'routine:install:test': '{}',
  'analytics:test': '{}'
});
const env = { BE_DATA: store, BE_ADMIN_TOKEN: token };

function call(path, { method = 'GET', body, suppliedToken = token, environment = env } = {}) {
  const headers = { Origin: 'https://bemesportivo.com' };
  if (suppliedToken) headers['X-BE-Admin-Token'] = suppliedToken;
  if (body) headers['Content-Type'] = 'application/json';
  return onRequest({
    request: new Request(`https://bemesportivo.com/api/admin/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    }),
    env: environment,
    params: { path: path.split('/') }
  });
}

const unauthorized = await call('overview', { suppliedToken: '' });
assert.equal(unauthorized.status, 401);

const unconfigured = await call('overview', {
  suppliedToken: 'short',
  environment: { BE_DATA: store, BE_ADMIN_TOKEN: 'short' }
});
assert.equal(unconfigured.status, 503);

const overview = await call('overview');
assert.equal(overview.status, 200);
const summary = await overview.json();
assert.equal(summary.community.comments, 1);
assert.equal(summary.community.reported, 1);
assert.equal(summary.community.moderation[0].text, comment.text);
assert.equal(summary.services.continuity.count, 1);
assert.equal(summary.services.notifications.count, 1);
assert.equal(summary.services.analytics.count, 1);
assert.equal(summary.services.ranking.count, 1);

const hide = await call('moderate', {
  method: 'POST',
  body: { action: 'hide', channel: 'path:meu-caminho-be', commentId: comment.id }
});
assert.equal(hide.status, 200);
let saved = JSON.parse(store.entries.get('community:state'));
assert.equal(saved.comments['path:meu-caminho-be'][0].hiddenReason, 'manual-moderation');

const restore = await call('moderate', {
  method: 'POST',
  body: { action: 'restore', channel: 'path:meu-caminho-be', commentId: comment.id }
});
assert.equal(restore.status, 200);
saved = JSON.parse(store.entries.get('community:state'));
assert.equal(saved.comments['path:meu-caminho-be'][0].hiddenAt, undefined);
assert.deepEqual(saved.comments['path:meu-caminho-be'][0].reports, []);

const remove = await call('moderate', {
  method: 'POST',
  body: { action: 'delete', channel: 'path:meu-caminho-be', commentId: comment.id }
});
assert.equal(remove.status, 200);
saved = JSON.parse(store.entries.get('community:state'));
assert.equal(saved.comments['path:meu-caminho-be'].length, 0);
assert.ok([...store.entries.keys()].some(key => key.startsWith('admin:audit:')));

console.log('Painel administrativo aprovado: acesso, indicadores, moderação e auditoria validados.');
