const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const arenaDbPath = path.join(root, 'data', 'arena-db.json');
const arenaClients = new Set();

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

function sendJson(response, statusCode, payload){
  response.writeHead(statusCode, {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store'
  });
  response.end(JSON.stringify(payload));
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
      if(!optionId){
        sendJson(response, 400, {error:'Opcao obrigatoria'});
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
      if(!optionId){
        sendJson(response, 400, {error:'Resposta obrigatoria'});
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
        sendJson(response, 400, {error:'Comentario muito curto'});
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
    response.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
    response.end('Página não encontrada');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {'Content-Type': mimeTypes[ext] || 'application/octet-stream'});
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
