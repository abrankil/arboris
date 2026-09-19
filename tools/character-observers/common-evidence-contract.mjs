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

function getKnownCharacter(dataset, characterId) {
  if (!dataset?.allCharactersById?.get) {
    throw new TypeError('dataset.allCharactersById Map is required');
  }
  const character = dataset.allCharactersById.get(characterId);
  if (!character) throw new Error(`Unknown characterId: ${characterId}`);
  return character;
}

export function assessAceEligibility(dataset, characterId) {
  const character = dataset?.allCharactersById?.get?.(characterId);
  if (!character) return { eligible: false, reason: 'unknown_character' };
  if (character.pilotStatus !== dataset.computableStatus) {
    return { eligible: false, reason: 'retired_character' };
  }
  return { eligible: true, reason: null };
}

export function validatePhotoEvidence(input) {
  const errors = [];
  const photoEvidenceId = textValue(input?.photoEvidenceId);
  const sourcePhoto = input?.sourcePhoto;
  const fingerprintSha256 = textValue(sourcePhoto?.fingerprintSha256);

  if (!photoEvidenceId) errors.push('photoEvidenceId is required');
  if (!sourcePhoto || typeof sourcePhoto !== 'object') errors.push('sourcePhoto is required');
  if (sourcePhoto && !textValue(sourcePhoto.photoRef)) errors.push('sourcePhoto.photoRef is required');
  if (!fingerprintSha256) errors.push('sourcePhoto.fingerprintSha256 is required for stable asset identity');
  else if (!/^[a-f0-9]{64}$/i.test(fingerprintSha256)) {
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
  if (!(photoEvidenceById instanceof Map)) {
    errors.push('photoEvidenceById Map is required to validate referential integrity');
  } else if (photoEvidenceRef && !photoEvidenceById.has(photoEvidenceRef)) {
    errors.push(`Unknown photoEvidenceRef: ${photoEvidenceRef}`);
  }

  if (!characterId) {
    errors.push('characterId is required');
  } else {
    try { getKnownCharacter(dataset, characterId); } catch (error) { errors.push(error.message); }
  }

  if (!STATUS_SET.has(status)) errors.push(`status must be one of: ${H16_STATUSES.join(', ')}`);

  if (status === 'observed') {
    if (!observedState) errors.push('observedState is required when status=observed');
    else if (characterId) {
      try {
        const character = getKnownCharacter(dataset, characterId);
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
  } else if (acquisition.mode === 'prefilled') {
    if (acquisition.confirmedOnCurrentPhoto !== true) {
      errors.push('prefilled observation must be confirmedOnCurrentPhoto=true');
    }
    const basis = acquisition.basis;
    if (!basis || typeof basis !== 'object') {
      errors.push('prefilled observation requires acquisition.basis');
    } else {
      if (basis.type !== 'prior_observations') errors.push('prefilled acquisition.basis.type must be prior_observations');
      const refs = basis.photoEvidenceRefs;
      if (!Array.isArray(refs) || refs.length === 0 || refs.some(ref => !textValue(ref))) {
        errors.push('prefilled acquisition.basis.photoEvidenceRefs must contain at least one prior PhotoEvidence reference');
      } else if (photoEvidenceById instanceof Map) {
        for (const ref of refs) {
          if (!photoEvidenceById.has(textValue(ref))) {
            errors.push(`Unknown acquisition.basis.photoEvidenceRef: ${textValue(ref)}`);
          }
        }
      }
    }
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
  const eligibility = assessAceEligibility(dataset, observation.characterId);
  if (!eligibility.eligible) {
    const error = new Error(`CharacterObservation is not ACE-eligible: ${eligibility.reason}`);
    error.code = 'ACE_INELIGIBLE';
    error.aceEligibility = eligibility;
    throw error;
  }
  return {
    characterId: observation.characterId,
    observationStatus: observation.status,
    observedStates: observation.status === 'observed' ? [observation.observedState] : [],
    source: observation.observer?.tool ?? observation.observer?.type ?? 'unknown',
    confidence: observation.confidence,
    model: observation.observer?.model ?? null,
    notes: observation.notes,
    provenance: observation.provenance,
    evidence: observation.evidence.map(item => ({ ...item })),
    // Legacy singular projections remain explicit conveniences for current ACE consumers.
    evidenceRef: observation.evidence.length === 1 ? observation.evidence[0]?.evidenceRef ?? null : null,
    regionOfInterest: observation.evidence.length === 1 ? observation.evidence[0]?.regionOfInterest ?? null : null,
  };
}
