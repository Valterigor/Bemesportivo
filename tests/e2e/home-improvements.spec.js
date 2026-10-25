const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers: 'block' });

test('vídeo respeita movimento reduzido e voltar ao topo recupera o foco', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const video=page.locator('#hero-video');
  await expect(video).toBeVisible();
  expect(await video.evaluate(v=>v.paused)).toBe(true);
  await page.locator('#pause').click();
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(false);
  await page.locator('#pause').click();
  expect(await video.evaluate(v=>v.paused)).toBe(true);
  await page.locator('.feed-tools').scrollIntoViewIfNeeded();
  await expect(page.locator('#topBtn')).toBeVisible();
  await page.locator('#topBtn').click();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('capas completas e layout responsivo da nova home', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cards .card')).toHaveCount(9);
  await expect(page.locator('.feed-tool-card')).toHaveCount(6);
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for (const img of await page.locator('.cards .card img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
      const ratio=await img.evaluate(i=>Math.abs(i.getBoundingClientRect().width/i.getBoundingClientRect().height-i.naturalWidth/i.naturalHeight));
      expect(ratio).toBeLessThan(0.03);
    }
  }
});

test('home oferece teclado, busca direta e preferencia reversivel', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:3100' ? route.continue() : route.abort());
  await page.addInitScript(() => localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false })));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.home-skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.locator('#be-ecosystem-search-input').fill('Quero começar a correr');
  await page.locator('#be-ecosystem-search-form').getByRole('button', { name: 'Encontrar' }).click();
  await expect(page.locator('#be-search-result-title')).toBeFocused();
  await expect(page.locator('#be-ecosystem-search-results')).toContainText('Escolha uma atividade para sua rotina');
  await page.locator('#home-interest').selectOption('futebol');
  await page.reload();
  await expect(page.locator('#home-interest')).toHaveValue('futebol');
  await page.locator('#be-ecosystem-search-input').fill('Quero começar a correr');
  await page.locator('#be-ecosystem-search-form').getByRole('button', { name: 'Encontrar' }).click();
  await page.locator('#home-interest').selectOption('corrida');
  await expect(page.locator('#be-ecosystem-search-results')).toContainText('Escolha uma atividade para sua rotina');
  await page.locator('#home-interest').selectOption('');
  expect(await page.evaluate(() => localStorage.getItem('bemEsportivoSportPreferenceV1'))).toBeNull();
  await expect(page.locator('.be-search-discovery')).toBeHidden();
  await expect(page.locator('#be-ecosystem-search-input')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/');
  await page.screenshot({ path: '.local-reference/home-mobile-improved.png', fullPage: false });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: '.local-reference/home-desktop-improved.png', fullPage: false });
});
