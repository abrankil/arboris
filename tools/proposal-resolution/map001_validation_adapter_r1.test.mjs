import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMap001ValidationView,
  classifyDifference,
  diffValidationView,
  validateProposalAgainstAuthorityReport,
} from './map001_validation_adapter_r1.mjs';

const sha = (c) => c.repeat(64);

const authorityReport = {
  authorityId: 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001',
  envelopeId: 'MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001',
  status: 'PASS',
  failureClass: null,
  authorityState: 'FROZEN_NAVIGATION_AUTHORITY',
  frameBoundaryPolicy: 'OPEN_PORTS_MAY_CROSS_FRAME',
  territorialGeometryClaim: false,
  localFrameUnit: 'NAVIGATION_UNIT',
  metricScale: 'OPEN',
  worldBearing: 'OPEN',
  derivedRaster: {
    rows: 15,
    cols: 9,
    walkableCells: [[0,4],[1,4]],
    walkableCellCount: 2,
    connectedComponents: 1,
    branchingNodes: [],
    endpoints: [[0,4],[1,4]],
  },
  futureRasterAuthority: 'WALKABLE_ENVELOPE_AFTER_FREEZE',
  productionStandard: 'NOT_ESTABLISHED',
  candidate002Dependency: false,
};

const validatorBinding = {
  validatorId: 'MAP001.NAV.AUTHORITY.RUNTIME.001',
  scope: 'MAP001_LOCAL_NAVIGATION',
  implementationPath: 'tools/map-navigation/materialize_walkable_envelope_001.mjs',
  implementationSha256: sha('c'),
};

function proposal(candidate) {
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
        authorityId: authorityReport.authorityId,
        authorityPath: 'data/baselines/map001-walkable-envelope-authority-001.json',
        authorityManifestSha256: sha('a'),
        sourceCandidate: {
          id: authorityReport.envelopeId,
          path: 'data/maps/map-001-walkable-envelope-candidate-001.json',
          sha256: sha('b'),
        },
      },
      subject: {
        mode: 'MODIFY_DERIVED',
        artifactRole: 'NON_AUTHORITATIVE_DERIVED',
        artifactId: 'MAP001-NAV-VIEW-001',
        artifactPath: 'build/proposal-resolution/map001-nav-view-001.json',
        baseSha256: sha('d'),
      },
    },
    intent: {
      objective: 'fixture',
      changes: [{
        changeId: 'CHG-001',
        operation: 'replace',
        targetPath: '/derivedRaster/walkableCellCount',
        before: 2,
        after: 3,
        rationale: 'fixture',
      }],
      candidate,
    },
  };
}

test('authority PASS builds deterministic non-authoritative validation view', () => {
  const a = buildMap001ValidationView(authorityReport);
  const b = buildMap001ValidationView(structuredClone(authorityReport));
  assert.deepEqual(a, b);
  assert.equal(a.semantics.metricScale, 'OPEN');
  assert.equal(a.semantics.worldBearing, 'OPEN');
  assert.equal(a.derivedRaster.walkableCellCount, 2);
  assert.equal(Object.hasOwn(a, 'status'), false);
});

test('exact view -> PASS', () => {
  const candidate = buildMap001ValidationView(authorityReport);
  const report = validateProposalAgainstAuthorityReport({
    proposal: proposal(candidate),
    authorityReport,
    reportId: 'MAP001-VAL-0001',
    validatorBinding,
  });
  assert.equal(report.status, 'PASS');
  assert.deepEqual(report.findings, []);
});

test('derived raster mismatch -> REJECT_FIXABLE / AUTO_REPAIR', () => {
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.derivedRaster.walkableCellCount = 3;
  const report = validateProposalAgainstAuthorityReport({
    proposal: proposal(candidate),
    authorityReport,
    reportId: 'MAP001-VAL-0001',
    validatorBinding,
  });
  assert.equal(report.status, 'REJECT_FIXABLE');
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0].disposition, 'AUTO_REPAIR');
  assert.deepEqual(report.findings[0].targetPaths, ['/derivedRaster/walkableCellCount']);
});

test('closing OPEN -> OPEN_BLOCKER', () => {
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.semantics.worldBearing = 'north';
  const report = validateProposalAgainstAuthorityReport({
    proposal: proposal(candidate),
    authorityReport,
    reportId: 'MAP001-VAL-0001',
    validatorBinding,
  });
  assert.equal(report.status, 'OPEN_BLOCKER');
  assert.equal(report.findings[0].disposition, 'OPEN_BLOCKER');
});

test('changing protected authority -> AUTHORITY_BLOCKER', () => {
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.authority.authorityId = 'MAP-001-OTHER';
  const report = validateProposalAgainstAuthorityReport({
    proposal: proposal(candidate),
    authorityReport,
    reportId: 'MAP001-VAL-0001',
    validatorBinding,
  });
  assert.equal(report.status, 'AUTHORITY_BLOCKER');
  assert.equal(report.findings[0].disposition, 'AUTHORITY_BLOCKER');
});

test('AUTHORITY blocker dominates OPEN and AUTO_REPAIR findings', () => {
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.authority.authorityId = 'MAP-001-OTHER';
  candidate.semantics.metricScale = 1;
  candidate.derivedRaster.walkableCellCount = 3;
  const report = validateProposalAgainstAuthorityReport({
    proposal: proposal(candidate),
    authorityReport,
    reportId: 'MAP001-VAL-0001',
    validatorBinding,
  });
  assert.equal(report.status, 'AUTHORITY_BLOCKER');
  assert.deepEqual(
    new Set(report.findings.map((f) => f.disposition)),
    new Set(['AUTHORITY_BLOCKER', 'OPEN_BLOCKER', 'AUTO_REPAIR'])
  );
});

test('unknown top-level field fails closed as AUTHORITY_BLOCKER', () => {
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.magic = true;
  const report = validateProposalAgainstAuthorityReport({
    proposal: proposal(candidate),
    authorityReport,
    reportId: 'MAP001-VAL-0001',
    validatorBinding,
  });
  assert.equal(report.status, 'AUTHORITY_BLOCKER');
  assert.deepEqual(report.findings[0].targetPaths, ['/magic']);
});

test('arrays are atomic findings', () => {
  const candidate = buildMap001ValidationView(authorityReport);
  candidate.derivedRaster.walkableCells.push([2,4]);
  const diffs = diffValidationView(buildMap001ValidationView(authorityReport), candidate);
  assert.equal(diffs.length, 1);
  assert.equal(diffs[0].path, '/derivedRaster/walkableCells');
  assert.equal(classifyDifference(diffs[0]), 'AUTO_REPAIR');
});

test('authority runtime not PASS throws instead of fabricating validation report', () => {
  assert.throws(
    () => buildMap001ValidationView({ status: 'FAIL_CLOSED', candidate002Dependency: false }),
    /authority runtime must PASS/
  );
});

test('Candidate 002 dependency is forbidden', () => {
  assert.throws(
    () => buildMap001ValidationView({ ...authorityReport, candidate002Dependency: true }),
    /cannot depend on Candidate 002/
  );
});
