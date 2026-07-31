import { apiJson, apiOptions } from '../../server/cloudflare-api.mjs';
import { readJson, writeJson, getDataStore } from '../../server/cloudflare-kv.mjs';

const maximumBodyBytes = 650_000;
const identifierPattern = /^[a-f0-9]{64}$/;
const encodedPattern = /^[A-Za-z0-9_-]+$/;

async function hashHex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function validEnvelope(value) {
  return value
    && value.version === 1
    && value.algorithm === 'AES-GCM'
    && typeof value.iv === 'string'
    && value.iv.length >= 16
    && value.iv.length <= 32
    && encodedPattern.test(value.iv)
    && typeof value.ciphertext === 'string'
    && value.ciphertext.length > 20
    && value.ciphertext.length <= 620_000
    && encodedPattern.test(value.ciphertext);
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

function credentials(request, body = {}) {
  const url = new URL(request.url);
  return {
    id: String(body.id || url.searchParams.get('id') || '').toLowerCase(),
    token: String(
      body.token
      || request.headers.get('x-be-sync-token')
      || ''
    ).toLowerCase()
  };
}

async function authorizedRecord(env, id, token) {
  const record = await readJson(env, `sync:${id}`, null);
  if (!record) return { record: null, authorized: true };
  const verifier = await hashHex(`be-sync-verifier:${token}`);
  return { record, authorized: verifier === record.verifier };
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return apiOptions();

  let body = {};
  if (['PUT', 'DELETE'].includes(request.method)) {
    body = await parseBody(request);
    if (!body) return apiJson({ error: 'Conteúdo inválido ou muito grande.' }, 400);
  }

  const { id, token } = credentials(request, body);
  if (!identifierPattern.test(id) || !identifierPattern.test(token)) {
    return apiJson({ error: 'Código de continuidade inválido.' }, 400);
  }

  let stored;
  try {
    stored = await authorizedRecord(env, id, token);
  } catch (error) {
    const configurationError = error instanceof Error && error.message === 'BE_DATA_NOT_CONFIGURED';
    return apiJson({
      error: configurationError
        ? 'Armazenamento BE_DATA ainda não vinculado.'
        : 'Sincronização temporariamente indisponível.'
    }, 503);
  }
  if (!stored.authorized) return apiJson({ error: 'Código de continuidade inválido.' }, 401);

  if (request.method === 'GET') {
    const record = stored.record;
    return apiJson({
      exists: Boolean(record),
      revision: Number(record?.revision || 0),
      updatedAt: record?.updatedAt || null,
      serverTime: new Date().toISOString(),
      envelope: record?.envelope || null
    });
  }

  if (request.method === 'PUT') {
    if (!validEnvelope(body.envelope) || !/^[A-Za-z0-9-]{16,80}$/.test(String(body.mutationId || ''))) {
      return apiJson({ error: 'Pacote criptografado inválido.' }, 400);
    }
    const current = stored.record;
    const currentRevision = Number(current?.revision || 0);
    if (current?.lastMutationId === body.mutationId) {
      return apiJson({
        ok: true,
        repeated: true,
        revision: currentRevision,
        updatedAt: current.updatedAt
      });
    }
    if (current && !body.force && Number(body.baseRevision || 0) !== currentRevision) {
      return apiJson({
        error: 'Os dados foram alterados em outro aparelho.',
        conflict: true,
        revision: currentRevision,
        updatedAt: current.updatedAt,
        envelope: current.envelope
      }, 409);
    }

    const record = {
      schemaVersion: 1,
      verifier: current?.verifier || await hashHex(`be-sync-verifier:${token}`),
      revision: currentRevision + 1,
      createdAt: current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMutationId: body.mutationId,
      envelope: body.envelope
    };
    await writeJson(env, `sync:${id}`, record);
    return apiJson({ ok: true, revision: record.revision, updatedAt: record.updatedAt });
  }

  if (request.method === 'DELETE') {
    await getDataStore(env).delete(`sync:${id}`);
    return apiJson({ ok: true });
  }

  return apiJson({ error: 'Método não permitido.' }, 405);
}
