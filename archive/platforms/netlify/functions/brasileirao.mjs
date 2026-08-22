import https from 'https';

const GE_BRASILEIRAO_URL = 'https://ge.globo.com/futebol/brasileirao-serie-a/';
const apiCache = new Map();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function json(statusCode, payload, cacheSeconds = 0){
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders
    },
    body: JSON.stringify(payload)
  };
}

async function fetchText(url){
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

async function cachedJson(key, ttlMs, loader){
  const cached = apiCache.get(key);
  if(cached && Date.now() - cached.createdAt < ttlMs){
    return {...cached.payload, cached: true};
  }

  const payload = await loader();
  const wrapped = {
    ok: true,
    cached: false,
    updatedAt: new Date().toISOString(),
    data: payload
  };
  apiCache.set(key, {createdAt: Date.now(), payload: wrapped});
  return wrapped;
}

async function loadBrasileiraoPageData(){
  const html = await fetchText(GE_BRASILEIRAO_URL);
  return {
    matches: JSON.parse(extractJsAssignment(html, 'listaJogos') || '[]'),
    standings: JSON.parse(extractJsAssignment(html, 'classificacao') || '[]')
  };
}

function getRoute(event){
  const rawPath = String(event.path || '');
  const directPath = rawPath
    .replace(/^\/api\/brasileirao\/?/, '')
    .replace(/^\/\.netlify\/functions\/brasileirao\/?/, '');
  const splat = String(event.pathParameters?.splat || directPath || '').replace(/^\/+|\/+$/g, '');
  return splat || '';
}

export async function handler(event){
  if(event.httpMethod === 'OPTIONS'){
    return {statusCode: 204, headers: corsHeaders, body: ''};
  }

  if(event.httpMethod !== 'GET'){
    return json(405, {ok: false, error: 'Metodo nao permitido.'});
  }

  const route = getRoute(event);

  if(route === 'matches'){
    try{
      const payload = await cachedJson('brasileirao:matches', 15000, async () => {
        const data = await loadBrasileiraoPageData();
        return data.matches;
      });
      return json(200, payload, 15);
    }catch(error){
      return json(502, {ok: false, error: 'GE indisponivel no momento', detail: error.message});
    }
  }

  if(route === 'standings'){
    try{
      const payload = await cachedJson('brasileirao:standings', 30000, async () => {
        const data = await loadBrasileiraoPageData();
        return data.standings;
      });
      return json(200, payload, 30);
    }catch(error){
      return json(502, {ok: false, error: 'Tabela do GE indisponivel no momento', detail: error.message});
    }
  }

  return json(404, {ok: false, error: 'API do Brasileirao nao encontrada.'});
}
