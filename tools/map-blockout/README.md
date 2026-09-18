# MAP-001 deterministic blockout tool

Materializes the provisional test geometry defined in `data/maps/map-001-blockout-candidate-001.json` and validates the current topology, territorial relations, OPEN preservation, and the two required viewport tests.

This tool does **not** establish territorial geometry, meters, bearings, pathfinding, renderer behavior, or Interaction/Learning slots.

## Validate and materialize

```bash
npm run materialize:map001
```

Outputs:

```text
build/map001-blockout/map001-blockout-360x640.svg
build/map001-blockout/map001-blockout-360x800.svg
build/map001-blockout/validation.json
```

## Tests

```bash
npm run test:map-blockout
```
