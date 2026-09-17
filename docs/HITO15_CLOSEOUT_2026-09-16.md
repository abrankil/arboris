# Hito 15 — Cierre del motor canónico de identificación

Fecha de cierre técnico: 2026-09-17

Estado: cierre técnico validado; integración con `main` en proceso de cierre.

## Objetivo

Consolidar un motor canónico de identificación botánica que opere directamente sobre los datos canónicos de Árboris, preserve la incertidumbre y aplique reglas explícitas y reproducibles para filtrado, selección de caracteres y evaluación de resultados.

## Fuente de datos

El motor utiliza como base los datos canónicos derivados del Master Botánico 2.0.

Los ocho JSON reproducibles derivados del Master mantienen su propia validación de equivalencia.

La variabilidad natural utilizada por el motor se representa mediante una capa canónica complementaria:

- `data/botanical/character_variability.json`
- `data/botanical/contexts.json`

Estos archivos no son exportaciones del Master Botánico 2.0 y no modifican ni reemplazan `species_characters.json`.

El contrato normativo de esta capa está documentado en:

- `docs/HITO15_SUPPORTED_CONTRACT.md`

## Contratos cerrados

### A/B — Evaluación `supported` y variabilidad natural

Quedaron establecidas las siguientes reglas:

- `supported` requiere un único candidato restante.
- Requiere al menos dos dimensiones diagnósticas independientes y resueltas.
- Repetir evidencia del mismo carácter no crea una dimensión diagnóstica adicional.
- No existe atajo por poder diagnóstico de un único carácter.
- Una contradicción cubierta por variabilidad natural documentada se considera inconcluyente para ese candidato.
- Una contradicción sin excepción documentada continúa siendo un conflicto explícito.
- No existe un umbral genérico de discrepancias toleradas.

Primer caso incorporado:

- especie: `SP-002` — `Lithraea caustica`
- carácter: `CH-008`
- estado alternativo: `ausente`
- contexto: `hojas_de_sombra`
- frecuencia: `baja`

### C — Estado de caracteres y reintentos

Contrato:

- `docs/HITO15_CHARACTER_RETRY_CONTRACT.md`

El motor distingue entre carácter visible, intentado y resuelto.

Un carácter intentado pero no resuelto no se vuelve a ofrecer automáticamente. Puede reintentarse explícitamente. Un carácter resuelto es terminal y no puede reintentarse.

### D — Robustez de `candidateIds`

Contrato:

- `docs/HITO15_CANDIDATE_IDS_CONTRACT.md`

Reglas:

- `null` representa todas las especies canónicas.
- Las listas explícitas se deduplican conservando el primer orden observado.
- Un ID desconocido produce error explícito.
- `[]` representa correctamente un conjunto vacío.
- La normalización es compartida por las operaciones del motor.
- No se realiza conversión histórica `SP001` → `SP-001` dentro del motor canónico.

### E — Unicidad de relaciones especie–carácter

Contrato:

- `docs/HITO15_RELATION_UNIQUENESS_CONTRACT.md`

La pareja `(species_id, caracter_id)` debe ser única entre las relaciones canónicas computables.

Cualquier duplicado es un error fatal, incluso cuando ambas relaciones sean idénticas. El motor no aplica merge, last-write-wins ni first-write-wins.

## Validación integrada

Gate ejecutado:

`npm.cmd test`

Resultado:

- validación Master Botánico 2.0: 0 advertencias, 0 errores
- validación de IDs: 6 especies, 0 conflictos
- fichas canónicas: 6 sincronizadas, 0 advertencias, 0 errores
- acceso a datos: 5/5 tests
- base de referencia: 6/6 tests
- motor canónico de identificación: 15/15 tests
- Arboris Scene Compiler: 7/7 tests

El gate integrado finalizó sin fallos.

## Resultado del Hito 15

El motor canónico queda técnicamente validado respecto de los contratos A/B, C, D y E.

El cierre definitivo en Git queda condicionado únicamente a completar la integración actualmente abierta con `main`, revisar el estado final del repositorio y registrar el merge correspondiente.

No se inicia Hito 16 antes de completar ese cierre de integración.