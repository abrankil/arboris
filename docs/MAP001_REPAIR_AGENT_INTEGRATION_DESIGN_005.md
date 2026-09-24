# MAP-001 — Repair Agent Integration Design 005

Fecha: 2026-09-23
Estado: R5_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_004.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R4_DIRECTED_REGRESSION_001.md
Motivo de R5: corrección exclusiva de R4-N1 y R4-N2
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo y alcance

R5 conserva todas las fronteras válidas de R4 y corrige exclusivamente:

~~~text
R4-N1
la frontera RESOLVER → TRANSPORT no llevaba de forma explícita
todo el material exacto que transport debía consumir/verificar.

R4-N2
MODEL_INVOCATION_POLICY_V1 no fijaba completamente
role/channel, ordering, framing y request placement.
~~~

R5 continúa siendo exclusivamente documental.

No implementa transport, provider, parser, sandbox, adapter, repair agent, rectificación E5.1 ni full loop.

## 2. Invariantes heredados

Permanecen obligatorios:

~~~text
MODEL_RESPONSE != TRANSPORT_RECEIPT != INTEGRATION_ATTEMPT_RECORD

agent authority
= PROPOSE_AGENT_PATCH
or ABSTAIN_WITHOUT_MUTATION

Repair R1 control-plane
= resolver-owned

E5.1
= mandatory repair gate

E5.2
= mandatory run-context candidate layer

E5.3
= sole durable commit/recovery boundary

automaticRetries = 0

minimalChange executable rule
= OPEN / implementation-blocking

prototype-safe repair application
= OPEN / implementation-blocking until implemented and tested

provider/model/runtime
= OPEN

NEXT_STAGE_ID
= OPEN

AUTHORIZED_FOR_ASC
= OPEN
~~~

Ningún PASS de diseño autoriza implementación.

## 3. R4-N1 — TRANSPORT_INVOCATION_PACKAGE_V1

R5 define una frontera lógica única y explícita entre RESOLVER / ORCHESTRATOR y PROVIDER TRANSPORT ADAPTER.

~~~text
TRANSPORT_INVOCATION_PACKAGE_V1 = {
  schemaVersion,
  transportInvocationId,
  requestBytes,
  requestPayloadSha256,
  instructionBundleBytes,
  assembledInstructionSha256,
  modelInvocationPolicy,
  modelInvocationPolicyDigest,
  resourcePolicy,
  resourcePolicySha256,
  providerEndpointPolicyMaterial,
  providerEndpointPolicySha256,
  providerConfigurationId
}
~~~

El package es construido íntegramente por resolver/orchestrator.

Transport no completa, repara, infiere ni sustituye ninguno de sus campos.

## 4. Semántica del package

### 4.1 requestBytes

~~~text
requestBytes
→ bytes UTF-8 exactos de la serialización determinista
   del bounded request content.
~~~

Verificación:

~~~text
SHA-256(requestBytes)
== requestPayloadSha256
== requestDigest
~~~

Si no coincide:

~~~text
TRANSPORT_REQUEST_DIGEST_MISMATCH
→ fail closed
~~~

### 4.2 instructionBundleBytes

~~~text
instructionBundleBytes
→ bytes UTF-8 exactos del instruction bundle
   ensamblado y autorizado por resolver.
~~~

Verificación:

~~~text
SHA-256(instructionBundleBytes)
== assembledInstructionSha256
~~~

Transport no reconstruye instruction bundle desde repo, defaults locales ni configuración propia.

### 4.3 modelInvocationPolicy

~~~text
modelInvocationPolicy
→ instancia completa exacta de MODEL_INVOCATION_POLICY_V1
   usada para esa invocación.
~~~

Verificación:

~~~text
logicalSha256(modelInvocationPolicy)
== modelInvocationPolicyDigest
~~~

Transport no obtiene esta policy desde repo ni desde provider defaults.

### 4.4 resourcePolicy

~~~text
resourcePolicy
→ valores completos y resueltos aplicables al intento.
~~~

Verificación:

~~~text
logicalSha256(resourcePolicy)
== resourcePolicySha256
~~~

Transport usa esos valores para request/response byte limits, timeout y cancellation.

### 4.5 providerEndpointPolicyMaterial

~~~text
providerEndpointPolicyMaterial
→ material exacto necesario para verificar
   providerConfigurationId,
   allowedEndpointSet
   y redirectPolicy.
~~~

Verificación:

~~~text
logicalSha256(providerEndpointPolicyMaterial)
== providerEndpointPolicySha256
~~~

Transport no puede reemplazar esta policy por una configuración implícita local.

## 5. Capabilities preservadas

R5 no reabre R2-N3.

### RESOLVER / ORCHESTRATOR

Puede:

~~~text
leer artefactos autorizados
construir package
calcular hashes/digests
validar response
ejecutar E5.1/E5.2/E5.3
~~~

No puede:

~~~text
usar provider secrets
hacer arbitrary external egress
usar endpoint controlado por modelo
~~~

### PROVIDER TRANSPORT ADAPTER

Puede:

~~~text
recibir TRANSPORT_INVOCATION_PACKAGE_V1
verificar hashes/digests
acceder a provider secret vía secret broker
hacer egress solo a endpoint permitido
ejecutar exactamente una provider invocation
devolver TRANSPORT_RECEIPT
~~~

No puede:

~~~text
leer repo
leer run-state
leer authority files
ejecutar E5.1/E5.2/E5.3
acceder durable store
interpretar repair semantics
construir Repair R1
sustituir instruction/policy material
~~~

### AGENT / MODEL CONTEXT

Recibe solo el contexto semántico autorizado derivado del package.

No recibe repo, tools, secrets, run-state, durable store ni capacidades privilegiadas.

## 6. R4-N2 — MODEL_INVOCATION_POLICY_V2

R5 evoluciona la policy lógica:

~~~text
MODEL_INVOCATION_POLICY_V2 = {
  schemaVersion,
  providerConfigurationId,
  providerEndpointPolicyBinding,
  modelIdentityPolicy,
  instructionBundleBinding,
  messagePlan,
  requestPlacement,
  framingPolicy,
  responseContractBinding,
  generationParameters,
  providerFeatureBindings
}
~~~

MODEL_INVOCATION_POLICY_V1 queda histórico. La nueva validación de diseño usa V2.

## 7. messagePlan

messagePlan fija cómo entra cada instruction artifact al contexto semántico del modelo.

Cada elemento:

~~~text
{
  sequence,
  semanticRole,
  contentSource,
  exactContentSha256
}
~~~

sequence:

~~~text
integer >= 1
unique
contiguous
defines exact order
~~~

semanticRole:

~~~text
provider-independent logical role
selected from an explicit closed set
~~~

Conjunto inicial propuesto:

~~~text
SYSTEM_POLICY
DEVELOPER_POLICY
TASK_CONTEXT
USER_REQUEST
~~~

Este conjunto es de diseño y debe mapearse explícitamente al provider elegido antes de implementación.

contentSource:

~~~text
INSTRUCTION_BUNDLE_SLICE
or
REQUEST_BYTES
~~~

exactContentSha256:

~~~text
hash del contenido exacto asignado a ese message-plan item
~~~

No se permite que transport agregue mensajes no declarados bajo control de Árboris.

## 8. requestPlacement

R5 fija expresamente dónde entra el bounded request.

~~~text
requestPlacement = {
  semanticRole,
  sequence,
  exactRequestPayloadSha256
}
~~~

Reglas:

~~~text
exactRequestPayloadSha256
== requestPayloadSha256

sequence
→ debe corresponder exactamente a un messagePlan item
   con contentSource=REQUEST_BYTES

semanticRole
→ debe coincidir con el role declarado en ese mismo item
~~~

No se permite remapear request a otro role por conveniencia del provider adapter.

## 9. framingPolicy

R5 fija semántica de ensamblaje y framing.

~~~text
framingPolicy = {
  serializationVersion,
  roleMappingVersion,
  separatorPolicy,
  providerMessageConstructionPolicy
}
~~~

### 9.1 serializationVersion

Identifica la versión exacta de cómo se serializan los artefactos/message items antes de invocación.

### 9.2 roleMappingVersion

Identifica una mapping table provenance-bound:

~~~text
logical semanticRole
→ provider-specific role/channel
~~~

Ejemplo conceptual:

~~~text
SYSTEM_POLICY
→ provider system/instructions field

DEVELOPER_POLICY
→ provider developer/instructions segment

TASK_CONTEXT
→ provider user/context segment

USER_REQUEST
→ provider user/task segment
~~~

R5 no fija ese mapping para ningún provider concreto.

La tabla final queda OPEN hasta seleccionar provider/runtime.

### 9.3 separatorPolicy

Define cómo se separan múltiples instruction artifacts o fragments dentro de un mismo provider field.

Debe ser exacta y versionada.

No se permiten separadores implícitos insertados por código no bound.

### 9.4 providerMessageConstructionPolicy

Define cómo messagePlan se transforma en la estructura final del SDK/API.

Este material debe estar provenance-bound y formar parte de MODEL_INVOCATION_POLICY_V2.

## 10. Byte identity versus semantic placement

R5 distingue explícitamente:

~~~text
byte identity
≠
semantic placement
~~~

Por tanto deben coincidir ambas propiedades:

~~~text
exactContentSha256
AND
semanticRole/sequence/framing
~~~

Un mismo texto enviado bajo otro role es una policy distinta y cambia modelInvocationPolicyDigest.

## 11. Instruction bundle

instructionBundleBinding de R4 se preserva:

~~~text
assemblyVersion
orderedArtifacts
assembledInstructionSha256
~~~

R5 añade:

~~~text
instructionBundleBytes
→ via TRANSPORT_INVOCATION_PACKAGE_V1
~~~

y exige consistencia entre:

~~~text
orderedArtifacts
assembledInstructionSha256
instructionBundleBytes
messagePlan
framingPolicy
~~~

Un artifact provenance-bound que no tenga placement verificable no puede considerarse consumido correctamente por la invocación.

## 12. modelInvocationPolicyDigest actualizado

Definición:

~~~text
modelInvocationPolicyDigest
=
logicalSha256(MODEL_INVOCATION_POLICY_V2)
~~~

Debe entrar en:

~~~text
INPUT_BINDING_V1
TRANSPORT_INVOCATION_PACKAGE_V1
TRANSPORT_RECEIPT
INTEGRATION_ATTEMPT_RECORD
~~~

y verificarse:

~~~text
antes de envío
por transport antes de provider call
al recibir receipt
post-response
antes de Repair R1
~~~

Cualquier cambio en:

~~~text
role
ordering
request placement
framing
generation parameters
model identity policy
response schema
provider features
endpoint policy
~~~

cambia modelInvocationPolicyDigest.

## 13. INPUT_BINDING_V1 preservado

Se mantiene:

~~~text
INPUT_BINDING_V1 = {
  schemaVersion,
  runId,
  parentProposal,
  parentCandidateSha256,
  parentCandidateProjectionSha256,
  validationReport,
  autoRepairFindingsSha256,
  patchPolicySha256,
  resourcePolicySha256,
  integrationDependenciesSha256,
  modelInvocationPolicyDigest
}
~~~

Un cambio semántico en messagePlan/framing invalida inputBindingDigest porque cambia modelInvocationPolicyDigest.

## 14. TRANSPORT_RECEIPT V2

Contenido lógico mínimo:

~~~text
schemaVersion
transportInvocationId
requestPayloadSha256
assembledInstructionSha256
modelInvocationPolicyDigest
resourcePolicySha256
providerEndpointPolicySha256
providerEndpointId
providerRuntimeDescriptor
requestedModelId
resolvedModelIdentifier, if exposed
providerRequestId, optional
rawResponseBytes
transportOutcome
sanitizedTransportError, optional
~~~

Transport receipt declara qué package verificó y consumió.

No es prueba de que el provider internamente respetó capas ocultas; solo prueba el material/control observable en la frontera de Árboris.

## 15. Verificación pre-provider en transport

Antes de invocar al provider, transport debe verificar:

~~~text
transportInvocationId present
requestPayloadSha256 == SHA-256(requestBytes)
assembledInstructionSha256 == SHA-256(instructionBundleBytes)
modelInvocationPolicyDigest == logicalSha256(modelInvocationPolicy)
resourcePolicySha256 == logicalSha256(resourcePolicy)
providerEndpointPolicySha256 == logicalSha256(providerEndpointPolicyMaterial)

modelInvocationPolicy.providerConfigurationId
== package.providerConfigurationId

requestPlacement hash
== requestPayloadSha256

messagePlan content hashes
== exact supplied content

endpoint allowed
redirect policy valid
resource policy complete
~~~

Cualquier mismatch:

~~~text
→ no provider call
→ fail closed
~~~

## 16. Provider call construction

Transport construye la llamada exclusivamente desde:

~~~text
TRANSPORT_INVOCATION_PACKAGE_V1
+
provider secret from secret broker
~~~

No puede usar:

~~~text
repo files
ambient conversation state
provider-managed memory
unbound local prompt templates
implicit role remapping
implicit default tool set
agent-controlled URLs
~~~

Cualquier provider-specific mapping requerido debe estar incluido en material provenance-bound por MODEL_INVOCATION_POLICY_V2.

## 17. Provider hidden layers

R5 conserva la limitación:

~~~text
PROVIDER_HIDDEN_INSTRUCTION_LAYER = OPEN_LIMITATION
~~~

También extiende:

~~~text
PROVIDER_HIDDEN_ROLE_REMAP = OPEN_LIMITATION
PROVIDER_HIDDEN_CONTEXT_INJECTION = OPEN_LIMITATION
~~~

Si el provider introduce transformaciones no observables:

~~~text
Árboris no declara control total del contexto efectivo del modelo.
~~~

Esto no impide diseñar la integración, pero sí limita claims de reproducibilidad/control según la evidencia real.

## 18. Model identity y generation policy

Se preservan de R4:

~~~text
EXACT_PIN
or
PROVIDER_ALIAS_WITH_LIMITATION
~~~

y:

~~~text
no semantics-affecting provider default may remain implicit
under project control.
~~~

Los parámetros exactos siguen OPEN hasta seleccionar provider/model/runtime.

## 19. Response contract

El MODEL_RESPONSE sigue siendo:

~~~text
PATCH + exact agentPatch
or
ABSTAIN + null
~~~

Strict parser y response schema continúan siendo capas distintas.

El ejemplo PATCH válido de R4 permanece vigente.

## 20. Post-response sequence R5

~~~text
1. recover E5.3 store
2. validate durable run/report/provenance
3. build bounded request
4. serialize request deterministically
5. enforce maxRequestBytes
6. build exact instruction bundle bytes
7. build MODEL_INVOCATION_POLICY_V2
8. compute modelInvocationPolicyDigest
9. build INPUT_BINDING_V1
10. compute inputBindingDigest
11. build TRANSPORT_INVOCATION_PACKAGE_V1
12. transport verifies package hashes/policies
13. transport builds provider call only from package + secret broker
14. transport performs exactly one invocation
15. receive TRANSPORT_RECEIPT V2
16. verify exact transportInvocationId
17. verify request/instruction/policy/resource/endpoint hashes
18. apply model identity policy
19. enforce maxRawResponseBytes
20. hash rawResponseBytes
21. strict-parse MODEL_RESPONSE
22. validate response schema
23. if ABSTAIN → stop without mutation
24. if PATCH → validate agentPatch
25. reread durable run/report
26. reverify integration dependencies
27. rebuild MODEL_INVOCATION_POLICY_V2
28. require exact modelInvocationPolicyDigest
29. rebuild INPUT_BINDING_V1
30. require exact inputBindingDigest
31. require READY_TO_REPAIR + exact REJECT_FIXABLE report/findings
32. construct resolver-owned Repair R1
33. execute E5.1
34. execute E5.2
35. execute E5.3
~~~

No existe ruta alternativa de persistencia.

## 21. Failure semantics añadidas

R5 agrega:

~~~text
TRANSPORT_PACKAGE_INVALID
TRANSPORT_INSTRUCTION_DIGEST_MISMATCH
TRANSPORT_RESOURCE_POLICY_MISMATCH
TRANSPORT_ENDPOINT_POLICY_MISMATCH
MESSAGE_PLAN_INVALID
REQUEST_PLACEMENT_MISMATCH
ROLE_MAPPING_DRIFT
FRAMING_POLICY_DRIFT
UNBOUND_PROVIDER_MESSAGE_CONSTRUCTION
PROVIDER_HIDDEN_ROLE_REMAP
PROVIDER_HIDDEN_CONTEXT_INJECTION
~~~

Ninguna falla autoriza retry automático.

## 22. Provenance requerida

Cuando exista implementación, integrationDependencies debe cubrir:

~~~text
REPAIR_SCHEMA
E5_1_REPAIR_GATE
E5_2_TRANSACTION_CANDIDATE
E5_3_DURABLE_STORE
REPAIR_AGENT_ORCHESTRATOR
PROVIDER_TRANSPORT_ADAPTER
TRANSPORT_INVOCATION_PACKAGE_SCHEMA
AGENT_RESPONSE_PARSER
AGENT_REQUEST_SCHEMA
AGENT_RESPONSE_SCHEMA
AGENT_SANDBOX_POLICY
RESOURCE_POLICY
MODEL_INVOCATION_POLICY
MESSAGE_ROLE_MAPPING
PROVIDER_MESSAGE_CONSTRUCTION_POLICY
INSTRUCTION_ARTIFACTS
PROVIDER_ENDPOINT_POLICY
~~~

Cada binding:

~~~text
dependencyId
canonical repo-relative path
raw SHA-256
~~~

No se permite que el runtime consuma una implementación/configuración fuera de ese closure sin marcar drift.

## 23. Prototype safety permanece OPEN

R5 conserva:

~~~text
JSON_OBJECT_MUTATION_USES_OWN_DATA_PROPERTY_SEMANTICS
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
IMPLEMENTATION_BLOCKED = TRUE
~~~

No modifica E5.1.

## 24. Minimal change permanece OPEN

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

No se infiere minimalidad.

## 25. Apoyo ASC v0.1

ASC se usa únicamente para compilar restricciones de R5.

~~~text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R5-ASC-001
~~~

Contrato compilado:

~~~text
AUTHORIZED SOURCES
- main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- docs/DEVELOPMENT_MANUAL.md
- docs/MAP001_E5_1_DETERMINISTIC_REPAIR_GATE_001.md
- docs/MAP001_E5_2_REPAIR_RUN_CONTEXT_001.md
- docs/MAP001_E5_3_DURABLE_REPAIR_PERSISTENCE_DESIGN_001.md
- docs/MAP001_E5_3_CLEAN_HANDOFF_2026-09-23.md
- docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_004.md
- docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R4_DIRECTED_REGRESSION_001.md
- tools/proposal-resolution/schemas/repair.schema.json

MANDATORY RELATIONS
- resolver sends exact invocation material through one explicit package
- transport consumes no repo/default prompt material
- package binds request/instruction/model/resource/endpoint material
- model policy binds role, order, request placement and framing
- role/framing drift changes modelInvocationPolicyDigest
- transport verifies hashes before provider invocation
- receipt binds exact package hashes
- R3-N2 remains resolved
- R2-N1..R2-N3 remain resolved
- RA-I1..RA-I8 constraints remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

OPEN
- exact package schema artifact
- exact MODEL_INVOCATION_POLICY_V2 schema artifact
- provider/model/runtime
- provider-specific role mapping
- provider message construction policy
- hidden provider layers
- deterministic request serializer/schema
- request projection algorithm
- response schema artifact
- exact instruction artifacts
- generation parameter values
- provider feature configuration
- endpoint policy artifact
- transport implementation
- sandbox technology
- resource-limit values
- strict parser implementation
- prototype-safe E5.1 rectification + tests
- minimal-change executable rule or authority-level contract revision
- final failure schema
- ID allocation
- observability sink/retention
- human implementation authorization
- NEXT_STAGE_ID
- AUTHORIZED_FOR_ASC

DO NOT INFER
- package digest proves hidden provider behavior
- equal bytes under different roles are semantically equivalent
- provider role names equal Árboris logical roles without mapping
- R5 design correction authorizes implementation
- prototype-safe design means E5.1 fixed
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED
- transport repo reads to reconstruct invocation material
- unbound local prompt templates
- implicit role remapping
- implicit framing/separator policy
- implicit provider message construction
- hidden project-controlled instruction material
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA
- R4-N1 exact resolver→transport package present
- transport verifies and consumes package material only
- R4-N2 role/channel/order/framing/request placement bound
- modelInvocationPolicyDigest changes on semantic placement drift
- prior closures preserved
- implementation remains unauthorized
~~~

ASC no selecciona provider, mapping, schema ni implementación y no autoriza conexión.

## 26. AUDITORÍA

R5 corrige R4-N1 al convertir la frontera resolver→transport en un package explícito que incluye el material exacto requerido, no solo sus hashes.

R5 corrige R4-N2 al incorporar role/channel/order/request placement/framing en MODEL_INVOCATION_POLICY_V2.

La separación de capacidades se conserva: transport consume el package, pero no necesita leer repo ni adquirir autoridad de repair.

## 27. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

No se afirma que los logical roles ya tengan mapping válido a un provider concreto; ese mapping permanece OPEN hasta selección de provider/runtime.

## 28. VACÍOS / OMISIONES

Permanecen OPEN y bloqueantes antes de implementar:

~~~text
TRANSPORT_INVOCATION_PACKAGE schema artifact
MODEL_INVOCATION_POLICY_V2 schema artifact
provider/model/runtime
provider-specific role mapping
provider message construction policy
hidden provider layer limitations
instruction artifacts
response schema
request serializer/schema
request projection
generation parameter values
provider feature configuration
endpoint policy artifact
transport implementation
sandbox
resource-limit values
strict parser
prototype-safe E5.1 rectification + tests
minimal-change executable rule or contract revision
failure schema
ID algorithms
observability
implementation adversarial tests
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 29. REDUNDANCIAS

Son intencionales:

~~~text
artifact raw hashes
+ assembled instruction hash
→ source identity + consumed byte identity

requestDigest
+ requestPlacement
→ byte identity + semantic role identity

modelInvocationPolicyDigest
+ transport package verification
→ configured policy + actual boundary consumption

receipt verification
+ post-response rebind
→ concrete invocation + current freshness

E5.1/E5.2/E5.3
→ repair/run/durable authority
~~~

No constituyen fuentes de verdad paralelas.

## 30. Resolución dirigida R4-N1 / R4-N2

~~~text
R4-N1
TRANSPORT_INVOCATION_PACKAGE_V1 defined
exact request/instruction/policy/resource/endpoint material crosses boundary
transport forbidden from repo/default reconstruction
receipt binds consumed material
→ ADDRESSED

R4-N2
MODEL_INVOCATION_POLICY_V2 adds messagePlan
requestPlacement
framingPolicy
provider role mapping semantics
provider message construction semantics
→ ADDRESSED
~~~

ADDRESSED no equivale todavía a PASS de regresión.

## 31. Gate

~~~text
R5 authored
→ directed regression R4-N1/R4-N2
→ accumulated regression R3-N1/R3-N2 + R2-N1..R2-N3 + RA-I1..RA-I8
→ correct any new finding
→ design validation
→ explicit human implementation decision
→ only then consider executable changes
~~~

Estado:

~~~text
REPAIR_AGENT_INTEGRATION_DESIGN = R5_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~
