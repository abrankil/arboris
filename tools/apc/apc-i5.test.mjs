import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApcSession } from './session-contract.mjs';
import { adaptRegisteredApcEvidenceToCharacterObservation, registeredApcEvidenceToAceEvidence } from './apc-to-character-observation.mjs';
import { normalizeEvidence } from '../canonical-identification/engine.mjs';

const dataset = {
  computableStatus: 'activo',
  allCharactersById: new Map([
    ['CH-003', { characterId: 'CH-003', allowedStates: ['entero','serrado'], pilotStatus: 'activo' }],
  ]),
};

function baseEvidence(overrides = {}) {
  return {
    evidenceId: 'EV-001',
    revision: 1,
    current: true,
    sessionId: 'APC-S-I5',
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
      confirmedAt: '2026-09-21T17:30:00-03:00',
    },
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: null,
    notes: null,
    ...overrides,
  };
}

function baseSession(evidence = [baseEvidence()]) {
  return {
    schemaVersion: 'apc-session-0.2',
    sessionId: 'APC-S-I5',
    status: 'OPEN',
    objective: 'I5 individual traceability',
    objectiveAssessment: { status: 'OPEN', assessedBy: null, assessedAt: null, notes: null },
    createdAt: '2026-09-21T17:30:00-03:00',
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
    ],
    photoEvidence: [
      {
        photoEvidenceId: 'PE-001',
        sourcePhoto: { photoRef: 'PH-001', fingerprintSha256: 'a'.repeat(64) },
        visibleStructures: ['hoja'],
      },
    ],
    individuals: [{ individualId: 'IND-001', status: 'OPEN' }],
    evidence,
    requirements: [],
    pending: [],
    contradictions: [],
    revisions: [],
  };
}

test('T-I5-01 rejects evidence without individualId', () => {
  const s = baseSession([baseEvidence({ individualId: null })]);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /evidence\.individualId is required/);
});

test('T-I5-02 rejects evidence with unknown individualId', () => {
  const s = baseSession([baseEvidence({ individualId: 'IND-GHOST' })]);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /Unknown evidence\.individualId IND-GHOST/);
});

test('T-I5-03 rejects evidence without photoId', () => {
  const s = baseSession([baseEvidence({ photoId: null })]);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /evidence\.photoId is required/);
});

test('T-I5-04 rejects evidence with unknown photoId', () => {
  const s = baseSession([baseEvidence({ photoId: 'PH-GHOST' })]);
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /Unknown evidence\.photoId PH-GHOST/);
});

test('T-I5-05 rejects evidence target absent from PHOTO.individualRefs', () => {
  const s = baseSession([baseEvidence({ individualId: 'IND-002' })]);
  s.individuals.push({ individualId: 'IND-002', status: 'OPEN' });
  const r = validateApcSession(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /IND-002 is not referenced by PHOTO PH-001/);
});

test('T-I5-06 accepts one photo with evidence targets for two declared individuals', () => {
  const ev1 = baseEvidence({ evidenceId: 'EV-001', individualId: 'IND-001' });
  const ev2 = baseEvidence({ evidenceId: 'EV-002', individualId: 'IND-002', observedState: 'serrado' });
  const s = baseSession([ev1, ev2]);
  s.individuals.push({ individualId: 'IND-002', status: 'OPEN' });
  s.photos[0].individualRefs = ['IND-001', 'IND-002'];
  const r = validateApcSession(s);
  assert.equal(r.valid, true);
});

test('T-I5-07 accepts the same individual referenced by multiple photos', () => {
  const s = baseSession([
    baseEvidence({ evidenceId: 'EV-001', photoId: 'PH-001', photoEvidenceRef: 'PE-001' }),
    baseEvidence({ evidenceId: 'EV-002', photoId: 'PH-002', photoEvidenceRef: 'PE-002', observedState: 'serrado' }),
  ]);
  s.photos.push({
    photoId: 'PH-002',
    fileRef: 'species/photo-2.jpg',
    capturedAt: null,
    location: null,
    individualRefs: ['IND-001'],
    photoEvidenceId: 'PE-002',
  });
  s.photoEvidence.push({
    photoEvidenceId: 'PE-002',
    sourcePhoto: { photoRef: 'PH-002', fingerprintSha256: 'b'.repeat(64) },
    visibleStructures: ['hoja'],
  });
  assert.equal(validateApcSession(s).valid, true);
});

test('T-I5-08 accepts individual without speciesHypothesis', () => {
  const s = baseSession();
  delete s.individuals[0].speciesHypothesis;
  assert.equal(validateApcSession(s).valid, true);
});

test('T-I5-09 provisional species hypothesis does not alter individual traceability', () => {
  const s = baseSession();
  s.individuals[0] = {
    individualId: 'IND-001',
    status: 'OPEN',
    speciesHypothesis: 'SP-002',
    hypothesisSource: 'Alejandra',
    hypothesisStatus: 'PROVISIONAL',
  };
  const r = validateApcSession(s);
  assert.equal(r.valid, true);
  assert.equal(r.indexes.individualsById.get('IND-001').speciesHypothesis, 'SP-002');
});

test('T-I5-10 individualId survives APC to CharacterObservation to ACE normalization', () => {
  const s = baseSession();
  const observation = adaptRegisteredApcEvidenceToCharacterObservation(dataset, s, 'EV-001', 1);
  assert.equal(observation.provenance.apc.individualId, 'IND-001');
  const ace = registeredApcEvidenceToAceEvidence(dataset, s, 'EV-001', 1);
  const [normalized] = normalizeEvidence([ace]);
  assert.equal(normalized.provenance.apc.individualId, 'IND-001');
});
