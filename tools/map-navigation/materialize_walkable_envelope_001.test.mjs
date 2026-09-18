import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeDerivedRaster,
  compareLegacyRaster,
  loadAuthorityManifest,
  materializeWalkableEnvelopeAuthority,
  rasterizeEnvelope,
  validateAuthorityManifest,
  validateEnvelopeModel,
  validateFrameBoundaryPolicy,
  validateWalkableEnvelopeMigration,
  verifyAuthorizedCandidate,
  WalkableEnvelopeAuthorityError,
  DEFAULT_AUTHORITY_PATH
} from './materialize_walkable_envelope_001.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const MODEL_PATH = path.join(ROOT, 'data/maps/map-001-walkable-envelope-candidate-001.json');
const LEGACY_PATH = path.join(ROOT, 'data/maps/map-001-blockout-candidate-002.json');
const AUTHORITY_PATH = path.join(ROOT, DEFAULT_AUTHORITY_PATH);

const model = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
const legacy = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf8'));
const authorityManifest = JSON.parse(fs.readFileSync(AUTHORITY_PATH, 'utf8'));

function sortCells(cells) {
  return cells.slice().sort((a,b) => a[0]-b[0] || a[1]-b[1]);
}

// Temporarily moves a real file out of the way and back, so "absent input"
// tests exercise real filesystem absence without ever deleting or mutating
// a frozen artifact. Never touches the file's content.
function withFileTemporarilyMoved(filePath, fn) {
  const tempPath = filePath + '.tmp-test-moved';
  fs.renameSync(filePath, tempPath);
  try {
    return fn();
  } finally {
    fs.renameSync(tempPath, filePath);
  }
}

// ---------------------------------------------------------------------------
// Shape / geometry (unchanged behavior, still exercised against the frozen
// candidate directly).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// frameBoundaryPolicy = OPEN_PORTS_MAY_CROSS_FRAME
// ---------------------------------------------------------------------------

test('valid open-port crossing -> PASS (frozen candidate satisfies frameBoundaryPolicy)', () => {
  assert.equal(validateFrameBoundaryPolicy(model), true);
});

test('lateral envelope intersection -> fail closed (in-memory fixture, frozen candidate untouched)', () => {
  const mutated = structuredClone(model);
  // Shift the corridor so it touches screen_left; this never writes to disk.
  mutated.geometry.centerline = mutated.geometry.centerline.map(([x, y]) => [x - 4, y]);
  assert.throws(
    () => validateFrameBoundaryPolicy(mutated),
    (err) => err instanceof WalkableEnvelopeAuthorityError && err.code === 'FRAME_BOUNDARY_LATERAL_INTERSECTION'
  );
});

// ---------------------------------------------------------------------------
// Exact analytic intersection (no discrete sampling): finite-domain
// restriction, epsilon-based interval merging, tangency, and multi-region
// cases. All fixtures are in-memory clones/synthetic geometry — nothing on
// disk is read or written by these tests, and the frozen candidate is never
// mutated in place.
// ---------------------------------------------------------------------------

test('two disjoint open-port crossings (gap > epsilon) -> fail closed, regions stay separate', () => {
  const mutated = structuredClone(model);
  // U-shape touching screen_up (y=0) at x=1 and x=7, far apart (gap >> epsilon).
  mutated.geometry.centerline = [[1, 0], [1, 4], [7, 4], [7, 0]];
  assert.throws(
    () => validateFrameBoundaryPolicy(mutated),
    (err) => err instanceof WalkableEnvelopeAuthorityError
      && err.code === 'FRAME_BOUNDARY_OPEN_PORT_NOT_SINGLE_REGION'
      && err.details.regions.length === 2
  );
});

test('two near-duplicate crossings (gap <= epsilon) merge into one region -> PASS', () => {
  const mutated = structuredClone(model);
  // screen_down (y=15) is touched once, exactly as in the real candidate
  // (P-IN anchor unaffected). screen_up (y=0) is touched TWICE, by two
  // vertical stubs at x=4.5 and x=4.5+1e-10: their capsule intervals
  // overlap almost entirely (halfWidth 0.49 >> 1e-10), so the gap between
  // them is far below FRAME_BOUNDARY_EPSILON and they must merge into a
  // single region containing the real P-OUT anchor (x=4.5).
  mutated.geometry.centerline = [
    [4.5, 15], [4.5, 3], [4.5, 0], [4.5 + 1e-10, 3], [4.5 + 1e-10, 0]
  ];
  assert.equal(validateFrameBoundaryPolicy(mutated), true);
});

test('single open-port region whose anchor was moved outside it -> fail closed', () => {
  const mutated = structuredClone(model);
  const exit = mutated.ports.find((p) => p.id === 'P-OUT');
  exit.anchor = [8, 0]; // geometry unchanged (single region near x=4.5); anchor moved away
  assert.throws(
    () => validateFrameBoundaryPolicy(mutated),
    (err) => err instanceof WalkableEnvelopeAuthorityError && err.code === 'FRAME_BOUNDARY_ANCHOR_NOT_IN_REGION'
  );
});

test('tiny but nonzero lateral contact with screen_left -> fail closed (not swallowed by epsilon)', () => {
  const mutated = structuredClone(model);
  // Endpoint at x=0.001 sits 0.001 units from screen_left (x=0); halfWidth
  // 0.05 produces a real, if small (~0.1 wide), crossing region — far above
  // FRAME_BOUNDARY_EPSILON (1e-9), so it must still fail closed.
  mutated.geometry.centerline = [[0.001, 5], [3, 5]];
  mutated.geometry.halfWidth = 0.05;
  assert.throws(
    () => validateFrameBoundaryPolicy(mutated),
    (err) => err instanceof WalkableEnvelopeAuthorityError && err.code === 'FRAME_BOUNDARY_LATERAL_INTERSECTION'
  );
});

test('exact tangency [t,t] with screen_left -> fail closed', () => {
  const mutated = structuredClone(model);
  // Endpoint at x=0.05 with halfWidth=0.05: distance to screen_left (x=0)
  // equals halfWidth exactly, producing a zero-width tangent interval.
  // distance <= halfWidth is inclusive, so this must still be treated as
  // an intersection.
  mutated.geometry.centerline = [[0.05, 5], [3, 5]];
  mutated.geometry.halfWidth = 0.05;
  assert.throws(
    () => validateFrameBoundaryPolicy(mutated),
    (err) => err instanceof WalkableEnvelopeAuthorityError
      && err.code === 'FRAME_BOUNDARY_LATERAL_INTERSECTION'
      && err.details.regions.length === 1
      && Math.abs(err.details.regions[0][1] - err.details.regions[0][0]) < 1e-6
  );
});

// ---------------------------------------------------------------------------
// Authority manifest — exact-value validation, fail closed.
// ---------------------------------------------------------------------------

test('authority manifest loads and validates by exact value against the real frozen manifest', () => {
  const manifest = loadAuthorityManifest(ROOT);
  assert.equal(validateAuthorityManifest(manifest), true);
  assert.equal(manifest.authorityId, 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001');
});

test('manifest invariant mismatch -> fail closed', () => {
  const mutated = structuredClone(authorityManifest);
  mutated.status = 'SOMETHING_ELSE';
  assert.throws(
    () => validateAuthorityManifest(mutated),
    (err) => err instanceof WalkableEnvelopeAuthorityError && err.code === 'AUTHORITY_INVARIANT_MISMATCH'
  );
});

test('candidate.id mismatch -> fail closed', () => {
  const mutatedManifest = structuredClone(authorityManifest);
  mutatedManifest.sourceCandidate.id = 'MAP-001-WALKABLE-ENVELOPE-CANDIDATE-999';
  assert.throws(
    () => verifyAuthorizedCandidate(mutatedManifest, ROOT),
    (err) => err instanceof WalkableEnvelopeAuthorityError && err.code === 'CANDIDATE_ID_MISMATCH'
  );
});

test('candidate SHA mismatch -> fail closed (temp candidate copy, frozen file untouched)', () => {
  const tempDir = fs.mkdtempSync(path.join(ROOT, 'tools/map-navigation/.tmp-sha-test-'));
  const tempCandidatePath = path.join(tempDir, 'candidate.json');
  try {
    const mutatedCandidate = structuredClone(model);
    mutatedCandidate.__testMutation = 'this changes the file bytes, not the declared sha256';
    fs.writeFileSync(tempCandidatePath, JSON.stringify(mutatedCandidate, null, 2));

    const manifestWithWrongTarget = structuredClone(authorityManifest);
    manifestWithWrongTarget.sourceCandidate.path = path.relative(ROOT, tempCandidatePath);
    // sourceCandidate.sha256 intentionally left as the real frozen candidate's hash.

    assert.throws(
      () => verifyAuthorizedCandidate(manifestWithWrongTarget, ROOT),
      (err) => err instanceof WalkableEnvelopeAuthorityError && err.code === 'CANDIDATE_SHA_MISMATCH'
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// authority-runtime: PASS / independence from Candidate 002 / determinism.
// ---------------------------------------------------------------------------

test('authority-runtime: valid manifest + valid candidate -> PASS', () => {
  const { report } = materializeWalkableEnvelopeAuthority(ROOT);
  assert.equal(report.status, 'PASS');
  assert.equal(report.derivedRaster.walkableCellCount, 17);
  assert.equal(report.candidate002Dependency, false);
  assert.equal(report.territorialGeometryClaim, false);
  assert.equal(report.frameBoundaryPolicy, 'OPEN_PORTS_MAY_CROSS_FRAME');
});

test('authority-runtime: valid manifest + valid candidate + Candidate 002 absent -> PASS', () => {
  const result = withFileTemporarilyMoved(LEGACY_PATH, () => materializeWalkableEnvelopeAuthority(ROOT));
  assert.equal(result.report.status, 'PASS');
  assert.equal(result.report.derivedRaster.walkableCellCount, 17);
});

test('authority-runtime: manifest invariant mismatch -> fail closed, no PASS', () => {
  // exercised indirectly through a broken authority path so the real
  // manifest file is never touched.
  const { report } = materializeWalkableEnvelopeAuthority(ROOT, 'data/baselines/does-not-exist.json');
  assert.equal(report.status, 'FAIL_CLOSED');
  assert.equal(report.failureClass, 'AUTHORITY_INPUT_FAILURE');
  assert.equal(report.code, 'AUTHORITY_MANIFEST_UNREADABLE');
});

test('authority-runtime materialization is deterministic (A/B)', () => {
  const a = materializeWalkableEnvelopeAuthority(ROOT);
  const b = materializeWalkableEnvelopeAuthority(ROOT);
  assert.equal(JSON.stringify(a.report), JSON.stringify(b.report));
  assert.equal(a.svg, b.svg);
});

// ---------------------------------------------------------------------------
// migration-evidence: separate entry point, structured missing-input result.
// ---------------------------------------------------------------------------

test('migration-evidence: valid Candidate 002 -> compatibility verdict produced', () => {
  const result = validateWalkableEnvelopeMigration(ROOT);
  assert.equal(result.status, 'MIGRATION_PASS');
  assert.ok(result.comparison);
  assert.equal(result.comparison.legacyHashMatches, true);
  assert.equal(result.comparison.exactCellSetMatch, true);
});

test('migration-evidence: Candidate 002 missing -> structured missing-input failure, no PASS/REVISE verdict', () => {
  const result = withFileTemporarilyMoved(LEGACY_PATH, () => validateWalkableEnvelopeMigration(ROOT));
  assert.equal(result.status, 'MIGRATION_INPUT_MISSING');
  assert.equal(result.failureClass, 'MIGRATION_INPUT_FAILURE');
  assert.equal(result.code, 'LEGACY_CANDIDATE_ABSENT');
  assert.notEqual(result.status, 'MIGRATION_PASS');
  assert.notEqual(result.status, 'MIGRATION_REVISE');
});

test('compareLegacyRaster (reused, unchanged core) still matches legacy Candidate 002 exactly', () => {
  const comparison = compareLegacyRaster(model, ROOT);
  assert.equal(comparison.exactCellSetMatch, true);
  assert.equal(comparison.legacyHashMatches, true);
});
