import assert from 'node:assert/strict';
import test from 'node:test';
import { QUESTIONS } from './logic.mjs';
import {
  KEY_CHARACTER_IDS,
  compareStates,
  loadPilotSpecies,
  statesForKey,
} from './species_adapter.mjs';

const questionStates = Object.fromEntries(
  QUESTIONS.map(question => [question.id, question.states]),
);
const expectedLegacyStates = Object.fromEntries(
  Object.entries(questionStates).map(([questionId, states]) => [questionId,
    Object.fromEntries(Object.entries(states).map(([speciesId, values]) => [speciesId, values]))]),
);
const expectedLegacyBySpecies = Object.fromEntries(['SP001', 'SP002', 'SP003', 'SP004', 'SP005', 'SP006']
  .map(speciesId => [speciesId, Object.fromEntries(Object.keys(KEY_CHARACTER_IDS)
    .filter(questionId => expectedLegacyStates[questionId]?.[speciesId])
    .map(questionId => [questionId, expectedLegacyStates[questionId][speciesId]]))]));

test('adapter reads all six species and the four key characters', async () => {
  const records = await loadPilotSpecies();
  assert.deepEqual(records.map(record => record.id), [
    'SP001', 'SP002', 'SP003', 'SP004', 'SP005', 'SP006',
  ]);
  for (const record of records) {
    assert.deepEqual(Object.keys(record.states), Object.keys(KEY_CHARACTER_IDS));
  }
});

test('adapter preserves source unknowns and translates explicit states', async () => {
  const records = await loadPilotSpecies();
  const states = statesForKey(records);
  assert.deepEqual(states.SP001.margin, ['entire']);
  assert.deepEqual(states.SP003.glands, ['yes']);
  assert.deepEqual(states.SP006.margin, ['entire', 'toothed']);
  assert.deepEqual(states.SP006.venation, []);
  assert.deepEqual(states.SP004.underside, []);
});

test('compatibility matrix records source/key differences without hiding them', async () => {
  const records = await loadPilotSpecies();
  const differences = compareStates(records, expectedLegacyBySpecies);
  assert.deepEqual(differences, [
    { speciesId: 'SP002', questionId: 'underside', actual: ['yes'], expected: [], reason: 'translation_or_key_difference' },
    { speciesId: 'SP003', questionId: 'underside', actual: ['yes'], expected: [], reason: 'translation_or_key_difference' },
    { speciesId: 'SP006', questionId: 'underside', actual: [], expected: ['no'], reason: 'source_unknown' },
  ]);
});
