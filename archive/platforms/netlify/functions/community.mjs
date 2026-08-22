import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import communityHandler from '../../server/community-core.mjs';

function getStoreOptions(){
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  return siteID && token ? { siteID, token } : undefined;
}

function getCommunityStore(){
  return getStore({
    name: 'bem-esportivo-community',
    consistency: 'strong',
    ...(getStoreOptions() || {})
  });
}

const runtime = {
  read: () => getCommunityStore().get('state', { type: 'json', consistency: 'strong' }),
  write: state => getCommunityStore().setJSON('state', state),
  fingerprint(value) {
    const secret = process.env.COMMUNITY_RATE_LIMIT_SECRET
      || process.env.NETLIFY_SITE_ID
      || 'bem-esportivo-community';
    return createHash('sha256').update(`${secret}:${value}`).digest('hex').slice(0, 32);
  }
};

export default function handler(request) {
  return communityHandler(request, runtime);
}
