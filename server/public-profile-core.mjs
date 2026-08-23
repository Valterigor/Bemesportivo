const encoder = new TextEncoder();
const identifierPattern = /^[a-f0-9]{64}$/;
const slugPattern = /^be-[a-f0-9]{12}$/;
const maximumBodyBytes = 900_000;
const publicTermsVersion = '2026-08-15';
const reportHideThreshold = 3;
const disabledRetentionSeconds = 180 * 24 * 60 * 60;

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

function sanitizeProfile(value = {}) {
  return {
    displayName: cleanText(value.displayName, 40),
    favoriteSport: cleanText(value.favoriteSport, 50),
    bio: cleanText(value.bio, 400),
    photoDataUrl: cleanPhoto(value.photoDataUrl, 260_000)
  };
}

function sanitizePost(value = {}) {
  const imageDataUrl = cleanPhoto(value.imageDataUrl);
  const text = cleanText(value.text, 600);
  const kind = imageDataUrl ? 'photo' : 'text';
  if (!text || !/^[A-Za-z0-9:_-]{1,100}$/.test(String(value.clientId || ''))) return null;
  return {
    id: String(value.id || crypto.randomUUID()).slice(0, 100),
    clientId: String(value.clientId),
    kind,
    text,
    imageDataUrl,
    activity: cleanText(value.activity, 60),
    occurredAt: /^\d{4}-\d{2}-\d{2}$/.test(String(value.occurredAt || '')) ? String(value.occurredAt) : new Date().toISOString().slice(0, 10)
  };
}

function validAcceptance(value = {}) {
  return value.accepted === true
    && value.adultConfirmed === true
    && value.termsVersion === publicTermsVersion;
}

function isVisibleStatus(status) {
  return status === 'published' || status === 'approved';
}

async function authorize(request, runtime) {
  const id = String(request.headers.get('x-be-sync-id') || '').toLowerCase();
  const token = String(request.headers.get('x-be-sync-token') || '').toLowerCase();
  if (!identifierPattern.test(id) || !identifierPattern.test(token)) return null;
  const sync = await runtime.read(`public-owner:${id}`, null) || await runtime.read(`sync:${id}`, null);
  if (!sync) return null;
  const verifier = await hashHex(`be-sync-verifier:${token}`);
  return verifier === sync.verifier ? { id, slug: `be-${id.slice(0, 12)}` } : null;
}

function publicRecord(record) {
  if (!record || !isVisibleStatus(record.profileStatus)) return null;
  const posts = (Array.isArray(record.posts) ? record.posts : [])
    .filter(post => isVisibleStatus(post.status))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 50)
    .map(({ status, reports, ...post }) => post);
  return {
    slug: record.slug,
    profile: sanitizeProfile(record.profile),
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

  if (request.method === 'POST' && path[0] === 'identity') {
    const body = await parseBody(request);
    const id = String(body?.id || '').toLowerCase();
    const verifier = String(body?.verifier || '').toLowerCase();
    if (!identifierPattern.test(id) || !identifierPattern.test(verifier)) return json({ error: 'Identidade pública inválida.' }, 400);
    const key = `public-owner:${id}`;
    const current = await runtime.read(key, null);
    if (current?.verifier && current.verifier !== verifier) return json({ error: 'Esta identidade pública já está protegida.' }, 409);
    if (!current) await runtime.write(key, { schemaVersion: 1, verifier, createdAt: new Date().toISOString() });
    return json({ ok: true }, current ? 200 : 201);
  }

  if (request.method === 'GET' && path[0] && path[0] !== 'mine') {
    if (!slugPattern.test(path[0])) return json({ error: 'Perfil inválido.' }, 400);
    const visible = publicRecord(await runtime.read(`public-profile:${path[0]}`, null));
    return visible ? json({ ok: true, ...visible }, 200, 'public, max-age=60') : json({ error: 'Perfil não encontrado ou indisponível.' }, 404);
  }

  if (request.method === 'POST' && slugPattern.test(path[0] || '') && path[1] === 'report') {
    const body = await parseBody(request);
    const targetType = String(body?.targetType || 'profile');
    const postId = String(body?.postId || '');
    const reason = cleanText(body?.reason, 120);
    if (!body || !['profile', 'post'].includes(targetType) || (targetType === 'post' && !/^[A-Za-z0-9:_-]{1,100}$/.test(postId))) {
      return json({ error: 'Denúncia inválida.' }, 400);
    }
    const key = `public-profile:${path[0]}`;
    const record = await runtime.read(key, null);
    if (!record) return json({ error: 'Perfil não encontrado.' }, 404);
    const address = String(request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const agent = String(request.headers.get('user-agent') || '').slice(0, 180);
    const reporter = await hashHex(`be-public-report:${address}:${agent}:${path[0]}`);
    const target = targetType === 'profile' ? record : (record.posts || []).find(item => item.id === postId);
    if (!target) return json({ error: 'Publicação não encontrada.' }, 404);
    target.reports = Array.isArray(target.reports) ? target.reports : [];
    if (!target.reports.some(report => report.reporter === reporter)) {
      target.reports.push({ reporter, reason, createdAt: new Date().toISOString() });
    }
    if (target.reports.length >= reportHideThreshold) {
      if (targetType === 'profile') record.profileStatus = 'hidden';
      else target.status = 'hidden';
    }
    record.updatedAt = new Date().toISOString();
    await runtime.write(key, record);
    return json({ ok: true, hidden: target.reports.length >= reportHideThreshold, reportCount: target.reports.length }, 202);
  }

  const owner = await authorize(request, runtime);
  if (!owner) return json({ error: 'Ative a continuidade protegida para publicar.' }, 401);

  if (request.method === 'GET' && path[0] === 'mine') {
    const record = await runtime.read(`public-profile:${owner.slug}`, null);
    return json({ ok: true, slug: owner.slug, record });
  }

  if (request.method === 'DELETE' && path[0] === 'profile') {
    await runtime.remove(`public-profile:${owner.slug}`);
    await runtime.remove(`public-owner:${owner.id}`);
    return json({ ok: true });
  }

  if (request.method === 'POST' && path[0] === 'disable') {
    const record = await runtime.read(`public-profile:${owner.slug}`, null);
    if (!record) return json({ ok: true, disabled: true });
    record.profileStatus = 'disabled';
    record.updatedAt = new Date().toISOString();
    const ownerKey = `public-owner:${owner.id}`;
    const ownerRecord = await runtime.read(ownerKey, null);
    await Promise.all([
      runtime.write(`public-profile:${owner.slug}`, record, { expirationTtl: disabledRetentionSeconds }),
      ownerRecord ? runtime.write(ownerKey, ownerRecord, { expirationTtl: disabledRetentionSeconds }) : Promise.resolve()
    ]);
    return json({ ok: true, disabled: true, slug: owner.slug });
  }

  if (request.method === 'POST' && (!path[0] || path[0] === 'publish')) {
    const body = await parseBody(request);
    if (!body) return json({ error: 'Publicação inválida ou muito grande.' }, 400);
    const profile = sanitizeProfile(body.profile);
    const post = body.post ? sanitizePost(body.post) : null;
    if (!profile.displayName || !profile.favoriteSport) {
      return json({ error: 'Complete o nome de exibição e o esporte do Perfil Be.' }, 400);
    }
    if (!validAcceptance(body.acceptance)) {
      return json({ error: 'Aceite os termos da página pública e confirme que você tem 18 anos ou mais.' }, 400);
    }
    if (body.post && !post) return json({ error: 'Conte como foi e o que aconteceu antes de publicar.' }, 400);
    const now = new Date().toISOString();
    const current = await runtime.read(`public-profile:${owner.slug}`, null);
    const ownerKey = `public-owner:${owner.id}`;
    const ownerRecord = await runtime.read(ownerKey, null);
    const previousPost = post && Array.isArray(current?.posts) ? current.posts.find(item => item.clientId === post.clientId) : null;
    const posts = Array.isArray(current?.posts) ? current.posts.filter(item => !post || item.clientId !== post.clientId) : [];
    const profileStatus = current?.profileStatus === 'hidden' ? 'hidden' : 'published';
    const postStatus = previousPost?.status === 'hidden' ? 'hidden' : 'published';
    const record = {
      schemaVersion: 2,
      slug: owner.slug,
      ownerId: owner.id,
      profile,
      profileStatus,
      reports: Array.isArray(current?.reports) ? current.reports : [],
      publicationConsent: {
        termsVersion: publicTermsVersion,
        adultConfirmed: true,
        acceptedAt: cleanText(body.acceptance.acceptedAt, 40) || now
      },
      posts: (post ? [{ ...post, status: postStatus, reports: previousPost?.reports || [], createdAt: previousPost?.createdAt || now, updatedAt: now }, ...posts] : posts).slice(0, 30),
      createdAt: current?.createdAt || now,
      updatedAt: now
    };
    await Promise.all([
      runtime.write(`public-profile:${owner.slug}`, record),
      ownerRecord ? runtime.write(ownerKey, ownerRecord) : Promise.resolve()
    ]);
    return json({ ok: true, slug: owner.slug, profileStatus: record.profileStatus, postStatus: post ? postStatus : null, publicUrl: `/diario/${owner.slug}` }, current ? 200 : 201);
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

export { sanitizeProfile, sanitizePost, publicRecord, publicTermsVersion, disabledRetentionSeconds };
