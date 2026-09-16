# tools/botanical-key-validation — Estado legacy

Este directorio contiene el prototipo local de validación de clave botánica anterior a la integración plena de Master Botánico 2.0.

## Estado actual

Uso: referencia histórica, pruebas metodológicas y comparación durante la migración.

No usar como arquitectura final ni como fuente botánica vigente.

## Motivo

La documentación y parte del código de este directorio fueron diseñados alrededor de una adaptación foliar conservadora y componentes anteriores al motor canónico. Algunos módulos todavía contienen traducciones, nombres comunes, preguntas o estados que no deben gobernar el sistema nuevo.

La arquitectura vigente está definida por:

- `docs/START_HERE.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`
- `data/botanical/`
- `data/species/`

## Regla para nuevas implementaciones

El nuevo motor de identificación debe consumir directamente la matriz canónica especie × carácter desde `data/botanical/`.

No agregar nuevo conocimiento botánico hardcodeado en `logic.mjs`, `species_adapter.mjs` u otros módulos legacy.

## Retiro futuro

La retirada o reemplazo de este directorio corresponde a Hito 15.9, después de validar el motor canónico del Hito 15.5 y la selección adaptativa posterior.
