# MAP-001 — Repair Agent Integration Design 014

Fecha: 2026-09-23
Estado: R14_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_013.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R13_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R13-N1 y R13-N2
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R14 corrige exclusivamente:

R13-N1: cerrar superficies secundarias capaces de originar ejecución fuera del module graph.
R13-N2: cerrar semantic inputs por capability domain.

R14 es exclusivamente documental.

No implementa sandbox, loader, canonicalizer, materializer, E5.1, E5.2, E5.3, transport, provider ni repair agent.

## 2. Invariantes heredados

VERIFIED_BYTES == CONSUMED_BYTES sigue siendo obligatorio.
EXECUTABLE_DEPENDENCY_CLOSURE_V1 sigue siendo obligatorio.
ASSURANCE_PRODUCER_AUTHORITY_V1 permanece resolver-owned.
LEGACY_LOGICAL_SHA256_V1 y CANONICAL_JSON_SHA256_V2 siguen separados.
NO_IMPLICIT_HASH_MIGRATION = TRUE.
E5_HASH_PROFILE_COMPATIBILITY_GATE_V1 sigue obligatorio.
NORMATIVE_CONTROLLED_JSON_PIPELINE_V1 sigue siendo materialize → validate exact materialized representation → seal → hash.
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

## 3. R13-N1 — EXECUTION_SURFACE_POLICY_V1

R14 define una policy separada del module graph para cualquier capability capaz de crear, compilar, cargar, iniciar o delegar comportamiento ejecutable.

EXECUTION_SURFACE_POLICY_V1 contiene conceptualmente:

executionSurfacePolicyId.
capabilityDomain.
surfaceBindings.
defaultDisposition.
enforcementBinding.

defaultDisposition = FORBIDDEN.

Cada surface binding debe declarar:

surfaceId.
surfaceClass.
disposition.
allowedTargets or null.
verificationRule.
failureCode.

## 4. Clases de execution surface

La policy del runtime seleccionado debe clasificar explícitamente, cuando existan:

DYNAMIC_CODE_EVALUATION.
RUNTIME_VM_OR_ISOLATE.
BYTECODE_OR_WASM_EXECUTION.
WORKER_OR_THREAD_EXECUTION.
SUBPROCESS_OR_SHELL_EXECUTION.
NATIVE_OR_FFI_EXECUTION.
CUSTOM_LOADER_OR_PLUGIN_EXECUTION.
DATA_TO_CODE_COMPILATION.
SECONDARY_RUNTIME_LAUNCH.

La taxonomía concreta puede ampliarse para el runtime elegido, pero ninguna clase material puede quedar implícita.

## 5. Disposiciones de execution surface

Cada surface solo puede ser:

FORBIDDEN.
BOUND_AND_VERIFIED.
ALLOWED_NON_EXECUTING.

FORBIDDEN significa que la capability no puede invocarse.

BOUND_AND_VERIFIED significa que cualquier código/worker/subprocess/native target resultante debe estar identificado antes de ejecución y ligado al EXECUTABLE_DEPENDENCY_CLOSURE autorizado.

ALLOWED_NON_EXECUTING solo aplica a APIs que puedan compartir namespace con mecanismos de ejecución pero que, bajo la policy fijada, no crean ni cargan comportamiento ejecutable.

No existe disposition implícita ALLOW.

## 6. Dynamic code generation

La ejecución desde strings/bytes generados en runtime queda FORBIDDEN por defecto.

Si un runtime futuro necesitara una excepción BOUND_AND_VERIFIED, debe demostrar antes de ejecutar:

exact code bytes or equivalent executable identity.
authorized producer/path.
content digest.
authorized target identity.
closure membership.

Datos provenientes de model/provider no pueden convertirse directamente en código ejecutable.

## 7. Workers, subprocesses y runtimes secundarios

Worker/thread/subprocess/secondary-runtime creation queda FORBIDDEN salvo binding explícito.

Si se autoriza:

- exact entrypoint debe pertenecer al executable closure;
- runtime/toolchain identity debe estar ligado;
- semantic-input y execution-surface policies se heredan o se fijan explícitamente para el child domain;
- no se permite heredar ambient capabilities no declaradas;
- stdout/stderr/IPC no se convierten por sí solos en autoridad.

Un child runtime fuera de este contrato produce EXECUTION_SURFACE_TARGET_UNBOUND.

## 8. Native/FFI y binary execution

Native/FFI execution solo puede ser BOUND_AND_VERIFIED si el binary/native dependency ya está dentro de nativeDependencyBindings con digest, ABI/platform/runtime constraints y authorized call surface.

No se permite resolver binaries desde PATH u otra búsqueda ambiental no vinculada.

## 9. Enforcement de execution surfaces

La enforcement debe ocurrir antes de que el surface produzca ejecución.

Secuencia normativa:

request capability
→ identify capability domain + surfaceId
→ load trusted EXECUTION_SURFACE_POLICY_V1
→ require declared binding
→ if FORBIDDEN: fail before execution
→ if BOUND_AND_VERIFIED: verify exact target + closure membership
→ execute only after PASS.

Un log posterior no sustituye enforcement previo.

## 10. Capability domains

R14 congela tres dominios lógicos:

RESOLVER_ORCHESTRATOR_DOMAIN.
PROVIDER_TRANSPORT_DOMAIN.
AGENT_MODEL_CONTEXT_DOMAIN.

Cada dominio posee una execution-surface policy y una semantic-input policy propias.

No se infieren capabilities por pertenecer al mismo proceso físico.

## 11. Resolver/orchestrator execution policy

RESOLVER_ORCHESTRATOR_DOMAIN debe operar con default deny.

Por diseño, salvo decisión posterior explícita:

- dynamic code generation = FORBIDDEN;
- secondary runtime/subprocess = FORBIDDEN;
- unbound native/FFI = FORBIDDEN;
- unbound worker/thread execution = FORBIDDEN;
- custom loaders/plugins fuera del executable closure = FORBIDDEN.

El propósito es que canonicalizer, materializer, parser, evidence verifier y E5 compatibility logic ejecuten únicamente código incluido en el runtime snapshot autorizado.

## 12. Provider transport execution policy

PROVIDER_TRANSPORT_DOMAIN también usa default deny.

Puede ejecutar únicamente el transport implementation, SDK/runtime dependencies y mechanisms explícitamente incluidos en su executable closure.

No puede usar model/provider output para seleccionar nuevos executable targets.

No puede invocar E5.1/E5.2/E5.3 ni abrir una ruta de escritura durable por execution-surface side effects.

## 13. Agent/model context execution policy

AGENT_MODEL_CONTEXT_DOMAIN no posee capabilities locales de ejecución Árboris.

Su salida se trata como DATA.

No puede cargar módulos, lanzar procesos, acceder al filesystem, activar loaders ni crear código ejecutable dentro del runtime local.

Provider-side behavior fuera del boundary observable permanece como provider limitation y no se presenta como capability local de Árboris.

## 14. R13-N2 — SEMANTIC_INPUT_CLOSURE_V1

R14 define una policy separada para todo input no ejecutable capaz de cambiar comportamiento o evidencia.

SEMANTIC_INPUT_CLOSURE_V1 contiene conceptualmente:

semanticInputClosureId.
capabilityDomain.
channelBindings.
defaultDisposition.
enforcementBinding.

defaultDisposition = FORBIDDEN.

Cada channel binding declara:

channelId.
channelClass.
disposition.
valueBinding or policyBinding.
measurementPoint.
failureCode.

## 15. Disposiciones de semantic input

Cada canal solo puede ser:

FORBIDDEN.
FIXED_AND_BOUND.
EXPLICIT_RUNTIME_INPUT.
PROVIDER_TRANSPORT_AUTHORIZED.
ALLOWED_NON_SEMANTIC.

FORBIDDEN: no puede ser leído.

FIXED_AND_BOUND: valor exacto/digest/policy queda dentro del runtime snapshot.

EXPLICIT_RUNTIME_INPUT: el valor entra por una interface explícita, bounded, provenance-bound y queda incluido en INPUT_BINDING cuando afecta el intento.

PROVIDER_TRANSPORT_AUTHORIZED: reservado a canales externos necesarios para el provider transport y gobernados por endpoint/network/security policies específicas.

ALLOWED_NON_SEMANTIC: permitido solo si existe evidencia de que no altera decisiones, hashes, requests, parsing, repairs ni claims; su uso no puede convertirse luego en semantic authority.

## 16. Clases mínimas de semantic input

La policy del runtime debe clasificar cuando existan:

FILESYSTEM_RESOURCE.
PROCESS_ENVIRONMENT.
CURRENT_WORKING_DIRECTORY.
PROCESS_ARGUMENTS.
SYSTEM_TIME.
TIMEZONE_LOCALE.
RANDOMNESS_SOURCE.
SYSTEM_IDENTITY_METADATA.
NETWORK_ENDPOINT.
NAME_RESOLUTION.
TLS_TRUST_CONFIGURATION.
PROXY_CONFIGURATION.
IPC_OR_OS_SERVICE.
TEMP_OR_CACHE_STATE.

La taxonomía puede ampliarse según runtime/provider.

## 17. Resolver/orchestrator semantic-input closure

RESOLVER_ORCHESTRATOR_DOMAIN no puede depender de semantic ambient state no declarado.

Requisitos:

- repository/config/schema resources consumidos son verified artifacts o EXPLICIT_RUNTIME_INPUT;
- cwd/argv/env que afecten resolución o comportamiento son FIXED_AND_BOUND o FORBIDDEN;
- system time no participa en hashes, authority, repair decisions ni deterministic reconstruction salvo binding explícito;
- randomness no participa en authoritative IDs/hashes/decisions salvo policy explícita;
- network access = FORBIDDEN;
- OS/user/hostname metadata = FORBIDDEN salvo necesidad explícita no-semántica;
- temp/cache state no puede alterar resultados lógicos; si se usa para performance, debe ser disposable/non-authoritative.

## 18. Provider transport semantic-input closure

PROVIDER_TRANSPORT_DOMAIN solo puede usar semantic external inputs necesarios y autorizados para la invocación.

Network channels deben ser PROVIDER_TRANSPORT_AUTHORIZED y quedar ligados a:

provider endpoint policy.
name-resolution policy.
TLS trust policy.
proxy policy.
timeout/retry policy.
secret-broker policy.

El transport no puede usar network destinations, DNS/proxy overrides o trust stores fuera de esas policies.

Repo/filesystem reads continúan prohibidos salvo artefactos ya materializados dentro del package autorizado.

Secret values no entran a logical artifacts; su uso queda limitado al secret-broker boundary autorizado.

## 19. Agent/model semantic inputs

AGENT_MODEL_CONTEXT_DOMAIN recibe exclusivamente los mensajes/materiales ya autorizados por TRANSPORT_INVOCATION_PACKAGE y las provider features expresamente vinculadas.

No recibe ambient local filesystem/process/environment state.

Provider-hidden context continúa como OPEN_LIMITATION y no se presenta como input Árboris observado.

## 20. Time y randomness

R14 distingue semantic use de observability-only use.

Si timestamps o randomness se usan solo para logging/telemetry:

- deben clasificarse ALLOWED_NON_SEMANTIC;
- no pueden entrar en canonical digests que pretendan reproducibilidad semántica, salvo que el contrato los incluya explícitamente;
- no pueden influir PATCH/ABSTAIN, authority selection, repair scope, E5 bindings ni evidence status.

Si influyen comportamiento, deben convertirse en FIXED_AND_BOUND o EXPLICIT_RUNTIME_INPUT.

## 21. Filesystem y cache semantics

Cualquier archivo leído después del bootstrap debe pertenecer a una de estas categorías:

VERIFIED_ARTIFACT.
EXPLICIT_RUNTIME_INPUT.
FORBIDDEN.

No existe categoría “ambient file”.

Caches/temp files pueden existir solo si su ausencia, corrupción o contenido no altera el resultado lógico. De lo contrario deben pasar a FIXED_AND_BOUND/EXPLICIT_RUNTIME_INPUT.

## 22. Network semantics

Fuera de PROVIDER_TRANSPORT_DOMAIN, network access es FORBIDDEN por diseño R14.

Dentro de PROVIDER_TRANSPORT_DOMAIN, cada conexión debe concordar con provider endpoint policy y semantic-input closure.

Redirects, name resolution, proxy and TLS trust behavior siguen sujetos a los bindings específicos ya definidos; ningún redirect o alternate endpoint crea autoridad nueva.

## 23. Capability enforcement boundary

EXECUTION_SURFACE_POLICY_V1 y SEMANTIC_INPUT_CLOSURE_V1 deben ser enforceables antes del acceso, no meramente audit logs posteriores.

La futura implementación puede usar process isolation, sandboxing, wrappers/capability objects, restricted loaders u otro mecanismo equivalente.

La tecnología concreta permanece OPEN.

Pero el contrato exige:

undeclared execution surface → denied before execution.
undeclared semantic input → denied before use.

## 24. INTEGRATION_RUNTIME_SNAPSHOT_V3

V3 reemplaza V2 y añade:

executableDependencyClosureDigest.
executionSurfacePolicyDigest.
semanticInputClosureDigest.
runtimeBuiltinBindingDigest.
environmentInputPolicyDigest.
resolutionPolicyDigest.
verifiedArtifactHandles.

El snapshot se sella antes de ejecutar la lógica de integración.

Un cambio en cualquiera de estas policies invalida el intento y cualquier IMPLEMENTATION_ASSURANCE previa que no cubra el nuevo digest.

## 25. Assurance scope R14

ASSURANCE_ATTESTATION_V2 evoluciona V1 y debe ligar además:

testedExecutionSurfacePolicyDigest.
testedSemanticInputClosureDigest.
testedIntegrationRuntimeSnapshotDigest.
testedExecutableDependencyClosureDigest.

IMPLEMENTATION_ASSURANCE solo es válida si esos digests coinciden exactamente con el intento actual o una authority explícita demuestra compatibilidad.

Los tests de assurance deben incluir intentos negativos de usar surfaces e inputs no autorizados.

## 26. INPUT_BINDING_V9

V9 reemplaza V8 y agrega:

executionSurfacePolicyDigest.
semanticInputClosureDigest.

Conserva executableDependencyClosureDigest, assuranceProducerAuthorityBinding, assuranceVerificationPolicyBinding, integrationRuntimeSnapshotDigest y los bindings previos.

Estos fields son trace bindings y no seleccionan su propia authority.

## 27. Failure semantics añadidas

EXECUTION_SURFACE_FORBIDDEN.
EXECUTION_SURFACE_TARGET_UNBOUND.
EXECUTION_SURFACE_POLICY_MISMATCH.
SECONDARY_RUNTIME_UNBOUND.

SEMANTIC_INPUT_FORBIDDEN.
SEMANTIC_INPUT_UNBOUND.
SEMANTIC_INPUT_POLICY_MISMATCH.
FILESYSTEM_RESOURCE_UNBOUND.
PROCESS_STATE_UNBOUND.
NETWORK_POLICY_VIOLATION.
NON_SEMANTIC_INPUT_AFFECTED_RESULT.

Ninguna habilita retry automático.

## 28. OPEN preservados

execution-surface enforcement implementation.
semantic-input enforcement implementation.
sandbox/isolation technology.
executable closure implementation.
loader/resolver implementation.
exact runtime/toolchain selection.
exact allowed built-ins.
exact channel classifications.
exact provider network/DNS/TLS/proxy policies.
bootstrap deployment mechanism.
CANONICAL_JSON_NUMBER_POLICY.
CANONICAL_JSON_SHA256_V2 implementation.
trusted materializer/snapshot implementation.
assurance technology/producer identities/trust anchors.
assuranceValidityPolicy values.
provider/model/runtime.
hash-profile bridge A/B/C.
E5 compatibility proof/migration.
prototype-safe E5.1 repair application + tests.
minimal-change executable rule or authority-level revision.
exact numeric resource limits.
schemas concretos R14.
request projection.
response schema.
instruction artifacts.
generation parameters/provider features.
endpoint policy.
transport implementation.
strict parser implementation.
failure schema.
IDs.
observability.
implementation adversarial tests.
human implementation authorization.
NEXT_STAGE_ID.
AUTHORIZED_FOR_ASC.

## 29. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R14-ASC-001

AUTHORIZED SOURCES:
- branch head 3a7721265e3fe342299ae06afcd50fc81f4799f6
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- R13 design
- R13 directed regression
- E5.1/E5.2/E5.3 authorities

MANDATORY RELATIONS:
- module closure and execution-surface closure are distinct and both mandatory
- undeclared execution surfaces fail closed before execution
- semantic-input closure is explicit per capability domain
- undeclared semantic inputs fail closed before use
- resolver/orchestrator has no ambient network authority
- provider transport external access is restricted by bound provider policies
- agent/model context has no local execution or ambient local input authority
- runtime snapshot binds execution-surface and semantic-input policies
- assurance scope binds those same policies
- R12-N2 remains PASS
- all prior closures remain preserved
- implementation remains unauthorized

DO NOT INFER:
- closed import graph closes every execution surface
- authorized built-in implies unrestricted use of its semantic inputs
- logging time/randomness may influence authoritative behavior
- transport network capability authorizes arbitrary destinations
- provider hidden context is an Árboris-observed semantic input
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED:
- undeclared secondary execution
- ambient filesystem/network/process-state authority
- semantic dependence on inputs classified ALLOWED_NON_SEMANTIC
- model/provider data becoming executable code
- silent hash-profile migration
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA:
- R13-N1 execution surfaces closed by fail-closed policy
- R13-N2 semantic inputs closed per capability domain
- R12-N2 PASS preserved
- no previous blocker silently reopened
- implementation remains unauthorized

ASC compila restricciones; no decide sandbox technology, concrete runtime policies, provider, schemas ni implementación.

## 30. AUDITORÍA

R14 corrige R13-N1 separando module dependency closure de execution-surface closure y exigiendo default deny + pre-execution enforcement.

R14 corrige R13-N2 mediante SEMANTIC_INPUT_CLOSURE_V1 por capability domain, con default deny y bindings explícitos para inputs capaces de alterar comportamiento.

R12-N2 permanece preservado.

## 31. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

R14 no afirma que las policies ya estén implementadas ni que exista sandbox ejecutable.

Los OPEN correspondientes siguen bloqueando implementación.

## 32. VACÍOS / OMISIONES

Los OPEN de §28 permanecen declarados.

Faltan decisiones concretas de runtime, sandbox/enforcement, provider network policy, canonicalizer V2, bridge de hash hacia E5, prototype-safe E5.1 y minimalChangeRequired.

No se cierran por inferencia.

## 33. REDUNDANCIAS

Module dependency closure + execution-surface policy son intencionales: uno gobierna resolución/carga y el otro capacidades secundarias de ejecución.

Environment/semantic-input policy + provider endpoint policies son intencionales: uno gobierna canales de input por dominio y el otro parametriza el canal externo permitido al transport.

Runtime snapshot + assurance attestation son intencionales: describen el intento actual y el scope realmente probado.

E5 compatibility gate + E5.1/E5.2/E5.3 siguen siendo defensas distintas.

No crean autoridad paralela.

## 34. Resolución dirigida

R13-N1 = ADDRESSED.
R13-N2 = ADDRESSED.

ADDRESSED != regression PASS.

## 35. Gate

R14 authored → directed regression R13-N1/R13-N2 → accumulated regression completa → correct any new finding → design validation → explicit human implementation decision → only then consider executable changes.

Estado:
REPAIR_AGENT_INTEGRATION_DESIGN = R14_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
