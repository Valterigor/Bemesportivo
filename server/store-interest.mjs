const prefix = 'store-interest:entry:';
const ttl = 180 * 86400;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, private' } });
async function hash(text, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function handleInterest(request, env, catalog) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return json({ error: 'Origem inválida.' }, 403);
    const store = env.BE_DATA;
    const secret = env.STORE_INTEREST_SECRET;
    if (!store || !secret || secret.length < 32) return json({ error: 'Cadastro ainda não disponível.' }, 503);
    if (request.method === 'GET' || request.method === 'DELETE') {
      const admin = env.BE_ADMIN_TOKEN;
      const supplied = request.headers.get('x-be-admin-token') || '';
      if (!admin || admin.length < 32 || !supplied || await hash(supplied, secret) !== await hash(admin, secret)) return json({ error: 'Não autorizado.' }, 401);
      if (request.method === 'DELETE') {
        const id = new URL(request.url).searchParams.get('id') || '';
        if (!/^[a-z0-9-]+:[a-f0-9]{64}$/.test(id)) return json({ error: 'Registro inválido.' }, 400);
        if (id.startsWith('wishlist:')) {
          for (const product of catalog.products) await store.delete(prefix + product.id + ':' + id.split(':')[1]);
        }
        await store.delete(prefix + id);
        return json({ ok: true });
      }
      // Paginate all records. Counts represent phone/product pairs, not verified people.
      let cursor;
      const entries = [];
      do {
        const page = await store.list({ prefix, cursor, limit: 1000 });
        const values = await Promise.all(page.keys.map(k => store.get(k.name, { type: 'json' })));
        entries.push(...values.filter(Boolean));
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      const wishlistPhones = new Set(entries.filter(e => Array.isArray(e.items)).map(e => e.phone));
      const activeEntries = entries.filter(e => Array.isArray(e.items) || !wishlistPhones.has(e.phone));
      const selections = activeEntries.flatMap(e => (e.items || [{ productId: e.productId, size: e.size }]).map(item => ({ ...item, phone: e.phone })));
      const products = catalog.products.map(p => {
        const matches = selections.filter(e => e.productId === p.id);
        const sizes = {};
        for (const e of matches) sizes[e.size] = (sizes[e.size] || 0) + 1;
        return { id: p.id, name: p.name, count: matches.length, sizes };
      });
      return json({ products, registrations: selections.length, uniquePhones: new Set(activeEntries.map(e => e.phone)).size, entries: activeEntries, preview: !!env.STORE_PREVIEW });
    }
    if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
    if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Use JSON.' }, 415);
    if (Number(request.headers.get('content-length')) > 2048) return json({ error: 'Dados excedem o limite.' }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 2048) return json({ error: 'Dados excedem o limite.' }, 413);
    let data;
    try { data = JSON.parse(raw); } catch { return json({ error: 'Dados inválidos.' }, 400); }
    if (!data || typeof data !== 'object') return json({ error: 'Dados inválidos.' }, 400);
    const isWishlist = Object.hasOwn(data, 'items');
    const items = isWishlist ? data.items : [{ productId: data.productId, size: data.size }];
    const seen = new Set();
    if (!Array.isArray(items) || !items.length || items.length > catalog.products.length || items.some(item => {
      const product = catalog.products.find(p => p.id === item?.productId);
      if (!product || !product.interestSizes.includes(item.size) || seen.has(item.productId)) return true;
      seen.add(item.productId); return false;
    })) return json({ error: 'Confira as peças e os tamanhos da lista.' }, 400);
    let phone = typeof data.phone === 'string' ? data.phone.replace(/\D/g, '') : '';
    if (phone.length === 13 && phone.startsWith('55')) phone = phone.slice(2);
    const name = typeof data.name === 'string' ? data.name.trim().replace(/[\u0000-\u001f]/g, '') : '';
    if (!/^[1-9][0-9]9[0-9]{8}$/.test(phone) || name.length < 2 || name.length > 80 || data.consent !== true) return json({ error: 'Confira nome, WhatsApp e autorização.' }, 400);
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const rateKey = 'store-interest:rate:' + await hash(ip, secret);
    const rate = await store.get(rateKey, { type: 'json' });
    if (Number(rate?.count || 0) >= 20) return json({ error: 'Aguarde para tentar novamente.' }, 429);
    await store.put(rateKey, JSON.stringify({ count: Number(rate?.count || 0) + 1 }), { expirationTtl: 3600 });
    const id = (isWishlist ? 'wishlist' : items[0].productId) + ':' + await hash(phone, secret);
    const entry = { id, name, phone: '55' + phone, consentVersion: isWishlist ? 'store-wishlist-v1' : 'store-interest-v1', updatedAt: new Date().toISOString() };
    if (isWishlist) {
      entry.items = items.map(({ productId, size }) => ({ productId, size }));
      entry.notificationChannel = 'whatsapp';
    } else {
      entry.productId = items[0].productId;
      entry.size = items[0].size;
    }
    await store.put(prefix + id, JSON.stringify(entry), { expirationTtl: ttl });
    return json({ ok: true, preview: !!env.STORE_PREVIEW });
  } catch { return json({ error: 'Não foi possível registrar agora.' }, 503); }
}
