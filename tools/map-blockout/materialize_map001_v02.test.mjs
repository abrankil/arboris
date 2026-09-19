import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderBlockoutSvg, validateMap001Blockout } from './materialize_map001_v02.mjs';

const model = JSON.parse(fs.readFileSync(new URL('../../data/maps/map-001-blockout-candidate-002.json', import.meta.url), 'utf8'));

test('validates rectified MAP-001 topology and pre-integration authority', () => {
  const result = validateMap001Blockout(model);
  assert.equal(result.singleConnectedComponent, true);
  assert.equal(result.bottomEntryConnected, true);
  assert.equal(result.topExitConnected, true);
  assert.equal(result.noInventedBranches, true);
  assert.equal(result.bridgeCrossesStream, true);
  assert.equal(result.streamRightAfterThreshold, true);
  assert.equal(result.interactionContractStructural, true);
  assert.equal(result.interactionSpatialBinding, 'OPEN');
  assert.equal(result.requiredInteractionSlotVisibleOrReachable, 'NOT TESTED');
  assert.equal(result.walkableEnvelopeMaterialized, false);
  assert.equal(result.rasterAuthority, 'TEST_ONLY');
});

test('fails closed if provisional raster claims authoritative envelope status', () => {
  const invalid = structuredClone(model);
  invalid.navigationGeometry.walkableEnvelope.status = 'MATERIALIZED';
  assert.throws(() => validateMap001Blockout(invalid), /walkableEnvelope must remain NOT_MATERIALIZED/);
});

test('fails closed if raster claims derivation from an envelope that is not materialized', () => {
  const invalid = structuredClone(model);
  invalid.navigationGeometry.testRaster.derivationFromEnvelope = 'REGENERABLE';
  assert.throws(() => validateMap001Blockout(invalid), /must not claim regeneration/);
});

test('validates structural interaction contract without inventing cell placement', () => {
  const result = validateMap001Blockout(model);
  assert.equal(result.interactionContractStructural, true);
  assert.equal(model.interactionLearning.units['UE-002'].observationOpportunity, 'required');
  assert.equal(model.interactionLearning.units['UE-002'].species, 'OPEN');
  assert.equal(model.interactionLearning.units['UE-002'].microhabitat, 'OPEN');
});

test('rejects invented interaction cell binding', () => {
  const invalid = structuredClone(model);
  invalid.interactionLearning.units['UE-002'].cell = [6, 4];
  assert.throws(() => validateMap001Blockout(invalid), /must not invent cell binding/);
});

test('rejects loss of required observation opportunity', () => {
  const invalid = structuredClone(model);
  invalid.interactionLearning.units['UE-002'].observationOpportunity = 'optional';
  assert.throws(() => validateMap001Blockout(invalid), /observation opportunity must remain required/);
});

test('preserves OPEN tile-integration boundaries', () => {
  for (const field of ['waterEdgeRasterization', 'blockerEdgeRasterization', 'interactionSpatialBinding']) {
    const invalid = structuredClone(model);
    invalid.preIntegration[field] = 'CLOSED_BY_INFERENCE';
    assert.throws(() => validateMap001Blockout(invalid), /must remain OPEN/);
  }
});

test('still fails closed when a lateral walkable branch is invented', () => {
  const invalid = structuredClone(model);
  invalid.grid.walkableCells.push([8, 5]);
  assert.throws(() => validateMap001Blockout(invalid), /branch|endpoint|single connected/i);
});

test('renders deterministic rectified previews', () => {
  for (const [width, height] of [[360, 640], [360, 800]]) {
    const first = renderBlockoutSvg(model, width, height);
    const second = renderBlockoutSvg(structuredClone(model), width, height);
    assert.equal(first, second);
    assert.match(first, /MAP-001 BLOCKOUT CANDIDATE 002/);
    assert.match(first, /walkable raster = TEST ONLY/);
    assert.match(first, /interaction spatial binding = OPEN/);
  }
});
