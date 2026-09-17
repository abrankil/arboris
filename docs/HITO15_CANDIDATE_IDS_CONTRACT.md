# Hito 15 — Contrato de `candidateIds` (Hallazgo D)

Estado: **CERRADO**. Decisión de producto e implementación de engine validadas.

## Hallazgo original (auditoría)

`filterCandidates()` aceptaba `candidateIds` como conjunto inicial sin normalizarlo ni validarlo. Esto permitía que IDs duplicados se propagaran y que IDs inexistentes entraran al flujo de identificación. El mismo argumento circula además por `nextCharacter()`, `retryCharacter()` y `assessIdentification()`.

## Decisiones cerradas

1. `null` mantiene su significado actual: usar todas las especies canónicas del dataset.
2. Una lista explícita se deduplica preservando el orden de la primera aparición.
3. Un `species_id` inexistente es un error de entrada y se rechaza explícitamente. No se ignora silenciosamente.
4. `[]` es un conjunto de candidatos vacío válido. No equivale a `null` y no se expande a todas las especies.
5. La normalización/validación es única y reutilizable para evitar semánticas distintas entre `filterCandidates()`, `nextCharacter()`, `retryCharacter()` y `assessIdentification()`.

## Ejemplos normativos

- `null` → todas las especies canónicas.
- `['SP-002', 'SP-001', 'SP-002']` → `['SP-002', 'SP-001']`.
- `['SP-001', 'SP-999']` → error explícito por `species_id` desconocido.
- `[]` → conjunto vacío.

## Implementación cerrada

El engine incorpora una normalización centralizada de `candidateIds`. Las listas explícitas se validan contra `dataset.speciesById`, se deduplican preservando el orden de primera aparición y mantienen el conjunto vacío como valor válido. Los IDs desconocidos producen un error explícito.

La misma semántica se reutiliza en los caminos del engine que reciben `candidateIds` directamente, evitando tratamientos divergentes entre filtrado, selección de carácter y reintento.

## Validación

Validación local realizada tras la implementación:

- `node --test tools/canonical-identification/engine.test.mjs`: **14/14 tests aprobados**.
- Los tests nuevos cubren deduplicación con orden estable, rechazo explícito de IDs desconocidos y preservación de `[]`.
- `npm.cmd run verify:botanical`: **0 advertencias y 0 errores**.

## Alcance de esta iteración

Solo robustez de `candidateIds` en el engine canónico: normalización, validación y tests de contrato.

## Explícitamente fuera de alcance

- Hallazgo E (sobrescritura silenciosa de relaciones)
- Cambios de UI
- Cambios al Master Botánico 2.0 o a las fichas canónicas
