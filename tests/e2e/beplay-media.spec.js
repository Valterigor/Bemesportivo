const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
    version: 2, necessary: true, measurement: false, advertising: false, updatedAt: new Date().toISOString()
  })));
});

test('BePlay carrega as sete capas locais em formato 16:9', async ({ page }) => {
  await page.goto('/beplay');
  await expect(page.locator('.related-card')).toHaveCount(6);
  const covers = await page.evaluate(async () => {
    const paths = [
      document.querySelector('#localPlayer').poster,
      ...Array.from(document.querySelectorAll('.related-thumb'), el =>
        getComputedStyle(el).backgroundImage.slice(5, -2))
    ];
    return Promise.all(paths.map(src => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ src, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ src, width: 0, height: 0 });
      img.src = src;
    })));
  });
  expect(covers).toHaveLength(7);
  for (const cover of covers) {
    expect(cover.src).toContain('/img/beplay-capas/');
    expect(cover.width).toBe(1280);
    expect(cover.height).toBe(720);
  }
});

test('Thais usa o áudio corrigido e não herda o silêncio do vídeo anterior', async ({ page }) => {
  await page.goto('/beplay');
  await page.locator('#localPlayer').evaluate(video => {
    video.muted = true;
    video.volume = 0;
  });
  await page.locator('.related-card').filter({ hasText: 'Uma mensagem de Thais Garcez' }).getByRole('button').click();
  const player = page.locator('#localPlayer');
  await expect(player).toHaveAttribute('src', /thais-garcez-relato-audio-v2\.mp4$/);
  await expect.poll(() => player.evaluate(video => video.readyState)).toBeGreaterThanOrEqual(2);
  expect(await player.evaluate(video => ({ muted: video.muted, volume: video.volume }))).toEqual({
    muted: false, volume: 1
  });
  await player.evaluate(video => video.play());
  await expect.poll(() => player.evaluate(video => video.currentTime)).toBeGreaterThan(0);
});

for (const [route, id, cover] of [
  ['/reportagens/duda-e-o-futebol', 'Qi1lRW18kvM', 'duda'],
  ['/reportagens/dedicacao-talento-mirim', 'gBkon6LC2OU', 'tatico']
]) {
  test(`capa da reportagem abre o mesmo vídeo: ${id}`, async ({ page }) => {
    await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({
      contentType: 'text/html', body: '<html><body>Player de teste</body></html>'
    }));
    await page.goto(route);
    const button = page.locator('.be-video-cover');
    const player = page.locator('.be-video-covered iframe');
    await expect(button.locator('img')).toHaveAttribute('src', `/img/beplay-capas/${cover}-v1.webp`);
    await expect(player).toBeHidden();
    await button.click();
    await expect(player).toBeVisible();
    const source = new URL(await player.getAttribute('src'));
    expect(source.pathname).toBe(`/embed/${id}`);
    expect(source.searchParams.get('autoplay')).toBe('1');
  });
}

test('reportagem de Thais usa a capa e o áudio corrigido', async ({ page }) => {
  await page.goto('/reportagens/thais-garcez-metamorfose');
  const player = page.locator('.report-video-feature video');
  await expect(player).toHaveAttribute('poster', '/img/beplay-capas/thais-v1.webp');
  await expect(player.locator('source')).toHaveAttribute('src', /thais-garcez-relato-audio-v2\.mp4$/);
});
