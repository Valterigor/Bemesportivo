const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 3100);
const ESPN_WORLD_CUP_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_WORLD_CUP_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const apiCache = new Map();

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

const corsHeaders = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET,OPTIONS',
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

async function handleWorldCupApi(request, response, parsedUrl){
  if(request.method !== 'GET') return false;

  if(parsedUrl.pathname === '/api/worldcup/scoreboard'){
    const dates = String(parsedUrl.searchParams.get('dates') || '').replace(/[^0-9]/g, '').slice(0, 8);
    if(!/^\d{8}$/.test(dates)){
      sendJson(response, 400, {ok:false, error:'Data inválida. Use YYYYMMDD.'});
      return true;
    }

    try{
      const payload = await cachedJson(`scoreboard:${dates}`, 12000, () => {
        const url = `${ESPN_WORLD_CUP_SCOREBOARD_URL}?dates=${dates}&limit=100`;
        return fetchJson(url);
      });
      sendJson(response, 200, payload, 12);
    }catch(error){
      sendJson(response, 502, {ok:false, error:'ESPN indisponível no momento', detail:error.message});
    }
    return true;
  }

  if(parsedUrl.pathname === '/api/worldcup/summary'){
    const event = String(parsedUrl.searchParams.get('event') || '').replace(/[^0-9]/g, '').slice(0, 20);
    if(!event){
      sendJson(response, 400, {ok:false, error:'Evento inválido.'});
      return true;
    }

    try{
      const payload = await cachedJson(`summary:${event}`, 12000, () => {
        const url = `${ESPN_WORLD_CUP_SUMMARY_URL}?event=${encodeURIComponent(event)}`;
        return fetchJson(url);
      });
      sendJson(response, 200, payload, 12);
    }catch(error){
      sendJson(response, 502, {ok:false, error:'Resumo ESPN indisponível no momento', detail:error.message});
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

  if(request.method === 'OPTIONS'){
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  if(parsedUrl.pathname.startsWith('/api/worldcup/')){
    const handled = await handleWorldCupApi(request, response, parsedUrl);
    if(handled) return;
  }

  const filePath = resolveRequest(request.url || '/');

  if(!filePath){
    sendText(response, 404, 'Pagina nao encontrada');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'X-Content-Type-Options':'nosniff',
    ...corsHeaders
  });
  fs.createReadStream(filePath).pipe(response);
});

if(require.main === module){
  server.listen(port, () => {
    console.log(`Bem Esportivo local: http://localhost:${port}`);
  });
}

module.exports = {
  server
};
