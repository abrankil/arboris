import { validatePhotoEvidence } from '../character-observers/common-evidence-contract.mjs';

export const APC_SCHEMA_VERSION = 'apc-session-0.2';
export const APC_SESSION_STATUSES = Object.freeze(['OPEN', 'CLOSED']);
export const OBJECTIVE_ASSESSMENT_STATUSES = Object.freeze(['OPEN', 'SATISFIED', 'NOT_SATISFIED']);

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
