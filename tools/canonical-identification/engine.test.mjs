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

test('nextCharacter does not automatically repeat an attempted unresolved character', async () => {
  dataset ??= await loadCanonicalDataset();

  const first = nextCharacter(dataset);
  assert.ok(first);

  const evidence = [
    { characterId: first.characterId, observedStates: ['not_observable'] },
  ];
  const next = nextCharacter(dataset, evidence);

  assert.ok(next);
  assert.notEqual(next.characterId, first.characterId);
});

test('an attempted unresolved character can be requested again explicitly', async () => {
  dataset ??= await loadCanonicalDataset();

  const first = nextCharacter(dataset);
  assert.ok(first);

  const evidence = [
    { characterId: first.characterId, observedStates: ['not_observable'] },
  ];
  const engine = await import('./engine.mjs');

  assert.equal(
    typeof engine.retryCharacter,
    'function',
    'engine must expose an explicit retry operation for attempted unresolved characters',
  );

  const retry = engine.retryCharacter(dataset, evidence, first.characterId);

  assert.ok(retry);
  assert.equal(retry.characterId, first.characterId);
});

test('documented natural variability keeps a contradicting candidate as inconclusive, not eliminated', async () => {
  dataset ??= await loadCanonicalDataset();

  // SP-002 (Litre) expects CH-008 = "presente", pero
  // data/botanical/character_variability.json documenta que en
  // contexto "hojas_de_sombra" el estado "ausente" es una variación
  // natural conocida (frecuencia baja), no un conflicto real.
  // Confirma que la regla de variabilidad documentada se aplica
  // correctamente: el motor lee character_variability.json y trata
  // esta discrepancia como inconcluyente, no como conflicto.
  const result = filterCandidates(dataset, [
    { characterId: 'CH-008', observedStates: ['ausente'], context: 'hojas_de_sombra' },
  ], ['SP-002']);

  assert.deepEqual(result.remaining, ['SP-002']);
  assert.equal(result.eliminated.length, 0);
});

test('the same contradiction without a documented context still eliminates the candidate', async () => {
  dataset ??= await loadCanonicalDataset();

  // Caso de control: misma especie, mismo carácter, mismo estado
  // observado, pero sin el contexto documentado en
  // character_variability.json. Esto confirma que la regla de
  // variabilidad no afloja el caso general: sigue siendo un
  // conflicto explícito y elimina al candidato.
  const result = filterCandidates(dataset, [
    { characterId: 'CH-008', observedStates: ['ausente'] },
  ], ['SP-002']);

  assert.deepEqual(result.remaining, []);
  assert.equal(result.eliminated.length, 1);
  assert.equal(result.eliminated[0].speciesId, 'SP-002');
  assert.equal(result.eliminated[0].conflicts[0].reason, 'explicit_state_conflict');
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
