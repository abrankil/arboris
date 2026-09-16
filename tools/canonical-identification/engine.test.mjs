import assert from 'node:assert/strict';
import test from 'node:test';

import { loadCanonicalDataset, getRelation } from './dataset.mjs';
import {
  assessIdentification,
  compatible,
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
