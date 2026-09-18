# Tile Grammar Candidate v0.1

Executable candidate grammar for logical 2D cells represented as working isometric prisms.

The validator is deliberately fail-closed. It validates structural properties only; it does not certify final art, renderer behavior, metric scale, pathfinding, territorial geometry, or pixel-art production quality.

## Commands

```bash
npm run test:tile-grammar
npm run validate:tile-grammar
```

## Compatibility rule

Two adjacent cells are compatible only when their shared edges agree on:

- reversed `bandEndpoints`;
- `routePort` state;
- traversal state;
- compatible edge profiles;
- compatible edge content.

`land ↔ water` is accepted only as a closed `bank ↔ bank` interface. A hard blocker is always non-walkable, carries no route, and exposes only closed edges.

## Authority

```text
walkableEnvelope / gameplay contracts
→ logical cell
→ candidate edge grammar
→ working isometric prism
```

`tileSize`, metric scale, renderer, real-world elevation, and final pixel-art resolution remain `OPEN`.
