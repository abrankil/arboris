# Árboris — Nota de investigación: ASC y agente de desarrollo

**Estado:** nota de investigación / no normativa  
**Fecha:** 17 septiembre 2026  
**Ámbito:** ASC v0.1, fixture experimental MAP-001, GRRP v0.1 / ENV-0016, pruebas controladas de Claude como agente de desarrollo, investigación conceptual sobre `ASC_VOCABULARY_GUIDE.md`.

Este documento no reemplaza ninguna fuente normativa. No modifica el significado de `docs/ARBORIS_SCENE_COMPILER.md`, `docs/ASC_V0_1_EXECUTABLE_SPEC.md`, `docs/ASC_VOCABULARY_GUIDE.md` ni `docs/GRRP_V0_1_SPEC.md`. Registra hallazgos de un ciclo de investigación y pruebas controladas, distinguiendo explícitamente su categoría epistémica. No cierra ningún `OPEN` normativo ni crea autoridad, protocolo o estado nuevo.

## Disciplina de categorías

Cada hallazgo de este documento pertenece a exactamente una de estas categorías. Ninguna categoría se eleva a otra dentro de este documento:

- **HECHO RESPALDADO** — verificado directamente contra código, tests o documentos normativos existentes.
- **RESULTADO OBSERVADO** — resultado concreto de una ejecución o prueba controlada realizada en este ciclo.
- **INTERPRETACIÓN** — lectura razonada de fuentes existentes, sin evidencia ejecutable directa.
- **HIPÓTESIS DE DISEÑO** — propuesta de diseño no implementada, sujeta a revisión humana.
- **UNRESOLVED RESEARCH QUESTION** — pregunta de investigación explícitamente sin resolver en este ciclo.

## 1. ASC v0.1 — estado verificado

**HECHO RESPALDADO.** ASC v0.1 es un compilador `compile-only` con esquema fijo de 14 claves (`version`, `executionMode`, `testId`, `objective`, `authorizedSources`, `structuralContract`, `mandatoryRelations`, `open`, `doNotInfer`, `prohibited`, `artisticFreedom`, `cameraFormat`, `readingPriorities`, `validationCriteria`), validación fail-closed que rechaza claves desconocidas, implementado en `tools/asc/compile_asc.mjs` con tests en `tools/asc/compile_asc.test.mjs`.

**HECHO RESPALDADO.** ASC v0.1 no es un ejecutor. No genera geometría, raster, celdas ni assets. Su salida es texto compilado a partir de un contrato JSON de entrada.

## 2. Fixture estructural experimental MAP-001

**RESULTADO OBSERVADO.** Se creó `tools/asc/fixtures/map-001-structural.json`, conforme al esquema ASC v0.1, citando `docs/SPATIAL_MODEL.md` y `docs/MAP_TOPOLOGY_SYSTEM.md` para cada elemento estructural, obligatorio y `OPEN`. El fixture no incluye `lateralPorts`, no resuelve `routeShape` y no contiene raster ni geometría.

**RESULTADO OBSERVADO.** La verificación local (entorno de sandbox, no el repositorio real) mostró: 7/7 tests existentes en PASS; diff de determinismo IDÉNTICO entre corridas repetidas; coincidencia exacta de claves de esquema; los elementos `OPEN` del fixture se preservan sin resolución en la salida compilada.

**INTERPRETACIÓN.** Este resultado indica que el fixture es compatible con el esquema y comportamiento actuales de ASC v0.1, sin indicar que el fixture sea definitivo o represente la única forma válida de estructurar MAP-001.

**HECHO RESPALDADO.** El fixture no congela ni cierra el diseño de MAP-001. `MAP-001` sigue gobernado por `docs/SPATIAL_MODEL.md` y `docs/MAP_TOPOLOGY_SYSTEM.md`.

## 3. GRRP v0.1 — reconciliación con el sistema de referencias existente

**HECHO RESPALDADO.** `docs/ENVIRONMENT_REFERENCE_PROTOCOL.md` y `docs/references/environments/manifest.csv` constituían, antes de este ciclo, un sistema de registro de referencias ya existente y declarado "provisionalmente congelado" (§14 de `ENVIRONMENT_REFERENCE_PROTOCOL.md`), con esquema y vocabulario de estado propios (`collected | reviewed | selected | rejected | archived`).

**INTERPRETACIÓN.** La versión inicial de GRRP v0.1 (concepto "GRRC Record" de 14 campos) duplicaba parcialmente ese esquema en lugar de reutilizarlo, lo que constituía una fuente de conflicto de autoridad, no una simple diferencia de nomenclatura.

**RESULTADO OBSERVADO.** `docs/GRRP_V0_1_SPEC.md` fue iterado dos veces en este ciclo, exclusivamente sobre sí mismo, para: eliminar el concepto "GRRC Record"; hacer que GRRP lea filas de `manifest.csv` directamente por `referenceId`; introducir un artefacto mínimo nuevo, "Implementation Authorization" (5 campos: `referenceId`, `target`, `allowedInfluence`, `forbiddenInference`, autorización explícita), como único artefacto nuevo de GRRP; separar la puerta PROPOSE (satisfecha por `reviewed` o `selected`) de la puerta IMPLEMENT (9 condiciones simultáneas, incluida una Implementation Authorization externa y válida); documentar que GRRP no puede autoautorizarse.

**HECHO RESPALDADO.** Ninguna de las dos iteraciones modificó `docs/ENVIRONMENT_REFERENCE_PROTOCOL.md`, `docs/references/environments/manifest.csv`, ASC ni MAP-001.

**INTERPRETACIÓN.** El resultado converge hacia un modelo donde GRRP gobierna cómo se usa una referencia ya registrada, y el sistema de referencias existente sigue siendo la única fuente de verdad sobre qué referencias existen y su estado.

## 4. Primer test real de GRRP — ENV-0016

**RESULTADO OBSERVADO.** Se ejecutó GRRP v0.1 (rama PROPOSE) contra una fila real de `manifest.csv`, seleccionada por criterio objetivo (`status = reviewed` AND `pilotRelevance = core`), no por sugerencia previa. La fila seleccionada fue `ENV-0016`. Su campo `artUse` ya vinculaba la referencia con el rasgo de estero de MAP-001 antes de este ciclo; ese vínculo no fue inventado en este ciclo.

**HECHO RESPALDADO.** El test fue estrictamente de lectura: no se creó ninguna Implementation Authorization real, ningún VIR, ni se modificó ningún archivo.

**RESULTADO OBSERVADO.** El test permaneció en la rama PROPOSE (estado `reviewed`), consistente con la regla de que `reviewed` habilita PROPOSE pero no IMPLEMENT.

## 5. Prueba controlada de Claude como agente de desarrollo ASC

**RESULTADO OBSERVADO — PASS.** En un ciclo de prueba controlada, Claude operó como agente de desarrollo frente a ASC v0.1 (lectura de fuentes normativas, reconstrucción del vocabulario conceptual real a partir de evidencia, sin inventar categorías) y frente a `ASC_VOCABULARY_GUIDE.md` Página 1 (auditoría término por término usando clasificación SUPPORTED / REFINE / SPLIT / MERGE / UNSUPPORTED / FUTURE / CONFLICT).

**INTERPRETACIÓN — alcance del PASS.** Este resultado PASS está limitado a las tareas, fuentes y contratos normativos de este ciclo específico. No constituye una validación general, una certificación permanente, ni una garantía de que Claude opere correctamente ante tareas, fuentes o alcances distintos.

**HECHO RESPALDADO.** Las categorías `AGENT-SAFE`, `AGENT-AMBIGUOUS`, `AGENT-BLOCKED` y `CONFLICT` usadas durante esa prueba fueron categorías locales de prueba, explícitamente no estados oficiales de ASC ni de GRRP, y no fueron incorporadas a ningún documento normativo.

**INTERPRETACIÓN.** La similitud observada entre el comportamiento de Claude, ASC y GRRP durante la prueba (todos operan con distinciones explícitas entre lo conocido, lo abierto y lo prohibido de inferir) es una observación cualitativa. No establece que ASC, GRRP y el propio Claude compartan una arquitectura formal común.

## 6. Investigación conceptual sobre `ASC_VOCABULARY_GUIDE.md`

**HIPÓTESIS DE DISEÑO.** La función de `ASC_VOCABULARY_GUIDE.md` como interfaz semántica entre el vocabulario humano de diseño y el vocabulario ejecutable de ASC es, en este momento, una hipótesis de diseño, no un hecho establecido sobre el propósito canónico del documento.

**HIPÓTESIS DE DISEÑO.** La arquitectura de páginas propuesta para una posible serie ampliada de la guía (más allá de la Página 1 actual) permanece como hipótesis de diseño no implementada, no congelada, y sujeta a revisión humana.

**HECHO RESPALDADO.** No se seleccionó todavía un vocabulario mínimo compartido entre ASC, GRRP y el agente de desarrollo. Página 1 de `ASC_VOCABULARY_GUIDE.md` no fue modificada en este ciclo.

**INTERPRETACIÓN.** El material de referencia externo usado en este ciclo (imágenes 4A/4B) fue tratado únicamente como método interpretativo, no como fuente de contenido, términos, categorías o estructura para el vocabulario de ASC. Ningún término, categoría o estructura de 4A/4B fue trasladado a esta nota ni a ningún documento del repositorio.

## 7. Cuestiones de investigación sin resolver

**UNRESOLVED RESEARCH QUESTION A.** ¿Dónde está exactamente el límite entre `prohibited` y `doNotInfer` en el esquema ASC v0.1? Ambos restringen inferencia, pero no está establecido si su diferencia es de alcance, de severidad, de momento de aplicación, o de las tres. Esta pregunta no se resuelve en este documento y no se convierte en un `OPEN` normativo de ASC.

**UNRESOLVED RESEARCH QUESTION B.** ¿Es "Validar" una operación independiente dentro del flujo de ASC/GRRP, o es una propiedad implícita de otras operaciones (compilar, proponer, autorizar)? Esta pregunta no se resuelve en este documento.

Ambas preguntas permanecen abiertas como preguntas de investigación. Ninguna de las dos debe tratarse como un `OPEN` normativo de ASC, GRRP o MAP-001 hasta que se decida explícitamente incorporarla como tal en la fuente correspondiente.

## 8. Siguiente punto de entrada de investigación

**UNRESOLVED RESEARCH QUESTION (siguiente ciclo).** ¿Cuál es el vocabulario mínimo compartido y necesario entre ASC, GRRP y un agente de desarrollo, y cómo debería representarse (si acaso) en `ASC_VOCABULARY_GUIDE.md`?

**HIPÓTESIS DE DISEÑO — candidatas de clasificación de trabajo, no canónicas.** Como punto de partida hipotético para ese siguiente ciclo, y sin canonizarlas: (a) vocabulario de contrato (claves del esquema ASC), (b) vocabulario de estado epistémico (`KNOWN` / `OPEN` / `PROHIBIDO INFERIR` / `ART-PROVISIONAL`), (c) vocabulario de proceso (PROPOSE / IMPLEMENT / validar). Estas tres etiquetas son hipótesis de trabajo para orientar la siguiente investigación, no una taxonomía aprobada.

## 9. Qué no se modificó en este ciclo

No se modificó: `tools/asc/compile_asc.mjs`, `tools/asc/compile_asc.test.mjs`, ningún otro fixture de `tools/asc/fixtures/`, `docs/SPATIAL_MODEL.md`, `docs/MAP_TOPOLOGY_SYSTEM.md`, `docs/ENVIRONMENT_REFERENCE_PROTOCOL.md`, `docs/references/environments/manifest.csv`, `docs/ARBORIS_SCENE_COMPILER.md`, `docs/ASC_V0_1_EXECUTABLE_SPEC.md`, `docs/ASC_VOCABULARY_GUIDE.md`, ni Página 1 de esa guía. No se creó ningún protocolo, estado, autoridad o autorización nueva más allá de lo ya reconciliado en `docs/GRRP_V0_1_SPEC.md` en ciclos anteriores. Este documento en sí mismo no es normativo y no otorga autoridad a ninguna de sus hipótesis o interpretaciones.
