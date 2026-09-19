import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeRaster,
  buildExecutableFixture,
  checkProvenanceIntegrity,
  runPreintegration,
} from './map001_tilegrammar_preintegration_001.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const mapModel = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/maps/map-001-blockout-candidate-002.json'), 'utf8'));
const contract = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/integration/map001-tilegrammar-preintegration-test-001.contract.json'), 'utf8'));

test('PI-01 derives exact provisional raster graph facts', () => {
  const graph = analyzeRaster(mapModel);
  assert.equal(graph.walkableCellCount, 17);
  assert.equal(graph.orthogonalSharedAdjacencies, 16);
  assert.equal(graph.connectedComponents, 1);
  assert.equal(graph.branchingNodes, 0);
  assert.deepEqual(graph.endpointCells, [[0, 4], [14, 4]]);
});

test('adapter does not infer a per-cell path overlay', () => {
  const graph = analyzeRaster(mapModel);
  const fixture = buildExecutableFixture(mapModel, graph);
  assert.equal(fixture.tiles.length, 17);
  assert.equal(fixture.adjacencies.length, 16);
  for (const tile of fixture.tiles) {
    assert.equal(tile.route.kind, 'none');
    assert.deepEqual(tile.route.ports, []);
  }
});

test('fixture provenance isolates scaffolding from derived walkability and shared traversal', () => {
  const graph = analyzeRaster(mapModel);
  const fixture = buildExecutableFixture(mapModel, graph);
  const integrity = checkProvenanceIntegrity(fixture);
  assert.equal(integrity.pass, true);
  assert.deepEqual(integrity.violations, []);
  for (const tile of fixture.tiles) {
    const p = fixture.fieldProvenance[tile.cellId];
    assert.equal(p.walkability, 'DERIVED_FROM_TEST_RASTER');
    assert.equal(p['surface.composition'], 'TEST_SCAFFOLD');
    assert.equal(p['route.kind'], 'TEST_SCAFFOLD');
    assert.equal(p['elevation.mode'], 'TEST_SCAFFOLD');
  }
});

test('Node 24 pre-integration run passes all eight fixtures', () => {
  const report = runPreintegration({ root: ROOT });
  assert.equal(report.executionStatus, 'COMPLETED');
  assert.equal(report.semanticDecision, 'PASS');
  assert.equal(report.fixtures.length, 8);
  assert.deepEqual(
    report.fixtures.map((item) => item.status),
    [
      'BASELINE_VALID',
      'PASS_WITH_SCOPE',
      'PASS_WITH_NORMALIZATION',
      'OPEN_PRESERVED',
      'OPEN_PRESERVED',
      'OUT_OF_SCOPE_RECORDED',
      'OUT_OF_SCOPE_RECORDED',
      'PASS',
    ],
  );
});

test('PI-03 and PI-04 preserve zero inferred water/bank and blocker edges', () => {
  const report = runPreintegration({ root: ROOT });
  assert.equal(report.executableFixture.inferredWaterBankEdges, 0);
  assert.equal(report.executableFixture.inferredBlockerEdges, 0);
  assert.equal(report.executableFixture.routeOverlayDerived, false);
});

test('PI-05 and PI-06 preserve boundary and cross-layer metadata outside terrain grammar', () => {
  const report = runPreintegration({ root: ROOT });
  assert.equal(report.boundaryMetadata.screen_up.progressionRole, 'exit');
  assert.equal(report.boundaryMetadata.screen_down.progressionRole, 'entry');
  assert.deepEqual(report.outOfScopePreserved.bridge.cell, [10, 4]);
  assert.equal(report.outOfScopePreserved.interactionLearningStatus, 'STRUCTURAL_CONTRACT_DEFINED');
  assert.equal(report.outOfScopePreserved.cameraProfileId, 'PILOT_FIXED_ISOMETRIC');
  const separation = report.mappingRecords.find((item) => item.fixtureId === 'PI-06-SEPARATION-OF-CONCERNS');
  assert.equal(separation.evidence.bridgeCrossLayerOverlapPreserved, true);
});

test('PI-00 fails closed on a pinned-hash mismatch', () => {
  const invalid = structuredClone(contract);
  const target = invalid.authorizedInputs.find((item) => item.path === 'data/maps/map-001-blockout-candidate-002.json');
  target.sha256 = '0'.repeat(64);
  const report = runPreintegration({ root: ROOT, contractOverride: invalid });
  assert.equal(report.executionStatus, 'INVALID_BASELINE');
  assert.equal(report.semanticDecision, null);
  assert.equal(report.fixtures.length, 1);
  assert.equal(report.fixtures[0].status, 'INVALID_BASELINE');
});

test('report is deterministic for the same baseline and runtime', () => {
  const a = runPreintegration({ root: ROOT });
  const b = runPreintegration({ root: ROOT });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
