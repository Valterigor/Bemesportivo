import { getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';

const MAX_BODY_BYTES = 450_000;
const MAX_TASKS = 250;
const CLOUD_CONSENT_VERSION = '2026-07-23';
const SNAPSHOT_SCHEMA_VERSION = 2;
const INVALID = Symbol('invalid');

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

function getStoreOptions() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  return siteID && token ? { siteID, token } : undefined;
}

function userStore() {
  return getStore({
    name: 'meu-caminho-be-users',
    consistency: 'strong',
    ...(getStoreOptions() || {})
  });
}

async function parseBody(request) {
  const announcedSize = Number(request.headers.get('content-length') || 0);
  if (announcedSize > MAX_BODY_BYTES) return null;
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return null;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

function cleanSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const profile = value.profile;
  const tasks = value.tasks;
  if (profile !== null && (!profile || typeof profile !== 'object' || Array.isArray(profile))) return null;
  if (!Array.isArray(tasks) || tasks.length > MAX_TASKS) return null;
  if ((profile || tasks.length > 0) && (
    !profile
    || profile.cloudSyncConsent?.version !== CLOUD_CONSENT_VERSION
    || !profile.cloudSyncConsent?.consentedAt
  )) return null;

  const cleanProfile = profile === null ? null : cleanJson(profile);
  const cleanTasks = cleanJson(tasks.slice(-MAX_TASKS));
  if (cleanProfile === INVALID || cleanTasks === INVALID) return null;
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    profile: cleanProfile,
    tasks: cleanTasks
  };
}

function cleanJson(value, depth = 0) {
  if (depth > 8) return INVALID;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, 4000);
  if (typeof value === 'number') return Number.isFinite(value) ? value : INVALID;
  if (Array.isArray(value)) {
    if (value.length > 500) return INVALID;
    const result = value.map(item => cleanJson(item, depth + 1));
    return result.includes(INVALID) ? INVALID : result;
  }
  if (!value || typeof value !== 'object') return INVALID;
  const entries = Object.entries(value);
  if (entries.length > 160) return INVALID;
  const result = {};
  for (const [key, entry] of entries) {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(key) || ['__proto__', 'prototype', 'constructor'].includes(key)) return INVALID;
    const cleaned = cleanJson(entry, depth + 1);
    if (cleaned === INVALID) return INVALID;
    result[key] = cleaned;
  }
  return result;
}

function cleanMutationId(value) {
  const id = String(value || '').trim();
  return /^[a-zA-Z0-9-]{16,80}$/.test(id) ? id : '';
}

function isAllowedWriteOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return new Set([
    new URL(request.url).origin,
    'https://bemesportivo.com',
    'https://www.bemesportivo.com',
    'http://localhost:3100',
    'http://127.0.0.1:3100'
  ]).has(origin);
}

export default async function handler(request) {
  const user = await getUser();
  if (!user?.id) return json({ error: 'Autenticação necessária.' }, 401);
  if (['PUT', 'DELETE'].includes(request.method) && !isAllowedWriteOrigin(request)) {
    return json({ error: 'Origem não autorizada.' }, 403);
  }

  const store = userStore();
  const key = `user-${user.id}`;

  if (request.method === 'GET') {
    const record = await store.get(key, { type: 'json', consistency: 'strong' });
    return json({
      exists: Boolean(record),
      schemaVersion: Number(record?.schemaVersion || 1),
      revision: Number(record?.revision || 0),
      updatedAt: record?.updatedAt || null,
      serverTime: new Date().toISOString(),
      data: record?.data || null
    });
  }

  if (request.method === 'PUT') {
    const body = await parseBody(request);
    const data = cleanSnapshot(body?.data);
    const mutationId = cleanMutationId(body?.mutationId);
    if (!body || !data || !mutationId) return json({ error: 'Dados, consentimento ou identificador de alteração inválidos.' }, 400);

    const current = await store.get(key, { type: 'json', consistency: 'strong' });
    const currentRevision = Number(current?.revision || 0);
    if (current?.lastMutationId === mutationId) {
      return json({ ok: true, repeated: true, revision: currentRevision, updatedAt: current.updatedAt });
    }
    const baseRevision = Number(body.baseRevision || 0);
    if (current && !body.force && baseRevision !== currentRevision) {
      return json({
        error: 'Os dados foram alterados em outro aparelho.',
        conflict: true,
        revision: currentRevision,
        updatedAt: current.updatedAt,
        data: current.data
      }, 409);
    }

    const record = {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      revision: currentRevision + 1,
      createdAt: current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMutationId: mutationId,
      data
    };
    await store.setJSON(key, record);
    return json({ ok: true, revision: record.revision, updatedAt: record.updatedAt });
  }

  if (request.method === 'DELETE') {
    await store.delete(key);
    return json({ ok: true });
  }

  return json({ error: 'Método não permitido.' }, 405);
}
