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

  const discriminating = dataset.characters.find(character => {
    const stateSets = dataset.species.map(species => {
      const relation = getRelation(dataset, species.speciesId, character.characterId);
      return relation?.expectedStates?.join('|') ?? '';
    });
    return new Set(stateSets.filter(Boolean)).size >= 2;
  });

  assert.ok(discriminating, 'expected at least one discriminating active character');

  const pairs = dataset.species.map(species => ({
    speciesId: species.speciesId,
    relation: getRelation(dataset, species.speciesId, discriminating.characterId),
  })).filter(item => item.relation?.expectedStates?.length);

  const first = pairs[0];
  const conflicting = pairs.find(item => !item.relation.expectedStates.some(state => first.relation.expectedStates.includes(state)));

  assert.ok(conflicting, 'expected at least one explicit conflict in the canonical matrix');

  const result = filterCandidates(dataset, {
    [discriminating.characterId]: first.relation.expectedStates[0],
  }, [first.speciesId, conflicting.speciesId]);

  assert.deepEqual(result.remaining, [first.speciesId]);
  assert.equal(result.eliminated[0].speciesId, conflicting.speciesId);
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
