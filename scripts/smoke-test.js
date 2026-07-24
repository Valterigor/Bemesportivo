'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = 3197;
const baseUrl = `http://127.0.0.1:${port}`;
const pages = [
  '/',
  '/reportagens',
  '/reportagens/treino-funcional-br-assessoria',
  '/reportagens/dedicacao-talento-mirim',
  '/reportagens/duda-e-o-futebol',
  '/meu-caminho-be',
  '/beplay',
  '/game.html',
  '/profissionais',
  '/produtos',
  '/sobre',
  '/contato',
  '/politica-de-privacidade',
  '/politica-de-valores',
  '/termos',
  '/diretrizes-da-comunidade'
];

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error('O servidor local não iniciou para o teste funcional.');
}

async function expectOk(route) {
  const response = await fetch(`${baseUrl}${route}`);
  assert.equal(response.status, 200, `${route} deveria responder 200`);
  return response;
}

async function run() {
  const server = spawn(process.execPath, ['dev-server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  let serverError = '';
  server.stderr.on('data', chunk => { serverError += chunk.toString(); });

  try {
    await waitForServer();
    for (const page of pages) {
      const response = await expectOk(page);
      assert.match(response.headers.get('content-type') || '', /text\/html/, `${page} precisa entregar HTML`);
    }

    const manifest = await expectOk('/manifest.webmanifest');
    assert.match(manifest.headers.get('content-type') || '', /application\/manifest\+json/);
    const manifestBody = await manifest.json();
    assert.equal(manifestBody.icons.length, 3);
    for (const icon of manifestBody.icons) await expectOk(icon.src);

    const community = await expectOk('/api/community/comments?scope=path&id=meu-caminho-be');
    const communityBody = await community.json();
    assert.equal(communityBody.ok, true);
    assert.ok(Array.isArray(communityBody.comments));

    const ranking = await expectOk('/api/game-ranking');
    assert.ok(Array.isArray((await ranking.json()).ranking));

    const video = await fetch(`${baseUrl}/videos/treino-agilidade-futebol.mp4`, {
      headers: { Range: 'bytes=0-1023' }
    });
    assert.equal(video.status, 206);
    assert.match(video.headers.get('content-type') || '', /video\/mp4/);
    assert.equal((await video.arrayBuffer()).byteLength, 1024);

    const pathHtml = fs.readFileSync(path.join(root, 'meu-caminho-be.html'), 'utf8');
    assert.match(pathHtml, /id="fb-photo-checkin"[^>]*data-feature-state="paused"[^>]*hidden/);
    for (const id of ['fb-login-form', 'fb-signup-form', 'fb-recovery-request-form', 'fb-password-reset-form']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Fluxo de conta ausente: ${id}`);
    }

    const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
    assert.match(redirects, /\/api\/analytics\/events\s+\/\.netlify\/functions\/analytics/);
    assert.match(redirects, /\/api\/routine-notifications\/\*/);

    console.log(`Teste funcional aprovado: ${pages.length} páginas, APIs, PWA, vídeo, login e integrações essenciais.`);
  } finally {
    server.kill();
    await delay(100);
    if (!server.killed && serverError) process.stderr.write(serverError);
  }
}

run().catch(error => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
