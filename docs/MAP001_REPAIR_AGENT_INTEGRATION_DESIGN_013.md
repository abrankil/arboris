# MAP-001 — Repair Agent Integration Design 013

Fecha: 2026-09-23
Estado: R13_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_012.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R12_DIRECTED_REGRESSION_001.md
Validación de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R12_ASC_VALIDATION_001.md
Motivo: corrección exclusiva de R12-N1 y R12-N2
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R13 corrige exclusivamente:

R12-N1: convertir la runtime dependency snapshot en un executable dependency closure enforceable y fail-closed.
R12-N2: introducir una authority independiente que autentique la evidencia PASS usada por IMPLEMENTATION_ASSURANCE.

R13 es exclusivamente documental.

No implementa loader, canonicalizer, assurance verifier, E5.1, E5.2, E5.3, transport, provider, parser, sandbox ni repair agent.

## 2. Invariantes heredados

VERIFIED_BYTES == CONSUMED_BYTES sigue siendo obligatorio.
BOOTSTRAP_AUTHORITY_V1 permanece resolver-owned y fuera del flujo generativo.
LEGACY_LOGICAL_SHA256_V1 y CANONICAL_JSON_SHA256_V2 siguen separados.
NO_IMPLICIT_HASH_MIGRATION = TRUE.
E5_HASH_PROFILE_COMPATIBILITY_GATE_V1 sigue obligatorio.
NORMATIVE_CONTROLLED_JSON_PIPELINE_V1 permanece materialize → validate exact materialized representation → seal → hash.
EVIDENCE_CLAIM_V2 mantiene status + evidenceBasis + supportingBindings.
PROVIDER_NATIVE_REQUEST_IDENTITY solo puede ser VERIFIED mediante DIRECT_RUNTIME_EVIDENCE.
E5.1, E5.2 y E5.3 siguen obligatorios.
E5.3 sigue siendo la única frontera durable.
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN.
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN.
CANONICAL_JSON_NUMBER_POLICY = OPEN.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 3. R12-N1 — EXECUTABLE_DEPENDENCY_CLOSURE_V1

R13 reemplaza la afirmación genérica “every runtime dependency is pinned” por un closure explícito y verificable.

EXECUTABLE_DEPENDENCY_CLOSURE_V1 contiene, conceptualmente:

closureId.
entrypointBindings.
moduleBindings.
importEdgeBindings.
packageResolutionBindings.
builtinRuntimeBindings.
nativeDependencyBindings.
loaderConfigurationBindings.
environmentInputPolicyBinding.
resolutionPolicyBinding.
forbiddenAmbientSources.

Cada file/module dependency exige dependencyId + canonical repo-relative path o immutable content locator + raw SHA-256.

## 4. Entrypoints y módulos

entrypointBindings fija exactamente qué módulos pueden iniciar la ejecución del runtime de integración.

moduleBindings enumera cada módulo ejecutable autorizado, incluyendo módulos transitivos.

No se permite ejecutar un módulo que no tenga binding dentro del closure.

Para cada módulo se registra, como mínimo:

moduleId.
moduleKind.
canonical locator.
verified raw SHA-256.
load mode.
runtime compatibility constraints.

## 5. Import graph cerrado

importEdgeBindings representa el grafo dirigido parent module → imported module.

Cada edge fija:

parentModuleId.
importSpecifier.
importKind.
resolvedModuleId.
resolutionRuleId.

importKind distingue al menos:

STATIC_IMPORT.
DYNAMIC_IMPORT.
PACKAGE_EXPORT_RESOLUTION.
NATIVE_BINDING.
RUNTIME_BUILTIN.

Una importación observada en ejecución que no tenga edge autorizado produce:

UNAUTHORIZED_RUNTIME_DEPENDENCY → fail closed.

## 6. Dynamic imports

R13 prohíbe dynamic import libre.

Un dynamic import solo es válido si:

- el callsite o policy que lo genera está identificado;
- el conjunto de targets posibles es finito y aparece en importEdgeBindings;
- la resolución real coincide con uno de esos targets;
- cada target pertenece a moduleBindings;
- no se permite construir arbitrariamente un path/package name desde model/provider data.

Si el target no puede determinarse dentro del closure autorizado, el runtime de integración no puede usar ese mecanismo.

## 7. Package resolution

packageResolutionBindings fija cualquier package metadata que pueda alterar resolución, incluyendo cuando corresponda:

package.json bytes/hash.
exports/imports maps.
lockfile bindings.
package manager/runtime resolution mode.
package root identity.
resolved package file bindings.

Está prohibido resolver desde un ambient node_modules no incluido en el closure.

No se acepta “same package version” sin identidad exacta de los archivos consumidos.

## 8. Runtime built-ins y toolchain

Los built-ins no se tratan como archivos del repo, pero su semántica queda ligada a builtinRuntimeBindings.

El binding debe fijar al menos:

runtime family.
exact runtime version/build identity.
platform/architecture cuando sea material.
relevant runtime flags.
allowed built-in module set.

Un built-in fuera del set autorizado falla cerrado.

Un cambio de runtime identity invalida el closure y la assurance asociada.

## 9. Native dependencies

Si existe cualquier native addon, binary helper o executable externo:

- debe figurar en nativeDependencyBindings;
- su identidad binaria exacta debe quedar ligada por raw/content digest;
- arquitectura/ABI/runtime compatibility deben quedar fijadas;
- la carga desde PATH u otra búsqueda ambiental queda prohibida salvo policy explícita y equivalente.

Si el runtime seleccionado no requiere native dependencies, ese conjunto debe quedar explícitamente vacío.

## 10. Loader configuration

loaderConfigurationBindings fija cualquier elemento capaz de alterar resolución o ejecución de módulos:

custom loaders.
import maps.
require/import hooks.
NODE_OPTIONS o equivalentes relevantes.
module search paths.
startup flags.

La policy por defecto es DENY_UNDECLARED.

Un hook o loader no listado dentro del closure no puede ejecutarse.

## 11. Environment input policy

R13 distingue dependencia ejecutable de input ambiental.

ENVIRONMENT_INPUT_POLICY_V1 clasifica los inputs ambientales en:

FORBIDDEN.
FIXED_AND_BOUND.
ALLOWED_NON_SEMANTIC.

FORBIDDEN no puede ser leído por el runtime de integración.

FIXED_AND_BOUND debe registrar name + canonical value binding o digest y forma parte de la runtime snapshot.

ALLOWED_NON_SEMANTIC solo puede usarse cuando exista evidencia de que no altera semántica del resultado; su uso debe estar explícitamente autorizado.

No existe acceso ambiental implícito.

## 12. Resolution policy fail-closed

EXECUTABLE_RESOLUTION_POLICY_V1 exige que toda resolución ocurra mediante el closure autorizado.

Durante ejecución:

request import/specifier
→ identify parent module
→ resolve only using bound resolution policy
→ match authorized edge
→ load verified bound artifact
→ otherwise fail closed.

No se permite fallback a search paths ambientales.

## 13. Closure completeness enforcement

R13 no afirma que análisis estático por sí solo pruebe completitud.

La completitud se define operacionalmente:

cualquier dependencia realmente solicitada durante ejecución debe pertenecer al closure previamente autorizado; el loader/resolver no puede cargar otra cosa.

Así, el closure es cerrado por enforcement, no por una afirmación documental de que “ya encontramos todo”.

Los tests deben cubrir static imports, dynamic imports, package exports, denied ambient modules, denied hooks y denied unexpected built-ins.

## 14. EXECUTABLE_DEPENDENCY_CLOSURE_DIGEST

Una vez activado CANONICAL_JSON_SHA256_V2:

executableDependencyClosureDigest = CANONICAL_JSON_SHA256_V2(EXECUTABLE_DEPENDENCY_CLOSURE_V1).

INTEGRATION_RUNTIME_SNAPSHOT_V2 reemplaza V1 y contiene:

verifiedArtifactHandles.
executableDependencyClosureDigest.
runtimeBuiltinBindingDigest.
environmentInputPolicyDigest.
resolutionPolicyDigest.

El snapshot queda sellado antes de ejecutar provider/transport logic de integración.

## 15. Runtime provenance por intento

INTEGRATION_ATTEMPT_RECORD debe registrar:

integrationRuntimeSnapshotDigest.
executableDependencyClosureDigest.
entrypoint IDs usados.
runtime identity.
any denied dependency event, si ocurrió.

Una ejecución que dispara UNAUTHORIZED_RUNTIME_DEPENDENCY no puede producir evidence claims VERIFIED ni Repair R1.

## 16. R12-N2 — ASSURANCE_PRODUCER_AUTHORITY_V1

R13 introduce una authority independiente del transport/model/report body.

ASSURANCE_PRODUCER_AUTHORITY_V1 es resolver-owned y se establece desde BOOTSTRAP_AUTHORITY_V1 o desde una authority de release equivalente ya confiable.

Conceptualmente contiene:

assuranceAuthorityId.
allowedProducerIdentities.
allowedAttestationMethods.
producerTrustAnchors.
artifactRetrievalPolicy.
allowedExecutionSystems.
claimScopePolicy.
revocationOrDisablePolicy.

El report de tests no puede definir ni seleccionar esta authority.

## 17. Métodos de autenticación admitidos

R13 no fija una tecnología concreta, pero solo admite clases con autenticidad verificable.

### 17.1 SIGNED_ATTESTATION

Un producer autorizado firma/attesta un statement que liga execution identity + report digest + tested runtime snapshot + claim mapping.

El verifier usa un trust anchor fijado por ASSURANCE_PRODUCER_AUTHORITY_V1.

### 17.2 AUTHENTICATED_IMMUTABLE_CI_RETRIEVAL

Resolver obtiene el report desde un sistema CI autorizado mediante un canal autenticado y verifica que:

- el run pertenece al producer autorizado;
- el artifact pertenece al execution identity exacto;
- el artifact digest coincide;
- el tested commit/tree/runtime snapshot coincide;
- el run concluyó PASS.

### 17.3 EQUIVALENT_AUTHENTICATED_PROVENANCE

Otro mecanismo solo es admisible si demuestra autenticidad, integridad y scope equivalentes.

## 18. ASSURANCE_ATTESTATION_V1

La evidencia autenticada debe ligar, como mínimo:

assuranceAuthorityId.
producerIdentity.
executionIdentity.
executionReportDigest.
testDefinitionDigestSet.
testedRepositoryIdentity.
testedCommitOrTreeIdentity.
testedIntegrationRuntimeSnapshotDigest.
testedExecutableDependencyClosureDigest.
providerRuntimeScope.
platformRuntimeScope.
claimIdsSupported.
overallResult.

overallResult debe ser PASS.

## 19. Report body no es autoridad

IMPLEMENTATION_ASSURANCE_EVIDENCE_V2 reemplaza V1.

El report body sigue aportando per-test results, skipped/failed tests y metadata de ejecución, pero su autenticidad proviene de ASSURANCE_PRODUCER_AUTHORITY_V1 + ASSURANCE_ATTESTATION_V1 o equivalente.

Está prohibido aceptar producerIdentity, run ID o PASS solo porque aparecen dentro del mismo report.

## 20. Assurance verification sequence

1. resolver carga ASSURANCE_PRODUCER_AUTHORITY_V1 desde trust root autorizado.
2. verifica producer identity/trust anchor o authenticated CI identity.
3. obtiene attestation/report binding.
4. verifica exact execution report digest.
5. verifica execution identity.
6. verifica tested runtime snapshot digest.
7. verifica executable dependency closure digest.
8. verifica implementation/policy/test definition bindings.
9. verifica PASS, required tests no skipped y no failed tests.
10. verifica provider/runtime/platform scope.
11. verifica assuranceValidityPolicy.
12. deriva VERIFIED + IMPLEMENTATION_ASSURANCE solo si todo lo anterior pasa.

Cualquier fallo produce EVIDENCE_BASIS_INSUFFICIENT o un failure code más específico.

## 21. Producer revocation / disable

ASSURANCE_PRODUCER_AUTHORITY_V1 debe permitir invalidar un producer/trust anchor o método de attestation.

Si un producer está revoked/disabled según la authority vigente:

ASSURANCE_PRODUCER_NOT_AUTHORIZED → evidence unusable.

R13 no inventa política temporal de revocación; su mecanismo concreto permanece OPEN.

## 22. No auto-authentication

Está prohibido:

- que TRANSPORT_RECEIPT seleccione la assurance authority;
- que el PASS report seleccione su propio producer trust anchor;
- que el modelo provea un signer/producer aceptado;
- que un digest sin provenance autenticada se convierta en evidence authenticity.

## 23. Claims y assurance

TRANSPORT_CORRELATION puede usar IMPLEMENTATION_ASSURANCE solo si el exact implementation/runtime/closure usado por el intento coincide con el exact testedIntegrationRuntimeSnapshotDigest y testedExecutableDependencyClosureDigest de la evidencia autenticada.

PROVIDER_NATIVE_REQUEST_IDENTITY continúa prohibido bajo IMPLEMENTATION_ASSURANCE.

## 24. INPUT_BINDING_V8

V8 reemplaza V7 y añade:

executableDependencyClosureDigest.
assuranceProducerAuthorityBinding.
assuranceVerificationPolicyBinding.

Conserva integrationRuntimeSnapshotDigest, verifiedLoadPolicyBinding, implementationAssurancePolicyBinding, controlledJsonPipelinePolicyBinding y todos los bindings previos necesarios.

Estos fields son trace bindings; no auto-seleccionan authorities.

## 25. Failure semantics añadidas

UNAUTHORIZED_RUNTIME_DEPENDENCY.
RUNTIME_IMPORT_EDGE_MISSING.
AMBIENT_MODULE_RESOLUTION_FORBIDDEN.
RUNTIME_BUILTIN_NOT_AUTHORIZED.
NATIVE_DEPENDENCY_NOT_AUTHORIZED.
RUNTIME_ENVIRONMENT_INPUT_FORBIDDEN.
EXECUTABLE_DEPENDENCY_CLOSURE_DRIFT.

ASSURANCE_PRODUCER_AUTHORITY_MISSING.
ASSURANCE_PRODUCER_NOT_AUTHORIZED.
ASSURANCE_ATTESTATION_INVALID.
ASSURANCE_EXECUTION_IDENTITY_MISMATCH.
ASSURANCE_REPORT_DIGEST_MISMATCH.
ASSURANCE_RUNTIME_SNAPSHOT_MISMATCH.
ASSURANCE_EXECUTABLE_CLOSURE_MISMATCH.
ASSURANCE_CLAIM_SCOPE_MISMATCH.

Ninguna habilita retry automático.

## 26. OPEN preservados

executable closure concrete implementation.
loader/resolver implementation.
exact symlink/reparse policy.
exact runtime/toolchain selection.
exact allowed built-ins.
environment input classifications.
bootstrap deployment mechanism.
CANONICAL_JSON_NUMBER_POLICY.
CANONICAL_JSON_SHA256_V2 implementation.
trusted materializer/snapshot implementation.
assurance attestation technology.
assurance producer identities/trust anchors.
assurance retrieval connector/mechanism.
assuranceValidityPolicy values.
provider/model/runtime.
provider-specific source/capture/extraction/evidence-strength policies.
hash-profile bridge A/B/C.
E5 compatibility proof/migration.
prototype-safe E5.1 repair application + tests.
minimal-change executable rule or authority-level revision.
exact numeric resource limits.
schemas concretos R13.
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

## 27. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R13-ASC-001

AUTHORIZED SOURCES:
- branch head 1f0962105b347f9f738f6d33e6933cee2f353d25
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- R12 design
- R12 directed regression
- R12 ASC validation
- E5.1/E5.2/E5.3 authorities

MANDATORY RELATIONS:
- every executed dependency must belong to a sealed authorized closure
- unexpected imports/resolution fail closed
- runtime built-ins/toolchain semantics are bound
- ambient module resolution is denied unless explicitly bound
- implementation assurance PASS must be authenticated by independent producer authority
- report body cannot self-authenticate producer/execution
- assurance evidence binds exact tested runtime snapshot and executable closure
- R11-N3 PASS remains preserved
- prior closures remain preserved
- implementation remains unauthorized

DO NOT INFER:
- verified entrypoint implies verified transitive graph
- static analysis alone proves closure completeness
- stable report SHA proves authentic execution
- producerIdentity inside report authenticates producer
- PASS from unauthenticated evidence supports IMPLEMENTATION_ASSURANCE
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED:
- ambient/unlisted executable dependencies
- unbound dynamic imports
- self-authenticating assurance reports
- provider-native identity from implementation assurance
- silent hash-profile migration
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA:
- R12-N1 executable dependency closure is operationally fail-closed
- R12-N2 assurance evidence has independent authenticity root
- R11-N3 remains PASS
- no prior blocker is silently reopened
- implementation remains unauthorized

ASC compila restricciones; no decide loader/runtime, producer technology, trust anchors, provider, schemas ni implementación.

## 28. AUDITORÍA

R13 corrige R12-N1 al convertir el runtime snapshot en un executable dependency closure cuyo carácter cerrado se impone por el resolver/loader: cualquier dependencia no autorizada falla cerrado.

R13 corrige R12-N2 al separar integridad del report de autenticidad de su producer/execution mediante ASSURANCE_PRODUCER_AUTHORITY_V1.

R11-N3 permanece preservado sin introducir una secuencia alternativa de snapshot.

## 29. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

R13 no afirma que el runtime actual ya implemente el closure ni que exista una assurance producer authority configurada.

Los OPEN correspondientes siguen bloqueando implementación.

## 30. VACÍOS / OMISIONES

Los OPEN de §26 permanecen declarados.

En particular faltan decisiones concretas de runtime/loader, producer/trust anchor, attestation/retrieval mechanism, canonicalizer V2, bridge de hash hacia E5, prototype-safe E5.1 y minimalChangeRequired.

No se cierran por inferencia.

## 31. REDUNDANCIAS

Verified artifact handles + executable dependency closure cubren identidad individual y completitud enforceable del grafo.

Immutable PASS report + assurance producer authority cubren integridad y autenticidad.

Runtime snapshot digest + executable closure digest permiten distinguir configuración del runtime y grafo ejecutable autorizado.

E5 compatibility gate + E5.1/E5.2/E5.3 siguen siendo defensas distintas.

No crean autoridad paralela.

## 32. Resolución dirigida

R12-N1 = ADDRESSED.
R12-N2 = ADDRESSED.

ADDRESSED != regression PASS.

## 33. Gate

R13 authored → directed regression R12-N1/R12-N2 → accumulated regression completa → correct any new finding → design validation → explicit human implementation decision → only then consider executable changes.

Estado:
REPAIR_AGENT_INTEGRATION_DESIGN = R13_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
