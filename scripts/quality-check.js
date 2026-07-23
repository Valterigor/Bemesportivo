#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const ignoredLegacyFiles = new Set(['script.js']);
const failures = [];

function walk(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') && entry.isDirectory()) return [];
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) return [];
      return walk(path.join(directory, entry.name), extension);
    }
    const filePath = path.join(directory, entry.name);
    if (ignoredLegacyFiles.has(relative(filePath))) return [];
    return entry.name.endsWith(extension) ? [filePath] : [];
  });
}

function relative(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}

function checkJavaScript() {
  const files = walk(rootDir, '.js');
  files.forEach(filePath => {
    const source = fs.readFileSync(filePath, 'utf8');
    const isModule = /(^|\n)\s*(?:import\s|export\s)/m.test(source);
    const result = isModule
      ? spawnSync(process.execPath, ['--input-type=module', '--check'], { input: source, encoding: 'utf8' })
      : spawnSync(process.execPath, ['--check', filePath], { encoding: 'utf8' });
    if (result.status !== 0) failures.push(`JavaScript inválido em ${relative(filePath)}: ${result.stderr.trim()}`);
  });
  console.log(`OK JavaScript: ${files.length} arquivos verificados`);
}

function checkCss() {
  const files = walk(rootDir, '.css');
  files.forEach(filePath => {
    const source = fs.readFileSync(filePath, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
    let depth = 0;
    for (const character of source) {
      if (character === '{') depth += 1;
      if (character === '}') depth -= 1;
      if (depth < 0) break;
    }
    if (depth !== 0) failures.push(`Chaves CSS desequilibradas em ${relative(filePath)}`);
  });
  console.log(`OK CSS: ${files.length} arquivos verificados`);
}

function checkHtml() {
  const files = fs.readdirSync(rootDir)
    .filter(fileName => fileName.toLowerCase().endsWith('.html'))
    .map(fileName => path.join(rootDir, fileName));
  files.forEach(filePath => {
    const source = fs.readFileSync(filePath, 'utf8');
    const ids = [...source.matchAll(/\sid=["']([^"']+)["']/gi)].map(match => match[1]);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicates.length) failures.push(`IDs duplicados em ${relative(filePath)}: ${duplicates.join(', ')}`);
    if (!/<html\b[^>]*\blang=["']pt-BR["']/i.test(source)) failures.push(`Idioma pt-BR ausente em ${relative(filePath)}`);
    if (!/<meta\b[^>]*\bname=["']viewport["']/i.test(source)) failures.push(`Viewport ausente em ${relative(filePath)}`);
    if (/site-common\.js/.test(source) && !/<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["'][^"']*site-common\.js\?v=20260723-2["']/i.test(source)) {
      failures.push(`Contrato do JavaScript compartilhado desatualizado em ${relative(filePath)}`);
    }
    if (/site-common\.js/.test(source) && !/<footer\b[^>]*\bclass=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>[\s\S]*?<div\b[^>]*\bclass=["'][^"']*\bsite-footer-inner\b/i.test(source)) {
      failures.push(`Estrutura do rodapé compartilhado ausente em ${relative(filePath)}`);
    }
  });
  console.log(`OK HTML: ${files.length} páginas verificadas`);
}

checkJavaScript();
checkCss();
checkHtml();

if (failures.length) {
  console.error(`\nFALHA: ${failures.length} problema(s) encontrado(s):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nQualidade aprovada.');
