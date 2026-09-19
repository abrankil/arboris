# MAP-001 — Pre-integration Rectification 002

**Fecha:** 2026-09-18  
**Estado:** rectificación pre-integración; geometría sigue siendo provisional / TEST ONLY  
**Modelo:** `MAP-001-BLOCKOUT-CANDIDATE-002`

## Motivo

Candidate 001 y su materializador quedaron desfasados respecto de `docs/SPATIAL_MODEL.md`: trataban Interaction / Learning como completamente `OPEN` y no distinguían con suficiente fuerza el raster provisional del `walkableEnvelope` autoritativo.

Candidate 002 corrige ambas inconsistencias sin cambiar la topología provisional.

## Autoridad de navegación

```text
Navigation Contract
        ↓
walkableEnvelope
status: NOT_MATERIALIZED
exactGeometry: OPEN
        ↓
provisional test raster
authority: TEST_ONLY
derivationFromEnvelope: NOT_YET_REGENERABLE
```

Las 17 celdas transitables siguen siendo fixture técnico. No son geometría territorial ni `walkableEnvelope` autoritativo.

## Interaction / Learning

Solo se materializa lo ya autorizado:

```text
orient → notice → observe

UE-001: orient / establish_place
UE-002: exploration + observationOpportunity required
UE-003: pause / reflection / progression
```

Los bindings espaciales permanecen `OPEN`. En UE-002 también permanecen `OPEN` species, microhabitat y contentBinding.

## Límites para Tile Grammar

```text
tileGrammarUse: PROVISIONAL_FIXTURE_ONLY
walkableRasterAuthority: TEST_ONLY
waterEdgeRasterization: OPEN
blockerEdgeRasterization: OPEN
interactionSpatialBinding: OPEN
```

No derivar automáticamente perfiles `bank`, blocker edges de ladera, ubicación de interaction slots, métricas ni cardinalidad.

## Integración permitida

```text
MAP-001 provisional test raster
        ↓
derived logical-cell fixture
        ↓
TILE-GRAMMAR-CANDIDATE-v0.2
```

No usar `validatePatch()` 3×3 para MAP-001. La integración deberá operar sobre `validateTile()` y `validateEdgeMatch()` o una interfaz equivalente.

## Estado

```text
TOPOLOGY: PRESERVED
TERRITORIAL RELATIONS: PRESERVED
INTERACTION STRUCTURAL CONTRACT: DEFINED
INTERACTION SPATIAL BINDING: OPEN
WALKABLE ENVELOPE: NOT_MATERIALIZED
TEST RASTER AUTHORITY: TEST_ONLY
WATER EDGE RASTERIZATION: OPEN
BLOCKER EDGE RASTERIZATION: OPEN

READY FOR PRE-INTEGRATION TESTING:
YES, AS PROVISIONAL FIXTURE ONLY

PRODUCTION STANDARD:
NOT ESTABLISHED
```
