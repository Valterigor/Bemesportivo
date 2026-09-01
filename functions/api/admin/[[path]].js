import { getDataStore, readJson, writeJson } from '../../../server/cloudflare-kv.mjs';

const encoder = new TextEncoder();
const maximumBodyBytes = 8_000;

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function sameSecret(first, second) {
  const [left, right] = await Promise.all([digest(first), digest(second)]);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function authorize(request, env) {
  const configured = String(env?.BE_ADMIN_TOKEN || '');
  if (configured.length < 32) return { ok: false, status: 503, error: 'Painel ainda não configurado no servidor.' };
  const supplied = String(request.headers.get('x-be-admin-token') || '');
  if (!supplied || !(await sameSecret(supplied, configured))) {
    return { ok: false, status: 401, error: 'Acesso administrativo não autorizado.' };
  }
  return { ok: true };
}

function allowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function parseBody(request) {
  if (Number(request.headers.get('content-length') || 0) > maximumBodyBytes) return null;
  const raw = await request.text();
  if (raw.length > maximumBodyBytes) return null;
  try { return raw ? JSON.parse(raw) : {}; } catch { return null; }
}

async function countPrefix(store, prefix, maximumPages = 10) {
  let count = 0;
  let cursor;
  let complete = false;
  for (let page = 0; page < maximumPages && !complete; page += 1) {
    const result = await store.list({ prefix, cursor, limit: 1000 });
    count += Array.isArray(result.keys) ? result.keys.length : 0;
    complete = Boolean(result.list_complete);
    cursor = result.cursor;
    if (!cursor) complete = true;
  }
  return { count, complete };
}

async function summarizeAnalytics(store) {
  const listed = await store.list({ prefix: 'analytics-summary:', limit: 100 });
  const records = await Promise.all((listed.keys || []).map(key => store.get(key.name, { type: 'json' })));
  const events = {};
  let total = 0;
  for (const record of records.filter(Boolean)) {
    total += Number(record.total || 0);
    for (const [name, count] of Object.entries(record.events || {})) {
      events[name] = Number(events[name] || 0) + Number(count || 0);
    }
  }
  return {
    days: records.filter(Boolean).length,
    total,
    byName: Object.entries(events)
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
      .map(([name, count]) => ({ name, count }))
  };
}

function summarizeCommunity(state) {
  const moderation = [];
  let comments = 0;
  let replies = 0;
  let hidden = 0;
  let reported = 0;
  for (const [channel, entries] of Object.entries(state?.comments || {})) {
    for (const comment of Array.isArray(entries) ? entries : []) {
      comments += 1;
      replies += Array.isArray(comment.replies) ? comment.replies.length : 0;
      const reportCount = Array.isArray(comment.reports) ? comment.reports.length : 0;
      if (comment.hiddenAt) hidden += 1;
      if (reportCount) reported += 1;
      if (reportCount || comment.hiddenAt) {
        moderation.push({
          channel,
          id: String(comment.id || ''),
          name: String(comment.name || 'Visitante').slice(0, 40),
          text: String(comment.text || '').slice(0, 500),
          createdAt: comment.createdAt || null,
          reportCount,
          hidden: Boolean(comment.hiddenAt),
          hiddenReason: comment.hiddenReason || ''
        });
      }
    }
  }
  moderation.sort((first, second) => second.reportCount - first.reportCount || String(second.createdAt).localeCompare(String(first.createdAt)));
  return { comments, replies, hidden, reported, moderation: moderation.slice(0, 100), updatedAt: state?.updatedAt || null };
}

async function summarizePublicProfiles(store) {
  const result = await store.list({ prefix: 'public-profile:', limit: 200 });
  const records = await Promise.all((result.keys || []).map(key => store.get(key.name, { type: 'json' })));
  const moderation = [];
  let profiles = 0;
  let approvedProfiles = 0;
  let posts = 0;
  let pending = 0;
  for (const record of records.filter(Boolean)) {
    profiles += 1;
    const profileVisible = ['published', 'approved'].includes(record.profileStatus);
    const profileReportCount = Array.isArray(record.reports) ? record.reports.length : 0;
    if (profileVisible) approvedProfiles += 1;
    if (['hidden', 'pending'].includes(record.profileStatus) || profileReportCount) pending += 1;
    moderation.push({
      type: 'public-profile', channel: 'Perfil público', id: record.slug,
      name: record.profile?.displayName || 'Pessoa',
      text: `${record.profile?.age || '—'} anos · ${record.profile?.profession || 'Profissão não informada'} · ${record.profile?.favoriteSport || 'Esporte não informado'} · ${record.profile?.bio || 'Sem apresentação'}`,
      createdAt: record.updatedAt, reportCount: profileReportCount, hidden: record.profileStatus === 'hidden',
      pending: record.profileStatus === 'pending', disabled: record.profileStatus === 'disabled', published: profileVisible, hasImage: Boolean(record.profile?.photoDataUrl)
    });
    for (const post of Array.isArray(record.posts) ? record.posts : []) {
      posts += 1;
      const reportCount = Array.isArray(post.reports) ? post.reports.length : 0;
      const postVisible = ['published', 'approved'].includes(post.status);
      if (!postVisible || reportCount) pending += 1;
      moderation.push({
        type: 'public-post', channel: `Publicação · ${post.kind || 'texto'}`, id: post.id,
        profileId: record.slug, name: record.profile?.displayName || 'Pessoa', text: post.text || '',
        createdAt: post.createdAt, reportCount, hidden: post.status === 'hidden', pending: post.status === 'pending',
        published: postVisible, hasImage: Boolean(post.imageDataUrl), videoId: post.videoId || ''
      });
    }
  }
  moderation.sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)));
  return { profiles, approvedProfiles, posts, pending, moderation };
}

async function overview(env) {
  const store = getDataStore(env);
  const [community, ranking, sync, notifications, analyticsBatches, analyticsSummary, publicProfiles] = await Promise.all([
    readJson(env, 'community:state', { comments: {}, updatedAt: null }),
    readJson(env, 'game:ranking', { entries: [], updatedAt: null }),
    countPrefix(store, 'sync:'),
    countPrefix(store, 'routine:install:'),
    countPrefix(store, 'analytics:'),
    summarizeAnalytics(store),
    summarizePublicProfiles(store)
  ]);
  const communitySummary = summarizeCommunity(community);
  communitySummary.moderation = [...publicProfiles.moderation, ...communitySummary.moderation].slice(0, 150);
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    community: communitySummary,
    publicProfiles,
    services: {
      continuity: sync,
      notifications,
      analytics: {
        ...analyticsBatches,
        ...analyticsSummary,
        count: analyticsBatches.count
      },
      ranking: {
        count: Array.isArray(ranking?.entries) ? ranking.entries.length : 0,
        updatedAt: ranking?.updatedAt || null
      }
    }
  };
}

async function moderate(env, body) {
  const channel = String(body?.channel || '');
  const commentId = String(body?.commentId || '');
  const action = String(body?.action || '');
  if (!/^[a-z0-9:_-]{1,240}$/.test(channel) || !/^[A-Za-z0-9:_-]{1,160}$/.test(commentId)) {
    return { status: 400, payload: { error: 'Comentário inválido.' } };
  }
  if (!['hide', 'restore', 'delete'].includes(action)) {
    return { status: 400, payload: { error: 'Ação de moderação inválida.' } };
  }
  const state = await readJson(env, 'community:state', { comments: {} });
  const comments = Array.isArray(state?.comments?.[channel]) ? state.comments[channel] : [];
  const index = comments.findIndex(comment => comment?.id === commentId);
  if (index < 0) return { status: 404, payload: { error: 'Comentário não encontrado.' } };

  if (action === 'delete') comments.splice(index, 1);
  if (action === 'hide') {
    comments[index].hiddenAt = new Date().toISOString();
    comments[index].hiddenReason = 'manual-moderation';
  }
  if (action === 'restore') {
    delete comments[index].hiddenAt;
    delete comments[index].hiddenReason;
    comments[index].reports = [];
  }
  state.comments[channel] = comments;
  state.updatedAt = new Date().toISOString();
  await Promise.all([
    writeJson(env, 'community:state', state),
    writeJson(env, `admin:audit:${state.updatedAt}:${crypto.randomUUID()}`, {
      schemaVersion: 1,
      action,
      target: { channel, commentId },
      createdAt: state.updatedAt
    }, { expirationTtl: 60 * 60 * 24 * 365 })
  ]);
  return { status: 200, payload: { ok: true, action, updatedAt: state.updatedAt } };
}

async function moderatePublic(env, body) {
  const type = String(body?.type || '');
  const profileId = String(body?.profileId || body?.targetId || '');
  const itemId = String(body?.itemId || '');
  const action = String(body?.action || '');
  if (!/^be-[a-f0-9]{12}$/.test(profileId) || !['approve', 'hide', 'restore', 'delete'].includes(action)) {
    return { status: 400, payload: { error: 'Item público inválido.' } };
  }
  const key = `public-profile:${profileId}`;
  const record = await readJson(env, key, null);
  if (!record) return { status: 404, payload: { error: 'Perfil público não encontrado.' } };
  if (type === 'public-profile') {
    if (action === 'delete') await getDataStore(env).delete(key);
    else {
      record.profileStatus = action === 'approve' || action === 'restore' ? 'published' : 'hidden';
      if (action === 'restore') record.reports = [];
      record.updatedAt = new Date().toISOString();
      await writeJson(env, key, record);
    }
  } else if (type === 'public-post') {
    const index = (record.posts || []).findIndex(post => post.id === itemId);
    if (index < 0) return { status: 404, payload: { error: 'Publicação não encontrada.' } };
    if (action === 'delete') record.posts.splice(index, 1);
    else {
      record.posts[index].status = action === 'approve' || action === 'restore' ? 'published' : 'hidden';
      if (action === 'restore') record.posts[index].reports = [];
      record.posts[index].updatedAt = new Date().toISOString();
    }
    record.updatedAt = new Date().toISOString();
    await writeJson(env, key, record);
  } else return { status: 400, payload: { error: 'Tipo de moderação inválido.' } };
  const now = new Date().toISOString();
  await writeJson(env, `admin:audit:${now}:${crypto.randomUUID()}`, {
    schemaVersion: 1, action, target: { type, profileId, itemId }, createdAt: now
  }, { expirationTtl: 60 * 60 * 24 * 365 });
  return { status: 200, payload: { ok: true, action, updatedAt: now } };
}

async function publicMedia(env, url) {
  const profileId = String(url.searchParams.get('profileId') || '');
  const itemId = String(url.searchParams.get('itemId') || '');
  const type = String(url.searchParams.get('type') || '');
  if (!/^be-[a-f0-9]{12}$/.test(profileId)) return { status: 400, payload: { error: 'Perfil inválido.' } };
  const record = await readJson(env, `public-profile:${profileId}`, null);
  if (!record) return { status: 404, payload: { error: 'Perfil não encontrado.' } };
  const imageDataUrl = type === 'public-profile'
    ? record.profile?.photoDataUrl || ''
    : (record.posts || []).find(post => post.id === itemId)?.imageDataUrl || '';
  return imageDataUrl
    ? { status: 200, payload: { ok: true, imageDataUrl } }
    : { status: 404, payload: { error: 'Imagem não encontrada.' } };
}

export async function onRequest({ request, env, params }) {
  if (!allowedOrigin(request)) return response({ error: 'Origem não autorizada.' }, 403);
  const authorization = await authorize(request, env);
  if (!authorization.ok) return response({ error: authorization.error }, authorization.status);

  const action = Array.isArray(params?.path) ? params.path[0] : String(params?.path || '').split('/')[0];
  try {
    if (request.method === 'GET' && (!action || action === 'overview')) return response(await overview(env));
    if (request.method === 'GET' && action === 'media') {
      const result = await publicMedia(env, new URL(request.url));
      return response(result.payload, result.status);
    }
    if (request.method === 'POST' && action === 'moderate') {
      const body = await parseBody(request);
      if (!body) return response({ error: 'Conteúdo inválido ou muito grande.' }, 400);
      const result = String(body.type || '').startsWith('public-') ? await moderatePublic(env, body) : await moderate(env, body);
      return response(result.payload, result.status);
    }
    return response({ error: 'Rota administrativa não encontrada.' }, 404);
  } catch (error) {
    const configurationError = error instanceof Error && error.message === 'BE_DATA_NOT_CONFIGURED';
    return response({
      error: configurationError ? 'Armazenamento administrativo ainda não configurado.' : 'Painel temporariamente indisponível.'
    }, 503);
  }
}
