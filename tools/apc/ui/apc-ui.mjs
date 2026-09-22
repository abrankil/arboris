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

function inWriteMode() {
  return Boolean(state.executor?.snapshot());
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
  return {
    evidenceStatus: $('evidenceStatus').value,
    observedState: $('evidenceStatus').value === 'OBSERVED' ? ($('observedState').value || null) : null,
    reason: $('evidenceStatus').value === 'OBSERVED' ? null : ($('reason').value.trim() || null),
    notes: $('notes').value.trim() || null,
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
  state.editBuffers.set(key, readFormBuffer());
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

function buildContext() {
  const areStatesIncompatible = createApcStateIncompatibilityProvider(state.dataset);
  const isContradictionRelevant = createApcContradictionRelevanceProvider();
  return {
    dataset: state.dataset,
    newId,
    now: () => new Date().toISOString(),
    actorId: actorId(),
    areStatesIncompatible,
    isContradictionRelevant,
  };
}

function resetExecutor() {
  state.context = buildContext();
  state.executor = new ApcI12CommandExecutor({
    persistence: createLocalStorageApcPersistence(localStorage),
    lockProvider: createBrowserWriterLockProvider(),
    context: state.context,
  });
}

function disableWrites(disabled) {
  for (const id of [
    'photoFiles','createIndividual','assignPhoto','unassignPhoto',
    'saveDraft','confirmEvidence','addRequirement'
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
  const refs = photo?.individualRefs ?? [];
  const evidence = (session?.evidence ?? []).filter(item => item.current === true && item.photoId === photo?.photoId);
  const hasDraft = evidence.some(item => item.lifecycleStatus === 'DRAFT');
  const hasConfirmed = evidence.some(item => item.lifecycleStatus === 'CONFIRMED');
  const hasPending = (session?.pending ?? []).some(item => item.status === 'OPEN' && (
    item.scopeRef === photo?.photoId ||
    (item.scopeLevel === 'INDIVIDUAL' && refs.includes(item.scopeRef))
  ));
  if (hasPending) return 'required pendiente';
  if (hasDraft && hasConfirmed) return 'revisada parcialmente';
  if (hasDraft) return 'DRAFT';
  if (hasConfirmed) return 'CONFIRMED';
  return 'sin revisar';
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

function render() {
  const session = currentSession();
  chooseFallbackTargets(session);

  const mode = inWriteMode() ? 'WRITER' : (session ? 'READ_ONLY' : 'SIN SESIÓN');
  $('mode').textContent = mode;
  $('sessionLabel').textContent = session?.sessionId ?? '';
  disableWrites(!inWriteMode());
  $('actorId').disabled = Boolean(session);

  $('photos').replaceChildren();
  for (const photo of visiblePhotos(session)) {
    const div = document.createElement('div');
    div.className = 'item' + (photo.photoId===state.activePhotoId ? ' active' : '');
    const inInbox = session.inboxPhotoRefs.includes(photo.photoId);
    div.textContent = `${photo.photoId.slice(0,18)} · ${photo.fileRef}${inInbox ? ' · inbox' : ''} · ${photoUiStatus(photo, session)}`;
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
    $('contradictions').textContent = JSON.stringify(session.contradictions ?? [], null, 2);
  } else {
    $('diagnostics').textContent = '';
    $('pending').textContent = '';
    $('contradictions').textContent = '';
  }

  loadEvidenceIntoForm();
}

function commandBase(extra={}) {
  return state.executor.commandBase(extra);
}

async function dispatch(command, { allowDecisionRetry = true } = {}) {
  let result = await state.executor.dispatch(command);

  if (
    result.status === 'NEEDS_DECISION' &&
    allowDecisionRetry &&
    (result.decisionsRequired ?? []).every(item => item.type === 'PENDING_CRITICAL')
  ) {
    const pendingCriticalByRequirement = {};
    for (const decision of result.decisionsRequired) {
      pendingCriticalByRequirement[decision.requirementId] = window.confirm(
        `Requirement ${decision.requirementId} quedó insatisfecho.\n\nOK = pending crítico\nCancelar = pending no crítico`,
      );
    }

    const intent = structuredClone(command);
    delete intent.targetSessionId;
    delete intent.baseSessionEpoch;
    delete intent.baseCommitGeneration;
    intent.pendingCriticalByRequirement = {
      ...(intent.pendingCriticalByRequirement ?? {}),
      ...pendingCriticalByRequirement,
    };

    result = await state.executor.dispatch(state.executor.commandBase(intent));
  }

  if (result.status !== 'COMMITTED' && result.status !== 'NO_OP') {
    message(`${result.status}: ${(result.errors ?? []).join('; ') || JSON.stringify(result.decisionsRequired ?? [])}`);
  } else {
    message(result.status);
  }
  render();
  return result;
}

function patchFromBuffer(buffer) {
  return {
    evidenceStatus: buffer.evidenceStatus,
    observedState: buffer.evidenceStatus === 'OBSERVED' ? (buffer.observedState ?? null) : null,
    sourceType: 'human',
    sourceId: actorId(),
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: buffer.evidenceStatus === 'OBSERVED' ? null : (buffer.reason ?? null),
    notes: buffer.notes ?? null,
  };
}

async function saveBufferKey(key) {
  if (!key || !inWriteMode()) return null;
  const buffer = state.editBuffers.get(key);
  if (!buffer || !bufferIsPersistible(buffer)) return null;

  const { photoId, individualId, characterId } = parseBufferKey(key);
  const session = state.executor.snapshot();
  const photo = session?.photos.find(item => item.photoId === photoId);
  if (!photo || !photo.individualRefs.includes(individualId)) return null;

  const ev = findCurrentEvidenceForTarget(session, photoId, individualId, characterId);
  const type = ev?.lifecycleStatus === 'CONFIRMED' ? 'EDIT_CONFIRMED_AS_DRAFT' : 'SAVE_DRAFT';

  const promise = dispatch(state.executor.commandBase({
    type,
    evidenceId: ev?.evidenceId ?? null,
    baseRevision: ev?.revision ?? null,
    targetPhotoId: photoId,
    targetIndividualId: individualId,
    characterId,
    patch: patchFromBuffer(buffer),
  }));

  state.autosaveInFlight.set(key, promise);
  const result = await promise;
  state.autosaveInFlight.delete(key);

  if (result?.status === 'COMMITTED' || result?.status === 'NO_OP') {
    state.editBuffers.delete(key);
  }
  return result;
}

function scheduleAutosave(key = bufferKey()) {
  if (!key || !inWriteMode()) return;
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
  const key = bufferKey();
  if (!key) return;
  captureActiveEditBuffer();
  scheduleAutosave(key);
}

function evidencePatch() {
  return patchFromBuffer(readFormBuffer());
}

function evidenceCommand(type) {
  const ev = currentEvidence();
  return commandBase({
    type,
    evidenceId: ev?.evidenceId ?? null,
    baseRevision: ev?.revision ?? null,
    targetPhotoId: state.activePhotoId,
    targetIndividualId: state.activeIndividualId,
    characterId: $('character').value,
    patch: evidencePatch(),
  });
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

  const key = bufferKey();
  captureActiveEditBuffer();

  // Confirm is a barrier: cancel the debounce, finish any autosave already
  // running, persist the latest valid buffer as DRAFT, then rebuild CONFIRM
  // from the committed revision. This prevents stale baseRevision races.
  const draftResult = await flushAutosave(key);
  if (draftResult && draftResult.status !== 'COMMITTED' && draftResult.status !== 'NO_OP') {
    return message('Confirmación bloqueada: el DRAFT previo no pudo persistirse');
  }

  const buffer = state.editBuffers.get(key) ?? readFormBuffer();
  if (!bufferIsPersistible(buffer)) {
    return message('Confirmación bloqueada: evidencia incompleta');
  }

  const ev = currentEvidence();
  const type = ev?.lifecycleStatus === 'CONFIRMED' ? 'EDIT_AND_RECONFIRM' : 'CONFIRM_EVIDENCE';
  const command = commandBase({
    type,
    evidenceId: ev?.evidenceId ?? null,
    baseRevision: ev?.revision ?? null,
    targetPhotoId: state.activePhotoId,
    targetIndividualId: state.activeIndividualId,
    characterId: state.formCharacterId ?? $('character').value,
    patch: patchFromBuffer(buffer),
  });
  command.confirmation = {
    confirmedByType: 'human',
    confirmedById: actorId(),
    confirmedAt: new Date().toISOString(),
  };
  const result = await dispatch(command);
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
  const photos = visiblePhotos(session);
  if (!photos.length) return;
  const index = Math.max(0, photos.findIndex(item => item.photoId === state.activePhotoId));
  const next = photos[(index + delta + photos.length) % photos.length];
  await changeReviewTarget({ photoId: next.photoId });
}

async function batchInbox(type) {
  const session = currentSession();
  const photoIds = visiblePhotos(session).map(item => item.photoId);
  if (!photoIds.length) return message('No hay fotos en el filtro actual');
  await dispatch(commandBase({ type, photoIds }));
}

async function setSessionStatus(status) {
  const key = bufferKey();
  captureActiveEditBuffer();
  const flushed = await flushAutosave(key);
  if (flushed && flushed.status !== 'COMMITTED' && flushed.status !== 'NO_OP') {
    return message('Cambio de estado bloqueado: DRAFT previo no persistido');
  }
  await dispatch(commandBase({ type:'SET_SESSION_STATUS', status }));
}

async function ingestFiles(files) {
  if (!inWriteMode()) return;
  const staged = [];
  for (const file of files) {
    staged.push(await stageApcPhotoFile(file));
  }
  const result = await dispatch(commandBase({
    type:'INGEST_PHOTOS',
    photos: staged.map(item => ({
      fileRef:item.fileRef,
      fingerprintSha256:item.fingerprintSha256,
    })),
  }));
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
  if (state.executor) await state.executor.close();
  resetExecutor();
  state.inspectionSession = null;
  state.assets.clear();
  const result = await state.executor.bootstrap({ objective:$('objective').value.trim() || 'Revisión APC I12' });
  message(`bootstrap: ${result.status}`);
  render();
};

$('openSession').onclick = async () => {
  if (!state.executor) resetExecutor();
  state.inspectionSession = null;
  state.assets.clear();
  const result = await state.executor.openAsWriter($('openSessionId').value.trim());
  if (result.status === 'READ_ONLY' && result.session) state.inspectionSession = result.session;
  message(`open: ${result.status} ${(result.errors??[]).join('; ')}`);
  render();
};

$('importJson').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!state.executor) resetExecutor();
  const raw = await file.text();
  const result = await state.executor.importSession(raw);
  state.inspectionSession = result.status === 'READ_ONLY' ? result.session : null;
  message(`import: ${result.status} ${(result.errors??[]).join('; ')}`);
  render();
};

$('photoFiles').onchange = event => ingestFiles([...event.target.files ?? []]);
$('relinkPhoto').onchange = event => relinkActivePhoto(event.target.files?.[0]);
$('photoFilter').onchange = render;
$('prevPhoto').onclick = () => navigatePhoto(-1);
$('nextPhoto').onclick = () => navigatePhoto(1);
$('batchAddInbox').onclick = () => batchInbox('BATCH_ADD_TO_INBOX');
$('batchRemoveInbox').onclick = () => batchInbox('BATCH_REMOVE_FROM_INBOX');
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
$('saveDraft').onclick = saveDraft;
$('confirmEvidence').onclick = confirmEvidence;

$('createIndividual').onclick = async () => {
  const r = await dispatch(commandBase({ type:'CREATE_INDIVIDUAL' }));
  if (r.created?.individualId) state.activeIndividualId = r.created.individualId;
  render();
};

$('assignPhoto').onclick = async () => {
  if (!state.activePhotoId || !state.activeIndividualId) return message('Selecciona foto e individuo');
  await dispatch(commandBase({
    type:'ASSIGN_PHOTO',
    photoId:state.activePhotoId,
    individualId:state.activeIndividualId,
  }));
};

$('unassignPhoto').onclick = async () => {
  if (!state.activePhotoId || !state.activeIndividualId) return message('Selecciona foto e individuo');
  await dispatch(commandBase({
    type:'UNASSIGN_PHOTO',
    photoId:state.activePhotoId,
    individualId:state.activeIndividualId,
  }));
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
  await dispatch(commandBase({
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
  }));
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
    renderCharacters();
    resetExecutor();
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
  resetExecutor();
  message('actor actualizado para el próximo contexto writer');
});
