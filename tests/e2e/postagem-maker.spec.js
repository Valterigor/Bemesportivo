const path = require('node:path');
const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('qualquer pessoa cria e baixa uma postagem esportiva sem cadastro', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
    version: 2,
    necessary: true,
    measurement: false,
    advertising: false,
    updatedAt: new Date().toISOString()
  })));
  const writes = [];
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });

  await page.goto('/criar-postagem');
  await expect(page.getByText('GRÁTIS · SEM CADASTRO')).toBeVisible();
  await expect(page.locator('#post-maker-template')).toHaveValue('moment');
  await page.locator('#post-maker-template').selectOption('profile');
  await page.locator('#post-maker-name').fill('Marina em Movimento');
  await page.locator('#post-maker-sport').selectOption({ label: 'Corrida' });
  await page.locator('#post-maker-type').selectOption('achievement');
  await page.locator('#post-maker-title').fill('Meus primeiros cinco quilômetros');
  await page.locator('#post-maker-text').fill('Um passo de cada vez até completar uma conquista que parecia distante.');
  await page.locator('.be-maker-optional summary').click();
  await page.locator('#post-maker-duration').fill('36');
  await page.locator('#post-maker-distance').fill('5');
  await page.locator('#post-maker-record').check();
  await page.locator('#post-maker-photo').setInputFiles(path.join(process.cwd(), 'img', 'app-icon-192.png'));
  await expect(page.locator('#post-maker-photo-feedback')).toContainText('não foi enviada');

  await expect(page.locator('#post-maker-preview-name')).toHaveText('Marina em Movimento');
  await expect(page.locator('#post-maker-preview-sport')).toHaveText('Corrida');
  await expect(page.locator('#post-maker-preview-heading')).toHaveText('Meus primeiros cinco quilômetros');
  await expect(page.locator('#post-maker-social-preview')).toBeVisible();
  await expect(page.locator('#post-maker-social-preview')).toHaveAttribute('src', /^blob:/);
  expect(writes).toEqual([]);

  await page.locator('.be-maker-generate').click();
  await expect(page.locator('#be-share-dialog')).toBeVisible();
  for (const format of ['feed', 'story']) {
    const downloaded = page.waitForEvent('download');
    await page.locator(`[data-share-format="${format}"]`).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe(`bem-esportivo-postagem-${format}.png`);
    const sharp = require('sharp');
    const metadata = await sharp(await download.path()).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(format === 'story' ? 1920 : 1350);
  }
  const generated = await page.evaluate(async () => {
    const file = await window.BeShareCard.build({
      post: {
        id: 'postagem',
        kind: 'text',
        postType: 'achievement',
        title: 'Meus primeiros cinco quilômetros',
        text: 'Um passo de cada vez até completar uma conquista que parecia distante.',
        activity: 'Corrida',
        duration: 36,
        distance: 5,
        personalBest: true
      },
      profile: {
        name: 'Marina em Movimento',
        displayName: 'Marina em Movimento',
        favoriteSport: 'Corrida'
      },
      format: 'feed'
    });
    const bitmap = await createImageBitmap(file);
    const result = { width: bitmap.width, height: bitmap.height, name: file.name };
    bitmap.close();
    return result;
  });
  expect(generated).toEqual({
    width: 1080,
    height: 1350,
    name: 'meu-caminho-be-postagem-feed.png'
  });
  await page.locator('.be-share-close').click();
  await page.locator('#post-maker-template').selectOption('moment');
  await expect(page.locator('[data-maker-profile-field]').first()).toBeHidden();
  const cleanTemplate = await page.evaluate(async () => {
    const source = document.createElement('canvas'); source.width = 100; source.height = 400;
    const sourceContext = source.getContext('2d'); sourceContext.fillStyle = '#ee2211'; sourceContext.fillRect(0, 0, 100, 400);
    const file = await window.BeSocialCard.build({template:'moment',format:'feed',profile:{name:'Não deve aparecer',handle:'@oculto',favoriteSport:'Corrida'},post:{title:'Meu treino',text:'Um momento importante.',activity:'Corrida',imageDataUrl:source.toDataURL('image/png')}});
    const bitmap = await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();
    const left=[...context.getImageData(100,700,1,1).data],right=[...context.getImageData(970,700,1,1).data];
    return {name:file.name,left,right};
  });
  expect(cleanTemplate.name).toBe('bem-esportivo-postagem-feed.png');
  expect(cleanTemplate.left[0]).toBeGreaterThan(220);expect(cleanTemplate.left[1]).toBeLessThan(70);
  expect(cleanTemplate.right[0]).toBeGreaterThan(220);expect(cleanTemplate.right[1]).toBeLessThan(70);
  expect(writes).toEqual([]);

  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 800 }]) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
