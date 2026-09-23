import test from 'node:test';
import assert from 'node:assert/strict';

import { logicalSha256 } from './map001_validation_adapter_r1.mjs';
import {
  findingSetFingerprint,
  reduceMap001RunState,
} from './map001_run_state_reducer_r1.mjs';

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);

function report(reportId, status, findings = []) {
  return {
    schemaVersion: '0.1',
    reportId,
    reportType: 'MAP001_LOCAL_NAVIGATION_VALIDATION',
    status,
    findings,
  };
}

function finding(id, code, targetPath = '/derivedRaster/walkableCellCount') {
  return {
    findingId: id,
    disposition: 'AUTO_REPAIR',
    code,
    message: code,
    sourceRefs: ['data/baselines/map001-walkable-envelope-authority-001.json'],
    targetPaths: [targetPath],
    repairDirective: { minimalChangeRequired: true },
  };
}

function binding(r) {
  return {
    reportId: r.reportId,
    sha256: logicalSha256(r),
    status: r.status,
  };
}

function iteration(number, proposalSha, validationReport = null, repair = null) {
  return {
    iteration: number,
    proposal: {
      proposalId: `MAP001-PROP-${String(number).padStart(4, '0')}`,
      sha256: proposalSha,
    },
    validationReport: validationReport ? binding(validationReport) : null,
    repair,
  };
}

function repair(number) {
  return {
    repairId: `MAP001-REPAIR-${String(number).padStart(4, '0')}`,
    sha256: SHA_C,
  };
}

function makeRun({
  iterations,
  candidateHashes,
  maxIterations = 8,
  stallRepeatThreshold = 3,
}) {
  return {
    schemaVersion: '0.4',
    runId: 'MAP001-RUN-0001',
    runType: 'MAP001_LOCAL_NAVIGATION_PROPOSAL_RESOLUTION',
    control: {
      owner: 'RESOLVER',
      scope: 'MAP001_LOCAL_NAVIGATION',
      policy: {
        maxIterations,
        stallRepeatThreshold,
        repeatCandidateHashAction: 'CYCLE_DETECTED',
        regressionAction: 'REGRESSION',
        artifactWritePolicy: {
          allowedRoots: ['build/proposal-resolution'],
          createCollisionPolicy: 'FAIL_IF_EXISTS',
        },
      },
    },
    state: {
      status: 'READY_TO_VALIDATE',
      currentIteration: iterations.at(-1).iteration,
    },
    iterations,
    candidateHistory: candidateHashes.map((candidateSha256, index) => ({
      iteration: index + 1,
      candidateSha256,
    })),
  };
}

function reportsMap(...reports) {
  return Object.fromEntries(reports.map((r) => [r.reportId, r]));
}

test('no report -> READY_TO_VALIDATE', () => {
  const run = makeRun({
    iterations: [iteration(1, SHA_A)],
    candidateHashes: [SHA_A],
  });
  assert.deepEqual(reduceMap001RunState({ run }), {
    status: 'READY_TO_VALIDATE',
    currentIteration: 1,
  });
});

test('AUTHORITY_BLOCKER -> AUTHORITY_BLOCKED', () => {
  const r = report('MAP001-VAL-0001', 'AUTHORITY_BLOCKER', []);
  const run = makeRun({
    iterations: [iteration(1, SHA_A, r)],
    candidateHashes: [SHA_A],
  });
  assert.deepEqual(reduceMap001RunState({ run, validationReportsById: reportsMap(r) }), {
    status: 'AUTHORITY_BLOCKED',
    currentIteration: 1,
  });
});

test('OPEN_BLOCKER -> OPEN_BLOCKED', () => {
  const r = report('MAP001-VAL-0001', 'OPEN_BLOCKER', []);
  const run = makeRun({
    iterations: [iteration(1, SHA_A, r)],
    candidateHashes: [SHA_A],
  });
  assert.deepEqual(reduceMap001RunState({ run, validationReportsById: reportsMap(r) }), {
    status: 'OPEN_BLOCKED',
    currentIteration: 1,
  });
});

test('PASS -> DOMAIN_PASS and never authorizes ASC', () => {
  const r = report('MAP001-VAL-0001', 'PASS', []);
  const run = makeRun({
    iterations: [iteration(1, SHA_A, r)],
    candidateHashes: [SHA_A],
  });
  const state = reduceMap001RunState({ run, validationReportsById: reportsMap(r) });
  assert.deepEqual(state, { status: 'DOMAIN_PASS', currentIteration: 1 });
  assert.equal(Object.hasOwn(state, 'authorizedForAsc'), false);
});

test('REJECT_FIXABLE without terminal diagnostics -> READY_TO_REPAIR', () => {
  const r = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    finding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const run = makeRun({
    iterations: [iteration(1, SHA_A, r)],
    candidateHashes: [SHA_A],
  });
  assert.deepEqual(reduceMap001RunState({ run, validationReportsById: reportsMap(r) }), {
    status: 'READY_TO_REPAIR',
    currentIteration: 1,
  });
});

test('external SYSTEM_ERROR has highest precedence', () => {
  const run = makeRun({
    iterations: [iteration(1, SHA_A)],
    candidateHashes: [SHA_A],
  });
  const state = reduceMap001RunState({
    run,
    integrity: {
      systemError: {
        code: 'TEST_SYSTEM_ERROR',
        message: 'test',
        component: 'RESOLVER_IMPLEMENTATION',
      },
      authorityChanged: {
        component: 'AUTHORITY_MANIFEST',
        expectedSha256: SHA_A,
        observedSha256: SHA_B,
      },
    },
  });
  assert.equal(state.status, 'SYSTEM_ERROR');
  assert.equal(state.evidence.code, 'TEST_SYSTEM_ERROR');
});

test('AUTHORITY_CHANGED precedes cycle detection', () => {
  const r1 = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    finding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const run = makeRun({
    iterations: [
      iteration(1, SHA_A, r1, repair(1)),
      iteration(2, SHA_B),
    ],
    candidateHashes: [SHA_A, SHA_A],
  });
  const state = reduceMap001RunState({
    run,
    validationReportsById: reportsMap(r1),
    integrity: {
      authorityChanged: {
        component: 'AUTHORITY_MANIFEST',
        expectedSha256: SHA_A,
        observedSha256: SHA_B,
      },
    },
  });
  assert.equal(state.status, 'AUTHORITY_CHANGED');
});

test('A -> B -> A yields CYCLE_DETECTED with earliest firstSeenIteration', () => {
  const r1 = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    finding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const r2 = report('MAP001-VAL-0002', 'REJECT_FIXABLE', [
    finding('FND-002', 'MAP001.AUTO_REPAIR.B'),
  ]);
  const run = makeRun({
    iterations: [
      iteration(1, SHA_A, r1, repair(1)),
      iteration(2, SHA_B, r2, repair(2)),
      iteration(3, SHA_C),
    ],
    candidateHashes: [SHA_A, SHA_B, SHA_A],
  });
  const state = reduceMap001RunState({
    run,
    validationReportsById: reportsMap(r1, r2),
  });
  assert.deepEqual(state, {
    status: 'CYCLE_DETECTED',
    currentIteration: 3,
    evidence: {
      kind: 'CYCLE_DETECTED',
      repeatedCandidateSha256: SHA_A,
      firstSeenIteration: 1,
    },
  });
});

test('new finding after repair -> REGRESSION', () => {
  const basis = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    finding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const current = report('MAP001-VAL-0002', 'REJECT_FIXABLE', [
    finding('FND-002', 'MAP001.AUTO_REPAIR.A'),
    finding('FND-003', 'MAP001.AUTO_REPAIR.NEW', '/derivedRaster/endpoints'),
  ]);
  const run = makeRun({
    iterations: [
      iteration(1, SHA_A, basis, repair(1)),
      iteration(2, SHA_B, current),
    ],
    candidateHashes: [SHA_A, SHA_B],
  });
  const state = reduceMap001RunState({
    run,
    validationReportsById: reportsMap(basis, current),
  });
  assert.equal(state.status, 'REGRESSION');
  assert.equal(state.evidence.previousValidation.id, basis.reportId);
  assert.equal(state.evidence.currentValidation.id, current.reportId);
});

test('same REJECT_FIXABLE fingerprint repeated threshold times -> STALLED with exact maximal count', () => {
  const r1 = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    finding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const r2 = report('MAP001-VAL-0002', 'REJECT_FIXABLE', [
    finding('FND-002', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const r3 = report('MAP001-VAL-0003', 'REJECT_FIXABLE', [
    finding('FND-003', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const run = makeRun({
    iterations: [
      iteration(1, SHA_A, r1, repair(1)),
      iteration(2, SHA_B, r2, repair(2)),
      iteration(3, SHA_C, r3),
    ],
    candidateHashes: [SHA_A, SHA_B, SHA_C],
    stallRepeatThreshold: 3,
  });
  const state = reduceMap001RunState({
    run,
    validationReportsById: reportsMap(r1, r2, r3),
  });
  assert.equal(state.status, 'STALLED');
  assert.equal(state.evidence.repeatCount, 3);
  assert.equal(state.evidence.findingSetFingerprint, findingSetFingerprint(r3));
});

test('max iteration after non-regressing non-stalled rejection -> MAX_ITERATIONS', () => {
  const r1 = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    finding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const r2 = report('MAP001-VAL-0002', 'REJECT_FIXABLE', [
    finding('FND-002', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const run = makeRun({
    iterations: [
      iteration(1, SHA_A, r1, repair(1)),
      iteration(2, SHA_B, r2),
    ],
    candidateHashes: [SHA_A, SHA_B],
    maxIterations: 2,
    stallRepeatThreshold: 3,
  });
  const state = reduceMap001RunState({
    run,
    validationReportsById: reportsMap(r1, r2),
  });
  assert.deepEqual(state, {
    status: 'MAX_ITERATIONS',
    currentIteration: 2,
    evidence: {
      kind: 'MAX_ITERATIONS',
      limit: 2,
    },
  });
});

test('durable repair without child proposal -> SYSTEM_ERROR', () => {
  const r = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    finding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const run = makeRun({
    iterations: [iteration(1, SHA_A, r, repair(1))],
    candidateHashes: [SHA_A],
  });
  const state = reduceMap001RunState({
    run,
    validationReportsById: reportsMap(r),
  });
  assert.equal(state.status, 'SYSTEM_ERROR');
  assert.equal(state.evidence.code, 'REPAIR_CHILD_ATOMICITY_VIOLATION');
});

test('validation report binding hash mismatch -> SYSTEM_ERROR', () => {
  const r = report('MAP001-VAL-0001', 'PASS', []);
  const it = iteration(1, SHA_A, r);
  it.validationReport.sha256 = SHA_B;
  const run = makeRun({
    iterations: [it],
    candidateHashes: [SHA_A],
  });
  const state = reduceMap001RunState({
    run,
    validationReportsById: reportsMap(r),
  });
  assert.equal(state.status, 'SYSTEM_ERROR');
  assert.equal(state.evidence.code, 'VALIDATION_REPORT_HASH_MISMATCH');
});
