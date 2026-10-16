import { handleInterest } from '../../server/store-interest.mjs';
import catalog from '../../js/store-catalog.json';

export function onRequest({ request, env }) {
  return handleInterest(request, env, catalog);
}
