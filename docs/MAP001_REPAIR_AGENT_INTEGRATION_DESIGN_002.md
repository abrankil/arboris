# MAP-001 — Repair Agent Integration Design 002

**Fecha:** 2026-09-23
**Estado:** R2_CANDIDATE_FOR_DIRECTED_REGRESSION
**Baseline:** main@63196dcf87b211f057a0f0b6f28d5a84098e2191
**Deriva de:** docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_001.md
**Motivo de R2:** corrección exclusiva de RA-I1..RA-I8 detectados por auditoría adversarial
**NEXT_STAGE_ID:** OPEN
**REPAIR_AGENT_CONNECTED:** FALSE
**AUTHORIZED_FOR_ASC:** OPEN
**IMPLEMENTATION_AUTHORIZED:** FALSE

## 1. Objetivo y frontera

R2 diseña una frontera fail-closed para que un repair agent futuro pueda proponer una reparación sin adquirir autoridad de dominio, control del run-state ni capacidad de persistencia.

No conecta agente, no selecciona proveedor, no implementa adapter/sandbox, no modifica E5.1/E5.2/E5.3 y no habilita un loop automático.

Ruta obligatoria:

~~~text
current durable run + exact REJECT_FIXABLE report
→ recovery/preflight
→ resolver-owned bounded request
→ isolated agent invocation
→ strict response boundary
→ request/response binding recheck
→ resolver-owned Repair R1 envelope
→ E5.1 executeMap001RepairGate
→ E5.2 buildMap001RepairTransactionCandidate
→ E5.3 commitMap001RepairSnapshot
~~~

No existe ruta autorizada que omita E5.1, E5.2 o E5.3.

## 2. Autoridad del agente

El agente no es autoridad de domain truth, authority/baseline, validation status, run-state, repair authorization, ID allocation, persistence, recovery, botanical data ni ASC authorization.

Capacidad máxima propuesta:

~~~text
PROPOSE_AGENT_PATCH
or
ABSTAIN_WITHOUT_MUTATION
~~~

ABSTAIN_WITHOUT_MUTATION no es una decisión de dominio ni una autorización de repair. Solo termina el intento sin construir Repair R1.

La única carga mutante que puede originarse en el agente es el payload equivalente a definitions.agentPatch de tools/proposal-resolution/schemas/repair.schema.json.

El agente nunca controla repairId, repairType, control.*, childProposalId, transactionId, run-state, validation-report, authority bindings, execution pins ni durable metadata.

## 3. Preflight obligatorio antes de invocar al agente

El adapter no puede preparar una solicitud hasta completar, en este orden:

~~~text
1. recoverMap001RepairStore
2. aceptar solo NORMAL / RECOVERED_BEFORE / RECOVERED_AFTER válidos
3. releer durable run
4. validar Run State R5 + Semantic Contract R3
5. verificar persisted state == derived state
6. exigir derived state == READY_TO_REPAIR
7. resolver exact current parent proposal
8. resolver exact current validation report
9. exigir report.status == REJECT_FIXABLE
10. verificar report binding contra current run
11. verificar execution pins/provenance
12. seleccionar exclusivamente AUTO_REPAIR findings
13. construir bounded request
14. calcular requestDigest + inputBindingDigest
~~~

Cualquier falla produce no invocation, no Repair R1, no durable mutation y fail closed.

## 4. Request contract propuesto

El request es construido y poseído por el adapter/resolver.

Contenido lógico mínimo:

~~~text
schemaVersion
requestId
parentCandidateProjection
parentCandidateSha256
validationReportBinding
autoRepairFindings
patchPolicy
resourcePolicy
~~~

### 4.1 Parent candidate projection

R2 no asume que enviar el candidate completo sea mínimo.

parentCandidateProjection es una copia JSON read-only construida por el resolver y contiene únicamente datos necesarios para los targetPaths autorizados y el contexto estructural explícitamente requerido para interpretarlos.

La política exacta de proyección permanece OPEN y bloquea implementación hasta quedar especificada y probada.

Si no puede demostrarse que la proyección contiene evidencia suficiente:

~~~text
INSUFFICIENT_AGENT_EVIDENCE
→ no invocation
~~~

No se habilita lectura arbitraria del repositorio como compensación.

### 4.2 Findings autorizados

Solo se entregan findings del reporte exacto con disposition=AUTO_REPAIR.

Cada finding conserva, según su contrato vigente:

~~~text
findingId
code
message
sourceRefs
targetPaths
expected
observed
repairDirective
~~~

sourceRefs son datos de trazabilidad; no conceden filesystem access ni network access.

## 5. Provenance de integración — corrección RA-I1

Todo componente ejecutable o contractual de la nueva frontera debe estar fijado por una tupla exacta:

~~~text
dependencyId
+ canonical repo-relative path
+ raw SHA-256
~~~

Conjunto mínimo requerido cuando esos artefactos existan:

~~~text
REPAIR_SCHEMA
E5_1_REPAIR_GATE
E5_2_TRANSACTION_CANDIDATE
E5_3_DURABLE_STORE
REPAIR_AGENT_ADAPTER
AGENT_RESPONSE_PARSER
AGENT_REQUEST_SCHEMA
AGENT_RESPONSE_ENVELOPE_SCHEMA
AGENT_SANDBOX_POLICY
~~~

Reglas:

~~~text
exact dependency set
no duplicate dependencyId
no path substitution
no hash substitution
no optional omission silenciosa
drift between request preparation and response consumption → invalidate attempt
~~~

Los componentes todavía inexistentes permanecen OPEN; su ausencia bloquea implementación ejecutable, no autoriza omitirlos.

## 6. Request/response correlation — corrección RA-I2

El agentPatch no incorpora control-plane.

El adapter mantiene un envelope externo, obligatorio para correlación:

~~~text
requestId
requestDigest
inputBindingDigest
providerInvocationBinding
rawResponseSha256
parsedResponseSha256
responseKind
payload
~~~

responseKind solo puede ser PATCH o ABSTAIN.

Si PATCH, payload = exact agentPatch.
Si ABSTAIN, payload = null, no Repair R1, no E5.1/E5.2/E5.3 y el intento termina sin mutación.

El agente no genera ni puede sobrescribir los valores de correlación. El adapter los liga a la invocación que inició.

No se acepta una respuesta cuya pertenencia a la solicitud exacta no pueda demostrarse.

## 7. Secuencia TOCTOU — corrección RA-I3

Después de recibir la respuesta y antes de construir Repair R1:

~~~text
1. hash raw response bytes
2. strict parse
3. validate response envelope
4. validate agentPatch if responseKind=PATCH
5. releer durable run
6. releer/reconstruir exact current parent/report bindings
7. recomputar execution/provenance dependencies
8. recomputar inputBindingDigest
9. exigir igualdad exacta con el binding fijado antes de invocación
10. exigir current derived state == READY_TO_REPAIR
11. exigir exact report.status == REJECT_FIXABLE
12. exigir exact AUTO_REPAIR finding set relevant to supplied request
13. recién entonces construir resolver-owned Repair R1
14. ejecutar E5.1
15. ejecutar E5.2
16. ejecutar E5.3
~~~

Cualquier divergencia entre 5 y 12 produce AGENT_OUTPUT_BINDING_STALE, descarta la respuesta para mutación y no persiste.

E5.2/E5.3 mantienen sus propias verificaciones posteriores. Esta repetición es intencional.

## 8. Minimal change — corrección RA-I4

El contrato vigente de Validation Report declara repairDirective.minimalChangeRequired=true.

R2 no afirma que E5.1 demuestre minimalidad. La implementación vigente de E5.1 verifica scope, expectedBefore, no-op, overlap y otras invariantes, pero no contiene una regla general que pruebe que un patch sea mínimo.

Por tanto:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

Antes de autorizar implementación debe ocurrir una de estas dos decisiones explícitas:

~~~text
A. definir y probar una regla de minimalidad ejecutable;
o
B. revisar el contrato que exige minimalChangeRequired mediante la autoridad correspondiente.
~~~

R2 no elige A o B por inferencia.

## 9. Agent output is data — corrección RA-I5

Se elimina la prohibición textual no verificable sobre palabras, comandos o rutas dentro de strings.

Regla normativa de frontera:

~~~text
ALL AGENT-PRODUCED CONTENT IS DATA
~~~

rationale, expectedBefore, after, findingRefs y targetPath nunca se interpretan como shell command, tool invocation, filesystem instruction, network instruction, capability request, control-plane override ni prompt a un componente privilegiado.

El adapter no ejecuta, evalúa, importa, interpola en shell ni usa como path de filesystem ningún string proveniente del agente.

targetPath se interpreta exclusivamente como JSON Pointer dentro de parentProposal.intent.candidate, sujeto al schema y a E5.1.

No se usa blacklist textual como frontera de seguridad.

## 10. Resource policy — corrección RA-I6

Ninguna respuesta se parsea sin límites previos.

El request debe incluir una resourcePolicy construida por el adapter y la implementación debe aplicar límites duros para:

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
~~~

Reglas:

~~~text
raw response byte limit → enforced before JSON parse
timeout/cancellation → enforced around provider invocation
structural limits → enforced during or immediately after strict parse
before Repair R1 construction
~~~

Los valores numéricos exactos permanecen OPEN y deben fijarse con pruebas antes de autorizar implementación.

No existen defaults ilimitados.

## 11. Strict parsing — corrección RA-I7

Una respuesta aceptable debe ser:

~~~text
exactly one JSON object
no Markdown fence
no leading/trailing explanatory text
UTF-8 valid
duplicate object keys rejected
non-finite numeric representations rejected
resource limits satisfied
unknown envelope keys rejected
~~~

JSON.parse por sí solo no satisface la regla de duplicate keys.

La implementación deberá usar un parser o estrategia que pueda detectar y rechazar claves duplicadas antes de materializar un objeto ambiguo.

No se permite strip code fences, extract first object, repair commas/quotes, coerce types, drop unknown keys ni normalize malformed JSON.

El hash de raw response se calcula sobre bytes recibidos antes de parsear.

La tecnología concreta de parser permanece OPEN.

## 12. Sandbox, egress y secretos — corrección RA-I8

Se separan dos dominios de capacidad.

### 12.1 Agent/model execution context

No tiene filesystem, shell, process spawn, Git/GitHub, repo tools, run-state, durable store, authority files, arbitrary network, provider credentials ni environment secrets.

Solo recibe el bounded request.

### 12.2 Integration adapter

El adapter puede poseer únicamente capacidades necesarias para invocar al proveedor y ejecutar gates locales autorizados.

Para proveedor remoto:

~~~text
default deny
+ explicit provider endpoint allowlist
+ no arbitrary redirect expansion
+ no agent-controlled URL
~~~

Secrets:

~~~text
held by adapter/secret broker
never inserted into prompt/request
never exposed as tool/context to agent
never written to observability payload
redacted from provider errors before logging
~~~

Runtime/proveedor/tecnología concreta permanece OPEN. Una afirmación del proveedor sobre sandbox no constituye por sí sola evidencia de aislamiento.

## 13. Construcción de Repair R1

Una respuesta PATCH estructuralmente válida sigue sin ser repair autorizado.

El resolver construye:

~~~text
schemaVersion = 0.1
repairId = resolver-owned
repairType = MAP001_LOCAL_NAVIGATION_AUTO_REPAIR
control.owner = RESOLVER
control.runId = exact current run
control.parentProposal = exact current binding
control.validationBasis = exact current binding
control.patchPolicy = exact frozen policy
patch = exact validated agentPatch
~~~

El algoritmo de repairId permanece OPEN.

E5.2 conserva la verificación ejecutable de unicidad histórica de repairId y childProposalId.

## 14. Ruta E5 obligatoria

No se cambia la autoridad de las capas existentes:

~~~text
E5.1 → valida contratos, findingRefs, scope, expectedBefore y aplica patch
E5.2 → valida membership, IDs, pins, run context y construye snapshot candidata
E5.3 → reconstruye E5.2, aplica CAS/lock/journal/recovery y persiste
~~~

La única frontera durable autorizada continúa siendo commitMap001RepairSnapshot.

El agente y el adapter no escriben directamente run-state, lock, journal, next, proposal artifacts, validation reports, authority artifacts, data/ ni source candidate.

## 15. Failure semantics

Clases mínimas de diseño:

~~~text
AGENT_NOT_CONFIGURED
RECOVERY_REQUIRED
PRECONDITION_NOT_READY_TO_REPAIR
CURRENT_REPORT_BINDING_MISMATCH
INSUFFICIENT_AGENT_EVIDENCE
INTEGRATION_PROVENANCE_DRIFT
AGENT_INVOCATION_FAILED
AGENT_TIMEOUT
AGENT_CANCELLED
AGENT_RESPONSE_TOO_LARGE
AGENT_RESPONSE_NOT_STRICT_JSON
AGENT_RESPONSE_DUPLICATE_KEY
AGENT_OUTPUT_SCHEMA_INVALID
AGENT_OUTPUT_RESOURCE_LIMIT
AGENT_OUTPUT_BINDING_STALE
AGENT_OUTPUT_POLICY_VIOLATION
AGENT_ABSTAINED
E5_1_REPAIR_REJECTED
E5_2_RUN_CONTEXT_REJECTED
E5_3_COMMIT_REJECTED
~~~

Regla general:

~~~text
any failure
→ fail closed
→ no inferred repair
→ no silent normalization
→ no automatic retry
~~~

Si E5.3 ya creó metadata durable, se aplica exclusivamente su semántica existente de recovery.

Los códigos serializados definitivos permanecen OPEN.

## 16. Retry policy

Para la primera integración:

~~~text
automaticRetries = 0
agentInvocationsPerRequestId = 1
~~~

Un nuevo intento requiere new requestId, fresh recovery, fresh durable read, fresh provenance verification y fresh input bindings.

Una respuesta tardía de un intento anterior no puede adjuntarse al nuevo intento.

## 17. Criterios de detención

Detener antes de invocar si:

~~~text
recovery unresolved
run != READY_TO_REPAIR
persisted/derived mismatch
report binding mismatch
report != REJECT_FIXABLE
provenance/pins fail
no AUTO_REPAIR findings
request projection cannot prove sufficient bounded evidence
resource policy not fully configured
sandbox/egress policy not proven
minimal-change executable rule remains OPEN
~~~

La última condición significa que, bajo el estado actual de R2, la conexión ejecutable continúa bloqueada.

Detener después de invocar si strict parsing, resource policy, response correlation, bindings, agentPatch, finding scope, expectedBefore o E5.1/E5.2/E5.3 fallan, o si el agente ABSTAIN.

Tras PERSISTED, este flujo termina. Child revalidation y full loop permanecen fuera de alcance.

## 18. Observabilidad y trazabilidad

El sink de observabilidad pertenece al resolver/orquestador, no al agente y no al durable run-state.

Es:

~~~text
NON_AUTHORITATIVE
APPEND-ORIENTED
NO SECRET MATERIAL
NOT A RECOVERY SOURCE
NOT A REPAIR SOURCE
~~~

Registro mínimo:

~~~text
attemptId
requestId
requestDigest
inputBindingDigest
startedAt
completedAt
runId
parentProposalId
parentProposalSha256
parentCandidateSha256
validationReportId
validationReportSha256
suppliedFindingIds
integrationDependencies
agentRuntimeDescriptor
providerInvocationBinding
rawResponseSha256
parsedResponseSha256
responseKind
outcome
failureClass
repairId, if constructed
childProposalId, if allocated
transactionId, if E5.3 invoked
beforeSha256 / afterSha256, if E5.3 persisted
~~~

La ubicación, retención y formato definitivo permanecen OPEN.

## 19. Identificadores

El agente no asigna IDs de control.

Resolver-owned:

~~~text
attemptId
requestId
repairId
childProposalId
transactionId
providerInvocationBinding
~~~

Algoritmos exactos permanecen OPEN.

Requisitos: collision detection, freshness where required, no ambiguous reuse after uncertain provider outcome, one response bound to one request y traceability across adapter → E5.1 → E5.2 → E5.3.

## 20. Full loop

R2 cubre solo:

~~~text
READY_TO_REPAIR
→ one bounded invocation
→ PATCH or ABSTAIN
→ if PATCH: validated repair path
→ durable repair + immediate child
→ stop
~~~

Fuera de alcance: automatic child validation, automatic next report, second repair, loop until PASS, loop until terminal state, automatic retry y AUTHORIZED_FOR_ASC transition.

## 21. Apoyo ASC v0.1

ASC se usa únicamente para compilar restricciones y comprobar que R2 preserve los hallazgos y OPEN.

~~~text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R2-ASC-001
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
- tools/proposal-resolution/schemas/repair.schema.json
- tools/proposal-resolution/schemas/validation-report.schema.json
- tools/proposal-resolution/schemas/run-state.schema.json
- tools/proposal-resolution/contracts/cross-contract.semantic.json

MANDATORY RELATIONS
- agent authority limited to PATCH proposal or non-mutating ABSTAIN
- integration dependencies bind dependencyId + canonical path + raw SHA-256
- request and response are correlated outside agentPatch
- state/provenance are re-read after response before Repair R1 construction
- all agent-produced content is data, never capability
- resource limits apply before/during parse
- parser rejects duplicate keys and non-exact JSON
- adapter and agent capabilities are separated
- Repair R1 control-plane remains resolver-owned
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

OPEN
- NEXT_STAGE_ID
- provider/model/runtime
- concrete adapter implementation
- concrete sandbox implementation
- exact request projection algorithm
- exact numeric resource limits
- strict parser technology
- minimal-change executable rule or authority-level contract revision
- final schemas
- ID allocation algorithms
- observability sink/retention
- full loop
- AUTHORIZED_FOR_ASC

DO NOT INFER
- syntactically valid agentPatch == authorized repair
- E5.1 acceptance permits bypassing E5.2/E5.3
- provider invocation correlation can be agent-authored
- arbitrary strings from agent are executable instructions
- provider sandbox claim == demonstrated isolation
- targetPath scope == proof of minimality
- DOMAIN_PASS == AUTHORIZED_FOR_ASC
- design PASS == implementation authorization

PROHIBITED
- direct run-state/durable-store writes by agent or adapter
- agent-generated control-plane
- arbitrary repo read by agent
- arbitrary network from agent
- agent-controlled provider endpoint
- silent malformed-output repair
- unlimited response parse
- response reuse across requestIds
- automatic retry
- bypass E5.1/E5.2/E5.3
- assignment of NEXT_STAGE_ID by inference

VALIDATION CRITERIA
- RA-I1 exact provenance tuple requirement present
- RA-I2 correlation envelope present
- RA-I3 TOCTOU recheck sequence present
- RA-I4 minimality gap explicitly OPEN and implementation-blocking
- RA-I5 data-not-command rule replaces unverifiable blacklist
- RA-I6 resource-bound categories mandatory
- RA-I7 strict parse semantics explicit
- RA-I8 adapter/agent capability separation explicit
- implementation remains unauthorized
- unresolved decisions remain OPEN
~~~

ASC no selecciona arquitectura, proveedor ni valores de límites y no autoriza implementación.

## 22. AUDITORÍA

R2 conserva las fronteras E5 existentes y endurece exclusivamente la futura interfaz con el agente.

La nueva frontera no confía en una respuesta por venir del proveedor: la correlaciona, la limita, relee el estado y vuelve a pasar por E5.1/E5.2/E5.3.

## 23. INCONSISTENCIAS

La prohibición textual de R1 sobre comandos/rutas queda reemplazada por una regla verificable de interpretación: contenido de agente = datos sin capacidad.

No se afirma que minimalChangeRequired esté ya implementado. Esa propiedad queda explícitamente OPEN y bloquea conexión ejecutable.

No se usa el candidate completo como input por defecto; la proyección exacta queda por diseñar y probar.

## 24. VACÍOS / OMISIONES

Permanecen OPEN antes de implementación:

~~~text
minimal-change executable rule or contract revision
request projection algorithm
provider/model/runtime
adapter implementation
sandbox technology
provider endpoint allowlist mechanism
secret broker mechanism
exact numeric resource limits
strict parser implementation
final request/response/failure schemas
ID allocation algorithms
observability sink + retention
adversarial tests
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

Estos OPEN son bloqueantes para implementación, no para la auditoría de R2.

## 25. REDUNDANCIAS

Son intencionales:

~~~text
pre-invocation provenance check
+ post-response provenance recheck
+ E5.2 execution-pin check
+ E5.3 fresh E5.2 reconstruction

strict boundary schema check
+ E5.1 full contract/semantic gate
~~~

No son nuevas autoridades.

## 26. Resolución dirigida RA-I1..RA-I8

~~~text
RA-I1  exact provenance tuple + future integration components   ADDRESSED
RA-I2  request/response correlation envelope                    ADDRESSED
RA-I3  explicit post-response re-read/rebind sequence           ADDRESSED
RA-I4  minimality gap declared OPEN + implementation blocker    ADDRESSED WITHOUT INFERENCE
RA-I5  agent output treated strictly as data                    ADDRESSED
RA-I6  mandatory pre-parse/runtime resource policy              ADDRESSED
RA-I7  exact strict-JSON + duplicate-key rejection              ADDRESSED
RA-I8  adapter vs agent capability/egress/secret split          ADDRESSED
~~~

ADDRESSED significa que R2 incorpora la corrección de diseño. No equivale todavía a validación adversarial PASS.

## 27. Gate

~~~text
R2 authored
→ directed adversarial regression RA-I1..RA-I8
→ correct any new finding
→ design validation
→ explicit human implementation authorization
→ only then consider adapter/sandbox implementation
~~~

Estado de salida:

~~~text
REPAIR_AGENT_INTEGRATION_DESIGN = R2_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~
