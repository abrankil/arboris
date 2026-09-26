# MAP-001 — Repair Agent R17 Implementation Iteration 002 — Result

Fecha: 2026-09-24
Estado: TECHNICAL_PASS_CANDIDATE
Scope validado: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2.md
Validación de scope: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2_ASC_VALIDATION_001.md
Functional head probado: 910360f153db61c7122cc1e78c547b711a6b04ec
PR: #80
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_READY: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Implementación

I2 endurece exclusivamente la frontera E5.1 previamente autorizada.

Cambios ejecutables:

- `executeMap001RepairGate` queda como único entrypoint público soportado de E5.1;
- el core determinista deja de exportarse;
- decoded pointer token `__proto__` falla cerrado;
- artifacts JSON ya normalizados con own key `__proto__` fallan antes de aceptación por hash legacy;
- object add/replace usa own-data-property semantics;
- el contract checker Python aplica el mismo dominio de rechazo;
- E5.2/E5.3 reciben únicamente tests negativos adicionales, sin cambios de implementación.

No se modifica `logicalSha256`, schemas, E5.2/E5.3 implementation, provider/model/transport, observability I1 ni autoridad durable.

## 2. Frontera ejecutable resultante

La ruta soportada queda:

```text
executeMap001RepairGate
→ current JSON normalization
→ LEGACY_HASH_UNSAFE_JSON_KEY guard
→ Python contract precheck
→ decoded pointer policy
→ authorization/scope checks
→ own-data-property mutation
→ derived artifact unsafe-key guard
→ existing legacy hashes
→ contract postcheck
```

No existe export público de `validateAndApplyMap001Repair`.

## 3. Tests dirigidos/adversariales

La suite E5.1 demuestra:

- reparación ordinaria sigue PASS;
- `/__proto__` reject;
- nested `/obj/__proto__` reject;
- Object.prototype permanece sin contaminación;
- own `__proto__` en `after` reject;
- own `__proto__` en `expectedBefore` reject;
- own `__proto__` dentro de arrays reject;
- own `__proto__` en parent/report/repair reject;
- repair con varias operations y una contaminada reject;
- Python checker rechaza own `__proto__`;
- `constructor`, `prototype` y `__proto___` no se bloquean solo por nombre;
- object writes ordinarios conservan properties enumerable/writable/configurable;
- el antiguo core ya no aparece como export público;
- invalid pointer y otras regresiones E5.1 continúan fail-closed.

E5.2 demuestra que un repair inseguro no produce transaction candidate aceptable.

E5.3 demuestra que un repair inseguro no llega a lock/journal/next durable metadata.

## 4. Evidencia externa del functional head

Functional head:

`910360f153db61c7122cc1e78c547b711a6b04ec`

GitHub Actions:

```text
Audit Protocol Check #290            PASS
CI #346                              PASS
MAP-001 Proposal Validation Gate #85 PASS
```

Dentro del MAP-001 gate #85:

```text
MAP authority runtime                                  PASS
Proposal validation adapter                            PASS
E2 integration                                         PASS
Run State R5 + Semantic Contract R3                    PASS
E4.2                                                   PASS
E4.3                                                   PASS
E5.1                                                   PASS
E5.2                                                   PASS
E5.3                                                   PASS
R17 I1 observability handoff                           PASS
```

## 5. Corrección durante implementación

El primer MAP gate de la implementación, #83, detectó siete tests históricos que habían sido migrados desde el antiguo core público hacia el entrypoint autoritativo, pero todavía esperaban códigos internos o usaban fixtures que no satisfacían el contract precheck completo.

Esto fue corregido en la superficie de tests:

- las assertions pasaron a reflejar la semántica del único entrypoint público;
- fixtures sintéticos con provenance falsa fueron sustituidos por fixtures válidos cuando la propiedad debía ejercerse detrás del gate;
- no se relajó E5.1;
- no se reintrodujo el core exportado.

MAP gate #84 pasó tras esa corrección. El head funcional final amplió además la matriz adversarial y MAP gate #85 volvió a pasar.

## 6. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-I2-POST-IMPLEMENTATION-AUDIT-ASC-001

MANDATORY RELATIONS:

- implementation remains inside validated I2 R2 scope;
- `executeMap001RepairGate` is sole supported public executable entrypoint;
- no alternate normalized-boundary bypass exists;
- unsafe decoded pointer token rejects before mutation;
- unsafe normalized key rejects before legacy hash acceptance inside E5.1;
- object writes use own-data-property semantics;
- E5.2/E5.3 implementation is unchanged;
- legacy hash semantics are unchanged;
- repair agent remains disconnected.

DO NOT INFER:

- I2 secures arbitrary runtime objects before JSON normalization;
- I2 secures all legacy-hash callers in the repository;
- I2 implements CANONICAL_JSON_SHA256_V2;
- I2 closes MINIMAL_CHANGE;
- I2 authorizes provider/model;
- successful I2 implies full R17 implementation readiness.

ASC_CONTRACT_COMPILATION = PASS.

## 7. AUDITORÍA

La implementación coincide con el scope R2.

La eliminación del export del core hace efectiva la decisión de autoridad: consumidores externos solo pueden pasar por normalización + contract gate.

El guard de own `__proto__` ocurre después de la normalización vigente y antes de `runContractGate`, que es relevante porque ese gate prepara hashes legacy de parent/report.

El mismo special-key domain se aplica en Python sobre los artifacts parseados.

Los writes objeto usan una own data property explícita y no inherited setter dispatch.

La evidencia downstream demuestra fail-closed antes de candidate aceptable y antes de metadata durable.

## 8. INCONSISTENCIAS

No se detectan inconsistencias bloqueantes dentro de I2.

La policy temporal:

```text
__proto__ rejected inside legacy E5.1 boundary
```

sigue siendo deliberadamente más restrictiva que un futuro canonical JSON general. No se presenta como política JSON universal.

## 9. VACÍOS / OMISIONES

Permanecen fuera de alcance y OPEN:

- getters / Proxy / toJSON antes o durante la normalización actual;
- strict external byte parsing;
- trusted materialization;
- resource limits exactos del traversal/hashing;
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
- full repair-agent connection.

No se cierran por inferencia.

## 10. REDUNDANCIAS

No se detecta redundancia problemática.

Son defensas intencionales y distintas:

```text
artifact-key guard
+ decoded-pointer guard
+ own-data-property write
+ Python contract-domain mirror
+ E5.2/E5.3 negative propagation tests
```

## 11. Resultado

```text
I2_IMPLEMENTATION = PASS_CANDIDATE

I2_DIRECTED_TESTS = PASS
I2_ADVERSARIAL_TESTS = PASS

CI = PASS
MAP001_GATE = PASS
AUDIT_PROTOCOL = PASS

NEW_BLOCKING_FINDINGS = 0
NEW_MAJOR_FINDINGS = 0

PROTOTYPE_SAFE_REPAIR_APPLICATION =
PASS_WITHIN_E5_1_NORMALIZED_JSON_BOUNDARY

FULL_R17_IMPLEMENTATION_READY = FALSE
REPAIR_AGENT_CONNECTED = FALSE
```

Procede regresión acumulada de I2 contra el scope R2 y los cierres E4/E5/R17 relevantes antes de la validación final de implementación.
