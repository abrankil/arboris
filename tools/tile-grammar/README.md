# Tile Grammar Candidates

Executable candidate grammar for logical 2D cells represented as working isometric prisms.

The validators are deliberately fail-closed. They validate structural properties only; they do not certify final art, renderer behavior, metric scale, pathfinding, territorial geometry, or pixel-art production quality.

## Current candidate

`TILE-GRAMMAR-CANDIDATE-v0.2` changes the semantics of `mixed`:

```text
surface.composition=mixed
→ allowed

edge.content=mixed
→ UNRESOLVED_NON_CONNECTABLE
→ never a wildcard
```

A mixed surface can connect through a concrete edge declared as `land` or `water`. An unresolved mixed edge cannot certify adjacency with `land`, `water`, or another `mixed` edge.

v0.1 remains in the repository for historical reproducibility of TEST-007.

## Commands

```bash
npm run test:tile-grammar
npm run validate:tile-grammar
npm run stress:tile-grammar

npm run validate:tile-grammar:v01
npm run stress:tile-grammar:v01
```

## Compatibility rule

Adjacent cells are compatible only when their shared edges agree on reversed `bandEndpoints`, `routePort`, traversal, compatible profiles, and resolved edge content.

`land ↔ water` is accepted only as a closed `bank ↔ bank` interface. A hard blocker is non-walkable, carries no route, and exposes closed edges.

## Authority

```text
walkableEnvelope / gameplay contracts
→ logical cell
→ candidate edge grammar
→ working isometric prism
```

`tileSize`, metric scale, renderer, pathfinding, real-world elevation, and final pixel-art resolution remain `OPEN`.
