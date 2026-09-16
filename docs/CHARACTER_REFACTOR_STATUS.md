# Árboris — Estado del refactor documental de personajes

Actualizado: 2026-09-16.

Este documento registra qué partes del plan de `CHARACTER_MANUAL_REFACTOR_PLAN.md` ya fueron ejecutadas. El plan conserva el razonamiento y el orden propuesto; este archivo gobierna el estado de implementación.

## Fase A — reorden documental

**Estado: implementada documentalmente.**

La integración a `main` se gestiona mediante el PR correspondiente; este estado describe el contenido implementado y no depende del nombre de una rama temporal.

Cambios incluidos:

- `GRAPHIC_DIRECTION.md` incorpora el mapa de responsabilidades documentales;
- `ART_STYLE_GUIDE.md` define master/derivados, geometría futura como propuesta, una regla transitoria para el master visual operativo y lenguaje neutral para estructuras secundarias;
- `CHARACTER_CREATION_WORKFLOW.md` queda como procedimiento operativo vigente;
- `ARBORIS_CHARACTER_CREATION_RULES.md` queda deprecado como ruta de compatibilidad;
- `CHARACTER_DESIGN_STATUS.md` se concentra en estado, pendientes e incidencias;
- `CHARACTER_CANON_SNAPSHOT_2026-09-15.md` preserva el corte histórico con hashes y versiones;
- `CHARACTER_COLLECTION_FINAL.md` queda deprecado como ruta de compatibilidad;
- `README.md` apunta a las nuevas fuentes vigentes.

No se modifican sprites, hashes, fichas JSON, `data/characters/index.json`, evidencia botánica, identificación, desbloqueo ni gameplay.

## Fase B — mejoras de producción

**Estado: parcial/documental.**

Ya están descritos, pero no necesariamente medidos o implementados en datos:

- nomenclatura separada para especie/personaje/nombre científico;
- `designVersion`, `spriteVersion` y `technicalRevision` como conceptos;
- tests de silueta, rasgo botánico/material, thumbnail y entorno;
- master y derivados;
- `gameplayRole` separado de la representación visual.

Siguen abiertos:

- microguía de expresiones basada en análisis del elenco;
- medición comparativa de bounding boxes, ocupación, centros visuales, ojos y accesorios;
- valores de pivots, bounds, anchors, attachment points y safe areas.

## Fase C — datos y automatización

**Estado: no iniciada.**

No cambiar el schema de `data/characters/` hasta revisar consumidores, validadores y migración completa del elenco.
