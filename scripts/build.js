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

fs.writeFileSync(path.join(distDir, 'build-manifest.json'), `${JSON.stringify({
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
