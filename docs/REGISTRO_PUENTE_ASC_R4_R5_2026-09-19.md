# Árboris — Registro puente: rama de trabajo ASC R4/R5 (2026-09-19)

**Naturaleza de este documento:** puente de registro, no de investigación ni de decisión. Existe porque una verificación de consistencia de memoria (sesión de Claude en claude.ai, 2026-09-19) encontró que esta rama de trabajo no estaba representada en ningún documento de registro de esa sesión de proyecto, incluidos sus cierres de jornada del 18 y 19 de septiembre.

**Fuente y actualización de evidencia:** este documento fue creado originalmente a partir de memoria importada a la cuenta de Claude del usuario desde otro proveedor de IA. Esa sesión de Claude intentó verificar los dos commits citados abajo directamente en este repositorio y no pudo confirmarlos ni descartarlos con las herramientas disponibles en ese momento. El 2026-09-21 se verificaron directamente en el repositorio los documentos y commits correspondientes al contraste R4 y al cierre R4/R5. Esta verificación confirma lo que esos documentos registran, pero no constituye por sí misma verificación de todos los artefactos experimentales subyacentes ni de los demás elementos históricos descritos en este puente.

**Estatus de la evidencia:** se registra por elemento. Los documentos y commits de R4/R5 indicados abajo están **VERIFICADOS DIRECTAMENTE**. Los artefactos crudos que esos documentos enumeran permanecen **NO VERIFICADOS DIRECTAMENTE / UBICACIÓN OPEN** mientras no sean localizados y contrastados. Los restantes antecedentes históricos procedentes de la memoria importada permanecen **DECLARED** salvo verificación específica posterior.

**Lo que este documento NO hace:** no reemplaza los documentos originales de esta rama de trabajo. No verifica automáticamente los artefactos experimentales subyacentes por el hecho de verificar los documentos que los describen. No integra esta rama con `docs/ARBORIS_SCENE_COMPILER.md` ni con `docs/ASC_VOCABULARY_GUIDE.md`. No decide si esta rama debería consolidarse con el resto del trabajo de ASC.

---

## 1. Qué describe esta rama de trabajo

Compilación y traspaso ("handoff") de referencia visual para un avatar/personaje, con foco en preservar el estatus epistémico del contenido a través de ese traspaso — distinto del uso de ASC como compilador de escenas territoriales.

## 2. Elementos registrados y estado actual de verificación

- **DECLARED:** `ASC-REFSCOPE-001` — prueba de un conjunto de referencia (A1-A4, donde A4 incluía múltiples personas). Requisito: el avatar debe reconocer a Alejandra e ignorar a personas no objetivo, con exclusividad de sujeto y sin transferencia ni mezcla de atributos. Resultado declarado: clasificación, alcance y compilación pasaron en esa etapa; el traspaso/ejecutor/resultado de punta a punta quedó sin probar.
- **DECLARED:** decisiones técnicas sobre assets visuales protegidos: personajes en 125×125 px PNG RGBA (transparencia, sin antialiasing); ambientes en 480×270 px lógicos, 16:9, nearest-neighbor/múltiplos enteros; los assets aprobados preservan píxeles y transparencia exactos; el logo es un master protegido, con corrección explícita: "mantén las proporciones originales del logo".
- **VERIFIED DIRECTLY (documento + commit):** `R4 — Provenance Preservation`, registrado en `docs/ASC_R4_PROVENANCE_PRESERVATION_CONTRAST_2026-09-19.md`, commit `3b558f5fb8add9fbc8b310cc85b848bde49d0eae`. El documento registra que el artefacto original fue `PARTIAL`, que una versión corregida (`ASC-R4-CONTRAST-001`) obtuvo `PASS con observaciones menores`, que R4 quedó `VALIDADO / CERRADO` y que existe evidencia inicial favorable a generalización, no validación general.
- **VERIFIED AS DOCUMENTED; RAW ARTIFACTS NOT DIRECTLY VERIFIED:** `ASC-R4-HANDOFF-FIDELITY-REPLICATION-001`. El cierre R4/R5 verificado documenta que la transferencia estructural pasó y que el artefacto completo fue `PARTIAL`, exponiendo fallas de procedencia a nivel de elemento/afirmación, afirmaciones de escala física sin respaldo, falsa precisión y amplificación de autoridad visual. El prompt exacto, la referencia visual exacta, el output textual íntegro, las auditorías íntegras y la ficha visual enumerados por ese cierre no fueron localizados en el árbol actual de `main` durante la verificación del 2026-09-21; su ubicación permanece `OPEN`.
- **VERIFIED AS DOCUMENTED:** decisión metodológica de preservar los artefactos fallidos como evidencia y no corregirlos retroactivamente, registrada en el cierre R4/R5 verificado.
- **VERIFIED AS DOCUMENTED:** `R5 — ELEMENT-LEVEL / CLAIM-LEVEL PROVENANCE` es el siguiente experimento propuesto, con `CLAIM` como unidad epistémica candidata. Estado registrado: `PROPOSED / NOT EXECUTED`. R6/R7 no están formalmente abiertos.
- **VERIFIED AS DOCUMENTED / NON-NORMATIVE:** `Precision Provenance`, `Visual Authority Amplification`, `Representational Authority`, el modelo candidato de seis dimensiones (Provenance, Granularity, Support, Precision, Representation, Authority) y `Epistemic Authority Preservation` aparecen registrados como hallazgos o hipótesis experimentales, no como reglas normativas de ASC.
- **VERIFIED AS DOCUMENTED:** decisión metodológica de no convertir los errores descubiertos en una blacklist específica de casos prohibidos.
- **VERIFIED AS DOCUMENTED:** separación de roles `COMPILADOR → produce` / `AUDITOR → evalúa`; la compilación no se autoasigna `PASS`/`PARTIAL`/`FAIL`. La exigencia de que productor y auditor deban ser necesariamente agentes físicos distintos no se considera resuelta por esta verificación.
- **VERIFIED DIRECTLY (documento + commit):** cierre de jornada `docs/CIERRE_JORNADA_2026-09-19_ASC_R4_REPLICA_R5.md`, commit `b025721f36518ff5168470e91479008e0dd525a3`. El punto de retomo registrado es diseñar R5; no reabrir R4, no corregir los artefactos experimentales retroactivamente, no repetir el contraste y no normativizar prematuramente los hallazgos nuevos.

## 3. Artefactos experimentales crudos no verificados directamente

El cierre R4/R5 verificado indica que deben preservarse, entre otros:

- compilación visual inicial de R4;
- auditoría inicial;
- compilación corregida;
- auditoría de la compilación corregida;
- prompt exacto de la réplica inter-agente;
- referencia visual entregada;
- output textual íntegro del segundo agente;
- auditoría del output textual;
- ficha visual generada;
- auditoría de la ficha visual;
- errores cuantitativos y funcionales que permitieron detectar los residuos.

Durante la verificación del 2026-09-21 estos artefactos no fueron localizados como archivos individuales en el árbol actual de `main`.

Estado:

```text
RAW R4/R5 EXPERIMENTAL ARTIFACT LOCATION: OPEN
NOT LOCATED IN CURRENT MAIN TREE
NOT EQUIVALENT TO: DOES NOT EXIST / LOST / NEVER PRESERVED
```

La ausencia de localización directa no modifica retrospectivamente los estados documentados de R4 ni convierte este puente en fuente primaria de esos artefactos.

## 4. Contraste con lo ya normativo en este repositorio

Sin contradicción directa detectada entre lo registrado arriba y `docs/ASC_VOCABULARY_GUIDE.md` / `docs/ARBORIS_SCENE_COMPILER.md` — son objetos distintos dentro de "ASC". Dos puntos de fricción permanecen abiertos:

- Si el vocabulario de veredicto de R4/R5 (`PASS`/`PARTIAL`/`FAIL`, `VALIDATED/CLOSED`, `PROPOSED/NOT EXECUTED`) convive sin redefinirse contra `docs/ASC_VOCABULARY_GUIDE.md`. `OPEN` — no resuelto por esta rectificación.
- Si `tools/asc/compile_asc.mjs` es el mismo compilador que produjo `ASC-REFSCOPE-001`/`ASC-R4-CONTRAST-001`, o si esta rama usa una herramienta o proceso distinto. `OPEN` — no resuelto por esta rectificación.

## 5. Estado de la rectificación

Los dos commits citados fueron verificados directamente el 2026-09-21:

```text
3b558f5fb8add9fbc8b310cc85b848bde49d0eae
docs: register ASC R4 provenance preservation contrast

b025721f36518ff5168470e91479008e0dd525a3
docs: close ASC R4 replication session and handoff to R5
```

Esta verificación actualiza únicamente el estatus documental de esos registros y de los hechos que esos documentos registran explícitamente. No verifica automáticamente los artefactos crudos enumerados por ellos ni los restantes antecedentes históricos procedentes de memoria importada.

No usar este documento como base para decidir si R4/R5 debe integrarse o coordinarse con el compilador ASC v0.1. Esa decisión permanece fuera del propósito de este puente.
