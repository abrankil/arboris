import { getCharacterDefinition } from './contract.mjs';

export const H16_STATUSES = Object.freeze(['observed', 'not_observable', 'uncertain']);
const STATUS_SET = new Set(H16_STATUSES);
const ACQUISITION_MODES = new Set(['manual', 'prefilled', 'automatic']);

function textValue(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function fail(errors) {
  return { valid: false, errors, normalized: null };
}

export function validatePhotoEvidence(input) {
  const errors = [];
  const photoEvidenceId = textValue(input?.photoEvidenceId);
  const sourcePhoto = input?.sourcePhoto;
  const fingerprintSha256 = textValue(sourcePhoto?.fingerprintSha256);

  if (!photoEvidenceId) errors.push('photoEvidenceId is required');
  if (!sourcePhoto || typeof sourcePhoto !== 'object') errors.push('sourcePhoto is required');
  if (sourcePhoto && !textValue(sourcePhoto.photoRef)) errors.push('sourcePhoto.photoRef is required');
  if (fingerprintSha256 && !/^[a-f0-9]{64}$/i.test(fingerprintSha256)) {
    errors.push('sourcePhoto.fingerprintSha256 must be a SHA-256 hex digest');
  }
  if (input?.visibleStructures != null && !Array.isArray(input.visibleStructures)) {
    errors.push('visibleStructures must be an array');
  }

  if (errors.length) return fail(errors);

  return {
    valid: true,
    errors: [],
    normalized: {
      ...input,
      photoEvidenceId,
      sourcePhoto: { ...sourcePhoto, photoRef: textValue(sourcePhoto.photoRef), fingerprintSha256 },
      visibleStructures: input.visibleStructures ?? [],
      quality: input.quality ?? null,
      context: input.context ?? null,
      contextProvenance: input.contextProvenance ?? null,
      provenance: input.provenance ?? null,
    },
  };
}

export function validateCharacterObservation(dataset, input, photoEvidenceById = null) {
  const errors = [];
  const photoEvidenceRef = textValue(input?.photoEvidenceRef);
  const characterId = textValue(input?.characterId ?? input?.character_id);
  const status = textValue(input?.status);
  const observedState = textValue(input?.observedState ?? input?.observed_state);
  const reason = textValue(input?.reason);
  const confidence = input?.confidence ?? null;
  const observer = input?.observer;
  const acquisition = input?.acquisition;

  if (!photoEvidenceRef) errors.push('photoEvidenceRef is required');
  if (photoEvidenceById && photoEvidenceRef && !photoEvidenceById.has(photoEvidenceRef)) {
    errors.push(`Unknown photoEvidenceRef: ${photoEvidenceRef}`);
  }

  if (!characterId) {
    errors.push('characterId is required');
  } else {
    try { getCharacterDefinition(dataset, characterId); } catch (error) { errors.push(error.message); }
  }

  if (!STATUS_SET.has(status)) errors.push(`status must be one of: ${H16_STATUSES.join(', ')}`);

  if (status === 'observed') {
    if (!observedState) errors.push('observedState is required when status=observed');
    else if (characterId) {
      try {
        const character = getCharacterDefinition(dataset, characterId);
        if (!character.allowedStates.includes(observedState)) errors.push(`observedState is not allowed for ${characterId}`);
      } catch {}
    }
  } else {
    if (observedState) errors.push(`observedState must be empty when status=${status}`);
    if (STATUS_SET.has(status) && !reason) errors.push(`reason is required when status=${status}`);
  }

  if (!observer || !['human', 'machine'].includes(observer.type)) {
    errors.push('observer.type must be human or machine');
  }

  if (!acquisition || !ACQUISITION_MODES.has(acquisition.mode)) {
    errors.push('acquisition.mode must be manual, prefilled or automatic');
  } else if (acquisition.mode === 'prefilled' && acquisition.confirmedOnCurrentPhoto !== true) {
    errors.push('prefilled observation must be confirmedOnCurrentPhoto=true');
  }

  if (confidence != null && (typeof confidence !== 'number' || Number.isNaN(confidence) || confidence < 0 || confidence > 1)) {
    errors.push('confidence must be a number between 0 and 1');
  }

  if (input?.evidence != null && !Array.isArray(input.evidence)) errors.push('evidence must be an array');

  if (errors.length) return fail(errors);

  return {
    valid: true,
    errors: [],
    normalized: {
      ...input,
      photoEvidenceRef,
      characterId,
      status,
      observedState: status === 'observed' ? observedState : null,
      reason: reason ?? null,
      observer: { ...observer },
      acquisition: { ...acquisition },
      confidence,
      evidence: input.evidence ?? [],
      provenance: input.provenance ?? null,
      notes: input.notes ?? null,
    },
  };
}

export function observerResultToCharacterObservation(dataset, observerResult, envelope, photoEvidenceById = null) {
  const input = {
    ...envelope,
    characterId: observerResult?.characterId ?? observerResult?.character_id,
    status: observerResult?.status,
    observedState: observerResult?.observedState ?? observerResult?.observed_state ?? observerResult?.state,
    reason: envelope?.reason ?? observerResult?.reason ?? observerResult?.notes ?? null,
    confidence: observerResult?.confidence ?? envelope?.confidence ?? null,
    notes: observerResult?.notes ?? envelope?.notes ?? null,
  };
  const result = validateCharacterObservation(dataset, input, photoEvidenceById);
  if (!result.valid) {
    const error = new Error(`Invalid CharacterObservation: ${result.errors.join('; ')}`);
    error.validationErrors = result.errors;
    throw error;
  }
  return result.normalized;
}

export function characterObservationToAceEvidence(dataset, input, photoEvidenceById = null) {
  const result = validateCharacterObservation(dataset, input, photoEvidenceById);
  if (!result.valid) {
    const error = new Error(`Invalid CharacterObservation: ${result.errors.join('; ')}`);
    error.validationErrors = result.errors;
    throw error;
  }

  const observation = result.normalized;
  return {
    characterId: observation.characterId,
    observationStatus: observation.status,
    observedStates: observation.status === 'observed' ? [observation.observedState] : [],
    source: observation.observer?.tool ?? observation.observer?.type ?? 'unknown',
    confidence: observation.confidence,
    model: observation.observer?.model ?? null,
    notes: observation.notes,
    provenance: observation.provenance,
    evidenceRef: observation.evidence?.[0]?.evidenceRef ?? null,
    regionOfInterest: observation.evidence?.[0]?.regionOfInterest ?? null,
  };
}
