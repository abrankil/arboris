import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderBlockoutSvg, validateMap001Blockout } from './materialize_map001.mjs';

const model = JSON.parse(fs.readFileSync(new URL('../../data/maps/map-001-blockout-candidate-001.json', import.meta.url), 'utf8'));

test('validates MAP-001 candidate topology and relations', () => {
  const result = validateMap001Blockout(model);
  assert.equal(result.singleConnectedComponent, true);
  assert.equal(result.bottomEntryConnected, true);
  assert.equal(result.topExitConnected, true);
  assert.equal(result.leftEdgeClosed, true);
  assert.equal(result.rightEdgeClosed, true);
  assert.equal(result.noInventedBranches, true);
  assert.equal(result.bridgeCrossesStream, true);
  assert.equal(result.bridgePrecedesGate, true);
  assert.equal(result.houseLeftAfterThreshold, true);
  assert.equal(result.streamTurnsAtThreshold, true);
  assert.equal(result.streamRightAfterThreshold, true);
  assert.equal(result.interactionSlots, 'NOT TESTED');
});

test('fails closed when a lateral branch is invented', () => {
  const invalid = structuredClone(model);
  invalid.grid.walkableCells.push([8, 5]);
  assert.throws(() => validateMap001Blockout(invalid), /branch|endpoint|right of route|single connected/i);
});

test('fails closed when cardinal bearing is asserted', () => {
  const invalid = structuredClone(model);
  invalid.coordinateSystem.worldBearing = 15;
  assert.throws(() => validateMap001Blockout(invalid), /world bearing must remain OPEN/);
});

test('fails closed when interaction slots are invented', () => {
  const invalid = structuredClone(model);
  invalid.interactionLearning.status = 'defined';
  invalid.interactionLearning.slots = ['tutorial'];
  assert.throws(() => validateMap001Blockout(invalid), /interaction\/learning must remain OPEN/);
});

test('renders deterministic 360x640 and 360x800 previews', () => {
  for (const [width, height] of [[360, 640], [360, 800]]) {
    const first = renderBlockoutSvg(model, width, height);
    const second = renderBlockoutSvg(structuredClone(model), width, height);
    assert.equal(first, second);
    assert.match(first, new RegExp(`width="${width}" height="${height}"`));
    assert.match(first, /PROVISIONAL TEST GEOMETRY/);
    assert.match(first, /interaction slots = NOT TESTED/);
  }
});

test('rejects unsupported viewport instead of silently adapting', () => {
  assert.throws(() => renderBlockoutSvg(model, 360, 720), /unsupported viewport/);
});
