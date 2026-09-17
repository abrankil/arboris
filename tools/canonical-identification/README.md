# ACE — Arboris Character Evidence Engine
Un carácter queda resolved para efectos de retry cuando su evidencia reduce efectivamente el conjunto de candidatos. En ese caso deja de ser elegible para retry.

Este concepto de resolved es deliberadamente distinto de una dimensión evaluable utilizada para determinar supported.

## candidateIds

Cuando no se proporciona candidateIds, ACE parte del conjunto canónico de especies.

Una lista explícita:

- elimina duplicados conservando el orden de primera aparición;
- rechaza explícitamente identificadores de especie desconocidos;
- acepta [] como conjunto candidato vacío válido.

No se realizan conversiones históricas o implícitas de identificadores.

## Unicidad de relaciones

Entre las relaciones canónicas computables, la combinación:

(species_id, caracter_id)

debe ser única.

Cualquier duplicado es un error fatal de carga, incluso si ambas filas contienen exactamente los mismos valores.

## Integridad de la capa complementaria

Al cargar character_variability.json, ACE comprueba que:

- species_id corresponda a una especie existente;
- caracter_id corresponda a un carácter activo;
- exista la relación canónica especie–carácter;
- estado_alternativo sea un estado permitido para el carácter;
- contexto_id, cuando exista, corresponda a un contexto registrado;
- fuente_id esté presente y corresponda a una fuente existente.

Las referencias rotas producen errores explícitos y no se ignoran silenciosamente.

## Pruebas

Desde la raíz del repositorio:

node --test tools/canonical-identification/engine.test.mjs

Al cierre de esta corrección de Hito 15, la suite contiene 24 pruebas automatizadas.

## Fuera de alcance

ACE no implementa UI, clasificación visual de fotografías, extracción automática de caracteres mediante visión artificial, SQLite, sincronización ni política final de descubrimiento.

La visión artificial puede producir evidencia para caracteres en una etapa posterior, pero no sustituye las reglas epistemológicas y de compatibilidad de ACE.

ACE tampoco constituye la autoridad botánica del proyecto: consume datos y evidencia estructurada y aplica sobre ellos los contratos del motor.