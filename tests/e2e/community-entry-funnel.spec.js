const { enterDiary } = require('./helpers/diary-entry');
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
  await enterDiary(page);

  await expect(page).toHaveURL(/\/meu-caminho-be\/perfil$/);
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Meu diário Be.' })).toBeVisible();
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
  await enterDiary(page);

  await expect(page).toHaveURL(/\/meu-caminho-be\/registrar$/);
  await expect(page.locator('[data-fb-panel="registrar"]')).toBeVisible();
  await page.getByRole('button', { name: 'Registrar minha atividade' }).click();
  await page.locator('#be-entry-duration').fill('30');
  await page.locator('#be-entry-title').fill('Corrida no parque');
  await page.locator('#be-entry-form').getByRole('button', { name: 'Registrar no diário' }).click();

  const recognition = page.locator('#be-recognition-dialog');
  await expect(recognition).toBeVisible();
  await expect(recognition).toContainText('BIBLIOTECA BeM');
  await expect(page.locator('#be-share-dialog')).not.toBeVisible();
  await recognition.getByRole('button', { name: 'Criar um card para compartilhar' }).click();
  const shareDialog = page.locator('#be-share-dialog');
  await expect(shareDialog).toBeVisible();
  await expect(shareDialog).toContainText('Stories e Status');
  await expect(shareDialog).toContainText('Feed e WhatsApp');
});

test('primeiro acesso registra sem Mapa BeM e reencontra sua mensagem ao voltar', async ({ page }) => {
  await page.addInitScript(value => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify(value));
  }, consent);
  await page.goto('/');
  await page.locator('#be-home-path-cta').click();
  await enterDiary(page);
  await page.locator('#fb-profile-name').fill('Ana');
  await page.locator('#fb-profile-sport').selectOption('corrida');
  await page.locator('#fb-profile-story').fill('Estou começando a correr e quero guardar meus treinos.');
  await page.locator('#fb-profile-save').click();
  await expect(page.locator('[data-fb-panel="registrar"]')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1')).objective)).toBeFalsy();
  await page.locator('[data-fb-panel="registrar"] [data-be-new-entry]').click();
  await expect(page.locator('#be-entry-optional-details')).not.toHaveAttribute('open', '');
  await page.locator('#be-entry-duration').fill('15');
  await page.locator('#be-entry-form button[type="submit"]').click();
  const dialog = page.locator('#be-recognition-dialog');
  await expect(dialog).toBeVisible();
  const phrase = await dialog.locator('[data-recognition-message]').textContent();
  await page.locator('#be-recognition-done').click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await enterDiary(page);
  await expect(page.locator('[data-fb-panel="registrar"] [data-recognition-message]')).toHaveText(phrase);
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1')).length)).toBe(1);
});

test('falha ao guardar não apresenta recompensa nem perde o formulário', async ({ page }) => {
  await page.addInitScript(value => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify(value));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({ name: 'Ana', identityCreatedAt: new Date().toISOString() }));
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, data) {
      if (key === 'meuCaminhoBeDiaryV1') throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, data);
    };
  }, consent);
  await page.goto('/meu-caminho-be/registrar');
  await enterDiary(page);
  await page.locator('[data-fb-panel="registrar"] [data-be-new-entry]').click();
  await page.locator('#be-entry-duration').fill('15');
  await page.locator('#be-entry-form button[type="submit"]').click();
  await expect(page.locator('#be-entry-feedback')).toContainText('Não foi possível salvar');
  await expect(page.locator('#be-entry-dialog')).toBeVisible();
  await expect(page.locator('#be-recognition-dialog')).not.toBeVisible();
  await expect(page.locator('#be-entry-duration')).toHaveValue('15');
});
