# TILE-GRAMMAR-STRESS-TEST-007 — ejecución y auditoría

**Fecha:** 2026-09-18  
**Objeto bajo prueba:** `TILE-GRAMMAR-CANDIDATE-v0.1`  
**Estado:** `REVISE`  
**Runtime ejecutado:** Node `v22.16.0` — runtime no conforme con `package.json` (`>=24.0.0 <25`)

## Propósito

Ejecutar la batería determinista definida por el contrato ASC `TILE-GRAMMAR-STRESS-TEST-007` sin modificar durante la corrida ni la gramática candidata ni el validador.

La prueba separa:

```text
expectedAssessment
→ PASS | FAIL | REVIEW

observedValidatorResult
→ PASS | FAIL | ERROR

observedRejectionLayer
→ NONE | TILE_INVARIANT | EDGE_COMPATIBILITY

grammarAssessment
→ CORRECT | FALSE_POSITIVE | FALSE_NEGATIVE | UNDER_SPECIFIED | REPRESENTATIONAL_GAP
```

## Provenance ASC

```text
CONTRACT SHA-256
67704441a9010855682250ac634c835173dca496e78f4e5f5d88f59629e2b7be

COMPILED PROMPT SHA-256
3d5af012fc579d77ee4bf6d1034245a05969407e31ba59b3301bf38e2d55d945
```

La compilación previa fue determinista A/B bajo el runtime disponible. Estos hashes no se promueven a baseline de runtime conforme hasta repetir compilación y ejecución con Node 24.

## Resultado

Se ejecutaron **13 fixtures**:

- 5 casos positivos, incluyendo el caso multi-cell local-only;
- 7 casos negativos, separados entre `EDGE_COMPATIBILITY` y `TILE_INVARIANT`;
- 1 caso `REVIEW` dirigido a `edgeContent=mixed`.

```text
CORRECT: 12
UNDER_SPECIFIED: 1
FALSE_POSITIVE: 0
FALSE_NEGATIVE: 0
REPRESENTATIONAL_GAP: 0

DECISION: REVISE
PRODUCTION STANDARD: NOT_ESTABLISHED
```

## Casos positivos

```text
PASS-01  land ↔ land                           PASS / CORRECT
PASS-02  +1 → slope → 0                        PASS / CORRECT
PASS-03  land ↔ water mediante bank cerrado    PASS / CORRECT
PASS-04  continuidad declarativa routePort     PASS / CORRECT
PASS-05  multi-cell local-only                 PASS / CORRECT
```

`PASS-04` demuestra conectividad declarativa de `routePort`, no geometría interna de camino, pathfinding ni navegación global.

`PASS-05` comprueba que múltiples bordes localmente compatibles pueden validarse sin convertir ese resultado en una afirmación de navegabilidad global.

## Casos negativos

```text
FAIL-01  routePort true ↔ false                EDGE_COMPATIBILITY
FAIL-02  traversal open ↔ closed               EDGE_COMPATIBILITY
FAIL-03  bandEndpoints incompatibles           EDGE_COMPATIBILITY
FAIL-04  land ↔ water sin bank cerrado         EDGE_COMPATIBILITY
FAIL-05A hard blocker walkable                 TILE_INVARIANT
FAIL-05B hard blocker con route                TILE_INVARIANT
FAIL-06  cliff/blocked con traversal open      TILE_INVARIANT
```

Todos fueron rechazados en la capa prevista. No se detectaron falsos positivos ni falsos negativos en esos fixtures.

## Hallazgo principal — mixed

`REVIEW-01` produjo:

```text
expectedAssessment: REVIEW
observedValidatorResult: PASS
observedRejectionLayer: NONE
grammarAssessment: UNDER_SPECIFIED
```

La interfaz `mixed ↔ water` fue aceptada con `profile=level` y `traversal=open` porque la implementación actual de `contentsCompatible()` considera `mixed` compatible con cualquier otro `edgeContent` antes de exigir una interfaz más específica.

```text
mixed != wildcard autorizado
```

El resultado no demuestra que toda interfaz con `mixed` sea incorrecta. Demuestra que la gramática actual no contiene información suficiente para justificar por qué esa interfaz concreta debe aceptarse.

## Decisión

La batería conserva correctamente coincidencia de `bandEndpoints`, `routePort`, `traversal`, perfiles básicos, bancos cerrados `land ↔ water`, invariantes de hard blocker y la separación entre compatibilidad local y navegación global.

El gap material detectado es semántico y localizado en `mixed`.

Por la regla del contrato:

```text
UNDER_SPECIFIED corregible sin reemplazar el modelo base
→ REVISE
```

No corresponde `INSUFFICIENT`: no apareció un `REPRESENTATIONAL_GAP` que obligue a sustituir el modelo conceptual completo.

## OPEN preservados

```text
tileSize: OPEN
metricScale: OPEN
renderer: OPEN
pathfinding: OPEN
territorial geometry: OPEN
final pixel art: NOT TESTED
production standard: NOT_ESTABLISHED
```

## Gate de runtime

```text
SEMANTIC STRESS RESULT: REVISE
LOCAL EXECUTION: PASS
RUNTIME CONFORMANCE: NOT YET CLOSED
CANONICAL EXECUTION BASELINE: NOT YET ESTABLISHED
```

La siguiente iteración debe corregir o descomponer la semántica de `mixed`, agregar fixtures específicos para esa regla y repetir la batería bajo Node 24 antes de cualquier promoción de la gramática.
