import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRelation,
  loadCanonicalDataset,
} from '../canonical-identification/dataset.mjs';

import {
  filterCandidates,
  nextCharacter,
  normalizeEvidence,
  retryCharacter,
} from '../canonical-identification/engine.mjs';

import {
  observerResultToEvidence,
} from './contract.mjs';

const dataset =
  await loadCanonicalDataset();

function findExplicitConflict(
  dataset,
) {
  for (
    const character
    of dataset.characters
  ) {
    const related =
      dataset.species
        .map(
          species => ({
            speciesId:
              species.speciesId,

            relation:
              getRelation(
                dataset,
                species.speciesId,
                character.characterId,
              ),
          }),
        )
        .filter(
          item =>
            item.relation
              ?.expectedStates
              ?.length,
        );

    for (
      let i = 0;
      i < related.length;
      i += 1
    ) {
      for (
        let j = i + 1;
        j < related.length;
        j += 1
      ) {
        const left =
          related[i];

        const right =
          related[j];

        const overlaps =
          left
            .relation
            .expectedStates
            .some(
              state =>
                right
                  .relation
                  .expectedStates
                  .includes(state),
            );

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

test(
  'ACE preserves rich Hito 16 observer metadata',
  () => {
    const evidence =
      observerResultToEvidence(
        dataset,
        {
          characterId:
            'CH-003',

          status:
            'uncertain',

          confidence:
            0.45,

          model:
            'test-observer',

          notes:
            'ambiguous margin',
        },
      );

    const normalized =
      normalizeEvidence([
        {
          ...evidence,

          provenance: {
            origin:
              'H16-EXP-001',
          },

          evidenceRef:
            'EV-CH003-0001',

          regionOfInterest: {
            x: 10,
            y: 20,
            width: 100,
            height: 80,
          },
        },
      ]);

    assert.equal(
      normalized.length,
      1,
    );

    assert.equal(
      normalized[0]
        .observationStatus,
      'uncertain',
    );

    assert.deepEqual(
      normalized[0]
        .observedStates,
      [],
    );

    assert.equal(
      normalized[0]
        .confidence,
      0.45,
    );

    assert.equal(
      normalized[0]
        .model,
      'test-observer',
    );

    assert.equal(
      normalized[0]
        .notes,
      'ambiguous margin',
    );

    assert.deepEqual(
      normalized[0]
        .provenance,
      {
        origin:
          'H16-EXP-001',
      },
    );

    assert.equal(
      normalized[0]
        .evidenceRef,
      'EV-CH003-0001',
    );

    assert.deepEqual(
      normalized[0]
        .regionOfInterest,
      {
        x: 10,
        y: 20,
        width: 100,
        height: 80,
      },
    );
  },
);

test(
  'uncertain is attempted, non-eliminating and explicitly retryable',
  () => {
    const first =
      nextCharacter(dataset);

    assert.ok(first);

    const evidence = [
      observerResultToEvidence(
        dataset,
        {
          characterId:
            first.characterId,

          status:
            'uncertain',

          confidence:
            0.45,
        },
      ),
    ];

    const filtered =
      filterCandidates(
        dataset,
        evidence,
      );

    assert.equal(
      filtered.remaining.length,
      6,
    );

    assert.equal(
      filtered.eliminated.length,
      0,
    );

    const automaticNext =
      nextCharacter(
        dataset,
        evidence,
      );

    assert.ok(automaticNext);

    assert.notEqual(
      automaticNext.characterId,
      first.characterId,
    );

    const retry =
      retryCharacter(
        dataset,
        evidence,
        first.characterId,
      );

    assert.ok(retry);

    assert.equal(
      retry.characterId,
      first.characterId,
    );
  },
);

test(
  'not_observable is attempted, non-eliminating and explicitly retryable',
  () => {
    const first =
      nextCharacter(dataset);

    assert.ok(first);

    const evidence = [
      observerResultToEvidence(
        dataset,
        {
          characterId:
            first.characterId,

          status:
            'not_observable',

          confidence:
            0.2,
        },
      ),
    ];

    const filtered =
      filterCandidates(
        dataset,
        evidence,
      );

    assert.equal(
      filtered.remaining.length,
      6,
    );

    assert.equal(
      filtered.eliminated.length,
      0,
    );

    const automaticNext =
      nextCharacter(
        dataset,
        evidence,
      );

    assert.ok(automaticNext);

    assert.notEqual(
      automaticNext.characterId,
      first.characterId,
    );

    const retry =
      retryCharacter(
        dataset,
        evidence,
        first.characterId,
      );

    assert.ok(retry);

    assert.equal(
      retry.characterId,
      first.characterId,
    );
  },
);

test(
  'observed becomes resolved only when it reduces candidates',
  () => {
    const conflict =
      findExplicitConflict(
        dataset,
      );

    assert.ok(
      conflict,
      'expected at least one explicit conflict',
    );

    const candidateIds = [
      conflict.left.speciesId,
      conflict.right.speciesId,
    ];

    const evidence = [
      observerResultToEvidence(
        dataset,
        {
          characterId:
            conflict
              .character
              .characterId,

          status:
            'observed',

          observedState:
            conflict
              .left
              .relation
              .expectedStates[0],

          confidence:
            0.9,
        },
      ),
    ];

    const filtered =
      filterCandidates(
        dataset,
        evidence,
        candidateIds,
      );

    assert.deepEqual(
      filtered.remaining,
      [
        conflict.left.speciesId,
      ],
    );

    const retry =
      retryCharacter(
        dataset,
        evidence,
        conflict
          .character
          .characterId,
        candidateIds,
      );

    assert.equal(
      retry,
      null,
    );
  },
);

test(
  'observed remains attempted when it does not reduce candidates',
  () => {
    const conflict =
      findExplicitConflict(
        dataset,
      );

    assert.ok(conflict);

    const candidateIds = [
      conflict.left.speciesId,
    ];

    const evidence = [
      observerResultToEvidence(
        dataset,
        {
          characterId:
            conflict
              .character
              .characterId,

          status:
            'observed',

          observedState:
            conflict
              .left
              .relation
              .expectedStates[0],

          confidence:
            0.9,
        },
      ),
    ];

    const filtered =
      filterCandidates(
        dataset,
        evidence,
        candidateIds,
      );

    assert.deepEqual(
      filtered.remaining,
      candidateIds,
    );

    const retry =
      retryCharacter(
        dataset,
        evidence,
        conflict
          .character
          .characterId,
        candidateIds,
      );

    assert.ok(retry);

    assert.equal(
      retry.characterId,
      conflict
        .character
        .characterId,
    );
  },
);

test(
  'confidence is preserved metadata and does not change ACE filtering',
  () => {
    const conflict =
      findExplicitConflict(
        dataset,
      );

    assert.ok(
      conflict,
      'expected at least one explicit conflict',
    );

    const candidateIds = [
      conflict.left.speciesId,
      conflict.right.speciesId,
    ];

    const characterId =
      conflict
        .character
        .characterId;

    const observedState =
      conflict
        .left
        .relation
        .expectedStates[0];

    const lowConfidenceEvidence = [
      observerResultToEvidence(
        dataset,
        {
          characterId,
          status:
            'observed',
          observedState,
          confidence:
            0,
        },
      ),
    ];

    const highConfidenceEvidence = [
      observerResultToEvidence(
        dataset,
        {
          characterId,
          status:
            'observed',
          observedState,
          confidence:
            1,
        },
      ),
    ];

    const lowNormalized =
      normalizeEvidence(
        lowConfidenceEvidence,
      );

    const highNormalized =
      normalizeEvidence(
        highConfidenceEvidence,
      );

    assert.equal(
      lowNormalized[0]
        .confidence,
      0,
    );

    assert.equal(
      highNormalized[0]
        .confidence,
      1,
    );

    const lowResult =
      filterCandidates(
        dataset,
        lowConfidenceEvidence,
        candidateIds,
      );

    const highResult =
      filterCandidates(
        dataset,
        highConfidenceEvidence,
        candidateIds,
      );

    assert.deepEqual(
      lowResult.remaining,
      highResult.remaining,
    );

    assert.deepEqual(
      lowResult.eliminated,
      highResult.eliminated,
    );

    assert.deepEqual(
      lowResult.remaining,
      [
        conflict.left.speciesId,
      ],
    );
  },
);