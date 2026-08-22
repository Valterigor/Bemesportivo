import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const build = await esbuild.build({
  entryPoints: [path.resolve(currentDirectory, '../../functions/api/contact.js')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString('base64')}`;
const { onRequest } = await import(moduleUrl);
const root = path.resolve(currentDirectory, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const homeHtml = read('index.html');
const contactHtml = read('contato.html');
const privacyHtml = read('politica-de-privacidade.html');
assert.match(homeHtml, /data-contact-form[\s\S]*bemesportivo@yahoo\.com/);
assert.match(contactHtml, /data-contact-form[\s\S]*bemesportivo@yahoo\.com/);
assert.doesNotMatch(homeHtml, /data-netlify|newsletter-bem|newsletter=recebido/);
assert.doesNotMatch(privacyHtml, /infraestrutura de formulários da Netlify|<h2>Newsletter<\/h2>/);
const contactPages = [
  'beplay.html', 'produtos.html', 'profissionais.html', 'reportagens.html', 'meu-caminho-be.html',
  ...fs.readdirSync(root).filter(file => /^reportagem-.+\.html$/.test(file))
];
for (const file of contactPages) {
  assert.doesNotMatch(read(file), /wa\.me\/5511986366965/, `O contato geral precisa usar o novo canal: ${file}`);
}

function request(body, origin = 'https://bemesportivo.com') {
  return new Request('https://bemesportivo.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'CF-Connecting-IP': '203.0.113.20' },
    body: JSON.stringify({ startedAt: Date.now() - 5000, ...body })
  });
}

function environment() {
  const sent = [];
  const records = new Map();
  return {
    sent,
    env: {
      CONTACT_EMAIL: { async send(message) { sent.push(message); return { messageId: `contact-${sent.length}` }; } },
      BE_DATA: {
        async get(key) { return records.has(key) ? JSON.parse(records.get(key)) : null; },
        async put(key, value) { records.set(key, value); }
      }
    }
  };
}

const validBody = {
  name: 'Pessoa Teste',
  email: 'pessoa@example.com',
  subject: 'duvida',
  message: 'Gostaria de tirar uma dúvida sobre o projeto.',
  source: 'Teste automatizado'
};

{
  const runtime = environment();
  const response = await onRequest({ request: request(validBody), env: runtime.env });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(runtime.sent.length, 1);
  assert.equal(runtime.sent[0].to, 'bemesportivo@yahoo.com');
  assert.equal(runtime.sent[0].replyTo.email, validBody.email);
  assert.match(runtime.sent[0].subject, /Dúvida/);
}

{
  const runtime = environment();
  const response = await onRequest({ request: request({ ...validBody, email: 'invalido' }), env: runtime.env });
  assert.equal(response.status, 400);
  assert.equal(runtime.sent.length, 0);
}

{
  const runtime = environment();
  const response = await onRequest({ request: request({ ...validBody, website: 'spam.example' }), env: runtime.env });
  assert.equal(response.status, 200);
  assert.equal(runtime.sent.length, 0);
}

{
  const response = await onRequest({ request: request(validBody), env: {} });
  const payload = await response.json();
  assert.equal(response.status, 503);
  assert.equal(payload.fallbackEmail, 'bemesportivo@yahoo.com');
}

{
  const runtime = environment();
  for (let index = 0; index < 5; index += 1) {
    const response = await onRequest({ request: request(validBody), env: runtime.env });
    assert.equal(response.status, 200);
  }
  const limited = await onRequest({ request: request(validBody), env: runtime.env });
  assert.equal(limited.status, 429);
}

{
  const runtime = environment();
  const response = await onRequest({ request: request(validBody, 'https://malicioso.example'), env: runtime.env });
  assert.equal(response.status, 403);
  assert.equal(runtime.sent.length, 0);
}

console.log('Canal de contato aprovado: envio, destino fixo, validação, fallback e limite verificados.');
