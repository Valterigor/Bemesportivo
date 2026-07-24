import { getStore } from '@netlify/blobs';

const options = () => {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  return siteID && token ? { siteID, token } : {};
};

export default async () => {
  const store = getStore({
    name: 'bem-esportivo-analytics',
    consistency: 'strong',
    ...options()
  });
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 400);
  const cutoffDay = cutoff.toISOString().slice(0, 10);
  let cursor;
  do {
    const page = await store.list({ prefix: 'day-', cursor });
    for (const blob of page.blobs || []) {
      const day = blob.key.replace(/^day-/, '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && day < cutoffDay) await store.delete(blob.key);
    }
    cursor = page.next_cursor;
  } while (cursor);
};

export const config = { schedule: '17 4 * * *' };
