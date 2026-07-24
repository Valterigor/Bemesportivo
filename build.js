#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

console.log('Build de validação iniciado');
execFileSync(process.execPath, [
  path.join(rootDir, 'node_modules', 'esbuild', 'bin', 'esbuild'),
  'src/js/meu-caminho-account.js',
  '--bundle',
  '--format=esm',
  '--minify',
  '--outfile=js/meu-caminho-account.js'
], { cwd: rootDir, stdio: 'inherit' });
execFileSync(process.execPath, [path.join(rootDir, 'scripts', 'quality-check.js')], { stdio: 'inherit' });

const pages = fs.readdirSync(rootDir)
  .filter(fileName => fileName.toLowerCase().endsWith('.html'))
  .sort();

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'build-manifest.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  deployment: 'static-root',
  pages,
  sharedEntries: ['site-common.css', 'js/site-common.js', 'css/design-system.css']
}, null, 2)}\n`);

console.log(`Build aprovado: ${pages.length} páginas; manifesto em dist/build-manifest.json`);
