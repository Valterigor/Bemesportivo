'use strict';

const assert = require('node:assert/strict');
const library = require('../../js/be-knowledge-library.js');

const baseContext = Object.freeze({
  name: 'João',
  age: 'adulto',
  objective: 'criar constância',
  modality: 'corrida',
  availabilityLabel: 'até 20 minutos',
  shortDuration: 20,
  progressPercent: 40,
  recentLogs: [],
  activeLogs: [],
  activeMinutes: 0,
  streak: 0,
  latestLog: null,
  latestBarrier: '',
  safetyRestricted: false
});

function answerFor(query, overrides = {}) {
  return library.buildResponse(query, Object.assign({}, baseContext, overrides));
}

function assertContract(answer) {
  assert.ok(answer.intent);
  assert.ok(['action', 'care'].includes(answer.tone));
  assert.ok(answer.title.length > 10);
  assert.ok(answer.message.length > 20);
  assert.ok(answer.nextTitle.length > 10);
  assert.ok(answer.detail.length > 20);
  assert.ok(Array.isArray(answer.reasons) && answer.reasons.length >= 5);
  assert.ok(Array.isArray(answer.primary) && answer.primary.length === 2);
  assert.ok(Array.isArray(answer.secondary) && answer.secondary.length === 2);
  assert.equal(answer.libraryVersion, library.version);
  assert.equal(answer.reviewedAt, library.reviewedAt);
  assert.equal(answer.reviewStatus, 'editorial-pending-professional');
  assert.ok(Array.isArray(answer.sources) && answer.sources.length > 0);
}

function assertInteractionContract(answer, type) {
  assert.equal(answer.interaction, type);
  assert.ok(['success', 'care'].includes(answer.tone));
  assert.ok(answer.title.length > 10);
  assert.ok(answer.message.length > 20);
  assert.ok(answer.detail.length > 20);
  assert.equal(answer.libraryVersion, library.version);
  assert.equal(answer.reviewedAt, library.reviewedAt);
  assert.equal(answer.reviewStatus, 'editorial-pending-professional');
  assert.ok(Array.isArray(answer.sources) && answer.sources.length > 0);
  const normalized = library.normalize(`${answer.title} ${answer.message} ${answer.detail}`);
  assert.doesNotMatch(normalized, /sem desculpas|voce falhou|quem quer da um jeito|compense o treino/);
}

assert.equal(library.classifyIntent('Estou sem vontade de treinar.', baseContext), 'motivation');
assert.equal(library.classifyIntent('Hoje tenho pouco tempo.', baseContext), 'time');
assert.equal(library.classifyIntent('Parei por alguns dias e falhei.', baseContext), 'consistency');
assert.equal(library.classifyIntent('Quero registrar o almoço.', baseContext), 'nutrition');
assert.equal(library.classifyIntent('Preciso melhorar a hidratação.', baseContext), 'hydration');

assert.equal(library.assessSafety('Estou com dor no peito.', baseContext).level, 'urgent');
assert.equal(library.assessSafety('Tive uma lesão recente.', baseContext).level, 'pause');
assert.equal(library.assessSafety('Estou sem dor no peito.', baseContext).level, 'clear');
assert.equal(library.assessSafety('Não consigo respirar.', baseContext).level, 'urgent');
assert.equal(library.assessSafety('Estou bem.', Object.assign({}, baseContext, { safetyRestricted: true })).level, 'pause');

const fatigue = answerFor('Estou cansado e dormi mal.', { latestLog: { feeling: 2, sleep: 5 } });
assert.equal(fatigue.intent, 'fatigue');
assert.equal(fatigue.tone, 'care');
assert.equal(fatigue.primary[1], 'rest');
assert.match(fatigue.title, /falta de compromisso/i);

const nutrition = answerFor('O que faço com minha alimentação?');
assert.equal(nutrition.primary[1], 'nutrition');
assert.match(nutrition.message, /não prescreve dieta/i);

const emergency = answerFor('Senti falta de ar intensa durante o treino.');
assert.equal(emergency.intent, 'safety');
assert.equal(emergency.tone, 'care');
assert.match(emergency.nextTitle, /urgência/i);

[
  'Estou sem vontade de treinar.',
  'Hoje tenho pouco tempo.',
  'Estou cansado.',
  'Quero retomar depois de parar.',
  'Preciso planejar meu jantar.',
  'Como posso me hidratar?',
  'Parei e não consegui manter a sequência.',
  'Qual é o próximo passo?',
  'Tenho uma dúvida sobre meu esporte.'
].forEach(query => assertContract(answerFor(query)));

const interactionScenarios = [
  ['plan_saved', { name: 'João', activityLabel: 'Corrida', time: '18:30', duration: 30 }],
  ['first_activity', { name: 'João' }],
  ['activity_updated', {}],
  ['return_after_pause', { name: 'João', gapDays: 20 }],
  ['low_feeling_activity', { name: 'João' }],
  ['personal_milestone', { name: 'João', milestone: '5 km em corrida' }],
  ['consistent_week', { name: 'João', weekCount: 3 }],
  ['activity_saved', { activityLabel: 'Caminhada', duration: 25 }],
  ['daily_checkin_saved', { name: 'João' }],
  ['daily_checkin_updated', {}],
  ['rest_recorded', { name: 'João' }],
  ['meal_saved', { mealLabel: 'Almoço' }],
  ['profile_saved', { name: 'João' }],
  ['weekly_review_saved', { name: 'João', date: '2026-08-17' }],
  ['task_completed', { name: 'João' }],
  ['reminder_saved', { name: 'João', time: '18:30' }],
  ['local_data_saved', {}],
  ['backup_restored', { name: 'João' }]
];

interactionScenarios.forEach(([type, context]) => assertInteractionContract(library.buildInteraction(type, context), type));
assert.match(library.buildInteraction('return_after_pause', { gapDays: 20 }).message, /20 dias/);
assert.match(library.buildInteraction('plan_saved', { activityLabel: 'Corrida', time: '18:30', duration: 30 }).detail, /intenção|planejar/i);
assert.match(library.buildInteraction('meal_saved', { mealLabel: 'Almoço' }).message, /sem nota, culpa/i);

assert.deepEqual(library.coverage, {
  responseIntents: 9,
  interactionTypes: 18,
  arrivalMoments: 5,
  variantsPerCoreMessage: 3
});

const stableA = library.buildInteraction('activity_saved', { activityLabel: 'Corrida', duration: 20, variantSeed: 'registro-1' });
const stableB = library.buildInteraction('activity_saved', { activityLabel: 'Corrida', duration: 20, variantSeed: 'registro-1' });
assert.deepEqual(stableA, stableB, 'A mesma interação deve manter a mesma frase para o mesmo contexto.');

const interactionVariants = new Set(Array.from({ length: 24 }, (_, index) => library.buildInteraction('activity_saved', {
  activityLabel: 'Corrida', duration: 20, variantSeed: `registro-${index}`
}).title));
assert.equal(interactionVariants.size, 3, 'Os acontecimentos centrais devem oferecer três variações editoriais.');

const responseVariants = new Set(Array.from({ length: 24 }, (_, index) => library.buildResponse('Estou sem tempo hoje.', {
  ...baseContext, variantSeed: `resposta-${index}`
}).title));
assert.equal(responseVariants.size, 3, 'As respostas por intenção devem oferecer três variações editoriais.');

['ready', 'short', 'tired', 'returning', 'present'].forEach(arrival => {
  const messages = new Set(Array.from({ length: 24 }, (_, index) => library.buildArrivalMoment(arrival, { variantSeed: `chegada-${index}` }).message));
  assert.equal(messages.size, 3, `O momento ${arrival} deve oferecer três formas de acolhimento.`);
});

console.log(`Biblioteca BeM aprovada: versão ${library.version}, segurança, linguagem e ${9 + interactionScenarios.length} cenários validados.`);
