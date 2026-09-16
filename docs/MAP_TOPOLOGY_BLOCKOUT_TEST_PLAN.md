# Árboris — Plan de pruebas de blockout para topologías conectadas

## Objetivo

Comprobar si un generador visual puede conservar una topología definida por Árboris cuando recibe un blockout determinista como referencia, en vez de inferir la navegación únicamente desde texto.

Este plan no fija tamaño de mapa de producción. Las matrices son esquemas normalizados de prueba.

## Convenciones

```text
. = tile no transitable / fuera de ruta
# = tile transitable
X = nodo o zona de decisión
^ v < > = borde abierto conceptual
```

Las matrices representan conectividad lógica. Altura, roca, vegetación y estilo se incorporan después.

## Regla de prueba

La estilización se considera fiel solo si conserva:

- todos los bordes abiertos requeridos;
- todos los bordes cerrados requeridos;
- continuidad de tiles entre conexiones;
- jerarquía de ruta indicada;
- ausencia de conexiones nuevas inventadas.

La calidad visual no compensa una alteración topológica.

---

## TEST-MAP-01 — `corridor`

### Contrato

```text
mapTopology: corridor
connections:
  north: primary
  south: return
  east: none
  west: none
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

La ruta puede serpentear visualmente, pero debe conservar continuidad entre norte y sur sin abrir este u oeste.

### Qué validar

- lectura inmediata de una ruta dominante;
- continuidad fuera de dos bordes opuestos;
- posibilidad de variación de altura sin crear ramas falsas.

---

## TEST-MAP-02 — `elbow`

### Contrato

```text
mapTopology: elbow
connections:
  north: none
  south: return
  east: primary
  west: none
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

El cambio de dirección debe sentirse causado por relieve, roca o vegetación, no por una esquina geométrica artificial.

### Qué validar

- entrada sur y salida este inequívocas;
- ausencia de salida norte/oeste;
- curva natural de navegación;
- sin plaza central ni hub inventado.

---

## TEST-MAP-03 — `junction`

### Contrato

```text
mapTopology: junction
connections:
  north: primary
  south: return
  east: secondary
  west: none
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

El nodo `X` debe leerse como bifurcación natural del terreno, no como plaza construida.

### Qué validar

- ruta norte visualmente dominante;
- rama este claramente secundaria;
- sur como entrada/retorno;
- oeste efectivamente cerrado;
- ausencia de simetría artificial.

---

## TEST-MAP-04 — `crossroad`

### Contrato

```text
mapTopology: crossroad
connections:
  north: primary
  south: return
  east: secondary
  west: secondary
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

Las cuatro conexiones existen, pero deben diferenciarse por jerarquía y carácter ambiental. No deben sentirse como cuatro caminos equivalentes.

### Qué validar

- cuatro bordes realmente conectados;
- una ruta principal dominante;
- dos ramas secundarias legibles;
- continuidad visual fuera del encuadre;
- nodo central natural, no plaza ni arena.

---

## Protocolo de generación externa

Para cada test:

1. entregar al generador el blockout como referencia visual;
2. indicar que **no debe cambiar conectividad ni transitabilidad**;
3. pedir solo interpretación ambiental y visual;
4. usar el mismo lenguaje artístico provisional en las cuatro pruebas;
5. generar una variante por test antes de modificar prompts;
6. comparar resultado con el contrato lógico original.

## Prompt base de estilización

Usar el mismo prompt base y cambiar únicamente el blockout:

```text
Transform this exact map blockout into a stylized isometric Árboris environment set in the Chilean sclerophyllous precordillera associated with Fundo Los Nogales / Arrayán.

PRESERVE THE BLOCKOUT EXACTLY AS GAMEPLAY STRUCTURE.
Do not add, remove, close or relocate any map-edge connection.
Do not change which tiles form the traversable route.
Do not create additional paths.

Interpret non-walkable space as natural terrain using rock faces, dense vegetation, elevation changes or other plausible landscape barriers.

Keep the walkable route readable for click-to-move navigation while integrating the grid subtly into soil and rock.

Use stylized hand-painted isometric game art, subtle cel-shaded outlines, natural rocky terraces, dry soil and irregular sclerophyllous vegetation clusters. Avoid photorealism.

No text, arrows, UI, characters, buildings, fantasy ruins, plazas, monuments or artificial symmetry.

The environment must feel like one seamless section of a larger connected Árboris world.
```

## Registro mínimo de resultados

Cada resultado debe registrar:

- `testId`;
- generador/modelo utilizado;
- prompt exacto;
- imagen resultante;
- conexiones conservadas: sí/no;
- conexiones inventadas: sí/no;
- ruta principal conservada: sí/no;
- observaciones de legibilidad;
- observaciones de arte;
- decisión: `pass`, `revise`, `fail`.

## Criterio para cerrar la fase

La fase puede considerarse validada cuando las cuatro topologías son reproducibles sin alteraciones de conectividad importantes usando blockout + prompt ambiental.

Si el generador sigue modificando la topología, el blockout se mantiene como autoridad y la generación se usa solo como referencia de arte, no como diseño de mapa.
