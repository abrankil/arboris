# MAP-001 — Repair Agent Integration Design 006

Fecha: 2026-09-23
Estado: R6_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Main observado al redactar R6: 9fc1619b4d23bc7ebe1ece49d5f55143362c129f
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_005.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R5_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R5-N1, R5-N2 y R5-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

Nota de baseline: main avanzó un commit respecto de la baseline de esta rama. La comparación observada añade únicamente documentación artística fuera del alcance de esta integración. R6 no rebasa ni sustituye la baseline técnica de la rama.

## 1. Objetivo

R6 conserva las fronteras válidas de R5 y corrige:

~~~text
R5-N1
message materialization + resolved role/framing/construction material

R5-N2
binding de la solicitud final entregada al SDK/API

R5-N3
ambigüedad MODEL_INVOCATION_POLICY_V1 / V2
~~~

R6 es exclusivamente documental. No implementa transport, provider, parser, sandbox, agent, rectificación E5.1 ni full loop.

## 2. Invariantes heredados

~~~text
MODEL_RESPONSE != TRANSPORT_RECEIPT != INTEGRATION_ATTEMPT_RECORD
agent authority = PROPOSE_AGENT_PATCH or ABSTAIN_WITHOUT_MUTATION
Repair R1 control-plane = resolver-owned
E5.1 = mandatory
E5.2 = mandatory
E5.3 = sole durable commit/recovery boundary
automaticRetries = 0
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_AUTHORIZED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 3. Corrección R5-N3

La única policy normativa vigente es:

~~~text
MODEL_INVOCATION_POLICY_V2
~~~

MODEL_INVOCATION_POLICY_V1 queda solo como antecedente histórico.

Todo uso normativo de modelInvocationPolicy, modelInvocationPolicyDigest, messagePlan, requestPlacement y framingPolicy se refiere a V2.

Transport debe rechazar una instancia V1 en un flujo gobernado por R6.

## 4. Corrección R5-N1 — MATERIALIZED_MESSAGE_PLAN_V1

Antes de construir el package de transport, resolver materializa cada mensaje:

~~~text
MATERIALIZED_MESSAGE_PLAN_V1 = [
  {
    sequence,
    semanticRole,
    providerRole,
    sourceBinding,
    exactContentBytes,
    exactContentSha256
  }
]
~~~

Reglas:

~~~text
sequence = integer >= 1, unique, contiguous
semanticRole = logical Árboris role authorized by policy
providerRole = provider role already resolved before transport
exactContentBytes = exact UTF-8 bytes delivered for that item
SHA-256(exactContentBytes) = exactContentSha256
~~~

sourceBinding contiene:

~~~text
sourceKind
sourceLogicalId
sourceSha256
~~~

y solo puede referir material ya presente en el package. Transport no usa repo lookups ni defaults para recuperar contenido.

Todo mensaje project-controlled que alcance al provider/model debe aparecer en este plan. No se permiten mensajes, fragments, roles ni joins implícitos.

## 5. RESOLVED_PROVIDER_CONSTRUCTION_POLICY_V1

Resolver también materializa la policy completa que transport debe consumir:

~~~text
RESOLVED_PROVIDER_CONSTRUCTION_POLICY_V1 = {
  schemaVersion,
  providerConfigurationId,
  roleMapping,
  separatorPolicy,
  messageSerializationPolicy,
  requestPlacementPolicy,
  responseContractConfiguration,
  generationParameterConfiguration,
  providerFeatureConfiguration
}
~~~

No son IDs que transport deba resolver.

roleMapping es cerrado:

~~~text
semanticRole -> providerRole
~~~

Todos los roles usados deben tener exactamente un mapping.

separatorPolicy fija mensajes separados o join, separator bytes, ordering y normalization. Si la provider API requiere un único field, resolver debe materializar el contenido final antes del package.

messageSerializationPolicy fija UTF-8, line-ending policy, normalization y provider field type.

requestPlacementPolicy debe demostrar que requestPayloadSha256 aparece en el sequence/semanticRole/providerRole exactos autorizados. No se autoriza fragmentación por defecto.

## 6. TRANSPORT_INVOCATION_PACKAGE_V2

V2 reemplaza V1 como package normativo:

~~~text
TRANSPORT_INVOCATION_PACKAGE_V2 = {
  schemaVersion,
  transportInvocationId,
  requestBytes,
  requestPayloadSha256,
  instructionBundleBytes,
  assembledInstructionSha256,
  modelInvocationPolicy,
  modelInvocationPolicyDigest,
  materializedMessagePlan,
  materializedMessagePlanSha256,
  resolvedProviderConstructionPolicy,
  resolvedProviderConstructionPolicySha256,
  resourcePolicy,
  resourcePolicySha256,
  providerEndpointPolicyMaterial,
  providerEndpointPolicySha256,
  providerConfigurationId
}
~~~

Resolver calcula:

~~~text
materializedMessagePlanSha256
= logicalSha256(MATERIALIZED_MESSAGE_PLAN_V1)

resolvedProviderConstructionPolicySha256
= logicalSha256(RESOLVED_PROVIDER_CONSTRUCTION_POLICY_V1)
~~~

Transport verifica todos los hashes/digests antes de provider call.

Transport no consulta repo, prompt templates locales ni provider defaults para completar material project-controlled.

## 7. Policy → materialized plan

MATERIALIZED_MESSAGE_PLAN_V1 debe ser una derivación determinista de:

~~~text
MODEL_INVOCATION_POLICY_V2
+ requestBytes
+ instructionBundleBytes
+ authorized derived context
+ RESOLVED_PROVIDER_CONSTRUCTION_POLICY_V1
~~~

Resolver valida:

~~~text
every required message represented
every materialized message authorized
request placement exact
role mapping exact
order exact
content hashes exact
no extra project-controlled message
~~~

Transport no resuelve decisiones semánticas pendientes.

## 8. Corrección R5-N2 — PROVIDER_REQUEST_ENVELOPE_V1

Después de verificar package V2 y justo antes del SDK/API, transport construye:

~~~text
PROVIDER_REQUEST_ENVELOPE_V1 = {
  schemaVersion,
  transportInvocationId,
  providerConfigurationId,
  endpoint,
  modelIdentityRequest,
  orderedProviderMessages,
  generationParameters,
  responseContractConfiguration,
  providerFeatureConfiguration,
  timeoutConfiguration,
  redirectPolicy
}
~~~

No contiene secrets ni authorization headers.

orderedProviderMessages debe corresponder uno-a-uno con MATERIALIZED_MESSAGE_PLAN_V1:

~~~text
same count
same sequence
same providerRole
same exactContentBytes
same exactContentSha256
~~~

generationParameters, responseContractConfiguration y providerFeatureConfiguration deben igualar los valores resueltos de RESOLVED_PROVIDER_CONSTRUCTION_POLICY_V1.

## 9. providerRequestEnvelopeDigest

Transport calcula inmediatamente antes de invocar al SDK/API:

~~~text
providerRequestEnvelopeDigest
= logicalSha256(PROVIDER_REQUEST_ENVELOPE_V1)
~~~

Antes de la llamada verifica:

~~~text
envelope derived only from package V2 + secret broker
messages equal materialized plan
roles equal resolved mapping
generation parameters equal resolved policy
response contract equal resolved policy
provider features equal resolved policy
endpoint equal endpoint policy
model identity request equal model policy
timeout/redirect equal policies
~~~

Cualquier divergencia:

~~~text
PROVIDER_REQUEST_ENVELOPE_MISMATCH
→ no provider call
→ fail closed
~~~

Este digest identifica la representación lógica controlada por Árboris, no los bytes HTTP/TLS.

## 10. SDK/provider hidden boundary

Si el SDK transforma la solicitud después del envelope y esa transformación no es observable:

~~~text
SDK_HIDDEN_REQUEST_TRANSFORMATION = OPEN_LIMITATION
~~~

Se conservan además:

~~~text
PROVIDER_HIDDEN_INSTRUCTION_LAYER = OPEN_LIMITATION
PROVIDER_HIDDEN_ROLE_REMAP = OPEN_LIMITATION
PROVIDER_HIDDEN_CONTEXT_INJECTION = OPEN_LIMITATION
~~~

No se declara control total del wire/contexto interno sin evidencia.

## 11. TRANSPORT_RECEIPT V3

~~~text
schemaVersion
transportInvocationId
requestPayloadSha256
assembledInstructionSha256
modelInvocationPolicyDigest
materializedMessagePlanSha256
resolvedProviderConstructionPolicySha256
resourcePolicySha256
providerEndpointPolicySha256
providerRequestEnvelopeDigest
providerEndpointId
providerRuntimeDescriptor
requestedModelId
resolvedModelIdentifier, if exposed
providerRequestId, optional
rawResponseBytes
transportOutcome
sanitizedTransportError, optional
~~~

Receipt declara qué package verificó y qué envelope final construyó. No prueba capas ocultas del SDK/provider.

## 12. INTEGRATION_ATTEMPT_RECORD

Resolver registra además:

~~~text
modelInvocationPolicyDigest
materializedMessagePlanSha256
resolvedProviderConstructionPolicySha256
providerRequestEnvelopeDigest
transportInvocationId
requestPayloadSha256
rawResponseSha256
parsedResponseSha256, if parse succeeded
~~~

junto con los IDs, bindings, outcome, failureClass e integrationDependencies ya definidos.

Sigue siendo NON_AUTHORITATIVE.

## 13. Post-response binding

Resolver verifica desde TRANSPORT_RECEIPT V3:

~~~text
transportInvocationId
requestPayloadSha256
assembledInstructionSha256
modelInvocationPolicyDigest
materializedMessagePlanSha256
resolvedProviderConstructionPolicySha256
resourcePolicySha256
providerEndpointPolicySha256
providerRequestEnvelopeDigest
~~~

Después procesa MODEL_RESPONSE.

Antes de Repair R1 vuelve a reconstruir:

~~~text
integrationDependencies
MODEL_INVOCATION_POLICY_V2
modelInvocationPolicyDigest
INPUT_BINDING_V1
inputBindingDigest
current run/report/findings
~~~

providerRequestEnvelopeDigest identifica la invocación concreta; no sustituye freshness.

## 14. Provenance closure

La futura implementación debe incluir bindings exactos:

~~~text
REPAIR_SCHEMA
E5_1_REPAIR_GATE
E5_2_TRANSACTION_CANDIDATE
E5_3_DURABLE_STORE
REPAIR_AGENT_ORCHESTRATOR
PROVIDER_TRANSPORT_ADAPTER
TRANSPORT_INVOCATION_PACKAGE_SCHEMA
MATERIALIZED_MESSAGE_PLAN_SCHEMA
RESOLVED_PROVIDER_CONSTRUCTION_POLICY_SCHEMA
PROVIDER_REQUEST_ENVELOPE_SCHEMA
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

Cada binding exige dependencyId + canonical repo-relative path + raw SHA-256.

## 15. Failure semantics añadidas

~~~text
MATERIALIZED_MESSAGE_PLAN_INVALID
MESSAGE_CONTENT_DIGEST_MISMATCH
MESSAGE_PLAN_POLICY_MISMATCH
RESOLVED_PROVIDER_POLICY_INVALID
PROVIDER_CONSTRUCTION_POLICY_DRIFT
PROVIDER_REQUEST_ENVELOPE_INVALID
PROVIDER_REQUEST_ENVELOPE_MISMATCH
SDK_HIDDEN_REQUEST_TRANSFORMATION
~~~

Ninguna habilita retry automático.

## 16. OPEN preservados

~~~text
provider/model/runtime
schemas de package/message-plan/resolved-policy/provider-envelope
provider-specific roles/mapping
provider message construction values
hidden SDK/provider evidence
request serializer/schema
request projection
response schema
instruction artifacts
generation parameter values
provider feature configuration
endpoint policy
transport implementation
sandbox
resource-limit values
strict parser
prototype-safe E5.1 rectification + tests
minimal-change executable rule or contract revision
failure schema
ID allocation
observability
implementation adversarial tests
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 17. Apoyo ASC v0.1

~~~text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R6-ASC-001
~~~

Contrato compilado:

~~~text
AUTHORIZED SOURCES
- branch head e40d890749ba9dd6939c2351b45bb6da08752f14
- main technical baseline 63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- E5.1 / E5.2 / E5.3 authorities
- R5 design
- R5 directed regression
- Repair R1 schema

MANDATORY RELATIONS
- MODEL_INVOCATION_POLICY_V2 is sole normative invocation policy
- every provider message has exact bytes/hash/logical role/provider role
- resolved role/framing/construction material crosses resolver→transport
- transport package V2 carries all project-controlled invocation material
- provider envelope is one-to-one with materialized message plan
- providerRequestEnvelopeDigest enters receipt and attempt evidence
- post-response verification checks concrete invocation digest
- prior closures remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

DO NOT INFER
- providerRequestEnvelopeDigest equals wire-byte digest
- provider envelope proves hidden provider behavior
- same envelope digest guarantees same generative output
- design correction authorizes implementation
- prototype-safe design means E5.1 fixed
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED
- transport repo reads to materialize messages/policies
- unresolved role mapping/framing inside transport
- unbound project-controlled message insertion
- silent provider-request mutation after digest
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA
- R5-N1 uniquely materializable messages + resolved construction material
- R5-N2 explicit provider envelope + digest in receipt/attempt evidence
- R5-N3 normative policy references only V2
- previous constraints preserved
- implementation remains unauthorized
~~~

ASC compila restricciones; no decide provider, schemas, implementación ni autoriza conexión.

## 18. AUDITORÍA

R6 corrige R5-N1 al hacer que los mensajes y la policy de construcción crucen la frontera ya resueltos y consumibles.

R6 corrige R5-N2 al fijar una representación canónica de la solicitud final justo antes del SDK/API y enlazarla con providerRequestEnvelopeDigest.

R6 corrige R5-N3 al declarar V2 como única policy normativa.

## 19. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

La separación envelope lógico vs. wire/SDK interno es deliberada para no ampliar evidencia.

## 20. VACÍOS / OMISIONES

Los OPEN de §16 permanecen bloqueantes para implementación, pero no impiden auditar R6.

## 21. REDUNDANCIAS

Son intencionales:

~~~text
source hashes + materialized message hashes
modelInvocationPolicyDigest + resolved construction policy hash
package verification + providerRequestEnvelopeDigest
receipt verification + post-response rebind
E5.1 + E5.2 + E5.3
~~~

Cubren fronteras distintas y no crean autoridad paralela.

## 22. Resolución dirigida

~~~text
R5-N1 = ADDRESSED
R5-N2 = ADDRESSED
R5-N3 = ADDRESSED

ADDRESSED != regression PASS
~~~

## 23. Gate

~~~text
R6 authored
→ directed regression R5-N1/R5-N2/R5-N3
→ accumulated regression R4-N1/R4-N2
   + R3-N1/R3-N2
   + R2-N1..R2-N3
   + RA-I1..RA-I8
→ correct any new finding
→ design validation
→ explicit human implementation decision
→ only then consider executable changes
~~~

Estado:

~~~text
REPAIR_AGENT_INTEGRATION_DESIGN = R6_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~
