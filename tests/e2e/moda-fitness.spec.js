const { test, expect } = require('@playwright/test');

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`fashion editorial and photo viewer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 768 ? 390 : 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/moda-fitness');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Moda em');
    const modelInstagram = page.getByRole('link', { name: /Instagram de Heloísa Gouvea/ });
    await expect(modelInstagram).toHaveAttribute('href', 'https://www.instagram.com/helogouvea_/');
    await expect(modelInstagram).toHaveAttribute('target', '_blank');
    await expect(modelInstagram).toHaveAttribute('rel', 'noopener noreferrer');
    const brandInstagram = page.getByRole('link', { name: /Instagram da B Malzone Store/ });
    await expect(brandInstagram).toHaveAttribute('href', 'https://www.instagram.com/bmalzonestore/');
    await expect(brandInstagram).toHaveAttribute('target', '_blank');
    await expect(brandInstagram).toHaveAttribute('rel', 'noopener noreferrer');
    const photos = page.locator('.fashion-editorial .fashion-photo-button, .fashion-triptych .fashion-photo-button');
    await expect(photos).toHaveCount(8);
    const catalogPhotos = page.locator('.fashion-catalog-card');
    await expect(catalogPhotos).toHaveCount(91);
    await expect(page.locator('#fashion-catalog-count')).toHaveText('91 fotografias');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await photos.first().click();
    await expect(page.locator('#fashion-lightbox')).toBeVisible();
    expect(await page.locator('#fashion-lightbox').evaluate(dialog => dialog.scrollHeight <= dialog.clientHeight)).toBe(true);
    await expect(page.locator('#fashion-lightbox-position')).toHaveText('1 / 8');
    await expect(page.locator('#fashion-lightbox-image')).toHaveAttribute('src', /azul-essencial/);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#fashion-lightbox-position')).toHaveText('2 / 8');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#fashion-lightbox-position')).toHaveText('8 / 8');
    await page.keyboard.press('Escape');
    await expect(page.locator('#fashion-lightbox')).toBeHidden();
    await expect(photos.first()).toBeFocused();
    await page.getByRole('button', { name: /Roxa \/ lilás 30/ }).click();
    await expect(page.locator('.fashion-catalog-card:visible')).toHaveCount(30);
    await expect(page.locator('#fashion-catalog-count')).toHaveText('30 fotografias');
    for (const photo of await photos.all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    await page.locator('h1').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/moda-fitness-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('editorial photographs remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3100/moda-fitness');
  await expect(page.locator('.fashion-static-photo')).toHaveCount(8);
  await expect(page.locator('.fashion-static-photo').first()).toBeVisible();
  await context.close();
});
