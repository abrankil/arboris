# MAP-001 × Tile Grammar v0.2 — Pre-integration Test 001

Fecha: 2026-09-18  
Test ID: MAP001-TILEGRAMMAR-PREINTEGRATION-TEST-001  
Contract revision: 0.2  
Estado: READY_TO_IMPLEMENT  
Baseline requerido: MAP001-TILEGRAMMAR-NODE24-BASELINE-001  
Producción: NOT_ESTABLISHED

## Corrección posterior a auditoría

La revisión 0.2 corrige cuatro problemas del contrato original: agrega preflight de baseline, elimina la sobreafirmación walkableCells → path, fija los conteos deterministas del raster y hace obligatoria la integridad de provenance para TEST_SCAFFOLD.

## PI-00 — Baseline preflight

Antes de ejecutar cualquier mapping se exige Node 24 y coincidencia exacta de los SHA-256 congelados para MAP-001 Candidate 002, Tile Grammar Candidate v0.2, su validador y docs/SPATIAL_MODEL.md. Si falla una comprobación, el resultado es INVALID_BASELINE y la prueba se detiene.

## Dirección de autoridad

MAP-001 provisional test raster → mapping record + provenance → executable logical-cell fixture → validateTile/validateEdgeMatch → validatorResult → mappingAssessment independiente.

El raster sigue TEST_ONLY y el walkableEnvelope exacto continúa NOT_MATERIALIZED.

## Walkable no implica path

La transformación autorizada es walkable cell → walkability=walkable y adjacency ortogonal → shared traversal compatible. Queda prohibido derivar route.kind=path o route.ports desde walkableCells solamente. El mapping per-cell de la ruta principal queda OPEN_UNMAPPED.

## Hechos fijados del raster

Candidate 002 contiene 17 celdas caminables, 16 adyacencias ortogonales compartidas, una componente conectada, cero nodos de ramificación y endpoints [0,4] y [14,4]. PI-01 debe comprobar exactamente esos valores.

## Dos capas obligatorias

La implementación debe separar MAPPING RECORD de EXECUTABLE TILE FIXTURE. Todo campo exigido por validateTile() pero no autorizado por MAP-001 debe marcarse TEST_SCAFFOLD. El scaffolding nunca puede apoyar una conclusión territorial.

validatorResult y mappingAssessment son resultados distintos. Un PASS técnico del validador no implica por sí solo REPRESENTABLE.

## Bordes evaluados

Solo las 16 adyacencias compartidas derivadas del raster son evaluadas como mapping de MAP-001. Los demás edge fields necesarios para formar un tile ejecutable pueden ser TEST_SCAFFOLD y deben marcarse NOT_EVALUATED_AS_MAP_MAPPING.

## Elevación

elevation.path=reference-band puede normalizarse a un código relativo como 0. Ese 0 no representa metros. Si elevation.mode es necesario para validateTile() y la fuente no lo determina, permanece TEST_SCAFFOLD.

## Agua y blockers

PI-03 debe comprobar inferred water/bank edges = 0. PI-04 debe comprobar inferred blocker/cliff/hard-blocker edges = 0. waterEdgeRasterization y blockerEdgeRasterization continúan OPEN.

## Fixtures corregidos

PI-00-BASELINE-PREFLIGHT — baseline identity + hashes + Node 24.
PI-01-WALKABLE-ADJACENCY — 17 cells / 16 adjacencies / 1 component / 0 branching / no automatic path overlay.
PI-02-REFERENCE-BAND — relative encoding only.
PI-03-WATER-NO-INFERENCE — inferred water/bank edges = 0.
PI-04-BLOCKER-NO-INFERENCE — inferred blocker edges = 0.
PI-05-BOUNDARY-SEMANTICS — entry/exit outside terrain grammar.
PI-06-SEPARATION-OF-CONCERNS — bridge/gate/house/interactions/camera outside terrain grammar.
PI-07-PROVENANCE-INTEGRITY — TEST_SCAFFOLD never becomes source-derived evidence.

## AUDITORÍA

La revisión elimina la inferencia walkable → path, agrega preflight criptográfico y separa ejecución técnica de justificación semántica.

## INCONSISTENCIAS

validateTile() exige más campos de los que MAP-001 autoriza. Esto se maneja con TEST_SCAFFOLD, no inventando autoridad.

## VACÍOS

Siguen OPEN shoreline/bank rasterization, blocker edge rasterization, interaction cell binding, pathfinding global, object/terrain overlay, métricas y mapping per-cell de la ruta principal.

## OMISIONES

El test no evalúa assets, renderer, pixel art, cámara visual, naturalización ni fidelidad métrica territorial.

## REDUNDANCIAS

No se crean nuevas versiones de MAP-001 ni Tile Grammar. El baseline congelado permanece intacto.

## Estado

CONTRACT REVISION: 0.2
BASELINE PREFLIGHT: DEFINED
WALKABLE→PATH OVERCLAIM: REMOVED
RASTER COUNTS: PINNED
SCAFFOLD PROVENANCE: ENFORCED
VALIDATOR vs MAPPING RESULT: SEPARATED
STATUS: READY_TO_IMPLEMENT
