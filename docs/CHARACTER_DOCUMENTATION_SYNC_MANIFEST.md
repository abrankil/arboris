# Árboris — Character documentation sync manifest
## 2026-09-16

## Objetivo de este paquete

Sincronizar el trabajo documental de personajes sin tocar sprites ni datos científicos.

## Archivos incluidos

- `docs/CHARACTER_WORKLOG_2026-09-15.md`
- `docs/CHARACTER_CREATION_WORKFLOW.md`
- `docs/CHARACTER_TEMPLATE.md`
- `docs/CHARACTER_MANUAL_REFACTOR_PLAN.md`
- `docs/CHARACTER_DOCUMENTATION_SYNC_MANIFEST.md`

## Lo que NO hace este paquete

- no modifica PNG;
- no cambia hashes;
- no cambia `data/characters/index.json`;
- no cambia fichas JSON;
- no elimina ni renombra manuales existentes;
- no cambia todavía el schema ni el canon operativo;
- incorpora algunos conceptos de la Fase B únicamente como borradores documentales para revisión (tests visuales, versionado, derivados y estados por atributo), sin convertirlos todavía en reglas de datos ni en requisitos de assets.

## Estado de esta sincronización

Estos cinco documentos están contenidos en la rama `docs/character-manual-refactor` y se revisan mediante un Draft PR antes de cualquier merge a `main`.

La presencia de estos documentos en la rama no implica que las fases posteriores del refactor hayan sido aplicadas a los manuales existentes.

## Segunda etapa posterior

En una rama/documentación separada:

1. añadir el mapa documental a `GRAPHIC_DIRECTION.md`;
2. consolidar el contrato técnico en `ART_STYLE_GUIDE.md`;
3. migrar cualquier contenido único de `ARBORIS_CHARACTER_CREATION_RULES.md` al workflow, actualizar referencias entrantes y solo después marcar el archivo anterior como deprecado;
4. convertir `CHARACTER_DESIGN_STATUS.md` en estado de producción;
5. convertir `CHARACTER_COLLECTION_FINAL.md` en snapshot histórico, actualizando primero todos los enlaces que apunten al nombre anterior.

Esa segunda etapa debe revisarse por diff antes del merge.
