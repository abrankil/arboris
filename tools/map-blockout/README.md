# MAP-001 deterministic blockout tools

Two candidates are retained for reproducibility.

Candidate 001 is the original provisional materialization. Candidate 002 is the current pre-integration rectification.

Candidate 002 explicitly records:

```text
walkableEnvelope = NOT_MATERIALIZED
test raster = TEST_ONLY
interaction structural contract = DEFINED
interaction spatial binding = OPEN
water/blocker edge rasterization = OPEN
```

It does not establish territorial geometry, meters, bearings, pathfinding, renderer behavior, shoreline edge signatures, blocker edge signatures, or concrete interaction-cell placement.

## Commands

```bash
npm run materialize:map001
npm run test:map-blockout

npm run materialize:map001:v01
npm run materialize:map001:v02
npm run test:map-blockout:v01
npm run test:map-blockout:v02
```

Candidate 002 outputs to `build/map001-blockout-v02/`.

The raster remains a provisional verification fixture and must not be promoted to the authoritative `walkableEnvelope`.
