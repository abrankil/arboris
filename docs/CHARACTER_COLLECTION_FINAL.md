# Arboris — colección gráfica inicial finalizada

Estado de consolidación: 2026-09-14. La primera colección gráfica completada comprende seis personajes con diseño aprobado, sprite canónico y entrega en PNG RGBA de 125×125 píxeles reales para Pixelorama. Esta lista no fija el número total ni definitivo de personajes de Arboris. La copia ubicada en `data/characters/*/assets/` es la fuente operativa del repositorio; `data/characters/index.json` define el conjunto activo.

## Sprites canónicos

| ID | Personaje | Versión | Sprite oficial | SHA-256 | Identidad resumida |
| --- | --- | --- | --- | --- | --- |
| SP001 | Peumo / Peumito | manual-cleanup-v2 | `SP001_peumo/assets/peumito-layer-125x125.png` | `b9a2d815d4462555be40cebc30b681a02cac2aa71afb861218d5cc51c85767d6` | Hoja ovalada verde azulado grisácea con drupa rosada-roja. |
| SP002 | Litre / Litrini | manual-cleanup-v2 | `SP002_litre/assets/litrini-layer-125x125.png` | `382d91a9499e2c9a3113c358ab384fb96e8e52c7eec28833d5aee70cd853dbdd` | Hoja ovalada con nervaduras bifurcadas y dos frutos blancos. |
| SP003 | Bollén | manual-cleanup-v1 | `SP003_bollen/assets/bollen-pixelorama-125x125.png` | `698a6bf32337e25cae45a37ff5c00839ccc06a20fe730edf761fa9cb6f37684a` | Hoja oblonga con dientes blanquecinos y fruto pentafolículo oscuro. |
| SP004 | Mitique / Mitiqui | technical-cleanup-v2 | `SP004_mitique/assets/mitique-pixelorama-125x125.png` | `d753efa0f28601382024e1bfc228e4243d0814eccb252442f2e7dc2fef477f35` | Hoja ancha, ápice alargado, dientes suaves y nervadura blanquecina fina. |
| SP005 | Colliguay | manual-cleanup-v1 | `SP005_colliguay/assets/colliguay-pixelorama-125x125.png` | `a09076ef4d80a15449499734894e3c6dca0e66bbc87d2ea1dd8f73b339ea9cf5` | Hoja aovada de ápice redondeado con puntas rojizas y nervaduras discretas. |
| SP006 | Quillay / Quillai | manual-cleanup-v2 | `SP006_quillay/assets/quillai-layer-125x125.png` | `1f8ef89847702e51c7593bbea17b81182bdee2cf5d2a9cf9af39909a8845a877` | Hoja ancha con margen mayormente entero, dientes suaves y coronilla característica. |

## Contrato común verificado

- Lienzo nativo: 125×125 píxeles.
- Formato: PNG RGBA.
- Transparencia: alpha binario, valores 0 o 255.
- Escalado de presentación: múltiplos enteros con nearest-neighbor.
- Fuente de verdad: última limpieza manual o técnica aceptada, copiada sin reescalado ni cuantización.
- Lenguaje compartido: hojas como cuerpo, ojos pequeños, flotación independiente, contornos escalonados y sombreado por clusters.

## Organización

Las propuestas y derivaciones superadas no participan del índice activo. Los estudios de producción se conservan en `output/archive/characters/` o en el archivo histórico propio de cada personaje. Las referencias fotográficas y bases de decisión se mantienen separadas de los sprites canónicos.

La aprobación de diseño corresponde a Alvaro como director de arte. Los aportes botánicos y de dirección de proyecto de Alejandra se conservan atribuidos en las fichas individuales. La consolidación de esta primera colección de seis personajes no cierra todavía los fondos, animaciones, UI ni los sprites específicos de gameplay, y no limita futuras incorporaciones al elenco.

## Personaje auxiliar integrado

La [Piedra-guía de líquen](../data/characters/GUIDE_lichen_stone.json) queda integrada como personaje auxiliar de guía y asistencia. Su PNG canónico está en `data/characters/shared/guides/piedra-guia-pixelorama-125x125.png`. No representa una especie botánica, no altera la colección inicial de seis y confirma que Arboris no tiene un número predeterminado de personajes.
