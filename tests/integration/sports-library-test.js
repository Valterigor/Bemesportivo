'use strict';

const assert = require('node:assert/strict');
const library = require('../../js/be-sports-library.js');
const search = require('../../js/be-ecosystem-search.js');

assert.equal(library.version, '1.0.0');
assert.ok(library.sports.length >= 28, 'A biblioteca deve cobrir ao menos 28 modalidades.');
assert.equal(new Set(library.sports.map((sport) => sport.id)).size, library.sports.length, 'IDs de modalidades devem ser únicos.');

library.sports.forEach((sport) => {
  assert.ok(sport.aliases.length, `${sport.label} precisa de termos de busca.`);
  assert.ok(sport.guidance.length >= 40, `${sport.label} precisa de orientação editorial útil.`);
  assert.ok(sport.benefits.length >= 40, `${sport.label} precisa explicar benefícios.`);
  assert.ok(sport.techniques.length, `${sport.label} precisa de ao menos um fundamento.`);

  sport.techniques.forEach((technique) => {
    assert.ok(technique.aliases.length, `${technique.title} precisa de termos relacionados.`);
    assert.ok(technique.title.length >= 12, 'O título do fundamento deve ser descritivo.');
    assert.ok(technique.tips.length >= 50, `${technique.title} precisa de orientação prática.`);
  });
});

const volleyballLibraryResult = library.search('Quero melhorar meu saque no vôlei');
assert.equal(volleyballLibraryResult.sport.id, 'voleibol');
assert.equal(volleyballLibraryResult.technique.id, 'saque');
assert.equal(volleyballLibraryResult.entries[0].title, 'Dicas para um bom saque no voleibol');
assert.equal(volleyballLibraryResult.entries[1].title, 'Benefícios do voleibol para a saúde');

const volleyballSearchResult = search.search('Quero melhorar meu saque no vôlei');
assert.equal(volleyballSearchResult.coverage, 'library');
assert.ok(volleyballSearchResult.items.some((item) => item.sourceLabel === 'Biblioteca BeM' && /saque/i.test(item.title)));
assert.ok(volleyballSearchResult.items.some((item) => item.product === 'profissionais'));
assert.ok(volleyballSearchResult.items.some((item) => item.product === 'ferramentas'));
assert.ok(volleyballSearchResult.items.every((item) => !/primeira corrida/i.test(item.title)));

const swimmingStartResult = search.search('Quero começar a nadar');
assert.equal(swimmingStartResult.sport.id, 'natacao');
assert.equal(swimmingStartResult.intent.id, 'start');
assert.equal(swimmingStartResult.items[0].title, 'Primeiros passos para começar na natação');
assert.match(swimmingStartResult.items[0].summary, /piscina segura.+aula para iniciantes.+respiração.+distâncias curtas/i);
assert.ok(swimmingStartResult.items.some((item) => item.title === 'Benefícios da natação para a saúde'));
assert.ok(swimmingStartResult.items.some((item) => item.product === 'profissionais'));
assert.ok(swimmingStartResult.items.some((item) => item.title === 'Dicas práticas para começar'));

const footballSearchResult = search.search('Quero melhorar meu chute no futebol');
assert.equal(footballSearchResult.coverage, 'mixed');
assert.equal(footballSearchResult.items[0].sourceLabel, 'Conteúdo publicado');
assert.ok(footballSearchResult.items.some((item) => item.title === 'Dicas para melhorar o chute no futebol'));

const runningSearchResult = search.search('Quero melhorar meu ritmo na corrida');
assert.equal(runningSearchResult.items.filter((item) => item.title === 'Calculadora Pace').length, 1);

const professionalSearchResult = search.search('Preciso de um profissional para corrida');
assert.equal(professionalSearchResult.items.filter((item) => item.title === 'Bruno Rezende — Personal Trainer').length, 1);

const yogaVideoResult = search.search('Quero assistir vídeos de yoga');
assert.equal(yogaVideoResult.intent.id, 'watch');
assert.ok(yogaVideoResult.items.some((item) => item.product === 'beplay' && item.href === '/beplay'));

const footballAnxietyResult = search.search('Estou ansioso antes do jogo de futebol');
assert.ok(footballAnxietyResult.items.some((item) => item.title === 'Grasiele — Psicóloga'));

console.log(`Biblioteca esportiva validada: ${library.sports.length} modalidades, com conteúdo, profissionais e ferramentas relacionados.`);
