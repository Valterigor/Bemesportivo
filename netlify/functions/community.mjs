import { getStore } from '@netlify/blobs';

const MEMORY_STATE_KEY = '__bemEsportivoCommunityState';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function json(statusCode, payload){
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders
    },
    body: JSON.stringify(payload)
  };
}

function getDefaultCommunityState(){
  return {
    schemaVersion: 1,
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
    interactions: []
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
  const reports = Array.isArray(comment?.reports) ? comment.reports : [];
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
    })),
    reports: reports.length
  };
}

function publicComments(comments){
  return (Array.isArray(comments) ? comments : []).map(publicComment);
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
    palpites: state.palpites
  };
}

async function readState(){
  try{
    const store = getStore('bem-esportivo-community', getStoreOptions());
    const saved = await store.get('state', { type: 'json' });
    return {
      ...getDefaultCommunityState(),
      ...(saved && typeof saved === 'object' ? saved : {})
    };
  }catch(error){
    globalThis[MEMORY_STATE_KEY] = {
      ...getDefaultCommunityState(),
      ...(globalThis[MEMORY_STATE_KEY] && typeof globalThis[MEMORY_STATE_KEY] === 'object' ? globalThis[MEMORY_STATE_KEY] : {})
    };
    return globalThis[MEMORY_STATE_KEY];
  }
}

async function writeState(state){
  state.updatedAt = new Date().toISOString();
  try{
    const store = getStore('bem-esportivo-community', getStoreOptions());
    await store.setJSON('state', state);
  }catch(error){
    globalThis[MEMORY_STATE_KEY] = state;
  }
}

function getStoreOptions(){
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  return siteID && token ? { siteID, token } : undefined;
}

function getApiPath(event){
  const raw = event.path || '';
  return raw
    .replace(/^\/api\/community\/?/, '')
    .replace(/^\/\.netlify\/functions\/community\/?/, '')
    .replace(/^\/+/, '')
    .split('/')[0];
}

function parseBody(event){
  if(!event.body) return {};
  try{
    return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
  }catch(error){
    return {};
  }
}

export async function handler(event){
  if(event.httpMethod === 'OPTIONS'){
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  const action = getApiPath(event);
  const params = new URLSearchParams(event.rawQuery || '');
  const state = await readState();

  if(event.httpMethod === 'GET' && action === 'state'){
    return json(200, publicCommunityState(state));
  }

  if(event.httpMethod === 'GET' && action === 'comments'){
    const key = getCommunityCommentKey(params.get('scope'), params.get('id'));
    return json(200, { ok: true, comments: publicComments(state.comments[key] || []), updatedAt: state.updatedAt });
  }

  if(event.httpMethod === 'POST' && action === 'comment'){
    const body = parseBody(event);
    const key = getCommunityCommentKey(body.scope, body.id);
    const text = cleanText(body.text || body.texto, 500);
    if(!text) return json(400, { ok: false, error: 'Comentario vazio.' });

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
    state.comments[key] = [...(state.comments[key] || []), comment].slice(-100);
    await writeState(state);
    return json(200, { ok: true, comments: publicComments(state.comments[key]), comment: publicComment(comment), updatedAt: state.updatedAt });
  }

  if(event.httpMethod === 'POST' && action === 'comment-action'){
    const body = parseBody(event);
    const key = getCommunityCommentKey(body.scope, body.id);
    const comments = Array.isArray(state.comments[key]) ? state.comments[key] : [];
    const comment = comments.find(item => item.id === cleanText(body.commentId, 120));
    const actionId = cleanId(body.action, '');
    const clientId = cleanId(body.clientId, '');
    if(!comment || !actionId || !clientId) return json(400, { ok: false, error: 'Acao de comentario invalida.' });

    if(actionId === 'like'){
      comment.likedBy = comment.likedBy && typeof comment.likedBy === 'object' ? comment.likedBy : {};
      if(comment.likedBy[clientId]){
        delete comment.likedBy[clientId];
      }else{
        comment.likedBy[clientId] = true;
      }
    }else if(actionId === 'report'){
      comment.reports = Array.isArray(comment.reports) ? comment.reports : [];
      if(!comment.reports.includes(clientId)) comment.reports.push(clientId);
    }else{
      return json(400, { ok: false, error: 'Acao desconhecida.' });
    }

    state.comments[key] = comments;
    await writeState(state);
    return json(200, { ok: true, comments: publicComments(comments), comment: publicComment(comment), updatedAt: state.updatedAt });
  }

  if(event.httpMethod === 'POST' && action === 'vote'){
    const body = parseBody(event);
    const pollId = cleanId(body.pollId, 'poll');
    const choiceId = cleanId(body.choiceId, '');
    const clientId = cleanId(body.clientId, '');
    if(!choiceId || !clientId) return json(400, { ok: false, error: 'Voto invalido.' });

    const poll = state.votes[pollId] || { totals: {}, choices: {} };
    const previous = poll.choices[clientId];
    if(previous && previous !== choiceId){
      poll.totals[previous] = Math.max(0, Number(poll.totals[previous] || 0) - 1);
    }
    if(previous !== choiceId){
      poll.totals[choiceId] = Number(poll.totals[choiceId] || 0) + 1;
    }
    poll.choices[clientId] = choiceId;
    state.votes[pollId] = poll;
    await writeState(state);
    return json(200, { ok: true, pollId, vote: { totals: poll.totals, selected: choiceId }, updatedAt: state.updatedAt });
  }

  return json(404, { ok: false, error: 'API nao encontrada.' });
}
