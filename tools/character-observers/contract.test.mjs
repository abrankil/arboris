import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalDataset } from '../canonical-identification/dataset.mjs';
import {
  observerResultToEvidence,
  validateObserverResult,
} from './contract.mjs';

const dataset = await loadCanonicalDataset();

test('accepts an allowed observed state', () => {
  const result = validateObserverResult(dataset, {
    characterId: 'CH-003',
    status: 'observed',
    observedState: 'entero',
    confidence: 0.91,
    model: 'test-observer',
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalized.status, 'observed');
  assert.equal(result.normalized.observedState, 'entero');
  assert.equal(result.normalized.confidence, 0.91);
  assert.equal(result.normalized.model, 'test-observer');
});

test('rejects a state outside the canonical allowed states', () => {
  const result = validateObserverResult(dataset, {
    characterId: 'CH-003',
    status: 'observed',
    observedState: 'lobulado',
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /not allowed/);
});

test('accepts explicit not_observable abstention without a botanical state', () => {
  const result = validateObserverResult(dataset, {
    characterId: 'CH-003',
    status: 'not_observable',
    confidence: 0.2,
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalized.status, 'not_observable');
  assert.equal(result.normalized.observedState, null);
});

test('accepts explicit uncertain abstention without a botanical state', () => {
  const result = validateObserverResult(dataset, {
    characterId: 'CH-003',
    status: 'uncertain',
    confidence: 0.45,
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalized.status, 'uncertain');
  assert.equal(result.normalized.observedState, null);
});

test('rejects a botanical state when status is not_observable', () => {
  const result = validateObserverResult(dataset, {
    characterId: 'CH-003',
    status: 'not_observable',
    observedState: 'entero',
  });

  assert.equal(result.valid, false);
  assert.match(
    result.errors.join(' '),
    /observedState must be empty when status=not_observable/,
  );
});

test('rejects a botanical state when status is uncertain', () => {
  const result = validateObserverResult(dataset, {
    characterId: 'CH-003',
    status: 'uncertain',
    observedState: 'serrado',
  });

  assert.equal(result.valid, false);
  assert.match(
    result.errors.join(' '),
    /observedState must be empty when status=uncertain/,
  );
});

test('uncertainty remains distinct and non-eliminating', () => {
  const evidence = observerResultToEvidence(dataset, {
    characterId: 'CH-003',
    status: 'uncertain',
    confidence: 0.45,
    model: 'test-observer',
    notes: 'ambiguous margin',
  });

  assert.equal(evidence.characterId, 'CH-003');
  assert.equal(evidence.observationStatus, 'uncertain');
  assert.deepEqual(evidence.observedStates, []);
  assert.equal(evidence.confidence, 0.45);
  assert.equal(evidence.model, 'test-observer');
  assert.equal(evidence.notes, 'ambiguous margin');
});

test('not observable remains distinct and non-eliminating', () => {
  const evidence = observerResultToEvidence(dataset, {
    characterId: 'CH-003',
    status: 'not_observable',
    confidence: 0.2,
    model: 'test-observer',
    notes: 'margin outside frame',
  });

  assert.equal(evidence.characterId, 'CH-003');
  assert.equal(evidence.observationStatus, 'not_observable');
  assert.deepEqual(evidence.observedStates, []);
  assert.equal(evidence.confidence, 0.2);
  assert.equal(evidence.model, 'test-observer');
  assert.equal(evidence.notes, 'margin outside frame');
});

test('observed result maps to canonical engine evidence', () => {
  const evidence = observerResultToEvidence(dataset, {
    characterId: 'CH-001',
    status: 'observed',
    observedState: 'simple',
    source: 'visual_observer',
    confidence: 0.9,
    model: 'test-observer',
  });

  assert.equal(evidence.characterId, 'CH-001');
  assert.equal(evidence.observationStatus, 'observed');
  assert.deepEqual(evidence.observedStates, ['simple']);
  assert.equal(evidence.source, 'visual_observer');
  assert.equal(evidence.confidence, 0.9);
  assert.equal(evidence.model, 'test-observer');
});

test('rejects unknown or inactive character ids', () => {
  const result = validateObserverResult(dataset, {
    characterId: 'CH-007',
    status: 'observed',
    observedState: 'presente',
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /Unknown characterId/);
});