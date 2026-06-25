import https from 'https';

const SELECAO_NEWS_RSS_URL = 'https://news.google.com/rss/search?q=sele%C3%A7%C3%A3o%20brasileira%20futebol%20when%3A1d&hl=pt-BR&gl=BR&ceid=BR:pt-419';
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

function cleanText(value, limit){
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function fetchText(url){
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'BemEsportivo/1.0 (+https://bemesportivo.com)'
      },
      rejectUnauthorized: false,
      timeout: 8000
    }, response => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { raw += chunk; });
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

function parseNews(xml){
  return [...String(xml || '').matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .map(match => {
      const item = match[0];
      const rawTitle = extractXmlTag(item, 'title');
      const title = rawTitle.replace(/\s+-\s+[^-]+$/,'').trim() || rawTitle;
      const source = rawTitle.includes(' - ') ? rawTitle.split(' - ').pop().trim() : extractXmlTag(item, 'source');
      return {
        title: cleanText(title, 120),
        source: cleanText(source, 60),
        url: extractXmlTag(item, 'link'),
        publishedAt: extractXmlTag(item, 'pubDate')
      };
    })
    .filter(item => item.title && item.url)
    .slice(0, 3);
}

async function cachedJson(key, ttlMs, loader){
  const cached = apiCache.get(key);
  if(cached && Date.now() - cached.createdAt < ttlMs){
    return {...cached.payload, cached: true};
  }
  const payload = await loader();
  const wrapped = {ok: true, cached: false, updatedAt: new Date().toISOString(), data: payload};
  apiCache.set(key, {createdAt: Date.now(), payload: wrapped});
  return wrapped;
}

function getRoute(event){
  const rawPath = String(event.path || '');
  const directPath = rawPath
    .replace(/^\/api\/selecaobrasileira\/?/, '')
    .replace(/^\/\.netlify\/functions\/selecaobrasileira\/?/, '');
  return String(event.pathParameters?.splat || directPath || '').replace(/^\/+|\/+$/g, '');
}

export async function handler(event){
  if(event.httpMethod === 'OPTIONS') return {statusCode: 204, headers: corsHeaders, body: ''};
  if(event.httpMethod !== 'GET') return json(405, {ok: false, error: 'Metodo nao permitido.'});

  if(getRoute(event) !== 'news'){
    return json(404, {ok: false, error: 'API da Selecao nao encontrada.'});
  }

  try{
    const payload = await cachedJson('selecaobrasileira:news', 180000, async () => parseNews(await fetchText(SELECAO_NEWS_RSS_URL)));
    return json(200, payload, 180);
  }catch(error){
    return json(502, {ok: false, error: 'Noticias da Selecao indisponiveis no momento', detail: error.message});
  }
}
