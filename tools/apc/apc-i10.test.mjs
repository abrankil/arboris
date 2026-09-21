import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessApcSessionPass,
  buildApcSessionExport,
  validateApcSemanticTransition,
  validateApcSessionForExport,
} from './session-contract.mjs';

const compatible = () => false;
const incompatibleByState = (a, b) => a !== b;

function evidence(overrides = {}) {
  return {
    evidenceId: 'EV-001',
    revision: 1,
    current: true,
    sessionId: 'APC-S-I10',
    photoId: 'PH-001',
    photoEvidenceRef: 'PE-001',
    individualId: 'IND-001',
    characterId: 'CH-003',
    evidenceStatus: 'OBSERVED',
    observedState: 'entero',
    lifecycleStatus: 'CONFIRMED',
    sourceType: 'human',
    sourceId: 'Alejandra',
    confirmation: {
      confirmedByType: 'human',
      confirmedById: 'Alejandra',
      confirmedAt: '2026-09-21T20:30:00-03:00',
    },
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: null,
    notes: null,
    ...overrides,
  };
}

function requirement(overrides = {}) {
  return {
    requirementId: 'REQ-001',
    scopeLevel: 'INDIVIDUAL',
    scopeRef: 'IND-001',
    characterId: 'CH-003',
    required: true,
    reason: 'H16_VERIFICATION',
    createdBy: 'Alejandra',
    ...overrides,
  };
}

function unresolvedPending(overrides = {}) {
  return {
    pendingId: 'PEND-001',
    kind: 'UNRESOLVED_REQUIREMENT',
    status: 'OPEN',
    critical: false,
    originRequirementId: 'REQ-001',
    scopeLevel: 'INDIVIDUAL',
    scopeRef: 'IND-001',
    characterId: 'CH-003',
    previousPendingId: null,
    resolutionEvidenceRefs: [],
    propagation: [{ level: 'SESSION', ref: 'APC-S-I10' }],
    ...overrides,
  };
}

function gap(overrides = {}) {
  return {
    pendingId: 'GAP-001',
    kind: 'REPRESENTATION_GAP',
    status: 'OPEN',
    critical: false,
    sourceLevel: 'INDIVIDUAL',
    sourceRef: 'IND-001',
    characterId: 'CH-003',
    representationTarget: 'CHARACTER',
    previousPendingId: null,
    resolutionEvidenceRefs: [],
    propagation: [{ level: 'SESSION', ref: 'APC-S-I10' }],
    ...overrides,
  };
}

function contradiction(overrides = {}) {
  return {
    contradictionId: 'CON-001',
    individualId: 'IND-001',
    characterId: 'CH-003',
    status: 'OPEN',
    evidenceRefs: [
      { evidenceId: 'EV-001', revision: 1 },
      { evidenceId: 'EV-002', revision: 1 },
    ],
    previousContradictionId: null,
    ...overrides,
  };
}

function session({
  semanticRevision = 1,
  status = 'OPEN',
  objective = 'I10 PASS/export',
  objectiveAssessment = null,
  evidenceItems = [],
  requirements = [],
  pendingItems = [],
  contradictions = [],
  revisions = [],
} = {}) {
  const assessment = objectiveAssessment ?? {
    status: 'SATISFIED',
    assessedRevision: semanticRevision,
    assessedBy: 'Alejandra',
    assessedAt: '2026-09-21T20:35:00-03:00',
    notes: null,
  };
  return {
    schemaVersion: 'apc-session-0.2',
    sessionId: 'APC-S-I10',
    semanticRevision,
    status,
    objective,
    objectiveAssessment: assessment,
    createdAt: '2026-09-21T20:00:00-03:00',
    createdBy: 'Alejandra',
    inboxPhotoRefs: [],
    photos: [
      {
        photoId: 'PH-001',
        fileRef: 'species/photo-1.jpg',
        capturedAt: null,
        location: null,
        individualRefs: ['IND-001'],
        photoEvidenceId: 'PE-001',
      },
      {
        photoId: 'PH-002',
        fileRef: 'species/photo-2.jpg',
        capturedAt: null,
        location: null,
        individualRefs: ['IND-001'],
        photoEvidenceId: 'PE-002',
      },
    ],
    photoEvidence: [
      {
        photoEvidenceId: 'PE-001',
        sourcePhoto: { photoRef: 'PH-001', fingerprintSha256: 'a'.repeat(64) },
        visibleStructures: ['hoja'],
      },
      {
        photoEvidenceId: 'PE-002',
        sourcePhoto: { photoRef: 'PH-002', fingerprintSha256: 'b'.repeat(64) },
        visibleStructures: ['hoja'],
      },
    ],
    individuals: [{ individualId: 'IND-001', status: 'OPEN' }],
    evidence: evidenceItems,
    requirements,
    pending: pendingItems,
    contradictions,
    revisions,
  };
}

function exportable(s, areStatesIncompatible = compatible) {
  return validateApcSessionForExport(s, { areStatesIncompatible });
}

test('T-I10-01 EXPORTABLE and PASS are distinct derived results', () => {
  const s = session({
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
  });
  assert.equal(exportable(s).exportable, true);
  const pass = assessApcSessionPass(s, { areStatesIncompatible: compatible });
  assert.equal(pass.pass, false);
  assert.deepEqual(pass.reasons, ['OBJECTIVE_NOT_SATISFIED']);
});

test('T-I10-02 PASS does not require CLOSED', () => {
  const s = session({ status: 'OPEN' });
  assert.equal(assessApcSessionPass(s, { areStatesIncompatible: compatible }).pass, true);
});

test('T-I10-03 CLOSED does not imply PASS', () => {
  const s = session({
    status: 'CLOSED',
    objectiveAssessment: {
      status: 'NOT_SATISFIED',
      assessedRevision: 1,
      assessedBy: 'Alejandra',
      assessedAt: '2026-09-21T20:35:00-03:00',
      notes: null,
    },
  });
  const result = assessApcSessionPass(s, { areStatesIncompatible: compatible });
  assert.equal(result.pass, false);
  assert.deepEqual(result.reasons, ['OBJECTIVE_NOT_SATISFIED']);
});

test('T-I10-04 unsatisfied requirement requires exactly one OPEN unresolved pending for export', () => {
  const missing = session({ requirements: [requirement()] });
  let result = exportable(missing);
  assert.equal(result.exportable, false);
  assert.match(result.errors.join(' '), /must have exactly one OPEN UNRESOLVED_REQUIREMENT pending; found 0/);

  const covered = session({ requirements: [requirement()], pendingItems: [unresolvedPending()] });
  result = exportable(covered);
  assert.equal(result.exportable, true);
});

test('T-I10-05 satisfied requirement requires zero OPEN unresolved pending', () => {
  const satisfied = session({ evidenceItems: [evidence()], requirements: [requirement()] });
  assert.equal(exportable(satisfied).exportable, true);

  const invalid = session({
    evidenceItems: [evidence()],
    requirements: [requirement()],
    pendingItems: [unresolvedPending()],
  });
  assert.equal(exportable(invalid).exportable, false);
});

test('T-I10-06 required does not imply critical and noncritical unresolved pending does not block PASS', () => {
  const s = session({ requirements: [requirement()], pendingItems: [unresolvedPending({ critical: false })] });
  const result = assessApcSessionPass(s, { areStatesIncompatible: compatible });
  assert.equal(result.pass, true);
});

test('T-I10-07 critical OPEN pending blocks PASS but not export', () => {
  const s = session({ pendingItems: [gap({ critical: true })] });
  assert.equal(exportable(s).exportable, true);
  const result = assessApcSessionPass(s, { areStatesIncompatible: compatible });
  assert.equal(result.pass, false);
  assert.deepEqual(result.reasons, ['CRITICAL_PENDING_OPEN']);
});

test('T-I10-08 noncritical representation gap does not block PASS', () => {
  const s = session({ pendingItems: [gap({ critical: false })] });
  assert.equal(assessApcSessionPass(s, { areStatesIncompatible: compatible }).pass, true);
});

test('T-I10-09 OPEN contradiction does not block PASS by itself', () => {
  const evs = [
    evidence({ evidenceId: 'EV-001', photoId: 'PH-001', photoEvidenceRef: 'PE-001', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-002', photoId: 'PH-002', photoEvidenceRef: 'PE-002', observedState: 'serrado' }),
  ];
  const s = session({ evidenceItems: evs, contradictions: [contradiction()] });
  assert.equal(assessApcSessionPass(s, { areStatesIncompatible: incompatibleByState }).pass, true);
});

test('T-I10-10 DRAFT is exportable and is preserved by export serialization', () => {
  const draft = evidence({
    lifecycleStatus: 'DRAFT',
    evidenceStatus: 'UNCERTAIN',
    observedState: null,
    reason: 'draft observation',
  });
  const s = session({ evidenceItems: [draft] });
  const built = buildApcSessionExport(s, { areStatesIncompatible: compatible });
  assert.equal(built.exportable, true);
  assert.equal(built.filename, 'APC-S-I10.apc.json');
  const parsed = JSON.parse(built.json);
  assert.equal(parsed.evidence[0].lifecycleStatus, 'DRAFT');
});

test('T-I10-11 persisted pass/exportable fields are rejected', () => {
  const withPass = session();
  withPass.pass = true;
  let result = exportable(withPass);
  assert.equal(result.exportable, false);
  assert.match(result.errors.join(' '), /session.pass must not be persisted/);

  const withExportable = session();
  withExportable.exportable = true;
  result = exportable(withExportable);
  assert.equal(result.exportable, false);
  assert.match(result.errors.join(' '), /session.exportable must not be persisted/);
});

test('T-I10-12 stale assessment is NOT_EXPORTABLE and PASS=false', () => {
  const s = session({
    semanticRevision: 9,
    objectiveAssessment: {
      status: 'SATISFIED',
      assessedRevision: 8,
      assessedBy: 'Alejandra',
      assessedAt: '2026-09-21T20:35:00-03:00',
      notes: null,
    },
  });
  const exp = exportable(s);
  assert.equal(exp.exportable, false);
  assert.deepEqual(exp.reasons, ['NOT_EXPORTABLE', 'ASSESSMENT_STALE']);
  const pass = assessApcSessionPass(s, { areStatesIncompatible: compatible });
  assert.equal(pass.pass, false);
  assert.deepEqual(pass.reasons, ['NOT_EXPORTABLE', 'ASSESSMENT_STALE']);
});

test('T-I10-63 final SATISFIED assessment binds current revision without increment', () => {
  const before = session({
    semanticRevision: 8,
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
  });
  const after = session({ semanticRevision: 8 });
  const transition = validateApcSemanticTransition(before, after);
  assert.equal(transition.valid, true);
  assert.equal(transition.semanticChanged, false);
  assert.equal(assessApcSessionPass(after, { areStatesIncompatible: compatible }).pass, true);
});

test('T-I10-64 multiple substrate changes in one semantic transaction increment exactly once', () => {
  const before = session({
    semanticRevision: 8,
    objectiveAssessment: {
      status: 'SATISFIED',
      assessedRevision: 8,
      assessedBy: 'Alejandra',
      assessedAt: '2026-09-21T20:35:00-03:00',
      notes: null,
    },
  });
  const evs = [
    evidence({ evidenceId: 'EV-001', photoId: 'PH-001', photoEvidenceRef: 'PE-001', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-002', photoId: 'PH-002', photoEvidenceRef: 'PE-002', observedState: 'serrado' }),
  ];
  const after = session({
    semanticRevision: 9,
    objective: 'I10 changed objective',
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
    evidenceItems: evs,
    requirements: [requirement()],
    contradictions: [contradiction()],
    pendingItems: [],
  });
  const result = validateApcSemanticTransition(before, after, {
    isContradictionRelevant: () => true,
  });
  assert.equal(result.valid, true);
  assert.equal(result.semanticChanged, true);
});

test('T-I10-65 objectiveAssessment is outside the substrate', () => {
  const before = session({
    semanticRevision: 5,
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
  });
  const after = session({
    semanticRevision: 5,
    objectiveAssessment: {
      status: 'NOT_SATISFIED',
      assessedRevision: 5,
      assessedBy: 'Alejandra',
      assessedAt: '2026-09-21T20:40:00-03:00',
      notes: null,
    },
  });
  const result = validateApcSemanticTransition(before, after);
  assert.equal(result.valid, true);
  assert.equal(result.semanticChanged, false);
});

test('T-I10-67 semantic mutation increments revision and resets final assessment OPEN', () => {
  const before = session({ semanticRevision: 8 });
  const after = session({
    semanticRevision: 9,
    objective: 'changed',
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
  });
  const result = validateApcSemanticTransition(before, after);
  assert.equal(result.valid, true);
  assert.equal(result.semanticChanged, true);
});

test('T-I10-68 assessment reset does not cause a second increment', () => {
  const before = session({ semanticRevision: 8 });
  const after = session({
    semanticRevision: 10,
    objective: 'changed',
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
  });
  const result = validateApcSemanticTransition(before, after);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /8→9; found 10/);
});

test('T-I10-70 session status change alone does not increment semanticRevision', () => {
  const before = session({ semanticRevision: 8, status: 'OPEN' });
  const after = session({ semanticRevision: 8, status: 'CLOSED' });
  const result = validateApcSemanticTransition(before, after);
  assert.equal(result.valid, true);
  assert.equal(result.semanticChanged, false);
});

test('T-I10-71 valid current snapshot can be exportable without reconstructing semantic history', () => {
  const s = session({ semanticRevision: 17 });
  assert.equal(exportable(s).exportable, true);
});

test('T-I10-73 semantic transaction 8→9 passes', () => {
  const before = session({ semanticRevision: 8 });
  const after = session({
    semanticRevision: 9,
    objective: 'changed',
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
  });
  assert.equal(validateApcSemanticTransition(before, after).valid, true);
});

test('T-I10-74 semantic transaction 8→10 fails', () => {
  const before = session({ semanticRevision: 8 });
  const after = session({
    semanticRevision: 10,
    objective: 'changed',
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
  });
  assert.equal(validateApcSemanticTransition(before, after).valid, false);
});

test('T-I10-75 semanticRevision decrease 8→7 fails', () => {
  const before = session({ semanticRevision: 8 });
  const after = session({
    semanticRevision: 7,
    objective: 'changed',
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
  });
  assert.equal(validateApcSemanticTransition(before, after).valid, false);
});

test('T-I10-77 fresh SATISFIED assessment at revision 9 is exportable', () => {
  const s = session({ semanticRevision: 9 });
  assert.equal(exportable(s).exportable, true);
  assert.equal(assessApcSessionPass(s, { areStatesIncompatible: compatible }).pass, true);
});

test('T-I10-78 stale SATISFIED assessment at revision 9/8 is not exportable', () => {
  const s = session({
    semanticRevision: 9,
    objectiveAssessment: {
      status: 'SATISFIED',
      assessedRevision: 8,
      assessedBy: 'Alejandra',
      assessedAt: '2026-09-21T20:35:00-03:00',
      notes: null,
    },
  });
  assert.equal(exportable(s).exportable, false);
});
