import { apiOptions } from '../../../server/cloudflare-api.mjs';
import { handleRoutineNotifications } from '../../../server/routine-notifications-core.mjs';

export async function onRequest({ request, env, params }) {
  if (request.method === 'OPTIONS') return apiOptions();
  const action = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  try {
    return await handleRoutineNotifications(request, env, action);
  } catch (error) {
    const configurationError = error instanceof Error && error.message === 'BE_DATA_NOT_CONFIGURED';
    return new Response(JSON.stringify({
      error: configurationError
        ? 'Armazenamento BE_DATA ainda não vinculado.'
        : 'Serviço de lembretes temporariamente indisponível.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
}
