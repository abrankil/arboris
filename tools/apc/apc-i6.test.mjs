import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApcSession } from './session-contract.mjs';
import { adaptRegisteredApcEvidenceToCharacterObservation } from './apc-to-character-observation.mjs';

const dataset = {
  computableStatus: 'activo',
  allCharactersById: new Map([
    ['CH-003', { characterId: 'CH-003', allowedStates: ['entero', 'serrado'], pilotStatus: 'activo' }],
  ]),
};

function evidence(overrides = {}) {
  return {
    evidenceId: 'EV-001',
    revision: 1,
    current: true,
    sessionId: 'APC-S-I6',
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
      confirmedAt: '2026-09-21T18:00:00-03:00',
    },
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: null,
    notes: null,
    ...overrides,
  };
}

function revisionEvent(overrides = {}) {
  return {
    revisionEventId: 'REV-EV-001-1-2',
    entityType: 'EVIDENCE',
    entityId: 'EV-001',
    fromRevision: 1,
    toRevision: 2,
    changedAt: '2026-09-21T18:05:00-03:00',
    changedBy: 'Alejandra',
    reason: 'Correct observed state',
    ...overrides,
  };
}

function session(evidenceItems = [evidence()], revisions = []) {
  return {
    schemaVersion: 'apc-session-0.2',
    sessionId: 'APC-S-I6',
    status: 'OPEN',
    objective: 'I6 revisions/current',
    objectiveAssessment: { status: 'OPEN', assessedBy: null, assessedAt: null, notes: null },
    createdAt: '2026-09-21T18:00:00-03:00',
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
    requirements: [],
    pending: [],
    contradictions: [],
    revisions,
  };
}

function twoRevisionSession({
  rev1 = {},
  rev2 = {},
  event = {},
} = {}) {
  return session([
    evidence({ revision: 1, current: false, ...rev1 }),
    evidence({ revision: 2, current: true, observedState: 'serrado', ...rev2 }),
  ], [revisionEvent(event)]);
}

test('T-I6-01 accepts one revision with current=true and no revision event', () => {
  assert.equal(validateApcSession(session()).valid, true);
});

test('T-I6-02 rejects chain starting at revision 2', () => {
  const r = validateApcSession(session([evidence({ revision: 2 })]));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /revisions must be contiguous 1\.\.N/);
});

test('T-I6-03 rejects a revision gap', () => {
  const s = session([
    evidence({ revision: 1, current: false }),
    evidence({ revision: 3, current: true }),
  ], [
    revisionEvent({ fromRevision: 1, toRevision: 2 }),
    revisionEvent({ revisionEventId: 'REV-EV-001-2-3', fromRevision: 2, toRevision: 3 }),
  ]);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /revisions must be contiguous 1\.\.N/);
});

test('T-I6-04 rejects two current revisions', () => {
  const s = twoRevisionSession({ rev1: { current: true } });
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /exactly one current=true/);
});

test('T-I6-05 rejects zero current revisions', () => {
  const s = twoRevisionSession({ rev2: { current: false } });
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /exactly one current=true/);
});

test('T-I6-06 rejects current revision that is not max revision', () => {
  const s = twoRevisionSession({ rev1: { current: true }, rev2: { current: false } });
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /current=true must be max revision 2/);
});

test('T-I6-07 rejects non-boolean current', () => {
  const r = validateApcSession(session([evidence({ current: 'true' })]));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /current must be boolean/);
});

for (const [name, field, value] of [
  ['T-I6-08 sessionId', 'sessionId', 'APC-S-OTHER'],
  ['T-I6-09 photoId', 'photoId', 'PH-OTHER'],
  ['T-I6-10 photoEvidenceRef', 'photoEvidenceRef', 'PE-OTHER'],
  ['T-I6-11 individualId', 'individualId', 'IND-OTHER'],
  ['T-I6-12 characterId', 'characterId', 'CH-OTHER'],
]) {
  test(`${name} rejects immutable identity change across revisions`, () => {
    const s = twoRevisionSession({ rev2: { [field]: value } });
    if (field === 'photoId') {
      s.photos.push({ photoId: 'PH-OTHER', fileRef: 'species/other.jpg', capturedAt: null, location: null, individualRefs: ['IND-001'], photoEvidenceId: 'PE-OTHER' });
      s.photoEvidence.push({ photoEvidenceId: 'PE-OTHER', sourcePhoto: { photoRef: 'PH-OTHER', fingerprintSha256: 'b'.repeat(64) }, visibleStructures: ['hoja'] });
    }
    if (field === 'photoEvidenceRef') {
      s.photoEvidence.push({ photoEvidenceId: 'PE-OTHER', sourcePhoto: { photoRef: 'PH-001', fingerprintSha256: 'b'.repeat(64) }, visibleStructures: ['hoja'] });
    }
    if (field === 'individualId') {
      s.individuals.push({ individualId: 'IND-OTHER', status: 'OPEN' });
      s.photos[0].individualRefs.push('IND-OTHER');
    }
    const r = validateApcSession(s);
    assert.equal(r.valid, false);
    assert.match(r.errors.join(' '), new RegExp(`immutable identity field ${field}`));
  });
}

test('T-I6-13 rejects evidenceId with surrounding whitespace instead of normalizing silently', () => {
  const r = validateApcSession(session([evidence({ evidenceId: ' EV-001 ' })]));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /canonical string without surrounding whitespace/);
});

test('T-I6-14 rejects two revisions without required revision event', () => {
  const s = session([
    evidence({ revision: 1, current: false }),
    evidence({ revision: 2, current: true }),
  ], []);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /requires exactly 1 revision event/);
});

test('T-I6-15 accepts a complete adjacent revision event', () => {
  assert.equal(validateApcSession(twoRevisionSession()).valid, true);
});

test('T-I6-16 rejects non-adjacent revision event', () => {
  const s = session([
    evidence({ revision: 1, current: false }),
    evidence({ revision: 2, current: false }),
    evidence({ revision: 3, current: true }),
  ], [
    revisionEvent({ toRevision: 3 }),
    revisionEvent({ revisionEventId: 'REV-EV-001-2-3', fromRevision: 2, toRevision: 3 }),
  ]);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /must connect adjacent revisions/);
});

test('T-I6-17 rejects incomplete event history for three revisions', () => {
  const s = session([
    evidence({ revision: 1, current: false }),
    evidence({ revision: 2, current: false }),
    evidence({ revision: 3, current: true }),
  ], [revisionEvent()]);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /requires exactly 2 revision event/);
});

test('T-I6-18 rejects duplicate transition even with distinct event ids', () => {
  const s = twoRevisionSession();
  s.revisions.push(revisionEvent({ revisionEventId: 'REV-EV-001-1-2-B' }));
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /duplicate revision transition 1->2/);
});

test('T-I6-19 rejects event for unknown evidence', () => {
  const s = session();
  s.revisions.push(revisionEvent({ entityId: 'EV-GHOST' }));
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /references unknown evidence EV-GHOST/);
});

test('T-I6-20 rejects invalid changedAt', () => {
  const r = validateApcSession(twoRevisionSession({ event: { changedAt: 'yesterday' } }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /changedAt must be valid ISO-8601/);
});

test('T-I6-21 rejects missing changedBy and reason', () => {
  const r = validateApcSession(twoRevisionSession({ event: { changedBy: '', reason: null } }));
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /changedBy is required/);
  assert.match(r.errors.join(' '), /reason is required/);
});

test('T-I6-22 rejects revision event on a single-revision evidence', () => {
  const s = session();
  s.revisions.push(revisionEvent());
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /requires exactly 0 revision event/);
});

test('T-I6-23 allows mutable observed content across revisions', () => {
  const s = twoRevisionSession({
    rev1: { observedState: 'entero', notes: 'first observation' },
    rev2: { observedState: 'serrado', notes: 'corrected observation' },
  });
  assert.equal(validateApcSession(s).valid, true);
});

test('T-I6-24 rejects historical current=false revision at handoff', () => {
  const s = twoRevisionSession();
  assert.throws(
    () => adaptRegisteredApcEvidenceToCharacterObservation(dataset, s, 'EV-001', 1),
    /current must be true for handoff/,
  );
});

test('T-I6-25 accepts current max revision at handoff', () => {
  const s = twoRevisionSession();
  const observation = adaptRegisteredApcEvidenceToCharacterObservation(dataset, s, 'EV-001', 2);
  assert.equal(observation.observedState, 'serrado');
  assert.equal(observation.provenance.apc.revision, 2);
});

test('T-I6-26 rejects duplicate evidence version', () => {
  const s = session([
    evidence(),
    evidence(),
  ]);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /duplicate evidence version/);
});
