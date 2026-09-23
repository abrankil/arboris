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
      {
        schemaId,
        path: relPath,
        sha256: rawSha256(relPath),
      },
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
    rationale: 'CREATE_DERIVED reconstructs the candidate exactly from an empty base.',
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
      lineage: {
        parentProposal: null,
        originatingRepair: null,
      },
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
      objective: 'Execute one real MAP-001 validation iteration through the E4.3 orchestrator.',
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
    state: {
      status: 'READY_TO_VALIDATE',
      currentIteration: 1,
    },
    iterations: [
      {
        iteration: 1,
        proposal: {
          proposalId: proposal.proposalId,
          sha256: logicalSha256(proposal),
        },
        validationReport: null,
        repair: null,
      },
    ],
    candidateHistory: [
      {
        iteration: 1,
        candidateSha256: logicalSha256(proposal.intent.candidate),
      },
    ],
  };
}

async function executeCandidate(candidate, reportId = 'MAP001-VAL-0001') {
  const proposal = makeProposal(candidate);
  const run = makeRun(proposal);
  return executeMap001ValidationIteration({
    run,
    proposal,
    reportId,
    root: ROOT,
  });
}

test('real PASS proposal executes full single iteration -> DOMAIN_PASS', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);

  const result = await executeCandidate(candidate);

  assert.equal(result.executedValidation, true);
  assert.equal(result.validationReport.status, 'PASS');
  assert.deepEqual(result.state, {
    status: 'DOMAIN_PASS',
    currentIteration: 1,
  });
  assert.equal(result.run.iterations[0].validationReport.status, 'PASS');
  assert.equal(result.contractPrecheck.status, 'PASS');
  assert.equal(result.contractPostcheck.status, 'PASS');
  assert.equal(Object.hasOwn(result.state, 'authorizedForAsc'), false);
});

test('real derived drift executes full single iteration -> READY_TO_REPAIR', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.derivedRaster.walkableCellCount += 1;

  const result = await executeCandidate(candidate, 'MAP001-VAL-0002');

  assert.equal(result.executedValidation, true);
  assert.equal(result.validationReport.status, 'REJECT_FIXABLE');
  assert.equal(result.state.status, 'READY_TO_REPAIR');
  assert.equal(result.contractPostcheck.status, 'PASS');
});

test('real attempt to close OPEN -> OPEN_BLOCKED', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.semantics.worldBearing = 'north';

  const result = await executeCandidate(candidate, 'MAP001-VAL-0003');

  assert.equal(result.executedValidation, true);
  assert.equal(result.validationReport.status, 'OPEN_BLOCKER');
  assert.equal(result.state.status, 'OPEN_BLOCKED');
});

test('real protected authority drift -> AUTHORITY_BLOCKED', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.authority.authorityId = 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-999';

  const result = await executeCandidate(candidate, 'MAP001-VAL-0004');

  assert.equal(result.executedValidation, true);
  assert.equal(result.validationReport.status, 'AUTHORITY_BLOCKER');
  assert.equal(result.state.status, 'AUTHORITY_BLOCKED');
});

test('authority manifest pin mismatch stops before domain validation -> AUTHORITY_CHANGED', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  proposal.control.baseline.authorityManifestSha256 = '0'.repeat(64);
  const run = makeRun(proposal);

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0005',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.validationReport, null);
  assert.equal(result.state.status, 'AUTHORITY_CHANGED');
  assert.equal(result.state.evidence.component, 'AUTHORITY_MANIFEST');
});

test('validator implementation pin mismatch stops before domain validation -> SYSTEM_ERROR', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  const run = makeRun(proposal);
  run.control.validatorBinding.implementationSha256 = '0'.repeat(64);

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0006',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.state.status, 'SYSTEM_ERROR');
  assert.equal(result.state.evidence.component, 'VALIDATOR_IMPLEMENTATION');
});

test('contract-set raw hash mismatch stops before domain validation -> SYSTEM_ERROR', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  const run = makeRun(proposal);
  run.control.contractSet.proposal.sha256 = '0'.repeat(64);

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0007',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.state.status, 'SYSTEM_ERROR');
  assert.equal(result.state.evidence.component, 'CONTRACT_PROPOSAL');
});

test('candidateHistory wrong logical hash -> SYSTEM_ERROR before domain validation', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  const run = makeRun(proposal);
  run.candidateHistory[0].candidateSha256 = '0'.repeat(64);

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0008',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.state.status, 'SYSTEM_ERROR');
  assert.equal(result.state.evidence.component, 'CONTRACT_SEMANTIC');
  assert.equal(result.validationReport, null);
});

test('proposal artifact path outside resolver allowlist -> SYSTEM_ERROR before domain validation', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  proposal.control.subject.artifactPath = 'build/other/map001-nav-validation-view-001.json';
  const run = makeRun(proposal);

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0009',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.state.status, 'SYSTEM_ERROR');
  assert.equal(result.state.evidence.component, 'CONTRACT_SEMANTIC');
  assert.equal(result.validationReport, null);
});


test('resolver dependency pin mismatch stops before domain validation -> SYSTEM_ERROR', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  const run = makeRun(proposal);
  run.control.resolverBinding.dependencies[0].sha256 = '0'.repeat(64);

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0010',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.state.status, 'SYSTEM_ERROR');
  assert.equal(result.state.evidence.component, 'RESOLVER_IMPLEMENTATION');
});

test('resolver dependency set must match semantic contract exactly', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  const run = makeRun(proposal);
  run.control.resolverBinding.dependencies = run.control.resolverBinding.dependencies.slice(0, -1);

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0011',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.state.status, 'SYSTEM_ERROR');
  assert.equal(result.state.evidence.code, 'RESOLVER_DEPENDENCY_SET_MISMATCH');
});


test('missing resolver dependency file -> SYSTEM_ERROR before domain validation', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  const run = makeRun(proposal);
  run.control.resolverBinding.dependencies[0].path =
    'tools/proposal-resolution/does-not-exist.mjs';

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0012',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.state.status, 'SYSTEM_ERROR');
  assert.equal(result.validationReport, null);
});

test('resolver dependency path escaping repository -> SYSTEM_ERROR before domain validation', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  const run = makeRun(proposal);
  run.control.resolverBinding.dependencies[0].path = '../outside.mjs';

  const result = await executeMap001ValidationIteration({
    run,
    proposal,
    reportId: 'MAP001-VAL-0013',
    root: ROOT,
  });

  assert.equal(result.executedValidation, false);
  assert.equal(result.state.status, 'SYSTEM_ERROR');
  assert.equal(result.validationReport, null);
});
