import { apiJson, apiOptions, cleanText, fetchText } from '../../../server/cloudflare-api.mjs';

const sourceUrl = 'https://news.google.com/rss/search?q=sele%C3%A7%C3%A3o%20brasileira%20futebol%20when%3A1d&hl=pt-BR&gl=BR&ceid=BR:pt-419';

function decodeXmlText(value) {
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

function extractXmlTag(item, tag) {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(item);
  return decodeXmlText(match?.[1] || '');
}

function parseNews(xml) {
  return [...String(xml || '').matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .map(match => {
      const item = match[0];
      const rawTitle = extractXmlTag(item, 'title');
      const title = rawTitle.replace(/\s+-\s+[^-]+$/, '').trim() || rawTitle;
      const source = rawTitle.includes(' - ')
        ? rawTitle.split(' - ').pop().trim()
        : extractXmlTag(item, 'source');
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

export async function onRequest({ request, params }) {
  if (request.method === 'OPTIONS') return apiOptions();
  if (request.method !== 'GET') return apiJson({ ok: false, error: 'Método não permitido.' }, 405);

  const route = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (route !== 'news') {
    return apiJson({ ok: false, error: 'API da Seleção não encontrada.' }, 404);
  }

  try {
    const xml = await fetchText(
      sourceUrl,
      'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8'
    );
    return apiJson({
      ok: true,
      cached: false,
      updatedAt: new Date().toISOString(),
      data: parseNews(xml)
    }, 200, 180);
  } catch (error) {
    return apiJson({
      ok: false,
      error: 'Notícias da Seleção indisponíveis no momento.',
      detail: error instanceof Error ? error.message : 'Falha desconhecida'
    }, 502);
  }
}
