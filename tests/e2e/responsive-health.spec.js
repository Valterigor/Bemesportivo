const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const ROUTES = fs.readdirSync(process.cwd())
  .filter(file => file.endsWith('.html'))
  .map(file => file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`);

const VIEWPORTS = [
  { name: 'celular compacto', width: 320, height: 700 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'computador compacto', width: 1024, height: 768 }
];

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3100') return route.continue();
    if (route.request().resourceType() === 'document') {
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Conteudo externo</title>' });
    }
    return route.abort('blockedbyclient');
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
});

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} preserva saude visual e semantica em todo o site`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    const failures = [];

    for (const route of ROUTES) {
      const runtimeErrors = [];
      const brokenRequests = [];
      const onPageError = error => runtimeErrors.push(error.message);
      const onResponse = response => {
        const url = new URL(response.url());
        if (url.origin === 'http://127.0.0.1:3100' && response.status() >= 400) {
          brokenRequests.push(`${response.status()} ${url.pathname}`);
        }
      };
      page.on('pageerror', onPageError);
      page.on('response', onResponse);

      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10_000 });
      await page.waitForTimeout(120);
      const health = await page.evaluate(() => {
        const visible = element => {
          if (element.closest('[aria-hidden="true"], [hidden]')) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
        };
        const hasScrollableAncestor = element => {
          for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const overflowX = getComputedStyle(parent).overflowX;
            if (/(auto|scroll)/.test(overflowX) && parent.scrollWidth > parent.clientWidth + 2) return true;
            if (/(hidden|clip)/.test(overflowX)) return true;
          }
          return false;
        };
        const accessibleName = element => {
          const labelledBy = element.getAttribute('aria-labelledby');
          const labelledText = labelledBy
            ? labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ')
            : '';
          return [element.getAttribute('aria-label'), labelledText, element.labels?.[0]?.textContent, element.textContent, element.getAttribute('title'), element.getAttribute('alt'), element.querySelector('img[alt]')?.getAttribute('alt')]
            .some(value => value && value.trim());
        };
        const viewportWidth = document.documentElement.clientWidth;
        const unnamedControls = [...document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea')]
          .filter(visible)
          .filter(element => !accessibleName(element))
          .map(element => element.outerHTML.slice(0, 160));
        const leakingElements = [...document.body.querySelectorAll('*')]
          .filter(visible)
          .filter(element => !hasScrollableAncestor(element))
          .filter(element => {
            const rect = element.getBoundingClientRect();
            return rect.left < -2 || rect.right > viewportWidth + 2;
          })
          .slice(0, 8)
          .map(element => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${[...element.classList].slice(0, 2).join('.')}` : ''}`);
        return {
          overflow: document.documentElement.scrollWidth - viewportWidth,
          missingAlt: document.querySelectorAll('img:not([alt])').length,
          visibleHeadings: [...document.querySelectorAll('h1')].filter(visible).length,
          unnamedControls,
          leakingElements
        };
      });

      if ((response?.status() || 500) >= 400) failures.push(`${route}: status ${response?.status()}`);
      if (health.overflow > 2) failures.push(`${route}: overflow horizontal de ${health.overflow}px`);
      if (health.missingAlt) failures.push(`${route}: ${health.missingAlt} imagem(ns) sem alt`);
      if (health.visibleHeadings !== 1) failures.push(`${route}: ${health.visibleHeadings} h1 visivel(is)`);
      if (health.unnamedControls.length) failures.push(`${route}: controles sem nome: ${health.unnamedControls.join(' | ')}`);
      if (health.leakingElements.length) failures.push(`${route}: elementos fora da tela: ${health.leakingElements.join(', ')}`);
      if (runtimeErrors.length) failures.push(`${route}: erros JS: ${runtimeErrors.join(' | ')}`);
      if (brokenRequests.length) failures.push(`${route}: recursos quebrados: ${[...new Set(brokenRequests)].join(', ')}`);

      page.off('pageerror', onPageError);
      page.off('response', onResponse);
    }

    expect(failures, failures.join('\n')).toEqual([]);
  });
}

test('links internos visiveis respondem e apontam para secoes existentes', async ({ page, request }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const targets = new Set();
  const failures = [];

  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10_000 });
    const currentPath = new URL(page.url()).pathname;
    const links = await page.locator('a[href]').evaluateAll(elements => elements
      .filter(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return !element.closest('[hidden], [aria-hidden="true"]') && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      })
      .map(element => ({ raw: element.getAttribute('href'), absolute: element.href })));

    for (const link of links) {
      if (!link.raw || /^(?:mailto:|tel:)/i.test(link.raw)) continue;
      const target = new URL(link.absolute);
      if (target.origin !== 'http://127.0.0.1:3100') continue;
      if (target.pathname === currentPath && target.hash) {
        const id = decodeURIComponent(target.hash.slice(1));
        const exists = await page.evaluate(targetId => Boolean(document.getElementById(targetId)), id);
        if (!exists) failures.push(`${route}: ancora inexistente ${link.raw}`);
      }
      targets.add(`${target.pathname}${target.search}`);
    }
  }

  for (const target of targets) {
    const response = await request.get(target, { maxRedirects: 5 });
    if (response.status() >= 400) failures.push(`${target}: status ${response.status()}`);
  }

  expect(failures, failures.join('\n')).toEqual([]);
});
