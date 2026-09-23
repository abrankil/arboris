import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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
      objective: 'Validate a non-authoritative MAP-001 navigation view against the frozen authority runtime.',
      changes: [{
        changeId: 'CHG-001',
        operation: 'add',
        targetPath: '/derivedRaster',
        after: candidate.derivedRaster,
        rationale: 'Integration-test fixture.',
      }],
      candidate,
    },
  };
}

test('real authority-runtime produces deterministic validation view and PASS', async () => {
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
});

test('real runtime + derived raster drift -> REJECT_FIXABLE', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.derivedRaster.walkableCellCount += 1;

  const report = await validateMap001Proposal({
    proposal: makeProposal(candidate),
    reportId: 'MAP001-VAL-0002',
    validatorBinding,
    root: ROOT,
  });

  assert.equal(report.status, 'REJECT_FIXABLE');
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0].disposition, 'AUTO_REPAIR');
  assert.deepEqual(report.findings[0].targetPaths, ['/derivedRaster/walkableCellCount']);
});

test('real runtime + closing worldBearing OPEN -> OPEN_BLOCKER', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.semantics.worldBearing = 'north';

  const report = await validateMap001Proposal({
    proposal: makeProposal(candidate),
    reportId: 'MAP001-VAL-0003',
    validatorBinding,
    root: ROOT,
  });

  assert.equal(report.status, 'OPEN_BLOCKER');
  assert.equal(report.findings[0].disposition, 'OPEN_BLOCKER');
  assert.deepEqual(report.findings[0].targetPaths, ['/semantics/worldBearing']);
});

test('real runtime + protected authority drift -> AUTHORITY_BLOCKER', async () => {
  const { report: authorityReport } = materializeWalkableEnvelopeAuthority(ROOT);
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.authority.authorityId = 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-999';

  const report = await validateMap001Proposal({
    proposal: makeProposal(candidate),
    reportId: 'MAP001-VAL-0004',
    validatorBinding,
    root: ROOT,
  });

  assert.equal(report.status, 'AUTHORITY_BLOCKER');
  assert.equal(report.findings[0].disposition, 'AUTHORITY_BLOCKER');
  assert.deepEqual(report.findings[0].targetPaths, ['/authority/authorityId']);
});
