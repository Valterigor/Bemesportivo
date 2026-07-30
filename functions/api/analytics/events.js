import { apiJson, apiOptions } from '../../../server/cloudflare-api.mjs';
import { writeJson } from '../../../server/cloudflare-kv.mjs';

const allowedEvents = new Set([
  'contact_open',
  'content_open',
  'page_view',
  'path_activity',
  'path_view',
  'tool_open',
  'video_play'
]);
const maximumBodyBytes = 12_000;

function cleanToken(value, limit) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, '')
    .slice(0, limit);
}

function cleanEvent(value) {
  const name = cleanToken(value?.name, 40);
  const page = cleanToken(value?.page, 80) || '/';
  const detail = cleanToken(value?.detail, 32);
  if (!allowedEvents.has(name) || !page.startsWith('/')) return null;
  return { name, page, detail };
}

function isAllowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return [
      'bemesportivo.pages.dev',
      'bemesportivo.com',
      'www.bemesportivo.com',
      'localhost',
      '127.0.0.1'
    ].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return apiOptions();
  if (request.method !== 'POST') return apiJson({ error: 'Método não permitido.' }, 405);
  if (!isAllowedOrigin(request)) return apiJson({ error: 'Origem não autorizada.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > maximumBodyBytes) {
    return apiJson({ error: 'Solicitação muito grande.' }, 413);
  }

  const raw = await request.text();
  if (raw.length > maximumBodyBytes) {
    return apiJson({ error: 'Solicitação muito grande.' }, 413);
  }

  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return apiJson({ error: 'JSON inválido.' }, 400);
  }
  const events = (Array.isArray(body.events) ? body.events : [])
    .slice(0, 20)
    .map(cleanEvent)
    .filter(Boolean);
  if (!events.length) return apiJson({ error: 'Nenhum evento válido.' }, 400);

  try {
    const createdAt = new Date().toISOString();
    await writeJson(env, `analytics:${createdAt}:${crypto.randomUUID()}`, {
      schemaVersion: 1,
      createdAt,
      events
    }, { expirationTtl: 60 * 60 * 24 * 90 });
  } catch (error) {
    const configurationError = error instanceof Error && error.message === 'BE_DATA_NOT_CONFIGURED';
    return apiJson({
      error: configurationError
        ? 'Armazenamento BE_DATA ainda não vinculado.'
        : 'Métricas temporariamente indisponíveis.'
    }, 503);
  }

  return apiJson({ ok: true, accepted: events.length }, 202);
}
