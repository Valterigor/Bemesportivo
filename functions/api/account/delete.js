const maximumBodyBytes = 2_000;

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

function supabaseConfiguration(env) {
  const url = String(env?.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const publishableKey = String(env?.SUPABASE_PUBLISHABLE_KEY || env?.SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = String(env?.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const validUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
  return { url, publishableKey, serviceRoleKey, ready: validUrl && publishableKey.length >= 40 && serviceRoleKey.length >= 40 };
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

async function parseBody(request) {
  if (Number(request.headers.get('content-length') || 0) > maximumBodyBytes) return null;
  const raw = await request.text();
  if (raw.length > maximumBodyBytes) return null;
  try { return raw ? JSON.parse(raw) : {}; } catch { return null; }
}

async function supabaseRequest(url, options) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  if (!sameOrigin(request)) return json({ error: 'Origem não autorizada.' }, 403);
  const configuration = supabaseConfiguration(env);
  if (!configuration.ready) return json({ error: 'A exclusão segura da conta ainda não está configurada.' }, 503);

  const authorization = String(request.headers.get('authorization') || '');
  const tokenMatch = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!tokenMatch || tokenMatch[1].length < 40) return json({ error: 'Sessão inválida ou expirada.' }, 401);
  const body = await parseBody(request);
  if (!body || body.confirmation !== 'DELETE_MY_ACCOUNT') return json({ error: 'Confirmação de exclusão inválida.' }, 400);

  try {
    const userResponse = await supabaseRequest(`${configuration.url}/auth/v1/user`, {
      method: 'GET',
      headers: { apikey: configuration.publishableKey, Authorization: `Bearer ${tokenMatch[1]}` }
    });
    if (!userResponse.ok) return json({ error: 'Sessão inválida ou expirada.' }, 401);
    const user = await userResponse.json().catch(() => null);
    if (!/^[0-9a-f-]{36}$/i.test(String(user?.id || ''))) return json({ error: 'Não foi possível confirmar a identidade da conta.' }, 401);

    const journeyResponse = await supabaseRequest(
      `${configuration.url}/rest/v1/meu_caminho_journeys?user_id=eq.${encodeURIComponent(user.id)}`,
      {
        method: 'DELETE',
        headers: { apikey: configuration.publishableKey, Authorization: `Bearer ${tokenMatch[1]}`, Prefer: 'return=minimal' }
      }
    );
    if (!journeyResponse.ok) return json({ error: 'Não foi possível excluir os dados sincronizados. A conta foi mantida.' }, 502);

    const accountResponse = await supabaseRequest(`${configuration.url}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: { apikey: configuration.serviceRoleKey, Authorization: `Bearer ${configuration.serviceRoleKey}` }
    });
    if (!accountResponse.ok) {
      return json({ error: 'Os dados sincronizados foram excluídos, mas a conta ainda não pôde ser removida. Tente novamente.' }, 502);
    }
    return json({ ok: true });
  } catch {
    return json({ error: 'A exclusão não pôde ser concluída agora. Nenhuma credencial foi exposta.' }, 503);
  }
}
