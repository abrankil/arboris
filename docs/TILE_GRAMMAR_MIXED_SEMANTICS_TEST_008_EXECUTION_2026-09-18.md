# TILE-GRAMMAR-MIXED-SEMANTICS-TEST-008 — ejecución

**Fecha:** 2026-09-18  
**Candidato:** `TILE-GRAMMAR-CANDIDATE-v0.2`  
**Runtime local:** Node `v22.16.0`  
**Resultado semántico:** `KEEP`  
**Production standard:** `NOT_ESTABLISHED`

## Cambio bajo prueba

TEST-007 mostró que `edgeContent=mixed` funcionaba como wildcard implícito. v0.2 cambia esa semántica a:

```text
mixedEdgePolicy = UNRESOLVED_NON_CONNECTABLE
```

`surface.composition=mixed` continúa permitido. La celda debe exponer un borde concreto `land` o `water` cuando esa interfaz esté resuelta.

## Batería

Se ejecutaron 17 fixtures.

```text
CORRECT: 17
FALSE_POSITIVE: 0
FALSE_NEGATIVE: 0
UNDER_SPECIFIED: 0
REPRESENTATIONAL_GAP: 0

DECISION: KEEP
```

La batería conserva los casos de elevación relativa, bank, routePort, traversal, hard blocker y validación local multi-cell, y añade cinco casos específicos para mixed.

## Fixtures mixed

```text
MIXED-PASS-01
surface=mixed + edge=land ↔ land
PASS / CORRECT

MIXED-PASS-02
surface=mixed + edge=water(bank) ↔ water(bank)
PASS / CORRECT

MIXED-FAIL-01
edge=mixed ↔ land
FAIL / EDGE_COMPATIBILITY / CORRECT

MIXED-FAIL-02
edge=mixed ↔ water
FAIL / EDGE_COMPATIBILITY / CORRECT

MIXED-FAIL-03
edge=mixed ↔ mixed
FAIL / EDGE_COMPATIBILITY / CORRECT
```

## Interpretación

El wildcard implícito queda eliminado. El resultado `KEEP` significa que la revisión v0.2 se comporta correctamente frente a esta batería; no significa que la gramática sea estándar de producción.

La incapacidad de conectar `mixed ↔ mixed` es deliberada y fail-closed. Si Árboris necesita bordes compuestos conectables, será necesario diseñar segmentación explícita del borde y someterla a otra prueba.

## Runtime gate

Las pruebas locales específicas de v0.2 también dieron:

```text
7/7 PASS
```

La ejecución se realizó en Node v22.16.0. El proyecto exige Node `>=24.0.0 <25`, por lo que la conformidad de runtime y el baseline canónico siguen abiertos hasta repetir bajo Node 24.

## OPEN preservados

```text
tileSize: OPEN
metricScale: OPEN
renderer: OPEN
pathfinding: OPEN
territorial geometry: OPEN
edge segmentation for mixed: OPEN
final pixel art: NOT TESTED
production standard: NOT_ESTABLISHED
```
