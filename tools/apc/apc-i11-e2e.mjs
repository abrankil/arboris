import { assessIdentification } from '../canonical-identification/engine.mjs';
import {
  assessAceEligibility,
  characterObservationToAceEvidence,
} from '../character-observers/common-evidence-contract.mjs';
import { validateApcEvidenceForHandoff } from './evidence-lifecycle.mjs';
import {
  adaptRegisteredApcEvidenceToCharacterObservation,
} from './apc-to-character-observation.mjs';
import {
  validateApcContradictions,
  validateApcSession,
} from './session-contract.mjs';

function compareText(a, b) {
  const left = String(a ?? '');
  const right = String(b ?? '');
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function evidenceIdentity(item) {
  return {
    characterId: item?.characterId ?? null,
    evidenceId: item?.evidenceId ?? item?.provenance?.apc?.evidenceId ?? null,
    revision: item?.revision ?? item?.provenance?.apc?.revision ?? 0,
  };
}

function compareEvidence(a, b) {
  const left = evidenceIdentity(a);
  const right = evidenceIdentity(b);
  return (
    compareText(left.characterId, right.characterId)
    || compareText(left.evidenceId, right.evidenceId)
    || (left.revision - right.revision)
  );
}

function clone(value) {
  return structuredClone(value);
}

function pendingBelongsToIndividual(pending, individualId) {
  if (pending?.kind === 'UNRESOLVED_REQUIREMENT') {
    if (pending.scopeLevel === 'INDIVIDUAL') {
      return pending.scopeRef === individualId;
    }
    if (pending.scopeLevel === 'PHOTO') {
      return (pending.propagation ?? []).some(
        item => item?.level === 'INDIVIDUAL' && item?.ref === individualId,
      );
    }
    return false;
  }

  if (pending?.kind === 'REPRESENTATION_GAP') {
    return (
      pending.sourceLevel === 'INDIVIDUAL'
      && pending.sourceRef === individualId
    );
  }

  return false;
}

function buildContext(session, individualId) {
  const contradictions = (session.contradictions ?? [])
    .filter(item => item?.individualId === individualId)
    .map(clone)
    .sort((a, b) => compareText(a?.contradictionId, b?.contradictionId));

  const pending = (session.pending ?? [])
    .filter(item => pendingBelongsToIndividual(item, individualId))
    .map(clone)
    .sort((a, b) => compareText(a?.pendingId, b?.pendingId));

  return {
    contradictions,
    pending,
    provisionalHypothesis: null,
  };
}

export function runApcIndividualThroughAce({
  dataset,
  session,
  individualId,
  candidateIds,
  areStatesIncompatible,
} = {}) {
  const sessionResult = validateApcSession(session);
  if (!sessionResult.valid) {
    const error = new Error(`Invalid APC_SESSION: ${sessionResult.errors.join('; ')}`);
    error.validationErrors = sessionResult.errors;
    throw error;
  }

  if (!sessionResult.indexes.individualsById.has(individualId)) {
    throw new Error(`Unknown individualId: ${individualId}`);
  }

  const hasContradictions = (session.contradictions ?? []).length > 0;
  if (hasContradictions) {
    const contradictionResult = validateApcContradictions(
      session,
      { areStatesIncompatible },
    );
    if (!contradictionResult.valid) {
      const error = new Error(
        `Invalid APC contradictions: ${contradictionResult.errors.join('; ')}`,
      );
      error.validationErrors = contradictionResult.errors;
      throw error;
    }
  }

  const openContradictionsByCharacter = new Map(
    (session.contradictions ?? [])
      .filter(item => (
        item?.status === 'OPEN'
        && item?.individualId === individualId
      ))
      .map(item => [item.characterId, item]),
  );

  const selectedEvidenceCandidates = (session.evidence ?? [])
    .filter(item => (
      item?.current === true
      && item?.lifecycleStatus === 'CONFIRMED'
      && item?.individualId === individualId
    ))
    .slice()
    .sort(compareEvidence);

  const selectedApcEvidence = [];
  const handoffEvidence = [];
  const excludedFromAce = [];

  for (const evidence of selectedEvidenceCandidates) {
    const handoffValidation = validateApcEvidenceForHandoff(evidence);
    if (!handoffValidation.valid) {
      const error = new Error(
        `APC evidence ${evidence.evidenceId} revision ${evidence.revision} is not handoff-eligible: ${handoffValidation.errors.join('; ')}`,
      );
      error.validationErrors = handoffValidation.errors;
      throw error;
    }

    const observation = adaptRegisteredApcEvidenceToCharacterObservation(
      dataset,
      session,
      evidence.evidenceId,
      evidence.revision,
    );

    selectedApcEvidence.push(clone(evidence));

    const openContradiction = openContradictionsByCharacter.get(
      observation.characterId,
    );
    if (openContradiction) {
      excludedFromAce.push({
        evidenceId: evidence.evidenceId,
        revision: evidence.revision,
        characterId: evidence.characterId,
        exclusionCategory: 'APC_OPERATIONAL',
        reason: 'open_contradiction',
        contradictionId: openContradiction.contradictionId,
        canonicalStatus: null,
      });
      continue;
    }

    const eligibility = assessAceEligibility(dataset, observation.characterId);

    if (!eligibility.eligible) {
      if (eligibility.reason === 'unknown_character') {
        throw new Error(`Unknown characterId: ${observation.characterId}`);
      }
      if (eligibility.reason !== 'non_computable_character') {
        throw new Error(
          `CharacterObservation is not ACE-eligible: ${eligibility.reason ?? 'unknown_reason'}`,
        );
      }

      excludedFromAce.push({
        evidenceId: evidence.evidenceId,
        revision: evidence.revision,
        characterId: evidence.characterId,
        exclusionCategory: 'ACE_ELIGIBILITY',
        reason: eligibility.reason,
        contradictionId: null,
        canonicalStatus: eligibility.canonicalStatus,
      });
      continue;
    }

    handoffEvidence.push(
      characterObservationToAceEvidence(
        dataset,
        observation,
        sessionResult.indexes.photoEvidenceById,
      ),
    );
  }

  selectedApcEvidence.sort(compareEvidence);
  handoffEvidence.sort(compareEvidence);
  excludedFromAce.sort(compareEvidence);

  const aceAssessment = assessIdentification(
    dataset,
    handoffEvidence,
    candidateIds === undefined ? null : candidateIds,
  );

  return {
    individualId,
    selectedApcEvidence,
    handoffEvidence,
    excludedFromAce,
    aceAssessment,
    context: buildContext(session, individualId),
  };
}
