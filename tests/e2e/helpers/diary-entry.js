const { expect } = require('@playwright/test');

async function enterDiary(page) {
  const cover = page.locator('#be-diary-cover');
  if (!await cover.count()) return;
  if (await cover.isVisible()) {
    await cover.click();
    await expect(cover).toBeHidden();
    await page.locator('#be-diary-welcome-continue').click();
    await expect(page.locator('#be-diary-welcome')).toBeHidden();
  }
}

module.exports = { enterDiary };
