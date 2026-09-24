# MAP-001 — Repair Agent Integration Design 007

Fecha: 2026-09-23
Estado: R7_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_006.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R6_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R6-N1, R6-N2 y R6-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R7 conserva las fronteras válidas de R6 y corrige únicamente:

~~~text
R6-N1
representación canónica de contenido byte-level dentro de logical digests.

R6-N2
binding independiente y verificable del provider request envelope final.

R6-N3
policy de extracción de respuesta + cadena de evidencia
provider/SDK observable → MODEL_RESPONSE bytes.
~~~

R7 es exclusivamente documental. No implementa transport, provider, parser, sandbox, agent, rectificación E5.1 ni full loop.

## 2. Invariantes heredados

~~~text
MODEL_RESPONSE != TRANSPORT_RECEIPT != INTEGRATION_ATTEMPT_RECORD
MODEL_INVOCATION_POLICY_V2 = única policy normativa de invocación
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

## 3. R6-N1 — BYTE_STRING_V1

R7 prohíbe incorporar Buffer, Uint8Array u otros tipos runtime de bytes directamente en objetos sujetos a logicalSha256.

Todo contenido cuya identidad exacta de bytes deba preservarse usa:

~~~text
BYTE_STRING_V1 = {
  schemaVersion: 0.1,
  encoding: BASE64_RFC4648_PADDED,
  mediaType,
  byteLength,
  dataBase64,
  sha256
}
~~~

Reglas:

~~~text
dataBase64
→ alfabeto RFC 4648 estándar
→ padding obligatorio
→ sin whitespace
→ no base64url
→ decode + canonical re-encode debe producir exactamente el mismo dataBase64

decodedBytes
→ length == byteLength
→ SHA-256(decodedBytes) == sha256
~~~

Para texto destinado al modelo:

~~~text
mediaType = text/plain;charset=utf-8
decodedBytes must be valid UTF-8
Unicode normalization = NONE
line-ending normalization = NONE
trim = NONE
~~~

Los bytes exactos son la autoridad de contenido.

## 4. Hash lógico de artefactos byte-bearing

logicalSha256 continúa operando sobre JSON canónico.

Por tanto:

~~~text
raw content identity
= BYTE_STRING_V1.sha256

logical artifact identity
= logicalSha256(object containing canonical BYTE_STRING_V1)
~~~

El objeto lógico contiene dataBase64 canónico, no un objeto de bytes dependiente del runtime.

Los dos hashes tienen funciones distintas y no son intercambiables.

## 5. MATERIALIZED_MESSAGE_PLAN_V2

V2 reemplaza V1 como plan normativo:

~~~text
MATERIALIZED_MESSAGE_PLAN_V2 = [
  {
    sequence,
    semanticRole,
    providerRole,
    sourceBinding,
    content
  }
]
~~~

content = BYTE_STRING_V1.

Transport obtiene los bytes consumibles únicamente mediante strict canonical base64 decode.

Cada item exige:

~~~text
sequence unique + contiguous
semanticRole authorized
providerRole equals resolved mapping
sourceBinding authorized
content canonical
content sha256 verified
~~~

No existe material implícito fuera del plan.

## 6. PROVIDER_REQUEST_ENVELOPE_V2

V2 reemplaza V1 como envelope lógico normativo:

~~~text
PROVIDER_REQUEST_ENVELOPE_V2 = {
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

Cada orderedProviderMessages item contiene:

~~~text
sequence
providerRole
content = BYTE_STRING_V1
~~~

No contiene raw runtime bytes.

## 7. R6-N2 — expected provider request binding independiente

Antes de invocar transport, resolver construye de forma pura:

~~~text
EXPECTED_PROVIDER_REQUEST_ENVELOPE_V2
~~~

desde:

~~~text
MATERIALIZED_MESSAGE_PLAN_V2
RESOLVED_PROVIDER_CONSTRUCTION_POLICY_V1
MODEL_INVOCATION_POLICY_V2
provider endpoint policy
resource policy
providerConfigurationId
transportInvocationId
~~~

Resolver calcula y conserva:

~~~text
expectedProviderRequestEnvelopeDigest
=
logicalSha256(EXPECTED_PROVIDER_REQUEST_ENVELOPE_V2)
~~~

Ese valor existe antes de que transport construya su request final.

## 8. TRANSPORT_INVOCATION_PACKAGE_V3

V3 reemplaza V2:

~~~text
TRANSPORT_INVOCATION_PACKAGE_V3 = {
  schemaVersion,
  transportInvocationId,
  requestContent,
  requestPayloadSha256,
  instructionBundleContent,
  assembledInstructionSha256,
  modelInvocationPolicy,
  modelInvocationPolicyDigest,
  materializedMessagePlan,
  materializedMessagePlanSha256,
  resolvedProviderConstructionPolicy,
  resolvedProviderConstructionPolicySha256,
  expectedProviderRequestEnvelope,
  expectedProviderRequestEnvelopeDigest,
  responseExtractionPolicy,
  responseExtractionPolicyDigest,
  resourcePolicy,
  resourcePolicySha256,
  providerEndpointPolicyMaterial,
  providerEndpointPolicySha256,
  providerConfigurationId
}
~~~

requestContent e instructionBundleContent usan BYTE_STRING_V1.

Transport no consulta repo ni defaults para completar material project-controlled.

## 9. Verificación expected/actual

Transport reconstruye:

~~~text
ACTUAL_PROVIDER_REQUEST_ENVELOPE_V2
~~~

exclusivamente desde package V3.

Calcula:

~~~text
actualProviderRequestEnvelopeDigest
=
logicalSha256(ACTUAL_PROVIDER_REQUEST_ENVELOPE_V2)
~~~

Debe cumplirse:

~~~text
actualProviderRequestEnvelopeDigest
== expectedProviderRequestEnvelopeDigest

ACTUAL_PROVIDER_REQUEST_ENVELOPE_V2
deep-logical-equals
EXPECTED_PROVIDER_REQUEST_ENVELOPE_V2
~~~

Si diverge:

~~~text
PROVIDER_REQUEST_ENVELOPE_MISMATCH
→ no provider call
→ fail closed
~~~

El expected binding fue calculado por resolver, no por transport.

## 10. R6-N3 — PROVIDER_RESPONSE_EXTRACTION_POLICY_V1

R7 define una policy provenance-bound para convertir la respuesta observable del SDK/provider en los bytes exactos que resolver parseará:

~~~text
PROVIDER_RESPONSE_EXTRACTION_POLICY_V1 = {
  schemaVersion,
  providerConfigurationId,
  observationBoundary,
  responseMode,
  unitOrderingPolicy,
  selectedContentLocator,
  contentEncodingPolicy,
  concatenationPolicy,
  emptyOutputPolicy,
  multipleOutputPolicy,
  providerErrorPolicy,
  metadataExtractionPolicy
}
~~~

La policy exacta se fija antes del provider call.

## 11. observationBoundary

Declara el punto desde el cual Árboris realmente puede aportar evidencia:

~~~text
SDK_RETURN_OBJECT
SDK_STREAM_EVENT
SDK_CALLBACK_EVENT
PROVIDER_HTTP_BODY_IF_DIRECTLY_OBSERVABLE
~~~

El valor final depende del provider/runtime.

R7 no denomina raw provider response a aquello que solo es observable después de una transformación del SDK.

## 12. responseMode y ordering

responseMode:

~~~text
NON_STREAM
STREAM
~~~

Para STREAM, unitOrderingPolicy fija:

~~~text
sequence rule
event type allowlist
duplicate/replay handling
termination event
out-of-order handling
~~~

No existe concatenación por orden implícito.

## 13. selectedContentLocator

Define de forma cerrada la parte observable que contiene MODEL_RESPONSE.

Puede ser un field/path, un event type + field o un structured-output field provider-specific.

Está prohibida selección heurística como primer string disponible.

## 14. Encoding y concatenación

contentEncodingPolicy fija:

~~~text
observable encoding
UTF-8 conversion rule
BOM policy
normalization
line endings
~~~

concatenationPolicy fija:

~~~text
ordering
separator bytes
empty-unit rule
boundary contribution
~~~

Por defecto no se añade separador implícito.

No se permite trim, fence stripping, JSON repair ni normalización silenciosa.

## 15. OBSERVED_PROVIDER_RESPONSE_V1

Transport captura la evidencia observable en forma canónica:

~~~text
OBSERVED_PROVIDER_RESPONSE_V1 = {
  schemaVersion,
  transportInvocationId,
  observationBoundary,
  responseMode,
  providerRequestId,
  units: [
    {
      sequence,
      unitType,
      selectedContent,
      selectedMetadata
    }
  ],
  terminalStatus
}
~~~

selectedContent = BYTE_STRING_V1 o null.

selectedMetadata es JSON canónico, sanitizado y sin secrets.

Se calcula:

~~~text
observedProviderResponseDigest
=
logicalSha256(OBSERVED_PROVIDER_RESPONSE_V1)
~~~

Este digest prueba la evidencia observable capturada, no capas ocultas anteriores.

## 16. EXTRACTED_MODEL_RESPONSE_V1

Transport aplica exactamente PROVIDER_RESPONSE_EXTRACTION_POLICY_V1 sobre OBSERVED_PROVIDER_RESPONSE_V1 y produce:

~~~text
EXTRACTED_MODEL_RESPONSE_V1 = {
  schemaVersion,
  responseExtractionPolicyDigest,
  observedProviderResponseDigest,
  content
}
~~~

content = BYTE_STRING_V1.

Se exige:

~~~text
content.sha256
= extractedModelResponseSha256
~~~

Resolver strict-parsea exclusivamente los bytes decodificados de content.dataBase64.

## 17. responseExtractionPolicyDigest

Resolver calcula antes de transport:

~~~text
responseExtractionPolicyDigest
=
logicalSha256(PROVIDER_RESPONSE_EXTRACTION_POLICY_V1)
~~~

El digest entra en:

~~~text
INPUT_BINDING_V2
TRANSPORT_INVOCATION_PACKAGE_V3
TRANSPORT_RECEIPT_V4
INTEGRATION_ATTEMPT_RECORD
~~~

Transport no puede elegir otra extraction policy.

## 18. INPUT_BINDING_V2

V2 reemplaza V1 como binding normativo:

~~~text
INPUT_BINDING_V2 = {
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
  modelInvocationPolicyDigest,
  materializedMessagePlanSha256,
  resolvedProviderConstructionPolicySha256,
  expectedProviderRequestEnvelopeDigest,
  responseExtractionPolicyDigest
}
~~~

Definición:

~~~text
inputBindingDigest
=
logicalSha256(INPUT_BINDING_V2)
~~~

Un cambio en request construction o response extraction invalida el intento.

## 19. TRANSPORT_RECEIPT_V4

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
expectedProviderRequestEnvelopeDigest
actualProviderRequestEnvelopeDigest
responseExtractionPolicyDigest
observedProviderResponseDigest
extractedModelResponseSha256
extractedModelResponse
providerEndpointId
providerRuntimeDescriptor
requestedModelId
resolvedModelIdentifier, if exposed
providerRequestId, optional
transportOutcome
sanitizedTransportError, optional
~~~

extractedModelResponse usa EXTRACTED_MODEL_RESPONSE_V1.

Receipt no contiene secrets.

## 20. Verificación post-response por resolver

Resolver conserva antes de la llamada:

~~~text
transportInvocationId
expectedProviderRequestEnvelopeDigest
responseExtractionPolicyDigest
inputBindingDigest
~~~

Al recibir receipt V4 exige:

~~~text
transportInvocationId exact
receipt.expectedProviderRequestEnvelopeDigest exact
actualProviderRequestEnvelopeDigest
== expectedProviderRequestEnvelopeDigest

responseExtractionPolicyDigest exact

extractedModelResponse.responseExtractionPolicyDigest exact
extractedModelResponse.observedProviderResponseDigest
== receipt.observedProviderResponseDigest

decoded extractedModelResponse.content hash
== receipt.extractedModelResponseSha256
~~~

Luego strict-parsea exclusivamente extractedModelResponse.content.

## 21. Hidden-layer limitations

Se preservan:

~~~text
SDK_HIDDEN_REQUEST_TRANSFORMATION = OPEN_LIMITATION
PROVIDER_HIDDEN_INSTRUCTION_LAYER = OPEN_LIMITATION
PROVIDER_HIDDEN_ROLE_REMAP = OPEN_LIMITATION
PROVIDER_HIDDEN_CONTEXT_INJECTION = OPEN_LIMITATION
~~~

Se añaden:

~~~text
SDK_HIDDEN_RESPONSE_TRANSFORMATION = OPEN_LIMITATION
PROVIDER_UNOBSERVABLE_RESPONSE_ENVELOPE = OPEN_LIMITATION
~~~

Si la observación empieza en SDK_RETURN_OBJECT, no se afirma fidelidad de raw HTTP.

## 22. Secuencia R7

~~~text
1. recover + validate run/report/provenance
2. build bounded request
3. encode request as BYTE_STRING_V1
4. build instruction bundle as BYTE_STRING_V1
5. build MODEL_INVOCATION_POLICY_V2
6. build MATERIALIZED_MESSAGE_PLAN_V2
7. build RESOLVED_PROVIDER_CONSTRUCTION_POLICY_V1
8. resolver builds EXPECTED_PROVIDER_REQUEST_ENVELOPE_V2
9. compute expectedProviderRequestEnvelopeDigest
10. build PROVIDER_RESPONSE_EXTRACTION_POLICY_V1
11. compute responseExtractionPolicyDigest
12. build INPUT_BINDING_V2
13. compute inputBindingDigest
14. build TRANSPORT_INVOCATION_PACKAGE_V3
15. transport verifies canonical byte objects/hashes/policies
16. transport builds ACTUAL_PROVIDER_REQUEST_ENVELOPE_V2
17. require actual digest == expected digest
18. provider call
19. capture OBSERVED_PROVIDER_RESPONSE_V1 at declared boundary
20. compute observedProviderResponseDigest
21. apply exact response extraction policy
22. build EXTRACTED_MODEL_RESPONSE_V1
23. return TRANSPORT_RECEIPT_V4
24. resolver verifies invocation + extraction bindings
25. strict-parse exact extracted MODEL_RESPONSE bytes
26. ABSTAIN stops without mutation; PATCH continues
27. reread run/report + reverify INPUT_BINDING_V2
28. construct resolver-owned Repair R1
29. E5.1
30. E5.2
31. E5.3
~~~

## 23. Provenance closure

La futura dependency closure añade:

~~~text
BYTE_STRING_SCHEMA
MATERIALIZED_MESSAGE_PLAN_SCHEMA
TRANSPORT_INVOCATION_PACKAGE_SCHEMA
PROVIDER_REQUEST_ENVELOPE_SCHEMA
PROVIDER_RESPONSE_EXTRACTION_POLICY
OBSERVED_PROVIDER_RESPONSE_SCHEMA
EXTRACTED_MODEL_RESPONSE_SCHEMA
TRANSPORT_RECEIPT_SCHEMA
~~~

además de los componentes ya exigidos por R6.

Cada binding exige dependencyId + canonical repo-relative path + raw SHA-256.

## 24. Failure semantics añadidas

~~~text
BYTE_STRING_INVALID
BYTE_STRING_NONCANONICAL_BASE64
BYTE_STRING_LENGTH_MISMATCH
BYTE_STRING_HASH_MISMATCH
EXPECTED_PROVIDER_REQUEST_ENVELOPE_INVALID
PROVIDER_REQUEST_EXPECTED_ACTUAL_MISMATCH
RESPONSE_EXTRACTION_POLICY_MISMATCH
OBSERVED_PROVIDER_RESPONSE_INVALID
RESPONSE_UNIT_ORDER_INVALID
RESPONSE_CONTENT_LOCATOR_MISMATCH
EXTRACTED_MODEL_RESPONSE_HASH_MISMATCH
SDK_HIDDEN_RESPONSE_TRANSFORMATION
PROVIDER_UNOBSERVABLE_RESPONSE_ENVELOPE
~~~

Ninguna habilita retry automático.

## 25. OPEN preservados

~~~text
provider/model/runtime
schemas concretos R7
provider-specific roles/mapping
provider request construction
provider response extraction values
hidden SDK/provider evidence
request serializer/schema
request projection
response schema
instruction artifacts
generation parameters
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

## 26. Apoyo ASC v0.1

~~~text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R7-ASC-001
~~~

Contrato compilado:

~~~text
AUTHORIZED SOURCES
- branch head 80c7fb7f9b0187fb349c21b8963be4f06c448293
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- E5.1 / E5.2 / E5.3 authorities
- R6 design
- R6 directed regression
- logicalSha256 implementation
- Repair R1 schema

MANDATORY RELATIONS
- byte-bearing logical artifacts use canonical BYTE_STRING_V1
- logicalSha256 never depends on runtime Buffer/Uint8Array representation
- resolver computes expected provider request envelope before transport
- transport actual envelope must equal resolver expected envelope
- response extraction policy is fixed before provider call
- observable provider response evidence is distinct from extracted model response
- extracted model response bytes are hash-bound before strict parse
- INPUT_BINDING_V2 binds request construction and response extraction policy
- receipt V4 binds expected/actual request envelope and response extraction chain
- prior closures remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

DO NOT INFER
- BYTE_STRING logical hash equals raw-content hash
- expected envelope digest proves provider wire bytes
- observed response digest equals raw HTTP when SDK hides it
- same request/response bindings guarantee identical output
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED
- runtime-specific raw byte objects inside logical artifacts
- transport self-declared envelope digest without resolver expected binding
- heuristic provider-response field selection
- implicit stream concatenation/order
- silent text normalization/trim/fence stripping
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA
- R6-N1 canonical byte representation explicit
- R6-N2 independent expected provider envelope binding explicit
- R6-N3 response extraction policy + evidence chain explicit
- prior closures preserved
- implementation remains unauthorized
~~~

ASC compila restricciones; no decide provider, schemas, implementation ni autoriza conexión.

## 27. AUDITORÍA

R7 corrige R6-N1 separando identidad raw de contenido y representación JSON canónica mediante BYTE_STRING_V1.

R7 corrige R6-N2 haciendo que resolver calcule expectedProviderRequestEnvelopeDigest antes de transport y exigiendo igualdad expected/actual.

R7 corrige R6-N3 fijando response extraction antes de la llamada y trazando la evidencia observable hasta los bytes exactos que resolver parsea.

## 28. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

R7 limita los claims de response fidelity al punto realmente observable.

## 29. VACÍOS / OMISIONES

Los OPEN de §25 permanecen bloqueantes para implementación, pero no impiden auditar R7.

## 30. REDUNDANCIAS

Son intencionales:

~~~text
BYTE_STRING.sha256 + logical artifact digest
expected provider envelope + actual provider envelope
observed provider response digest + extracted model response hash
receipt verification + INPUT_BINDING_V2 rebind
E5.1 + E5.2 + E5.3
~~~

Cubren fronteras diferentes.

## 31. Resolución dirigida

~~~text
R6-N1 = ADDRESSED
R6-N2 = ADDRESSED
R6-N3 = ADDRESSED

ADDRESSED != regression PASS
~~~

## 32. Gate

~~~text
R7 authored
→ directed regression R6-N1/R6-N2/R6-N3
→ accumulated regression R5-N1..R5-N3
   + R4-N1/R4-N2
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
REPAIR_AGENT_INTEGRATION_DESIGN = R7_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~
