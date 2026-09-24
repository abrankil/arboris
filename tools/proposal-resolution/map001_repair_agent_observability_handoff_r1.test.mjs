import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1 as CODES,
  MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_LIMITS_R1 as LIMITS,
  buildMap001RepairAgentObservabilityHandoffR1,
} from './map001_repair_agent_observability_handoff_r1.mjs';

function validInput() {
  return {
    criticalWindowActive: false,
    authoritativeTransitionId: 'TR-001',
    eventClassId: 'REPAIR_AGENT.I1',
    existingReferenceIdsOrDigests: ['sha256:abc', 'MAP001-PROP-0001'],
    boundedOutcomeCode: 'READY_TO_OBSERVE',
    optionalFixedSizeCounters: [
      { counterId: 'findingCount', value: 2 },
    ],
  };
}

test('valid bounded input yields deterministic READY handoff', () => {
  const a = buildMap001RepairAgentObservabilityHandoffR1(validInput());
  const b = buildMap001RepairAgentObservabilityHandoffR1(validInput());

  assert.equal(a.status, 'READY');
  assert.deepEqual(a, b);
  assert.deepEqual(Object.keys(a.handoff), [
    'schemaVersion',
    'authoritativeTransitionId',
    'eventClassId',
    'existingReferenceIdsOrDigests',
    'boundedOutcomeCode',
    'optionalFixedSizeCounters',
  ]);
});

test('READY handoff is frozen at every materialized level', () => {
  const result = buildMap001RepairAgentObservabilityHandoffR1(validInput());

  assert.equal(result.status, 'READY');
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.handoff), true);
  assert.equal(Object.isFrozen(result.handoff.existingReferenceIdsOrDigests), true);
  assert.equal(Object.isFrozen(result.handoff.optionalFixedSizeCounters), true);
  assert.equal(Object.isFrozen(result.handoff.optionalFixedSizeCounters[0]), true);
});

test('later mutation of input cannot mutate READY handoff', () => {
  const input = validInput();
  const result = buildMap001RepairAgentObservabilityHandoffR1(input);

  input.existingReferenceIdsOrDigests[0] = 'changed';
  input.optionalFixedSizeCounters[0].value = 99;
  input.optionalFixedSizeCounters.push({ counterId: 'later', value: 1 });

  assert.equal(result.status, 'READY');
  assert.equal(result.handoff.existingReferenceIdsOrDigests[0], 'sha256:abc');
  assert.equal(result.handoff.optionalFixedSizeCounters[0].value, 2);
  assert.equal(result.handoff.optionalFixedSizeCounters.length, 1);
});

test('critical window always fail-drops before producing a handoff', () => {
  const input = validInput();
  input.criticalWindowActive = true;

  const result = buildMap001RepairAgentObservabilityHandoffR1(input);
  assert.deepEqual(result, {
    status: 'DROPPED',
    code: CODES.CRITICAL_WINDOW,
  });
});

test('too many references fail-drop on budget', () => {
  const input = validInput();
  input.existingReferenceIdsOrDigests = Array.from(
    { length: LIMITS.MAX_REFERENCES + 1 },
    (_, index) => 'REF-' + index
  );

  const result = buildMap001RepairAgentObservabilityHandoffR1(input);
  assert.equal(result.status, 'DROPPED');
  assert.equal(result.code, CODES.BUDGET_EXCEEDED);
});

test('too many counters fail-drop on budget', () => {
  const input = validInput();
  input.optionalFixedSizeCounters = Array.from(
    { length: LIMITS.MAX_COUNTERS + 1 },
    (_, index) => ({ counterId: 'C-' + index, value: index })
  );

  const result = buildMap001RepairAgentObservabilityHandoffR1(input);
  assert.equal(result.status, 'DROPPED');
  assert.equal(result.code, CODES.BUDGET_EXCEEDED);
});

test('oversized strings fail-drop', () => {
  for (const [field, size] of [
    ['authoritativeTransitionId', LIMITS.MAX_ID_CHARS + 1],
    ['eventClassId', LIMITS.MAX_ID_CHARS + 1],
    ['boundedOutcomeCode', LIMITS.MAX_OUTCOME_CHARS + 1],
  ]) {
    const input = validInput();
    input[field] = 'x'.repeat(size);

    const result = buildMap001RepairAgentObservabilityHandoffR1(input);
    assert.equal(result.status, 'DROPPED');
  }

  const referenceInput = validInput();
  referenceInput.existingReferenceIdsOrDigests = ['x'.repeat(LIMITS.MAX_REFERENCE_CHARS + 1)];
  assert.equal(
    buildMap001RepairAgentObservabilityHandoffR1(referenceInput).status,
    'DROPPED'
  );
});

test('invalid counters fail-drop without exception', () => {
  for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, '1', null]) {
    const input = validInput();
    input.optionalFixedSizeCounters = [{ counterId: 'bad', value }];

    const result = buildMap001RepairAgentObservabilityHandoffR1(input);
    assert.equal(result.status, 'DROPPED');
  }
});

test('nested or non-string references fail-drop', () => {
  for (const badReference of [{ nested: true }, ['nested'], 7, null]) {
    const input = validInput();
    input.existingReferenceIdsOrDigests = [badReference];

    const result = buildMap001RepairAgentObservabilityHandoffR1(input);
    assert.equal(result.status, 'DROPPED');
  }
});

test('throwing accessor cannot propagate to caller', () => {
  const input = validInput();
  Object.defineProperty(input, 'eventClassId', {
    enumerable: true,
    get() {
      throw new Error('hostile accessor');
    },
  });

  assert.doesNotThrow(() => buildMap001RepairAgentObservabilityHandoffR1(input));
  const result = buildMap001RepairAgentObservabilityHandoffR1(input);
  assert.deepEqual(result, {
    status: 'DROPPED',
    code: CODES.DROPPED,
  });
});

test('encoded-size budget catches multibyte payload even within char-count limits', () => {
  const input = validInput();
  input.authoritativeTransitionId = '界'.repeat(LIMITS.MAX_ID_CHARS);
  input.eventClassId = '界'.repeat(LIMITS.MAX_ID_CHARS);
  input.boundedOutcomeCode = '界'.repeat(LIMITS.MAX_OUTCOME_CHARS);
  input.existingReferenceIdsOrDigests = Array.from(
    { length: LIMITS.MAX_REFERENCES },
    (_, index) => '界'.repeat(LIMITS.MAX_REFERENCE_CHARS - String(index).length) + index
  );
  input.optionalFixedSizeCounters = Array.from(
    { length: LIMITS.MAX_COUNTERS },
    (_, index) => ({ counterId: '界'.repeat(LIMITS.MAX_COUNTER_ID_CHARS - 1) + index, value: index })
  );

  const result = buildMap001RepairAgentObservabilityHandoffR1(input);
  assert.equal(result.status, 'DROPPED');
  assert.equal(result.code, CODES.BUDGET_EXCEEDED);
});

test('arbitrary input fields are not copied into output', () => {
  const input = validInput();
  input.secret = 'must-not-leak';
  input.providerBody = { arbitrary: true };
  input.retry = true;

  const result = buildMap001RepairAgentObservabilityHandoffR1(input);
  assert.equal(result.status, 'READY');
  assert.equal(Object.hasOwn(result.handoff, 'secret'), false);
  assert.equal(Object.hasOwn(result.handoff, 'providerBody'), false);
  assert.equal(Object.hasOwn(result.handoff, 'retry'), false);
});

test('hostile oversized array remains fail-drop and non-throwing', () => {
  const input = validInput();
  input.existingReferenceIdsOrDigests = new Array(LIMITS.MAX_REFERENCES + 100_000).fill('x');

  assert.doesNotThrow(() => buildMap001RepairAgentObservabilityHandoffR1(input));
  const result = buildMap001RepairAgentObservabilityHandoffR1(input);
  assert.equal(result.status, 'DROPPED');
  assert.equal(result.code, CODES.BUDGET_EXCEEDED);
});
