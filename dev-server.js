const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 3100);
const arenaDbPath = path.join(root, 'data', 'arena-db.json');
const arenaContentPath = path.join(root, 'data', 'arena-content.json');
const arenaClients = new Set();
const arenaRateLimits = new Map();
const commentBlocklist = [
  'http://',
  'https://',
  'www.',
  '<script',
  '</script',
  'casino',
  'aposta grátis',
  'ganhe dinheiro'
];

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8'
};

const fallbackArenaContent = {
  poll: {
    title: 'Enquete do Dia',
    question: 'Quem chega mais forte para o próximo desafio?',
    options: [
      {id:'brasil', label:'Brasil', votes:58},
      {id:'marrocos', label:'Marrocos', votes:24},
      {id:'equilibrado', label:'Jogo equilibrado', votes:18}
    ]
  },
  quiz: {
    title: 'Quiz Diário',
    question: 'Em qual continente fica o Marrocos?',
    options: [
      {id:'america', label:'América'},
      {id:'africa', label:'África'},
      {id:'asia', label:'Ásia'},
      {id:'europa', label:'Europa'}
    ],
    correctOptionId: 'africa',
    explanation: 'O Marrocos fica no norte da África e tem tradição forte no futebol.'
  },
  hotTopic: {
    title: 'Tema Quente da Arena',
    tag: 'Seleção Brasileira',
    headline: 'Seleção em debate: força, escolhas e momento em campo',
    summary: 'A Arena abre a conversa do dia com palpites, opinião da torcida e uma leitura rápida do clima do futebol.',
    prompts: [
      'Quem deve ser o jogador decisivo?',
      'O Brasil precisa pressionar desde o início?',
      'Qual placar representa melhor o momento da Seleção?'
    ]
  }
};

function ensureArenaDb(){
  const dir = path.dirname(arenaDbPath);
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
  if(!fs.existsSync(arenaDbPath)){
    const initial = {
      pollVotes: {},
      quizAnswers: {},
      comments: []
    };
    fs.writeFileSync(arenaDbPath, JSON.stringify(initial, null, 2));
  }
}

function readArenaDb(){
  ensureArenaDb();
  try{
    const parsed = JSON.parse(fs.readFileSync(arenaDbPath, 'utf8'));
    return {
      pollVotes: parsed.pollVotes && typeof parsed.pollVotes === 'object' ? parsed.pollVotes : {},
      quizAnswers: parsed.quizAnswers && typeof parsed.quizAnswers === 'object' ? parsed.quizAnswers : {},
      comments: Array.isArray(parsed.comments) ? parsed.comments : []
    };
  }catch(error){
    return {pollVotes:{}, quizAnswers:{}, comments:[]};
  }
}

function writeArenaDb(db){
  ensureArenaDb();
  fs.writeFileSync(arenaDbPath, JSON.stringify(db, null, 2));
}

function normalizeArenaOption(option, index){
  const id = cleanText(option?.id, 60) || `opcao-${index + 1}`;
  return {
    id,
    label: cleanText(option?.label, 80) || id,
    votes: Math.max(0, Number(option?.votes) || 0)
  };
}

function normalizeArenaContent(content){
  const source = content && typeof content === 'object' ? content : fallbackArenaContent;
  const pollOptions = Array.isArray(source.poll?.options) ? source.poll.options : fallbackArenaContent.poll.options;
  const quizOptions = Array.isArray(source.quiz?.options) ? source.quiz.options : fallbackArenaContent.quiz.options;
  const prompts = Array.isArray(source.hotTopic?.prompts) ? source.hotTopic.prompts : fallbackArenaContent.hotTopic.prompts;
  const normalizedQuizOptions = quizOptions.map((option, index) => {
    const normalized = normalizeArenaOption(option, index);
    delete normalized.votes;
    return normalized;
  }).slice(0, 6);
  const requestedCorrectOptionId = cleanText(source.quiz?.correctOptionId, 60);
  const validCorrectOptionId = normalizedQuizOptions.some(option => option.id === requestedCorrectOptionId)
    ? requestedCorrectOptionId
    : normalizedQuizOptions[0]?.id || fallbackArenaContent.quiz.correctOptionId;

  return {
    poll: {
      title: cleanText(source.poll?.title, 80) || fallbackArenaContent.poll.title,
      question: cleanText(source.poll?.question, 160) || fallbackArenaContent.poll.question,
      options: pollOptions.map(normalizeArenaOption).slice(0, 6)
    },
    quiz: {
      title: cleanText(source.quiz?.title, 80) || fallbackArenaContent.quiz.title,
      question: cleanText(source.quiz?.question, 180) || fallbackArenaContent.quiz.question,
      options: normalizedQuizOptions,
      correctOptionId: validCorrectOptionId,
      explanation: cleanText(source.quiz?.explanation, 240) || fallbackArenaContent.quiz.explanation
    },
    hotTopic: {
      title: cleanText(source.hotTopic?.title, 80) || fallbackArenaContent.hotTopic.title,
      tag: cleanText(source.hotTopic?.tag, 60) || fallbackArenaContent.hotTopic.tag,
      headline: cleanText(source.hotTopic?.headline, 160) || fallbackArenaContent.hotTopic.headline,
      summary: cleanText(source.hotTopic?.summary, 320) || fallbackArenaContent.hotTopic.summary,
      prompts: prompts.map(prompt => cleanText(prompt, 120)).filter(Boolean).slice(0, 5)
    }
  };
}

function readArenaContent(){
  try{
    if(!fs.existsSync(arenaContentPath)) return normalizeArenaContent(fallbackArenaContent);
    return normalizeArenaContent(JSON.parse(fs.readFileSync(arenaContentPath, 'utf8')));
  }catch(error){
    return normalizeArenaContent(fallbackArenaContent);
  }
}

function isKnownArenaOption(section, optionId){
  const content = readArenaContent();
  return Boolean(content[section]?.options?.some(option => option.id === optionId));
}

function sendJson(response, statusCode, payload){
  response.writeHead(statusCode, {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text){
  response.writeHead(statusCode, {
    'Content-Type':'text/plain; charset=utf-8',
    'X-Content-Type-Options':'nosniff'
  });
  response.end(text);
}

function readJsonBody(request){
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', chunk => {
      raw += chunk;
      if(raw.length > 20000){
        reject(new Error('Payload grande demais'));
        request.destroy();
      }
    });
    request.on('end', () => {
      if(!raw) return resolve({});
      try{
        resolve(JSON.parse(raw));
      }catch(error){
        reject(new Error('JSON invalido'));
      }
    });
    request.on('error', reject);
  });
}

function cleanText(value, maxLength){
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function isSafeId(value){
  return /^[a-z0-9_-]{1,60}$/i.test(value);
}

function hasBlockedCommentTerm(text){
  const normalized = text.toLowerCase();
  return commentBlocklist.some(term => normalized.includes(term));
}

function clientKey(request){
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || request.socket.remoteAddress || 'local';
}

function rateLimit(request, action, maxHits, windowMs){
  const now = Date.now();
  const key = `${action}:${clientKey(request)}`;
  const current = arenaRateLimits.get(key) || [];
  const recent = current.filter(timestamp => now - timestamp < windowMs);
  if(recent.length >= maxHits){
    arenaRateLimits.set(key, recent);
    return false;
  }
  recent.push(now);
  arenaRateLimits.set(key, recent);
  return true;
}

function arenaState(){
  const db = readArenaDb();
  const pollVotes = Object.entries(db.pollVotes).reduce((total, [id, votes]) => {
    total[id] = Number(votes) || 0;
    return total;
  }, {});
  const quizAnswers = Object.entries(db.quizAnswers).reduce((total, [id, answers]) => {
    total[id] = Number(answers) || 0;
    return total;
  }, {});

  return {
    pollVotes,
    quizAnswers,
    comments: db.comments.slice(-80).reverse(),
    totals: {
      poll: Object.values(pollVotes).reduce((sum, votes) => sum + votes, 0),
      quiz: Object.values(quizAnswers).reduce((sum, answers) => sum + answers, 0),
      comments: db.comments.length
    },
    updatedAt: new Date().toISOString()
  };
}

function broadcastArenaState(){
  const payload = `event: arena-state\ndata: ${JSON.stringify(arenaState())}\n\n`;
  arenaClients.forEach(client => client.write(payload));
}

async function handleArenaApi(request, response, pathname){
  if(request.method === 'GET' && pathname === '/api/arena/health'){
    sendJson(response, 200, {ok:true, service:'arena', updatedAt:new Date().toISOString()});
    return true;
  }

  if(request.method === 'GET' && pathname === '/api/arena/content'){
    sendJson(response, 200, readArenaContent());
    return true;
  }

  if(request.method === 'GET' && pathname === '/api/arena/state'){
    sendJson(response, 200, arenaState());
    return true;
  }

  if(request.method === 'GET' && pathname === '/api/arena/events'){
    response.writeHead(200, {
      'Content-Type':'text/event-stream; charset=utf-8',
      'Cache-Control':'no-cache, no-transform',
      Connection:'keep-alive'
    });
    response.write(`event: arena-state\ndata: ${JSON.stringify(arenaState())}\n\n`);
    arenaClients.add(response);
    request.on('close', () => arenaClients.delete(response));
    return true;
  }

  if(request.method === 'POST' && pathname === '/api/arena/poll'){
    try{
      const body = await readJsonBody(request);
      const optionId = cleanText(body.optionId, 60);
      if(!isSafeId(optionId)){
        sendJson(response, 400, {error:'Opção inválida'});
        return true;
      }
      if(!isKnownArenaOption('poll', optionId)){
        sendJson(response, 400, {error:'Opção fora da enquete atual'});
        return true;
      }
      if(!rateLimit(request, 'poll', 20, 60 * 1000)){
        sendJson(response, 429, {error:'Muitas tentativas. Tente novamente em instantes.'});
        return true;
      }
      const db = readArenaDb();
      db.pollVotes[optionId] = (Number(db.pollVotes[optionId]) || 0) + 1;
      writeArenaDb(db);
      broadcastArenaState();
      sendJson(response, 201, arenaState());
    }catch(error){
      sendJson(response, 400, {error:error.message});
    }
    return true;
  }

  if(request.method === 'POST' && pathname === '/api/arena/quiz'){
    try{
      const body = await readJsonBody(request);
      const optionId = cleanText(body.optionId, 60);
      if(!isSafeId(optionId)){
        sendJson(response, 400, {error:'Resposta inválida'});
        return true;
      }
      if(!isKnownArenaOption('quiz', optionId)){
        sendJson(response, 400, {error:'Resposta fora do quiz atual'});
        return true;
      }
      if(!rateLimit(request, 'quiz', 30, 60 * 1000)){
        sendJson(response, 429, {error:'Muitas tentativas. Tente novamente em instantes.'});
        return true;
      }
      const db = readArenaDb();
      db.quizAnswers[optionId] = (Number(db.quizAnswers[optionId]) || 0) + 1;
      writeArenaDb(db);
      broadcastArenaState();
      sendJson(response, 201, arenaState());
    }catch(error){
      sendJson(response, 400, {error:error.message});
    }
    return true;
  }

  if(request.method === 'POST' && pathname === '/api/arena/comments'){
    try{
      const body = await readJsonBody(request);
      const name = cleanText(body.name, 40) || 'Visitante';
      const text = cleanText(body.text, 500);
      if(text.length < 3){
        sendJson(response, 400, {error:'Comentário muito curto'});
        return true;
      }
      if(hasBlockedCommentTerm(text)){
        sendJson(response, 400, {error:'Comentário bloqueado por segurança'});
        return true;
      }
      if(!rateLimit(request, 'comment', 6, 60 * 1000)){
        sendJson(response, 429, {error:'Muitos comentários. Tente novamente em instantes.'});
        return true;
      }
      const db = readArenaDb();
      db.comments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        text,
        createdAt: new Date().toISOString()
      });
      db.comments = db.comments.slice(-300);
      writeArenaDb(db);
      broadcastArenaState();
      sendJson(response, 201, arenaState());
    }catch(error){
      sendJson(response, 400, {error:error.message});
    }
    return true;
  }

  return false;
}

function resolveRequest(urlPath){
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const route = cleanPath || 'index';
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

  if(parsedUrl.pathname.startsWith('/api/arena/')){
    const handled = await handleArenaApi(request, response, parsedUrl.pathname);
    if(handled) return;
  }

  const filePath = resolveRequest(request.url || '/');

  if(!filePath){
    sendText(response, 404, 'Página não encontrada');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'X-Content-Type-Options':'nosniff'
  });
  fs.createReadStream(filePath).pipe(response);
});

if(require.main === module){
  server.listen(port, () => {
    console.log(`Bem Esportivo local: http://localhost:${port}`);
  });
}

module.exports = {
  server,
  arenaState,
  readArenaDb
};
