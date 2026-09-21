import { validateApcSession } from './session-contract.mjs';
import { validateApcEvidenceForHandoff, normalizeApcEvidenceStatus } from './evidence-lifecycle.mjs';
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
  if (!indexes.individualsById.has(evidence.individualId)) throw new Error((Unknown individualId: ${evidence.individualId}`));

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
