import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routesSource = fs.readFileSync(path.join(root, 'js/core/routes.js'), 'utf8');
const { siteNavigation, navigationGroups, pageNavigation, institutionalNavigation } = await import(`data:text/javascript;base64,${Buffer.from(routesSource).toString('base64')}`);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const links = entries => entries.map(([href, label]) => `<a data-site-link href="${escape(href)}">${label}</a>`).join('');
const begin = '<!-- shared-site-navigation:start -->';
const end = '<!-- shared-site-navigation:end -->';
const embedded = new Set(['game.html', 'meu-caminho-be.html', 'admin.html', 'design-system.html']);
function configuration(name) {
  if (name === 'index.html') return { label: 'Menu principal', links: siteNavigation, moreLabel: 'Explorar', groups: navigationGroups };
  if (name.startsWith('reportagem-')) return { label: 'Menu da reportagem', links: [['/', 'Início'], ['/reportagens', 'Reportagens'], ['#report-reading', 'Ler história'], ['#report-related', 'Relacionadas'], ['#report-comments', 'Comentários']] };
  return pageNavigation[name] || institutionalNavigation;
}
function template(name) {
  // These applications already have functional menus: style them without adding another.
  if (embedded.has(name)) return `${begin}\n<!-- Navegação própria da área; aparência definida no CSS compartilhado. -->\n${end}`;
  const config = configuration(name);
  const groups = (config.groups || []).map(group => `<div class="be-site-menu-group"><strong>${group.label}</strong>${group.links.map(([href, label, description]) => `<a data-site-link href="${escape(href)}"><span>${label}</span><small>${description}</small></a>`).join('')}</div>`).join('');
  const about = name === 'index.html' ? '<div class="be-site-menu-about"><a data-site-link href="/#como-funciona">Todas as seções</a><a data-site-link href="/sobre">Sobre o Be</a><a data-site-link href="/contato">Contato</a></div>' : '';
  const dropdown = groups ? `<details class="be-site-more"><summary>${config.moreLabel} <span aria-hidden="true">⌄</span></summary><div class="be-site-more-links">${groups}${about}</div></details>` : '';
  return `${begin}
<div id="be-site-header" class="be-site-header" data-menu-context="${name === 'index.html' ? 'home' : 'section'}"${groups ? '' : ' data-menu-scroll'}>
  <header class="be-site-header-inner">
    <a class="be-site-brand" href="/" aria-label="Bem Esportivo — início"><img src="/img/Bem%20Esportivo%20Logo%20Laranja@33x.png" alt="Bem Esportivo" width="2263" height="1937"></a>
    <nav id="be-site-navigation" aria-label="${config.label}">${links(config.links)}${dropdown}</nav>
    ${name === 'index.html' ? '<a class="be-site-journey" data-site-link href="/meu-caminho-be" title="Abrir meu diário esportivo">Meu Caminho Be <span aria-hidden="true">↗</span></a>' : ''}
  </header>
</div>
${end}`.replace(/[ \t]+$/gm, '');
}
const check = process.argv.includes('--check');
let changed = 0;
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));
for (const name of pages) {
  const file = path.join(root, name);
  const original = fs.readFileSync(file, 'utf8');
  let source = original;
  const content = template(name);
  if (!source.includes(begin) || !source.includes(end)) throw new Error(`Marcadores do cabeçalho ausentes: ${name}`);
  source = source.slice(0, source.indexOf(begin)) + content + source.slice(source.indexOf(end) + end.length);
  if (name.startsWith('reportagem-')) {
    if (!source.includes('id="report-reading"')) source = source.replace(/<main\b/, '<main id="report-reading"');
    if (!source.includes('id="report-related"')) source = source.replace(/<section\b([^>]*class="report-related"[^>]*)>/, '<section id="report-related"$1>');
    if (!source.includes('id="report-comments"')) source = source.replace(/<section\b([^>]*data-report-comments="[^"]+"[^>]*)>/, '<section id="report-comments"$1>');
  }
  if (name === 'beplay.html') source = source.replace(/<header class="topbar">[\s\S]*?<\/header>\s*/, '');
  if (name === 'moda-fitness.html') source = source.replace(/<nav class="be-section-navigation"[\s\S]*?<\/nav>\s*/, '');
  if (!embedded.has(name)) {
    for (const [href] of configuration(name).links) {
      if (href.startsWith('#') && !source.includes(`id="${href.slice(1)}"`)) throw new Error(`Âncora ausente em ${name}: ${href}`);
    }
  }
  if (source !== original) { changed++; if (!check) fs.writeFileSync(file, source); }
}
if (check && changed) throw new Error(`${changed} menus desatualizados. Execute npm run navigation:sync.`);
console.log(check ? `Design comum e navegação contextual verificados nas ${pages.length} páginas.` : `Menus contextuais atualizados: ${changed} páginas.`);
