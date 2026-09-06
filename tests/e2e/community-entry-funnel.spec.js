const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

const consent = {
  version: 2,
  necessary: true,
  measurement: false,
  advertising: false,
  updatedAt: new Date().toISOString()
};

test('visitante começa pelo Perfil Be com o registro preservado como destino', async ({ page }) => {
  await page.addInitScript(value => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify(value));
  }, consent);

  await page.goto('/');
  const cta = page.locator('#be-home-path-cta');
  await expect(cta).toContainText('Registrar minha atividade');
  await cta.click();

  await expect(page).toHaveURL(/\/meu-caminho-be\/registrar$/);
  await expect(page.getByRole('heading', { name: 'Crie seu Perfil Be.' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('meuCaminhoBePendingRegistrationV1'))).toBe('registrar');
});

test('perfil pronto vai direto ao registro e recebe o card após salvar', async ({ page }) => {
  await page.addInitScript(value => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify(value));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Pessoa Teste',
      identityCreatedAt: new Date().toISOString(),
      objective: 'comecar',
      practice: 'none',
      availability: '15',
      progress: 1,
      createdAt: new Date().toISOString()
    }));
  }, consent);

  await page.goto('/');
  const cta = page.locator('#be-home-path-cta');
  await expect(cta).toContainText('Registrar minha atividade');
  await cta.click();

  await expect(page).toHaveURL(/\/meu-caminho-be\/registrar$/);
  await expect(page.locator('[data-fb-panel="registrar"]')).toBeVisible();
  await page.getByRole('button', { name: 'Registrar minha atividade' }).click();
  await page.locator('#be-entry-duration').fill('30');
  await page.locator('#be-entry-title').fill('Corrida no parque');
  await page.locator('#be-entry-form').getByRole('button', { name: 'Registrar no diário' }).click();

  const shareDialog = page.locator('#be-share-dialog');
  await expect(shareDialog).toBeVisible();
  await expect(shareDialog).toContainText('Stories e Status');
  await expect(shareDialog).toContainText('Feed e WhatsApp');
});
