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
  executeMap001RepairGate,
} from './map001_repair_gate_r1.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const VALIDATOR_PATH = 'tools/map-navigation/materialize_walkable_envelope_001.mjs';

function runRepairGate(args) {
  return executeMap001RepairGate({ ...args, root: ROOT });
}

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

  const result = executeMap001RepairGate({
    parentProposal: parent,
    validationReport: report,
    repair,
    childProposalId: 'MAP001-PROP-0002',
    root: ROOT,
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
  assert.equal(result.contractPrecheck.status, 'PASS');
  assert.equal(result.contractPostcheck.status, 'PASS');

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
    () => runRepairGate({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );
});

test('low-level gate rejects a cited non-AUTO_REPAIR finding defensively', async () => {
  const { parent, report } = await makeFixableFixture();
  const invalidReport = structuredClone(report);
  invalidReport.findings[0] = {
    ...invalidReport.findings[0],
    disposition: 'OPEN_BLOCKER',
  };
  const repair = makeRepair(parent, invalidReport);

  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: invalidReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );
});

test('repair expectedBefore mismatch is rejected', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report, {
    expectedBefore: -999,
  });

  assert.throws(
    () => runRepairGate({
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
    () => runRepairGate({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );
});

test('public E5.1 gate rejects invalid tilde escapes and leading-zero array indices', async () => {
  const { parent, report } = await makeFixableFixture();
  const scopedReport = retargetSingleFinding(
    report,
    parent,
    ['/derivedRaster/walkableCells']
  );

  const badEscape = makeRepair(parent, scopedReport, {
    targetPath: '/derivedRaster/walkableCells/~2',
    expectedBefore: 0,
    after: 1,
  });
  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: scopedReport,
      repair: badEscape,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );

  const leadingZero = makeRepair(parent, scopedReport, {
    targetPath: '/derivedRaster/walkableCells/01',
    expectedBefore: 0,
    after: 1,
  });
  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: scopedReport,
      repair: leadingZero,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'ARRAY_INDEX_INVALID'
  );
});


test('every cited finding must authorize the repair target', async () => {
  const { parent, report } = await makeFixableFixture();
  const extraFinding = {
    ...structuredClone(report.findings[0]),
    findingId: 'FND-999',
    code: 'MAP001.AUTO_REPAIR.UNRELATED',
    targetPaths: ['/semantics/worldBearing'],
  };
  const reportWithTwo = {
    ...structuredClone(report),
    findings: [structuredClone(report.findings[0]), extraFinding],
  };
  const repair = makeRepair(parent, reportWithTwo);
  repair.patch.operations[0].findingRefs = [
    reportWithTwo.findings[0].findingId,
    reportWithTwo.findings[1].findingId,
  ];

  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: reportWithTwo,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );
});

test('expectedBefore object equality is independent of object key order', async () => {
  const { parent, report } = await makeFixableFixture();
  const scopedReport = retargetSingleFinding(report, parent, ['/semantics']);
  const original = parent.intent.candidate.semantics;
  const reversed = Object.fromEntries(Object.entries(original).reverse());
  const after = { ...structuredClone(original), i2OrderTestMarker: true };
  const repair = makeRepair(parent, scopedReport, {
    targetPath: '/semantics',
    expectedBefore: reversed,
    after,
  });

  const result = runRepairGate({
    parentProposal: parent,
    validationReport: scopedReport,
    repair,
    childProposalId: 'MAP001-PROP-0002',
  });

  assert.deepEqual(result.childProposal.intent.candidate.semantics, after);
});


test('executable gate rejects structurally invalid Repair R1 before application', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report);
  repair.unexpected = true;

  assert.throws(
    () => executeMap001RepairGate({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );
});

test('executable gate rejects report authority binding drift before application', async () => {
  const { parent, report } = await makeFixableFixture();
  const driftedReport = structuredClone(report);
  driftedReport.control.authorityBinding.authorityManifestSha256 = '0'.repeat(64);
  const repair = makeRepair(parent, driftedReport);

  assert.throws(
    () => executeMap001RepairGate({
      parentProposal: parent,
      validationReport: driftedReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );
});

test('executable gate rejects validator implementation hash drift before application', async () => {
  const { parent, report } = await makeFixableFixture();
  const driftedReport = structuredClone(report);
  driftedReport.control.validatorBinding.implementationSha256 = '0'.repeat(64);
  const repair = makeRepair(parent, driftedReport);

  assert.throws(
    () => executeMap001RepairGate({
      parentProposal: parent,
      validationReport: driftedReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
      root: ROOT,
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );
});

test('child proposal id cannot reuse parent proposal id', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report);

  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: parent.proposalId,
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'CHILD_PROPOSAL_ID_REUSED'
  );
});


test('duplicate editId values are rejected', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report);
  repair.patch.operations.push({
    editId: 'EDIT-001',
    operation: 'replace',
    targetPath: '/derivedRaster/walkableCells',
    findingRefs: [report.findings[0].findingId],
    expectedBefore: parent.intent.candidate.derivedRaster.walkableCells,
    after: parent.intent.candidate.derivedRaster.walkableCells,
    rationale: 'duplicate edit id fixture',
  });

  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'REPAIR_CONTRACT_PRECONDITION_FAILED'
  );
});


function ownProtoJson(value = { polluted: true }) {
  return JSON.parse('{"__proto__":' + JSON.stringify(value) + '}');
}

function retargetSingleFinding(report, parent, targetPaths) {
  const next = structuredClone(report);
  next.control.proposalBinding.sha256 = logicalSha256(parent);
  next.findings[0].targetPaths = targetPaths;
  return next;
}

test('E5.1 module exposes only the normalized executable repair entrypoint', async () => {
  const module = await import('./map001_repair_gate_r1.mjs');
  assert.equal(typeof module.executeMap001RepairGate, 'function');
  assert.equal(Object.hasOwn(module, 'validateAndApplyMap001Repair'), false);
});

test('decoded __proto__ repair target fails closed without prototype mutation', async () => {
  const { parent, report } = await makeFixableFixture();
  const scopedReport = retargetSingleFinding(report, parent, ['/__proto__']);
  const repair = makeRepair(parent, scopedReport, {
    operation: 'add',
    targetPath: '/__proto__',
    after: { polluted: true },
  });
  delete repair.patch.operations[0].expectedBefore;

  assert.equal({}.polluted, undefined);
  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: scopedReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'PROTOTYPE_SENSITIVE_POINTER_TOKEN'
  );
  assert.equal({}.polluted, undefined);
});

test('nested decoded __proto__ repair target fails closed', async () => {
  const { parent, report } = await makeFixableFixture();
  parent.intent.candidate.obj = {};
  const scopedReport = retargetSingleFinding(report, parent, ['/obj']);
  const repair = makeRepair(parent, scopedReport, {
    operation: 'add',
    targetPath: '/obj/__proto__',
    after: { polluted: true },
  });
  delete repair.patch.operations[0].expectedBefore;

  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: scopedReport,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'PROTOTYPE_SENSITIVE_POINTER_TOKEN'
  );
  assert.equal({}.polluted, undefined);
});

test('normalized repair content with own __proto__ key fails before legacy hash acceptance', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report);
  repair.patch.operations[0].after = ownProtoJson();

  assert.throws(
    () => runRepairGate({
      parentProposal: parent,
      validationReport: report,
      repair,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'LEGACY_HASH_UNSAFE_JSON_KEY'
  );
  assert.equal({}.polluted, undefined);
});

test('normalized parent and report content with own __proto__ key fail closed', async () => {
  const fixtureA = await makeFixableFixture();
  Object.defineProperty(fixtureA.parent.intent.candidate, '__proto__', {
    value: { polluted: true },
    enumerable: true,
    writable: true,
    configurable: true,
  });
  const reportA = retargetSingleFinding(
    fixtureA.report,
    fixtureA.parent,
    fixtureA.report.findings[0].targetPaths
  );
  const repairA = makeRepair(fixtureA.parent, reportA);

  assert.throws(
    () => runRepairGate({
      parentProposal: fixtureA.parent,
      validationReport: reportA,
      repair: repairA,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'LEGACY_HASH_UNSAFE_JSON_KEY'
  );

  const fixtureB = await makeFixableFixture();
  Object.defineProperty(fixtureB.report.findings[0], '__proto__', {
    value: { polluted: true },
    enumerable: true,
    writable: true,
    configurable: true,
  });
  const repairB = makeRepair(fixtureB.parent, fixtureB.report);

  assert.throws(
    () => runRepairGate({
      parentProposal: fixtureB.parent,
      validationReport: fixtureB.report,
      repair: repairB,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'LEGACY_HASH_UNSAFE_JSON_KEY'
  );
  assert.equal({}.polluted, undefined);
});

test('unsafe __proto__ key is rejected in expectedBefore, arrays, and multi-operation repairs', async () => {
  const fixtureA = await makeFixableFixture();
  const repairA = makeRepair(fixtureA.parent, fixtureA.report);
  repairA.patch.operations[0].expectedBefore = ownProtoJson();
  assert.throws(
    () => runRepairGate({
      parentProposal: fixtureA.parent,
      validationReport: fixtureA.report,
      repair: repairA,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'LEGACY_HASH_UNSAFE_JSON_KEY'
  );

  const fixtureB = await makeFixableFixture();
  const repairB = makeRepair(fixtureB.parent, fixtureB.report);
  repairB.patch.operations[0].after = [ownProtoJson()];
  assert.throws(
    () => runRepairGate({
      parentProposal: fixtureB.parent,
      validationReport: fixtureB.report,
      repair: repairB,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'LEGACY_HASH_UNSAFE_JSON_KEY'
  );

  const fixtureC = await makeFixableFixture();
  const repairC = makeRepair(fixtureC.parent, fixtureC.report);
  repairC.patch.operations.push({
    editId: 'EDIT-002',
    operation: 'add',
    targetPath: '/not-authorized-but-never-reached',
    findingRefs: [fixtureC.report.findings[0].findingId],
    after: ownProtoJson(),
    rationale: 'Adversarial second operation contains unsafe legacy-hash key.',
  });
  assert.throws(
    () => runRepairGate({
      parentProposal: fixtureC.parent,
      validationReport: fixtureC.report,
      repair: repairC,
      childProposalId: 'MAP001-PROP-0002',
    }),
    (error) => error instanceof Map001RepairGateError
      && error.code === 'LEGACY_HASH_UNSAFE_JSON_KEY'
  );

  assert.equal({}.polluted, undefined);
});

test('ordinary constructor and prototype keys are not rejected by name alone', async () => {
  const { parent, report } = await makeFixableFixture();
  const scopedReport = retargetSingleFinding(
    report,
    parent,
    ['/constructor', '/prototype', '/__proto___']
  );
  const repair = makeRepair(parent, scopedReport, {
    operation: 'add',
    targetPath: '/constructor',
    after: 'ordinary-data',
  });
  delete repair.patch.operations[0].expectedBefore;
  repair.patch.operations.push({
    editId: 'EDIT-002',
    operation: 'add',
    targetPath: '/prototype',
    findingRefs: [scopedReport.findings[0].findingId],
    after: 'ordinary-data-2',
    rationale: 'Ordinary JSON key must not be blocked by nominal blacklist.',
  });
  repair.patch.operations.push({
    editId: 'EDIT-003',
    operation: 'add',
    targetPath: '/__proto___',
    findingRefs: [scopedReport.findings[0].findingId],
    after: 'nearby-safe-key',
    rationale: 'Nearby key must not be blocked by exact __proto__ policy.',
  });

  const result = runRepairGate({
    parentProposal: parent,
    validationReport: scopedReport,
    repair,
    childProposalId: 'MAP001-PROP-0002',
  });

  assert.equal(result.childProposal.intent.candidate.constructor, 'ordinary-data');
  assert.equal(result.childProposal.intent.candidate.prototype, 'ordinary-data-2');
  assert.equal(result.childProposal.intent.candidate.__proto___, 'nearby-safe-key');
  const descriptor = Object.getOwnPropertyDescriptor(
    result.childProposal.intent.candidate,
    'constructor'
  );
  assert.deepEqual(
    {
      enumerable: descriptor.enumerable,
      writable: descriptor.writable,
      configurable: descriptor.configurable,
    },
    { enumerable: true, writable: true, configurable: true }
  );
});

test('Python E5.1 contract checker rejects own __proto__ key in parsed JSON', async () => {
  const { parent, report } = await makeFixableFixture();
  const repair = makeRepair(parent, report);
  Object.defineProperty(repair, '__proto__', {
    value: { polluted: true },
    enumerable: true,
    writable: true,
    configurable: true,
  });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-i2-python-'));
  try {
    const parentPath = path.join(dir, 'parent.json');
    const reportPath = path.join(dir, 'report.json');
    const repairPath = path.join(dir, 'repair.json');
    fs.writeFileSync(parentPath, JSON.stringify(parent));
    fs.writeFileSync(reportPath, JSON.stringify(report));
    fs.writeFileSync(repairPath, JSON.stringify(repair));

    const proc = spawnSync('python', [
      path.join(ROOT, 'tools/proposal-resolution/validate_e5_repair_contracts.py'),
      '--phase', 'pre',
      '--parent', parentPath,
      '--report', reportPath,
      '--repair', repairPath,
      '--parent-sha', logicalSha256(parent),
      '--report-sha', logicalSha256(report),
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    assert.notEqual(proc.status, 0);
    assert.match(proc.stderr, /LEGACY_HASH_UNSAFE_JSON_KEY/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
