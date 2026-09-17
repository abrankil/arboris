# Hito 15 — Cierre de ACE, motor canónico de identificación

Fecha de cierre técnico: 2026-09-17

Estado: cierre técnico validado; la rama de Hito 15 incorpora el estado actualizado de `main` y aún no ha sido fusionada en `main`.

## 1. Objetivo

Consolidar ACE — Arboris Character Evidence Engine / Motor de Evidencia por Caracteres Árboris — como motor canónico de identificación botánica basado en acumulación de evidencia por caracteres discretos.

ACE aplica reglas explícitas y reproducibles para compatibilidad de evidencia, filtrado de candidatos, selección de caracteres, preservación de incertidumbre, reintento explícito, variabilidad natural documentada y evaluación del nivel de soporte de una identificación.

ACE no realiza clasificación directa de una fotografía completa.

## 2. Fuente de datos

ACE utiliza como base principal los datos botánicos canónicos derivados reproduciblemente de Master Botánico 2.0.

Los ocho JSON reproducibles derivados del Master mantienen su propia validación de equivalencia.

La variabilidad natural y sus contextos se mantienen en una capa complementaria explícita:

- `data/botanical/character_variability.json`
- `data/botanical/contexts.json`

Estos archivos no son exportaciones de Master Botánico 2.0 y no modifican ni reemplazan `data/botanical/species_characters.json`.

Toda entrada de variabilidad debe conservar procedencia explícita mediante un `fuente_id` existente en `data/botanical/sources.json`.

El conocimiento botánico no está hardcodeado en ACE.

## 3. Contratos cerrados

### A/B — Evaluación `supported` y variabilidad natural

Contrato normativo:

- `docs/HITO15_SUPPORTED_CONTRACT.md`

Reglas cerradas:

- `supported` requiere exactamente un candidato compatible.
- Requiere al menos dos dimensiones de evidencia independientes y evaluables.
- La independencia se determina por `characterId`.
- Repetir evidencia, fotografías o intentos del mismo carácter no crea dimensiones adicionales.
- Una observación no evaluable no constituye una dimensión evaluable.
- El poder diagnóstico puede priorizar caracteres, pero no reduce el mínimo requerido para `supported`.
- Una contradicción cubierta por variabilidad natural documentada se considera inconcluyente para ese candidato.
- Una contradicción sin variabilidad documentada aplicable continúa siendo un conflicto explícito.
- No existe un umbral genérico de discrepancias toleradas.

Primer caso incorporado:

- especie: `SP-002` — `Lithraea caustica`
- carácter: `CH-008`
- estado alternativo: `ausente`
- contexto: `hojas_de_sombra`
- frecuencia: `baja`
- fuente: `F-004` — registro de terreno del piloto

La entrada está anclada a una relación especie–carácter canónica existente. La observación de terreno complementa la base canónica; no reemplaza bibliografía ni modifica por sí sola las relaciones derivadas del Master.

### C — Estado de caracteres y reintentos

Contrato:

- `docs/HITO15_CHARACTER_RETRY_CONTRACT.md`

ACE distingue entre carácter visible, intentado y resuelto.

Un carácter intentado pero no resuelto no vuelve a ofrecerse automáticamente. Puede solicitarse nuevamente mediante un retry explícito y no existe un límite de reintentos.

Un carácter es `resolved` para efectos de retry cuando su evidencia reduce efectivamente el conjunto de candidatos. Un carácter resuelto es terminal y no puede reintentarse.

Este concepto de `resolved` es distinto de una dimensión `evaluable` utilizada para determinar `supported`.

### D — Robustez de `candidateIds`

Contrato:

- `docs/HITO15_CANDIDATE_IDS_CONTRACT.md`

Reglas:

- `null` representa todas las especies canónicas.
- Las listas explícitas se deduplican conservando el orden de primera aparición.
- Un ID desconocido produce un error explícito.
- `[]` representa correctamente un conjunto vacío.
- La normalización es compartida por las operaciones del motor.
- No se realiza conversión histórica `SP001` → `SP-001` dentro del motor canónico.

### E — Unicidad de relaciones especie–carácter

Contrato:

- `docs/HITO15_RELATION_UNIQUENESS_CONTRACT.md`

La pareja `(species_id, caracter_id)` debe ser única entre las relaciones canónicas computables.

Cualquier duplicado es un error fatal, incluso cuando ambas relaciones sean idénticas. ACE no aplica merge, last-write-wins ni first-write-wins.

## 4. Integridad de la capa complementaria

Al cargar `character_variability.json`, ACE valida que cada entrada:

- utilice un `species_id` existente;
- utilice un `caracter_id` canónico activo;
- corresponda a una relación especie–carácter canónica existente;
- contenga `estado_alternativo`;
- utilice un estado permitido por el carácter;
- utilice un `contexto_id` existente cuando corresponda;
- contenga `fuente_id`;
- utilice un `fuente_id` existente en `sources.json`.

Las referencias rotas producen errores explícitos y no se ignoran silenciosamente.

El caso `SP-002` / `CH-008` utiliza `fuente_id: F-004`.

## 5. Incertidumbre

ACE conserva explícitamente respuestas de incertidumbre o imposibilidad de evaluación.

Estas respuestas no se transforman artificialmente en evidencia positiva o negativa y no eliminan candidatos por sí solas.

La respuesta «no sé» es válida.

## 6. Validación automatizada

La suite final de ACE, después de incorporar la validación de procedencia de la variabilidad, alcanza:

```text
tests       24
pass        24
fail         0
```

La suite cubre, entre otros:

- carga del dataset canónico;
- carga de contextos y variabilidad;
- procedencia de variabilidad mediante `fuente_id`;
- rechazo de una fuente de variabilidad desconocida;
- rechazo de relaciones especie–carácter duplicadas;
- rechazo de especies desconocidas en variabilidad;
- rechazo de caracteres desconocidos o inactivos;
- rechazo de variabilidad sin relación canónica;
- rechazo de estados alternativos inválidos;
- rechazo de contextos desconocidos;
- preservación de incertidumbre;
- filtrado de candidatos;
- normalización de `candidateIds`;
- rechazo de candidatos desconocidos;
- manejo de lista candidata vacía;
- selección de caracteres;
- no repetición automática de caracteres intentados;
- retry explícito;
- terminalidad de caracteres resueltos;
- variabilidad natural documentada;
- contradicción sin contexto documentado;
- independencia de dimensiones por `characterId`;
- estados cautelosos de evaluación.

El test de regresión crítico confirma que repetir un mismo `characterId` no puede contar como dos dimensiones independientes.

## 7. Validación integrada

El gate completo del repositorio fue ejecutado después de incorporar el estado actualizado de `main`.

Resultados registrados en el cierre:

- validación Master Botánico 2.0: 0 advertencias, 0 errores;
- validación de IDs: 6 especies, 0 conflictos;
- fichas canónicas: 6 sincronizadas, 0 advertencias, 0 errores;
- acceso a datos: 5/5 tests;
- base de referencia: 6/6 tests;
- Arboris Scene Compiler: 7/7 tests.

La suite aislada de ACE fue reejecutada después de la corrección de procedencia y alcanzó 24/24 tests, 0 fallos.

Antes de consolidar la rama en `main`, el gate integrado debe ejecutarse nuevamente sobre el estado final de archivos de Hito 15.

## 8. Integración con `main`

La rama:

`hito15-close-canonical-engine`

incorporó el estado actualizado de `origin/main`.

El merge más reciente de `main` hacia la rama fue registrado antes de estas correcciones finales de auditoría.

La rama todavía no se considera fusionada definitivamente en `main`.

El cierre en Git requiere consolidar la rama mediante el mecanismo de integración correspondiente al repositorio después de completar la auditoría y ejecutar nuevamente los gates finales.

## 9. Archivos locales fuera del cierre

Los archivos locales o no rastreados de diagnóstico, experimentación o respaldo no forman parte automáticamente del cierre de Hito 15.

No deben incorporarse al commit final salvo decisión explícita.

El stash local existente tampoco debe aplicarse indiscriminadamente; cualquier recuperación debe ser selectiva.

## 10. Fuera de alcance

No forman parte de Hito 15:

- implementación de la aplicación final;
- interfaz gráfica del retry;
- clasificación directa mediante visión por computador;
- incorporación de CV al motor ACE;
- modelos probabilísticos posteriores;
- consenso comunitario;
- gamificación;
- mecanismo de Data Quality Grade;
- decisión definitiva sobre una arquitectura probabilística;
- modificación de la guía general de vocabulario.

ACE es actualmente un motor basado en evidencia explícita por caracteres discretos.

La visión artificial podrá producir evidencia para caracteres en una etapa posterior, pero no forma parte del motor cerrado en Hito 15.

## 11. Decisiones técnicas cerradas

Hito 15 deja cerradas las siguientes decisiones:

- el motor canónico se denomina ACE — Arboris Character Evidence Engine;
- ACE opera mediante acumulación de evidencia por caracteres discretos;
- el conocimiento botánico permanece fuera del código del motor;
- Master Botánico 2.0 y sus datasets derivados constituyen la base botánica principal;
- la variabilidad natural y sus contextos se mantienen en una capa complementaria explícita;
- toda entrada de variabilidad debe conservar procedencia mediante una fuente existente;
- las contradicciones cubiertas por variabilidad documentada no eliminan automáticamente candidatos;
- las contradicciones no documentadas continúan siendo conflictos explícitos;
- no existe tolerancia genérica a un número de discrepancias;
- `supported` requiere exactamente un candidato compatible y al menos dos dimensiones independientes y evaluables;
- repetir un mismo `characterId` no crea dimensiones adicionales;
- el poder diagnóstico no reduce el umbral de `supported`;
- la incertidumbre no constituye evidencia positiva ni negativa;
- los caracteres intentados pero no resueltos pueden reintentarse explícitamente;
- los reintentos no tienen límite;
- los caracteres resueltos son terminales para retry;
- `candidateIds` tiene comportamiento determinista y validado;
- las relaciones especie–carácter canónicas deben ser únicas;
- toda entrada de variabilidad debe estar anclada a una relación canónica existente;
- las referencias inválidas de la capa complementaria producen errores explícitos;
- la UI, CV y la guía general de vocabulario permanecen fuera del alcance del hito.

## 12. Auditoría final

### AUDITORÍA

Los contratos A/B, C, D y E están implementados y protegidos por tests.

La corrección de independencia por `characterId` está cubierta por regresión.

La capa complementaria valida relaciones, contextos y procedencia.

La suite aislada de ACE alcanza 24/24 tests y 0 fallos.

La rama contiene el estado actualizado de `main`, pero las correcciones finales de auditoría todavía deben pasar el gate integrado antes de la consolidación final.

### INCONSISTENCIAS

Las inconsistencias funcionales detectadas durante la auditoría de cierre fueron corregidas dentro del alcance de Hito 15.

La guía general de vocabulario permanece fuera de este cierre.

La rama aún no está consolidada definitivamente en `main`.

### VACÍOS / OMISIONES

La interfaz de retry no forma parte de Hito 15.

La aplicación final todavía no implementa ACE.

CV permanece fuera del alcance del motor actual.

Una ampliación futura de la capa de variabilidad deberá mantener procedencia explícita y validación estructural.

### REDUNDANCIAS

La duplicación accidental entre el README raíz y `tools/canonical-identification/README.md` fue eliminada durante la auditoría final.

Los ocho JSON reproducibles derivados del Master se distinguen explícitamente de `character_variability.json` y `contexts.json`.

ACE no contiene conocimiento botánico duplicado mediante reglas hardcodeadas.

El ruido de formato detectado durante la edición de documentación fue retirado de los documentos corregidos.

## 13. Criterio de cierre

El contrato funcional y la implementación de ACE están técnicamente validados mediante 24/24 pruebas aisladas.

El cierre de Hito 15 requiere todavía:

1. terminar la auditoría documental y de código;
2. ejecutar nuevamente los gates finales sobre el estado definitivo de la rama;
3. verificar el protocolo de auditoría del PR;
4. consolidar la rama en `main`.

No se inicia Hito 16 antes de completar esa consolidación.

Estado actual: cierre técnico de ACE validado; cierre final de Hito 15 pendiente de auditoría final, gates y consolidación en `main`.
