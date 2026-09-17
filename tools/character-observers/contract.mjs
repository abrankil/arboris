const TERMINAL_STATUSES = new Set(['observed', 'not_observable', 'uncertain']);

function normalizeState(value) {
  if (value == null) return null;
  const state = String(value).trim();
  return state || null;
}

export function getCharacterDefinition(dataset, characterId) {
  if (!dataset?.charactersById?.get) {
    throw new TypeError('dataset.charactersById Map is required');
  }

  const character = dataset.charactersById.get(characterId);
  if (!character) {
    throw new Error(`Unknown characterId: ${characterId}`);
  }

  return character;
}

export function validateObserverResult(dataset, input) {
  const characterId = input?.characterId ?? input?.character_id;
  const status = normalizeState(input?.status);
  const observedState = normalizeState(input?.observedState ?? input?.observed_state ?? input?.state);
  const confidence = input?.confidence;

  if (!characterId) {
    return { valid: false, errors: ['characterId is required'] };
  }

  let character;
  try {
    character = getCharacterDefinition(dataset, characterId);
  } catch (error) {
    return { valid: false, errors: [error.message] };
  }

  const errors = [];

  if (!TERMINAL_STATUSES.has(status)) {
    errors.push(`status must be one of: ${[...TERMINAL_STATUSES].join(', ')}`);
  }

  if (confidence != null) {
    if (typeof confidence !== 'number' || Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
      errors.push('confidence must be a number between 0 and 1');
    }
  }

  if (status === 'observed') {
    if (!observedState) {
      errors.push('observedState is required when status=observed');
    } else if (!character.allowedStates.includes(observedState)) {
      errors.push(`observedState is not allowed for ${characterId}`);
    }
  } else if (observedState) {
    errors.push(`observedState must be empty when status=${status}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length ? null : {
      characterId,
      status,
      observedState,
      confidence: confidence ?? null,
      source: input?.source ?? 'visual_observer',
      model: input?.model ?? null,
      notes: input?.notes ?? null,
    },
  };
}

export function observerResultToEvidence(dataset, input) {
  const result = validateObserverResult(dataset, input);
  if (!result.valid) {
    const error = new Error(`Invalid observer result: ${result.errors.join('; ')}`);
    error.validationErrors = result.errors;
    throw error;
  }

  const normalized = result.normalized;

  if (normalized.status === 'observed') {
    return {
      characterId: normalized.characterId,
      observedStates: [normalized.observedState],
      source: normalized.source,
      confidence: normalized.confidence,
      model: normalized.model,
      notes: normalized.notes,
    };
  }

  return {
    characterId: normalized.characterId,
    observedStates: ['not_observable'],
    source: normalized.source,
    confidence: normalized.confidence,
    model: normalized.model,
    notes: normalized.notes,
  };
}

export const OBSERVER_RESULT_STATUSES = Object.freeze([...TERMINAL_STATUSES]);
