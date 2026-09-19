# MAP-001 × Tile Grammar v0.2 — Pre-integration Test 001 — resultado y auditoría

**Fecha:** 2026-09-18  
**Execution ID:** `MAP001-TILEGRAMMAR-PREINTEGRATION-TEST-001-EXEC-001`  
**Contrato:** `MAP001-TILEGRAMMAR-PREINTEGRATION-TEST-001` rev. `0.2`  
**HEAD ejecutado:** `d15c68ae0786efbe5b7382c5b37e22d3fa3b65eb`  
**Runtime:** Node `v24.20.0`  
**Estado:** `COMPLETED`  
**Decisión semántica:** `PASS`  
**Producción:** `NOT_ESTABLISHED`

## Resultado ejecutivo

El test de pre-integración fue ejecutado en GitHub Actions contra el baseline congelado y terminó con éxito.

```text
workflow: MAP-001 Tile Grammar Pre-integration
run: 35379033154
conclusion: success

automated tests:
8/8 PASS

executionStatus:
COMPLETED

semanticDecision:
PASS
```

La lectura correcta del resultado es:

```text
PASS dentro del subconjunto probado
≠
Tile Grammar representa todo MAP-001
≠
estándar de producción
≠
renderer autorizado
```

## Evidencia congelada

```text
report.a.json SHA-256
b48b68b58c73620011f94a6ddf82bc1f02d1c76ae18b96ee4390d54bbb02c6c3

contract JSON SHA-256
f607a0a8ef3839954aba77f1cab7f3232cc9575c83a2a0b80f65d7bc080aef64

executable fixture digest
08aacbcff97551d517cd002f6393e983781aeb3ddd9cb4e25ebe9b34678938a2
```

Artifact de GitHub Actions:

```text
name:
map001-tilegrammar-preintegration-test-001

artifact ID:
10561736458

digest:
sha256:a7b5f7e580115c62a6bfa5ae3d43e53ed0ebbdabfb9714899571e93fabe81a19

retention:
30 days
```

## PI-00 — Baseline preflight

Resultado:

```text
BASELINE_VALID
```

Se verificaron Node 24, baseline ID y hashes fijados para MAP-001 Candidate 002, Tile Grammar Candidate v0.2, el validador v0.2 y `docs/SPATIAL_MODEL.md`.

El test también comprobó fail-closed: una alteración simulada del hash de MAP-001 produce `INVALID_BASELINE` y detiene la ejecución semántica.

## PI-01 — Walkable adjacency

Resultado:

```text
PASS_WITH_SCOPE
```

Hechos comprobados del raster provisional:

```text
walkable cells: 17
orthogonal shared adjacencies: 16
connected components: 1
branching nodes: 0
endpoints: [0,4] y [14,4]
```

Validación sobre el fixture ejecutable:

```text
tiles: 17/17 PASS
shared edges: 16/16 PASS
route overlay derived: false
```

El resultado prueba que la caminabilidad y las adyacencias locales del raster provisional pueden expresarse mediante la gramática candidata usando `validateTile()` y `validateEdgeMatch()`.

No prueba pathfinding, navegación global, ancho territorial ni geometría exacta del `walkableEnvelope`.

## PI-02 — Reference band

Resultado:

```text
PASS_WITH_NORMALIZATION
```

`elevation.path=reference-band` pudo normalizarse conceptualmente como código relativo `0`.

La ejecución registró:

```text
normalizedCode: 0
appliedPerCell: false
metricMeaning: NONE
```

Por tanto el resultado no introduce metros ni asigna una elevación territorial per-cell.

Los `bandEndpoints` utilizados por el fixture ejecutable continúan siendo `TEST_SCAFFOLD`.

## PI-03 — Water no-inference

Resultado:

```text
OPEN_PRESERVED
inferredWaterBankEdges: 0
```

La presencia de `stream.polylineCells` no produjo automáticamente:

```text
edge.content=water
edge.profile=bank
shoreline signatures
```

`waterEdgeRasterization` permanece `OPEN`.

## PI-04 — Blocker no-inference

Resultado:

```text
OPEN_PRESERVED
inferredBlockerEdges: 0
```

`sideContainment=blockers-left-and-right` no fue convertido automáticamente en:

```text
hard blocker cells
blocked edges
cliff edges
```

`blockerEdgeRasterization` permanece `OPEN`.

## PI-05 — Boundary semantics

Resultado:

```text
OUT_OF_SCOPE_RECORDED
```

Se preservó fuera de Tile Grammar:

```text
screen_up   → exit  → [0,4]
screen_down → entry → [14,4]
```

Tile Grammar v0.2 no representa `progressionRole`; el test no simuló que lo hiciera.

## PI-06 — Separation of concerns

Resultado:

```text
OUT_OF_SCOPE_RECORDED
```

Se mantuvieron fuera de terrain grammar:

```text
bridge
gate
house
interactionLearning
camera
```

También se comprobó el caso cross-layer del puente:

```text
bridge.cell = [10,4]
walkableCells incluye [10,4]
stream.polylineCells incluye [10,4]
bridgeCrossLayerOverlapPreserved = true
```

Ese solapamiento se preserva como información entre capas. No se transformó en un `bridge tile`, una celda de agua ni una celda `mixed`.

## PI-07 — Provenance integrity

Resultado:

```text
PASS
violations: 0
```

Los campos técnicos necesarios para satisfacer `validateTile()` permanecieron aislados como `TEST_SCAFFOLD`.

Entre ellos:

```text
surface.composition
blocker
route.kind
route.ports
elevation.mode
elevation.reference
visualTreatment
edge.content
edge.profile
edge.bandEndpoints
edge.routePort
non-shared edge.traversal
```

Ninguno se promovió a evidencia territorial.

## AUDITORÍA

El resultado satisface el objetivo del contrato rev. 0.2.

Se comprobó que el subconjunto de MAP-001 formado por:

```text
walkability provisional
+
adjacency local
+
reference-band como normalización no métrica
```

puede atravesar Tile Grammar v0.2 sin contradicción.

Al mismo tiempo se preservaron correctamente los límites que el contrato exigía no cerrar:

```text
route overlay per-cell
water edges
blocker edges
entry/exit progression semantics
objects territoriales
interaction
camera
métricas
cardinalidad
```

No apareció un `REPRESENTATIONAL_GAP` material dentro del scope de terrain grammar efectivamente probado.

Por tanto:

```text
SEMANTIC DECISION:
PASS

TILE GRAMMAR v0.3 TRIGGER:
NO

MAP-001 CANDIDATE 003 TRIGGER:
NO
```

## INCONSISTENCIAS

El archivo de contrato conserva `status: READY_TO_IMPLEMENT`. No se modifica retroactivamente porque su hash forma parte de la evidencia de esta ejecución.

El estado actual del ciclo debe leerse desde este closeout y desde el registro de ejecución, no reescribiendo el input que fue ejecutado.

Existe además una inconsistencia separada a nivel repositorio: el workflow general `CI` del mismo HEAD terminó en `failure` antes de ejecutar los tests canónicos, en el paso `Check Expo dependency alignment`.

Esto no invalida el resultado del workflow específico de pre-integración, pero impide describir el repositorio completo como `CI GREEN`.

## VACÍOS

El PASS no cierra:

```text
walkableEnvelope exact geometry
per-cell main-route overlay mapping
waterEdgeRasterization
blockerEdgeRasterization
interactionSpatialBinding
tileSize
metricScale
renderer
pathfinding
world cardinal mapping
final pixel art
```

Tampoco demuestra que Tile Grammar pueda representar banks, cliffs, blockers, agua, objetos o interacción para MAP-001. Esos dominios no fueron mapeados porque su derivación sigue sin estar autorizada.

## OMISIONES

No se evaluaron:

```text
assets reales
renderer
seams visuales
repetición de tiles
pixel art a 1×
oclusión visual
massing territorial final
pathfinding
fidelidad métrica
```

El test tampoco materializa el `walkableEnvelope`.

## REDUNDANCIAS

No hay evidencia que justifique crear:

```text
TILE-GRAMMAR-CANDIDATE-v0.3
MAP-001-BLOCKOUT-CANDIDATE-003
```

La gramática v0.2 y Candidate 002 deben conservarse como baseline de esta fase hasta que un gate posterior aporte una necesidad nueva.

## Decisión y siguiente gate

El pre-integration test queda cerrado:

```text
MAP001-TILEGRAMMAR-PREINTEGRATION-TEST-001

BASELINE: VALID
EXECUTION: COMPLETED
DETERMINISM A/B: PASS
AUTOMATED TESTS: 8/8 PASS
TILES: 17/17 PASS
SHARED EDGES: 16/16 PASS
PROVENANCE: PASS
WATER INFERENCE: 0
BLOCKER INFERENCE: 0
ROUTE OVERLAY INFERENCE: false

SEMANTIC DECISION: PASS
PRODUCTION STANDARD: NOT ESTABLISHED
```

El siguiente gate no debe ampliar la gramática por inercia.

Antes de assets/renderer, la decisión pendiente es qué dominio se cierra a continuación. Las dos fronteras estructurales más relevantes siguen siendo:

```text
A. materializar una autoridad reproducible para walkableEnvelope / derivación de raster

o

B. autorizar explícitamente una regla de rasterización de terreno
   para agua/bank y/o lateral blockers
```

Cualquiera de esas decisiones requiere evidencia upstream; no debe derivarse del PASS de este test.
