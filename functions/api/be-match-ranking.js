import { apiJson, apiOptions, isSameOrigin } from '../../server/cloudflare-api.mjs';
import { readJson, writeJson } from '../../server/cloudflare-kv.mjs';

const rankingKey = 'be-match:ranking:v1';
const clean = (value, maximum = 16) => String(value || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, maximum);
const publicEntries = entries => entries.slice(0, 100).map(({ name, score, level, stars, deviceId, updatedAt }) => ({ name, score, level, stars, deviceId, updatedAt }));

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return apiOptions();
  if (request.method === 'POST' && !isSameOrigin(request)) return apiJson({ ok: false, error: 'Origem não autorizada.' }, 403);
  let data;
  try {
    data = await readJson(env, rankingKey, { entries: [], updatedAt: null });
  } catch {
    return apiJson({ ok: false, error: 'Classificação temporariamente indisponível.' }, 503);
  }
  data = data && Array.isArray(data.entries) ? data : { entries: [], updatedAt: null };
  if (request.method === 'GET') return apiJson({ ok: true, ranking: publicEntries(data.entries), updatedAt: data.updatedAt });
  if (request.method !== 'POST') return apiJson({ ok: false, error: 'Método não permitido.' }, 405);
  let input = {};
  try { input = await request.json(); } catch {}
  const name = clean(input.name) || 'Atleta BE';
  const deviceId = clean(input.deviceId, 64);
  const score = Math.floor(Number(input.score));
  const level = Math.floor(Number(input.level));
  const stars = Math.floor(Number(input.stars));
  if (!deviceId || !Number.isFinite(score) || score < 0 || score > 100_000_000 || !Number.isFinite(level) || level < 1 || level > 100 || !Number.isFinite(stars) || stars < 0 || stars > 300) {
    return apiJson({ ok: false, error: 'Resultado inválido.' }, 400);
  }
  const previous = data.entries.find(entry => entry.deviceId === deviceId);
  const entry = {
    name,
    deviceId,
    score: Math.max(score, Number(previous?.score || 0)),
    level: Math.max(level, Number(previous?.level || 1)),
    stars: Math.max(stars, Number(previous?.stars || 0)),
    updatedAt: new Date().toISOString()
  };
  data.entries = [...data.entries.filter(item => item.deviceId !== deviceId), entry]
    .sort((a, b) => b.score - a.score || b.stars - a.stars || b.level - a.level)
    .slice(0, 500);
  data.updatedAt = entry.updatedAt;
  await writeJson(env, rankingKey, data);
  return apiJson({ ok: true, ranking: publicEntries(data.entries), position: data.entries.findIndex(item => item.deviceId === deviceId) + 1, updatedAt: data.updatedAt });
}
