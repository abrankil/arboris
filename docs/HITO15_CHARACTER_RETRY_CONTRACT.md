# Hito 15 — Contrato de reintento de caracteres (Hallazgo C)

Estado: decisión de producto cerrada. Pendiente de implementación en el 
engine. El diseño de interfaz queda fuera de alcance de este documento.

## Hallazgo original (auditoría)

nextCharacter() trata cualquier characterId presente en la evidencia como 
"carácter agotado", sin distinguir intentado de resuelto. Esto bloquea el 
reintento de caracteres respondidos con unknown/not_observable/not_applicable, 
aunque llegue evidencia nueva (otra foto, otro ángulo, otro momento).

## Decisiones cerradas

1. Un carácter puede estar en tres estados:
   - **visible**: disponible para preguntarse.
   - **intentado**: se pidió evidencia y se recibió una respuesta, 
     cualquiera sea (incluye unknown/not_observable/not_applicable).
   - **resuelto**: la respuesta dio un estado decisivo que efectivamente 
     redujo el conjunto de candidatos.

2. Un carácter intentado pero no resuelto NO se vuelve a ofrecer 
   automáticamente en el flujo normal de nextCharacter().

3. Sin límite de reintentos: un carácter intentado-no-resuelto queda 
   disponible para reintento indefinidamente. No caduca ni se marca 
   "agotado" por el paso del tiempo o el número de intentos.

4. El reintento requiere una acción EXPLÍCITA del usuario ("reintentar 
   este carácter"), nunca automática. Esto implica una pieza de interfaz 
   (botón de reintento) que hoy no existe en la app.

5. Un carácter ya resuelto no se vuelve a ofrecer ni automática ni 
   manualmente — ya cumplió su función.

## Alcance de esta iteración

Solo el cambio de ENGINE: separar el estado intentado de resuelto, y 
exponer una función que permita re-solicitar explícitamente un carácter 
intentado-no-resuelto.

El botón de reintento en la interfaz de usuario queda fuera de alcance — 
es una decisión de diseño de producto para cuando comience la 
implementación de la app (el README del repo indica que "Application 
implementation has not started").

## Explícitamente fuera de alcance

- Hallazgo D (robustez de candidateIds)
- Hallazgo E (sobrescritura silenciosa de relaciones)
- Diseño de UI del botón de reintento
