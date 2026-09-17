import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalDataset } from '../canonical-identification/dataset.mjs';
import { observerResultToEvidence, validateObserverResult } from './contract.mjs';

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
  assert.equal(result.normalized.observedState, 'entero');
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

test('accepts explicit abstention without a botanical state', () => {
  const result = validateObserverResult(dataset, {
    characterId: 'CH-003',
    status: 'not_observable',
    confidence: 0.2,
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalized.observedState, null);
});

test('uncertainty maps to non-eliminating evidence', () => {
  const evidence = observerResultToEvidence(dataset, {
    characterId: 'CH-003',
    status: 'uncertain',
    confidence: 0.45,
  });

  assert.deepEqual(evidence.observedStates, ['not_observable']);
});

test('observed result maps to canonical engine evidence', () => {
  const evidence = observerResultToEvidence(dataset, {
    characterId: 'CH-001',
    status: 'observed',
    observedState: 'simple',
    source: 'visual_observer',
  });

  assert.equal(evidence.characterId, 'CH-001');
  assert.deepEqual(evidence.observedStates, ['simple']);
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
