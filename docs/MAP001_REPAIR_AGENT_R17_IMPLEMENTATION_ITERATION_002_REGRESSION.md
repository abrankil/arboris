# MAP-001 — Repair Agent R17 Implementation Iteration 002 — Regression

Fecha: 2026-09-24
Estado: PASS_CANDIDATE
Scope: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2.md
Implementation result: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_RESULT.md
Functional head probado: 910360f153db61c7122cc1e78c547b711a6b04ec
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_READY: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Objetivo

Comprobar que I2:

- implementa únicamente el boundary prototype/legacy-hash autorizado para E5.1;
- elimina el bypass público anterior;
- no cambia semántica de hash legacy;
- no modifica E5.2/E5.3 implementation;
- no reabre cierres E4/E5/R17/I1.

## 2. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-I2-REGRESSION-ASC-001

MANDATORY RELATIONS:

- single public E5.1 executable entrypoint;
- unsafe decoded `__proto__` target rejects;
- unsafe normalized `__proto__` key rejects;
- Object.prototype remains unchanged in adversarial tests;
- ordinary nearby keys remain admissible when other contracts allow them;
- no E5.2 transaction candidate from unsafe repair;
- no E5.3 durable metadata from unsafe repair;
- `logicalSha256` unchanged;
- E4/E5/I1 regressions green;
- full repair agent remains disconnected.

DO NOT INFER:

- I2 protects pre-normalization arbitrary runtime values;
- I2 migrates canonical hashes;
- I2 closes MINIMAL_CHANGE;
- I2 makes full R17 implementation ready.

ASC_CONTRACT_COMPILATION = PASS.

## 3. Regresión dirigida contra scope I2 R2

### S1 — sole supported executable entrypoint

PASS.

`validateAndApplyMap001Repair` ya no es export público.

La suite comprueba explícitamente que el module namespace no lo expone.

Consumers E5.2 continúan importando únicamente `executeMap001RepairGate`.

### S2 — decoded pointer policy

PASS.

`__proto__` como token decodificado produce:

```text
PROTOTYPE_SENSITIVE_POINTER_TOKEN
```

antes de mutation.

Se cubren root/nested cases y Object.prototype permanece intacto.

### S3 — normalized artifact key policy

PASS.

Own `__proto__` se rechaza en:

- repair `after`;
- repair `expectedBefore`;
- arrays dentro del repair;
- parent;
- validation report;
- multi-operation repair.

El checker Python contiene el mismo special-key guard para JSON ya parseado.

### S4 — own-data-property write

PASS.

Object add/replace usa una data property own con:

```text
enumerable = true
writable = true
configurable = true
```

Keys ordinarias `constructor`, `prototype` y `__proto___` no se bloquean por nombre.

### S5 — legacy hash profile preservation

PASS.

`map001_validation_adapter_r1.mjs` no fue modificado.

No existe cambio de `logicalSha256` ni migración de persisted hashes.

I2 usa fail-closed admission alrededor del profile legacy existente.

### S6 — downstream fail-closed propagation

PASS.

E5.2 test:

```text
unsafe Repair R1
→ E5.1 reject
→ no transaction candidate
```

E5.3 test:

```text
unsafe Repair R1
→ fresh E5.2 reconstruction fails
→ E5_2_REVALIDATION_FAILED
→ no .lock
→ no .txn.json
→ no .next.json
```

## 4. Regresión acumulada

MAP-001 Proposal Validation Gate #85 en el functional head exacto registra PASS para:

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

Además:

```text
CI #346 = PASS
Audit Protocol Check #290 = PASS
```

No se detecta reapertura de la cadena E4/E5 ni de I1.

## 5. Autoridad y estado preservados

Se preserva:

```text
E5.1 = deterministic repair gate authority
E5.2 = transaction candidate authority unchanged
E5.3 = sole durable boundary
automatic retry = absent
provider/model = absent
repair agent = disconnected
```

MINIMAL_CHANGE_EXECUTABLE_RULE permanece OPEN.

CANONICAL_JSON_SHA256_V2 permanece OPEN.

## 6. AUDITORÍA

La regresión ejercita tanto el boundary local I2 como su propagación hacia E5.2/E5.3.

La primera ejecución fallida durante implementación (#83) se debió a tests históricos incompatibles con la decisión de eliminar el bypass público; no reveló necesidad de relajar el nuevo boundary.

La corrección preservó la autoridad de entrada única y el functional head final pasó una matriz adversarial ampliada.

## 7. INCONSISTENCIAS

No se detectan inconsistencias bloqueantes.

No existe conflicto entre:

```text
future canonical JSON may represent __proto__ as ordinary data
```

y:

```text
legacy E5.1 boundary rejects __proto__ fail-closed
```

porque I2 declara explícitamente su alcance temporal/compatibility-oriented.

## 8. VACÍOS / OMISIONES

No se detecta un vacío nuevo dentro de I2.

Permanecen OPEN:

- pre-normalization trusted materialization;
- arbitrary Proxy/getter/toJSON handling;
- canonical JSON V2/number policy/hash bridge;
- minimal change;
- observability delivery;
- critical-window authoritative integration;
- credential/provider/transport/session;
- full repair-agent connection.

## 9. REDUNDANCIAS

No se detecta redundancia problemática.

La duplicación de policy JS/Python es intencional para mantener dominio contractual equivalente.

Los tests E5.2/E5.3 son evidencia de integración negativa, no reimplementación de E5.1.

## 10. Resultado

```text
I2_SCOPE_REGRESSION = PASS
I2_ACCUMULATED_REGRESSION = PASS_WITH_DECLARED_SCOPE_LIMIT

NEW_BLOCKING_FINDINGS = 0
NEW_MAJOR_FINDINGS = 0

PROTOTYPE_SAFE_REPAIR_APPLICATION =
PASS_WITHIN_E5_1_NORMALIZED_JSON_BOUNDARY

FULL_R17_IMPLEMENTATION_READY = FALSE
REPAIR_AGENT_CONNECTED = FALSE

NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
```

Procede validación final de implementación I2 con apoyo ASC.
