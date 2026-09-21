# Árboris — Cierre de jornada 2026-09-21 (ASC)

**Estado:** registro de cierre de sesión. No es autoridad normativa, no otorga aprobación artística, no modifica ASC v0.1.
**Autoridad normativa:** `docs/ARBORIS_SCENE_COMPILER.md`, `docs/ASC_V0_1_EXECUTABLE_SPEC.md`, `docs/ASC_PROJECT_BOUNDARY.md`.

## Alcance integrado

Esta jornada se concentró en dos frentes, deliberadamente separados:

1. registro del logo canónico y avance del taller de logo master (`PR #41`, `#42`, `#43`);
2. piloto de compilación/generación ASC sobre una viñeta acotada del Estero El Arrayán (`ASC-PLAY-VIGNETTE-001/002/003`).

## Estado del repositorio al cierre

- Rama `claude/adoring-thompson-zsnylq` sincronizada con `origin/main` (fast-forward, sin conflictos) e incluye `PR #41` (registro de logo canónico), `PR #42` (esquema/validador de logo master) y `PR #43` (assets físicos `candidate-001`, `technical-validated`).
- `tools/asc/compile_asc.mjs` **sin modificar** — sin ninguna clave `toolchain` ni ampliación del esquema v0.1 de 14 claves.
- Documento nuevo: `docs/ASC_PLAY_VIGNETTE_PILOT_2026-09-21.md`, consolidando el ciclo completo del piloto (brief, 3 contratos, resultados, auditorías por iteración, comentario de Álvaro).
- Todos los commits de la jornada relacionados con ASC están commiteados y pusheados a `origin/claude/adoring-thompson-zsnylq`.

## Principios consolidados en esta jornada

- ASC v0.1 no necesitó ningún cambio para completar el piloto — toda variación se resolvió en el contrato de entrada, no en el compilador.
- Un piloto ASC puede reusar el mismo territorio que un contrato existente (`MAP-001-ASC-MAPPING-0021 v2.1`) siempre que declare explícitamente su independencia — no continuarlo, no revisarlo, no reemplazarlo.
- La redacción de `cameraFormat` importa: pedir "dos planos" es ambiguo y el ejecutor lo ignora; pedir "dos imágenes separadas" con roles explícitos funciona.
- Un ejecutor generativo puede intensificar visualmente un rasgo autorizado (p. ej. "rápido") más allá de lo que respalda la evidencia, sin violar literalmente el contrato — la auditoría debe leer esto críticamente, no solo por checklist textual.
- Material generado con fines de prueba de compilador **no se convierte en aprobación artística** por el hecho de que Dirección de Arte lo revise; puede tener valor como insumo de desarrollo de ASC sin que eso cierre la aprobación de la escena.
- Toda aprobación artística declarada en chat por quien no es Álvaro se registra como **declarada, no verificada**, hasta que él la confirme directamente.

## Fuente de evidencia ambiental usada en el piloto

`docs/references/environments/manifest.csv` — referencias `ENV-0016`, `ENV-0037`, `ENV-0018` (`core`, evidencia de campo directa) y `ENV-0003` (`comparative`/`interpretation`, marco ecológico P41).

## Estado de integración al cierre

- El piloto ASC-PLAY-VIGNETTE fue documentado en `docs/ASC_PLAY_VIGNETTE_PILOT_2026-09-21.md`, commiteado y pusheado. No se integró como PR ni se propuso para `main`.
- No se modificó el compilador, el esquema de contrato, ni ningún test de `tools/asc/`.
- No se integraron las imágenes generadas como evidencia territorial, botánica o canon visual.
- La aprobación artística de la escena de la viñeta permanece `OPEN`.
- La instrumentación completa del ejecutor generativo (versión exacta de modelo, parámetros, seed, ID de respuesta) permanece `UNRESOLVED`; solo se registró el nombre de modelo declarado por el usuario ("GPT-5.6 Terra Medio"), sin verificación técnica independiente.

## Discrepancia sin resolver

En esta sesión se solicitó auditar `docs/ASC_VIGNETTE_PILOT_ART_BRIEF_DRAFT_2026-09-20.md`. **Ese archivo no existe en este checkout ni en su historial de git.** Es posible que exista en otro entorno/checkout distinto al de esta sesión (ya se detectaron antes señales de al menos un checkout diferente circulando en la conversación — rutas de Windows, y un bloque de texto con una clave `[TOOLCHAIN]` inexistente en este repositorio). Queda como `UNRESOLVED` hasta que se aporte el contenido real del archivo o se confirme su ubicación.

## Próximo punto de partida

Al retomar el trabajo de ASC:

1. Si se aporta el contenido de `ASC_VIGNETTE_PILOT_ART_BRIEF_DRAFT_2026-09-20.md`, auditarlo contra los criterios ya solicitados (secuencia según `ASC_PROJECT_SEPARATION_AND_IMPLEMENTATION_PLAN_2026-09-17.md`, PASS/PARTIAL/FAIL únicamente, procedencia fuera del contrato ASC, referencias visuales sin autorización implícita, sin ampliación del esquema v0.1, sin campo `toolchain`).
2. Gestionar la aprobación artística real de la escena de la viñeta con Álvaro, si se decide llevar el piloto más allá de ejercicio de sesión.
3. Si se busca reproducibilidad formal, instrumentar el ejecutor (proveedor, modelo, parámetros, seed) en la próxima corrida.
