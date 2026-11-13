import { apiJson, apiOptions, isSameOrigin } from '../../server/cloudflare-api.mjs';
import { readJson, writeJson } from '../../server/cloudflare-kv.mjs';

const rankingKey = 'be-match:ranking:v1';
const MAX_PHASE_SCORE = 50_000;
const clean = (value, maximum = 16) => String(value || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, maximum);
const phaseResults = (value, maximumLevel, maximumValue) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const output = {};
  for (const [rawPhase, rawResult] of Object.entries(value)) {
    const phase = Number(rawPhase);
    const result = Number(rawResult);
    if (!Number.isInteger(phase) || phase < 1 || phase > maximumLevel || !Number.isInteger(result) || result < 0 || result > maximumValue) return null;
    if (result > 0) output[phase] = result;
  }
  return output;
};
const sumResults = results => Object.values(results).reduce((sum, value) => sum + value, 0);
const mergeBest = (previous = {}, incoming = {}) => Object.fromEntries([...new Set([...Object.keys(previous), ...Object.keys(incoming)])].map(phase => [phase, Math.max(Number(previous[phase] || 0), Number(incoming[phase] || 0))]).filter(([, value]) => value > 0));
const publicEntries = (entries, currentDeviceId = '') => entries.slice(0, 100).map(({ name, score, level, stars, deviceId, updatedAt }) => ({
  name, score, level, stars, updatedAt, isCurrent: Boolean(currentDeviceId && deviceId === currentDeviceId)
}));

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
  if (request.method === 'GET') {
    const currentDeviceId = clean(new URL(request.url).searchParams.get('deviceId'), 64);
    return apiJson({ ok: true, ranking: publicEntries(data.entries, currentDeviceId), updatedAt: data.updatedAt });
  }
  if (request.method !== 'POST') return apiJson({ ok: false, error: 'Método não permitido.' }, 405);
  let input = {};
  try { input = await request.json(); } catch {}
  const name = clean(input.name) || 'Atleta BE';
  const deviceId = clean(input.deviceId, 64);
  const score = Math.floor(Number(input.score));
  const level = Math.floor(Number(input.level));
  const stars = Math.floor(Number(input.stars));
  const best = phaseResults(input.best, level, MAX_PHASE_SCORE);
  const starsByLevel = phaseResults(input.starsByLevel, level, 3);
  const computedScore = best && sumResults(best);
  const computedStars = starsByLevel && sumResults(starsByLevel);
  const incompatibleStars = starsByLevel && Object.keys(starsByLevel).some(phase => !best?.[phase]);
  if (!deviceId || !Number.isFinite(level) || level < 1 || level > 100 || !best || !starsByLevel || incompatibleStars || score !== computedScore || stars !== computedStars || stars > Math.min(300, level * 3)) {
    return apiJson({ ok: false, error: 'Resultado inválido.' }, 400);
  }
  const previous = data.entries.find(entry => entry.deviceId === deviceId);
  const mergedBest = mergeBest(previous?.best, best);
  const mergedStars = mergeBest(previous?.starsByLevel, starsByLevel);
  const entry = {
    name,
    deviceId,
    best: mergedBest,
    starsByLevel: mergedStars,
    score: Math.max(sumResults(mergedBest), Number(previous?.score || 0)),
    level: Math.max(level, Number(previous?.level || 1)),
    stars: Math.max(sumResults(mergedStars), Number(previous?.stars || 0)),
    updatedAt: new Date().toISOString()
  };
  data.entries = [...data.entries.filter(item => item.deviceId !== deviceId), entry]
    .sort((a, b) => b.score - a.score || b.stars - a.stars || b.level - a.level)
    .slice(0, 500);
  data.updatedAt = entry.updatedAt;
  await writeJson(env, rankingKey, data);
  return apiJson({ ok: true, ranking: publicEntries(data.entries, deviceId), position: data.entries.findIndex(item => item.deviceId === deviceId) + 1, updatedAt: data.updatedAt });
}
