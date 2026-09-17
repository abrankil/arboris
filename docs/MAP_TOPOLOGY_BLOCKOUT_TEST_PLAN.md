# Árboris — Plan de pruebas de blockout para conectividad

## Objetivo

Comprobar si una estilización visual conserva un Contrato de Navegación explícito cuando recibe un blockout determinista como referencia, y si en `MAP-001 v0.3` la traducción isométrica mantiene además cámara, legibilidad del jugador e interacción estructural.

Este plan no fija tamaño de mapa de producción. Las matrices son esquemas normalizados de prueba, no geometría territorial maestra.

## Convenciones

```text
. = no transitable / fuera de ruta
# = transitable
X = nodo o zona de decisión
^ v < > = puerto abierto conceptual
```

Las matrices representan una rasterización lógica de un `walkableEnvelope` continuo. Elevación, roca, vegetación y estilo se incorporan después.

## Regla de prueba

La estilización se considera fiel solo si conserva:

- todos los puertos abiertos requeridos;
- todos los bordes cerrados requeridos;
- continuidad de la región transitable;
- jerarquía de ruta;
- ausencia de conexiones inventadas;
- invariantes de cámara cuando correspondan;
- legibilidad del player proxy;
- interaction slots requeridos cuando correspondan.

La calidad visual no compensa una alteración estructural.

---

## TEST-MAP-01 — `corridor / straight`

### Contrato

```text
patternLabel: corridor
routeShape: straight
ports:
  screen_up: open / primary / exit
  screen_down: open / primary / entry
  screen_left: closed
  screen_right: closed
```

### Esquema lógico

```text
...#...
...#...
..##...
..##...
...#...
...#...
...#...
```

### Qué validar

- una ruta dominante;
- continuidad entre dos bordes opuestos;
- ninguna apertura lateral;
- elevación variable sin crear ramas falsas.

---

## TEST-MAP-02 — `corridor / bend`

### Contrato

```text
patternLabel: corridor
routeShape: bend
ports:
  screen_up: closed
  screen_down: open / primary / entry
  screen_right: open / primary / exit
  screen_left: closed
```

### Esquema lógico

```text
.......
.......
....###
...##..
...#...
...#...
...#...
```

El giro debe sentirse causado por relieve o estructura territorial, no por una esquina artificial.

### Qué validar

- entrada inferior y salida derecha inequívocas;
- ausencia de salida superior/izquierda;
- curva natural;
- sin plaza central inventada.

---

## TEST-MAP-03 — `junction`

### Contrato

```text
patternLabel: junction
ports:
  screen_up: open / primary / exit
  screen_down: open / primary / entry
  screen_right: open / secondary / optional
  screen_left: closed
```

### Esquema lógico

```text
...#...
...#...
...#...
...X###
...#...
...#...
...#...
```

### Qué validar

- ruta principal dominante;
- rama secundaria legible;
- borde izquierdo cerrado;
- nodo natural, no plaza simétrica.

---

## TEST-MAP-04 — `crossroad`

### Contrato

```text
patternLabel: crossroad
ports:
  screen_up: open / primary / exit
  screen_down: open / primary / entry
  screen_right: open / secondary / optional
  screen_left: open / secondary / optional
```

### Esquema lógico

```text
...#...
...#...
...#...
###X###
...#...
...#...
...#...
```

### Qué validar

- cuatro puertos realmente conectados;
- una ruta principal dominante;
- ramas secundarias legibles;
- continuidad visual fuera del encuadre;
- nodo natural, no arena.

---

## TEST-MAP-05 — `pocket`

### Contrato

```text
patternLabel: pocket
ports:
  screen_down: open / primary / entry-return
  screen_up: closed
  screen_left: closed
  screen_right: closed
```

### Esquema lógico

```text
..###..
.#####.
.#####.
..###..
...#...
...#...
...#...
```

### Qué validar

- un solo acceso real;
- zona terminal legible;
- retorno por el mismo acceso;
- ninguna salida visual falsa.

---

## Protocolo específico — MAP-001 v0.3

`MAP-001 v0.3` debe producir tres vistas del mismo modelo:

### Vista A — Navigation Model

Debe mostrar:

- `walkableEnvelope` autoritativo;
- puertos;
- blockers;
- bandas de elevación;
- ruta principal;
- interaction slots;
- raster/celdas derivadas para verificación.

Verificación mínima:

```text
singleConnectedComponent: pass
bottomEntryConnected: pass
topExitConnected: pass
leftEdgeClosed: pass
rightEdgeClosed: pass
noInventedBranches: pass
```

### Vista B — Territorial Constraint Model

Debe representar:

```text
UE-001 Umbral
→ UE-002 Corredor
→ UE-003 Claro
→ interior
```

Y comprobar los invariantes territoriales actuales:

```text
bridge crosses stream
bridge precedes gate
gate precedes main path
house is left of route after threshold
main path remains dominant
stream remains right + lower after threshold
clearing occurs later toward interior
slopes contain corridor laterally
exact bridge bearing = OPEN
exact clearing footprint = OPEN
```

La Vista B no debe aparentar una precisión geométrica que la evidencia no sostiene.

### Vista C — Isometric Massing + Camera Test

Debe incluir:

- masas de terreno continuas;
- depresión del estero;
- proxies de puente, reja y casa;
- player proxy;
- perfil `PILOT_FIXED_ISOMETRIC`;
- sin rotación de cámara;
- prueba de oclusión;
- sin vegetación/materiales finales.

Criterios adicionales:

```text
cameraInvariantsPreserved: yes
playerReadable: yes
routeNotCriticallyOccluded: yes
requiredInteractionSlotVisibleOrReachable: yes
terrainReadsAsContinuousMass: yes
openGeometryNotPresentedAsFact: yes
```

## Protocolo de generación externa

Para cada test:

1. entregar el blockout como referencia visual;
2. indicar que no se debe cambiar conectividad ni transitabilidad;
3. pedir solo interpretación ambiental y visual;
4. usar el mismo lenguaje artístico provisional en todas las pruebas;
5. generar una variante por test antes de modificar prompts;
6. comparar contra el contrato original.

## Prompt base de estilización

```text
Transform this exact map blockout into a stylized isometric Árboris environment set in the Chilean sclerophyllous precordillera associated with Fundo Los Nogales / Arrayán.

PRESERVE THE BLOCKOUT EXACTLY AS GAMEPLAY STRUCTURE.
Do not add, remove, close or relocate any map-edge connection.
Do not change the walkable region.
Do not create additional paths.

Interpret non-walkable space as natural terrain using rock faces, vegetation, elevation changes or other plausible barriers.

Keep the walkable region readable for navigation while integrating any visible grid subtly into soil and rock.

Use stylized isometric game art, natural rocky terraces, dry soil and irregular sclerophyllous vegetation clusters. Avoid photorealism.

No text, arrows, UI, fantasy ruins, plazas, monuments or artificial symmetry. Buildings or territorial structures may appear only when explicitly required by the blockout/reference brief.

The environment must feel like one seamless section of a larger connected Árboris world.
```

## Registro mínimo de resultados

Cada resultado debe registrar:

- `testId`;
- generador/modelo;
- prompt exacto;
- imagen resultante;
- puertos conservados: sí/no;
- conexiones inventadas: sí/no;
- walkable envelope conservado: sí/no;
- ruta principal conservada: sí/no;
- anclas territoriales conservadas cuando corresponda: sí/no/NA;
- invariantes de cámara conservados: sí/no/NA;
- player proxy legible: sí/no/NA;
- oclusión crítica: sí/no/NA;
- interaction slots utilizables: sí/no/NA;
- decisiones `OPEN` falsamente fijadas: sí/no;
- observaciones de legibilidad;
- observaciones de arte;
- decisión: `pass`, `revise`, `fail`.

## Criterio de cierre

La fase topológica genérica puede considerarse validada cuando los cinco patrones son reproducibles sin alteraciones importantes de conectividad mediante blockout + estilización.

`MAP-001 v0.3` solo puede pasar a naturalización ambiental cuando sus tres vistas son coherentes entre sí y supera además cámara, player readability, interaction slot y control de decisiones `OPEN`.

Si el generador modifica estructura, el blockout permanece como autoridad y la generación se usa solo como referencia de arte.
