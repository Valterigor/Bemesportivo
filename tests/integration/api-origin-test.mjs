import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function loadEndpoint(relativePath) {
  const build = await esbuild.build({
    entryPoints: [path.join(root, relativePath)],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString('base64')}`;
  return import(moduleUrl);
}

const foreignHeaders = { Origin: 'https://attacker.example', 'Content-Type': 'application/json' };
const sync = await loadEndpoint('functions/api/meu-caminho-sync.js');
const syncResponse = await sync.onRequest({
  request: new Request('https://bemesportivo.com/api/meu-caminho-sync', {
    method: 'PUT',
    headers: foreignHeaders,
    body: '{}'
  }),
  env: {}
});
assert.equal(syncResponse.status, 403);

const ranking = await loadEndpoint('functions/api/game-ranking.js');
const rankingResponse = await ranking.onRequest({
  request: new Request('https://bemesportivo.com/api/game-ranking', {
    method: 'POST',
    headers: foreignHeaders,
    body: JSON.stringify({ action: 'start', deviceId: 'test-device' })
  }),
  env: {}
});
assert.equal(rankingResponse.status, 403);

console.log('Origens das APIs aprovadas: escritas de continuidade e ranking bloqueiam sites externos.');
