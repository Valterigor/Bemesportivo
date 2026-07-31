import { apiJson } from './cloudflare-api.mjs';
import { getDataStore, readJson, writeJson } from './cloudflare-kv.mjs';

const maximumBodyBytes = 120_000;
const maximumReminders = 300;
const recordTtlSeconds = 100 * 24 * 60 * 60;

function allowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new Set([
      'bemesportivo.com',
      'www.bemesportivo.com',
      'bemesportivo.pages.dev',
      'localhost',
      '127.0.0.1'
    ]).has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function validInstallation(value) {
  const id = String(value || '');
  return /^[a-f0-9-]{30,50}$/i.test(id) ? id : '';
}

function cleanReminders(value) {
  if (!Array.isArray(value)) return [];
  const now = Date.now();
  return value.map(item => {
    const timestamp = Date.parse(item?.dueAt || '');
    return {
      key: String(item?.key || '').replace(/[^a-z0-9:_-]/gi, '').slice(0, 140),
      dueAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : ''
    };
  }).filter(item => (
    item.key
    && item.dueAt
    && Date.parse(item.dueAt) > now - 60_000
    && Date.parse(item.dueAt) < now + (100 * 24 * 60 * 60 * 1000)
  )).slice(0, maximumReminders);
}

function validPushEndpoint(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:') return false;
    return [
      'fcm.googleapis.com',
      'updates.push.services.mozilla.com',
      'web.push.apple.com'
    ].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
      || url.hostname.endsWith('.notify.windows.com');
  } catch {
    return false;
  }
}

async function parseBody(request) {
  if (Number(request.headers.get('content-length') || 0) > maximumBodyBytes) return null;
  const raw = await request.text();
  if (raw.length > maximumBodyBytes) return null;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

async function requestFingerprint(request) {
  const address = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  const bytes = new TextEncoder().encode(`routine-rate:${address}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function withinRateLimit(request, env) {
  const key = `routine:rate:${await requestFingerprint(request)}`;
  const now = Date.now();
  const previous = await readJson(env, key, { startedAt: now, count: 0 });
  const state = now - Number(previous.startedAt || 0) < 86_400_000
    ? previous
    : { startedAt: now, count: 0 };
  if (Number(state.count || 0) >= 40) return false;
  state.count = Number(state.count || 0) + 1;
  await writeJson(env, key, state, { expirationTtl: 86_400 });
  return true;
}

export async function handleRoutineNotifications(request, env, action) {
  if (!allowedOrigin(request)) return apiJson({ error: 'Origem não autorizada.' }, 403);

  if (request.method === 'GET' && action === 'config') {
    const configuration = await readJson(env, 'routine:config', null);
    const publicKey = String(env?.WEB_PUSH_PUBLIC_KEY || configuration?.publicKey || '');
    return publicKey
      ? apiJson({ publicKey, provider: 'cloudflare-workers' })
      : apiJson({ error: 'Lembretes com o site fechado ainda não foram ativados.' }, 503);
  }

  if (!['POST', 'DELETE'].includes(request.method) || action !== 'schedule') {
    return apiJson({ error: 'Rota não encontrada.' }, 404);
  }

  const body = await parseBody(request);
  if (!body) return apiJson({ error: 'Solicitação inválida ou muito grande.' }, 400);
  const installationId = validInstallation(body.installationId);
  if (!installationId) return apiJson({ error: 'Instalação inválida.' }, 400);
  const key = `routine:install:${installationId}`;

  if (request.method === 'DELETE') {
    await getDataStore(env).delete(key);
    return apiJson({ ok: true });
  }

  if (!await withinRateLimit(request, env)) {
    return apiJson({ error: 'Limite temporário atingido.' }, 429);
  }

  const subscription = body.subscription;
  if (
    !subscription?.endpoint
    || !subscription?.keys?.p256dh
    || !subscription?.keys?.auth
    || !validPushEndpoint(subscription.endpoint)
  ) {
    return apiJson({ error: 'Assinatura de notificações inválida.' }, 400);
  }

  const reminders = cleanReminders(body.reminders);
  if (!reminders.length) {
    await getDataStore(env).delete(key);
    return apiJson({ ok: true, reminders: 0 });
  }

  const record = {
    schemaVersion: 1,
    installationId,
    subscription: {
      endpoint: String(subscription.endpoint).slice(0, 2000),
      expirationTime: subscription.expirationTime || null,
      keys: {
        p256dh: String(subscription.keys.p256dh).slice(0, 500),
        auth: String(subscription.keys.auth).slice(0, 500)
      }
    },
    reminders,
    updatedAt: new Date().toISOString()
  };
  await writeJson(env, key, record, { expirationTtl: recordTtlSeconds });
  return apiJson({ ok: true, reminders: reminders.length });
}
