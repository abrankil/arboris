# MAP-001 — E4.3 Single-Iteration Orchestrator 001

**Fecha:** 2026-09-23  
**Ámbito:** E4.3 — una iteración real completa del resolver MAP-001  
**Estado:** `CLOSED / PASS`  
**Baseline:** `main@78290df3c59068ddf7c2fc350db3cb9fa61c4a25`  
**Precondición:** E4.1 y E4.2 cerrados; adapter E3 y reducer E4.2 disponibles. Durante la auditoría E4.3, Run State R5 / Semantic Contract R3 fueron revisados a Run State R5 / Semantic Contract R3 para cerrar procedencia de dependencias ejecutables.

## 1. Objetivo

Conectar en una sola operación ejecutable las piezas ya validadas:

```text
proposal
→ contract precheck
→ provenance / execution pins
→ MAP-001 domain validator real
→ validation-report
→ report binding en run-state
→ E4.2 reducer
→ run-state resultante
→ contract postcheck
```

La implementación es:

```text
tools/proposal-resolution/map001_single_iteration_orchestrator_r1.mjs
```

E4.3 todavía no genera repairs ni repite el ciclo.

## 2. Responsabilidad

El orquestador pertenece a Árboris.

Recibe:

```text
run-state R5
proposal R2
reportId
repository root
historical validation-reports cuando correspondan
```

y devuelve:

```text
updated run-state
validation-report o null
derived resolver state
evidencia de pre/post contract gate
```

## 3. Contract gate

Se agregó:

```text
tools/proposal-resolution/validate_e4_3_iteration_contracts.py
```

El precheck comprueba:

```text
Run State R5 schema
Proposal R2 schema
SEM-PROP-004
runId binding
iteration binding
baseline binding
proposal logical hash binding
candidate logical hash binding
artifactPath dentro de allowedRoots
```

El postcheck añade:

```text
Validation Report R1 schema
status derivado desde findings
repo-local sourceRefs existentes
authority binding
validator binding
run/report binding
report logical hash binding
```

La canonicalización lógica sigue viniendo de `logicalSha256` del adapter E3 y se pasa al gate Python como binding explícito. El gate Python no redefine la canonicalización.

## 4. Provenance / execution pins

Antes de invocar el domain validator, E4.3 verifica bytes reales de:

```text
authority manifest
source candidate
validator implementation
resolver entrypoint
resolver dependency closure
Proposal schema
Repair schema
Validation Report schema
Run State schema
Semantic Contract
```

Clasificación:

```text
authority/source candidate SHA drift
→ AUTHORITY_CHANGED

validator/resolver entrypoint/resolver dependency/contract SHA drift
→ SYSTEM_ERROR
```

También se verifica que cada `contractSet.schemaId` coincida con el `$id` real del schema o con `contractId` en el contrato semántico.

La auditoría posterior al primer PASS detectó que fijar solo el entrypoint del orquestador no cerraba la procedencia de sus dependencias ejecutables. Eso permitía, en principio, modificar el adapter, el reducer o los gates Python sin alterar `resolverBinding.implementationSha256`.

Se corrigió mediante Run State R5 + Semantic Contract R3. El resolver debe declarar exactamente estas dependencias:

```text
VALIDATION_ADAPTER
RUN_STATE_REDUCER
ITERATION_CONTRACT_GATE
E3_CONTRACT_GATE
```

Cada una queda fijada por path repo-relative canónico y SHA-256 de bytes reales. El conjunto debe coincidir exactamente con `resolverDependencyPolicy.requiredDependencyIds`.

## 5. Precedencia antes de validar

E4.3 usa el reducer E4.2 antes del domain validator.

Si el estado derivado no es:

```text
READY_TO_VALIDATE
```

no ejecuta el validator de dominio y retorna el estado correspondiente.

Esto evita ejecutar trabajo de dominio cuando ya existe:

```text
SYSTEM_ERROR
AUTHORITY_CHANGED
CYCLE_DETECTED
u otro estado no validable
```

## 6. Ejecución de dominio

Solo cuando:

```text
execution pins conformes
+
run-state derivado = READY_TO_VALIDATE
+
contract precheck = PASS
```

se invoca:

```text
validateMap001Proposal
```

que a su vez ejecuta el authority-runtime MAP-001 real y produce Validation Report R1.

## 7. Binding y reducción

El report se enlaza a la iteración actual mediante:

```text
reportId
logicalSha256(report)
status
```

Luego E4.2 calcula el estado.

Ejemplos esperados:

```text
PASS
→ DOMAIN_PASS

REJECT_FIXABLE
→ READY_TO_REPAIR

OPEN_BLOCKER
→ OPEN_BLOCKED

AUTHORITY_BLOCKER
→ AUTHORITY_BLOCKED
```

## 8. Pruebas E4.3

Archivo:

```text
tools/proposal-resolution/map001_single_iteration_orchestrator_r1.test.mjs
```

Casos:

```text
real PASS → DOMAIN_PASS
real derived drift → READY_TO_REPAIR
real OPEN closure attempt → OPEN_BLOCKED
real protected authority drift → AUTHORITY_BLOCKED
authority manifest SHA drift → AUTHORITY_CHANGED before domain validation
validator SHA drift → SYSTEM_ERROR before domain validation
contract-set SHA drift → SYSTEM_ERROR before domain validation
resolver dependency SHA drift → SYSTEM_ERROR before domain validation
resolver dependency set incomplete → SYSTEM_ERROR before domain validation
candidateHistory wrong logical hash → SYSTEM_ERROR before domain validation
artifactPath outside allowlist → SYSTEM_ERROR before domain validation
missing resolver dependency file → SYSTEM_ERROR before domain validation
resolver dependency path escaping repository → SYSTEM_ERROR before domain validation
```

Cada caso que alcanza domain validation usa el validator MAP-001 real.

## 9. Límite de E4.3

No pertenece a E4.3:

```text
repair generation
repair patch application
child proposal creation
atomic persistence
automatic next iteration
loop until terminal state
resume/recovery after process failure
authorization DOMAIN_PASS → AUTHORIZED_FOR_ASC
ASC compilation
```

## 10. Papel de ASC

ASC se usa como control de frontera arquitectónica.

```text
orchestrator
→ coordina la iteración

domain validator
→ determina conformidad MAP-001

reducer
→ determina estado del resolver

ASC
→ no participa en esas decisiones
→ no cierra OPEN
→ no convierte DOMAIN_PASS en autorización
→ permanece compile-only
```

No se modifica `tools/asc/compile_asc.mjs`.

## 11. AUDITORÍA

E4.3 compone piezas previamente validadas sin mover responsabilidades entre ellas. El orquestador añade controles de procedencia y bindings que antes estaban distribuidos entre E3, E4.1 y E4.2.

El pre/post contract gate impide considerar válida una iteración solo porque el adapter o el reducer produzcan una salida plausible.

Una revisión adicional detectó otra brecha de fail-closed: ciertas fallas de pre/post contract gate o de resolución de archivos podían propagarse como excepciones del proceso en vez de materializarse como estados del resolver. Se corrigió para que esas fallas queden representadas en `SYSTEM_ERROR` o `AUTHORITY_CHANGED` según corresponda, sin fabricar validation-reports.

La auditoría adversarial posterior al primer PASS añadió además cierre de procedencia transitiva del resolver. Por ello, el PASS inicial de E4.3 queda como evidencia histórica pero no como evidencia suficiente de cierre; el candidato revisado R5/R3 debe volver a ejecutar el gate completo.

## 12. INCONSISTENCIAS

Existe una inconsistencia documental heredada: el archivo materializado del Semantic Contract R3 conserva:

```text
status = R2_CANDIDATE
```

aunque E4.1 fue cerrado y aprobado humanamente.

E4.3 no cambia ese campo silenciosamente. Usa el artefacto exacto fijado por hash. La normalización del estado documental del contrato deberá resolverse explícitamente antes del freeze final de E4.

No se detecta otra inconsistencia conceptual en el diseño E4.3.

## 13. VACÍOS / OMISIONES

La persistencia atómica real de la iteración todavía no se ejecuta. E4.3 devuelve el run-state actualizado en memoria.

Las fallas de integración detectables dentro de esta operación ya no deben escapar como excepciones no clasificadas: se convierten en estados fail-closed del resolver.

Por ello E4.3 demuestra composición ejecutable de una iteración, no durabilidad ni recuperación.

## 14. REDUNDANCIAS

No se duplican reglas geométricas MAP-001 ni lógica de estado:

```text
adapter E3
→ sigue siendo la integración de dominio

reducer E4.2
→ sigue siendo la única lógica de transición

orchestrator E4.3
→ solo compone y controla bindings/provenance
```


## 15. Cierre E4.3

Head validado antes del cierre:

```text
a89e58a4df0eb6bf168d31ad74f3d0a2235561a1
```

Evidencia externa:

```text
Audit Protocol Check                 PASS
CI                                   PASS
MAP-001 Proposal Validation Gate     PASS
Run State R5 + Semantic Contract R3  PASS
E4.2 reducer regression              PASS
E4.3 single-iteration orchestrator   PASS
```

La aprobación humana explícita fue recibida después de estas validaciones.

Resultado:

```text
E4.3
PASS
CLOSED
```

Este cierre no autoriza `DOMAIN_PASS → AUTHORIZED_FOR_ASC`, no implementa repair agent y no implementa el loop repetitivo completo.
