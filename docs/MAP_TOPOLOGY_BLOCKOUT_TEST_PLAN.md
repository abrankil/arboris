# Árboris — Plan de pruebas de blockout para conectividad

## Objetivo

Comprobar si una estilización visual conserva un Contrato de Navegación explícito cuando recibe un blockout determinista como referencia.

Este plan no fija tamaño de mapa de producción. Las matrices son esquemas normalizados de prueba.

## Convenciones

```text
. = no transitable / fuera de ruta
# = transitable
X = nodo o zona de decisión
^ v < > = puerto abierto conceptual
```

Las matrices representan conectividad lógica. Elevación, roca, vegetación y estilo se incorporan después.

## Regla de prueba

La estilización se considera fiel solo si conserva:

- todos los puertos abiertos requeridos;
- todos los bordes cerrados requeridos;
- continuidad de la región transitable;
- jerarquía de ruta;
- ausencia de conexiones inventadas.

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
Do not change which cells form the traversable region.
Do not create additional paths.

Interpret non-walkable space as natural terrain using rock faces, vegetation, elevation changes or other plausible barriers.

Keep the walkable region readable for navigation while integrating the grid subtly into soil and rock.

Use stylized isometric game art, natural rocky terraces, dry soil and irregular sclerophyllous vegetation clusters. Avoid photorealism.

No text, arrows, UI, characters, fantasy ruins, plazas, monuments or artificial symmetry. Buildings or territorial structures may appear only when explicitly required by the blockout/reference brief.

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
- región transitable conservada: sí/no;
- ruta principal conservada: sí/no;
- anclas territoriales conservadas cuando corresponda: sí/no/NA;
- observaciones de legibilidad;
- observaciones de arte;
- decisión: `pass`, `revise`, `fail`.

## Criterio de cierre

La fase puede considerarse validada cuando los cinco patrones son reproducibles sin alteraciones importantes de conectividad mediante blockout + estilización.

Si el generador sigue modificando estructura, el blockout permanece como autoridad y la generación se usa solo como referencia de arte.
