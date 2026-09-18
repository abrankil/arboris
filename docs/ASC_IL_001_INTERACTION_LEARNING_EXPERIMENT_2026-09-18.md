# ASC-IL-001 — Interaction/Learning experiment

**Fecha:** 2026-09-18  
**Repositorio:** `abrankil/arboris`  
**Estado:** evidencia experimental auditada — PASS para el alcance probado  
**Impacto ASC:** no modifica ASC v0.1, no modifica el schema, no modifica el compilador y no activa v0.2.

## 1. Objetivo

Comprobar si el subconjunto autorizado del Interaction/Learning Contract de `IT-001 / MAP-001` puede reducirse manualmente a un contrato ASC v0.1 preservando contenido, relaciones necesarias y estados `OPEN`, sin invención ni expansión del schema.

La autoridad upstream es `docs/SPATIAL_MODEL.md`. `data/maps/map-001-blockout-candidate-002.json` se utilizó únicamente como materialización de contraste y no sustituye esa autoridad.

## 2. Subconjunto probado

```text
sequence: orient → notice → observe

UE-001
- roles: orient, establish_place
- spatialBinding: OPEN

UE-002
- role: exploration
- observationOpportunity: required
- contentBinding: OPEN
- species: OPEN
- microhabitat: OPEN
- spatialBinding: OPEN

UE-003
- roles: pause, reflection, progression
- contentBinding: OPEN
- spatialBinding: OPEN
```

La obligación de que UE-002 contenga una oportunidad de observación no autoriza a resolver especie, microhábitat, contenido ni binding espacial.

## 3. Transformación a ASC v0.1

El candidato usa únicamente las 14 claves admitidas por ASC v0.1. No introduce campos específicos de Interaction/Learning.

Estrategia:
- estructura y secuencia → `structuralContract`;
- roles y obligación de observación → `mandatoryRelations`;
- bindings explícitamente abiertos → `open`;
- cierres inferenciales no permitidos → `doNotInfer`;
- prioridades → `readingPriorities`;
- comprobaciones → `validationCriteria`.

Las relaciones se preservan mediante strings autocontenidos que mantienen explícita la identidad de la UE y el objeto al que pertenece cada `OPEN`.

Fixture reproducible: `tools/asc/fixtures/asc-il-001-contract.json`.

## 4. Criterio de prueba

Se evaluaron dos dimensiones:

**Contenido:** `1:1`, `TRANSFORMADO`, `AMBIGUO`, `PÉRDIDA`, `NO REPRESENTABLE`, `NO PERTENECE A ASC`.

**Relación:** `PRESERVADA`, `AMBIGUA`, `PERDIDA`, `N/A`.

PASS exige que todo contenido esencial sea `1:1` o `TRANSFORMADO`, que las relaciones esenciales permanezcan preservadas, que ningún `OPEN` sea cerrado y que no sea necesario inventar información o ampliar ASC v0.1.

## 5. Resultado

| Elemento | Contenido | Relación | Resultado |
|---|---|---|---|
| orient → notice → observe | 1:1 | PRESERVADA | PASS |
| UE-001 orient | 1:1 | PRESERVADA | PASS |
| UE-001 establish_place | 1:1 | PRESERVADA | PASS |
| UE-002 exploration | 1:1 | PRESERVADA | PASS |
| UE-002 observationOpportunity required | TRANSFORMADO | PRESERVADA | PASS |
| UE-002 species OPEN | TRANSFORMADO | PRESERVADA | PASS |
| UE-002 microhabitat OPEN | TRANSFORMADO | PRESERVADA | PASS |
| UE-002 contentBinding OPEN | 1:1 | PRESERVADA | PASS |
| UE-002 spatialBinding OPEN | 1:1 | PRESERVADA | PASS |
| UE-001 spatialBinding OPEN | 1:1 | PRESERVADA | PASS |
| UE-003 pause / reflection / progression | 1:1 | PRESERVADA | PASS |
| UE-003 contentBinding OPEN | 1:1 | PRESERVADA | PASS |
| UE-003 spatialBinding OPEN | 1:1 | PRESERVADA | PASS |

No se asignaron especies ni microhábitats concretos, no se resolvieron bindings y no se inventaron mecánicas, recompensas, UI, cámara o libertad artística.

## 6. Hallazgo

Para este caso, ASC v0.1 puede representar el mínimo estructural Interaction/Learning probado mediante strings autocontenidos sin pérdida semántica demostrada.

La ausencia de relaciones tipadas en el schema no produjo pérdida demostrada en este experimento. Por tanto, ASC-IL-001 no aporta evidencia que justifique agregar campos, modificar el compilador o abrir v0.2.

Esto no demuestra que relaciones tipadas nunca sean necesarias.

## 7. Alcance no probado

ASC-IL-001 no prueba:
- Interaction/Learning de mayor complejidad;
- múltiples observationOpportunities por UE;
- condiciones, alternativas o dependencias entre learning beats;
- relaciones estructurales más complejas;
- ejecución por un modelo generativo externo;
- fidelidad de un ASC Result.

El Prompt ASC prototipo fue materializado durante el experimento conforme a la lógica inspeccionada de `tools/asc/compile_asc.mjs`; no se conserva como artefacto canónico porque es una salida derivada y regenerable desde el fixture. Este registro no pretende demostrar fidelidad de un ejecutor generativo.

## 8. Auditoría

### AUDITORÍA

El subconjunto autorizado evaluado puede reducirse al contrato ASC v0.1 preservando secuencia, roles, obligación de observación y bindings `OPEN` para el alcance probado.

### INCONSISTENCIAS

No se detectó una inconsistencia que obligue a cambiar ASC v0.1.

### VACÍOS / OMISIONES

No se probaron contratos Interaction/Learning complejos ni la frontera Prompt ASC → ejecutor → ASC Result.

### REDUNDANCIAS

Las repeticiones entre obligación, prioridad y criterio de validación cumplen funciones distintas dentro del experimento y no justifican cambios de schema.

### DECISIÓN

**INTEGRAR ASC-IL-001 COMO EVIDENCIA EXPERIMENTAL.**  
**NO MODIFICAR ASC v0.1.**  
**NO ABRIR v0.2.**

## 9. Conclusión

> El subconjunto autorizado de Interaction/Learning de IT-001 / MAP-001 evaluado por ASC-IL-001 puede transformarse mediante ASC v0.1 preservando su secuencia, roles, obligación de observación y bindings OPEN, sin pérdida semántica ni invención demostradas. La representación se consigue mediante strings autocontenidos; ASC-IL-001 no demuestra necesidad de relaciones tipadas, modificación del compilador ni expansión del schema.

Estado: **INTEGRADO COMO EVIDENCIA EXPERIMENTAL**.
