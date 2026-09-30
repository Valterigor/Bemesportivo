const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers: 'block' });

test('tema persiste e voltar ao topo recupera o foco de navegação', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:3100' ? route.continue() : route.abort());
  await page.addInitScript(() => localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.selectOption('#home-theme-select', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-home-theme', 'light');
  await expect(page.locator('#home-theme-select')).toHaveValue('light');
  await page.locator('.feed-tools').scrollIntoViewIfNeeded();
  await expect(page.locator('#topBtn')).toBeVisible();
  await page.locator('#topBtn').click();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('#topBtn')).toBeHidden();
});

test('feed filtra as editorias e mantém o layout dentro da tela', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:3100' ? route.continue() : route.abort());
  await page.addInitScript(() => localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false })));
  await page.goto('/');
  await page.getByRole('button', { name: 'Vídeos', exact: true }).click();
  await expect(page.locator('.feed-post:visible')).toHaveCount(1);
  await expect(page.locator('.feed-post:visible')).toContainText('Resultado não acontece por acaso');
  await expect(page.getByRole('button', { name: 'Vídeos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Histórias', exact: true }).click();
  await expect(page.locator('.feed-post:visible')).toHaveCount(3);
  await page.getByRole('button', { name: 'Para praticar', exact: true }).click();
  await expect(page.locator('.feed-post:visible')).toHaveCount(4);
  await expect(page.locator('.feed-post:visible').first()).toContainText('Radar SP');
  await page.getByRole('button', { name: 'Estilo', exact: true }).click();
  await expect(page.locator('.feed-post:visible')).toHaveCount(1);
  await expect(page.locator('.feed-post:visible')).toContainText('Moda Fitness');
  await page.getByRole('button', { name: 'Tudo', exact: true }).click();
  await expect(page.locator('.feed-post:visible')).toHaveCount(9);
  await expect(page.locator('.feed-post-header strong')).toHaveText(['Reportagens', 'BePlay', 'Fala Bem!', 'Radar SP', 'Conhecimento', 'Profissionais', 'Meu Caminho Be', 'Moda Fitness', 'Reportagens']);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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
  await expect(page.locator('#be-ecosystem-search-results')).toContainText('Minha primeira corrida');
  await page.locator('#home-interest').selectOption('futebol');
  await page.reload();
  await expect(page.locator('#home-interest')).toHaveValue('futebol');
  await page.locator('#be-ecosystem-search-input').fill('Quero começar a correr');
  await page.locator('#be-ecosystem-search-form').getByRole('button', { name: 'Encontrar' }).click();
  await page.locator('#home-interest').selectOption('corrida');
  await expect(page.locator('#be-ecosystem-search-results')).toContainText('Minha primeira corrida');
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
