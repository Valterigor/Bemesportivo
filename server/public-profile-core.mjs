const encoder = new TextEncoder();
const identifierPattern = /^[a-f0-9]{64}$/;
const slugPattern = /^be-[a-f0-9]{12}$/;
const maximumBodyBytes = 900_000;

function json(payload, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function hashHex(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function parseBody(request) {
  if (Number(request.headers.get('content-length') || 0) > maximumBodyBytes) return null;
  const raw = await request.text();
  if (raw.length > maximumBodyBytes) return null;
  try { return raw ? JSON.parse(raw) : {}; } catch { return null; }
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

function cleanText(value, maximum) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function cleanPhoto(value, maximum = 480_000) {
  const photo = String(value || '');
  return /^data:image\/(?:jpeg|webp);base64,[a-z0-9+/=]+$/i.test(photo) && photo.length <= maximum ? photo : '';
}

function youtubeId(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    if (url.hostname === 'youtu.be') return /^[\w-]{11}$/.test(url.pathname.slice(1)) ? url.pathname.slice(1) : '';
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      const id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1] || '';
      return /^[\w-]{11}$/.test(id) ? id : '';
    }
  } catch {}
  return '';
}

function sanitizeProfile(value = {}) {
  const age = Math.round(Number(value.age));
  return {
    displayName: cleanText(value.displayName, 40),
    age: Number.isFinite(age) && age >= 18 && age <= 120 ? age : null,
    profession: cleanText(value.profession, 60),
    favoriteSport: cleanText(value.favoriteSport, 50),
    bio: cleanText(value.bio, 400),
    photoDataUrl: cleanPhoto(value.photoDataUrl, 260_000)
  };
}

function sanitizePost(value = {}) {
  const imageDataUrl = cleanPhoto(value.imageDataUrl);
  const videoId = youtubeId(value.videoUrl);
  const text = cleanText(value.text, 600);
  const kind = imageDataUrl ? 'photo' : videoId ? 'video' : 'text';
  if (!text || !/^[A-Za-z0-9:_-]{1,100}$/.test(String(value.clientId || ''))) return null;
  return {
    id: String(value.id || crypto.randomUUID()).slice(0, 100),
    clientId: String(value.clientId),
    kind,
    text,
    imageDataUrl,
    videoId,
    activity: cleanText(value.activity, 60),
    occurredAt: /^\d{4}-\d{2}-\d{2}$/.test(String(value.occurredAt || '')) ? String(value.occurredAt) : new Date().toISOString().slice(0, 10)
  };
}

async function authorize(request, runtime) {
  const id = String(request.headers.get('x-be-sync-id') || '').toLowerCase();
  const token = String(request.headers.get('x-be-sync-token') || '').toLowerCase();
  if (!identifierPattern.test(id) || !identifierPattern.test(token)) return null;
  const sync = await runtime.read(`sync:${id}`, null);
  if (!sync) return null;
  const verifier = await hashHex(`be-sync-verifier:${token}`);
  return verifier === sync.verifier ? { id, slug: `be-${id.slice(0, 12)}` } : null;
}

function publicRecord(record) {
  if (!record || record.profileStatus !== 'approved') return null;
  const posts = (Array.isArray(record.posts) ? record.posts : [])
    .filter(post => post.status === 'approved')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 50)
    .map(({ status, reports, ...post }) => post);
  return {
    slug: record.slug,
    profile: record.profile,
    posts,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export default async function publicProfileHandler(request, runtime) {
  if (request.method === 'OPTIONS') return json({ ok: true });
  if (!sameOrigin(request)) return json({ error: 'Origem não autorizada.' }, 403);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/public-profiles\/?/, '').split('/').filter(Boolean);

  if (request.method === 'GET' && path[0] && path[0] !== 'mine') {
    if (!slugPattern.test(path[0])) return json({ error: 'Perfil inválido.' }, 400);
    const visible = publicRecord(await runtime.read(`public-profile:${path[0]}`, null));
    return visible ? json({ ok: true, ...visible }, 200, 'public, max-age=60') : json({ error: 'Perfil não encontrado ou ainda em análise.' }, 404);
  }

  const owner = await authorize(request, runtime);
  if (!owner) return json({ error: 'Ative a continuidade protegida para publicar.' }, 401);

  if (request.method === 'GET' && path[0] === 'mine') {
    const record = await runtime.read(`public-profile:${owner.slug}`, null);
    return json({ ok: true, slug: owner.slug, record });
  }

  if (request.method === 'DELETE' && path[0] === 'profile') {
    await runtime.remove(`public-profile:${owner.slug}`);
    return json({ ok: true });
  }

  if (request.method === 'POST' && (!path[0] || path[0] === 'publish')) {
    const body = await parseBody(request);
    if (!body) return json({ error: 'Publicação inválida ou muito grande.' }, 400);
    const profile = sanitizeProfile(body.profile);
    const post = body.post ? sanitizePost(body.post) : null;
    if (!profile.displayName || !profile.age || !profile.profession || !profile.favoriteSport) {
      return json({ error: 'Complete nome, idade, profissão e esporte favorito no perfil.' }, 400);
    }
    if (body.post && !post) return json({ error: 'Conte como foi e o que aconteceu antes de publicar.' }, 400);
    const now = new Date().toISOString();
    const current = await runtime.read(`public-profile:${owner.slug}`, null);
    const sameProfile = current && JSON.stringify(current.profile) === JSON.stringify(profile);
    const posts = Array.isArray(current?.posts) ? current.posts.filter(item => !post || item.clientId !== post.clientId) : [];
    const record = {
      schemaVersion: 1,
      slug: owner.slug,
      ownerId: owner.id,
      profile,
      profileStatus: sameProfile ? current.profileStatus : 'pending',
      posts: (post ? [{ ...post, status: 'pending', reports: [], createdAt: now, updatedAt: now }, ...posts] : posts).slice(0, 30),
      createdAt: current?.createdAt || now,
      updatedAt: now
    };
    await runtime.write(`public-profile:${owner.slug}`, record);
    return json({ ok: true, slug: owner.slug, profileStatus: record.profileStatus, postStatus: post ? 'pending' : null, publicUrl: `/perfil-publico?perfil=${owner.slug}` }, 202);
  }

  if (request.method === 'DELETE' && path[0] === 'posts' && path[1]) {
    const record = await runtime.read(`public-profile:${owner.slug}`, null);
    if (!record) return json({ error: 'Perfil público não encontrado.' }, 404);
    record.posts = (record.posts || []).filter(post => post.id !== path[1]);
    record.updatedAt = new Date().toISOString();
    await runtime.write(`public-profile:${owner.slug}`, record);
    return json({ ok: true });
  }

  if (request.method === 'DELETE' && path[0] === 'entries' && path[1]) {
    const record = await runtime.read(`public-profile:${owner.slug}`, null);
    if (!record) return json({ ok: true });
    record.posts = (record.posts || []).filter(post => post.clientId !== path[1]);
    record.updatedAt = new Date().toISOString();
    await runtime.write(`public-profile:${owner.slug}`, record);
    return json({ ok: true });
  }

  return json({ error: 'Rota não encontrada.' }, 404);
}

export { sanitizeProfile, sanitizePost, publicRecord };
