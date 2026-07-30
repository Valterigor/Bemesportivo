const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

export function apiJson(payload, status = 200, cacheSeconds = 0) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders
    }
  });
}

export function apiOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function fetchText(url, accept, timeoutMs = 8000) {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      'User-Agent': 'BemEsportivo/1.0 (+https://bemesportivo.com)'
    },
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export function cleanText(value, limit) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}
