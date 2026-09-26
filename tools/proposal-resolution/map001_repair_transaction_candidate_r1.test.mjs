import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
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
  Map001RepairTransactionCandidateError,
  buildMap001RepairTransactionCandidate,
} from './map001_repair_transaction_candidate_r1.mjs';

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

function makeRepair(parent, report, repairId = 'MAP001-REPAIR-0001') {
  return {
    schemaVersion: '0.1',
    repairId,
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

async function makeReadyToRepairFixture() {
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

  assert.equal(validated.state.status, 'READY_TO_REPAIR');
  assert.equal(validated.validationReport.status, 'REJECT_FIXABLE');

  return {
    parentProposal,
    validationReport: validated.validationReport,
    run: validated.run,
    validationReportsById: {
      [validated.validationReport.reportId]: validated.validationReport,
    },
  };
}

test('READY_TO_REPAIR -> atomic candidate snapshot with repair + child -> READY_TO_VALIDATE', async () => {
  const fixture = await makeReadyToRepairFixture();
  const repair = makeRepair(fixture.parentProposal, fixture.validationReport);

  const result = buildMap001RepairTransactionCandidate({
    ...fixture,
    repair,
    childProposalId: 'MAP001-PROP-0002',
    root: ROOT,
  });

  assert.equal(result.transactionStatus, 'CANDIDATE_NOT_PERSISTED');
  assert.equal(result.persistencePerformed, false);
  assert.equal(result.inputState.status, 'READY_TO_REPAIR');
  assert.equal(result.outputState.status, 'READY_TO_VALIDATE');
  assert.equal(result.proposedRunSnapshot.iterations.length, 2);
  assert.deepEqual(result.proposedRunSnapshot.iterations[0].repair, {
    repairId: repair.repairId,
    sha256: result.repairSha256,
  });
  assert.equal(result.proposedRunSnapshot.iterations[1].proposal.proposalId, 'MAP001-PROP-0002');
  assert.equal(result.proposedRunSnapshot.iterations[1].validationReport, null);
  assert.equal(result.proposedRunSnapshot.candidateHistory.length, 2);
  assert.equal(result.contractChecks.runInput.status, 'PASS');
  assert.equal(result.contractChecks.repairPre.status, 'PASS');
  assert.equal(result.contractChecks.repairPost.status, 'PASS');
  assert.equal(result.contractChecks.runOutput.status, 'PASS');

  assert.equal(fixture.run.iterations.length, 1);
  assert.equal(fixture.run.iterations[0].repair, null);
});

test('validation report must be the exact current run-state report', async () => {
  const fixture = await makeReadyToRepairFixture();
  const foreignReport = structuredClone(fixture.validationReport);
  foreignReport.reportId = 'MAP001-VAL-9999';
  const repair = makeRepair(fixture.parentProposal, foreignReport);

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      run: fixture.run,
      parentProposal: fixture.parentProposal,
      validationReport: foreignReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
      validationReportsById: fixture.validationReportsById,
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
      && error.code === 'REPORT_NOT_CURRENT_RUN_VALIDATION'
  );
});

test('child proposalId must be globally fresh in run history', async () => {
  const fixture = await makeReadyToRepairFixture();
  const repair = makeRepair(fixture.parentProposal, fixture.validationReport);

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      ...fixture,
      repair,
      childProposalId: fixture.parentProposal.proposalId,
      root: ROOT,
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
      && error.code === 'CHILD_PROPOSAL_ID_NOT_UNIQUE'
  );
});

test('repairId must be globally fresh in run history', async () => {
  const fixture = await makeReadyToRepairFixture();
  const run = structuredClone(fixture.run);
  run.iterations[0].repair = {
    repairId: 'MAP001-REPAIR-0001',
    sha256: 'a'.repeat(64),
  };
  run.iterations.push({
    iteration: 2,
    proposal: {
      proposalId: 'MAP001-PROP-0099',
      sha256: 'b'.repeat(64),
    },
    validationReport: null,
    repair: null,
  });
  run.candidateHistory.push({
    iteration: 2,
    candidateSha256: 'c'.repeat(64),
  });
  run.state = { status: 'READY_TO_VALIDATE', currentIteration: 2 };

  const currentParent = {
    ...structuredClone(fixture.parentProposal),
    proposalId: 'MAP001-PROP-0099',
    control: {
      ...structuredClone(fixture.parentProposal.control),
      iteration: 2,
      lineage: {
        parentProposal: {
          proposalId: fixture.parentProposal.proposalId,
          sha256: logicalSha256(fixture.parentProposal),
          iteration: 1,
        },
        originatingRepair: {
          repairId: 'MAP001-REPAIR-0001',
          sha256: 'a'.repeat(64),
        },
      },
      subject: {
        ...structuredClone(fixture.parentProposal.control.subject),
        mode: 'MODIFY_DERIVED',
        baseSha256: logicalSha256(fixture.parentProposal.intent.candidate),
      },
    },
  };
  run.iterations[1].proposal.sha256 = logicalSha256(currentParent);
  run.candidateHistory[1].candidateSha256 = logicalSha256(currentParent.intent.candidate);

  const currentReport = structuredClone(fixture.validationReport);
  currentReport.reportId = 'MAP001-VAL-0002';
  currentReport.control.proposalBinding = {
    proposalId: currentParent.proposalId,
    sha256: logicalSha256(currentParent),
    iteration: 2,
  };
  run.iterations[1].validationReport = {
    reportId: currentReport.reportId,
    sha256: logicalSha256(currentReport),
    status: 'REJECT_FIXABLE',
  };
  run.state = { status: 'READY_TO_REPAIR', currentIteration: 2 };

  const repair = makeRepair(currentParent, currentReport, 'MAP001-REPAIR-0001');

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      run,
      parentProposal: currentParent,
      validationReport: currentReport,
      repair,
      childProposalId: 'MAP001-PROP-0100',
      root: ROOT,
      validationReportsById: {
        [fixture.validationReport.reportId]: fixture.validationReport,
        [currentReport.reportId]: currentReport,
      },
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
      && error.code === 'REPAIR_ID_NOT_UNIQUE'
  );
});

test('run must derive READY_TO_REPAIR before transaction candidate is built', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const parentProposal = makeProposal(buildMap001ValidationView(authorityReport));
  const initialRun = makeRun(parentProposal);
  const validated = await executeMap001ValidationIteration({
    run: initialRun,
    proposal: parentProposal,
    reportId: 'MAP001-VAL-0003',
    root: ROOT,
  });
  assert.equal(validated.state.status, 'DOMAIN_PASS');

  const fakeRepair = {
    schemaVersion: '0.1',
    repairId: 'MAP001-REPAIR-0002',
    repairType: 'MAP001_LOCAL_NAVIGATION_AUTO_REPAIR',
    control: {
      owner: 'RESOLVER',
      runId: parentProposal.control.runId,
      parentProposal: {
        proposalId: parentProposal.proposalId,
        sha256: logicalSha256(parentProposal),
        iteration: 1,
      },
      validationBasis: {
        reportId: validated.validationReport.reportId,
        sha256: logicalSha256(validated.validationReport),
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
        findingRefs: ['FND-001'],
        expectedBefore: 17,
        after: 17,
        rationale: 'negative fixture',
      }],
    },
  };

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      run: validated.run,
      parentProposal,
      validationReport: validated.validationReport,
      repair: fakeRepair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
      validationReportsById: {
        [validated.validationReport.reportId]: validated.validationReport,
      },
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
  );
});


test('persisted run.state must equal derived READY_TO_REPAIR state', async () => {
  const fixture = await makeReadyToRepairFixture();
  const repair = makeRepair(fixture.parentProposal, fixture.validationReport);
  const run = structuredClone(fixture.run);
  run.state = { status: 'READY_TO_VALIDATE', currentIteration: 1 };

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      run,
      parentProposal: fixture.parentProposal,
      validationReport: fixture.validationReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
      validationReportsById: fixture.validationReportsById,
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
      && error.code === 'RUN_STATE_DERIVATION_MISMATCH'
  );
});

test('run validator binding must match the current validation report', async () => {
  const fixture = await makeReadyToRepairFixture();
  const repair = makeRepair(fixture.parentProposal, fixture.validationReport);
  const run = structuredClone(fixture.run);
  run.control.validatorBinding.validatorId = 'MAP001.NAV.AUTHORITY.RUNTIME.999';

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      run,
      parentProposal: fixture.parentProposal,
      validationReport: fixture.validationReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
      validationReportsById: fixture.validationReportsById,
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
      && error.code === 'RUN_REPORT_VALIDATOR_MISMATCH'
  );
});

test('run baseline must match the current parent proposal baseline', async () => {
  const fixture = await makeReadyToRepairFixture();
  const repair = makeRepair(fixture.parentProposal, fixture.validationReport);
  const run = structuredClone(fixture.run);
  run.control.baseline.authorityManifestSha256 = '0'.repeat(64);

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      run,
      parentProposal: fixture.parentProposal,
      validationReport: fixture.validationReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
      validationReportsById: fixture.validationReportsById,
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
      && error.code === 'RUN_PARENT_BASELINE_MISMATCH'
  );
});

test('existing proposalId duplicates in run history are rejected fail-closed', async () => {
  const fixture = await makeReadyToRepairFixture();
  const repair = makeRepair(fixture.parentProposal, fixture.validationReport);
  const run = structuredClone(fixture.run);
  run.iterations.push({
    iteration: 2,
    proposal: {
      proposalId: fixture.parentProposal.proposalId,
      sha256: 'a'.repeat(64),
    },
    validationReport: null,
    repair: null,
  });
  run.candidateHistory.push({
    iteration: 2,
    candidateSha256: 'b'.repeat(64),
  });
  run.state = { status: 'READY_TO_VALIDATE', currentIteration: 2 };

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      run,
      parentProposal: fixture.parentProposal,
      validationReport: fixture.validationReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
      validationReportsById: fixture.validationReportsById,
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
  );
});

test('execution pin drift prevents repair transaction candidate', async () => {
  const fixture = await makeReadyToRepairFixture();
  const repair = makeRepair(fixture.parentProposal, fixture.validationReport);
  const run = structuredClone(fixture.run);
  run.control.resolverBinding.dependencies[0].sha256 = '0'.repeat(64);

  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      run,
      parentProposal: fixture.parentProposal,
      validationReport: fixture.validationReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
      validationReportsById: fixture.validationReportsById,
    }),
    (error) => error instanceof Map001RepairTransactionCandidateError
      && error.code === 'RUN_NOT_READY_TO_REPAIR'
  );
});


test('unsafe __proto__ repair content is rejected by E5.1 before transaction candidate acceptance', async () => {
  const fixture = await makeReadyToRepairFixture();
  const repair = makeRepair(fixture.parentProposal, fixture.validationReport);
  repair.patch.operations[0].after = JSON.parse('{"__proto__":{"polluted":true}}');

  assert.equal({}.polluted, undefined);
  assert.throws(
    () => buildMap001RepairTransactionCandidate({
      ...fixture,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
    }),
    (error) => error?.code === 'LEGACY_HASH_UNSAFE_JSON_KEY'
  );
  assert.equal({}.polluted, undefined);
});
