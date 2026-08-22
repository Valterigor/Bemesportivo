import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html'));
const hashes = new Set();

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    hashes.add(`'sha256-${crypto.createHash('sha256').update(match[1], 'utf8').digest('base64')}'`);
  }
}

if (process.argv.includes('--print')) {
  console.log([...hashes].sort().join(' '));
  process.exit(0);
}

const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
const lines = headers.split(/\r?\n/).map(line => line.trim());
const policyValue = prefix => {
  const line = lines.find(value => value.startsWith(prefix)) || '';
  return line.slice(line.indexOf(':') + 1).trim();
};
const directive = (policy, name) => policy.split(';').map(value => value.trim()).find(value => value.startsWith(`${name} `)) || '';
const enforced = policyValue('Content-Security-Policy:');
const reportOnly = policyValue('Content-Security-Policy-Report-Only:');

assert.match(directive(enforced, 'script-src-attr'), /^script-src-attr 'none'$/);
assert.match(directive(enforced, 'object-src'), /^object-src 'none'$/);
assert.match(directive(enforced, 'base-uri'), /^base-uri 'self'$/);
assert.match(directive(enforced, 'form-action'), /^form-action 'self'$/);
assert.match(directive(enforced, 'frame-ancestors'), /^frame-ancestors 'self'$/);
assert.match(directive(reportOnly, 'default-src'), /^default-src 'self'$/);
assert.match(directive(reportOnly, 'script-src'), /^script-src 'self' /);
assert.doesNotMatch(directive(reportOnly, 'script-src'), /'unsafe-inline'|'unsafe-eval'/);
for (const hash of hashes) assert.ok(directive(reportOnly, 'script-src').includes(hash), `Hash CSP ausente: ${hash}`);
assert.match(headers, /\/meu-caminho-be\*[\s\S]*?Content-Security-Policy: default-src 'self'; script-src 'self'; script-src-attr 'none'/);
assert.match(headers, /\/admin\*[\s\S]*?Content-Security-Policy: default-src 'self'; script-src 'self'; script-src-attr 'none'/);

console.log(`CSP aprovada: ${hashes.size} scripts internos autorizados por hash e execução arbitrária bloqueada.`);
