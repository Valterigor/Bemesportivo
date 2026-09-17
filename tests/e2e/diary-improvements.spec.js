const { test, expect } = require('@playwright/test');

test('weekly summary, repeat activity and photo backup round trip', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.addInitScript(() => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({ name: 'Maria', identityCreatedAt: now.toISOString() }));
    localStorage.setItem('meuCaminhoBeDiaryV1', JSON.stringify([
      { id: 'photo-test', date, type: 'caminhada', duration: 30, distance: 2, note: 'Minha caminhada. '.repeat(25), imageDataUrl: 'data:image/jpeg;base64,/9j/2Q==', visibility: 'public' },
      { id: 'future-test', date: '2099-12-31', type: 'corrida', duration: 90 }
    ]));
  });
  await page.goto('/meu-caminho-be', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#be-weekly-summary')).toContainText('1 dia nesta semana: 30 min');
  // Exercise the handlers independently of the welcome overlay.
  await page.evaluate(() => document.getElementById('be-repeat-last').click());
  await expect(page.locator('#be-entry-id')).toHaveValue('');
  await expect(page.locator('#be-entry-type')).toHaveValue('caminhada');
  await expect(page.locator('#be-entry-duration')).toHaveValue('30');
  await expect(page.locator('#be-entry-note')).toHaveValue('');
  await expect(page.locator('#be-entry-form input[name="visibility"][value="private"]')).toBeChecked();
  await page.evaluate(() => document.getElementById('be-entry-cancel').click());
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(() => document.getElementById('fb-export-profile').click());
  const download = await downloadPromise;
  const fs = require('node:fs/promises');
  const payload = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  const entry = payload.diary.find(item => item.id === 'photo-test');
  expect(entry.imageDataUrl).toBe('data:image/jpeg;base64,/9j/2Q==');
  expect(entry.note.length).toBeGreaterThan(280);
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#fb-import-profile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
  await expect(page.locator('#fb-profile-feedback')).toContainText('Backup restaurado');
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1')));
  expect(restored.find(item => item.id === 'photo-test')).toMatchObject({ imageDataUrl: entry.imageDataUrl, note: entry.note, visibility: 'private' });
});
