# MAP-001 — Repair Agent Integration Design 008

Fecha: 2026-09-23
Estado: R8_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_007.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R7_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R7-N1, R7-N2 y R7-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R8 conserva las fronteras válidas de R7 y corrige exclusivamente:

~~~text
R7-N1
separar observación pre-selección de extracción
y permitir replay independiente por resolver.

R7-N2
extender resourcePolicy a stream units, observation records,
metadata, base64, extracted response y transport receipt.

R7-N3
precisar canonical RFC 4648 padding.
~~~

R8 es exclusivamente documental. No implementa transport, provider, parser, sandbox, agent, rectificación E5.1 ni full loop.

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

## 3. Corrección R7-N3 — canonical base64 exacto

BYTE_STRING_V1 mantiene encoding = BASE64_RFC4648_PADDED.

Padding canónico significa exactamente 0, 1 o 2 caracteres = según lo requiera la longitud de los bytes de entrada. No se permite padding superfluo ni omitir padding requerido. Un byte string vacío se representa con dataBase64 vacío. Para contenido no vacío, la longitud codificada canónica es múltiplo de 4. Decode + canonical re-encode debe producir exactamente el dataBase64 original.

Padded no significa que toda representación deba contener al menos un =.

## 4. R7-N1 — separación capture / observation / extraction

R8 define tres capas distintas:

~~~text
PROVIDER/SDK OBSERVABLE VALUE
→ deterministic observation capture
→ PROVIDER_OBSERVATION_RECORD_V1
→ deterministic response extraction
→ EXTRACTED_MODEL_RESPONSE_V2
→ resolver strict parser
~~~

El observation record es pre-selección. No contiene selectedContent ya resuelto.

## 5. PROVIDER_OBSERVATION_CAPTURE_POLICY_V1

Antes del provider call, resolver fija:

~~~text
PROVIDER_OBSERVATION_CAPTURE_POLICY_V1 = {
  schemaVersion,
  providerConfigurationId,
  observationBoundary,
  responseMode,
  observableUnitPolicy,
  captureProjectionPolicy,
  observableEncodingPolicy,
  metadataProjectionPolicy
}
~~~

Se calcula:

~~~text
observationCapturePolicyDigest
= logicalSha256(PROVIDER_OBSERVATION_CAPTURE_POLICY_V1)
~~~

El digest entra en INPUT_BINDING_V3, TRANSPORT_INVOCATION_PACKAGE_V4, TRANSPORT_RECEIPT_V5 e INTEGRATION_ATTEMPT_RECORD.

Transport no puede cambiar capture policy después del provider call.

## 6. Observation boundary y units

Valores conceptuales permitidos:

~~~text
SDK_RETURN_OBJECT
SDK_STREAM_EVENT
SDK_CALLBACK_EVENT
PROVIDER_HTTP_BODY_IF_DIRECTLY_OBSERVABLE
~~~

La evidencia comienza exactamente en el boundary realmente observable. Si el SDK ya transformó la respuesta, SDK_HIDDEN_RESPONSE_TRANSFORMATION permanece OPEN_LIMITATION.

Para STREAM, observableUnitPolicy fija event types admitidos, sequence assignment, duplicate/replay handling, out-of-order handling, terminal event, provider error handling y post-terminal behavior. Nada se ignora silenciosamente.

## 7. captureProjectionPolicy

La proyección ocurre antes de selectedContentLocator y debe conservar toda la información necesaria para volver a ejecutar la extracción: ordering, locator, terminal/error semantics y metadata necesaria.

Está prohibido:

~~~text
keep whatever seems relevant
post-hoc ad-hoc sanitization
heuristic field selection
dropping fields required by extraction
adding unbound provider data
~~~

Si una redacción o transformación es necesaria para seguridad, debe estar fijada antes del call en metadataProjectionPolicy y mantener suficiencia para replay.

## 8. PROVIDER_OBSERVATION_RECORD_V1

Transport materializa evidencia pre-selección:

~~~text
PROVIDER_OBSERVATION_RECORD_V1 = {
  schemaVersion,
  transportInvocationId,
  observationCapturePolicyDigest,
  observationBoundary,
  responseMode,
  providerRequestId,
  units: [
    {
      sequence,
      unitType,
      observablePayload,
      observableMetadata
    }
  ],
  terminalStatus
}
~~~

observablePayload es la representación canónica suficiente para ejecutar selectedContentLocator posteriormente. Strings/blobs cuya identidad de bytes importe usan BYTE_STRING_V1. observableMetadata contiene solo la proyección autorizada.

Se calcula providerObservationRecordDigest = logicalSha256(PROVIDER_OBSERVATION_RECORD_V1).

## 9. Sufficiency gate

Antes de extraer contenido, debe demostrarse estructuralmente que cada locator de PROVIDER_RESPONSE_EXTRACTION_POLICY_V2 puede evaluarse usando únicamente PROVIDER_OBSERVATION_RECORD_V1.

Si no puede:

~~~text
OBSERVATION_RECORD_INSUFFICIENT
→ no extracted response
→ fail closed
~~~

Después de construir el observation record no se permite volver al objeto SDK original para completar datos faltantes.

## 10. PROVIDER_RESPONSE_EXTRACTION_POLICY_V2

V2 reemplaza V1:

~~~text
PROVIDER_RESPONSE_EXTRACTION_POLICY_V2 = {
  schemaVersion,
  providerConfigurationId,
  requiredObservationCapturePolicyDigest,
  responseMode,
  unitOrderingPolicy,
  selectedContentLocator,
  contentEncodingPolicy,
  concatenationPolicy,
  emptyOutputPolicy,
  multipleOutputPolicy,
  providerErrorPolicy,
  metadataUsePolicy
}
~~~

responseExtractionPolicyDigest = logicalSha256(PROVIDER_RESPONSE_EXTRACTION_POLICY_V2).

requiredObservationCapturePolicyDigest debe coincidir con la capture policy del record.

## 11. Replay determinista

La función lógica es:

~~~text
extract(PROVIDER_OBSERVATION_RECORD_V1, PROVIDER_RESPONSE_EXTRACTION_POLICY_V2)
→ EXTRACTED_MODEL_RESPONSE_V2
~~~

Debe depender solo de esos dos inputs. No puede leer SDK object original, ambient provider state, repo, defaults, conversation state ni metadata no bound.

## 12. EXTRACTED_MODEL_RESPONSE_V2

~~~text
EXTRACTED_MODEL_RESPONSE_V2 = {
  schemaVersion,
  observationCapturePolicyDigest,
  providerObservationRecordDigest,
  responseExtractionPolicyDigest,
  content
}
~~~

content = BYTE_STRING_V1. extractedModelResponseSha256 = content.sha256.

Resolver strict-parsea exclusivamente los decoded bytes de content.

## 13. Replay independiente por resolver

TRANSPORT_RECEIPT_V5 incluye PROVIDER_OBSERVATION_RECORD_V1 completo, sujeto a resource bounds.

Resolver debe:

~~~text
1. validar observation record
2. recomputar providerObservationRecordDigest
3. verificar observationCapturePolicyDigest
4. re-aplicar PROVIDER_RESPONSE_EXTRACTION_POLICY_V2
5. obtener resolverExtractedModelResponse
6. comparar deep-logically con transport extractedModelResponse
7. comparar content.sha256
8. recién entonces strict-parsear MODEL_RESPONSE
~~~

Si diverge: RESPONSE_EXTRACTION_REPLAY_MISMATCH → fail closed.

La independencia de replay comienza en el canonical observation record, no antes del observation boundary declarado.

## 14. R7-N2 — RESOURCE_POLICY_V3

Además de límites previos, V3 exige valores finitos para:

~~~text
maxRequestBytes
maxRawResponseBytes
maxOperations
maxStringLength
maxJsonDepth
maxJsonNodes
maxSingleValueBytes
timeoutMs
cancellationPolicy
maxObservationUnits
maxSingleObservationUnitDecodedBytes
maxCumulativeObservationDecodedBytes
maxSingleObservationUnitEncodedBytes
maxCumulativeObservationEncodedBytes
maxObservableMetadataBytesPerUnit
maxCumulativeObservableMetadataBytes
maxObservationRecordBytes
maxExtractedModelResponseBytes
maxTransportReceiptBytes
~~~

No existe default ilimitado. Los nombres pueden evolucionar; la cobertura no.

## 15. Enforcement incremental en STREAM

Transport mantiene contadores antes de retener crecimiento no acotado:

~~~text
unit count
cumulative observable decoded bytes
cumulative observable encoded bytes
cumulative metadata bytes
elapsed time
~~~

Por cada unit:

~~~text
1. check timeout/cancellation
2. check next unit count
3. bound observable payload before retention
4. bound metadata before retention
5. update cumulative decoded counters
6. reject before base64 materialization if decoded limit would be exceeded
7. canonicalize/base64 only bounded content
8. check encoded-size limits
9. retain only after all checks pass
~~~

Si se excede un límite se cancela la operación si es posible, el intento incompleto queda inutilizable, no hay partial MODEL_RESPONSE y no hay retry automático.

## 16. NON_STREAM resource enforcement

Para NON_STREAM, se aplica cualquier receive bound disponible del provider/runtime; luego se mide y limita la proyección antes de retener/base64-encodear. Si el SDK ya entrega un objeto materializado sin pre-allocation bounds, esa limitación se documenta y el post-return size check sigue siendo obligatorio.

No se presenta como protección pre-allocation si no existe.

## 17. Base64 y tamaños de artefactos

R8 distingue decoded content bytes, encoded dataBase64 bytes y logical JSON artifact bytes. Limitar uno no implica limitar automáticamente los otros.

Antes de logicalSha256(PROVIDER_OBSERVATION_RECORD_V1), su serialización canónica debe ser <= maxObservationRecordBytes.

Antes de construir EXTRACTED_MODEL_RESPONSE_V2, decoded content byteLength debe ser <= maxExtractedModelResponseBytes.

Resolver vuelve a verificar estos límites antes del parser.

## 18. TRANSPORT_RECEIPT_V5

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
observationCapturePolicyDigest
responseExtractionPolicyDigest
providerObservationRecordDigest
providerObservationRecord
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

Antes de retornar, canonical serialized receipt size debe ser <= maxTransportReceiptBytes. Si excede, no se retorna receipt exitoso.

## 19. TRANSPORT_INVOCATION_PACKAGE_V4

V4 reemplaza V3 y añade explícitamente:

~~~text
observationCapturePolicy
observationCapturePolicyDigest
responseExtractionPolicy
responseExtractionPolicyDigest
resourcePolicy = RESOURCE_POLICY_V3
~~~

Los bindings request/model/message/provider-envelope de R7 se conservan.

## 20. INPUT_BINDING_V3

V3 reemplaza V2:

~~~text
INPUT_BINDING_V3 = {
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
  observationCapturePolicyDigest,
  responseExtractionPolicyDigest
}
~~~

inputBindingDigest = logicalSha256(INPUT_BINDING_V3). Un cambio en capture, extraction o resource limits invalida el intento.

## 21. Post-response verification

Resolver conserva previamente transportInvocationId, inputBindingDigest, resourcePolicySha256, expectedProviderRequestEnvelopeDigest, observationCapturePolicyDigest y responseExtractionPolicyDigest.

Al recibir receipt V5:

~~~text
1. enforce maxTransportReceiptBytes
2. verify transportInvocationId
3. verify expected == actual provider envelope digest
4. verify resourcePolicySha256
5. validate canonical observation record
6. enforce observation/resource limits again
7. recompute providerObservationRecordDigest
8. verify observationCapturePolicyDigest
9. verify responseExtractionPolicyDigest
10. replay extraction from observation record
11. compare replay with extractedModelResponse
12. enforce maxExtractedModelResponseBytes
13. verify extracted content sha256
14. strict-parse exact extracted bytes
15. only then process PATCH/ABSTAIN
~~~

Después permanece el reread/rebind de run/report/dependencies antes de Repair R1.

## 22. Claims de evidencia

R8 permite afirmar: exact canonical observation record recibido por resolver; exact extraction policy fijada antes de invocation; replay independiente desde ese record; exact bytes de parser hash-bound.

R8 no permite afirmar: raw HTTP fidelity cuando SDK lo oculta; captura correcta del boundary por prueba criptográfica independiente; hidden provider behavior; output generativo idéntico.

## 23. Provenance closure

La futura dependency closure añade o actualiza:

~~~text
BYTE_STRING_SCHEMA
PROVIDER_OBSERVATION_CAPTURE_POLICY
PROVIDER_OBSERVATION_RECORD_SCHEMA
PROVIDER_RESPONSE_EXTRACTION_POLICY
EXTRACTED_MODEL_RESPONSE_SCHEMA
RESOURCE_POLICY
TRANSPORT_INVOCATION_PACKAGE_SCHEMA
TRANSPORT_RECEIPT_SCHEMA
RESPONSE_EXTRACTION_IMPLEMENTATION
OBSERVATION_CAPTURE_IMPLEMENTATION
~~~

Cada binding exige dependencyId + canonical repo-relative path + raw SHA-256. Los componentes previos de request/model/E5 permanecen en el closure.

## 24. Failure semantics añadidas

~~~text
OBSERVATION_CAPTURE_POLICY_MISMATCH
OBSERVATION_RECORD_INSUFFICIENT
OBSERVATION_RECORD_INVALID
OBSERVATION_UNIT_LIMIT_EXCEEDED
OBSERVATION_DECODED_BYTES_LIMIT_EXCEEDED
OBSERVATION_ENCODED_BYTES_LIMIT_EXCEEDED
OBSERVATION_METADATA_LIMIT_EXCEEDED
OBSERVATION_RECORD_TOO_LARGE
EXTRACTED_MODEL_RESPONSE_TOO_LARGE
TRANSPORT_RECEIPT_TOO_LARGE
RESPONSE_EXTRACTION_REPLAY_MISMATCH
BASE64_CANONICAL_PADDING_INVALID
~~~

Ninguna habilita retry automático.

## 25. OPEN preservados

~~~text
provider/model/runtime
schemas concretos R8
provider-specific observation boundary
provider-specific capture projection
provider-specific response extraction values
provider-specific role/mapping/request construction
hidden SDK/provider evidence
exact numeric resource limits
request serializer/schema
request projection
response schema
instruction artifacts
generation parameters
provider feature configuration
endpoint policy
transport implementation
sandbox
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
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R8-ASC-001
~~~

Contrato compilado:

~~~text
AUTHORIZED SOURCES
- branch head 7f055f992656ea56582dd6be67d831541ccc7f4b
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- E5.1 / E5.2 / E5.3 authorities
- R7 design
- R7 directed regression
- logicalSha256 implementation
- Repair R1 schema

MANDATORY RELATIONS
- canonical base64 padding is exactly 0/1/2 equals as required
- observation capture occurs before content selection
- observation record contains replay-sufficient pre-selection evidence
- extraction depends only on observation record + bound extraction policy
- resolver receives observation record and independently replays extraction
- resource policy bounds stream units, metadata, decoded/encoded evidence, observation record, extracted response and receipt
- limits are enforced incrementally before unbounded retention/materialization
- INPUT_BINDING_V3 binds capture, extraction and resource policy
- prior request-envelope bindings remain preserved
- prior closures remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

DO NOT INFER
- observation record proves pre-SDK raw HTTP response
- capture correctness is cryptographically independent of transport
- bounded decoded content automatically bounds encoded/logical artifact size
- replayable extraction proves provider internal semantics
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED
- selectedContent stored as pre-selection observation
- extraction from SDK object outside canonical observation record
- ad-hoc post-capture sanitization
- unbounded stream unit retention
- base64 materialization after decoded limit is already exceeded
- hashing oversized observation/receipt artifacts as valid evidence
- silent normalization/trim/fence stripping
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA
- R7-N1 replayable pre-selection observation record explicit
- resolver independent replay explicit
- R7-N2 resource bounds cover all new inbound evidence surfaces
- incremental stream enforcement explicit
- R7-N3 canonical padding wording corrected
- previous constraints preserved
- implementation remains unauthorized
~~~

ASC compila restricciones; no decide provider, schemas, numeric limits, implementation ni autoriza conexión.

## 27. AUDITORÍA

R8 corrige R7-N1 al introducir un capture record pre-selección y exigir que resolver reciba ese record y vuelva a ejecutar la extraction policy.

R8 corrige R7-N2 al extender resourcePolicy y fijar enforcement incremental antes de retener, base64-encodear, hashear o retornar evidencia potencialmente no acotada.

R8 corrige R7-N3 precisando el padding canónico RFC 4648.

## 28. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

La independencia de replay se declara desde PROVIDER_OBSERVATION_RECORD_V1. La corrección del capture desde el boundary externo depende de la implementación provenance-bound y sus tests; R8 no la presenta como prueba criptográfica independiente.

## 29. VACÍOS / OMISIONES

Los OPEN de §25 permanecen bloqueantes para implementación, en especial valores numéricos de resource policy y policies provider-specific. No impiden auditar R8 como diseño.

## 30. REDUNDANCIAS

~~~text
capture policy + extraction policy
→ qué evidencia se conserva + cómo se obtiene parser input

providerObservationRecordDigest + extractedModelResponseSha256
→ identidad de evidencia + identidad de parser input

transport replay + resolver replay
→ producer check + independent consumer check

transport resource enforcement + resolver resource recheck
→ bounded production + bounded consumption

E5.1 + E5.2 + E5.3
→ repair/run/durable authority
~~~

No crean autoridad paralela.

## 31. Resolución dirigida

~~~text
R7-N1 = ADDRESSED
R7-N2 = ADDRESSED
R7-N3 = ADDRESSED

ADDRESSED != regression PASS
~~~

## 32. Gate

~~~text
R8 authored
→ directed regression R7-N1/R7-N2/R7-N3
→ accumulated regression R6-N1..R6-N3
   + R5-N1..R5-N3
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
REPAIR_AGENT_INTEGRATION_DESIGN = R8_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~