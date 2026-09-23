import {
  indexApcSession,
  isApcRequirementSatisfied,
  validateApcContradictionTransition,
  validateApcPendingTransition,
  validateApcSemanticTransition,
} from './session-contract.mjs';
import {
  normalizeFingerprintSha256,
  sameApcEvidenceNormativePayload,
  validateApcWritableWorkingSnapshot,
} from './apc-i12-contract.mjs';

function clone(value) {
  return structuredClone(value);
}

function canonicalText(value) {
  return typeof value === 'string' && value && value === value.trim() ? value : null;
}

function ordinalEvidenceRefs(refs) {
  return [...refs].sort((a, b) => {
    if (a.evidenceId < b.evidenceId) return -1;
    if (a.evidenceId > b.evidenceId) return 1;
    return a.revision - b.revision;
  });
}

function currentEvidence(session, evidenceId) {
  const matches = (session.evidence ?? []).filter(item => item.evidenceId === evidenceId && item.current === true);
  return matches.length === 1 ? matches[0] : null;
}

function evidenceMatchesScope(session, evidence, level, ref) {
  if (level === 'SESSION') return evidence.sessionId === session.sessionId && ref === session.sessionId;
  if (level === 'INDIVIDUAL') return evidence.individualId === ref;
  if (level === 'PHOTO') {
    const photo = session.photos.find(item => item.photoId === ref);
    return evidence.photoId === ref && photo?.individualRefs?.includes(evidence.individualId);
  }
  return false;
}

function qualifyingEvidence(session, characterId, level, ref) {
  return (session.evidence ?? []).filter(item =>
    item.current === true &&
    item.lifecycleStatus === 'CONFIRMED' &&
    item.evidenceStatus === 'OBSERVED' &&
    item.characterId === characterId &&
    evidenceMatchesScope(session, item, level, ref)
  );
}

function pendingTail(episodes) {
  const parentIds = new Set(episodes.map(item => item.previousPendingId).filter(Boolean));
  return episodes.find(item => !parentIds.has(item.pendingId)) ?? null;
}

function contradictionTail(episodes) {
  const parentIds = new Set(episodes.map(item => item.previousContradictionId).filter(Boolean));
  return episodes.find(item => !parentIds.has(item.contradictionId)) ?? null;
}

function pendingCriticalFor(command, requirementId) {
  const direct = command?.pendingCriticalByRequirement?.[requirementId];
  if (typeof direct === 'boolean') return direct;
  const nested = command?.pendingDecisions?.[requirementId]?.critical;
  return typeof nested === 'boolean' ? nested : null;
}

function propagationForRequirement(session, requirement) {
  if (requirement.scopeLevel === 'SESSION') return [];
  if (requirement.scopeLevel === 'INDIVIDUAL') {
    return [{ level: 'SESSION', ref: session.sessionId }];
  }
  if (requirement.scopeLevel === 'PHOTO') {
    const photo = session.photos.find(item => item.photoId === requirement.scopeRef);
    const refs = [...new Set(photo?.individualRefs ?? [])].sort();
    return [
      ...refs.map(ref => ({ level: 'INDIVIDUAL', ref })),
      { level: 'SESSION', ref: session.sessionId },
    ];
  }
  return [];
}

function reconcileRequirementsAndPending(previousSession, candidate, command, context) {
  const indexes = indexApcSession(candidate);
  const decisionsRequired = [];

  for (const requirement of candidate.requirements) {
    const satisfied = isApcRequirementSatisfied(candidate, requirement, indexes);
    const episodes = candidate.pending.filter(item =>
      item.kind === 'UNRESOLVED_REQUIREMENT' &&
      item.originRequirementId === requirement.requirementId
    );
    const open = episodes.find(item => item.status === 'OPEN') ?? null;

    if (satisfied) {
      if (open) {
        const refs = qualifyingEvidence(
          candidate,
          requirement.characterId,
          requirement.scopeLevel,
          requirement.scopeRef,
        ).map(item => ({ evidenceId: item.evidenceId, revision: item.revision }));
        open.status = 'RESOLVED';
        open.resolutionEvidenceRefs = ordinalEvidenceRefs(refs);
      }
      continue;
    }

    if (open) continue;

    const critical = pendingCriticalFor(command, requirement.requirementId);
    if (critical == null) {
      decisionsRequired.push({
        type: 'PENDING_CRITICAL',
        requirementId: requirement.requirementId,
      });
      continue;
    }

    const tail = pendingTail(episodes);
    if (tail && tail.status !== 'RESOLVED') {
      return { ok: false, errors: [`pending series ${requirement.requirementId} has no RESOLVED recurrence tail`], decisionsRequired: [] };
    }

    candidate.pending.push({
      pendingId: context.newId('pending'),
      kind: 'UNRESOLVED_REQUIREMENT',
      status: 'OPEN',
      critical,
      originRequirementId: requirement.requirementId,
      scopeLevel: requirement.scopeLevel,
      scopeRef: requirement.scopeRef,
      characterId: requirement.characterId,
      previousPendingId: tail?.pendingId ?? null,
      resolutionEvidenceRefs: [],
      propagation: propagationForRequirement(candidate, requirement),
    });
  }

  if (decisionsRequired.length) {
    return { ok: false, errors: [], decisionsRequired };
  }

  return { ok: true, errors: [], decisionsRequired: [] };
}

function hasIncompatiblePair(items, areStatesIncompatible) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (areStatesIncompatible(a.observedState, b.observedState, {
        characterId: a.characterId,
        evidenceA: a,
        evidenceB: b,
      }) === true) return true;
    }
  }
  return false;
}

function reconcileContradictions(candidate, context) {
  const seriesKeys = new Set();
  for (const item of candidate.evidence) {
    if (item.current === true && item.lifecycleStatus === 'CONFIRMED' && item.evidenceStatus === 'OBSERVED') {
      seriesKeys.add(`${item.individualId}::${item.characterId}`);
    }
  }
  for (const item of candidate.contradictions) {
    seriesKeys.add(`${item.individualId}::${item.characterId}`);
  }

  for (const key of seriesKeys) {
    const [individualId, characterId] = key.split('::');
    const operational = candidate.evidence.filter(item =>
      item.current === true &&
      item.lifecycleStatus === 'CONFIRMED' &&
      item.evidenceStatus === 'OBSERVED' &&
      item.individualId === individualId &&
      item.characterId === characterId
    );
    const incompatible = hasIncompatiblePair(operational, context.areStatesIncompatible);
    const episodes = candidate.contradictions.filter(item =>
      item.individualId === individualId && item.characterId === characterId
    );
    const open = episodes.find(item => item.status === 'OPEN') ?? null;

    if (incompatible) {
      if (open) continue;
      const tail = contradictionTail(episodes);
      candidate.contradictions.push({
        contradictionId: context.newId('contradiction'),
        individualId,
        characterId,
        status: 'OPEN',
        evidenceRefs: ordinalEvidenceRefs(
          operational.map(item => ({ evidenceId: item.evidenceId, revision: item.revision })),
        ),
        previousContradictionId: tail?.contradictionId ?? null,
      });
    } else if (open) {
      open.status = 'RESOLVED';
    }
  }
}

function addEvidenceRevision(candidate, command, context) {
  const evidenceId = canonicalText(command.evidenceId);
  const current = evidenceId ? currentEvidence(candidate, evidenceId) : null;

  if (evidenceId && !current) {
    return { ok: false, errors: [`current evidence not found: ${evidenceId}`] };
  }
  if (current && current.revision !== command.baseRevision) {
    return { ok: false, stale: true, errors: [`baseRevision ${command.baseRevision} is stale; current is ${current.revision}`] };
  }

  const type = command.type;
  const targetLifecycle =
    type === 'CONFIRM_EVIDENCE' || type === 'EDIT_AND_RECONFIRM'
      ? 'CONFIRMED'
      : 'DRAFT';

  const identity = current
    ? {
        sessionId: current.sessionId,
        photoId: current.photoId,
        photoEvidenceRef: current.photoEvidenceRef,
        individualId: current.individualId,
        characterId: current.characterId,
      }
    : {
        sessionId: candidate.sessionId,
        photoId: command.targetPhotoId,
        photoEvidenceRef: candidate.photos.find(item => item.photoId === command.targetPhotoId)?.photoEvidenceId,
        individualId: command.targetIndividualId,
        characterId: command.characterId,
      };

  if (
    command.targetPhotoId && command.targetPhotoId !== identity.photoId ||
    command.targetIndividualId && command.targetIndividualId !== identity.individualId ||
    command.characterId && command.characterId !== identity.characterId
  ) {
    return { ok: false, errors: ['I6 identity fields cannot change within an evidenceId'] };
  }

  const desired = {
    ...(current ?? {}),
    ...(command.patch ?? {}),
    ...identity,
    evidenceId: current?.evidenceId ?? context.newId('evidence'),
    lifecycleStatus: targetLifecycle,
    confirmation: targetLifecycle === 'CONFIRMED' ? clone(command.confirmation ?? null) : null,
  };

  if (!desired.sourceType) desired.sourceType = 'human';
  if (!desired.sourceId) desired.sourceId = context.actorId;
  if (!desired.acquisition) desired.acquisition = { mode: 'manual', confirmedOnCurrentPhoto: null, basis: null };
  if (!Object.prototype.hasOwnProperty.call(desired, 'confidence')) desired.confidence = null;
  if (!Object.prototype.hasOwnProperty.call(desired, 'reason')) desired.reason = null;
  if (!Object.prototype.hasOwnProperty.call(desired, 'notes')) desired.notes = null;

  if (current && sameApcEvidenceNormativePayload(current, { ...desired, revision: current.revision, current: true })) {
    return { ok: true, noOp: true };
  }

  if (!current) {
    desired.revision = 1;
    desired.current = true;
    candidate.evidence.push(desired);
    return { ok: true, noOp: false, evidence: desired };
  }

  current.current = false;
  desired.revision = current.revision + 1;
  desired.current = true;
  candidate.evidence.push(desired);
  candidate.revisions.push({
    revisionEventId: context.newId('revision'),
    entityType: 'EVIDENCE',
    entityId: current.evidenceId,
    fromRevision: current.revision,
    toRevision: desired.revision,
    changedAt: context.now(),
    changedBy: context.actorId,
    reason: command.reason ?? command.type,
  });
  return { ok: true, noOp: false, evidence: desired };
}

function ensurePhotoTarget(candidate, command) {
  const photo = candidate.photos.find(item => item.photoId === command.targetPhotoId);
  if (!photo) return 'target PHOTO does not exist';
  const individual = candidate.individuals.find(item => item.individualId === command.targetIndividualId);
  if (!individual) return 'target INDIVIDUAL does not exist';
  if (!photo.individualRefs.includes(command.targetIndividualId)) return 'target INDIVIDUAL is not assigned to target PHOTO';
  return null;
}

function applyPrimaryMutation(candidate, command, context) {
  switch (command.type) {
    case 'CREATE_INDIVIDUAL': {
      const individualId = context.newId('individual');
      candidate.individuals.push({ individualId, status: 'OPEN' });
      return { ok: true, created: { individualId } };
    }

    case 'ASSIGN_PHOTO':
    case 'BATCH_ASSIGN_PHOTOS': {
      const photoIds = command.type === 'ASSIGN_PHOTO' ? [command.photoId] : command.photoIds;
      const individualId = command.individualId;
      if (!candidate.individuals.some(item => item.individualId === individualId)) {
        return { ok: false, errors: [`Unknown individualId: ${individualId}`] };
      }
      let changed = false;
      for (const photoId of [...new Set(photoIds ?? [])]) {
        const photo = candidate.photos.find(item => item.photoId === photoId);
        if (!photo) return { ok: false, errors: [`Unknown photoId: ${photoId}`] };
        if (!photo.individualRefs.includes(individualId)) {
          photo.individualRefs.push(individualId);
          changed = true;
        }
      }
      return { ok: true, noOp: !changed };
    }

    case 'UNASSIGN_PHOTO':
    case 'BATCH_UNASSIGN_PHOTOS': {
      const targets = command.type === 'UNASSIGN_PHOTO'
        ? [{ photoId: command.photoId, individualId: command.individualId }]
        : command.targets ?? [];
      const unique = new Map(targets.map(item => [`${item.photoId}::${item.individualId}`, item]));
      if (command.type === 'BATCH_UNASSIGN_PHOTOS') {
        const individualIds = new Set([...unique.values()].map(item => item.individualId));
        if (individualIds.size > 1) {
          return { ok: false, errors: ['BATCH_UNASSIGN_PHOTOS requires a single individualId'] };
        }
      }
      for (const target of unique.values()) {
        const photo = candidate.photos.find(item => item.photoId === target.photoId);
        if (!photo) return { ok: false, errors: [`Unknown photoId: ${target.photoId}`] };
        if ((candidate.evidence ?? []).some(item =>
          item.photoId === target.photoId && item.individualId === target.individualId
        )) {
          return { ok: false, errors: [`UNASSIGN_BLOCKED: evidence history exists for ${target.photoId}/${target.individualId}`] };
        }
      }
      let changed = false;
      for (const target of unique.values()) {
        const photo = candidate.photos.find(item => item.photoId === target.photoId);
        const next = photo.individualRefs.filter(ref => ref !== target.individualId);
        if (next.length !== photo.individualRefs.length) {
          photo.individualRefs = next;
          changed = true;
        }
      }
      return { ok: true, noOp: !changed };
    }

    case 'ADD_TO_INBOX':
    case 'REMOVE_FROM_INBOX':
    case 'BATCH_ADD_TO_INBOX':
    case 'BATCH_REMOVE_FROM_INBOX': {
      const add = command.type.includes('ADD');
      const ids = command.type.startsWith('BATCH_') ? command.photoIds ?? [] : [command.photoId];
      const unique = [...new Set(ids)];
      for (const photoId of unique) {
        if (!candidate.photos.some(item => item.photoId === photoId)) {
          return { ok: false, errors: [`Unknown photoId: ${photoId}`] };
        }
      }
      const before = JSON.stringify(candidate.inboxPhotoRefs);
      if (add) {
        const set = new Set(candidate.inboxPhotoRefs);
        for (const id of unique) set.add(id);
        candidate.inboxPhotoRefs = [...set];
      } else {
        const remove = new Set(unique);
        candidate.inboxPhotoRefs = candidate.inboxPhotoRefs.filter(id => !remove.has(id));
      }
      return { ok: true, noOp: JSON.stringify(candidate.inboxPhotoRefs) === before };
    }

    case 'INGEST_PHOTOS': {
      let changed = false;
      const seen = new Map(
        candidate.photoEvidence.map(pe => [
          normalizeFingerprintSha256(pe?.sourcePhoto?.fingerprintSha256),
          pe,
        ]),
      );
      for (const item of command.photos ?? []) {
        const fingerprint = normalizeFingerprintSha256(item.fingerprintSha256);
        if (!fingerprint) return { ok: false, errors: ['INGEST_PHOTOS requires valid fingerprintSha256'] };
        if (seen.has(fingerprint)) continue;

        const photoId = context.newId('photo');
        const photoEvidenceId = context.newId('photoEvidence');
        candidate.photos.push({
          photoId,
          fileRef: item.fileRef,
          capturedAt: item.capturedAt ?? null,
          location: item.location ?? null,
          individualRefs: [],
          photoEvidenceId,
        });
        const pe = {
          photoEvidenceId,
          sourcePhoto: { photoRef: photoId, fingerprintSha256: fingerprint },
          visibleStructures: item.visibleStructures ?? [],
        };
        candidate.photoEvidence.push(pe);
        candidate.inboxPhotoRefs.push(photoId);
        seen.set(fingerprint, pe);
        changed = true;
      }
      return { ok: true, noOp: !changed };
    }

    case 'SAVE_DRAFT':
    case 'CONFIRM_EVIDENCE':
    case 'EDIT_CONFIRMED_AS_DRAFT':
    case 'EDIT_AND_RECONFIRM': {
      const targetError = ensurePhotoTarget(candidate, command);
      if (targetError) return { ok: false, errors: [targetError] };
      return addEvidenceRevision(candidate, command, context);
    }

    case 'ADD_REQUIREMENT': {
      const input = command.requirement ?? {};
      const requirement = {
        requirementId: input.requirementId ?? context.newId('requirement'),
        scopeLevel: input.scopeLevel,
        scopeRef: input.scopeRef,
        characterId: input.characterId,
        required: true,
        reason: input.reason,
        createdBy: input.createdBy ?? context.actorId,
      };
      candidate.requirements.push(requirement);
      return { ok: true, created: { requirementId: requirement.requirementId } };
    }

    case 'SET_SESSION_STATUS': {
      if (!['OPEN','CLOSED'].includes(command.status)) return { ok: false, errors: ['status must be OPEN or CLOSED'] };
      if (candidate.status === command.status) return { ok: true, noOp: true };
      candidate.status = command.status;
      return { ok: true };
    }

    default:
      return { ok: false, errors: [`Unsupported I12 command: ${command.type}`] };
  }
}

export function createApcSession({ objective, context }) {
  if (!canonicalText(objective)) {
    return { status: 'REJECTED', session: null, errors: ['objective is required'], decisionsRequired: [] };
  }
  const session = {
    schemaVersion: 'apc-session-0.2',
    sessionId: context.newId('session'),
    semanticRevision: 1,
    status: 'OPEN',
    objective,
    objectiveAssessment: {
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
      notes: null,
    },
    createdAt: context.now(),
    createdBy: context.actorId,
    inboxPhotoRefs: [],
    photos: [],
    photoEvidence: [],
    individuals: [],
    evidence: [],
    requirements: [],
    pending: [],
    contradictions: [],
    revisions: [],
  };
  const validation = validateApcWritableWorkingSnapshot(session, context);
  if (!validation.valid) {
    return { status: 'REJECTED', session: null, errors: validation.errors, decisionsRequired: [] };
  }
  return { status: 'READY_TO_COMMIT', session, errors: [], decisionsRequired: [] };
}

export function applyApcTransaction({ previousSession, command, context }) {
  const previousValidation = validateApcWritableWorkingSnapshot(previousSession, context);
  if (!previousValidation.valid) {
    return {
      status: 'REJECTED',
      nextSession: null,
      errors: previousValidation.errors.map(error => `previous snapshot: ${error}`),
      decisionsRequired: [],
    };
  }

  if (command.targetSessionId !== previousSession.sessionId) {
    return { status: 'STALE_COMMAND', nextSession: null, errors: ['targetSessionId is stale'], decisionsRequired: [] };
  }

  const candidate = clone(previousSession);
  const primary = applyPrimaryMutation(candidate, command, context);
  if (!primary.ok) {
    return {
      status: primary.stale ? 'STALE_COMMAND' : 'REJECTED',
      nextSession: null,
      errors: primary.errors ?? [],
      decisionsRequired: [],
    };
  }
  if (primary.noOp) {
    return { status: 'NO_OP', nextSession: null, errors: [], decisionsRequired: [], created: primary.created ?? null };
  }

  const pendingResult = reconcileRequirementsAndPending(previousSession, candidate, command, context);
  if (!pendingResult.ok) {
    return {
      status: pendingResult.decisionsRequired.length ? 'NEEDS_DECISION' : 'REJECTED',
      nextSession: null,
      errors: pendingResult.errors,
      decisionsRequired: pendingResult.decisionsRequired,
    };
  }

  reconcileContradictions(candidate, context);

  candidate.semanticRevision = previousSession.semanticRevision;
  let semantic = validateApcSemanticTransition(previousSession, candidate, {
    isContradictionRelevant: context.isContradictionRelevant,
  });
  if (semantic.semanticChanged === true) {
    candidate.semanticRevision = previousSession.semanticRevision + 1;
    candidate.objectiveAssessment = {
      ...(candidate.objectiveAssessment ?? {}),
      status: 'OPEN',
      assessedRevision: null,
      assessedBy: null,
      assessedAt: null,
    };
    semantic = validateApcSemanticTransition(previousSession, candidate, {
      isContradictionRelevant: context.isContradictionRelevant,
    });
  }

  const errors = [];
  const writer = validateApcWritableWorkingSnapshot(candidate, context);
  if (!writer.valid) errors.push(...writer.errors);

  if (JSON.stringify(previousSession.pending) !== JSON.stringify(candidate.pending)) {
    const pendingTransition = validateApcPendingTransition(previousSession, candidate);
    if (!pendingTransition.valid) errors.push(...pendingTransition.errors);
  }

  if (JSON.stringify(previousSession.contradictions) !== JSON.stringify(candidate.contradictions)) {
    const contradictionTransition = validateApcContradictionTransition(previousSession, candidate, {
      areStatesIncompatible: context.areStatesIncompatible,
    });
    if (!contradictionTransition.valid) errors.push(...contradictionTransition.errors);
  }

  if (!semantic.valid) errors.push(...semantic.errors);

  if (errors.length) {
    return { status: 'REJECTED', nextSession: null, errors: [...new Set(errors)], decisionsRequired: [] };
  }

  return {
    status: 'READY_TO_COMMIT',
    nextSession: candidate,
    errors: [],
    decisionsRequired: [],
    created: primary.created ?? null,
  };
}
