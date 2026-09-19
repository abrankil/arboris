# Árboris — Registro puente: rama de trabajo ASC R4/R5 (2026-09-19)

**Naturaleza de este documento:** puente de registro, no de investigación ni de decisión. Existe porque una verificación de consistencia de memoria (sesión de Claude en claude.ai, 2026-09-19) encontró que esta rama de trabajo no estaba representada en ningún documento de registro de esa sesión de proyecto, incluidos sus cierres de jornada del 18 y 19 de septiembre.

**Fuente de todo el contenido de este documento:** memoria importada a la cuenta de Claude del usuario desde otro proveedor de IA. Esa sesión de Claude intentó verificar los dos commits citados abajo directamente en este repositorio y no pudo confirmarlos ni descartarlos con las herramientas disponibles en ese momento.

**Estatus de la evidencia: `DECLARED` por el usuario** (confirmó explícitamente que reconoce este trabajo como real, en esa conversación — no verificación textual directa del repositorio por esa sesión). Sigue el mismo criterio de clases de evidencia ya usado en este proyecto.

**Lo que este documento NO hace:** no reemplaza los documentos originales de esta rama de trabajo si ya existen en el repo bajo los paths citados abajo. No verifica su contenido técnico. No lo integra con `docs/ARBORIS_SCENE_COMPILER.md` ni con `docs/ASC_VOCABULARY_GUIDE.md`. No decide si esta rama debería consolidarse con el resto del trabajo de ASC.

---

## 1. Qué describe esta rama de trabajo

Compilación y traspaso ("handoff") de referencia visual para un avatar/personaje, con foco en preservar el estatus epistémico del contenido a través de ese traspaso — distinto del uso de ASC como compilador de escenas territoriales.

## 2. Elementos citados (según la memoria importada, no verificados por esta tarea)

- `ASC-REFSCOPE-001` — prueba de un conjunto de referencia (A1-A4, donde A4 incluía múltiples personas). Requisito: el avatar debe reconocer a Alejandra e ignorar a personas no objetivo, con exclusividad de sujeto y sin transferencia ni mezcla de atributos. Resultado declarado: clasificación, alcance y compilación pasaron en esa etapa; el traspaso/ejecutor/resultado de punta a punta quedó sin probar.
- Decisiones técnicas sobre assets visuales protegidos: personajes en 125×125 px PNG RGBA (transparencia, sin antialiasing); ambientes en 480×270 px lógicos, 16:9, nearest-neighbor/múltiplos enteros; los assets aprobados preservan píxeles y transparencia exactos; el logo es un master protegido, con corrección explícita: "mantén las proporciones originales del logo".
- `R4 — Provenance Preservation`: exige que las transformaciones durante el traspaso visual preserven el estatus epistémico del contenido. El artefacto original fue `PARTIAL`; una versión corregida (`ASC-R4-CONTRAST-001`) pasó con observaciones menores. Declarado como incorporado a este repositorio: `docs/ASC_R4_PROVENANCE_PRESERVATION_CONTRAST_2026-09-19.md`, commit `3b558f5fb8add9fbc8b310cc85b848bde49d0eae`. Estatus declarado: `VALIDATED / CLOSED`, con evidencia inicial favorable a generalizar (no una validación general).
- `ASC-R4-HANDOFF-FIDELITY-REPLICATION-001`: probó transferir Provenance Preservation a otro agente. La transferencia estructural pasó; el artefacto completo fue `PARTIAL`. Expuso fallas de procedencia a nivel de elemento/afirmación, afirmaciones de escala física sin respaldo, falsa precisión, y amplificación de autoridad visual.
- Decisión metodológica: preservar los artefactos fallidos como evidencia, no corregirlos retroactivamente.
- `R5 — ELEMENT-LEVEL / CLAIM-LEVEL PROVENANCE`: siguiente experimento propuesto, con `CLAIM` como unidad epistémica candidata. Estatus declarado: `PROPOSED / NOT EXECUTED`. R6/R7 deliberadamente no abiertos todavía.
- Hallazgos/hipótesis experimentales, explícitamente no reglas normativas de ASC todavía: `Precision Provenance`, `Visual Authority Amplification`, `Representational Authority`, un modelo de seis dimensiones (Provenance, Granularity, Support, Precision, Representation, Authority), y `Epistemic Authority Preservation`.
- Decisión metodológica de fondo: no convertir errores descubiertos en una lista negra de casos prohibidos.
- Separación de flujo declarada: compilador y auditor son roles separados — la compilación produce un artefacto; una auditoría posterior e independiente determina `PASS`/`PARTIAL`/`FAIL`.
- Cierre de jornada asociado, declarado como incorporado a este repositorio: `docs/CIERRE_JORNADA_2026-09-19_ASC_R4_REPLICA_R5.md`, commit `b025721f36518ff5168470e91479008e0dd525a3`. Punto de retomo registrado: diseñar R5; no reabrir R4, no corregir los artefactos experimentales retroactivamente, no repetir el contraste, no normativizar prematuramente los hallazgos nuevos.

## 3. Contraste con lo ya normativo en este repositorio

Sin contradicción directa detectada entre lo declarado arriba y `docs/ASC_VOCABULARY_GUIDE.md` / `docs/ARBORIS_SCENE_COMPILER.md` — son objetos distintos dentro de "ASC". Dos puntos de fricción a vigilar, no resueltos aquí:

- Si el vocabulario de veredicto de R4/R5 (`PASS`/`PARTIAL`/`FAIL`, `VALIDATED/CLOSED`, `PROPOSED/NOT EXECUTED`) convive sin redefinirse contra `docs/ASC_VOCABULARY_GUIDE.md`. `OPEN` — no verificado.
- Si `tools/asc/compile_asc.mjs` es el mismo compilador que produjo `ASC-REFSCOPE-001`/`ASC-R4-CONTRAST-001`, o si esta rama usa una herramienta o proceso distinto. `OPEN` — no verificado.

## 4. Qué hacer con este documento a futuro

- Si se confirma acceso de lectura a los dos commits citados, actualizar este documento marcando la evidencia como verificada directamente, no como `DECLARED`.
- No usar este documento como base para decidir si R4/R5 debe integrarse o coordinarse con el compilador ASC v0.1 — esa es una decisión de la autoridad técnica correspondiente.
