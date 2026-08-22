const { test, expect } = require('@playwright/test');
const path = require('node:path');

test('etapas da home abrem o assunto e o próximo passo correspondentes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });
  const stages = [
    ['Descobrir: criar meu Mapa BeM', /\/meu-caminho-be\/jornada$/, '#minha-jornada'],
    ['Começar: registrar meu primeiro passo', /\/meu-caminho-be\/registrar$/, '[data-fb-panel="registrar"]'],
    ['Evoluir: acompanhar minha evolução', /\/meu-caminho-be\/jornada\/evolucao$/, '[data-fb-panel="evolucao"]'],
    ['Permanecer: continuar minha jornada', /\/meu-caminho-be\/jornada$/, '[data-fb-panel="progresso"]']
  ];

  for (const [label, destination, subject] of stages) {
    await page.goto('/');
    await page.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(destination);
    await expect(page.locator('#fala-bem-app')).toBeVisible();
    await expect(page.locator(subject)).toBeVisible();
  }
});

test('PWA abre uma subpágina do Meu Caminho Be sem conexão', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) runtimeErrors.push(message.text());
  });
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });
  await page.goto('/meu-caminho-be');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  await context.setOffline(true);
  try {
    const response = await page.goto('/meu-caminho-be/jornada');
    expect(response?.status()).toBe(200);
    await expect(page.locator('#fala-bem-app')).toBeVisible();
    await expect(page.locator('.fb-app-nav [data-fb-view="progresso"]')).toHaveAttribute('aria-current', 'page');
    const localStyles = await page.evaluate(() => [...document.styleSheets]
      .filter(sheet => sheet.href?.startsWith(location.origin))
      .map(sheet => {
        try { return { href: sheet.href, rules: sheet.cssRules.length }; } catch { return { href: sheet.href, rules: -1 }; }
      }));
    expect(localStyles.filter(sheet => sheet.rules < 1), JSON.stringify(localStyles, null, 2)).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  } finally {
    await context.setOffline(false);
  }
});

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

test('diário mantém registros e fotos somente no aparelho durante o modo local', async ({ page }) => {
  let publishedBody = null;
  let syncRequests = 0;
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false }));
    localStorage.setItem('meuCaminhoBeLocalAccessV1', '1');
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
  await page.route('**/api/meu-caminho-sync**', async route => {
    syncRequests += 1;
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Não deveria sincronizar no modo local.' }) });
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
  await expect(dialog.getByLabel('Compartilhar com todos')).toBeDisabled();
  await dialog.getByRole('button', { name: 'Registrar no diário' }).click();
  await expect(dialog).toBeHidden();
  expect(publishedBody).toBeNull();
  expect(syncRequests).toBe(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1') || '[]')[0]);
  expect(saved.visibility).toBe('private');
  expect(saved.publicStatus).toBe('');
  expect(saved.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
});
