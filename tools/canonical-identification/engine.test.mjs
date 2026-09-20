import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { loadCanonicalDataset, getRelation } from './dataset.mjs';
import {
  assessIdentification,
  compatible,
  filterCandidates,
  nextCharacter,
  retryCharacter,
} from './engine.mjs';

let dataset;

function findExplicitConflict(dataset) {
  for (const character of dataset.characters) {
    const related = dataset.species
      .map(species => ({
        speciesId: species.speciesId,
        relation: getRelation(
          dataset,
          species.speciesId,
          character.characterId,
        ),
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

async function withTemporaryBotanicalData(callback) {
  const sourceDir = resolve('data', 'botanical');
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), 'arboris-canonical-test-'),
  );
  const botanicalDir = join(temporaryRoot, 'botanical');

  try {
    await cp(sourceDir, botanicalDir, { recursive: true });
    await callback(botanicalDir);
  } finally {
    await rm(temporaryRoot, {
      recursive: true,
      force: true,
    });
  }
}

async function readBotanicalJson(botanicalDir, filename) {
  return JSON.parse(
    await readFile(
      join(botanicalDir, filename),
      'utf8',
    ),
  );
}

async function writeBotanicalJson(botanicalDir, filename, value) {
  await writeFile(
    join(botanicalDir, filename),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
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

test('canonical and computable relation views remain structurally separate', async () => {
  dataset ??= await loadCanonicalDataset();

  assert.ok(dataset.allRelationsBySpecies instanceof Map);
  assert.ok(dataset.relationsBySpecies instanceof Map);
  assert.ok(dataset.allCharactersById.has('CH-024'));
  assert.ok(!dataset.charactersById.has('CH-024'));

  const historicalRelation = dataset.allRelationsBySpecies
    .get('SP-005')
    ?.get('CH-024');

  assert.ok(
    historicalRelation,
    'test setup requires an explicit non-computable species-character relation',
  );
  assert.equal(
    dataset.relationsBySpecies.get('SP-005')?.has('CH-024') ?? false,
    false,
  );
});

test('non-computable variability is preserved descriptively but excluded from ACE inference', async () => {
  await withTemporaryBotanicalData(async botanicalDir => {
    const relations = await readBotanicalJson(
      botanicalDir,
      'species_characters.json',
    );
    const variability = await readBotanicalJson(
      botanicalDir,
      'character_variability.json',
    );

    const retiredRelation = relations.find(
      relation => relation.caracter_id === 'CH-024',
    );
    assert.ok(
      retiredRelation,
      'test setup requires an explicit CH-024 relation in species_characters.json',
    );

    const descriptiveEntry = {
      species_id: retiredRelation.species_id,
      caracter_id: 'CH-024',
      estado_alternativo: 'presente',
      contexto_id: null,
      frecuencia: 'baja',
      fuente_id: retiredRelation.fuente_id,
      nota: 'R1.1 structural-isolation regression fixture',
    };
    variability.push(descriptiveEntry);
    await writeBotanicalJson(
      botanicalDir,
      'character_variability.json',
      variability,
    );

    const withDescriptive = await loadCanonicalDataset({ botanicalDir });
    const preserved = withDescriptive.variabilityBySpecies
      .get(descriptiveEntry.species_id)
      ?.get('CH-024');

    assert.ok(Array.isArray(preserved));
    assert.ok(
      preserved.some(entry => entry.alternativeState === 'presente'),
      'non-computable variability must remain descriptively recoverable',
    );
    assert.ok(
      withDescriptive.allRelationsBySpecies
        .get(descriptiveEntry.species_id)
        ?.has('CH-024'),
      'canonical relation must remain in allRelations',
    );
    assert.equal(
      withDescriptive.relationsBySpecies
        .get(descriptiveEntry.species_id)
        ?.has('CH-024') ?? false,
      false,
      'non-computable relation must not enter the ACE relation view',
    );

    const baselineDir = join(
      resolve(botanicalDir, '..'),
      'baseline-botanical',
    );
    await cp(botanicalDir, baselineDir, { recursive: true });
    const baselineVariability = await readBotanicalJson(
      baselineDir,
      'character_variability.json',
    );
    baselineVariability.pop();
    await writeBotanicalJson(
      baselineDir,
      'character_variability.json',
      baselineVariability,
    );
    const withoutDescriptive = await loadCanonicalDataset({
      botanicalDir: baselineDir,
    });

    const evidence = [{
      characterId: 'CH-003',
      observedStates: ['entero'],
    }];
    const candidateIds = ['SP-001', 'SP-002'];

    assert.deepEqual(
      filterCandidates(withDescriptive, evidence, candidateIds),
      filterCandidates(withoutDescriptive, evidence, candidateIds),
    );
    assert.deepEqual(
      assessIdentification(withDescriptive, evidence, candidateIds),
      assessIdentification(withoutDescriptive, evidence, candidateIds),
    );
    assert.equal(
      nextCharacter(withDescriptive, evidence, candidateIds)?.characterId ?? null,
      nextCharacter(withoutDescriptive, evidence, candidateIds)?.characterId ?? null,
    );
    assert.equal(
      retryCharacter(withDescriptive, evidence, 'CH-003', candidateIds)?.characterId ?? null,
      retryCharacter(withoutDescriptive, evidence, 'CH-003', candidateIds)?.characterId ?? null,
    );
  });
});

test('loads the complementary context and variability layer', async () => {
  dataset ??= await loadCanonicalDataset();

  assert.ok(dataset.contextsById instanceof Map);
  assert.ok(dataset.contextsById.has('hojas_de_sombra'));
  assert.equal(dataset.stats.contexts, 1);
  assert.equal(dataset.stats.variabilityEntries, 1);

  const variability = dataset.variabilityBySpecies
    .get('SP-002')
    ?.get('CH-008');

  assert.ok(Array.isArray(variability));
  assert.equal(variability.length, 1);
  assert.equal(
    variability[0].alternativeState,
    'ausente',
  );
  assert.equal(
    variability[0].contextId,
    'hojas_de_sombra',
  );
});

test('canonical dataset rejects duplicate species-character relations', async () => {
  await withTemporaryBotanicalData(async botanicalDir => {
    const relations = await readBotanicalJson(
      botanicalDir,
      'species_characters.json',
    );

    const duplicate = { ...relations[0] };
    relations.push(duplicate);

    await writeBotanicalJson(
      botanicalDir,
      'species_characters.json',
      relations,
    );

    await assert.rejects(
      () => loadCanonicalDataset({ botanicalDir }),
      new RegExp(
        `duplicate species-character relation ${duplicate.species_id} / ${duplicate.caracter_id}`,
        'i',
      ),
    );
  });
});

test('canonical dataset rejects variability for an unknown species', async () => {
  await withTemporaryBotanicalData(async botanicalDir => {
    const variability = await readBotanicalJson(
      botanicalDir,
      'character_variability.json',
    );

    variability[0].species_id = 'SP-999';

    await writeBotanicalJson(
      botanicalDir,
      'character_variability.json',
      variability,
    );

    await assert.rejects(
      () => loadCanonicalDataset({ botanicalDir }),
      /variability references unknown species_id SP-999/i,
    );
  });
});

test('canonical dataset rejects variability for an unknown character', async () => {
  await withTemporaryBotanicalData(async botanicalDir => {
    const variability = await readBotanicalJson(
      botanicalDir,
      'character_variability.json',
    );

    variability[0].caracter_id = 'CH-999';

    await writeBotanicalJson(
      botanicalDir,
      'character_variability.json',
      variability,
    );

    await assert.rejects(
      () => loadCanonicalDataset({ botanicalDir }),
      /variability references unknown caracter_id CH-999/i,
    );
  });
});

test('canonical dataset rejects variability without a canonical species-character relation', async () => {
  await withTemporaryBotanicalData(async botanicalDir => {
    const variability = await readBotanicalJson(
      botanicalDir,
      'character_variability.json',
    );

    const relations = await readBotanicalJson(
      botanicalDir,
      'species_characters.json',
    );

    const original = variability[0];

    const orphanCharacter = relations.find(
      relation =>
        relation.caracter_id !== original.caracter_id
        && !relations.some(
          candidate =>
            candidate.species_id === original.species_id
            && candidate.caracter_id === relation.caracter_id,
        ),
    );

    assert.ok(
      orphanCharacter,
      'test setup requires an active character without a canonical relation for the variability species',
    );

    variability[0].caracter_id =
      orphanCharacter.caracter_id;

    await writeBotanicalJson(
      botanicalDir,
      'character_variability.json',
      variability,
    );

    await assert.rejects(
      () => loadCanonicalDataset({ botanicalDir }),
      new RegExp(
        `variability references missing canonical relation ${original.species_id} / ${orphanCharacter.caracter_id}`,
        'i',
      ),
    );
  });
});

test('canonical dataset rejects variability with an invalid alternative state', async () => {
  await withTemporaryBotanicalData(async botanicalDir => {
    const variability = await readBotanicalJson(
      botanicalDir,
      'character_variability.json',
    );

    variability[0].estado_alternativo =
      '__estado_inexistente__';

    await writeBotanicalJson(
      botanicalDir,
      'character_variability.json',
      variability,
    );

    await assert.rejects(
      () => loadCanonicalDataset({ botanicalDir }),
      /references invalid estado_alternativo __estado_inexistente__/i,
    );
  });
});

test('canonical dataset rejects variability with an unknown context', async () => {
  await withTemporaryBotanicalData(async botanicalDir => {
    const variability = await readBotanicalJson(
      botanicalDir,
      'character_variability.json',
    );

    variability[0].contexto_id =
      'contexto_inexistente';

    await writeBotanicalJson(
      botanicalDir,
      'character_variability.json',
      variability,
    );

    await assert.rejects(
      () => loadCanonicalDataset({ botanicalDir }),
      /references unknown contexto_id contexto_inexistente/i,
    );
  });
});
test('canonical dataset exposes the source of documented variability', async () => {
  dataset ??= await loadCanonicalDataset();

  assert.ok(dataset.sourcesById instanceof Map);
  assert.ok(dataset.sourcesById.has('F-004'));
  assert.equal(dataset.stats.sources, 21);

  const variability = dataset.variabilityBySpecies
    .get('SP-002')
    ?.get('CH-008');

  assert.ok(Array.isArray(variability));
  assert.equal(variability.length, 1);
  assert.equal(
    variability[0].sourceId,
    'F-004',
  );

  assert.equal(
    dataset.sourcesById.get('F-004').type,
    'Registro de terreno',
  );
});

test('canonical dataset rejects variability with an unknown source', async () => {
  await withTemporaryBotanicalData(async botanicalDir => {
    const variability = await readBotanicalJson(
      botanicalDir,
      'character_variability.json',
    );

    variability[0].fuente_id = 'F-999';

    await writeBotanicalJson(
      botanicalDir,
      'character_variability.json',
      variability,
    );

    await assert.rejects(
      () => loadCanonicalDataset({ botanicalDir }),
      /references unknown fuente_id F-999/i,
    );
  });
});

test('compatibility preserves uncertainty and only rejects explicit conflicts', () => {
  assert.equal(
    compatible([], ['serrado']).compatible,
    true,
  );

  assert.equal(
    compatible(['serrado'], []).compatible,
    true,
  );

  assert.equal(
    compatible(['serrado'], ['unknown']).compatible,
    true,
  );

  assert.equal(
    compatible(['serrado'], ['not_observable']).compatible,
    true,
  );

  assert.equal(
    compatible(['serrado', 'dentado'], ['dentado']).compatible,
    true,
  );

  assert.equal(
    compatible(['serrado'], ['entero']).compatible,
    false,
  );
});

test('filtering eliminates only candidates with explicit state conflicts', async () => {
  dataset ??= await loadCanonicalDataset();

  const conflict = findExplicitConflict(dataset);

  assert.ok(
    conflict,
    'expected at least one explicit conflict in the canonical matrix',
  );

  const observedState =
    conflict.left.relation.expectedStates[0];

  const result = filterCandidates(
    dataset,
    {
      [conflict.character.characterId]: observedState,
    },
    [
      conflict.left.speciesId,
      conflict.right.speciesId,
    ],
  );

  assert.deepEqual(
    result.remaining,
    [conflict.left.speciesId],
  );

  assert.equal(result.eliminated.length, 1);

  assert.equal(
    result.eliminated[0].speciesId,
    conflict.right.speciesId,
  );

  assert.equal(
    result.eliminated[0].conflicts.length,
    1,
  );

  assert.equal(
    result.eliminated[0].conflicts[0].characterId,
    conflict.character.characterId,
  );

  assert.equal(
    result.eliminated[0].conflicts[0].reason,
    'explicit_state_conflict',
  );
});

test('candidateIds are deduplicated while preserving first-seen order', async () => {
  dataset ??= await loadCanonicalDataset();

  const result = filterCandidates(
    dataset,
    [],
    ['SP-002', 'SP-001', 'SP-002'],
  );

  assert.deepEqual(
    result.remaining,
    ['SP-002', 'SP-001'],
  );

  assert.deepEqual(result.eliminated, []);
});

test('unknown candidateIds are rejected explicitly', async () => {
  dataset ??= await loadCanonicalDataset();

  assert.throws(
    () => filterCandidates(
      dataset,
      [],
      ['SP-001', 'SP-999'],
    ),
    /unknown candidate species_id SP-999/i,
  );
});

test('an explicit empty candidateIds list remains empty', async () => {
  dataset ??= await loadCanonicalDataset();

  const result = filterCandidates(
    dataset,
    [],
    [],
  );

  assert.deepEqual(result.remaining, []);
  assert.deepEqual(result.eliminated, []);
});

test('unknown evidence never removes candidates', async () => {
  dataset ??= await loadCanonicalDataset();

  const result = filterCandidates(
    dataset,
    {
      'CH-003': 'not_observable',
    },
  );

  assert.equal(result.remaining.length, 6);
  assert.equal(result.eliminated.length, 0);
});

test('nextCharacter chooses an active unobserved character', async () => {
  dataset ??= await loadCanonicalDataset();

  const next = nextCharacter(dataset);

  assert.ok(next);
  assert.ok(
    dataset.charactersById.has(
      next.characterId,
    ),
  );

  assert.notEqual(
    next.characterId,
    'CH-017',
  );
});

test('nextCharacter does not automatically repeat an attempted unresolved character', async () => {
  dataset ??= await loadCanonicalDataset();

  const first = nextCharacter(dataset);
  assert.ok(first);

  const evidence = [
    {
      characterId: first.characterId,
      observedStates: ['not_observable'],
    },
  ];

  const next = nextCharacter(
    dataset,
    evidence,
  );

  assert.ok(next);

  assert.notEqual(
    next.characterId,
    first.characterId,
  );
});

test('an attempted unresolved character can be requested again explicitly', async () => {
  dataset ??= await loadCanonicalDataset();

  const first = nextCharacter(dataset);
  assert.ok(first);

  const evidence = [
    {
      characterId: first.characterId,
      observedStates: ['not_observable'],
    },
  ];

  const retry = retryCharacter(
    dataset,
    evidence,
    first.characterId,
  );

  assert.ok(retry);

  assert.equal(
    retry.characterId,
    first.characterId,
  );
});

test('a character that actually reduced the candidate set cannot be retried', async () => {
  dataset ??= await loadCanonicalDataset();

  const conflict = findExplicitConflict(dataset);

  assert.ok(
    conflict,
    'expected at least one explicit conflict in the canonical matrix',
  );

  const candidateIds = [
    conflict.left.speciesId,
    conflict.right.speciesId,
  ];

  const evidence = [
    {
      characterId:
        conflict.character.characterId,
      observedStates: [
        conflict.left.relation.expectedStates[0],
      ],
    },
  ];

  const filtered = filterCandidates(
    dataset,
    evidence,
    candidateIds,
  );

  assert.equal(
    filtered.remaining.length,
    1,
    'test setup must actually reduce the candidate set',
  );

  const retry = retryCharacter(
    dataset,
    evidence,
    conflict.character.characterId,
    candidateIds,
  );

  assert.equal(retry, null);
});

test('documented natural variability keeps a contradicting candidate as inconclusive, not eliminated', async () => {
  dataset ??= await loadCanonicalDataset();

  const result = filterCandidates(
    dataset,
    [
      {
        characterId: 'CH-008',
        observedStates: ['ausente'],
        context: 'hojas_de_sombra',
      },
    ],
    ['SP-002'],
  );

  assert.deepEqual(
    result.remaining,
    ['SP-002'],
  );

  assert.equal(
    result.eliminated.length,
    0,
  );
});

test('the same contradiction without a documented context still eliminates the candidate', async () => {
  dataset ??= await loadCanonicalDataset();

  const result = filterCandidates(
    dataset,
    [
      {
        characterId: 'CH-008',
        observedStates: ['ausente'],
      },
    ],
    ['SP-002'],
  );

  assert.deepEqual(
    result.remaining,
    [],
  );

  assert.equal(
    result.eliminated.length,
    1,
  );

  assert.equal(
    result.eliminated[0].speciesId,
    'SP-002',
  );

  assert.equal(
    result.eliminated[0].conflicts[0].reason,
    'explicit_state_conflict',
  );
});

test('repeated observations of the same character count as one evaluable dimension', async () => {
  dataset ??= await loadCanonicalDataset();

  const conflict = findExplicitConflict(dataset);

  assert.ok(
    conflict,
    'expected at least one explicit conflict in the canonical matrix',
  );

  const candidateIds = [
    conflict.left.speciesId,
    conflict.right.speciesId,
  ];

  const observedState =
    conflict.left.relation.expectedStates[0];

  const evidence = [
    {
      characterId:
        conflict.character.characterId,
      observedStates: [observedState],
      source: 'observation_1',
    },
    {
      characterId:
        conflict.character.characterId,
      observedStates: [observedState],
      source: 'observation_2',
    },
  ];

  const assessment = assessIdentification(
    dataset,
    evidence,
    candidateIds,
  );

  assert.deepEqual(
    assessment.remaining,
    [conflict.left.speciesId],
  );

  assert.equal(
    assessment.status,
    'tentative',
  );
});

test('assessment returns cautious result states', async () => {
  dataset ??= await loadCanonicalDataset();

  const ambiguous = assessIdentification(
    dataset,
    [],
  );

  assert.equal(
    ambiguous.status,
    'ambiguous',
  );

  const contradiction = assessIdentification(
    dataset,
    [
      {
        characterId: 'CH-001',
        observedStates: ['simple'],
      },
      {
        characterId: 'CH-001',
        observedStates: ['compuesta'],
      },
    ],
  );

  assert.ok(
    ['ambiguous', 'unresolved']
      .includes(contradiction.status),
  );
});
