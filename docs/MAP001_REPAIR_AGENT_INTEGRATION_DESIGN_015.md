# MAP-001 — Repair Agent Integration Design 015

Fecha: 2026-09-23
Estado: R15_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_014.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R14_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R14-N1 y R14-N2
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R15 corrige exclusivamente:

R14-N1: eliminar la ambigüedad de ALLOWED_NON_SEMANTIC como input y convertir observabilidad en un canal estrictamente output-only.
R14-N2: ligar el credential/account/project/tenant context del provider sin exponer secret values.

R15 es exclusivamente documental.

No implementa secret broker, observability sink, sandbox, loader, canonicalizer, E5.1, E5.2, E5.3, transport, provider ni repair agent.

## 2. Invariantes heredados

EXECUTABLE_DEPENDENCY_CLOSURE_V1 y EXECUTION_SURFACE_POLICY_V1 siguen obligatorios.
SEMANTIC_INPUT_CLOSURE continúa por capability domain y default deny.
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

## 3. R14-N1 — eliminación de ALLOWED_NON_SEMANTIC como input

R15 elimina ALLOWED_NON_SEMANTIC de las disposiciones válidas de SEMANTIC_INPUT_CLOSURE.

Un valor leído por lógica autoritativa es, por definición, un input semántico potencial y debe clasificarse como:

FORBIDDEN.
FIXED_AND_BOUND.
EXPLICIT_RUNTIME_INPUT.
PROVIDER_TRANSPORT_AUTHORIZED.

No existe una quinta clase que permita leer un valor y luego confiar solo en que “no influirá”.

## 4. OUTPUT_ONLY_OBSERVABILITY_CHANNEL_V1

Observabilidad, logging y telemetry se modelan fuera del input path autoritativo.

OUTPUT_ONLY_OBSERVABILITY_CHANNEL_V1 es una frontera unidireccional:

AUTHORITATIVE LOGIC
→ immutable observation event
→ observability sink.

No existe canal de retorno desde el sink hacia resolver, transport decision logic, hashing, parser, Repair R1, E5 bindings ni evidence-claim derivation.

## 5. Propiedad de no-interferencia

R15 define:

OBSERVABILITY_NON_INTERFERENCE_V1.

Propiedades obligatorias:

- authoritative computation no recibe clock/random/telemetry metadata para producir su resultado lógico;
- telemetry metadata se agrega después de que el resultado autoritativo del paso ya está fijado;
- sink return values no se leen;
- sink exceptions/failures no pueden modificar el resultado autoritativo;
- sink state no puede ser consultado por el flujo de integración;
- observability cannot select authorities, policies, provider configuration, repair scope, hashes or evidence status;
- event emission no crea una ruta de escritura durable hacia E5 state.

La implementación concreta permanece OPEN.

## 6. Timestamps y randomness para observabilidad

Si timestamps, monotonic timing, correlation randomness u otra metadata se usan solo para observabilidad:

- se generan en el observability boundary o después de fijar el resultado autoritativo;
- no forman parte de INPUT_BINDING ni de logical digests semánticos, salvo contrato explícito separado;
- no pueden alimentar nuevamente el core autoritativo;
- no se usan para decidir PATCH/ABSTAIN, autoridad, retries, scope, hashes ni validación.

Si un valor temporal o aleatorio debe influir comportamiento, deja de ser observability metadata y pasa a FIXED_AND_BOUND o EXPLICIT_RUNTIME_INPUT.

## 7. Event materialization

Cada evento de observabilidad se construye únicamente desde:

- outputs ya calculados;
- identifiers/digests ya existentes;
- metadata generada en el output-only boundary.

El evento no puede forzar una relectura de filesystem, environment, provider state ni otros semantic inputs.

No se permite que instrumentation wrappers alteren argumentos, return values o exceptions del flujo autoritativo.

## 8. Failure semantics de observabilidad

Un fallo del sink produce únicamente una condición de observabilidad separada, por ejemplo OBSERVABILITY_DELIVERY_FAILED.

No modifica el resultado lógico ya calculado ni habilita retry automático del provider.

Si en un futuro una observabilidad específica fuese requerida como precondición de seguridad, dejaría de pertenecer a OUTPUT_ONLY_OBSERVABILITY_CHANNEL_V1 y debería diseñarse como evidencia autoritativa explícita.

## 9. Assurance de no-interferencia

La future assurance debe cubrir:

- absence of read-back path;
- unchanged authoritative outputs with sink enabled/disabled;
- sink failure does not alter logical result;
- timestamp/random metadata does not enter semantic digests;
- instrumentation cannot mutate authoritative arguments/results.

La policy digest de observabilidad se incorpora al runtime snapshot solo para demostrar la frontera, no como semantic input value.

## 10. SEMANTIC_INPUT_CLOSURE_V2

V2 reemplaza V1 y contiene únicamente cuatro disposiciones:

FORBIDDEN.
FIXED_AND_BOUND.
EXPLICIT_RUNTIME_INPUT.
PROVIDER_TRANSPORT_AUTHORIZED.

La observabilidad deja de formar parte del conjunto de input dispositions.

El default sigue siendo FORBIDDEN.

## 11. R14-N2 — PROVIDER_CREDENTIAL_CONTEXT_POLICY_V1

R15 separa secret value de credential context.

El secret value sigue fuera de logical artifacts.

Resolver define antes de la invocación una policy no secreta:

PROVIDER_CREDENTIAL_CONTEXT_POLICY_V1 = {
  schemaVersion,
  providerConfigurationId,
  secretBrokerPolicyBinding,
  authorizedCredentialSlotId,
  authorizedProviderAccountScope,
  authorizedProviderOrganizationScope,
  authorizedProviderProjectScope,
  authorizedProviderTenantScope,
  credentialRotationPolicy,
  requiredEvidencePolicy
}.

Los scope fields pueden ser exact values, bounded sets, null/NOT_APPLICABLE o NOT_OBSERVABLE según el provider/broker contract.

No contienen tokens, API keys, passwords ni secret material.

## 12. authorizedCredentialSlotId

authorizedCredentialSlotId identifica un slot/handle lógico no secreto dentro del secret broker autorizado.

Reglas:

- resolver selecciona el slot antes de transport;
- transport no puede sustituirlo;
- model/provider output no puede modificarlo;
- secret broker solo puede entregar material correspondiente a ese slot;
- el slot ID no es el secret value;
- rotar el secret dentro del mismo slot requiere cumplir credentialRotationPolicy.

## 13. credentialRotationPolicy

R15 distingue rotación compatible de cambio de contexto.

ROTATION_SAME_LOGICAL_CONTEXT puede autorizar una nueva generación secreta dentro del mismo slot si account/org/project/tenant semantics permanecen dentro del scope permitido.

ROTATION_REQUIRES_FRESH_ATTEMPT obliga a invalidar el intento si cambia generation/version o cualquier scope material.

ROTATION_FORBIDDEN prohíbe cambio durante el intento.

La policy exacta queda provider/broker-specific y OPEN.

Una rotación nunca autoriza cambio silencioso de account/project/tenant.

## 14. PROVIDER_CREDENTIAL_CONTEXT_EVIDENCE_V1

Antes de realizar la provider call, transport obtiene del secret-broker boundary evidencia no secreta equivalente a:

PROVIDER_CREDENTIAL_CONTEXT_EVIDENCE_V1 = {
  providerConfigurationId,
  credentialSlotId,
  credentialGenerationOrVersion,
  providerAccountScope,
  providerOrganizationScope,
  providerProjectScope,
  providerTenantScope,
  brokerPolicyDigest,
  evidenceClaims
}.

Los scope values solo se incluyen cuando son observables y autorizados para exposición no secreta.

evidenceClaims usa EVIDENCE_CLAIM_V2.

## 15. Evidence basis del credential context

R15 distingue dos niveles.

SECRET_BROKER_SLOT_CORRELATION puede ser VERIFIED + IMPLEMENTATION_ASSURANCE cuando la evidencia demuestra que el transport pidió exactamente authorizedCredentialSlotId al broker provenance-bound y el broker entregó el material asociado a ese slot.

PROVIDER_NATIVE_ACCOUNT_SCOPE solo puede ser VERIFIED + DIRECT_RUNTIME_EVIDENCE cuando provider/broker expone una identidad nativa verificable de account/org/project/tenant.

Si esa identidad nativa no es observable:

PROVIDER_NATIVE_ACCOUNT_SCOPE = NOT_OBSERVABLE + NOT_OBSERVABLE.

No se eleva a VERIFIED por inferencia desde el slot.

## 16. Pre-provider credential gate

Antes de construir/enviar la llamada:

1. resolver package fija PROVIDER_CREDENTIAL_CONTEXT_POLICY_V1;
2. transport verifica policy digest;
3. transport solicita exactamente authorizedCredentialSlotId al broker;
4. broker entrega secret material + non-secret evidence permitida;
5. transport verifica credential evidence contra policy;
6. verifica rotation policy;
7. verifica evidence strength requerida;
8. solo entonces usa el secret material para la provider invocation.

Si slot, generation, broker policy o scope material divergen:

PROVIDER_CREDENTIAL_CONTEXT_MISMATCH → no provider call → fail closed.

## 17. Secret non-disclosure

Secret material:

- no entra a PROVIDER_REQUEST_ENVELOPE logical representation;
- no entra a INPUT_BINDING;
- no entra a TRANSPORT_RECEIPT;
- no entra a observation record;
- no entra a logs/telemetry;
- no entra a assurance reports.

Solo non-secret context/evidence autorizada puede entrar a logical artifacts.

## 18. Provider request envelope binding

PROVIDER_REQUEST_ENVELOPE_V3 evoluciona el envelope lógico e incorpora:

providerCredentialContextPolicyDigest.
credentialContextEvidenceDigest.

No incorpora el secret.

Resolver puede verificar que la llamada fue autorizada bajo el credential context esperado sin recibir la credencial.

## 19. INPUT_BINDING_V10

V10 reemplaza V9 y agrega:

semanticInputClosureV2Digest.
observabilityBoundaryPolicyDigest.
providerCredentialContextPolicyDigest.

Conserva executionSurfacePolicyDigest, executableDependencyClosureDigest, integrationRuntimeSnapshotDigest, assurance bindings y los bindings previos.

credentialContextEvidenceDigest se incorpora al attempt/receipt evidence porque solo existe después de la selección efectiva del broker context.

## 20. TRANSPORT_RECEIPT_V10

V10 agrega:

providerCredentialContextPolicyDigest.
credentialContextEvidenceDigest.
credentialEvidenceClaims.

No incluye secret values.

Resolver verifica estos fields junto al provider request envelope, source binding y response evidence antes de aceptar MODEL_RESPONSE.

## 21. INTEGRATION_RUNTIME_SNAPSHOT_V4

V4 reemplaza V3 y añade:

semanticInputClosureV2Digest.
observabilityBoundaryPolicyDigest.
secretBrokerPolicyDigest.

La identity concreta del credential slot pertenece al invocation policy/input binding, no al runtime snapshot global, salvo que el deployment contract decida fijarla globalmente.

## 22. Assurance scope R15

ASSURANCE_ATTESTATION_V3 evoluciona V2 y liga:

testedSemanticInputClosureV2Digest.
testedObservabilityBoundaryPolicyDigest.
testedSecretBrokerPolicyDigest.

Los tests de assurance deben incluir:

- no read-back desde observability sink;
- sink failure no altera authoritative result;
- telemetry metadata no entra a semantic digests;
- unauthorized credential slot rejected;
- credential context mismatch fails before provider call;
- secret values never appear in logical artifacts/evidence.

## 23. Failure semantics añadidas

OBSERVABILITY_READBACK_FORBIDDEN.
OBSERVABILITY_AFFECTED_AUTHORITATIVE_RESULT.
OBSERVABILITY_DELIVERY_FAILED.
OBSERVABILITY_POLICY_MISMATCH.

PROVIDER_CREDENTIAL_SLOT_MISMATCH.
PROVIDER_CREDENTIAL_CONTEXT_MISMATCH.
PROVIDER_CREDENTIAL_ROTATION_POLICY_VIOLATION.
PROVIDER_CREDENTIAL_EVIDENCE_INSUFFICIENT.
PROVIDER_NATIVE_ACCOUNT_SCOPE_MISMATCH.
SECRET_VALUE_EXPOSURE_DETECTED.

Ninguna habilita retry automático.

## 24. OPEN preservados

observability isolation implementation.
secret-broker implementation.
secret-broker assurance evidence.
provider-specific credential scope observability.
credential rotation policy concrete values.
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
schemas concretos R15.
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

## 25. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R15-ASC-001

AUTHORIZED SOURCES:
- branch head a2409ff1a7a229107db2c36f22c7ca363d33f606
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- R14 design
- R14 directed regression
- prior provider/secret-broker contracts from R5/R6
- E5.1/E5.2/E5.3 authorities

MANDATORY RELATIONS:
- observability is output-only, not a semantic input class
- authoritative core cannot read back observability state
- if time/randomness influences behavior it must be bound as semantic input
- credential slot/context is selected before provider call
- transport cannot substitute credential slot
- secret value remains outside logical artifacts
- non-secret credential context evidence is bound to the attempt
- provider-native account identity is NOT_OBSERVABLE when unavailable
- R13-N1 remains PASS
- R12-N2 remains PASS
- prior closures remain preserved
- implementation remains unauthorized

DO NOT INFER:
- telemetry input can be harmless merely by label
- credential slot proves provider-native account identity
- secret rotation is semantically neutral without rotation policy
- providerConfigurationId alone proves credential context
- hidden provider account scope is observable
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED:
- ALLOWED_NON_SEMANTIC as an input disposition
- observability read-back into authoritative logic
- secret value in logical artifacts/evidence/logs
- transport-selected credential substitution
- provider-native VERIFIED claim without direct evidence
- silent hash-profile migration
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA:
- R14-N1 non-semantic observability is structurally isolated/output-only
- R14-N2 credential context is bound without exposing secret values
- prior closures preserved
- implementation remains unauthorized

ASC compila restricciones; no decide secret broker implementation, provider-specific scope visibility, rotation values, sandbox, schemas ni implementación.

## 26. AUDITORÍA

R15 corrige R14-N1 eliminando ALLOWED_NON_SEMANTIC del input contract y moviendo observabilidad a una frontera output-only sin read-back.

R15 corrige R14-N2 separando secret value de credential context y ligando slot/scope/rotation/evidence sin exponer la credencial.

R13-N1 y R12-N2 permanecen preservados.

## 27. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

R15 no afirma que observability isolation o secret-broker evidence ya estén implementados.

Los OPEN correspondientes siguen bloqueando implementación.

## 28. VACÍOS / OMISIONES

Los OPEN de §24 permanecen declarados.

Faltan decisiones concretas de secret broker/provider credential evidence, sandbox/enforcement, canonicalizer V2, bridge de hash hacia E5, prototype-safe E5.1 y minimalChangeRequired.

No se cierran por inferencia.

## 29. REDUNDANCIAS

ProviderConfigurationId + credential-context policy son intencionales: configuración semántica de provider y contexto de autenticación son bindings distintos salvo demostración futura de una única fuente de verdad.

Secret-broker policy + credential evidence también son intencionales: una gobierna qué broker/slot es válido y la otra registra qué contexto no secreto fue usado.

Semantic-input closure + observability output boundary son intencionales: una gobierna inputs y la otra saca telemetry fuera de ese conjunto.

No crean autoridad paralela.

## 30. Resolución dirigida

R14-N1 = ADDRESSED.
R14-N2 = ADDRESSED.

ADDRESSED != regression PASS.

## 31. Gate

R15 authored → directed regression R14-N1/R14-N2 → accumulated regression completa → correct any new finding → design validation → explicit human implementation decision → only then consider executable changes.

Estado:
REPAIR_AGENT_INTEGRATION_DESIGN = R15_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
