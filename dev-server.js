const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const port = Number(process.env.PORT || 3100);
const communityFile = path.join(root, 'data', 'community.json');
const gameRankingFile = path.join(root, 'data', 'game-ranking.json');
const GE_BRASILEIRAO_URL = 'https://ge.globo.com/futebol/brasileirao-serie-a/';
const SELECAO_NEWS_RSS_URL = 'https://news.google.com/rss/search?q=sele%C3%A7%C3%A3o%20brasileira%20futebol%20when%3A1d&hl=pt-BR&gl=BR&ceid=BR:pt-419';
const apiCache = new Map();
const visualAnalysisModule = import('./server/visual-analysis.mjs');
const visualAnalysisLimits = new Map();
const REPORT_HIDE_THRESHOLD = 3;
const COMMUNITY_RETENTION_MS = 1000 * 60 * 60 * 24 * 730;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8'
};

const corsHeaders = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Access-Control-Max-Age':'86400'
};

function sendJson(response, statusCode, payload, cacheSeconds = 0){
  response.writeHead(statusCode, {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-store',
    'X-Content-Type-Options':'nosniff',
    ...corsHeaders
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text){
  response.writeHead(statusCode, {
    'Content-Type':'text/plain; charset=utf-8',
    'X-Content-Type-Options':'nosniff',
    ...corsHeaders
  });
  response.end(text);
}

function getDefaultCommunityState(){
  return {
    schemaVersion:2,
    updatedAt:new Date().toISOString(),
    votes:{
      'craque-brasil-haiti-2026':{
        totals:{
          'vinicius-jr':0,
          raphinha:0,
          'lucas-paqueta':0,
          'bruno-guimaraes':0,
          marquinhos:0
        },
        choices:{}
      }
    },
    comments:{},
    palpites:{history:[]},
    interactions:[],
    rateLimits:{}
  };
}

function readCommunityState(){
  try{
    const raw = fs.readFileSync(communityFile, 'utf8');
    return {...getDefaultCommunityState(), ...JSON.parse(raw)};
  }catch(error){
    return getDefaultCommunityState();
  }
}

function writeCommunityState(state){
  fs.mkdirSync(path.dirname(communityFile), {recursive:true});
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(communityFile, JSON.stringify(state, null, 2));
}

function readJsonBody(request, maxBytes = 20000){
  return new Promise((resolve, reject) => {
    let raw = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      raw += chunk;
      if(raw.length > maxBytes){
        request.destroy(new Error('Payload grande demais'));
      }
    });
    request.on('end', () => {
      if(!raw){
        resolve({});
        return;
      }
      try{
        resolve(JSON.parse(raw));
      }catch(error){
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function cleanText(value, limit){
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function cleanId(value, fallback = 'item'){
  const cleaned = cleanText(value, 100).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

function getCommunityCommentKey(scope, id){
  return `${cleanId(scope, 'geral')}:${cleanId(id, 'item')}`;
}

function publicComment(comment){
  const likedBy = comment?.likedBy && typeof comment.likedBy === 'object' ? comment.likedBy : {};
  const replies = Array.isArray(comment?.replies) ? comment.replies : [];
  return {
    id:comment.id,
    name:comment.name,
    team:comment.team || '',
    text:comment.text,
    createdAt:comment.createdAt,
    likes:Object.keys(likedBy).length,
    replies:replies.map(reply => ({
      id:reply.id,
      name:reply.name,
      text:reply.text,
      createdAt:reply.createdAt
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
  const origin = request.headers.origin;
  if(!origin) return true;
  const requestOrigin = request.headers.host ? `http://${request.headers.host}` : '';
  return [requestOrigin, 'https://bemesportivo.com', 'https://www.bemesportivo.com'].includes(origin);
}

function requestFingerprint(request, clientId = ''){
  const address = String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0];
  const secret = process.env.COMMUNITY_RATE_LIMIT_SECRET || 'bem-esportivo-local';
  return crypto.createHash('sha256').update(`${secret}:${address}:${cleanId(clientId, 'device')}`).digest('hex').slice(0, 32);
}

function consumeRateLimit(state, key, action, limit, windowMs){
  const now = Date.now();
  const rateLimits = state.rateLimits && typeof state.rateLimits === 'object' ? state.rateLimits : {};
  const bucketKey = `${action}:${key}`;
  const recent = (Array.isArray(rateLimits[bucketKey]) ? rateLimits[bucketKey] : [])
    .map(Number)
    .filter(timestamp => Number.isFinite(timestamp) && now - timestamp < windowMs);
  if(recent.length >= limit){state.rateLimits = rateLimits; return false;}
  rateLimits[bucketKey] = [...recent, now];
  state.rateLimits = Object.fromEntries(Object.entries(rateLimits)
    .filter(([, timestamps]) => Array.isArray(timestamps) && timestamps.some(timestamp => now - Number(timestamp) < 86400000))
    .slice(-1500));
  return true;
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
    id:interaction.id,
    type:interaction.type,
    target:interaction.target,
    value:interaction.value,
    createdAt:interaction.createdAt
  };
}

function publicInteractions(interactions){
  return (Array.isArray(interactions) ? interactions : []).map(publicInteraction);
}

function publicPalpites(palpites){
  return {
    history:(Array.isArray(palpites?.history) ? palpites.history : []).map(item => ({
      matchId:item.matchId,
      userName:item.userName || '',
      userTeam:item.userTeam || '',
      userCity:item.userCity || '',
      home:item.home || '',
      away:item.away || '',
      group:item.group || '',
      venue:item.venue || '',
      player:item.player || '',
      homeScore:item.homeScore,
      awayScore:item.awayScore,
      confidence:item.confidence,
      updatedAt:item.updatedAt
    }))
  };
}

function publicCommunityState(state){
  const publicVotes = {};
  Object.entries(state.votes || {}).forEach(([pollId, poll]) => {
    publicVotes[pollId] = {totals:poll?.totals || {}};
  });

  return {
    ok:true,
    updatedAt:state.updatedAt,
    votes:publicVotes,
    comments:Object.fromEntries(Object.entries(state.comments || {}).map(([key, comments]) => [key, publicComments(comments)])),
    palpites:publicPalpites(state.palpites),
    interactions:publicInteractions(state.interactions)
  };
}

async function handleCommunityApi(request, response, parsedUrl){
  if(!parsedUrl.pathname.startsWith('/api/community/')) return false;

  const state = pruneCommunityState(readCommunityState());

  if(request.method === 'POST' && !isAllowedWriteOrigin(request)){
    sendJson(response, 403, {ok:false, error:'Origem não permitida.'});
    return true;
  }

  if(request.method === 'GET' && parsedUrl.pathname === '/api/community/state'){
    sendJson(response, 200, publicCommunityState(state));
    return true;
  }

  if(request.method === 'GET' && parsedUrl.pathname === '/api/community/comments'){
    const key = getCommunityCommentKey(parsedUrl.searchParams.get('scope'), parsedUrl.searchParams.get('id'));
    sendJson(response, 200, {ok:true, comments:publicComments(state.comments[key] || []), updatedAt:state.updatedAt});
    return true;
  }

  if(request.method === 'POST' && parsedUrl.pathname === '/api/community/comment'){
    try{
      const body = await readJsonBody(request);
      if(body.website){sendJson(response, 200, {ok:true, comments:[]}); return true;}
      if(body.adultConfirmed !== true){sendJson(response, 403, {ok:false, error:'A participação comunitária está disponível somente para maiores de 18 anos.'}); return true;}
      const fingerprint = requestFingerprint(request, body.clientId);
      if(!consumeRateLimit(state, fingerprint, 'comment-10m', 5, 600000)
        || !consumeRateLimit(state, fingerprint, 'comment-day', 20, 86400000)){
        sendJson(response, 429, {ok:false, error:'Limite de publicações atingido. Aguarde antes de tentar novamente.'});
        return true;
      }
      const key = getCommunityCommentKey(body.scope, body.id);
      const text = cleanText(body.text || body.texto, 500);
      if(!text){
        sendJson(response, 400, {ok:false, error:'Comentario vazio.'});
        return true;
      }
      if(containsPrivateContact(text)){
        sendJson(response, 400, {ok:false, error:'Não publique telefone ou e-mail. Use o canal de contato privado do site.'});
        return true;
      }
      const comment = {
        id:`comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name:cleanText(body.name || body.nome || 'Visitante', 40) || 'Visitante',
        team:cleanText(body.team || body.time || '', 40),
        text,
        createdAt:new Date().toISOString(),
        likedBy:{},
        replies:[],
        reports:[]
      };
      state.comments[key] = [...(state.comments[key] || []), comment].slice(-250);
      writeCommunityState(state);
      sendJson(response, 200, {ok:true, comments:publicComments(state.comments[key]), comment:publicComment(comment), updatedAt:state.updatedAt});
    }catch(error){
      sendJson(response, 400, {ok:false, error:'Nao foi possivel salvar comentario.', detail:error.message});
    }
    return true;
  }

  if(request.method === 'POST' && parsedUrl.pathname === '/api/community/comment-action'){
    try{
      const body = await readJsonBody(request);
      const key = getCommunityCommentKey(body.scope, body.id);
      const comments = Array.isArray(state.comments[key]) ? state.comments[key] : [];
      const comment = comments.find(item => item.id === cleanText(body.commentId, 120));
      const action = cleanId(body.action, '');
      const clientId = cleanId(body.clientId, '');
      if(!comment || !action || !clientId){
        sendJson(response, 400, {ok:false, error:'Acao de comentario invalida.'});
        return true;
      }
      const fingerprint = requestFingerprint(request, clientId);
      if(!consumeRateLimit(state, fingerprint, 'comment-action', 30, 600000)){
        sendJson(response, 429, {ok:false, error:'Muitas ações em pouco tempo. Aguarde e tente novamente.'});
        return true;
      }

      if(action === 'like'){
        comment.likedBy = comment.likedBy && typeof comment.likedBy === 'object' ? comment.likedBy : {};
        if(comment.likedBy[clientId]){
          delete comment.likedBy[clientId];
        }else{
          comment.likedBy[clientId] = true;
        }
      }else if(action === 'reply'){
        if(body.adultConfirmed !== true){sendJson(response, 403, {ok:false, error:'A participação comunitária está disponível somente para maiores de 18 anos.'}); return true;}
        const text = cleanText(body.text || body.texto, 400);
        if(!text){
          sendJson(response, 400, {ok:false, error:'Resposta vazia.'});
          return true;
        }
        if(containsPrivateContact(text)){
          sendJson(response, 400, {ok:false, error:'Não publique telefone ou e-mail. Use o canal de contato privado do site.'});
          return true;
        }
        comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
        comment.replies = [
          ...comment.replies,
          {
            id:`reply-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name:cleanText(body.name || body.nome || 'Visitante', 40) || 'Visitante',
            text,
            createdAt:new Date().toISOString()
          }
        ].slice(-50);
      }else if(action === 'report'){
        comment.reports = Array.isArray(comment.reports) ? comment.reports : [];
        if(!comment.reports.includes(fingerprint)){
          comment.reports.push(fingerprint);
        }
        if(comment.reports.length >= REPORT_HIDE_THRESHOLD){
          comment.hiddenAt = comment.hiddenAt || new Date().toISOString();
          comment.hiddenReason = 'reports-threshold';
        }
      }else{
        sendJson(response, 400, {ok:false, error:'Acao desconhecida.'});
        return true;
      }

      state.comments[key] = comments;
      writeCommunityState(state);
      sendJson(response, 200, {ok:true, comments:publicComments(comments), comment:comment.hiddenAt ? null : publicComment(comment), updatedAt:state.updatedAt});
    }catch(error){
      sendJson(response, 400, {ok:false, error:'Nao foi possivel atualizar comentario.', detail:error.message});
    }
    return true;
  }

  if(request.method === 'POST' && parsedUrl.pathname === '/api/community/vote'){
    try{
      const body = await readJsonBody(request);
      const pollId = cleanId(body.pollId, 'poll');
      const choiceId = cleanId(body.choiceId, '');
      const clientId = cleanId(body.clientId, '');
      if(!choiceId || !clientId){
        sendJson(response, 400, {ok:false, error:'Voto invalido.'});
        return true;
      }
      const fingerprint = requestFingerprint(request, clientId);
      if(!consumeRateLimit(state, fingerprint, 'vote', 60, 600000)){
        sendJson(response, 429, {ok:false, error:'Muitos votos em pouco tempo. Aguarde e tente novamente.'});
        return true;
      }

      const poll = state.votes[pollId] || {totals:{}, choices:{}};
      const previous = poll.choices[fingerprint];
      if(previous && previous !== choiceId){
        poll.totals[previous] = Math.max(0, Number(poll.totals[previous] || 0) - 1);
      }
      if(previous !== choiceId){
        poll.totals[choiceId] = Number(poll.totals[choiceId] || 0) + 1;
      }
      poll.choices[fingerprint] = choiceId;
      state.votes[pollId] = poll;
      writeCommunityState(state);
      sendJson(response, 200, {ok:true, pollId, vote:{totals:poll.totals, selected:choiceId}, updatedAt:state.updatedAt});
    }catch(error){
      sendJson(response, 400, {ok:false, error:'Nao foi possivel registrar voto.', detail:error.message});
    }
    return true;
  }

  if(request.method === 'POST' && parsedUrl.pathname === '/api/community/palpite'){
    try{
      const body = await readJsonBody(request, 40000);
      const item = body.palpite || body;
      const matchId = cleanText(item.matchId, 120);
      const userId = cleanText(item.userId, 120);
      if(!matchId || !userId){
        sendJson(response, 400, {ok:false, error:'Palpite invalido.'});
        return true;
      }
      const fingerprint = requestFingerprint(request, userId);
      if(!consumeRateLimit(state, fingerprint, 'palpite', 20, 600000)){
        sendJson(response, 429, {ok:false, error:'Muitos palpites em pouco tempo. Aguarde e tente novamente.'});
        return true;
      }
      const participantId = requestFingerprint(request, userId);
      const cleanPalpite = {
        matchId,
        participantId,
        userName:cleanText(item.userName, 40),
        userTeam:cleanText(item.userTeam, 40),
        userCity:cleanText(item.userCity, 40),
        home:cleanText(item.home, 80),
        away:cleanText(item.away, 80),
        group:cleanText(item.group, 20),
        venue:cleanText(item.venue, 120),
        player:cleanText(item.player, 80),
        homeScore:Math.max(0, Math.min(15, Number(item.homeScore) || 0)),
        awayScore:Math.max(0, Math.min(15, Number(item.awayScore) || 0)),
        confidence:Math.max(10, Math.min(100, Number(item.confidence) || 50)),
        updatedAt:new Date().toISOString()
      };
      const history = Array.isArray(state.palpites?.history) ? state.palpites.history : [];
      const withoutSame = history.filter(saved => !((saved.participantId === participantId || saved.userId === userId) && saved.matchId === matchId));
      withoutSame.push(cleanPalpite);
      state.palpites = {history:withoutSame.slice(-500)};
      writeCommunityState(state);
      sendJson(response, 200, {ok:true, palpites:publicPalpites(state.palpites), updatedAt:state.updatedAt});
    }catch(error){
      sendJson(response, 400, {ok:false, error:'Nao foi possivel registrar palpite.', detail:error.message});
    }
    return true;
  }

  if(request.method === 'POST' && parsedUrl.pathname === '/api/community/interaction'){
    try{
      const body = await readJsonBody(request);
      const type = cleanText(body.type, 40);
      const target = cleanText(body.target, 120);
      const clientId = cleanText(body.clientId, 120);
      const value = cleanText(body.value, 120);
      if(!type || !target || !value || !clientId){
        sendJson(response, 400, {ok:false, error:'Interacao invalida.'});
        return true;
      }
      const fingerprint = requestFingerprint(request, clientId);
      if(!consumeRateLimit(state, fingerprint, 'interaction', 60, 600000)){
        sendJson(response, 429, {ok:false, error:'Muitas interações em pouco tempo. Aguarde e tente novamente.'});
        return true;
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
          id:`interaction-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type,
          target,
          value,
          clientId,
          createdAt:new Date().toISOString()
        }
      ].slice(-1000);
      writeCommunityState(state);
      sendJson(response, 200, {ok:true, updatedAt:state.updatedAt});
    }catch(error){
      sendJson(response, 400, {ok:false, error:'Interacao invalida.', detail:error.message});
    }
    return true;
  }

  sendJson(response, 404, {ok:false, error:'API nao encontrada.'});
  return true;
}

function fetchJson(url){
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BemEsportivo/1.0 (+https://bemesportivo.com)'
      },
      rejectUnauthorized: false,
      timeout: 7000
    }, response => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        raw += chunk;
        if(raw.length > 3000000){
          request.destroy(new Error('Payload grande demais'));
        }
      });
      response.on('end', () => {
        if(response.statusCode < 200 || response.statusCode >= 300){
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        try{
          resolve(JSON.parse(raw));
        }catch(error){
          reject(error);
        }
      });
    });

    request.on('timeout', () => request.destroy(new Error('Timeout')));
    request.on('error', reject);
  });
}

function fetchText(url){
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'BemEsportivo/1.0 (+https://bemesportivo.com)'
      },
      rejectUnauthorized: false,
      timeout: 8000
    }, response => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        raw += chunk;
        if(raw.length > 6000000){
          request.destroy(new Error('Payload grande demais'));
        }
      });
      response.on('end', () => {
        if(response.statusCode < 200 || response.statusCode >= 300){
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        resolve(raw);
      });
    });

    request.on('timeout', () => request.destroy(new Error('Timeout')));
    request.on('error', reject);
  });
}

function extractJsAssignment(html, variableName){
  const marker = new RegExp(`(?:const|let|var)\\s+${variableName}\\s*=\\s*`);
  const match = marker.exec(html);
  if(!match) return null;

  const start = match.index + match[0].length;
  const firstChar = html[start];
  const closingChar = firstChar === '[' ? ']' : firstChar === '{' ? '}' : '';
  if(!closingChar) return null;

  let depth = 0;
  let inString = '';
  let escaped = false;

  for(let index = start; index < html.length; index++){
    const char = html[index];

    if(inString){
      if(escaped){
        escaped = false;
      }else if(char === '\\'){
        escaped = true;
      }else if(char === inString){
        inString = '';
      }
      continue;
    }

    if(char === '"' || char === "'" || char === '`'){
      inString = char;
      continue;
    }

    if(char === firstChar){
      depth++;
    }else if(char === closingChar){
      depth--;
      if(depth === 0){
        return html.slice(start, index + 1);
      }
    }
  }

  return null;
}

function decodeXmlText(value){
  return String(value || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractXmlTag(item, tag){
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(item);
  return decodeXmlText(match?.[1] || '');
}

function parseSelecaoNewsRss(xml){
  return [...String(xml || '').matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .map(match => {
      const item = match[0];
      const rawTitle = extractXmlTag(item, 'title');
      const title = rawTitle.replace(/\s+-\s+[^-]+$/,'').trim() || rawTitle;
      const source = rawTitle.includes(' - ') ? rawTitle.split(' - ').pop().trim() : extractXmlTag(item, 'source');
      return {
        title:cleanText(title, 120),
        source:cleanText(source, 60),
        url:extractXmlTag(item, 'link'),
        publishedAt:extractXmlTag(item, 'pubDate')
      };
    })
    .filter(item => item.title && item.url)
    .slice(0, 3);
}

async function cachedJson(key, ttlMs, loader){
  const cached = apiCache.get(key);
  if(cached && Date.now() - cached.createdAt < ttlMs){
    return {...cached.payload, cached:true};
  }

  const payload = await loader();
  const wrapped = {
    ok:true,
    cached:false,
    updatedAt:new Date().toISOString(),
    data:payload
  };
  apiCache.set(key, {createdAt:Date.now(), payload:wrapped});
  return wrapped;
}

async function handleSelecaoApi(request, response, parsedUrl){
  if(request.method !== 'GET') return false;

  if(parsedUrl.pathname === '/api/selecaobrasileira/news'){
    try{
      const payload = await cachedJson('selecaobrasileira:news', 180000, async () => {
        const xml = await fetchText(SELECAO_NEWS_RSS_URL);
        return parseSelecaoNewsRss(xml);
      });
      sendJson(response, 200, payload, 180);
    }catch(error){
      sendJson(response, 502, {ok:false, error:'Noticias da Selecao indisponiveis no momento', detail:error.message});
    }
    return true;
  }

  return false;
}

async function loadBrasileiraoPageData(){
  const html = await fetchText(GE_BRASILEIRAO_URL);
  return {
    matches:JSON.parse(extractJsAssignment(html, 'listaJogos') || '[]'),
    standings:JSON.parse(extractJsAssignment(html, 'classificacao') || '[]')
  };
}

async function handleBrasileiraoApi(request, response, parsedUrl){
  if(request.method !== 'GET') return false;

  if(parsedUrl.pathname === '/api/brasileirao/matches'){
    try{
      const payload = await cachedJson('brasileirao:matches', 15000, async () => {
        const data = await loadBrasileiraoPageData();
        return data.matches;
      });
      sendJson(response, 200, payload, 15);
    }catch(error){
      sendJson(response, 502, {ok:false, error:'GE indisponivel no momento', detail:error.message});
    }
    return true;
  }

  if(parsedUrl.pathname === '/api/brasileirao/standings'){
    try{
      const payload = await cachedJson('brasileirao:standings', 30000, async () => {
        const data = await loadBrasileiraoPageData();
        return data.standings;
      });
      sendJson(response, 200, payload, 30);
    }catch(error){
      sendJson(response, 502, {ok:false, error:'Tabela do GE indisponivel no momento', detail:error.message});
    }
    return true;
  }

  return false;
}

function readGameRanking(){
  try{
    const saved = JSON.parse(fs.readFileSync(gameRankingFile, 'utf8'));
    return saved && Array.isArray(saved.entries) ? {sessions:[], ...saved} : {entries:[], sessions:[], updatedAt:null};
  }catch(error){ return {entries:[], sessions:[], updatedAt:null}; }
}

function writeGameRanking(data){
  fs.mkdirSync(path.dirname(gameRankingFile), {recursive:true});
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(gameRankingFile, JSON.stringify(data, null, 2));
}

async function handleGameRankingApi(request, response){
  const data = readGameRanking();
  const publicEntries = () => data.entries.slice(0, 100).map(({name,score,level,character,createdAt}) => ({name,score,level,character,createdAt}));
  if(request.method === 'GET'){
    sendJson(response, 200, {ok:true, ranking:publicEntries(), updatedAt:data.updatedAt});
    return true;
  }
  if(request.method !== 'POST') return false;
  try{
    const input = await readJsonBody(request);
    const name = String(input.name || 'Atleta BE').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 16) || 'Atleta BE';
    const deviceId = String(input.deviceId || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
    if(input.action === 'start'){
      if(!deviceId){ sendJson(response, 400, {ok:false, error:'Aparelho invalido.'}); return true; }
      const now = Date.now(), runToken = crypto.randomUUID();
      data.sessions = [...(data.sessions || []).filter(session => now-session.startedAt < 10800000), {token:runToken,deviceId,startedAt:now}].slice(-1000);
      writeGameRanking(data); sendJson(response, 200, {ok:true,runToken,startedAt:now}); return true;
    }
    const score = Math.floor(Number(input.score)), level = Math.floor(Number(input.level)), character = Math.floor(Number(input.character) || 0);
    if(!deviceId || !Number.isFinite(score) || score < 0 || score > 1000000 || !Number.isFinite(level) || level < 1 || level > 100 || score > level * 10000){
      sendJson(response, 400, {ok:false, error:'Resultado invalido.'}); return true;
    }
    const session = (data.sessions || []).find(item => item.token === String(input.runToken || '') && item.deviceId === deviceId), elapsed = session ? Date.now()-session.startedAt : 0;
    if(!session || elapsed < 3000 || elapsed > 10800000 || score > Math.floor(elapsed/1000)*200+500){ sendJson(response, 403, {ok:false,error:'Partida nao validada.'}); return true; }
    const key = `${deviceId}:${name.toLowerCase()}`, previous = data.entries.find(entry => entry.key === key);
    const entry = {key,name,score,level,character:Math.max(0,Math.min(5,character)),createdAt:previous?.createdAt || new Date().toISOString(),submittedAt:new Date().toISOString()};
    data.entries = [...data.entries.filter(item => item.key !== key), previous && previous.score > score ? previous : entry].sort((a,b) => b.score-a.score || b.level-a.level).slice(0,500);
    writeGameRanking(data);
    sendJson(response, 200, {ok:true, ranking:publicEntries(), position:data.entries.findIndex(item => item.key === key)+1, updatedAt:data.updatedAt});
  }catch(error){ sendJson(response, 400, {ok:false, error:'Dados invalidos.'}); }
  return true;
}

async function handleVisualCheckinApi(request, response){
  if(request.method !== 'POST'){
    sendJson(response, 405, {ok:false, error:'Metodo nao permitido.'});
    return true;
  }
  if(!isAllowedWriteOrigin(request)){
    sendJson(response, 403, {ok:false, error:'Origem nao permitida.'});
    return true;
  }

  try{
    const visual = await visualAnalysisModule;
    const body = await readJsonBody(request, visual.MAX_VISUAL_REQUEST_BYTES);
    const payload = visual.parseVisualPayload(JSON.stringify(body));
    if(!payload.ok){
      sendJson(response, payload.status, {ok:false, error:payload.error});
      return true;
    }
    if(!process.env.OPENAI_API_KEY){
      sendJson(response, 503, {ok:false, code:'vision_not_configured', error:'A analise visual ainda nao esta disponivel.'});
      return true;
    }

    const identity = request.headers['x-forwarded-for']?.split(',')[0]?.trim() || request.socket.remoteAddress || 'local';
    const safetyIdentifier = visual.createSafetyIdentifier(identity, process.env.VISUAL_ANALYSIS_SECRET || 'bem-esportivo-local');
    const now = Date.now();
    const active = (visualAnalysisLimits.get(safetyIdentifier) || []).filter(timestamp => now - timestamp < 3_600_000);
    if(active.length >= 8){
      sendJson(response, 429, {ok:false, error:'Voce atingiu o limite temporario de analises. Tente novamente mais tarde.'});
      return true;
    }
    visualAnalysisLimits.set(safetyIdentifier, [...active, now]);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28_000);
    try{
      const analysis = await visual.analyzeVisualImage({
        imageData:payload.imageData,
        context:payload.context,
        apiKey:process.env.OPENAI_API_KEY,
        model:process.env.OPENAI_VISION_MODEL || 'gpt-5.6-luna',
        safetyIdentifier,
        signal:controller.signal
      });
      sendJson(response, 200, {ok:true, analysis, imageStored:false});
    }finally{
      clearTimeout(timeout);
    }
  }catch(error){
    if(error?.code === 'vision_not_configured'){
      sendJson(response, 503, {ok:false, code:'vision_not_configured', error:'A analise visual ainda nao esta disponivel.'});
    }else if(error?.name === 'AbortError'){
      sendJson(response, 504, {ok:false, error:'A analise demorou mais que o esperado. Tente novamente.'});
    }else if(error?.code === 'provider_rate_limit'){
      sendJson(response, 429, {ok:false, error:'O servico esta muito ocupado agora. Tente novamente em alguns minutos.'});
    }else{
      sendJson(response, 502, {ok:false, error:'Nao foi possivel analisar esta imagem agora. Tente novamente.'});
    }
  }
  return true;
}

function resolveRequest(urlPath){
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  if(cleanPath === 'data' || cleanPath.startsWith('data/')){
    return null;
  }
  const cleanRoutes = {
    'reportagens/treino-funcional-br-assessoria':'reportagem-treino-funcional',
    'reportagens/dedicacao-talento-mirim':'reportagem-dedicacao-talento-mirim',
    'reportagens/duda-e-o-futebol':'reportagem-duda-e-o-futebol'
  };
  const route = cleanRoutes[cleanPath] || cleanPath || 'index';
  const candidates = [
    path.join(root, route),
    path.join(root, `${route}.html`),
    path.join(root, route, 'index.html')
  ];

  return candidates.find(candidate => {
    const relative = path.relative(root, candidate);
    return relative && !relative.startsWith('..') && fs.existsSync(candidate) && fs.statSync(candidate).isFile();
  });
}

const server = http.createServer(async (request, response) => {
  const parsedUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if(parsedUrl.pathname === '/coluna-valtinho' || parsedUrl.pathname === '/coluna-valtinho.html' || parsedUrl.pathname === '/meucaminhobe'){
    response.writeHead(301, {Location:'/meu-caminho-be'});
    response.end();
    return;
  }

  if(request.method === 'OPTIONS'){
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  if(parsedUrl.pathname.startsWith('/api/brasileirao/')){
    const handled = await handleBrasileiraoApi(request, response, parsedUrl);
    if(handled) return;
  }

  if(parsedUrl.pathname.startsWith('/api/selecaobrasileira/')){
    const handled = await handleSelecaoApi(request, response, parsedUrl);
    if(handled) return;
  }

  if(parsedUrl.pathname.startsWith('/api/community/')){
    const handled = await handleCommunityApi(request, response, parsedUrl);
    if(handled) return;
  }

  if(parsedUrl.pathname === '/api/game-ranking'){
    const handled = await handleGameRankingApi(request, response);
    if(handled) return;
  }

  if(parsedUrl.pathname === '/api/visual-checkin'){
    const handled = await handleVisualCheckinApi(request, response);
    if(handled) return;
  }

  const filePath = resolveRequest(request.url || '/');

  if(!filePath){
    sendText(response, 404, 'Pagina nao encontrada');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const fileSize = fs.statSync(filePath).size;
  const isVideo = ext === '.mp4';
  const range = isVideo ? request.headers.range : '';
  const baseHeaders = {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'X-Content-Type-Options':'nosniff',
    'Content-Length':fileSize,
    ...(isVideo ? {'Accept-Ranges':'bytes'} : {}),
    ...corsHeaders
  };

  if(range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(String(range));
    const start=match && match[1] ? Number(match[1]) : 0;
    const requestedEnd=match && match[2] ? Number(match[2]) : fileSize-1;
    const end=Math.min(requestedEnd,fileSize-1);
    if(!match || !Number.isFinite(start) || !Number.isFinite(end) || start<0 || start>end || start>=fileSize){
      response.writeHead(416,{'Content-Range':`bytes */${fileSize}`,'Accept-Ranges':'bytes'});
      response.end();
      return;
    }
    response.writeHead(206,{
      ...baseHeaders,
      'Content-Length':end-start+1,
      'Content-Range':`bytes ${start}-${end}/${fileSize}`
    });
    if(request.method==='HEAD') response.end();
    else fs.createReadStream(filePath,{start,end}).pipe(response);
    return;
  }

  response.writeHead(200, baseHeaders);
  if(request.method==='HEAD'){
    response.end();
    return;
  }
  fs.createReadStream(filePath).pipe(response);
});

if(require.main === module){
  server.listen(port, () => {
    console.log(`Bem Esportivo local: http://localhost:${port}`);
  });
}

module.exports = {
  server,
  resolveRequest
};
