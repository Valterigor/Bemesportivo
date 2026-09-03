const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('gera imagens adaptadas para Instagram e WhatsApp', async ({ page }) => {
  await page.goto('/meu-caminho-be', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(window.BeShareCard))).toBe(true);
  const dimensions = await page.evaluate(async () => {
    const input = {
      post: { id: 'teste', title: 'Treino concluído', text: 'Hoje completei meu treino e registrei minha evolução.' },
      profile: { name: 'Pessoa esportista' },
      url: 'https://bemesportivo.com/diario/be-123456789abc?publicacao=teste'
    };
    const result = {};
    for (const format of ['story', 'feed']) {
      const post = format === 'feed' ? {
        ...input.post,
        kind: 'photo',
        imageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
      } : input.post;
      const file = await window.BeShareCard.build({ ...input, post, format });
      const bitmap = await createImageBitmap(file);
      result[format] = { width: bitmap.width, height: bitmap.height, name: file.name };
      bitmap.close();
    }
    return result;
  });
  expect(dimensions.story).toEqual({ width: 1080, height: 1920, name: 'meu-caminho-be-teste-story.png' });
  expect(dimensions.feed).toEqual({ width: 1080, height: 1350, name: 'meu-caminho-be-teste-feed.png' });
});

test('gera cartão social próprio para o perfil esportivo', async ({ page }) => {
  await page.goto('/meu-caminho-be', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(window.BeShareCard))).toBe(true);
  const dimensions = await page.evaluate(async () => {
    const result = {};
    for (const format of ['story', 'feed']) {
      const file = await window.BeShareCard.build({
        variant: 'profile',
        format,
        profile: { displayName: 'Pessoa esportista', favoriteSport: 'Corrida', bio: 'Cada treino é parte da minha história.' },
        stats: { moments: 12, likes: 34, highlights: 2 },
        url: 'https://bemesportivo.com/diario/be-123456789abc'
      });
      const bitmap = await createImageBitmap(file);
      result[format] = { width: bitmap.width, height: bitmap.height, name: file.name };
      bitmap.close();
    }
    return result;
  });
  expect(dimensions.story).toEqual({ width: 1080, height: 1920, name: 'meu-caminho-be-perfil-story.png' });
  expect(dimensions.feed).toEqual({ width: 1080, height: 1350, name: 'meu-caminho-be-perfil-feed.png' });
});

test('seletor de compartilhamento se adapta ao celular', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/meu-caminho-be', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.BeShareCard.open({
    post: { id: 'teste', title: 'Meu treino', text: 'Um momento no esporte.' },
    profile: { name: 'Pessoa esportista' }
  }));
  const dialog = page.locator('#be-share-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-share-format="story"]')).toContainText('Stories e Status');
  await expect(dialog.locator('[data-share-format="feed"]')).toContainText('Feed e WhatsApp');
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
});
