# MAP-001 + Tile Grammar — Node 24 Experimental Baseline Freeze 001

**Fecha:** 2026-09-18  
**Baseline ID:** `MAP001-TILEGRAMMAR-NODE24-BASELINE-001`  
**Estado:** `FROZEN_EXPERIMENTAL_BASELINE`  
**Scope:** MAP-001 pre-integration blockout + `TILE-GRAMMAR-CANDIDATE-v0.2`  
**HEAD validado:** `423430e43e1da7868e120a13bd486586784402e6`

## Resultado

El gate específico de baseline ejecutado en GitHub Actions cerró con `success`.

```text
Node: v24.20.0
npm: 11.19.0
working tree: CLEAN

MAP-001 Candidate 002:
v0.1 historical tests: 6/6 PASS
v0.2 rectification tests: 9/9 PASS
materialization A/B: IDENTICAL
raster authority: TEST_ONLY
walkableEnvelope: NOT_MATERIALIZED

TILE-GRAMMAR-CANDIDATE-v0.2:
tests: 14/14 PASS
candidate validation: PASS
internal edges: 12/12 compatible
stress TEST-008: 17/17 CORRECT
stress decision: KEEP

PRODUCTION STANDARD:
NOT ESTABLISHED
```

## Evidencia de ejecución

```text
Workflow:
Node 24 Experimental Baseline Gate

Run ID:
35373464338

Artifact:
map001-tilegrammar-node24-baseline

Artifact ID:
10559096953

Artifact digest:
sha256:573bceff0ad07054377312b0ab02ed9bdaf2b65e5e22ea454a0ef34f961df97f
```

El artifact tiene retención configurada de 30 días. El baseline durable queda registrado por este documento, el manifiesto JSON y los hashes SHA-256.

## Hashes congelados

### MAP-001

```text
data/maps/map-001-blockout-candidate-002.json
f64878658508e56141ac1545f18c85e4b0d833b8285ab9f2cd0dc8b4a0fe2763

tools/map-blockout/materialize_map001_v02.mjs
6a0054f9ecefa04cf2296d0554f66065b676494f5a1b2832a7064821bc1adcaa

map001-blockout-360x640.svg
4299c9824c6f09cc27f074361beb4140854e7330b7b490268196f1a331eafbea

map001-blockout-360x800.svg
f9e1aec00d4697db323a263e2e25bc8532176e8346dbb683881a1d388d81483b

validation.json
0f67cd9442b3b39b8d519be4d8adbbea64ae315cac30e9e47aa1ea9cfa38eaf6
```

### Tile Grammar v0.2

```text
data/tiles/tile-grammar-candidate-v0.2.json
f4d4e88c85f892b15999622045bddaeedd2ab127d9e89ab5355b958fde23c00b

tools/tile-grammar/validate_tile_grammar_v02.mjs
2d70ca824de393a100c449e5a20f2f6dbb9a59cd4c9b4e848a96a934a8e9009b

tools/tile-grammar/stress_test_008.mjs
3cc63eed8114a4b893282a5966e18daad68ed830257a7eed53f87a7f7f56c116

stress output
8ddda83681fb311e31f8edb154fb769361bec92675701787b7cb537a30a509c7
```

## Qué congela este baseline

Este freeze establece una referencia reproducible para comparar cambios futuros en dos subsistemas:

```text
MAP-001-BLOCKOUT-CANDIDATE-002
+
TILE-GRAMMAR-CANDIDATE-v0.2
+
Node v24.20.0
+
hashes registrados
```

No promueve ninguno de los dos a estándar de producción.

Las siguientes decisiones siguen `OPEN`:

```text
tileSize
metricScale
renderer
pathfinding
territorial geometry
walkableEnvelope exact geometry
interaction spatial binding
water edge rasterization
blocker edge rasterization
final environmental pixel art
```

## Autoridad

La dirección de autoridad permanece:

```text
Navigation / territorial contracts
        ↓
walkableEnvelope
        ↓
provisional or derived logical cells
        ↓
tile grammar
        ↓
working visual representation
```

El raster actual sigue siendo `TEST_ONLY`. No debe reinterpretarse como geometría territorial maestra.

## AUDITORÍA

El gate de baseline comprobó explícitamente:

- runtime conforme con `package.json`;
- working tree limpio;
- suites MAP-001 v0.1 y v0.2;
- materialización determinista A/B;
- tests de Tile Grammar v0.1 y v0.2 incluidos en la suite;
- validación de Candidate v0.2;
- stress test de 17 fixtures;
- decisión `KEEP`;
- hashes de los artefactos principales.

No se detectaron fallos dentro del scope específico del baseline.

## INCONSISTENCIAS

El CI general del repositorio está rojo en el mismo HEAD, pero por una causa separada anterior a los tests canónicos:

```text
npx expo install --check
→ FAIL
```

Dependencias reportadas como desalineadas:

```text
expo               57.0.23 → expected ~57.0.24
expo-constants     57.0.18 → expected ~57.0.19
expo-image-picker  57.0.18 → expected ~57.0.19
expo-router        57.0.21 → expected ~57.0.22
```

Por tanto no corresponde describir el repositorio completo como `CI GREEN`.

La formulación válida es:

```text
MAP-001 + TILE-GRAMMAR NODE24 BASELINE:
PASS / FROZEN EXPERIMENTAL BASELINE

REPOSITORY-WIDE CI:
FAIL / EXPO DEPENDENCY ALIGNMENT
```

## VACÍOS

Este baseline no prueba:

- integración real MAP-001 × Tile Grammar;
- rasterización de riberas;
- rasterización de blockers de ladera;
- binding espacial de Interaction / Learning;
- navegación global o pathfinding;
- renderer;
- assets de producción;
- equivalencia territorial métrica.

Estos vacíos son deliberados y no deben rellenarse por inferencia.

## OMISIONES

No se crea todavía un estándar de producción ni un esquema territorial nuevo.

No se modifica `walkableEnvelope`, porque todavía no existe una geometría autoritativa materializada que permita regenerar el raster.

No se incorporan reglas de shoreline/bank para MAP-001 porque `waterEdgeRasterization` sigue `OPEN`.

## REDUNDANCIAS

Candidate 001, Tile Grammar v0.1 y sus tests se mantienen solo para reproducibilidad histórica. El baseline vigente para la siguiente fase usa Candidate 002 y Tile Grammar v0.2.

No se deben crear nuevos forks de la gramática o del blockout para la pre-integración salvo que el test revele un gap explícito.

## Gate siguiente

Con este baseline congelado, queda autorizado diseñar:

```text
MAP001 × TILE-GRAMMAR-v0.2
PRE-INTEGRATION TEST
```

La pregunta de prueba debe ser:

> ¿Qué parte del MAP-001 actualmente autorizada puede representarse con TILE-GRAMMAR-CANDIDATE-v0.2 sin inferencia, qué parte debe permanecer OPEN y qué parte revela un REPRESENTATIONAL_GAP?

El test debe operar sobre `validateTile()` y `validateEdgeMatch()` o una interfaz equivalente. No debe deformar MAP-001 para encajarlo en el fixture 3×3 de `validatePatch()`.
