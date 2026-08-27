import assert from 'node:assert/strict';
import publicProfileHandler, { disabledRetentionSeconds, publicTermsVersion, sanitizePost } from '../../server/public-profile-core.mjs';

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

assert.equal(sanitizePost({ clientId: 'invalid-photo', text: 'Imagem falsa', imageDataUrl: `data:image/jpeg;base64,${btoa('javascript')}` }).imageDataUrl, '');
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
assert.equal('age' in stored.profile, false);
assert.equal('profession' in stored.profile, false);
assert.equal(stored.posts[0].status, 'published');
assert.equal(stored.posts[0].kind, 'text');
assert.equal('videoId' in stored.posts[0], false);
assert.equal(stored.publicationConsent.termsVersion, publicTermsVersion);

const visibleResponse = await call(published.slug, { authorized: false });
assert.equal(visibleResponse.status, 200);
const visible = await visibleResponse.json();
assert.equal(visible.profile.displayName, profile.displayName);
assert.equal('age' in visible.profile, false);
assert.equal('profession' in visible.profile, false);
assert.equal(visible.posts.length, 1);
assert.equal('ownerId' in visible, false);

const sportsUpdate = await call('publish', {
  method: 'POST',
  body: {
    profile, acceptance,
    post: { ...post, postType: 'training', title: 'Volta ao parque', duration: 42, distance: 7.2, feeling: '5', personalBest: true }
  }
});
assert.equal(sportsUpdate.status, 200);
const sportsVisible = await (await call(published.slug, { authorized: false })).json();
assert.equal(sportsVisible.posts[0].postType, 'training');
assert.equal(sportsVisible.posts[0].duration, 42);
assert.equal(sportsVisible.posts[0].distance, 7.2);
assert.equal(sportsVisible.posts[0].personalBest, true);

const postId = sportsVisible.posts[0].id;
const like = await call(`${published.slug}/posts/${postId}/like`, { method: 'POST', authorized: false, reporter: 'visitor-4', body: {} });
assert.equal(like.status, 200);
assert.equal((await like.json()).likes, 1);
const comment = await call(`${published.slug}/posts/${postId}/comments`, {
  method: 'POST', authorized: false, reporter: 'visitor-4', body: { name: 'Leitora BE', text: 'Parabens pela evolucao!', website: '' }
});
assert.equal(comment.status, 201);
const withInteractions = await (await call(published.slug, { authorized: false })).json();
assert.equal(withInteractions.posts[0].likes, 1);
assert.equal(withInteractions.posts[0].comments.length, 1);
assert.equal('visitor' in withInteractions.posts[0].comments[0], false);

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
