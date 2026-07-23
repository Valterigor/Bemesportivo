import { getStore } from '@netlify/blobs';
import {
  MAX_VISUAL_REQUEST_BYTES,
  analyzeVisualImage,
  createSafetyIdentifier,
  parseVisualPayload
} from '../../server/visual-analysis.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://bemesportivo.com',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};
const memoryLimits = new Map();

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

function isAllowedOrigin(request) {
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

function getStoreOptions() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  return siteID && token ? { siteID, token } : undefined;
}

function getLimitStore() {
  return getStore({ name: 'bem-esportivo-visual-limits', consistency: 'strong', ...(getStoreOptions() || {}) });
}

async function consumeLimit(key, limit = 8, windowMs = 3_600_000) {
  const now = Date.now();
  let state = {};
  const store = getLimitStore();
  try {
    state = await store.get('state', { type: 'json', consistency: 'strong' }) || {};
  } catch (error) {
    state = Object.fromEntries(memoryLimits);
  }
  const activeState = Object.fromEntries(Object.entries(state)
    .map(([entryKey, timestamps]) => [entryKey, (Array.isArray(timestamps) ? timestamps : []).map(Number).filter(value => Number.isFinite(value) && now - value < windowMs)])
    .filter(([, timestamps]) => timestamps.length)
    .slice(-5_000));
  const active = activeState[key] || [];
  if (active.length >= limit) return false;
  activeState[key] = [...active, now];
  try { await store.setJSON('state', activeState); }
  catch (error) {
    memoryLimits.clear();
    Object.entries(activeState).forEach(([entryKey, timestamps]) => memoryLimits.set(entryKey, timestamps));
  }
  return true;
}

function requestIdentity(request) {
  return request.headers.get('x-nf-client-connection-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'anonymous';
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Método não permitido.' });
  if (!isAllowedOrigin(request)) return json(403, { ok: false, error: 'Origem não permitida.' });

  const announcedSize = Number(request.headers.get('content-length') || 0);
  if (announcedSize > MAX_VISUAL_REQUEST_BYTES) return json(413, { ok: false, error: 'A imagem ficou grande demais para análise.' });

  let rawBody;
  try { rawBody = await request.text(); }
  catch (error) { return json(400, { ok: false, error: 'Não foi possível ler a imagem.' }); }

  const payload = parseVisualPayload(rawBody);
  if (!payload.ok) return json(payload.status, { ok: false, error: payload.error });
  if (!process.env.OPENAI_API_KEY) {
    return json(503, { ok: false, code: 'vision_not_configured', error: 'A análise visual ainda não está disponível.' });
  }

  const secret = process.env.VISUAL_ANALYSIS_SECRET || process.env.COMMUNITY_RATE_LIMIT_SECRET || process.env.NETLIFY_SITE_ID || 'bem-esportivo-visual';
  const safetyIdentifier = createSafetyIdentifier(requestIdentity(request), secret);
  if (!await consumeLimit(safetyIdentifier)) {
    return json(429, { ok: false, error: 'Você atingiu o limite temporário de análises. Tente novamente mais tarde.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000);
  try {
    const analysis = await analyzeVisualImage({
      imageData: payload.imageData,
      context: payload.context,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_VISION_MODEL || 'gpt-5.6-luna',
      safetyIdentifier,
      signal: controller.signal
    });
    return json(200, { ok: true, analysis, imageStored: false });
  } catch (error) {
    if (error?.code === 'vision_not_configured') {
      return json(503, { ok: false, code: 'vision_not_configured', error: 'A análise visual ainda não está disponível.' });
    }
    if (error?.name === 'AbortError') return json(504, { ok: false, error: 'A análise demorou mais que o esperado. Tente novamente.' });
    if (error?.code === 'provider_rate_limit') return json(429, { ok: false, error: 'O serviço está muito ocupado agora. Tente novamente em alguns minutos.' });
    return json(502, { ok: false, error: 'Não foi possível analisar esta imagem agora. Tente novamente.' });
  } finally {
    clearTimeout(timeout);
  }
}
