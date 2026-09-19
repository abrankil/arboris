# Arboris — Especificación de producción para escenarios

## Estado y decisión

Los fondos actuales son referencias visuales y pruebas de parallax, no masters de producción.

Esta especificación distingue:

1. **viewport lógico de presentación** — cómo se ve el juego en pantalla;
2. **contenido espacial del mapa** — cuánto territorio jugable existe y cómo se almacena;
3. **contratos jugables** — navegación, cámara e interacción/aprendizaje que el arte debe respetar.

La dirección de arte corresponde a Álvaro; cualquier cambio de alcance de plataforma o producto debe ser aprobado por Alejandra como directora de proyecto.

El repositorio todavía no ha seleccionado renderer ni pathfinding. Esta especificación fija contratos de arte y presentación sin imponer una arquitectura de motor prematura.

## 1. Base de producción portrait — piloto

La exploración principal se diseña **portrait-first para Android**.

La auditoría posterior a la primera propuesta `270×480` determinó que ese ancho lógico conserva bien la relación 9:16, pero produce escalas enteras poco convenientes en varios anchos físicos frecuentes de Android. Como nueva base de producción se adopta **360 px de ancho lógico**, porque permite correspondencia entera directa con anchos físicos de 720, 1080 y 1440 px mediante escalas 2×, 3× y 4× respectivamente.

Esta decisión es una **base de prueba aprobada**, no una resolución final irreversible del producto.

| Elemento | Base de producción |
| --- | --- |
| Orientación primaria de exploración | Vertical / portrait |
| Ancho lógico de referencia | 360 px |
| Altura lógica mínima de prueba | 640 px |
| Altura lógica adaptativa inicial | 640–800 px |
| Caso base de revisión | 360×640 px |
| Caso intermedio | 360×720 px |
| Caso alto de revisión | 360×800 px |
| Escalado de presentación | Nearest-neighbor, preferentemente múltiplos enteros para el mundo pixelado |
| Color | sRGB |
| Cámara | posiciones enteras en píxeles lógicos cuando el renderer lo permita |

`360×640` es el **caso base 9:16 de producción**, no una resolución física exigida al dispositivo ni un lienzo obligatorio para cada mapa.

La altura no debe fijarse artificialmente a 640 si el dispositivo puede mostrar más mundo sin alterar la escala lógica. Para el piloto se prueba inicialmente una altura visible de hasta 800 px lógicos, equivalente a una pantalla alta cercana a 20:9.

La política inicial de cálculo es:

```text
availableWidthPx  = ancho físico utilizable después de insets/safe area
availableHeightPx = alto físico utilizable después de insets/safe area

scale = min(
  floor(availableWidthPx / 360),
  floor(availableHeightPx / 640)
)

visibleLogicalWidth  = 360
visibleLogicalHeight = clamp(
  floor(availableHeightPx / scale),
  640,
  800
)
```

La fórmula es contrato de prueba, no implementación definitiva del renderer. Si un dispositivo no permite una escala entera útil, la estrategia alternativa debe validarse por nitidez, ausencia de shimmer y costo visual antes de adoptarse.

Un mapa puede ocupar una extensión lógica mucho mayor que el viewport y ser recorrido por cámara.

### Bases que quedan establecidas desde esta revisión

```text
PLATAFORMA PRIMARIA
Android portrait

VIEWPORT LÓGICO DE PRODUCCIÓN
360 × H
H inicial validable: 640–800

COMPOSICIÓN
screen_up   = interior / cordillera / progresión
screen_down = entrada / retorno

LENGUAJE VISUAL
2.5D isométrico
pixel art de producción
terrazas/modularidad naturalizadas

AUTORIDAD ESPACIAL
walkableEnvelope continuo
celdas/tiles = derivación técnica

CÁMARA PILOTO
orientación fija
rotación deshabilitada
follow/pan permitidos
zoom definitivo OPEN

ESCALA
sprite, tile, chunk y métrica territorial = OPEN hasta prueba
```

## 2. Comportamiento por plataforma

| Plataforma | Regla de presentación |
| --- | --- |
| Android | portrait-first; aplicar safe areas/insets, elegir el mayor múltiplo entero compatible con el viewport base `360×640` y mostrar altura adicional hasta el rango validado; UI puede ocupar espacio adicional cuando corresponda |
| Steam / PC | soportar ventana portrait para paridad con móvil; landscape puede existir como modo secundario/compatibilidad, no como autoridad de composición del piloto |
| Web | canvas lógico portrait basado en el mismo contrato; `image-rendering: pixelated`; evitar escalado fraccional del mundo cuando sea posible |

La interfaz de formularios, fichas y texto puede ser responsive y no está obligada a usar la misma cuadrícula lógica que el mundo.

Los viewports históricos `480×270` y `270×480` se conservan únicamente como ensayos previos, capturas comparativas o referencias de transición. No deben usarse para validar la composición móvil principal.

## 3. Estructura del contenido del mapa

El mapa jugable no se define como PNG de pantalla completa ni por una relación de aspecto fija.

La estructura de producción debe poder separar, independientemente del renderer final:

```text
MAP DATA
- walkable envelope / región transitable
- elevación relativa
- bloqueos
- interacciones
- puertos/conexiones
- referencias a claims/rasgos territoriales

CAMERA / INTERACTION CONTRACTS
- invariantes de pantalla
- restricciones de orientación/rotación
- interaction slots
- learning beats

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

La nomenclatura histórica se conserva como **orden compositivo**, no como obligación de que todo sea una imagen raster del tamaño del viewport:

1. `00-sky`
2. `01-background`
3. `02-world`
4. `03-foreground`

`02-world` reemplaza el antiguo concepto de `02-midground` como PNG monolítico. Debe poder contener terreno, senderos, terrazas, agua, vegetación, props y estructuras en unidades reutilizables o chunks.

Una capa puede materializarse como imagen repetible, sprite/objeto, tile/chunk, grupo de assets o composición generada por el renderer.

No exigir que todas compartan exactamente la extensión del viewport si el mundo se desplaza o si la altura visible cambia entre dispositivos.

## 5. Chunks, mosaicos y paquetes offline

No fijar todavía un tamaño canónico de chunk de producción.

La referencia histórica de piezas `240×135` se mantiene únicamente como ensayo de parallax/arte 16:9, no como estándar de almacenamiento del mapa ni como base del viewport móvil.

El tamaño de chunk definitivo debe decidirse después de probar:

- cámara;
- viewport vertical adaptativo;
- carga/descarga;
- colisiones;
- navegación;
- edición;
- memoria en Android;
- continuidad visual entre bordes.

Para atlas, 1024×1024 puede mantenerse como punto de partida técnico, sujeto a medición real del renderer y del dispositivo.

Como requisito de producto, los datos y assets de una zona deben poder **empaquetarse por área para uso offline**. Este documento no fija todavía el formato del paquete, pero la solución elegida no puede depender de conexión permanente para cargar geometría, arte o contratos esenciales de una zona descargada.

## 6. Relación entre blockout y arte

Cada mapa debe conservar un blockout lógico independiente del arte.

```text
Navigation Contract + Camera Contract + Interaction/Learning Contract
→ blockout determinista
→ assets/terreno/objetos
→ composición visual
```

El arte puede ocultar la cuadrícula y naturalizar terrazas, pero no debe redefinir silenciosamente transitabilidad, relaciones de pantalla o interaction slots obligatorios.

El blockout lógico no se rasteriza obligatoriamente dentro del PNG final.

Para el piloto, las relaciones `screen_up = interior/cordillera` y `screen_down = entrada/retorno` deben comprobarse en portrait y en el rango vertical de prueba completo, no solo en una captura fija.

## 7. Isometría, elevación y autoridad geométrica

El lenguaje visual del piloto es isométrico/2.5D y usa terrazas/celdas prismáticas para hacer legibles cambios de altura.

Esto no obliga a un mundo 3D voxelado ni a cubos visibles como apariencia final.

La autoridad geométrica de navegación es el `walkableEnvelope`; una grilla puede derivarse para implementación o pruebas.

El dato lógico mínimo puede usar:

```text
walkableEnvelope
cells[]:
  col
  row
  elevationBand
  walkability
```

El renderer traduce después esas bandas a desplazamiento vertical, sprites, bordes de terreno o geometría según la solución elegida.

La naturalización debe evitar que la modularidad se perciba como una suma de bloques flotantes o repetidos.

## 8. Pixel art de producción

Desde esta base, `pixel art` deja de ser solamente una referencia estética y pasa a ser un criterio de producción comprobable para los assets del mundo.

La prueba debe verificar:

- lectura real a 1× lógico;
- clusters de píxel intencionales;
- ausencia de antialiasing accidental;
- ausencia de detalle que solo funcione ampliado;
- contraste suficiente de personaje, ruta, agua y anclas territoriales;
- escalado nearest-neighbor;
- repetición visible de módulos/tiles;
- seams entre assets;
- oclusión legible.

Una imagen generada con apariencia pixelada no certifica pixel art de producción. Debe tratarse como referencia hasta que el asset exista a resolución lógica real y pueda inspeccionarse a 1×.

El aumento de ancho desde 270 a 360 px no autoriza a aumentar indiscriminadamente el detalle. La densidad visual sigue gobernada por el canon del piloto: pocos elementos, jerarquía clara y espacio negativo suficiente.

## 9. PNG y editables

PNG RGBA continúa siendo formato de revisión y master apropiado para assets raster individuales.

No se considera automáticamente master de mapa una captura compuesta de todo el escenario.

Conservar, según el tipo de recurso:

- `.pxo` o editable equivalente para arte pixelado;
- PNG RGBA para sprites, tiles, props, fondos y overlays;
- archivo de composición o datos del mapa cuando exista implementación;
- preview compuesto para revisión.

La compresión de GPU se decide al empaquetar, no en el master artístico.

Las previews de revisión deben incluir, como mínimo, el caso base `360×640`; cuando la composición dependa de cuánto territorio extra aparece en dispositivos altos, incluir también `360×800`.

## 10. Personajes y escala dentro del mundo

Los sprites canónicos de colección de 125×125 px se mantienen para galería, fichas, selección y encuentros cercanos.

No reducirlos automáticamente para navegación.

Las dimensiones del sprite de exploración siguen `OPEN`. Las referencias históricas de aproximadamente `48×64` o `64×64` se mantienen solo como hipótesis de preproducción y deben validarse por silueta, lectura, oclusión y densidad en portrait.

La relación personaje/tile tampoco se fija todavía.

El **player proxy provisional** se utiliza para comprobar:

- lectura a `360×640`;
- lectura a `360×800`;
- ancho aparente de ruta/puente/puerta;
- oclusión por vegetación y estructuras;
- separación de silueta respecto del terreno.

El proxy no fija el sprite final.

## 11. Cámara, parallax y movimiento

La cámara usa el contrato portrait de `360×H`, con `H` adaptativo dentro del rango validado, y puede desplazarse sobre un mundo mayor.

Para `IT-001 / MAP-001`, la prueba estructural mantiene:

```text
profileId: PILOT_FIXED_ISOMETRIC
orientationPolicy: fixed
rotationPolicy: disabled
followPolicy: allowed
panPolicy: allowed
zoomPolicy: testable / OPEN

screen_up: cordillera / interior / progresión
screen_down: entrada / retorno
```

Pitch, yaw, FOV y zoom definitivo permanecen `OPEN`.

La cámara debe conservar los mismos invariantes cuando el viewport gana altura. No usar el espacio adicional para cambiar arbitrariamente orientación, topología o escala de los assets.

Cuando el renderer lo permita, posiciones de cámara y sprites se cuantizan a píxeles lógicos enteros para evitar shimmer.

Parallax se aplica principalmente a `00-sky`, `01-background` y foreground/overlays que lo justifiquen.

El mundo jugable no debe desplazarse como una imagen decorativa independiente de su lógica espacial.

Los valores históricos de amplitud `0, 4, 12, 24 px` se conservan solo como referencia experimental, no como regla definitiva.

No aplicar blur de tiempo real para simular profundidad del pixel art; resolver jerarquía tonal y detalle en el arte.

## 12. Entregables por mapa/prototipo

Antes de integración, el paquete de una zona debe poder contener:

- brief territorial/ambiental;
- claims/rasgos territoriales relevantes;
- Navigation Contract;
- Camera Contract cuando corresponda;
- Interaction/Learning Contract cuando corresponda;
- blockout lógico verificable;
- player proxy en pruebas estructurales;
- preview portrait base `360×640`;
- preview portrait alto `360×800` cuando corresponda;
- assets raster/editables utilizados;
- definición de orden de capas y offsets;
- referencias ambientales consultadas;
- hoja de verificación visual/técnica.

Cuando el renderer esté seleccionado se añadirá el archivo técnico de mapa correspondiente.

## 13. Criterios de aceptación

Una zona puede declararse lista para integración cuando:

- conserva puertos, ruta y walkable envelope del blockout;
- conserva invariantes de cámara aprobados;
- no introduce oclusiones críticas del personaje o interacciones obligatorias;
- mantiene utilizables los interaction slots requeridos;
- se entiende correctamente en el viewport base `360×640`;
- sigue siendo legible al extenderse a `360×800` sin reencuadrar de forma contradictoria;
- el mundo se lee a 1× lógico y a escalas enteras de presentación;
- no existe filtrado bilinear accidental en arte pixelado;
- flora y contexto respetan evidencia registrada;
- personajes se separan del plano jugable;
- las uniones entre chunks/assets no producen discontinuidades visibles;
- cámara y navegación funcionan sobre la misma geometría lógica;
- safe areas/insets no ocultan interacción o navegación crítica;
- Android muestra escalado entero o una estrategia equivalente validada sin shimmer;
- PC y web preservan la composición portrait del piloto o declaran explícitamente su adaptación secundaria;
- el paquete de zona puede operar offline una vez descargado;
- rendimiento y memoria se miden en al menos un Android de gama media antes de ampliar presupuesto.

## 14. Matriz mínima de prueba de viewport

Antes de convertir esta base en resolución definitiva, probar al menos:

```text
A — 360×640
caso base 9:16

B — 360×720
caso intermedio 18:9

C — 360×780
caso cercano a 19.5:9

D — 360×800
caso alto 20:9
```

Estas dimensiones son **viewports lógicos de prueba**, no resolución física exigida al dispositivo.

La comparación debe medir:

- legibilidad del personaje;
- cantidad de mundo visible;
- lectura de camino/estero/laderas;
- oclusión;
- tamaño aparente de estructuras;
- espacio disponible para UI;
- repetición visible de tiles/assets;
- costo de render y memoria.

Si un viewport más alto solo añade espacio vacío o empeora la composición, puede reservarse parte del alto para UI. Si mejora orientación y progresión sin romper escala, el mundo puede ocuparlo.

## 15. Gate de consolidación de la base

La base `360×H` puede pasar de **base de producción** a **resolución consolidada** solo después de completar una prueba real que incluya:

```text
MAP-001 vertical slice
+ player proxy
+ puente
+ puerta abierta
+ camino
+ estero en L
+ ladera/terraza
+ oclusión
+ ejecución a 1×
+ escalado 2× / 3× / 4× cuando corresponda
```

El gate debe responder explícitamente:

- ¿el personaje se lee sin ampliar artificialmente?
- ¿la isometría conserva suficiente ancho útil en portrait?
- ¿la progresión vertical mejora la orientación?
- ¿los elementos ancla caben sin compresión lateral excesiva?
- ¿el pixel art mantiene clusters limpios a 1×?
- ¿el sistema funciona en al menos un Android de 720 px, uno de 1080 px y, si está disponible, uno de 1440 px de ancho físico?

Hasta superar ese gate, `360×H` es la base recomendada y operativa, no una verdad técnica irreversible.

## 16. Límites actuales

Expo y React Native son la base de aplicación definida, pero el renderer del mundo de exploración sigue `OPEN`.

La elección debe demostrar, como mínimo:

- portrait-first en Android;
- viewport lógico variable en altura o estrategia equivalente;
- isometría compatible con el blockout;
- nearest-neighbor o preservación de píxel equivalente;
- cámara sobre mapas mayores que el viewport;
- navegación/colliders reproducibles;
- capas/orden de dibujo;
- manejo de safe areas/insets;
- exportación Android, PC/Steam y web;
- posibilidad de mantener datos lógicos separados del arte;
- empaquetado offline por área;
- preservación de Camera/Interaction Contracts.

Quedan `OPEN` hasta pruebas reales:

- rango definitivo de altura lógica;
- política exacta cuando la resolución física no permite un múltiplo entero conveniente;
- orientación secundaria landscape;
- tamaño del sprite de exploración;
- tamaño de tile/chunk;
- renderer y pathfinding.

Los fondos existentes y las pruebas de parallax 16:9 siguen siendo material histórico/de referencia. No convertirlos automáticamente en mapas jugables ni en autoridad sobre el viewport móvil.