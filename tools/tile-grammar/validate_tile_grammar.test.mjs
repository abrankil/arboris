import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  assertEdgeMatch,
  validateEdgeMatch,
  validatePatch,
  validateTile,
} from './validate_tile_grammar.mjs';

const grammar = JSON.parse(fs.readFileSync(new URL('../../data/tiles/tile-grammar-candidate-v0.1.json', import.meta.url), 'utf8'));
const byId = new Map(grammar.tiles.map((tile) => [tile.cellId, tile]));
const clone = (value) => structuredClone(value);

test('candidate grammar validates as a deterministic 3x3 patch', () => {
  const report = validatePatch(grammar);
  assert.equal(report.status, 'PASS');
  assert.equal(report.patchCells, 9);
  assert.equal(report.internalEdgesValidated, 12);
  assert.equal(report.productionStandard, 'NOT_ESTABLISHED');
});

test('path port must connect to path port', () => {
  const a = clone(byId.get('C05'));
  const b = clone(byId.get('C06'));
  b.route = { kind: 'none', ports: [] };
  b.edges.grid_left.routePort = false;
  const result = validateEdgeMatch(a, 'grid_right', b);
  assert.equal(result.compatible, false);
  assert.match(result.errors.join(' '), /routePort mismatch/);
});

test('open edge cannot connect to closed edge', () => {
  const a = clone(byId.get('C07'));
  const b = clone(byId.get('C08'));
  b.edges.grid_left.traversal = 'closed';
  const result = validateEdgeMatch(a, 'grid_right', b);
  assert.equal(result.compatible, false);
  assert.match(result.errors.join(' '), /traversal mismatch/);
});

test('land-water adjacency requires a closed bank interface', () => {
  assertEdgeMatch(byId.get('C08'), 'grid_right', byId.get('C09'));
  const bad = clone(byId.get('C09'));
  bad.edges.grid_left.profile = 'level';
  const result = validateEdgeMatch(byId.get('C08'), 'grid_right', bad);
  assert.equal(result.compatible, false);
  assert.match(result.errors.join(' '), /edgeProfile mismatch|edgeContent mismatch/);
});

test('band endpoints must reverse-match across a shared edge', () => {
  const a = clone(byId.get('C01'));
  const b = clone(byId.get('C02'));
  b.edges.grid_left.bandEndpoints = [2, 2];
  const result = validateEdgeMatch(a, 'grid_right', b);
  assert.equal(result.compatible, false);
  assert.match(result.errors.join(' '), /bandEndpoints mismatch/);
});

test('hard blockers fail closed if any edge becomes traversable', () => {
  const blocker = clone(byId.get('C03'));
  blocker.edges.grid_left.traversal = 'open';
  assert.throws(() => validateTile(blocker), /hard blocker edges must be closed|blocked edge must be closed/);
});

test('metric and renderer authority remain OPEN', () => {
  const invalid = clone(grammar);
  invalid.authority.metricScale = '1m-per-cell';
  assert.throws(() => validatePatch(invalid), /metric scale must remain OPEN/);
});
