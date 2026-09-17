# Hito 15 — Unicidad de relaciones especie–carácter (Hallazgo E)

Estado: decisión de producto cerrada. Pendiente de implementación en el loader canónico.

## Hallazgo original (auditoría)

`buildRelationIndex()` construye un `Map` por especie y almacena cada relación con `set(characterId, ...)`. Si `species_characters.json` contiene más de una fila con la misma clave compuesta `(species_id, caracter_id)`, una relación posterior reemplaza silenciosamente a la anterior.

La carga puede completar sin advertencia aunque el dataset de entrada contenga relaciones duplicadas o contradictorias.

## Decisiones cerradas

1. La clave compuesta `(species_id, caracter_id)` debe ser única en las relaciones canónicas computables.
2. Cualquier duplicado debe hacer fallar explícitamente la carga del dataset.
3. Un duplicado se rechaza incluso si ambas filas son idénticas. La duplicación en sí misma viola el contrato de unicidad.
4. No se fusionan estados, fuentes, notas ni otros campos de relaciones duplicadas.
5. No se aplica la política `last write wins` ni `first write wins`.
6. El error debe identificar al menos `species_id` y `caracter_id` involucrados para permitir localizar el dato defectuoso.

## Ejemplo normativo

Entrada:

- `SP-002 / CH-008`
- `SP-002 / CH-008`

Resultado esperado:

`error: duplicate species-character relation SP-002 / CH-008`

## Estrategia de prueba

El Master Botánico 2.0 vigente no debe modificarse para fabricar el caso defectuoso. El contrato se probará con un dataset temporal derivado del dataset canónico al que se agregará deliberadamente una relación duplicada.

El test debe demostrar primero el comportamiento defectuoso actual: la carga acepta el duplicado y sobrescribe silenciosamente una de las relaciones. Después de implementar el control de unicidad, el mismo caso debe producir un error explícito.

## Alcance de esta iteración

Solo la unicidad de relaciones `(species_id, caracter_id)` que ingresan al índice canónico usado por el engine.

## Explícitamente fuera de alcance

- Cambios al contenido del Master Botánico 2.0 vigente
- Política de duplicados para otros índices o archivos, salvo que se abra un hallazgo separado
- Cambios de UI
- Ambigüedad de rutas `species/` versus `data/species/`
