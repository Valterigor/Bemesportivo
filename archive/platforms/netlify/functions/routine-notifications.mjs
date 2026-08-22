import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const allowedOrigin = request => {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return ['bemesportivo.com', 'www.bemesportivo.com', 'localhost', '127.0.0.1'].includes(new URL(origin).hostname); } catch (error) { return false; }
};
const options = () => {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  return siteID && token ? { siteID, token } : {};
};
const store = () => getStore({ name: 'bem-esportivo-routine-push', consistency: 'strong', ...options() });
const validInstall = value => /^[a-f0-9-]{30,50}$/i.test(String(value || '')) ? String(value) : '';
const cleanReminders = value => Array.isArray(value) ? value.map(item => {
  const timestamp = Date.parse(item?.dueAt || '');
  return { key: String(item?.key || '').replace(/[^a-z0-9:_-]/gi, '').slice(0, 140), dueAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '' };
}).filter(item => item.key && item.dueAt && Date.parse(item.dueAt) > Date.now() - 60000 && Date.parse(item.dueAt) < Date.now() + 8640000000).slice(0, 300) : [];
const validPushEndpoint = value => {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)) || (url.protocol === 'https:' && url.hostname.endsWith('.notify.windows.com'));
  } catch (error) { return false; }
};
async function withinRateLimit(request, targetStore) {
  const ip = request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `rate-${createHash('sha256').update(ip).digest('hex').slice(0, 24)}`;
  const now = Date.now();
  const state = await targetStore.get(key, { type: 'json', consistency: 'strong' }) || { startedAt: now, count: 0 };
  const active = now - Number(state.startedAt || 0) < 86400000 ? state : { startedAt: now, count: 0 };
  if (active.count >= 40) return false;
  active.count += 1;
  await targetStore.setJSON(key, active);
  return true;
}

export default async request => {
  if (!allowedOrigin(request)) return json({ error: 'Origem não autorizada.' }, 403);
  const action = new URL(request.url).pathname.split('/').filter(Boolean).pop();
  if (request.method === 'GET' && action === 'config') {
    const publicKey = process.env.WEB_PUSH_PUBLIC_KEY || '';
    return publicKey ? json({ publicKey }) : json({ error: 'Push ainda não configurado.' }, 503);
  }
  if (request.method !== 'POST' || action !== 'schedule') return json({ error: 'Rota não encontrada.' }, 404);
  if (Number(request.headers.get('content-length') || 0) > 120000) return json({ error: 'Solicitação muito grande.' }, 413);
  const targetStore = store();
  if (!await withinRateLimit(request, targetStore)) return json({ error: 'Limite temporário atingido.' }, 429);
  let body;
  try { body = await request.json(); } catch (error) { return json({ error: 'JSON inválido.' }, 400); }
  const installationId = validInstall(body.installationId);
  const subscription = body.subscription;
  if (!installationId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return json({ error: 'Assinatura inválida.' }, 400);
  if (!validPushEndpoint(subscription.endpoint)) return json({ error: 'Endpoint de push não aceito.' }, 400);
  const record = { installationId, subscription: { endpoint: String(subscription.endpoint).slice(0, 2000), expirationTime: subscription.expirationTime || null, keys: { p256dh: String(subscription.keys.p256dh).slice(0, 500), auth: String(subscription.keys.auth).slice(0, 500) } }, reminders: cleanReminders(body.reminders), updatedAt: new Date().toISOString() };
  if (record.reminders.length) await targetStore.setJSON(`install-${installationId}`, record);
  else await targetStore.delete(`install-${installationId}`);
  return json({ ok: true, reminders: record.reminders.length });
};
