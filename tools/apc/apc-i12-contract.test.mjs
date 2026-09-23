import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildApcI12Export,
  deriveApcI12SessionDiagnostics,
  normalizeFingerprintSha256,
  sameApcEvidenceNormativePayload,
  validateApcI12AssetAndCollectionInvariants,
  validateApcWritableWorkingSnapshot,
} from './apc-i12-contract.mjs';

const dataset = {
  allCharactersById: new Map([
    ['CH-003', { characterId: 'CH-003', allowedStates: ['entero','serrado'], pilotStatus: 'activo' }],
  ]),
};

const incompatible = (a, b) => a !== b;

function baseEvidence(overrides = {}) {
  return {
    evidenceId: 'EV-001',
    revision: 1,
    current: true,
    sessionId: 'APC-S-I12',
    photoId: 'PH-001',
    photoEvidenceRef: 'PE-001',
    individualId: 'IND-001',
    characterId: 'CH-003',
    evidenceStatus: 'OBSERVED',
    observedState: 'entero',
    lifecycleStatus: 'DRAFT',
    sourceType: 'human',
    sourceId: 'Alejandra',
    confirmation: null,
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: null,
    notes: null,
    ...overrides,
  };
}

function baseSession(overrides = {}) {
  return {
    schemaVersion: 'apc-session-0.2',
    sessionId: 'APC-S-I12',
    semanticRevision: 1,
    status: 'OPEN',
    objective: 'I12 UI verification',
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
    createdAt: '2026-09-22T01:00:00-03:00',
    createdBy: 'Alejandra',
    inboxPhotoRefs: ['PH-001'],
    photos: [{
      photoId: 'PH-001',
      fileRef: 'photo-1.jpg',
      capturedAt: null,
      location: null,
      individualRefs: ['IND-001'],
      photoEvidenceId: 'PE-001',
    }],
    photoEvidence: [{
      photoEvidenceId: 'PE-001',
      sourcePhoto: { photoRef: 'PH-001', fingerprintSha256: 'a'.repeat(64) },
      visibleStructures: [],
    }],
    individuals: [{ individualId: 'IND-001', status: 'OPEN' }],
    evidence: [baseEvidence()],
    requirements: [],
    pending: [],
    contradictions: [],
    revisions: [],
    ...overrides,
  };
}

test('TD-I12 asset invariants accept the canonical 1:1 PHOTO/PhotoEvidence shape', () => {
  assert.equal(validateApcI12AssetAndCollectionInvariants(baseSession()).valid, true);
});

test('TD-I12-67 duplicate inbox refs reject writer-ready snapshot', () => {
  const s = baseSession({ inboxPhotoRefs: ['PH-001','PH-001'] });
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /duplicate inboxPhotoRef/);
});

test('TD-I12-68 duplicate PHOTO individual refs reject writer-ready snapshot', () => {
  const s = baseSession();
  s.photos[0].individualRefs = ['IND-001','IND-001'];
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /duplicate individualRef/);
});

test('TD-I12-74 PHOTO requires explicit photoEvidenceId', () => {
  const s = baseSession();
  delete s.photos[0].photoEvidenceId;
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /photoEvidenceId is required/);
});

test('TD-I12-75 PHOTO to PhotoEvidence cardinality is total 1:1', () => {
  const s = baseSession();
  s.photos.push({
    photoId: 'PH-002',
    fileRef: 'photo-2.jpg',
    individualRefs: [],
    photoEvidenceId: 'PE-001',
  });
  const r = validateApcI12AssetAndCollectionInvariants(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /exactly one PHOTO|matching sourcePhoto/);
});

test('TD-I12-76 fingerprint identity is case-insensitive', () => {
  assert.equal(normalizeFingerprintSha256('A'.repeat(64)), 'a'.repeat(64));
  const s = baseSession();
  s.photos.push({
    photoId: 'PH-002',
    fileRef: 'photo-2.jpg',
    individualRefs: [],
    photoEvidenceId: 'PE-002',
  });
  s.photoEvidence.push({
    photoEvidenceId: 'PE-002',
    sourcePhoto: { photoRef: 'PH-002', fingerprintSha256: 'A'.repeat(64) },
    visibleStructures: [],
  });
  const r = validateApcI12AssetAndCollectionInvariants(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /duplicate fingerprintSha256/);
});

test('TD-I12-42 invalid lifecycle rejects persisted evidence', () => {
  const s = baseSession();
  s.evidence[0].lifecycleStatus = 'BANANA';
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /lifecycleStatus/);
});

test('TD-I12-43 current DRAFT observedState must exist in current dataset', () => {
  const s = baseSession();
  s.evidence[0].observedState = 'ghost-state';
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /observedState is not allowed/);
});

test('TD-I12-64 DRAFT cannot retain confirmation', () => {
  const s = baseSession();
  s.evidence[0].confirmation = {
    confirmedByType: 'human',
    confirmedById: 'Alejandra',
    confirmedAt: '2026-09-22T01:01:00-03:00',
  };
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /DRAFT confirmation/);
});

test('TD-I12-65 prefilled DRAFT requires traceable prior-observation basis', () => {
  const s = baseSession();
  s.evidence[0].acquisition = { mode: 'prefilled', confirmedOnCurrentPhoto: false, basis: null };
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /acquisition.basis/);
});

test('TD-I12-66 DRAFT sourceType/sourceId must be both absent or both present', () => {
  const bothAbsent = baseSession();
  delete bothAbsent.evidence[0].sourceType;
  delete bothAbsent.evidence[0].sourceId;
  assert.equal(
    validateApcWritableWorkingSnapshot(bothAbsent, { dataset, areStatesIncompatible: incompatible }).valid,
    true,
  );

  const oneSided = baseSession();
  delete oneSided.evidence[0].sourceId;
  const r = validateApcWritableWorkingSnapshot(oneSided, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /both absent or both present/);
});

test('DRAFT may omit acquisition while still remaining non-handoff evidence', () => {
  const s = baseSession();
  delete s.evidence[0].acquisition;
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, true);
});

test('TD-I12 control-plane rejects persisted pass/exportable', () => {
  const s = baseSession({ pass: false, exportable: false });
  const r = validateApcWritableWorkingSnapshot(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /must not be persisted/);
});

test('TD-I12 diagnostics keep structural/writer/export/pass/closed distinct', () => {
  const d = deriveApcI12SessionDiagnostics(baseSession(), { dataset, areStatesIncompatible: incompatible });
  assert.equal(d.structurallyValid, true);
  assert.equal(d.serializableWorkingSnapshot, true);
  assert.equal(d.writerReady, true);
  assert.equal(d.closed, false);
  assert.equal(typeof d.exportable, 'boolean');
  assert.equal(typeof d.pass, 'boolean');
});

test('TD-I12 export is gated by writer-ready validation', () => {
  const s = baseSession({ inboxPhotoRefs: ['PH-001','PH-001'] });
  const r = buildApcI12Export(s, { dataset, areStatesIncompatible: incompatible });
  assert.equal(r.exportable, false);
  assert.deepEqual(r.reasons, ['I12_NOT_WRITER_READY']);
});

test('TD-I12-63 normative payload comparison excludes only revision/current', () => {
  const a = baseEvidence();
  const b = { ...baseEvidence(), revision: 2, current: false };
  assert.equal(sameApcEvidenceNormativePayload(a, b), true);
  b.notes = 'changed';
  assert.equal(sameApcEvidenceNormativePayload(a, b), false);
});
