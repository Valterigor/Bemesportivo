const { test, expect } = require('@playwright/test');
const routes = ['/guias', '/guia-escolher-atividade', '/guia-metas-diario', '/guia-registro-alimentacao'];

for (const width of [320, 390, 1440]) {
  test(`public guides readable without scripts at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const route of routes) {
      const response = await page.goto(`http://127.0.0.1:3100${route}`);
      expect(response.status()).toBe(200);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://bemesportivo.com${route}`);
      await expect(page.locator('#be-site-navigation a[href="/guias"]')).toBeVisible();
      if (route !== '/guias') {
        await expect(page.locator('#fontes')).toBeVisible();
        await page.locator('.guide-summary a').first().click();
        await expect(page).toHaveURL(/#/);
      }
      const main = await page.locator('main').boundingBox();
      expect(main.x).toBeGreaterThanOrEqual(0);
      expect(main.x + main.width).toBeLessThanOrEqual(width);
      if (width === 390) await page.screenshot({ path: `test-results/${route.slice(1)}-mobile.png`, fullPage: true });
    }
    await context.close();
  });
}

test('home leads to public reading before service cards', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/');
  await expect(page.locator('#home-editorial-title')).toBeVisible();
  expect(await page.evaluate(() => document.querySelector('.home-editorial').compareDocumentPosition(document.querySelector('.feed-section')) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  await page.locator('.home-editorial a[href="/guia-metas-diario"]').click();
  await expect(page.locator('h1')).toContainText('Como criar metas');
  await expect(page.locator('#be-diary-cover')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('meuCaminhoBeProfileV1'))).toBeNull();
});
