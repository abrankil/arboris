# Hito 15 — Unicidad de relaciones especie–carácter (Hallazgo E)

Estado: **CERRADO**. Decisión de producto e implementación del loader canónico validadas.

## Hallazgo original (auditoría)

`buildRelationIndex()` construía un `Map` por especie y almacenaba cada relación con `set(characterId, ...)`. Si `species_characters.json` contenía más de una fila con la misma clave compuesta `(species_id, caracter_id)`, una relación posterior reemplazaba silenciosamente a la anterior.

La carga podía completar sin advertencia aunque el dataset de entrada contuviera relaciones duplicadas o contradictorias.

## Decisiones cerradas

1. La clave compuesta `(species_id, caracter_id)` debe ser única en las relaciones canónicas computables.
2. Cualquier duplicado hace fallar explícitamente la carga del dataset.
3. Un duplicado se rechaza incluso si ambas filas son idénticas. La duplicación en sí misma viola el contrato de unicidad.
4. No se fusionan estados, fuentes, notas ni otros campos de relaciones duplicadas.
5. No se aplica la política `last write wins` ni `first write wins`.
6. El error identifica `species_id` y `caracter_id` involucrados para permitir localizar el dato defectuoso.

## Ejemplo normativo

Entrada:

- `SP-002 / CH-008`
- `SP-002 / CH-008`

Resultado esperado:

`error: duplicate species-character relation SP-002 / CH-008`

## Implementación cerrada

`buildRelationIndex()` comprueba si el mapa de la especie ya contiene el `characterId` antes de insertar una relación. Si la clave compuesta ya existe, lanza un error explícito con ambos identificadores y detiene la carga. La relación existente no se sobrescribe ni se fusiona con la duplicada.

## Estrategia de prueba

El Master Botánico 2.0 vigente no se modificó para fabricar el caso defectuoso. El test usa un dataset temporal derivado del dataset canónico y agrega deliberadamente una relación duplicada.

Antes de la implementación, el test reprodujo el hallazgo: la carga aceptaba el duplicado y no producía el rechazo esperado. Tras implementar el control de unicidad, el mismo caso queda rechazado explícitamente.

## Validación

Validación local realizada tras la implementación:

- `node --test tools/canonical-identification/engine.test.mjs`: **15/15 tests aprobados**.
- El test específico confirma el rechazo de una relación duplicada `SP-001 / CH-001`.
- `npm.cmd run verify:botanical`: **0 advertencias y 0 errores**.

## Alcance de esta iteración

Solo la unicidad de relaciones `(species_id, caracter_id)` que ingresan al índice canónico usado por el engine.

## Explícitamente fuera de alcance

- Cambios al contenido del Master Botánico 2.0 vigente
- Política de duplicados para otros índices o archivos, salvo que se abra un hallazgo separado
- Cambios de UI
- Ambigüedad de rutas `species/` versus `data/species/`
