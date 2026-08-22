import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const requiredDocuments = [
  'docs/LGPD-REGISTRO-DE-TRATAMENTO.md',
  'docs/LGPD-DIREITOS-E-RETENCAO.md',
  'docs/LGPD-RESPOSTA-A-INCIDENTES.md',
  'docs/LGPD-RIPD-MEU-CAMINHO.md',
  'docs/LGPD-FORNECEDORES-E-TRANSFERENCIAS.md',
  'docs/SEGURANCA-PRODUCAO-CHECKLIST.md'
];

for (const file of requiredDocuments) {
  assert.ok(fs.existsSync(path.join(root, file)), `Documento LGPD ausente: ${file}`);
  assert.ok(read(file).length > 600, `Documento LGPD incompleto: ${file}`);
}

const policy = read('politica-de-privacidade.html');
assert.match(policy, /até 180 dias para possível reativação/);
assert.match(policy, /atualmente de até 15 dias/);
assert.match(policy, /Nunca solicitaremos senha, token ou código secreto de continuidade por e-mail/);
assert.match(policy, /jornada personalizada e a comunidade são oferecidas somente a maiores de 18 anos/);

const publicProfiles = read('server/public-profile-core.mjs');
const adapter = read('functions/api/public-profiles/[[path]].js');
assert.match(publicProfiles, /disabledRetentionSeconds = 180 \* 24 \* 60 \* 60/);
assert.match(publicProfiles, /expirationTtl: disabledRetentionSeconds/g);
assert.match(adapter, /write: \(key, value, options\) => writeJson\(env, key, value, options\)/);

const headers = read('_headers');
for (const line of headers.split(/\r?\n/)) {
  assert.ok(line.length <= 2000, `Linha de _headers excede o limite da Cloudflare: ${line.length}`);
}

const operation = read('docs/SEGURANCA-E-PRIVACIDADE-OPERACAO.md');
assert.doesNotMatch(operation, /acessos à Netlify/);
assert.match(operation, /LGPD-RESPOSTA-A-INCIDENTES\.md/);

console.log('Governança LGPD aprovada: inventário, direitos, retenção, incidentes, RIPD e fornecedores verificados.');
