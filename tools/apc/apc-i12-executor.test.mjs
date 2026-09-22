import test from 'node:test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
  ApcI12CommandExecutor,
  createMemoryApcPersistence,
  createMemoryWriterLockProvider,
} from './apc-i12-executor.mjs';

function testContext() {
  let id = 0;
  let tick = 0;
  return {
    dataset: {
      allCharactersById: new Map([
        ['CH-003', { characterId: 'CH-003', allowedStates: ['entero','serrado'], pilotStatus: 'activo' }],
      ]),
    },
    newId(kind = 'id') { id += 1; return `${kind.toUpperCase()}-${String(id).padStart(3,'0')}`; },
    now() {
      tick += 1;
      return `2026-09-22T01:${String(tick).padStart(2,'0')}:00-03:00`;
    },
    actorId: 'Alejandra',
    areStatesIncompatible: (a, b) => a !== b,
    isContradictionRelevant: () => true,
  };
}

async function setup() {
  const persistence = createMemoryApcPersistence();
  const lockProvider = createMemoryWriterLockProvider();
  const executor = new ApcI12CommandExecutor({
    persistence,
    lockProvider,
    context: testContext(),
  });
  const created = await executor.bootstrap({ objective: 'I12 executor regression' });
  assert.equal(created.status, 'COMMITTED');
  return { executor, persistence, lockProvider };
}

test('I12 executor bootstrap persists before exposing currentSession', async () => {
  const { executor, persistence } = await setup();
  const session = executor.snapshot();
  assert.equal(session.semanticRevision, 1);
  assert.equal(session.objectiveAssessment.status, 'OPEN');
  assert.equal(typeof await persistence.load(session.sessionId), 'string');
  await executor.close();
});

test('I12 ingest deduplicates equal fingerprint within one batch', async () => {
  const { executor } = await setup();
  const command = executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [
      { fileRef: 'a.jpg', fingerprintSha256: 'a'.repeat(64) },
      { fileRef: 'duplicate-name.jpg', fingerprintSha256: 'A'.repeat(64) },
    ],
  });
  const r = await executor.dispatch(command);
  assert.equal(r.status, 'COMMITTED');
  assert.equal(r.session.photos.length, 1);
  assert.equal(r.session.photoEvidence.length, 1);
  assert.equal(r.session.photos[0].fileRef, 'a.jpg');
  assert.equal(r.session.inboxPhotoRefs.length, 1);
  await executor.close();
});

test('queued commands preserve dispatch generation and second becomes stale after first commit', async () => {
  const { executor } = await setup();
  const base = executor.commandBase();
  const a = executor.dispatch({
    ...base,
    type: 'INGEST_PHOTOS',
    photos: [{ fileRef: 'a.jpg', fingerprintSha256: 'a'.repeat(64) }],
  });
  const b = executor.dispatch({
    ...base,
    type: 'INGEST_PHOTOS',
    photos: [{ fileRef: 'b.jpg', fingerprintSha256: 'b'.repeat(64) }],
  });
  const [ra, rb] = await Promise.all([a, b]);
  assert.equal(ra.status, 'COMMITTED');
  assert.equal(rb.status, 'STALE_COMMAND');
  assert.equal(executor.snapshot().photos.length, 1);
  await executor.close();
});

test('assignment then unassignment is blocked after any evidence history exists', async () => {
  const { executor } = await setup();

  let r = await executor.dispatch(executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [{ fileRef: 'a.jpg', fingerprintSha256: 'a'.repeat(64) }],
  }));
  const photoId = r.session.photos[0].photoId;

  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const individualId = r.created.individualId;

  r = await executor.dispatch(executor.commandBase({
    type: 'ASSIGN_PHOTO',
    photoId,
    individualId,
  }));
  assert.equal(r.status, 'COMMITTED');

  r = await executor.dispatch(executor.commandBase({
    type: 'SAVE_DRAFT',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: {
      evidenceStatus: 'OBSERVED',
      observedState: 'entero',
      sourceType: 'human',
      sourceId: 'Alejandra',
      acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
      confidence: null,
      reason: null,
      notes: null,
    },
  }));
  assert.equal(r.status, 'COMMITTED');

  r = await executor.dispatch(executor.commandBase({
    type: 'UNASSIGN_PHOTO',
    photoId,
    individualId,
  }));
  assert.equal(r.status, 'REJECTED');
  assert.match(r.errors.join(' '), /UNASSIGN_BLOCKED/);
  await executor.close();
});

test('new unsatisfied requirement requests explicit critical decision', async () => {
  const { executor } = await setup();
  let r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const individualId = r.created.individualId;

  const command = executor.commandBase({
    type: 'ADD_REQUIREMENT',
    requirement: {
      scopeLevel: 'INDIVIDUAL',
      scopeRef: individualId,
      characterId: 'CH-003',
      reason: 'H16_VERIFICATION',
    },
  });
  r = await executor.dispatch(command);
  assert.equal(r.status, 'NEEDS_DECISION');
  assert.equal(r.decisionsRequired[0].type, 'PENDING_CRITICAL');

  const rebuilt = executor.commandBase({
    ...command,
    pendingCriticalByRequirement: {},
  });
  delete rebuilt.requirement.requirementId;
  // The generated requirementId is not known before the transaction, so use an explicit ID.
  rebuilt.requirement.requirementId = 'REQ-EXPLICIT';
  rebuilt.pendingCriticalByRequirement['REQ-EXPLICIT'] = false;
  r = await executor.dispatch(rebuilt);
  assert.equal(r.status, 'COMMITTED');
  assert.equal(r.session.pending[0].critical, false);
  await executor.close();
});

test('CONFIRMED evidence resolves requirement and uses a new I6 revision when DRAFT existed', async () => {
  const { executor } = await setup();

  let r = await executor.dispatch(executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [{ fileRef: 'a.jpg', fingerprintSha256: 'a'.repeat(64) }],
  }));
  const photoId = r.session.photos[0].photoId;

  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const individualId = r.created.individualId;

  await executor.dispatch(executor.commandBase({ type: 'ASSIGN_PHOTO', photoId, individualId }));

  r = await executor.dispatch(executor.commandBase({
    type: 'ADD_REQUIREMENT',
    requirement: {
      requirementId: 'REQ-1',
      scopeLevel: 'INDIVIDUAL',
      scopeRef: individualId,
      characterId: 'CH-003',
      reason: 'H16_VERIFICATION',
    },
    pendingCriticalByRequirement: { 'REQ-1': false },
  }));
  assert.equal(r.status, 'COMMITTED');

  r = await executor.dispatch(executor.commandBase({
    type: 'SAVE_DRAFT',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: {
      evidenceStatus: 'OBSERVED',
      observedState: 'entero',
      sourceType: 'human',
      sourceId: 'Alejandra',
      acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
      confidence: null,
      reason: null,
      notes: null,
    },
    pendingCriticalByRequirement: { 'REQ-1': false },
  }));
  assert.equal(r.status, 'COMMITTED');
  const evidenceId = r.session.evidence.find(item => item.current).evidenceId;
  const baseRevision = r.session.evidence.find(item => item.evidenceId === evidenceId && item.current).revision;

  r = await executor.dispatch(executor.commandBase({
    type: 'CONFIRM_EVIDENCE',
    evidenceId,
    baseRevision,
    targetPhotoId: photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: {},
    confirmation: {
      confirmedByType: 'human',
      confirmedById: 'Alejandra',
      confirmedAt: '2026-09-22T02:00:00-03:00',
    },
  }));
  assert.equal(r.status, 'COMMITTED');
  const versions = r.session.evidence.filter(item => item.evidenceId === evidenceId);
  assert.equal(versions.length, 2);
  assert.equal(versions[0].current, false);
  assert.equal(versions[1].lifecycleStatus, 'CONFIRMED');
  assert.equal(r.session.pending[0].status, 'RESOLVED');
  assert.deepEqual(r.session.pending[0].resolutionEvidenceRefs, [{ evidenceId, revision: 2 }]);
  await executor.close();
});

test('second writer for same session is read-only until first releases lock', async () => {
  const persistence = createMemoryApcPersistence();
  const locks = createMemoryWriterLockProvider();
  const context = testContext();
  const a = new ApcI12CommandExecutor({ persistence, lockProvider: locks, context });
  const b = new ApcI12CommandExecutor({ persistence, lockProvider: locks, context });
  const created = await a.bootstrap({ objective: 'single writer' });
  const sessionId = created.session.sessionId;
  const blocked = await b.openAsWriter(sessionId);
  assert.equal(blocked.status, 'READ_ONLY');
  await a.close();
  const opened = await b.openAsWriter(sessionId);
  assert.equal(opened.status, 'COMMITTED');
  await b.close();
});

test('import conflict never overwrites different durable snapshot', async () => {
  const { executor, persistence } = await setup();
  const session = executor.snapshot();
  await executor.close();

  const changed = structuredClone(session);
  changed.objective = 'different';
  const imported = await executor.importSession(changed);
  assert.equal(imported.status, 'IMPORT_CONFLICT');

  const durable = JSON.parse(await persistence.load(session.sessionId));
  assert.equal(durable.objective, session.objective);
});


test('invalid import leaves the current writer active and unchanged', async () => {
  const { executor } = await setup();
  const before = executor.snapshot();
  const invalid = structuredClone(before);
  invalid.photos = 'not-an-array';

  const imported = await executor.importSession(invalid);
  assert.equal(imported.status, 'READ_ONLY');
  assert.deepEqual(executor.snapshot(), before);

  const r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  assert.equal(r.status, 'COMMITTED');
  await executor.close();
});

test('conflicting import leaves the current writer active and unchanged', async () => {
  const { executor } = await setup();
  const before = executor.snapshot();
  const conflict = structuredClone(before);
  conflict.objective = 'conflict';

  const imported = await executor.importSession(conflict);
  assert.equal(imported.status, 'IMPORT_CONFLICT');
  assert.deepEqual(executor.snapshot(), before);

  const r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  assert.equal(r.status, 'COMMITTED');
  await executor.close();
});


async function setupReviewTarget(executor) {
  let r = await executor.dispatch(executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [{ fileRef: 'direct-confirm.jpg', fingerprintSha256: 'd'.repeat(64) }],
  }));
  const photoId = r.session.photos[0].photoId;
  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const individualId = r.created.individualId;
  r = await executor.dispatch(executor.commandBase({ type: 'ASSIGN_PHOTO', photoId, individualId }));
  assert.equal(r.status, 'COMMITTED');
  return { photoId, individualId };
}

function manualObservedPatch(state = 'entero') {
  return {
    evidenceStatus: 'OBSERVED',
    observedState: state,
    sourceType: 'human',
    sourceId: 'Alejandra',
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: null,
    notes: null,
  };
}

test('T-I12-05A ephemeral data can commit directly as revision 1 CONFIRMED', async () => {
  const { executor } = await setup();
  const { photoId, individualId } = await setupReviewTarget(executor);

  const r = await executor.dispatch(executor.commandBase({
    type: 'CONFIRM_EVIDENCE',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: manualObservedPatch(),
    confirmation: {
      confirmedByType: 'human',
      confirmedById: 'Alejandra',
      confirmedAt: '2026-09-22T03:00:00-03:00',
    },
  }));

  assert.equal(r.status, 'COMMITTED');
  assert.equal(r.session.evidence.length, 1);
  assert.equal(r.session.evidence[0].revision, 1);
  assert.equal(r.session.evidence[0].lifecycleStatus, 'CONFIRMED');
  assert.equal(r.session.evidence[0].current, true);
  assert.equal(r.session.revisions.length, 0);
  await executor.close();
});

test('TD-I12-11 SAVE_DRAFT then rebuilt CONFIRM uses committed draft revision', async () => {
  const { executor } = await setup();
  const { photoId, individualId } = await setupReviewTarget(executor);

  const saved = await executor.dispatch(executor.commandBase({
    type: 'SAVE_DRAFT',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: manualObservedPatch(),
  }));
  assert.equal(saved.status, 'COMMITTED');
  const draft = saved.session.evidence.find(item => item.current);

  const confirmed = await executor.dispatch(executor.commandBase({
    type: 'CONFIRM_EVIDENCE',
    evidenceId: draft.evidenceId,
    baseRevision: draft.revision,
    targetPhotoId: photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: {},
    confirmation: {
      confirmedByType: 'human',
      confirmedById: 'Alejandra',
      confirmedAt: '2026-09-22T03:01:00-03:00',
    },
  }));

  assert.equal(confirmed.status, 'COMMITTED');
  const versions = confirmed.session.evidence.filter(item => item.evidenceId === draft.evidenceId);
  assert.deepEqual(versions.map(item => [item.revision, item.lifecycleStatus, item.current]), [
    [1, 'DRAFT', false],
    [2, 'CONFIRMED', true],
  ]);
  await executor.close();
});

test('TD-I12-35 session replacement invalidates a command captured in prior epoch', async () => {
  const { executor } = await setup();
  const stale = executor.commandBase({ type: 'CREATE_INDIVIDUAL' });
  const oldSessionId = executor.snapshot().sessionId;

  await executor.close();
  const replacement = await executor.bootstrap({ objective: 'replacement session' });
  assert.equal(replacement.status, 'COMMITTED');
  assert.notEqual(replacement.session.sessionId, oldSessionId);

  const result = await executor.dispatch(stale);
  assert.equal(result.status, 'STALE_COMMAND');
  assert.equal(executor.snapshot().sessionId, replacement.session.sessionId);
  await executor.close();
});

test('TD-I12-48 close barrier waits active command and invalidates queued command before release', async () => {
  const basePersistence = createMemoryApcPersistence();
  let blockNextSave = false;
  let releaseSave;
  let saveStarted;
  const saveStartedPromise = new Promise(resolve => { saveStarted = resolve; });
  const persistence = {
    load: id => basePersistence.load(id),
    async saveAtomic(id, raw) {
      if (blockNextSave) {
        blockNextSave = false;
        saveStarted();
        await new Promise(resolve => { releaseSave = resolve; });
      }
      return basePersistence.saveAtomic(id, raw);
    },
  };
  const locks = createMemoryWriterLockProvider();
  const executor = new ApcI12CommandExecutor({ persistence, lockProvider: locks, context: testContext() });
  const created = await executor.bootstrap({ objective: 'switch barrier' });
  assert.equal(created.status, 'COMMITTED');

  blockNextSave = true;
  const base = executor.commandBase();
  const active = executor.dispatch({ ...base, type: 'CREATE_INDIVIDUAL' });
  const queued = executor.dispatch({ ...base, type: 'CREATE_INDIVIDUAL' });
  await saveStartedPromise;

  let closeResolved = false;
  const closing = executor.close().then(() => { closeResolved = true; });
  await Promise.resolve();
  assert.equal(closeResolved, false);
  assert.equal(locks._held.has(created.session.sessionId), true);

  releaseSave();
  const activeResult = await active;
  const queuedResult = await queued;
  await closing;

  assert.equal(activeResult.status, 'COMMITTED');
  assert.equal(queuedResult.status, 'STALE_COMMAND');
  assert.equal(locks._held.has(created.session.sessionId), false);
  assert.equal(executor.snapshot(), null);
});


function prefilledObservedPatch(photoEvidenceRefs, { confirmedOnCurrentPhoto = false } = {}) {
  return {
    evidenceStatus: 'OBSERVED',
    observedState: 'entero',
    sourceType: 'human',
    sourceId: 'Alejandra',
    acquisition: {
      mode: 'prefilled',
      confirmedOnCurrentPhoto,
      basis: { type: 'prior_observations', photoEvidenceRefs },
    },
    confidence: null,
    reason: null,
    notes: null,
  };
}

async function setupTwoPhotoReviewTarget(executor) {
  let r = await executor.dispatch(executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [
      { fileRef: 'prior.jpg', fingerprintSha256: '1'.repeat(64) },
      { fileRef: 'current.jpg', fingerprintSha256: '2'.repeat(64) },
    ],
  }));
  const [priorPhoto, currentPhoto] = r.session.photos;
  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const individualId = r.created.individualId;
  for (const photo of [priorPhoto, currentPhoto]) {
    r = await executor.dispatch(executor.commandBase({
      type: 'ASSIGN_PHOTO',
      photoId: photo.photoId,
      individualId,
    }));
    assert.equal(r.status, 'COMMITTED');
  }
  return { priorPhoto, currentPhoto, individualId };
}

test('T-I12-11 prefilled DRAFT remains traceable and not confirmed on current photo', async () => {
  const { executor } = await setup();
  const { priorPhoto, currentPhoto, individualId } = await setupTwoPhotoReviewTarget(executor);
  const r = await executor.dispatch(executor.commandBase({
    type: 'SAVE_DRAFT',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: currentPhoto.photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: prefilledObservedPatch([priorPhoto.photoEvidenceId]),
  }));
  assert.equal(r.status, 'COMMITTED');
  const draft = r.session.evidence.find(item => item.current);
  assert.equal(draft.lifecycleStatus, 'DRAFT');
  assert.equal(draft.acquisition.mode, 'prefilled');
  assert.equal(draft.acquisition.confirmedOnCurrentPhoto, false);
  assert.deepEqual(draft.acquisition.basis, {
    type: 'prior_observations',
    photoEvidenceRefs: [priorPhoto.photoEvidenceId],
  });
  assert.equal(draft.confirmation, null);
  await executor.close();
});

test('TD-I12-57 prefill requires explicit human confirmation before CONFIRMED', async () => {
  const { executor } = await setup();
  const { priorPhoto, currentPhoto, individualId } = await setupTwoPhotoReviewTarget(executor);

  const rejected = await executor.dispatch(executor.commandBase({
    type: 'CONFIRM_EVIDENCE',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: currentPhoto.photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: prefilledObservedPatch([priorPhoto.photoEvidenceId]),
    confirmation: {
      confirmedByType: 'human',
      confirmedById: 'Alejandra',
      confirmedAt: '2026-09-22T04:00:00-03:00',
    },
  }));
  assert.equal(rejected.status, 'REJECTED');
  assert.match(rejected.errors.join(' '), /confirmedOnCurrentPhoto=true/);
  assert.equal(executor.snapshot().evidence.length, 0);

  const confirmed = await executor.dispatch(executor.commandBase({
    type: 'CONFIRM_EVIDENCE',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: currentPhoto.photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: prefilledObservedPatch([priorPhoto.photoEvidenceId], { confirmedOnCurrentPhoto: true }),
    confirmation: {
      confirmedByType: 'human',
      confirmedById: 'Alejandra',
      confirmedAt: '2026-09-22T04:01:00-03:00',
    },
  }));
  assert.equal(confirmed.status, 'COMMITTED');
  assert.equal(confirmed.session.evidence.length, 1);
  assert.equal(confirmed.session.evidence[0].revision, 1);
  assert.equal(confirmed.session.evidence[0].lifecycleStatus, 'CONFIRMED');
  assert.equal(confirmed.session.evidence[0].acquisition.confirmedOnCurrentPhoto, true);
  await executor.close();
});

test('TD-I12-65 prefilled DRAFT rejects missing or unknown prior-observation refs', async () => {
  const { executor } = await setup();
  const { currentPhoto, individualId } = await setupTwoPhotoReviewTarget(executor);

  const missing = await executor.dispatch(executor.commandBase({
    type: 'SAVE_DRAFT',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: currentPhoto.photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: {
      ...prefilledObservedPatch([]),
      acquisition: { mode: 'prefilled', confirmedOnCurrentPhoto: false, basis: null },
    },
  }));
  assert.equal(missing.status, 'REJECTED');
  assert.match(missing.errors.join(' '), /acquisition.basis/);

  const unknown = await executor.dispatch(executor.commandBase({
    type: 'SAVE_DRAFT',
    evidenceId: null,
    baseRevision: null,
    targetPhotoId: currentPhoto.photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: prefilledObservedPatch(['PE-DOES-NOT-EXIST']),
  }));
  assert.equal(unknown.status, 'REJECTED');
  assert.match(unknown.errors.join(' '), /Unknown acquisition.basis.photoEvidenceRef/);
  assert.equal(executor.snapshot().evidence.length, 0);
  await executor.close();
});


test('T-I12-10 suggestion derivation permits inspection guidance but never botanical state', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  assert.match(source, /export function deriveInspectionTargetSuggestions/);
  assert.match(source, /characterId: character\.characterId/);
  assert.match(source, /structure:/);
  assert.match(source, /help:/);

  const derivationStart = source.indexOf('export function deriveInspectionTargetSuggestions');
  const derivationEnd = source.indexOf('\nfunction suggestInspectionTargets', derivationStart);
  assert.ok(derivationStart >= 0 && derivationEnd > derivationStart);
  const derivationSource = source.slice(derivationStart, derivationEnd);
  assert.doesNotMatch(derivationSource, /observedState/);
});

test('TD-I12-58 SUGGEST_INSPECTION_TARGETS is runtime-only and cannot mutate APC_SESSION', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('function suggestInspectionTargets');
  const end = source.indexOf('\nfunction prefillFromPriorObservation', start);
  assert.ok(start >= 0 && end > start);
  const operationSource = source.slice(start, end);

  assert.match(operationSource, /deriveInspectionTargetSuggestions/);
  assert.doesNotMatch(operationSource, /dispatch\s*\(/);
  assert.doesNotMatch(operationSource, /commandBase\s*\(/);
  // Ignore comments when asserting forbidden executable tokens.
  const executableSource = operationSource.replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(executableSource, /observedState/);
  assert.doesNotMatch(executableSource, /semanticRevision\s*=/);
  assert.doesNotMatch(operationSource, /writeFormBuffer\s*\(/);
});


test('T-I12-13 REPRESENTATION_GAP is visible as derived context without becoming evidence', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('export function deriveRepresentationGaps');
  const end = source.indexOf('\nfunction render()', start);
  assert.ok(start >= 0 && end > start, 'representation-gap derivation must remain explicit');
  const derivationSource = source.slice(start, end);

  assert.match(derivationSource, /session\.pending/);
  assert.match(derivationSource, /item\.kind === 'REPRESENTATION_GAP'/);
  assert.match(derivationSource, /sourceLevel === 'SESSION'/);
  assert.match(derivationSource, /sourceLevel === 'INDIVIDUAL'/);
  assert.doesNotMatch(derivationSource, /dispatch\s*\(/);
  assert.doesNotMatch(derivationSource, /commandBase\s*\(/);
  assert.doesNotMatch(derivationSource, /session\.evidence\s*=/);
  assert.doesNotMatch(derivationSource, /semanticRevision\s*=/);

  const html = await fs.readFile(new URL('./ui/apc-ui.html', import.meta.url), 'utf8');
  assert.match(html, /Representation gaps · contexto read-only/);
  assert.match(html, /id="representationGaps"/);

  const { executor } = await setup();
  const before = executor.snapshot();
  const evidenceBefore = JSON.stringify(before.evidence);
  const revisionBefore = before.semanticRevision;

  // Reading/deriving representation-gap context is deliberately outside the
  // executor command path. The committed APC snapshot therefore remains exact.
  assert.equal(JSON.stringify(executor.snapshot().evidence), evidenceBefore);
  assert.equal(executor.snapshot().semanticRevision, revisionBefore);
  await executor.close();
});


test('TD-I12-53 BATCH_UNASSIGN_PHOTOS rejects heterogeneous individuals atomically', async () => {
  const { executor } = await setup();
  let r = await executor.dispatch(executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [
      { fileRef: 'batch-a.jpg', fingerprintSha256: '8'.repeat(64) },
      { fileRef: 'batch-b.jpg', fingerprintSha256: '9'.repeat(64) },
    ],
  }));
  const [a, b] = r.session.photos;
  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const ind1 = r.created.individualId;
  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const ind2 = r.created.individualId;
  await executor.dispatch(executor.commandBase({ type: 'ASSIGN_PHOTO', photoId: a.photoId, individualId: ind1 }));
  await executor.dispatch(executor.commandBase({ type: 'ASSIGN_PHOTO', photoId: b.photoId, individualId: ind2 }));
  const before = executor.snapshot();

  r = await executor.dispatch(executor.commandBase({
    type: 'BATCH_UNASSIGN_PHOTOS',
    targets: [
      { photoId: a.photoId, individualId: ind1 },
      { photoId: b.photoId, individualId: ind2 },
    ],
  }));
  assert.equal(r.status, 'REJECTED');
  assert.match(r.errors.join(' '), /single individualId/);
  assert.deepEqual(executor.snapshot(), before);
  await executor.close();
});

test('TD-I12-53 homogeneous BATCH_UNASSIGN_PHOTOS remains reversible by one BATCH_ASSIGN_PHOTOS', async () => {
  const { executor } = await setup();
  let r = await executor.dispatch(executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [
      { fileRef: 'batch-c.jpg', fingerprintSha256: 'a8'.padEnd(64, '8') },
      { fileRef: 'batch-d.jpg', fingerprintSha256: 'b9'.padEnd(64, '9') },
    ],
  }));
  const [a, b] = r.session.photos;
  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const individualId = r.created.individualId;
  r = await executor.dispatch(executor.commandBase({
    type: 'BATCH_ASSIGN_PHOTOS',
    photoIds: [a.photoId, b.photoId],
    individualId,
  }));
  assert.equal(r.status, 'COMMITTED');

  r = await executor.dispatch(executor.commandBase({
    type: 'BATCH_UNASSIGN_PHOTOS',
    targets: [
      { photoId: a.photoId, individualId },
      { photoId: b.photoId, individualId },
      { photoId: a.photoId, individualId },
    ],
  }));
  assert.equal(r.status, 'COMMITTED');
  assert.equal(r.session.photos.find(item => item.photoId === a.photoId).individualRefs.includes(individualId), false);
  assert.equal(r.session.photos.find(item => item.photoId === b.photoId).individualRefs.includes(individualId), false);

  r = await executor.dispatch(executor.commandBase({
    type: 'BATCH_ASSIGN_PHOTOS',
    photoIds: [a.photoId, b.photoId],
    individualId,
  }));
  assert.equal(r.status, 'COMMITTED');
  assert.equal(r.session.photos.find(item => item.photoId === a.photoId).individualRefs.includes(individualId), true);
  assert.equal(r.session.photos.find(item => item.photoId === b.photoId).individualRefs.includes(individualId), true);
  await executor.close();
});

test('T-I12-12 batch undo descriptor enforces exact delta and fails closed on heterogeneous inverse', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('export function deriveBatchUndoDescriptor');
  const end = source.indexOf('\nexport function batchUndoIsValid', start);
  assert.ok(start >= 0 && end > start);
  const derivation = source.slice(start, end);
  assert.match(derivation, /beforeSet\.has\(photoId\) !== afterSet\.has\(photoId\)/);
  assert.match(derivation, /assigned\(before, target\) !== assigned\(after, target\)/);
  assert.match(derivation, /new Set\(affectedTargets\.map\(item => item\.individualId\)\)\.size !== 1/);
  assert.match(derivation, /targets: structuredClone\(affectedTargets\)/);
});


test('T-I12-12 batch mutation and Undo controls are write-gated', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('function disableWrites');
  const end = source.indexOf('\nfunction chooseFallbackTargets', start);
  assert.ok(start >= 0 && end > start);
  const gate = source.slice(start, end);
  assert.match(gate, /'batchAddInbox'/);
  assert.match(gate, /'batchRemoveInbox'/);
  assert.match(gate, /'undoBatch'/);

  const renderStart = source.indexOf('function render()');
  const renderEnd = source.indexOf('\nexport function deriveBatchUndoDescriptor', renderStart);
  const renderSource = source.slice(renderStart, renderEnd);
  assert.match(renderSource, /const undoValid = inWriteMode\(\) &&/);
});

test('TD-I12-53 stale or rejected Undo attempt preserves descriptor while inverse remains valid', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function undoLastBatch');
  const end = source.indexOf('\nasync function setSessionStatus', start);
  assert.ok(start >= 0 && end > start);
  const undoSource = source.slice(start, end);
  assert.match(undoSource, /result\.status === 'COMMITTED' \|\| result\.status === 'NO_OP'/);
  assert.doesNotMatch(undoSource, /result\.status === 'STALE_COMMAND'[^\n]*state\.batchUndo = null/);
  assert.doesNotMatch(undoSource, /result\.status === 'REJECTED'[^\n]*state\.batchUndo = null/);
  assert.match(undoSource, /batchUndoIsValid\(state\.batchUndo, current, state\.executor\?\.sessionEpoch\)/);
});


test('TD-I12-53 runtime batch Undo restores exact inbox delta after unrelated committed mutation', async () => {
  const { executor } = await setup();
  let r = await executor.dispatch(executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [
      { fileRef: 'undo-a.jpg', fingerprintSha256: 'c'.repeat(64) },
      { fileRef: 'undo-b.jpg', fingerprintSha256: 'd'.repeat(64) },
    ],
  }));
  const [a, b] = r.session.photos;
  const before = executor.snapshot();

  // Newly ingested photos start in inbox, so exercise REMOVE -> unrelated
  // commit -> inverse ADD rather than manufacturing a NO_OP ADD.
  r = await executor.dispatch(executor.commandBase({
    type: 'BATCH_REMOVE_FROM_INBOX',
    photoIds: [a.photoId, b.photoId],
  }));
  assert.equal(r.status, 'COMMITTED');
  const afterBatch = executor.snapshot();

  const beforeSet = new Set(before.inboxPhotoRefs ?? []);
  const affected = [a.photoId, b.photoId].filter(photoId =>
    beforeSet.has(photoId) !== new Set(afterBatch.inboxPhotoRefs ?? []).has(photoId)
  );
  assert.deepEqual(new Set(affected), new Set([a.photoId, b.photoId]));

  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  assert.equal(r.status, 'COMMITTED');
  const afterUnrelated = executor.snapshot();
  for (const photoId of affected) assert.equal(afterUnrelated.inboxPhotoRefs.includes(photoId), false);

  r = await executor.dispatch(executor.commandBase({
    type: 'BATCH_ADD_TO_INBOX',
    photoIds: affected,
  }));
  assert.equal(r.status, 'COMMITTED');
  const restored = executor.snapshot();
  for (const photoId of affected) {
    assert.equal(restored.inboxPhotoRefs.includes(photoId), before.inboxPhotoRefs.includes(photoId));
  }
  assert.equal(restored.individuals.length, afterUnrelated.individuals.length);
  await executor.close();
});

test('TD-I12-53 runtime assignment Undo becomes non-executable after evidence history creates UNASSIGN_BLOCKED', async () => {
  const { executor } = await setup();
  let r = await executor.dispatch(executor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [{ fileRef: 'undo-guard.jpg', fingerprintSha256: 'e'.repeat(64) }],
  }));
  const photo = r.session.photos[0];
  r = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  const individualId = r.created.individualId;

  r = await executor.dispatch(executor.commandBase({
    type: 'BATCH_ASSIGN_PHOTOS',
    photoIds: [photo.photoId],
    individualId,
  }));
  assert.equal(r.status, 'COMMITTED');

  r = await executor.dispatch(executor.commandBase({
    type: 'SAVE_DRAFT',
    targetPhotoId: photo.photoId,
    targetIndividualId: individualId,
    characterId: 'CH-003',
    patch: {
      evidenceStatus: 'OBSERVED',
      observedState: 'entero',
      sourceType: 'human',
      sourceId: 'Alejandra',
      acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
      confidence: null,
      reason: null,
      notes: null,
    },
  }));
  assert.equal(r.status, 'COMMITTED');

  const beforeUndoAttempt = executor.snapshot();
  r = await executor.dispatch(executor.commandBase({
    type: 'BATCH_UNASSIGN_PHOTOS',
    targets: [{ photoId: photo.photoId, individualId }],
  }));
  assert.equal(r.status, 'REJECTED');
  assert.match(r.errors.join(' '), /UNASSIGN_BLOCKED/);
  assert.deepEqual(executor.snapshot(), beforeUndoAttempt);
  assert.equal(executor.snapshot().photos[0].individualRefs.includes(individualId), true);
  await executor.close();
});


test('T-I12-12 explicit selectedPhotoIds remain runtime-only and define batch intent independently of filters', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');

  assert.match(source, /selectedPhotoIds: new Set\(\)/);
  assert.match(source, /export function selectedBatchPhotoIds\(selectedPhotoIds, session\)/);
  assert.match(source, /const photoIds = selectedBatchPhotoIds\(state\.selectedPhotoIds, before\)/);
  assert.doesNotMatch(
    source.slice(source.indexOf('async function batchInbox'), source.indexOf('\nasync function undoLastBatch')),
    /visiblePhotos\(before\)\.map/
  );

  const barrierStart = source.indexOf('async function sessionSwitchBarrier');
  const barrierEnd = source.indexOf('\nasync function ingestFiles', barrierStart);
  assert.match(source.slice(barrierStart, barrierEnd), /state\.selectedPhotoIds\.clear\(\)/);

  const renderStart = source.indexOf('function render()');
  const renderEnd = source.indexOf('\nexport function deriveBatchUndoDescriptor', renderStart);
  const renderSource = source.slice(renderStart, renderEnd);
  assert.match(renderSource, /selector\.type = 'checkbox'/);
  assert.match(renderSource, /selector\.checked = state\.selectedPhotoIds\.has\(photo\.photoId\)/);
  assert.match(renderSource, /changeReviewTarget\(\{ photoId: photo\.photoId \}\)/);
});

test('T-I12-12 selected batch targets reject stale ids, deduplicate selection, and allow empty selection without APC mutation', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('export function selectedBatchPhotoIds');
  const end = source.indexOf('\nfunction togglePhotoSelection', start);
  assert.ok(start >= 0 && end > start);
  const helper = source.slice(start, end);
  assert.match(helper, /new Set\(\(session\.photos \?\? \[\]\)\.map\(item => item\.photoId\)\)/);
  assert.match(helper, /\[\.\.\.selectedPhotoIds\]\.filter\(photoId => existing\.has\(photoId\)\)/);

  const batchStart = source.indexOf('async function batchInbox');
  const batchEnd = source.indexOf('\nasync function undoLastBatch', batchStart);
  const batchSource = source.slice(batchStart, batchEnd);
  assert.match(batchSource, /if \(!photoIds\.length\) return message/);
  assert.match(batchSource, /deriveBatchUndoDescriptor/);
});


test('NV-SEL-01 explicit batch selection is disabled outside writer mode', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const renderStart = source.indexOf('function render()');
  const renderEnd = source.indexOf('\nexport function deriveBatchUndoDescriptor', renderStart);
  assert.ok(renderStart >= 0 && renderEnd > renderStart);
  const renderSource = source.slice(renderStart, renderEnd);
  assert.match(renderSource, /selector\.disabled = !inWriteMode\(\)/);
});

test('T-I12-12 filter, active target changes, and selection remain separate UI-only concerns', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');

  assert.match(source, /\$\('photoFilter'\)\.onchange = render/);

  const toggleStart = source.indexOf('function togglePhotoSelection');
  const toggleEnd = source.indexOf('\nfunction render()', toggleStart);
  const toggleSource = source.slice(toggleStart, toggleEnd);
  assert.match(toggleSource, /state\.selectedPhotoIds\.(has|delete|add)/);
  assert.doesNotMatch(toggleSource, /dispatch\(|commandBase\(|scheduleAutosave\(|changeReviewTarget\(/);

  const targetStart = source.indexOf('async function changeReviewTarget');
  const targetEnd = source.indexOf('\nfunction captureAndScheduleAutosave', targetStart);
  const targetSource = source.slice(targetStart, targetEnd);
  assert.doesNotMatch(targetSource, /selectedPhotoIds/);

  const renderStart = source.indexOf('function render()');
  const renderEnd = source.indexOf('\nexport function deriveBatchUndoDescriptor', renderStart);
  const renderSource = source.slice(renderStart, renderEnd);
  assert.match(renderSource, /selector\.onclick = event => event\.stopPropagation\(\)/);
  assert.match(renderSource, /selector\.onchange = \(\) => togglePhotoSelection\(photo\.photoId\)/);
});
