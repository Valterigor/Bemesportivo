const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC_PAGES = fs.readdirSync(process.cwd())
  .filter(file => file.endsWith('.html'))
  .filter(file => !['admin.html', 'design-system.html'].includes(file))
  .map(file => file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`);

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3100') return route.continue();
    if (route.request().resourceType() === 'document') {
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Conteudo externo</title>' });
    }
    return route.abort('blockedbyclient');
  });

  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });
});

for (const viewport of VIEWPORTS) {
  for (const route of PUBLIC_PAGES) {
    test(`${viewport.name} abre ${route}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const runtimeErrors = [];
      const brokenLocalRequests = [];
      page.on('pageerror', error => runtimeErrors.push(error.message));
      page.on('response', response => {
        const url = new URL(response.url());
        if (url.origin === 'http://127.0.0.1:3100' && response.status() >= 400) {
          brokenLocalRequests.push(`${response.status()} ${url.pathname}`);
        }
      });

      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10_000 });
      await page.waitForTimeout(120);
      const layout = await page.evaluate(() => {
        const bodyStyle = getComputedStyle(document.body);
        const main = document.querySelector('main, [role="main"], .home-redesign, #fala-bem-app');
        const mainRect = main?.getBoundingClientRect();
        const mainStyle = main ? getComputedStyle(main) : null;
        return {
          title: document.title.trim(),
          bodyVisible: bodyStyle.display !== 'none' && bodyStyle.visibility !== 'hidden' && Number(bodyStyle.opacity) !== 0,
          mainVisible: Boolean(main && mainRect.width > 0 && mainRect.height > 0 && mainStyle.display !== 'none' && mainStyle.visibility !== 'hidden'),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });

      expect(response?.status()).toBeLessThan(400);
      expect(layout.title).not.toBe('');
      expect(layout.bodyVisible).toBe(true);
      expect(layout.mainVisible).toBe(true);
      expect(layout.overflow).toBeLessThanOrEqual(2);
      expect(runtimeErrors).toEqual([]);
      expect([...new Set(brokenLocalRequests)]).toEqual([]);
    });
  }
}
