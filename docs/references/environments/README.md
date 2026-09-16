# Árboris — Biblioteca de referencias ambientales

Esta carpeta contiene el índice operativo de referencias usadas para construir escenarios de Árboris. No es un depósito general de imágenes.

## Flujo

```text
referencia
→ registro en manifest
→ revisión
→ observación / interpretación
→ patrón
→ regla de dirección de arte
→ escenario o asset
```

Una fotografía documenta un registro concreto; no define por sí sola un ecosistema ni una regla artística.

## Archivo principal

`manifest.csv` es el inventario de referencias ambientales.

Para el primer piloto, cada referencia debe indicar su pertinencia territorial mediante `pilotRelevance`:

- `core`: Fundo Los Nogales / territorio directamente ligado al levantamiento botánico del piloto;
- `contextual`: cuenca del Arrayán / Santuario Los Nogales y contexto inmediato;
- `comparative`: Yerba Loca, Río Clarillo, Pirque u otras áreas usadas para contraste.

Cuando exista vínculo documental directo con la fuente botánica maestra, usar:

`botanicalSourceRef=data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

No asignar ese vínculo solo por proximidad geográfica.

## Imágenes

Git debe contener únicamente material curado que sea legal y útil versionar. Las bibliotecas fotográficas grandes pueden mantenerse fuera del repositorio; el manifest conserva procedencia, URL, derechos y uso.

Las imágenes web no se copian al repositorio por defecto.

## Regla operativa

Para incorporar una referencia nueva, completar primero los campos mínimos definidos en `ENVIRONMENT_REFERENCE_PROTOCOL.md`. La metadata ampliada se completa solo cuando la referencia pasa a revisión o selección.

No crear nuevas categorías, campos o carpetas salvo que el corpus real demuestre que hacen falta.

## Documentos relacionados

- [`../../ENVIRONMENT_REFERENCE_PROTOCOL.md`](../../ENVIRONMENT_REFERENCE_PROTOCOL.md) — registro, evidencia y clasificación.
- [`../../ENVIRONMENT_ART_DIRECTION.md`](../../ENVIRONMENT_ART_DIRECTION.md) — reglas visuales y decisiones de arte.
- [`../../SCENE_REFERENCE_BRIEF_TEMPLATE.md`](../../SCENE_REFERENCE_BRIEF_TEMPLATE.md) — brief operacional de escena.
- [`../../ENVIRONMENT_PRODUCTION_SPEC.md`](../../ENVIRONMENT_PRODUCTION_SPEC.md) — producción técnica del asset.
