import publicProfileHandler from '../../../server/public-profile-core.mjs';
import { readJson, writeJson, getDataStore } from '../../../server/cloudflare-kv.mjs';

export function onRequest({ request, env }) {
  return publicProfileHandler(request, {
    read: (key, fallback) => readJson(env, key, fallback),
    write: (key, value, options) => writeJson(env, key, value, options),
    remove: key => getDataStore(env).delete(key)
  });
}
