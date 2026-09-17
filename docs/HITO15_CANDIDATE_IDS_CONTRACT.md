# Hito 15 — Contrato de `candidateIds` (Hallazgo D)

Estado: decisión de producto cerrada. Pendiente de implementación en el engine.

## Hallazgo original (auditoría)

`filterCandidates()` acepta `candidateIds` como conjunto inicial sin normalizarlo ni validarlo. Esto permite que IDs duplicados se propaguen y que IDs inexistentes entren al flujo de identificación. El mismo argumento circula además por `nextCharacter()`, `retryCharacter()` y `assessIdentification()`.

## Decisiones cerradas

1. `null` mantiene su significado actual: usar todas las especies canónicas del dataset.
2. Una lista explícita se deduplica preservando el orden de la primera aparición.
3. Un `species_id` inexistente es un error de entrada y debe rechazarse explícitamente. No se ignora silenciosamente.
4. `[]` es un conjunto de candidatos vacío válido. No equivale a `null` y no debe expandirse a todas las especies.
5. La normalización/validación debe ser única y reutilizable para evitar semánticas distintas entre `filterCandidates()`, `nextCharacter()`, `retryCharacter()` y `assessIdentification()`.

## Ejemplos normativos

- `null` → todas las especies canónicas.
- `['SP-002', 'SP-001', 'SP-002']` → `['SP-002', 'SP-001']`.
- `['SP-001', 'SP-999']` → error explícito por `species_id` desconocido.
- `[]` → conjunto vacío.

## Alcance de esta iteración

Solo robustez de `candidateIds` en el engine canónico: normalización, validación y tests de contrato.

## Explícitamente fuera de alcance

- Hallazgo E (sobrescritura silenciosa de relaciones)
- Cambios de UI
- Cambios al Master Botánico 2.0 o a las fichas canónicas
