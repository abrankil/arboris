import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeDerivedRaster,
  materializeEnvelope,
  rasterizeEnvelope,
  validateEnvelopeModel
} from './materialize_walkable_envelope_001.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const MODEL_PATH = path.join(ROOT, 'data/maps/map-001-walkable-envelope-candidate-001.json');
const LEGACY_PATH = path.join(ROOT, 'data/maps/map-001-blockout-candidate-002.json');
const model = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
const legacy = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf8'));

function sortCells(cells) {
  return cells.slice().sort((a,b) => a[0]-b[0] || a[1]-b[1]);
}

test('walkable envelope candidate validates without territorial metric claims', () => {
  assert.equal(validateEnvelopeModel(model), true);
  assert.equal(model.scope, 'NAVIGATION_ONLY');
  assert.equal(model.territorialGeometryClaim, false);
  assert.equal(model.localFrame.metricScale, 'OPEN');
  assert.equal(model.localFrame.worldBearing, 'OPEN');
});

test('continuous envelope rasterizes deterministically to 17 walkable cells', () => {
  const a = rasterizeEnvelope(model);
  const b = rasterizeEnvelope(structuredClone(model));
  assert.deepEqual(a, b);
  assert.equal(a.length, 17);
});

test('derived raster exactly matches legacy Candidate 002 only as migration compatibility', () => {
  const derived = sortCells(rasterizeEnvelope(model));
  assert.deepEqual(derived, sortCells(legacy.grid.walkableCells));
  assert.equal(model.migrationCompatibility.expectedRelation, 'EXACT_CELL_SET_MATCH');
  assert.equal(model.migrationCompatibility.authorityAfterFreeze, 'LEGACY_RASTER_BECOMES_MIGRATION_COMPATIBILITY_ONLY');
});

test('derived raster preserves one corridor with two endpoints and no branches', () => {
  const graph = analyzeDerivedRaster(rasterizeEnvelope(model));
  assert.equal(graph.connectedComponents, 1);
  assert.equal(graph.branchingNodes.length, 0);
  assert.deepEqual(graph.endpoints, [[0,4],[14,4]]);
});

test('open ports touch screen boundaries while lateral edges remain closed', () => {
  const entry = model.ports.find((p) => p.id === 'P-IN');
  const exit = model.ports.find((p) => p.id === 'P-OUT');
  assert.deepEqual(entry.anchor, [4.5,15]);
  assert.deepEqual(exit.anchor, [4.5,0]);
  const minX = Math.min(...model.geometry.centerline.map((p) => p[0])) - model.geometry.halfWidth;
  const maxX = Math.max(...model.geometry.centerline.map((p) => p[0])) + model.geometry.halfWidth;
  assert.ok(minX > 0);
  assert.ok(maxX < 9);
});

test('changing envelope geometry changes derived raster rather than consulting legacy cells', () => {
  const changed = structuredClone(model);
  changed.geometry.centerline = [[4.5,15],[4.5,0]];
  const derived = rasterizeEnvelope(changed);
  assert.notDeepEqual(derived, sortCells(legacy.grid.walkableCells));
  assert.equal(derived.length, 15);
});

test('materialization reports exact migration compatibility and PASS', () => {
  const { report } = materializeEnvelope(model, ROOT);
  assert.equal(report.status, 'PASS');
  assert.equal(report.migrationCompatibility.legacyHashMatches, true);
  assert.equal(report.migrationCompatibility.exactCellSetMatch, true);
  assert.equal(report.derivedRaster.walkableCellCount, 17);
  assert.equal(report.futureRasterAuthority, 'WALKABLE_ENVELOPE_AFTER_FREEZE');
});

test('materialization is deterministic', () => {
  const a = materializeEnvelope(model, ROOT);
  const b = materializeEnvelope(structuredClone(model), ROOT);
  assert.equal(JSON.stringify(a.report), JSON.stringify(b.report));
  assert.equal(a.svg, b.svg);
});
