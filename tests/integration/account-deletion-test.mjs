import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const build = await esbuild.build({
  entryPoints: [path.resolve(currentDirectory, '../../functions/api/account/delete.js')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString('base64')}`;
const { onRequest } = await import(moduleUrl);

const supabaseUrl = 'https://security-test.supabase.co';
const publishableKey = `publishable-${'p'.repeat(50)}`;
const serviceRoleKey = `service-role-${'s'.repeat(50)}`;
const accessToken = `user-token-${'t'.repeat(80)}`;
const userId = '12345678-1234-4234-9234-123456789abc';
const environment = {
  SUPABASE_URL: supabaseUrl,
  SUPABASE_PUBLISHABLE_KEY: publishableKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey
};

function request({ origin = 'https://bemesportivo.com', authorization = `Bearer ${accessToken}`, confirmation = 'DELETE_MY_ACCOUNT' } = {}) {
  return new Request('https://bemesportivo.com/api/account/delete', {
    method: 'POST',
    headers: { Origin: origin, Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmation })
  });
}

const originalFetch = globalThis.fetch;
try {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith('/auth/v1/user')) {
      assert.equal(options.headers.apikey, publishableKey);
      assert.equal(options.headers.Authorization, `Bearer ${accessToken}`);
      return Response.json({ id: userId });
    }
    if (String(url).includes('/rest/v1/meu_caminho_journeys')) {
      assert.equal(options.method, 'DELETE');
      assert.equal(options.headers.Authorization, `Bearer ${accessToken}`);
      return new Response(null, { status: 204 });
    }
    if (String(url).includes(`/auth/v1/admin/users/${userId}`)) {
      assert.equal(options.method, 'DELETE');
      assert.equal(options.headers.apikey, serviceRoleKey);
      assert.equal(options.headers.Authorization, `Bearer ${serviceRoleKey}`);
      return new Response(null, { status: 200 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const success = await onRequest({ request: request(), env: environment });
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { ok: true });
  assert.equal(calls.length, 3);

  const foreignOrigin = await onRequest({ request: request({ origin: 'https://attacker.example' }), env: environment });
  assert.equal(foreignOrigin.status, 403);

  const missingToken = await onRequest({ request: request({ authorization: '' }), env: environment });
  assert.equal(missingToken.status, 401);

  const invalidConfirmation = await onRequest({ request: request({ confirmation: 'DELETE' }), env: environment });
  assert.equal(invalidConfirmation.status, 400);

  const missingSecret = await onRequest({
    request: request(),
    env: { SUPABASE_URL: supabaseUrl, SUPABASE_PUBLISHABLE_KEY: publishableKey }
  });
  assert.equal(missingSecret.status, 503);

  console.log('Exclusão de conta aprovada: identidade, origem, sequência de remoção e segredo de backend verificados.');
} finally {
  globalThis.fetch = originalFetch;
}
