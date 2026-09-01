const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const ROUTES = fs.readdirSync(process.cwd())
  .filter(file => file.endsWith('.html'))
  .filter(file => !['admin.html', 'design-system.html'].includes(file))
  .map(file => file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`);

const RESIZE_CYCLE = [
  { width: 1440, height: 900 },
  { width: 1180, height: 820 },
  { width: 1120, height: 800 },
  { width: 1025, height: 768 },
  { width: 1024, height: 768 },
  { width: 981, height: 768 },
  { width: 980, height: 768 },
  { width: 921, height: 900 },
  { width: 920, height: 900 },
  { width: 901, height: 900 },
  { width: 900, height: 900 },
  { width: 821, height: 1024 },
  { width: 820, height: 1024 },
  { width: 761, height: 1024 },
  { width: 760, height: 1024 },
  { width: 768, height: 1024 },
  { width: 721, height: 900 },
  { width: 720, height: 900 },
  { width: 681, height: 880 },
  { width: 680, height: 880 },
  { width: 601, height: 860 },
  { width: 600, height: 860 },
  { width: 521, height: 844 },
  { width: 520, height: 844 },
  { width: 481, height: 844 },
  { width: 480, height: 844 },
  { width: 391, height: 844 },
  { width: 390, height: 844 },
  { width: 360, height: 780 },
  { width: 340, height: 740 },
  { width: 320, height: 700 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 }
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

test('todas as páginas preservam o layout ao reduzir e ampliar a janela', async ({ page }) => {
  test.setTimeout(180_000);
  const failures = [];

  for (const route of ROUTES) {
    await page.setViewportSize(RESIZE_CYCLE[0]);
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10_000 });

    for (const viewport of RESIZE_CYCLE.slice(1)) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);
      const health = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const visible = element => {
          if (element.closest('template, [hidden], [aria-hidden="true"]')) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
        };
        const intentionallyScrollable = element => {
          for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const overflow = getComputedStyle(parent).overflowX;
            if (/(auto|scroll|hidden|clip)/.test(overflow)) return true;
          }
          return false;
        };
        const leaks = [...document.body.querySelectorAll('*')]
          .filter(visible)
          .filter(element => !intentionallyScrollable(element))
          .filter(element => {
            const rect = element.getBoundingClientRect();
            return rect.left < -2 || rect.right > viewportWidth + 2;
          })
          .slice(0, 10)
          .map(element => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${[...element.classList].slice(0, 2).join('.')}` : ''}`);
        const distortedMedia = [...document.querySelectorAll('img')]
          .filter(visible)
          .filter(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)
          .filter(image => getComputedStyle(image).objectFit === 'fill')
          .filter(image => {
            const rect = image.getBoundingClientRect();
            const naturalRatio = image.naturalWidth / image.naturalHeight;
            const renderedRatio = rect.width / rect.height;
            return Math.abs(renderedRatio / naturalRatio - 1) > .08;
          })
          .slice(0, 10)
          .map(image => `${image.getAttribute('src')} (${Math.round(image.getBoundingClientRect().width)}x${Math.round(image.getBoundingClientRect().height)})`);
        const activeNavigation = document.querySelector('nav a[aria-current="page"]');
        const activeNavigationVisible = (() => {
          if (!activeNavigation || !visible(activeNavigation)) return true;
          const nav = activeNavigation.closest('nav');
          const navRect = nav.getBoundingClientRect();
          const activeRect = activeNavigation.getBoundingClientRect();
          const visibleWidth = Math.max(0, Math.min(navRect.right, activeRect.right) - Math.max(navRect.left, activeRect.left));
          return visibleWidth >= activeRect.width * .75;
        })();
        const staleDesktopMenus = window.innerWidth > 980
          ? [...document.querySelectorAll('nav.active, nav.show, nav.is-open')].map(nav => nav.id || nav.className || 'nav')
          : [];
        return {
          overflow: document.documentElement.scrollWidth - viewportWidth,
          bodyWidth: document.body.getBoundingClientRect().width,
          leaks,
          distortedMedia,
          activeNavigationVisible,
          staleDesktopMenus
        };
      });
      const label = `${route} em ${viewport.width}px`;
      if (health.overflow > 2) failures.push(`${label}: overflow de ${health.overflow}px`);
      if (health.bodyWidth > viewport.width + 2) failures.push(`${label}: body com ${Math.round(health.bodyWidth)}px`);
      if (health.leaks.length) failures.push(`${label}: elementos fora da tela: ${health.leaks.join(', ')}`);
      if (health.distortedMedia.length) failures.push(`${label}: mídia distorcida: ${health.distortedMedia.join(', ')}`);
      if (!health.activeNavigationVisible) failures.push(`${label}: página ativa ficou fora da navegação`);
      if (health.staleDesktopMenus.length) failures.push(`${label}: menu móvel permaneceu aberto: ${health.staleDesktopMenus.join(', ')}`);
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});
