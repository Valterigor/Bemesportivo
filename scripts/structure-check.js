'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const violations = [];
const forbiddenRootEntries = new Set([
  'build.js',
  'dev-server.js',
  'dev-server.err.log',
  'dev-server.out.log',
  'video bonecos.mp4',
  'ai-agent-data.js',
  'ai-agent-service.js',
  'ebook.css',
  'modal.css',
  'profissionais-ai.js',
  'responsive-final.css',
  'script.js',
  'style.css'
]);

function list(directory) {
  const target = path.join(root, directory);
  return fs.existsSync(target) ? fs.readdirSync(target, { withFileTypes: true }) : [];
}

function walk(directory) {
  const target = path.join(root, directory);
  if (!fs.existsSync(target)) return [];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap(entry => {
    const relativePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(relativePath) : [relativePath];
  });
}

for (const entry of list('.')) {
  if (forbiddenRootEntries.has(entry.name)) {
    violations.push(`Arquivo de desenvolvimento ou legado na raiz publica: ${entry.name}`);
  }
  if (/^\.tmp-/i.test(entry.name)) {
    violations.push(`Pasta temporaria na raiz: ${entry.name}`);
  }
  if (/^menu-.*-check\.png$/i.test(entry.name)) {
    violations.push(`Captura de validacao na raiz: ${entry.name}`);
  }
  if (/^(?:cached-)?diff\.txt$/i.test(entry.name)) {
    violations.push(`Relatorio de comparacao na raiz: ${entry.name}`);
  }
}

for (const file of walk('img')) {
  const name = path.basename(file);
  if (/\.html?$/i.test(name) || /_files$/i.test(name) || /\.download$/i.test(name)) {
    violations.push(`Importacao nao publicada dentro de img/: ${file}`);
  }
  if (/^WhatsApp Image/i.test(name)) {
    violations.push(`Midia bruta dentro de img/: ${file}`);
  }
}

for (const file of walk('videos')) {
  if (/^(?:whatsapp|vid[-_ ]?\d)/i.test(path.basename(file))) {
    violations.push(`Video bruto dentro de videos/: ${file}`);
  }
}

if (violations.length) {
  console.error('Estrutura reprovada:');
  for (const violation of violations) console.error(`- ${violation}`);
  console.error('Mova materiais locais para .local-reference/.');
  process.exitCode = 1;
} else {
  console.log('Estrutura aprovada: raiz publica e diretorios de midia sem artefatos locais.');
}
