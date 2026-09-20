import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ManifestValidationError,
  validateManifestStructure,
  validateRegistryStructure,
  validateStatusPreconditions,
  validateCrossManifestRegistry,
  validateAll,
} from "./validate_manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const VALID_SHA256 = "20957aeaf262defad7cd13e6274dcfd0cb6410c213f5dbbc05ffe7a420e761c8";

function baseLayer(id, order, overrides = {}) {
  return {
    id,
    order,
    layerConvention: "PROPOSED",
    path: null,
    visible: true,
    locked: false,
    gridCompliant: null,
    ...overrides,
  };
}

function draftManifest(overrides = {}) {
  return {
    schemaVersion: "1.0.0",
    candidateId: "candidate-001",
    status: "draft",
    reference: {
      path: "assets/brand/canonical/arboris-logo-canonical-reference.jpg",
      sha256Expected: VALID_SHA256,
    },
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: null,
    },
    layers: [
      baseLayer("fondo", 1),
      baseLayer("wordmark", 2),
      baseLayer("hoja", 3),
      baseLayer("nervaduras", 4),
      baseLayer("tilde", 5),
      baseLayer("lema", 6),
      baseLayer("destello", 7),
    ],
    exports: { compositeNative: null, compositePresentation: null },
    approval: { artisticApprovalBy: null, artisticApprovalStatus: "OPEN" },
    createdAt: "2026-09-20",
    updatedAt: "2026-09-20",
    ...overrides,
  };
}

function registryWith(entries) {
  return { schemaVersion: "1.0.0", candidates: entries };
}

function registryEntry(overrides = {}) {
  return {
    candidateId: "candidate-001",
    manifestPath: "tools/logo-master/manifest.json",
    status: "draft",
    createdAt: "2026-09-20",
    ...overrides,
  };
}

function completeLayers(overrides = {}) {
  return [
    baseLayer("fondo", 1, { path: "layers/01-fondo.png", gridCompliant: true, ...overrides.fondo }),
    baseLayer("wordmark", 2, { path: "layers/02-wordmark.png", gridCompliant: true, ...overrides.wordmark }),
    baseLayer("hoja", 3, { path: "layers/03-hoja.png", gridCompliant: true, ...overrides.hoja }),
    baseLayer("nervaduras", 4, { path: "layers/04-nervaduras.png", gridCompliant: true, ...overrides.nervaduras }),
    baseLayer("tilde", 5, { path: "layers/05-tilde.png", gridCompliant: true, ...overrides.tilde }),
    baseLayer("lema", 6, { path: "layers/06-lema.png", gridCompliant: true, ...overrides.lema }),
    baseLayer("destello", 7, { path: "layers/07-destello.png", gridCompliant: true, ...overrides.destello }),
  ];
}

const COMPLETE_EXPORTS = {
  compositeNative: { path: "exports/composite-native.png", format: "png", colorMode: "RGBA" },
  compositePresentation: { path: "exports/composite-presentation.png", format: "png", scale: 4, resampling: "nearest-neighbor" },
};

// ---------------------------------------------------------------------------
// Estructura del manifiesto
// ---------------------------------------------------------------------------

test("draft manifest mínimo válido pasa la validación estructural", () => {
  assert.doesNotThrow(() => validateManifestStructure(draftManifest()));
});

test("rechaza propiedades no declaradas en el manifiesto", () => {
  const manifest = draftManifest({ unexpectedField: "no debería estar acá" });
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("rechaza candidateId que no respeta el patrón candidate-NNN", () => {
  const manifest = draftManifest({ candidateId: "candidate-1" });
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("rechaza status fuera del enum permitido", () => {
  const manifest = draftManifest({ status: "in-progress" });
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("rechaza sourcePxo.producedIn distinto de Pixelorama (la herramienta no genera el .pxo)", () => {
  const manifest = draftManifest();
  manifest.sourcePxo.producedIn = "logo-master-tool";
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("rechaza un número de capas distinto de 7", () => {
  const manifest = draftManifest();
  manifest.layers = manifest.layers.slice(0, 6);
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("rechaza layerConvention distinto de PROPOSED", () => {
  const manifest = draftManifest();
  manifest.layers[0].layerConvention = "CANON";
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("mantiene las siete capas como PROPOSED en un manifiesto válido", () => {
  const manifest = draftManifest();
  assert.doesNotThrow(() => validateManifestStructure(manifest));
  assert.equal(manifest.layers.length, 7);
  for (const layer of manifest.layers) {
    assert.equal(layer.layerConvention, "PROPOSED");
  }
});

test("rechaza ids de capa duplicados", () => {
  const manifest = draftManifest();
  manifest.layers[1].id = "fondo";
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("rechaza order de capa duplicado", () => {
  const manifest = draftManifest();
  manifest.layers[1].order = 1;
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("rechaza exports.compositePresentation con resampling distinto de nearest-neighbor", () => {
  const manifest = draftManifest({
    exports: {
      compositeNative: { path: "exports/composite-native.png", format: "png", colorMode: "RGBA" },
      compositePresentation: {
        path: "exports/composite-presentation.png",
        format: "png",
        scale: 4,
        resampling: "bicubic",
      },
    },
  });
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

test("decision solo es válida estructuralmente cuando está presente con reason", () => {
  const manifest = draftManifest({ decision: { reason: "" } });
  assert.throws(() => validateManifestStructure(manifest), ManifestValidationError);
});

// ---------------------------------------------------------------------------
// Estructura del registro
// ---------------------------------------------------------------------------

test("registro mínimo válido pasa la validación estructural", () => {
  assert.doesNotThrow(() => validateRegistryStructure(registryWith([registryEntry()])));
});

test("rechaza candidateId duplicado en el registro", () => {
  const registry = registryWith([registryEntry(), registryEntry()]);
  assert.throws(() => validateRegistryStructure(registry), ManifestValidationError);
});

test("rechaza status de registro fuera del enum", () => {
  const registry = registryWith([registryEntry({ status: "wip" })]);
  assert.throws(() => validateRegistryStructure(registry), ManifestValidationError);
});

// ---------------------------------------------------------------------------
// Precondiciones por status (impedir declarar un estado sin sus precondiciones)
// ---------------------------------------------------------------------------

test("technical-review requiere las 7 capas con path asignado", () => {
  const manifest = draftManifest({ status: "technical-review" });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test("technical-review pasa cuando las 7 capas tienen path", () => {
  const manifest = draftManifest({ status: "technical-review", layers: completeLayers() });
  assert.doesNotThrow(() => validateStatusPreconditions(manifest));
});

test("technical-validated requiere exports completos", () => {
  const manifest = draftManifest({ status: "technical-validated", layers: completeLayers() });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test("technical-validated requiere grid compliant en las 7 capas", () => {
  const manifest = draftManifest({
    status: "technical-validated",
    layers: completeLayers({ fondo: { gridCompliant: false } }),
    exports: COMPLETE_EXPORTS,
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: "2026-09-21",
    },
  });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test("technical-validated requiere sourcePxo.verifiedAt", () => {
  const manifest = draftManifest({
    status: "technical-validated",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
  });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test("technical-validated pasa cuando se cumplen todas las precondiciones", () => {
  const manifest = draftManifest({
    status: "technical-validated",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: "2026-09-21",
    },
  });
  assert.doesNotThrow(() => validateStatusPreconditions(manifest));
});

test("art-approved exige precondiciones técnicas AUNQUE tenga aprobación artística declarada", () => {
  const manifest = draftManifest({
    status: "art-approved",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
    approval: { artisticApprovalBy: "alesotoprado@gmail.com", artisticApprovalStatus: "APPROVED" },
  });
  // falta sourcePxo.verifiedAt -> debe fallar por precondición técnica, no solo por aprobación
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test("art-approved nunca se deriva de technical-validated: exige approval explícito no OPEN", () => {
  const manifest = draftManifest({
    status: "art-approved",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: "2026-09-21",
    },
    approval: { artisticApprovalBy: null, artisticApprovalStatus: "OPEN" },
  });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test("art-approved pasa cuando técnica y aprobación artística están completas", () => {
  const manifest = draftManifest({
    status: "art-approved",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: "2026-09-21",
    },
    approval: { artisticApprovalBy: "alesotoprado@gmail.com", artisticApprovalStatus: "APPROVED" },
  });
  assert.doesNotThrow(() => validateStatusPreconditions(manifest));
});

test('rejected requiere el objeto "decision" con reason', () => {
  const manifest = draftManifest({ status: "rejected" });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test("rejected pasa con decision.reason presente, desde cualquier punto del flujo (aquí: draft)", () => {
  const manifest = draftManifest({ status: "rejected", decision: { reason: "Silueta no coincide con la referencia" } });
  assert.doesNotThrow(() => validateStatusPreconditions(manifest));
});

test('"decision" no es válido fuera de status = rejected', () => {
  const manifest = draftManifest({ decision: { reason: "motivo" } });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test('superseded requiere "supersededBy"', () => {
  const manifest = draftManifest({
    status: "superseded",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: "2026-09-21",
    },
    approval: { artisticApprovalBy: "alesotoprado@gmail.com", artisticApprovalStatus: "APPROVED" },
  });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

test('"supersededBy" no es válido fuera de status = superseded', () => {
  const manifest = draftManifest({ supersededBy: "candidate-002" });
  assert.throws(() => validateStatusPreconditions(manifest), ManifestValidationError);
});

// ---------------------------------------------------------------------------
// Consistencia manifiesto <-> registro central, y terminalidad de rejected
// ---------------------------------------------------------------------------

test("falla si el candidateId del manifiesto no existe en el registro", () => {
  const manifest = draftManifest();
  const registry = registryWith([registryEntry({ candidateId: "candidate-002" })]);
  assert.throws(() => validateCrossManifestRegistry(manifest, registry), ManifestValidationError);
});

test("falla si el status del manifiesto y del registro divergen", () => {
  const manifest = draftManifest({ status: "technical-review", layers: completeLayers() });
  const registry = registryWith([registryEntry({ status: "draft" })]);
  assert.throws(() => validateCrossManifestRegistry(manifest, registry), ManifestValidationError);
});

test("bloquea la reapertura de una candidata rejected registrada", () => {
  const manifest = draftManifest({ status: "technical-review", layers: completeLayers() });
  const registry = registryWith([registryEntry({ status: "rejected" })]);
  assert.throws(() => validateCrossManifestRegistry(manifest, registry), ManifestValidationError);
});

test("una candidata rejected consistente entre manifiesto y registro es válida (estado terminal, no reabierto)", () => {
  const manifest = draftManifest({ status: "rejected", decision: { reason: "Descartada" } });
  const registry = registryWith([registryEntry({ status: "rejected" })]);
  assert.doesNotThrow(() => validateCrossManifestRegistry(manifest, registry));
});

test("supersededBy debe existir como candidateId en el registro", () => {
  const manifest = draftManifest({
    status: "superseded",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: "2026-09-21",
    },
    approval: { artisticApprovalBy: "alesotoprado@gmail.com", artisticApprovalStatus: "APPROVED" },
    supersededBy: "candidate-002",
  });
  const registry = registryWith([registryEntry({ status: "superseded" })]);
  assert.throws(() => validateCrossManifestRegistry(manifest, registry), ManifestValidationError);
});

test("supersededBy no puede apuntar a la propia candidata", () => {
  const manifest = draftManifest({
    status: "superseded",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: "2026-09-21",
    },
    approval: { artisticApprovalBy: "alesotoprado@gmail.com", artisticApprovalStatus: "APPROVED" },
    supersededBy: "candidate-001",
  });
  const registry = registryWith([registryEntry({ status: "superseded" })]);
  assert.throws(() => validateCrossManifestRegistry(manifest, registry), ManifestValidationError);
});

test("supersededBy pasa cuando la sucesora existe en el registro", () => {
  const manifest = draftManifest({
    status: "superseded",
    layers: completeLayers(),
    exports: COMPLETE_EXPORTS,
    sourcePxo: {
      path: "assets/brand/master/candidate-001/arboris-logo-master.pxo",
      producedIn: "Pixelorama",
      layerCountDeclared: 7,
      verifiedAt: "2026-09-21",
    },
    approval: { artisticApprovalBy: "alesotoprado@gmail.com", artisticApprovalStatus: "APPROVED" },
    supersededBy: "candidate-002",
  });
  const registry = registryWith([
    registryEntry({ status: "superseded" }),
    registryEntry({ candidateId: "candidate-002", status: "draft" }),
  ]);
  assert.doesNotThrow(() => validateCrossManifestRegistry(manifest, registry));
});

// ---------------------------------------------------------------------------
// Integración: los seis archivos reales del repositorio son válidos entre sí
// ---------------------------------------------------------------------------

test("manifest.json y candidates-registry.json reales del repositorio validan sin errores, incluyendo el SHA-256 de la referencia en disco", () => {
  const manifestPath = path.join(__dirname, "manifest.json");
  const registryPath = path.join(__dirname, "candidates-registry.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

  assert.doesNotThrow(() => validateAll(manifest, registry, { repoRoot: REPO_ROOT }));
  assert.equal(manifest.status, "draft");
  assert.equal(manifest.approval.artisticApprovalStatus, "OPEN");
  assert.equal(manifest.candidateId, "candidate-001");
});

test("la instancia real no exige capas, .pxo ni exports físicos en estado draft", () => {
  const manifestPath = path.join(__dirname, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  for (const layer of manifest.layers) {
    assert.equal(layer.path, null);
  }
  assert.equal(manifest.exports.compositeNative, null);
  assert.equal(manifest.exports.compositePresentation, null);
  assert.equal(manifest.sourcePxo.verifiedAt, null);
  assert.equal(
    fs.existsSync(path.resolve(REPO_ROOT, "assets/brand/master/candidate-001")),
    false,
    "assets/brand/master/candidate-001/ no debe existir todavía"
  );
});

test("falla si el SHA-256 en disco de la referencia no coincide con sha256Expected", () => {
  const manifest = draftManifest({
    reference: {
      path: "assets/brand/canonical/arboris-logo-canonical-reference.jpg",
      sha256Expected: "0".repeat(64),
    },
  });
  const registry = registryWith([registryEntry()]);
  assert.throws(() => validateAll(manifest, registry, { repoRoot: REPO_ROOT }), ManifestValidationError);
});
