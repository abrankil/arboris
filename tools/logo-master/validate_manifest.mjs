import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

export class ManifestValidationError extends Error {}

const STATUSES = [
  "draft",
  "technical-review",
  "technical-validated",
  "art-approved",
  "rejected",
  "superseded",
];

const LAYER_IDS = ["fondo", "wordmark", "hoja", "nervaduras", "tilde", "lema", "destello"];

const CANDIDATE_ID_RE = /^candidate-[0-9]{3}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;

function fail(message) {
  throw new ManifestValidationError(message);
}

function requireOwn(obj, key, context) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    fail(`${context}: falta el campo requerido "${key}"`);
  }
}

function requireType(value, type, field) {
  const actual = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  const allowed = Array.isArray(type) ? type : [type];
  if (!allowed.includes(actual)) {
    fail(`${field}: se esperaba ${allowed.join(" | ")}, se obtuvo ${actual}`);
  }
}

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${field}: debe ser un string no vacío`);
  }
}

function requireNoExtraProperties(obj, allowedKeys, context) {
  for (const key of Object.keys(obj)) {
    if (!allowedKeys.includes(key)) {
      fail(`${context}: propiedad no declarada "${key}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Validación estructural del manifiesto (tools/logo-master/manifest.schema.json)
// ---------------------------------------------------------------------------

function validateReference(manifest) {
  const ref = manifest.reference;
  requireType(ref, "object", "reference");
  requireOwn(ref, "path", "reference");
  requireOwn(ref, "sha256Expected", "reference");
  requireNoExtraProperties(ref, ["path", "sha256Expected"], "reference");
  requireNonEmptyString(ref.path, "reference.path");
  if (typeof ref.sha256Expected !== "string" || !SHA256_RE.test(ref.sha256Expected)) {
    fail("reference.sha256Expected: debe ser un hash SHA-256 hexadecimal en minúsculas");
  }
}

function validateSourcePxo(manifest) {
  const src = manifest.sourcePxo;
  requireType(src, "object", "sourcePxo");
  requireOwn(src, "path", "sourcePxo");
  requireOwn(src, "producedIn", "sourcePxo");
  requireOwn(src, "layerCountDeclared", "sourcePxo");
  requireOwn(src, "verifiedAt", "sourcePxo");
  requireNoExtraProperties(src, ["path", "producedIn", "layerCountDeclared", "verifiedAt"], "sourcePxo");
  requireNonEmptyString(src.path, "sourcePxo.path");
  if (src.producedIn !== "Pixelorama") {
    fail('sourcePxo.producedIn: debe ser exactamente "Pixelorama" (esta herramienta no genera ni sustituye el .pxo)');
  }
  if (src.layerCountDeclared !== 7) {
    fail("sourcePxo.layerCountDeclared: debe ser 7");
  }
  requireType(src.verifiedAt, ["string", "null"], "sourcePxo.verifiedAt");
}

function validateLayers(manifest) {
  const layers = manifest.layers;
  if (!Array.isArray(layers) || layers.length !== 7) {
    fail("layers: debe ser un array de exactamente 7 entradas");
  }
  const seenIds = new Set();
  const seenOrders = new Set();
  for (const layer of layers) {
    requireType(layer, "object", "layers[]");
    const allowedKeys = ["id", "order", "layerConvention", "path", "visible", "locked", "gridCompliant"];
    for (const key of allowedKeys) requireOwn(layer, key, "layers[]");
    requireNoExtraProperties(layer, allowedKeys, "layers[]");

    if (!LAYER_IDS.includes(layer.id)) {
      fail(`layers[].id: "${layer.id}" no pertenece al conjunto cerrado ${JSON.stringify(LAYER_IDS)}`);
    }
    if (seenIds.has(layer.id)) fail(`layers[]: id duplicado "${layer.id}"`);
    seenIds.add(layer.id);

    if (!Number.isInteger(layer.order) || layer.order < 1 || layer.order > 7) {
      fail(`layers[].order: "${layer.order}" debe ser un entero entre 1 y 7`);
    }
    if (seenOrders.has(layer.order)) fail(`layers[]: order duplicado "${layer.order}"`);
    seenOrders.add(layer.order);

    if (layer.layerConvention !== "PROPOSED") {
      fail(
        `layers[].layerConvention: debe ser exactamente "PROPOSED" (convención de dirección de arte de esta candidata, no regla histórica); se obtuvo "${layer.layerConvention}"`
      );
    }

    requireType(layer.path, ["string", "null"], "layers[].path");
    requireType(layer.visible, "boolean", "layers[].visible");
    requireType(layer.locked, "boolean", "layers[].locked");
    requireType(layer.gridCompliant, ["boolean", "null"], "layers[].gridCompliant");
  }
  if (seenIds.size !== 7 || seenOrders.size !== 7) {
    fail("layers: las 7 capas deben cubrir el conjunto completo de ids y de order 1-7 sin huecos");
  }
}

function validateExportEntry(entry, field, kind) {
  requireType(entry, ["object", "null"], field);
  if (entry === null) return;
  if (kind === "native") {
    const allowed = ["path", "format", "colorMode"];
    for (const key of allowed) requireOwn(entry, key, field);
    requireNoExtraProperties(entry, allowed, field);
    requireNonEmptyString(entry.path, `${field}.path`);
    if (entry.format !== "png") fail(`${field}.format: debe ser "png"`);
    if (entry.colorMode !== "RGBA") fail(`${field}.colorMode: debe ser "RGBA"`);
  } else {
    const allowed = ["path", "format", "scale", "resampling"];
    for (const key of allowed) requireOwn(entry, key, field);
    requireNoExtraProperties(entry, allowed, field);
    requireNonEmptyString(entry.path, `${field}.path`);
    if (entry.format !== "png") fail(`${field}.format: debe ser "png"`);
    if (!Number.isInteger(entry.scale) || entry.scale < 1) {
      fail(`${field}.scale: debe ser un entero múltiplo entero >= 1`);
    }
    if (entry.resampling !== "nearest-neighbor") {
      fail(`${field}.resampling: debe ser exactamente "nearest-neighbor" (prohibida interpolación suavizada)`);
    }
  }
}

function validateExports(manifest) {
  const exp = manifest.exports;
  requireType(exp, "object", "exports");
  requireOwn(exp, "compositeNative", "exports");
  requireOwn(exp, "compositePresentation", "exports");
  requireNoExtraProperties(exp, ["compositeNative", "compositePresentation"], "exports");
  validateExportEntry(exp.compositeNative, "exports.compositeNative", "native");
  validateExportEntry(exp.compositePresentation, "exports.compositePresentation", "presentation");
}

function validateApproval(manifest) {
  const approval = manifest.approval;
  requireType(approval, "object", "approval");
  requireOwn(approval, "artisticApprovalBy", "approval");
  requireOwn(approval, "artisticApprovalStatus", "approval");
  requireNoExtraProperties(approval, ["artisticApprovalBy", "artisticApprovalStatus"], "approval");
  requireType(approval.artisticApprovalBy, ["string", "null"], "approval.artisticApprovalBy");
  requireNonEmptyString(approval.artisticApprovalStatus, "approval.artisticApprovalStatus");
}

function validateDecision(manifest) {
  if (!Object.prototype.hasOwnProperty.call(manifest, "decision")) return;
  const decision = manifest.decision;
  requireType(decision, "object", "decision");
  requireOwn(decision, "reason", "decision");
  requireNoExtraProperties(decision, ["reason", "notes"], "decision");
  requireNonEmptyString(decision.reason, "decision.reason");
  if (Object.prototype.hasOwnProperty.call(decision, "notes")) {
    requireType(decision.notes, "string", "decision.notes");
  }
}

const MANIFEST_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "candidateId",
  "status",
  "reference",
  "sourcePxo",
  "layers",
  "exports",
  "approval",
  "decision",
  "supersededBy",
  "createdAt",
  "updatedAt",
  "notes",
];

export function validateManifestStructure(manifest) {
  requireType(manifest, "object", "manifest");
  requireNoExtraProperties(manifest, MANIFEST_TOP_LEVEL_KEYS, "manifest");

  for (const key of [
    "schemaVersion",
    "candidateId",
    "status",
    "reference",
    "sourcePxo",
    "layers",
    "exports",
    "approval",
    "createdAt",
    "updatedAt",
  ]) {
    requireOwn(manifest, key, "manifest");
  }

  requireNonEmptyString(manifest.schemaVersion, "schemaVersion");

  if (!CANDIDATE_ID_RE.test(manifest.candidateId)) {
    fail(`candidateId: "${manifest.candidateId}" debe respetar el patrón candidate-NNN`);
  }

  if (!STATUSES.includes(manifest.status)) {
    fail(`status: "${manifest.status}" no pertenece al enum ${JSON.stringify(STATUSES)}`);
  }

  validateReference(manifest);
  validateSourcePxo(manifest);
  validateLayers(manifest);
  validateExports(manifest);
  validateApproval(manifest);
  validateDecision(manifest);

  if (Object.prototype.hasOwnProperty.call(manifest, "supersededBy")) {
    if (!CANDIDATE_ID_RE.test(manifest.supersededBy)) {
      fail(`supersededBy: "${manifest.supersededBy}" debe respetar el patrón candidate-NNN`);
    }
  }

  requireNonEmptyString(manifest.createdAt, "createdAt");
  requireNonEmptyString(manifest.updatedAt, "updatedAt");

  if (Object.prototype.hasOwnProperty.call(manifest, "notes")) {
    requireType(manifest.notes, "string", "notes");
  }
}

// ---------------------------------------------------------------------------
// Validación estructural del registro central
// ---------------------------------------------------------------------------

export function validateRegistryStructure(registry) {
  requireType(registry, "object", "registry");
  requireOwn(registry, "schemaVersion", "registry");
  requireOwn(registry, "candidates", "registry");
  requireNoExtraProperties(registry, ["schemaVersion", "candidates"], "registry");
  requireNonEmptyString(registry.schemaVersion, "registry.schemaVersion");

  if (!Array.isArray(registry.candidates)) fail("registry.candidates: debe ser un array");

  const seenIds = new Set();
  for (const entry of registry.candidates) {
    requireType(entry, "object", "registry.candidates[]");
    const allowed = ["candidateId", "manifestPath", "status", "createdAt"];
    for (const key of allowed) requireOwn(entry, key, "registry.candidates[]");
    requireNoExtraProperties(entry, allowed, "registry.candidates[]");

    if (!CANDIDATE_ID_RE.test(entry.candidateId)) {
      fail(`registry.candidates[].candidateId: "${entry.candidateId}" debe respetar el patrón candidate-NNN`);
    }
    if (seenIds.has(entry.candidateId)) {
      fail(`registry.candidates[]: candidateId duplicado "${entry.candidateId}"`);
    }
    seenIds.add(entry.candidateId);

    requireNonEmptyString(entry.manifestPath, "registry.candidates[].manifestPath");
    if (!STATUSES.includes(entry.status)) {
      fail(`registry.candidates[].status: "${entry.status}" no pertenece al enum ${JSON.stringify(STATUSES)}`);
    }
    requireNonEmptyString(entry.createdAt, "registry.candidates[].createdAt");
  }
}

// ---------------------------------------------------------------------------
// Reglas de negocio: precondiciones por status y consistencia manifiesto <-> registro
// ---------------------------------------------------------------------------

function layersComplete(manifest) {
  return manifest.layers.every((layer) => typeof layer.path === "string" && layer.path.trim() !== "");
}

function layersGridValidated(manifest) {
  return manifest.layers.every((layer) => layer.gridCompliant === true);
}

function exportsComplete(manifest) {
  return manifest.exports.compositeNative !== null && manifest.exports.compositePresentation !== null;
}

function isArtisticallyApproved(manifest) {
  return (
    typeof manifest.approval.artisticApprovalBy === "string" &&
    manifest.approval.artisticApprovalBy.trim() !== "" &&
    manifest.approval.artisticApprovalStatus !== "OPEN"
  );
}

export function validateStatusPreconditions(manifest) {
  const status = manifest.status;

  if (status === "technical-review" || status === "technical-validated" || status === "art-approved" || status === "superseded") {
    if (!layersComplete(manifest)) {
      fail(`status "${status}": requiere que las 7 capas tengan layers[].path asignado`);
    }
  }

  if (status === "technical-validated" || status === "art-approved" || status === "superseded") {
    if (!exportsComplete(manifest)) {
      fail(`status "${status}": requiere exports.compositeNative y exports.compositePresentation presentes`);
    }
    if (!layersGridValidated(manifest)) {
      fail(`status "${status}": requiere que las 7 capas tengan gridCompliant = true`);
    }
    if (!manifest.sourcePxo.verifiedAt) {
      fail(`status "${status}": requiere sourcePxo.verifiedAt (el .pxo debe haberse verificado antes de validar técnicamente)`);
    }
  }

  if (status === "art-approved" || status === "superseded") {
    if (!isArtisticallyApproved(manifest)) {
      fail(
        `status "${status}": requiere approval.artisticApprovalBy no nulo y approval.artisticApprovalStatus distinto de "OPEN" (technical-validated nunca implica aprobación artística)`
      );
    }
  }

  if (status === "rejected") {
    if (!Object.prototype.hasOwnProperty.call(manifest, "decision")) {
      fail('status "rejected": requiere el objeto "decision" con "reason" obligatorio');
    }
  } else if (Object.prototype.hasOwnProperty.call(manifest, "decision")) {
    fail(`status "${status}": el objeto "decision" solo es válido cuando status = "rejected"`);
  }

  if (status === "superseded") {
    if (!Object.prototype.hasOwnProperty.call(manifest, "supersededBy")) {
      fail('status "superseded": requiere el campo "supersededBy" con el candidateId de la sucesora');
    }
  } else if (Object.prototype.hasOwnProperty.call(manifest, "supersededBy")) {
    fail(`status "${status}": el campo "supersededBy" solo es válido cuando status = "superseded"`);
  }
}

export function validateCrossManifestRegistry(manifest, registry) {
  const entry = registry.candidates.find((c) => c.candidateId === manifest.candidateId);
  if (!entry) {
    fail(`registry: no existe una entrada para candidateId "${manifest.candidateId}"`);
  }

  if (entry.status === "rejected" && manifest.status !== "rejected") {
    fail(
      `candidateId "${manifest.candidateId}": el registro ya la marca "rejected" (estado terminal); no puede reabrirse a "${manifest.status}"`
    );
  }

  if (entry.status !== manifest.status) {
    fail(
      `candidateId "${manifest.candidateId}": status del registro ("${entry.status}") no coincide con status del manifiesto ("${manifest.status}")`
    );
  }

  if (Object.prototype.hasOwnProperty.call(manifest, "supersededBy")) {
    const target = registry.candidates.find((c) => c.candidateId === manifest.supersededBy);
    if (!target) {
      fail(`supersededBy "${manifest.supersededBy}": no existe en candidates-registry.json`);
    }
    if (manifest.supersededBy === manifest.candidateId) {
      fail("supersededBy: una candidata no puede sustituirse a sí misma");
    }
  }
}

// ---------------------------------------------------------------------------
// Verificación opcional de la referencia canónica en disco
// ---------------------------------------------------------------------------

export function verifyReferenceOnDisk(manifest, { repoRoot = REPO_ROOT } = {}) {
  const refPath = path.resolve(repoRoot, manifest.reference.path);
  if (!fs.existsSync(refPath)) {
    fail(`reference.path: no existe en disco (${manifest.reference.path})`);
  }
  const actual = crypto.createHash("sha256").update(fs.readFileSync(refPath)).digest("hex");
  if (actual !== manifest.reference.sha256Expected) {
    fail(
      `reference: SHA-256 en disco (${actual}) no coincide con sha256Expected (${manifest.reference.sha256Expected}) — deriva no declarada de la referencia canónica`
    );
  }
}

// ---------------------------------------------------------------------------
// Entrada de validación combinada
// ---------------------------------------------------------------------------

export function validateAll(manifest, registry, { repoRoot = REPO_ROOT, checkReferenceOnDisk = true } = {}) {
  validateManifestStructure(manifest);
  validateRegistryStructure(registry);
  validateStatusPreconditions(manifest);
  validateCrossManifestRegistry(manifest, registry);
  if (checkReferenceOnDisk) verifyReferenceOnDisk(manifest, { repoRoot });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function isMainModule() {
  return path.resolve(process.argv[1] ?? "") === path.resolve(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  const manifestPath = process.argv[2] ?? path.join(__dirname, "manifest.json");
  const registryPath = process.argv[3] ?? path.join(__dirname, "candidates-registry.json");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

  validateAll(manifest, registry);
  console.log(
    `Logo master manifest valid: candidateId=${manifest.candidateId}, status=${manifest.status}, layers=${manifest.layers.length}`
  );
}
