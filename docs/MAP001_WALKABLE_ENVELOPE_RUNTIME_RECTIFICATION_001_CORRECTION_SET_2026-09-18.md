# MAP-001 WALKABLE ENVELOPE AUTHORITY RUNTIME RECTIFICATION 001 — CORRECTION SET

```text
CORRECTION SET: FROZEN FOR IMPLEMENTATION
IMPLEMENTATION: NOT YET EXECUTED
RECTIFICATION GATE: NOT YET TESTED
PRODUCTION STANDARD: NOT ESTABLISHED
```

**Fecha:** 2026-09-18
**Autoridad de estas decisiones:** Alejandra, recibidas en esta sesión como resolución de los puntos `UNRESOLVED`/vacíos dejados abiertos por la propuesta auditada (`PASS_TO_IMPLEMENT`) del gate `MAP-001 WALKABLE ENVELOPE AUTHORITY RUNTIME RECTIFICATION 001`.
**Alcance de esta tarea:** solo documentación. No se investigó de nuevo la arquitectura, no se editó código, `package.json`, tests ni workflows. No se hizo commit ni push. Ningún archivo del repo fue tocado.
**Base:** la propuesta auditada de la sesión anterior (INVESTIGAR → ANALIZAR → PROPONER → AUDITAR LA PROPUESTA, decisión `PASS_TO_IMPLEMENT`) más las 18 decisiones cerradas de la versión anterior de este documento, corregidas aquí en cuatro puntos puramente documentales (ver "Correcciones aplicadas en esta revisión" al final).

---

## Decisiones cerradas (correction set)

1. `frameBoundaryPolicy = OPEN_PORTS_MAY_CROSS_FRAME`. Cierra el punto V-002 que quedó `UNRESOLVED` desde `docs/MAP001_WALKABLE_ENVELOPE_AUTHORITY_AUDIT_001_2026-09-18.md`.

   `frameBoundaryPolicy = OPEN_PORTS_MAY_CROSS_FRAME` es un **invariante operacional autorizado por este correction set**, no un campo de datos. **No debe agregarse retroactivamente** como campo a `data/maps/map-001-walkable-envelope-candidate-001.json` ni a `data/baselines/map001-walkable-envelope-authority-001.json`. La implementación debe **validar en código** que la geometría congelada ya existente en esos dos artefactos satisface esta política — sin modificar ninguno de los dos archivos.
2. En bordes abiertos (`screen_up`, `screen_down`), la intersección envelope ∩ borde debe ser **una sola región conectada** que contenga el anchor del puerto correspondiente (`P-OUT` en `screen_up`, `P-IN` en `screen_down`). No se exige que sea un único punto — se permite un segmento continuo de cruce, no múltiples regiones desconectadas.
3. `screen_left` y `screen_right` **no pueden intersectar** el envelope, bajo ninguna condición. Esto preserva `closedLocalEdges: ["screen_left","screen_right"]` ya declarado en el candidate.
4. **No** se introduce clipping geométrico ni un campo `portWidth`. La política resuelve solo si el cruce está permitido y en qué bordes, no cómo se recorta ni el ancho del puerto — evita inventar un parámetro no solicitado por ninguna autoridad.
5. `npm test` (script raíz) incluirá `npm run test:walkable-envelope` junto a `verify:botanical`, `verify:data-access`, `verify:reference-db`, `test:canonical-identification`, `test:asc`, `test:map-blockout`, `test:tile-grammar`.
6. El workflow `.github/workflows/map001-walkable-envelope.yml` tendrá una **lista exacta de patrones `paths:`** (se dice "patrones" y no "paths exactos" porque `tools/map-navigation/**` es un patrón glob, no una ruta exacta), limitada a:
   - `.github/workflows/map001-walkable-envelope.yml`
   - `data/baselines/map001-walkable-envelope-authority-001.json`
   - `data/maps/map-001-walkable-envelope-candidate-001.json`
   - `data/maps/map-001-blockout-candidate-002.json`
   - `tools/map-navigation/**`
   - `package.json`

   **Estado factual verificado del trigger actual** (`.github/workflows/map001-walkable-envelope.yml` en `main`, HEAD `73af868`):

   ```text
   El trigger actual NO incluye:
   data/baselines/map001-walkable-envelope-authority-001.json

   El trigger actual SÍ incluye:
   docs/MAP001_WALKABLE_ENVELOPE_AUTHORITY_CANDIDATE_001_2026-09-18.md
   ```

   Esta lista exacta de patrones **reemplaza** la lista `paths:` actualmente vigente descrita arriba — no la complementa. En particular, el documento `docs/MAP001_WALKABLE_ENVELOPE_AUTHORITY_CANDIDATE_001_2026-09-18.md` deja de estar en el trigger; el authority manifest se agrega.
7. CI separará dos responsabilidades en **jobs independientes** de GitHub Actions (no steps dentro de un mismo job):

   ```text
   authority-runtime
   = job independiente

   migration-evidence
   = job independiente
   ```

   `authority-runtime` es el **gate operacional de autoridad** — determina el PASS/FAIL del gate de rectificación. `migration-evidence` es evidencia de compatibilidad histórica con Candidate 002 y no determina ese PASS.

   Explícitamente:

   ```text
   authority-runtime:
   - no lee Candidate 002;
   - no depende de migration-evidence;
   - su PASS no incorpora resultados legacy.
   ```
8. Candidate 002 **no participa** en el PASS de `authority-runtime` (ver contrato de tests en la sección dedicada más abajo). Corrige el hallazgo central de la investigación previa: hoy `materializeEnvelope()` llama incondicionalmente a `compareLegacyRaster()`, lo que hace que el runtime normal dependa de un archivo legacy que debería ser solo de migración.
9. Los hashes del freeze original (`authorityManifest.validation.hashes.*`, fecha 2026-09-18, commit `9e94d247a83b0e89a3afd5fb7579ad8c71025e42`) permanecen **inmutables** y **no se re-firman**. Quedan como evidencia histórica del freeze tal como se registró, aunque dejen de coincidir bit a bit con el materializador corregido.
10. La rectificación genera un **registro de evidencia nuevo y separado** (nuevos hashes, nuevo run, nuevo commit de referencia) — no reemplaza ni edita el bloque de evidencia del freeze original.
11. El authority manifest debe validarse por **valores exactos**, no solo por presencia de campos:
    - `schemaVersion = "0.1"`
    - `authorityId = "MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001"`
    - `status = "FROZEN_NAVIGATION_AUTHORITY"`
    - `scope = "MAP-001 LOCAL NAVIGATION GEOMETRY ONLY"`
    - `sourceCandidate.id = "MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001"`
    - `sourceCandidate.path = "data/maps/map-001-walkable-envelope-candidate-001.json"`
    - `SHA-256(candidate file) = sourceCandidate.sha256`
12. Además debe validar por valor exacto:
    - `authorityRule.canonicalNavigationGeometry = sourceCandidate.path`
    - `authorityRule.legacyRasterRole = "MIGRATION_COMPATIBILITY_ONLY"`
    - `authorityRule.legacyRasterPath = "data/maps/map-001-blockout-candidate-002.json"`
    - `authorityRule.reverseAuthorityProhibited = true`
    - `interpretation.unit = "NAVIGATION_UNIT"`
    - `interpretation.territorialGeometryClaim = false`
    - `interpretation.metricScale = "OPEN"`
    - `interpretation.worldBearing = "OPEN"`
    - `interpretation.surveyedRouteGeometry = "OPEN"`
    - `productionStandard = "NOT_ESTABLISHED"`
13. Cualquier discrepancia en los puntos 11–12 (o en la política de frame de los puntos 1–3) debe **fallar cerrado** — ningún valor inesperado se tolera con warning ni se continúa con un valor derivado/asumido.
14. `materialize:walkable-envelope` usará el **authority manifest** (`data/baselines/map001-walkable-envelope-authority-001.json`) como entrada normal del CLI, en vez de apuntar directo al candidate como ocurre hoy (`DEFAULT_INPUT` actual = ruta del candidate).
15. La migración legacy (Candidate 002) tendrá una **entrada separada**, explícitamente distinta del entry point normal del punto 14 — no comparten invocación por defecto.
16. Si falta Candidate 002 en modo migración, el resultado debe ser un **missing-input failure** estructurado, sin emitir ningún veredicto semántico `PASS`/`REVISE` de migración. No debe ser una excepción no controlada (como ocurre hoy con `fs.readFileSync` sin manejo de error).
17. Los nombres exactos de los estados/errores fail-closed (equivalentes a lo antes etiquetado `AUTHORITY_INPUT_FAILURE` / `MIGRATION_INPUT_MISSING`) quedan como **detalle de implementación**, no decididos en este correction set.
18. Tras un gate exitoso, se creará `docs/MAP001_WALKABLE_ENVELOPE_RUNTIME_RECTIFICATION_001_RESULT_2026-09-18.md`, con HEAD, versión de Node, run de CI y hashes de la nueva evidencia (punto 10), **sin modificar** la evidencia histórica del freeze (punto 9).

## Contrato mínimo de aceptación (independiente de la propuesta de sesión previa)

La implementación debe satisfacer este contrato de tests sin depender de la redacción de la propuesta auditada anterior:

```text
AUTHORITY RUNTIME TESTS

valid manifest + valid candidate
→ PASS

valid manifest + valid candidate + Candidate 002 absent
→ PASS

candidate SHA mismatch
→ fail closed

candidate.id mismatch
→ fail closed

manifest invariant mismatch
→ fail closed

valid open-port crossing
→ PASS

lateral envelope intersection
→ fail closed

A/B materialization
→ deterministic


MIGRATION EVIDENCE TESTS

valid Candidate 002
→ compatibility verdict produced

Candidate 002 missing
→ structured missing-input failure
→ no PASS/REVISE migration verdict
```

## OPEN de dominio — intactos

Ninguna de las 18 decisiones anteriores toca ni cierra los siguientes `OPEN`, heredados sin cambio del candidate/authority manifest:

`metric scale`, `world bearing`, `surveyed route geometry`, `waterEdgeRasterization`, `blockerEdgeRasterization`, `interactionSpatialBinding`, `pathfinding implementation`, `renderer`, `tile size`, `final environmental art`, `territorial route width`, `exact bridge bearing`.

`productionStandard = NOT_ESTABLISHED` se mantiene explícitamente (punto 12) y no se convierte en un estándar de producción por este correction set.

---

## Auditoría de este documento (`docs/DEVELOPMENT_MANUAL.md`)

### AUDITORÍA

Se revisó que las 18 decisiones de fondo permanezcan sin cambio de contenido tras esta revisión (solo se corrigieron cuatro puntos documentales: exactitud factual del trigger actual, terminología "lista exacta de patrones" en vez de "paths exactos", cierre de jobs vs. steps en el punto 7, y no-retroactividad del punto 1 sobre los artefactos congelados), que ninguna decisión exceda el alcance del gate (`§13` del instructivo original: no geometría nueva, no Candidate 003, no Tile Grammar, no pathfinding, no arte, no métricas, no cardinalidad), y que la tarea se ejecutó estrictamente como corrección documental — no se volvió a investigar el repo ni se tocó ningún archivo de código.

### INCONSISTENCIAS

Ninguna detectada entre las 18 decisiones ni entre las cuatro correcciones aplicadas. La corrección del punto 6 no es una inconsistencia sino una precisión factual: la versión anterior de este documento afirmaba genéricamente que el trigger actual "no incluye el authority manifest", sin citar qué sí incluye; esta revisión deja registrado explícitamente que el trigger actual sí incluye `docs/MAP001_WALKABLE_ENVELOPE_AUTHORITY_CANDIDATE_001_2026-09-18.md`, y que la nueva lista de patrones lo reemplaza.

### VACÍOS / OMISIONES

- El punto 17 deja explícitamente sin decidir los nombres exactos de los estados fail-closed — es una omisión reconocida y aceptada como tal (detalle de implementación), no una omisión de este documento.
- No se especifica el formato exacto del nuevo registro de evidencia del punto 10 (mismo formato que el freeze original vs. uno nuevo) — se asume, sin decidirlo aquí, que seguirá el patrón ya usado por el workflow actual (`sha256sum` + artifact upload), a menos que se decida lo contrario al implementar.
- El contrato mínimo de aceptación no especifica el mecanismo exacto para probar "valid open-port crossing" vs. "lateral envelope intersection" (fixtures de prueba concretos) — queda como detalle de implementación dentro del contrato ya fijado.

### REDUNDANCIAS

Ninguna introducida. El punto 9 (hashes del freeze inmutables) y el punto 10 (nueva evidencia separada) son complementarios, no redundantes: evitan tanto sobrescribir evidencia histórica como confundir ambos registros en una sola fuente. Clasificación: **INTENCIONAL**. La separación en jobs independientes del punto 7 tampoco debe introducir redundancia: ambos jobs **deberán reutilizar** el mismo núcleo geométrico/validador existente por importación, no duplicarlo — esto es un requisito de la implementación pendiente, no un hecho ya verificado en código.

No quedan hallazgos bloqueantes.

```text
CORRECTION SET: FROZEN FOR IMPLEMENTATION
IMPLEMENTATION: NOT YET EXECUTED
RECTIFICATION GATE: NOT YET TESTED
PRODUCTION STANDARD: NOT ESTABLISHED
```

---

## Correcciones aplicadas en esta revisión (trazabilidad)

1. Punto 6: se agregó el estado factual verificado del trigger actual (qué sí y qué no incluye hoy) y se reemplazó "paths exactos" por "lista exacta de patrones `paths:`", dejando explícito que `tools/map-navigation/**` es un patrón glob.
2. Punto 7: se cerró la ambigüedad "jobs vs. steps" — `authority-runtime` y `migration-evidence` son jobs independientes, no steps de un mismo job. Se agregaron las tres propiedades explícitas de `authority-runtime` (no lee Candidate 002 / no depende de migration-evidence / su PASS no incorpora resultados legacy) y se reemplazó "gate normativo" por "gate operacional de autoridad".
3. Punto 1: se agregó la aclaración de que `frameBoundaryPolicy = OPEN_PORTS_MAY_CROSS_FRAME` es un invariante operacional de este correction set, no un campo a insertar retroactivamente en el candidate ni en el authority manifest; la implementación valida en código que la geometría congelada ya cumple la política, sin modificar esos artefactos.
4. Se agregó la sección "Contrato mínimo de aceptación", con los casos de test de `AUTHORITY RUNTIME TESTS` y `MIGRATION EVIDENCE TESTS` recibidos, para que la implementación no dependa de la redacción de la propuesta de sesión previa.
5. Sección REDUNDANCIAS: corregida para decir que los dos jobs **deberán** reutilizar el mismo núcleo geométrico/validador (requisito de implementación), sin afirmar que ya lo hacen — el código de la separación en jobs aún no existe.

Las 18 decisiones de fondo no cambiaron de contenido.

---

## Próxima acción (no autorizada por este documento)

Implementar el correction set sobre `tools/map-navigation/materialize_walkable_envelope_001.mjs`, su test, `package.json` y `.github/workflows/map001-walkable-envelope.yml`, y luego producir `docs/MAP001_WALKABLE_ENVELOPE_RUNTIME_RECTIFICATION_001_RESULT_2026-09-18.md` (punto 18) tras un gate exitoso. Ninguna de estas acciones está autorizada por esta tarea.
