import {
  ApcI12CommandExecutor,
  createBrowserWriterLockProvider,
  createLocalStorageApcPersistence,
} from '../apc-i12-executor.mjs';
import {
  ApcAssetRuntime,
  stageApcPhotoFile,
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

function render() {
  const session = currentSession();
  chooseFallbackTargets(session);

  const mode = inWriteMode() ? 'WRITER' : (session ? 'READ_ONLY' : 'SIN SESIÓN');
  $('mode').textContent = mode;
  $('sessionLabel').textContent = session?.sessionId ?? '';
  disableWrites(!inWriteMode());
  $('actorId').disabled = Boolean(session);

  $('photos').replaceChildren();
  for (const photo of session?.photos ?? []) {
    const div = document.createElement('div');
    div.className = 'item' + (photo.photoId===state.activePhotoId ? ' active' : '');
    const inInbox = session.inboxPhotoRefs.includes(photo.photoId);
    div.textContent = `${photo.photoId.slice(0,18)} · ${photo.fileRef}${inInbox ? ' · inbox' : ''}`;
    div.onclick = () => {
      state.activePhotoId = photo.photoId;
      const refs = photo.individualRefs ?? [];
      if (!refs.includes(state.activeIndividualId)) state.activeIndividualId = refs[0] ?? null;
      render();
    };
    $('photos').append(div);
  }

  $('individuals').replaceChildren();
  for (const individual of session?.individuals ?? []) {
    const div = document.createElement('div');
    div.className = 'item' + (individual.individualId===state.activeIndividualId ? ' active' : '');
    div.textContent = individual.individualId;
    div.onclick = () => { state.activeIndividualId = individual.individualId; render(); };
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

function evidencePatch() {
  const status = $('evidenceStatus').value;
  return {
    evidenceStatus: status,
    observedState: status === 'OBSERVED' ? ($('observedState').value || null) : null,
    sourceType: 'human',
    sourceId: actorId(),
    acquisition: { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null },
    confidence: null,
    reason: status === 'OBSERVED' ? null : ($('reason').value.trim() || null),
    notes: $('notes').value.trim() || null,
  };
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
  const ev = currentEvidence();
  const type = ev?.lifecycleStatus === 'CONFIRMED' ? 'EDIT_CONFIRMED_AS_DRAFT' : 'SAVE_DRAFT';
  await dispatch(evidenceCommand(type));
}

async function confirmEvidence() {
  if (!activePhoto() || !activeIndividual()) return message('Falta ACTIVE_REVIEW_TARGET');
  const ev = currentEvidence();
  const type = ev?.lifecycleStatus === 'CONFIRMED' ? 'EDIT_AND_RECONFIRM' : 'CONFIRM_EVIDENCE';
  const command = evidenceCommand(type);
  command.confirmation = {
    confirmedByType: 'human',
    confirmedById: actorId(),
    confirmedAt: new Date().toISOString(),
  };
  await dispatch(command);
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
$('character').onchange = renderCharacterHelp;
$('evidenceStatus').onchange = syncEvidenceFormMode;
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
