'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const violations = [];

function list(directory) {
  const target = path.join(root, directory);
  return fs.existsSync(target) ? fs.readdirSync(target, { withFileTypes: true }) : [];
}

for (const entry of list('.')) {
  if (/^\.tmp-/i.test(entry.name)) {
    violations.push(`Pasta temporária na raiz: ${entry.name}`);
  }
  if (/^menu-.*-check\.png$/i.test(entry.name)) {
    violations.push(`Captura de validação na raiz: ${entry.name}`);
  }
  if (/^(?:cached-)?diff\.txt$/i.test(entry.name)) {
    violations.push(`Relatório de comparação na raiz: ${entry.name}`);
  }
}

for (const entry of list('img')) {
  if (/\.html?$/i.test(entry.name) || /_files$/i.test(entry.name) || /\.download$/i.test(entry.name)) {
    violations.push(`Importação não publicada dentro de img/: ${entry.name}`);
  }
}

for (const entry of list('videos')) {
  if (/^(?:whatsapp|vid[-_ ]?\d)/i.test(entry.name)) {
    violations.push(`Vídeo bruto dentro de videos/: ${entry.name}`);
  }
}

if (violations.length) {
  console.error('Estrutura reprovada:');
  for (const violation of violations) console.error(`- ${violation}`);
  console.error('Mova materiais locais para .local-reference/.');
  process.exitCode = 1;
} else {
  console.log('Estrutura aprovada: raiz pública e diretórios de mídia sem artefatos locais.');
}
