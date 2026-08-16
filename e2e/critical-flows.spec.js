const { test, expect } = require('@playwright/test');
const path = require('node:path');

test('BEPlay oferece uma ação real para acompanhar o canal', async ({ page }) => {
  await page.goto('/beplay');
  const follow = page.getByRole('link', { name: 'Seguir o Bem Esportivo no Instagram' });
  await expect(follow).toBeVisible();
  await expect(follow).toHaveAttribute('href', 'https://www.instagram.com/bemesportivo/');
  await expect(page.getByRole('button', { name: 'Inscrever-se' })).toHaveCount(0);
});

test('zerar processo apaga a jornada e confirma o recomeço', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
    if (!location.search.includes('reiniciado=1')) {
      localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
        name: 'Teste Be',
        objective: 'começar',
        experience: 'iniciante',
        availableTime: '20',
        createdAt: new Date().toISOString()
      }));
      localStorage.setItem('meuCaminhoBeDiaryV1', JSON.stringify([{ date: '2026-08-13', activity: 'Caminhada' }]));
    }
  });
  await page.goto('/meu-caminho-be/perfil');
  await page.getByRole('link', { name: 'Perfil', exact: true }).click();
  const reset = page.locator('.fb-profile-reset [data-fb-reset]');
  await expect(reset).toBeVisible();
  await reset.click();
  await expect(page.getByRole('dialog', { name: 'Zerar todo o processo?' })).toBeVisible();
  await page.getByRole('button', { name: 'Sim, zerar e recomeçar' }).click();
  await expect(page).toHaveURL(/\/meu-caminho-be\?reiniciado=1$/);
  const state = await page.evaluate(() => ({
    profile: localStorage.getItem('meuCaminhoBeProfileV1'),
    diary: JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1') || '[]'),
    meals: JSON.parse(localStorage.getItem('meuCaminhoBeMealsV1') || '[]')
  }));
  expect(state.profile).toBeNull();
  expect(state.diary).toEqual([]);
  expect(state.meals).toEqual([]);
  await expect(page.locator('#fb-celebration-title')).toHaveText('Processo zerado com sucesso.');
});

test('painel mantém a chave na sessão e apresenta a fila de moderação', async ({ page }) => {
  const token = 'chave-de-teste-administrativa-com-32-caracteres';
  await page.route('**/api/admin/overview', async route => {
    expect(route.request().headers()['x-be-admin-token']).toBe(token);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        generatedAt: '2026-08-13T15:00:00.000Z',
        community: {
          comments: 12,
          replies: 4,
          hidden: 1,
          reported: 1,
          moderation: [{
            channel: 'path:meu-caminho-be',
            id: 'comment-browser-test',
            name: 'Visitante',
            text: 'Comentário aguardando análise.',
            createdAt: '2026-08-13T14:00:00.000Z',
            reportCount: 2,
            hidden: false
          }]
        },
        services: {
          continuity: { count: 8 },
          notifications: { count: 5 },
          analytics: { count: 42 },
          ranking: { count: 19 }
        }
      })
    });
  });
  await page.goto('/admin');
  await page.getByLabel('Chave administrativa').fill(token);
  await page.getByRole('button', { name: 'Entrar no painel' }).click();
  await expect(page.getByRole('heading', { name: 'Painel Be', exact: true })).toBeVisible();
  await expect(page.locator('#metricComments')).toHaveText('12');
  await expect(page.getByText('Comentário aguardando análise.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ocultar' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('beAdminSessionToken'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('beAdminSessionToken'))).toBe(token);
});

test('diário guarda foto local e envia publicação somente após escolha explícita', async ({ page }) => {
  let publishedBody = null;
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false }));
    localStorage.setItem('meuCaminhoBeContinuityCodeV1', 'A'.repeat(32));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Atleta Teste', email: 'atleta@example.com', objective: 'comecar', publicAge: 32,
      profession: 'Professora', publicEnabled: true, story: 'Minha rotina esportiva.',
      sportProfile: { modality: 'corrida', role: '', visual: 'energia' }, createdAt: new Date().toISOString()
    }));
  });
  await page.route('**/api/public-profiles/**', async route => {
    if (route.request().method() === 'POST') publishedBody = route.request().postDataJSON();
    await route.fulfill({
      status: route.request().method() === 'POST' ? 202 : 200,
      contentType: 'application/json',
      body: JSON.stringify(route.request().method() === 'POST'
        ? { ok: true, slug: 'be-aaaaaaaaaaaa', profileStatus: 'pending', postStatus: 'pending', publicUrl: '/perfil-publico?perfil=be-aaaaaaaaaaaa' }
        : { ok: true, slug: 'be-aaaaaaaaaaaa', record: null })
    });
  });
  await page.goto('/meu-caminho-be/registrar');
  await page.locator('.fb-app-nav [data-fb-view="registrar"]').click();
  await page.locator('.be-register-panel [data-be-new-entry]').click();
  const dialog = page.getByRole('dialog', { name: 'Registrar atividade' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Só no meu diário')).toBeChecked();
  await dialog.getByLabel('Por quanto tempo?').fill('45');
  await dialog.getByLabel(/Como foi e o que aconteceu/).fill('Treino leve no parque com boa disposição.');
  await dialog.getByLabel('Escolher foto').setInputFiles(path.join(process.cwd(), 'img', 'app-icon-192.png'));
  await expect(dialog.locator('#be-entry-photo-preview')).toBeVisible();
  await dialog.getByLabel('Compartilhar com todos').check();
  await dialog.getByRole('button', { name: 'Registrar no diário' }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => publishedBody).not.toBeNull();
  expect(publishedBody.post.text).toContain('Treino leve no parque');
  expect(publishedBody.post.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1') || '[]')[0]);
  expect(saved.visibility).toBe('public');
  expect(saved.publicStatus).toBe('pending');
  expect(saved.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
});
