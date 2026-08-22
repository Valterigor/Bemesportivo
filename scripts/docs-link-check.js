#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];
const entryFiles = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md'];
const documentationDirectories = ['docs', 'functions', 'scripts', 'src', 'tests'];

function markdownFiles(directory) {
  const absoluteDirectory = path.join(root, directory);
  if (!fs.existsSync(absoluteDirectory)) return [];
  return fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap(entry => {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (relativePath.replaceAll('\\', '/') === 'docs/archive') return [];
      return markdownFiles(relativePath);
    }
    return entry.name.toLowerCase().endsWith('.md') ? [relativePath] : [];
  });
}

const files = [
  ...entryFiles.filter(file => fs.existsSync(path.join(root, file))),
  ...documentationDirectories.flatMap(markdownFiles),
  'archive/README.md'
];

for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
    if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(target) || target.startsWith('/')) continue;
    target = target.split('#')[0].split('?')[0];
    if (!target) continue;
    const resolved = path.resolve(root, path.dirname(file), decodeURIComponent(target));
    if (!resolved.startsWith(root + path.sep) || !fs.existsSync(resolved)) {
      failures.push(`${file}: link local inexistente: ${match[1]}`);
    }
  }
}

if (failures.length) {
  console.error('Documentação reprovada:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Documentação aprovada: ${files.length} arquivos com links locais válidos.`);
