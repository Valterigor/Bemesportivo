import { apiJson, apiOptions, fetchText } from '../../../server/cloudflare-api.mjs';

const sourceUrl = 'https://ge.globo.com/futebol/brasileirao-serie-a/';

function extractJsAssignment(html, variableName) {
  const marker = new RegExp(`(?:const|let|var)\\s+${variableName}\\s*=\\s*`);
  const match = marker.exec(html);
  if (!match) return null;

  const start = match.index + match[0].length;
  const firstChar = html[start];
  const closingChar = firstChar === '[' ? ']' : firstChar === '{' ? '}' : '';
  if (!closingChar) return null;

  let depth = 0;
  let inString = '';
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === inString) inString = '';
      continue;
    }
    if (['"', "'", '`'].includes(character)) {
      inString = character;
      continue;
    }
    if (character === firstChar) depth += 1;
    else if (character === closingChar) {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  return null;
}

async function loadData() {
  const html = await fetchText(
    sourceUrl,
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  );
  return {
    matches: JSON.parse(extractJsAssignment(html, 'listaJogos') || '[]'),
    standings: JSON.parse(extractJsAssignment(html, 'classificacao') || '[]')
  };
}

export async function onRequest({ request, params }) {
  if (request.method === 'OPTIONS') return apiOptions();
  if (request.method !== 'GET') return apiJson({ ok: false, error: 'Método não permitido.' }, 405);

  const route = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!['matches', 'standings'].includes(route)) {
    return apiJson({ ok: false, error: 'API do Brasileirão não encontrada.' }, 404);
  }

  try {
    const data = await loadData();
    const cacheSeconds = route === 'matches' ? 15 : 30;
    return apiJson({
      ok: true,
      cached: false,
      updatedAt: new Date().toISOString(),
      data: data[route]
    }, 200, cacheSeconds);
  } catch (error) {
    return apiJson({
      ok: false,
      error: 'Dados do Brasileirão indisponíveis no momento.',
      detail: error instanceof Error ? error.message : 'Falha desconhecida'
    }, 502);
  }
}
