# MAP-001 — Repair Agent Integration Design 009

Fecha: 2026-09-23
Estado: R9_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_008.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R8_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R8-N1, R8-N2 y R8-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R9 conserva las fronteras válidas de R8 y corrige solo:

~~~text
R8-N1
dominio JSON canónico y canonicalización prototype-safe.

R8-N2
binding de cada response unit al provider invocation exacto.

R8-N3
separación entre wire/provider limits,
observation-boundary limits y canonical-evidence limits.
~~~

R9 es exclusivamente documental. No implementa canonicalizer, transport, provider, parser, sandbox, repair agent, rectificación E5.1 ni full loop.

## 2. Invariantes heredados

~~~text
MODEL_RESPONSE != TRANSPORT_RECEIPT != INTEGRATION_ATTEMPT_RECORD
MODEL_INVOCATION_POLICY_V2 = única policy normativa
agent authority = PROPOSE_AGENT_PATCH or ABSTAIN_WITHOUT_MUTATION
Repair R1 control-plane = resolver-owned
E5.1 = mandatory
E5.2 = mandatory
E5.3 = sole durable commit/recovery boundary
automaticRetries = 0
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 3. R8-N1 — CANONICAL_JSON_VALUE_V1

logicalSha256 para esta integración solo puede aceptar:

~~~text
null
boolean
string
finite JSON number under an explicit number policy
dense array of canonical JSON values
JSON object made only of own enumerable string data properties
~~~

Debe rechazar antes del hash:

~~~text
undefined
function
symbol
bigint
NaN
Infinity
-Infinity
sparse arrays
accessors
Date
Map
Set
RegExp
Buffer
Uint8Array
ArrayBuffer
class instances
Proxy
symbol-keyed semantic fields
cyclic graphs
other non-JSON runtime objects
~~~

BYTE_STRING_V1 permanece como representación autorizada de contenido byte-bearing dentro de objetos lógicos.

## 4. Prototype-safe object semantics

Un JSON object se define solo por own enumerable string data properties.

La prototype chain no participa. Inherited properties nunca se leen. Getters/setters no se ejecutan.

Las claves:

~~~text
__proto__
constructor
prototype
~~~

son datos JSON ordinarios y no se prohíben por blacklist.

La futura canonicalización debe ordenar keys determinísticamente sin escribirlas mediante una operación que pueda activar setters heredados.

Estrategias admisibles, sujetas a tests:

~~~text
Object.create(null) + own data properties
sorted-entry direct serializer
otra primitiva equivalentemente prototype-safe
~~~

La implementación vigente de logicalSha256 no se considera suficiente para este nuevo dominio y permanece como deuda ejecutable.

## 5. CANONICAL_JSON_SERIALIZATION_V1

Secuencia requerida:

~~~text
1. validar dominio JSON permitido
2. detectar ciclos
3. exigir arrays densos
4. preservar orden de índices
5. enumerar solo own enumerable string keys
6. ordenar object keys determinísticamente
7. no normalizar strings
8. aplicar number policy explícita
9. emitir bytes UTF-8 JSON deterministas
10. SHA-256 sobre esos bytes
~~~

CANONICAL_JSON_NUMBER_POLICY permanece OPEN y bloquea implementación. Debe fijar al menos finite-only, tratamiento de -0, enteros fuera del rango seguro y rendering decimal/exponencial determinista.

## 6. Provenance y tests del canonicalizer

La futura dependency closure debe incluir:

~~~text
CANONICAL_JSON_DOMAIN_SPEC
CANONICAL_JSON_SERIALIZER
CANONICAL_JSON_NUMBER_POLICY
LOGICAL_SHA256_IMPLEMENTATION
~~~

Cada binding exige dependencyId + canonical repo-relative path + raw SHA-256.

Tests mínimos:

~~~text
own __proto__
own constructor
own prototype
nested special keys
different insertion order / same logical hash
dense-array order
sparse-array rejection
accessor rejection
class-instance rejection
Buffer/Uint8Array rejection
NaN/Infinity rejection
cycle rejection
BYTE_STRING_V1
PROVIDER_OBSERVATION_RECORD
INPUT_BINDING
Repair candidate logical hash
~~~

## 7. R8-N2 — PROVIDER_INVOCATION_SOURCE_BINDING_V1

R9 introduce:

~~~text
PROVIDER_INVOCATION_SOURCE_BINDING_V1 = {
  schemaVersion,
  transportInvocationId,
  providerInvocationHandleId,
  responseChannelMode,
  providerRequestIdPolicy,
  providerRequestId
}
~~~

providerRequestId puede ser null solo cuando providerRequestIdPolicy lo permita.

providerInvocationHandleId representa exactamente una provider invocation concreta. Se liga antes de aceptar response units, no es model-authored, no se reutiliza y se cierra al terminar/cancelar la invocación.

## 8. providerRequestIdPolicy

Valores:

~~~text
REQUIRED_AND_VERIFIED
OPTIONAL_IF_EXPOSED
UNAVAILABLE_BY_PROVIDER
~~~

REQUIRED_AND_VERIFIED exige ID presente y coincidencia en toda evidencia disponible.

OPTIONAL_IF_EXPOSED permite null solo si el provider no expuso ID; si aparece, todas sus ocurrencias deben coincidir.

UNAVAILABLE_BY_PROVIDER exige null y deja providerInvocationHandleId como primitiva principal de correlación.

Nunca se inventa un providerRequestId.

## 9. Response channel binding

responseChannelMode distingue:

~~~text
NON_STREAM_RETURN
STREAM_HANDLE
CALLBACK_HANDLE
DIRECT_HTTP_RESPONSE
~~~

La combinación válida debe concordar con responseMode y observationBoundary.

Para STREAM_HANDLE y CALLBACK_HANDLE:

~~~text
capture subscription/iterator is scoped to providerInvocationHandleId
late units after closure are rejected
units from another active handle are rejected
multiplexed SDK client does not imply a shared observation channel
~~~

El mecanismo concreto permanece provider-specific y OPEN.

## 10. PROVIDER_OBSERVATION_RECORD_V2

V2 reemplaza V1:

~~~text
PROVIDER_OBSERVATION_RECORD_V2 = {
  schemaVersion,
  sourceBinding,
  sourceBindingDigest,
  observationCapturePolicyDigest,
  observationBoundary,
  responseMode,
  units: [
    {
      sequence,
      sourceBindingRef,
      unitType,
      observablePayload,
      observableMetadata
    }
  ],
  terminalStatus
}
~~~

Se calcula:

~~~text
providerInvocationSourceBindingDigest
= logicalSha256(PROVIDER_INVOCATION_SOURCE_BINDING_V1)
~~~

Cada unit debe referir exactamente el mismo source binding. Una unit de otro handle, request o canal no entra al record.

Resolver verifica el source binding contra la invocación iniciada.

## 11. TRANSPORT_RECEIPT_V6

V6 reemplaza V5 y añade:

~~~text
providerInvocationSourceBinding
providerInvocationSourceBindingDigest
providerObservationRecord V2
providerObservationRecordDigest
~~~

junto con todos los bindings request/model/resource/envelope/extraction ya heredados.

providerRequestId en receipt y observation record debe obedecer la misma policy.

## 12. R8-N3 — RESOURCE_POLICY_V4

R9 elimina maxRawResponseBytes como obligación universal y separa tres superficies:

~~~text
A. WIRE_OR_PROVIDER_RECEIVE_LIMITS
B. OBSERVATION_BOUNDARY_LIMITS
C. CANONICAL_EVIDENCE_LIMITS
~~~

## 13. Wire/provider receive limits

Campos conceptuales:

~~~text
wireReceiveLimitMode
maxWireOrProviderResponseBytes
~~~

wireReceiveLimitMode:

~~~text
ENFORCED
NOT_OBSERVABLE
NOT_SUPPORTED
~~~

ENFORCED requiere valor finito y evidencia real de enforcement.

NOT_OBSERVABLE exige maxWireOrProviderResponseBytes = null y prohíbe claim de raw/wire bound.

NOT_SUPPORTED también usa null y registra que la capa es conocida pero el runtime seleccionado no permite imponer el límite previo.

## 14. Observation-boundary limits

Siempre deben corresponder al observationBoundary declarado:

~~~text
maxObservationUnits
maxSingleObservableUnitDecodedBytes
maxCumulativeObservableDecodedBytes
maxSingleObservableUnitEncodedBytes
maxCumulativeObservableEncodedBytes
maxObservableMetadataBytesPerUnit
maxCumulativeObservableMetadataBytes
~~~

Para STREAM/CALLBACK se aplican incrementalmente antes de retener crecimiento no acotado.

Para NON_STREAM se mide la proyección observable que realmente está disponible en el boundary seleccionado.

## 15. Canonical-evidence limits

Incluyen:

~~~text
maxObservationRecordBytes
maxExtractedModelResponseBytes
maxTransportReceiptBytes
maxCanonicalHashInputBytes
~~~

Antes de canonical JSON serialization + logicalSha256, el artefacto completo debe respetar maxCanonicalHashInputBytes.

Limitar decoded bytes no implica automáticamente limitar base64 ni JSON.

## 16. Claims de enforcement

Cada límite debe declarar:

~~~text
surface
measurement point
enforcement point
failure code
evidence level
~~~

Un check posterior a que el SDK ya materializó un objeto grande es bounded-consumption evidence, no pre-allocation protection.

R9 prohíbe presentar una comprobación post-materialization como si hubiese evitado la asignación previa.

## 17. RESOURCE_POLICY_V4 e INPUT_BINDING_V4

RESOURCE_POLICY_V4 conserva además:

~~~text
maxRequestBytes
maxOperations
maxStringLength
maxJsonDepth
maxJsonNodes
maxSingleValueBytes
timeoutMs
cancellationPolicy
~~~

No existen defaults ilimitados.

INPUT_BINDING_V4 reemplaza V3 y conserva todos sus bindings, añadiendo:

~~~text
providerInvocationSourcePolicySha256
resourcePolicySha256
~~~

Un cambio en source-correlation policy o resource-surface semantics invalida el intento.

## 18. TRANSPORT_INVOCATION_PACKAGE_V5

V5 reemplaza V4 y añade:

~~~text
providerInvocationSourcePolicy
providerInvocationSourcePolicySha256
resourcePolicy = RESOURCE_POLICY_V4
~~~

Transport debe usar esa policy al crear el handle y aceptar response units.

No puede elegir una correlación diferente después del provider call.

## 19. Post-response verification

Antes del parser, resolver verifica:

~~~text
transportInvocationId
providerInvocationSourceBinding.transportInvocationId
providerInvocationSourceBindingDigest
providerRequestIdPolicy
providerRequestId consistency when available
all observation-unit sourceBindingRef values
absence of late/cross-handle/cross-request units
resourcePolicySha256
boundary-specific resource claims
providerObservationRecordDigest
independent extraction replay
extractedModelResponseSha256
~~~

Después se conserva:

~~~text
strict parse
→ PATCH/ABSTAIN handling
→ reread/rebind current run/report/dependencies
→ Repair R1
→ E5.1
→ E5.2
→ E5.3
~~~

## 20. Failure semantics añadidas

~~~text
CANONICAL_JSON_VALUE_INVALID
CANONICAL_JSON_NONFINITE_NUMBER
CANONICAL_JSON_SPARSE_ARRAY
CANONICAL_JSON_ACCESSOR_FORBIDDEN
CANONICAL_JSON_RUNTIME_OBJECT_FORBIDDEN
CANONICAL_JSON_CYCLE
CANONICAL_JSON_SPECIAL_KEY_MISMATCH

PROVIDER_INVOCATION_SOURCE_MISMATCH
PROVIDER_INVOCATION_HANDLE_MISMATCH
PROVIDER_REQUEST_ID_MISMATCH
LATE_RESPONSE_UNIT
CROSS_INVOCATION_RESPONSE_UNIT
UNBOUND_RESPONSE_UNIT

WIRE_LIMIT_UNVERIFIABLE
OBSERVATION_BOUNDARY_LIMIT_EXCEEDED
CANONICAL_EVIDENCE_LIMIT_EXCEEDED
CANONICAL_HASH_INPUT_TOO_LARGE
~~~

Ninguna habilita retry automático.

## 21. OPEN preservados

~~~text
CANONICAL_JSON_NUMBER_POLICY
canonicalizer implementation
provider/model/runtime
provider-specific invocation-source mechanism
providerRequestId policy selection
provider-specific observation boundary
provider-specific capture/extraction values
exact numeric resource limits
schemas concretos R9
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

## 22. Apoyo ASC v0.1

~~~text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R9-ASC-001
~~~

Contrato compilado:

~~~text
AUTHORIZED SOURCES
- branch head b04a382c15413c138926665cd725ea30c5a9796a
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- E5.1 / E5.2 / E5.3 authorities
- R8 design
- R8 directed regression
- current logicalSha256 implementation
- Repair R1 schema

MANDATORY RELATIONS
- logical hash domain is explicit JSON-only
- canonicalizer is prototype-safe for arbitrary JSON string keys
- non-JSON runtime values fail closed
- provider invocation source binding exists before response units are accepted
- every response unit binds to exact provider invocation handle
- providerRequestId semantics are explicit
- wire limits are claimed only when measurable/enforceable
- observation limits match declared boundary
- canonical evidence limits are separate
- pre-allocation and post-materialization evidence are not conflated
- prior closures remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

DO NOT INFER
- current logicalSha256 is already safe for R9 domain
- providerRequestId always exists
- transportInvocationId alone proves provider unit provenance
- post-materialization size check prevents provider-side allocation
- wire bytes are observable when SDK hides them
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED
- inherited-setter writes during canonicalization
- hashing non-JSON runtime values without rejection
- accepting response units from unbound/other/closed handles
- inventing providerRequestId
- claiming raw/wire byte limits when unobservable
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA
- R8-N1 canonical JSON domain + prototype-safe serializer requirements explicit
- R8-N2 provider invocation source binding explicit
- R8-N3 wire/observation/evidence resource layers separated
- previous constraints preserved
- implementation remains unauthorized
~~~

ASC compila restricciones; no decide canonicalizer, provider, numeric limits, schemas, implementación ni autoriza conexión.

## 23. AUDITORÍA

R9 corrige R8-N1 al separar explícitamente el dominio JSON lógico de los valores runtime y exigir canonicalización prototype-safe.

R9 corrige R8-N2 al introducir una identidad concreta para el provider invocation y reglas de pertenencia de cada response unit.

R9 corrige R8-N3 al reemplazar el supuesto universal de raw response bytes por superficies medibles según el observation boundary real.

## 24. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

La implementación vigente de logicalSha256 queda explícitamente identificada como insuficiente para el nuevo dominio; R9 no afirma que ya esté corregida.

## 25. VACÍOS / OMISIONES

Los OPEN de §21 permanecen bloqueantes para implementación, especialmente canonical JSON number policy, canonicalizer, provider-specific source binding y valores numéricos de resource policy.

No impiden auditar R9 como diseño.

## 26. REDUNDANCIAS

Son intencionales:

~~~text
prototype-safe canonicalizer
+ prototype-safe repair applier
→ hash semantics + mutation semantics

transportInvocationId
+ providerInvocationHandleId
+ providerRequestId when available
→ orchestration + concrete call + provider-native evidence

wire limits
+ observation limits
+ canonical evidence limits
→ distinct measurable surfaces

observation digest
+ extraction replay
+ parser-input hash
→ evidence identity + extraction correctness + exact parser input

E5.1 + E5.2 + E5.3
→ repair/run/durable authority
~~~

No crean autoridad paralela.

## 27. Resolución dirigida

~~~text
R8-N1 = ADDRESSED
R8-N2 = ADDRESSED
R8-N3 = ADDRESSED

ADDRESSED != regression PASS
~~~

## 28. Gate

~~~text
R9 authored
→ directed regression R8-N1/R8-N2/R8-N3
→ accumulated regression R7-N1..R7-N3
   + R6-N1..R6-N3
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
REPAIR_AGENT_INTEGRATION_DESIGN = R9_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~
