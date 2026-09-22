import test from 'node:test';
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
