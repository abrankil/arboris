import {
  ApcI12CommandExecutor,
  createBrowserWriterLockProvider,
  createLocalStorageApcPersistence,
} from '../apc-i12-executor.mjs';
import {
  ApcAssetRuntime,
  stageApcPhotoFile,
  verifyApcRelinkFile,
} from '../apc-i12-assets.mjs';
import {
  buildApcI12Export,
  deriveApcI12SessionDiagnostics,
} from '../apc-i12-contract.mjs';
import {
  createApcContradictionRelevanceProvider,
  createApcStateIncompatibilityProvider,
} from '../apc-i12-semantics.mjs';
import { runApcIndividualThroughAce } from '../apc-i11-e2e.mjs';
import { loadBrowserCanonicalDataset } from './apc-ui-dataset.mjs';
import { derivePhotoUiStatus } from './apc-ui-status.mjs';
import { derivePhotoNavigationTarget } from './apc-ui-navigation.mjs';
import {
  createWriterContextGate,
  createWriterIntentLeaseRegistry,
  leaseAuthorizesExecutor,
} from './apc-ui-context.mjs';

const $ = id => document.getElementById(id);
const state = {
  dataset: null,
  context: null,
  executor: null,
  assets: new ApcAssetRuntime(),
  activePhotoId: null,
  activeIndividualId: null,
  inspectionSession: null,
  messages: [],
  editBuffers: new Map(),
  autosaveTimers: new Map(),
  autosaveInFlight: new Map(),
  runtimeTail: Promise.resolve(),
  formCharacterId: null,
  batchUndo: null,
  selectedPhotoIds: new Set(),
  contextGate: createWriterContextGate('ERROR'),
  contextDependencies: null,
  contextGeneration: 0,
  writerIntentLeases: createWriterIntentLeaseRegistry(),
};

function message(text) {
  state.messages.unshift(`${new Date().toLocaleTimeString()} · ${text}`);
  $('messages').textContent = state.messages.slice(0, 20).join('\n');
}

function actorId() {
  return $('actorId').value.trim() || 'local-human';
}

function newId(kind='id') {
  return `${kind.toUpperCase()}-${crypto.randomUUID()}`;
}

function currentSession() {
  return state.executor?.snapshot() ?? state.inspectionSession;
}

function hasWriterAuthority() {
  return Boolean(state.executor?.snapshot());
}

function canAcceptWriterIntent() {
  return state.contextGate.state === 'READY' && hasWriterAuthority();
}

function inWriteMode() {
  return hasWriterAuthority();
}

function activePhoto(session=currentSession()) {
  return session?.photos?.find(item => item.photoId === state.activePhotoId) ?? null;
}

function activeIndividual(session=currentSession()) {
  return session?.individuals?.find(item => item.individualId === state.activeIndividualId) ?? null;
}

function currentEvidence(session=currentSession()) {
  if (!session || !state.activePhotoId || !state.activeIndividualId) return null;
  const characterId = state.formCharacterId ?? $('character').value;
  return session.evidence.find(item =>
    item.current === true &&
    item.photoId === state.activePhotoId &&
    item.individualId === state.activeIndividualId &&
    item.characterId === characterId
  ) ?? null;
}

function bufferKey(photoId = state.activePhotoId, individualId = state.activeIndividualId, characterId = (state.formCharacterId ?? $('character').value)) {
  if (!photoId || !individualId || !characterId) return null;
  return `${photoId}::${individualId}::${characterId}`;
}

function readFormBuffer() {
  const key = bufferKey();
  const runtime = key ? state.editBuffers.get(key) : null;
  return {
    evidenceStatus: $('evidenceStatus').value,
    observedState: $('evidenceStatus').value === 'OBSERVED' ? ($('observedState').value || null) : null,
    reason: $('evidenceStatus').value === 'OBSERVED' ? null : ($('reason').value.trim() || null),
    notes: $('notes').value.trim() || null,
    acquisition: runtime?.acquisition ? structuredClone(runtime.acquisition) : null,
  };
}

function writeFormBuffer(buffer) {
  if (!buffer) return;
  $('evidenceStatus').value = buffer.evidenceStatus ?? 'OBSERVED';
  $('observedState').value = buffer.observedState ?? '';
  $('reason').value = buffer.reason ?? '';
  $('notes').value = buffer.notes ?? '';
  syncEvidenceFormMode();
}

function captureActiveEditBuffer() {
  const key = bufferKey();
  if (!key) return;
  const previous = state.editBuffers.get(key);
  const next = readFormBuffer();
  if (previous?.acquisition) next.acquisition = structuredClone(previous.acquisition);
  state.editBuffers.set(key, next);
}

function clearEditBuffers() {
  for (const timer of state.autosaveTimers.values()) clearTimeout(timer);
  state.autosaveTimers.clear();
  state.autosaveInFlight.clear();
  state.editBuffers.clear();
}

function bufferIsPersistible(buffer) {
  if (!buffer) return false;
  if (buffer.evidenceStatus === 'OBSERVED') return Boolean(buffer.observedState);
  if (buffer.evidenceStatus === 'UNCERTAIN' || buffer.evidenceStatus === 'NOT_OBSERVABLE') {
    return Boolean(buffer.reason);
  }
  return false;
}

function parseBufferKey(key) {
  const [photoId, individualId, characterId] = String(key).split('::');
  return { photoId, individualId, characterId };
}

function findCurrentEvidenceForTarget(session, photoId, individualId, characterId) {
  return session?.evidence?.find(item =>
    item.current === true &&
    item.photoId === photoId &&
    item.individualId === individualId &&
    item.characterId === characterId
  ) ?? null;
}

function evidenceHistory(session=currentSession()) {
  const current = currentEvidence(session);
  if (!current) return [];
  return session.evidence
    .filter(item => item.evidenceId === current.evidenceId)
    .slice()
    .sort((a,b)=>a.revision-b.revision);
}

function buildContext(dependencies = state.contextDependencies) {
  const dataset = dependencies?.dataset ?? state.dataset;
  const areStatesIncompatible = dependencies?.areStatesIncompatible ?? createApcStateIncompatibilityProvider(dataset);
  const isContradictionRelevant = dependencies?.isContradictionRelevant ?? createApcContradictionRelevanceProvider();
  return {
    dataset,
    newId,
    now: () => new Date().toISOString(),
    actorId: actorId(),
    areStatesIncompatible,
    isContradictionRelevant,
  };
}

function resetExecutor(dependencies = state.contextDependencies) {
  state.context = buildContext(dependencies);
  state.executor = new ApcI12CommandExecutor({
    persistence: createLocalStorageApcPersistence(localStorage),
    lockProvider: createBrowserWriterLockProvider(),
    context: state.context,
  });
}

function disableWrites(disabled) {
  for (const id of [
    'photoFiles','createIndividual','assignPhoto','unassignPhoto',
    'saveDraft','confirmEvidence','addRequirement',
    'batchAddInbox','batchRemoveInbox','undoBatch'
  ]) $(id).disabled = disabled;
}

function chooseFallbackTargets(session) {
  if (!session) {
    state.activePhotoId = null;
    state.activeIndividualId = null;
    return;
  }
  if (!session.photos.some(p=>p.photoId===state.activePhotoId)) {
    state.activePhotoId = session.photos[0]?.photoId ?? null;
  }
  const photo = activePhoto(session);
  const candidates = photo?.individualRefs ?? [];
  if (!candidates.includes(state.activeIndividualId)) {
    state.activeIndividualId = candidates[0] ?? session.individuals[0]?.individualId ?? null;
  }
}

function renderCharacters() {
  const select = $('character');
  const selected = select.value;
  select.replaceChildren();
  for (const character of state.dataset?.allCharacters ?? []) {
    const option = document.createElement('option');
    option.value = character.characterId;
    option.textContent = `${character.characterId} · ${character.name}`;
    select.append(option);
  }
  if ([...select.options].some(o=>o.value===selected)) select.value = selected;
  state.formCharacterId = select.value || null;
  renderCharacterHelp();
}

function renderCharacterHelp() {
  const character = state.dataset?.allCharactersById?.get($('character').value);
  $('characterHelp').textContent = character
    ? `${character.description ?? ''} · observable foto: ${character.imageObservable ?? 'n/d'}`
    : '';
  const observed = $('observedState');
  const selected = observed.value;
  observed.replaceChildren();
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '—';
  observed.append(blank);
  for (const value of character?.allowedStates ?? []) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    observed.append(option);
  }
  if ([...observed.options].some(o=>o.value===selected)) observed.value = selected;
  loadEvidenceIntoForm();
}

function loadEvidenceIntoForm() {
  const ev = currentEvidence();
  const key = bufferKey();
  const buffer = key ? state.editBuffers.get(key) : null;
  $('evidenceLife').textContent = ev ? `${ev.lifecycleStatus} · rev ${ev.revision}` : 'sin evidencia';

  if (buffer) {
    writeFormBuffer(buffer);
  } else if (!ev) {
    $('evidenceStatus').value = 'OBSERVED';
    $('observedState').value = '';
    $('reason').value = '';
    $('notes').value = '';
    syncEvidenceFormMode();
  } else {
    $('evidenceStatus').value = ev.evidenceStatus;
    $('observedState').value = ev.observedState ?? '';
    $('reason').value = ev.reason ?? '';
    $('notes').value = ev.notes ?? '';
    syncEvidenceFormMode();
  }

  $('history').textContent = JSON.stringify(evidenceHistory(), null, 2);
  $('currentEvidence').textContent = JSON.stringify(ev, null, 2);
}

function syncEvidenceFormMode() {
  const observed = $('evidenceStatus').value === 'OBSERVED';
  $('observedState').disabled = !observed;
  $('reason').disabled = observed;
  if (observed) $('reason').value = '';
  else $('observedState').value = '';
}

function photoUiStatus(photo, session=currentSession()) {
  return derivePhotoUiStatus(photo, session);
}

function visiblePhotos(session=currentSession()) {
  const photos = session?.photos ?? [];
  const filter = $('photoFilter')?.value ?? 'ALL';
  return photos.filter(photo => {
    if (filter === 'INBOX') return session.inboxPhotoRefs.includes(photo.photoId);
    const status = photoUiStatus(photo, session);
    if (filter === 'DRAFT') return status === 'DRAFT' || status === 'revisada parcialmente';
    if (filter === 'PENDING') return status === 'required pendiente';
    if (filter === 'CONFIRMED') return status === 'CONFIRMED' || status === 'revisada parcialmente';
    return true;
  });
}

export function deriveRepresentationGaps({ session, activeIndividualId = null }) {
  if (!session) return [];
  return (session.pending ?? [])
    .filter(item => item.kind === 'REPRESENTATION_GAP')
    .filter(item =>
      item.sourceLevel === 'SESSION' && item.sourceRef === session.sessionId ||
      item.sourceLevel === 'INDIVIDUAL' && item.sourceRef === activeIndividualId
    )
    .map(item => ({
      pendingId: item.pendingId,
      status: item.status,
      critical: item.critical,
      sourceLevel: item.sourceLevel,
      sourceRef: item.sourceRef,
      characterId: item.characterId,
      representationTarget: item.representationTarget,
      ...(item.representationTarget === 'STATE' ? { targetState: item.targetState } : {}),
      ...(item.originRequirementId != null ? { originRequirementId: item.originRequirementId } : {}),
    }));
}

export function selectedBatchPhotoIds(selectedPhotoIds, session) {
  if (!session) return [];
  const existing = new Set((session.photos ?? []).map(item => item.photoId));
  return [...selectedPhotoIds].filter(photoId => existing.has(photoId));
}

function togglePhotoSelection(photoId) {
  if (state.selectedPhotoIds.has(photoId)) state.selectedPhotoIds.delete(photoId);
  else state.selectedPhotoIds.add(photoId);
  render();
}

function render() {
  const session = currentSession();
  chooseFallbackTargets(session);

  const mode = inWriteMode() ? 'WRITER' : (session ? 'READ_ONLY' : 'SIN SESIÓN');
  $('mode').textContent = mode;
  $('sessionLabel').textContent = session?.sessionId ?? '';
  disableWrites(!canAcceptWriterIntent());
  $('actorId').disabled = Boolean(session);
  const undoValid = inWriteMode() &&
    batchUndoIsValid(state.batchUndo, session, state.executor?.sessionEpoch);
  if (state.batchUndo && !undoValid) state.batchUndo = null;
  $('undoBatch').disabled = !undoValid;

  $('photos').replaceChildren();
  for (const photo of visiblePhotos(session)) {
    const div = document.createElement('div');
    div.className = 'item' + (photo.photoId===state.activePhotoId ? ' active' : '');
    const selector = document.createElement('input');
    selector.type = 'checkbox';
    selector.checked = state.selectedPhotoIds.has(photo.photoId);
    selector.disabled = !canAcceptWriterIntent();
    selector.setAttribute('aria-label', `Seleccionar ${photo.photoId} para batch`);
    selector.onclick = event => event.stopPropagation();
    selector.onchange = () => togglePhotoSelection(photo.photoId);
    const label = document.createElement('span');
    const inInbox = session.inboxPhotoRefs.includes(photo.photoId);
    label.textContent = `${photo.photoId.slice(0,18)} · ${photo.fileRef}${inInbox ? ' · inbox' : ''} · ${photoUiStatus(photo, session)}`;
    div.append(selector, label);
    div.onclick = () => {
      void changeReviewTarget({ photoId: photo.photoId });
    };
    $('photos').append(div);
  }

  $('individuals').replaceChildren();
  for (const individual of session?.individuals ?? []) {
    const div = document.createElement('div');
    div.className = 'item' + (individual.individualId===state.activeIndividualId ? ' active' : '');
    div.textContent = individual.individualId;
    div.onclick = () => {
      void changeReviewTarget({ individualId: individual.individualId });
    };
    $('individuals').append(div);
  }

  const photo = activePhoto(session);
  const individual = activeIndividual(session);
  $('targetLabel').textContent = photo && individual
    ? `${photo.photoId} × ${individual.individualId}`
    : 'Sin ACTIVE_REVIEW_TARGET completo';

  const runtime = photo ? state.assets.get(photo.photoId) : null;
  $('photoPreview').src = runtime?.objectUrl ?? '';
  $('photoPreview').hidden = !runtime?.objectUrl;
  $('assetStatus').textContent = photo
    ? (runtime ? 'asset disponible' : 'asset no disponible; relink/carga local requerida')
    : '';

  if (session && state.context) {
    const d = deriveApcI12SessionDiagnostics(session, state.context);
    $('diagnostics').innerHTML = Object.entries({
      structural: d.structurallyValid,
      serializable: d.serializableWorkingSnapshot,
      writerReady: d.writerReady,
      exportable: d.exportable,
      pass: d.pass,
      closed: d.closed,
    }).map(([k,v]) => `<div class="${v?'ok':'warn'}">${k}: ${v}</div>`).join('');
    $('pending').textContent = JSON.stringify(session.pending ?? [], null, 2);
    $('representationGaps').textContent = JSON.stringify(deriveRepresentationGaps({
      session,
      activeIndividualId: state.activeIndividualId,
    }), null, 2);
    $('contradictions').textContent = JSON.stringify(session.contradictions ?? [], null, 2);
  } else {
    $('diagnostics').textContent = '';
    $('pending').textContent = '';
    $('representationGaps').textContent = '';
    $('contradictions').textContent = '';
  }

  loadEvidenceIntoForm();
}

export function deriveBatchUndoDescriptor({ before, after, type, photoIds = [], targets = [], individualId = null, sessionEpoch }) {
  if (!before || !after || before.sessionId !== after.sessionId) return null;
  let affectedTargets = [];
  let inverseCommand = null;
  let expectedState = null;

  if (type === 'BATCH_ADD_TO_INBOX' || type === 'BATCH_REMOVE_FROM_INBOX') {
    const beforeSet = new Set(before.inboxPhotoRefs ?? []);
    const afterSet = new Set(after.inboxPhotoRefs ?? []);
    affectedTargets = [...new Set(photoIds)].filter(photoId => beforeSet.has(photoId) !== afterSet.has(photoId));
    if (!affectedTargets.length) return null;
    expectedState = type === 'BATCH_ADD_TO_INBOX' ? 'INBOX' : 'OUT_OF_INBOX';
    inverseCommand = {
      type: type === 'BATCH_ADD_TO_INBOX' ? 'BATCH_REMOVE_FROM_INBOX' : 'BATCH_ADD_TO_INBOX',
      photoIds: [...affectedTargets],
    };
  } else if (type === 'BATCH_ASSIGN_PHOTOS' || type === 'BATCH_UNASSIGN_PHOTOS') {
    const requested = type === 'BATCH_ASSIGN_PHOTOS'
      ? [...new Set(photoIds)].map(photoId => ({ photoId, individualId }))
      : [...new Map(targets.map(item => [`${item.photoId}::${item.individualId}`, item])).values()];
    const assigned = (session, target) => Boolean(session.photos?.find(item => item.photoId === target.photoId)?.individualRefs?.includes(target.individualId));
    affectedTargets = requested.filter(target => assigned(before, target) !== assigned(after, target));
    if (!affectedTargets.length) return null;
    if (type === 'BATCH_UNASSIGN_PHOTOS' &&
        new Set(affectedTargets.map(item => item.individualId)).size !== 1) return null;
    expectedState = type === 'BATCH_ASSIGN_PHOTOS' ? 'ASSIGNED' : 'UNASSIGNED';
    inverseCommand = type === 'BATCH_ASSIGN_PHOTOS'
      ? { type: 'BATCH_UNASSIGN_PHOTOS', targets: structuredClone(affectedTargets) }
      : {
          type: 'BATCH_ASSIGN_PHOTOS',
          photoIds: affectedTargets.map(item => item.photoId),
          individualId: affectedTargets[0].individualId,
        };
  } else {
    return null;
  }

  return {
    sessionId: after.sessionId,
    sessionEpoch,
    inverseCommand,
    affectedTargets: structuredClone(affectedTargets),
    expectedState,
  };
}

export function batchUndoIsValid(descriptor, session, sessionEpoch) {
  if (!descriptor || !session) return false;
  if (descriptor.sessionId !== session.sessionId || descriptor.sessionEpoch !== sessionEpoch) return false;
  if (descriptor.expectedState === 'INBOX' || descriptor.expectedState === 'OUT_OF_INBOX') {
    const inbox = new Set(session.inboxPhotoRefs ?? []);
    const expected = descriptor.expectedState === 'INBOX';
    return descriptor.affectedTargets.every(photoId =>
      session.photos?.some(item => item.photoId === photoId) && inbox.has(photoId) === expected
    );
  }
  const expected = descriptor.expectedState === 'ASSIGNED';
  return descriptor.affectedTargets.every(target => {
    const photo = session.photos?.find(item => item.photoId === target.photoId);
    if (!photo || !session.individuals?.some(item => item.individualId === target.individualId)) return false;
    const assigned = photo.individualRefs?.includes(target.individualId) ?? false;
    if (assigned !== expected) return false;
    if (descriptor.inverseCommand.type === 'BATCH_UNASSIGN_PHOTOS' &&
        (session.evidence ?? []).some(item => item.photoId === target.photoId && item.individualId === target.individualId)) return false;
    return true;
  });
}

function blockedWriterResult() {
  return { status: 'READ_ONLY', session: currentSession(), errors: ['writer intent blocked by runtime context gate'], warnings: [], decisionsRequired: [] };
}

function beginWriterIntent() {
  const executorRef = state.executor;
  return state.writerIntentLeases.begin({
    executorRef,
    sessionEpoch: executorRef?.sessionEpoch,
    contextGeneration: state.contextGeneration,
    canAccept: canAcceptWriterIntent(),
  });
}

function leaseAuthorizesCurrentExecutor(lease) {
  return leaseAuthorizesExecutor(lease, {
    executorRef: state.executor,
    sessionEpoch: state.executor?.sessionEpoch,
    contextGeneration: state.contextGeneration,
    isActive: state.writerIntentLeases.isActive(lease),
  });
}

async function dispatchAdmitted(intent, lease) {
  if (!leaseAuthorizesCurrentExecutor(lease)) return blockedWriterResult();
  const command = state.executor.commandBase(intent);
  return state.executor.dispatch(command);
}

async function withWriterIntent(operation) {
  const lease = beginWriterIntent();
  if (!lease) return blockedWriterResult();
  try {
    return await operation(lease);
  } finally {
    state.writerIntentLeases.release(lease);
  }
}

async function applyDecisionFlow(result, retryIntent, { allowDecisionRetry = true } = {}) {
  if (
    result.status !== 'NEEDS_DECISION' ||
    !allowDecisionRetry ||
    !(result.decisionsRequired ?? []).every(item => item.type === 'PENDING_CRITICAL')
  ) return result;

  // Human interaction is outside the prior lease. Retry is a new writer intent.
  const pendingCriticalByRequirement = {};
  for (const decision of result.decisionsRequired) {
    pendingCriticalByRequirement[decision.requirementId] = window.confirm(
      `Requirement ${decision.requirementId} quedó insatisfecho.\n\nOK = pending crítico\nCancelar = pending no crítico`,
    );
  }
  const retry = structuredClone(retryIntent);
  delete retry.targetSessionId;
  delete retry.baseSessionEpoch;
  delete retry.baseCommitGeneration;
  retry.pendingCriticalByRequirement = {
    ...(retry.pendingCriticalByRequirement ?? {}),
    ...pendingCriticalByRequirement,
  };
  return runWriterIntent(retry, { allowDecisionRetry: false });
}

function reportWriterResult(result) {
  if (result.status !== 'COMMITTED' && result.status !== 'NO_OP') {
    message(`${result.status}: ${(result.errors ?? []).join('; ') || JSON.stringify(result.decisionsRequired ?? [])}`);
  } else {
    message(result.status);
  }
  render();
  return result;
}

async function runWriterIntent(intent, { allowDecisionRetry = true } = {}) {
  let result = await withWriterIntent(lease => dispatchAdmitted(intent, lease));
  result = await applyDecisionFlow(result, intent, { allowDecisionRetry });
  return reportWriterResult(result);
}

async function runCompositeWriterIntent(operation, retryIntentFactory = null) {
  let result = await withWriterIntent(operation);
  const retryIntent = retryIntentFactory ? retryIntentFactory(result) : null;
  if (retryIntent) result = await applyDecisionFlow(result, retryIntent);
  return reportWriterResult(result);
}

function patchFromBuffer(buffer, { confirming = false } = {}) {
  const acquisition = buffer.acquisition?.mode === 'prefilled'
    ? {
        ...structuredClone(buffer.acquisition),
        confirmedOnCurrentPhoto: confirming ? true : (buffer.acquisition.confirmedOnCurrentPhoto ?? false),
      }
    : { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null };
  return {
    evidenceStatus: buffer.evidenceStatus,
    observedState: buffer.evidenceStatus === 'OBSERVED' ? (buffer.observedState ?? null) : null,
    sourceType: 'human',
    sourceId: actorId(),
    acquisition,
    confidence: null,
    reason: buffer.evidenceStatus === 'OBSERVED' ? null : (buffer.reason ?? null),
    notes: buffer.notes ?? null,
  };
}

async function saveBufferKey(key) {
  if (!key || !canAcceptWriterIntent()) return null;
  const buffer = state.editBuffers.get(key);
  if (!buffer || !bufferIsPersistible(buffer)) return null;

  const { photoId, individualId, characterId } = parseBufferKey(key);
  const session = state.executor.snapshot();
  const photo = session?.photos.find(item => item.photoId === photoId);
  if (!photo || !photo.individualRefs.includes(individualId)) return null;

  const ev = findCurrentEvidenceForTarget(session, photoId, individualId, characterId);
  const type = ev?.lifecycleStatus === 'CONFIRMED' ? 'EDIT_CONFIRMED_AS_DRAFT' : 'SAVE_DRAFT';

  const promise = runWriterIntent({
    type,
    evidenceId: ev?.evidenceId ?? null,
    baseRevision: ev?.revision ?? null,
    targetPhotoId: photoId,
    targetIndividualId: individualId,
    characterId,
    patch: patchFromBuffer(buffer),
  });

  state.autosaveInFlight.set(key, promise);
  const result = await promise;
  state.autosaveInFlight.delete(key);

  if (result?.status === 'COMMITTED' || result?.status === 'NO_OP') {
    state.editBuffers.delete(key);
  }
  return result;
}

function scheduleAutosave(key = bufferKey()) {
  if (!key || !canAcceptWriterIntent()) return;
  const existing = state.autosaveTimers.get(key);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    state.autosaveTimers.delete(key);
    saveBufferKey(key).catch(error => message(`autosave: ${error.message}`));
  }, 800);
  state.autosaveTimers.set(key, timer);
}

async function flushAutosave(key, { persistPending = true } = {}) {
  if (!key) return null;
  const timer = state.autosaveTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    state.autosaveTimers.delete(key);
  }

  let result = null;
  const inFlight = state.autosaveInFlight.get(key);
  if (inFlight) result = await inFlight;

  if (persistPending && state.editBuffers.has(key)) {
    result = await saveBufferKey(key);
  }
  return result;
}

async function changeReviewTarget({ photoId = state.activePhotoId, individualId = state.activeIndividualId, characterId = state.formCharacterId } = {}) {
  const oldKey = bufferKey();
  captureActiveEditBuffer();
  const flushResult = await flushAutosave(oldKey);

  if (flushResult && flushResult.status !== 'COMMITTED' && flushResult.status !== 'NO_OP') {
    message('Cambio de target bloqueado: el DRAFT anterior no pudo persistirse');
    render();
    return false;
  }

  const session = currentSession();
  const nextPhoto = session?.photos?.find(item => item.photoId === photoId) ?? null;
  let nextIndividualId = individualId;
  if (nextPhoto) {
    const refs = nextPhoto.individualRefs ?? [];
    if (!refs.includes(nextIndividualId)) nextIndividualId = refs[0] ?? null;
  }

  state.activePhotoId = photoId ?? null;
  state.activeIndividualId = nextIndividualId ?? null;
  state.formCharacterId = characterId ?? $('character').value ?? null;
  if (state.formCharacterId) $('character').value = state.formCharacterId;
  renderCharacterHelp();
  render();
  return true;
}

function captureAndScheduleAutosave() {
  if (!canAcceptWriterIntent()) return;
  const key = bufferKey();
  if (!key) return;
  captureActiveEditBuffer();
  scheduleAutosave(key);
}

function evidencePatch() {
  return patchFromBuffer(readFormBuffer());
}

function priorObservationCandidates(session=currentSession()) {
  if (!session || !state.activeIndividualId || !state.formCharacterId) return [];
  return session.evidence.filter(item =>
    item.current === true &&
    item.lifecycleStatus === 'CONFIRMED' &&
    item.evidenceStatus === 'OBSERVED' &&
    item.individualId === state.activeIndividualId &&
    item.characterId === state.formCharacterId &&
    item.photoId !== state.activePhotoId
  );
}

export function deriveInspectionTargetSuggestions({ session, dataset, activePhotoId = null, activeIndividualId = null }) {
  if (!session || !dataset) return [];

  const requiredIds = new Set((session.requirements ?? [])
    .filter(item => item.required === true)
    .filter(item =>
      item.scopeLevel === 'SESSION' ||
      (item.scopeLevel === 'INDIVIDUAL' && item.scopeRef === activeIndividualId) ||
      (item.scopeLevel === 'PHOTO' && item.scopeRef === activePhotoId)
    )
    .map(item => item.characterId));

  return (dataset.allCharacters ?? [])
    .filter(character => requiredIds.size === 0 || requiredIds.has(character.characterId))
    .map(character => ({
      characterId: character.characterId,
      structure: character.structure ?? character.organ ?? character.name ?? null,
      help: character.description ?? character.observationInstruction ?? null,
    }));
}

function suggestInspectionTargets() {
  const session = currentSession();
  if (!session || !state.dataset) return message('Sugerencias requieren sesión y dataset');
  const candidates = deriveInspectionTargetSuggestions({
    session,
    dataset: state.dataset,
    activePhotoId: state.activePhotoId,
    activeIndividualId: state.activeIndividualId,
  });

  // Runtime-only descriptor. Deliberately no observedState field and no form
  // mutation: automatic suggestions may guide inspection, never infer state.
  $('inspectionSuggestions').textContent = JSON.stringify(candidates, null, 2);
  message(`SUGGEST_INSPECTION_TARGETS: ${candidates.length} candidato(s); sin estado botánico`);
  return candidates;
}

function prefillFromPriorObservation() {
  const key = bufferKey();
  if (!key || !inWriteMode()) return message('Prefill requiere ACTIVE_REVIEW_TARGET en write mode');
  const candidates = priorObservationCandidates();
  if (!candidates.length) return message('Prefill: no existe observación previa CONFIRMED para este individuo/carácter');

  const prior = candidates.slice().sort((a,b) => b.revision - a.revision)[0];
  const refs = [...new Set(candidates.map(item => item.photoEvidenceRef).filter(Boolean))];
  const buffer = {
    evidenceStatus: prior.evidenceStatus,
    observedState: prior.observedState ?? null,
    reason: prior.reason ?? null,
    notes: prior.notes ?? null,
    acquisition: {
      mode: 'prefilled',
      confirmedOnCurrentPhoto: false,
      basis: { type: 'prior_observations', photoEvidenceRefs: refs },
    },
  };

  const timer = state.autosaveTimers.get(key);
  if (timer) clearTimeout(timer);
  state.autosaveTimers.delete(key);
  state.editBuffers.set(key, buffer);
  writeFormBuffer(buffer);
  message('Prefill aplicado sólo a editBuffer; requiere confirmación humana sobre la foto actual');
  render();
}

async function saveDraft() {
  if (!activePhoto() || !activeIndividual()) return message('Falta ACTIVE_REVIEW_TARGET');
  captureActiveEditBuffer();
  const key = bufferKey();
  const result = await flushAutosave(key);
  if (!result && state.editBuffers.has(key)) message('DRAFT incompleto: permanece sólo en editBuffer');
}

async function confirmEvidence() {
  if (!activePhoto() || !activeIndividual()) return message('Falta ACTIVE_REVIEW_TARGET');

  let retryIntent = null;
  const result = await runCompositeWriterIntent(async lease => {
    const key = bufferKey();
    captureActiveEditBuffer();

    const timer = state.autosaveTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      state.autosaveTimers.delete(key);
    }
    const inFlight = state.autosaveInFlight.get(key);
    if (inFlight) {
      const draftResult = await inFlight;
      if (draftResult && draftResult.status !== 'COMMITTED' && draftResult.status !== 'NO_OP') {
        return { status: 'READ_ONLY', session: currentSession(), errors: ['DRAFT previo no pudo persistirse'], warnings: [], decisionsRequired: [] };
      }
    }

    const buffer = state.editBuffers.get(key) ?? readFormBuffer();
    if (!bufferIsPersistible(buffer)) {
      return { status: 'READ_ONLY', session: currentSession(), errors: ['evidencia incompleta'], warnings: [], decisionsRequired: [] };
    }

    const ev = currentEvidence();
    const type = ev?.lifecycleStatus === 'CONFIRMED' ? 'EDIT_AND_RECONFIRM' : 'CONFIRM_EVIDENCE';
    retryIntent = {
      type,
      evidenceId: ev?.evidenceId ?? null,
      baseRevision: ev?.revision ?? null,
      targetPhotoId: state.activePhotoId,
      targetIndividualId: state.activeIndividualId,
      characterId: state.formCharacterId ?? $('character').value,
      patch: patchFromBuffer(buffer, { confirming: true }),
      confirmation: {
        confirmedByType: 'human',
        confirmedById: actorId(),
        confirmedAt: new Date().toISOString(),
      },
    };
    return dispatchAdmitted(retryIntent, lease);
  }, result => result.status === 'NEEDS_DECISION' ? retryIntent : null);

  const key = bufferKey();
  if (result.status === 'COMMITTED' || result.status === 'NO_OP') state.editBuffers.delete(key);
}

async function relinkActivePhoto(file) {
  const session = currentSession();
  const photo = activePhoto(session);
  if (!photo || !file) return;
  const pe = session?.photoEvidence?.find(item => item.photoEvidenceId === photo.photoEvidenceId);
  const fingerprint = pe?.sourcePhoto?.fingerprintSha256;
  if (!fingerprint) return message('Relink rechazado: PHOTO sin fingerprint canónico');

  const verification = await verifyApcRelinkFile(file, fingerprint);
  if (!verification.match) {
    return message(`Relink rechazado: ${verification.reason}`);
  }
  state.assets.attach(photo.photoId, file);
  message('Relink OK: fingerprint coincide; APC_SESSION sin cambios');
  render();
}

async function navigatePhoto(delta) {
  const session = currentSession();
  const targetPhotoId = derivePhotoNavigationTarget({
    visiblePhotoIds: visiblePhotos(session).map(item => item.photoId),
    activePhotoId: state.activePhotoId,
    delta,
  });
  if (targetPhotoId == null || targetPhotoId === state.activePhotoId) return;
  await changeReviewTarget({ photoId: targetPhotoId });
}

async function batchInbox(type) {
  const before = state.executor?.snapshot();
  const photoIds = selectedBatchPhotoIds(state.selectedPhotoIds, before);
  if (!photoIds.length) return message('Selecciona al menos una foto para el batch');
  const result = await runWriterIntent({ type, photoIds });
  if (result.status === 'COMMITTED') {
    state.batchUndo = deriveBatchUndoDescriptor({
      before,
      after: state.executor.snapshot(),
      type,
      photoIds,
      sessionEpoch: state.executor.sessionEpoch,
    });
  }
  render();
}

async function undoLastBatch() {
  const session = state.executor?.snapshot();
  const descriptor = state.batchUndo;
  if (!batchUndoIsValid(descriptor, session, state.executor?.sessionEpoch)) {
    state.batchUndo = null;
    render();
    return message('Undo batch ya no es válido');
  }
  const intent = structuredClone(descriptor.inverseCommand);
  const result = await runWriterIntent(intent);
  if (result.status === 'COMMITTED' || result.status === 'NO_OP') {
    state.batchUndo = null;
  } else {
    const current = state.executor?.snapshot();
    if (!batchUndoIsValid(state.batchUndo, current, state.executor?.sessionEpoch)) {
      state.batchUndo = null;
    }
  }
  render();
}

async function setSessionStatus(status) {
  await runCompositeWriterIntent(async lease => {
    const key = bufferKey();
    captureActiveEditBuffer();
    const flushed = await flushAutosave(key);
    if (flushed && flushed.status !== 'COMMITTED' && flushed.status !== 'NO_OP') {
      return { status: 'READ_ONLY', session: currentSession(), errors: ['DRAFT previo no persistido'], warnings: [], decisionsRequired: [] };
    }
    return dispatchAdmitted({ type:'SET_SESSION_STATUS', status }, lease);
  });
}

export async function replaceWriterContext(newDependencies) {
  if (!state.contextGate.beginReplacement()) {
    return { status: 'REPLACEMENT_IN_PROGRESS' };
  }

  // The gate closes synchronously before the first await. Work already
  // admitted under READY may finish; no new OLD intent may be admitted.
  // The executor intake closes at the same boundary so already-queued
  // commands that have not begun become STALE instead of draining as writes.
  state.executor?.stopAcceptingWrites();
  const sessionId = state.executor?.snapshot()?.sessionId ?? null;

  try {
    for (const timer of state.autosaveTimers.values()) clearTimeout(timer);
    state.autosaveTimers.clear();

    await state.writerIntentLeases.waitForDrain();

    if (state.executor) await state.executor.close();

    clearEditBuffers();
    state.batchUndo = null;
    state.selectedPhotoIds.clear();
    state.inspectionSession = null;
    state.assets.clear();
    state.activePhotoId = null;
    state.activeIndividualId = null;
    state.formCharacterId = $('character').value || null;

    state.contextGeneration += 1;
    state.dataset = newDependencies.dataset;
    state.contextDependencies = {
      dataset: newDependencies.dataset,
      areStatesIncompatible: newDependencies.areStatesIncompatible,
      isContradictionRelevant: newDependencies.isContradictionRelevant,
    };
    renderCharacters();
    resetExecutor(state.contextDependencies);

    if (!sessionId) {
      state.contextGate.finish('READY');
      render();
      return { status: 'NO_SESSION' };
    }

    const result = await state.executor.openAsWriter(sessionId);
    if (result.status === 'COMMITTED') {
      state.contextGate.finish('READY');
      render();
      return { status: 'REOPENED_WRITER', result };
    }

    state.inspectionSession = result.session ?? null;
    state.contextGate.finish(result.status === 'READ_ONLY' ? 'READ_ONLY' : 'ERROR');
    render();
    return { status: result.status, result };
  } catch (error) {
    state.contextGate.finish('ERROR');
    disableWrites(true);
    render();
    return { status: 'ERROR', error };
  }
}

async function sessionSwitchBarrier(action) {
  if (!state.contextGate.beginReplacement()) {
    return { status: 'REPLACEMENT_IN_PROGRESS' };
  }

  // Close admission and executor intake synchronously before the first await.
  // Already-active work may finish. Commands queued but not yet started become
  // STALE_COMMAND because executor.accepting is already false.
  state.executor?.stopAcceptingWrites();

  for (const timer of state.autosaveTimers.values()) clearTimeout(timer);
  state.autosaveTimers.clear();

  // Composite writer intents may be doing async pre-dispatch work (for example
  // hashing/staging a photo). Keep the OLD executor/session alive until every
  // admitted lease has terminated, but do not admit any new writer intent.
  await state.writerIntentLeases.waitForDrain();

  const inFlight = [...state.autosaveInFlight.values()];
  if (inFlight.length) await Promise.allSettled(inFlight);

  if (state.executor) await state.executor.close();

  clearEditBuffers();
  state.batchUndo = null;
  state.selectedPhotoIds.clear();
  state.inspectionSession = null;
  state.assets.clear();
  state.activePhotoId = null;
  state.activeIndividualId = null;
  state.formCharacterId = $('character').value || null;

  resetExecutor();

  let result;
  try {
    result = await action();
  } catch (error) {
    state.contextGate.finish('ERROR');
    disableWrites(true);
    render();
    return { status: 'ERROR', error };
  }

  if (result?.status === 'COMMITTED' || result?.status === 'NO_OP') {
    state.contextGate.finish('READY');
  } else if (result?.status === 'READ_ONLY') {
    state.contextGate.finish('READ_ONLY');
  } else {
    state.contextGate.finish('ERROR');
  }
  render();
  return result;
}

async function ingestFiles(files) {
  const staged = [];
  const result = await runCompositeWriterIntent(async lease => {
    for (const file of files) {
      staged.push(await stageApcPhotoFile(file));
    }
    return dispatchAdmitted({
      type:'INGEST_PHOTOS',
      photos: staged.map(item => ({
        fileRef:item.fileRef,
        fingerprintSha256:item.fingerprintSha256,
      })),
    }, lease);
  });
  if (result.status !== 'COMMITTED' && result.status !== 'NO_OP') return;

  const session = state.executor.snapshot();
  for (const item of staged) {
    const pe = session.photoEvidence.find(x =>
      x.sourcePhoto.fingerprintSha256.toLowerCase() === item.fingerprintSha256.toLowerCase()
    );
    if (!pe) continue;
    try {
      state.assets.attach(pe.sourcePhoto.photoRef, item.file);
    } catch (error) {
      message(`asset runtime: ${error.message}`);
    }
  }
  render();
}

$('newSession').onclick = async () => {
  await sessionSwitchBarrier(async () => {
    const result = await state.executor.bootstrap({ objective:$('objective').value.trim() || 'Revisión APC I12' });
    message(`bootstrap: ${result.status}`);
    render();
    return result;
  });
};

$('openSession').onclick = async () => {
  const sessionId = $('openSessionId').value.trim();
  if (!sessionId) return message('sessionId requerido');
  await sessionSwitchBarrier(async () => {
    const result = await state.executor.openAsWriter(sessionId);
    if (result.status === 'READ_ONLY' && result.session) state.inspectionSession = result.session;
    message(`open: ${result.status} ${(result.errors??[]).join('; ')}`);
    render();
    return result;
  });
};

$('importJson').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const raw = await file.text();
  await sessionSwitchBarrier(async () => {
    const result = await state.executor.importSession(raw);
    state.inspectionSession = result.status === 'READ_ONLY' ? result.session : null;
    message(`import: ${result.status} ${(result.errors??[]).join('; ')}`);
    render();
    return result;
  });
};

$('photoFiles').onchange = event => ingestFiles([...event.target.files ?? []]);
$('relinkPhoto').onchange = event => relinkActivePhoto(event.target.files?.[0]);
$('photoFilter').onchange = render;
$('prevPhoto').onclick = () => navigatePhoto(-1);
$('nextPhoto').onclick = () => navigatePhoto(1);
$('batchAddInbox').onclick = () => batchInbox('BATCH_ADD_TO_INBOX');
$('batchRemoveInbox').onclick = () => batchInbox('BATCH_REMOVE_FROM_INBOX');
$('undoBatch').onclick = undoLastBatch;
$('closeSession').onclick = () => setSessionStatus('CLOSED');
$('reopenSession').onclick = () => setSessionStatus('OPEN');
$('character').onchange = event => {
  const characterId = event.target.value;
  event.target.value = state.formCharacterId ?? characterId;
  void changeReviewTarget({ characterId });
};
$('evidenceStatus').onchange = () => {
  syncEvidenceFormMode();
  captureAndScheduleAutosave();
};
for (const id of ['observedState', 'reason', 'notes']) {
  $(id).addEventListener('input', captureAndScheduleAutosave);
  $(id).addEventListener('change', captureAndScheduleAutosave);
}
$('suggestInspection').onclick = suggestInspectionTargets;
$('prefillEvidence').onclick = prefillFromPriorObservation;
$('saveDraft').onclick = saveDraft;
$('confirmEvidence').onclick = confirmEvidence;

$('createIndividual').onclick = async () => {
  const r = await runWriterIntent({ type:'CREATE_INDIVIDUAL' });
  if (r.created?.individualId) state.activeIndividualId = r.created.individualId;
  render();
};

$('assignPhoto').onclick = async () => {
  if (!state.activePhotoId || !state.activeIndividualId) return message('Selecciona foto e individuo');
  await runWriterIntent({
    type:'ASSIGN_PHOTO',
    photoId:state.activePhotoId,
    individualId:state.activeIndividualId,
  });
};

$('unassignPhoto').onclick = async () => {
  if (!state.activePhotoId || !state.activeIndividualId) return message('Selecciona foto e individuo');
  await runWriterIntent({
    type:'UNASSIGN_PHOTO',
    photoId:state.activePhotoId,
    individualId:state.activeIndividualId,
  });
};

$('addRequirement').onclick = async () => {
  const session = currentSession();
  if (!session) return;
  const scopeLevel = $('requirementScope').value;
  const scopeRef =
    scopeLevel === 'PHOTO' ? state.activePhotoId :
    scopeLevel === 'INDIVIDUAL' ? state.activeIndividualId :
    session.sessionId;
  if (!scopeRef) return message('No existe scopeRef activo');
  const requirementId = newId('requirement');
  await runWriterIntent({
    type:'ADD_REQUIREMENT',
    requirement:{
      requirementId,
      scopeLevel,
      scopeRef,
      characterId:$('character').value,
      reason:'MANUAL',
      createdBy:actorId(),
    },
    pendingCriticalByRequirement:{
      [requirementId]:$('requirementCritical').checked,
    },
  });
};

$('exportJson').onclick = () => {
  const session = currentSession();
  if (!session || !state.context) return;
  const result = buildApcI12Export(session, state.context);
  if (!result.exportable) {
    message(`export bloqueado: ${result.errors.join('; ')}`);
    return;
  }
  const blob = new Blob([result.json], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  a.click();
  URL.revokeObjectURL(url);
  message(`exportado ${result.filename}`);
};

$('runI11').onclick = () => {
  const session = currentSession();
  if (!session || !state.activeIndividualId) return message('Selecciona individuo');
  try {
    const result = runApcIndividualThroughAce({
      dataset:state.dataset,
      session,
      individualId:state.activeIndividualId,
    });
    $('i11Result').textContent = JSON.stringify(result, null, 2);
    message('I11 ejecutado');
  } catch (error) {
    $('i11Result').textContent = error.stack ?? error.message;
    message(`I11: ${error.message}`);
  }
};

window.addEventListener('beforeunload', () => state.assets.clear());

(async function init() {
  try {
    state.dataset = await loadBrowserCanonicalDataset();
    state.contextDependencies = { dataset: state.dataset };
    state.contextGeneration = 1;
    renderCharacters();
    resetExecutor(state.contextDependencies);
    state.contextGate.finish('READY');
    $('mode').textContent = 'LISTO';
    message('dataset canónico cargado');
    render();
  } catch (error) {
    $('mode').textContent = 'ERROR';
    message(`Inicialización falló: ${error.message}. Sirve el repo por HTTP; file:// no basta para módulos/fetch.`);
    disableWrites(true);
  }
})();


$('actorId').addEventListener('change', async () => {
  if (currentSession()) return;
  if (state.executor) await state.executor.close();
  resetExecutor(state.contextDependencies);
  message('actor actualizado para el próximo contexto writer');
});
