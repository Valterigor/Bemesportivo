import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const MAX_BODY_BYTES = 20_000;
const REPORT_HIDE_THRESHOLD = 3;
const COMMUNITY_RETENTION_MS = 1000 * 60 * 60 * 24 * 730;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function json(statusCode, payload){
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders
    }
  });
}

function getDefaultCommunityState(){
  return {
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    votes: {
      'craque-brasil-haiti-2026': {
        totals: {
          'vinicius-jr': 0,
          raphinha: 0,
          'lucas-paqueta': 0,
          'bruno-guimaraes': 0,
          marquinhos: 0
        },
        choices: {}
      },
      'beplay-reaction-l7iavqreuja': { totals: { like: 0, dislike: 0 }, choices: {} },
      'beplay-reaction-gbkon6lc2ou': { totals: { like: 0, dislike: 0 }, choices: {} },
      'beplay-reaction-qi1lrw18kvm': { totals: { like: 0, dislike: 0 }, choices: {} },
      'beplay-reaction-dyix4fvxgg8': { totals: { like: 0, dislike: 0 }, choices: {} }
    },
    comments: {},
    palpites: { history: [] },
    interactions: [],
    rateLimits: {}
  };
}

function cleanText(value, limit){
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function cleanId(value, fallback = 'item'){
  const cleaned = cleanText(value, 120).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

function getCommunityCommentKey(scope, id){
  return `${cleanId(scope, 'geral')}:${cleanId(id, 'item')}`;
}

function publicComment(comment){
  const likedBy = comment?.likedBy && typeof comment.likedBy === 'object' ? comment.likedBy : {};
  const replies = Array.isArray(comment?.replies) ? comment.replies : [];
  return {
    id: comment.id,
    name: comment.name,
    team: comment.team || '',
    text: comment.text,
    createdAt: comment.createdAt,
    likes: Object.keys(likedBy).length,
    replies: replies.map(reply => ({
      id: reply.id,
      name: reply.name,
      text: reply.text,
      createdAt: reply.createdAt
    }))
  };
}

function publicComments(comments){
  return (Array.isArray(comments) ? comments : [])
    .filter(comment => !comment?.hiddenAt && (Array.isArray(comment?.reports) ? comment.reports.length : 0) < REPORT_HIDE_THRESHOLD)
    .map(publicComment);
}

function containsPrivateContact(value){
  const text = String(value || '');
  return /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(text) || /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}/.test(text);
}

function isAllowedWriteOrigin(request){
  const origin = request.headers.get('origin');
  if(!origin) return true;
  const allowed = new Set([
    new URL(request.url).origin,
    'https://bemesportivo.com',
    'https://www.bemesportivo.com',
    'http://localhost:3100',
    'http://127.0.0.1:3100'
  ]);
  return allowed.has(origin);
}

function requestFingerprint(request, clientId = ''){
  const forwarded = request.headers.get('x-nf-client-connection-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]
    || 'unknown';
  const secret = process.env.COMMUNITY_RATE_LIMIT_SECRET || process.env.NETLIFY_SITE_ID || 'bem-esportivo-community';
  return createHash('sha256').update(`${secret}:${forwarded}:${cleanId(clientId, 'device')}`).digest('hex').slice(0, 32);
}

function consumeRateLimit(state, key, action, limit, windowMs){
  const now = Date.now();
  const rateLimits = state.rateLimits && typeof state.rateLimits === 'object' ? state.rateLimits : {};
  const bucketKey = `${action}:${key}`;
  const recent = (Array.isArray(rateLimits[bucketKey]) ? rateLimits[bucketKey] : [])
    .map(Number)
    .filter(timestamp => Number.isFinite(timestamp) && now - timestamp < windowMs);
  if(recent.length >= limit){
    state.rateLimits = rateLimits;
    return false;
  }
  rateLimits[bucketKey] = [...recent, now];
  const activeEntries = Object.entries(rateLimits)
    .filter(([, timestamps]) => Array.isArray(timestamps) && timestamps.some(timestamp => now - Number(timestamp) < 86_400_000))
    .slice(-1500);
  state.rateLimits = Object.fromEntries(activeEntries);
  return true;
}

function validateAdultParticipation(body){
  return body?.adultConfirmed === true;
}

function pruneCommunityState(state){
  const cutoff = Date.now() - COMMUNITY_RETENTION_MS;
  Object.keys(state.comments || {}).forEach(key => {
    state.comments[key] = (Array.isArray(state.comments[key]) ? state.comments[key] : [])
      .filter(comment => {
        const created = new Date(comment?.createdAt || 0).getTime();
        return !Number.isFinite(created) || created >= cutoff;
      })
      .slice(-250);
  });
  return state;
}

function publicInteraction(interaction){
  return {
    id: interaction.id,
    type: interaction.type,
    target: interaction.target,
    value: interaction.value,
    createdAt: interaction.createdAt
  };
}

function publicInteractions(interactions){
  return (Array.isArray(interactions) ? interactions : []).map(publicInteraction);
}

function publicPalpites(palpites){
  return {
    history: (Array.isArray(palpites?.history) ? palpites.history : []).map(item => ({
      matchId: item.matchId,
      userName: item.userName || '',
      userTeam: item.userTeam || '',
      userCity: item.userCity || '',
      home: item.home || '',
      away: item.away || '',
      group: item.group || '',
      venue: item.venue || '',
      player: item.player || '',
      homeScore: item.homeScore,
      awayScore: item.awayScore,
      confidence: item.confidence,
      updatedAt: item.updatedAt
    }))
  };
}

function publicCommunityState(state){
  const publicVotes = {};
  Object.entries(state.votes || {}).forEach(([pollId, poll]) => {
    publicVotes[pollId] = { totals: poll?.totals || {} };
  });

  return {
    ok: true,
    updatedAt: state.updatedAt,
    votes: publicVotes,
    comments: Object.fromEntries(Object.entries(state.comments || {}).map(([key, comments]) => [key, publicComments(comments)])),
    palpites: publicPalpites(state.palpites),
    interactions: publicInteractions(state.interactions)
  };
}

async function readState(){
  const store = getCommunityStore();
  const saved = await store.get('state', { type: 'json', consistency: 'strong' });
  return pruneCommunityState({
    ...getDefaultCommunityState(),
    ...(saved && typeof saved === 'object' ? saved : {})
  });
}

async function writeState(state){
  state.updatedAt = new Date().toISOString();
  const store = getCommunityStore();
  await store.setJSON('state', state);
}

function getCommunityStore(){
  return getStore({
    name: 'bem-esportivo-community',
    consistency: 'strong',
    ...(getStoreOptions() || {})
  });
}

function getStoreOptions(){
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  return siteID && token ? { siteID, token } : undefined;
}

function getApiPath(request){
  const raw = new URL(request.url).pathname;
  return raw
    .replace(/^\/api\/community\/?/, '')
    .replace(/^\/\.netlify\/functions\/community\/?/, '')
    .replace(/^\/+/, '')
    .split('/')[0];
}

async function parseBody(request){
  try{
    const announcedSize = Number(request.headers.get('content-length') || 0);
    if(announcedSize > MAX_BODY_BYTES) throw new Error('payload-too-large');
    const raw = await request.text();
    if(raw.length > MAX_BODY_BYTES) throw new Error('payload-too-large');
    return raw ? JSON.parse(raw) : {};
  }catch(error){
    return { __invalid: true };
  }
}

export default async function handler(request){
  if(request.method === 'OPTIONS'){
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const action = getApiPath(request);
  if(request.method === 'POST' && !isAllowedWriteOrigin(request)){
    return json(403, { ok: false, error: 'Origem não permitida.' });
  }
  const params = new URL(request.url).searchParams;
  let state;
  try{
    state = await readState();
  }catch(error){
    console.error('Falha ao acessar o armazenamento comunitario:', error);
    return json(503, { ok: false, error: 'Comentarios temporariamente indisponiveis.' });
  }

  if(request.method === 'GET' && action === 'state'){
    return json(200, publicCommunityState(state));
  }

  if(request.method === 'GET' && action === 'comments'){
    const key = getCommunityCommentKey(params.get('scope'), params.get('id'));
    return json(200, { ok: true, comments: publicComments(state.comments[key] || []), updatedAt: state.updatedAt });
  }

  if(request.method === 'POST' && action === 'comment'){
    const body = await parseBody(request);
    if(body.__invalid) return json(400, { ok: false, error: 'Conteúdo inválido ou muito grande.' });
    if(body.website) return json(200, { ok: true, comments: [] });
    if(!validateAdultParticipation(body)) return json(403, { ok: false, error: 'A participação comunitária está disponível somente para maiores de 18 anos.' });
    const fingerprint = requestFingerprint(request, body.clientId);
    if(!consumeRateLimit(state, fingerprint, 'comment-10m', 5, 600_000)
      || !consumeRateLimit(state, fingerprint, 'comment-day', 20, 86_400_000)){
      return json(429, { ok: false, error: 'Limite de publicações atingido. Aguarde antes de tentar novamente.' });
    }
    const key = getCommunityCommentKey(body.scope, body.id);
    const text = cleanText(body.text || body.texto, 500);
    if(!text) return json(400, { ok: false, error: 'Comentario vazio.' });
    if(containsPrivateContact(text)) return json(400, { ok: false, error: 'Não publique telefone ou e-mail. Use o canal de contato privado do site.' });

    const comment = {
      id: `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: cleanText(body.name || body.nome || 'Visitante', 40) || 'Visitante',
      team: cleanText(body.team || body.time || '', 40),
      text,
      createdAt: new Date().toISOString(),
      likedBy: {},
      replies: [],
      reports: []
    };
    state.comments[key] = [...(state.comments[key] || []), comment].slice(-250);
    await writeState(state);
    return json(200, { ok: true, comments: publicComments(state.comments[key]), comment: publicComment(comment), updatedAt: state.updatedAt });
  }

  if(request.method === 'POST' && action === 'comment-action'){
    const body = await parseBody(request);
    if(body.__invalid) return json(400, { ok: false, error: 'Conteúdo inválido ou muito grande.' });
    const key = getCommunityCommentKey(body.scope, body.id);
    const comments = Array.isArray(state.comments[key]) ? state.comments[key] : [];
    const comment = comments.find(item => item.id === cleanText(body.commentId, 120));
    const actionId = cleanId(body.action, '');
    const clientId = cleanId(body.clientId, '');
    if(!comment || !actionId || !clientId) return json(400, { ok: false, error: 'Acao de comentario invalida.' });
    const fingerprint = requestFingerprint(request, clientId);
    if(!consumeRateLimit(state, fingerprint, 'comment-action', 30, 600_000)){
      return json(429, { ok: false, error: 'Muitas ações em pouco tempo. Aguarde e tente novamente.' });
    }

    if(actionId === 'like'){
      comment.likedBy = comment.likedBy && typeof comment.likedBy === 'object' ? comment.likedBy : {};
      if(comment.likedBy[clientId]){
        delete comment.likedBy[clientId];
      }else{
        comment.likedBy[clientId] = true;
      }
    }else if(actionId === 'reply'){
      if(!validateAdultParticipation(body)) return json(403, { ok: false, error: 'A participação comunitária está disponível somente para maiores de 18 anos.' });
      const text = cleanText(body.text || body.texto, 400);
      if(!text) return json(400, { ok: false, error: 'Resposta vazia.' });
      if(containsPrivateContact(text)) return json(400, { ok: false, error: 'Não publique telefone ou e-mail. Use o canal de contato privado do site.' });
      comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
      comment.replies = [
        ...comment.replies,
        {
          id: `reply-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: cleanText(body.name || body.nome || 'Visitante', 40) || 'Visitante',
          text,
          createdAt: new Date().toISOString()
        }
      ].slice(-50);
    }else if(actionId === 'report'){
      comment.reports = Array.isArray(comment.reports) ? comment.reports : [];
      if(!comment.reports.includes(fingerprint)) comment.reports.push(fingerprint);
      if(comment.reports.length >= REPORT_HIDE_THRESHOLD){
        comment.hiddenAt = comment.hiddenAt || new Date().toISOString();
        comment.hiddenReason = 'reports-threshold';
      }
    }else{
      return json(400, { ok: false, error: 'Acao desconhecida.' });
    }

    state.comments[key] = comments;
    await writeState(state);
    return json(200, { ok: true, comments: publicComments(comments), comment: comment.hiddenAt ? null : publicComment(comment), updatedAt: state.updatedAt });
  }

  if(request.method === 'POST' && action === 'vote'){
    const body = await parseBody(request);
    if(body.__invalid) return json(400, { ok: false, error: 'Conteúdo inválido ou muito grande.' });
    const pollId = cleanId(body.pollId, 'poll');
    const choiceId = cleanId(body.choiceId, '');
    const clientId = cleanId(body.clientId, '');
    if(!choiceId || !clientId) return json(400, { ok: false, error: 'Voto invalido.' });
    const fingerprint = requestFingerprint(request, clientId);
    if(!consumeRateLimit(state, fingerprint, 'vote', 60, 600_000)){
      return json(429, { ok: false, error: 'Muitos votos em pouco tempo. Aguarde e tente novamente.' });
    }

    const poll = state.votes[pollId] || { totals: {}, choices: {} };
    const previous = poll.choices[fingerprint];
    if(previous && previous !== choiceId){
      poll.totals[previous] = Math.max(0, Number(poll.totals[previous] || 0) - 1);
    }
    if(previous !== choiceId){
      poll.totals[choiceId] = Number(poll.totals[choiceId] || 0) + 1;
    }
    poll.choices[fingerprint] = choiceId;
    state.votes[pollId] = poll;
    await writeState(state);
    return json(200, { ok: true, pollId, vote: { totals: poll.totals, selected: choiceId }, updatedAt: state.updatedAt });
  }

  if(request.method === 'POST' && action === 'palpite'){
    const body = await parseBody(request);
    if(body.__invalid) return json(400, { ok: false, error: 'Conteúdo inválido ou muito grande.' });
    const item = body.palpite || body;
    const matchId = cleanText(item.matchId, 120);
    const userId = cleanText(item.userId, 120);
    if(!matchId || !userId) return json(400, { ok: false, error: 'Palpite invalido.' });
    const fingerprint = requestFingerprint(request, userId);
    if(!consumeRateLimit(state, fingerprint, 'palpite', 20, 600_000)){
      return json(429, { ok: false, error: 'Muitos palpites em pouco tempo. Aguarde e tente novamente.' });
    }

    const participantId = requestFingerprint(request, userId);
    const cleanPalpite = {
      matchId,
      participantId,
      userName: cleanText(item.userName, 40),
      userTeam: cleanText(item.userTeam, 40),
      userCity: cleanText(item.userCity, 40),
      home: cleanText(item.home, 80),
      away: cleanText(item.away, 80),
      group: cleanText(item.group, 20),
      venue: cleanText(item.venue, 120),
      player: cleanText(item.player, 80),
      homeScore: Math.max(0, Math.min(15, Number(item.homeScore) || 0)),
      awayScore: Math.max(0, Math.min(15, Number(item.awayScore) || 0)),
      confidence: Math.max(10, Math.min(100, Number(item.confidence) || 50)),
      updatedAt: new Date().toISOString()
    };
    const history = Array.isArray(state.palpites?.history) ? state.palpites.history : [];
    const withoutSame = history.filter(saved => !((saved.participantId === participantId || saved.userId === userId) && saved.matchId === matchId));
    withoutSame.push(cleanPalpite);
    state.palpites = { history: withoutSame.slice(-500) };
    await writeState(state);
    return json(200, { ok: true, palpites: publicPalpites(state.palpites), updatedAt: state.updatedAt });
  }

  if(request.method === 'POST' && action === 'interaction'){
    const body = await parseBody(request);
    if(body.__invalid) return json(400, { ok: false, error: 'Conteúdo inválido ou muito grande.' });
    const type = cleanText(body.type, 40);
    const target = cleanText(body.target, 120);
    const value = cleanText(body.value, 120);
    const clientId = cleanText(body.clientId, 120);
    if(!type || !target || !value || !clientId) return json(400, { ok: false, error: 'Interacao invalida.' });
    const fingerprint = requestFingerprint(request, clientId);
    if(!consumeRateLimit(state, fingerprint, 'interaction', 60, 600_000)){
      return json(429, { ok: false, error: 'Muitas interações em pouco tempo. Aguarde e tente novamente.' });
    }

    const previousInteractions = Array.isArray(state.interactions) ? state.interactions : [];
    const withoutSameClientChoice = previousInteractions.filter(item => (
      item.type !== type ||
      item.target !== target ||
      item.clientId !== clientId
    ));

    state.interactions = [
      ...withoutSameClientChoice,
      {
        id: `interaction-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        target,
        value,
        clientId,
        createdAt: new Date().toISOString()
      }
    ].slice(-1000);
    await writeState(state);
    return json(200, { ok: true, interactions: publicInteractions(state.interactions), updatedAt: state.updatedAt });
  }

  return json(404, { ok: false, error: 'API nao encontrada.' });
}
