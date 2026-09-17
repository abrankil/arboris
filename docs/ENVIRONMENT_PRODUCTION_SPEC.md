# Arboris — Especificación de producción para escenarios

## Estado y decisión

Los fondos actuales son referencias visuales y pruebas de parallax, no masters de producción.

Esta especificación distingue:

1. **viewport lógico de presentación** — cómo se ve el juego en pantalla;
2. **contenido espacial del mapa** — cuánto territorio jugable existe y cómo se almacena;
3. **contratos jugables** — navegación, cámara e interacción/aprendizaje que el arte debe respetar.

La dirección de arte corresponde a Álvaro; cualquier cambio de alcance de plataforma o producto debe ser aprobado por Alejandra como directora de proyecto.

El repositorio todavía no ha seleccionado renderer ni pathfinding. Esta especificación fija contratos de arte y presentación sin imponer una arquitectura de motor prematura.

## 1. Viewport lógico

La exploración principal se diseña **portrait-first para Android**. La auditoría de producción descarta `480×270` horizontal como autoridad móvil principal: puede mantenerse como referencia histórica/compatibilidad landscape, pero no debe gobernar composición, escala ni pruebas de `MAP-001`.

Para el piloto se adopta un viewport lógico vertical de **ancho base fijo y altura visible adaptativa**:

| Elemento | Decisión |
| --- | --- |
| Orientación primaria de exploración | Vertical / portrait |
| Ancho lógico de referencia | 270 px |
| Altura lógica mínima de prueba | 480 px |
| Altura lógica adaptativa inicial | 480–600 px |
| Caso base de revisión | 270×480 px |
| Caso alto de revisión | 270×600 px |
| Escalado de presentación | Nearest-neighbor, múltiplos enteros para el mundo pixelado |
| Color | sRGB |
| Cámara | posiciones enteras en píxeles lógicos cuando el renderer lo permita |

`270×480` es el **mínimo/caso base de prueba**, no una resolución física de dispositivo ni un lienzo obligatorio para cada mapa.

La altura no debe fijarse artificialmente a 480 si el dispositivo puede mostrar más mundo sin cambiar la escala de píxel. Para la primera validación, el mundo puede extender su viewport vertical hasta 600 px lógicos. Ese rango cubre desde una relación 9:16 aproximada hasta teléfonos altos cercanos a 9:20 sin convertir cada relación de aspecto en un layout distinto.

La política inicial de cálculo es:

```text
availableWidthPx  = ancho físico utilizable después de insets/safe area
availableHeightPx = alto físico utilizable después de insets/safe area

scale = min(
  floor(availableWidthPx / 270),
  floor(availableHeightPx / 480)
)

visibleLogicalWidth  = 270
visibleLogicalHeight = clamp(
  floor(availableHeightPx / scale),
  480,
  600
)
```

La fórmula es contrato de prueba, no implementación definitiva del renderer. Debe validarse en dispositivos reales antes de consolidarse.

Un mapa puede ocupar una extensión lógica mucho mayor que el viewport y ser recorrido por cámara.

## 2. Comportamiento por plataforma

| Plataforma | Regla de presentación |
| --- | --- |
| Android | portrait-first; aplicar safe areas/insets, elegir el mayor múltiplo entero compatible con un mínimo de 270×480 y mostrar altura adicional hasta el rango validado; UI puede ocupar el espacio restante |
| Steam / PC | soportar ventana portrait para paridad con móvil; landscape puede existir como modo secundario/compatibilidad, no como autoridad de composición del piloto |
| Web | canvas lógico portrait basado en el mismo contrato; `image-rendering: pixelated`; evitar escalado fraccional del mundo cuando sea posible |

La interfaz de formularios, fichas y texto puede ser responsive y no está obligada a usar la misma cuadrícula lógica que el mundo.

El viewport histórico `480×270` se conserva únicamente para ensayos landscape, fondos previos, capturas comparativas o futuros modos secundarios. No debe usarse para validar la composición móvil principal.

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

## 8. PNG y editables

PNG RGBA continúa siendo formato de revisión y master apropiado para assets raster individuales.

No se considera automáticamente master de mapa una captura compuesta de todo el escenario.

Conservar, según el tipo de recurso:

- `.pxo` o editable equivalente para arte pixelado;
- PNG RGBA para sprites, tiles, props, fondos y overlays;
- archivo de composición o datos del mapa cuando exista implementación;
- preview compuesto para revisión.

La compresión de GPU se decide al empaquetar, no en el master artístico.

Las previews de revisión deben incluir, como mínimo, el caso base `270×480`; cuando la composición dependa de cuánto territorio extra aparece en dispositivos altos, incluir también `270×600`.

## 9. Personajes y escala dentro del mundo

Los sprites canónicos de colección de 125×125 px se mantienen para galería, fichas, selección y encuentros cercanos.

No reducirlos automáticamente para navegación.

Las dimensiones del sprite de exploración siguen `OPEN`. Las referencias históricas de aproximadamente `48×64` o `64×64` se mantienen solo como hipótesis de preproducción y deben validarse por silueta, lectura, oclusión y densidad en portrait.

La relación personaje/tile tampoco se fija todavía.

El **player proxy provisional** se utiliza para comprobar:

- lectura a 270×480;
- lectura a 270×600;
- ancho aparente de ruta/puente/puerta;
- oclusión por vegetación y estructuras;
- separación de silueta respecto del terreno.

El proxy no fija el sprite final.

## 10. Cámara, parallax y movimiento

La cámara usa el contrato portrait de `270×H`, con `H` adaptativo dentro del rango validado, y puede desplazarse sobre un mundo mayor.

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

## 11. Entregables por mapa/prototipo

Antes de integración, el paquete de una zona debe poder contener:

- brief territorial/ambiental;
- claims/rasgos territoriales relevantes;
- Navigation Contract;
- Camera Contract cuando corresponda;
- Interaction/Learning Contract cuando corresponda;
- blockout lógico verificable;
- player proxy en pruebas estructurales;
- preview portrait base `270×480`;
- preview portrait alto `270×600` cuando corresponda;
- assets raster/editables utilizados;
- definición de orden de capas y offsets;
- referencias ambientales consultadas;
- hoja de verificación visual/técnica.

Cuando el renderer esté seleccionado se añadirá el archivo técnico de mapa correspondiente.

## 12. Criterios de aceptación

Una zona puede declararse lista para integración cuando:

- conserva puertos, ruta y walkable envelope del blockout;
- conserva invariantes de cámara aprobados;
- no introduce oclusiones críticas del personaje o interacciones obligatorias;
- mantiene utilizables los interaction slots requeridos;
- se entiende correctamente en el viewport base `270×480`;
- sigue siendo legible al extenderse a `270×600` sin reencuadrar de forma contradictoria;
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

## 13. Matriz mínima de prueba de viewport

Antes de fijar la resolución definitiva del mundo de exploración, probar al menos:

```text
A — 270×480
caso base portrait

B — 270×540
caso intermedio

C — 270×585
referencia de relación cercana a 19.5:9

D — 270×600
caso alto cercano a 20:9
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

## 14. Límites actuales

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
