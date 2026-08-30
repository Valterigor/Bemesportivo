const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const ROUTES = fs.readdirSync(process.cwd())
  .filter(file => file.endsWith('.html'))
  .filter(file => !['admin.html', 'design-system.html'].includes(file))
  .map(file => file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`);

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3100') return route.continue();
    return route.abort('blockedbyclient');
  });
  await page.addInitScript(() => localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
    version: 2, necessary: true, measurement: false, advertising: false, updatedAt: new Date().toISOString()
  })));
});

test('textos sobre fundos solidos mantem contraste legivel', async ({ page }) => {
  test.setTimeout(120_000);
  const failures = [];
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(100);
    const issues = await page.evaluate(() => {
      const parse = value => {
        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
        return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
      };
      const blend = (front, back, opacity = 1) => {
        const alpha = front.a * opacity;
        return {
          r: (front.r * alpha) + (back.r * (1 - alpha)),
          g: (front.g * alpha) + (back.g * (1 - alpha)),
          b: (front.b * alpha) + (back.b * (1 - alpha)),
          a: 1
        };
      };
      const luminance = color => {
        const values = [color.r, color.g, color.b].map(value => {
          const channel = value / 255;
          return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        });
        return (.2126 * values[0]) + (.7152 * values[1]) + (.0722 * values[2]);
      };
      const ratio = (first, second) => {
        const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
        return (values[0] + .05) / (values[1] + .05);
      };
      const selector = element => {
        if (element.id) return `#${element.id}`;
        const classes = [...element.classList].slice(0, 2).join('.');
        return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`;
      };
      const result = [];
      const seen = new Set();
      for (const element of document.body.querySelectorAll('*')) {
        if (['VIDEO', 'AUDIO', 'CANVAS'].includes(element.tagName)) continue;
        if (![...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) continue;
        if (element.closest('[hidden], [aria-hidden="true"]')) continue;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width < 1 || rect.height < 1) continue;
        let background = null;
        let backgroundSource = '';
        let skip = false;
        let opacity = 1;
        const layers = [];
        for (let current = element; current; current = current.parentElement) {
          const currentStyle = getComputedStyle(current);
          opacity *= Number(currentStyle.opacity) || 0;
          if (currentStyle.backgroundImage !== 'none') { skip = true; break; }
          const candidate = parse(currentStyle.backgroundColor);
          if (candidate && candidate.a > 0) {
            layers.push(candidate);
            if (candidate.a >= .98) { backgroundSource = selector(current); break; }
          }
        }
        if (layers.length && layers[layers.length - 1].a >= .98) {
          background = layers[layers.length - 1];
          for (let index = layers.length - 2; index >= 0; index -= 1) background = blend(layers[index], background);
        }
        if (skip || !background || opacity < .01) continue;
        const foreground = parse(style.color);
        if (!foreground) continue;
        const rendered = blend(foreground, background, opacity);
        const contrast = ratio(rendered, background);
        const fontSize = Number.parseFloat(style.fontSize);
        const weight = Number.parseInt(style.fontWeight, 10) || 400;
        const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
        const minimum = large ? 3 : 4.5;
        if (contrast + .05 >= minimum) continue;
        const key = `${selector(element)}|${style.color}|${style.backgroundColor}|${contrast.toFixed(2)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ selector: selector(element), text: element.textContent.trim().slice(0, 70), contrast: Number(contrast.toFixed(2)), minimum, color: style.color, background, backgroundSource, opacity });
      }
      return result.slice(0, 30);
    });
    issues.forEach(issue => failures.push(`${route} ${issue.selector} (${issue.contrast}:1, minimo ${issue.minimum}:1; ${issue.color} sobre ${JSON.stringify(issue.background)} em ${issue.backgroundSource}; opacidade ${issue.opacity}): ${issue.text}`));
  }

  expect(failures, failures.join('\n')).toEqual([]);
});
