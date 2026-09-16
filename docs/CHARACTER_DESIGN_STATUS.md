# Arboris — Estado del diseño de personajes

## Alcance

Este documento informa el estado de producción vigente. No redefine el método de trabajo ni el contrato técnico: para eso consultar [`CHARACTER_CREATION_WORKFLOW.md`](CHARACTER_CREATION_WORKFLOW.md) y [`ART_STYLE_GUIDE.md`](ART_STYLE_GUIDE.md). El canon operativo se enumera en [`data/characters/index.json`](../data/characters/index.json) y en las fichas individuales.

Los estados describen únicamente lo ya documentado. `open` significa que la decisión no está cerrada; `none` significa que el diseño vigente no incorpora ese elemento.

## Personajes vigentes

| ID | Personaje | Master vigente | Morfología | Paleta | Rostro | Compañero | Cleanup | Animación | Gameplay |
|---|---|---|---|---|---|---|---|---|---|
| SP001 | Peumo / Peumito | `SP001_peumo/assets/peumito-layer-125x125.png` | approved | approved | approved | approved | verified | not_started | open |
| SP002 | Litre / Litrini | `SP002_litre/assets/litrini-layer-125x125.png` | approved | approved | approved | approved | verified | not_started | open |
| SP003 | Bollén | `SP003_bollen/assets/bollen-pixelorama-125x125.png` | approved | approved | approved | approved | verified | not_started | open |
| SP004 | Mitique / Mitiqui | `SP004_mitique/assets/mitique-pixelorama-125x125.png` | approved | approved | approved | none | verified | not_started | open |
| SP005 | Colliguay | `SP005_colliguay/assets/colliguay-pixelorama-125x125.png` | approved | approved | approved | none | verified | not_started | open |
| SP006 | Quillay / Quillai | `SP006_quillay/assets/quillai-layer-125x125.png` | approved | approved | approved | none | verified | not_started | open |
| SP007 | Boldo | `SP007_boldo/assets/boldo-pixelorama-125x125.png` | approved | approved | approved | approved | verified | not_started | open |
| GUIDE | Piedra-guía de líquen | `shared/guides/piedra-guia-pixelorama-125x125.png` | approved | approved | approved | none | verified | not_started | open |

`Master vigente` usa rutas relativas a `data/characters/`.

## Pendientes reales

- Las capacidades, diálogos, personalidades, habilidades y mecánicas de gameplay de los personajes permanecen abiertas salvo decisión futura explícita.
- Las animaciones del elenco no se consideran iniciadas por la existencia de sprites base o previews históricos.
- La escala visual comparativa del elenco debe medirse antes de fijar rangos de proporción, pivotes, bounds o anchors.
- Los derivados de discovery, gameplay, expresiones, animación y promoción deben declarar siempre su master de origen.

## Incidencias y excepciones técnicas documentadas

- Mitique tuvo 3.140 píxeles con alpha intermedio; se normalizaron técnicamente a 0/255 sin cambiar canales RGB. La revisión técnica no sustituye una revisión visual opcional de contorno y nervadura.
- Mitique tiene una fuente `.pxo` asociada mediante `selectedDesign.source`; la equivalencia verificada se limita a la capa de imagen comparada y no sustituye una apertura visual en Pixelorama.
- No se recibió un `.pxo` de Bollén en la entrega documentada.
- Boldo sí tiene un proyecto `.pxo` asociado a su sprite vigente.
- Colliguay fue aprobado a partir de la base seleccionada y del ajuste de puntas rojizas respaldado por la referencia cromática atribuida a Alejandra.
- La Piedra-guía es un personaje auxiliar no botánico y se registra bajo `supportCharacters`; no cuenta como especie del catálogo.

## Assets y validación

Los sprites canónicos viven en las carpetas `data/characters/*/assets/`; los auxiliares, bajo `data/characters/shared/`. La imagen promocional de tres personajes es una referencia histórica de composición y no sustituye los masters individuales.

Ejecutar `pwsh -File tools/validate-graphic-assets.ps1` desde la raíz de Arboris para repetir comprobaciones medibles. El resultado informa problemas sin editar píxeles y no certifica por sí solo morfología, estilo ni aprobación artística.
