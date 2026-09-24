# MAP-001 — Repair Agent Integration Design 012

Fecha: 2026-09-23
Estado: R12_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Main observado: 9fc1619b4d23bc7ebe1ece49d5f55143362c129f
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_011.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R11_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R11-N1, R11-N2 y R11-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R12 conserva las fronteras válidas de R11 y corrige exclusivamente:

R11-N1: unir bytes verificados con bytes realmente parseados/ejecutados.
R11-N2: exigir evidencia immutable de ejecución PASS para IMPLEMENTATION_ASSURANCE.
R11-N3: congelar una única secuencia materialize → validate exact snapshot → seal → hash.

R12 es exclusivamente documental.

No implementa loader, canonicalizer, materializer, E5.1, E5.2, E5.3, transport, provider, parser, sandbox ni repair agent.

## 2. Invariantes heredados

BOOTSTRAP_AUTHORITY_V1 permanece fuera del flujo generativo.
BOOTSTRAP_RAW_SHA256_V1 autentica identidad exacta de bytes, no logical semantics.
LEGACY_LOGICAL_SHA256_V1 y CANONICAL_JSON_SHA256_V2 siguen separados.
NO_IMPLICIT_HASH_MIGRATION = TRUE.
E5_HASH_PROFILE_COMPATIBILITY_GATE_V1 sigue obligatorio.
CONTROLLED_JSON_SNAPSHOT debe ser detached, alias-safe e immutable.
EVIDENCE_CLAIM requiere status + evidenceBasis + supportingBindings.
PROVIDER_NATIVE_REQUEST_IDENTITY no puede usar IMPLEMENTATION_ASSURANCE para VERIFIED.
E5.1, E5.2 y E5.3 siguen obligatorios.
E5.3 sigue siendo la única frontera durable.
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN.
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN.
CANONICAL_JSON_NUMBER_POLICY = OPEN.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 3. R11-N1 — VERIFIED_ARTIFACT_LOAD_V1

R12 define una frontera explícita entre identidad verificada de bytes y consumo efectivo de esos bytes.

VERIFIED_ARTIFACT_LOAD_V1 no es solo “hash file then import path”. Es un contrato de consumo de bytes verificados.

Conceptualmente produce:

VERIFIED_ARTIFACT_HANDLE_V1 = {
  dependencyId,
  canonicalRepoRelativePath,
  repositoryIdentity,
  verifiedRawSha256,
  byteLength,
  loadMode,
  immutableConsumptionBinding
}.

El handle solo existe después de verificar exactamente los bytes que serán consumidos.

## 4. Repository/path binding

Antes de verificar un artefacto:

- resolver fija repository root y repository identity;
- canonicalRepoRelativePath se normaliza una vez;
- path absoluto debe quedar dentro del repository root;
- path traversal/escape falla cerrado;
- symlink/reparse-point policy debe ser explícita;
- si symlinks están prohibidos para ese dependency class, cualquier symlink falla cerrado;
- si están permitidos, el target resuelto y su identidad deben quedar incluidos en el binding.

allowedRepositoryIdentity y allowedBranchOrReleaseScope dejan de ser metadata descriptiva: deben verificarse por una policy resolver-owned antes de aceptar el trust root.

## 5. Exact-byte consumption rule

La propiedad normativa es:

VERIFIED_BYTES == CONSUMED_BYTES.

Esto debe cumplirse para trust-root manifest, parser, materializer, builder, canonicalizer/serializer, number policy y cualquier código/policy cuyo SHA forme parte de INTEGRATION_CRYPTO_RUNTIME_BINDING.

No se permite:

read path A → hash → close → later reopen same path → trust without equivalent re-verification.

## 6. Load modes permitidos

R12 permite únicamente mecanismos con equivalencia demostrable.

### 6.1 VERIFIED_BUFFER_CONSUMPTION

El artefacto se lee una vez a un bounded immutable byte buffer, se calcula raw SHA sobre ese buffer y el parser/consumer consume ese mismo buffer.

Aplicable a manifests, JSON/policy files y otros artefactos que puedan consumirse desde bytes.

### 6.2 CONTENT_ADDRESSED_IMMUTABLE_STAGE

Para código/runtime que no pueda ejecutarse directamente desde el buffer:

- crear un stage path content-addressed por raw SHA;
- escribir exactamente los verified bytes;
- fsync/close según corresponda;
- prohibir overwrite del stage path;
- verificar raw SHA del staged artifact;
- aplicar policy explícita de permisos/symlinks/path identity;
- cargar exactamente desde ese staged artifact;
- registrar staged path + raw SHA + loader identity;
- cualquier drift o sustitución falla cerrado.

### 6.3 EQUIVALENT_VERIFIED_LOADER

Otro mecanismo solo es admisible si demuestra la misma propiedad de identidad exacta entre bytes verificados y bytes consumidos.

La elección concreta permanece OPEN.

## 7. Trust-root manifest consumption

El trust-root manifest se procesa así:

1. resolver obtiene path + expected raw SHA desde BOOTSTRAP_AUTHORITY_V1;
2. lee bytes una sola vez mediante VERIFIED_BUFFER_CONSUMPTION o equivalente;
3. verifica raw SHA;
4. parsea exactamente ese verified buffer;
5. obtiene INTEGRATION_CRYPTO_RUNTIME_BINDING_V1.

Está prohibido volver a leer el manifest por path para parsearlo después del hash.

## 8. Executed-module provenance

Cada dependency ejecutable debe dejar evidencia de:

dependencyId.
canonical source path.
verified source raw SHA.
loadMode.
consumed artifact identity.
consumed artifact raw SHA.
loader/runtime identity.
actual module/runtime descriptor.

Si source bytes y consumed bytes no son idénticos bajo el contrato declarado:

VERIFIED_LOAD_BYTE_MISMATCH → fail closed.

## 9. Drift durante el intento

Una vez creados los VERIFIED_ARTIFACT_HANDLE_V1 necesarios para el intento:

- esos handles constituyen la runtime dependency snapshot;
- el intento no puede resolver de nuevo dependencies desde ambient repo state;
- si el runtime requiere un segundo acceso, debe hacerlo a través del immutable consumption binding;
- cualquier dependency drift invalida request/response previamente producido.

INTEGRATION_RUNTIME_SNAPSHOT_V1 agrupa los handles exactos consumidos por un intento.

Su identidad lógica se calcula solo después de activar el runtime V2 autorizado.

## 10. Bootstrap order R12

1. verify resolver-owned BOOTSTRAP_AUTHORITY_V1.
2. create verified byte handle for trust-root manifest.
3. parse the same verified manifest bytes.
4. obtain dependency bindings.
5. create VERIFIED_ARTIFACT_HANDLE_V1 for every bootstrap/runtime dependency.
6. verify consumed-byte identity for every dependency.
7. freeze INTEGRATION_RUNTIME_SNAPSHOT_V1.
8. activate CANONICAL_JSON_SHA256_V2 from that runtime snapshot.
9. only then verify V2 logical artifacts.

INPUT_BINDING sigue echo-only respecto del bootstrap/runtime snapshot.

## 11. R11-N2 — IMPLEMENTATION_ASSURANCE_EVIDENCE_V1

R12 distingue test definition de test execution evidence.

IMPLEMENTATION_ASSURANCE solo puede usarse cuando existe un record immutable de una ejecución PASS.

IMPLEMENTATION_ASSURANCE_EVIDENCE_V1 contiene conceptualmente:

assuranceEvidenceId.
claimIdsSupported.
implementationBindings.
policyBindings.
testDefinitionBindings.
testExecutionId.
testedRepositoryIdentity.
testedCommitOrTreeIdentity.
providerRuntimeScope.
platformRuntimeScope.
toolchainScope.
executionStartedAt.
executionCompletedAt.
overallResult.
perTestResults.
skippedTests.
failedTests.
executionReportArtifactBinding.

overallResult debe ser PASS.
failedTests debe estar vacío.
Los tests requeridos por claimIdsSupported no pueden figurar como skipped.

## 12. Immutable execution report binding

executionReportArtifactBinding exige:

artifact kind.
canonical locator/path dentro del sistema autorizado.
raw SHA-256 o content-addressed immutable digest.
producer identity.
execution/run identity.

Un URL/run ID mutable o una referencia textual sin contenido pinneado no basta.

La fuente concreta de este report —por ejemplo CI local/remoto autorizado— permanece OPEN, pero su identidad debe ser verificable y no auto-declarada por transport.

## 13. Assurance exact-scope matching

Resolver solo puede aceptar IMPLEMENTATION_ASSURANCE cuando todos los bindings de la evidencia coinciden con el intento actual:

exact implementation raw SHA.
exact policy raw SHA.
exact provider/runtime class or explicitly compatible scope.
exact platform/runtime constraints cuando sean materiales.
exact required test set.
exact claim mapping.

No existe wildcard “same major version” o “similar runtime” salvo que una authority específica lo defina y audite.

## 14. Freshness y vigencia de assurance

Cada provider/runtime policy debe definir assuranceValidityPolicy.

Debe fijar al menos:

what changes invalidate evidence.
whether age/time invalidates evidence.
which dependency/runtime changes require re-test.
whether a new commit/tree always invalidates prior assurance.

Sin una policy fijada:

IMPLEMENTATION_ASSURANCE_VALIDITY = OPEN
→ VERIFIED + IMPLEMENTATION_ASSURANCE forbidden.

R12 no inventa un periodo temporal por defecto.

## 15. Claim derivation with assurance

Para VERIFIED + IMPLEMENTATION_ASSURANCE:

1. resolver identifica claimId;
2. carga trusted claim policy;
3. exige IMPLEMENTATION_ASSURANCE_EVIDENCE_V1;
4. verifica immutable PASS execution report;
5. verifica exact implementation/policy/runtime scope;
6. verifica required test IDs present and PASS;
7. verifica validity policy;
8. solo entonces deriva VERIFIED + IMPLEMENTATION_ASSURANCE.

Stale, failed, skipped, incomplete, missing or scope-mismatched evidence produce EVIDENCE_BASIS_INSUFFICIENT.

## 16. Provider-native identity preservada

PROVIDER_NATIVE_REQUEST_IDENTITY solo puede usar VERIFIED + DIRECT_RUNTIME_EVIDENCE.

IMPLEMENTATION_ASSURANCE_EVIDENCE_V1 nunca puede transformar provider-native identity NOT_OBSERVABLE en VERIFIED.

## 17. R11-N3 — única secuencia normativa de snapshot

R12 congela una única secuencia autoritativa.

NORMATIVE_CONTROLLED_JSON_PIPELINE_V1:

bounded input / approved builder inputs
→ materialize detached private controlled representation
→ validate that exact materialized representation
→ seal immutable snapshot
→ canonical serialize/hash.

Esta es la única secuencia que autoriza una CONTROLLED_JSON_SNAPSHOT_V2.

## 18. Pre-materialization checks

Se permiten checks previos únicamente como optimización fail-fast:

byte length.
known content type.
obvious syntax framing.
provider-specific outer type guard.

Esos checks no otorgan validez al snapshot y no sustituyen la validación del exact materialized representation.

## 19. Private materialization phase

Durante materialization:

- storage permanece module-private;
- ningún caller recibe referencia al working representation;
- no se conserva alias a source containers;
- copied values se convierten a own-data-only controlled containers;
- no getters/setters/prototypes from source se preservan;
- resource bounds se aplican durante la copia.

## 20. Authoritative snapshot validation

Después de materialization y antes de seal, se valida exactamente el working representation que se convertirá en snapshot.

La validación cubre:

CANONICAL_JSON_VALUE domain.
dense arrays.
own enumerable string data properties.
absence of accessors.
number policy.
string policy.
special-key preservation.
resource limits.
alias/snapshot invariants.

Si falla, el working representation se descarta y nunca obtiene handle.

## 21. Atomic validate-to-seal handoff

Entre authoritative validation y seal:

- no se expone el working representation;
- no se entrega control a un caller que pueda mutarlo;
- no se resuelve información ambiental adicional;
- seal opera sobre el mismo private representation validado.

El objetivo contractual es impedir:

validate representation A → mutate/replace → seal representation B.

Si la implementación no puede garantizar este handoff, falla el diseño ejecutable.

## 22. CONTROLLED_JSON_SNAPSHOT_V2

V2 reemplaza V1.

Solo existe después de completar NORMATIVE_CONTROLLED_JSON_PIPELINE_V1.

El handle público sigue siendo CONTROLLED_JSON_VALUE_HANDLE_V2 y no expone mutable internals.

Canonical hash se calcula únicamente después del seal.

## 23. Snapshot tests actualizados

Además de los tests R11, se exigen:

pre-check PASS pero post-materialization validation FAIL → snapshot rejected.
transform during materialization changes value → exact materialized value is what validation sees.
mutation attempt between validation and seal is impossible or detected.
no event-loop/callback/user hook can mutate private representation in validate-to-seal handoff.
repeated snapshot hash stable.

## 24. INPUT_BINDING_V7

V7 reemplaza V6 y añade/actualiza:

integrationRuntimeSnapshotDigest.
verifiedLoadPolicyBinding.
implementationAssurancePolicyBinding.
controlledJsonPipelinePolicyBinding.

Conserva bootstrapAuthorityId, trustRootManifestRawSha256, integrationCryptoRuntimeBindingDigest y los bindings previos de request/model/resource/source/extraction.

Todos son trace bindings; ninguno puede auto-autorizar el runtime con que se verifica el propio INPUT_BINDING.

## 25. TRANSPORT_RECEIPT_V9 / attempt evidence

TRANSPORT_RECEIPT_V9 conserva evidence claims, pero IMPLEMENTATION_ASSURANCE supportingBindings deben referir a un IMPLEMENTATION_ASSURANCE_EVIDENCE_V1 verificable por resolver.

INTEGRATION_ATTEMPT_RECORD agrega:

integrationRuntimeSnapshotDigest.
verifiedArtifactLoadEvidence summary.
implementationAssuranceEvidence IDs/digests used.
controlledJsonPipelineVersion.

Transport no decide la suficiencia final de estos bindings.

## 26. Failure semantics añadidas

REPOSITORY_IDENTITY_MISMATCH.
REPOSITORY_SCOPE_MISMATCH.
DEPENDENCY_PATH_ESCAPE.
DEPENDENCY_SYMLINK_POLICY_VIOLATION.
VERIFIED_LOAD_BYTE_MISMATCH.
VERIFIED_LOAD_CONSUMPTION_UNPROVEN.
INTEGRATION_RUNTIME_SNAPSHOT_DRIFT.

ASSURANCE_EXECUTION_EVIDENCE_MISSING.
ASSURANCE_EXECUTION_NOT_PASS.
ASSURANCE_REQUIRED_TEST_SKIPPED.
ASSURANCE_SCOPE_MISMATCH.
ASSURANCE_REPORT_BINDING_INVALID.
ASSURANCE_EVIDENCE_STALE.

CONTROLLED_JSON_POST_MATERIALIZATION_INVALID.
CONTROLLED_JSON_VALIDATE_SEAL_RACE.
CONTROLLED_JSON_PIPELINE_ORDER_INVALID.

Ninguna habilita retry automático.

## 27. OPEN preservados

verified loader concrete implementation.
symlink/reparse policy exact values.
bootstrap deployment mechanism.
CANONICAL_JSON_NUMBER_POLICY.
CANONICAL_JSON_SHA256_V2 implementation.
trusted materializer/snapshot implementation.
assurance report producer/authority.
assuranceValidityPolicy values.
provider/model/runtime.
provider-specific source/capture/extraction/evidence-strength policies.
hash-profile bridge A/B/C.
E5 compatibility proof/migration.
prototype-safe E5.1 repair application + tests.
minimal-change executable rule or authority-level revision.
exact numeric resource limits.
schemas concretos R12.
request projection.
response schema.
instruction artifacts.
generation parameters/provider features.
endpoint policy.
transport implementation.
sandbox.
strict parser implementation.
failure schema.
IDs.
observability.
implementation adversarial tests.
human implementation authorization.
NEXT_STAGE_ID.
AUTHORIZED_FOR_ASC.

## 28. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R12-ASC-001

AUTHORIZED SOURCES:
- branch head 370ffc39d40f5a8b9037b82a2cd93aeac96b3804
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- E5.1 / E5.2 / E5.3 authorities
- R11 design
- R11 directed regression
- current logicalSha256 implementation and E5 consumers
- Repair R1 schema

MANDATORY RELATIONS:
- bytes verified by raw SHA equal bytes actually parsed/executed
- trust-root manifest is parsed from the same verified bytes
- executable dependencies use verified immutable consumption bindings
- implementation assurance requires immutable PASS execution evidence
- test evidence scope matches exact implementation/policy/provider/runtime claim scope
- snapshot normative order is materialize → validate exact materialized representation → seal → hash
- pre-materialization checks do not substitute authoritative snapshot validation
- validate-to-seal handoff exposes no mutable alias
- prior closures remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

DO NOT INFER:
- hashing a path once proves later imported bytes
- existence of test files proves PASS execution
- CI/run ID without pinned report content is sufficient assurance
- pre-copy validation proves copied snapshot validity
- shallow freeze proves alias-free immutability
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED:
- hash-then-reopen without equivalent verified-load guarantee
- assurance claim backed only by test definitions
- skipped/failed/stale test evidence supporting VERIFIED
- competing normative snapshot pipeline orders
- mutable exposure between validation and seal
- silent hash-profile migration
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA:
- R11-N1 verified-load semantics bind checked bytes to consumed bytes
- R11-N2 implementation assurance requires immutable PASS evidence
- R11-N3 one normative snapshot pipeline only
- previous constraints preserved
- implementation remains unauthorized

ASC compila restricciones; no decide loader implementation, CI authority, assurance validity values, provider, schemas ni executable changes.

## 29. AUDITORÍA

R12 corrige R11-N1 mediante VERIFIED_ARTIFACT_LOAD_V1, same-buffer manifest parsing y verified immutable consumption bindings para dependencies ejecutables.

R12 corrige R11-N2 distinguiendo test definitions de IMPLEMENTATION_ASSURANCE_EVIDENCE_V1 con execution result PASS y exact-scope matching.

R12 corrige R11-N3 congelando NORMATIVE_CONTROLLED_JSON_PIPELINE_V1 con una única secuencia materialize → validate exact materialized representation → seal → hash.

## 30. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1 ni con E5.1/E5.2/E5.3.

R12 no afirma que el repo/runtime actual ya implemente VERIFIED_ARTIFACT_LOAD_V1, assurance execution evidence o snapshot pipeline V1.

## 31. VACÍOS / OMISIONES

Los OPEN de §27 permanecen bloqueantes para implementación.

En particular siguen fuera de cierre: loader concreto, canonicalizer V2, number policy, assurance authority/validity, hash-profile bridge A/B/C, prototype-safe E5.1 y minimalChangeRequired.

No impiden auditar R12 como diseño.

## 32. REDUNDANCIAS

Raw SHA + verified-load binding cubren identidad almacenada y bytes consumidos.
Test definition bindings + PASS execution report cubren qué debía probarse y qué efectivamente pasó.
Private materialization + authoritative snapshot validation cubren construcción controlada y validez del exact snapshot.
E5 compatibility gate + E5.1/E5.2/E5.3 cubren compatibilidad y authoritative execution.

No crean autoridad paralela.

## 33. Resolución dirigida

R11-N1 = ADDRESSED.
R11-N2 = ADDRESSED.
R11-N3 = ADDRESSED.

ADDRESSED != regression PASS.

## 34. Gate

R12 authored → directed regression R11-N1/R11-N2/R11-N3 → accumulated regression completa → correct any new finding → design validation → explicit human implementation decision → only then consider executable changes.

Estado:
REPAIR_AGENT_INTEGRATION_DESIGN = R12_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
