import { connectLambda, getStore } from '@netlify/blobs';

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
    palpites: state.palpites,
    interactions: publicInteractions(state.interactions)
  };
}

async function readState(){
  const store = getCommunityStore();
  const saved = await store.get('state', { type: 'json', consistency: 'strong' });
  return {
    ...getDefaultCommunityState(),
    ...(saved && typeof saved === 'object' ? saved : {})
  };
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
  let state;
  try{
    connectLambda(event);
    state = await readState();
  }catch(error){
    console.error('Falha ao acessar o armazenamento comunitario:', error);
    return json(503, { ok: false, error: 'Comentarios temporariamente indisponiveis.' });
  }

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
    state.comments[key] = [...(state.comments[key] || []), comment];
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
    }else if(actionId === 'reply'){
      const text = cleanText(body.text || body.texto, 400);
      if(!text) return json(400, { ok: false, error: 'Resposta vazia.' });
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

  if(event.httpMethod === 'POST' && action === 'palpite'){
    const body = parseBody(event);
    const item = body.palpite || body;
    const matchId = cleanText(item.matchId, 120);
    const userId = cleanText(item.userId, 120);
    if(!matchId || !userId) return json(400, { ok: false, error: 'Palpite invalido.' });

    const cleanPalpite = {
      ...item,
      matchId,
      userId,
      entryId: cleanText(item.entryId, 120) || `palpite-${Date.now()}`,
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
    const withoutSame = history.filter(saved => !(saved.userId === userId && saved.matchId === matchId));
    withoutSame.push(cleanPalpite);
    state.palpites = { history: withoutSame.slice(-500) };
    await writeState(state);
    return json(200, { ok: true, palpites: state.palpites, updatedAt: state.updatedAt });
  }

  if(event.httpMethod === 'POST' && action === 'interaction'){
    const body = parseBody(event);
    const type = cleanText(body.type, 40);
    const target = cleanText(body.target, 120);
    const value = cleanText(body.value, 120);
    const clientId = cleanText(body.clientId, 120);
    if(!type || !target || !value || !clientId) return json(400, { ok: false, error: 'Interacao invalida.' });

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
