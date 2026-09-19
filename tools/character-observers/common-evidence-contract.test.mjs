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


test('requires PhotoEvidence fingerprint for stable asset identity', () => {
  const result = validatePhotoEvidence({
    photoEvidenceId: 'PE-002',
    sourcePhoto: { photoRef: 'PH-002' },
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /fingerprintSha256 is required/);
});

test('referential validation cannot be bypassed by omitting photoEvidenceById', () => {
  const result = validateCharacterObservation(dataset, {
    photoEvidenceRef: 'PE-001',
    characterId: 'CH-003',
    status: 'observed',
    observedState: 'entero',
    observer: { type: 'human', tool: 'APC' },
    acquisition: { mode: 'manual' },
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /photoEvidenceById Map is required/);
});

test('confirmed prefill requires traceable prior-observation basis', () => {
  const base = {
    photoEvidenceRef: 'PE-001',
    characterId: 'CH-003',
    status: 'observed',
    observedState: 'entero',
    observer: { type: 'human', tool: 'APC' },
  };
  const missing = validateCharacterObservation(dataset, {
    ...base,
    acquisition: { mode: 'prefilled', confirmedOnCurrentPhoto: true },
  }, photoMap);
  assert.equal(missing.valid, false);
  assert.match(missing.errors.join(' '), /requires acquisition.basis/);

  const traced = validateCharacterObservation(dataset, {
    ...base,
    acquisition: {
      mode: 'prefilled',
      confirmedOnCurrentPhoto: true,
      basis: { type: 'prior_observations', refs: ['CO-0001'] },
    },
  }, photoMap);
  assert.equal(traced.valid, true);
});

test('multiple evidence items survive ACE handoff without silent first-item projection', () => {
  const observation = {
    photoEvidenceRef: 'PE-001',
    characterId: 'CH-003',
    status: 'observed',
    observedState: 'serrado',
    observer: { type: 'machine', tool: 'character-observer', model: 'test-model' },
    acquisition: { mode: 'automatic' },
    provenance: { origin: 'H16-C1.3-R2' },
    evidence: [
      { evidenceRef: 'EV-A', regionOfInterest: { x: 1, y: 1, width: 2, height: 2 } },
      { evidenceRef: 'EV-B', regionOfInterest: { x: 5, y: 5, width: 3, height: 3 } },
    ],
  };
  const ace = characterObservationToAceEvidence(dataset, observation, photoMap);
  assert.equal(ace.evidence.length, 2);
  assert.deepEqual(ace.evidence.map(item => item.evidenceRef), ['EV-A', 'EV-B']);
  assert.equal(ace.evidenceRef, null);
  assert.equal(ace.regionOfInterest, null);
  assert.deepEqual(ace.provenance, { origin: 'H16-C1.3-R2' });
});
