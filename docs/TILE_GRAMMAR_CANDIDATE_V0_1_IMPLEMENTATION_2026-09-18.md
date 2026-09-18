# Tile Grammar Candidate v0.1 — implementación determinista

**Fecha:** 2026-09-18  
**Estado:** candidate grammar ejecutable; no estándar de producción  
**Origen experimental:** `TILE-PRISM-GRAMMAR-TEST-006 — PASS VISUAL`

## Objetivo

Convertir los hallazgos visuales de TEST-006 en reglas verificables sin promover la imagen generada a autoridad territorial ni artística.

## Modelo

La celda lógica separa:

```text
surface.composition
walkability
blocker
route.kind + route.ports
elevation.mode + RELATIVE_ONLY
edges[4]
  content
  profile
  bandEndpoints
  traversal
  routePort
visualTreatment = ART_PROVISIONAL
```

Las direcciones `grid_up`, `grid_right`, `grid_down` y `grid_left` pertenecen al marco local de la celda. No implican cardinalidad geográfica.

## Compatibilidad de borde

Dos celdas adyacentes pasan únicamente cuando:

1. `bandEndpoints` coinciden en orden inverso;
2. `routePort` coincide;
3. `traversal` coincide;
4. `edgeProfile` es compatible;
5. `edgeContent` es compatible.

Reglas iniciales:

```text
land ↔ land = permitido
water ↔ water = permitido
land ↔ water = permitido solo mediante bank ↔ bank cerrado
open ↔ closed = fail
routePort true ↔ false = fail
cliff ↔ blocked = permitido como cierre
```

`mixed` se conserva como estado experimental para interfaces cuya composición interna todavía no se descompone en otra representación.

## Fail-closed

El validador rechaza, entre otros:

- route ports no declarados por la ruta;
- rutas sobre hard blockers;
- hard blockers transitables;
- métricas cerradas por inferencia;
- renderer cerrado por inferencia;
- endpoints de altura incompatibles;
- path port conectado a un borde sin path port;
- `land ↔ water` sin banco cerrado.

## Fixture TEST-006

Se serializó una matriz C01–C09 como fixture determinista. Su geometría es únicamente una prueba normalizada de la gramática; no constituye geometría territorial ni `walkableEnvelope` definitivo.

## Estado

```text
TILE-GRAMMAR-CANDIDATE-v0.1

EXECUTABLE MODEL: IMPLEMENTED
EDGE VALIDATION: IMPLEMENTED
FAIL-CLOSED NEGATIVE TESTS: IMPLEMENTED
TEST-006 FIXTURE: IMPLEMENTED

TILE SIZE: OPEN
METRIC SCALE: OPEN
RENDERER: OPEN
FINAL PIXEL ART: NOT TESTED
PRODUCTION STANDARD: NOT ESTABLISHED
```

La siguiente validación debe probar esta gramática con más de un patch y buscar casos donde las reglas sean insuficientes o demasiado restrictivas antes de promoverla.
