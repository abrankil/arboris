# MAP-001 — Repair Agent Integration Design 001

**Fecha:** 2026-09-23  
**Estado:** diseño inicial para auditoría; no autoriza implementación ni conexión  
**Baseline:** `main@63196dcf87b211f057a0f0b6f28d5a84098e2191`  
**NEXT_STAGE_ID:** `OPEN`  
**REPAIR_AGENT_CONNECTED:** `FALSE`  
**AUTHORIZED_FOR_ASC:** `OPEN`

## 1. Objetivo

Diseñar la frontera mínima y fail-closed para integrar, en una etapa futura, un repair agent que pueda **proponer únicamente el patch** de un Repair R1 ya gobernado por el resolver.

Este documento no conecta un agente, no ejecuta un modelo, no modifica E5.1/E5.2/E5.3 y no autoriza un loop automático.

La cadena preservada es:

```text
validation-report REJECT_FIXABLE
→ resolver prepara solicitud acotada
→ repair agent propone agentPatch
→ resolver valida forma y bindings
→ resolver construye Repair R1 completo
→ E5.1 valida/aplica repair
→ E5.2 reconstruye transaction candidate
→ E5.3 persiste repair + child de forma durable
```

La integración no puede introducir una vía paralela de escritura o de autoridad.

## 2. Autoridad del agente

El repair agent no es autoridad de dominio, de run-state, de validación, de botánica, de baseline ni de persistencia.

Su autoridad propuesta queda limitada a:

```text
PROPOSE_AGENT_PATCH_ONLY
```

El agente puede producir exclusivamente el payload equivalente a `definitions.agentPatch` de:

```text
tools/proposal-resolution/schemas/repair.schema.json
```

El agente no produce ni controla:

```text
repairId
repairType
control.owner
control.runId
control.parentProposal
control.validationBasis
control.patchPolicy
childProposalId
transactionId
run-state
validation-report
authority bindings
execution pins
durable metadata
```

Estos campos permanecen bajo control del resolver y de las capas E5 existentes.

## 3. Inputs autorizados

La solicitud al agente debe ser una proyección serializada, inmutable y mínima de artefactos ya validados.

### 3.1 Input mínimo propuesto

```text
requestId
parentCandidate
parentCandidateSha256
validationReportBinding
autoRepairFindings
patchPolicy
```

Donde:

```text
requestId
→ correlación de intento; no autoridad

parentCandidate
→ copia JSON de parentProposal.intent.candidate

parentCandidateSha256
→ logical hash de esa copia

validationReportBinding
→ reportId + logical hash + status=REJECT_FIXABLE

autoRepairFindings
→ solo findings con disposition=AUTO_REPAIR del reporte exacto

patchPolicy
→ pathScope=PARENT_PROPOSAL_INTENT_CANDIDATE
→ authorityMode=CONFORM_TO_EXISTING_AUTHORITY
→ mutationClass=AUTO_REPAIR_ONLY
```

Cada finding entregado conserva al menos:

```text
findingId
code
message
sourceRefs
targetPaths
expected
observed
repairDirective
```

El agente no recibe el run-state completo ni acceso directo a archivos de autoridad.

### 3.2 Bindings internos obligatorios

Aunque no todos los bindings deban exponerse al agente, el adaptador de integración debe fijar antes de la invocación:

```text
runId
parent proposal id + logical hash + iteration
parent candidate logical hash
validation report id + logical hash + REJECT_FIXABLE
exact set of AUTO_REPAIR findings supplied
repair schema raw SHA-256
E5.1 raw SHA-256
E5.2 raw SHA-256
E5.3 raw SHA-256
```

Si cualquiera cambia entre preparación y consumo de la respuesta, el intento debe invalidarse y fallar cerrado.

## 4. Output permitido

La única salida aceptable del agente es:

```json
{
  "operations": [
    {
      "editId": "EDIT-001",
      "operation": "replace",
      "targetPath": "/example/path",
      "findingRefs": ["FND-001"],
      "expectedBefore": "...",
      "after": "...",
      "rationale": "..."
    }
  ]
}
```

La forma exacta debe validarse contra el subschema `agentPatch` de Repair R1 antes de construir cualquier Repair R1 completo.

No se permiten claves adicionales.

La respuesta del agente no puede contener instrucciones ejecutables, rutas de filesystem, comandos, metadata de persistencia ni campos de control-plane.

## 5. Construcción del Repair R1

Una respuesta estructuralmente válida del agente todavía **no es un repair autorizado**.

El resolver debe envolverla en Repair R1 usando exclusivamente valores controlados fuera del agente:

```text
schemaVersion = 0.1
repairId = resolver-owned
repairType = MAP001_LOCAL_NAVIGATION_AUTO_REPAIR

control.owner = RESOLVER
control.runId = exact run
control.parentProposal = exact binding
control.validationBasis = exact binding
control.patchPolicy = frozen policy

patch = exact validated agent output
```

La política exacta de asignación de `repairId` permanece `OPEN`; cualquiera que se adopte debe conservar unicidad de corrida y ser validada por E5.2.

## 6. Sandbox y capacidades

El diseño inicial exige un sandbox de capacidad negativa.

El repair agent no debe tener:

```text
filesystem write
filesystem read arbitrario
shell
process spawn
Git/GitHub write
network general
run-state access
durable-store access
authority-file access directo
data/ write
docs/ write
tool invocation no declarada
```

El agente opera como función conceptual:

```text
bounded JSON request
→ model/agent
→ bounded JSON response
```

La selección de proveedor, runtime o mecanismo concreto de aislamiento permanece `OPEN`.

Si el runtime elegido no puede demostrar estas restricciones, la integración no puede avanzar a ejecución.

## 7. Prohibiciones de escritura

Antes de E5.3 no puede producirse ninguna mutación durable del run.

Está prohibido que el agente o su adaptador escriban directamente:

```text
<run>.json
<run>.lock
<run>.txn.json
<run>.next.json
proposal artifacts
validation reports
authority artifacts
data/
source candidate
```

La única frontera durable autorizada sigue siendo:

```text
commitMap001RepairSnapshot
```

y debe conservar su reconstrucción fresca de E5.2 y, transitivamente, E5.1.

## 8. Binding obligatorio a E5.1 / E5.2 / E5.3

El agente no puede omitir capas.

Ruta obligatoria:

```text
agentPatch
→ Repair R1 envelope by resolver
→ E5.1 executeMap001RepairGate
→ E5.2 buildMap001RepairTransactionCandidate
→ E5.3 commitMap001RepairSnapshot
```

En la ruta durable, E5.3 continúa siendo la frontera final y vuelve a reconstruir E5.2 bajo lock.

Una validación previa del patch o del Repair R1 no sustituye esta reconstrucción.

## 9. Failure semantics

Toda falla es fail-closed y no concede retry implícito.

Clases de falla de integración propuestas:

```text
AGENT_NOT_CONFIGURED
AGENT_INVOCATION_FAILED
AGENT_RESPONSE_NOT_JSON
AGENT_OUTPUT_SCHEMA_INVALID
AGENT_OUTPUT_BINDING_STALE
AGENT_OUTPUT_POLICY_VIOLATION
E5_1_REPAIR_REJECTED
E5_2_RUN_CONTEXT_REJECTED
E5_3_COMMIT_REJECTED
RECOVERY_REQUIRED
```

Reglas:

```text
falla antes de E5.3
→ durable run permanece sin cambio

falla E5.3 antes de PREPARED durable
→ aplicar semántica E5.3 existente

falla/crash después de metadata durable E5.3
→ recoverMap001RepairStore antes de nueva escritura

respuesta inválida del agente
→ no reparar, no completar, no normalizar silenciosamente
```

Los códigos definitivos y su schema serializado permanecen `OPEN`.

## 10. Retry policy inicial

Para el primer diseño:

```text
automaticRetries = 0
agentInvocationsPerRepairRequest = 1
```

No se reintenta automáticamente frente a:

```text
malformed output
schema rejection
policy violation
E5.1 rejection
E5.2 rejection
E5.3 rejection
transport/model failure
```

Un nuevo intento debe ser una acción explícita posterior, con nuevo `requestId` y relectura/revalidación del estado actual.

La política puede revisarse más adelante con evidencia específica; no se incorpora automatic retry por anticipación.

## 11. Criterios de detención

El integrador debe detenerse sin invocar al agente si:

```text
recovery no está NORMAL / RECOVERED_* satisfactoriamente
run derivado != READY_TO_REPAIR
run persistido != estado derivado
validation report != exact current binding
validation report status != REJECT_FIXABLE
execution pins fallan
authority/provenance drift
no existe al menos un AUTO_REPAIR finding
```

Debe detenerse después de la invocación si:

```text
output no cumple agentPatch
binding preparado cambió
output cita findingRefs no suministrados
targetPath fuera de scopes autorizados
expectedBefore diverge
E5.1/E5.2/E5.3 rechazan
```

Tras `PERSISTED`, esta integración termina.

La validación del child, generación de un nuevo validation-report y cualquier loop posterior permanecen fuera de alcance.

## 12. Observabilidad y trazabilidad

Cada intento debe poder reconstruirse sin convertir el log en fuente de verdad.

Registro mínimo propuesto:

```text
attemptId / requestId
startedAt
completedAt
runId
parentProposalId
parentProposalSha256
parentCandidateSha256
validationReportId
validationReportSha256
suppliedFindingIds
repairSchemaSha256
E5_1_SHA256
E5_2_SHA256
E5_3_SHA256
agentRuntimeDescriptor
responseRawSha256
responseParsedSha256
outcome
failureClass
repairId, si fue envuelto
childProposalId, si fue asignado
transactionId, si E5.3 fue invocado
beforeSha256 / afterSha256, si E5.3 persistió
```

El registro no debe almacenar secretos del proveedor ni convertirse en autoridad para reconstruir un repair.

El formato, ubicación y retención exactos del registro permanecen `OPEN`.

## 13. Identificadores y asignación

El agente no asigna IDs de control.

Permanecen bajo el resolver:

```text
repairId
childProposalId
transactionId
requestId
```

La estrategia exacta de generación queda `OPEN`, pero debe satisfacer:

```text
fresh within run where applicable
collision detection
no reuse after failed durable attempt when ambiguity would result
traceability to one integration attempt
```

E5.2 continúa siendo autoridad ejecutable para unicidad histórica de `repairId` y `childProposalId`.

## 14. Full loop

Este diseño cubre una sola transición:

```text
READY_TO_REPAIR
→ one bounded agent proposal
→ validated repair
→ durable repair + child
```

No cubre:

```text
child domain validation automática
nuevo validation-report automático
segunda reparación
loop until PASS
loop until terminal state
automatic retry
AUTHORIZED_FOR_ASC transition
```

Todo lo anterior permanece `OPEN`.

## 15. Apoyo ASC v0.1

ASC se usa únicamente como compilador de restricciones del diseño.

```text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-001
```

Contrato compilado:

```text
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

STRUCTURAL CONTRACT
- agent receives bounded serialized input only
- agent emits agentPatch only
- resolver owns Repair R1 control-plane
- E5.1/E5.2/E5.3 remain mandatory execution path
- E5.3 remains sole durable commit boundary

MANDATORY RELATIONS
- exact parent/report bindings before invocation
- response invalidated on binding drift
- AUTO_REPAIR findings are the only repair authorization basis
- patch targets remain within finding scopes
- no durable write before E5.3
- one repair + immediate child remain atomic

OPEN
- NEXT_STAGE_ID
- provider/model/runtime
- concrete sandbox technology
- exact request schema
- exact failure schema
- ID allocation algorithm
- observability storage/retention
- full loop
- automatic retry beyond zero
- AUTHORIZED_FOR_ASC

DO NOT INFER
- valid model output == authorized repair
- E5.1 acceptance == permission to bypass E5.2/E5.3
- E5.3 CLOSED == repair agent connected
- DOMAIN_PASS == AUTHORIZED_FOR_ASC
- agent rationale == authority
- provider sandbox claims == demonstrated isolation

PROHIBITED
- direct run-state write by agent
- direct durable-store write by agent
- agent-generated control-plane bindings
- agent access to arbitrary repository files
- bypass E5.1/E5.2/E5.3
- silent repair/normalization of invalid model output
- automatic retry without new explicit policy
- assignment of NEXT_STAGE_ID by inference

VALIDATION CRITERIA
- design preserves existing authority boundaries
- agent output surface equals Repair R1 agentPatch only
- no direct write path exists outside E5.3
- failure semantics are fail-closed
- retry policy is explicit
- stop criteria are explicit
- traceability bindings are explicit
- all unresolved decisions remain OPEN
```

ASC no valida que este diseño sea correcto, no selecciona proveedor y no autoriza implementación.

## 16. AUDITORÍA

El diseño conserva la separación ya establecida:

```text
validator
→ produce findings

agent
→ proposes patch only

resolver/E5.1
→ decides whether patch is admissible and applies it

E5.2
→ binds repair to exact run context and constructs candidate snapshot

E5.3
→ persists/recover the validated snapshot
```

No se introduce autoridad nueva para el agente ni una segunda frontera durable.

## 17. INCONSISTENCIAS

No se detecta contradicción necesaria con Repair R1: su schema ya declara que el resolver posee el control-plane y que el agente solo produce `patch`.

El diseño deliberadamente no concede acceso directo a archivos citados por `sourceRefs`. Si se demuestra que un caso de reparación requiere contenido adicional para producir un patch válido, deberá diseñarse un evidence bundle read-only explícito; no se habilita acceso general al repositorio por inferencia.

## 18. VACÍOS / OMISIONES

Antes de implementar permanecen `OPEN`:

```text
proveedor/modelo/runtime
tecnología concreta de sandbox
request schema definitivo
response transport envelope
failure schema definitivo
ID allocation algorithm
observability sink + retention
secret handling del proveedor
timeouts y cancellation
límites de tamaño de request/response
pruebas adversariales específicas del agente
criterio humano de autorización para implementación
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
```

Estos elementos bloquean la conexión ejecutable del agente, pero no impiden auditar el diseño.

## 19. REDUNDANCIAS

La validación estructural del agentPatch antes del Repair R1 y la validación completa posterior en E5.1 son redundancia intencional:

```text
boundary parse/schema check
+
authoritative E5.1 semantic/contract gate
```

La primera reduce superficie de entrada inválida; la segunda sigue siendo la autoridad ejecutable para aceptación del repair.

No se crea una fuente de verdad paralela.

## 20. Gate de este diseño

Este documento no autoriza implementación.

Antes de cualquier conexión ejecutable deben ocurrir, como mínimo:

```text
auditoría adversarial del diseño
→ corrección de hallazgos
→ validación del diseño
→ decisión humana explícita de implementar
→ diseño/implementación de sandbox y adapter
→ pruebas negativas y de binding
→ nueva auditoría
→ recién entonces considerar conexión
```

Estado de salida:

```text
REPAIR_AGENT_INTEGRATION_DESIGN = DRAFT_FOR_AUDIT
NEXT_STAGE_ID = OPEN
REPAIR_AGENT_CONNECTED = FALSE
AUTHORIZED_FOR_ASC = OPEN
```
