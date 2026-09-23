import { validateApcSession } from './session-contract.mjs';
import {
  APC_EVIDENCE_STATUSES,
  APC_LIFECYCLE_STATUSES,
  validateApcEvidenceForHandoff,
  normalizeApcEvidenceStatus,
} from './evidence-lifecycle.mjs';
import { validateCharacterObservation, characterObservationToAceEvidence } from '../character-observers/common-evidence-contract.mjs';

function text(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function mapObserver(evidence) {
  if (evidence.sourceType === 'human') return { type: 'human' };
  if (evidence.sourceType === 'tool') return { type: 'machine', tool: evidence.sourceId };
  if (evidence.sourceType === 'model') return { type: 'machine', model: evidence.sourceId };
  if (evidence.sourceType === 'imported') {
    const t = evidence?.importMetadata?.observerType;
    if (!['human','machine'].includes(t)) throw new Error('imported evidence requires importMetadata.observerType for handoff');
    return t === 'human' ? { type: 'human' } : { type: 'machine', tool: evidence?.importMetadata?.observerId ?? evidence.sourceId };
  }
  throw new Error(`Unsupported sourceType: ${evidence.sourceType}`);
}

export function getRegisteredApcEvidence(session, evidenceId, revision) {
  if (!text(evidenceId)) throw new Error('evidenceId is required');
  if (!Number.isInteger(revision) || revision < 1) throw new Error('revision must be an integer >= 1');
  const matches = (session?.evidence ?? []).filter(e => e?.evidenceId === evidenceId && e?.revision === revision);
  if (matches.length !== 1) throw new Error(`Expected exactly one registered APC evidence ${evidenceId} revision ${revision}; found ${matches.length}`);
  return matches[0];
}


function canonicalText(value) {
  if (typeof value !== 'string') return null;
  if (!value || value !== value.trim()) return null;
  return value;
}

function evidenceIndexes(session) {
  return {
    photosById: new Map((session?.photos ?? []).map(item => [item?.photoId, item])),
    photoEvidenceById: new Map((session?.photoEvidence ?? []).map(item => [item?.photoEvidenceId, item])),
    individualsById: new Map((session?.individuals ?? []).map(item => [item?.individualId, item])),
  };
}

function validatePrefillBasis(acquisition, photoEvidenceById, errors) {
  if (acquisition?.mode !== 'prefilled') return;
  const basis = acquisition?.basis;
  if (!basis || typeof basis !== 'object') {
    errors.push('prefilled evidence requires acquisition.basis');
    return;
  }
  if (basis.type !== 'prior_observations') {
    errors.push('prefilled acquisition.basis.type must be prior_observations');
  }
  const refs = basis.photoEvidenceRefs;
  if (!Array.isArray(refs) || refs.length === 0 || refs.some(ref => !canonicalText(ref))) {
    errors.push('prefilled acquisition.basis.photoEvidenceRefs must contain canonical references');
    return;
  }
  for (const ref of refs) {
    if (!photoEvidenceById.has(ref)) errors.push(`Unknown acquisition.basis.photoEvidenceRef: ${ref}`);
  }
}

export function validateRegisteredApcEvidencePayload(
  dataset,
  session,
  evidenceId,
  revision,
  { requireCurrent = false, operationalDatasetCheck = true } = {},
) {
  const errors = [];
  let evidence;
  try {
    evidence = getRegisteredApcEvidence(session, evidenceId, revision);
  } catch (error) {
    return { valid: false, errors: [error.message], evidence: null };
  }

  const indexes = evidenceIndexes(session);
  if (requireCurrent && evidence.current !== true) errors.push('current must be true');
  if (!APC_LIFECYCLE_STATUSES.includes(evidence.lifecycleStatus)) {
    errors.push(`lifecycleStatus must be one of: ${APC_LIFECYCLE_STATUSES.join(', ')}`);
  }
  if (!APC_EVIDENCE_STATUSES.includes(evidence.evidenceStatus)) {
    errors.push(`evidenceStatus must be one of: ${APC_EVIDENCE_STATUSES.join(', ')}`);
  }

  for (const field of ['sessionId','photoId','photoEvidenceRef','individualId','characterId']) {
    if (!canonicalText(evidence[field])) errors.push(`${field} must be a canonical non-empty string`);
  }
  if (evidence.sessionId !== session?.sessionId) errors.push('evidence.sessionId must equal session.sessionId');

  const photo = indexes.photosById.get(evidence.photoId);
  if (!photo) errors.push(`Unknown photoId: ${evidence.photoId}`);
  if (!indexes.photoEvidenceById.has(evidence.photoEvidenceRef)) {
    errors.push(`Unknown photoEvidenceRef: ${evidence.photoEvidenceRef}`);
  }
  if (!indexes.individualsById.has(evidence.individualId)) {
    errors.push(`Unknown individualId: ${evidence.individualId}`);
  }
  if (photo) {
    if (photo.photoEvidenceId !== evidence.photoEvidenceRef) {
      errors.push(`Evidence photoEvidenceRef does not match PHOTO ${evidence.photoId}`);
    }
    if (!Array.isArray(photo.individualRefs) || !photo.individualRefs.includes(evidence.individualId)) {
      errors.push(`Evidence individualId is not assigned to PHOTO ${evidence.photoId}`);
    }
  }

  const hasSourceType = evidence.sourceType != null;
  const hasSourceId = evidence.sourceId != null;
  if (hasSourceType !== hasSourceId) {
    errors.push('sourceType and sourceId must be both absent or both present');
  } else if (hasSourceType) {
    if (!['human','tool','model','imported'].includes(evidence.sourceType)) {
      errors.push('sourceType must be human, tool, model or imported');
    }
    if (!canonicalText(evidence.sourceId)) errors.push('sourceId must be a canonical non-empty string');
  }

  const acquisition = evidence.acquisition;
  if (acquisition != null) {
    if (!['manual','prefilled','automatic'].includes(acquisition.mode)) {
      errors.push('acquisition.mode must be manual, prefilled or automatic');
    } else {
      validatePrefillBasis(acquisition, indexes.photoEvidenceById, errors);
    }
  }

  const confidence = evidence.confidence ?? null;
  if (confidence != null && (typeof confidence !== 'number' || Number.isNaN(confidence) || confidence < 0 || confidence > 1)) {
    errors.push('confidence must be a number between 0 and 1');
  }
  if (evidence.evidence != null && !Array.isArray(evidence.evidence)) errors.push('evidence must be an array');

  if (evidence.evidenceStatus === 'OBSERVED') {
    if (!text(evidence.observedState)) errors.push('observedState is required when evidenceStatus=OBSERVED');
  } else if (APC_EVIDENCE_STATUSES.includes(evidence.evidenceStatus)) {
    if (text(evidence.observedState)) errors.push(`observedState must be empty when evidenceStatus=${evidence.evidenceStatus}`);
    if (!text(evidence.reason)) errors.push(`reason is required when evidenceStatus=${evidence.evidenceStatus}`);
  }

  if (evidence.lifecycleStatus === 'DRAFT' && evidence.confirmation != null) {
    errors.push('DRAFT confirmation must be absent or null');
  }

  if (operationalDatasetCheck) {
    const character = dataset?.allCharactersById?.get?.(evidence.characterId);
    if (!character) {
      errors.push(`Unknown characterId: ${evidence.characterId}`);
    } else if (
      evidence.evidenceStatus === 'OBSERVED' &&
      !character.allowedStates?.includes?.(evidence.observedState)
    ) {
      errors.push(`observedState is not allowed for ${evidence.characterId}`);
    }
  }

  return { valid: errors.length === 0, errors, evidence };
}

export function validateRegisteredApcConfirmedEvidence(
  dataset,
  session,
  evidenceId,
  revision,
  { requireCurrent = false, operationalDatasetCheck = true } = {},
) {
  const base = validateRegisteredApcEvidencePayload(
    dataset,
    session,
    evidenceId,
    revision,
    { requireCurrent, operationalDatasetCheck },
  );
  const errors = [...base.errors];
  const evidence = base.evidence;
  if (!evidence) return { valid: false, errors, evidence: null };

  if (evidence.lifecycleStatus !== 'CONFIRMED') {
    errors.push('lifecycleStatus must be CONFIRMED');
    return { valid: false, errors, evidence };
  }

  const lifecycleInput = requireCurrent ? evidence : { ...evidence, current: true };
  const lifecycle = validateApcEvidenceForHandoff(lifecycleInput);
  if (!lifecycle.valid) errors.push(...lifecycle.errors);

  if (evidence.sourceType === 'imported') {
    const observerType = evidence?.importMetadata?.observerType;
    if (!['human','machine'].includes(observerType)) {
      errors.push('imported evidence requires importMetadata.observerType');
    }
  }

  if (evidence.acquisition?.mode === 'prefilled' && evidence.acquisition.confirmedOnCurrentPhoto !== true) {
    errors.push('prefilled CONFIRMED evidence requires confirmedOnCurrentPhoto=true');
  }

  if (operationalDatasetCheck && errors.length === 0) {
    try {
      const { indexes } = validateApcSession(session);
      const observation = {
        photoEvidenceRef: evidence.photoEvidenceRef,
        characterId: evidence.characterId,
        status: normalizeApcEvidenceStatus(evidence.evidenceStatus),
        observedState: evidence.evidenceStatus === 'OBSERVED' ? evidence.observedState : null,
        reason: evidence.reason ?? null,
        observer: mapObserver(evidence),
        acquisition: { ...evidence.acquisition },
        confidence: evidence.confidence ?? null,
        evidence: evidence.evidence ?? [],
        provenance: evidence.provenance ?? null,
        notes: evidence.notes ?? null,
      };
      const result = validateCharacterObservation(dataset, observation, indexes?.photoEvidenceById ?? null);
      if (!result.valid) errors.push(...result.errors);
    } catch (error) {
      errors.push(error.message);
    }
  }

  return { valid: errors.length === 0, errors, evidence };
}

export function adaptRegisteredApcEvidenceToCharacterObservation(dataset, session, evidenceId, revision) {
  const sessionResult = validateApcSession(session);
  if (!sessionResult.valid) {
    const error = new Error(`Invalid APC_SESSION: ${sessionResult.errors.join('; ')}`);
    error.validationErrors = sessionResult.errors;
    throw error;
  }
  const evidence = getRegisteredApcEvidence(session, evidenceId, revision);
  const lifecycle = validateApcEvidenceForHandoff(evidence);
  if (!lifecycle.valid) {
    const error = new Error(`APC evidence is not handoff-eligible: ${lifecycle.errors.join('; ')}`);
    error.validationErrors = lifecycle.errors;
    throw error;
  }

  const { indexes } = sessionResult;
  if (evidence.sessionId !== session.sessionId) throw new Error(`Evidence ${evidenceId} does not belong to session ${session.sessionId}`);
  if (!indexes.photosById.has(evidence.photoId)) throw new Error(`Unknown photoId: ${evidence.photoId}`);
  if (!indexes.photoEvidenceById.has(evidence.photoEvidenceRef)) throw new Error(`Unknown photoEvidenceRef: ${evidence.photoEvidenceRef}`);
  if (!indexes.individualsById.has(evidence.individualId)) throw new Error(`Unknown individualId: ${evidence.individualId}`);

  const photo = indexes.photosById.get(evidence.photoId);
  if (photo.photoEvidenceId !== evidence.photoEvidenceRef) throw new Error((`Evidence photoEvidenceRef does not match PHOTO ${evidence.photoId}`));

  const observation = {
    photoEvidenceRef: evidence.photoEvidenceRef,
    characterId: evidence.characterId,
    status: normalizeApcEvidenceStatus(evidence.evidenceStatus),
    observedState: evidence.evidenceStatus === 'OBSERVED' ? evidence.observedState : null,
    reason: evidence.reason ?? null,
    observer: mapObserver(evidence),
    acquisition: { ...evidence.acquisition },
    confidence: evidence.confidence ?? null,
    evidence: evidence.evidence ?? [],
    provenance: {
      ...(evidence.provenance ?? {}),
      apc: {
        sessionId: session.sessionId,
        evidenceId: evidence.evidenceId,
        individualId: evidence.individualId,
        revision: evidence.revision,
        photoEvidenceRef: evidence.photoEvidenceRef,
        sourceType: evidence.sourceType,
        sourceId: evidence.sourceId,
        confirmation: {
          confirmedByType: evidence.confirmation.confirmedByType,
          confirmedById: evidence.confirmation.confirmedById,
          confirmedAt: evidence.confirmation.confirmedAt,
        },
      },
    },
    notes: evidence.notes ?? null,
  };

  const result = validateCharacterObservation(dataset, observation, indexes.photoEvidenceById);
  if (!result.valid) {
    const error = new Error(`Invalid CharacterObservation: ${result.errors.join('; ')}`);
    error.validationErrors = result.errors;
    throw error;
  }
  return result.normalized;
}

export function registeredApcEvidenceToAceEvidence(dataset, session, evidenceId, revision) {
  const observation = adaptRegisteredApcEvidenceToCharacterObservation(dataset, session, evidenceId, revision);
  const sessionResult = validateApcSession(session);
  return characterObservationToAceEvidence(dataset, observation, sessionResult.indexes.photoEvidenceById);
}
