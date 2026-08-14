const { test, expect } = require('@playwright/test');

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
