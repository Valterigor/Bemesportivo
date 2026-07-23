import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const options = () => process.env.NETLIFY_BLOBS_CONTEXT ? { siteID: process.env.SITE_ID, token: process.env.NETLIFY_BLOBS_CONTEXT } : {};
const store = () => getStore({ name: 'bem-esportivo-routine-push', consistency: 'strong', ...options() });

export default async () => {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT || 'mailto:contato@bemesportivo.com';
  if (!publicKey || !privateKey) { console.log('Routine push skipped: VAPID keys are not configured.'); return; }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const targetStore = store();
  let cursor;
  const now = Date.now();
  do {
    const page = await targetStore.list({ prefix: 'install-', cursor });
    for (const blob of page.blobs || []) {
      const record = await targetStore.get(blob.key, { type: 'json', consistency: 'strong' });
      if (!record?.subscription || !Array.isArray(record.reminders)) continue;
      const due = record.reminders.filter(item => Date.parse(item.dueAt) <= now + 30000);
      if (!due.length) continue;
      try {
        await webpush.sendNotification(record.subscription, JSON.stringify({ title: 'Meu Caminho Be', body: 'Você tem um compromisso planejado para agora.', tag: due[0].key, url: '/meu-caminho-be#agenda' }), { TTL: 3600, urgency: 'normal' });
        const dueKeys = new Set(due.map(item => item.key));
        record.reminders = record.reminders.filter(item => !dueKeys.has(item.key));
        record.lastSentAt = new Date().toISOString();
        if (record.reminders.length) await targetStore.setJSON(blob.key, record);
        else await targetStore.delete(blob.key);
      } catch (error) {
        if ([404, 410].includes(error?.statusCode)) await targetStore.delete(blob.key);
        else console.error('Routine push failed', error?.statusCode || error?.message || error);
      }
    }
    cursor = page.next_cursor;
  } while (cursor);
};

export const config = { schedule: '* * * * *' };
