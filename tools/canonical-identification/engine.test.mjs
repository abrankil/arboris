import assert from 'node:assert/strict';
import test from 'node:test';

import { loadCanonicalDataset, getRelation } from './dataset.mjs';
import {
  assessIdentification,
  compatible,
  diagnosticPowerScore,
  filterCandidates,
  nextCharacter,
} from './engine.mjs';

let dataset;

function findExplicitConflict(dataset) {
  for (const character of dataset.characters) {
    const related = dataset.species
      .map(species => ({
        speciesId: species.speciesId,
        relation: getRelation(dataset, species.speciesId, character.characterId),
      }))
      .filter(item => item.relation?.expectedStates?.length);

    for (let i = 0; i < related.length; i += 1) {
      for (let j = i + 1; j < related.length; j += 1) {
        const left = related[i];
        const right = related[j];
        const overlaps = left.relation.expectedStates
          .some(state => right.relation.expectedStates.includes(state));

        if (!overlaps) {
          return {
            character,
            left,
            right,
          };
        }
      }
    }
  }

  return null;
}

function syntheticApplicabilityDataset() {
  const characters = [
    { characterId: 'CH-013', name: 'Tipo de fruto diagnóstico' },
    { characterId: 'CH-023', name: 'Cápsula tricoca', appliesIf: 'CH-013 contiene capsula' },
  ];

  return {
    species: [
      { speciesId: 'SP-A' },
      { speciesId: 'SP-B' },
    ],
    characters,
    charactersById: new Map(characters.map(character => [character.characterId, character])),
    relationsBySpecies: new Map([
      ['SP-A', new Map([
        ['CH-013', { expectedStates: ['capsula'] }],
        ['CH-023', { expectedStates: ['presente'] }],
      ])],
      ['SP-B', new Map([
        ['CH-013', { expectedStates: ['capsula'] }],
        ['CH-023', { expectedStates: ['ausente'] }],
      ])],
    ]),
  };
}

test('loads the Master 2.0 canonical identification dataset', async () => {
  dataset = await loadCanonicalDataset();

  assert.equal(dataset.stats.masterVersion, '2.0.0');
  assert.equal(dataset.stats.species, 6);
  assert.equal(dataset.stats.activeCharacters, 19);

  assert.ok(dataset.speciesById.has('SP-001'));
  assert.ok(dataset.speciesById.has('SP-006'));
  assert.ok(!dataset.charactersById.has('CH-017'));
});

test('compatibility preserves uncertainty and only rejects explicit conflicts', () => {
  assert.equal(compatible([], ['serrado']).compatible, true);
  assert.equal(compatible(['serrado'], []).compatible, true);
  assert.equal(compatible(['serrado'], ['unknown']).compatible, true);
  assert.equal(compatible(['serrado'], ['not_observable']).compatible, true);
  assert.equal(compatible(['serrado', 'dentado'], ['dentado']).compatible, true);
  assert.equal(compatible(['serrado'], ['entero']).compatible, false);
});

test('diagnostic power normalizes pilot labels without adding a rules engine', () => {
  assert.equal(diagnosticPowerScore('alto'), 3);
  assert.equal(diagnosticPowerScore('medio-alto'), 2.5);
  assert.equal(diagnosticPowerScore('medio_alto'), 2.5);
  assert.equal(diagnosticPowerScore('medio'), 2);
  assert.equal(diagnosticPowerScore('bajo'), 1);
  assert.equal(diagnosticPowerScore('sin_dato'), 0);
});

test('filtering eliminates only candidates with explicit state conflicts', async () => {
  dataset ??= await loadCanonicalDataset();

  const conflict = findExplicitConflict(dataset);

  assert.ok(conflict, 'expected at least one explicit conflict in the canonical matrix');

  const observedState = conflict.left.relation.expectedStates[0];

  const result = filterCandidates(dataset, {
    [conflict.character.characterId]: observedState,
  }, [conflict.left.speciesId, conflict.right.speciesId]);

  assert.deepEqual(result.remaining, [conflict.left.speciesId]);
  assert.equal(result.eliminated.length, 1);
  assert.equal(result.eliminated[0].speciesId, conflict.right.speciesId);
  assert.equal(result.eliminated[0].conflicts.length, 1);
  assert.equal(result.eliminated[0].conflicts[0].characterId, conflict.character.characterId);
  assert.equal(result.eliminated[0].conflicts[0].reason, 'explicit_state_conflict');
});

test('unknown evidence never removes candidates', async () => {
  dataset ??= await loadCanonicalDataset();

  const result = filterCandidates(dataset, { 'CH-003': 'not_observable' });

  assert.equal(result.remaining.length, 6);
  assert.equal(result.eliminated.length, 0);
});

test('nextCharacter chooses an active unobserved character', async () => {
  dataset ??= await loadCanonicalDataset();

  const next = nextCharacter(dataset);

  assert.ok(next);
  assert.ok(dataset.charactersById.has(next.characterId));
  assert.notEqual(next.characterId, 'CH-017');
});

test('nextCharacter respects minimal applies_if dependencies', () => {
  const synthetic = syntheticApplicabilityDataset();

  const withoutParentEvidence = nextCharacter(synthetic, [], ['SP-A', 'SP-B']);
  assert.equal(withoutParentEvidence, null);

  const parentUnknown = nextCharacter(synthetic, { 'CH-013': 'not_observable' }, ['SP-A', 'SP-B']);
  assert.equal(parentUnknown, null);

  const parentSatisfied = nextCharacter(synthetic, { 'CH-013': 'capsula' }, ['SP-A', 'SP-B']);
  assert.equal(parentSatisfied.characterId, 'CH-023');

  const parentNotSatisfied = nextCharacter(synthetic, { 'CH-013': 'drupa' }, ['SP-A', 'SP-B']);
  assert.equal(parentNotSatisfied, null);
});

test('assessment returns cautious result states', async () => {
  dataset ??= await loadCanonicalDataset();

  const ambiguous = assessIdentification(dataset, []);
  assert.equal(ambiguous.status, 'ambiguous');

  const contradiction = assessIdentification(dataset, [
    { characterId: 'CH-001', observedStates: ['simple'] },
    { characterId: 'CH-001', observedStates: ['compuesta'] },
  ]);

  assert.ok(['ambiguous', 'unresolved'].includes(contradiction.status));
});
