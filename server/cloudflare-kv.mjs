export function getDataStore(env) {
  const store = env?.BE_DATA;
  if (!store || typeof store.get !== 'function' || typeof store.put !== 'function') {
    throw new Error('BE_DATA_NOT_CONFIGURED');
  }
  return store;
}

export async function readJson(env, key, fallback = null) {
  const stored = await getDataStore(env).get(key, { type: 'json' });
  return stored === null || stored === undefined ? fallback : stored;
}

export async function writeJson(env, key, value, options = {}) {
  await getDataStore(env).put(key, JSON.stringify(value), options);
}
