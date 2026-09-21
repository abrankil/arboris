import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isApcRequirementSatisfied,
  validateApcPendingTransition,
  validateApcRequirementCharacters,
  validateApcSession,
} from './session-contract.mjs';

function evidence(overrides = {}) {
  return {
    evidenceId: 'EV-001',
    revision: 1,
    current: true,
    sessionId: 'APC-S-I78',
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
      confirmedAt: '2026-09-21T19:00:00-03:00',
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

function pending(overrides = {}) {
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
    propagation: [{ level: 'SESSION', ref: 'APC-S-I78' }],
    ...overrides,
  };
}

function session({
  evidenceItems = [],
  requirements = [requirement()],
  pendingItems = [pending()],
} = {}) {
  return {
    schemaVersion: 'apc-session-0.2',
    sessionId: 'APC-S-I78',
    status: 'OPEN',
    objective: 'I7/I8 requirements and pending',
    objectiveAssessment: { status: 'OPEN', assessedBy: null, assessedAt: null, notes: null },
    createdAt: '2026-09-21T19:00:00-03:00',
    createdBy: 'Alejandra',
    inboxPhotoRefs: [],
    photos: [{
      photoId: 'PH-001',
      fileRef: 'species/photo.jpg',
      capturedAt: null,
      location: null,
      individualRefs: ['IND-001'],
      photoEvidenceId: 'PE-001',
    }],
    photoEvidence: [{
      photoEvidenceId: 'PE-001',
      sourcePhoto: { photoRef: 'PH-001', fingerprintSha256: 'a'.repeat(64) },
      visibleStructures: ['hoja'],
    }],
    individuals: [{ individualId: 'IND-001', status: 'OPEN' }],
    evidence: evidenceItems,
    requirements,
    pending: pendingItems,
    contradictions: [],
    revisions: [],
  };
}

test('T-I7-01 accepts active requirement with valid scope and no evidence when OPEN pending exists', () => {
  assert.equal(validateApcSession(session()).valid, true);
});

test('T-I7-02 rejects required=false inside active requirements[]', () => {
  const r = validateApcSession(session({ requirements: [requirement({ required: false })] }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /required must equal true/);
});

test('T-I7-03 rejects unresolved requirement scopeRef', () => {
  const r = validateApcSession(session({
    requirements: [requirement({ scopeRef: 'IND-GHOST' })],
    pendingItems: [],
  }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /does not resolve at INDIVIDUAL/);
});

test('T-I7-04 rejects duplicate semantic requirement key', () => {
  const r = validateApcSession(session({
    requirements: [requirement(), requirement({ requirementId: 'REQ-002' })],
    pendingItems: [],
  }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /duplicate requirement semantic key/);
});

test('T-I7-05 validates requirement characterId against external dataset', () => {
  const s = session({ pendingItems: [] });
  const ok = validateApcRequirementCharacters(s, {
    allCharactersById: new Map([['CH-003', { characterId: 'CH-003' }]]),
  });
  assert.equal(ok.valid, true);
  const bad = validateApcRequirementCharacters(s, { allCharactersById: new Map() });
  assert.equal(bad.valid, false);
  assert.match(bad.errors.join(' '), /unknown dataset characterId CH-003/);
});

test('T-I7-06 INDIVIDUAL requirement is satisfied by current CONFIRMED OBSERVED evidence for that individual', () => {
  const s = session({ evidenceItems: [evidence()], pendingItems: [] });
  const r = validateApcSession(s);
  assert.equal(r.valid, true);
  assert.equal(isApcRequirementSatisfied(s, s.requirements[0], r.indexes), true);
});

test('T-I7-07 historical, DRAFT, UNCERTAIN and NOT_OBSERVABLE evidence do not satisfy a requirement', () => {
  for (const ev of [
    evidence({ current: false }),
    evidence({ lifecycleStatus: 'DRAFT' }),
    evidence({ evidenceStatus: 'UNCERTAIN', observedState: null, reason: 'ambiguous' }),
    evidence({ evidenceStatus: 'NOT_OBSERVABLE', observedState: null, reason: 'occluded' }),
  ]) {
    const s = session({ evidenceItems: [ev], pendingItems: [pending()] });
    const r = validateApcSession(s);
    assert.equal(r.valid, ev.current === false ? false : true);
    if (r.valid) assert.equal(isApcRequirementSatisfied(s, s.requirements[0], r.indexes), false);
  }
});

test('T-I8-01 OPEN unresolved pending is valid while requirement is unsatisfied', () => {
  assert.equal(validateApcSession(session()).valid, true);
});

test('T-I8-02 OPEN unresolved pending becomes invalid when requirement is satisfied', () => {
  const r = validateApcSession(session({ evidenceItems: [evidence()] }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /cannot be OPEN because origin requirement is currently satisfied/);
});

test('T-I8-03 REPRESENTATION_GAP rejects PHOTO scope and accepts INDIVIDUAL scope', () => {
  const badGap = {
    pendingId: 'GAP-001',
    kind: 'REPRESENTATION_GAP',
    status: 'OPEN',
    critical: false,
    sourceLevel: 'PHOTO',
    sourceRef: 'PH-001',
    characterId: 'CH-003',
    representationTarget: 'CHARACTER',
    previousPendingId: null,
    resolutionEvidenceRefs: [],
    propagation: [],
  };
  const bad = validateApcSession(session({ requirements: [], pendingItems: [badGap] }));
  assert.equal(bad.valid, false);
  assert.match(bad.errors.join(' '), /sourceLevel must be INDIVIDUAL or SESSION/);

  const goodGap = { ...badGap, sourceLevel: 'INDIVIDUAL', sourceRef: 'IND-001' };
  assert.equal(validateApcSession(session({ requirements: [], pendingItems: [goodGap] })).valid, true);
});

test('T-I8-04 STATE representation gap requires targetState; CHARACTER forbids it', () => {
  const base = {
    pendingId: 'GAP-001',
    kind: 'REPRESENTATION_GAP',
    status: 'OPEN',
    critical: false,
    sourceLevel: 'INDIVIDUAL',
    sourceRef: 'IND-001',
    characterId: 'CH-003',
    previousPendingId: null,
    resolutionEvidenceRefs: [],
    propagation: [],
  };
  let r = validateApcSession(session({ requirements: [], pendingItems: [{ ...base, representationTarget: 'STATE' }] }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /targetState is required/);
  r = validateApcSession(session({ requirements: [], pendingItems: [{ ...base, representationTarget: 'CHARACTER', targetState: 'entero' }] }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /targetState must be absent/);
});

test('T-I8-05 critical must be explicit boolean', () => {
  const p = pending();
  delete p.critical;
  const r = validateApcSession(session({ pendingItems: [p] }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /critical must be boolean/);
});

test('T-I8-06 propagation is upward only', () => {
  const r = validateApcSession(session({
    pendingItems: [pending({ propagation: [{ level: 'PHOTO', ref: 'PH-001' }] })],
  }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /propagation must be strictly upward/);
});

test('T-I8-07 rejects more than one OPEN episode in same requirement series', () => {
  const r = validateApcSession(session({
    pendingItems: [
      pending(),
      pending({ pendingId: 'PEND-002', previousPendingId: null }),
    ],
  }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /more than one OPEN episode/);
});

test('T-I8-08 recurrence requires previous RESOLVED and same semantic series', () => {
  const first = pending({ status: 'RESOLVED', resolutionEvidenceRefs: [] });
  const second = pending({ pendingId: 'PEND-002', previousPendingId: 'PEND-001' });
  assert.equal(validateApcSession(session({ pendingItems: [first, second] })).valid, true);

  const badFirst = pending({ status: 'OPEN' });
  const bad = validateApcSession(session({ pendingItems: [badFirst, second] }));
  assert.equal(bad.valid, false);
  assert.match(bad.errors.join(' '), /previous episode PEND-001 must be RESOLVED/);
});

test('T-I8-09 transition OPEN->RESOLVED requires current qualifying evidence ref at transition time', () => {
  const before = session();
  const after = session({
    evidenceItems: [evidence()],
    pendingItems: [pending({
      status: 'RESOLVED',
      resolutionEvidenceRefs: [{ evidenceId: 'EV-001', revision: 1 }],
    })],
  });
  assert.equal(validateApcPendingTransition(before, after).valid, true);
});

test('T-I8-10 transition rejects resolution using historical non-current evidence', () => {
  const before = session();
  const after = session({
    evidenceItems: [
      evidence({ revision: 1, current: false }),
      evidence({ revision: 2, current: true, observedState: 'serrado' }),
    ],
    pendingItems: [pending({
      status: 'RESOLVED',
      resolutionEvidenceRefs: [{ evidenceId: 'EV-001', revision: 1 }],
    })],
  });
  after.revisions = [{
    revisionEventId: 'REV-EV-001-1-2',
    entityType: 'EVIDENCE',
    entityId: 'EV-001',
    fromRevision: 1,
    toRevision: 2,
    changedAt: '2026-09-21T19:05:00-03:00',
    changedBy: 'Alejandra',
    reason: 'corrected state',
  }];
  const r = validateApcPendingTransition(before, after);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /resolution transition evidence must be current/);
});

test('T-I8-11 RESOLVED episode remains historically valid if its resolution evidence later ceases to be current', () => {
  const s = session({
    evidenceItems: [
      evidence({ revision: 1, current: false }),
      evidence({ revision: 2, current: true, observedState: 'serrado' }),
    ],
    pendingItems: [pending({
      status: 'RESOLVED',
      resolutionEvidenceRefs: [{ evidenceId: 'EV-001', revision: 1 }],
    })],
  });
  s.revisions = [{
    revisionEventId: 'REV-EV-001-1-2',
    entityType: 'EVIDENCE',
    entityId: 'EV-001',
    fromRevision: 1,
    toRevision: 2,
    changedAt: '2026-09-21T19:05:00-03:00',
    changedBy: 'Alejandra',
    reason: 'corrected state',
  }];
  assert.equal(validateApcSession(s).valid, true);
});

test('T-I8-12 recurrent episode cannot fork from one predecessor', () => {
  const first = pending({ status: 'RESOLVED' });
  const a = pending({ pendingId: 'PEND-002', previousPendingId: 'PEND-001', status: 'RESOLVED' });
  const b = pending({ pendingId: 'PEND-003', previousPendingId: 'PEND-001', status: 'OPEN' });
  const r = validateApcSession(session({ pendingItems: [first, a, b] }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /forks at PEND-001/);
});


test('T-I8-13 RESOLVED pending cannot mutate propagation or resolutionEvidenceRefs', () => {
  const before = session({
    evidenceItems: [evidence()],
    pendingItems: [pending({
      status: 'RESOLVED',
      resolutionEvidenceRefs: [{ evidenceId: 'EV-001', revision: 1 }],
    })],
  });
  const after = structuredClone(before);
  after.pending[0].propagation = [];
  after.pending[0].resolutionEvidenceRefs = [];
  const r = validateApcPendingTransition(before, after);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /immutable field propagation/);
  assert.match(r.errors.join(' '), /RESOLVED resolutionEvidenceRefs are immutable/);
});

test('T-I8-14 OPEN unresolved requirement cannot resolve while requirement remains unsatisfied', () => {
  const before = session();
  const after = session({
    pendingItems: [pending({
      status: 'RESOLVED',
      resolutionEvidenceRefs: [],
    })],
  });
  const r = validateApcPendingTransition(before, after);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /can resolve only while its origin requirement is satisfied/);
});

test('T-I8-15 OPEN pending cannot accumulate resolutionEvidenceRefs before resolving', () => {
  const before = session();
  const after = session({
    evidenceItems: [evidence()],
    pendingItems: [pending({
      status: 'OPEN',
      resolutionEvidenceRefs: [{ evidenceId: 'EV-001', revision: 1 }],
    })],
  });
  const r = validateApcPendingTransition(before, after);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /OPEN episode must not contain resolutionEvidenceRefs|may change only on OPEN->RESOLVED transition/);
});
