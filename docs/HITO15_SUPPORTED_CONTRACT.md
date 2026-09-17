# Hito 15 — Contrato de `supported`

Estado: **CERRADO A NIVEL DE CONTRATO E IMPLEMENTACIÓN**. Pendiente del gate final integrado, auditoría documental final y consolidación de la rama de Hito 15 en `main`.

Este documento fija el significado normativo de `supported` en ACE — Arboris Character Evidence Engine / Motor de Evidencia por Caracteres Árboris.

## Reglas normativas

### 1. Dimensiones de evidencia independientes y evaluables

Para Hito 15, una dimensión de evidencia está identificada por su `characterId`.

Una dimensión es evaluable cuando existe para ese carácter al menos una observación con un estado explícito distinto de los estados de incertidumbre o imposibilidad de evaluación reconocidos por ACE.

Por tanto:

- dos `characterId` diferentes pueden constituir dos dimensiones independientes;
- repetir el mismo carácter no crea una dimensión adicional;
- múltiples fotografías u observaciones del mismo carácter siguen contando como una sola dimensión;
- múltiples intentos sobre el mismo carácter siguen contando como una sola dimensión;
- una observación no evaluable no constituye una dimensión evaluable.

### 2. Sin atajo por poder diagnóstico

`supported` siempre requiere al menos dos dimensiones de evidencia independientes y evaluables.

El poder diagnóstico puede utilizarse para priorizar qué carácter observar o preguntar, pero no puede reducir este requisito.

Un carácter de poder diagnóstico alto no equivale a dos dimensiones y una puntuación alta de selección no sustituye una segunda dimensión.

### 3. Variabilidad natural documentada

Una contradicción no elimina un candidato cuando existe variabilidad natural explícitamente documentada para esa combinación especie–carácter–estado y el contexto aplicable.

En ese caso, la evidencia se considera inconcluyente para ese candidato: no aporta soporte ni conflicto eliminatorio.

Si no existe una entrada de variabilidad documentada aplicable, la contradicción continúa siendo un conflicto explícito.

No existe un umbral genérico de discrepancias toleradas.

## Contrato de `supported`

`supported` requiere simultáneamente:

1. exactamente un candidato compatible;
2. al menos dos dimensiones de evidencia independientes y evaluables;
3. ausencia de un atajo que sustituya esas dimensiones por poder diagnóstico.

Si queda exactamente un candidato compatible pero existe solo una dimensión independiente y evaluable, el estado debe ser `tentative`, no `supported`.

La independencia se determina por `characterId`, no por cantidad de observaciones, fotografías, fuentes o intentos.

## Distinción entre `resolved` y evidencia evaluable

El término `resolved` posee un significado específico en `docs/HITO15_CHARACTER_RETRY_CONTRACT.md`.

En el contrato de reintento, `resolved` significa que la evidencia recibida para un carácter produjo una reducción efectiva del conjunto de candidatos. Ese estado gobierna la terminalidad y elegibilidad de reintento del carácter.

El contrato de `supported` no utiliza `resolved` como sinónimo de evidencia evaluable.

Una observación puede aportar una dimensión evaluable para `supported` aunque, en el estado concreto del conjunto de candidatos, no haya producido por sí misma una reducción adicional.

Por tanto:

- **retry lifecycle:** `resolved` = el carácter redujo candidatos;
- **support assessment:** dimensión evaluable = existe evidencia conocida/evaluable para un `characterId`.

Los dos conceptos no deben intercambiarse en código, documentación ni pruebas.

## Estados que no aportan una dimensión evaluable

Los estados de observación equivalentes a incertidumbre o imposibilidad de evaluación no cuentan como dimensiones evaluables.

ACE reconoce como tales, entre otros:

- `unknown`
- `not_observable`
- `not_applicable`
- `not_evaluated`
- `no_se`
- `no_sé`
- `no_observable`
- `no_aplica`

La respuesta honesta «no sé» es válida y no debe convertirse artificialmente en evidencia positiva o negativa.

La presencia de uno de estos estados puede constituir un intento a efectos del contrato de reintento, pero no aporta una dimensión evaluable para `supported`.

## Capa complementaria de variabilidad

ACE consume variabilidad natural y contextos mediante:

- `data/botanical/character_variability.json`
- `data/botanical/contexts.json`

Estos archivos **no forman parte de los ocho JSON derivados reproduciblemente de Master Botánico 2.0**.

Los ocho derivados reproducibles del Master son:

- `metadata.json`
- `species.json`
- `characters.json`
- `species_characters.json`
- `sources.json`
- `glossary.json`
- `photos.json`
- `model_errors.json`

`character_variability.json` y `contexts.json` constituyen una capa complementaria explícita. No modifican ni reemplazan los datos derivados del Master y no deben presentarse como exportaciones del Excel fuente.

Toda entrada de variabilidad debe ser explícita e identificable por `species_id` y `caracter_id`, asociarse a un contexto documentado cuando corresponda y conservar procedencia mediante `fuente_id`.

La ausencia de una entrada documentada nunca debe interpretarse como tolerancia implícita.

## Integridad de la capa complementaria

Al cargar el dataset, ACE debe validar que cada entrada de `character_variability.json`:

- referencia un `species_id` existente;
- referencia un `caracter_id` canónico activo;
- corresponde a una relación especie–carácter canónica existente;
- contiene `estado_alternativo`;
- utiliza un estado permitido por ese carácter cuando existe catálogo de estados;
- referencia un `contexto_id` existente cuando declara contexto;
- contiene `fuente_id`;
- referencia un `fuente_id` existente en `data/botanical/sources.json`.

`contexts.json` constituye el catálogo explícito de contextos reconocidos por esta capa.

Una referencia rota debe producir un error explícito de carga y no debe ignorarse silenciosamente.

La capa complementaria no debe utilizarse para corregir indirectamente información gobernada por Master Botánico 2.0.

## Primer caso validado

El primer caso incorporado corresponde a:

- especie: `SP-002` — *Lithraea caustica*;
- carácter: `CH-008`;
- estado alternativo documentado: `ausente`;
- contexto: `hojas_de_sombra`;
- frecuencia registrada: `baja`;
- fuente: `F-004` — registro de terreno del piloto.

Bajo ese contexto, la discrepancia documentada se trata como evidencia inconcluyente para litre, no como conflicto eliminatorio.

Sin el contexto documentado correspondiente, la misma contradicción conserva su comportamiento normal de conflicto.

La entrada está anclada a una relación especie–carácter canónica existente y a una fuente existente en `sources.json`.

## Regla ejecutable de regresión

El contrato debe estar protegido por tests automatizados.

En particular, dos observaciones evaluables del mismo `characterId` cuentan como una sola dimensión de evidencia.

Si esas observaciones dejan exactamente un candidato compatible pero no existe una segunda dimensión independiente evaluable, `assessIdentification()` debe devolver `tentative`, no `supported`.

Este comportamiento está protegido por un test de regresión de la suite canónica.

## Relación con otros contratos de Hito 15

Los hallazgos posteriores tienen contratos independientes:

- C — visible / intentado / resuelto y retry explícito: **cerrado**;
- D — normalización y validación de `candidateIds`: **cerrado**;
- E — unicidad `(species_id, caracter_id)` en relaciones computables: **cerrado**.

Este documento no redefine esos contratos.

## Separación de responsabilidades

El contrato de `supported` no determina:

- qué carácter debe preguntarse primero;
- qué interfaz debe utilizar la aplicación;
- cómo se obtendrá evidencia visual en hitos futuros;
- cómo se modelará una eventual probabilidad posterior;
- cómo se implementará gamificación;
- cómo se resolverá consenso comunitario.

Esas decisiones pertenecen a otras capas o hitos.

## Validación

La implementación debe conservar tests que demuestren como mínimo:

- variabilidad documentada → inconcluyente, no eliminación;
- misma contradicción sin contexto documentado → conflicto;
- al menos dos `characterId` independientes y evaluables para `supported`;
- repetición del mismo `characterId` → una sola dimensión;
- ausencia de atajo por poder diagnóstico;
- procedencia válida de la variabilidad mediante `fuente_id`;
- rechazo de un `fuente_id` desconocido.

La suite aislada de ACE, después de incorporar la validación de procedencia, alcanzó:

```text
tests       24
pass        24
fail         0
```

El gate integrado final debe ejecutarse nuevamente sobre el estado definitivo de la rama mediante:

```powershell
npm.cmd test
```

## Criterio de cierre

Este contrato se considera satisfecho cuando ACE y sus pruebas garantizan simultáneamente que:

- un único candidato no implica por sí solo `supported`;
- `supported` requiere dos o más `characterId` independientes con evidencia evaluable;
- repetir un carácter no incrementa el número de dimensiones;
- `resolved` conserva exclusivamente el significado definido por el contrato de reintento;
- el poder diagnóstico no reduce el umbral;
- la incertidumbre explícita no cuenta como dimensión evaluable;
- la variabilidad natural solo evita eliminación cuando está documentada y es aplicable;
- las referencias de la capa complementaria se validan al cargar el dataset;
- cada entrada de variabilidad conserva procedencia mediante una fuente existente;
- una contradicción no documentada conserva su comportamiento normal de conflicto.

El contrato queda cerrado para Hito 15 a nivel de implementación y pruebas aisladas. El cierre general del hito permanece sujeto al gate integrado final, la auditoría documental restante y la consolidación de la rama en `main`.
