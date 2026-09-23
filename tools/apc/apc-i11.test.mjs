import test, { before } from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalDataset, getRelation } from '../canonical-identification/dataset.mjs';
import { runApcIndividualThroughAce } from './apc-i11-e2e.mjs';

let dataset;

const incompatible = (a, b) => a !== b;

before(async () => {
  dataset = await loadCanonicalDataset();
});

function evidence(overrides = {}) {
  const evidenceId = overrides.evidenceId ?? 'EV-001';
  const suffix = evidenceId.replace(/[^A-Za-z0-9]/g, '').slice(-8) || '001';
  return {
    evidenceId,
    revision: 1,
    current: true,
    sessionId: 'APC-S-I11',
    photoId: `PH-${suffix}`,
    photoEvidenceRef: `PE-${suffix}`,
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
      confirmedAt: '2026-09-21T21:30:00-03:00',
    },
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: null,
    notes: null,
    evidence: [],
    ...overrides,
  };
}

function makePhotoEvidence(evidenceItems) {
  const byPhoto = new Map();
  for (const item of evidenceItems) {
    if (!byPhoto.has(item.photoId)) {
      byPhoto.set(item.photoId, {
        photoId: item.photoId,
        photoEvidenceRef: item.photoEvidenceRef,
        individualIds: new Set(),
      });
    }
    byPhoto.get(item.photoId).individualIds.add(item.individualId);
  }

  // Always include one independent photo for PHOTO-scope pending tests.
  byPhoto.set('PH-PENDING', {
    photoId: 'PH-PENDING',
    photoEvidenceRef: 'PE-PENDING',
    individualIds: new Set(['IND-001']),
  });

  const rows = [...byPhoto.values()];
  return {
    photos: rows.map((row, index) => ({
      photoId: row.photoId,
      fileRef: `species/${row.photoId}.jpg`,
      capturedAt: null,
      location: null,
      individualRefs: [...row.individualIds],
      photoEvidenceId: row.photoEvidenceRef,
    })),
    photoEvidence: rows.map((row, index) => ({
      photoEvidenceId: row.photoEvidenceRef,
      sourcePhoto: {
        photoRef: row.photoId,
        fingerprintSha256: (index % 2 === 0 ? 'a' : 'b').repeat(64),
      },
      visibleStructures: ['hoja'],
    })),
  };
}

function session({
  evidenceItems = [],
  requirements = [],
  pending = [],
  contradictions = [],
  revisions = [],
  individuals = null,
} = {}) {
  const derivedIndividuals = new Set(['IND-001']);
  for (const item of evidenceItems) derivedIndividuals.add(item.individualId);
  const photoData = makePhotoEvidence(evidenceItems);

  return {
    schemaVersion: 'apc-session-0.2',
    sessionId: 'APC-S-I11',
    semanticRevision: 1,
    status: 'OPEN',
    objective: 'I11 E2E verification',
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
    createdAt: '2026-09-21T21:00:00-03:00',
    createdBy: 'Alejandra',
    inboxPhotoRefs: [],
    photos: photoData.photos,
    photoEvidence: photoData.photoEvidence,
    individuals: individuals ?? [...derivedIndividuals].map(individualId => ({
      individualId,
      status: 'OPEN',
    })),
    evidence: evidenceItems,
    requirements,
    pending,
    contradictions,
    revisions,
  };
}

function compatibleSpecs(speciesId, count = 2) {
  const specs = [];
  for (const character of dataset.characters) {
    const relation = getRelation(dataset, speciesId, character.characterId);
    if (!relation?.expectedStates?.length) continue;
    specs.push({
      characterId: character.characterId,
      observedState: relation.expectedStates[0],
    });
    if (specs.length === count) break;
  }
  assert.equal(specs.length, count, 'test setup requires enough computable relations');
  return specs;
}

function unresolvedPhotoPending() {
  return {
    pendingId: 'PEND-PHOTO',
    kind: 'UNRESOLVED_REQUIREMENT',
    status: 'OPEN',
    critical: false,
    originRequirementId: 'REQ-PHOTO',
    scopeLevel: 'PHOTO',
    scopeRef: 'PH-PENDING',
    characterId: 'CH-003',
    previousPendingId: null,
    resolutionEvidenceRefs: [],
    propagation: [
      { level: 'INDIVIDUAL', ref: 'IND-001' },
      { level: 'SESSION', ref: 'APC-S-I11' },
    ],
  };
}

function gapIndividual() {
  return {
    pendingId: 'GAP-IND',
    kind: 'REPRESENTATION_GAP',
    status: 'OPEN',
    critical: false,
    sourceLevel: 'INDIVIDUAL',
    sourceRef: 'IND-001',
    characterId: 'CH-003',
    representationTarget: 'CHARACTER',
    previousPendingId: null,
    resolutionEvidenceRefs: [],
    propagation: [{ level: 'SESSION', ref: 'APC-S-I11' }],
  };
}

function gapSession() {
  return {
    pendingId: 'GAP-SESSION',
    kind: 'REPRESENTATION_GAP',
    status: 'OPEN',
    critical: false,
    sourceLevel: 'SESSION',
    sourceRef: 'APC-S-I11',
    characterId: 'CH-003',
    representationTarget: 'CHARACTER',
    previousPendingId: null,
    resolutionEvidenceRefs: [],
    propagation: [],
  };
}

test('T-I11-01 CONFIRMED current OBSERVED reaches ACE with complete APC provenance', () => {
  const ev = evidence();
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [ev] }),
    individualId: 'IND-001',
  });

  assert.equal(result.selectedApcEvidence.length, 1);
  assert.equal(result.handoffEvidence.length, 1);
  assert.deepEqual(result.handoffEvidence[0].observedStates, ['entero']);
  assert.deepEqual(result.handoffEvidence[0].provenance.apc, {
    sessionId: 'APC-S-I11',
    evidenceId: 'EV-001',
    individualId: 'IND-001',
    revision: 1,
    photoEvidenceRef: ev.photoEvidenceRef,
    sourceType: 'human',
    sourceId: 'Alejandra',
    confirmation: ev.confirmation,
  });
});

test('T-I11-02 DRAFT evidence is excluded', () => {
  const draft = evidence({ lifecycleStatus: 'DRAFT' });
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [draft] }),
    individualId: 'IND-001',
  });
  assert.equal(result.selectedApcEvidence.length, 0);
  assert.equal(result.handoffEvidence.length, 0);
});

test('T-I11-03 historical current=false revision is excluded', () => {
  const v1 = evidence({ evidenceId: 'EV-HIST', revision: 1, current: false });
  const v2 = evidence({ evidenceId: 'EV-HIST', revision: 2, current: true });
  const revisions = [{
    revisionEventId: 'REV-EV-HIST-1-2',
    entityType: 'EVIDENCE',
    entityId: 'EV-HIST',
    fromRevision: 1,
    toRevision: 2,
    changedAt: '2026-09-21T21:35:00-03:00',
    changedBy: 'Alejandra',
    reason: 'correction',
  }];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [v1, v2], revisions }),
    individualId: 'IND-001',
  });
  assert.deepEqual(result.selectedApcEvidence.map(item => item.revision), [2]);
});

test('T-I11-04 evidence from another individual is excluded', () => {
  const own = evidence({ evidenceId: 'EV-OWN' });
  const other = evidence({ evidenceId: 'EV-OTHER', individualId: 'IND-002' });
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [other, own] }),
    individualId: 'IND-001',
  });
  assert.deepEqual(result.selectedApcEvidence.map(item => item.evidenceId), ['EV-OWN']);
});

test('T-I11-05 UNCERTAIN remains non-positive in ACE', () => {
  const ev = evidence({
    evidenceStatus: 'UNCERTAIN',
    observedState: null,
    reason: 'image ambiguous',
  });
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [ev] }),
    individualId: 'IND-001',
  });
  assert.equal(result.handoffEvidence[0].observationStatus, 'uncertain');
  assert.deepEqual(result.handoffEvidence[0].observedStates, []);
});

test('T-I11-06 NOT_OBSERVABLE remains non-positive in ACE', () => {
  const ev = evidence({
    evidenceStatus: 'NOT_OBSERVABLE',
    observedState: null,
    reason: 'structure not visible',
  });
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [ev] }),
    individualId: 'IND-001',
  });
  assert.equal(result.handoffEvidence[0].observationStatus, 'not_observable');
  assert.deepEqual(result.handoffEvidence[0].observedStates, []);
});

test('T-I11-07 two evaluable dimensions can produce supported under ACE H15 contract', () => {
  const speciesId = dataset.species[0].speciesId;
  const [a, b] = compatibleSpecs(speciesId, 2);
  const evs = [
    evidence({ evidenceId: 'EV-A', ...a }),
    evidence({ evidenceId: 'EV-B', ...b }),
  ];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: evs }),
    individualId: 'IND-001',
    candidateIds: [speciesId],
  });
  assert.equal(result.aceAssessment.status, 'supported');
});

test('T-I11-08 repeated observations of one character remain one ACE dimension', () => {
  const speciesId = dataset.species[0].speciesId;
  const [spec] = compatibleSpecs(speciesId, 1);
  const evs = [
    evidence({ evidenceId: 'EV-A', ...spec }),
    evidence({ evidenceId: 'EV-B', ...spec }),
  ];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: evs }),
    individualId: 'IND-001',
    candidateIds: [speciesId],
  });
  assert.equal(result.aceAssessment.status, 'tentative');
});

test('T-I11-09 OPEN contradiction preserves APC evidence but suspends the character from ACE', () => {
  const evs = [
    evidence({ evidenceId: 'EV-A', characterId: 'CH-003', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-B', characterId: 'CH-003', observedState: 'serrado' }),
  ];
  const contradictions = [{
    contradictionId: 'CON-001',
    individualId: 'IND-001',
    characterId: 'CH-003',
    status: 'OPEN',
    evidenceRefs: [
      { evidenceId: 'EV-A', revision: 1 },
      { evidenceId: 'EV-B', revision: 1 },
    ],
    previousContradictionId: null,
  }];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: evs, contradictions }),
    individualId: 'IND-001',
    areStatesIncompatible: incompatible,
  });
  assert.equal(result.selectedApcEvidence.length, 2);
  assert.equal(result.handoffEvidence.length, 0);
  assert.equal(result.excludedFromAce.length, 2);
  assert.deepEqual(
    result.excludedFromAce.map(item => ({
      evidenceId: item.evidenceId,
      exclusionCategory: item.exclusionCategory,
      reason: item.reason,
      contradictionId: item.contradictionId,
    })),
    [
      {
        evidenceId: 'EV-A',
        exclusionCategory: 'APC_OPERATIONAL',
        reason: 'open_contradiction',
        contradictionId: 'CON-001',
      },
      {
        evidenceId: 'EV-B',
        exclusionCategory: 'APC_OPERATIONAL',
        reason: 'open_contradiction',
        contradictionId: 'CON-001',
      },
    ],
  );
  assert.equal(result.context.contradictions.length, 1);
});

test('T-I11-10 pending and representation gaps remain diagnostic context only', () => {
  const requirements = [{
    requirementId: 'REQ-PHOTO',
    scopeLevel: 'PHOTO',
    scopeRef: 'PH-PENDING',
    characterId: 'CH-003',
    required: true,
    reason: 'H16_VERIFICATION',
    createdBy: 'Alejandra',
  }];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({
      requirements,
      pending: [gapSession(), unresolvedPhotoPending(), gapIndividual()],
    }),
    individualId: 'IND-001',
  });
  assert.equal(result.handoffEvidence.length, 0);
  assert.deepEqual(
    result.context.pending.map(item => item.pendingId),
    ['GAP-IND', 'PEND-PHOTO'],
  );
});

test('T-I11-11 ad hoc provisional hypothesis fields are ignored', () => {
  const s = session({
    individuals: [{
      individualId: 'IND-001',
      status: 'OPEN',
      speciesHypothesis: 'SP-006',
      workingSpeciesId: 'SP-006',
    }],
  });
  const result = runApcIndividualThroughAce({
    dataset,
    session: s,
    individualId: 'IND-001',
  });
  assert.equal(result.context.provisionalHypothesis, null);
  assert.deepEqual(
    result.aceAssessment.remaining,
    dataset.species.map(item => item.speciesId),
  );
});

test('T-I11-12 explicit candidateIds are delegated to ACE without I11 reordering', () => {
  const ids = [dataset.species[1].speciesId, dataset.species[0].speciesId, dataset.species[1].speciesId];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session(),
    individualId: 'IND-001',
    candidateIds: ids,
  });
  assert.deepEqual(result.aceAssessment.remaining, [ids[0], ids[1]]);
});

test('T-I11-13 unknown individualId fails explicitly', () => {
  assert.throws(
    () => runApcIndividualThroughAce({
      dataset,
      session: session(),
      individualId: 'IND-999',
    }),
    /Unknown individualId: IND-999/,
  );
});

test('T-I11-14 handoff-invalid selected candidate fails and is not reclassified as ACE exclusion', () => {
  const invalid = evidence({ sourceId: null });
  assert.throws(
    () => runApcIndividualThroughAce({
      dataset,
      session: session({ evidenceItems: [invalid] }),
      individualId: 'IND-001',
    }),
    /not handoff-eligible.*sourceType and sourceId are required/,
  );
});

test('T-I11-15 semantically equivalent evidence order produces the same canonical result', () => {
  const speciesId = dataset.species[0].speciesId;
  const [a, b] = compatibleSpecs(speciesId, 2);
  const evA = evidence({ evidenceId: 'EV-Z', ...a });
  const evB = evidence({ evidenceId: 'EV-A', ...b });
  const s1 = session({ evidenceItems: [evA, evB] });
  const s2 = session({ evidenceItems: [evB, evA] });

  const r1 = runApcIndividualThroughAce({
    dataset,
    session: s1,
    individualId: 'IND-001',
    candidateIds: [speciesId],
  });
  const r2 = runApcIndividualThroughAce({
    dataset,
    session: s2,
    individualId: 'IND-001',
    candidateIds: [speciesId],
  });

  assert.deepEqual(r1, r2);
});

test('T-I11-16 known non-computable character is traced in excludedFromAce without global failure', () => {
  const ev = evidence({
    evidenceId: 'EV-NONCOMP',
    characterId: 'CH-007',
    observedState: 'presente',
  });
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [ev] }),
    individualId: 'IND-001',
  });
  assert.equal(result.selectedApcEvidence.length, 1);
  assert.equal(result.handoffEvidence.length, 0);
  assert.deepEqual(result.excludedFromAce, [{
    evidenceId: 'EV-NONCOMP',
    revision: 1,
    characterId: 'CH-007',
    exclusionCategory: 'ACE_ELIGIBILITY',
    reason: 'non_computable_character',
    contradictionId: null,
    canonicalStatus: 'retirado',
  }]);
});

test('T-I11-17 SESSION-scope/source pending is not attributed to individual context', () => {
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ pending: [gapSession()] }),
    individualId: 'IND-001',
  });
  assert.deepEqual(result.context.pending, []);
});

test('T-I11-18 photoEvidenceRef is preserved exactly through ACE provenance', () => {
  const ev = evidence({ photoEvidenceRef: 'PE-TRACE', photoId: 'PH-TRACE' });
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [ev] }),
    individualId: 'IND-001',
  });
  assert.equal(
    result.handoffEvidence[0].provenance.apc.photoEvidenceRef,
    'PE-TRACE',
  );
});

test('I11 explicit unknown candidate species fails through canonical ACE validation', () => {
  assert.throws(
    () => runApcIndividualThroughAce({
      dataset,
      session: session(),
      individualId: 'IND-001',
      candidateIds: ['SP-999'],
    }),
    /Unknown candidate species_id SP-999/,
  );
});


test('T-I11-R4-01 OPEN contradiction suspends only the target character and ACE continues with other dimensions', () => {
  const speciesId = dataset.species[0].speciesId;
  const conflictCharacter = 'CH-003';
  const allowed = dataset.charactersById.get(conflictCharacter).allowedStates;
  assert.ok(allowed.length >= 2, 'test setup requires CH-003 to expose at least two allowed states');
  const otherSpecs = [];
  for (const character of dataset.characters) {
    if (character.characterId === conflictCharacter) continue;
    const relation = getRelation(dataset, speciesId, character.characterId);
    if (!relation?.expectedStates?.length) continue;
    otherSpecs.push({
      characterId: character.characterId,
      observedState: relation.expectedStates[0],
    });
    if (otherSpecs.length === 2) break;
  }
  assert.equal(otherSpecs.length, 2, 'test setup requires two additional computable relations');
  const evs = [
    evidence({ evidenceId: 'EV-C1', characterId: conflictCharacter, observedState: allowed[0] }),
    evidence({ evidenceId: 'EV-C2', characterId: conflictCharacter, observedState: allowed[1] }),
    evidence({ evidenceId: 'EV-OTHER-1', ...otherSpecs[0] }),
    evidence({ evidenceId: 'EV-OTHER-2', ...otherSpecs[1] }),
  ];
  const contradictions = [{
    contradictionId: 'CON-R4-01',
    individualId: 'IND-001',
    characterId: conflictCharacter,
    status: 'OPEN',
    evidenceRefs: [
      { evidenceId: 'EV-C1', revision: 1 },
      { evidenceId: 'EV-C2', revision: 1 },
    ],
    previousContradictionId: null,
  }];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: evs, contradictions }),
    individualId: 'IND-001',
    candidateIds: [speciesId],
    areStatesIncompatible: incompatible,
  });
  assert.deepEqual(
    result.handoffEvidence.map(item => item.characterId),
    [otherSpecs[0].characterId, otherSpecs[1].characterId].sort(),
  );
  assert.equal(result.aceAssessment.status, 'supported');
});

test('T-I11-R4-02 OPEN contradiction for another individual does not suspend target individual character', () => {
  const evTarget = evidence({ evidenceId: 'EV-TARGET', characterId: 'CH-003', observedState: 'entero' });
  const evOtherA = evidence({ evidenceId: 'EV-OTHER-A', individualId: 'IND-002', characterId: 'CH-003', observedState: 'entero' });
  const evOtherB = evidence({ evidenceId: 'EV-OTHER-B', individualId: 'IND-002', characterId: 'CH-003', observedState: 'serrado' });
  const contradictions = [{
    contradictionId: 'CON-OTHER',
    individualId: 'IND-002',
    characterId: 'CH-003',
    status: 'OPEN',
    evidenceRefs: [
      { evidenceId: 'EV-OTHER-A', revision: 1 },
      { evidenceId: 'EV-OTHER-B', revision: 1 },
    ],
    previousContradictionId: null,
  }];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [evTarget, evOtherA, evOtherB], contradictions }),
    individualId: 'IND-001',
    areStatesIncompatible: incompatible,
  });
  assert.equal(result.handoffEvidence.length, 1);
  assert.equal(result.handoffEvidence[0].characterId, 'CH-003');
});

test('T-I11-R4-03 RESOLVED contradiction does not suspend current valid evidence or revive historical revisions', () => {
  const v1 = evidence({ evidenceId: 'EV-R', revision: 1, current: false, observedState: 'serrado' });
  const v2 = evidence({ evidenceId: 'EV-R', revision: 2, current: true, observedState: 'entero' });
  const peer = evidence({ evidenceId: 'EV-P', observedState: 'entero' });
  const contradictions = [{
    contradictionId: 'CON-RES',
    individualId: 'IND-001',
    characterId: 'CH-003',
    status: 'RESOLVED',
    evidenceRefs: [
      { evidenceId: 'EV-R', revision: 1 },
      { evidenceId: 'EV-P', revision: 1 },
    ],
    previousContradictionId: null,
  }];
  const revisions = [{
    revisionEventId: 'REV-EV-R-1-2',
    entityType: 'EVIDENCE',
    entityId: 'EV-R',
    fromRevision: 1,
    toRevision: 2,
    changedAt: '2026-09-21T21:35:00-03:00',
    changedBy: 'Alejandra',
    reason: 'correction',
  }];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: [v1, v2, peer], contradictions, revisions }),
    individualId: 'IND-001',
    areStatesIncompatible: incompatible,
  });
  assert.deepEqual(result.selectedApcEvidence.map(item => [item.evidenceId, item.revision]), [
    ['EV-P', 1],
    ['EV-R', 2],
  ]);
  assert.equal(result.handoffEvidence.length, 2);
  assert.equal(result.excludedFromAce.length, 0);
});

test('T-I11-R4-04 OPEN contradiction suspends the whole character dimension including neutral observations', () => {
  const evs = [
    evidence({ evidenceId: 'EV-A', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-B', observedState: 'serrado' }),
    evidence({
      evidenceId: 'EV-U',
      evidenceStatus: 'UNCERTAIN',
      observedState: null,
      reason: 'ambiguous',
    }),
  ];
  const contradictions = [{
    contradictionId: 'CON-DIM',
    individualId: 'IND-001',
    characterId: 'CH-003',
    status: 'OPEN',
    evidenceRefs: [
      { evidenceId: 'EV-A', revision: 1 },
      { evidenceId: 'EV-B', revision: 1 },
    ],
    previousContradictionId: null,
  }];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: evs, contradictions }),
    individualId: 'IND-001',
    areStatesIncompatible: incompatible,
  });
  assert.equal(result.selectedApcEvidence.length, 3);
  assert.equal(result.handoffEvidence.length, 0);
  assert.equal(result.excludedFromAce.length, 3);
  assert.ok(result.excludedFromAce.every(item => item.reason === 'open_contradiction'));
});

test('T-I11-R4-05 candidateIds remain delegated unchanged while contradiction filtering affects only evidence', () => {
  const ids = [dataset.species[1].speciesId, dataset.species[0].speciesId];
  const evs = [
    evidence({ evidenceId: 'EV-A', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-B', observedState: 'serrado' }),
  ];
  const contradictions = [{
    contradictionId: 'CON-CAND',
    individualId: 'IND-001',
    characterId: 'CH-003',
    status: 'OPEN',
    evidenceRefs: [
      { evidenceId: 'EV-A', revision: 1 },
      { evidenceId: 'EV-B', revision: 1 },
    ],
    previousContradictionId: null,
  }];
  const result = runApcIndividualThroughAce({
    dataset,
    session: session({ evidenceItems: evs, contradictions }),
    individualId: 'IND-001',
    candidateIds: ids,
    areStatesIncompatible: incompatible,
  });
  assert.deepEqual(result.aceAssessment.remaining, ids);
});

test('T-I11-R4-06 incoherent OPEN contradiction cannot silently produce a filtered handoff', () => {
  const evs = [
    evidence({ evidenceId: 'EV-A', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-B', observedState: 'entero' }),
  ];
  const contradictions = [{
    contradictionId: 'CON-BAD',
    individualId: 'IND-001',
    characterId: 'CH-003',
    status: 'OPEN',
    evidenceRefs: [
      { evidenceId: 'EV-A', revision: 1 },
      { evidenceId: 'EV-B', revision: 1 },
    ],
    previousContradictionId: null,
  }];
  assert.throws(
    () => runApcIndividualThroughAce({
      dataset,
      session: session({ evidenceItems: evs, contradictions }),
      individualId: 'IND-001',
      areStatesIncompatible: incompatible,
    }),
    /Invalid APC contradictions:.*OPEN contradiction but no current incompatible pair/,
  );
});

test('T-I11-R4-07 contradiction-bearing session requires semantic incompatibility validation', () => {
  const evs = [
    evidence({ evidenceId: 'EV-A', observedState: 'entero' }),
    evidence({ evidenceId: 'EV-B', observedState: 'serrado' }),
  ];
  const contradictions = [{
    contradictionId: 'CON-NOCB',
    individualId: 'IND-001',
    characterId: 'CH-003',
    status: 'OPEN',
    evidenceRefs: [
      { evidenceId: 'EV-A', revision: 1 },
      { evidenceId: 'EV-B', revision: 1 },
    ],
    previousContradictionId: null,
  }];
  assert.throws(
    () => runApcIndividualThroughAce({
      dataset,
      session: session({ evidenceItems: evs, contradictions }),
      individualId: 'IND-001',
    }),
    /areStatesIncompatible callback is required/,
  );
});
