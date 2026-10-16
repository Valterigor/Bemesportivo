import assert from 'node:assert/strict';
import fs from 'node:fs';
import { handleInterest } from '../../server/store-interest.mjs';
const catalog = JSON.parse(fs.readFileSync(new URL('../../js/store-catalog.json', import.meta.url)));
const records = new Map();
const env = {
  STORE_INTEREST_SECRET: 's'.repeat(40), BE_ADMIN_TOKEN: 'a'.repeat(40),
  BE_DATA: {
    get: async key => records.has(key) ? JSON.parse(records.get(key)) : null,
    put: async (key, value, options) => { assert.ok(options.expirationTtl > 0); records.set(key, value); },
    delete: async key => records.delete(key),
    list: async ({ prefix }) => ({ keys: [...records.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true })
  }
};
const base = { productId: 'camiseta-be', size: 'M', name: 'Teste', phone: '(11) 99999-0000', consent: true };
const post = (data, origin = 'https://bemesportivo.com') => handleInterest(new Request('https://bemesportivo.com/api/store-interest', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(data) }), env, catalog);
const read = async () => (await handleInterest(new Request('https://bemesportivo.com/api/store-interest', { headers: { 'x-be-admin-token': env.BE_ADMIN_TOKEN } }), env, catalog)).json();
assert.equal((await post(base)).status, 200);
assert.equal((await post({ ...base, phone: '+55 11 99999-0000', size: 'G' })).status, 200);
let result = await read();
assert.equal(result.registrations, 1);
assert.equal(result.products[0].sizes.G, 1);
assert.equal((await post({ ...base, productId: 'short-be' })).status, 200);
result = await read();
assert.equal(result.registrations, 2);
assert.equal(result.uniquePhones, 1);
assert.equal((await post({ ...base, consent: false })).status, 400);
assert.equal((await post({ ...base, size: 'inventado' })).status, 400);
assert.equal((await post({ ...base, phone: '123' })).status, 400);
assert.equal((await post(base, 'https://outro.com')).status, 403);
assert.equal((await handleInterest(new Request('https://bemesportivo.com/api/store-interest'), env, catalog)).status, 401);
assert.equal((await handleInterest(new Request('https://bemesportivo.com/api/store-interest'), {}, catalog)).status, 503);
const id = result.entries[0].id;
assert.equal((await handleInterest(new Request('https://bemesportivo.com/api/store-interest?id=' + id, { method: 'DELETE', headers: { 'x-be-admin-token': env.BE_ADMIN_TOKEN } }), env, catalog)).status, 200);
assert.equal((await read()).registrations, 1);
for (let i = 0; i < 17; i++) await post(base);
assert.equal((await post(base)).status, 429);
console.log('Interesse BE: deduplicação, tamanhos, consentimento, origem, acesso, exclusão e limite aprovados.');
