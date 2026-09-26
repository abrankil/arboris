# MAP-001 — Repair Agent R17 Implementation Iteration 002 — Scope

Fecha: 2026-09-24
Estado: I2_SCOPE_CANDIDATE_FOR_VALIDATION
Branch: repair-agent-r17-i2-prototype-safety
Baseline: main@c5d2de3c24be4aed11e89ccae4a198f4b4b6fe0d
Diseño rector: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_017.md
I1 validada: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_001_ASC_VALIDATION.md
Autorización de fase: docs/MAP001_REPAIR_AGENT_IMPLEMENTATION_AUTHORIZATION_001.md
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_READY: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Determinación de I2

Después de integrar I1, R17 mantiene varios OPEN ejecutables.

Se evaluaron como candidatos inmediatos:

A. integrar AUTHORIZATION_CRITICAL_WINDOW_V1 con un caller autoritativo real;
B. implementar isolated observability materializer/delivery;
C. cerrar la aplicación prototype-safe de E5.1 dentro del boundary JSON normalizado vigente;
D. implementar CANONICAL_JSON_SHA256_V2 + hash-profile bridge;
E. implementar MINIMAL_CHANGE_EXECUTABLE_RULE.

I2 selecciona C.

## 2. Justificación de selección

La selección sigue estas restricciones:

- debe ser un subconjunto estricto de R17;
- debe ser ejecutable y testeable contra código que ya existe;
- debe reducir un blocker real de la futura ruta agentPatch → Repair R1 → E5.1;
- no debe requerir elegir provider/model/runtime;
- no debe introducir nueva autoridad durable;
- no debe modificar silenciosamente LEGACY_LOGICAL_SHA256_V1;
- no debe resolver por inferencia OPEN que requieren decisiones adicionales.

El código E5.1 vigente usa asignación directa de propiedades de objeto durante add/replace y el hash legacy vigente canonicaliza usando objetos JS ordinarios.

Por tanto, existe una frontera concreta que debe endurecerse antes de admitir datos futuros originados fuera del resolver.

## 3. Razones para no seleccionar los otros candidatos todavía

A — AUTHORIZATION_CRITICAL_WINDOW integration:

El flujo real credential preflight → provider-call authorization → send todavía no existe. Vincular I1 a una “fuente autoritativa real” en este momento obligaría a inventar un runtime de provider/transport que R17 mantiene OPEN.

B — isolated observability materializer/delivery:

Requiere decidir y demostrar execution-surface enforcement, worker/process/IPC technology, resource partitioning y scheduling isolation. Es una iteración válida futura, pero introduce una superficie ejecutable secundaria antes de cerrar un debt local ya existente en E5.1.

D — CANONICAL_JSON_SHA256_V2 + bridge:

Es cross-layer. Requiere CANONICAL_JSON_NUMBER_POLICY, trusted materialization y una decisión explícita de bridge/migration con E5. No es una primera corrección local.

E — MINIMAL_CHANGE_EXECUTABLE_RULE:

Sigue requiriendo una regla ejecutable o revisión de autoridad. No corresponde inventarla como simple detalle de código.

## 4. Objetivo I2

I2 implementará una barrera fail-closed para impedir prototype mutation y ambigüedad del hash legacy cuando E5.1 procesa artefactos JSON ya normalizados.

Nombre conceptual:

```text
E5_1_PROTOTYPE_AND_LEGACY_HASH_SAFETY_BOUNDARY_R1
```

I2 no cambia el hash profile vigente y no amplía la autoridad de Repair R1.

## 5. Alcance ejecutable

Se autoriza modificar únicamente la superficie necesaria de:

```text
tools/proposal-resolution/map001_repair_gate_r1.mjs
tools/proposal-resolution/map001_repair_gate_r1.test.mjs
tools/proposal-resolution/validate_e5_repair_contracts.py
```

y, solo si el gate lo requiere, la entrada correspondiente de:

```text
.github/workflows/map001-proposal-validation.yml
```

No se autoriza modificar en I2:

```text
tools/proposal-resolution/map001_validation_adapter_r1.mjs
logicalSha256 semantics
E5.2
E5.3
Run State R5
Semantic Contract R3
repair.schema.json
proposal.schema.json
provider/model/transport code
observability I1
```

## 6. Invariante 1 — ningún decoded pointer token __proto__

Después de aplicar JSON Pointer decoding, cualquier token exactamente igual a:

```text
__proto__
```

debe fallar cerrado antes de traversal o mutation.

Failure code conceptual:

```text
PROTOTYPE_SENSITIVE_POINTER_TOKEN
```

La comparación se realiza sobre el token decodificado, no sobre el string raw del pointer.

I2 no crea una blacklist genérica de nombres JavaScript.

```text
constructor
prototype
```

no se rechazan por nombre solamente. Cualquier futura restricción adicional requiere evidencia separada.

## 7. Invariante 2 — object writes usan own-data-property semantics

Toda mutación add/replace sobre parent objeto debe usar una primitiva que cree o reemplace una own data property sin invocar el setter heredado de `Object.prototype.__proto__`.

Conceptualmente:

```text
object add/replace
→ own enumerable writable configurable data property
→ no inherited setter dispatch
```

La implementación concreta puede usar `Object.defineProperty` o una primitiva equivalente demostrablemente segura.

Array semantics no cambian.

Remove semantics no cambian.

## 8. Invariante 3 — legacy-hash unsafe key guard

I2 no cambia `LEGACY_LOGICAL_SHA256_V1`.

Antes de que E5.1 calcule hashes legacy sobre los artefactos JSON normalizados, debe fallar cerrado si existe una own JSON object key exactamente igual a:

```text
__proto__
```

en cualquier nivel del artefacto que será consumido por el hash legacy en E5.1.

El guard se aplica como mínimo a:

```text
normalizedParent
normalizedReport
normalizedRepair
derived child/candidate before legacy hashing
```

Failure code conceptual:

```text
LEGACY_HASH_UNSAFE_JSON_KEY
```

Objetivo:

```text
no special-key ambiguity
without changing legacy hash semantics
```

## 9. Boundary de confianza explícito

I2 opera después de la normalización JSON actualmente existente en E5.1.

No afirma resolver:

- arbitrary Proxy admission;
- hostile getters/toJSON ejecutados antes o durante JSON.stringify;
- strict external byte parsing;
- trusted materialization de provider output;
- CANONICAL_JSON_VALUE_V1 completo.

Esos elementos permanecen OPEN bajo R17.

Por tanto el claim máximo de I2 será:

```text
PROTOTYPE_SAFE_REPAIR_APPLICATION
= PASS_WITHIN_E5_1_NORMALIZED_JSON_BOUNDARY
```

No se permite elevarlo a una garantía de arbitrary-runtime-object safety.

## 10. Equivalencia JS/Python

El gate JavaScript y el contract checker Python deben rechazar coherentemente:

- decoded pointer token `__proto__`;
- JSON object key `__proto__` dentro de artifacts que E5.1 acepta para hash/replay.

Python no necesita esta protección por prototype mutation de su runtime; la aplica para conservar una única semántica de contrato E5.1.

No debe existir:

```text
Python PASS
+
JavaScript ACCEPT with different semantic domain
```

para el mismo artifact.

## 11. Orden de enforcement

El orden requerido es:

```text
current JSON normalization
→ legacy-hash unsafe-key guard
→ contract precheck
→ pointer decode + prototype-sensitive-token guard
→ authorization/scope checks
→ safe mutation
→ derived artifact unsafe-key guard
→ legacy hash
→ contract postcheck
```

La implementación puede refactorizar internamente el orden solo si demuestra las mismas garantías.

## 12. Tests dirigidos mínimos

La suite I2 debe demostrar:

1. reparación ordinaria existente sigue PASS;
2. add hacia `/__proto__` falla cerrado;
3. add hacia nested `/obj/__proto__` falla cerrado;
4. un pointer cuya forma raw decodifica a `__proto__` también falla si fuese representable;
5. `after` con own JSON key `__proto__` falla cerrado;
6. parent candidate con own JSON key `__proto__` falla cerrado antes de legacy hashing;
7. validation report/repair con own JSON key `__proto__` falla cerrado dentro del boundary aplicable;
8. Object.prototype no cambia después de cada intento rechazado;
9. un object add/replace ordinario conserva el mismo resultado previo;
10. constructor/prototype como strings ordinarios no se bloquean solo por el nombre cuando el contrato de dominio los permite;
11. Python contract checker y JS gate mantienen la misma policy;
12. E5.1 suite completa permanece verde.

## 13. Tests adversariales mínimos

La suite debe intentar:

- `__proto__` en diferentes profundidades;
- `__proto__` dentro de arrays de objetos;
- `__proto__` dentro de `after` y `expectedBefore`;
- múltiples operations donde solo una contiene la key insegura;
- intento de prototype pollution seguido de assertion sobre objetos nuevos;
- nested target cuyo parent no existe;
- ordinary keys cercanas como `__proto___`, `prototype`, `constructor`.

Criterio:

```text
unsafe special-key case
→ fail closed
→ no prototype mutation
→ no child accepted
→ no E5.2/E5.3 action
```

## 14. Regresión acumulada requerida

Después de implementación deben pasar:

```text
E5.1 full regression
E5.2 regression
E5.3 regression
E4.2 / E4.3
Run State R5 + Semantic Contract R3
MAP-001 Proposal Validation Gate
CI
Audit Protocol Check
```

I2 no puede reutilizar PASS previos como evidencia suficiente del nuevo head.

## 15. OPEN preservados

Permanecen OPEN:

- arbitrary-runtime trusted materialization;
- CANONICAL_JSON_VALUE_V1 executable implementation;
- CANONICAL_JSON_NUMBER_POLICY;
- CANONICAL_JSON_SHA256_V2;
- hash-profile bridge A/B/C;
- E5 compatibility/migration path beyond I2 fail-closed guard;
- MINIMAL_CHANGE_EXECUTABLE_RULE;
- observability delivery/isolation;
- critical-window authoritative caller integration;
- secret broker;
- credential lease capability/binding;
- provider transport;
- transport session/replay;
- provider/model/runtime;
- full repair-agent connection.

## 16. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-I2-SCOPE-ASC-001

AUTHORIZED SOURCES:

- main@c5d2de3c24be4aed11e89ccae4a198f4b4b6fe0d;
- R17 validated design;
- I1 validated implementation;
- current E5.1 executable code;
- current Repair R1 schema/contract;
- current legacy logical hash behavior;
- DEVELOPMENT_MANUAL.

MANDATORY RELATIONS:

- I2 must be a strict subset of validated R17;
- no legacy hash-profile mutation;
- decoded `__proto__` target fails before mutation;
- normalized artifacts containing own `__proto__` key fail before legacy hash acceptance;
- object writes cannot invoke inherited prototype setter semantics;
- JS/Python E5.1 policy remains aligned;
- E5.2/E5.3 authority remains unchanged;
- repair agent remains disconnected.

DO NOT INFER:

- constructor/prototype are unsafe merely by name;
- I2 solves arbitrary Proxy/getter materialization;
- rejecting legacy-unsafe keys is equivalent to CANONICAL_JSON_SHA256_V2;
- I2 authorizes provider/model;
- I2 closes MINIMAL_CHANGE;
- successful scope compilation authorizes implementation automatically;
- NEXT_STAGE_ID or AUTHORIZED_FOR_ASC.

PROHIBITED:

- modifying `logicalSha256` semantics;
- hash-profile migration;
- provider/model invocation;
- durable authority outside E5.3;
- automatic retry;
- repair-agent connection;
- scope expansion into transport/observability delivery.

ASC_CONTRACT_COMPILATION = PASS.

## 17. AUDITORÍA

I2 addresses a concrete executable debt already present in the future agentPatch → E5.1 path.

It is testable without introducing provider/model/runtime choices and without changing durable authority.

The chosen fail-closed guard deliberately preserves legacy hash semantics instead of silently repairing the canonicalizer.

## 18. INCONSISTENCIAS

No se detecta contradicción con R17.

There is a deliberate limitation:

```text
general canonical JSON design may eventually support __proto__ as ordinary JSON data
while I2 legacy E5.1 rejects it fail-closed
```

This is not treated as permanent canonical policy. It is a compatibility boundary until an authorized V2 hash/materialization path exists.

## 19. VACÍOS / OMISIONES

I2 does not solve arbitrary runtime-object admission before JSON normalization.

I2 also does not prove future provider-derived bytes enter E5.1 through trusted materialization.

Those remain explicit prerequisites for later repair-agent integration.

## 20. REDUNDANCIAS

Pointer-token guard + artifact-key guard are intentional:

- pointer-token guard prevents prototype-sensitive mutation target;
- artifact-key guard prevents legacy-hash ambiguity anywhere in hashed JSON content.

Safe own-property writes are a third defensive layer and do not replace either guard.

## 21. Gate I2

```text
I2 scope authored
→ directed/adversarial scope audit
→ scope validation
→ implementation
→ directed/adversarial tests
→ external gates
→ implementation audit
→ accumulated regression
→ implementation validation
→ human merge decision
```

Estado actual:

```text
I2_SCOPE = CANDIDATE_FOR_VALIDATION
I2_IMPLEMENTATION_STARTED = FALSE
FULL_R17_IMPLEMENTATION_READY = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
```
