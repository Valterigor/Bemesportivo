import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const build = await esbuild.build({
  entryPoints: [path.join(root, 'functions/_middleware.js')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString('base64')}`;
const { onRequest } = await import(moduleUrl);
const response = await onRequest({
  next: async () => Response.json({ ok: true }, { headers: { 'Cache-Control': 'public, max-age=60' } })
});

assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains');
assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
assert.equal(response.headers.get('x-frame-options'), 'DENY');
assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
assert.equal(response.headers.get('cache-control'), 'public, max-age=60');

console.log('Headers das Functions aprovados: segurança comum aplicada sem alterar o cache do endpoint.');
