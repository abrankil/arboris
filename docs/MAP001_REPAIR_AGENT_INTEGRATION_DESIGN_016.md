# MAP-001 — Repair Agent Integration Design 016

Fecha: 2026-09-23
Estado: R16_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_015.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R15_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R15-N1 y R15-N2
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R16 corrige exclusivamente:

R15-N1: aislar efectos temporales/de recursos del canal output-only de observabilidad.
R15-N2: congelar un único sequencing contract para credential preflight, expected provider envelope y provider call.

R16 adopta explícitamente el modelo A de la regresión R15:

TWO-PHASE CREDENTIAL PREFLIGHT.

R16 es exclusivamente documental.

No implementa observability process, IPC queue, secret broker, credential lease, sandbox, loader, canonicalizer, E5.1, E5.2, E5.3, provider transport ni repair agent.

## 2. Invariantes heredados

OUTPUT_ONLY_OBSERVABILITY_CHANNEL_V1 sigue sin read-back lógico.
SEMANTIC_INPUT_CLOSURE_V2 conserva únicamente FORBIDDEN, FIXED_AND_BOUND, EXPLICIT_RUNTIME_INPUT y PROVIDER_TRANSPORT_AUTHORIZED.
Secret values permanecen fuera de logical artifacts/evidence/logs.
EXECUTABLE_DEPENDENCY_CLOSURE_V1 y EXECUTION_SURFACE_POLICY_V1 siguen obligatorios.
VERIFIED_BYTES == CONSUMED_BYTES sigue obligatorio.
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

## 3. R15-N1 — OBSERVABILITY_EFFECT_ISOLATION_V1

R16 separa no-interferencia de datos de no-interferencia de efectos.

OBSERVABILITY_EFFECT_ISOLATION_V1 exige que el canal de observabilidad no pueda alterar resultados autoritativos mediante latencia, backpressure, recursos compartidos, exceptions o scheduling.

La propiedad se aplica al RESOLVER_ORCHESTRATOR_DOMAIN y al PROVIDER_TRANSPORT_DOMAIN.

## 4. Arquitectura de publicación

La arquitectura conceptual obligatoria es:

AUTHORITATIVE DOMAIN
→ build immutable bounded event from already-fixed outputs
→ NON_BLOCKING_OBSERVABILITY_PUBLISH_V1
→ isolated bounded delivery buffer/domain
→ sink.

El authoritative domain no espera delivery acknowledgement.

Sink delivery no forma parte de la transición autoritativa.

## 5. NON_BLOCKING_OBSERVABILITY_PUBLISH_V1

La operación de publicación debe cumplir:

- input event ya es immutable y bounded;
- publish no espera red, filesystem, remote sink ni flush;
- publish no espera espacio indefinidamente;
- queue full produce DROP_WITH_LOCAL_COUNTER o equivalente no autoritativo;
- sink unavailable produce DROP/UNAVAILABLE telemetry state fuera del flujo autoritativo;
- publish no puede lanzar exception hacia el caller autoritativo;
- publish no puede cambiar return value del paso observado;
- publish no habilita retry de provider ni E5.

La implementación concreta permanece OPEN.

## 6. Resource partitioning

El delivery domain de observabilidad debe tener recursos separados o presupuestos que impidan starvation del dominio autoritativo.

Debe existir policy para:

bounded queue capacity.
max event bytes.
max outstanding events.
max observability worker/process memory.
max observability file descriptors/sockets.
max observability CPU or scheduling budget cuando sea enforceable.
drop policy.
sink failure policy.

El core autoritativo no puede bloquear esperando liberar recursos del observability domain.

## 7. Timeout y cancellation semantics

R16 prohíbe que observability delivery consuma un timeout autoritativo.

Los timeout/cancellation budgets de operaciones autoritativas se miden únicamente dentro de la operación o fase a la que pertenecen.

Observability publish ocurre:

- después de fijar el resultado del paso observado; y
- fuera del intervalo medido para el siguiente provider/E5 operation.

No se permite un global wall-clock budget que incluya espera o backpressure de telemetry.

Si una future policy necesitara deadline global incluyendo observabilidad, esa observabilidad dejaría de ser no-semántica/output-only y requeriría un contrato autoritativo distinto.

## 8. Scheduling isolation

La implementación futura debe impedir que sink processing comparta un executor/thread pool cuya saturación pueda impedir progreso autoritativo.

Se admite:

- isolated process;
- isolated worker/executor con resource partitioning demostrable;
- kernel/IPC queue no bloqueante con consumer separado;
- mecanismo equivalente con assurance.

No se admite una callback síncrona al sink ni un await del sink dentro del authoritative path.

## 9. Failure containment

Unhandled sink exceptions, worker crashes o malformed sink responses no pueden unwinding ni terminar el authoritative domain.

Si el observability domain falla:

authoritative result remains fixed.
future authoritative work continues subject only to its own policies.
observability state may degrade to unavailable.
no provider retry.
no E5 rollback triggered solely by telemetry failure.

## 10. Ordering semantics

Observability event ordering no puede gobernar provider/E5 action ordering.

Los eventos pueden contener authoritative sequence IDs ya existentes para reconstrucción posterior, pero el authoritative flow no espera a que events sean delivered in order.

Un sink que reordena, duplica o pierde events no cambia el estado autoritativo.

Si un evento fuese requerido como durable audit evidence para permitir avance, debe salir de OUTPUT_ONLY_OBSERVABILITY_CHANNEL y diseñarse como evidence/control-plane artifact explícito.

## 11. Assurance de effect isolation

ASSURANCE_ATTESTATION_V4 debe cubrir para observabilidad, como mínimo:

- sink disabled vs enabled produce same authoritative outputs for same bound inputs;
- saturated queue does not alter authoritative result;
- sink unavailable/crashed does not alter authoritative result;
- slow sink does not consume provider/E5 timeout budget;
- observability worker resource exhaustion does not starve authoritative domain within declared platform scope;
- telemetry exceptions cannot propagate into authoritative logic;
- events cannot reorder provider/E5 actions.

La assurance debe estar ligada al exact observability policy/enforcement implementation y platform/runtime scope.

## 12. OBSERVABILITY_BOUNDARY_POLICY_V2

V2 reemplaza la policy previa y agrega:

publishMode = NON_BLOCKING.
resourcePartitionPolicyBinding.
queuePolicyBinding.
dropPolicyBinding.
timeoutIsolationPolicyBinding.
failureContainmentPolicyBinding.
schedulingIsolationPolicyBinding.

Su digest entra en INTEGRATION_RUNTIME_SNAPSHOT e INPUT_BINDING.

## 13. R15-N2 — selección del modelo TWO-PHASE CREDENTIAL PREFLIGHT

R16 congela un único orden normativo.

La selección efectiva de credential context ocurre antes de que resolver construya el expected provider request envelope definitivo.

El preflight puede interactuar con el secret broker, pero no puede realizar provider call.

## 14. CREDENTIAL_PREFLIGHT_REQUEST_V1

Resolver construye:

CREDENTIAL_PREFLIGHT_REQUEST_V1 = {
  schemaVersion,
  transportInvocationId,
  providerConfigurationId,
  providerCredentialContextPolicy,
  providerCredentialContextPolicyDigest,
  secretBrokerPolicyDigest
}.

No contiene secret values.

El request queda ligado al mismo transportInvocationId que la futura provider invocation.

## 15. Credential preflight transport authority

Durante preflight, transport puede exclusivamente:

- verificar CREDENTIAL_PREFLIGHT_REQUEST_V1;
- solicitar al broker exactamente authorizedCredentialSlotId;
- obtener non-secret credential context evidence;
- obtener o crear un credential lease/handle opaco;
- devolver CREDENTIAL_PREFLIGHT_RECORD_V1.

No puede:

- llamar al provider;
- cambiar providerConfigurationId;
- cambiar credential slot;
- construir Repair R1;
- ejecutar E5.1/E5.2/E5.3;
- exponer secret material.

## 16. CREDENTIAL_LEASE_V1

El broker/transport debe fijar un handle opaco que represente exactamente el contexto autorizado que pasó preflight.

Conceptualmente posee propiedades internas verificables:

credentialLeaseId.
credentialSlotId.
credentialGenerationOrVersion.
credentialContextIdentity.
transportInvocationId.
issuedForProviderConfigurationId.
issuedUnderBrokerPolicyDigest.
issuedAtOrSequence if required by broker contract.
expiry/validity boundary.
singleUseOrUsagePolicy.

El secret material no forma parte del record lógico compartido con resolver.

## 17. Lease immutability / dereference semantics

R16 exige:

- dereferencing the lease for provider call cannot silently resolve a different credential generation/context;
- if broker rotation invalidates the pinned context, provider call fails before sending;
- lease cannot be rebound to another slot/account/project/tenant;
- lease cannot be reused outside its transportInvocationId/usage policy;
- expired/revoked lease requires fresh preflight;
- provider call uses the exact lease that produced the accepted preflight evidence.

Si el broker no puede proporcionar una primitiva con estas propiedades, TWO-PHASE CREDENTIAL PREFLIGHT no puede implementarse con ese broker/runtime.

## 18. CREDENTIAL_PREFLIGHT_RECORD_V1

Transport devuelve a resolver:

CREDENTIAL_PREFLIGHT_RECORD_V1 = {
  schemaVersion,
  transportInvocationId,
  credentialLeaseId,
  providerCredentialContextPolicyDigest,
  credentialContextEvidence,
  credentialContextEvidenceDigest,
  brokerPolicyDigest,
  leaseValidityDescriptor,
  preflightOutcome
}.

credentialContextEvidence usa PROVIDER_CREDENTIAL_CONTEXT_EVIDENCE_V1 y no contiene secret.

Resolver verifica structure, digests, evidence claims, slot/scope/rotation semantics y policy match.

## 19. Preflight failure

Si CREDENTIAL_PREFLIGHT_RECORD_V1 no satisface policy:

credential lease is cancelled/released if possible.
no expected provider envelope is authorized.
no provider call.
no automatic retry.

Un fresh attempt requiere nuevo transportInvocationId salvo que una policy futura defina de forma explícita una semántica distinta.

## 20. EXPECTED_PROVIDER_REQUEST_ENVELOPE_V4

Solo después de aceptar CREDENTIAL_PREFLIGHT_RECORD_V1, resolver construye:

EXPECTED_PROVIDER_REQUEST_ENVELOPE_V4.

V4 contiene todos los campos semánticos previos del provider request envelope y además:

providerCredentialContextPolicyDigest.
credentialContextEvidenceDigest.
credentialLeaseId.

No contiene secret value.

Ahora todos estos fields son conocibles por resolver antes de la provider call.

## 21. expectedProviderRequestEnvelopeDigest V4

Resolver calcula:

expectedProviderRequestEnvelopeDigestV4
= CANONICAL_JSON_SHA256_V2(EXPECTED_PROVIDER_REQUEST_ENVELOPE_V4).

El digest se incorpora al provider-call authorization package.

La semántica de expected/actual deep equality de R7 se preserva para el envelope V4.

## 22. PROVIDER_CALL_AUTHORIZATION_PACKAGE_V1

Después del preflight aceptado, resolver construye:

PROVIDER_CALL_AUTHORIZATION_PACKAGE_V1 = {
  schemaVersion,
  transportInvocationId,
  credentialPreflightRecordDigest,
  credentialLeaseId,
  expectedProviderRequestEnvelope,
  expectedProviderRequestEnvelopeDigest,
  model/request/message/resource/endpoint/source bindings requeridos
}.

Este package es la única autorización para que transport realice la provider call.

## 23. Provider-call gate

Antes de enviar:

1. transport verifica PROVIDER_CALL_AUTHORIZATION_PACKAGE_V1;
2. verifica transportInvocationId y credentialLeaseId exactos;
3. verifica que lease sigue válido y corresponde al same preflight context;
4. reconstruye ACTUAL_PROVIDER_REQUEST_ENVELOPE_V4;
5. exige actual digest == expected digest;
6. exige deep-logical-equals actual/expected;
7. dereferencia el mismo lease sin permitir context drift;
8. realiza exactamente una provider invocation.

Cualquier mismatch → no provider call → fail closed.

## 24. Preflight-to-call TOCTOU

R16 introduce:

CREDENTIAL_PREFLIGHT_CALL_BINDING_V1.

Debe demostrar que:

accepted preflight evidence
→ credentialLeaseId
→ exact context/generation
→ actual secret material used by call

permanecen ligados durante toda la transición.

No es suficiente comprobar el slot ID y volver a pedir “current secret” en el call.

El broker/runtime debe proporcionar pinning/lease semantics o equivalente.

## 25. Exactly-one-provider-call semantics

Credential preflight no cuenta como provider invocation.

Para cada transportInvocationId autorizado:

credential preflight calls to broker = bounded by preflight policy.
provider invocation = exactly one maximum.

Si provider call falla después de enviar, automatic retry permanece 0.

Un nuevo intento requiere un nuevo attempt/transportInvocationId y fresh bindings.

## 26. INPUT_BINDING_V11

V11 reemplaza V10 y agrega:

observabilityBoundaryPolicyV2Digest.
credentialPreflightPolicyBinding.
providerCredentialContextPolicyDigest.

El expectedProviderRequestEnvelopeDigest se incorpora únicamente después de preflight aceptado en el provider-call authorization binding asociado al mismo attempt.

El diseño debe distinguir preflight binding de call authorization binding para no fingir que el expected envelope existía antes de conocer credential evidence.

## 27. TRANSPORT_RECEIPT_V11

V11 agrega:

credentialPreflightRecordDigest.
credentialLeaseId.
providerCredentialContextPolicyDigest.
credentialContextEvidenceDigest.
expectedProviderRequestEnvelopeDigestV4.
actualProviderRequestEnvelopeDigestV4.
credentialEvidenceClaims.

No incluye secret values.

Resolver verifica estos campos antes de aceptar MODEL_RESPONSE.

## 28. INTEGRATION_RUNTIME_SNAPSHOT_V5

V5 reemplaza V4 y añade/actualiza:

observabilityBoundaryPolicyV2Digest.
observabilityEffectIsolationPolicyDigest.
secretBrokerPolicyDigest.
credentialLeasePolicyDigest.

El credentialLeaseId concreto pertenece al attempt/preflight record, no al runtime snapshot global.

## 29. Assurance scope R16

ASSURANCE_ATTESTATION_V4 liga, además de lo heredado:

testedObservabilityBoundaryPolicyV2Digest.
testedObservabilityEffectIsolationPolicyDigest.
testedCredentialPreflightPolicyDigest.
testedCredentialLeasePolicyDigest.

Los tests deben incluir:

- sink saturation/failure/latency no altera authoritative outcome;
- observability resource exhaustion no consume authoritative budgets dentro del platform scope probado;
- provider call impossible before accepted preflight;
- preflight cannot call provider;
- changed/expired/rebound lease rejected;
- credential rotation between preflight and call cannot change context silently;
- actual V4 envelope exactly equals resolver expected V4 envelope;
- exactly one provider invocation maximum per authorized transportInvocationId;
- no secret value exposure.

## 30. Failure semantics añadidas

OBSERVABILITY_BACKPRESSURE_ISOLATION_FAILED.
OBSERVABILITY_RESOURCE_ISOLATION_FAILED.
OBSERVABILITY_TIMEOUT_INTERFERENCE.
OBSERVABILITY_SCHEDULING_INTERFERENCE.

CREDENTIAL_PREFLIGHT_INVALID.
CREDENTIAL_PREFLIGHT_POLICY_MISMATCH.
CREDENTIAL_LEASE_INVALID.
CREDENTIAL_LEASE_EXPIRED.
CREDENTIAL_LEASE_REBOUND.
CREDENTIAL_PREFLIGHT_CALL_BINDING_MISMATCH.
PROVIDER_CALL_WITHOUT_PREFLIGHT.
PROVIDER_CALL_AUTHORIZATION_MISMATCH.
PROVIDER_INVOCATION_ALREADY_CONSUMED.

Ninguna habilita retry automático.

## 31. OPEN preservados

observability isolation implementation.
observability queue/process technology.
resource partition numeric values.
secret-broker implementation.
credential lease implementation/support.
credential preflight implementation.
provider-specific credential scope observability.
credential rotation concrete policy.
execution-surface enforcement implementation.
semantic-input enforcement implementation.
sandbox/isolation technology.
executable closure implementation.
loader/resolver implementation.
exact runtime/toolchain selection.
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
schemas concretos R16.
request projection.
response schema.
instruction artifacts.
generation parameters/provider features.
endpoint policy.
transport implementation.
strict parser implementation.
failure schema.
IDs.
implementation adversarial tests.
human implementation authorization.
NEXT_STAGE_ID.
AUTHORIZED_FOR_ASC.

## 32. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R16-ASC-001

AUTHORIZED SOURCES:
- branch head 3c42b4c6c76e55139e9641bb9fcde033617dfa98
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- R15 design
- R15 directed regression
- prior expected/actual provider envelope contract from R7
- prior credential-context contract from R15
- E5.1/E5.2/E5.3 authorities

MANDATORY RELATIONS:
- observability has both data-flow isolation and timing/resource effect isolation
- observability delivery cannot consume authoritative timeout/cancellation budgets
- output sink cannot block or starve authoritative domain
- credential context is resolved in a preflight before expected provider envelope V4 is built
- preflight cannot call provider
- resolver verifies preflight before provider-call authorization
- expected V4 envelope includes the now-known credential evidence digest and lease ID
- actual V4 envelope must equal resolver expected V4 envelope before provider call
- provider call uses the exact pinned lease/context accepted in preflight
- provider invocation maximum remains exactly one per authorized attempt
- no secret value enters logical artifacts
- prior closures remain preserved
- implementation remains unauthorized

DO NOT INFER:
- output-only data flow alone proves effect isolation
- non-blocking label alone proves resource isolation
- credential slot ID alone pins the secret generation actually used
- a fresh broker lookup after preflight is equivalent to a pinned lease
- preflight is a provider invocation
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED:
- synchronous/awaited sink delivery in authoritative path
- sink backpressure affecting provider/E5 timeout semantics
- provider call before accepted credential preflight
- rebuilding credential context from ambient broker state at call time
- transport substitution of lease/slot/context
- secret value exposure
- silent hash-profile migration
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA:
- R15-N1 observability effects isolated from authoritative behavior
- R15-N2 one coherent preflight → expected envelope → provider call sequence
- R14 corrections preserved
- all prior closures preserved
- implementation remains unauthorized

ASC compila restricciones; no decide queue/process technology, broker/lease implementation, provider, schemas ni implementación.

## 33. AUDITORÍA

R16 corrige R15-N1 agregando effect isolation: no bloqueo, resource partitioning, timeout isolation, scheduling isolation y failure containment.

R16 corrige R15-N2 eligiendo TWO-PHASE CREDENTIAL PREFLIGHT y haciendo que resolver construya el expected provider envelope V4 solo después de conocer y validar credentialContextEvidenceDigest + credentialLeaseId.

La igualdad expected/actual previa al provider call queda preservada.

## 34. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

R16 elimina la contradicción temporal de R15 al distinguir preflight y provider-call authorization.

No afirma que el broker actual soporte leases ni que exista aislamiento ejecutable de observabilidad.

## 35. VACÍOS / OMISIONES

Los OPEN de §31 permanecen bloqueantes para implementación.

En particular siguen fuera de cierre: tecnología de observability isolation, soporte real de credential lease/preflight, sandbox/enforcement, canonicalizer V2, hash bridge hacia E5, prototype-safe E5.1 y minimalChangeRequired.

No se cierran por inferencia.

## 36. REDUNDANCIAS

Output-only observability + effect isolation son intencionales: una controla flujo de datos y la otra efectos temporales/de recursos.

Credential preflight record + expected provider envelope + call authorization package son intencionales: evidencia de contexto, expectativa resolver-owned y permiso concreto de llamada.

Credential lease ID + non-secret context evidence son intencionales: pin operativo del material y evidencia lógica verificable.

No crean autoridad paralela.

## 37. Resolución dirigida

R15-N1 = ADDRESSED.
R15-N2 = ADDRESSED.

ADDRESSED != regression PASS.

## 38. Gate

R16 authored → directed regression R15-N1/R15-N2 → accumulated regression completa → correct any new finding → design validation → explicit human implementation decision → only then consider executable changes.

Estado:
REPAIR_AGENT_INTEGRATION_DESIGN = R16_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
