#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require('esbuild');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDirectories = ['css', 'data', 'img', 'js', 'videos'];
const publicRootFiles = [
  '_headers',
  '_redirects',
  'ads.txt',
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml'
];

console.log('Build de validação iniciado');
esbuild.buildSync({
  entryPoints: [path.join(rootDir, 'src/apps/meu-caminho/account.js')],
  bundle: true,
  format: 'esm',
  minify: true,
  outfile: path.join(rootDir, 'js/meu-caminho-account.js')
});
execFileSync(process.execPath, [path.join(rootDir, 'scripts', 'quality-check.js')], { stdio: 'inherit' });

const pages = fs.readdirSync(rootDir)
  .filter(fileName => fileName.toLowerCase().endsWith('.html'))
  .sort();

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const directoryName of publicDirectories) {
  const sourcePath = path.join(rootDir, directoryName);
  if (!fs.existsSync(sourcePath)) continue;
  fs.cpSync(sourcePath, path.join(distDir, directoryName), { recursive: true });
}

for (const fileName of [
  ...pages,
  ...publicRootFiles,
  ...fs.readdirSync(rootDir).filter(fileName => ['.css', '.js'].includes(path.extname(fileName).toLowerCase()))
]) {
  const sourcePath = path.join(rootDir, fileName);
  if (!fs.existsSync(sourcePath)) continue;
  fs.copyFileSync(sourcePath, path.join(distDir, fileName));
}

// Canonical report URLs are real directory indexes. This avoids Cloudflare
// Pages clean-URL redirects cycling through the legacy root HTML filenames.
const reportRoutes = {
  'treino-funcional-br-assessoria': 'reportagem-treino-funcional.html',
  'elas-em-movimento-serra-talhada': 'reportagem-elas-em-movimento-serra-talhada.html',
  'dedicacao-talento-mirim': 'reportagem-dedicacao-talento-mirim.html',
  'duda-e-o-futebol': 'reportagem-duda-e-o-futebol.html',
  'elas-trazem-esperanca': 'reportagem-elas-trazem-esperanca.html',
  'mayara-magnolia-papo-bem-esportivo': 'reportagem-mayara-magnolia-papo-bem-esportivo.html',
  'sergio-lima-exemplo-de-vida': 'reportagem-sergio-lima-exemplo-de-vida.html',
  'thais-garcez-metamorfose': 'reportagem-thais-garcez-metamorfose.html'
};
for (const [slug, sourceFile] of Object.entries(reportRoutes)) {
  const routeDirectory = path.join(distDir, 'reportagens', slug);
  fs.mkdirSync(routeDirectory, { recursive: true });
  fs.copyFileSync(path.join(rootDir, sourceFile), path.join(routeDirectory, 'index.html'));
}

let revision = process.env.CF_PAGES_COMMIT_SHA || null;
if (!revision) {
  try { revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* Builds from source archives may not have Git metadata. */ }
}
fs.writeFileSync(path.join(distDir, 'build-manifest.json'), `${JSON.stringify({
  revision,
  generatedAt: new Date().toISOString(),
  deployment: 'cloudflare-pages',
  pages,
  sharedEntries: ['site-common.css', 'js/site-common.js', 'css/design-system.css']
}, null, 2)}\n`);
fs.writeFileSync(path.join(distDir, '_routes.json'), `${JSON.stringify({
  version: 1,
  include: ['/api/*'],
  exclude: []
}, null, 2)}\n`);

console.log(`Build aprovado: ${pages.length} páginas; manifesto em dist/build-manifest.json`);
