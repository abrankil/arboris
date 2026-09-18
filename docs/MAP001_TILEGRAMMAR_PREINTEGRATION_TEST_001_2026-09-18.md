# MAP-001 × Tile Grammar v0.2 — Pre-integration Test 001

**Fecha:** 2026-09-18  
**Test ID:** `MAP001-TILEGRAMMAR-PREINTEGRATION-TEST-001`  
**Estado:** `READY_TO_IMPLEMENT`  
**Baseline requerido:** `MAP001-TILEGRAMMAR-NODE24-BASELINE-001`  
**Producción:** `NOT_ESTABLISHED`

## 1. Pregunta de prueba

> ¿Qué parte del MAP-001 actualmente autorizada puede representarse con `TILE-GRAMMAR-CANDIDATE-v0.2` sin inferencia, qué parte debe permanecer `OPEN` y qué parte revela un `REPRESENTATIONAL_GAP`?

Este test no intenta convertir Tile Grammar en autoridad sobre MAP-001. Tampoco intenta completar los campos todavía abiertos del modelo espacial.

## 2. Baseline congelado

La prueba debe partir de los artefactos validados bajo Node 24:

```text
MAP001-TILEGRAMMAR-NODE24-BASELINE-001
validated HEAD:
423430e43e1da7868e120a13bd486586784402e6

Node:
v24.20.0
```

Fuentes congeladas relevantes:

```text
MAP-001 Candidate 002
f64878658508e56141ac1545f18c85e4b0d833b8285ab9f2cd0dc8b4a0fe2763

Tile Grammar Candidate v0.2
f4d4e88c85f892b15999622045bddaeedd2ab127d9e89ab5355b958fde23c00b

Tile Grammar validator v0.2
2d70ca824de393a100c449e5a20f2f6dbb9a59cd4c9b4e848a96a934a8e9009b
```

## 3. Dirección de autoridad

La prueba debe mantener:

```text
MAP-001 provisional test raster
        ↓
derived logical-cell fixture
        ↓
TILE-GRAMMAR-CANDIDATE-v0.2
        ↓
validation report
```

Queda prohibida la dirección inversa:

```text
tile grammar
→ completar MAP-001
→ inventar territorio
```

El raster de MAP-001 sigue siendo `TEST_ONLY`. El `walkableEnvelope` exacto continúa `NOT_MATERIALIZED`.

## 4. No usar validatePatch()

`validatePatch()` pertenece al fixture experimental 3×3 de Tile Grammar y exige exactamente nueve celdas.

MAP-001 usa un raster 15×9 con 17 celdas transitables provisionales. Por tanto la pre-integración no debe deformar MAP-001 para encajarlo en 3×3.

La implementación debe usar:

```text
validateTile()
validateEdgeMatch()
```

o una interfaz nueva equivalente que reutilice esas reglas sin importar la restricción 3×3.

## 5. Provenance obligatoria por campo

Cada valor producido por el adaptador debe registrar una de estas clases:

```text
SOURCE_EXPLICIT
DERIVED_FROM_TEST_RASTER
NORMALIZED_ENCODING
TEST_SCAFFOLD
OPEN_UNMAPPED
OUT_OF_SCOPE
PROHIBITED_INFERENCE
```

`TEST_SCAFFOLD` puede existir solo para hacer ejecutable un fixture técnico. Nunca puede presentarse como información derivada de MAP-001.

## 6. Evaluación de representación

Cada mapping debe terminar en una de estas evaluaciones:

```text
REPRESENTABLE
REPRESENTABLE_WITH_NORMALIZATION
OPEN_UNMAPPED
OUT_OF_SCOPE
REPRESENTATIONAL_GAP
PROHIBITED_INFERENCE
```

### Ruta caminable

`grid.walkableCells` autoriza derivar la vecindad del raster provisional.

Se permite probar:

```text
walkable cell
→ logical cell

adjacent walkable cells
→ shared local route ports
```

Esto puede demostrar compatibilidad declarativa de bordes.

No demuestra:

```text
pathfinding
global navigability
walkableEnvelope exact geometry
territorial width
metric distance
```

### Elevación de referencia

MAP-001 declara:

```text
elevation.path = reference-band
```

Puede normalizarse a un código relativo entero —por ejemplo `0`— únicamente como codificación local.

```text
0 != 0 meters
```

La normalización no autoriza escala física.

### Agua

MAP-001 contiene una `stream.polylineCells` y declara el estero más bajo que el camino, pero también declara:

```text
waterEdgeRasterization: OPEN
```

Por tanto:

```text
stream polyline
≠
bank edge signatures automáticas
```

No deben asignarse `edge.content=water`, `profile=bank` o bordes de ribera por inferencia.

### Blockers

MAP-001 declara:

```text
sideContainment = blockers-left-and-right
blockerEdgeRasterization = OPEN
```

La relación de contención debe conservarse, pero no permite decidir qué edge de qué celda será `blocked`, `cliff` o `hard blocker`.

### Entrada y salida

MAP-001 sí define:

```text
screen_down = entry
screen_up   = exit
```

Tile Grammar v0.2 puede representar un `routePort` de borde, pero no contiene `progressionRole=entry|exit`.

La semántica entry/exit debe conservarse como metadata fuera de la gramática. No debe fingirse que el esquema actual la representa.

### Puente, reja, casa, interacción y cámara

Estos elementos pertenecen a otras capas del modelo:

```text
bridge / gate / house → object / territorial overlay
Interaction / Learning → interaction contract
camera → camera contract
```

No son automáticamente un gap de Tile Grammar porque la gramática de terreno no tiene por qué absorberlos.

Se clasifican `OUT_OF_SCOPE` salvo que una autoridad posterior ordene modelarlos dentro de la gramática.

## 7. Fixtures obligatorios

```text
PI-01-ROUTE-CHAIN
Derivar las 17 celdas caminables provisionales y validar
sus adyacencias locales.
Expected: PASS_WITH_SCOPE
Scope: LOCAL_EDGE_CONNECTIVITY_ONLY

PI-02-REFERENCE-BAND
Normalizar reference-band a elevación relativa no métrica.
Expected: PASS_WITH_NORMALIZATION

PI-03-WATER-NO-INFERENCE
Verificar que stream.polylineCells no genere banks automáticamente.
Expected: OPEN_PRESERVED

PI-04-BLOCKER-NO-INFERENCE
Verificar que sideContainment no asigne blocker edges automáticamente.
Expected: OPEN_PRESERVED

PI-05-BOUNDARY-SEMANTICS
Conservar entry/exit sin atribuir progressionRole a Tile Grammar.
Expected: OUT_OF_SCOPE_RECORDED

PI-06-SEPARATION-OF-CONCERNS
Mantener bridge/gate/house, Interaction/Learning y Camera
fuera de la gramática de terreno.
Expected: OUT_OF_SCOPE_RECORDED
```

## 8. Reporte exigido

Por cada mapping:

```text
sourcePath
sourceValue
targetField
provenanceClass
representationAssessment
validatorResult
evidence
openOrGapReason
```

El reporte debe distinguir claramente:

```text
no representado porque está OPEN
vs.
no representado porque está OUT_OF_SCOPE
vs.
no representable aunque pertenece al scope
```

Solo el tercer caso puede convertirse en `REPRESENTATIONAL_GAP`.

## 9. Regla de decisión

```text
PASS
todos los mappings autorizados funcionan;
OPEN y OUT_OF_SCOPE permanecen preservados;
no hay inferencia prohibida;
no aparece gap material dentro del scope de terrain grammar.

REVISE
aparece false positive, false negative,
normalización injustificada o subespecificación corregible
sin reemplazar el modelo base.

INSUFFICIENT
una necesidad material de MAP-001 que sí pertenece a terrain grammar
no puede representarse sin ampliar o reemplazar la gramática.

precedencia:
INSUFFICIENT > REVISE > PASS
```

`PASS` no significa estándar de producción.

## 10. OPEN preservados

```text
walkableEnvelope exact geometry
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

## AUDITORÍA

El contrato evita reutilizar el fixture 3×3 como si fuera un modelo de mapa general.

Distingue representación, normalización, scaffolding, `OPEN`, fuera de scope y gap real.

También impide que una limitación de Tile Grammar reescriba MAP-001.

## INCONSISTENCIAS

Existe una tensión deliberada entre dos hechos:

```text
Tile Grammar validateTile() exige un tile completamente formado
MAP-001 no autoriza todavía todos los campos requeridos
```

La implementación no debe resolverla inventando datos. Si necesita valores técnicos para ejecutar el validador, deben quedar marcados `TEST_SCAFFOLD` y excluidos de cualquier conclusión territorial.

## VACÍOS

Todavía no existe una regla autorizada para:

- shoreline/bank rasterization;
- blocker edge rasterization;
- interaction cell binding;
- global pathfinding;
- objeto/terrain overlay;
- métricas.

La pre-integración no debe cerrarlos.

## OMISIONES

El test no evalúa assets, renderer, pixel art, cámara visual, naturalización ni fidelidad territorial métrica.

Tampoco convierte `bridge`, `gate` o `house` en tipos de tile.

## REDUNDANCIAS

No se crea Tile Grammar v0.3 ni MAP-001 Candidate 003 para ejecutar esta prueba.

Primero se usa el baseline congelado. Solo un resultado `REVISE` o `INSUFFICIENT` puede justificar una nueva versión.

## 11. Salida de este gate

Si el test da `PASS`, queda demostrado únicamente que el subconjunto autorizado y dentro de scope de MAP-001 puede atravesar la gramática candidata sin contradicción.

Si da `REVISE`, se corrige el punto localizado y se repite.

Si da `INSUFFICIENT`, se diseña una extensión explícita de la gramática antes de continuar hacia assets o renderer.
