# MAP-001 — Pre-integration Rectification 002 — closeout

**Fecha:** 2026-09-18  
**Estado:** documentado / implementación realizada / ejecución Node 24 pendiente  
**HEAD de implementación:** `7db3141c0f95a6869752b629229cd13d0e070cf2`  
**Modelo vigente para pre-integración:** `MAP-001-BLOCKOUT-CANDIDATE-002`

## 1. Motivo del cambio

La auditoría previa detectó dos inconsistencias en Candidate 001:

1. el materializador trataba Interaction / Learning como completamente `OPEN`, aunque `docs/SPATIAL_MODEL.md` ya define un contrato estructural mínimo;
2. la matriz de celdas podía interpretarse como si fuera autoridad geométrica suficiente, contradiciendo la regla de que las celdas son una discretización derivada del `walkableEnvelope`.

La rectificación no cambia la topología provisional. Cambia la forma en que se declara autoridad, estado y alcance.

## 2. Correcciones implementadas

### 2.1 Autoridad geométrica

Candidate 002 declara explícitamente:

```text
Navigation Contract
        ↓
walkableEnvelope
status: NOT_MATERIALIZED
exactGeometry: OPEN
authority: UPSTREAM_NAVIGATION_CONTRACT
        ↓
testRaster
status: PROVISIONAL_TEST_RASTER
authority: TEST_ONLY
derivationFromEnvelope: NOT_YET_REGENERABLE
```

Las 17 celdas transitables del raster siguen siendo un fixture de prueba. No son geometría territorial ni `walkableEnvelope` autoritativo.

### 2.2 Interaction / Learning

Se incorporó el contrato estructural mínimo ya autorizado:

```text
sequence:
orient → notice → observe

UE-001
roles: orient / establish_place
spatialBinding: OPEN

UE-002
roles: exploration
observationOpportunity: required
contentBinding: OPEN
species: OPEN
microhabitat: OPEN
spatialBinding: OPEN

UE-003
roles: pause / reflection / progression
contentBinding: OPEN
spatialBinding: OPEN
```

No se asignaron celdas específicas a ninguna UE.

### 2.3 Límites de integración con Tile Grammar

El modelo registra:

```text
tileGrammarUse: PROVISIONAL_FIXTURE_ONLY
walkableRasterAuthority: TEST_ONLY
waterEdgeRasterization: OPEN
blockerEdgeRasterization: OPEN
interactionSpatialBinding: OPEN
```

Por tanto no se autoriza inferir automáticamente:

- perfiles `bank` para el estero;
- blocker edges de ladera;
- binding espacial de interacción;
- métricas;
- cardinalidad;
- geometría territorial.

## 3. Artefactos implementados

```text
data/maps/map-001-blockout-candidate-002.json
tools/map-blockout/materialize_map001_v02.mjs
tools/map-blockout/materialize_map001_v02.test.mjs
docs/MAP001_PREINTEGRATION_RECTIFICATION_002_2026-09-18.md
tools/map-blockout/README.md
package.json
```

Candidate 001 se conserva para reproducibilidad histórica.

## 4. Tests agregados

La suite v0.2 fue escrita para comprobar, entre otros:

```text
- topología y relaciones territoriales preservadas;
- walkableEnvelope no materializado;
- raster con autoridad TEST_ONLY;
- prohibición de reclamar regeneración desde envelope inexistente;
- Interaction / Learning estructural definido;
- observationOpportunity requerida en UE-002;
- prohibición de inventar cell bindings;
- waterEdgeRasterization permanece OPEN;
- blockerEdgeRasterization permanece OPEN;
- interactionSpatialBinding permanece OPEN;
- rama lateral inventada sigue fallando;
- previews 360×640 y 360×800 permanecen deterministas.
```

## 5. Estado de ejecución

La rectificación fue implementada y los tests fueron añadidos al repositorio.

No se registra en este closeout un resultado de ejecución Node 24 porque todavía no se ha ejecutado esta versión bajo el runtime conforme exigido por `package.json`:

```text
node >=24.0.0 <25
```

Por tanto:

```text
IMPLEMENTATION: DONE
TEST DEFINITIONS: DONE
NODE 24 EXECUTION: PENDING
RUNTIME CONFORMANCE: OPEN
CANONICAL HASH BASELINE: NOT YET ESTABLISHED
```

## 6. Integración autorizada después del gate de runtime

La dirección permitida para la siguiente fase es:

```text
MAP-001 provisional test raster
        ↓
derived logical-cell fixture
        ↓
TILE-GRAMMAR-CANDIDATE-v0.2
```

La integración no debe reutilizar `validatePatch()` 3×3. Debe operar sobre `validateTile()`, `validateEdgeMatch()` o una interfaz equivalente que no deforme MAP-001.

La pregunta de validación será:

> ¿Qué parte del MAP-001 actualmente autorizada puede representarse con TILE-GRAMMAR-CANDIDATE-v0.2 sin inferencia, qué parte debe permanecer OPEN y qué parte revela un REPRESENTATIONAL_GAP?

## 7. Gate siguiente

Orden de trabajo:

```text
1. Ejecutar Node 24 conforme:
   npm run test:map-blockout
   npm run materialize:map001
   npm run test:tile-grammar
   npm run validate:tile-grammar
   npm run stress:tile-grammar

2. Repetir materialización/validación A/B.

3. Registrar:
   - Node exacto;
   - HEAD;
   - working tree;
   - resultados;
   - hashes SHA-256 reproducibles.

4. Si todo pasa:
   freeze experimental baseline.

5. Diseñar:
   MAP001 × TILE-GRAMMAR-v0.2 PRE-INTEGRATION TEST.
```

## 8. Estado consolidado

```text
MAP-001-BLOCKOUT-CANDIDATE-002

TOPOLOGY: PRESERVED
TERRITORIAL RELATIONS: PRESERVED
INTERACTION STRUCTURAL CONTRACT: DEFINED
INTERACTION SPATIAL BINDING: OPEN
WALKABLE ENVELOPE: NOT_MATERIALIZED
TEST RASTER AUTHORITY: TEST_ONLY
WATER EDGE RASTERIZATION: OPEN
BLOCKER EDGE RASTERIZATION: OPEN

TILE-GRAMMAR INTEGRATION:
NOT YET EXECUTED

NODE 24 CONFORMANCE:
PENDING

PRODUCTION STANDARD:
NOT ESTABLISHED
```
