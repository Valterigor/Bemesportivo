import assert from 'node:assert/strict';
import publicProfileHandler from '../server/public-profile-core.mjs';

const encoder = new TextEncoder();
async function hashHex(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

const records = new Map();
const runtime = {
  read: async (key, fallback = null) => records.has(key) ? structuredClone(records.get(key)) : fallback,
  write: async (key, value) => records.set(key, structuredClone(value)),
  remove: async key => records.delete(key)
};
const id = 'a'.repeat(64);
const token = 'b'.repeat(64);
records.set(`sync:${id}`, { verifier: await hashHex(`be-sync-verifier:${token}`) });

function call(path, { method = 'GET', body, authorized = true } = {}) {
  const headers = { Origin: 'https://bemesportivo.com' };
  if (authorized) {
    headers['X-BE-Sync-Id'] = id;
    headers['X-BE-Sync-Token'] = token;
  }
  if (body) headers['Content-Type'] = 'application/json';
  return publicProfileHandler(new Request(`https://bemesportivo.com/api/public-profiles/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  }), runtime);
}

const profile = {
  displayName: 'Pessoa Atleta', age: 34, profession: 'Professora', favoriteSport: 'Corrida',
  bio: 'Movimento faz parte da minha rotina.', photoDataUrl: ''
};
const post = {
  clientId: 'entry-test-1', text: 'Treino leve no parque e boas sensações.', activity: 'Corrida', occurredAt: '2026-08-15'
};

assert.equal((await call('publish', { method: 'POST', body: { profile, post }, authorized: false })).status, 401);
const publish = await call('publish', { method: 'POST', body: { profile, post } });
assert.equal(publish.status, 202);
const published = await publish.json();
assert.equal(published.slug, `be-${id.slice(0, 12)}`);
assert.equal((await call(published.slug, { authorized: false })).status, 404);

const key = `public-profile:${published.slug}`;
const stored = records.get(key);
assert.equal(stored.profileStatus, 'pending');
assert.equal(stored.posts[0].status, 'pending');
stored.profileStatus = 'approved';
stored.posts[0].status = 'approved';
records.set(key, stored);

const visibleResponse = await call(published.slug, { authorized: false });
assert.equal(visibleResponse.status, 200);
const visible = await visibleResponse.json();
assert.equal(visible.profile.displayName, profile.displayName);
assert.equal(visible.posts.length, 1);
assert.equal('ownerId' in visible, false);

assert.equal((await call(`entries/${post.clientId}`, { method: 'DELETE' })).status, 200);
assert.equal(records.get(key).posts.length, 0);
assert.equal((await call('profile', { method: 'DELETE' })).status, 200);
assert.equal(records.has(key), false);

console.log('Perfis públicos aprovados: privacidade local, autenticação, moderação e publicação validadas.');
