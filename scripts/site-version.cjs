#!/usr/bin/env node
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const git = (args, cwd = process.cwd()) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function main() {
  const [command, tag, ...extra] = process.argv.slice(2);
  const root = git(['rev-parse', '--show-toplevel']);
  if (command === 'list' && !tag) {
    console.log(git(['tag', '--list', 'site-*', '--sort=-creatordate', '--format=%(refname:short) — %(contents:subject)'], root) || 'Nenhuma versão salva.');
    return;
  }
  if (command !== 'prepare' || !/^site-[a-zA-Z0-9._-]+$/.test(tag || '') || extra.length) {
    throw new Error('Uso: npm run site:versions OU npm run site:rollback -- site-NOME');
  }
  git(['fetch', 'origin', '--tags'], root);
  const target = git(['rev-parse', '--verify', `refs/tags/${tag}^{commit}`], root);
  const base = git(['rev-parse', '--verify', 'refs/remotes/origin/main'], root);
  git(['merge-base', '--is-ancestor', target, base], root);
  if (git(['rev-parse', `${target}^{tree}`], root) === git(['rev-parse', `${base}^{tree}`], root)) {
    throw new Error('A main já contém exatamente essa versão. Nada foi alterado.');
  }
  const stamp = new Date().toISOString().replace(/[-:.]/g, '');
  const branch = `rollback/${stamp}`;
  const destination = path.resolve(root, '.local-reference', `rollback-${stamp}`);
  const allowed = path.resolve(root, '.local-reference') + path.sep;
  if (!destination.startsWith(allowed) || fs.existsSync(destination)) throw new Error('Destino de restauração inválido.');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const backup = `site-before-rollback-${stamp}`;
  git(['tag', '-a', backup, base, '-m', `Ponto de retorno antes de restaurar ${tag}`], root);
  git(['worktree', 'add', '-b', branch, destination, base], root);
  // Somente a cópia isolada recém-criada é substituída. A pasta de trabalho original fica intacta.
  git(['read-tree', '--reset', '-u', target], destination);
  git(['commit', '-m', `Restaura site para ${tag}`], destination);
  console.log(`Restauração preparada em: ${destination}\nBranch: ${branch}\nVersão: ${target}\nBackup: ${backup}`);
  console.log(`\nRevise e valide nessa pasta: npm ci; npm run build\nPara publicar, execute na pasta original:\ngit push origin refs/tags/${backup}\ngit push origin ${branch}:main\nSem force: se a main avançar, prepare novamente. Nenhum push foi feito automaticamente.`);
}
try { main(); } catch (error) {
  console.error(error.stderr?.toString().trim() || error.message);
  process.exitCode = 1;
}
