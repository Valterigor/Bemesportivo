import assert from 'node:assert/strict';
import publicProfileHandler, { disabledRetentionSeconds, publicTermsVersion } from '../server/public-profile-core.mjs';

const encoder = new TextEncoder();
async function hashHex(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

const records = new Map();
const writeOptions = new Map();
const runtime = {
  read: async (key, fallback = null) => records.has(key) ? structuredClone(records.get(key)) : fallback,
  write: async (key, value, options) => {
    records.set(key, structuredClone(value));
    writeOptions.set(key, structuredClone(options || {}));
  },
  remove: async key => records.delete(key)
};
const id = 'a'.repeat(64);
const token = 'b'.repeat(64);

function call(path, { method = 'GET', body, authorized = true, reporter = 'visitor-1' } = {}) {
  const headers = { Origin: 'https://bemesportivo.com', 'User-Agent': reporter, 'CF-Connecting-IP': `203.0.113.${reporter.slice(-1)}` };
  if (authorized) {
    headers['X-BE-Sync-Id'] = id;
    headers['X-BE-Sync-Token'] = token;
  }
  if (body) headers['Content-Type'] = 'application/json';
  return publicProfileHandler(new Request(`https://bemesportivo.com/api/public-profiles/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  }), runtime);
}

const identity = await call('identity', {
  method: 'POST', authorized: false,
  body: { id, verifier: await hashHex(`be-sync-verifier:${token}`) }
});
assert.equal(identity.status, 201);
assert.ok(records.has(`public-owner:${id}`));

const profile = {
  displayName: 'Pessoa Atleta', age: 34, profession: 'Professora', favoriteSport: 'Corrida',
  bio: 'Movimento faz parte da minha rotina.', photoDataUrl: ''
};
const post = {
  clientId: 'entry-test-1', text: 'Treino leve no parque e boas sensações.', videoUrl: 'https://youtu.be/GzXDxAVdsnQ', activity: 'Corrida', occurredAt: '2026-08-15'
};

assert.equal((await call('publish', { method: 'POST', body: { profile, post }, authorized: false })).status, 401);
assert.equal((await call('publish', { method: 'POST', body: { profile, post } })).status, 400);
const acceptance = { accepted: true, adultConfirmed: true, termsVersion: publicTermsVersion, acceptedAt: new Date().toISOString() };
const publish = await call('publish', { method: 'POST', body: { profile, post, acceptance } });
assert.equal(publish.status, 201);
const published = await publish.json();
assert.equal(published.slug, `be-${id.slice(0, 12)}`);
assert.equal(published.profileStatus, 'published');
assert.equal(published.postStatus, 'published');
assert.equal((await call(published.slug, { authorized: false })).status, 200);

const key = `public-profile:${published.slug}`;
const stored = records.get(key);
assert.equal(stored.profileStatus, 'published');
assert.equal(stored.posts[0].status, 'published');
assert.equal(stored.posts[0].kind, 'text');
assert.equal('videoId' in stored.posts[0], false);
assert.equal(stored.publicationConsent.termsVersion, publicTermsVersion);

const visibleResponse = await call(published.slug, { authorized: false });
assert.equal(visibleResponse.status, 200);
const visible = await visibleResponse.json();
assert.equal(visible.profile.displayName, profile.displayName);
assert.equal(visible.posts.length, 1);
assert.equal('ownerId' in visible, false);

assert.equal((await call('disable', { method: 'POST', body: {} })).status, 200);
assert.equal(records.get(key).profileStatus, 'disabled');
assert.equal(writeOptions.get(key).expirationTtl, disabledRetentionSeconds);
assert.equal(writeOptions.get(`public-owner:${id}`).expirationTtl, disabledRetentionSeconds);
assert.equal((await call(published.slug, { authorized: false })).status, 404);
const republish = await call('publish', { method: 'POST', body: { profile, acceptance } });
assert.equal(republish.status, 200);
assert.equal(records.get(key).profileStatus, 'published');
assert.deepEqual(writeOptions.get(key), {});
assert.deepEqual(writeOptions.get(`public-owner:${id}`), {});

for (const reporter of ['visitor-1', 'visitor-2', 'visitor-3']) {
  const report = await call(`${published.slug}/report`, {
    method: 'POST', authorized: false, reporter,
    body: { targetType: 'post', postId: stored.posts[0].id, reason: 'Teste de fiscalização' }
  });
  assert.equal(report.status, 202);
}
const afterReports = await (await call(published.slug, { authorized: false })).json();
assert.equal(afterReports.posts.length, 0);

assert.equal((await call(`entries/${post.clientId}`, { method: 'DELETE' })).status, 200);
assert.equal(records.get(key).posts.length, 0);
assert.equal((await call('profile', { method: 'DELETE' })).status, 200);
assert.equal(records.has(key), false);
assert.equal(records.has(`public-owner:${id}`), false);

console.log('Perfis públicos aprovados: aceite, publicação imediata, denúncias e privacidade validados.');
