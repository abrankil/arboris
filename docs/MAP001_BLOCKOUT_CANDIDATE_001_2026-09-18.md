# MAP-001 — Blockout Candidate 001

**Fecha:** 2026-09-18  
**Estado:** candidato provisional de blockout; no constituye geometría territorial  
**Base:** `IT-001 / MAP-001`  
**Contrato ASC relacionado:** `MAP-001-ASC-MAPPING-0021 v2.1`  
**Gate anterior:** `MAP-001-ASC-GENERATIVE-EXEC-002 — PASS VISUAL / PARTIAL SYSTEM`

## 1. Objetivo

Materializar un primer blockout lógico verificable para comprobar si la estructura que funcionó visualmente en `EXEC-002` puede representarse como conectividad explícita sin convertir geometría todavía `OPEN` en evidencia.

Este candidato sigue el principio:

```text
Navigation Contract + Camera Contract + Interaction/Learning Contract
→ blockout determinista
→ prototipo visual
```

La geometría usada aquí es deliberadamente normalizada y provisional.

## 2. Autoridad y límites

Fuentes aplicables:

- `docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`;
- `docs/SPATIAL_MODEL.md`;
- `docs/ENVIRONMENT_PRODUCTION_SPEC.md`;
- `docs/ASC_MAP001_CONTRACT_V2_1_EXPERIMENT_2026-09-17.md`.

Este candidato NO define:

- metros por celda;
- tamaño final de celda;
- escala territorial;
- bearing;
- coordenadas geográficas;
- elevación real;
- geometría exacta del `walkableEnvelope`;
- renderer;
- pathfinding.

## 3. Estado de geometría

```text
topología contractual:
KNOWN

relaciones territoriales obligatorias:
KNOWN

forma materializada usada por este blockout:
PROVISIONAL / TEST GEOMETRY

geometría territorial exacta:
OPEN
```

La forma de prueba puede cambiar sin modificar la evidencia territorial ni el contrato.

## 4. Vista A — Navigation Model

Convención:

```text
. = no transitable / blocker
# = región transitable provisional
^ = puerto superior abierto / primary exit
v = puerto inferior abierto / primary entry
```

Raster lógico normalizado, únicamente para verificación:

```text
....^....
....#....
...##....
...#.....
...#.....
....#....
....#....
....#....
....#....
....#....
....#....
....#....
....#....
....#....
....v....
```

Propiedades requeridas:

```text
singleConnectedComponent: expected PASS
bottomEntryConnected: expected PASS
topExitConnected: expected PASS
leftEdgeClosed: expected PASS
rightEdgeClosed: expected PASS
noInventedBranches: expected PASS
mainRouteDominant: expected PASS
```

La anchura variable de la ruta es geometría provisional de prueba, no rasgo territorial medido.

## 5. Vista B — Territorial Constraint Model

Superposición relacional, no métrica:

```text
screen_up / interior

        EXIT
          |
       [CLARO?]
          |
      MAIN PATH
          |
 H    MAIN PATH       ~
 O    MAIN PATH       ~
 U       GATE         ~
 S        |          ~~
 E        |          ~
          B========~~~
          |
        ENTRY

screen_down / retorno
```

Leyenda:

```text
B = puente
GATE = puerta / reja
HOUSE = casa del conserje
~ = estero
[CLARO?] = requerimiento upstream de blockout todavía fuera del contrato ASC v2.1
```

Relaciones verificadas por el modelo:

- puente cruza estero;
- puente precede puerta;
- puerta precede camino principal;
- casa queda a la izquierda del recorrido después del umbral;
- estero gira en L en el umbral;
- estero permanece a la derecha del camino después del umbral;
- estero permanece en banda relativa inferior al camino;
- laderas/blockers contienen lateralmente el corredor;
- ruta principal permanece dominante;
- no existen ramas transitables adicionales.

El claro aparece como `[CLARO?]` porque el plan de blockout lo exige hacia el interior, pero no forma parte del contrato ASC v2.1 congelado. Su posición y footprint no se fijan en este candidato.

## 6. Elevación relativa

No se infiere una progresión altimétrica global.

Solo se materializa la relación local respaldada:

```text
PATH_BAND = reference
STREAM_BAND = lower than adjacent path
SIDE_SLOPES = blockers / containing masses

global ascent/descent:
OPEN
```

No asignar metros, pendientes ni número definitivo de bandas.

## 7. Vista C — Isometric Massing + Camera Test

Contrato de prueba:

```text
profileId: PILOT_FIXED_ISOMETRIC
orientationPolicy: fixed
rotationPolicy: disabled
followPolicy: allowed
panPolicy: allowed
zoomPolicy: OPEN

screen_up:
interior / cordillera / progresión

screen_down:
entrada / retorno
```

Massing mínimo:

- masa de terreno continua;
- depresión relativa del estero;
- proxy de puente;
- proxy de puerta;
- proxy de casa;
- blockers laterales;
- player proxy provisional;
- sin vegetación final;
- sin materiales finales.

## 8. Player proxy

El player proxy debe existir únicamente para probar:

- legibilidad;
- escala relativa de puente/puerta/ruta;
- oclusión;
- continuidad de recorrido.

No fija:

- sprite final;
- dimensiones finales;
- relación definitiva personaje/tile.

## 9. Interaction / Learning Contract

No se encontró todavía una definición suficiente para materializar interaction slots específicos sin inferencia.

Estado:

```text
interaction slots:
OPEN / NOT MATERIALIZED IN CANDIDATE 001
```

Consecuencia:

```text
BLOCKOUT CANDIDATE 001
puede probar topología + territorio + cámara
pero NO puede cerrar todavía el gate completo de MAP-001 v0.3
```

## 10. Viewport de prueba

El blockout debe comprobarse como mínimo en:

```text
360 × 640
360 × 800
```

La altura adicional no puede:

- crear nuevas conexiones;
- cambiar orientación;
- volver ilegible la ruta;
- ocultar anclas obligatorias;
- alterar escala lógica de forma contradictoria.

## 11. Criterios de prueba

### Navigation

```text
singleConnectedComponent
bottomEntryConnected
topExitConnected
leftEdgeClosed
rightEdgeClosed
noInventedBranches
mainRouteDominant
```

### Territory

```text
bridgeCrossesStream
bridgePrecedesGate
gatePrecedesMainPath
houseLeftAfterThreshold
streamTurnsAtThreshold
streamRightAfterThreshold
streamLowerThanPath
slopesContainCorridor
openGeometryNotPresentedAsFact
```

### Camera

```text
cameraInvariantsPreserved
screenUpProgressionPreserved
screenDownReturnPreserved
routeNotCriticallyOccluded
playerReadable
```

### Pending

```text
requiredInteractionSlotVisibleOrReachable:
NOT TESTED
```

## 12. Gate

Este candidato puede avanzar a materialización técnica si mantiene:

```text
TOPOLOGY: PASS
TERRITORIAL RELATIONS: PASS
CAMERA INVARIANTS: PASS
OPEN PRESERVATION: PASS
```

No puede declararse `MAP-001 v0.3 PASS` hasta disponer y probar el Interaction / Learning Contract requerido.

## 13. Decisión

```text
MAP-001-BLOCKOUT-CANDIDATE-001

STATUS:
READY FOR DETERMINISTIC MATERIALIZATION

GEOMETRY:
PROVISIONAL / TEST ONLY

TERRITORIAL AUTHORITY:
UNCHANGED

ASC v0.1 CHANGE REQUIRED:
NO

CONTRACT v2.1 CHANGE REQUIRED:
NO

BLOCKING GAP:
INTERACTION / LEARNING CONTRACT
```
