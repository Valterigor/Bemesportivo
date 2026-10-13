const { test, expect } = require('@playwright/test');
const { enterDiary } = require('./helpers/diary-entry');

for (const width of [320, 390, 768, 1440]) {
  test(`simple profile and editing layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false, updatedAt: new Date().toISOString() }));
    });
    await page.goto('/meu-caminho-be');
    await enterDiary(page);
    await page.locator('#fb-profile-name').fill('Ana');
    await page.locator('#fb-profile-sport').selectOption('corrida');
    await page.locator('#fb-profile-save').click();
    await expect(page.locator('#be-profile-ready')).toBeVisible();
    const firstEntry = page.locator('#be-profile-ready [data-be-new-entry]');
    await expect(firstEntry).toBeFocused();
    await firstEntry.click();
    await expect(page.locator('#be-entry-form')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('#be-profile-edit').click();
    const copy = page.locator('.be-profile-social-copy');
    await expect(copy).toBeVisible();
    const bounds = await copy.boundingBox();
    expect(bounds.width).toBeGreaterThan(width < 400 ? 200 : 250);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.locator('#fb-profile-story').fill('Minha história continua.');
    await page.locator('#fb-profile-save').click();
    await expect(page.locator('#be-profile-display-bio')).toHaveText('Minha história continua.');
  });
}
