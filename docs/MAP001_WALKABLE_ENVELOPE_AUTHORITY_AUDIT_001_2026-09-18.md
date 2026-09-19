# MAP-001 — Walkable Envelope Authority Audit 001

**Fecha:** 2026-09-18  
**Objeto auditado:** `MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001`  
**HEAD auditado:** `4f750fe64f1ece83dd3a64236bf7b6369c61ba7e`  
**Estado de auditoría:** `PASS CON RECTIFICACIÓN REQUERIDA`  
**Scope:** autoridad de navegación local de MAP-001  
**Producción:** `NOT_ESTABLISHED`

## Resumen

La opción A resolvió correctamente la parte principal del problema: `walkable envelope continuo → rasterización reproducible → celdas derivadas`.

La implementación bajo Node 24 pasó su gate específico y demostró que la geometría continua puede producir determinísticamente las 17 celdas del raster provisional.

Sin embargo, el cambio de autoridad todavía no está completamente cerrado en runtime. El materializador normal continúa exigiendo coincidencia exacta con Candidate 002 para obtener `PASS`.

Estado consolidado:

```text
CONCEPTUAL DIRECTION: PASS
CONTINUOUS ENVELOPE: PASS
NODE 24 VALIDATION: PASS
DETERMINISTIC RASTERIZATION: PASS
AUTHORITY INVERSION: PARTIAL
FREEZE AS IMPLEMENTED: REVISE
NEW BLOCKOUT DERIVATION: BLOCKED UNTIL RECTIFICATION
```

## AUDITORÍA

### 1. Lo que sí quedó demostrado

`data/maps/map-001-walkable-envelope-candidate-001.json` define una geometría continua mediante `centerline + halfWidth → polyline_buffer`.

La rasterización `CELL_CENTER_DISTANCE_TO_CENTERLINE_LEQ_HALF_WIDTH` produce de manera determinista 17 celdas caminables, una componente conectada, cero nodos de ramificación y endpoints `[0,4]` / `[14,4]`.

El test también demuestra que modificar la geometría del envelope modifica el raster derivado. Por tanto, la relación `envelope → raster` existe técnicamente y no es solo documental.

### 2. Lo que todavía no está completamente invertido

`materializeEnvelope()` continúa ejecutando `compareLegacyRaster()` y el resultado `PASS` exige `legacyHashMatches && exactCellSetMatch`.

En consecuencia, Candidate 002 todavía conserva poder de veto sobre el materializador de la nueva autoridad.

El runtime actual se comporta como:

```text
walkable envelope
        ↓
derived raster
        ↓
must still equal Candidate 002
        ↓
PASS
```

y no todavía como:

```text
walkable envelope
        ↓
derived raster
        ↓
PASS according to current authority contract
```

La comparación con Candidate 002 es correcta como gate de migración de una sola vez, pero no debe permanecer como condición ordinaria de validez después del freeze.

### 3. Estado del candidate congelado

El baseline de autoridad declara `FROZEN_NAVIGATION_AUTHORITY`, mientras el archivo congelado conserva internamente `CANDIDATE_PENDING_NODE24_AND_AUDIT`.

No debe reescribirse el candidate porque su SHA-256 ya está fijado como evidencia. La autoridad vigente debe interpretarse desde `data/baselines/map001-walkable-envelope-authority-001.json`, y el candidate debe conservarse como input exacto validado.

### 4. Semántica de límites

El local frame declara `x: 0..9` y `y: 0..15`. La centerline termina en `[4.5,15]` y `[4.5,0]`; con `halfWidth=0.49` y caps redondos, el buffer geométrico puede extenderse fuera del frame en entrada y salida.

Puede ser correcto para puertos abiertos, pero todavía no está definido si el envelope se recorta al frame o si los puertos abiertos pueden atravesarlo. Debe fijarse antes de reutilizar el envelope para otras derivaciones geométricas.

### 5. Cobertura de CI

`test:walkable-envelope` existe, pero todavía no forma parte de `npm test`.

El workflow específico tampoco incluye como triggers explícitos el baseline de autoridad ni el documento de freeze. Por eso el commit del freeze no volvió a ejecutar el gate específico.

El CI general del HEAD auditado continúa en rojo por `Check Expo dependency alignment`; los canonical tests fueron omitidos después de ese fallo. Ese problema es separado del envelope.

## INCONSISTENCIAS

### I-001 — Legacy raster todavía participa en el PASS ordinario

Documentación: Candidate 002 = migration compatibility only. Runtime: Candidate 002 hash + exact cell equality = required for PASS.

Estado: `INCONSISTENT / RECTIFICATION REQUIRED`.

### I-002 — Candidate interno vs baseline externo

`candidate.status = CANDIDATE_PENDING_NODE24_AND_AUDIT` y `authority baseline.status = FROZEN_NAVIGATION_AUTHORITY`.

Estado: aceptable si se interpreta `candidate = immutable validated input` y `baseline = authority declaration`. No modificar retroactivamente el candidate.

### I-003 — Freeze no cubierto por workflow específico

El baseline y su closeout no disparan actualmente el workflow del envelope.

Estado: `CI COVERAGE GAP`.

## VACÍOS

### V-001 — Separación migration gate / runtime authority

Falta separar la validación de migración única `legacy raster ↔ new envelope` de la materialización normal `frozen envelope → derived raster`.

### V-002 — Política de clipping / open-port crossing

Debe fijarse una semántica explícita: `CLIP_TO_LOCAL_FRAME` o `OPEN_PORTS_MAY_CROSS_FRAME`.

Si se adopta la segunda, se debe validar que solo `P-IN` y `P-OUT` puedan cruzar el frame y que los bordes laterales sigan cerrados.

### V-003 — Propiedades de geometría continua

Faltan validaciones explícitas del envelope continuo: política de auto-intersección, crossings permitidos del frame, alineación de puertos, continuidad independiente del raster y ausencia de contacto lateral accidental.

### V-004 — Integración con test canónico

`npm test` no incluye todavía `test:walkable-envelope`.

## OMISIONES

No se debe derivar todavía un nuevo MAP-001 blockout desde la autoridad congelada.

No se debe crear `MAP-001-BLOCKOUT-CANDIDATE-003` antes de rectificar el runtime.

No se deben modificar Candidate 002 ni Candidate 001 retroactivamente.

No se deben incorporar agua, banks, blockers, interacción, métricas, cardinalidad o botánica durante esta rectificación.

No se debe utilizar la igualdad con Candidate 002 como condición permanente de autoridad.

## REDUNDANCIAS

Los tres artefactos actuales pueden mantenerse con funciones distintas:

```text
MAP-001-BLOCKOUT-CANDIDATE-002
= evidencia histórica y migración

MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001
= input exacto validado

MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001
= declaración del hash adoptado como autoridad
```

La redundancia solo se vuelve problemática si Candidate 002 sigue participando en la ejecución ordinaria del materializador de autoridad.

## Rectificación requerida

### R-001 — Separar migración de materialización ordinaria

Crear dos rutas: `validateWalkableEnvelopeMigration()` para la comparación legacy ↔ envelope, y `materializeWalkableEnvelopeAuthority()` para frozen envelope → derived raster.

El segundo flujo no debe leer Candidate 002.

### R-002 — Resolver semántica de frame

Agregar una política explícita al authority/runtime, por ejemplo `frameBoundaryPolicy: OPEN_PORTS_MAY_CROSS_FRAME`, y verificar que `screen_up` cruce solo por `P-OUT`, `screen_down` solo por `P-IN`, y que `screen_left/right` sigan cerrados.

### R-003 — Incorporar el dominio al test canónico

Actualizar `npm test` para ejecutar también `npm run test:walkable-envelope`.

### R-004 — Cubrir authority baseline en workflow

El workflow específico debe dispararse también ante cambios en `data/baselines/map001-walkable-envelope-authority-001.json` y `docs/MAP001_WALKABLE_ENVELOPE_AUTHORITY_FREEZE_001_2026-09-18.md`.

### R-005 — Revalidar bajo Node 24

Después de la rectificación: tests, A/B determinista, materializador de autoridad sin dependencia legacy, migration test aislado, hashes y auditoría.

Solo entonces corresponde derivar el siguiente blockout.

## Decisión

```text
OPTION A: KEEP
WALKABLE ENVELOPE GEOMETRY: KEEP
NODE 24 EVIDENCE: KEEP
FROZEN HASH: KEEP
CURRENT NORMAL MATERIALIZER: REVISE
LEGACY MIGRATION CHECK: KEEP, BUT ISOLATE
NEW BLOCKOUT DERIVATION: BLOCKED UNTIL RECTIFICATION
PRODUCTION STANDARD: NOT ESTABLISHED
```

## Próximo gate

`MAP-001 WALKABLE ENVELOPE AUTHORITY RUNTIME RECTIFICATION 001`.

Objetivo:

```text
legacy raster
        ↓ one-time migration evidence only

FROZEN WALKABLE ENVELOPE
        ↓
normal authority materializer
        ↓
derived raster
        ↓
future blockout
```

La rectificación no reabre la geometría adoptada. Corrige únicamente la implementación de la autoridad ya congelada.
