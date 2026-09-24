# MAP-001 — Repair Agent R17 Implementation Iteration 002 — Scope R2

Fecha: 2026-09-24
Estado: I2_SCOPE_R2_CANDIDATE_FOR_DIRECTED_REGRESSION
Branch: repair-agent-r17-i2-prototype-safety
Baseline: main@c5d2de3c24be4aed11e89ccae4a198f4b4b6fe0d
Deriva de: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_AUDIT_001.md
Motivo: corrección exclusiva de I2-S1 e I2-S2
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_READY: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Objetivo

R2 conserva la selección de I2:

```text
E5_1_PROTOTYPE_AND_LEGACY_HASH_SAFETY_BOUNDARY_R1
```

y corrige únicamente:

- I2-S1: fijar un único entrypoint ejecutable autoritativo de E5.1;
- I2-S2: permitir evidencia test-only de fail-closed hasta E5.2/E5.3 sin modificar sus implementaciones.

## 2. Autoridad ejecutable única de E5.1

A partir de I2, el único entrypoint público soportado de E5.1 será:

```text
executeMap001RepairGate(...)
```

Este entrypoint posee:

- normalización JSON;
- guard de unsafe legacy key;
- contract precheck;
- pointer decoding/guard;
- repair authorization;
- safe mutation;
- derived artifact guard;
- legacy hashing;
- contract postcheck.

`validateAndApplyMap001Repair(...)` deja de ser API pública soportada.

Debe transformarse en un core interno del módulo:

```text
validateAndApplyMap001RepairInternal(...)
```

o equivalente no exportado.

No puede ser importado por consumidores externos ni tests como bypass de la frontera normalizada.

## 3. Tests existentes que llaman al core

La suite E5.1 actual contiene tests que importan directamente `validateAndApplyMap001Repair`.

I2 autoriza refactorizar esos tests para que:

- ejerzan `executeMap001RepairGate` cuando la propiedad a probar pertenece al contrato ejecutable completo; o
- prueben helpers internos solo de forma indirecta a través del entrypoint público.

No se crea una segunda API pública de test.

## 4. Boundary normalizado

El claim de I2 queda explícitamente limitado a:

```text
agent-originated Repair R1 / patch data
→ executeMap001RepairGate
→ current JSON normalization
→ I2 guards
→ E5.1
```

No se extiende a callers arbitrarios que invoquen funciones internas.

## 5. Guard de pointer token

Después de JSON Pointer decoding, cualquier token exactamente igual a:

```text
__proto__
```

falla antes de traversal o mutation.

Failure code:

```text
PROTOTYPE_SENSITIVE_POINTER_TOKEN
```

No se agrega blacklist nominal general.

```text
constructor
prototype
```

no se rechazan por nombre solamente.

## 6. Safe object writes

Toda operación add/replace sobre object parent debe usar own-data-property semantics:

```text
Object.defineProperty
```

o una primitiva equivalente que no invoque inherited setter dispatch.

La propiedad creada/reemplazada debe ser:

```text
enumerable = true
writable = true
configurable = true
```

Array add/replace/remove conserva semántica previa.

## 7. Legacy-hash unsafe-key guard

No se modifica `logicalSha256`.

Dentro del entrypoint ejecutable E5.1, después de la normalización JSON y antes de cualquier aceptación basada en hash legacy, se rechaza cualquier own JSON object key exactamente:

```text
__proto__
```

en cualquier profundidad de los artefactos normalizados bajo control de E5.1.

El guard debe cubrir:

```text
normalizedParent
normalizedReport
normalizedRepair
childCandidate / childProposal antes de su hash legacy
```

Failure code:

```text
LEGACY_HASH_UNSAFE_JSON_KEY
```

## 8. Límite del claim de hash

I2 no declara seguro todo `LEGACY_LOGICAL_SHA256_V1` del repositorio.

En particular, E5.2/E5.3 y otros módulos conservan su semántica legacy histórica.

El claim máximo es:

```text
E5.1 agent-originated Repair path
= FAIL_CLOSED_FOR___PROTO___WITHIN_NORMALIZED_JSON_BOUNDARY
```

La futura migración a CANONICAL_JSON_SHA256_V2 permanece OPEN.

## 9. Equivalencia JS/Python

`validate_e5_repair_contracts.py` debe aplicar la misma policy contractual sobre artifacts ya parseados:

- decoded pointer token `__proto__` → reject;
- own dict key `__proto__` en cualquier profundidad → reject.

Python no necesita prototype defense para sí mismo; la policy existe para mantener el mismo dominio de aceptación de E5.1.

## 10. Superficie de implementación autorizada

I2 puede modificar:

```text
tools/proposal-resolution/map001_repair_gate_r1.mjs
tools/proposal-resolution/map001_repair_gate_r1.test.mjs
tools/proposal-resolution/validate_e5_repair_contracts.py
.github/workflows/map001-proposal-validation.yml   # solo si hace falta
```

No puede modificar implementación de:

```text
map001_validation_adapter_r1.mjs
map001_repair_transaction_candidate_r1.mjs
map001_durable_repair_store_r1.mjs
map001_run_state_reducer_r1.mjs
logicalSha256
schemas
provider/model/transport
observability I1
```

## 11. Superficie test-only autorizada para integración negativa

Para demostrar propagación fail-closed sin cambiar autoridad o implementación, I2 puede añadir/modificar únicamente tests en:

```text
tools/proposal-resolution/map001_repair_transaction_candidate_r1.test.mjs
tools/proposal-resolution/map001_durable_repair_store_r1.test.mjs
```

Esta autorización es TEST-ONLY.

No habilita cambios en los módulos E5.2/E5.3.

## 12. Criterio end-to-end negativo

La evidencia debe demostrar:

```text
unsafe repair / special-key
→ E5.1 reject
→ E5.2 cannot produce accepted transaction candidate
→ E5.3 cannot persist a repair-derived next snapshot
```

No es necesario que E5.3 reciba directamente un artefacto hostil; basta demostrar que la cadena autorizada no puede producir una entrada persistible desde ese repair.

## 13. Orden de enforcement

Orden normativo:

```text
executeMap001RepairGate
→ JSON normalization
→ unsafe-key guard
→ Python/contract precheck
→ pointer decode + sensitive-token guard
→ authorization/scope validation
→ safe mutation
→ derived artifact unsafe-key guard
→ legacy hash operations
→ contract postcheck
```

No se acepta bypass mediante una API exportada alternativa.

## 14. Tests dirigidos mínimos

La suite debe cubrir:

1. reparación ordinaria existente sigue PASS;
2. `/__proto__` reject;
3. nested `/obj/__proto__` reject;
4. cualquier decoded token igual a `__proto__` reject;
5. `after` con own `__proto__` reject;
6. parent candidate con own `__proto__` reject dentro del boundary;
7. report/repair con own `__proto__` reject;
8. Object.prototype no cambia tras intentos rechazados;
9. object add/replace ordinario conserva resultado previo;
10. `constructor` / `prototype` no se bloquean solo por nombre cuando el resto del contrato los permite;
11. Python y JS mantienen dominio equivalente;
12. no existe export público de `validateAndApplyMap001Repair`;
13. E5.2 test demuestra que unsafe repair no produce transaction candidate;
14. E5.3 test demuestra que no se alcanza persistencia desde esa cadena;
15. suites E5.1/E5.2/E5.3 completas permanecen verdes.

## 15. Tests adversariales mínimos

Intentar:

- `__proto__` en raíz y profundidad;
- `__proto__` dentro de arrays de objetos;
- `after` y `expectedBefore`;
- múltiples operations con una sola contaminada;
- Object.prototype pollution assertion;
- nested target missing;
- keys cercanas `__proto___`, `constructor`, `prototype`;
- import del antiguo core exportado debe fallar o no existir;
- cadena E5.2/E5.3 no debe aceptar/persistir un resultado derivado del repair inseguro.

## 16. OPEN preservados

Siguen OPEN:

- arbitrary-runtime Proxy/getter/toJSON admission;
- strict external byte parsing;
- trusted materialization;
- CANONICAL_JSON_VALUE_V1;
- CANONICAL_JSON_NUMBER_POLICY;
- CANONICAL_JSON_SHA256_V2;
- hash-profile bridge A/B/C;
- cross-layer legacy-hash migration;
- MINIMAL_CHANGE_EXECUTABLE_RULE;
- observability delivery/isolation;
- authoritative critical-window caller integration;
- secret broker/credential lease;
- transport session/replay;
- provider/model/runtime;
- full repair-agent connection.

## 17. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-I2-SCOPE-R2-ASC-001

MANDATORY RELATIONS:

- executeMap001RepairGate is the sole supported executable E5.1 entrypoint;
- no public bypass of normalized boundary;
- decoded `__proto__` rejects before traversal/mutation;
- own `__proto__` anywhere in normalized E5.1 hashed artifacts rejects;
- object writes use own-data-property semantics;
- Python/JS acceptance domain remains aligned;
- E5.2/E5.3 implementation remains unchanged;
- E5.2/E5.3 test-only evidence is permitted;
- no logicalSha256 migration;
- repair agent remains disconnected.

DO NOT INFER:

- I2 secures arbitrary JS runtime objects before normalization;
- I2 secures every legacy hash call in the repository;
- test-only permission authorizes E5.2/E5.3 implementation changes;
- `constructor` or `prototype` are forbidden by name;
- I2 closes MINIMAL_CHANGE;
- I2 authorizes provider/model;
- NEXT_STAGE_ID or AUTHORIZED_FOR_ASC.

PROHIBITED:

- exported alternate E5.1 bypass;
- modifying logicalSha256 semantics;
- modifying E5.2/E5.3 implementation;
- provider/model invocation;
- durable authority outside E5.3;
- automatic retry;
- repair-agent connection.

ASC_CONTRACT_COMPILATION = PASS.

## 18. AUDITORÍA

R2 corrige I2-S1 fijando una única entrada ejecutable y elimina el bypass público del boundary normalizado.

R2 corrige I2-S2 distinguiendo claramente implementación vs test-only integration evidence.

La selección original de I2 se conserva.

## 19. INCONSISTENCIAS

No se detecta contradicción nueva con R17.

El claim de hash se limita explícitamente a la ruta E5.1 agent-originated, evitando sobredeclarar protección cross-layer.

## 20. VACÍOS / OMISIONES

Permanecen OPEN los boundaries anteriores a la normalización y la futura canonicalización V2.

No se cierran por inferencia.

## 21. REDUNDANCIAS

Pointer guard, artifact guard y safe write siguen siendo defensas complementarias.

Las pruebas E5.2/E5.3 son evidencia de propagación fail-closed y no duplican la prueba unitaria E5.1.

## 22. Resolución dirigida

```text
I2-S1 = ADDRESSED
I2-S2 = ADDRESSED
```

ADDRESSED != PASS.

## 23. Gate

```text
Scope R2
→ directed regression I2-S1/I2-S2
→ accumulated scope audit
→ scope validation
→ implementation
```

Estado:

```text
I2_SCOPE_R2 = CANDIDATE_FOR_DIRECTED_REGRESSION
I2_IMPLEMENTATION_STARTED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
```
