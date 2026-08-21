import { apiJson, apiOptions } from '../../server/cloudflare-api.mjs';

function booleanValue(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return apiOptions();
  if (request.method !== 'GET') return apiJson({ error: 'Método não permitido.' }, 405);

  const url = String(env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const publishableKey = String(
    env.SUPABASE_PUBLISHABLE_KEY
    || env.SUPABASE_ANON_KEY
    || ''
  ).trim();
  const enabled = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)
    && publishableKey.length >= 40;

  return apiJson({
    enabled,
    url: enabled ? url : '',
    publishableKey: enabled ? publishableKey : '',
    googleEnabled: enabled && booleanValue(env.SUPABASE_GOOGLE_ENABLED)
  });
}
