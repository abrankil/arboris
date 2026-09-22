import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApcSession } from './session-contract.mjs';
import { normalizeApcEvidenceStatus, denormalizeH16Status } from './evidence-lifecycle.mjs';
import { adaptRegisteredApcEvidenceToCharacterObservation, registeredApcEvidenceToAceEvidence } from './apc-to-character-observation.mjs';

const dataset = {
  computableStatus: 'activo',
  allCharactersById: new Map([
    ['CH-003', { characterId: 'CH-003', allowedStates: ['entero','serrado'], pilotStatus: 'activo' }],
    ['CH-007', { characterId: 'CH-007', allowedStates: ['presente','ausente'], pilotStatus: 'retirado' }],
  ]),
};

function baseEvidence(overrides = {}) {
  return {
    evidenceId: 'EV-001', revision: 1, current: true,
    sessionId: 'APC-S-001', photoId: 'PH-001', photoEvidenceRef: 'PE-001', individualId: 'IND-001',
    characterId: 'CH-003', evidenceStatus: 'OBSERVED', observedState: 'entero', lifecycleStatus: 'CONFIRMED',
    sourceType: 'human', sourceId: 'Alejandra',
    confirmation: { confirmedByType: 'human', confirmedById: 'Alejandra', confirmedAt: '2026-09-21T16:00:00-03:00' },
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null, reason: null, notes: null,
    ...overrides,
  };
}

function session(evidence = [baseEvidence()]) {
  return {
    schemaVersion: 'apc-session-0.2', sessionId: 'APC-S-001', status: 'OPEN', objective: 'Pilot I1-I4',
    objectiveAssessment: { status: 'OPEN', assessedBy: null, assessedAt: null, notes: null },
    createdAt: '2026-09-21T16:00:00-03:00', createdBy: 'Alejandra', inboxPhotoRefs: [],
    photos: [{ photoId: 'PH-001', fileRef: 'species/photo.jpg', capturedAt: null, location: null, individualRefs: ['IND-001'], photoEvidenceId: 'PE-001' }],
    photoEvidence: [{ photoEvidenceId: 'PE-001', sourcePhoto: { photoRef: 'PH-001', fingerprintSha256: 'a'.repeat(64) }, visibleStructures: ['hoja'] }],
    individuals: [{ individualId: 'IND-001', status: 'OPEN' }], evidence,
    requirements: [], pending: [], contradictions: [], revisions: [],
  };
}

// Audit correction: I1 strict session contract
test('I1 rejects wrong schemaVersion', () => { const s=session(); s.schemaVersion='garbage'; assert.equal(validateApcSession(s).valid,false); });
test('I1 rejects unknown session status', () => { const s=session(); s.status='BANANA'; assert.equal(validateApcSession(s).valid,false); });
test('I1 rejects missing objective', () => { const s=session(); s.objective=null; assert.equal(validateApcSession(s).valid,false); });
test('I1 rejects missing createdAt/createdBy', () => { const s=session(); s.createdAt=null; s.createdBy=''; assert.equal(validateApcSession(s).valid,false); });
test('I1 rejects invalid objectiveAssessment status', () => { const s=session(); s.objectiveAssessment.status='DONE'; assert.equal(validateApcSession(s).valid,false); });

// Audit correction: I2 full bidirectional PHOTO ↔ PhotoEvidence integrity
test('I2 rejects orphan PhotoEvidence sourcePhoto.photoRef', () => { const s=session(); s.photoEvidence[0].sourcePhoto.photoRef='PH-GHOST'; assert.equal(validateApcSession(s).valid,false); });
test('T-I2-ALIAS rejects two PHOTO records sharing a PhotoEvidence owned by only one PHOTO', () => {
  const s=session();
  s.photos.push({ photoId:'PH-002', fileRef:'species/photo-2.jpg', capturedAt:null, location:null, individualRefs:['IND-001'], photoEvidenceId:'PE-001' });
  const r=validateApcSession(s);
  assert.equal(r.valid,false);
  assert.match(r.errors.join(' '), /PH-002 references PhotoEvidence PE-001 owned by PHOTO PH-001/);
});
test('T-I1-INDIVIDUAL-ID rejects anonymous INDIVIDUAL records', () => {
  const s=session();
  s.individuals.push({ status:'OPEN' });
  const r=validateApcSession(s);
  assert.equal(r.valid,false);
  assert.match(r.errors.join(' '), /individual\.individualId is required/);
});

// T01
test('T01 DRAFT cannot handoff', () => { const s=session([baseEvidence({lifecycleStatus:'DRAFT'})]); assert.throws(()=>adaptRegisteredApcEvidenceToCharacterObservation(dataset,s,'EV-001',1), /CONFIRMED/); });
// T02
test('T02 registered CONFIRMED evidence reaches ACE', () => { const s=session(); const ace=registeredApcEvidenceToAceEvidence(dataset,s,'EV-001',1); assert.equal(ace.characterId,'CH-003'); assert.deepEqual(ace.observedStates,['entero']); });
// T03/T12
test('T03/T12 status normalization is reversible', () => { for(const [a,h] of [['OBSERVED','observed'],['UNCERTAIN','uncertain'],['NOT_OBSERVABLE','not_observable']]) { assert.equal(normalizeApcEvidenceStatus(a),h); assert.equal(denormalizeH16Status(h),a); } });
// T04 + audit correction
test('T04 provenance preserves full APC identity and confirmation', () => { const o=adaptRegisteredApcEvidenceToCharacterObservation(dataset,session(),'EV-001',1); assert.deepEqual(o.provenance.apc,{sessionId:'APC-S-001',evidenceId:'EV-001',individualId:'IND-001',revision:1,photoEvidenceRef:'PE-001',sourceType:'human',sourceId:'Alejandra',confirmation:{confirmedByType:'human',confirmedById:'Alejandra',confirmedAt:'2026-09-21T16:00:00-03:00'}}); });
// Audit correction: object not registered cannot handoff
test('adapter rejects evidence not registered in session.evidence[]', () => { assert.throws(()=>adaptRegisteredApcEvidenceToCharacterObservation(dataset,session([]),'EV-001',1), /Expected exactly one registered APC evidence/); });
// Audit correction: mandatory identity
test('handoff rejects missing evidenceId', () => { const ev=baseEvidence({evidenceId:null}); const s=session([ev]); assert.equal(validateApcSession(s).valid,false); });
test('handoff rejects missing revision', () => { const ev=baseEvidence({revision:null}); const s=session([ev]); assert.equal(validateApcSession(s).valid,false); });
// T13
test('T13 manual acquisition survives unchanged', () => { const o=adaptRegisteredApcEvidenceToCharacterObservation(dataset,session(),'EV-001',1); assert.equal(o.acquisition.mode,'manual'); });
// T14
test('T14 valid prefilled acquisition reaches handoff', () => { const ev=baseEvidence({acquisition:{mode:'prefilled',confirmedOnCurrentPhoto:true,basis:{type:'prior_observations',photoEvidenceRefs:['PE-001']}}}); const o=adaptRegisteredApcEvidenceToCharacterObservation(dataset,session([ev]),'EV-001',1); assert.equal(o.acquisition.mode,'prefilled'); });
// T15
test('T15 unconfirmed prefill is rejected', () => { const ev=baseEvidence({acquisition:{mode:'prefilled',confirmedOnCurrentPhoto:false,basis:{type:'prior_observations',photoEvidenceRefs:['PE-001']}}}); assert.throws(()=>adaptRegisteredApcEvidenceToCharacterObservation(dataset,session([ev]),'EV-001',1), /confirmedOnCurrentPhoto/); });
// T16
test('T16 imported evidence without original observer type does not handoff', () => { const ev=baseEvidence({sourceType:'imported',sourceId:'import-1'}); assert.throws(()=>adaptRegisteredApcEvidenceToCharacterObservation(dataset,session([ev]),'EV-001',1), /importMetadata\.observerType/); });
// T25
test('T25 CONFIRMED requires human confirmation', () => { const ev=baseEvidence({confirmation:null}); assert.throws(()=>adaptRegisteredApcEvidenceToCharacterObservation(dataset,session([ev]),'EV-001',1), /confirmation is required/); });
// T26
test('T26 automatic tool evidence without human confirmation cannot handoff', () => { const ev=baseEvidence({sourceType:'tool',sourceId:'observer-x',acquisition:{mode:'automatic'},confirmation:null}); assert.throws(()=>adaptRegisteredApcEvidenceToCharacterObservation(dataset,session([ev]),'EV-001',1), /confirmation is required/); });
// Minor correction: human is not encoded as tool
test('human producer maps to observer.type=human without observer.tool', () => { const o=adaptRegisteredApcEvidenceToCharacterObservation(dataset,session(),'EV-001',1); assert.deepEqual(o.observer,{type:'human'}); });
