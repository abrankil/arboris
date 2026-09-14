# Arboris — Especificación de producción para escenarios

## Estado y decisión

Los fondos actuales son referencias visuales y pruebas de parallax, no masters de producción. Esta especificación define el formato objetivo para los siguientes escenarios y para la reconstrucción gradual de los existentes. La dirección de arte corresponde a Alvaro; cualquier cambio de alcance de plataforma o producto debe ser aprobado por Alejandra como directora de proyecto.

El objetivo es producir una sola fuente de escena capaz de ejecutarse en Android, Steam para PC y navegadores modernos sin mezclar escalado fraccional dentro de la imagen del juego.

## Especificación base

| Elemento | Decisión |
| --- | --- |
| Orientación de exploración y minijuegos | Horizontal, 16:9 |
| Lienzo lógico nativo | 480×270 px |
| Escalado de mundo | Nearest-neighbor, solo múltiplos enteros |
| Escalas de presentación previstas | 2× = 960×540, 3× = 1440×810, 4× = 1920×1080, 5× = 2400×1350 |
| Tamaño de píxel visible | 1 píxel lógico; 2–5 píxeles físicos según la pantalla y escala elegida |
| Ajuste de viewport | Mayor múltiplo entero que cabe; bandas o marco fuera del área de juego si sobra espacio |
| Escalado fraccional | No usar para el mundo pixelado ni sus sprites |
| Cámaras | Desplazamiento y parallax en píxeles lógicos enteros |
| Color | sRGB; PNG RGBA como fuente de producción |

La correspondencia 1:1 se refiere al píxel lógico del archivo y a la cuadrícula del motor. No puede significar un píxel físico por píxel lógico en todos los teléfonos, monitores y niveles de zoom web. La forma de conservar el estilo es mantener el lienzo lógico y escalarlo por enteros.

## Comportamiento por plataforma

| Plataforma | Modo de entrega | Regla de presentación |
| --- | --- | --- |
| Android | Juego en horizontal; UI nativa fuera del canvas cuando corresponda | En un dispositivo 1280×720, usar 2× y bandas laterales o un marco de UI. En 1920×1080, usar 4×. No estirar el mundo para llenar todo el panel. |
| Steam / PC | Ventana redimensionable y pantalla completa | Elegir el mayor entero que cabe y mantener letterbox o pillarbox. Steam Deck 1280×800 usa 2× para el mundo 960×540 y reserva el espacio restante como marco o bandas. |
| Web | Canvas lógico de 480×270 con CSS que preserve relación de aspecto | Usar `image-rendering: pixelated` y tamaño interno fijo. Si el contenedor no admite un entero, centrar el canvas con bandas; no usar `devicePixelRatio` ni zoom CSS fraccional para ampliar el mundo. |

La interfaz de formularios, fichas, mapas y texto no está obligada a usar el canvas de 480×270. Puede ser responsive, pero debe respetar la dirección visual y no escalar el mundo de exploración con reglas de interfaz.

## Capas y recursos

Cada escena jugable se construye con capas de 480×270 px que comparten origen `(0,0)` y registro espacial.

1. `00-sky` — opaca; cielo con franjas y sin huecos al desplazarse.
2. `01-background` — cordillera, nubes, valle y relieve lejano.
3. `02-midground` — senderos, terrazas, agua, árboles y objetos jugables.
4. `03-foreground` — rocas, pastos, chaguales y elementos que cruzan el borde inferior.

Una capa que deba desplazarse más allá de la cámara se crea como mosaico. Usar piezas de 240×135 px para arte de 16:9 que se repite o se encadena, con un solape de 16 px cuando la composición lo requiera. Para atlases, usar páginas de 1024×1024 px; no convertir una escena completa a atlas por defecto.

El tamaño total de una escena base de cuatro capas RGBA sin compresión es aproximadamente 2 MiB en memoria (`480 × 270 × 4 × 4`). Es adecuado como presupuesto inicial para Android y deja margen para personajes, UI y escenas vecinas. Medir en dispositivo antes de aumentar resolución o número de capas.

PNG RGBA es el master y formato de revisión. La compresión de GPU se decide en el empaquetado, no durante la creación: ASTC como preferencia moderna de Android, ETC2 como compatibilidad Android y formatos de escritorio como BC/DXTC cuando el motor y Steam lo requieran. No sustituir el master PNG ni transparentar arte de píxel con una compresión con pérdida sin comparar visualmente.

## Personajes y escala dentro del mundo

Los sprites canónicos de colección son 125×125 px y conservan su función en herbario, fichas, selección de personaje y encuentros cercanos. No deben reducirse automáticamente para usarlos como avatar de exploración: eso crea escalado fraccional o una figura demasiado grande para un lienzo de 270 px de alto.

Para navegación continua, producir una familia de sprites específica a escala nativa de 48×64 px o 64×64 px, según la silueta de cada personaje. Es una derivación artística nueva, no una conversión automática del asset de colección. Mantener los rasgos diagnósticos y la ficha de especie; registrar el uso como `gameplaySprite` separado del `selectedDesign` actual.

En el lienzo de 480×270, un personaje de 64 px de alto ocupa aproximadamente una cuarta parte de la altura y permite leer suelo, vegetación y relieve. Los sprites de 125 px se reservan para composición de encuentro, menú o primer plano.

## Cámara, parallax y movimiento

La cámara opera en píxeles lógicos enteros. Todas las posiciones, velocidades y amplitudes de parallax se redondean al píxel entero antes de dibujar. La amplitud se expresa en píxeles del lienzo nativo, no en porcentajes del tamaño físico de pantalla.

El primer ensayo de capas usaba amplitudes de 0, 4, 12 y 24 px. Mantenerlo como referencia de sensación, pero validar en el lienzo 480×270. El cielo no se mueve o se mueve mínimamente; fondo, plano medio y primer plano usan amplitudes crecientes. No aplicar blur por filtro en tiempo real para simular profundidad: resolverlo en el arte por clusters y bloques de píxel.

## Entregables por escena

- Brief con ecosistema, zona geográfica, especies ambientales, estación, hora y uso de UI.
- Archivo fuente editable por capa, preferentemente `.pxo` cuando el trabajo se hace en Pixelorama.
- PNG RGBA de cada capa a 480×270 px o mosaicos documentados.
- Archivo de composición que registre orden de capas, offsets, bucles y paleta.
- Preview 2× o 4× para revisión, nombrado como derivado y nunca como master.
- Hoja de verificación con dimensiones, alpha, escalado de preview y revisión a zoom entero.

## Criterios de aceptación

Una escena puede declararse lista para integración cuando:

- cada capa comparte lienzo y registro, y el cielo cubre todo el desplazamiento;
- el arte se lee a escala 1× lógica y a escalas enteras 2× y 4×;
- no hay antialiasing ni filtrado bilinear en bordes, cámara o sprites;
- la flora y el contexto respetan las referencias botánicas y ecológicas registradas;
- el plano jugable mantiene contraste suficiente para personajes y controles;
- Android 720p, PC 1080p, Steam Deck y navegador muestran el mundo con escalado entero y bandas correctas;
- se prueba rendimiento y memoria en al menos un Android de gama media antes de ampliar el presupuesto de capas o texturas.

## Límites actuales

Expo y React Native son la base definida para la aplicación, pero el repositorio no ha seleccionado todavía un renderizador de juego que implemente este canvas, sus capas y la cámara. La especificación fija el contrato de los assets y del viewport; la elección del renderizador debe demostrar nearest-neighbor, posiciones enteras, parallax y exportación para Android, Steam y web antes de adoptarse.

Los fondos presentes de 1672×941 px y los previews a 960×540 son material de referencia. No convertirlos automáticamente a 480×270: reconstruir o adaptar cada capa con revisión visual para preservar los bloques, la composición y la flora.
