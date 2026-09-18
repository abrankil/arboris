# Tile Grammar Candidate v0.2 — semántica de mixed

**Fecha:** 2026-09-18  
**Estado:** candidate grammar; no estándar de producción  
**Origen:** TILE-GRAMMAR-STRESS-TEST-007 detectó `edgeContent=mixed` como `UNDER_SPECIFIED`.

## Decisión semántica

Se separan dos conceptos que v0.1 dejaba ambiguos:

```text
surface.composition = mixed
→ permitido
→ describe composición interna de la celda
→ sus bordes deben declarar contenido concreto cuando la interfaz esté resuelta

edge.content = mixed
→ UNRESOLVED_NON_CONNECTABLE
→ no es wildcard
→ no puede certificar compatibilidad con land, water ni mixed
```

Esto permite conservar celdas mixtas, por ejemplo una ribera, sin convertir `mixed` en permiso universal de ensamblaje.

## Regla fail-closed

```text
mixed ↔ land  = FAIL
mixed ↔ water = FAIL
mixed ↔ mixed = FAIL

surface=mixed + edge=land  = puede validar normalmente
surface=mixed + edge=water = puede validar normalmente
```

Un borde mixto solo podrá volverse conectable si una versión futura incorpora semántica explícita de segmentación o una representación equivalente. Esa representación permanece OPEN.

## Versionado

- v0.1 se conserva para reproducibilidad histórica de TEST-007.
- v0.2 usa un validador separado: `validate_tile_grammar_v02.mjs`.
- `schemaVersion`: `0.2`.
- `grammarId`: `TILE-GRAMMAR-CANDIDATE-v0.2`.
- `policies.mixedEdge`: `UNRESOLVED_NON_CONNECTABLE`.

## Autoridad preservada

No cambia la relación de autoridad:

```text
walkableEnvelope / gameplay contracts
→ logical cell
→ candidate edge grammar
→ working isometric prism
```

No se fijan tamaño de tile, escala métrica, renderer, pathfinding, geometría territorial ni arte final.
