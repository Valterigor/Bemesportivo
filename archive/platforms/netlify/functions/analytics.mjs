import { getStore } from '@netlify/blobs';

const ALLOWED_EVENTS = new Set([
  'contact_open',
  'content_open',
  'page_view',
  'path_activity',
  'path_view',
  'tool_open',
  'video_play'
]);
const MAX_BODY_BYTES = 12_000;
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});

function getStoreOptions() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  return siteID && token ? { siteID, token } : undefined;
}

function analyticsStore() {
  return getStore({
    name: 'bem-esportivo-analytics',
    consistency: 'strong',
    ...(getStoreOptions() || {})
  });
}

function isAllowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return ['bemesportivo.com', 'www.bemesportivo.com', 'localhost', '127.0.0.1']
      .includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function cleanToken(value, limit) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9/_-]/g, '').slice(0, limit);
}

function cleanEvent(value) {
  const name = cleanToken(value?.name, 40);
  const page = cleanToken(value?.page, 80) || '/';
  const detail = cleanToken(value?.detail, 32);
  if (!ALLOWED_EVENTS.has(name) || !page.startsWith('/')) return null;
  return { name, page, detail };
}

function increment(target, key, amount = 1) {
  target[key] = Number(target[key] || 0) + amount;
}

async function recordEvents(events) {
  const day = new Date().toISOString().slice(0, 10);
  const targetStore = analyticsStore();
  const key = `day-${day}`;
  const record = await targetStore.get(key, { type: 'json', consistency: 'strong' }) || {
    schemaVersion: 1,
    day,
    total: 0,
    events: {},
    pages: {},
    updatedAt: null
  };

  for (const event of events) {
    record.total += 1;
    increment(record.events, event.detail ? `${event.name}:${event.detail}` : event.name);
    if (event.name === 'page_view') increment(record.pages, event.page);
  }
  record.updatedAt = new Date().toISOString();
  await targetStore.setJSON(key, record);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  if (!isAllowedOrigin(request)) return json({ error: 'Origem não autorizada.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return json({ error: 'Solicitação muito grande.' }, 413);
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ error: 'Não foi possível ler os eventos.' }, 400);
  }
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Solicitação muito grande.' }, 413);

  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }
  const events = (Array.isArray(body.events) ? body.events : [])
    .slice(0, 20)
    .map(cleanEvent)
    .filter(Boolean);
  if (!events.length) return json({ error: 'Nenhum evento válido.' }, 400);

  await recordEvents(events);
  return json({ ok: true, accepted: events.length }, 202);
}
