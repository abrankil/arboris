# MAP-001 — Repair Agent Integration Design 003

Fecha: 2026-09-23
Estado: R3_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_002.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R2_DIRECTED_REGRESSION_001.md
Motivo de R3: corrección exclusiva de R2-N1, R2-N2 y R2-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo y alcance

R3 conserva todas las fronteras válidas de R2 y corrige únicamente los tres hallazgos bloqueantes de la regresión dirigida:

~~~text
R2-N1  separar model response, transport receipt e integration attempt record;
       congelar semántica de request/input digests.

R2-N2  exigir mutación JSON prototype-safe antes de permitir agentPatch generativo.

R2-N3  separar capacidades entre resolver/orchestrator,
       provider transport adapter y agent/model context.
~~~

R3 es exclusivamente documental. No modifica E5.1, E5.2, E5.3, schemas, provider, adapter, sandbox ni runtime.

## 2. Invariantes heredados

Permanecen obligatorios:

~~~text
agent authority = PROPOSE_AGENT_PATCH or ABSTAIN_WITHOUT_MUTATION
Repair R1 control-plane = resolver-owned
E5.1 = mandatory repair gate
E5.2 = mandatory run-context candidate layer
E5.3 = sole durable commit/recovery boundary
automaticRetries = 0
full loop = OUT_OF_SCOPE
minimalChange executable rule = OPEN / implementation-blocking
all unresolved implementation choices remain OPEN
~~~

Ningún PASS de diseño autoriza implementación.

## 3. R2-N1 — separación de capas de respuesta

R3 define tres artefactos distintos que no pueden colapsarse.

### 3.1 MODEL_RESPONSE

Es el único objeto cuyo contenido proviene del modelo.

Debe ser exactamente uno de:

~~~json
{
  "responseKind": "PATCH",
  "payload": {
    "operations": []
  }
}
~~~

o:

~~~json
{
  "responseKind": "ABSTAIN",
  "payload": null
}
~~~

Reglas:

~~~text
responseKind=PATCH
→ payload debe validar exactamente como Repair R1 definitions.agentPatch

responseKind=ABSTAIN
→ payload debe ser null
→ no Repair R1
→ no E5.1/E5.2/E5.3
→ attempt ends without mutation
~~~

El MODEL_RESPONSE no contiene ni puede fijar:

~~~text
attemptId
requestId
requestDigest
inputBindingDigest
providerInvocationBinding
transportInvocationId
providerRequestId
rawResponseSha256
parsedResponseSha256
runId
repairId
childProposalId
transactionId
~~~

Strict parsing se aplica al MODEL_RESPONSE, no al integration record.

### 3.2 TRANSPORT_RECEIPT

Es producido por el provider transport adapter, no por el modelo.

Contenido lógico mínimo:

~~~text
transportInvocationId
requestPayloadSha256
providerEndpointId
providerRuntimeDescriptor
providerRequestId, optional
rawResponseBytes
transportOutcome
sanitizedTransportError, optional
~~~

Reglas:

~~~text
transportInvocationId
→ asignado antes de enviar
→ no deriva de model output
→ identifica exactamente una invocation

providerRequestId
→ metadata opcional del proveedor
→ útil para trazabilidad
→ nunca es la única prueba de correlación

rawResponseBytes
→ bytes exactos retornados como contenido de respuesta del modelo
→ bounded before parse
~~~

El transport adapter no interpreta el agentPatch ni decide repair authorization.

### 3.3 INTEGRATION_ATTEMPT_RECORD

Es construido por resolver/orchestrator a partir del estado previo, el request emitido y el transport receipt.

Contenido lógico mínimo:

~~~text
attemptId
requestId
requestDigest
inputBindingDigest
transportInvocationId
providerRequestId, optional
requestPayloadSha256
rawResponseSha256
parsedResponseSha256, if parse succeeded
responseKind, if parse succeeded
outcome
failureClass
integrationDependencies
~~~

Este record es no autoritativo para dominio y no sustituye run-state, Repair R1 ni metadata E5.3.

## 4. Digest semantics congeladas

### 4.1 requestDigest

R3 elimina la ambigüedad de requestDigest.

Definición:

~~~text
requestDigest
=
SHA-256 de los bytes UTF-8 exactos
de la serialización determinista del bounded request content
que resolver entrega al provider transport adapter.
~~~

Alias de trazabilidad:

~~~text
requestPayloadSha256 == requestDigest
~~~

El transport adapter debe verificar que los bytes recibidos calculan ese mismo SHA antes de efectuar la llamada.

No se define requestDigest como hash del HTTP completo, headers, TLS frames ni serialización interna del SDK.

### 4.2 inputBindingDigest

Se define un objeto lógico versionado:

~~~text
INPUT_BINDING_V1 = {
  schemaVersion,
  runId,
  parentProposal: {
    proposalId,
    sha256,
    iteration
  },
  parentCandidateSha256,
  parentCandidateProjectionSha256,
  validationReport: {
    reportId,
    sha256,
    status
  },
  autoRepairFindingsSha256,
  patchPolicySha256,
  resourcePolicySha256,
  integrationDependenciesSha256
}
~~~

Cada hash interno usa la canonicalización lógica vigente de Árboris para objetos JSON.

integrationDependenciesSha256 se calcula sobre la lista exacta de:

~~~text
dependencyId
canonical repo-relative path
raw SHA-256
~~~

ordenada determinísticamente por dependencyId.

Definición final:

~~~text
inputBindingDigest
=
logicalSha256(INPUT_BINDING_V1)
~~~

Después de recibir MODEL_RESPONSE, resolver reconstruye INPUT_BINDING_V1 desde estado actual y exige igualdad exacta antes de construir Repair R1.

## 5. Correlación de una respuesta

La correlación no depende de campos repetidos por el modelo.

Secuencia:

~~~text
resolver creates attemptId + requestId + transportInvocationId
→ resolver freezes requestDigest + inputBindingDigest
→ resolver sends bounded request bytes + transportInvocationId to transport
→ transport verifies requestDigest
→ transport performs exactly one provider invocation
→ transport returns receipt through the same invocation handle
→ resolver hashes rawResponseBytes
→ resolver strict-parses MODEL_RESPONSE
→ resolver re-reads/rebinds current state
→ resolver recomputes inputBindingDigest
→ exact match required
~~~

Una respuesta tardía o recibida por otro invocation handle no puede adjuntarse al intento actual aunque su contenido sea idéntico.

## 6. Strict MODEL_RESPONSE boundary

R3 preserva los requisitos R2:

~~~text
exactly one JSON object
UTF-8 valid
no Markdown fence
no leading/trailing explanatory text
duplicate keys rejected
non-finite numeric representations rejected
unknown keys rejected
no coercion
no repair
no extraction of first object
raw byte hash before parse
~~~

Para PATCH, payload valida exactamente contra agentPatch.

Para ABSTAIN, payload debe ser null.

La tecnología del parser permanece OPEN.

## 7. Resource boundary

R3 conserva la resource policy y añade una precisión:

~~~text
maxRequestBytes
→ enforced by resolver before transport invocation
→ rechecked by transport before provider call

maxRawResponseBytes
→ enforced by transport while receiving or before returning complete bytes
→ resolver also rejects oversized receipt before parse
~~~

También siguen siendo obligatorios:

~~~text
maxOperations
maxStringLength
maxJsonDepth
maxJsonNodes
maxSingleValueBytes
timeoutMs
cancellationPolicy
~~~

Los valores numéricos permanecen OPEN y bloquean implementación.

## 8. R2-N2 — semántica JSON prototype-safe

R3 declara una nueva invariante de implementación futura:

~~~text
JSON_OBJECT_MUTATION_USES_OWN_DATA_PROPERTY_SEMANTICS
~~~

Una operación de repair sobre un objeto JSON no puede depender de setters heredados ni de lookup por prototype.

### 8.1 Traversal

Cada segmento de objeto intermedio debe:

~~~text
existir como own property
ser leído solo después de Object.hasOwn-equivalent
nunca resolverse desde prototype chain
~~~

La conducta vigente de E5.1 para traversal ya usa Object.hasOwn; R3 la convierte en requisito explícito de la futura frontera generativa.

### 8.2 Object add / replace

Para claves de objeto, una implementación compatible debe escribir una own data property directamente, sin invocar setters heredados.

Semántica requerida:

~~~text
define own enumerable/writable/configurable data property
with structured-cloned JSON value
~~~

Una implementación JavaScript puede usar una primitiva equivalente a Object.defineProperty con descriptor de data property.

No es aceptable depender de:

~~~text
parent[key] = value
~~~

cuando key puede provenir de un JSON Pointer no confiable.

### 8.3 Remove

Remove exige own property existente y elimina solo esa own property.

### 8.4 Special-key policy

R3 no introduce una blacklist textual de:

~~~text
__proto__
constructor
prototype
~~~

Esas strings pueden ser datos JSON legítimos. La seguridad debe provenir de semántica prototype-safe.

Si posteriormente se decide prohibir alguna clave, requerirá autoridad y justificación separadas.

### 8.5 Tests obligatorios antes de implementación autorizada

~~~text
add /__proto__
replace own /__proto__
remove own /__proto__
nested own __proto__
constructor/prototype as ordinary own JSON keys
prototype of containing object unchanged after add/replace
JSON stringify/parse roundtrip preserves intended own data
child proposal reconstruction remains exact
E5.1 post-gate equivalence remains exact
~~~

Hasta demostrar estos tests:

~~~text
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
IMPLEMENTATION_BLOCKED = TRUE
~~~

R3 no modifica E5.1; registra la rectificación ejecutable que deberá resolverse antes de conectar un agente.

## 9. R2-N3 — separación de capacidades en tres dominios

R3 sustituye el concepto monolítico de integration adapter por tres dominios lógicos.

### 9.1 RESOLVER / ORCHESTRATOR

Capacidades permitidas:

~~~text
read authorized run/proposal/report artifacts
recover E5.3 store
verify provenance/pins
construct bounded request
own attempt/request/repair/child/transaction IDs
strictly validate returned data
execute E5.1
execute E5.2
execute E5.3
write non-authoritative observability through declared sink
~~~

Capacidades prohibidas:

~~~text
provider credentials
arbitrary external egress
agent-controlled endpoint
exposing repo/runtime secrets to model
~~~

### 9.2 PROVIDER TRANSPORT ADAPTER

Capacidades permitidas:

~~~text
receive bounded request bytes + transportInvocationId
verify requestPayloadSha256
access provider secret through secret broker
egress only to pinned allowlisted provider endpoint
enforce transport timeout/cancellation/response-byte limit
return TRANSPORT_RECEIPT
~~~

Capacidades prohibidas:

~~~text
repo filesystem access
run-state access
authority-file access
E5.1/E5.2/E5.3 execution
durable-store access
Git/GitHub access
arbitrary network
agent-controlled URL
interpretation of repair semantics
construction of Repair R1
~~~

Provider redirects are rejected unless the redirect target is itself explicitly allowlisted by policy; no open redirect following.

Transport errors must be sanitized before crossing back to resolver.

### 9.3 AGENT / MODEL CONTEXT

Receives only bounded request content.

No filesystem, shell, process spawn, repo tools, run-state, durable store, provider credentials, environment secrets, arbitrary network or privileged tools.

Produces only MODEL_RESPONSE content.

## 10. Channel boundaries

Required logical channels:

~~~text
RESOLVER → TRANSPORT
bounded request bytes
transportInvocationId
requestPayloadSha256
pinned provider configuration identifier

TRANSPORT → RESOLVER
TRANSPORT_RECEIPT

RESOLVER → MODEL
only through TRANSPORT
bounded request content

MODEL → RESOLVER
only as rawResponseBytes inside TRANSPORT_RECEIPT
~~~

No channel carries a capability token from model back into a privileged API.

## 11. Physical isolation

R3 specifies capability separation, not process topology.

Preferred proof target:

~~~text
separate privilege domains
~~~

A future implementation may co-locate domains in one process only if it demonstrates equivalent capability denial by construction and tests.

Convenience is not evidence of isolation.

Concrete runtime/sandbox technology remains OPEN.

## 12. Secret boundary

Provider secrets:

~~~text
exist only in transport/secret-broker domain
never enter bounded request
never enter MODEL_RESPONSE
never enter resolver observability payload
never appear in unsanitized errors returned from transport
~~~

A provider or SDK assertion about isolation is not sufficient evidence.

## 13. Provenance after R3

The exact dependency tuple rule from R2 remains mandatory.

When implemented, the exact set must include separate identities for:

~~~text
REPAIR_SCHEMA
E5_1_REPAIR_GATE
E5_2_TRANSACTION_CANDIDATE
E5_3_DURABLE_STORE
REPAIR_AGENT_ORCHESTRATOR
PROVIDER_TRANSPORT_ADAPTER
AGENT_RESPONSE_PARSER
AGENT_REQUEST_SCHEMA
AGENT_RESPONSE_SCHEMA
AGENT_SANDBOX_POLICY
RESOURCE_POLICY
~~~

Each identity binds:

~~~text
dependencyId
canonical repo-relative path
raw SHA-256
~~~

No omitted component can be inferred as safe.

## 14. Post-response TOCTOU sequence

R3 freezes the sequence as:

~~~text
1. receive TRANSPORT_RECEIPT for exact transportInvocationId
2. verify requestPayloadSha256
3. verify maxRawResponseBytes
4. hash rawResponseBytes
5. strict-parse MODEL_RESPONSE
6. validate response schema
7. if ABSTAIN: stop without mutation
8. if PATCH: validate agentPatch
9. reread durable run
10. rebuild current parent/report bindings
11. reverify integration dependencies
12. rebuild INPUT_BINDING_V1
13. require exact inputBindingDigest match
14. require persisted == derived READY_TO_REPAIR
15. require exact REJECT_FIXABLE report
16. require exact relevant AUTO_REPAIR finding set
17. construct resolver-owned Repair R1
18. execute E5.1
19. execute E5.2
20. execute E5.3
~~~

Any divergence before step 17 discards the response for mutation.

## 15. Failure semantics additions

R3 adds:

~~~text
TRANSPORT_INVOCATION_MISMATCH
TRANSPORT_REQUEST_DIGEST_MISMATCH
TRANSPORT_ENDPOINT_POLICY_VIOLATION
TRANSPORT_SECRET_LEAK_BLOCKED
MODEL_RESPONSE_SCHEMA_INVALID
MODEL_RESPONSE_BINDING_STALE
PROTOTYPE_SAFE_APPLIER_UNAVAILABLE
~~~

Exact serialized failure schema remains OPEN.

No failure implies automatic retry.

## 16. Minimal change remains OPEN

R3 does not alter the R2 conclusion:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

Prototype safety does not prove minimality.

## 17. Observability

Resolver/orchestrator owns the non-authoritative attempt log.

Transport may return only sanitized metadata needed for:

~~~text
transportInvocationId
providerRequestId, optional
providerEndpointId
providerRuntimeDescriptor
requestPayloadSha256
transport timing/outcome
~~~

Secrets and raw authorization headers are prohibited from the log.

MODEL_RESPONSE remains data; logs are not a repair source or recovery source.

## 18. Apoyo ASC v0.1

ASC se usa únicamente para compilar las restricciones de R3.

~~~text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R3-ASC-001
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
- docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_002.md
- docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R2_DIRECTED_REGRESSION_001.md
- tools/proposal-resolution/schemas/repair.schema.json
- tools/proposal-resolution/map001_repair_gate_r1.mjs

MANDATORY RELATIONS
- MODEL_RESPONSE != TRANSPORT_RECEIPT != INTEGRATION_ATTEMPT_RECORD
- requestDigest binds exact deterministic bounded request bytes
- inputBindingDigest binds explicit INPUT_BINDING_V1
- model cannot author correlation/control-plane
- response must arrive through exact transport invocation handle
- JSON object mutation uses own-data-property semantics
- object traversal never resolves inherited properties
- resolver, transport and model have separate capability domains
- transport alone holds provider egress/secret capability
- resolver alone reaches E5.1/E5.2/E5.3
- E5.3 remains sole durable boundary

OPEN
- prototype-safe E5.1 rectification implementation
- exact deterministic request serializer/schema
- provider/model/runtime
- physical sandbox technology
- exact numeric resource limits
- strict parser implementation
- minimal-change executable rule or contract revision
- final failure schema
- ID algorithms
- observability sink/retention
- NEXT_STAGE_ID
- AUTHORIZED_FOR_ASC

DO NOT INFER
- transport metadata authored by model
- providerRequestId alone proves correlation
- JSON Pointer scope proves prototype safety
- prototype safety proves minimality
- co-location implies capability separation
- provider sandbox claim proves isolation
- R3 design correction authorizes implementation
- DOMAIN_PASS implies AUTHORIZED_FOR_ASC

PROHIBITED
- model-authored request/transport correlation
- direct object writes that can invoke inherited setters
- inherited-property traversal for JSON Pointer
- transport access to repo/run-state/E5/durable store
- resolver possession of provider secrets or arbitrary egress
- agent/model tools or secrets
- direct durable writes outside E5.3
- automatic retry
- assignment of NEXT_STAGE_ID by inference

VALIDATION CRITERIA
- R2-N1 layer separation and digest semantics explicit
- R2-N2 prototype-safe mutation semantics + tests explicit
- R2-N3 three-domain capability split explicit
- RA-I1..RA-I8 constraints preserved
- implementation remains unauthorized
- all unresolved decisions remain OPEN
~~~

ASC no valida técnicamente la seguridad ni autoriza implementación.

## 19. AUDITORÍA

R3 resuelve documentalmente los tres hallazgos de la regresión R2 sin ampliar la autoridad del agente.

La separación de response layers elimina la contradicción entre datos model-owned y control adapter-owned.

La regla prototype-safe trata special keys como datos JSON sin depender de una blacklist.

La separación resolver/transport/model reduce el conjunto de capacidades simultáneas de cada dominio.

## 20. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1 ni con E5.1/E5.2/E5.3.

Existe una deuda ejecutable deliberada: E5.1 vigente todavía usa asignación directa para object add/replace. R3 no la oculta ni la corrige en código; la deja como prerequisito explícito antes de implementación del agente.

## 21. VACÍOS / OMISIONES

Permanecen OPEN y bloqueantes antes de implementar:

~~~text
prototype-safe repair applier implementation + tests
minimal-change executable rule or authority-level contract revision
deterministic request serializer/schema
request projection algorithm
provider/model/runtime
transport implementation
sandbox technology
resource-limit values
strict parser implementation
final schemas
ID allocation
observability sink/retention
adversarial implementation tests
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 22. REDUNDANCIAS

Son intencionales:

~~~text
requestDigest
+ inputBindingDigest
→ bytes exactos y semántica de bindings cubren riesgos distintos

transport correlation
+ post-response input rebind
→ correlación y freshness cubren riesgos distintos

prototype-safe write primitive
+ E5.1 post-gate reconstruction
→ runtime safety y semantic correctness cubren riesgos distintos

preflight
+ E5.2 checks
+ E5.3 fresh reconstruction/CAS
→ defensa en profundidad
~~~

No se crean fuentes de verdad paralelas.

## 23. Resolución dirigida R2-N1..R2-N3

~~~text
R2-N1
MODEL_RESPONSE / TRANSPORT_RECEIPT / INTEGRATION_ATTEMPT_RECORD separated
requestDigest semantics frozen
INPUT_BINDING_V1 and inputBindingDigest frozen
transport invocation correlation frozen
→ ADDRESSED

R2-N2
own-property traversal/write semantics required
prototype-safe mutation requirement explicit
special-key adversarial tests mandatory
current E5.1 debt kept visible
→ ADDRESSED WITHOUT CLAIMING IMPLEMENTATION

R2-N3
resolver / transport / model capability domains separated
egress/secrets isolated to transport
E5 access isolated to resolver
logical channels frozen
→ ADDRESSED
~~~

ADDRESSED significa corrección del diseño, no PASS de regresión.

## 24. Gate

Secuencia siguiente:

~~~text
R3 authored
→ directed regression R2-N1/R2-N2/R2-N3
→ regression RA-I1..RA-I8
→ correct any new finding
→ design validation
→ explicit human implementation decision
→ only then consider executable rectifications/adapter/sandbox
~~~

Estado:

~~~text
REPAIR_AGENT_INTEGRATION_DESIGN = R3_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~
