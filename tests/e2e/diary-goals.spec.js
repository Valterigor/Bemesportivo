const { test, expect } = require('@playwright/test');
const { enterDiary } = require('./helpers/diary-entry');
test.use({ serviceWorkers: 'block' });
for (const width of [390, 1440]) {
  test(`goals and library without AI at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const external = [];
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') return route.continue();
      external.push(url.href); return route.abort();
    });
    await page.addInitScript(() => {
      if (localStorage.getItem('goalsTestSeed')) return;
      localStorage.setItem('goalsTestSeed', '1');
      localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({ name: 'Ana', identityCreatedAt: new Date().toISOString(), sportProfile: { modality: 'corrida' } }));
      localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false, updatedAt: new Date().toISOString() }));
    });
    await page.goto('/meu-caminho-be'); await enterDiary(page);
    const form = page.locator('#be-goal-form');
    await expect(form).toBeVisible();
    await form.locator('[name=target]').fill('2');
    await page.locator('#be-goal-save').click();
    await expect(page.locator('#be-goal-list')).toContainText('0 de 2');
    await page.evaluate(() => {
      const date = window.BeDiaryGoals.day();
      localStorage.setItem('meuCaminhoBeDiaryV1', JSON.stringify([{ id: 'a', date, type: 'corrida', duration: 20 }]));
      window.dispatchEvent(new CustomEvent('meuCaminhoBe:diary-changed'));
    });
    await expect(page.locator('#be-goal-list')).toContainText('1 de 2');
    await page.locator('#be-goal-list').getByRole('button', { name: 'Editar', exact: true }).click();
    await form.locator('[name=target]').fill('1'); await page.locator('#be-goal-save').click();
    await expect(page.locator('#be-goal-list')).toContainText('Alcançada');
    await page.locator('#be-goal-list').getByRole('button', { name: 'Pausar', exact: true }).click();
    await expect(page.locator('#be-goal-list')).toContainText('Pausada');
    const backupDownload = page.waitForEvent('download');
    await page.locator('#fb-export-profile').evaluate(button => button.click());
    const backup = await backupDownload;
    const fs = require('node:fs');
    const payload = JSON.parse(fs.readFileSync(await backup.path(), 'utf8'));
    expect(payload.goals).toHaveLength(1);
    expect(payload.goals[0].paused).toBe(true);
    await page.reload(); await enterDiary(page);
    await expect(page.locator('#be-goal-list')).toContainText('Pausada');
    const initial = await page.locator('#be-goal-tip h3').textContent();
    await page.locator('#be-tip-topic').selectOption('nutrition');
    await expect(page.locator('#be-goal-tip h3')).not.toHaveText(initial);
    await expect(page.locator('#be-goal-tip details a').first()).toHaveAttribute('href', /^https:\/\//);
    expect(external.some(url => /openai|anthropic|gemini/i.test(url))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) await page.locator('#be-goals').screenshot({ path: 'test-results/diary-goals-mobile.png' });
    page.once('dialog', d => d.accept());
    await page.locator('#be-goal-list').getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.locator('#be-goal-list')).toContainText('primeira meta');
    page.once('dialog', d => d.accept());
    await page.locator('#fb-import-profile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeGoalsV1')).length)).toBe(1);
  });
}
