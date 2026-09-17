# Arboris — Especificación de producción para escenarios

## Estado y decisión

Los fondos actuales son referencias visuales y pruebas de parallax, no masters de producción.

Esta especificación distingue dos cosas que no deben confundirse:

1. **viewport lógico de presentación** — cómo se ve el juego en pantalla;
2. **contenido espacial del mapa** — cuánto territorio jugable existe y cómo se almacena.

La dirección de arte corresponde a Álvaro; cualquier cambio de alcance de plataforma o producto debe ser aprobado por Alejandra como directora de proyecto.

El repositorio todavía no ha seleccionado renderer ni pathfinding. Esta especificación fija contratos de arte y presentación sin imponer una arquitectura de motor prematura.

## 1. Viewport lógico

| Elemento | Decisión |
| --- | --- |
| Orientación de exploración y minijuegos | Horizontal, 16:9 |
| Viewport lógico nativo | 480×270 px |
| Escalado de presentación | Nearest-neighbor, solo múltiplos enteros |
| Escalas previstas | 2× = 960×540, 3× = 1440×810, 4× = 1920×1080, 5× = 2400×1350 |
| Color | sRGB |
| Cámara | posiciones enteras en píxeles lógicos cuando el renderer lo permita |

**480×270 es el viewport, no el tamaño obligatorio de cada mapa ni de cada capa del mundo.**

Un mapa puede ocupar una extensión lógica mayor que la pantalla y ser recorrido por cámara.

## 2. Comportamiento por plataforma

| Plataforma | Regla de presentación |
| --- | --- |
| Android | usar el mayor múltiplo entero que cabe; bandas o UI fuera del mundo si sobra espacio |
| Steam / PC | ventana o fullscreen con escalado entero y letterbox/pillarbox cuando corresponda |
| Web | canvas interno fijo y `image-rendering: pixelated`; evitar ampliación fraccional del mundo |

La interfaz de formularios, fichas y texto puede ser responsive y no está obligada a usar el viewport del mundo.

## 3. Estructura del contenido del mapa

El mapa jugable no se define como cuatro PNG de pantalla completa.

La estructura de producción debe poder separar, independientemente del renderer final:

```text
MAP DATA
- región transitable
- elevación relativa
- bloqueos
- interacciones
- puertos/conexiones

WORLD ART
- terreno/suelo
- agua
- relieve y bordes
- vegetación y props
- estructuras territoriales

DISTANT ART
- cordillera
- cielo
- masas lejanas
- atmósfera

OVERLAYS
- foreground extremo
- efectos
- elementos que cruzan cámara
```

La implementación puede terminar usando TileMap, objetos, chunks, sprites, meshes o una combinación. La documentación actual no selecciona todavía cuál.

## 4. Capas visuales

La nomenclatura histórica se conserva como **orden compositivo**, no como obligación de que todo sea una imagen raster de 480×270:

1. `00-sky`
2. `01-background`
3. `02-world`
4. `03-foreground`

`02-world` reemplaza el antiguo concepto de `02-midground` como PNG monolítico. Debe poder contener terreno, senderos, terrazas, agua, vegetación, props y estructuras en unidades reutilizables o chunks.

Una capa puede materializarse como:

- imagen repetible;
- sprite/objeto;
- tile/chunk;
- grupo de assets;
- composición generada por el renderer.

No exigir que todas compartan exactamente la extensión del viewport si el mundo se desplaza.

## 5. Chunks y mosaicos

No fijar todavía un tamaño canónico de chunk de producción.

La referencia histórica de piezas `240×135` se mantiene únicamente como ensayo de parallax/arte 16:9, no como estándar de almacenamiento del mapa.

El tamaño de chunk definitivo debe decidirse después de probar:

- cámara;
- carga/descarga;
- colisiones;
- navegación;
- edición;
- memoria en Android;
- continuidad visual entre bordes.

Para atlas, 1024×1024 puede mantenerse como punto de partida técnico, sujeto a medición real del renderer y del dispositivo.

## 6. Relación entre blockout y arte

Cada mapa debe conservar un blockout lógico independiente del arte.

```text
Contrato de Navegación
→ blockout determinista
→ assets/terreno/objetos
→ composición visual
```

El arte puede ocultar la cuadrícula y naturalizar terrazas, pero no debe redefinir silenciosamente la transitabilidad.

El blockout lógico no se rasteriza obligatoriamente dentro del PNG final.

## 7. Isometría y elevación

El lenguaje visual del piloto es isométrico y usa terrazas/celdas prismáticas para hacer legibles cambios de altura.

Esto no obliga a un mundo 3D voxelado.

El dato lógico puede usar:

```text
col
row
elevationBand
walkability
```

El renderer traduce después esas bandas a desplazamiento vertical, sprites, bordes de terreno o geometría según la solución elegida.

## 8. PNG y editables

PNG RGBA continúa siendo formato de revisión y master apropiado para assets raster individuales.

No se considera automáticamente master de mapa una captura compuesta de todo el escenario.

Conservar, según el tipo de recurso:

- `.pxo` o editable equivalente para arte pixelado;
- PNG RGBA para sprites, tiles, props, fondos y overlays;
- archivo de composición o datos del mapa cuando exista implementación;
- preview compuesto para revisión.

La compresión de GPU se decide al empaquetar, no en el master artístico.

## 9. Personajes y escala dentro del mundo

Los sprites canónicos de colección de 125×125 px se mantienen para galería, fichas, selección y encuentros cercanos.

No reducirlos automáticamente para navegación.

Para gameplay continuo se mantiene como propuesta producir una familia específica de aproximadamente 48×64 o 64×64 px, validada por silueta y lectura en el viewport 480×270.

Es una derivación artística nueva, no una conversión automática.

## 10. Cámara, parallax y movimiento

La cámara usa el viewport 480×270 y puede desplazarse sobre un mundo mayor.

Cuando el renderer lo permita, posiciones de cámara y sprites se cuantizan a píxeles lógicos enteros para evitar shimmer.

Parallax se aplica principalmente a `00-sky`, `01-background` y foreground/overlays que lo justifiquen.

El mundo jugable no debe desplazarse como una imagen decorativa independiente de su lógica espacial.

Los valores históricos de amplitud `0, 4, 12, 24 px` se conservan solo como referencia experimental, no como regla definitiva.

No aplicar blur de tiempo real para simular profundidad del pixel art; resolver jerarquía tonal y detalle en el arte.

## 11. Entregables por mapa/prototipo

Antes de integración, el paquete de una zona debe poder contener:

- brief territorial/ambiental;
- Contrato de Navegación;
- blockout lógico verificable;
- preview compuesto;
- assets raster/editables utilizados;
- definición de orden de capas y offsets;
- referencias ambientales consultadas;
- hoja de verificación visual/técnica.

Cuando el renderer esté seleccionado se añadirá el archivo técnico de mapa correspondiente.

## 12. Criterios de aceptación

Una zona puede declararse lista para integración cuando:

- conserva puertos, ruta y transitabilidad del blockout;
- el mundo se lee a 1× lógico y a escalas enteras 2× y 4×;
- no existe filtrado bilinear accidental en arte pixelado;
- flora y contexto respetan evidencia registrada;
- personajes se separan del plano jugable;
- las uniones entre chunks/assets no producen discontinuidades visibles;
- cámara y navegación funcionan sobre la misma geometría lógica;
- Android, PC y web muestran escalado entero correcto;
- rendimiento y memoria se miden en al menos un Android de gama media antes de ampliar presupuesto.

## 13. Límites actuales

Expo y React Native son la base de aplicación definida, pero el renderer del mundo de exploración sigue `OPEN`.

La elección debe demostrar, como mínimo:

- isometría compatible con el blockout;
- nearest-neighbor;
- cámara sobre mapas mayores que el viewport;
- navegación/colliders reproducibles;
- capas/orden de dibujo;
- exportación Android, PC/Steam y web;
- posibilidad de mantener datos lógicos separados del arte.

Los fondos existentes y las pruebas de parallax siguen siendo material de referencia. No convertirlos automáticamente en mapas jugables.
