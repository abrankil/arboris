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
  const match = source.match(/export function deriveInspectionTargetSuggestions\([^]*?\n}\n\nfunction suggestInspectionTargets/);
  assert.ok(match, 'pure suggestion derivation must remain exported for regression');
  const body = match[0];
  assert.doesNotMatch(body, /observedState/);

  const dataset = {
    allCharacters: [
      { characterId: 'CH-003', name: 'Margen', description: 'Inspeccionar margen' },
      { characterId: 'CH-004', name: 'Ápice', description: 'Inspeccionar ápice' },
    ],
  };
  const session = {
    requirements: [{
      requirementId: 'REQ-SUGGEST',
      required: true,
      scopeLevel: 'INDIVIDUAL',
      scopeRef: 'IND-001',
      characterId: 'CH-003',
    }],
  };

  const derive = Function('session','dataset','activePhotoId','activeIndividualId',
    body
      .replace(/^export function deriveInspectionTargetSuggestions\([^)]*\) \{/, '')
      .replace(/\n}\n\nfunction suggestInspectionTargets$/, '')
  );
  const suggestions = derive(session, dataset, null, 'IND-001');
  assert.deepEqual(suggestions, [{
    characterId: 'CH-003',
    structure: 'Margen',
    help: 'Inspeccionar margen',
  }]);
  assert.equal(Object.hasOwn(suggestions[0], 'observedState'), false);
});

test('TD-I12-58 SUGGEST_INSPECTION_TARGETS is runtime-only and cannot mutate APC_SESSION', async () => {
  const { executor } = await setup();
  const before = executor.snapshot();
  const beforeRaw = JSON.stringify(before);
  const beforeRevision = before.semanticRevision;

  const source = await fs.readFile(new URL('./ui/apc-ui.mjs', import.meta.url), 'utf8');
  const match = source.match(/export function deriveInspectionTargetSuggestions\([^]*?\n}\n\nfunction suggestInspectionTargets/);
  assert.ok(match);
  const body = match[0];
  const derive = Function('session','dataset','activePhotoId','activeIndividualId',
    body
      .replace(/^export function deriveInspectionTargetSuggestions\([^)]*\) \{/, '')
      .replace(/\n}\n\nfunction suggestInspectionTargets$/, '')
  );
  const dataset = {
    allCharacters: [{ characterId: 'CH-003', name: 'Margen', description: 'Inspeccionar margen' }],
  };
  const suggestions = derive(executor.snapshot(), dataset, null, null);

  assert.equal(suggestions.length, 1);
  assert.equal(Object.hasOwn(suggestions[0], 'observedState'), false);
  assert.equal(JSON.stringify(executor.snapshot()), beforeRaw);
  assert.equal(executor.snapshot().semanticRevision, beforeRevision);
  await executor.close();
});
