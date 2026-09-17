# Hito 15 — Contrato de reintento de caracteres (Hallazgo C)

Estado: **CERRADO**. Decisión de producto e implementación de engine validadas. El diseño de interfaz queda fuera de alcance de este documento.

## Hallazgo original (auditoría)

nextCharacter() trataba cualquier characterId presente en la evidencia como "carácter agotado", sin distinguir intentado de resuelto. Esto bloqueaba el reintento de caracteres respondidos con unknown/not_observable/not_applicable, aunque llegara evidencia nueva (otra foto, otro ángulo, otro momento).

## Decisiones cerradas

1. Un carácter puede estar en tres estados:
   - **visible**: disponible para preguntarse.
   - **intentado**: se pidió evidencia y se recibió una respuesta, cualquiera sea (incluye unknown/not_observable/not_applicable).
   - **resuelto**: la respuesta dio un estado decisivo que efectivamente redujo el conjunto de candidatos.

2. Un carácter intentado pero no resuelto NO se vuelve a ofrecer automáticamente en el flujo normal de nextCharacter().

3. Sin límite de reintentos: un carácter intentado-no-resuelto queda disponible para reintento indefinidamente. No caduca ni se marca "agotado" por el paso del tiempo o el número de intentos.

4. El reintento requiere una acción EXPLÍCITA del usuario ("reintentar este carácter"), nunca automática. Esto implica una pieza de interfaz (botón de reintento) que hoy no existe en la app.

5. Un carácter ya resuelto no se vuelve a ofrecer ni automática ni manualmente — ya cumplió su función.

## Implementación cerrada

El engine mantiene el flujo automático de `nextCharacter()` separado del reintento explícito.

`retryCharacter(dataset, evidence, characterId, candidateIds)` permite re-solicitar un carácter solo cuando fue intentado pero no resuelto. El estado se deriva sin agregar un segundo estado persistente a la evidencia: se compara el conjunto de candidatos antes y después de aplicar la evidencia del carácter. Si el conjunto se reduce, el carácter queda resuelto y el reintento devuelve `null`; si no se reduce, permanece intentado-no-resuelto y puede reintentarse explícitamente.

Esto preserva el contrato existente de evidencia y mantiene `nextCharacter()` libre de reintentos automáticos.

## Validación

Validación local realizada tras la implementación:

- `node --test tools/canonical-identification/engine.test.mjs`: **11/11 tests aprobados**.
- Incluye control de no repetición automática, reintento explícito de carácter intentado-no-resuelto y terminalidad de un carácter que efectivamente redujo candidatos.
- `npm.cmd run verify:botanical`: **0 advertencias y 0 errores** en Master 2.0 exportado; **0 conflictos** de IDs/datos; **6 fichas canónicas sincronizadas** con **0 advertencias y 0 errores**.

## Alcance de esta iteración

Solo el cambio de ENGINE: separar semánticamente el estado intentado de resuelto y exponer una función que permita re-solicitar explícitamente un carácter intentado-no-resuelto.

El botón de reintento en la interfaz de usuario queda fuera de alcance — es una decisión de diseño de producto para cuando comience la implementación de la app (el README del repo indica que "Application implementation has not started").

## Explícitamente fuera de alcance

- Hallazgo D (robustez de candidateIds)
- Hallazgo E (sobrescritura silenciosa de relaciones)
- Diseño de UI del botón de reintento
