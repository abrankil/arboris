# MAP-001 — Repair Agent R17 Implementation Iteration 002 — Scope R2 ASC Validation 001

Fecha: 2026-09-24
Artefacto validado: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2.md
Regresión aplicable: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2_REGRESSION_001.md
Head al validar: 7cbc5f2b34332c7abe2fade42e6e845a838c3f1a
Estado: VALIDATED_AT_SCOPE_LEVEL
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_READY: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Alcance

Esta validación cubre únicamente el scope de implementación I2 R2.

No valida código I2 porque todavía no existe.

No autoriza provider/model, hash migration, E5.2/E5.3 implementation changes ni conexión del repair agent.

## 2. ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-I2-SCOPE-R2-ASC-VALIDATION-001

AUTHORIZED SOURCES:

- main@c5d2de3c24be4aed11e89ccae4a198f4b4b6fe0d;
- R17 validated design;
- I1 validated implementation;
- I2 scope R1;
- I2 scope audit 001;
- I2 scope R2;
- I2 scope R2 regression 001;
- current E5.1/E5.2/E5.3 code and tests;
- DEVELOPMENT_MANUAL.

MANDATORY RELATIONS:

- executeMap001RepairGate is sole supported executable E5.1 entrypoint after I2;
- no public core bypass remains;
- decoded __proto__ rejects before traversal/mutation;
- normalized own __proto__ key rejects before legacy hash acceptance in E5.1;
- object writes use own-data-property semantics;
- Python contract checker mirrors the accepted domain;
- E5.2/E5.3 implementations remain unchanged;
- test-only negative integration evidence is permitted;
- logicalSha256 remains unchanged;
- repair agent remains disconnected.

DO NOT INFER:

- scope validation means implementation PASS;
- I2 secures arbitrary runtime objects before JSON normalization;
- I2 secures every legacy-hash caller;
- constructor/prototype are globally forbidden;
- I2 closes MINIMAL_CHANGE;
- I2 authorizes provider/model execution;
- NEXT_STAGE_ID or AUTHORIZED_FOR_ASC.

PROHIBITED:

- changing logicalSha256 semantics;
- changing E5.2/E5.3 implementation;
- provider/model invocation;
- durable authority outside E5.3;
- automatic retry;
- repair-agent connection.

## 3. AUDITORÍA

El scope R2 es coherente con R17 y con la deuda ejecutable observada en E5.1.

Los dos blockers de scope previos quedaron resueltos sin ampliar la autoridad funcional:

- se elimina la ambigüedad de múltiples entrypoints públicos;
- se habilita únicamente test evidence adicional en E5.2/E5.3, no cambios de implementación.

El orden de enforcement exige que el guard de unsafe legacy key ocurra antes de los hashes utilizados para preparar el contract gate.

## 4. INCONSISTENCIAS

No se detectan inconsistencias bloqueantes nuevas.

La policy I2 que rechaza __proto__ dentro del boundary legacy E5.1 es explícitamente temporal/compatibility-oriented y no se presenta como canon global de JSON.

## 5. VACÍOS / OMISIONES

Permanecen OPEN y fuera de I2:

- arbitrary Proxy/getter/toJSON admission;
- strict external byte parsing;
- trusted materialization;
- CANONICAL_JSON_VALUE_V1;
- CANONICAL_JSON_NUMBER_POLICY;
- CANONICAL_JSON_SHA256_V2;
- hash bridge/migration;
- MINIMAL_CHANGE_EXECUTABLE_RULE;
- observability delivery/isolation;
- provider/transport/secret broker/session;
- full repair-agent connection.

No bloquean este scope porque I2 no depende de cerrarlos.

## 6. REDUNDANCIAS

No se detecta redundancia problemática.

Pointer-token guard, artifact-key guard y own-property write son capas distintas.

Las pruebas E5.2/E5.3 serán evidence de propagación fail-closed, no una segunda implementación de E5.1.

## 7. Resultado ASC

```text
ASC_CONTRACT_COMPILATION = PASS

I2_SCOPE_R2_DIRECTED_REGRESSION = PASS
I2_SCOPE_R2_ACCUMULATED_AUDIT = PASS

NEW_BLOCKING_FINDINGS = 0
NEW_MAJOR_FINDINGS = 0

I2_SCOPE_VALIDATION = PASS
I2_SCOPE_VALIDATED = TRUE

I2_IMPLEMENTATION_STARTED = FALSE
FULL_R17_IMPLEMENTATION_READY = FALSE
REPAIR_AGENT_CONNECTED = FALSE

NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
```

## 8. Gate siguiente

El scope I2 R2 queda validado.

Procede iniciar implementación acotada exclusivamente dentro de este scope, seguida de:

```text
directed/adversarial tests
→ external gates
→ implementation audit
→ accumulated regression
→ implementation validation
→ human merge decision
```

No procede ampliar I2 más allá de los archivos y claims autorizados.
