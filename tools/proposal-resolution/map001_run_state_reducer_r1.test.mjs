import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { logicalSha256 } from './map001_validation_adapter_r1.mjs';
import {
  findingSetFingerprint,
  reduceMap001RunState,
} from './map001_run_state_reducer_r1.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CONTRACT_VALIDATOR = path.join(ROOT, 'tools/proposal-resolution/validate_e4_reducer_contracts.py');

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);

const BASELINE = {
  authorityId: 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001',
  authorityPath: 'data/baselines/map001-walkable-envelope-authority-001.json',
  authorityManifestSha256: SHA_A,
  sourceCandidate: {
    id: 'MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001',
    path: 'data/maps/map-001-walkable-envelope-candidate-001.json',
    sha256: SHA_B,
  },
};

const VALIDATOR_BINDING = {
  validatorId: 'MAP001.NAV.AUTHORITY.RUNTIME.001',
  scope: 'MAP001_LOCAL_NAVIGATION',
  implementationPath: 'tools/map-navigation/materialize_walkable_envelope_001.mjs',
  implementationSha256: SHA_C,
};

const RESOLVER_BINDING = {
  resolverId: 'MAP001.RESOLVER.R1',
  implementationPath: 'tools/proposal-resolution/map001_run_state_reducer_r1.mjs',
  implementationSha256: SHA_C,
};

const CONTRACT_SET = {
  proposal: {
    schemaId: 'arboris:proposal-resolution:map001:proposal:r2',
    path: 'tools/proposal-resolution/schemas/proposal.schema.json',
    sha256: SHA_C,
  },
  repair: {
    schemaId: 'arboris:proposal-resolution:map001:repair:r1',
    path: 'tools/proposal-resolution/schemas/repair.schema.json',
    sha256: SHA_C,
  },
  validationReport: {
    schemaId: 'arboris:proposal-resolution:map001:validation-report:r1',
    path: 'tools/proposal-resolution/schemas/validation-report.schema.json',
    sha256: SHA_C,
  },
  runState: {
    schemaId: 'arboris:proposal-resolution:map001:run-state:r5',
    path: 'tools/proposal-resolution/schemas/run-state.schema.json',
    sha256: SHA_C,
  },
  semanticContract: {
    schemaId: 'MAP001-CROSS-CONTRACT-SEMANTICS-003',
    path: 'tools/proposal-resolution/contracts/cross-contract.semantic.json',
    sha256: SHA_C,
  },
};

function reportIteration(reportId) {
  return Number(reportId.slice(-4));
}

function report(reportId, status, findings = []) {
  const iterationNumber = reportIteration(reportId);
  return {
    schemaVersion: '0.1',
    reportId,
    reportType: 'MAP001_LOCAL_NAVIGATION_VALIDATION',
    control: {
      owner: 'RESOLVER',
      runId: 'MAP001-RUN-0001',
      proposalBinding: {
        proposalId: `MAP001-PROP-${String(iterationNumber).padStart(4, '0')}`,
        sha256: SHA_A,
        iteration: iterationNumber,
      },
      authorityBinding: {
        authorityId: BASELINE.authorityId,
        authorityManifestSha256: BASELINE.authorityManifestSha256,
        sourceCandidate: {
          id: BASELINE.sourceCandidate.id,
          sha256: BASELINE.sourceCandidate.sha256,
        },
      },
      validatorBinding: structuredClone(VALIDATOR_BINDING),
    },
    status,
    findings,
  };
}

function autoFinding(id, code, targetPath = '/derivedRaster/walkableCellCount') {
  return {
    findingId: id,
    disposition: 'AUTO_REPAIR',
    code,
    message: code,
    sourceRefs: [BASELINE.authorityPath],
    targetPaths: [targetPath],
    repairDirective: { minimalChangeRequired: true },
  };
}

function openFinding(id, code, targetPath = '/semantics/worldBearing') {
  return {
    findingId: id,
    disposition: 'OPEN_BLOCKER',
    code,
    message: code,
    sourceRefs: [BASELINE.authorityPath],
    targetPaths: [targetPath],
    requiredAction: 'HUMAN_DECISION_OR_NEW_EVIDENCE',
  };
}

function authorityFinding(id, code, targetPath = '/authority/authorityId') {
  return {
    findingId: id,
    disposition: 'AUTHORITY_BLOCKER',
    code,
    message: code,
    sourceRefs: [BASELINE.authorityPath],
    targetPaths: [targetPath],
    requiredAction: 'AUTHORITY_REVIEW',
  };
}

function binding(r) {
  return {
    reportId: r.reportId,
    sha256: logicalSha256(r),
    status: r.status,
  };
}

function iteration(number, proposalSha, validationReport = null, repairBinding = null) {
  return {
    iteration: number,
    proposal: {
      proposalId: `MAP001-PROP-${String(number).padStart(4, '0')}`,
      sha256: proposalSha,
    },
    validationReport: validationReport ? binding(validationReport) : null,
    repair: repairBinding,
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
      baseline: structuredClone(BASELINE),
      validatorBinding: structuredClone(VALIDATOR_BINDING),
      resolverBinding: {
        ...structuredClone(RESOLVER_BINDING),
        dependencies: [
          {
            dependencyId: 'VALIDATION_ADAPTER',
            path: 'tools/proposal-resolution/map001_validation_adapter_r1.mjs',
            sha256: SHA_C,
          },
          {
            dependencyId: 'RUN_STATE_REDUCER',
            path: 'tools/proposal-resolution/map001_run_state_reducer_r1.mjs',
            sha256: SHA_C,
          },
          {
            dependencyId: 'ITERATION_CONTRACT_GATE',
            path: 'tools/proposal-resolution/validate_e4_3_iteration_contracts.py',
            sha256: SHA_C,
          },
          {
            dependencyId: 'E3_CONTRACT_GATE',
            path: 'tools/proposal-resolution/validate_e3_contracts.py',
            sha256: SHA_C,
          },
        ],
      },
      contractSet: structuredClone(CONTRACT_SET),
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

function assertContractValid(run, reports, resultingState = null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e4-reducer-contract-'));
  try {
    const runPath = path.join(dir, 'run.json');
    const checkedRun = structuredClone(run);
    if (resultingState) checkedRun.state = structuredClone(resultingState);
    fs.writeFileSync(runPath, JSON.stringify(checkedRun, null, 2));

    const args = [CONTRACT_VALIDATOR, '--run', runPath];
    for (const r of reports) {
      const reportPath = path.join(dir, `${r.reportId}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(r, null, 2));
      args.push('--report', reportPath);
    }

    const result = spawnSync('python', args, { cwd: ROOT, encoding: 'utf8' });
    assert.equal(
      result.status,
      0,
      `E4.2 contract validation failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('no report -> READY_TO_VALIDATE', () => {
  const run = makeRun({
    iterations: [iteration(1, SHA_A)],
    candidateHashes: [SHA_A],
  });
  const state = reduceMap001RunState({ run });
  assert.deepEqual(state, { status: 'READY_TO_VALIDATE', currentIteration: 1 });
  assertContractValid(run, [], state);
});

test('AUTHORITY_BLOCKER -> AUTHORITY_BLOCKED', () => {
  const r = report('MAP001-VAL-0001', 'AUTHORITY_BLOCKER', [
    authorityFinding('FND-001', 'MAP001.AUTHORITY_BLOCKER.AUTHORITY_ID'),
  ]);
  const run = makeRun({
    iterations: [iteration(1, SHA_A, r)],
    candidateHashes: [SHA_A],
  });
  const state = reduceMap001RunState({ run, validationReportsById: reportsMap(r) });
  assert.deepEqual(state, { status: 'AUTHORITY_BLOCKED', currentIteration: 1 });
  assertContractValid(run, [r], state);
});

test('OPEN_BLOCKER -> OPEN_BLOCKED', () => {
  const r = report('MAP001-VAL-0001', 'OPEN_BLOCKER', [
    openFinding('FND-001', 'MAP001.OPEN_BLOCKER.WORLD_BEARING'),
  ]);
  const run = makeRun({
    iterations: [iteration(1, SHA_A, r)],
    candidateHashes: [SHA_A],
  });
  const state = reduceMap001RunState({ run, validationReportsById: reportsMap(r) });
  assert.deepEqual(state, { status: 'OPEN_BLOCKED', currentIteration: 1 });
  assertContractValid(run, [r], state);
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
  assertContractValid(run, [r], state);
});

test('REJECT_FIXABLE without terminal diagnostics -> READY_TO_REPAIR', () => {
  const r = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    autoFinding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const run = makeRun({
    iterations: [iteration(1, SHA_A, r)],
    candidateHashes: [SHA_A],
  });
  const state = reduceMap001RunState({ run, validationReportsById: reportsMap(r) });
  assert.deepEqual(state, { status: 'READY_TO_REPAIR', currentIteration: 1 });
  assertContractValid(run, [r], state);
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
  assertContractValid(run, [], state);
});

test('AUTHORITY_CHANGED precedes cycle detection', () => {
  const r1 = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    autoFinding('FND-001', 'MAP001.AUTO_REPAIR.A'),
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
  assertContractValid(run, [r1], state);
});

test('A -> B -> A yields CYCLE_DETECTED with earliest firstSeenIteration', () => {
  const r1 = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    autoFinding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const r2 = report('MAP001-VAL-0002', 'REJECT_FIXABLE', [
    autoFinding('FND-002', 'MAP001.AUTO_REPAIR.B'),
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
  assertContractValid(run, [r1, r2], state);
});

test('new finding after repair -> REGRESSION', () => {
  const basis = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    autoFinding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const current = report('MAP001-VAL-0002', 'REJECT_FIXABLE', [
    autoFinding('FND-002', 'MAP001.AUTO_REPAIR.A'),
    autoFinding('FND-003', 'MAP001.AUTO_REPAIR.NEW', '/derivedRaster/endpoints'),
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
  assertContractValid(run, [basis, current], state);
});

test('same REJECT_FIXABLE fingerprint repeated threshold times -> STALLED with exact maximal count', () => {
  const r1 = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    autoFinding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const r2 = report('MAP001-VAL-0002', 'REJECT_FIXABLE', [
    autoFinding('FND-002', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const r3 = report('MAP001-VAL-0003', 'REJECT_FIXABLE', [
    autoFinding('FND-003', 'MAP001.AUTO_REPAIR.A'),
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
  assertContractValid(run, [r1, r2, r3], state);
});

test('max iteration after non-regressing non-stalled rejection -> MAX_ITERATIONS', () => {
  const r1 = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    autoFinding('FND-001', 'MAP001.AUTO_REPAIR.A'),
  ]);
  const r2 = report('MAP001-VAL-0002', 'REJECT_FIXABLE', [
    autoFinding('FND-002', 'MAP001.AUTO_REPAIR.A'),
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
  assertContractValid(run, [r1, r2], state);
});

test('durable repair without child proposal -> SYSTEM_ERROR', () => {
  const r = report('MAP001-VAL-0001', 'REJECT_FIXABLE', [
    autoFinding('FND-001', 'MAP001.AUTO_REPAIR.A'),
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
  assertContractValid(run, [r], state);
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
  assertContractValid(run, [r], state);
});
