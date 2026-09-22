import test from 'node:test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
  ApcI12CommandExecutor,
  createMemoryApcPersistence,
  createMemoryWriterLockProvider,
} from './apc-i12-executor.mjs';
import { createWriterContextGate, createWriterIntentLeaseRegistry, leaseAuthorizesExecutor } from './ui/apc-ui-context.mjs';

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
  assert.match(renderSource, /selector\.disabled = !canAcceptWriterIntent\(\)/);
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


test('PHOTO_UI_STATUS_V0.2 derives only PHOTO-scoped unresolved requirements and current evidence', async () => {
  const { derivePhotoUiStatus } = await import('./ui/apc-ui-status.mjs');
  const photo = { photoId: 'PHOTO-1', individualRefs: ['IND-1'] };
  const base = { evidence: [], pending: [] };
  const status = (evidence = [], pending = []) =>
    derivePhotoUiStatus(photo, { ...base, evidence, pending });
  const ev = (lifecycleStatus, current = true) => ({
    evidenceId: `EV-${lifecycleStatus}-${current}`,
    revision: 1,
    current,
    photoId: 'PHOTO-1',
    lifecycleStatus,
  });

  assert.equal(status(), 'sin revisar');
  assert.equal(status([ev('DRAFT')]), 'DRAFT');
  assert.equal(status([ev('CONFIRMED')]), 'CONFIRMED');
  assert.equal(status([ev('DRAFT'), ev('CONFIRMED')]), 'revisada parcialmente');
  assert.equal(status([ev('CONFIRMED', false)]), 'sin revisar');

  assert.equal(status([], [{
    kind: 'UNRESOLVED_REQUIREMENT',
    status: 'OPEN',
    scopeLevel: 'PHOTO',
    scopeRef: 'PHOTO-1',
  }]), 'required pendiente');

  for (const pending of [
    { kind: 'UNRESOLVED_REQUIREMENT', status: 'RESOLVED', scopeLevel: 'PHOTO', scopeRef: 'PHOTO-1' },
    { kind: 'UNRESOLVED_REQUIREMENT', status: 'OPEN', scopeLevel: 'INDIVIDUAL', scopeRef: 'IND-1' },
    { kind: 'UNRESOLVED_REQUIREMENT', status: 'OPEN', scopeLevel: 'SESSION', scopeRef: 'SESSION-1' },
    { kind: 'REPRESENTATION_GAP', status: 'OPEN', sourceLevel: 'INDIVIDUAL', sourceRef: 'IND-1' },
  ]) {
    assert.equal(status([], [pending]), 'sin revisar');
  }

  assert.equal(status([ev('DRAFT'), ev('CONFIRMED')], [{
    kind: 'UNRESOLVED_REQUIREMENT',
    status: 'OPEN',
    scopeLevel: 'PHOTO',
    scopeRef: 'PHOTO-1',
  }]), 'required pendiente');
});

test('PHOTO_UI_STATUS_V0.2 derivation is pure and does not mutate APC session', async () => {
  const { derivePhotoUiStatus } = await import('./ui/apc-ui-status.mjs');
  const photo = { photoId: 'PHOTO-1', individualRefs: ['IND-1'] };
  const session = {
    semanticRevision: 7,
    evidence: [{
      evidenceId: 'EV-1',
      revision: 1,
      current: true,
      photoId: 'PHOTO-1',
      lifecycleStatus: 'CONFIRMED',
    }],
    pending: [],
  };
  const before = structuredClone(session);
  assert.equal(derivePhotoUiStatus(photo, session), 'CONFIRMED');
  assert.deepEqual(session, before);
  assert.equal(session.semanticRevision, 7);
});


test('FILTERED_PHOTO_NAVIGATION_V0.2 resolves circular, filtered-out, singleton, empty, and invalid navigation', async () => {
  const { derivePhotoNavigationTarget } = await import('./ui/apc-ui-navigation.mjs');
  const go = (visiblePhotoIds, activePhotoId, delta) =>
    derivePhotoNavigationTarget({ visiblePhotoIds, activePhotoId, delta });

  assert.equal(go(['A','B','C'], 'A', 1), 'B');
  assert.equal(go(['A','B','C'], 'B', 1), 'C');
  assert.equal(go(['A','B','C'], 'C', 1), 'A');
  assert.equal(go(['A','B','C'], 'A', -1), 'C');
  assert.equal(go(['A','B','C'], 'B', -1), 'A');
  assert.equal(go(['A','B','C'], 'C', -1), 'B');
  assert.equal(go(['A','B','C'], 'X', 1), 'A');
  assert.equal(go(['A','B','C'], 'X', -1), 'C');
  assert.equal(go(['A'], 'X', 1), 'A');
  assert.equal(go(['A'], 'X', -1), 'A');
  assert.equal(go(['A'], 'A', 1), 'A');
  assert.equal(go(['A'], 'A', -1), 'A');
  assert.equal(go([], 'X', 1), null);
  assert.equal(go([], 'X', -1), null);
  assert.throws(() => go(['A'], 'A', 0), RangeError);
  assert.throws(() => go(['A'], 'A', 2), RangeError);
});

test('FILTERED_PHOTO_NAVIGATION_V0.2 apply path keeps filter UI-only and same-target navigation a strict no-op', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');

  assert.match(source, /\$\('photoFilter'\)\.onchange = render/);

  const navStart = source.indexOf('async function navigatePhoto');
  const navEnd = source.indexOf('\nasync function batchInbox', navStart);
  assert.ok(navStart >= 0 && navEnd > navStart);
  const navSource = source.slice(navStart, navEnd);
  assert.match(navSource, /derivePhotoNavigationTarget/);
  assert.match(navSource, /visiblePhotos\(session\)\.map\(item => item\.photoId\)/);
  assert.match(navSource, /targetPhotoId == null \|\| targetPhotoId === state\.activePhotoId/);
  assert.match(navSource, /changeReviewTarget\(\{ photoId: targetPhotoId \}\)/);
  assert.doesNotMatch(navSource, /dispatch\(|commandBase\(|flushAutosave\(|captureActiveEditBuffer\(/);

  const targetStart = source.indexOf('async function changeReviewTarget');
  const targetEnd = source.indexOf('\nfunction captureAndScheduleAutosave', targetStart);
  const targetSource = source.slice(targetStart, targetEnd);
  assert.match(targetSource, /captureActiveEditBuffer\(\)/);
  assert.match(targetSource, /await flushAutosave\(oldKey\)/);
  assert.match(targetSource, /Cambio de target bloqueado/);
  assert.match(targetSource, /state\.activePhotoId = photoId \?\? null/);
});


test('T-CTX-15 context replacement gate closes synchronously before async teardown', () => {
  const gate = createWriterContextGate('READY');
  assert.equal(gate.canAccept(true), true);
  assert.equal(gate.beginReplacement(), true);
  assert.equal(gate.state, 'REPLACING');
  assert.equal(gate.canAccept(true), false);
});

test('T-CTX-16 concurrent context replacement is rejected by the runtime gate', () => {
  const gate = createWriterContextGate('READY');
  assert.equal(gate.beginReplacement(), true);
  assert.equal(gate.beginReplacement(), false);
  gate.finish('READY');
  assert.equal(gate.canAccept(true), true);
});

test('T-CTX-20 writer intent remains blocked until replacement reaches READY', () => {
  const gate = createWriterContextGate('READY');
  gate.beginReplacement();
  assert.equal(gate.canAccept(true), false);
  gate.finish('READ_ONLY');
  assert.equal(gate.canAccept(true), false);
  gate.finish('ERROR');
  assert.equal(gate.canAccept(true), false);
  gate.finish('READY');
  assert.equal(gate.canAccept(true), true);
});

test('TD-I12-71 reopening same session under a new context revalidates before writer authority', async () => {
  const persistence = createMemoryApcPersistence();
  const lockProvider = createMemoryWriterLockProvider();
  const oldExecutor = new ApcI12CommandExecutor({ persistence, lockProvider, context: testContext() });
  const created = await oldExecutor.bootstrap({ objective: 'context barrier regression' });
  assert.equal(created.status, 'COMMITTED');
  const sessionId = oldExecutor.snapshot().sessionId;

  let r = await oldExecutor.dispatch(oldExecutor.commandBase({
    type: 'INGEST_PHOTOS',
    photos: [{ fileRef: 'context.jpg', fingerprintSha256: 'c'.repeat(64) }],
  }));
  assert.equal(r.status, 'COMMITTED');
  const photoId = r.session.photos[0].photoId;

  r = await oldExecutor.dispatch(oldExecutor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  assert.equal(r.status, 'COMMITTED');
  const individualId = r.created.individualId;

  r = await oldExecutor.dispatch(oldExecutor.commandBase({
    type: 'ASSIGN_PHOTO',
    photoId,
    individualId,
  }));
  assert.equal(r.status, 'COMMITTED');

  r = await oldExecutor.dispatch(oldExecutor.commandBase({
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
  await oldExecutor.close();

  const incompatible = testContext();
  incompatible.dataset = { allCharactersById: new Map() };
  const newExecutor = new ApcI12CommandExecutor({ persistence, lockProvider, context: incompatible });
  const reopened = await newExecutor.openAsWriter(sessionId);
  assert.equal(reopened.status, 'READ_ONLY');
  assert.equal(newExecutor.snapshot(), null);
  await newExecutor.close();
});


test('T-CTX-32 replacement drain waits for admitted writer lease', async () => {
  const leases = createWriterIntentLeaseRegistry();
  const executorRef = {};
  const lease = leases.begin({ executorRef, sessionEpoch: 4, contextGeneration: 7, canAccept: true });
  let drained = false;
  const drain = leases.waitForDrain().then(() => { drained = true; });
  await Promise.resolve();
  assert.equal(drained, false);
  assert.equal(leases.release(lease), true);
  await drain;
  assert.equal(drained, true);
});

test('T-CTX-33 failed admitted intent can release lease without blocking drain', async () => {
  const leases = createWriterIntentLeaseRegistry();
  const lease = leases.begin({ executorRef: {}, sessionEpoch: 1, contextGeneration: 1, canAccept: true });
  assert.equal(leases.size, 1);
  assert.equal(leases.release(lease), true);
  assert.equal(leases.release(lease), false);
  await leases.waitForDrain();
  assert.equal(leases.size, 0);
});

test('T-CTX-35 OLD lease never authorizes a NEW executor or changed epoch/generation', () => {
  const leases = createWriterIntentLeaseRegistry();
  const oldExecutor = {};
  const newExecutor = {};
  const lease = leases.begin({ executorRef: oldExecutor, sessionEpoch: 3, contextGeneration: 5, canAccept: true });
  const active = leases.isActive(lease);
  assert.equal(leaseAuthorizesExecutor(lease, {
    executorRef: oldExecutor, sessionEpoch: 3, contextGeneration: 5, isActive: active,
  }), true);
  assert.equal(leaseAuthorizesExecutor(lease, {
    executorRef: newExecutor, sessionEpoch: 3, contextGeneration: 5, isActive: active,
  }), false);
  assert.equal(leaseAuthorizesExecutor(lease, {
    executorRef: oldExecutor, sessionEpoch: 4, contextGeneration: 5, isActive: active,
  }), false);
  assert.equal(leaseAuthorizesExecutor(lease, {
    executorRef: oldExecutor, sessionEpoch: 3, contextGeneration: 6, isActive: active,
  }), false);
  leases.release(lease);
  assert.equal(leaseAuthorizesExecutor(lease, {
    executorRef: oldExecutor, sessionEpoch: 3, contextGeneration: 5, isActive: leases.isActive(lease),
  }), false);
});

test('T-CTX-38 drain waits for every OLD lease and unadmitted work never enters wait-set', async () => {
  const leases = createWriterIntentLeaseRegistry();
  const executorRef = {};
  const a = leases.begin({ executorRef, sessionEpoch: 2, contextGeneration: 9, canAccept: true });
  const b = leases.begin({ executorRef, sessionEpoch: 2, contextGeneration: 9, canAccept: true });
  const blocked = leases.begin({ executorRef, sessionEpoch: 2, contextGeneration: 9, canAccept: false });
  assert.equal(blocked, null);
  assert.equal(leases.size, 2);
  let drained = false;
  const drain = leases.waitForDrain().then(() => { drained = true; });
  leases.release(a);
  await Promise.resolve();
  assert.equal(drained, false);
  leases.release(b);
  await drain;
  assert.equal(drained, true);
});

test('T-CTX-34 NEEDS_DECISION flow releases OLD lease before human decision and retry uses runWriterIntent', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');

  const leaseStart = source.indexOf('async function withWriterIntent');
  const leaseEnd = source.indexOf('\nasync function applyDecisionFlow', leaseStart);
  const leaseBody = source.slice(leaseStart, leaseEnd);
  assert.match(leaseBody, /finally\s*\{\s*state\.writerIntentLeases\.release\(lease\)/);

  const runStart = source.indexOf('async function runWriterIntent');
  const runEnd = source.indexOf('\nasync function runCompositeWriterIntent', runStart);
  const runBody = source.slice(runStart, runEnd);
  assert.ok(runBody.indexOf('await withWriterIntent') < runBody.indexOf('await applyDecisionFlow'));

  const decisionStart = source.indexOf('async function applyDecisionFlow');
  const decisionEnd = source.indexOf('\nfunction reportWriterResult', decisionStart);
  const decisionBody = source.slice(decisionStart, decisionEnd);
  assert.match(decisionBody, /return runWriterIntent\(retry, \{ allowDecisionRetry: false \}\)/);
});

test('T-CTX-40 autosave and replacement use lease authority rather than autosaveInFlight as close barrier', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const saveStart = source.indexOf('async function saveBufferKey');
  const saveEnd = source.indexOf('\nfunction scheduleAutosave', saveStart);
  assert.match(source.slice(saveStart, saveEnd), /const promise = runWriterIntent\(/);
  const replaceStart = source.indexOf('export async function replaceWriterContext');
  const replaceEnd = source.indexOf('\nasync function sessionSwitchBarrier', replaceStart);
  const replaceBody = source.slice(replaceStart, replaceEnd);
  assert.match(replaceBody, /contextGate\.beginReplacement\(\)/);
  assert.match(replaceBody, /await state\.writerIntentLeases\.waitForDrain\(\)/);
  assert.ok(replaceBody.indexOf('waitForDrain()') < replaceBody.indexOf('state.executor.close()'));
});

test('T-CTX-43 NEW context installation advances generation before constructing NEW executor', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('export async function replaceWriterContext');
  const end = source.indexOf('\nasync function sessionSwitchBarrier', start);
  const body = source.slice(start, end);
  const generationAt = body.indexOf('state.contextGeneration += 1');
  const resetAt = body.indexOf('resetExecutor(state.contextDependencies)');
  assert.ok(generationAt >= 0 && resetAt > generationAt);
  assert.doesNotMatch(body.slice(generationAt, resetAt), /await /);
});


test('T-CTX-45 INGEST acquires composite lease before staging await', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function ingestFiles');
  const end = source.indexOf("\n$('newSession')", start);
  const body = source.slice(start, end);
  assert.match(body, /runCompositeWriterIntent\(async lease =>/);
  assert.ok(body.indexOf('runCompositeWriterIntent') < body.indexOf('await stageApcPhotoFile'));
  assert.match(body, /dispatchAdmitted\(\{/);
});

test('T-CTX-46 CONFIRM acquires composite lease before waiting autosave', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function confirmEvidence');
  const end = source.indexOf('\nasync function relinkActivePhoto', start);
  const body = source.slice(start, end);
  assert.match(body, /runCompositeWriterIntent\(async lease =>/);
  assert.ok(body.indexOf('runCompositeWriterIntent') < body.indexOf('await inFlight'));
  assert.match(body, /dispatchAdmitted\(retryIntent, lease\)/);
});

test('T-CTX-47 SET_SESSION_STATUS acquires composite lease before flush await', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function setSessionStatus');
  const end = source.indexOf('\nexport async function replaceWriterContext', start);
  const body = source.slice(start, end);
  assert.match(body, /runCompositeWriterIntent\(async lease =>/);
  assert.ok(body.indexOf('runCompositeWriterIntent') < body.indexOf('await flushAutosave'));
  assert.match(body, /dispatchAdmitted\(\{ type:'SET_SESSION_STATUS', status \}, lease\)/);
});

test('T-CTX-48 blocked composite admission performs no async operation body', async () => {
  const leases = createWriterIntentLeaseRegistry();
  let staged = false;
  const lease = leases.begin({ executorRef: {}, sessionEpoch: 1, contextGeneration: 1, canAccept: false });
  if (lease) staged = true;
  assert.equal(lease, null);
  assert.equal(staged, false);
});

test('T-CTX-49 composite writer helper acquires lease before invoking operation', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function withWriterIntent');
  const end = source.indexOf('\nasync function applyDecisionFlow', start);
  const body = source.slice(start, end);
  assert.ok(body.indexOf('beginWriterIntent()') < body.indexOf('await operation(lease)'));
  assert.match(body, /finally\s*\{\s*state\.writerIntentLeases\.release\(lease\)/);
});

test('T-CTX-50 decision flow executes after composite lease release and retries as new intent', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const compositeStart = source.indexOf('async function runCompositeWriterIntent');
  const compositeEnd = source.indexOf('\nfunction patchFromBuffer', compositeStart);
  const body = source.slice(compositeStart, compositeEnd);
  assert.ok(body.indexOf('await withWriterIntent(operation)') < body.indexOf('await applyDecisionFlow'));
  const decisionStart = source.indexOf('async function applyDecisionFlow');
  const decisionEnd = source.indexOf('\nfunction reportWriterResult', decisionStart);
  const decision = source.slice(decisionStart, decisionEnd);
  assert.match(decision, /return runWriterIntent\(retry, \{ allowDecisionRetry: false \}\)/);
});

test('T-CTX-51 OLD composite lease cannot migrate to NEW context after async suspension', () => {
  const leases = createWriterIntentLeaseRegistry();
  const oldExecutor = {};
  const newExecutor = {};
  const lease = leases.begin({ executorRef: oldExecutor, sessionEpoch: 8, contextGeneration: 12, canAccept: true });
  assert.equal(leaseAuthorizesExecutor(lease, {
    executorRef: newExecutor,
    sessionEpoch: 1,
    contextGeneration: 13,
    isActive: leases.isActive(lease),
  }), false);
  leases.release(lease);
});


test('T-CTX-52 session switch closes gate and executor intake before first await', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function sessionSwitchBarrier');
  const end = source.indexOf('\nasync function ingestFiles', start);
  const body = source.slice(start, end);
  const gateAt = body.indexOf('state.contextGate.beginReplacement()');
  const stopAt = body.indexOf('state.executor?.stopAcceptingWrites()');
  const firstAwaitAt = body.indexOf('await ');
  assert.ok(gateAt >= 0);
  assert.ok(stopAt > gateAt);
  assert.ok(firstAwaitAt > stopAt);
});

test('T-CTX-53 session switch drains admitted leases before closing OLD executor', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function sessionSwitchBarrier');
  const end = source.indexOf('\nasync function ingestFiles', start);
  const body = source.slice(start, end);
  const drainAt = body.indexOf('await state.writerIntentLeases.waitForDrain()');
  const closeAt = body.indexOf('await state.executor.close()');
  const resetAt = body.indexOf('resetExecutor()');
  const actionAt = body.indexOf('result = await action()');
  assert.ok(drainAt >= 0);
  assert.ok(closeAt > drainAt);
  assert.ok(resetAt > closeAt);
  assert.ok(actionAt > resetAt);
});

test('T-CTX-54 context replacement also stops executor intake before lease drain', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('export async function replaceWriterContext');
  const end = source.indexOf('\nasync function sessionSwitchBarrier', start);
  const body = source.slice(start, end);
  const gateAt = body.indexOf('state.contextGate.beginReplacement()');
  const stopAt = body.indexOf('state.executor?.stopAcceptingWrites()');
  const drainAt = body.indexOf('await state.writerIntentLeases.waitForDrain()');
  assert.ok(gateAt >= 0);
  assert.ok(stopAt > gateAt);
  assert.ok(drainAt > stopAt);
});

test('T-CTX-55 stopAcceptingWrites preserves active commit, stales queued command, and rejects new dispatch', async () => {
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
  const created = await executor.bootstrap({ objective: 'intake stop regression' });
  assert.equal(created.status, 'COMMITTED');

  blockNextSave = true;
  const base = executor.commandBase();
  const active = executor.dispatch({ ...base, type: 'CREATE_INDIVIDUAL' });
  const queued = executor.dispatch({ ...base, type: 'CREATE_INDIVIDUAL' });
  await saveStartedPromise;

  executor.stopAcceptingWrites();
  const rejected = await executor.dispatch(executor.commandBase({ type: 'CREATE_INDIVIDUAL' }));
  assert.equal(rejected.status, 'READ_ONLY');

  releaseSave();
  const activeResult = await active;
  const queuedResult = await queued;
  assert.equal(activeResult.status, 'COMMITTED');
  assert.equal(queuedResult.status, 'STALE_COMMAND');

  await executor.close();
  assert.equal(locks._held.has(created.session.sessionId), false);
});

test('T-CTX-56 session switch derives gate state from completed replacement result', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function sessionSwitchBarrier');
  const end = source.indexOf('\nasync function ingestFiles', start);
  const body = source.slice(start, end);
  const actionAt = body.indexOf('result = await action()');
  const readyAt = body.indexOf("state.contextGate.finish('READY')");
  const readOnlyAt = body.indexOf("state.contextGate.finish('READ_ONLY')");
  const errorAt = body.lastIndexOf("state.contextGate.finish('ERROR')");
  assert.ok(actionAt >= 0);
  assert.ok(readyAt > actionAt);
  assert.ok(readOnlyAt > actionAt);
  assert.ok(errorAt > actionAt);
});

test('T-CTX-57 new/open/import callbacks return their result to the session switch barrier', async () => {
  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  for (const marker of ["$('newSession').onclick", "$('openSession').onclick", "$('importJson').onchange"]) {
    const start = source.indexOf(marker);
    assert.ok(start >= 0);
    const nextHandler = source.indexOf("\n$('", start + marker.length);
    const end = nextHandler >= 0 ? nextHandler : Math.min(source.length, start + 2200);
    const body = source.slice(start, end);
    assert.match(body, /return result;/);
  }
});
