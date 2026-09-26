import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  materializeWalkableEnvelopeAuthority,
  DEFAULT_AUTHORITY_PATH,
} from '../map-navigation/materialize_walkable_envelope_001.mjs';

import {
  buildMap001ValidationView,
  logicalSha256,
} from './map001_validation_adapter_r1.mjs';

import {
  executeMap001ValidationIteration,
} from './map001_single_iteration_orchestrator_r1.mjs';

import {
  buildMap001RepairTransactionCandidate,
} from './map001_repair_transaction_candidate_r1.mjs';

import {
  Map001DurableStoreCrash,
  Map001DurableStoreError,
  commitMap001RepairSnapshot,
  recoverMap001RepairStore,
} from './map001_durable_repair_store_r1.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

const VALIDATOR_PATH = 'tools/map-navigation/materialize_walkable_envelope_001.mjs';
const RESOLVER_PATH = 'tools/proposal-resolution/map001_single_iteration_orchestrator_r1.mjs';

const RESOLVER_DEPENDENCIES = [
  ['VALIDATION_ADAPTER', 'tools/proposal-resolution/map001_validation_adapter_r1.mjs'],
  ['RUN_STATE_REDUCER', 'tools/proposal-resolution/map001_run_state_reducer_r1.mjs'],
  ['ITERATION_CONTRACT_GATE', 'tools/proposal-resolution/validate_e4_3_iteration_contracts.py'],
  ['E3_CONTRACT_GATE', 'tools/proposal-resolution/validate_e3_contracts.py'],
];

const CONTRACT_PATHS = {
  proposal: ['arboris:proposal-resolution:map001:proposal:r2', 'tools/proposal-resolution/schemas/proposal.schema.json'],
  repair: ['arboris:proposal-resolution:map001:repair:r1', 'tools/proposal-resolution/schemas/repair.schema.json'],
  validationReport: ['arboris:proposal-resolution:map001:validation-report:r1', 'tools/proposal-resolution/schemas/validation-report.schema.json'],
  runState: ['arboris:proposal-resolution:map001:run-state:r5', 'tools/proposal-resolution/schemas/run-state.schema.json'],
  semanticContract: ['MAP001-CROSS-CONTRACT-SEMANTICS-003', 'tools/proposal-resolution/contracts/cross-contract.semantic.json'],
};

function rawSha256(relPath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relPath))).digest('hex');
}

const authorityManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, DEFAULT_AUTHORITY_PATH), 'utf8')
);

function validatorBinding() {
  return {
    validatorId: 'MAP001.NAV.AUTHORITY.RUNTIME.001',
    scope: 'MAP001_LOCAL_NAVIGATION',
    implementationPath: VALIDATOR_PATH,
    implementationSha256: rawSha256(VALIDATOR_PATH),
  };
}

function contractSet() {
  return Object.fromEntries(
    Object.entries(CONTRACT_PATHS).map(([key, [schemaId, relPath]]) => [
      key,
      { schemaId, path: relPath, sha256: rawSha256(relPath) },
    ])
  );
}

function createChanges(candidate) {
  return [
    ['schemaVersion', candidate.schemaVersion],
    ['viewType', candidate.viewType],
    ['authority', candidate.authority],
    ['semantics', candidate.semantics],
    ['derivedRaster', candidate.derivedRaster],
  ].map(([key, value], index) => ({
    changeId: 'CHG-' + String(index + 1).padStart(3, '0'),
    operation: 'add',
    targetPath: '/' + key,
    after: structuredClone(value),
    rationale: 'Fixture reconstructs candidate exactly.',
  }));
}

function makeProposal(candidate) {
  return {
    schemaVersion: '0.2',
    proposalId: 'MAP001-PROP-0001',
    proposalType: 'MAP001_LOCAL_NAVIGATION_DERIVED',
    control: {
      owner: 'RESOLVER',
      runId: 'MAP001-RUN-0001',
      iteration: 1,
      lineage: { parentProposal: null, originatingRepair: null },
      baseline: {
        authorityId: authorityManifest.authorityId,
        authorityPath: DEFAULT_AUTHORITY_PATH,
        authorityManifestSha256: rawSha256(DEFAULT_AUTHORITY_PATH),
        sourceCandidate: {
          id: authorityManifest.sourceCandidate.id,
          path: authorityManifest.sourceCandidate.path,
          sha256: rawSha256(authorityManifest.sourceCandidate.path),
        },
      },
      subject: {
        mode: 'CREATE_DERIVED',
        artifactRole: 'NON_AUTHORITATIVE_DERIVED',
        artifactId: 'MAP001-NAV-VALIDATION-VIEW-001',
        artifactPath: 'build/proposal-resolution/map001-nav-validation-view-001.json',
        baseSha256: null,
      },
    },
    intent: {
      objective: 'Restore MAP-001 derived navigation view.',
      changes: createChanges(candidate),
      candidate,
    },
  };
}

function makeRun(proposal) {
  return {
    schemaVersion: '0.5',
    runId: proposal.control.runId,
    runType: 'MAP001_LOCAL_NAVIGATION_PROPOSAL_RESOLUTION',
    control: {
      owner: 'RESOLVER',
      scope: 'MAP001_LOCAL_NAVIGATION',
      baseline: structuredClone(proposal.control.baseline),
      validatorBinding: validatorBinding(),
      resolverBinding: {
        resolverId: 'MAP001.SINGLE.ITERATION.ORCHESTRATOR.R1',
        implementationPath: RESOLVER_PATH,
        implementationSha256: rawSha256(RESOLVER_PATH),
        dependencies: RESOLVER_DEPENDENCIES.map(([dependencyId, relPath]) => ({
          dependencyId,
          path: relPath,
          sha256: rawSha256(relPath),
        })),
      },
      contractSet: contractSet(),
      policy: {
        maxIterations: 8,
        stallRepeatThreshold: 3,
        repeatCandidateHashAction: 'CYCLE_DETECTED',
        regressionAction: 'REGRESSION',
        artifactWritePolicy: {
          allowedRoots: ['build/proposal-resolution'],
          createCollisionPolicy: 'FAIL_IF_EXISTS',
        },
      },
    },
    state: { status: 'READY_TO_VALIDATE', currentIteration: 1 },
    iterations: [{
      iteration: 1,
      proposal: {
        proposalId: proposal.proposalId,
        sha256: logicalSha256(proposal),
      },
      validationReport: null,
      repair: null,
    }],
    candidateHistory: [{
      iteration: 1,
      candidateSha256: logicalSha256(proposal.intent.candidate),
    }],
  };
}

function makeRepair(parent, report) {
  return {
    schemaVersion: '0.1',
    repairId: 'MAP001-REPAIR-0001',
    repairType: 'MAP001_LOCAL_NAVIGATION_AUTO_REPAIR',
    control: {
      owner: 'RESOLVER',
      runId: parent.control.runId,
      parentProposal: {
        proposalId: parent.proposalId,
        sha256: logicalSha256(parent),
        iteration: parent.control.iteration,
      },
      validationBasis: {
        reportId: report.reportId,
        sha256: logicalSha256(report),
        status: 'REJECT_FIXABLE',
      },
      patchPolicy: {
        pathScope: 'PARENT_PROPOSAL_INTENT_CANDIDATE',
        authorityMode: 'CONFORM_TO_EXISTING_AUTHORITY',
        mutationClass: 'AUTO_REPAIR_ONLY',
      },
    },
    patch: {
      operations: [{
        editId: 'EDIT-001',
        operation: 'replace',
        targetPath: '/derivedRaster/walkableCellCount',
        findingRefs: [report.findings[0].findingId],
        expectedBefore: report.findings[0].observed,
        after: report.findings[0].expected,
        rationale: 'Restore exact derived value required by AUTO_REPAIR finding.',
      }],
    },
  };
}

async function fixture() {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.derivedRaster.walkableCellCount += 1;

  const parentProposal = makeProposal(candidate);
  const initialRun = makeRun(parentProposal);
  const validated = await executeMap001ValidationIteration({
    run: initialRun,
    proposal: parentProposal,
    reportId: 'MAP001-VAL-0001',
    root: ROOT,
  });
  const validationReportsById = {
    [validated.validationReport.reportId]: validated.validationReport,
  };
  const repair = makeRepair(parentProposal, validated.validationReport);
  const transaction = buildMap001RepairTransactionCandidate({
    run: validated.run,
    parentProposal,
    validationReport: validated.validationReport,
    repair,
    childProposalId: 'MAP001-PROP-0002',
    root: ROOT,
    validationReportsById,
  });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e5-3-test-'));
  const runPath = path.join(dir, 'run.json');
  fs.writeFileSync(runPath, JSON.stringify(validated.run, null, 2) + '\n');

  return {
    dir,
    runPath,
    run: validated.run,
    proposed: transaction.proposedRunSnapshot,
    parentProposal,
    validationReport: validated.validationReport,
    repair,
    childProposalId: 'MAP001-PROP-0002',
    validationReportsById,
  };
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const linux = process.platform === 'linux';

test('E5.3 persists complete repair+child snapshot and restart sees identical logical hash', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    const result = commitMap001RepairSnapshot({
      runPath: f.runPath,
      expectedBeforeSha256: logicalSha256(f.run),
      parentProposal: f.parentProposal,
      validationReport: f.validationReport,
      repair: f.repair,
      childProposalId: f.childProposalId,
      validationReportsById: f.validationReportsById,
      root: ROOT,
      transactionId: 'TXN-0001',
    });
    assert.equal(result.transactionStatus, 'PERSISTED');
    assert.equal(result.outputState.status, 'READY_TO_VALIDATE');

    const visible = JSON.parse(fs.readFileSync(f.runPath, 'utf8'));
    assert.equal(logicalSha256(visible), logicalSha256(f.proposed));
    assert.equal(visible.iterations.at(-2).repair.repairId, 'MAP001-REPAIR-0001');
    assert.equal(visible.iterations.at(-1).validationReport, null);

    const restart = recoverMap001RepairStore({
      runPath: f.runPath,
      validationReportsById: f.validationReportsById,
      root: ROOT,
    });
    assert.equal(restart.recoveryStatus, 'NORMAL');
    assert.equal(restart.visibleSha256, logicalSha256(f.proposed));
  } finally {
    cleanup(f.dir);
  }
});

test('stale CAS is rejected before creating transaction metadata', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: '0'.repeat(64),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-CAS',
      }),
      (error) => error instanceof Map001DurableStoreError && error.code === 'CAS_MISMATCH'
    );
    assert.equal(fs.existsSync(f.runPath + '.lock'), false);
    assert.equal(fs.existsSync(f.runPath + '.txn.json'), false);
  } finally {
    cleanup(f.dir);
  }
});

test('C1 lock-only crash recovers deterministic BEFORE', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-C1',
        crashAt: 'C1',
      }),
      (error) => error instanceof Map001DurableStoreCrash && error.point === 'C1'
    );
    const recovered = recoverMap001RepairStore({
      runPath: f.runPath,
      validationReportsById: f.validationReportsById,
      root: ROOT,
    });
    assert.equal(recovered.recoveryStatus, 'RECOVERED_BEFORE');
    assert.equal(recovered.visibleSha256, logicalSha256(f.run));
    assert.equal(fs.existsSync(f.runPath + '.lock'), false);
  } finally {
    cleanup(f.dir);
  }
});

test('C2 prepared journal without next recovers deterministic BEFORE', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-C2',
        crashAt: 'C2',
      }),
      (error) => error instanceof Map001DurableStoreCrash && error.point === 'C2'
    );
    const recovered = recoverMap001RepairStore({
      runPath: f.runPath,
      validationReportsById: f.validationReportsById,
      root: ROOT,
    });
    assert.equal(recovered.recoveryStatus, 'RECOVERED_BEFORE');
    assert.equal(recovered.visibleSha256, logicalSha256(f.run));
  } finally {
    cleanup(f.dir);
  }
});

for (const point of ['C3', 'C4', 'C5', 'C6', 'C7', 'C8']) {
  test(point + ' crash recovers complete AFTER without hybrid state', { skip: !linux }, async () => {
    const f = await fixture();
    try {
      assert.throws(
        () => commitMap001RepairSnapshot({
          runPath: f.runPath,
          expectedBeforeSha256: logicalSha256(f.run),
          parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
          validationReportsById: f.validationReportsById,
          root: ROOT,
          transactionId: 'TXN-' + point,
          crashAt: point,
        }),
        (error) => error instanceof Map001DurableStoreCrash && error.point === point
      );
      const recovered = recoverMap001RepairStore({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      });
      assert.equal(recovered.recoveryStatus, 'RECOVERED_AFTER');
      const visible = JSON.parse(fs.readFileSync(f.runPath, 'utf8'));
      assert.equal(logicalSha256(visible), logicalSha256(f.proposed));
      assert.notEqual(visible.iterations.at(-2).repair, null);
      assert.equal(visible.iterations.at(-1).validationReport, null);
    } finally {
      cleanup(f.dir);
    }
  });
}

test('second writer is rejected while crash lock exists', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-LOCK-1',
        crashAt: 'C1',
      }),
      Map001DurableStoreCrash
    );

    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-LOCK-2',
      }),
      (error) => error instanceof Map001DurableStoreError && error.code === 'CONCURRENT_WRITER'
    );
  } finally {
    cleanup(f.dir);
  }
});

test('corrupt next snapshot fails closed and preserves recovery evidence', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-CORRUPT',
        crashAt: 'C3',
      }),
      Map001DurableStoreCrash
    );
    const corruptNextPath = f.runPath + '.next.json';
    const corruptNext = JSON.parse(fs.readFileSync(corruptNextPath, 'utf8'));
    corruptNext.candidateHistory.at(-1).candidateSha256 = '0'.repeat(64);
    fs.writeFileSync(corruptNextPath, JSON.stringify(corruptNext, null, 2) + '\n');

    assert.throws(
      () => recoverMap001RepairStore({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'RECOVERY_NEXT_HASH_MISMATCH'
    );
    assert.equal(fs.existsSync(f.runPath + '.lock'), true);
    assert.equal(fs.existsSync(f.runPath + '.txn.json'), true);
    assert.equal(fs.existsSync(f.runPath + '.next.json'), true);
  } finally {
    cleanup(f.dir);
  }
});

test('orphan journal without lock fails closed', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    fs.writeFileSync(f.runPath + '.txn.json', '{}\n');
    assert.throws(
      () => recoverMap001RepairStore({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'RECOVERY_ORPHAN_METADATA'
    );
  } finally {
    cleanup(f.dir);
  }
});


test('fresh E5.2 reconstruction rejects forged/unauthorized repair before durable metadata', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    const forged = structuredClone(f.repair);
    forged.patch.operations[0].targetPath = '/authority/id';

    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: forged,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-FORGED',
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'E5_2_REVALIDATION_FAILED'
    );
    assert.equal(fs.existsSync(f.runPath + '.lock'), false);
    assert.equal(fs.existsSync(f.runPath + '.txn.json'), false);
  } finally {
    cleanup(f.dir);
  }
});

test('operational dependency path substitution fails closed even with recomputed hash', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-PATH',
        crashAt: 'C1',
      }),
      Map001DurableStoreCrash
    );

    const lockPath = f.runPath + '.lock';
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    lock.operationalDependencies[0].path =
      'tools/proposal-resolution/map001_repair_transaction_candidate_r1.mjs';
    lock.operationalDependencies[0].sha256 = rawSha256(
      'tools/proposal-resolution/map001_repair_transaction_candidate_r1.mjs'
    );
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');

    assert.throws(
      () => recoverMap001RepairStore({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'OPERATIONAL_DEPENDENCY_SET_MISMATCH'
    );
  } finally {
    cleanup(f.dir);
  }
});

test('E5.3 self provenance drift binding fails closed during recovery', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-SELF',
        crashAt: 'C1',
      }),
      Map001DurableStoreCrash
    );

    const lockPath = f.runPath + '.lock';
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const self = lock.operationalDependencies.find(
      (item) => item.dependencyId === 'E5_3_DURABLE_STORE'
    );
    assert.ok(self);
    self.sha256 = '0'.repeat(64);
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');

    assert.throws(
      () => recoverMap001RepairStore({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'OPERATIONAL_DEPENDENCY_DRIFT'
    );
  } finally {
    cleanup(f.dir);
  }
});


test('RUN_SCHEMA_GATE is pinned as an exact operational dependency', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-SCHEMA-GATE',
        crashAt: 'C1',
      }),
      Map001DurableStoreCrash
    );

    const lockPath = f.runPath + '.lock';
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const gate = lock.operationalDependencies.find(
      (item) => item.dependencyId === 'RUN_SCHEMA_GATE'
    );
    assert.ok(gate);
    assert.equal(
      gate.path,
      'tools/proposal-resolution/validate_e4_reducer_contracts.py'
    );

    gate.sha256 = '0'.repeat(64);
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');

    assert.throws(
      () => recoverMap001RepairStore({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'OPERATIONAL_DEPENDENCY_DRIFT'
    );
  } finally {
    cleanup(f.dir);
  }
});

test('recovery rejects lock runId that does not match visible run', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-RUNID-LOCK',
        crashAt: 'C1',
      }),
      Map001DurableStoreCrash
    );

    const lockPath = f.runPath + '.lock';
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    lock.runId = 'MAP001-RUN-9999';
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');

    assert.throws(
      () => recoverMap001RepairStore({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'RECOVERY_RUN_ID_MISMATCH'
    );
  } finally {
    cleanup(f.dir);
  }
});

test('recovery rejects journal runId that does not match visible run', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-RUNID-JOURNAL',
        crashAt: 'C2',
      }),
      Map001DurableStoreCrash
    );

    const journalPath = f.runPath + '.txn.json';
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    journal.runId = 'MAP001-RUN-9999';
    fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2) + '\n');

    assert.throws(
      () => recoverMap001RepairStore({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'RECOVERY_RUN_ID_MISMATCH'
    );
  } finally {
    cleanup(f.dir);
  }
});

for (const target of ['lock', 'journal']) {
  test('recovery rejects unsupported ' + target + ' metadata version', { skip: !linux }, async () => {
    const f = await fixture();
    try {
      assert.throws(
        () => commitMap001RepairSnapshot({
          runPath: f.runPath,
          expectedBeforeSha256: logicalSha256(f.run),
          parentProposal: f.parentProposal,
          validationReport: f.validationReport,
          repair: f.repair,
          childProposalId: f.childProposalId,
          validationReportsById: f.validationReportsById,
          root: ROOT,
          transactionId: 'TXN-VERSION-' + target,
          crashAt: target === 'lock' ? 'C1' : 'C2',
        }),
        Map001DurableStoreCrash
      );

      const metadataPath = target === 'lock'
        ? f.runPath + '.lock'
        : f.runPath + '.txn.json';
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      metadata.schemaVersion = '9.9';
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n');

      assert.throws(
        () => recoverMap001RepairStore({
          runPath: f.runPath,
          validationReportsById: f.validationReportsById,
          root: ROOT,
        }),
        (error) => error instanceof Map001DurableStoreError
          && error.code === 'RECOVERY_METADATA_VERSION_UNSUPPORTED'
      );
    } finally {
      cleanup(f.dir);
    }
  });
}

for (const point of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']) {
  test(point + ' survives real process restart and recovers expected durable side', { skip: !linux }, async () => {
    const f = await fixture();
    try {
      const workerPath = path.join(HERE, 'map001_durable_repair_store_r1.worker.mjs');
      const commitPayloadPath = path.join(f.dir, 'commit-payload.json');
      const recoverPayloadPath = path.join(f.dir, 'recover-payload.json');

      fs.writeFileSync(commitPayloadPath, JSON.stringify({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: f.repair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-PROC-' + point,
        crashAt: point,
      }));

      const writer = spawnSync(process.execPath, [workerPath, 'commit', commitPayloadPath], {
        cwd: ROOT,
        encoding: 'utf8',
      });
      assert.equal(writer.status, 90, writer.stderr);
      assert.match(writer.stderr, new RegExp('SIMULATED_CRASH:' + point));

      fs.writeFileSync(recoverPayloadPath, JSON.stringify({
        runPath: f.runPath,
        validationReportsById: f.validationReportsById,
        root: ROOT,
      }));

      const restarter = spawnSync(process.execPath, [workerPath, 'recover', recoverPayloadPath], {
        cwd: ROOT,
        encoding: 'utf8',
      });
      assert.equal(restarter.status, 0, restarter.stderr);

      const recovered = JSON.parse(restarter.stdout.trim());
      const expectedStatus = ['C1', 'C2'].includes(point)
        ? 'RECOVERED_BEFORE'
        : 'RECOVERED_AFTER';
      const expectedHash = ['C1', 'C2'].includes(point)
        ? logicalSha256(f.run)
        : logicalSha256(f.proposed);

      assert.equal(recovered.recoveryStatus, expectedStatus);
      assert.equal(recovered.visibleSha256, expectedHash);

      const visible = JSON.parse(fs.readFileSync(f.runPath, 'utf8'));
      assert.equal(logicalSha256(visible), expectedHash);
      if (expectedStatus === 'RECOVERED_AFTER') {
        assert.notEqual(visible.iterations.at(-2).repair, null);
        assert.equal(visible.iterations.at(-1).validationReport, null);
      } else {
        assert.equal(visible.iterations.at(-1).repair, null);
      }
    } finally {
      cleanup(f.dir);
    }
  });
}


test('unsafe __proto__ repair cannot reach durable persistence metadata', { skip: !linux }, async () => {
  const f = await fixture();
  try {
    const unsafeRepair = structuredClone(f.repair);
    unsafeRepair.patch.operations[0].after = JSON.parse('{"__proto__":{"polluted":true}}');

    assert.equal({}.polluted, undefined);
    assert.throws(
      () => commitMap001RepairSnapshot({
        runPath: f.runPath,
        expectedBeforeSha256: logicalSha256(f.run),
        parentProposal: f.parentProposal,
        validationReport: f.validationReport,
        repair: unsafeRepair,
        childProposalId: f.childProposalId,
        validationReportsById: f.validationReportsById,
        root: ROOT,
        transactionId: 'TXN-I2-UNSAFE-PROTO',
      }),
      (error) => error instanceof Map001DurableStoreError
        && error.code === 'E5_2_REVALIDATION_FAILED'
    );

    assert.equal(fs.existsSync(f.runPath + '.lock'), false);
    assert.equal(fs.existsSync(f.runPath + '.txn.json'), false);
    assert.equal(fs.existsSync(f.runPath + '.next.json'), false);
    assert.equal({}.polluted, undefined);
  } finally {
    cleanup(f.dir);
  }
});
