# MAP-001 — Walkable Envelope Authority Freeze 001

**Fecha:** 2026-09-18  
**Authority ID:** `MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001`  
**Estado:** `FROZEN_NAVIGATION_AUTHORITY`  
**Scope:** geometría local de navegación de MAP-001  
**Producción:** `NOT_ESTABLISHED`

## Resultado

La opción A queda cerrada para el alcance de navegación local:

```text
walkable envelope continuo
        ↓
rasterización reproducible
        ↓
celdas derivadas
```

El artefacto congelado es:

```text
data/maps/map-001-walkable-envelope-candidate-001.json
SHA-256:
10bf81d817b947665499aa5b942b9edb23dd0ef4259087150a5a5cf7a1f7614c
```

Desde este freeze, ese archivo funciona como autoridad geométrica de navegación local de MAP-001.

No es autoridad territorial métrica.

## Evidencia de validación

```text
Node:
v24.20.0

validated HEAD:
9e94d247a83b0e89a3afd5fb7579ad8c71025e42

workflow:
MAP-001 Walkable Envelope Gate

run:
35380568068

conclusion:
success
```

Resultado técnico:

```text
derived cells: 17
connected components: 1
branching nodes: 0
endpoints: [0,4] / [14,4]

A/B deterministic materialization: PASS
legacy hash match: PASS
legacy cell-set compatibility: EXACT MATCH
metricScale: OPEN
worldBearing: OPEN
territorialGeometryClaim: false
```

Hashes:

```text
candidate
10bf81d817b947665499aa5b942b9edb23dd0ef4259087150a5a5cf7a1f7614c

materializer
1420d8847e86aca5f3e75b4cf941a8408e52c708516b6d173c9b111aafed1470

validation.json
3e6e7ff3a046afe9acddbb26b9e643859e6d36297f9f7cf4e6eef281bcc7a2bd

derived-raster.json
ece4186d0dd164809dc492a7fec92d40cba2de7ab627603a95592e1c5b9c2c32

walkable-envelope.svg
6f017c99bd3eabe570b4fae788c9f1797cd85830319e43a44f15278b657802f9
```

Artifact:

```text
map001-walkable-envelope-candidate-001
artifact ID: 10561084320
digest:
sha256:dacd271b20b6a47bc2794b6b6780858a36eaee9bd27e7339857308752ffe32d8
```

## Cambio de autoridad

Antes:

```text
Candidate 002 raster
= geometría operativa provisional

walkableEnvelope
= NOT_MATERIALIZED
```

Después de este freeze:

```text
walkable envelope
= autoridad de navegación local

raster
= derivado reproducible

Candidate 002 raster
= compatibilidad histórica de migración
```

Regla:

```text
envelope → raster
```

La dirección inversa queda prohibida salvo una migración explícita futura:

```text
raster ✕→ envelope
```

## Qué significa "autoridad" aquí

La geometría congelada es una decisión de diseño de navegación.

Sus unidades son:

```text
NAVIGATION_UNIT
```

No son metros.

La centerline y el ancho del envelope no afirman que el sendero real tenga exactamente esa forma o ancho.

La evidencia territorial disponible respalda la estructura general del corredor y sus relaciones obligatorias, pero no un levantamiento métrico completo del recorrido.

Por eso continúan:

```text
territorialGeometryClaim = false
metricScale = OPEN
surveyed route geometry = OPEN
worldBearing = OPEN
```

## AUDITORÍA

El gate cumple el objetivo arquitectónico de la opción A: existe por primera vez una región continua de navegación que puede generar determinísticamente la discretización.

La rasterización no consulta Candidate 002 para decidir qué celdas son caminables. Candidate 002 se usa únicamente después de la derivación para verificar que la migración inicial no cambió el gameplay.

También se probó que modificar la geometría del envelope cambia el raster generado, confirmando que la nueva dirección de autoridad es técnicamente real y no solo documental.

La decisión es:

```text
WALKABLE ENVELOPE AUTHORITY:
PASS / FREEZE

NAVIGATION AUTHORITY:
ESTABLISHED FOR MAP-001

TERRITORIAL METRIC AUTHORITY:
NOT ESTABLISHED

PRODUCTION STANDARD:
NOT ESTABLISHED
```

## INCONSISTENCIAS

La forma inicial del envelope fue bootstrappeada desde el raster provisional para preservar exactamente la navegación existente.

Eso produce una deuda conocida:

```text
origen de la primera forma
= legacy raster

autoridad futura
= continuous envelope
```

No es una contradicción mientras se conserve la regla de migración: el raster histórico deja de gobernar cambios futuros.

Una futura evidencia territorial suficientemente precisa puede justificar una nueva versión del envelope, pero deberá entrar como evidencia upstream y generar un cambio explícito de autoridad.

## VACÍOS

Este freeze no resuelve:

- ancho real del sendero;
- escala métrica;
- geometría levantada del recorrido;
- bearing geográfico;
- geometría exacta del puente;
- banks del estero;
- blockers de ladera;
- interaction bindings;
- pathfinding;
- renderer;
- tamaño de tile;
- arte final.

## OMISIONES

No se generó un nuevo MAP-001 blockout todavía.

No se modificó Candidate 002 retroactivamente.

No se rasterizaron estero, laderas, puente, reja, casa ni interacciones.

No se convirtió la serie fotográfica de campo en geometría del recorrido porque la evidencia disponible no soporta esa inferencia.

## REDUNDANCIAS

Candidate 002 se conserva para reproducibilidad histórica y comparación de migración.

El nuevo envelope no reemplaza los contratos territoriales, de cámara o de interacción. Solo asume la autoridad de la geometría transitable local.

## Siguiente gate

El próximo paso estructural de la opción A es regenerar el blockout desde esta autoridad, no desde la matriz histórica.

La cadena deberá ser:

```text
MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001
        ↓
derived raster
        ↓
nuevo blockout derivado
        ↓
validación contra topology + territory + camera + interaction
```

Ese nuevo blockout podrá recibir un nuevo identificador/versionado porque cambia su procedencia de autoridad, aunque la celda resultante inicialmente sea idéntica.
