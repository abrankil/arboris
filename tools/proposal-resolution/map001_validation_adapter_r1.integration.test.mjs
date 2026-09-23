import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const VALIDATOR_PATH = 'tools/map-navigation/materialize_walkable_envelope_001.mjs';
const CONTRACT_VALIDATOR = path.join(ROOT, 'tools/proposal-resolution/validate_e3_contracts.py');

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
    changeId: `CHG-${String(index + 1).padStart(3, '0')}`,
    operation: 'add',
    targetPath: `/${key}`,
    after: structuredClone(value),
    rationale: 'CREATE_DERIVED must reconstruct the candidate exactly from an empty base.',
  }));
}

function makeProposal(candidate, { underdeclare = false } = {}) {
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
      objective: 'Validate a non-authoritative MAP-001 navigation view against the frozen authority runtime.',
      changes: underdeclare
        ? [{
            changeId: 'CHG-001',
            operation: 'add',
            targetPath: '/derivedRaster',
            after: structuredClone(candidate.derivedRaster),
            rationale: 'Negative fixture: intentionally incomplete declaration.',
          }]
        : createChanges(candidate),
      candidate,
    },
  };
}

function assertApprovedContracts(proposal, report) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e3-contracts-'));
  try {
    const proposalPath = path.join(dir, 'proposal.json');
    const reportPath = path.join(dir, 'validation-report.json');
    fs.writeFileSync(proposalPath, JSON.stringify(proposal, null, 2));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    const result = spawnSync(
      'python',
      [CONTRACT_VALIDATOR, '--proposal', proposalPath, '--report', reportPath],
      { cwd: ROOT, encoding: 'utf8' }
    );

    assert.equal(
      result.status,
      0,
      `approved E2 contract validation failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
    const parsed = JSON.parse(result.stdout.trim());
    assert.deepEqual(parsed, {
      status: 'PASS',
      proposalSchema: 'R2',
      validationReportSchema: 'R1',
      semanticInvariant: 'SEM-PROP-004',
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function assertSemanticRejects(proposal, report) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e3-contracts-negative-'));
  try {
    const proposalPath = path.join(dir, 'proposal.json');
    const reportPath = path.join(dir, 'validation-report.json');
    fs.writeFileSync(proposalPath, JSON.stringify(proposal, null, 2));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    const result = spawnSync(
      'python',
      [CONTRACT_VALIDATOR, '--proposal', proposalPath, '--report', reportPath],
      { cwd: ROOT, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SEM-PROP-004 failed/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('real authority-runtime produces deterministic validation view and contract-valid PASS', async () => {
  const first = materializeWalkableEnvelopeAuthority(ROOT);
  const second = materializeWalkableEnvelopeAuthority(ROOT);

  assert.equal(first.report.status, 'PASS');
  assert.equal(first.report.candidate002Dependency, false);
  assert.deepEqual(first.report, second.report);

  const candidate = buildMap001ValidationView(first.report);
  const proposal = makeProposal(candidate);

  const report = await validateMap001Proposal({
    proposal,
    reportId: 'MAP001-VAL-0001',
    validatorBinding,
    root: ROOT,
  });

  assert.equal(report.status, 'PASS');
  assert.deepEqual(report.findings, []);
  assert.equal(report.control.authorityBinding.authorityId, authorityManifest.authorityId);
  assert.equal(report.control.validatorBinding.implementationSha256, rawSha256(VALIDATOR_PATH));
  assert.equal(report.control.proposalBinding.sha256, logicalSha256(proposal));
  assertApprovedContracts(proposal, report);
});

test('real runtime + derived raster drift -> contract-valid REJECT_FIXABLE', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.derivedRaster.walkableCellCount += 1;
  const proposal = makeProposal(candidate);

  const report = await validateMap001Proposal({
    proposal,
    reportId: 'MAP001-VAL-0002',
    validatorBinding,
    root: ROOT,
  });

  assert.equal(report.status, 'REJECT_FIXABLE');
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0].disposition, 'AUTO_REPAIR');
  assert.deepEqual(report.findings[0].targetPaths, ['/derivedRaster/walkableCellCount']);
  assertApprovedContracts(proposal, report);
});

test('real runtime + closing worldBearing OPEN -> contract-valid OPEN_BLOCKER', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.semantics.worldBearing = 'north';
  const proposal = makeProposal(candidate);

  const report = await validateMap001Proposal({
    proposal,
    reportId: 'MAP001-VAL-0003',
    validatorBinding,
    root: ROOT,
  });

  assert.equal(report.status, 'OPEN_BLOCKER');
  assert.equal(report.findings[0].disposition, 'OPEN_BLOCKER');
  assert.deepEqual(report.findings[0].targetPaths, ['/semantics/worldBearing']);
  assertApprovedContracts(proposal, report);
});

test('real runtime + protected authority drift -> contract-valid AUTHORITY_BLOCKER', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.authority.authorityId = 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-999';
  const proposal = makeProposal(candidate);

  const report = await validateMap001Proposal({
    proposal,
    reportId: 'MAP001-VAL-0004',
    validatorBinding,
    root: ROOT,
  });

  assert.equal(report.status, 'AUTHORITY_BLOCKER');
  assert.equal(report.findings[0].disposition, 'AUTHORITY_BLOCKER');
  assert.deepEqual(report.findings[0].targetPaths, ['/authority/authorityId']);
  assertApprovedContracts(proposal, report);
});

test('SEM-PROP-004 rejects the former underdeclared CREATE_DERIVED fixture', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  const proposal = makeProposal(candidate, { underdeclare: true });

  const report = await validateMap001Proposal({
    proposal,
    reportId: 'MAP001-VAL-0008',
    validatorBinding,
    root: ROOT,
  });

  assert.equal(report.status, 'PASS');
  assertSemanticRejects(proposal, report);
});

test('pinned validator SHA mismatch fails before validation report is fabricated', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));

  await assert.rejects(
    validateMap001Proposal({
      proposal,
      reportId: 'MAP001-VAL-0005',
      validatorBinding: { ...validatorBinding, implementationSha256: '0'.repeat(64) },
      root: ROOT,
    }),
    (error) => error?.code === 'VALIDATOR_PROVENANCE_MISMATCH'
  );
});

test('pinned authority manifest SHA mismatch fails before domain validation', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));
  proposal.control.baseline.authorityManifestSha256 = '0'.repeat(64);

  await assert.rejects(
    validateMap001Proposal({
      proposal,
      reportId: 'MAP001-VAL-0006',
      validatorBinding,
      root: ROOT,
    }),
    (error) => error?.code === 'AUTHORITY_PROVENANCE_MISMATCH'
  );
});

test('explicit authority path cannot bypass the proposal baseline', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const proposal = makeProposal(buildMap001ValidationView(authorityReport));

  await assert.rejects(
    validateMap001Proposal({
      proposal,
      reportId: 'MAP001-VAL-0007',
      validatorBinding,
      root: ROOT,
      authorityPath: 'data/baselines/another-authority.json',
    }),
    (error) => error?.code === 'AUTHORITY_PATH_MISMATCH'
  );
});
