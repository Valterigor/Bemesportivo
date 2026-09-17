const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });
async function openDiary(page, view) {
  await page.locator('#be-diary-cover').click();
  await page.locator('#be-diary-welcome-continue').click();
  await expect(page.locator('#be-diary-welcome')).toBeHidden();
  await page.evaluate(view => window.falaBemOpenView(view), view);
}
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({ name: 'Maria', story: 'Minha história no esporte.', identityCreatedAt: new Date().toISOString() }));
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false, updatedAt: new Date().toISOString() }));
  });
});

for (const width of [390, 1440]) {
  test(`history and evolution without a map at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/meu-caminho-be/jornada');
    await openDiary(page, 'progresso');
    await expect(page.locator('#be-diary-cover')).toBeHidden();
    await expect(page.locator('[data-fb-panel="progresso"]')).toBeVisible();
    await page.evaluate(() => window.falaBemOpenView('evolucao'));
    await expect(page.locator('[data-fb-panel="evolucao"]')).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1')).objective)).toBeUndefined();
  });
}

test('private post preview explains audience without publishing', async ({ page }) => {
  let publications = 0;
  await page.route('**/api/public-profiles/publish', route => { publications += 1; return route.abort(); });
  await page.goto('/meu-caminho-be/perfil');
  await openDiary(page, 'perfil');
  await page.locator('#be-profile-create-post').click();
  await page.locator('#be-public-compose-text').fill('Minha primeira caminhada no parque.');
  await page.locator('#be-compose-preview-details summary').click();
  await expect(page.locator('#be-compose-post-preview')).toContainText('Minha primeira caminhada no parque.');
  await expect(page.locator('#be-public-compose-visibility-help')).toContainText('privado');
  await expect(page.locator('#be-compose-post-preview button')).toHaveCount(0);
  expect(publications).toBe(0);
  await page.locator('#be-public-compose-cancel').click();
  await page.locator('[data-be-view-profile]').last().click();
  await expect(page.locator('#be-profile-preview-share-status')).toContainText('privada');
});

test('owner can pin and unpin a public moment', async ({ page }) => {
  await page.addInitScript(() => {
    const profile = JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1'));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({ ...profile, publicEnabled: true }));
  });
  let pinned = false;
  await page.route('**/api/public-profiles/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/pin')) pinned = route.request().postDataJSON().pinned;
    const payload = path.endsWith('/mine') ? {
      slug: 'be-aaaaaaaaaaaa', record: { profileStatus: 'published', posts: [{ id: 'moment-1', clientId: 'local-1', status: 'published', pinned, text: 'Minha primeira prova.', occurredAt: '2026-09-10' }] }
    } : { ok: true, pinned };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.goto('/meu-caminho-be/perfil');
  await openDiary(page, 'perfil');
  const pin = page.locator('[data-be-public-pin="moment-1"]');
  await expect(pin).toHaveText('Fixar no perfil');
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  expect(pinned).toBe(true);
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'false');
  expect(pinned).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
