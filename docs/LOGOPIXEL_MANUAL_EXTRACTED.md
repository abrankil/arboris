# Árboris — extracción del manual de marca `logopixel`

Estado: referencia normativa para limpieza manual y producción pixel art. No reemplaza el diseño canónico provisional elegido por el equipo.

## Fuente

- [Archivo `logopixel` en Drive](https://drive.google.com/file/d/1NEmCddmNEq4hPa1ftyAky6oEhjGmToWQ/view?usp=drivesdk)
- [Carpeta Arte del proyecto](https://drive.google.com/drive/folders/1yNEzYZhGzIvUid_jsBkARPm-vXpYVGE9)
- Documento observado: `ÁRBORIS — MANUAL DE MARCA`, sección `3. VERSIÓN PIXEL`, versión 1.0 · 2026.

## Contrato visual extraído

La versión pixel es una representación 1:1 del logo madre: conserva composición, proporciones, geometría, legibilidad y esencia. La adaptación es únicamente técnica y debe integrarse con la estética HD-2D del juego.

| Área | Regla extraída |
|---|---|
| Unidad | Bloque lógico de `4 × 4 px`; toda construcción y modificación debe respetar múltiplos de 4 px. |
| Retícula | Relación 1:1; cada elemento se traduce directamente a la cuadrícula, sin alterar su geometría. |
| Archivo maestro | Pixelorama `.pxo`. |
| Exportación | PNG RGBA con transparencia real. |
| Bordes | Escalonados, rectos y nítidos; sin suavizado ni antialiasing. |
| Color | Usar únicamente la paleta de marca definida abajo, salvo una aprobación explícita. |
| Texto | Mantener exactamente `EXPLORA • APRENDE • CONSERVA`. |
| Escalado | Solo múltiplos enteros y preferentemente múltiplos de 4; usar vecino más cercano. |

## Paleta normativa

| Token | Hex | Uso indicado |
|---|---|---|
| Sombra profunda | `#0F2E1F` | Contornos, masas oscuras y separación. |
| Base | `#2E7D32` | Masa principal vegetal. |
| Luz | `#4C9A3D` | Planos iluminados. |
| Highlights / nervaduras | `#A7C957` | Nervaduras y acentos de luz. |
| Marfil | `#EDE7D3` | Fondo y detalles claros. |
| Tierra | `#8B6F47` | Elementos de suelo o tierra cuando correspondan. |

## Versiones y uso

Preparar, a partir del mismo máster, las versiones transparente, negativa para fondo oscuro, monocroma de un color y para fondo claro. Usos previstos: digital, videojuego, iconos y UI.

Tamaños de referencia: `16 × 16` icono pequeño, `24 × 24` icono, `32 × 32` UI y `48 × 48` versión destacada. El manual fija `48 px` como mínimo para interfaz/web y `24 px` como mínimo para icono.

La zona segura mínima alrededor del logotipo equivale a la altura de la `o`/hoja. La hoja aislada se especifica como recurso transparente de `32 × 32 px`, construido con bloques de `4 × 4 px`.

## Qué se conserva en la limpieza manual

Se conserva el diseño canónico provisional del proyecto: silueta, proporciones, composición de letras, acento, hoja, separadores, eslogan, espaciado y elementos aprobados de la referencia. La limpieza elimina únicamente ruido JPEG, antialiasing accidental, bordes irregulares y desalineaciones respecto de la retícula.

La referencia canónica vigente está en [`output/arboris/brand/canonical/arboris-logo-canonical-reference.jpg`](../../output/arboris/brand/canonical/arboris-logo-canonical-reference.jpg). El brillo/estrella que aparece en esa referencia se trata como elemento existente de la composición elegida, no como permiso para añadir efectos nuevos.

## Prohibiciones

- No rediseñar, reimaginar ni sustituir la silueta.
- No deformar proporciones ni cambiar la geometría del logo madre.
- No introducir colores fuera de la paleta sin aprobación.
- No añadir gradientes, blur, sombras suaves, texturas ni efectos.
- No usar escalado bilineal, bicúbico o cualquier interpolación suavizada.
- No entregar el PNG como sustituto del máster editable: el `.pxo` debe conservar capas separadas para marca, hoja, eslogan, fondo/transparencia y variantes.

## Criterio de aceptación

Una entrega pasa cuando cada borde puede auditarse sobre la retícula de 4 px, todos los bloques son cuadrados uniformes, los colores pertenecen a la paleta, el texto es legible y exacto, la transparencia es real, las proporciones coinciden con la referencia canónica y la exportación conserva bordes nítidos al revisar al 100% y ampliada con vecino más cercano.
