import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('meu-caminho-be.html');
const appSource = read('js/fala-bem-app.js');
const accountSource = read('src/apps/meu-caminho/account.js');
const cryptoSource = read('src/apps/meu-caminho/continuity-crypto.js');
const serviceWorker = read('sw.js');

assert.match(html, /meta name="be-meu-caminho-mode" content="local-only"/);
assert.match(html, /meta name="be-continuity-mode" content="encrypted-code"/);
assert.match(html, /ACESSO LOCAL[\s\S]*Nome de acesso[\s\S]*Salvar perfil e entrar/);
assert.match(html, /Seu nome ou apelido cria o acesso neste aparelho ao final do Perfil Be, sem e-mail ou senha/);
assert.doesNotMatch(html, /id="be-auth-(?:gateway|login-form|signup-form|recovery-form|update-form|open)"/);
assert.doesNotMatch(html, /be-auth-(?:login|signup|recovery)-(?:email|password)/);
assert.doesNotMatch(html, /meu-caminho-auth\.(?:css|js)/);
assert.doesNotMatch(html, /id="fb-profile-email"/);

assert.match(appSource, /function hasProfileIdentity\(profile = currentProfile\)/);
assert.match(appSource, /identityCreatedAt: currentProfile\?\.identityCreatedAt \|\| new Date\(\)\.toISOString\(\)/);
assert.match(appSource, /delete currentProfile\.email/);
assert.match(appSource, /Acesso local criado para \$\{name\}/);
assert.match(appSource, /Este aparelho já reconhece o seu perfil/);

assert.match(accountSource, /CONTINUITY_MODE !== 'encrypted-code'/);
assert.match(accountSource, /Ative um código para continuar em outro aparelho, sem e-mail ou senha/);
assert.match(cryptoSource, /algorithm: 'AES-GCM'/);
assert.doesNotMatch(serviceWorker, /meu-caminho-auth/);
assert.match(serviceWorker, /\/js\/meu-caminho-account\.js/);
assert.ok(!fs.existsSync(path.join(root, 'js', 'meu-caminho-auth.js')), 'O bundle antigo de autenticação por e-mail não deve existir.');
assert.ok(!fs.existsSync(path.join(root, 'css', 'meu-caminho-auth.css')), 'O CSS antigo de autenticação por e-mail não deve existir.');

console.log('Acesso local aprovado: nome definido no Perfil Be, sem e-mail ou senha, com continuidade criptografada opcional.');
