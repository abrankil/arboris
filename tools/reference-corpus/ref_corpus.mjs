const REF_RE = /^REF-(\d{3,})$/;

export const SCHEMA_VERSION = "1.0.0";
export const CORPUS_ID = "ARBORIS_GRAPHIC_REFERENCES";

const SOURCE_PROVENANCE = new Set(["OFICIAL","ARTISTA","EDITORIAL","PROFESIONAL","PRENSA","GALERÍA","COMUNIDAD","OTRA"]);
const UNIT_TYPE = new Set(["INDIVIDUAL","COLECCIÓN","PUBLICACIÓN","DOCUMENTAL"]);
const DOCUMENTARY_RELATION = new Set(["FUENTE_PRIMARIA","REPRODUCCIÓN_AUTORIZADA","REPRODUCCIÓN","DERIVADO","POSIBLE_DUPLICADO","RELACIÓN_DESCONOCIDA"]);
const CONTENT_ACCESSIBILITY = new Set(["CONTENIDO_COMPLETO","CONTENIDO_PARCIAL","SOLO_DESCRIPCIÓN","NO_ACCESIBLE"]);
const REQUIRED_RECORD_FIELDS = [
  "refId","identityStatus","canonicalRefId","title","sourceUrl","previousUrls",
  "authorOrganization","sourceProvenance","contentOrigin","unitType","resourceNature",
  "documentaryRelation","contentAccessibility","provenanceNotes","preservedCopies",
  "registrationProvenance","registeredAt","updatedAt",
];

export class RefCorpusError extends Error {}

function refNumber(refId) {
  const match = REF_RE.exec(refId ?? "");
  if (!match) throw new RefCorpusError(`Invalid refId: ${refId}`);
  return Number(match[1]);
}

function indexById(corpus) {
  return new Map(corpus.references.map((record) => [record.refId, record]));
}

function requireOwn(record, key) {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    throw new RefCorpusError(`Missing required REF field: ${key}`);
  }
}

function requireString(value, field, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || value.trim() === "") {
    throw new RefCorpusError(`${field} must be a non-empty string`);
  }
}

function requireEnum(value, allowed, field) {
  if (!allowed.has(value)) throw new RefCorpusError(`Invalid ${field}: ${value}`);
}

function requireIso8601(value, field) {
  requireString(value, field);
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!iso.test(value) || Number.isNaN(Date.parse(value))) {
    throw new RefCorpusError(`${field} must be an ISO 8601 timestamp with timezone`);
  }
}

function validateRecordShape(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new RefCorpusError("REF record must be an object");
  }
  for (const key of REQUIRED_RECORD_FIELDS) requireOwn(record, key);

  requireString(record.title, "title");
  requireString(record.sourceUrl, "sourceUrl");
  requireEnum(record.sourceProvenance, SOURCE_PROVENANCE, "sourceProvenance");
  requireEnum(record.unitType, UNIT_TYPE, "unitType");
  requireEnum(record.documentaryRelation, DOCUMENTARY_RELATION, "documentaryRelation");
  requireEnum(record.contentAccessibility, CONTENT_ACCESSIBILITY, "contentAccessibility");
  if (!Array.isArray(record.resourceNature) || record.resourceNature.some((x) => typeof x !== "string" || x.trim() === "")) {
    throw new RefCorpusError("resourceNature must be an array of non-empty strings");
  }
  if (!Array.isArray(record.previousUrls)) throw new RefCorpusError("previousUrls must be an array");
  for (const entry of record.previousUrls) {
    requireString(entry?.url, "previousUrls.url");
    requireIso8601(entry?.replacedAt, "previousUrls.replacedAt");
    if (entry?.reason !== null && entry?.reason !== undefined) requireString(entry.reason, "previousUrls.reason");
  }
  if (!Array.isArray(record.preservedCopies)) throw new RefCorpusError("preservedCopies must be an array");
  requireIso8601(record.registeredAt, "registeredAt");
  requireIso8601(record.updatedAt, "updatedAt");
}

function commitCorpus(target, candidate) {
  target.nextRefNumber = candidate.nextRefNumber;
  target.references = candidate.references;
}

export function validateRefCorpus(corpus) {
  if (corpus?.schemaVersion !== SCHEMA_VERSION) throw new RefCorpusError("Unsupported schemaVersion");
  if (corpus?.corpusId !== CORPUS_ID) throw new RefCorpusError("Unexpected corpusId");
  if (!Array.isArray(corpus.references)) throw new RefCorpusError("references must be an array");

  for (const record of corpus.references) validateRecordShape(record);

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
    requireString(provenance.collectionProtocol, "registrationProvenance.collectionProtocol");
    requireString(provenance.collectionSubject, "registrationProvenance.collectionSubject");
    if (artifact === null && recordNumber !== null) {
      throw new RefCorpusError("sourceRecordNumber requires exact sourceArtifact");
    }
    if (artifact !== null) {
      if (!artifact.artifactId || !artifact.sha256) throw new RefCorpusError("sourceArtifact requires artifactId and sha256");
      if (!Number.isInteger(recordNumber) || recordNumber < 1) throw new RefCorpusError("sourceRecordNumber required with sourceArtifact");
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
  const canonical = historical.identityStatus === "active" ? historical : index.get(historical.canonicalRefId);
  return { historical, canonical };
}

export function incorporateReviewed(corpus, { identityDecision, existingRefId = null, record = null }) {
  validateRefCorpus(corpus);
  if (identityDecision === "existing") {
    if (!existingRefId) throw new RefCorpusError("existing identity requires existingRefId");
    return resolveRef(corpus, existingRefId).canonical.refId;
  }
  if (identityDecision === "uncertain") throw new RefCorpusError("Documentary identity uncertain; review required before incorporation");
  if (identityDecision !== "new") throw new RefCorpusError("identityDecision must be existing, new, or uncertain");
  if (existingRefId !== null) throw new RefCorpusError("new identity must not provide existingRefId");
  if (!record) throw new RefCorpusError("new identity requires record");

  const candidate = structuredClone(corpus);
  const refId = allocateRefId(candidate);
  candidate.references.push({
    ...structuredClone(record), refId, identityStatus:"active", canonicalRefId:null,
    previousUrls:record.previousUrls ?? [], preservedCopies:record.preservedCopies ?? [],
  });
  candidate.nextRefNumber += 1;
  validateRefCorpus(candidate);
  commitCorpus(corpus, candidate);
  return refId;
}

export function changeSourceUrl(corpus, refId, newUrl, { previousWasValid = true, reason = null, changedAt } = {}) {
  validateRefCorpus(corpus);
  const candidate = structuredClone(corpus);
  const record = resolveRef(candidate, refId).historical;
  if (record.identityStatus !== "active") throw new RefCorpusError("Edit canonical active REF instead of duplicate");
  if (record.sourceUrl === newUrl) return;
  requireString(newUrl, "newUrl");
  if (previousWasValid) record.previousUrls.push({ url:record.sourceUrl, replacedAt:changedAt, reason });
  record.sourceUrl = newUrl;
  if (changedAt) record.updatedAt = changedAt;
  validateRefCorpus(candidate);
  commitCorpus(corpus, candidate);
}

export function markDuplicate(corpus, duplicateRefId, canonicalRefId, changedAt = null) {
  validateRefCorpus(corpus);
  const candidate = structuredClone(corpus);
  const index = indexById(candidate);
  const duplicate = index.get(duplicateRefId);
  const canonical = index.get(canonicalRefId);
  if (!duplicate || !canonical) throw new RefCorpusError("Both REFs must exist");
  if (duplicateRefId === canonicalRefId) throw new RefCorpusError("Self duplicate forbidden");
  if (canonical.identityStatus !== "active") throw new RefCorpusError("Canonical target must be active");
  duplicate.identityStatus = "duplicate";
  duplicate.canonicalRefId = canonicalRefId;
  if (changedAt) duplicate.updatedAt = changedAt;
  validateRefCorpus(candidate);
  commitCorpus(corpus, candidate);
}

export function addPreservedCopy(corpus, refId, preservedCopy, changedAt = null) {
  validateRefCorpus(corpus);
  const candidate = structuredClone(corpus);
  const record = resolveRef(candidate, refId).historical;
  record.preservedCopies.push(structuredClone(preservedCopy));
  if (changedAt) record.updatedAt = changedAt;
  validateRefCorpus(candidate);
  commitCorpus(corpus, candidate);
}
