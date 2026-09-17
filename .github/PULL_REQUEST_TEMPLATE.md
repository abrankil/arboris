<!--
Plantilla obligatoria de PR — Árboris
No borrar secciones. Si una sección no aplica, escribir explícitamente "N/A: <razón>".
Un PR sin las 4 secciones de auditoría completas no debe mergearse.
-->

## Resumen

<!-- Qué cambia y por qué, en 2-4 líneas. -->

## Alcance

<!-- Qué SÍ modifica este PR y, más importante, qué NO modifica.
Ejemplo: "Solo documentación. No modifica Master Botánico, JSON canónicos,
assets, código de identificación, código de app, renderer ni pathfinding." -->

**Modifica:**
-

**No modifica:**
-

---

## Auditoría (obligatoria antes de mergear)

Agente/herramienta que generó este bloque: <!-- ChatGPT / Codex / VS Code manual / otro -->

### AUDITORÍA
<!-- Qué se revisó y contra qué fuente de verdad (docs/DEVELOPMENT_MANUAL.md,
Master Botánico, docs/ARCHITECTURE.md, etc). No dejar vacío. -->

### INCONSISTENCIAS
<!-- Contradicciones detectadas entre este cambio y el estado actual del
repo/documentación. Si no hay ninguna, justificar por qué ("se revisó X y Y
y son coherentes con Z"), no solo escribir "ninguna". -->

### VACÍOS / OMISIONES
<!-- Qué queda sin resolver, sin definir, o pendiente de evidencia
(ej. decisiones OPEN que NO deben cerrarse por suposición). -->

### REDUNDANCIAS
<!-- Documentación, datos o lógica duplicada que este cambio introduce,
identifica o debería eliminar. -->

---

## Validación

<!-- Comandos ejecutados y resultado. Ejemplo:
npm.cmd test → PASS
npm.cmd run verify:botanical → PASS
Si es cambio solo documental: "Cambio documental. No se ejecutaron tests de app." -->

## Decisiones abiertas heredadas

<!-- Lista cualquier decisión OPEN (ej. PILOT-ENV-006) que este PR toca pero
NO resuelve, para que quede explícito que sigue abierta a propósito. -->

- [ ] Confirmo que ninguna decisión `OPEN` fue cerrada por suposición en este PR.
- [ ] Confirmo que no se hardcodeó conocimiento botánico fuera de `data/`.
- [ ] Confirmo que las 4 secciones de auditoría fueron completadas con contenido real, no genérico.
