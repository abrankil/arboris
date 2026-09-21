import { validatePhotoEvidence } from '../character-observers/common-evidence-contract.mjs';

export const APC_SCHEMA_VERSION = 'apc-session-0.2';
export const APC_SESSION_STATUSES = Object.freeze(['OPEN', 'CLOSED']);
export const OBJECTIVE_ASSESSMENT_STATUSES = Object.freeze(['OPEN', 'SATISFIED', 'NOT_SATISFIED']);
export const APC_REQUIREMENT_SCOPE_LEVELS = Object.freeze(['PHOTO', 'INDIVIDUAL', 'SESSION']);
export const APC_REQUIREMENT_REASONS = Object.freeze(['MANUAL', 'SESSION_OBJECTIVE', 'H16_VERIFICATION']);
export const APC_PENDING_KINDS = Object.freeze(['UNRESOLVED_REQUIREMENT', 'REPRESENTATION_GAP']);
export const APC_PENDING_STATUSES = Object.freeze(['OPEN', 'RESOLVED']);
export const APC_REPRESENTATION_TARGETS = Object.freeze(['CHARACTER', 'STATE']);
export const APC_CONTRADICTION_STATUSES = Object.freeze(['OPEN', 'RESOLVED']);
export const APC_PASS_REASON_CODES = Object.freeze(['NOT_EXPORTABLE', 'ASSESSMENT_STALE', 'OBJECTIVE_NOT_SATISFIED', 'CRITICAL_PENDING_OPEN']);

const EVIDENCE_IDENTITY_FIELDS = Object.freeze([
  'sessionId',
  'photoId',
  'photoEvidenceRef',
  'individualId',
  'characterId',
]);

function text(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function canonicalText(value) {
  if (typeof value !== 'string') return null;
  if (!value || value !== value.trim()) return null;
  return value;
}

function isIso8601(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , , , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText == null ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText == null ? 0 : Number(offsetMinuteText);

  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;
  if (offsetHour > 23 || offsetMinute > 59) return false;

  return !Number.isNaN(Date.parse(value));
}

function duplicateIds(items, field) {
  const seen = new Set();
  const dup = new Set();
  for (const item of items) {
    const id = text(item?.[field]);
    if (!id) continue;
    if (seen.has(id)) dup.add(id);
    seen.add(id);
  }
  return [...dup];
}

function validateEvidenceRevisionChains(session, errors) {
  const groups = new Map();

  for (const ev of session.evidence) {
    const id = canonicalText(ev?.evidenceId);
    const rev = ev?.revision;

    if (!id) errors.push('evidence.evidenceId must be a non-empty canonical string without surrounding whitespace');
    if (!Number.isInteger(rev) || rev < 1) errors.push(`evidence revision must be integer >= 1 for ${id ?? '<missing>'}`);
    if (typeof ev?.current !== 'boolean') errors.push(`evidence.current must be boolean for ${id ?? '<missing>'} revision ${Number.isInteger(rev) ? rev : '<invalid>'}`);

    for (const field of EVIDENCE_IDENTITY_FIELDS) {
      if (!canonicalText(ev?.[field])) errors.push(`evidence.${field} must be a non-empty canonical string for ${id ?? '<missing>'} revision ${Number.isInteger(rev) ? rev : '<invalid>'}`);
    }

    if (id) {
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(ev);
    }
  }

  for (const [evidenceId, versions] of groups) {
    const validVersions = versions
      .filter(ev => Number.isInteger(ev.revision) && ev.revision >= 1)
      .sort((a, b) => a.revision - b.revision);

    if (!validVersions.length) continue;

    for (let i = 0; i < validVersions.length; i += 1) {
      const expected = i + 1;
      if (validVersions[i].revision !== expected) {
        errors.push(`evidence ${evidenceId} revisions must be contiguous 1..N; expected revision ${expected}, found ${validVersions[i].revision}`);
        break;
      }
    }

    const currentVersions = validVersions.filter(ev => ev.current === true);
    if (currentVersions.length !== 1) {
      errors.push(`evidence ${evidenceId} must have exactly one current=true revision; found ${currentVersions.length}`);
    } else {
      const maxRevision = validVersions[validVersions.length - 1].revision;
      if (currentVersions[0].revision !== maxRevision) {
        errors.push(`evidence ${evidenceId} current=true must be max revision ${maxRevision}; found revision ${currentVersions[0].revision}`);
      }
    }

    const baseline = validVersions[0];
    for (const ev of validVersions.slice(1)) {
      for (const field of EVIDENCE_IDENTITY_FIELDS) {
        if (ev[field] !== baseline[field]) {
          errors.push(`evidence ${evidenceId} immutable identity field ${field} changes between revisions`);
        }
      }
    }
  }

  return groups;
}

function validateRevisionEvents(session, evidenceGroups, errors) {
  const eventsByEvidence = new Map();

  for (const event of session.revisions) {
    const revisionEventId = canonicalText(event?.revisionEventId);
    const entityId = canonicalText(event?.entityId);

    if (!revisionEventId) errors.push('revision.revisionEventId must be a non-empty canonical string without surrounding whitespace');
    if (event?.entityType !== 'EVIDENCE') errors.push(`revision ${revisionEventId ?? '<missing>'} entityType must equal EVIDENCE`);
    if (!entityId) errors.push(`revision ${revisionEventId ?? '<missing>'} entityId must be a non-empty canonical string without surrounding whitespace`);
    if (!Number.isInteger(event?.fromRevision) || event.fromRevision < 1) errors.push(`revision ${revisionEventId ?? '<missing>'} fromRevision must be integer >= 1`);
    if (!Number.isInteger(event?.toRevision) || event.toRevision < 2) errors.push(`revision ${revisionEventId ?? '<missing>'} toRevision must be integer >= 2`);
    if (Number.isInteger(event?.fromRevision) && Number.isInteger(event?.toRevision) && event.toRevision !== event.fromRevision + 1) {
      errors.push(`revision ${revisionEventId ?? '<missing>'} must connect adjacent revisions`);
    }
    if (!isIso8601(event?.changedAt)) errors.push(`revision ${revisionEventId ?? '<missing>'} changedAt must be valid ISO-8601`);
    if (!text(event?.changedBy)) errors.push(`revision ${revisionEventId ?? '<missing>'} changedBy is required`);
    if (!text(event?.reason)) errors.push(`revision ${revisionEventId ?? '<missing>'} reason is required`);

    if (entityId) {
      if (!evidenceGroups.has(entityId)) {
        errors.push(`revision ${revisionEventId ?? '<missing>'} references unknown evidence ${entityId}`);
      } else {
        if (!eventsByEvidence.has(entityId)) eventsByEvidence.set(entityId, []);
        eventsByEvidence.get(entityId).push(event);
      }
    }
  }

  for (const [evidenceId, versions] of evidenceGroups) {
    const validVersions = versions
      .filter(ev => Number.isInteger(ev.revision) && ev.revision >= 1)
      .sort((a, b) => a.revision - b.revision);
    if (!validVersions.length) continue;

    const expectedTransitions = new Set();
    for (let revision = 1; revision < validVersions.length; revision += 1) {
      expectedTransitions.add(`${revision}->${revision + 1}`);
    }

    const events = eventsByEvidence.get(evidenceId) ?? [];
    if (events.length !== expectedTransitions.size) {
      errors.push(`evidence ${evidenceId} requires exactly ${expectedTransitions.size} revision event(s); found ${events.length}`);
    }

    const seenTransitions = new Set();
    for (const event of events) {
      if (!Number.isInteger(event?.fromRevision) || !Number.isInteger(event?.toRevision)) continue;
      const key = `${event.fromRevision}->${event.toRevision}`;
      if (seenTransitions.has(key)) errors.push(`evidence ${evidenceId} contains duplicate revision transition ${key}`);
      seenTransitions.add(key);
      if (!expectedTransitions.has(key)) errors.push(`evidence ${evidenceId} contains unexpected revision transition ${key}`);
    }

    for (const key of expectedTransitions) {
      if (!seenTransitions.has(key)) errors.push(`evidence ${evidenceId} is missing revision transition ${key}`);
    }
  }
}


function scopeExists(session, indexes, level, ref) {
  if (level === 'PHOTO') return indexes.photosById.has(ref);
  if (level === 'INDIVIDUAL') return indexes.individualsById.has(ref);
  if (level === 'SESSION') return ref === session.sessionId;
  return false;
}

function evidenceMatchesScope(session, indexes, evidence, level, ref) {
  if (level === 'PHOTO') {
    const photo = indexes.photosById.get(ref);
    return evidence.photoId === ref && Array.isArray(photo?.individualRefs) && photo.individualRefs.includes(evidence.individualId);
  }
  if (level === 'INDIVIDUAL') return evidence.individualId === ref;
  if (level === 'SESSION') return ref === session.sessionId && evidence.sessionId === session.sessionId;
  return false;
}

function isQualifyingObservedEvidence(session, indexes, evidence, characterId, level, ref, { requireCurrent = true } = {}) {
  if (!evidence || typeof evidence !== 'object') return false;
  if (requireCurrent && evidence.current !== true) return false;
  if (evidence.lifecycleStatus !== 'CONFIRMED') return false;
  if (evidence.evidenceStatus !== 'OBSERVED') return false;
  if (evidence.characterId !== characterId) return false;
  return evidenceMatchesScope(session, indexes, evidence, level, ref);
}

export function isApcRequirementSatisfied(session, requirement, indexes = indexApcSession(session)) {
  if (!requirement || typeof requirement !== 'object') return false;
  return (session.evidence ?? []).some(ev =>
    isQualifyingObservedEvidence(
      session,
      indexes,
      ev,
      requirement.characterId,
      requirement.scopeLevel,
      requirement.scopeRef,
      { requireCurrent: true },
    )
  );
}

function validateRequirements(session, indexes, errors) {
  const semanticKeys = new Set();

  for (const requirement of session.requirements) {
    const id = canonicalText(requirement?.requirementId);
    const scopeLevel = requirement?.scopeLevel;
    const scopeRef = canonicalText(requirement?.scopeRef);
    const characterId = canonicalText(requirement?.characterId);
    const createdBy = canonicalText(requirement?.createdBy);

    if (!id) errors.push('requirement.requirementId must be a non-empty canonical string without surrounding whitespace');
    if (!APC_REQUIREMENT_SCOPE_LEVELS.includes(scopeLevel)) {
      errors.push(`requirement ${id ?? '<missing>'} scopeLevel must be one of: ${APC_REQUIREMENT_SCOPE_LEVELS.join(', ')}`);
    }
    if (!scopeRef) errors.push(`requirement ${id ?? '<missing>'} scopeRef must be a non-empty canonical string`);
    if (!characterId) errors.push(`requirement ${id ?? '<missing>'} characterId must be a non-empty canonical string`);
    if (requirement?.required !== true) errors.push(`requirement ${id ?? '<missing>'} required must equal true`);
    if (!APC_REQUIREMENT_REASONS.includes(requirement?.reason)) {
      errors.push(`requirement ${id ?? '<missing>'} reason must be one of: ${APC_REQUIREMENT_REASONS.join(', ')}`);
    }
    if (!createdBy) errors.push(`requirement ${id ?? '<missing>'} createdBy must be a non-empty canonical string`);

    if (scopeRef && APC_REQUIREMENT_SCOPE_LEVELS.includes(scopeLevel) && !scopeExists(session, indexes, scopeLevel, scopeRef)) {
      errors.push(`requirement ${id ?? '<missing>'} scopeRef ${scopeRef} does not resolve at ${scopeLevel}`);
    }

    if (scopeRef && characterId && createdBy && APC_REQUIREMENT_SCOPE_LEVELS.includes(scopeLevel) && APC_REQUIREMENT_REASONS.includes(requirement?.reason)) {
      const key = [scopeLevel, scopeRef, characterId, requirement.reason, createdBy].join('::');
      if (semanticKeys.has(key)) errors.push(`duplicate requirement semantic key: ${key}`);
      semanticKeys.add(key);
    }
  }
}

export function validateApcRequirementCharacters(session, dataset) {
  const errors = [];
  const characters = dataset?.allCharactersById;
  if (!(characters instanceof Map)) {
    return { valid: false, errors: ['dataset.allCharactersById must be a Map'] };
  }
  for (const requirement of session?.requirements ?? []) {
    const id = canonicalText(requirement?.requirementId) ?? '<missing>';
    const characterId = canonicalText(requirement?.characterId);
    if (characterId && !characters.has(characterId)) {
      errors.push(`requirement ${id} references unknown dataset characterId ${characterId}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

function pendingSource(pending, requirement = null) {
  if (pending?.kind === 'UNRESOLVED_REQUIREMENT') {
    return { level: pending?.scopeLevel, ref: pending?.scopeRef, characterId: pending?.characterId ?? requirement?.characterId ?? null };
  }
  return { level: pending?.sourceLevel, ref: pending?.sourceRef, characterId: pending?.characterId ?? null };
}

function pendingSeriesKey(pending) {
  if (pending?.kind === 'UNRESOLVED_REQUIREMENT') {
    const requirementId = canonicalText(pending?.originRequirementId);
    return requirementId ? `UNRESOLVED_REQUIREMENT::${requirementId}` : null;
  }
  if (pending?.kind === 'REPRESENTATION_GAP') {
    const level = pending?.sourceLevel;
    const ref = canonicalText(pending?.sourceRef);
    const characterId = canonicalText(pending?.characterId);
    const target = pending?.representationTarget;
    const targetState = target === 'STATE' ? canonicalText(pending?.targetState) : '';
    if (!['INDIVIDUAL', 'SESSION'].includes(level) || !ref || !characterId || !APC_REPRESENTATION_TARGETS.includes(target)) return null;
    if (target === 'STATE' && !targetState) return null;
    return ['REPRESENTATION_GAP', level, ref, characterId, target, targetState].join('::');
  }
  return null;
}

function validateResolutionEvidenceRefs(session, indexes, pending, source, errors) {
  const id = canonicalText(pending?.pendingId) ?? '<missing>';
  if (!Array.isArray(pending?.resolutionEvidenceRefs)) {
    errors.push(`pending ${id} resolutionEvidenceRefs must be an array`);
    return;
  }
  const seen = new Set();
  for (const ref of pending.resolutionEvidenceRefs) {
    const evidenceId = canonicalText(ref?.evidenceId);
    const revision = ref?.revision;
    if (!evidenceId || !Number.isInteger(revision) || revision < 1) {
      errors.push(`pending ${id} resolutionEvidenceRefs entries require canonical evidenceId and revision >= 1`);
      continue;
    }
    const key = `${evidenceId}::${revision}`;
    if (seen.has(key)) errors.push(`pending ${id} contains duplicate resolution evidence ref ${key}`);
    seen.add(key);
    const evidence = indexes.evidenceByLogicalVersion.get(key);
    if (!evidence) {
      errors.push(`pending ${id} references unknown resolution evidence ${key}`);
      continue;
    }
    if (!isQualifyingObservedEvidence(session, indexes, evidence, source.characterId, source.level, source.ref, { requireCurrent: false })) {
      errors.push(`pending ${id} resolution evidence ${key} is not CONFIRMED OBSERVED evidence compatible with its source scope`);
    }
  }
  if (pending?.status === 'OPEN' && pending.resolutionEvidenceRefs.length) {
    errors.push(`pending ${id} OPEN episode must not contain resolutionEvidenceRefs`);
  }
}

function validatePropagation(session, indexes, pending, source, errors) {
  const id = canonicalText(pending?.pendingId) ?? '<missing>';
  if (!Array.isArray(pending?.propagation)) {
    errors.push(`pending ${id} propagation must be an array`);
    return;
  }
  const rank = { PHOTO: 0, INDIVIDUAL: 1, SESSION: 2 };
  const seen = new Set();
  for (const item of pending.propagation) {
    const level = item?.level;
    const ref = canonicalText(item?.ref);
    if (!APC_REQUIREMENT_SCOPE_LEVELS.includes(level) || !ref) {
      errors.push(`pending ${id} propagation entries require valid level and canonical ref`);
      continue;
    }
    const key = `${level}::${ref}`;
    if (seen.has(key)) errors.push(`pending ${id} contains duplicate propagation target ${key}`);
    seen.add(key);
    if (!scopeExists(session, indexes, level, ref)) errors.push(`pending ${id} propagation target ${key} does not resolve`);
    if (!(rank[level] > rank[source.level])) errors.push(`pending ${id} propagation must be strictly upward from ${source.level}`);

    if (source.level === 'PHOTO' && level === 'INDIVIDUAL') {
      const photo = indexes.photosById.get(source.ref);
      if (!Array.isArray(photo?.individualRefs) || !photo.individualRefs.includes(ref)) {
        errors.push(`pending ${id} PHOTO propagation to INDIVIDUAL ${ref} must target an individual referenced by PHOTO ${source.ref}`);
      }
    }
    if (level === 'SESSION' && ref !== session.sessionId) {
      errors.push(`pending ${id} SESSION propagation must target sessionId ${session.sessionId}`);
    }
  }
}

function validatePending(session, indexes, errors) {
  const requirementsById = new Map(session.requirements.map(r => [r.requirementId, r]));
  const pendingById = new Map(session.pending.map(p => [p.pendingId, p]));
  const series = new Map();

  for (const pending of session.pending) {
    const id = canonicalText(pending?.pendingId);
    if (!id) errors.push('pending.pendingId must be a non-empty canonical string without surrounding whitespace');
    if (!APC_PENDING_KINDS.includes(pending?.kind)) errors.push(`pending ${id ?? '<missing>'} kind must be one of: ${APC_PENDING_KINDS.join(', ')}`);
    if (!APC_PENDING_STATUSES.includes(pending?.status)) errors.push(`pending ${id ?? '<missing>'} status must be one of: ${APC_PENDING_STATUSES.join(', ')}`);
    if (typeof pending?.critical !== 'boolean') errors.push(`pending ${id ?? '<missing>'} critical must be boolean`);
    if (!canonicalText(pending?.characterId)) errors.push(`pending ${id ?? '<missing>'} characterId must be a non-empty canonical string`);

    let requirement = null;
    if (pending?.kind === 'UNRESOLVED_REQUIREMENT') {
      const originRequirementId = canonicalText(pending?.originRequirementId);
      if (!originRequirementId) errors.push(`pending ${id ?? '<missing>'} originRequirementId is required for UNRESOLVED_REQUIREMENT`);
      else {
        requirement = requirementsById.get(originRequirementId);
        if (!requirement) errors.push(`pending ${id ?? '<missing>'} references unknown originRequirementId ${originRequirementId}`);
      }
      if (!APC_REQUIREMENT_SCOPE_LEVELS.includes(pending?.scopeLevel)) errors.push(`pending ${id ?? '<missing>'} scopeLevel is invalid`);
      if (!canonicalText(pending?.scopeRef)) errors.push(`pending ${id ?? '<missing>'} scopeRef must be canonical`);
      if (requirement) {
        if (pending.scopeLevel !== requirement.scopeLevel || pending.scopeRef !== requirement.scopeRef || pending.characterId !== requirement.characterId) {
          errors.push(`pending ${id ?? '<missing>'} must match origin requirement scope and character`);
        }
        if (pending.status === 'OPEN' && isApcRequirementSatisfied(session, requirement, indexes)) {
          errors.push(`pending ${id ?? '<missing>'} cannot be OPEN because origin requirement is currently satisfied`);
        }
      }
      if (pending?.representationTarget != null || pending?.targetState != null) {
        errors.push(`pending ${id ?? '<missing>'} UNRESOLVED_REQUIREMENT must not define representation target fields`);
      }
    }

    if (pending?.kind === 'REPRESENTATION_GAP') {
      if (!['INDIVIDUAL', 'SESSION'].includes(pending?.sourceLevel)) {
        errors.push(`pending ${id ?? '<missing>'} REPRESENTATION_GAP sourceLevel must be INDIVIDUAL or SESSION`);
      }
      const sourceRef = canonicalText(pending?.sourceRef);
      if (!sourceRef) errors.push(`pending ${id ?? '<missing>'} sourceRef must be canonical`);
      else if (['INDIVIDUAL', 'SESSION'].includes(pending?.sourceLevel) && !scopeExists(session, indexes, pending.sourceLevel, sourceRef)) {
        errors.push(`pending ${id ?? '<missing>'} sourceRef ${sourceRef} does not resolve at ${pending.sourceLevel}`);
      }
      if (!APC_REPRESENTATION_TARGETS.includes(pending?.representationTarget)) {
        errors.push(`pending ${id ?? '<missing>'} representationTarget must be CHARACTER or STATE`);
      } else if (pending.representationTarget === 'STATE') {
        if (!canonicalText(pending?.targetState)) errors.push(`pending ${id ?? '<missing>'} targetState is required when representationTarget=STATE`);
      } else if (pending?.targetState != null) {
        errors.push(`pending ${id ?? '<missing>'} targetState must be absent when representationTarget=CHARACTER`);
      }

      if (pending?.originRequirementId != null) {
        const originRequirementId = canonicalText(pending.originRequirementId);
        requirement = requirementsById.get(originRequirementId);
        if (!originRequirementId || !requirement) errors.push(`pending ${id ?? '<missing>'} optional originRequirementId must resolve when present`);
        else if (requirement.characterId !== pending.characterId) errors.push(`pending ${id ?? '<missing>'} origin requirement character is incompatible with representation gap`);
      }
      if (pending?.scopeLevel != null || pending?.scopeRef != null) {
        errors.push(`pending ${id ?? '<missing>'} REPRESENTATION_GAP must use sourceLevel/sourceRef, not scopeLevel/scopeRef`);
      }
    }

    const source = pendingSource(pending, requirement);
    if (APC_REQUIREMENT_SCOPE_LEVELS.includes(source.level) && canonicalText(source.ref) && canonicalText(source.characterId)) {
      validateResolutionEvidenceRefs(session, indexes, pending, source, errors);
      validatePropagation(session, indexes, pending, source, errors);
    }

    if (pending?.previousPendingId != null && !canonicalText(pending.previousPendingId)) {
      errors.push(`pending ${id ?? '<missing>'} previousPendingId must be canonical when present`);
    }

    const key = pendingSeriesKey(pending);
    if (key) {
      if (!series.has(key)) series.set(key, []);
      series.get(key).push(pending);
    }
  }

  for (const [key, episodes] of series) {
    const openEpisodes = episodes.filter(p => p.status === 'OPEN');
    if (openEpisodes.length > 1) errors.push(`pending series ${key} has more than one OPEN episode`);

    const episodeIds = new Set(episodes.map(p => p.pendingId));
    const childCount = new Map();
    let roots = 0;

    for (const pending of episodes) {
      const previousId = pending.previousPendingId ?? null;
      if (previousId == null) {
        roots += 1;
        continue;
      }
      const previous = pendingById.get(previousId);
      if (!previous) {
        errors.push(`pending ${pending.pendingId} previousPendingId ${previousId} does not resolve`);
        continue;
      }
      if (!episodeIds.has(previousId) || pendingSeriesKey(previous) !== key) {
        errors.push(`pending ${pending.pendingId} previousPendingId must belong to the same semantic series`);
      }
      if (previous.status !== 'RESOLVED') errors.push(`pending ${pending.pendingId} previous episode ${previousId} must be RESOLVED`);
      childCount.set(previousId, (childCount.get(previousId) ?? 0) + 1);
    }

    if (episodes.length && roots !== 1) errors.push(`pending series ${key} must have exactly one root; found ${roots}`);
    for (const [parentId, count] of childCount) if (count > 1) errors.push(`pending series ${key} forks at ${parentId}`);

    for (const pending of episodes) {
      const seen = new Set();
      let cursor = pending;
      while (cursor?.previousPendingId != null) {
        if (seen.has(cursor.pendingId)) {
          errors.push(`pending series ${key} contains a recurrence cycle`);
          break;
        }
        seen.add(cursor.pendingId);
        cursor = pendingById.get(cursor.previousPendingId);
        if (!cursor || pendingSeriesKey(cursor) !== key) break;
      }
    }

    for (const open of openEpisodes) {
      if ((childCount.get(open.pendingId) ?? 0) > 0) errors.push(`pending OPEN episode ${open.pendingId} must be the tail of its series`);
    }
  }
}

export function validateApcPendingTransition(previousSession, nextSession) {
  const errors = [];
  const nextResult = validateApcSession(nextSession);
  if (!nextResult.valid) errors.push(...nextResult.errors.map(e => `next snapshot: ${e}`));
  if (!previousSession || typeof previousSession !== 'object') return { valid: false, errors: ['previousSession is required', ...errors] };
  if (previousSession.sessionId !== nextSession?.sessionId) errors.push('pending transition requires the same sessionId');

  const previousById = new Map((previousSession.pending ?? []).map(p => [p.pendingId, p]));
  const nextById = new Map((nextSession?.pending ?? []).map(p => [p.pendingId, p]));
  const nextIndexes = nextResult.valid ? nextResult.indexes : indexApcSession(nextSession ?? { photos: [], photoEvidence: [], individuals: [], evidence: [] });

  for (const [id, before] of previousById) {
    const after = nextById.get(id);
    if (!after) {
      errors.push(`pending episode ${id} cannot be deleted by transition`);
      continue;
    }
    const immutableFields = before.kind === 'UNRESOLVED_REQUIREMENT'
      ? ['kind','originRequirementId','scopeLevel','scopeRef','characterId','critical','previousPendingId','propagation']
      : ['kind','originRequirementId','sourceLevel','sourceRef','characterId','representationTarget','targetState','critical','previousPendingId','propagation'];
    for (const field of immutableFields) {
      const beforeValue = field === 'propagation' ? JSON.stringify(before[field] ?? null) : (before[field] ?? null);
      const afterValue = field === 'propagation' ? JSON.stringify(after[field] ?? null) : (after[field] ?? null);
      if (beforeValue !== afterValue) errors.push(`pending ${id} immutable field ${field} changed during transition`);
    }

    if (before.status === 'RESOLVED') {
      if (after.status !== 'RESOLVED') errors.push(`pending ${id} RESOLVED status is terminal`);
      if (JSON.stringify(before.resolutionEvidenceRefs ?? null) !== JSON.stringify(after.resolutionEvidenceRefs ?? null)) {
        errors.push(`pending ${id} RESOLVED resolutionEvidenceRefs are immutable`);
      }
    }

    if (before.status === 'OPEN' && after.status === 'OPEN' &&
        JSON.stringify(before.resolutionEvidenceRefs ?? null) !== JSON.stringify(after.resolutionEvidenceRefs ?? null)) {
      errors.push(`pending ${id} resolutionEvidenceRefs may change only on OPEN->RESOLVED transition`);
    }

    if (before.status === 'OPEN' && after.status === 'RESOLVED') {
      const requirement = after.originRequirementId
        ? (nextSession.requirements ?? []).find(r => r.requirementId === after.originRequirementId)
        : null;
      const source = pendingSource(after, requirement);

      if (after.kind === 'UNRESOLVED_REQUIREMENT' && requirement &&
          !isApcRequirementSatisfied(nextSession, requirement, nextIndexes)) {
        errors.push(`pending ${id} UNRESOLVED_REQUIREMENT can resolve only while its origin requirement is satisfied`);
      }

      for (const ref of after.resolutionEvidenceRefs ?? []) {
        const ev = nextIndexes.evidenceByLogicalVersion.get(`${ref?.evidenceId}::${ref?.revision}`);
        if (!isQualifyingObservedEvidence(nextSession, nextIndexes, ev, source.characterId, source.level, source.ref, { requireCurrent: true })) {
          errors.push(`pending ${id} resolution transition evidence must be current CONFIRMED OBSERVED and source-compatible`);
        }
      }
    }
  }

  for (const [id, after] of nextById) {
    if (previousById.has(id) || after.previousPendingId == null) continue;
    const previousEpisode = previousById.get(after.previousPendingId);
    if (!previousEpisode) errors.push(`new recurrent pending ${id} requires previousPendingId to exist in previous snapshot`);
    else {
      if (previousEpisode.status !== 'RESOLVED') errors.push(`new recurrent pending ${id} requires previous episode to already be RESOLVED`);
      if (pendingSeriesKey(previousEpisode) !== pendingSeriesKey(after)) errors.push(`new recurrent pending ${id} must preserve semantic series`);
    }
  }

  return { valid: errors.length === 0, errors };
}


function contradictionSeriesKey(contradiction) {
  const individualId = canonicalText(contradiction?.individualId);
  const characterId = canonicalText(contradiction?.characterId);
  if (!individualId || !characterId) return null;
  return `${individualId}::${characterId}`;
}

function currentOperationalEvidence(session, individualId, characterId) {
  return (session.evidence ?? []).filter(ev =>
    ev?.current === true &&
    ev?.lifecycleStatus === 'CONFIRMED' &&
    ev?.evidenceStatus === 'OBSERVED' &&
    ev?.individualId === individualId &&
    ev?.characterId === characterId
  );
}

function hasIncompatiblePair(evidenceItems, areStatesIncompatible) {
  if (typeof areStatesIncompatible !== 'function') return false;
  for (let i = 0; i < evidenceItems.length; i += 1) {
    for (let j = i + 1; j < evidenceItems.length; j += 1) {
      const a = evidenceItems[i];
      const b = evidenceItems[j];
      if (areStatesIncompatible(a.observedState, b.observedState, {
        characterId: a.characterId,
        evidenceA: a,
        evidenceB: b,
      }) === true) return true;
    }
  }
  return false;
}

function validateContradictionStructure(session, indexes, errors) {
  const contradictionsById = new Map(session.contradictions.map(c => [c.contradictionId, c]));
  const series = new Map();

  for (const contradiction of session.contradictions) {
    const id = canonicalText(contradiction?.contradictionId);
    const individualId = canonicalText(contradiction?.individualId);
    const characterId = canonicalText(contradiction?.characterId);

    if (!id) errors.push('contradiction.contradictionId must be a non-empty canonical string without surrounding whitespace');
    if (!individualId) errors.push(`contradiction ${id ?? '<missing>'} individualId must be canonical`);
    else if (!indexes.individualsById.has(individualId)) errors.push(`contradiction ${id ?? '<missing>'} references unknown individualId ${individualId}`);
    if (!characterId) errors.push(`contradiction ${id ?? '<missing>'} characterId must be canonical`);
    if (!APC_CONTRADICTION_STATUSES.includes(contradiction?.status)) {
      errors.push(`contradiction ${id ?? '<missing>'} status must be one of: ${APC_CONTRADICTION_STATUSES.join(', ')}`);
    }

    if (!Array.isArray(contradiction?.evidenceRefs) || contradiction.evidenceRefs.length < 2) {
      errors.push(`contradiction ${id ?? '<missing>'} evidenceRefs must contain at least 2 versioned references`);
    } else {
      const versionKeys = new Set();
      const logicalIds = new Set();
      for (const ref of contradiction.evidenceRefs) {
        const evidenceId = canonicalText(ref?.evidenceId);
        const revision = ref?.revision;
        if (!evidenceId || !Number.isInteger(revision) || revision < 1) {
          errors.push(`contradiction ${id ?? '<missing>'} evidenceRefs entries require canonical evidenceId and revision >= 1`);
          continue;
        }
        const key = `${evidenceId}::${revision}`;
        if (versionKeys.has(key)) errors.push(`contradiction ${id ?? '<missing>'} contains duplicate evidence ref ${key}`);
        versionKeys.add(key);
        if (logicalIds.has(evidenceId)) errors.push(`contradiction ${id ?? '<missing>'} may reference at most one revision of evidenceId ${evidenceId}`);
        logicalIds.add(evidenceId);

        const ev = indexes.evidenceByLogicalVersion.get(key);
        if (!ev) {
          errors.push(`contradiction ${id ?? '<missing>'} references unknown evidence ${key}`);
          continue;
        }
        if (ev.individualId !== individualId || ev.characterId !== characterId) {
          errors.push(`contradiction ${id ?? '<missing>'} evidence ${key} must belong to the same individual/character series`);
        }
        if (ev.lifecycleStatus !== 'CONFIRMED' || ev.evidenceStatus !== 'OBSERVED') {
          errors.push(`contradiction ${id ?? '<missing>'} evidence ${key} must be CONFIRMED and OBSERVED`);
        }
      }
    }

    if (contradiction?.previousContradictionId != null && !canonicalText(contradiction.previousContradictionId)) {
      errors.push(`contradiction ${id ?? '<missing>'} previousContradictionId must be canonical when present`);
    }

    const key = contradictionSeriesKey(contradiction);
    if (key) {
      if (!series.has(key)) series.set(key, []);
      series.get(key).push(contradiction);
    }
  }

  for (const [key, episodes] of series) {
    const openEpisodes = episodes.filter(c => c.status === 'OPEN');
    if (openEpisodes.length > 1) errors.push(`contradiction series ${key} has more than one OPEN episode`);

    const episodeIds = new Set(episodes.map(c => c.contradictionId));
    const childCount = new Map();
    let roots = 0;

    for (const contradiction of episodes) {
      const previousId = contradiction.previousContradictionId ?? null;
      if (previousId == null) {
        roots += 1;
        continue;
      }
      const previous = contradictionsById.get(previousId);
      if (!previous) {
        errors.push(`contradiction ${contradiction.contradictionId} previousContradictionId ${previousId} does not resolve`);
        continue;
      }
      if (!episodeIds.has(previousId) || contradictionSeriesKey(previous) !== key) {
        errors.push(`contradiction ${contradiction.contradictionId} previousContradictionId must belong to the same semantic series`);
      }
      if (previous.status !== 'RESOLVED') {
        errors.push(`contradiction ${contradiction.contradictionId} previous episode ${previousId} must be RESOLVED`);
      }
      childCount.set(previousId, (childCount.get(previousId) ?? 0) + 1);
    }

    if (episodes.length && roots !== 1) errors.push(`contradiction series ${key} must have exactly one root; found ${roots}`);
    for (const [parentId, count] of childCount) {
      if (count > 1) errors.push(`contradiction series ${key} forks at ${parentId}`);
    }

    for (const contradiction of episodes) {
      const seen = new Set();
      let cursor = contradiction;
      while (cursor?.previousContradictionId != null) {
        if (seen.has(cursor.contradictionId)) {
          errors.push(`contradiction series ${key} contains a recurrence cycle`);
          break;
        }
        seen.add(cursor.contradictionId);
        cursor = contradictionsById.get(cursor.previousContradictionId);
        if (!cursor || contradictionSeriesKey(cursor) !== key) break;
      }
    }

    for (const open of openEpisodes) {
      if ((childCount.get(open.contradictionId) ?? 0) > 0) {
        errors.push(`contradiction OPEN episode ${open.contradictionId} must be the tail of its series`);
      }
    }
  }
}

export function validateApcContradictions(session, { areStatesIncompatible } = {}) {
  const errors = [];
  if (typeof areStatesIncompatible !== 'function') {
    return { valid: false, errors: ['areStatesIncompatible callback is required for semantic contradiction validation'] };
  }

  const base = validateApcSession(session);
  if (!base.valid) return { valid: false, errors: base.errors.map(e => `snapshot: ${e}`) };

  const openBySeries = new Map();
  for (const contradiction of session.contradictions) {
    const key = contradictionSeriesKey(contradiction);
    if (key && contradiction.status === 'OPEN') openBySeries.set(key, contradiction);
  }

  const operationalSeries = new Map();
  for (const ev of session.evidence) {
    if (ev?.current !== true || ev?.lifecycleStatus !== 'CONFIRMED' || ev?.evidenceStatus !== 'OBSERVED') continue;
    const key = `${ev.individualId}::${ev.characterId}`;
    if (!operationalSeries.has(key)) operationalSeries.set(key, []);
    operationalSeries.get(key).push(ev);
  }

  const allKeys = new Set([...operationalSeries.keys(), ...openBySeries.keys()]);
  for (const key of allKeys) {
    const current = operationalSeries.get(key) ?? [];
    const incompatible = hasIncompatiblePair(current, areStatesIncompatible);
    const hasOpen = openBySeries.has(key);
    if (incompatible && !hasOpen) errors.push(`contradiction series ${key} has current incompatible evidence but no OPEN contradiction`);
    if (!incompatible && hasOpen) errors.push(`contradiction series ${key} has OPEN contradiction but no current incompatible pair`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateApcContradictionTransition(previousSession, nextSession, { areStatesIncompatible } = {}) {
  const errors = [];
  if (typeof areStatesIncompatible !== 'function') {
    return { valid: false, errors: ['areStatesIncompatible callback is required for contradiction transition validation'] };
  }

  const nextSemantic = validateApcContradictions(nextSession, { areStatesIncompatible });
  if (!nextSemantic.valid) errors.push(...nextSemantic.errors.map(e => `next snapshot: ${e}`));
  if (!previousSession || typeof previousSession !== 'object') {
    return { valid: false, errors: ['previousSession is required', ...errors] };
  }
  if (previousSession.sessionId !== nextSession?.sessionId) errors.push('contradiction transition requires the same sessionId');

  const previousById = new Map((previousSession.contradictions ?? []).map(c => [c.contradictionId, c]));
  const nextById = new Map((nextSession?.contradictions ?? []).map(c => [c.contradictionId, c]));
  const nextIndexes = indexApcSession(nextSession);

  for (const [id, before] of previousById) {
    const after = nextById.get(id);
    if (!after) {
      errors.push(`contradiction episode ${id} cannot be deleted by transition`);
      continue;
    }

    for (const field of ['individualId','characterId','previousContradictionId','evidenceRefs']) {
      const beforeValue = field === 'evidenceRefs' ? JSON.stringify(before[field] ?? null) : (before[field] ?? null);
      const afterValue = field === 'evidenceRefs' ? JSON.stringify(after[field] ?? null) : (after[field] ?? null);
      if (beforeValue !== afterValue) errors.push(`contradiction ${id} immutable field ${field} changed during transition`);
    }

    if (before.status === 'RESOLVED' && after.status !== 'RESOLVED') {
      errors.push(`contradiction ${id} RESOLVED status is terminal`);
    }

    if (before.status === 'OPEN' && after.status === 'RESOLVED') {
      const current = currentOperationalEvidence(nextSession, after.individualId, after.characterId);
      if (hasIncompatiblePair(current, areStatesIncompatible)) {
        errors.push(`contradiction ${id} OPEN->RESOLVED requires no current incompatible pair`);
      }
    }
  }

  for (const [id, after] of nextById) {
    if (previousById.has(id)) continue;

    const triggerEvidence = (after.evidenceRefs ?? [])
      .map(ref => nextIndexes.evidenceByLogicalVersion.get(`${ref?.evidenceId}::${ref?.revision}`))
      .filter(Boolean);

    for (const ev of triggerEvidence) {
      if (ev.current !== true || ev.lifecycleStatus !== 'CONFIRMED' || ev.evidenceStatus !== 'OBSERVED') {
        errors.push(`new contradiction ${id} trigger evidence must be current CONFIRMED OBSERVED at creation`);
      }
    }
    if (!hasIncompatiblePair(triggerEvidence, areStatesIncompatible)) {
      errors.push(`new contradiction ${id} trigger evidence must contain an incompatible pair`);
    }

    if (after.previousContradictionId != null) {
      const previousEpisode = previousById.get(after.previousContradictionId);
      if (!previousEpisode) {
        errors.push(`new recurrent contradiction ${id} requires previousContradictionId to exist in previous snapshot`);
      } else {
        if (previousEpisode.status !== 'RESOLVED') {
          errors.push(`new recurrent contradiction ${id} requires previous episode to already be RESOLVED`);
        }
        if (contradictionSeriesKey(previousEpisode) !== contradictionSeriesKey(after)) {
          errors.push(`new recurrent contradiction ${id} must preserve semantic series`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}


function validateObjectiveAssessmentBinding(session, errors, reasons = null) {
  const revision = session?.semanticRevision;
  const assessment = session?.objectiveAssessment;
  if (!Number.isInteger(revision) || revision < 1) {
    errors.push('semanticRevision must be an integer >= 1');
    return;
  }
  if (!assessment || typeof assessment !== 'object') return;

  if (assessment.status === 'OPEN') {
    if (assessment.assessedRevision != null) errors.push('objectiveAssessment.assessedRevision must be null when status=OPEN');
    if (assessment.assessedBy != null) errors.push('objectiveAssessment.assessedBy must be null when status=OPEN');
    if (assessment.assessedAt != null) errors.push('objectiveAssessment.assessedAt must be null when status=OPEN');
    return;
  }

  if (assessment.status === 'SATISFIED' || assessment.status === 'NOT_SATISFIED') {
    if (!Number.isInteger(assessment.assessedRevision) || assessment.assessedRevision !== revision) {
      errors.push(`objectiveAssessment.assessedRevision must equal semanticRevision ${revision} when assessment is final`);
      if (Array.isArray(reasons) && !reasons.includes('ASSESSMENT_STALE')) reasons.push('ASSESSMENT_STALE');
    }
    if (!canonicalText(assessment.assessedBy)) errors.push('objectiveAssessment.assessedBy must be a canonical non-empty string when assessment is final');
    if (!isIso8601(assessment.assessedAt)) errors.push('objectiveAssessment.assessedAt must be valid ISO-8601 when assessment is final');
  }
}

function requirementCoverageErrors(session, indexes) {
  const errors = [];
  for (const requirement of session.requirements ?? []) {
    const openMatches = (session.pending ?? []).filter(p =>
      p?.kind === 'UNRESOLVED_REQUIREMENT' &&
      p?.status === 'OPEN' &&
      p?.originRequirementId === requirement.requirementId
    );
    const satisfied = isApcRequirementSatisfied(session, requirement, indexes);
    if (satisfied && openMatches.length !== 0) {
      errors.push(`requirement ${requirement.requirementId} is satisfied and must have zero OPEN UNRESOLVED_REQUIREMENT pending; found ${openMatches.length}`);
    }
    if (!satisfied && openMatches.length !== 1) {
      errors.push(`requirement ${requirement.requirementId} is unsatisfied and must have exactly one OPEN UNRESOLVED_REQUIREMENT pending; found ${openMatches.length}`);
    }
  }
  return errors;
}

function stableSorted(items, keyFn) {
  return [...items].sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
}

function assessmentSubstrateSnapshot(session, { isContradictionRelevant = () => false } = {}) {
  const indexes = indexApcSession(session);

  const evidence = stableSorted(
    (session.evidence ?? [])
      .filter(ev => ev?.current === true)
      .map(ev => ({
        evidenceId: ev.evidenceId,
        revision: ev.revision,
        photoId: ev.photoId,
        individualId: ev.individualId,
        characterId: ev.characterId,
        lifecycleStatus: ev.lifecycleStatus,
        evidenceStatus: ev.evidenceStatus,
        observedState: ev.observedState ?? null,
        reason: ev.reason ?? null,
      })),
    ev => `${ev.evidenceId}::${ev.revision}`,
  );

  const requirements = stableSorted(
    (session.requirements ?? []).map(requirement => ({
      requirementId: requirement.requirementId,
      scopeLevel: requirement.scopeLevel,
      scopeRef: requirement.scopeRef,
      characterId: requirement.characterId,
      required: requirement.required,
      reason: requirement.reason,
      createdBy: requirement.createdBy,
      satisfied: isApcRequirementSatisfied(session, requirement, indexes),
    })),
    requirement => requirement.requirementId,
  );

  const pending = stableSorted(
    (session.pending ?? [])
      .filter(item => item?.status === 'OPEN')
      .map(item => ({
        pendingId: item.pendingId,
        kind: item.kind,
        status: item.status,
        critical: item.critical,
        originRequirementId: item.originRequirementId ?? null,
        scopeLevel: item.scopeLevel ?? null,
        scopeRef: item.scopeRef ?? null,
        sourceLevel: item.sourceLevel ?? null,
        sourceRef: item.sourceRef ?? null,
        characterId: item.characterId,
        representationTarget: item.representationTarget ?? null,
        targetState: item.targetState ?? null,
      })),
    item => item.pendingId,
  );

  const contradictions = stableSorted(
    (session.contradictions ?? [])
      .filter(item => item?.status === 'OPEN' && isContradictionRelevant(item, session) === true)
      .map(item => ({
        contradictionId: item.contradictionId,
        individualId: item.individualId,
        characterId: item.characterId,
        status: item.status,
      })),
    item => item.contradictionId,
  );

  return {
    objective: session.objective,
    evidence,
    requirements,
    pending,
    contradictions,
  };
}

export function validateApcSessionForExport(session, { areStatesIncompatible } = {}) {
  const errors = [];
  const reasons = [];

  const base = validateApcSession(session);
  if (!base.valid) errors.push(...base.errors.map(error => `snapshot: ${error}`));

  if (Object.prototype.hasOwnProperty.call(session ?? {}, 'pass')) errors.push('session.pass must not be persisted');
  if (Object.prototype.hasOwnProperty.call(session ?? {}, 'exportable')) errors.push('session.exportable must not be persisted');

  validateObjectiveAssessmentBinding(session, errors, reasons);

  if (base.valid) {
    errors.push(...requirementCoverageErrors(session, base.indexes));

    const contradictions = validateApcContradictions(session, { areStatesIncompatible });
    if (!contradictions.valid) errors.push(...contradictions.errors.map(error => `I9 snapshot: ${error}`));
  }

  const uniqueReasons = [];
  if (errors.length && !uniqueReasons.includes('NOT_EXPORTABLE')) uniqueReasons.push('NOT_EXPORTABLE');
  if (reasons.includes('ASSESSMENT_STALE')) uniqueReasons.push('ASSESSMENT_STALE');

  return {
    exportable: errors.length === 0,
    reasons: uniqueReasons,
    errors,
  };
}

export function assessApcSessionPass(session, options = {}) {
  const exportResult = validateApcSessionForExport(session, options);
  const reasonSet = new Set();

  if (!exportResult.exportable) reasonSet.add('NOT_EXPORTABLE');
  if (exportResult.reasons.includes('ASSESSMENT_STALE')) reasonSet.add('ASSESSMENT_STALE');
  if (session?.objectiveAssessment?.status !== 'SATISFIED') reasonSet.add('OBJECTIVE_NOT_SATISFIED');
  if ((session?.pending ?? []).some(item => item?.status === 'OPEN' && item?.critical === true)) {
    reasonSet.add('CRITICAL_PENDING_OPEN');
  }

  const reasons = APC_PASS_REASON_CODES.filter(code => reasonSet.has(code));
  return {
    pass: exportResult.exportable &&
      session?.objectiveAssessment?.status === 'SATISFIED' &&
      !(session?.pending ?? []).some(item => item?.status === 'OPEN' && item?.critical === true),
    reasons,
  };
}

export function buildApcSessionExport(session, options = {}) {
  const validation = validateApcSessionForExport(session, options);
  if (!validation.exportable) {
    return {
      exportable: false,
      filename: null,
      json: null,
      reasons: validation.reasons,
      errors: validation.errors,
    };
  }

  return {
    exportable: true,
    filename: `${session.sessionId}.apc.json`,
    json: JSON.stringify(session, null, 2),
    reasons: [],
    errors: [],
  };
}

export function validateApcSemanticTransition(
  previousSession,
  nextSession,
  { isContradictionRelevant = () => false } = {},
) {
  const errors = [];
  if (!previousSession || typeof previousSession !== 'object') {
    return { valid: false, errors: ['previousSession is required'], semanticChanged: null };
  }
  if (!nextSession || typeof nextSession !== 'object') {
    return { valid: false, errors: ['nextSession is required'], semanticChanged: null };
  }

  const previousBase = validateApcSession(previousSession);
  const nextBase = validateApcSession(nextSession);
  if (!previousBase.valid) errors.push(...previousBase.errors.map(error => `previous snapshot: ${error}`));
  if (!nextBase.valid) errors.push(...nextBase.errors.map(error => `next snapshot: ${error}`));

  if (previousSession.sessionId !== nextSession.sessionId) errors.push('semantic transition requires the same sessionId');

  if (!Number.isInteger(previousSession.semanticRevision) || previousSession.semanticRevision < 1) {
    errors.push('previous semanticRevision must be an integer >= 1');
  }
  if (!Number.isInteger(nextSession.semanticRevision) || nextSession.semanticRevision < 1) {
    errors.push('next semanticRevision must be an integer >= 1');
  }

  let semanticChanged = null;
  if (previousBase.valid && nextBase.valid) {
    const previousSubstrate = assessmentSubstrateSnapshot(previousSession, { isContradictionRelevant });
    const nextSubstrate = assessmentSubstrateSnapshot(nextSession, { isContradictionRelevant });
    semanticChanged = JSON.stringify(previousSubstrate) !== JSON.stringify(nextSubstrate);

    if (Number.isInteger(previousSession.semanticRevision) && Number.isInteger(nextSession.semanticRevision)) {
      const expectedRevision = semanticChanged
        ? previousSession.semanticRevision + 1
        : previousSession.semanticRevision;
      if (nextSession.semanticRevision !== expectedRevision) {
        errors.push(`semanticRevision must change ${previousSession.semanticRevision}→${expectedRevision}; found ${nextSession.semanticRevision}`);
      }
    }

    if (semanticChanged) {
      const assessment = nextSession.objectiveAssessment;
      if (assessment?.status !== 'OPEN' ||
          assessment?.assessedRevision != null ||
          assessment?.assessedBy != null ||
          assessment?.assessedAt != null) {
        errors.push('semantic mutation requires objectiveAssessment reset to OPEN with null assessedRevision/assessedBy/assessedAt');
      }
    }
  }

  validateObjectiveAssessmentBinding(nextSession, errors);

  return {
    valid: errors.length === 0,
    errors,
    semanticChanged,
  };
}

export function indexApcSession(session) {
  return {
    photosById: new Map((session.photos ?? []).map(x => [x.photoId, x])),
    photoEvidenceById: new Map((session.photoEvidence ?? []).map(x => [x.photoEvidenceId, x])),
    individualsById: new Map((session.individuals ?? []).map(x => [x.individualId, x])),
    evidenceByLogicalVersion: new Map((session.evidence ?? []).map(x => [`${x.evidenceId}::${x.revision}`, x])),
  };
}

export function validateApcSession(session) {
  const errors = [];
  if (!session || typeof session !== 'object') return { valid: false, errors: ['session object is required'], normalized: null, indexes: null };

  if (session.schemaVersion !== APC_SCHEMA_VERSION) errors.push(`schemaVersion must equal ${APC_SCHEMA_VERSION}`);
  if (!canonicalText(session.sessionId)) errors.push('sessionId must be a non-empty canonical string without surrounding whitespace');
  if (!APC_SESSION_STATUSES.includes(session.status)) errors.push(`status must be one of: ${APC_SESSION_STATUSES.join(', ')}`);
  if (!text(session.objective)) errors.push('objective is required');
  if (!text(session.createdAt)) errors.push('createdAt is required');
  if (!text(session.createdBy)) errors.push('createdBy is required');

  const oa = session.objectiveAssessment;
  if (!oa || typeof oa !== 'object') errors.push('objectiveAssessment is required');
  else {
    if (!OBJECTIVE_ASSESSMENT_STATUSES.includes(oa.status)) errors.push(`objectiveAssessment.status must be one of: ${OBJECTIVE_ASSESSMENT_STATUSES.join(', ')}`);
    if (oa.status !== 'OPEN') {
      if (!text(oa.assessedBy)) errors.push('objectiveAssessment.assessedBy is required when assessment is final');
      if (!text(oa.assessedAt)) errors.push('objectiveAssessment.assessedAt is required when assessment is final');
    }
  }

  for (const field of ['inboxPhotoRefs','photos','photoEvidence','individuals','evidence','requirements','pending','contradictions','revisions']) {
    if (!Array.isArray(session[field])) errors.push(`${field} must be an array`);
  }
  if (errors.length) return { valid: false, errors, normalized: null, indexes: null };

  const idSpecs = [
    ['photos', 'photoId'], ['photoEvidence', 'photoEvidenceId'], ['individuals', 'individualId'],
    ['requirements', 'requirementId'], ['pending', 'pendingId'], ['contradictions', 'contradictionId'], ['revisions', 'revisionEventId'],
  ];
  for (const [field,idField] of idSpecs) {
    const dup = duplicateIds(session[field], idField);
    if (dup.length) errors.push(`${field} contains duplicate ${idField}: ${dup.join(', ')}`);
  }

  const versionKeys = new Set();
  for (const ev of session.evidence) {
    const id = canonicalText(ev?.evidenceId);
    const rev = ev?.revision;
    if (id && Number.isInteger(rev)) {
      const key = `${id}::${rev}`;
      if (versionKeys.has(key)) errors.push(`duplicate evidence version: ${key}`);
      versionKeys.add(key);
    }
  }

  const evidenceGroups = validateEvidenceRevisionChains(session, errors);
  validateRevisionEvents(session, evidenceGroups, errors);

  for (const individual of session.individuals) {
    if (!text(individual?.individualId)) errors.push('individual.individualId is required');
  }

  const indexes = indexApcSession(session);

  validateRequirements(session, indexes, errors);
  validatePending(session, indexes, errors);
  validateContradictionStructure(session, indexes, errors);

  for (const ev of session.evidence) {
    const evidenceId = canonicalText(ev?.evidenceId) ?? '<missing>';
    const photoId = canonicalText(ev?.photoId);
    const individualId = canonicalText(ev?.individualId);
    const photoEvidenceRef = canonicalText(ev?.photoEvidenceRef);

    if (ev?.sessionId !== session.sessionId) errors.push(`evidence.sessionId must equal sessionId for ${evidenceId}`);

    if (!photoId) errors.push(`evidence.photoId is required for ${evidenceId}`);
    else if (!indexes.photosById.has(photoId)) errors.push(`Unknown evidence.photoId ${photoId} for ${evidenceId}`);

    if (!individualId) errors.push(`evidence.individualId is required for ${evidenceId}`);
    else if (!indexes.individualsById.has(individualId)) errors.push(`Unknown evidence.individualId ${individualId} for ${evidenceId}`);

    if (photoEvidenceRef && !indexes.photoEvidenceById.has(photoEvidenceRef)) {
      errors.push(`Unknown evidence.photoEvidenceRef ${photoEvidenceRef} for ${evidenceId}`);
    }

    if (photoId && individualId && indexes.photosById.has(photoId) && indexes.individualsById.has(individualId)) {
      const photo = indexes.photosById.get(photoId);
      const refs = Array.isArray(photo?.individualRefs) ? photo.individualRefs : [];
      if (!refs.includes(individualId)) errors.push(`${individualId} is not referenced by PHOTO ${photoId} for evidence ${evidenceId}`);
      if (photoEvidenceRef && photo.photoEvidenceId !== photoEvidenceRef) {
        errors.push(`evidence.photoEvidenceRef ${photoEvidenceRef} does not match PHOTO ${photoId} for ${evidenceId}`);
      }
    }
  }

  for (const photo of session.photos) {
    const photoId = text(photo?.photoId);
    if (!photoId) errors.push('photo.photoId is required');
    if (!text(photo?.fileRef)) errors.push(`photo.fileRef is required for ${photoId ?? '<missing>'}`);
    if (photo?.individualRefs != null && !Array.isArray(photo.individualRefs)) errors.push(`photo.individualRefs must be array for ${photoId}`);
    for (const ref of photo?.individualRefs ?? []) if (!indexes.individualsById.has(ref)) errors.push(`Unknown photo.individualRef ${ref} for ${photoId}`);
    if (photo?.photoEvidenceId != null && !indexes.photoEvidenceById.has(photo.photoEvidenceId)) {
      errors.push(`Unknown photoEvidenceId ${photo.photoEvidenceId} for ${photoId}`);
    } else if (photo?.photoEvidenceId != null && indexes.photoEvidenceById.has(photo.photoEvidenceId)) {
      const pe = indexes.photoEvidenceById.get(photo.photoEvidenceId);
      const pePhotoRef = text(pe?.sourcePhoto?.photoRef);
      if (pePhotoRef !== photoId) errors.push(`PHOTO ${photoId} references PhotoEvidence ${photo.photoEvidenceId} owned by PHOTO ${pePhotoRef ?? '<missing>'}`);
    }
  }

  for (const pe of session.photoEvidence) {
    const result = validatePhotoEvidence(pe);
    if (!result.valid) errors.push(...result.errors.map(e => `PhotoEvidence ${pe?.photoEvidenceId ?? '<missing>'}: ${e}`));
    const ref = text(pe?.sourcePhoto?.photoRef);
    if (ref && !indexes.photosById.has(ref)) errors.push(`PhotoEvidence ${pe?.photoEvidenceId ?? '<missing>'} references unknown PHOTO ${ref}`);
    if (ref && indexes.photosById.has(ref)) {
      const photo = indexes.photosById.get(ref);
      if (photo.photoEvidenceId !== pe.photoEvidenceId) errors.push(`PHOTO ${ref} does not reference PhotoEvidence ${pe.photoEvidenceId}`);
    }
  }

  for (const ref of session.inboxPhotoRefs) if (!indexes.photosById.has(ref)) errors.push(`Unknown inboxPhotoRef: ${ref}`);

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length ? null : session,
    indexes: errors.length ? null : indexes,
  };
}
