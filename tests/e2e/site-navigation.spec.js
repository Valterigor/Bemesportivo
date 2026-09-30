const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test.use({ serviceWorkers: 'block' });
const embedded = ['admin.html', 'design-system.html', 'game.html', 'meu-caminho-be.html'];
const pages = fs.readdirSync(path.resolve(__dirname, '../..')).filter(file => file.endsWith('.html') && !embedded.includes(file));
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:3100' ? route.continue() : route.abort());
  await page.addInitScript(() => localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false })));
});

for (const file of pages) {
  test(`design da home com navegação contextual: ${file}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${file}`);
    const header = page.locator('#be-site-header');
    const nav = header.locator('#be-site-navigation');
    await expect(header).toHaveCount(1);
    await expect(header).toHaveAttribute('data-navigation-ready', 'true');
    await expect(header).toHaveCSS('background-color', 'rgb(8, 8, 8)');
    await expect(header.locator('.be-site-brand img')).toHaveCSS('height', '74px');
    expect(await header.evaluate(element => element.querySelector('nav').getBoundingClientRect().left - element.querySelector('.be-site-brand').getBoundingClientRect().left)).toBe(158);
    if (file !== 'index.html') {
      await expect(header.locator('.be-site-journey')).toHaveCount(0);
      await expect(header.getByText('Praticar e aprender', { exact: true })).toHaveCount(0);
    }
    const localLinks = await nav.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.hash.slice(1)));
    for (const id of localLinks) expect(await page.evaluate(id => Boolean(document.getElementById(id)), id)).toBe(true);
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(nav).toBeVisible();
      expect(await header.evaluate(element => element.scrollWidth <= innerWidth)).toBe(true);
      if (await header.locator('summary').count()) {
        await header.locator('summary').click();
        await expect(header.locator('.be-site-more-links')).toBeVisible();
        expect(await header.locator('.be-site-more-links').evaluate(element => element.getBoundingClientRect().right <= innerWidth)).toBe(true);
        await page.keyboard.press('Escape');
        await expect(header.locator('details')).not.toHaveAttribute('open', '');
        await expect(header.locator('summary')).toBeFocused();
      }
    }
  });
}

test('cada área conserva suas ações e os links internos funcionam', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/moda-fitness');
  const nav = page.locator('#be-site-navigation');
  await expect(nav.locator(':scope > a')).toHaveText(['Início', 'Conceito', 'Editorial', 'Catálogo', 'Contato']);
  await nav.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page).toHaveURL(/#catalogo$/);
  await expect(nav.getByRole('link', { name: 'Catálogo', exact: true })).toHaveAttribute('aria-current', 'location');
  await page.goto('/beplay');
  await expect(nav.locator(':scope > a')).toHaveText(['Início', 'Assistir', 'Playlist', 'Comentários', 'Minha lista']);
  await expect(page.locator('.topbar .topnav')).toHaveCount(0);
  await page.goto('/reportagens/thais-garcez-metamorfose');
  await nav.getByRole('link', { name: 'Relacionadas', exact: true }).click();
  await expect(page).toHaveURL(/#report-related$/);
});

test('menus próprios não recebem a navegação da home', async ({ page }) => {
  for (const file of embedded) {
    await page.goto(`/${file}`);
    await expect(page.locator('#be-site-header')).toHaveCount(0);
  }
  await page.goto('/meu-caminho-be?ferramenta=pace');
  await expect(page.locator('.fb-app-topbar')).toHaveCSS('background-color', 'rgb(8, 8, 8)');
  await expect(page.locator('#fb-mobile-menu-toggle')).toHaveCount(1);
  await expect(page.locator('.fb-app-nav')).toHaveCount(1);
  await page.locator('#tool-dialog-close').click();
  await page.locator('.fb-app-nav [data-fb-view="conteudos"]').click();
  await expect(page.locator('[data-fb-panel="conteudos"]')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#fb-mobile-menu-toggle').click();
  await expect(page.locator('#fb-mobile-drawer')).toBeVisible();
  await page.locator('#fb-mobile-drawer [data-fb-view="conteudos"]').click();
  await expect(page.locator('#fb-mobile-drawer')).toBeHidden();
  await expect(page.locator('[data-fb-panel="conteudos"]')).toBeVisible();
});

test('links de seção continuam disponíveis sem JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3100/moda-fitness');
  await page.locator('#be-site-navigation').getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page).toHaveURL(/#catalogo$/);
  await context.close();
});
