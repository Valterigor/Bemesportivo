const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

async function interceptAdvertising(context) {
  const requests = [];
  await context.route('https://pagead2.googlesyndication.com/**', async route => {
    requests.push(route.request().url());
    await route.fulfill({ contentType: 'application/javascript', body: '' });
  });
  return requests;
}

test('publicidade exige aceite, persiste e para após revogação', async ({ page, context }) => {
  const requests = await interceptAdvertising(context);
  await page.goto('/');
  await expect(page.locator('.be-privacy-dialog')).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.locator('[data-privacy-reject]').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-advertising-consent', 'denied');
  expect(requests).toHaveLength(0);
  await page.locator('[data-privacy-settings]').first().click();
  await page.locator('[data-privacy-accept]').click();
  await expect.poll(() => requests.length).toBe(1);
  await page.reload();
  await expect.poll(() => requests.length).toBe(2);
  await page.locator('[data-privacy-settings]').first().click();
  await Promise.all([
    page.waitForEvent('load'),
    page.locator('[data-privacy-reject]').click()
  ]);
  await expect(page.locator('html')).toHaveAttribute('data-advertising-consent', 'denied');
  await expect(page.locator('script[data-bem-adsense]')).toHaveCount(0);
  expect(requests).toHaveLength(2);
});

test('aceite de medição não autoriza publicidade e páginas pessoais não a carregam', async ({ page, context }) => {
  const requests = await interceptAdvertising(context);
  await page.goto('/');
  await page.locator('.be-privacy-dialog summary').click();
  await page.locator('[name="measurement"]').check();
  await page.locator('[data-privacy-save]').click();
  await expect(page.locator('html')).toHaveAttribute('data-measurement-consent', 'granted');
  await expect(page.locator('html')).toHaveAttribute('data-advertising-consent', 'denied');
  expect(requests).toHaveLength(0);
  await page.locator('[data-privacy-settings]').first().click();
  await page.locator('[data-privacy-accept]').click();
  await expect.poll(() => requests.length).toBe(1);
  await page.goto('/meu-caminho-be');
  await expect(page.locator('script[data-bem-adsense]')).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test('revogação em outra aba interrompe o carregamento publicitário', async ({ page, context }) => {
  const requests = await interceptAdvertising(context);
  await page.goto('/');
  await page.locator('[data-privacy-accept]').click();
  await expect.poll(() => requests.length).toBe(1);
  const otherPage = await context.newPage();
  await otherPage.goto('/reportagens');
  await expect.poll(() => requests.length).toBe(2);
  await otherPage.locator('[data-privacy-settings]').first().click();
  await Promise.all([
    page.waitForEvent('load'),
    otherPage.waitForEvent('load'),
    otherPage.locator('[data-privacy-reject]').click()
  ]);
  for (const tab of [page, otherPage]) {
    await expect(tab.locator('html')).toHaveAttribute('data-advertising-consent', 'denied');
    await expect(tab.locator('script[data-bem-adsense]')).toHaveCount(0);
  }
  expect(requests).toHaveLength(2);
});
