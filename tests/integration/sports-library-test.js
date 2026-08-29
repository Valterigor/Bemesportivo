'use strict';

const assert = require('node:assert/strict');
const library = require('../../js/be-sports-library.js');
const search = require('../../js/be-ecosystem-search.js');

assert.equal(library.version, '1.3.0');
assert.ok(library.sports.length >= 28, 'A biblioteca deve cobrir ao menos 28 modalidades.');
assert.ok(library.topics.length >= 30, 'A biblioteca deve cobrir os principais objetivos esportivos.');
assert.equal(new Set(library.sports.map((sport) => sport.id)).size, library.sports.length, 'IDs de modalidades devem ser únicos.');
assert.equal(new Set(library.topics.map((topic) => topic.id)).size, library.topics.length, 'IDs de temas devem ser únicos.');

library.topics.forEach((topic) => {
  assert.ok(topic.aliases.length, `${topic.label} precisa de termos de busca.`);
  assert.ok(topic.title.length >= 20, `${topic.label} precisa de título descritivo.`);
  assert.ok(topic.summary.length >= 120, `${topic.label} precisa de uma resposta educativa completa.`);
  topic.sourceIds.forEach((sourceId) => assert.ok(library.sources[sourceId], `Fonte desconhecida em ${topic.id}: ${sourceId}`));
});

const topicQueries = new Map([
  ['Como ganhar massa muscular?', 'muscle-gain'],
  ['Como ficar mais forte?', 'strength-progression'],
  ['Quero treinar pernas', 'lower-body-training'],
  ['Quero treinar peito', 'chest-training'],
  ['Quero treinar costas', 'back-training'],
  ['Quero treinar braços', 'upper-body-training'],
  ['Quero treinar abdômen', 'core-training'],
  ['Quero treinar o corpo todo', 'full-body-training'],
  ['Como perder barriga?', 'fat-loss'],
  ['Como correr 5 km sem cansar?', 'running'],
  ['Como melhorar minha finalização?', 'football-skills'],
  ['Como sacar mais forte?', 'ambiguous-serve'],
  ['Como fazer muscle-up?', 'calisthenics'],
  ['Como melhorar minha mobilidade?', 'mobility-yoga'],
  ['Como fazer HIIT?', 'cardio-hiit'],
  ['Como treinar em casa sem equipamentos?', 'home-training'],
  ['Quanto de proteína consumir para hipertrofia?', 'sports-nutrition'],
  ['Creatina faz mal?', 'supplements'],
  ['Como melhorar minha performance?', 'performance'],
  ['Quantos dias devo descansar?', 'recovery'],
  ['Por que parei de evoluir?', 'plateau-results']
]);

topicQueries.forEach((topicId, query) => {
  assert.equal(library.findTopic(query)?.id, topicId, `Tema incorreto para: ${query}`);
  const result = search.search(query);
  assert.equal(result.topic?.id, topicId, `Busca integrada sem tema para: ${query}`);
  assert.ok(result.items.some((item) => item.sourceKind === 'topic' && item.opensAnswer), `Busca sem resposta para: ${query}`);
});

const bodyPartTopicIds = ['lower-body-training', 'chest-training', 'back-training', 'upper-body-training', 'core-training', 'full-body-training'];
bodyPartTopicIds.forEach((topicId) => {
  const topic = library.topics.find((entry) => entry.id === topicId);
  topic.aliases.forEach((alias) => {
    const query = `Quero ${alias}`;
    assert.equal(library.findTopic(query)?.id, topicId, `Variação corporal incorreta para: ${query}`);
    const result = search.search(query);
    assert.equal(result.items[0]?.sourceKind, 'topic', `Resposta corporal deve abrir a orientação para: ${query}`);
    assert.equal(result.items[0]?.title, topic.title, `Resposta corporal não corresponde ao pedido: ${query}`);
  });
});

assert.doesNotMatch(library.findTopic('Como emagrecer rápido?').summary, /garant|em \d+ dias|kg por semana/i);
assert.match(library.findTopic('Como perder barriga?').summary, /não existe exercício.+apenas da barriga/i);
assert.match(library.findTopic('Quanto de whey tomar?').summary, /profissional de saúde/i);

const relatedStrengthTopics = library.findRelatedTopics('O que é bom pra tomar pra dar força?', 3).map((topic) => topic.id);
assert.ok(relatedStrengthTopics.includes('strength-progression'));
assert.ok(relatedStrengthTopics.includes('supplements'));
const relatedStrengthSearch = search.search('O que é bom pra tomar pra dar força?');
assert.equal(relatedStrengthSearch.coverage, 'related');
assert.ok(relatedStrengthSearch.items.some((item) => item.sourceKind === 'topic' && item.opensAnswer));
assert.ok(relatedStrengthSearch.items.some((item) => item.title === 'Suplemento não substitui alimentação e treino'));
assert.equal(library.findRelatedTopics('Assunto que não existe xyz').length, 0, 'Texto sem relação não deve inventar proximidade.');

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
assert.ok(swimmingStartResult.items.some((item) => item.title === 'Dicas práticas para começar'
  && item.image === '/img/jornada-esportiva-atleta-por-do-sol.webp'));

const footballSearchResult = search.search('Quero melhorar meu chute no futebol');
assert.equal(footballSearchResult.coverage, 'mixed');
assert.ok(footballSearchResult.items.some((item) => item.sourceLabel === 'Conteúdo publicado'));
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

console.log(`Biblioteca esportiva validada: ${library.sports.length} modalidades e ${library.topics.length} temas, com respostas e caminhos relacionados.`);
