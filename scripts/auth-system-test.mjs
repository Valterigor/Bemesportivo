import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('meu-caminho-be.html');
const source = read('src/js/meu-caminho-auth.js');
const css = read('css/meu-caminho-auth.css');
const migration = read('supabase/migrations/202608210001_meu_caminho_accounts.sql');
const configFunction = read('functions/api/auth-config.js');
const serviceWorker = read('sw.js');

assert.match(html, /id="be-auth-gateway"[\s\S]*id="be-auth-login-form"[\s\S]*id="be-auth-signup-form"/);
assert.match(html, /id="be-auth-recovery-form"[\s\S]*id="be-auth-update-form"/);
assert.match(html, /id="be-auth-local"[\s\S]*Continuar sem conta neste aparelho/);
assert.match(html, /meu-caminho-auth\.css\?v=20260821-1/);
assert.match(html, /meu-caminho-auth\.js\?v=20260821-1/);
assert.match(css, /\.be-auth-gateway\s*\{/);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(source, /signInWithPassword/);
assert.match(source, /resetPasswordForEmail/);
assert.match(source, /signInWithOAuth/);
assert.match(source, /ACCOUNT_SYNC_KEY/);
assert.match(source, /protectedActionTrigger/);
assert.match(source, /protectedForm/);
assert.match(source, /accessDecisionMade/);
assert.match(source, /rememberProtectedAction/);
assert.match(source, /resumeProtectedAction/);
assert.match(html, /Autorizo salvar na minha conta/);
assert.ok(fs.existsSync(path.join(root, 'js', 'meu-caminho-auth.js')), 'Bundle de autenticação ausente.');
assert.match(serviceWorker, /\/css\/meu-caminho-auth\.css/);
assert.match(serviceWorker, /\/js\/meu-caminho-auth\.js/);

assert.match(migration, /enable row level security/i);
assert.match(migration, /force row level security/i);
assert.match(migration, /auth\.uid\(\)\) = user_id/g);
assert.match(migration, /revoke all on public\.meu_caminho_journeys from anon/i);

assert.match(configFunction, /SUPABASE_PUBLISHABLE_KEY/);
assert.match(configFunction, /SUPABASE_GOOGLE_ENABLED/);
assert.match(configFunction, /enabled \? publishableKey : ''/);
assert.doesNotMatch(configFunction, /service_role|SUPABASE_SECRET/i);

console.log('Sistema de acesso aprovado: interface, configuração pública, sessão e RLS verificados.');
