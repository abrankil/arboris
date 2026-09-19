const REF_RE = /^REF-(\d{3,})$/;

export const SCHEMA_VERSION = "1.0.0";
export const CORPUS_ID = "ARBORIS_GRAPHIC_REFERENCES";

export class RefCorpusError extends Error {}

function refNumber(refId) {
  const match = REF_RE.exec(refId ?? "");
  if (!match) throw new RefCorpusError(`Invalid refId: ${refId}`);
  return Number(match[1]);
}

function indexById(corpus) {
  return new Map(corpus.references.map((record) => [record.refId, record]));
}

export function validateRefCorpus(corpus) {
  if (corpus?.schemaVersion !== SCHEMA_VERSION) throw new RefCorpusError("Unsupported schemaVersion");
  if (corpus?.corpusId !== CORPUS_ID) throw new RefCorpusError("Unexpected corpusId");
  if (!Array.isArray(corpus.references)) throw new RefCorpusError("references must be an array");

  const ids = corpus.references.map((record) => record.refId);
  if (new Set(ids).size !== ids.length) throw new RefCorpusError("Duplicate refId");

  const index = indexById(corpus);
  const maxRef = ids.reduce((max, id) => Math.max(max, refNumber(id)), 0);
  if (!Number.isInteger(corpus.nextRefNumber) || corpus.nextRefNumber <= maxRef) {
    throw new RefCorpusError("nextRefNumber must be greater than every existing REF number");
  }

  for (const record of corpus.references) {
    if (record.identityStatus === "active") {
      if (record.canonicalRefId !== null) throw new RefCorpusError("active REF must have canonicalRefId=null");
    } else if (record.identityStatus === "duplicate") {
      if (record.canonicalRefId === record.refId) throw new RefCorpusError("REF cannot duplicate itself");
      const target = index.get(record.canonicalRefId);
      if (!target) throw new RefCorpusError("duplicate canonicalRefId must resolve");
      if (target.identityStatus !== "active") throw new RefCorpusError("duplicate must point directly to active REF");
    } else {
      throw new RefCorpusError("identityStatus must be active or duplicate");
    }

    const provenance = record.registrationProvenance ?? {};
    const artifact = provenance.sourceArtifact ?? null;
    const recordNumber = provenance.sourceRecordNumber ?? null;
    if (artifact === null && recordNumber !== null) {
      throw new RefCorpusError("sourceRecordNumber requires exact sourceArtifact");
    }
    if (artifact !== null) {
      if (!artifact.artifactId || !artifact.sha256) {
        throw new RefCorpusError("sourceArtifact requires artifactId and sha256");
      }
      if (!Number.isInteger(recordNumber) || recordNumber < 1) {
        throw new RefCorpusError("sourceRecordNumber required with sourceArtifact");
      }
    }
  }
  return true;
}

export function allocateRefId(corpus) {
  validateRefCorpus(corpus);
  const refId = `REF-${String(corpus.nextRefNumber).padStart(3, "0")}`;
  if (indexById(corpus).has(refId)) throw new RefCorpusError("REF number already used");
  return refId;
}

export function resolveRef(corpus, refId) {
  validateRefCorpus(corpus);
  const index = indexById(corpus);
  const historical = index.get(refId);
  if (!historical) throw new RefCorpusError("Unknown REF");
  const canonical = historical.identityStatus === "active"
    ? historical
    : index.get(historical.canonicalRefId);
  return { historical, canonical };
}

export function incorporateReviewed(corpus, { identityDecision, existingRefId = null, record = null }) {
  validateRefCorpus(corpus);
  if (identityDecision === "existing") {
    if (!existingRefId) throw new RefCorpusError("existing identity requires existingRefId");
    return resolveRef(corpus, existingRefId).canonical.refId;
  }
  if (identityDecision === "uncertain") {
    throw new RefCorpusError("Documentary identity uncertain; review required before incorporation");
  }
  if (identityDecision !== "new") {
    throw new RefCorpusError("identityDecision must be existing, new, or uncertain");
  }
  if (existingRefId !== null) throw new RefCorpusError("new identity must not provide existingRefId");
  if (!record) throw new RefCorpusError("new identity requires record");

  const refId = allocateRefId(corpus);
  corpus.references.push({
    ...record,
    refId,
    identityStatus: "active",
    canonicalRefId: null,
    previousUrls: record.previousUrls ?? [],
    preservedCopies: record.preservedCopies ?? [],
  });
  corpus.nextRefNumber += 1;
  validateRefCorpus(corpus);
  return refId;
}

export function changeSourceUrl(corpus, refId, newUrl, {
  previousWasValid = true,
  reason = null,
  changedAt,
} = {}) {
  const record = resolveRef(corpus, refId).historical;
  if (record.identityStatus !== "active") throw new RefCorpusError("Edit canonical active REF instead of duplicate");
  if (record.sourceUrl === newUrl) return;
  if (previousWasValid) {
    record.previousUrls.push({ url: record.sourceUrl, replacedAt: changedAt, reason });
  }
  record.sourceUrl = newUrl;
  if (changedAt) record.updatedAt = changedAt;
  validateRefCorpus(corpus);
}

export function markDuplicate(corpus, duplicateRefId, canonicalRefId, changedAt = null) {
  const index = indexById(corpus);
  const duplicate = index.get(duplicateRefId);
  const canonical = index.get(canonicalRefId);
  if (!duplicate || !canonical) throw new RefCorpusError("Both REFs must exist");
  if (duplicateRefId === canonicalRefId) throw new RefCorpusError("Self duplicate forbidden");
  if (canonical.identityStatus !== "active") throw new RefCorpusError("Canonical target must be active");
  duplicate.identityStatus = "duplicate";
  duplicate.canonicalRefId = canonicalRefId;
  if (changedAt) duplicate.updatedAt = changedAt;
  validateRefCorpus(corpus);
}

export function addPreservedCopy(corpus, refId, preservedCopy, changedAt = null) {
  const record = resolveRef(corpus, refId).historical;
  record.preservedCopies.push({ ...preservedCopy });
  if (changedAt) record.updatedAt = changedAt;
  validateRefCorpus(corpus);
}
