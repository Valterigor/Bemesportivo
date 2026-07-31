import webpush from 'web-push';

const installationPrefix = 'routine:install:';
const maximumRecordsPerRun = 25;
const recordTtlSeconds = 100 * 24 * 60 * 60;

async function readJson(store, key) {
  return store.get(key, { type: 'json' });
}

async function writeJson(store, key, value, options = {}) {
  await store.put(key, JSON.stringify(value), options);
}

function configuration(env) {
  const publicKey = String(env.WEB_PUSH_PUBLIC_KEY || '');
  const privateKey = String(env.WEB_PUSH_PRIVATE_KEY || '');
  const subject = String(env.WEB_PUSH_SUBJECT || 'mailto:contato@bemesportivo.com');
  return { publicKey, privateKey, subject, ready: Boolean(publicKey && privateKey) };
}

async function publishPublicConfiguration(env, publicKey) {
  const current = await readJson(env.BE_DATA, 'routine:config');
  if (current?.publicKey === publicKey) return;
  await writeJson(env.BE_DATA, 'routine:config', {
    publicKey,
    provider: 'cloudflare-workers',
    updatedAt: new Date().toISOString()
  });
}

async function processNotifications(env) {
  const settings = configuration(env);
  if (!settings.ready) {
    console.log('Routine push skipped: VAPID secrets are not configured.');
    return { configured: false, checked: 0, sent: 0 };
  }

  await publishPublicConfiguration(env, settings.publicKey);
  webpush.setVapidDetails(settings.subject, settings.publicKey, settings.privateKey);

  const now = Date.now();
  let cursor;
  let checked = 0;
  let sent = 0;

  do {
    const page = await env.BE_DATA.list({
      prefix: installationPrefix,
      limit: Math.min(100, maximumRecordsPerRun - checked),
      ...(cursor ? { cursor } : {})
    });
    for (const item of page.keys || []) {
      if (checked >= maximumRecordsPerRun) break;
      checked += 1;
      const record = await readJson(env.BE_DATA, item.name);
      if (!record?.subscription || !Array.isArray(record.reminders)) continue;
      const due = record.reminders.filter(reminder => Date.parse(reminder.dueAt) <= now + 30_000);
      if (!due.length) continue;

      try {
        await webpush.sendNotification(record.subscription, JSON.stringify({
          title: 'Meu Caminho Be',
          body: 'Você tem um compromisso planejado para agora.',
          tag: due[0].key,
          url: '/meu-caminho-be#agenda'
        }), { TTL: 3600, urgency: 'normal' });
        const sentKeys = new Set(due.map(reminder => reminder.key));
        record.reminders = record.reminders.filter(reminder => !sentKeys.has(reminder.key));
        record.lastSentAt = new Date().toISOString();
        if (record.reminders.length) {
          await writeJson(env.BE_DATA, item.name, record, { expirationTtl: recordTtlSeconds });
        } else {
          await env.BE_DATA.delete(item.name);
        }
        sent += 1;
      } catch (error) {
        if ([404, 410].includes(Number(error?.statusCode || 0))) {
          await env.BE_DATA.delete(item.name);
        } else {
          console.error('Routine push failed', error?.statusCode || error?.message || error);
        }
      }
    }
    cursor = page.list_complete || checked >= maximumRecordsPerRun ? undefined : page.cursor;
  } while (cursor && checked < maximumRecordsPerRun);

  return { configured: true, checked, sent };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/health') {
      return new Response('Not found', { status: 404 });
    }
    const settings = configuration(env);
    if (settings.publicKey) await publishPublicConfiguration(env, settings.publicKey);
    return Response.json({
      ok: true,
      configured: settings.ready,
      scheduler: 'cloudflare-cron'
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  },

  async scheduled(_controller, env, context) {
    context.waitUntil(processNotifications(env));
  }
};
