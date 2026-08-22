import { apiJson, apiOptions, isSameOrigin } from '../../server/cloudflare-api.mjs';
import { readJson, writeJson } from '../../server/cloudflare-kv.mjs';

const rankingKey = 'game:ranking';

function clean(value, maximum = 16) {
  return String(value || '')
    .replace(/[<>\u0000-\u001f]/g, '')
    .trim()
    .slice(0, maximum);
}

function publicEntries(entries) {
  return entries.slice(0, 100).map(({ name, score, level, character, createdAt }) => ({
    name,
    score,
    level,
    character,
    createdAt
  }));
}

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function readRanking(env) {
  const saved = await readJson(env, rankingKey, null);
  return saved && Array.isArray(saved.entries)
    ? { sessions: [], ...saved }
    : { entries: [], sessions: [], updatedAt: null };
}

async function writeRanking(env, data) {
  data.updatedAt = new Date().toISOString();
  await writeJson(env, rankingKey, data);
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return apiOptions();
  if (request.method === 'POST' && !isSameOrigin(request)) {
    return apiJson({ ok: false, error: 'Origem não autorizada.' }, 403);
  }

  let data;
  try {
    data = await readRanking(env);
  } catch (error) {
    const configurationError = error instanceof Error && error.message === 'BE_DATA_NOT_CONFIGURED';
    return apiJson({
      ok: false,
      error: configurationError
        ? 'Armazenamento BE_DATA ainda não vinculado.'
        : 'Ranking temporariamente indisponível.'
    }, 503);
  }

  if (request.method === 'GET') {
    return apiJson({
      ok: true,
      ranking: publicEntries(data.entries),
      updatedAt: data.updatedAt
    });
  }
  if (request.method !== 'POST') {
    return apiJson({ ok: false, error: 'Método não permitido.' }, 405);
  }
  const input = await parseBody(request);
  const name = clean(input.name) || 'Atleta BE';
  const deviceId = clean(input.deviceId, 64);

  if (input.action === 'start') {
    if (!deviceId) return apiJson({ ok: false, error: 'Aparelho inválido.' }, 400);
    const token = crypto.randomUUID();
    const now = Date.now();
    data.sessions = [
      ...(data.sessions || []).filter(session => now - session.startedAt < 10_800_000),
      { token, deviceId, startedAt: now }
    ].slice(-1000);
    await writeRanking(env, data);
    return apiJson({ ok: true, runToken: token, startedAt: now });
  }

  const score = Math.floor(Number(input.score));
  const level = Math.floor(Number(input.level));
  const character = Math.floor(Number(input.character) || 0);
  if (
    !deviceId
    || !Number.isFinite(score)
    || score < 0
    || score > 1_000_000
    || !Number.isFinite(level)
    || level < 1
    || level > 100
  ) {
    return apiJson({ ok: false, error: 'Resultado inválido.' }, 400);
  }
  if (score > level * 10_000) {
    return apiJson({ ok: false, error: 'Pontuação incompatível com a fase.' }, 400);
  }

  const runToken = clean(input.runToken, 64);
  const session = (data.sessions || []).find(item =>
    item.token === runToken && item.deviceId === deviceId
  );
  const elapsed = session ? Date.now() - session.startedAt : 0;
  if (!session || elapsed < 3000 || elapsed > 10_800_000) {
    return apiJson({ ok: false, error: 'Partida não validada.' }, 403);
  }
  if (score > Math.floor(elapsed / 1000) * 200 + 500) {
    return apiJson({ ok: false, error: 'Pontuação incompatível com o tempo de partida.' }, 400);
  }

  const now = Date.now();
  const key = `${deviceId}:${name.toLowerCase()}`;
  const previous = data.entries.find(entry => entry.key === key);
  if (previous && now - new Date(previous.submittedAt || 0).getTime() < 4000) {
    return apiJson({ ok: false, error: 'Aguarde antes de enviar novamente.' }, 429);
  }

  const entry = {
    key,
    name,
    score,
    level,
    character: Math.max(0, Math.min(5, character)),
    createdAt: previous?.createdAt || new Date().toISOString(),
    submittedAt: new Date().toISOString()
  };
  data.entries = [
    ...data.entries.filter(item => item.key !== key),
    previous && previous.score > score ? previous : entry
  ].sort((first, second) =>
    second.score - first.score || second.level - first.level
  ).slice(0, 500);
  data.sessions = (data.sessions || []).filter(item => item.token !== runToken);
  await writeRanking(env, data);

  return apiJson({
    ok: true,
    ranking: publicEntries(data.entries),
    position: data.entries.findIndex(item => item.key === key) + 1,
    updatedAt: data.updatedAt
  });
}
