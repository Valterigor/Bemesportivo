// Each accepted batch owns a key: concurrent requests never overwrite a counter.
export function countEvents(events) {
  const counts = {};
  for (const event of events) counts[event.name] = (counts[event.name] || 0) + 1;
  return counts;
}

export async function summarizeAnalytics(store, maximumPages = 10) {
  const counts = {};
  const dates = new Set();
  let cursor;
  let complete = false;
  let total = 0;
  let count = 0;
  for (let page = 0; page < maximumPages; page += 1) {
    const listed = await store.list({ prefix: 'analytics:', cursor, limit: 100 });
    const keys = listed.keys || [];
    // Older batches have no metadata. Read them in bounded groups.
    for (let offset = 0; offset < keys.length; offset += 20) {
      const records = await Promise.all(keys.slice(offset, offset + 20).map(async key => {
        if (key.metadata?.schemaVersion === 2) return key.metadata;
        const record = await store.get(key.name, { type: 'json' });
        return record ? { date: record.createdAt?.slice(0, 10), counts: countEvents(record.events || []) } : null;
      }));
      for (const record of records) {
        if (!record) continue;
        count += 1;
        if (record.date) dates.add(record.date);
        for (const [name, value] of Object.entries(record.counts || {})) {
          if (!Number.isSafeInteger(value) || value < 0) continue;
          counts[name] = (counts[name] || 0) + value;
          total += value;
        }
      }
    }
    complete = Boolean(listed.list_complete);
    cursor = listed.cursor;
    if (complete || !cursor) break;
  }
  return {
    count, complete, total, days: dates.size,
    byName: Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name, count: value }))
  };
}
