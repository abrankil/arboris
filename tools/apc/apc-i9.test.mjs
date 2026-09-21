import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateApcContradictions,
  validateApcContradictionTransition,
  validateApcSession,
} from './session-contract.mjs';

const incompatible = (a, b) => a !== b;

function evidence(overrides = {}) {
  return {
    evidenceId: 'EV-001',
    revision: 1,
    current: true,
    sessionId: 'APC-S-I9',
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
      confirmedAt: '2026-09-21T20:00:00-03:00',
    },
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: null,
    notes: null,
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
  evidenceItems = [],
  contradictions = [],
  revisions = [],
} = {}) {
  return {
    schemaVersion: 'apc-session-0.2',
    sessionId: 'APC-S-I9',
    status: 'OPEN',
    objective: 'I9 contradictions',
    objectiveAssessment: { status: 'OPEN', assessedBy: null, assessedAt: null, notes: null },
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
    requirements: [],
    pending: [],
    contradictions,
    revisions,
  };
}

function conflictingEvidence() {
  return [
    evidence({ evidenceId: 'EV-001', photoId: 'PH-001', photoEvidenceRef: 'PE-001', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-002', photoId: 'PH-002', photoEvidenceRef: 'PE-002', observedState: 'serrado' }),
  ];
}

test('T-I9-01 structural snapshot accepts one OPEN contradiction with two versioned refs', () => {
  const s = session({ evidenceItems: conflictingEvidence(), contradictions: [contradiction()] });
  assert.equal(validateApcSession(s).valid, true);
});

test('T-I9-02 rejects contradiction refs from different individual/character series', () => {
  const evs = conflictingEvidence();
  evs[1] = evidence({
    evidenceId: 'EV-002',
    photoId: 'PH-002',
    photoEvidenceRef: 'PE-002',
    individualId: 'IND-002',
    observedState: 'serrado',
  });
  const s = session({ evidenceItems: evs, contradictions: [contradiction()] });
  s.individuals.push({ individualId: 'IND-002', status: 'OPEN' });
  s.photos[1].individualRefs = ['IND-002'];
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /same individual\/character series/);
});

test('T-I9-03 rejects duplicate logical evidenceId revisions in one trigger snapshot', () => {
  const evs = [
    evidence({ revision: 1, current: false, observedState: 'entero' }),
    evidence({ revision: 2, current: true, observedState: 'serrado' }),
  ];
  const s = session({
    evidenceItems: evs,
    contradictions: [contradiction({
      evidenceRefs: [
        { evidenceId: 'EV-001', revision: 1 },
        { evidenceId: 'EV-001', revision: 2 },
      ],
    })],
    revisions: [{
      revisionEventId: 'REV-EV-001-1-2',
      entityType: 'EVIDENCE',
      entityId: 'EV-001',
      fromRevision: 1,
      toRevision: 2,
      changedAt: '2026-09-21T20:05:00-03:00',
      changedBy: 'Alejandra',
      reason: 'corrected state',
    }],
  });
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /at most one revision of evidenceId EV-001/);
});

test('T-I9-04 semantic validator requires an OPEN contradiction for current incompatible evidence', () => {
  const s = session({ evidenceItems: conflictingEvidence(), contradictions: [] });
  const r = validateApcContradictions(s, { areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /current incompatible evidence but no OPEN contradiction/);
});

test('T-I9-05 semantic validator accepts matching OPEN contradiction', () => {
  const s = session({ evidenceItems: conflictingEvidence(), contradictions: [contradiction()] });
  assert.equal(validateApcContradictions(s, { areStatesIncompatible: incompatible }).valid, true);
});

test('T-I9-06 semantic validator does not treat equal strings as incompatible when callback says compatible', () => {
  const evs = [
    evidence({ evidenceId: 'EV-001', photoId: 'PH-001', photoEvidenceRef: 'PE-001', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-002', photoId: 'PH-002', photoEvidenceRef: 'PE-002', observedState: 'entero' }),
  ];
  const s = session({ evidenceItems: evs, contradictions: [] });
  assert.equal(validateApcContradictions(s, { areStatesIncompatible: incompatible }).valid, true);
});

test('T-I9-07 semantic incompatibility is supplied externally, not inferred from string inequality', () => {
  const s = session({ evidenceItems: conflictingEvidence(), contradictions: [] });
  const alwaysCompatible = () => false;
  assert.equal(validateApcContradictions(s, { areStatesIncompatible: alwaysCompatible }).valid, true);
});

test('T-I9-08 rejects OPEN contradiction when current operational set no longer conflicts', () => {
  const evs = [
    evidence({ evidenceId: 'EV-001', photoId: 'PH-001', photoEvidenceRef: 'PE-001', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-002', photoId: 'PH-002', photoEvidenceRef: 'PE-002', observedState: 'entero' }),
  ];
  const c = contradiction();
  const r = validateApcContradictions(session({ evidenceItems: evs, contradictions: [c] }), {
    areStatesIncompatible: incompatible,
  });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /OPEN contradiction but no current incompatible pair/);
});

test('T-I9-09 transition creates contradiction only from current CONFIRMED OBSERVED trigger evidence', () => {
  const before = session({ evidenceItems: conflictingEvidence(), contradictions: [] });
  const after = session({ evidenceItems: conflictingEvidence(), contradictions: [contradiction()] });
  assert.equal(validateApcContradictionTransition(before, after, { areStatesIncompatible: incompatible }).valid, true);

  const badAfter = structuredClone(after);
  badAfter.evidence[1].current = false;
  const bad = validateApcContradictionTransition(before, badAfter, { areStatesIncompatible: incompatible });
  assert.equal(bad.valid, false);
  assert.match(bad.errors.join(' '), /trigger evidence must be current CONFIRMED OBSERVED/);
});

test('T-I9-10 OPEN->RESOLVED is valid only after current incompatibility disappears', () => {
  const before = session({ evidenceItems: conflictingEvidence(), contradictions: [contradiction()] });

  const afterStillConflicting = structuredClone(before);
  afterStillConflicting.contradictions[0].status = 'RESOLVED';
  const bad = validateApcContradictionTransition(before, afterStillConflicting, { areStatesIncompatible: incompatible });
  assert.equal(bad.valid, false);
  assert.match(bad.errors.join(' '), /OPEN->RESOLVED requires no current incompatible pair|current incompatible evidence but no OPEN contradiction/);

  const afterResolved = session({
    evidenceItems: [
      evidence({ evidenceId: 'EV-001', photoId: 'PH-001', photoEvidenceRef: 'PE-001', observedState: 'entero' }),
      evidence({ evidenceId: 'EV-002', revision: 1, current: false, photoId: 'PH-002', photoEvidenceRef: 'PE-002', observedState: 'serrado' }),
      evidence({ evidenceId: 'EV-002', revision: 2, current: true, photoId: 'PH-002', photoEvidenceRef: 'PE-002', observedState: 'entero' }),
    ],
    contradictions: [contradiction({ status: 'RESOLVED' })],
    revisions: [{
      revisionEventId: 'REV-EV-002-1-2',
      entityType: 'EVIDENCE',
      entityId: 'EV-002',
      fromRevision: 1,
      toRevision: 2,
      changedAt: '2026-09-21T20:10:00-03:00',
      changedBy: 'Alejandra',
      reason: 'corrected state',
    }],
  });
  assert.equal(validateApcContradictionTransition(before, afterResolved, { areStatesIncompatible: incompatible }).valid, true);
});

test('T-I9-11 RESOLVED contradiction is terminal and evidenceRefs are immutable', () => {
  const base = session({
    evidenceItems: conflictingEvidence(),
    contradictions: [contradiction({ status: 'RESOLVED' })],
  });
  const reopened = structuredClone(base);
  reopened.contradictions[0].status = 'OPEN';
  let r = validateApcContradictionTransition(base, reopened, { areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /RESOLVED status is terminal/);

  const mutated = structuredClone(base);
  mutated.contradictions[0].evidenceRefs = [
    { evidenceId: 'EV-001', revision: 1 },
    { evidenceId: 'EV-001', revision: 1 },
  ];
  r = validateApcContradictionTransition(base, mutated, { areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /immutable field evidenceRefs/);
});

test('T-I9-12 recurrence requires resolved direct predecessor and preserves series', () => {
  const first = contradiction({ status: 'RESOLVED' });
  const second = contradiction({
    contradictionId: 'CON-002',
    previousContradictionId: 'CON-001',
  });
  const s = session({ evidenceItems: conflictingEvidence(), contradictions: [first, second] });
  assert.equal(validateApcSession(s).valid, true);

  const bad = session({
    evidenceItems: conflictingEvidence(),
    contradictions: [
      contradiction({ status: 'OPEN' }),
      second,
    ],
  });
  const r = validateApcSession(bad);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /previous episode CON-001 must be RESOLVED|more than one OPEN episode/);
});

test('T-I9-13 recurrence chain cannot fork', () => {
  const root = contradiction({ status: 'RESOLVED' });
  const a = contradiction({ contradictionId: 'CON-002', status: 'RESOLVED', previousContradictionId: 'CON-001' });
  const b = contradiction({ contradictionId: 'CON-003', status: 'OPEN', previousContradictionId: 'CON-001' });
  const r = validateApcSession(session({ evidenceItems: conflictingEvidence(), contradictions: [root, a, b] }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /forks at CON-001/);
});


test('T-I9-14 RESOLVED historical trigger is not revalidated under later incompatibility semantics', () => {
  const s = session({
    evidenceItems: conflictingEvidence(),
    contradictions: [contradiction({ status: 'RESOLVED' })],
  });
  const alwaysCompatible = () => false;
  const r = validateApcContradictions(s, { areStatesIncompatible: alwaysCompatible });
  assert.equal(r.valid, true);
});

test('T-I9-15 new contradiction creation still requires incompatible trigger evidence at transition time', () => {
  const evs = conflictingEvidence();
  const before = session({ evidenceItems: evs, contradictions: [] });
  const after = session({ evidenceItems: evs, contradictions: [contradiction()] });
  const alwaysCompatible = () => false;
  const r = validateApcContradictionTransition(before, after, { areStatesIncompatible: alwaysCompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /trigger evidence must contain an incompatible pair/);
});
