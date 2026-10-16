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
      const products = catalog.products.map(p => {
        const matches = entries.filter(e => e.productId === p.id);
        const sizes = {};
        for (const e of matches) sizes[e.size] = (sizes[e.size] || 0) + 1;
        return { id: p.id, name: p.name, count: matches.length, sizes };
      });
      return json({ products, registrations: entries.length, uniquePhones: new Set(entries.map(e => e.phone)).size, entries, preview: !!env.STORE_PREVIEW });
    }
    if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
    if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Use JSON.' }, 415);
    if (Number(request.headers.get('content-length')) > 2048) return json({ error: 'Dados excedem o limite.' }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 2048) return json({ error: 'Dados excedem o limite.' }, 413);
    let data;
    try { data = JSON.parse(raw); } catch { return json({ error: 'Dados inválidos.' }, 400); }
    if (!data || typeof data !== 'object') return json({ error: 'Dados inválidos.' }, 400);
    const product = catalog.products.find(p => p.id === data.productId);
    let phone = typeof data.phone === 'string' ? data.phone.replace(/\D/g, '') : '';
    if (phone.length === 13 && phone.startsWith('55')) phone = phone.slice(2);
    const name = typeof data.name === 'string' ? data.name.trim().replace(/[\u0000-\u001f]/g, '') : '';
    if (!product || !product.interestSizes.includes(data.size) || !/^[1-9][0-9]9[0-9]{8}$/.test(phone) || name.length < 2 || name.length > 80 || data.consent !== true) return json({ error: 'Confira nome, WhatsApp, produto, tamanho e autorização.' }, 400);
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const rateKey = 'store-interest:rate:' + await hash(ip, secret);
    const rate = await store.get(rateKey, { type: 'json' });
    if (Number(rate?.count || 0) >= 20) return json({ error: 'Aguarde para tentar novamente.' }, 429);
    await store.put(rateKey, JSON.stringify({ count: Number(rate?.count || 0) + 1 }), { expirationTtl: 3600 });
    const id = product.id + ':' + await hash(phone, secret);
    const entry = { id, productId: product.id, size: data.size, name, phone: '55' + phone, consentVersion: 'store-interest-v1', updatedAt: new Date().toISOString() };
    await store.put(prefix + id, JSON.stringify(entry), { expirationTtl: ttl });
    return json({ ok: true, preview: !!env.STORE_PREVIEW });
  } catch { return json({ error: 'Não foi possível registrar agora.' }, 503); }
}
