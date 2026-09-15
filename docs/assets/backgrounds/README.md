# Arboris — Catálogo ambiental y capas de parallax

Aplicar la [guía de arte unificada](../../ART_STYLE_GUIDE.md) y la [dirección argumental](../../GRAPHIC_DIRECTION.md). Los escenarios sitúan la exploración y dejan espacio a personajes e interfaz; la presencia de una planta dibujada no constituye un registro geográfico real.

Las referencias vegetales canónicas de Alejandra están registradas en el [catálogo de referencias vegetales](../vegetation/README.md). Se consultan para construir los módulos de escena, pero no sustituyen las capas ambientales ni se consideran assets de producción hasta su limpieza y validación.

Los nuevos escenarios deben seguir la [especificación de producción](../../ENVIRONMENT_PRODUCTION_SPEC.md). Las imágenes listadas aquí son referencias y ensayos anteriores a ese contrato.

## Referencias visuales vigentes

| Archivo | Dimensiones verificadas | Uso |
| --- | --- | --- |
| `arboris-santiago-valle-1920x1080.png` | 1920×1080 | Composición panorámica de Santiago y precordillera |
| `arboris-santiago-valle-1x1-rainy-turquoise-chagual.png` | 1254×1254 | Variante cuadrada lluviosa con chaguales |
| `parallax/00-sky.png` a `03-foreground.png` | 1672×941 cada una | Primer conjunto ambiental de cuatro capas |

En el nombre de la variante cuadrada, `1x1` indica relación de aspecto; no certifica correspondencia nativa de píxel. Estas resoluciones se conservan como material existente y requieren revisión de escala para su integración jugable.

## Orden de composición

1. `parallax/00-sky.png` — cielo base opaco con franjas horizontales.
2. `parallax/01-background.png` — cordillera, nubes y valle lejano.
3. `parallax/02-midground.png` — ladera, ciudad, sendero y vegetación intermedia.
4. `parallax/03-foreground.png` — rocas, flores, pastos y chaguales cercanos. Los chaguales usan hojas finas, caídas y una inflorescencia terminal mayormente leñosa; sus pétalos azul-turquesa aparecen solo como pequeños acentos en un racimo tipo “cola de zorro”.

## Prueba de desplazamiento

`parallax/animate_parallax.py` compone una demostración de 960×540 px con amplitudes crecientes por plano (0, 4, 12 y 24 px). Remuestrea las capas a 1024×604 con nearest-neighbor antes de encuadrar. Ese factor no es entero: se trata de un ensayo de movimiento, no de una entrega que certifique escala de píxel 1:1. Usa una paleta GIF compartida para evitar parpadeo; esa paleta solo afecta al derivado.

Para regenerar la prueba, ejecutar el script desde esta carpeta con Pillow instalado. La salida se crea en `parallax/animation/` y no forma parte del paquete base de capas.

## Gestión y siguientes revisiones

Los PNG de esta carpeta son las referencias ambientales del repositorio. `output/arboris/backgrounds/` en el espacio de trabajo conserva material de trabajo y derivados; no reemplazar las referencias aquí por otra variante sin una decisión de diseño. Mantener ambos ámbitos identificados y no borrar originales por similitud de nombre.

Antes de integrar una escena, definir su cuadrícula nativa, el escalado de presentación y los márgenes de cámara; revisar el plano jugable nítido, el cielo sin huecos y el contraste de los personajes. El primer plano admite desenfoque discreto por bloques según la guía.
