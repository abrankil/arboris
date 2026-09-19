# MAP-001 — Walkable Envelope Authority Candidate 001

**Fecha:** 2026-09-18  
**ID:** `MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001`  
**Estado:** `CANDIDATE_PENDING_NODE24_AND_AUDIT`  
**Scope:** navegación local, no geometría territorial medida  
**Producción:** `NOT_ESTABLISHED`

## Objetivo

Cerrar la frontera estructural elegida después del pre-integration test:

```text
walkable envelope continuo
→ rasterización reproducible
→ celdas derivadas
```

La intención es que, una vez validado y auditado, el envelope se convierta en la autoridad geométrica de navegación de MAP-001 y que el raster deje de funcionar como fuente primaria.

## Naturaleza de la geometría

La geometría propuesta usa un marco local continuo:

```text
x = screen_right
y = screen_down
unit = NAVIGATION_UNIT
metricScale = OPEN
worldBearing = OPEN
```

No representa metros, coordenadas geográficas ni levantamiento topográfico.

El envelope es una región continua definida como buffer alrededor de una centerline:

```text
geometry.type = polyline_buffer
halfWidth = 0.49 navigation units
capStyle = round
joinStyle = round
```

Esto permite distinguir dos cosas:

```text
forma continua de navegación
≠
grilla de implementación
```

## Migración explícita

Candidate 001 se crea como una migración controlada desde el blockout provisional existente.

```text
legacy Candidate 002 raster
→ one-time compatibility seed
→ continuous walkable envelope candidate
→ derived verification raster
```

La migración es explícita porque el proyecto todavía no dispone de un levantamiento territorial completo que determine una geometría métrica del recorrido.

La regla posterior al freeze será:

```text
walkable envelope = navigation authority
legacy raster = migration compatibility only
future raster = regenerated from envelope
```

No se permite que el raster vuelva a modificar silenciosamente el envelope.

## Envelope propuesto

Centerline local:

```text
[4.5,15.0]
→ [4.5,5.5]
→ [3.5,5.5]
→ [3.5,2.5]
→ [4.5,2.5]
→ [4.5,0.0]
```

Puertos:

```text
P-IN
screen_down
entry
anchor [4.5,15.0]

P-OUT
screen_up
exit
anchor [4.5,0.0]
```

Los bordes `screen_left` y `screen_right` permanecen cerrados.

## Rasterización reproducible

La regla es puramente geométrica:

```text
para cada celda:
  center = [col + 0.5, row + 0.5]

walkable =
  distance(center, centerline) <= halfWidth
```

El raster esperado es 15×9 y debe producir 17 celdas caminables.

La comparación con Candidate 002 existe solo como gate de migración. El algoritmo de rasterización no consulta las celdas legacy para decidir transitabilidad.

## Evidencia territorial y límites

Las fuentes territoriales actuales respaldan la estructura general del corredor, entrada/salida, relación con puente/reja/casa/estero y cierre lateral, pero no una geometría métrica completa del recorrido.

Por eso este candidate declara:

```text
territorialGeometryClaim = false
metricScale = OPEN
surveyed route geometry = OPEN
world cardinal mapping = OPEN
```

La evidencia de campo disponible sigue siendo válida para materiales, vegetación, escala relativa y rasgos observados; no se usa aquí para inventar una polilínea geográfica.

## AUDITORÍA

La propuesta corrige la inversión de autoridad que existía en Candidate 002.

Antes:

```text
raster provisional
→ usado como geometría operativa
walkableEnvelope = NOT_MATERIALIZED
```

Objetivo después del freeze:

```text
walkableEnvelope continuo
→ raster reproducible
→ logical cells / tiles
```

El candidate conserva exactamente la conectividad del raster histórico durante la migración para no introducir un cambio de gameplay simultáneo al cambio de autoridad.

## INCONSISTENCIAS

Existe una deuda explícita: la forma inicial del centerline hereda la geometría del blockout provisional como bootstrap.

Esto no debe confundirse con evidencia territorial.

La deuda se considera aceptable solo porque:

1. la migración es declarada y trazable;
2. la geometría se convierte en un artefacto de navegación, no territorial;
3. el legacy raster pierde autoridad después del freeze;
4. una futura evidencia territorial puede justificar revisar el envelope en el nivel correcto.

## VACÍOS

Permanecen abiertos:

- escala métrica;
- ancho territorial real del sendero;
- geometría levantada del recorrido;
- bearing cardinal;
- agua/banks;
- blockers de ladera;
- interaction bindings;
- pathfinding;
- renderer;
- tile size;
- arte final.

## OMISIONES

Este gate no rasteriza agua, laderas ni objetos.

Tampoco asigna puente, reja, casa, estero o interaction slots al envelope.

Su única responsabilidad es establecer la región continua navegable y una regla reproducible de discretización.

## REDUNDANCIAS

Candidate 002 se conserva como evidencia histórica y objetivo de compatibilidad de la migración.

No se crea MAP-001 Candidate 003 todavía. Primero debe validarse y auditarse este envelope; solo después corresponde regenerar un nuevo blockout desde la nueva autoridad.

## Gate de validación

Para aprobar el candidate:

```text
Node 24
validate model
rasterize A
rasterize B
A == B
derived cells = 17
connected components = 1
branching nodes = 0
endpoints = [0,4] / [14,4]
legacy hash = expected
derived cell set = legacy cell set
left/right boundaries remain closed
metrics/cardinality remain OPEN
```

Un PASS autoriza auditar y congelar el envelope como nueva autoridad de navegación. No establece estándar de producción.
