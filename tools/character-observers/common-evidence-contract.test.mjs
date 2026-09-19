import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCanonicalDataset } from '../canonical-identification/dataset.mjs';
import {
  validatePhotoEvidence,
  validateCharacterObservation,
  observerResultToCharacterObservation,
  characterObservationToAceEvidence,
} from './common-evidence-contract.mjs';

const dataset = await loadCanonicalDataset();
const photo = {
  photoEvidenceId: 'PE-001',
  sourcePhoto: { photoRef: 'PH-001', fingerprintSha256: 'a'.repeat(64) },
  visibleStructures: ['hoja'],
};
const photoMap = new Map([['PE-001', photo]]);

test('validates PhotoEvidence identity and source photo', () => {
  assert.equal(validatePhotoEvidence(photo).valid, true);
});

test('rejects orphan CharacterObservation', () => {
  const result = validateCharacterObservation(dataset, {
    photoEvidenceRef: 'PE-MISSING',
    characterId: 'CH-003',
    status: 'observed',
    observedState: 'entero',
    observer: { type: 'human', tool: 'APC' },
    acquisition: { mode: 'manual' },
  }, photoMap);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /Unknown photoEvidenceRef/);
});

test('unconfirmed prefill is not valid evidence', () => {
  const result = validateCharacterObservation(dataset, {
    photoEvidenceRef: 'PE-001',
    characterId: 'CH-003',
    status: 'observed',
    observedState: 'entero',
    observer: { type: 'human', tool: 'APC' },
    acquisition: { mode: 'prefilled', confirmedOnCurrentPhoto: false },
  }, photoMap);
  assert.equal(result.valid, false);
});

for (const sample of [
  { status: 'observed', observedState: 'entero', reason: null, expected: ['entero'] },
  { status: 'not_observable', observedState: null, reason: 'margin outside frame', expected: [] },
  { status: 'uncertain', observedState: null, reason: 'ambiguous margin', expected: [] },
]) {
  test(`${sample.status} survives ObserverResult -> CharacterObservation -> ACE`, () => {
    const observation = observerResultToCharacterObservation(dataset, {
      characterId: 'CH-003',
      status: sample.status,
      observedState: sample.observedState,
      confidence: 0.42,
      notes: sample.reason,
    }, {
      photoEvidenceRef: 'PE-001',
      observer: { type: 'machine', tool: 'character-observer', model: 'test-model' },
      acquisition: { mode: 'automatic' },
      provenance: { origin: 'H16-C1.3-R1' },
      evidence: [{ evidenceRef: 'EV-001', regionOfInterest: { x: 1, y: 2, width: 3, height: 4 } }],
    }, photoMap);

    const ace = characterObservationToAceEvidence(dataset, observation, photoMap);
    assert.equal(ace.observationStatus, sample.status);
    assert.deepEqual(ace.observedStates, sample.expected);
    assert.equal(ace.confidence, 0.42);
    assert.deepEqual(ace.provenance, { origin: 'H16-C1.3-R1' });
    assert.equal(ace.evidenceRef, 'EV-001');
    assert.deepEqual(ace.regionOfInterest, { x: 1, y: 2, width: 3, height: 4 });
  });
}
