# Árboris — Character documentation sync manifest
## 2026-09-16

## Objetivo de este paquete

Sincronizar el trabajo documental de personajes sin tocar sprites ni datos científicos.

## Archivos nuevos propuestos

- `docs/CHARACTER_WORKLOG_2026-09-15.md`
- `docs/CHARACTER_CREATION_WORKFLOW.md`
- `docs/CHARACTER_TEMPLATE.md`
- `docs/CHARACTER_MANUAL_REFACTOR_PLAN.md`

## Lo que NO hace este paquete

- no modifica PNG;
- no cambia hashes;
- no cambia `data/characters/index.json`;
- no cambia fichas JSON;
- no elimina ni renombra manuales existentes;
- no aplica todavía la Fase B/C del refactor.

## Siguiente commit recomendado

Después de revisar estos cuatro documentos:

`docs: add character workflow and refactor plan`

## Segunda etapa posterior

En una rama/documentación separada:

1. añadir el mapa documental a `GRAPHIC_DIRECTION.md`;
2. consolidar el contrato técnico en `ART_STYLE_GUIDE.md`;
3. deprecar `ARBORIS_CHARACTER_CREATION_RULES.md` a favor del workflow;
4. convertir `CHARACTER_DESIGN_STATUS.md` en estado de producción;
5. convertir `CHARACTER_COLLECTION_FINAL.md` en snapshot histórico.

Esa segunda etapa debe revisarse por diff antes del merge.
