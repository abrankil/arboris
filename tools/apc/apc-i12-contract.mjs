import {
  assessApcSessionPass,
  buildApcSessionExport,
  validateApcControlPlane,
  validateApcContradictions,
  validateApcRequirementCharacters,
  validateApcRequirementCoverage,
  validateApcSession,
  validateApcSessionForExport,
} from './session-contract.mjs';
import {
  validateRegisteredApcConfirmedEvidence,
  validateRegisteredApcEvidencePayload,
} from './apc-to-character-observation.mjs';

function canonicalText(value) {
  if (typeof value !== 'string') return null;
  if (!value || value !== value.trim()) return null;
  return value;
}

export function normalizeFingerprintSha256(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

export function validateApcI12AssetAndCollectionInvariants(session) {
  const errors = [];
  if (!session || typeof session !== 'object') {
    return { valid: false, errors: ['session object is required'] };
  }

  const photos = Array.isArray(session.photos) ? session.photos : [];
  const photoEvidence = Array.isArray(session.photoEvidence) ? session.photoEvidence : [];
  const inboxPhotoRefs = Array.isArray(session.inboxPhotoRefs) ? session.inboxPhotoRefs : [];

  const inboxSeen = new Set();
  for (const ref of inboxPhotoRefs) {
    if (!canonicalText(ref)) {
      errors.push('inboxPhotoRefs entries must be canonical strings');
      continue;
    }
    if (inboxSeen.has(ref)) errors.push(`duplicate inboxPhotoRef: ${ref}`);
    inboxSeen.add(ref);
  }

  const peById = new Map(photoEvidence.map(item => [item?.photoEvidenceId, item]));
  const photosById = new Map(photos.map(item => [item?.photoId, item]));
  const linkedPhotoEvidence = new Map();

  for (const photo of photos) {
    const photoId = canonicalText(photo?.photoId) ?? '<missing>';
    if (!Array.isArray(photo?.individualRefs)) {
      errors.push(`PHOTO ${photoId} individualRefs must be an explicit array`);
    } else {
      const seen = new Set();
      for (const individualId of photo.individualRefs) {
        if (!canonicalText(individualId)) {
          errors.push(`PHOTO ${photoId} individualRefs entries must be canonical strings`);
          continue;
        }
        if (seen.has(individualId)) errors.push(`PHOTO ${photoId} contains duplicate individualRef ${individualId}`);
        seen.add(individualId);
      }
    }

    const photoEvidenceId = canonicalText(photo?.photoEvidenceId);
    if (!photoEvidenceId) {
      errors.push(`PHOTO ${photoId} photoEvidenceId is required`);
      continue;
    }
    const pe = peById.get(photoEvidenceId);
    if (!pe) {
      errors.push(`PHOTO ${photoId} photoEvidenceId ${photoEvidenceId} does not resolve`);
      continue;
    }
    linkedPhotoEvidence.set(photoEvidenceId, (linkedPhotoEvidence.get(photoEvidenceId) ?? 0) + 1);
    if (canonicalText(pe?.sourcePhoto?.photoRef) !== photoId) {
      errors.push(`PHOTO ${photoId} must own PhotoEvidence ${photoEvidenceId} with matching sourcePhoto.photoRef`);
    }
  }

  for (const pe of photoEvidence) {
    const peId = canonicalText(pe?.photoEvidenceId) ?? '<missing>';
    const photoRef = canonicalText(pe?.sourcePhoto?.photoRef);
    if (!photoRef || !photosById.has(photoRef)) {
      errors.push(`PhotoEvidence ${peId} must resolve exactly one PHOTO`);
      continue;
    }
    if (photosById.get(photoRef)?.photoEvidenceId !== peId) {
      errors.push(`PhotoEvidence ${peId} is not the PHOTO.photoEvidenceId of ${photoRef}`);
    }
    if ((linkedPhotoEvidence.get(peId) ?? 0) !== 1) {
      errors.push(`PhotoEvidence ${peId} must be linked from exactly one PHOTO`);
    }
  }

  const fingerprintOwner = new Map();
  for (const pe of photoEvidence) {
    const peId = canonicalText(pe?.photoEvidenceId) ?? '<missing>';
    const fingerprint = normalizeFingerprintSha256(pe?.sourcePhoto?.fingerprintSha256);
    if (!fingerprint) {
      errors.push(`PhotoEvidence ${peId} fingerprintSha256 must be a SHA-256 hex digest`);
      continue;
    }
    const prior = fingerprintOwner.get(fingerprint);
    if (prior && prior !== peId) {
      errors.push(`duplicate fingerprintSha256 across PhotoEvidence: ${prior}, ${peId}`);
    } else {
      fingerprintOwner.set(fingerprint, peId);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateApcWritableWorkingSnapshot(
  session,
  { dataset, areStatesIncompatible } = {},
) {
  const errors = [];
  const base = validateApcSession(session);
  if (!base.valid) errors.push(...base.errors.map(error => `snapshot: ${error}`));

  const control = validateApcControlPlane(session);
  if (!control.valid) errors.push(...control.errors.map(error => `I10 control: ${error}`));

  const requirementCharacters = validateApcRequirementCharacters(session, dataset);
  if (!requirementCharacters.valid) {
    errors.push(...requirementCharacters.errors.map(error => `I7 dataset: ${error}`));
  }

  if (base.valid) {
    for (const evidence of session.evidence ?? []) {
      const common = validateRegisteredApcEvidencePayload(
        dataset,
        session,
        evidence.evidenceId,
        evidence.revision,
        {
          requireCurrent: evidence.current === true,
          operationalDatasetCheck: evidence.current === true,
        },
      );
      if (!common.valid) {
        errors.push(...common.errors.map(error => `evidence ${evidence.evidenceId}::${evidence.revision}: ${error}`));
      }

      if (evidence.lifecycleStatus === 'CONFIRMED') {
        const confirmed = validateRegisteredApcConfirmedEvidence(
          dataset,
          session,
          evidence.evidenceId,
          evidence.revision,
          {
            requireCurrent: evidence.current === true,
            operationalDatasetCheck: evidence.current === true,
          },
        );
        if (!confirmed.valid) {
          errors.push(...confirmed.errors.map(error => `confirmed ${evidence.evidenceId}::${evidence.revision}: ${error}`));
        }
      }
    }

    const coverage = validateApcRequirementCoverage(session);
    if (!coverage.valid) errors.push(...coverage.errors.map(error => `coverage: ${error}`));

    if (typeof areStatesIncompatible !== 'function') {
      errors.push('areStatesIncompatible callback is required for writable working snapshot validation');
    } else {
      const contradictions = validateApcContradictions(session, { areStatesIncompatible });
      if (!contradictions.valid) {
        errors.push(...contradictions.errors.map(error => `I9 snapshot: ${error}`));
      }
    }
  }

  const assets = validateApcI12AssetAndCollectionInvariants(session);
  if (!assets.valid) {
    errors.push(...assets.errors.map(error => `I12 asset: ${error}`));
  }

  return { valid: errors.length === 0, errors };
}

export function deriveApcI12SessionDiagnostics(
  session,
  { dataset, areStatesIncompatible } = {},
) {
  const structural = validateApcSession(session);
  let serializableWorkingSnapshot = false;
  if (structural.valid) {
    try {
      serializableWorkingSnapshot = JSON.stringify(JSON.parse(JSON.stringify(session))) === JSON.stringify(session);
    } catch {
      serializableWorkingSnapshot = false;
    }
  }

  const writer = validateApcWritableWorkingSnapshot(session, { dataset, areStatesIncompatible });
  const exportResult = validateApcSessionForExport(session, { dataset, areStatesIncompatible });
  const passResult = assessApcSessionPass(session, { dataset, areStatesIncompatible });

  return {
    structurallyValid: structural.valid,
    serializableWorkingSnapshot,
    writerReady: writer.valid,
    exportable: exportResult.exportable,
    pass: passResult.pass,
    closed: session?.status === 'CLOSED',
    errors: {
      structural: structural.errors ?? [],
      writer: writer.errors ?? [],
      export: exportResult.errors ?? [],
    },
  };
}

export function buildApcI12Export(
  session,
  { dataset, areStatesIncompatible } = {},
) {
  const writer = validateApcWritableWorkingSnapshot(session, { dataset, areStatesIncompatible });
  if (!writer.valid) {
    return {
      exportable: false,
      filename: null,
      json: null,
      reasons: ['I12_NOT_WRITER_READY'],
      errors: writer.errors,
    };
  }
  return buildApcSessionExport(session, { dataset, areStatesIncompatible });
}

export function sameApcEvidenceNormativePayload(a, b) {
  if (!a || !b) return false;
  const strip = value => {
    const clone = structuredClone(value);
    delete clone.revision;
    delete clone.current;
    return clone;
  };
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}