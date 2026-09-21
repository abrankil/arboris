import { validatePhotoEvidence } from '../character-observers/common-evidence-contract.mjs';

export const APC_SCHEMA_VERSION = 'apc-session-0.2';
export const APC_SESSION_STATUSES = Object.freeze(['OPEN', 'CLOSED']);
export const OBJECTIVE_ASSESSMENT_STATUSES = Object.freeze(['OPEN', 'SATISFIED', 'NOT_SATISFIED']);

function text(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
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
  if (!text(session.sessionId)) errors.push('sessionId is required');
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
    const id = text(ev?.evidenceId);
    const rev = ev?.revision;
    if (!id) errors.push('evidence.evidenceId is required');
    if (!Number.isInteger(rev) || rev < 1) errors.push(`evidence revision must be integer >= 1 for ${id ?? '<missing>'}`);
    if (id && Number.isInteger(rev)) {
      const key = `${id}::${rev}`;
      if (versionKeys.has(key)) errors.push(`duplicate evidence version: ${key}`);
      versionKeys.add(key);
    }
  }

  for (const individual of session.individuals) {
    if (!text(individual?.individualId)) errors.push('individual.individualId is required');
  }

  const indexes = indexApcSession(session);

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
