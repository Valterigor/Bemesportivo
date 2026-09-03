const { createHash } = require('node:crypto');
const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('demonstração local apresenta o novo modelo sem depender de um perfil real', async ({ page }) => {
  await page.goto('/perfil-publico?preview=1');
  await expect(page.locator('#be-public-name')).toHaveText('Marina em Movimento');
  await expect(page.locator('#be-public-share-profile')).toBeVisible();
  await expect(page.locator('#be-public-count')).toHaveText('2');
});

test('perfil público apresenta identidade esportiva e compartilhamento exclusivo do proprietário', async ({ page }) => {
  const ownerCode = 'A'.repeat(32);
  const ownerId = createHash('sha256').update(`be-sync-id:${ownerCode}`).digest('hex');
  const slug = `be-${ownerId.slice(0, 12)}`;
  await page.addInitScript(code => {
    if (sessionStorage.getItem('bePublicProfileVisitorTest') !== '1') localStorage.setItem('meuCaminhoBePublicCodeV1', code);
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  }, ownerCode);
  await page.route(`**/api/public-profiles/${slug}`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      slug,
      profile: {
        displayName: 'Marina em Movimento',
        favoriteSport: 'Corrida',
        bio: 'Corro para cuidar de mim e celebrar cada novo passo.',
        photoDataUrl: ''
      },
      posts: [
        { id: 'momento-1', kind: 'text', text: 'Primeiros cinco quilômetros concluídos.', activity: 'Corrida', occurredAt: '2026-08-20', postType: 'achievement', personalBest: true, likes: 3, comments: [] },
        { id: 'momento-2', kind: 'text', text: 'Treino leve para manter a constância.', activity: 'Corrida', occurredAt: '2026-08-25', postType: 'training', personalBest: false, likes: 2, comments: [] }
      ]
    })
  }));

  await page.setViewportSize({ width: 1180, height: 900 });
  await page.goto(`/diario/${slug}`);
  await expect(page.locator('#be-public-name')).toHaveText('Marina em Movimento');
  await expect(page.locator('#be-public-sport')).toHaveText('Corrida');
  await expect(page.locator('#be-public-count')).toHaveText('2');
  await expect(page.locator('#be-public-likes')).toHaveText('5');
  await expect(page.locator('#be-public-highlights')).toHaveText('1');
  await expect(page.locator('#be-public-share-profile')).toBeVisible();
  await expect(page.locator('#be-public-profile-destination')).toHaveText('Gerenciar meu perfil');
  if (process.env.CAPTURE_PROFILE_PREVIEW === '1') await page.screenshot({ path: 'test-results/public-profile-preview.png', fullPage: true });
  await page.locator('#be-public-share-profile').click();
  await expect(page.locator('#be-share-dialog')).toBeVisible();
  await expect(page.locator('#be-share-dialog [data-share-format="story"]')).toBeVisible();
  await page.locator('.be-share-close').click();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#be-public-content')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  if (process.env.CAPTURE_PROFILE_PREVIEW === '1') await page.screenshot({ path: 'test-results/public-profile-preview-mobile.png', fullPage: true });

  await page.evaluate(() => {
    sessionStorage.setItem('bePublicProfileVisitorTest', '1');
    localStorage.removeItem('meuCaminhoBePublicCodeV1');
    localStorage.removeItem('meuCaminhoBeContinuityCodeV1');
  });
  await page.reload();
  await expect(page.locator('#be-public-share-profile')).toBeHidden();
  await expect(page.locator('#be-public-profile-destination')).toHaveText('Criar meu Perfil Be');
});
