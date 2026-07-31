import communityHandler from '../../../server/community-core.mjs';
import { readJson, writeJson } from '../../../server/cloudflare-kv.mjs';

const encoder = new TextEncoder();

async function fingerprint(value, secret) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`${secret}:${value}`)
  );
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

export function onRequest({ request, env }) {
  const runtime = {
    read: () => readJson(env, 'community:state', null),
    write: state => writeJson(env, 'community:state', state),
    fingerprint: value => fingerprint(
      value,
      env.COMMUNITY_RATE_LIMIT_SECRET || 'bem-esportivo-community'
    )
  };
  return communityHandler(request, runtime);
}
