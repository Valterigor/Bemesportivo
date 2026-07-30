import { apiJson, apiOptions } from '../../server/cloudflare-api.mjs';

export function onRequest({ request }) {
  if (request.method === 'OPTIONS') return apiOptions();
  return apiJson({
    ok: false,
    error: 'Serviço temporariamente em migração para a Cloudflare.'
  }, 503);
}
