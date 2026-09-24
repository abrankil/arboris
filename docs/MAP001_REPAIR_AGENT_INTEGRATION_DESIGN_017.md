# MAP-001 — Repair Agent Integration Design 017

Fecha: 2026-09-23
Estado: R17_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_016.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R16_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R16-N1, R16-N2 y R16-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R17 corrige exclusivamente:

R16-N1: sacar la expansión/materialización de eventos de observabilidad del dominio autoritativo y acotar el handoff mínimo.
R16-N2: separar credential lease capability privada de una identidad pública de binding no dereferenceable.
R16-N3: reemplazar el claim global exactly-once por una semántica explícita de live-session single-send, no-replay e outcome INDETERMINATE ante pérdida de sesión.

R17 es exclusivamente documental.

No implementa observability handoff, broker, lease capability, transport session, sandbox, loader, canonicalizer, E5.1, E5.2, E5.3, provider transport ni repair agent.

## 2. Invariantes heredados

OUTPUT_ONLY_OBSERVABILITY_CHANNEL_V1 sigue sin read-back lógico.
OBSERVABILITY_EFFECT_ISOLATION_V1 sigue obligatorio.
TWO-PHASE CREDENTIAL PREFLIGHT sigue siendo la única secuencia normativa de credential authorization.
Secret values permanecen fuera de logical artifacts/evidence/logs.
EXECUTABLE_DEPENDENCY_CLOSURE_V1 y EXECUTION_SURFACE_POLICY_V1 siguen obligatorios.
SEMANTIC_INPUT_CLOSURE_V2 sigue default deny.
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

## 3. R16-N1 — OBSERVABILITY_EVENT_HANDOFF_V1

R17 define una frontera previa a cualquier expansión/serialización de telemetry.

El dominio autoritativo no construye el evento final.

Produce únicamente un handoff mínimo, fijo y acotado:

OBSERVABILITY_EVENT_HANDOFF_V1 = {
  schemaVersion,
  authoritativeTransitionId,
  eventClassId,
  existingReferenceIdsOrDigests,
  boundedOutcomeCode,
  optionalFixedSizeCounters
}.

No contiene payloads arbitrarios, nested authoritative objects, provider bodies, model output, Repair objects ni estructuras cuya serialización requiera traversal no acotado.

## 4. Handoff construction budget

La creación del handoff dentro del authoritative domain debe cumplir un budget explícito:

- fixed schema;
- fixed maximum field count;
- fixed maximum encoded bytes;
- no recursive traversal;
- no dynamic pretty-printing;
- no filesystem/network reads;
- no sink lookup;
- no provider/broker lookup;
- no unbounded allocation;
- no exception propagation.

Si el handoff no puede construirse dentro del budget:

OBSERVABILITY_HANDOFF_DROPPED
→ authoritative transition remains unchanged.

## 5. Reference-only observability

Cuando observability necesite datos más ricos, el handoff solo puede transportar referencias/digests ya existentes y autorizados.

El isolated observability domain puede expandir información únicamente desde fuentes que estén expresamente permitidas para ese dominio.

No puede reabrir mutable authoritative state ni usar esas referencias para escribir de vuelta.

Si la expansión requiere un dato no disponible fuera del authoritative domain, ese dato no forma parte de output-only observability salvo que exista una copia bounded explícitamente diseñada para el handoff.

## 6. Critical-window exclusion

R17 define AUTHORIZATION_CRITICAL_WINDOW_V1.

Durante una ventana crítica que vincula una autorización temporal con una acción externa, no se ejecuta ningún handoff de observabilidad en el authoritative path.

Incluye al menos:

accepted credential preflight
→ expected envelope construction
→ provider-call authorization
→ provider-call gate
→ provider send attempt.

Los eventos de esa ventana se emiten solo después de que la ventana termine en uno de estos estados:

CALL_NOT_SENT.
CALL_SENT_OUTCOME_KNOWN.
CALL_SENT_OUTCOME_INDETERMINATE.

Así, telemetry no puede consumir tiempo ni recursos entre credential lease validation y provider send.

## 7. Isolated event materialization

La expansión/formatting/serialization del evento ocurre únicamente en el observability domain aislado:

minimal handoff
→ isolated materializer
→ bounded event
→ bounded queue/sink.

El isolated materializer tiene sus propios resource limits y no comparte mutable state con el authoritative core.

Un fallo de materialización equivale a pérdida de telemetry, no a fallo autoritativo.

## 8. No-authority property

OBSERVABILITY_EVENT_HANDOFF_V1 no es control-plane evidence.

No puede:

- autorizar provider call;
- autorizar Repair R1;
- modificar INPUT_BINDING;
- modificar E5 state;
- cambiar evidence claims;
- actuar como retry token;
- recuperar secrets.

Si un futuro evento fuese necesario para permitir una transición, debe diseñarse fuera de este canal como evidencia autoritativa explícita.

## 9. Assurance de event handoff

ASSURANCE_ATTESTATION_V5 debe cubrir:

- handoff creation within declared fixed budget;
- oversized/unavailable handoff drops without changing authoritative outcome;
- no recursive authoritative-object serialization in core;
- no handoff during AUTHORIZATION_CRITICAL_WINDOW_V1;
- isolated materialization failure cannot affect authoritative logic;
- enable/disable/congestion equivalence for the same bound authoritative inputs.

## 10. OBSERVABILITY_BOUNDARY_POLICY_V3

V3 reemplaza V2 y añade:

eventHandoffSchemaBinding.
eventHandoffBudgetBinding.
criticalWindowPolicyBinding.
isolatedMaterializationPolicyBinding.

Conserva publishMode=NON_BLOCKING, resource partitioning, drop, timeout, failure containment y scheduling isolation.

Su digest entra en INTEGRATION_RUNTIME_SNAPSHOT e INPUT_BINDING.

## 11. R16-N2 — separación capability vs binding identity

R17 elimina el uso ambiguo de credentialLeaseId.

Define dos entidades distintas.

### 11.1 CREDENTIAL_LEASE_CAPABILITY_V1

Capability privada al secret-broker/transport boundary.

Propiedades:

- puede autorizar dereference del secret material;
- nunca sale del broker/transport trusted boundary;
- nunca entra a resolver-visible logical artifacts;
- nunca entra a provider request envelope;
- nunca entra a receipt/log/telemetry/assurance report;
- no es derivable desde datos públicos del attempt.

### 11.2 CREDENTIAL_LEASE_BINDING_ID_V1

Identidad pública no secreta para correlación.

Propiedades:

- no puede usarse para recuperar secret material;
- no funciona como bearer credential;
- no permite reconstruir la capability privada;
- puede aparecer en preflight record, expected/actual envelope, call authorization package y receipt;
- identifica de forma inequívoca el lease/contexto que fue autorizado.

## 12. Broker lease binding proof

El broker/transport boundary debe demostrar internamente:

CREDENTIAL_LEASE_CAPABILITY_V1
↔ CREDENTIAL_LEASE_BINDING_ID_V1
↔ credentialSlotId
↔ credentialGenerationOrVersion
↔ credentialContextIdentity
↔ transportInvocationId.

El proof puede materializarse como evidencia no secreta provenance-bound, pero nunca revela la capability.

Si el broker solo expone un bearer handle, transport debe mantenerlo privado y derivar/obtener una identidad pública separada.

## 13. CREDENTIAL_PREFLIGHT_RECORD_V2

V2 reemplaza V1 y contiene:

schemaVersion.
transportInvocationId.
credentialLeaseBindingId.
providerCredentialContextPolicyDigest.
credentialContextEvidence.
credentialContextEvidenceDigest.
brokerPolicyDigest.
leaseValidityDescriptor.
preflightOutcome.

No contiene CREDENTIAL_LEASE_CAPABILITY_V1.

Resolver verifica únicamente la identidad pública + evidence autorizada.

## 14. Expected/actual provider envelope V5

EXPECTED_PROVIDER_REQUEST_ENVELOPE_V5 y ACTUAL_PROVIDER_REQUEST_ENVELOPE_V5 reemplazan V4.

Usan:

credentialLeaseBindingId.
providerCredentialContextPolicyDigest.
credentialContextEvidenceDigest.

No contienen la capability privada ni secret material.

Resolver conserva expected/actual deep equality antes del send.

## 15. Provider-call authorization V2

PROVIDER_CALL_AUTHORIZATION_PACKAGE_V2 reemplaza V1.

Incluye:

transportInvocationId.
transportSessionBindingId.
providerCallAuthorizationId.
credentialPreflightRecordDigest.
credentialLeaseBindingId.
expectedProviderRequestEnvelopeV5.
expectedProviderRequestEnvelopeDigestV5.
model/request/message/resource/endpoint/source bindings heredados.

La capability privada permanece únicamente dentro del transport/broker domain.

## 16. Private dereference gate

Antes del provider send, transport debe demostrar internamente:

accepted public credentialLeaseBindingId
→ exactly one private CREDENTIAL_LEASE_CAPABILITY_V1
→ same slot/generation/context/preflight
→ valid at send boundary.

Si no puede demostrarlo:

CREDENTIAL_LEASE_BINDING_CAPABILITY_MISMATCH
→ no send.

## 17. R16-N3 — scope real de la garantía de llamada

R17 elimina cualquier claim global de exactly-once provider invocation.

La garantía normativa pasa a ser:

AT_MOST_ONE_SEND_ATTEMPT_PER_LIVE_TRANSPORT_SESSION_AUTHORIZATION.

No se afirma crash-persistent exactly-once.

## 18. TRANSPORT_SESSION_V1

Cada instancia viva del transport que pueda enviar provider calls tiene:

transportSessionId.
transportSessionBindingId.
ephemeralSessionNonceOrSecret.
startedAtOrSequence.
runtimeSnapshotDigest.

El nonce/secret de sesión no se expone al resolver; transportSessionBindingId sí puede usarse para correlación.

Un restart crea una nueva sesión con un binding distinto.

## 19. PROVIDER_CALL_AUTHORIZATION_TOKEN_V1

Además del package público, transport crea o valida una capability/token de envío single-use ligado a:

transportSessionId.
providerCallAuthorizationId.
transportInvocationId.
credentialLeaseBindingId.
expectedProviderRequestEnvelopeDigestV5.

El token:

- solo es válido dentro de la sesión viva que lo creó/aceptó;
- se consume antes o atómicamente con el send attempt;
- no puede reutilizarse dentro de la misma sesión;
- no puede validarse en una sesión posterior;
- no se expone como bearer token al resolver.

## 20. Provider-call state machine

R17 define estados locales de sesión:

CALL_AUTHORIZED.
SEND_ATTEMPT_CONSUMED.
CALL_OUTCOME_KNOWN.
CALL_OUTCOME_INDETERMINATE.
CALL_NOT_SENT.

Transiciones normativas:

CALL_AUTHORIZED
→ validate package + lease binding
→ atomically consume single-use token
→ attempt provider send.

Si falla antes de iniciar send:

CALL_NOT_SENT.

Si el send se inicia y response/outcome se obtiene dentro de la misma live session:

CALL_OUTCOME_KNOWN.

Si el send pudo haber ocurrido pero la sesión se pierde antes de poder demostrar outcome:

CALL_OUTCOME_INDETERMINATE.

## 21. Session-loss rule

Al perderse TRANSPORT_SESSION_V1:

- todas las authorizations/tokens de esa sesión dejan de ser válidas;
- una nueva sesión no puede aceptar un authorization package viejo como send authority;
- no se reconstruye un token consumido desde transportInvocationId;
- un attempt con posible send y sin outcome comprobable queda terminalmente INDETERMINATE.

La memoria de ese estado no se presenta como durable global state; es la semántica del attempt cuando el resolver detecta pérdida/ausencia de outcome.

## 22. Replay handling

Si resolver reenvía accidentalmente el mismo PROVIDER_CALL_AUTHORIZATION_PACKAGE_V2 dentro de la misma sesión después de token consumption:

PROVIDER_CALL_AUTHORIZATION_REPLAY
→ no second send.

Si se presenta el package a otra sesión:

TRANSPORT_SESSION_BINDING_MISMATCH
→ no send.

El mismo package nunca autoriza un segundo provider send.

## 23. Crash before/after send

R17 distingue:

PRE_SEND_PROVEN_FAILURE:

transport demuestra que no comenzó el provider send.
Resultado = CALL_NOT_SENT.
No se reutiliza automáticamente el authorization package.

POSSIBLE_OR_CONFIRMED_SEND_WITHOUT_FINAL_OUTCOME:

Resultado = CALL_OUTCOME_INDETERMINATE.
No MODEL_RESPONSE aceptable.
No automatic retry.
No replay del authorization.

## 24. Fresh attempt after indeterminate outcome

R17 no autoriza automáticamente un nuevo provider call después de INDETERMINATE.

Un futuro fresh attempt requiere:

- una decisión/policy externa explícita que permita continuar;
- nuevo attempt identity;
- nuevo transportInvocationId;
- fresh credential preflight;
- fresh expected envelope;
- fresh provider-call authorization.

Esa decisión futura permanece OPEN.

Por tanto, R17 no convierte INDETERMINATE en retry.

## 25. Providers con idempotency keys

Si un provider futuro ofrece una idempotency primitive verificable, puede diseñarse una extensión separada.

No se infiere soporte actual.

Sin esa extensión, el claim permanece limitado a live-session single-send + no-replay de authorization.

## 26. Durable-boundary preservation

R17 no crea un durable transport store.

E5.3 permanece la única frontera durable autorizada.

La sesión de transport es efímera.

Una garantía crash-persistent más fuerte requeriría un diseño y autorización separados.

## 27. TRANSPORT_RECEIPT_V12

V12 reemplaza V11 y agrega:

transportSessionBindingId.
providerCallAuthorizationId.
providerCallState.
credentialLeaseBindingId.
credentialPreflightRecordDigest.
providerCredentialContextPolicyDigest.
credentialContextEvidenceDigest.
expectedProviderRequestEnvelopeDigestV5.
actualProviderRequestEnvelopeDigestV5.
credentialEvidenceClaims.

No incluye secret values, private lease capability ni private call token.

## 28. INPUT_BINDING_V12

V12 reemplaza V11 y agrega/actualiza:

observabilityBoundaryPolicyV3Digest.
credentialPreflightPolicyBinding.
providerCredentialContextPolicyDigest.
transportSessionPolicyBinding.
providerCallReplayPolicyBinding.

El concrete transportSessionBindingId y providerCallAuthorizationId pertenecen al provider-call authorization/attempt evidence, no al static preflight input binding anterior a creación de sesión.

## 29. INTEGRATION_RUNTIME_SNAPSHOT_V6

V6 reemplaza V5 y añade/actualiza:

observabilityBoundaryPolicyV3Digest.
observabilityEventHandoffPolicyDigest.
observabilityEffectIsolationPolicyDigest.
secretBrokerPolicyDigest.
credentialLeasePolicyDigest.
transportSessionPolicyDigest.
providerCallReplayPolicyDigest.

## 30. Assurance scope R17

ASSURANCE_ATTESTATION_V5 liga, además de lo heredado:

testedObservabilityBoundaryPolicyV3Digest.
testedObservabilityEventHandoffPolicyDigest.
testedCredentialLeaseCapabilityIsolationPolicyDigest.
testedTransportSessionPolicyDigest.
testedProviderCallReplayPolicyDigest.

Tests obligatorios incluyen:

- event handoff oversized/failure drops without authoritative effect;
- no handoff inside authorization critical window;
- public lease binding ID cannot dereference credential;
- private lease capability never appears in logical artifacts/logs;
- wrong capability↔binding association blocks send;
- replay same authorization in live session cannot send twice;
- authorization from old session rejected in new session;
- crash after possible send yields INDETERMINATE;
- INDETERMINATE never yields MODEL_RESPONSE acceptance or automatic retry;
- E5.3 remains sole durable boundary.

## 31. Failure semantics añadidas

OBSERVABILITY_HANDOFF_DROPPED.
OBSERVABILITY_HANDOFF_BUDGET_EXCEEDED.
OBSERVABILITY_CRITICAL_WINDOW_VIOLATION.

CREDENTIAL_LEASE_CAPABILITY_EXPOSURE.
CREDENTIAL_LEASE_BINDING_CAPABILITY_MISMATCH.
CREDENTIAL_LEASE_BINDING_NOT_PUBLIC_SAFE.

PROVIDER_CALL_AUTHORIZATION_REPLAY.
TRANSPORT_SESSION_BINDING_MISMATCH.
PROVIDER_CALL_OUTCOME_INDETERMINATE.
PROVIDER_CALL_TOKEN_ALREADY_CONSUMED.

Ninguna habilita retry automático.

## 32. OPEN preservados

observability handoff implementation.
observability isolation implementation.
observability budgets numeric values.
secret-broker implementation.
private lease capability/public binding implementation.
transport session implementation.
provider-call token implementation.
fresh-attempt policy after INDETERMINATE.
idempotency extension if provider supports it.
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
schemas concretos R17.
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

## 33. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R17-ASC-001

AUTHORIZED SOURCES:
- branch head 4f49b3a27b30e0b1dee315e29aae76792f46bf10
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- R16 design
- R16 directed regression
- prior expected/actual provider envelope contracts
- prior E5.1/E5.2/E5.3 authorities

MANDATORY RELATIONS:
- observability core handoff is minimal, bounded, no-throw and reference-only
- no observability handoff occurs inside credential-preflight-to-provider-send critical window
- public credential lease binding identity is distinct from private bearer capability
- private lease capability never enters logical artifacts
- provider call uses only capability associated with accepted public binding ID
- provider-call guarantee is scoped to live-session single-send, not crash-persistent exactly-once
- old-session authorization cannot be replayed in a new session
- possible send + lost outcome becomes INDETERMINATE
- INDETERMINATE cannot yield MODEL_RESPONSE acceptance or automatic retry
- E5.3 remains sole durable boundary
- prior closures remain preserved
- implementation remains unauthorized

DO NOT INFER:
- bounded sink delivery implies bounded event construction
- opaque handle is safe to expose
- public binding ID can retrieve credential material
- transportInvocationId alone prevents crash replay
- in-memory consumed flag proves crash-persistent exactly-once
- fresh attempt after INDETERMINATE is automatically allowed
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED:
- recursive/unbounded event construction in authoritative path
- telemetry handoff inside authorization critical window
- private credential capability in resolver-visible data/logs
- replay of provider-call authorization across sessions
- acceptance of MODEL_RESPONSE from INDETERMINATE attempt
- automatic retry after possible send
- silent hash-profile migration
- direct durable writes outside E5.3
- NEXT_STAGE_ID inference

VALIDATION CRITERIA:
- R16-N1 handoff/materialization boundary closes pre-publish observability effects
- R16-N2 private capability/public binding identity separation is explicit
- R16-N3 replay/crash/indeterminate semantics are scoped and compatible with E5.3-only durability
- all prior closures preserved
- implementation remains unauthorized

ASC compila restricciones; no decide IPC implementation, broker capability mechanism, session-token technology, fresh-attempt policy, provider, schemas ni implementación.

## 34. AUDITORÍA

R17 corrige R16-N1 al limitar el authoritative path a un handoff mínimo, fixed/bounded/no-throw y trasladar expansión/serialización al isolated observability domain.

R17 corrige R16-N2 separando CREDENTIAL_LEASE_CAPABILITY_V1 de CREDENTIAL_LEASE_BINDING_ID_V1.

R17 corrige R16-N3 eliminando el claim global exactly-once y sustituyéndolo por live-session single-send + no-replay + terminal INDETERMINATE cuando el outcome no puede probarse.

## 35. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

R17 mantiene explícitamente que E5.3 es la única frontera durable y no inventa persistencia para transport.

No afirma que el broker/runtime actual soporte capability/binding separation ni que exista transport-session enforcement implementado.

## 36. VACÍOS / OMISIONES

Los OPEN de §32 permanecen bloqueantes para implementación.

En particular siguen abiertos: implementaciones de handoff/isolation, capability/binding lease, session/replay control, fresh-attempt policy tras INDETERMINATE, canonicalizer V2, hash bridge hacia E5, prototype-safe E5.1 y minimalChangeRequired.

No se cierran por inferencia.

## 37. REDUNDANCIAS

Minimal event handoff + isolated observability delivery son intencionales: acotan trabajo en core y separan procesamiento/sink.

Private lease capability + public binding ID son intencionales: autoridad de uso y correlación verificable.

transportInvocationId + transportSessionBindingId + providerCallAuthorizationId son intencionales: identidad de attempt, sesión efímera y autorización concreta de send.

No crean autoridad paralela.

## 38. Resolución dirigida

R16-N1 = ADDRESSED.
R16-N2 = ADDRESSED.
R16-N3 = ADDRESSED.

ADDRESSED != regression PASS.

## 39. Gate

R17 authored → directed regression R16-N1/R16-N2/R16-N3 → accumulated regression completa → correct any new finding → design validation → explicit human implementation decision → only then consider executable changes.

Estado:
REPAIR_AGENT_INTEGRATION_DESIGN = R17_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
