# Arboris — snapshot histórico del canon gráfico — 2026-09-15

> Documento histórico de consolidación. No es fuente normativa vigente. El canon operativo está definido por `data/characters/index.json`, las fichas individuales y `CHARACTER_DESIGN_STATUS.md`.

La colección gráfica inicial de seis personajes se amplió con Boldo como personaje botánico canon adicional. Esta lista no fija el número total ni definitivo de personajes de Arboris y todos los diseños permanecen sujetos a cambios posteriores. La copia ubicada en `data/characters/*/assets/` era la fuente operativa del repositorio en este corte; `data/characters/index.json` definía el conjunto activo.

## Sprites canónicos en este corte

| ID | Personaje | Versión | Sprite oficial | SHA-256 | Identidad resumida |
| --- | --- | --- | --- | --- | --- |
| SP001 | Peumo / Peumito | manual-cleanup-v2 | `SP001_peumo/assets/peumito-layer-125x125.png` | `b9a2d815d4462555be40cebc30b681a02cac2aa71afb861218d5cc51c85767d6` | Hoja ovalada verde azulado grisácea con drupa rosada-roja. |
| SP002 | Litre / Litrini | manual-cleanup-v2 | `SP002_litre/assets/litrini-layer-125x125.png` | `382d91a9499e2c9a3113c358ab384fb96e8e52c7eec28833d5aee70cd853dbdd` | Hoja ovalada con nervaduras bifurcadas y dos frutos blancos. |
| SP003 | Bollén | manual-cleanup-v1 | `SP003_bollen/assets/bollen-pixelorama-125x125.png` | `698a6bf32337e25cae45a37ff5c00839ccc06a20fe730edf761fa9cb6f37684a` | Hoja oblonga con dientes blanquecinos y fruto pentafolículo oscuro. |
| SP004 | Mitique / Mitiqui | technical-cleanup-v2 | `SP004_mitique/assets/mitique-pixelorama-125x125.png` | `d753efa0f28601382024e1bfc228e4243d0814eccb252442f2e7dc2fef477f35` | Hoja ancha, ápice alargado, dientes suaves y nervadura blanquecina fina. |
| SP005 | Colliguay | manual-cleanup-v1 | `SP005_colliguay/assets/colliguay-pixelorama-125x125.png` | `a09076ef4d80a15449499734894e3c6dca0e66bbc87d2ea1dd8f73b339ea9cf5` | Hoja aovada de ápice redondeado con puntas rojizas y nervaduras discretas. |
| SP006 | Quillay / Quillai | manual-cleanup-v2 | `SP006_quillay/assets/quillai-layer-125x125.png` | `1f8ef89847702e51c7593bbea17b81182bdee2cf5d2a9cf9af39909a8845a877` | Hoja ancha con margen mayormente entero, dientes suaves y coronilla característica. |
| SP007 | Boldo | manual-cleanup-v1 | `SP007_boldo/assets/boldo-pixelorama-125x125.png` | `2cf3f4fba8153a372d24894b665004d00b9c95b82d99c4c7d3e70b56433e630a` | Hoja oblonga verde bosque oliva oscuro, con textura coriácea, fruto burgundy y flor clara separados. |

## Contrato común verificado en este corte

- Lienzo nativo: 125×125 píxeles.
- Formato: PNG RGBA.
- Transparencia: alpha binario, valores 0 o 255.
- Escalado de presentación: múltiplos enteros con nearest-neighbor.
- Fuente de verdad: última limpieza manual o técnica aceptada, copiada sin reescalado ni cuantización.
- Lenguaje compartido: hojas como cuerpo, ojos pequeños, flotación independiente, contornos escalonados y sombreado por clusters.

## Organización registrada

Las propuestas y derivaciones superadas no participaban del índice activo. Los estudios de producción se conservaban en `output/archive/characters/` o en el archivo histórico propio de cada personaje. Las referencias fotográficas y bases de decisión se mantenían separadas de los sprites canónicos.

La aprobación de diseño correspondía a Alvaro como director de arte. Los aportes botánicos y de dirección de proyecto de Alejandra se conservaban atribuidos en las fichas individuales. Esta consolidación no cerraba fondos, animaciones, UI ni sprites específicos de gameplay, y no limitaba futuras incorporaciones ni cambios posteriores del elenco.

## Personaje auxiliar integrado

La [Piedra-guía de líquen](../data/characters/GUIDE_lichen_stone.json) estaba integrada como personaje auxiliar de guía y asistencia. Su PNG canónico se registraba en `data/characters/shared/guides/piedra-guia-pixelorama-125x125.png`. No representa una especie botánica y no altera el conteo de especies del catálogo.
