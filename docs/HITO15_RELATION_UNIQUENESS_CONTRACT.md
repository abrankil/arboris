# Hito 15 — Unicidad de relaciones especie–carácter (Hallazgo E)

Estado: **CERRADO** para Hito 15 a nivel de contrato, implementación y pruebas aisladas.

## Hallazgo original (auditoría)

`buildRelationIndex()` construía un `Map` por especie y almacenaba cada relación mediante `set(characterId, ...)`.

Si `species_characters.json` contenía más de una fila con la misma clave compuesta `(species_id, caracter_id)`, una relación posterior reemplazaba silenciosamente a la anterior.

La carga podía completarse sin advertencia aunque el dataset de entrada contuviera relaciones duplicadas o contradictorias.

## Decisiones cerradas

1. La clave compuesta `(species_id, caracter_id)` debe ser única entre las relaciones canónicas computables que consume ACE.
2. Cualquier duplicado hace fallar explícitamente la carga del dataset.
3. Un duplicado se rechaza incluso si ambas filas son idénticas. La duplicación en sí misma viola el contrato de unicidad.
4. ACE no fusiona estados, fuentes, notas ni otros campos de relaciones duplicadas.
5. No se aplica una política `last write wins` ni `first write wins`.
6. El error debe identificar `species_id` y `caracter_id` para permitir localizar el dato defectuoso.

## Ejemplo normativo

Entrada:

```text
SP-002 / CH-008
SP-002 / CH-008
```

Resultado esperado:

```text
error: duplicate species-character relation SP-002 / CH-008
```

La carga debe detenerse. La relación existente no se sobrescribe ni se fusiona con la duplicada.

## Implementación cerrada

`buildRelationIndex()` comprueba si el mapa correspondiente a la especie ya contiene el `characterId` antes de insertar una relación.

La lógica es:

```text
relación (species_id, caracter_id)
              ↓
       ¿la clave ya existe?
              ↓
       sí → error explícito
       no → insertar
```

Si la clave compuesta ya existe, ACE lanza un error explícito con ambos identificadores y detiene la carga.

Esto garantiza que el índice utilizado posteriormente por ACE no pueda ocultar una duplicación presente en los datos de entrada.

## Alcance de la unicidad

Este contrato se aplica a las relaciones especie–carácter canónicas computables que ingresan al índice utilizado por ACE.

La clave de unicidad es exactamente:

```text
(species_id, caracter_id)
```

No se crean claves alternativas basadas en estado esperado, fuente, nota, contexto, frecuencia u orden de aparición.

Dos relaciones con la misma pareja `(species_id, caracter_id)` son duplicadas aunque difieran en otros campos.

## Estrategia de prueba

El Master Botánico 2.0 vigente no se modifica para fabricar el caso defectuoso.

El test utiliza un dataset temporal derivado del dataset canónico y agrega deliberadamente una relación duplicada.

El escenario de regresión es:

```text
dataset con relación duplicada
              ↓
   loadCanonicalDataset()
              ↓
    error explícito
```

El test específico confirma el rechazo de una relación duplicada, incluyendo el caso `SP-001 / CH-001`.

La prueba no depende de modificar el Master Botánico 2.0 vigente.

## Relación con la autoridad botánica

Este contrato no convierte `species_characters.json` en una fuente editorial independiente.

`species_characters.json` forma parte de los datos reproducibles derivados de Master Botánico 2.0. Si se detecta un problema de contenido botánico gobernado por el Master, su corrección corresponde al proceso editorial del Master y a la regeneración posterior de sus derivados.

La función de este contrato es distinta: garantizar que una violación estructural de unicidad no quede oculta por la representación interna del índice que consume ACE.

## Separación de responsabilidades

Este contrato protege la integridad del índice de relaciones utilizado por ACE.

No determina:

- qué relación botánica es científicamente correcta;
- cómo seleccionar el siguiente carácter;
- cómo evaluar `supported`;
- cómo gestionar reintentos;
- cómo normalizar `candidateIds`;
- cómo adquirir evidencia;
- cómo funciona la interfaz.

La detección de un duplicado es una validación estructural. No constituye una decisión editorial sobre cuál de las relaciones duplicadas debería conservarse.

## Validación

El comportamiento está protegido por la suite canónica de ACE.

La validación específica cubre:

- rechazo de relaciones duplicadas;
- rechazo incluso cuando las relaciones duplicadas son idénticas;
- identificación explícita de `species_id`;
- identificación explícita de `caracter_id`;
- detención de la carga ante la violación del contrato.

La suite aislada actual de ACE, después de las correcciones finales de auditoría, alcanza:

```text
tests       24
pass        24
fail         0
```

El gate integrado debe ejecutarse nuevamente sobre el estado definitivo de la rama mediante:

```powershell
npm.cmd test
```

## Alcance de esta iteración

Esta iteración comprende únicamente la unicidad de relaciones:

```text
(species_id, caracter_id)
```

que ingresan al índice canónico utilizado por ACE.

El objetivo es impedir sobrescrituras silenciosas y garantizar una carga determinista de las relaciones que consume el motor.

## Explícitamente fuera de alcance

Quedan fuera de este contrato:

- cambios al contenido del Master Botánico 2.0 vigente;
- política general de duplicados para otros índices o archivos, salvo que se abra un hallazgo específico;
- cambios de UI;
- ambigüedad de rutas `species/` versus `data/species/`;
- nuevos mecanismos de identificación.

## Criterio de cierre

El contrato se considera satisfecho cuando ACE garantiza simultáneamente que:

- `(species_id, caracter_id)` es una clave única para las relaciones canónicas computables;
- cualquier duplicado produce un error explícito;
- los duplicados idénticos también son rechazados;
- ninguna relación posterior sobrescribe silenciosamente una anterior;
- ACE no fusiona relaciones duplicadas;
- el error identifica `species_id` y `caracter_id`;
- el caso está protegido por tests automatizados;
- el Master Botánico 2.0 no necesita modificarse para ejecutar la prueba de regresión.

Estado final del contrato: **CERRADO para Hito 15**. El cierre general del hito permanece sujeto a la auditoría restante, el gate integrado final y la consolidación de la rama en `main`.
