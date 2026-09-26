# MAP-001 — Repair Agent R17 Implementation Iteration 002 — Pre-Merge Record

Fecha: 2026-09-24
Estado: PRE_MERGE_DOCUMENTED / HUMAN_MERGE_DECISION_REQUIRED
PR: #80
Branch: repair-agent-r17-i2-prototype-safety
Base: main
Documented branch baseline before this record: 4b2c5fca33282acd26fd325acce5d9f358507b9b
Functional head con evidencia ejecutable: 910360f153db61c7122cc1e78c547b711a6b04ec

REPAIR_AGENT_CONNECTED: FALSE
FULL_R17_IMPLEMENTATION_READY: FALSE
IMPLEMENTATION_READY: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Propósito

Este registro congela documentalmente el estado de R17-I2 antes de cualquier decisión humana de merge.

No agrega alcance funcional.
No cambia implementación.
No autoriza merge por sí mismo.
No infiere I3.

La autoridad de merge sigue siendo humana.

## 2. Cadena documental I2

La secuencia de evidencia previa al merge queda:

```text
I2 scope R1
→ scope audit 001
→ scope R2
→ scope R2 directed regression
→ scope R2 ASC validation
→ bounded implementation
→ directed/adversarial tests
→ implementation audit/result
→ accumulated regression
→ ASC implementation validation
→ final external gates
→ PRE-MERGE RECORD
→ HUMAN MERGE DECISION
```

Artefactos:

```text
docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE.md
docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_AUDIT_001.md
docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2.md
docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2_REGRESSION_001.md
docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2_ASC_VALIDATION_001.md
docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_RESULT.md
docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_REGRESSION.md
docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_ASC_VALIDATION.md
```

## 3. Alcance ejecutable validado

El claim validado de I2 es exclusivamente:

```text
PROTOTYPE_SAFE_REPAIR_APPLICATION =
PASS_WITHIN_E5_1_NORMALIZED_JSON_BOUNDARY
```

La ruta soportada queda:

```text
executeMap001RepairGate
→ current JSON normalization
→ legacy special-key guard
→ contract precheck
→ decoded pointer policy
→ authorization/scope checks
→ own-data-property mutation
→ derived artifact guard
→ existing legacy hash
→ contract postcheck
```

`executeMap001RepairGate` es el único entrypoint ejecutable público soportado de E5.1.

El core anterior `validateAndApplyMap001Repair` no permanece como export público.

## 4. Evidencia ejecutable

Functional head exacto:

```text
910360f153db61c7122cc1e78c547b711a6b04ec
```

Evidencia sobre ese head:

```text
Audit Protocol Check #290            PASS
CI #346                              PASS
MAP-001 Proposal Validation Gate #85 PASS
```

La matriz acumulada del MAP gate incluye PASS para:

```text
MAP authority runtime
proposal validation adapter
E2 integration
Run State R5 + Semantic Contract R3
E4.2
E4.3
E5.1
E5.2
E5.3
R17 I1 observability handoff
```

## 5. Evidencia del branch head documental previo a este registro

Head documental inmediatamente anterior:

```text
4b2c5fca33282acd26fd325acce5d9f358507b9b
```

Evidencia registrada sobre ese head:

```text
CI #349                              PASS
MAP-001 Proposal Validation Gate #88 PASS
Audit Protocol Check #295            PASS
```

El fallo intermedio Audit Protocol Check #294 correspondió exclusivamente al formato del cuerpo del PR y fue corregido; #295 constituye la evidencia posterior aplicable.

## 6. Cambios expresamente ausentes

I2 no modifica:

```text
logicalSha256 semantics
map001_validation_adapter_r1.mjs
E5.2 implementation
E5.3 implementation
schemas
provider/model/transport implementation
R17 I1 observability implementation
durable authority
automatic retry policy
```

No existe conexión del repair agent.

## 7. OPEN preservados

Permanecen OPEN:

- trusted materialization antes del boundary JSON vigente;
- arbitrary Proxy/getter/toJSON admission;
- strict external byte admission;
- exact resource limits del future canonical/hashing path;
- CANONICAL_JSON_VALUE_V1;
- CANONICAL_JSON_NUMBER_POLICY;
- CANONICAL_JSON_SHA256_V2;
- hash-profile bridge/migration;
- MINIMAL_CHANGE_EXECUTABLE_RULE;
- observability delivery/isolation;
- authoritative critical-window caller integration;
- secret broker / credential lease;
- provider transport/session/replay;
- provider/model/runtime;
- full repair-agent connection;
- NEXT_STAGE_ID;
- AUTHORIZED_FOR_ASC.

Ninguno se cierra por este registro.

## 8. ASC v0.1 — pre-merge compilation

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-I2-PRE-MERGE-ASC-001

AUTHORIZED SOURCES:

- R17 validated design;
- human implementation authorization;
- I2 scope R2 validated;
- I2 implementation and tests;
- I2 result/audit;
- I2 accumulated regression;
- I2 ASC implementation validation;
- exact external gate evidence listed in this record;
- DEVELOPMENT_MANUAL.

MANDATORY RELATIONS:

- I2 remains a strict subset of R17;
- I2 implementation remains inside validated scope R2;
- final implementation validation remains PASS within declared boundary;
- final code authority remains single-entrypoint E5.1;
- no legacy hash migration occurred;
- E5.2/E5.3 implementation remains unchanged;
- E5.3 remains sole durable boundary;
- all listed OPEN remain OPEN;
- repair agent remains disconnected;
- merge requires explicit human decision after final branch-head recheck.

DO NOT INFER:

- pre-merge documentation authorizes merge;
- I2 completes R17;
- I2 authorizes provider/model;
- I2 closes trusted materialization;
- I2 closes minimal change;
- I2 establishes canonical JSON V2;
- I2 establishes NEXT_STAGE_ID;
- I2 establishes AUTHORIZED_FOR_ASC.

PROHIBITED:

- merge without explicit human approval;
- FULL_R17_IMPLEMENTATION_READY = TRUE;
- REPAIR_AGENT_CONNECTED = TRUE;
- silent hash migration;
- provider/model invocation;
- closure of OPEN by inference.

ASC_CONTRACT_COMPILATION = PASS.

## 9. AUDITORÍA

La cadena I2 está completa dentro del alcance autorizado hasta el gate humano de merge.

Existe trazabilidad entre:

```text
scope
→ audit
→ correction
→ scope validation
→ implementation
→ directed/adversarial evidence
→ accumulated regression
→ implementation validation
→ external gates
```

El documento no agrega una segunda autoridad técnica. Consolida evidencia ya producida y fija explícitamente las limitaciones del PASS.

Debe revalidarse el nuevo branch head generado por este commit documental antes de cualquier merge.

## 10. INCONSISTENCIAS

No se detectan inconsistencias bloqueantes nuevas.

Existe una diferencia intencional entre:

```text
I2_VALIDATED = TRUE
```

y:

```text
FULL_R17_IMPLEMENTATION_READY = FALSE
IMPLEMENTATION_READY = FALSE
```

No es contradicción: la primera afirmación está limitada a I2; las otras refieren a la integración R17 completa.

## 11. VACÍOS / OMISIONES

No se detectan vacíos nuevos dentro del cierre pre-merge de I2.

Los OPEN listados en §7 permanecen fuera de alcance.

Este registro tampoco contiene una decisión sobre I3.

## 12. REDUNDANCIAS

La existencia separada de:

- RESULT;
- REGRESSION;
- ASC VALIDATION;
- PRE-MERGE RECORD

es intencional.

Cada artefacto cumple una función distinta:

```text
RESULT = implementación + auditoría
REGRESSION = no-regresión y propagación
ASC VALIDATION = validación del claim I2
PRE-MERGE RECORD = freeze documental de evidencia y gate humano
```

No se detecta duplicación que cree una segunda fuente de verdad.

## 13. Estado pre-merge

```text
ASC_CONTRACT_COMPILATION = PASS

I2_IMPLEMENTATION_VALIDATION = PASS
I2_VALIDATED = TRUE

NEW_BLOCKING_FINDINGS = 0
NEW_MAJOR_FINDINGS = 0

PROTOTYPE_SAFE_REPAIR_APPLICATION =
PASS_WITHIN_E5_1_NORMALIZED_JSON_BOUNDARY

FULL_R17_IMPLEMENTATION_READY = FALSE
IMPLEMENTATION_READY = FALSE
REPAIR_AGENT_CONNECTED = FALSE

PR_80 = OPEN / DRAFT
MERGE_AUTHORITY = HUMAN

NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
```

## 14. Gate final antes de merge

Después de agregar este registro:

```text
new branch head
→ Audit Protocol Check
→ CI
→ MAP-001 Proposal Validation Gate
→ confirm PR mergeable
→ explicit human merge approval
→ merge
→ post-merge verification
```

Si cualquiera de los gates del nuevo head falla, el merge queda bloqueado hasta corregir y revalidar.

No procede merge automático desde ASC.
