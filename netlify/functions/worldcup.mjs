import { get as httpsGet } from 'node:https';

const ESPN_WORLD_CUP_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_WORLD_CUP_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';

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

async function fetchJson(url){
  try{
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BemEsportivo/1.0 (+https://bemesportivo.com)'
      }
    });

    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }catch(error){
    return fetchJsonWithHttps(url, error);
  }
}

function fetchJsonWithHttps(url, cause){
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const request = httpsGet({
      protocol: target.protocol,
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      family: 4,
      rejectUnauthorized: false,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BemEsportivo/1.0 (+https://bemesportivo.com)'
      },
      timeout: 8000
    }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        if(response.statusCode < 200 || response.statusCode >= 300){
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        try{
          resolve(JSON.parse(body));
        }catch(parseError){
          reject(parseError);
        }
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error('Timeout ESPN'));
    });

    request.on('error', error => {
      reject(new Error(`${error.message}; fetch original: ${cause?.message || 'indisponivel'}`));
    });
  });
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

function getRoute(event){
  const rawPath = String(event.path || '');
  const directPath = rawPath
    .replace(/^\/api\/worldcup\/?/, '')
    .replace(/^\/\.netlify\/functions\/worldcup\/?/, '');
  const splat = String(event.pathParameters?.splat || directPath || '').replace(/^\/+|\/+$/g, '');
  return splat || '';
}

function getParams(event){
  if(event.rawQuery){
    return new URLSearchParams(event.rawQuery);
  }
  return new URLSearchParams(event.queryStringParameters || {});
}

export async function handler(event){
  if(event.httpMethod === 'OPTIONS'){
    return {statusCode: 204, headers: corsHeaders, body: ''};
  }

  if(event.httpMethod !== 'GET'){
    return json(405, {ok: false, error: 'Metodo nao permitido.'});
  }

  const route = getRoute(event);
  const params = getParams(event);

  if(route === 'scoreboard'){
    const dates = String(params.get('dates') || '').replace(/[^0-9]/g, '').slice(0, 8);
    if(!/^\d{8}$/.test(dates)){
      return json(400, {ok: false, error: 'Data invalida. Use YYYYMMDD.'});
    }

    try{
      const payload = await cachedJson(`scoreboard:${dates}`, 5000, () => {
        const url = `${ESPN_WORLD_CUP_SCOREBOARD_URL}?dates=${dates}&limit=100`;
        return fetchJson(url);
      });
      return json(200, payload, 5);
    }catch(error){
      return json(502, {ok: false, error: 'ESPN indisponivel no momento', detail: error.message});
    }
  }

  if(route === 'summary'){
    const eventId = String(params.get('event') || '').replace(/[^0-9]/g, '').slice(0, 20);
    if(!eventId){
      return json(400, {ok: false, error: 'Evento invalido.'});
    }

    try{
      const payload = await cachedJson(`summary:${eventId}`, 5000, () => {
        const url = `${ESPN_WORLD_CUP_SUMMARY_URL}?event=${encodeURIComponent(eventId)}`;
        return fetchJson(url);
      });
      return json(200, payload, 5);
    }catch(error){
      return json(502, {ok: false, error: 'Resumo ESPN indisponivel no momento', detail: error.message});
    }
  }

  return json(404, {ok: false, error: 'API da Copa nao encontrada.'});
}
