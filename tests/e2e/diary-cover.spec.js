const { test, expect } = require('@playwright/test');

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  for (const hasProfile of [false, true]) {
    test(`diary entry ${viewport.width}px, profile: ${hasProfile}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      if (hasProfile) await page.addInitScript(() => {
        localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({ name: 'Maria', identityCreatedAt: new Date().toISOString() }));
      });
      await page.goto('/meu-caminho-be');
      const cover = page.getByRole('button', { name: 'Abrir Meu diário Be', exact: true });
      await expect(cover).toBeVisible();
      await expect(cover).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      expect(await cover.boundingBox()).toMatchObject({ x: 0, y: 0, ...viewport });
      if (hasProfile) {
        await cover.focus();
        await page.keyboard.press('Enter');
      } else {
        await page.mouse.click(12, 12);
      }
      await expect(cover).toBeHidden();
      await page.getByRole('button', { name: 'Recusar opcionais' }).click();
      await expect(page.locator(`[data-fb-panel="${hasProfile ? 'inicio' : 'perfil'}"]`)).toBeVisible();
      await expect(page.locator(hasProfile ? '.be-diary-intro' : '#be-profile-onboarding')).toContainText(hasProfile ? 'Seu dia, seus planos' : 'Bem-vindo ao Meu diário Be');
      await expect(page.locator('#fb-daily-welcome')).not.toBeVisible();
      await page.reload();
      await expect(cover).toBeVisible();
    });
  }
}
