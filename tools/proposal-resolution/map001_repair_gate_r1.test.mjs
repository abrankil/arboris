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
  validateMap001Proposal,
} from './map001_validation_adapter_r1.mjs';

import {
  Map001RepairGateError,
  validateAndApplyMap001Repair,
} from './map001_repair_gate_r1.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CONTRACT_GATE = path.join(ROOT, 'tools/proposal-resolution/validate_e5_repair_contracts.py');
const VALIDATOR_PATH = 'tools/map-navigation/materialize_walkable_envelope_001.mjs';

function rawSha256(relPath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relPath))).digest('hex');
}

const authorityManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, DEFAULT_AUTHORITY_PATH), 'utf8')
);

const validatorBinding = {
  validatorId: 'MAP001.NAV.AUTHORITY.RUNTIME.001',
  scope: 'MAP001_LOCAL_NAVIGATION',
  implementationPath: VALIDATOR_PATH,
  implementationSha256: rawSha256(VALIDATOR_PATH),
};

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
    rationale: 'Fixture reconstructs CREATE_DERIVED candidate exactly.',
  }));
}

function makeParent(candidate) {
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
      objective: 'Restore the derived MAP-001 navigation view to current authority.',
      changes: createChanges(candidate),
      candidate,
    },
  };
}

function makeRepair(parent, report, operationOverrides = {}) {
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
        rationale: 'Restore the derived value from the exact AUTO_REPAIR finding.',
        ...operationOverrides,
      }],
    },
  };
}

function assertContractGate(parent, report, repair, result) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e5-1-'));
  try {
    const files = {
      parent: path.join(dir, 'parent.json'),
      report: path.join(dir, 'report.json'),
      repair: path.join(dir, 'repair.json'),
      child: path.join(dir, 'child.json'),
    };
    fs.writeFileSync(files.parent, JSON.stringify(parent, null, 2));
    fs.writeFileSync(files.report, JSON.stringify(report, null, 2));
    fs.writeFileSync(files.repair, JSON.stringify(repair, null, 2));
    fs.writeFileSync(files.child, JSON.stringify(result.childProposal, null, 2));

    const proc = spawnSync('python', [
      CONTRACT_GATE,
      '--parent', files.parent,
      '--report', files.report,
      '--repair', files.repair,
      '--child', files.child,
      '--parent-sha', result.parentProposalSha256,
      '--report-sha', result.validationReportSha256,
      '--repair-sha', result.repairSha256,
      '--parent-candidate-sha', result.parentCandidateSha256,
    ], { cwd: ROOT, encoding: 'utf8' });

    assert.equal(
      proc.status,
      0,
      'E5.1 contract gate failed\nstdout:\n' + proc.stdout + '\nstderr:\n' + proc.stderr
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function makeFixableFixture() {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.derivedRaster.walkableCellCount += 1;
  const parent = makeParent(candidate);
  const report = await validateMap001Proposal({
    proposal: parent,
    reportId: 'MAP001-VAL-0001',
    validatorBinding,
    root: ROOT,
  });
  assert.equal(report.status, 'REJECT_FIXABLE');
  return { authorityReport, parent, report };
}

test('AUTO_REPAIR finding -> deterministic child proposal -> full revalidation PASS', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report);

  const result = validateAndApplyMap001Repair({
    parentProposal: parent,
    validationReport: report,
    repair,
    childProposalId: 'MAP001-PROP-0002',
  });

  assert.equal(result.childProposal.control.iteration, 2);
  assert.equal(result.childProposal.control.subject.mode, 'MODIFY_DERIVED');
  assert.equal(
    result.childProposal.control.subject.baseSha256,
    logicalSha256(parent.intent.candidate)
  );
  assert.equal(
    result.childProposal.intent.candidate.derivedRaster.walkableCellCount,
    report.findings[0].expected
  );
  assertContractGate(parent, report, repair, result);

  const childReport = await validateMap001Proposal({
    proposal: result.childProposal,
    reportId: 'MAP001-VAL-0002',
    validatorBinding,
    root: ROOT,
  });
  assert.equal(childReport.status, 'PASS');
});

test('repair target outside cited finding scope is rejected', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report, {
    targetPath: '/authority/authorityId',
    expectedBefore: parent.intent.candidate.authority.authorityId,
    after: 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-999',
  });

  assert.throws(
    () => validateAndApplyMap001Repair({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_TARGET_OUTSIDE_FINDING_SCOPE'
  );
});

test('repair cannot cite a non-AUTO_REPAIR finding', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.semantics.worldBearing = 'north';
  const parent = makeParent(candidate);
  const report = await validateMap001Proposal({
    proposal: parent,
    reportId: 'MAP001-VAL-0003',
    validatorBinding,
    root: ROOT,
  });
  assert.equal(report.status, 'OPEN_BLOCKER');

  const repair = {
    ...makeRepair(parent, {
      ...report,
      status: 'REJECT_FIXABLE',
      findings: [{
        ...report.findings[0],
        disposition: 'AUTO_REPAIR',
      }],
    }),
    control: {
      ...makeRepair(parent, {
        ...report,
        status: 'REJECT_FIXABLE',
        findings: [{
          ...report.findings[0],
          disposition: 'AUTO_REPAIR',
        }],
      }).control,
      validationBasis: {
        reportId: report.reportId,
        sha256: logicalSha256(report),
        status: 'REJECT_FIXABLE',
      },
    },
  };

  assert.throws(
    () => validateAndApplyMap001Repair({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_BASIS_NOT_FIXABLE'
  );
});

test('repair expectedBefore mismatch is rejected', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report, {
    expectedBefore: -999,
  });

  assert.throws(
    () => validateAndApplyMap001Repair({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'EXPECTED_BEFORE_MISMATCH'
  );
});

test('overlapping repair targets are rejected', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report);
  repair.patch.operations.push({
    editId: 'EDIT-002',
    operation: 'replace',
    targetPath: '/derivedRaster/walkableCellCount/x',
    findingRefs: [report.findings[0].findingId],
    expectedBefore: 1,
    after: 2,
    rationale: 'Negative overlapping fixture.',
  });

  assert.throws(
    () => validateAndApplyMap001Repair({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'OVERLAPPING_REPAIR_TARGETS'
  );
});

test('JSON Pointer rejects invalid tilde escapes and leading-zero array indices', () => {
  const parent = {
    schemaVersion: '0.2',
    proposalId: 'MAP001-PROP-0001',
    proposalType: 'MAP001_LOCAL_NAVIGATION_DERIVED',
    control: {
      owner: 'RESOLVER',
      runId: 'MAP001-RUN-0001',
      iteration: 1,
      lineage: { parentProposal: null, originatingRepair: null },
      baseline: {
        authorityId: 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001',
        authorityPath: DEFAULT_AUTHORITY_PATH,
        authorityManifestSha256: 'a'.repeat(64),
        sourceCandidate: {
          id: 'MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001',
          path: 'data/maps/map-001-walkable-envelope-candidate-001.json',
          sha256: 'b'.repeat(64),
        },
      },
      subject: {
        mode: 'CREATE_DERIVED',
        artifactRole: 'NON_AUTHORITATIVE_DERIVED',
        artifactId: 'X',
        artifactPath: 'build/proposal-resolution/x.json',
        baseSha256: null,
      },
    },
    intent: {
      objective: 'Pointer test',
      changes: [{
        changeId: 'CHG-001',
        operation: 'add',
        targetPath: '/arr',
        after: [1],
        rationale: 'fixture',
      }],
      candidate: { arr: [1] },
    },
  };
  const report = {
    schemaVersion: '0.1',
    reportId: 'MAP001-VAL-0001',
    reportType: 'MAP001_LOCAL_NAVIGATION_VALIDATION',
    control: {
      owner: 'RESOLVER',
      runId: parent.control.runId,
      proposalBinding: {
        proposalId: parent.proposalId,
        sha256: logicalSha256(parent),
        iteration: 1,
      },
      authorityBinding: {
        authorityId: parent.control.baseline.authorityId,
        authorityManifestSha256: parent.control.baseline.authorityManifestSha256,
        sourceCandidate: {
          id: parent.control.baseline.sourceCandidate.id,
          sha256: parent.control.baseline.sourceCandidate.sha256,
        },
      },
      validatorBinding,
    },
    status: 'REJECT_FIXABLE',
    findings: [{
      findingId: 'FND-001',
      disposition: 'AUTO_REPAIR',
      code: 'TEST.AUTO',
      message: 'test',
      sourceRefs: [DEFAULT_AUTHORITY_PATH],
      targetPaths: ['/arr'],
      repairDirective: { minimalChangeRequired: true },
    }],
  };

  const make = (targetPath) => ({
    schemaVersion: '0.1',
    repairId: 'MAP001-REPAIR-0001',
    repairType: 'MAP001_LOCAL_NAVIGATION_AUTO_REPAIR',
    control: {
      owner: 'RESOLVER',
      runId: parent.control.runId,
      parentProposal: {
        proposalId: parent.proposalId,
        sha256: logicalSha256(parent),
        iteration: 1,
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
        targetPath,
        findingRefs: ['FND-001'],
        expectedBefore: 1,
        after: 2,
        rationale: 'negative pointer fixture',
      }],
    },
  });

  assert.throws(
    () => validateAndApplyMap001Repair({
      parentProposal: parent,
      validationReport: report,
      repair: make('/arr/~2'),
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error.code === 'POINTER_ESCAPE_INVALID'
  );

  assert.throws(
    () => validateAndApplyMap001Repair({
      parentProposal: parent,
      validationReport: report,
      repair: make('/arr/01'),
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error.code === 'ARRAY_INDEX_INVALID'
  );
});
