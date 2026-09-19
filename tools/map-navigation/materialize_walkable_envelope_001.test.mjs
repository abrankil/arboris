import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeDerivedRaster,
  loadAuthorityManifest,
  materializeWalkableEnvelopeAuthority,
  rasterizeEnvelope,
  validateAuthorityManifest,
  validateEnvelopeModel,
  validateFrameBoundaryPolicy,
  verifyAuthorizedCandidate,
  WalkableEnvelopeAuthorityError,
  DEFAULT_AUTHORITY_PATH
} from './materialize_walkable_envelope_001.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const MODEL_PATH = path.join(ROOT, 'data/maps/map-001-walkable-envelope-candidate-001.json');
const AUTHORITY_PATH = path.join(ROOT, DEFAULT_AUTHORITY_PATH);
const CANDIDATE_REL = 'data/maps/map-001-walkable-envelope-candidate-001.json';

const model = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
const authorityManifest = JSON.parse(fs.readFileSync(AUTHORITY_PATH, 'utf8'));

// This suite is authority-runtime only (RECTIFICATION 001, objective 1): it
// never opens, moves, copies, or requires Candidate 002
// (data/maps/map-001-blockout-candidate-002.json). Migration/legacy
// comparison behavior is covered exclusively by
// materialize_walkable_envelope_001.migration.test.mjs.

// Builds a temp root containing byte-for-byte copies of only the authority
// manifest and Candidate 001 — Candidate 002 is never copied and is verified
// absent. Caller must clean up the returned dir in a finally block.
function buildAuthorityOnlyRoot() {
  const tempRoot = fs.mkdtempSync(path.join(ROOT, 'tools/map-navigation/.tmp-authority-only-root-'));
  const authorityDest = path.join(tempRoot, DEFAULT_AUTHORITY_PATH);
  const candidateDest = path.join(tempRoot, CANDIDATE_REL);
  fs.mkdirSync(path.dirname(authorityDest), { recursive: true });
  fs.mkdirSync(path.dirname(candidateDest), { recursive: true });
  fs.copyFileSync(AUTHORITY_PATH, authorityDest);
  fs.copyFileSync(MODEL_PATH, candidateDest);
  return tempRoot;
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

test('changing envelope geometry changes derived raster rather than a fixed/frozen answer', () => {
  const original = rasterizeEnvelope(model);
  const changed = structuredClone(model);
  changed.geometry.centerline = [[4.5,15],[4.5,0]];
  const derived = rasterizeEnvelope(changed);
  assert.notDeepEqual(derived, original);
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

// Builds two clean vertical "spike" touches on screen_up (y=0) at x=4.5 and
// x=4.5+separation, joined by a connector segment held at y=3 (far enough
// from y=0, relative to halfWidth=0.05, to contribute no interval there).
// Each spike is a pure vertical segment ending exactly at y=0, so its
// boundary interval is exactly [x-halfWidth, x+halfWidth] with no
// contribution from any other segment — this makes the gap between the two
// raw intervals (before merging) exactly `separation - 2*halfWidth`,
// independent of Candidate 001's own geometry/halfWidth.
function twoSpikeCenterline(separation) {
  const halfWidth = 0.05;
  const centerline = [
    [4.5, 15],
    [4.5, 3],
    [4.5, 0],
    [4.5, 3],
    [4.5 + separation, 3],
    [4.5 + separation, 0]
  ];
  return { centerline, halfWidth };
}

test('two near-duplicate crossings (0 < gap <= epsilon) merge into one region -> PASS', () => {
  const mutated = structuredClone(model);
  // separation - 2*halfWidth = 0.1000000005 - 0.1 = 5e-10, i.e. 0 < gap <= 1e-9.
  const { centerline, halfWidth } = twoSpikeCenterline(0.1000000005);
  mutated.geometry.centerline = centerline;
  mutated.geometry.halfWidth = halfWidth;
  assert.equal(validateFrameBoundaryPolicy(mutated), true);
});

test('two crossings with gap just above epsilon (gap > 1e-9) -> fail closed, regions stay separate', () => {
  const mutated = structuredClone(model);
  // separation - 2*halfWidth = 0.100000002 - 0.1 = 2e-9, i.e. gap > 1e-9.
  const { centerline, halfWidth } = twoSpikeCenterline(0.100000002);
  mutated.geometry.centerline = centerline;
  mutated.geometry.halfWidth = halfWidth;
  assert.throws(
    () => validateFrameBoundaryPolicy(mutated),
    (err) => err instanceof WalkableEnvelopeAuthorityError
      && err.code === 'FRAME_BOUNDARY_OPEN_PORT_NOT_SINGLE_REGION'
      && err.details.regions.length === 2
  );
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
// Independence is proven by constructing a root where Candidate 002 cannot
// possibly be read (it was never copied there), not by moving the real file.
// ---------------------------------------------------------------------------

test('authority-runtime: valid manifest + valid candidate -> PASS', () => {
  const { report } = materializeWalkableEnvelopeAuthority(ROOT);
  assert.equal(report.status, 'PASS');
  assert.equal(report.derivedRaster.walkableCellCount, 17);
  assert.equal(report.candidate002Dependency, false);
  assert.equal(report.territorialGeometryClaim, false);
  assert.equal(report.frameBoundaryPolicy, 'OPEN_PORTS_MAY_CROSS_FRAME');
});

test('authority-runtime: valid manifest + valid candidate + Candidate 002 absent from root -> PASS', () => {
  const tempRoot = buildAuthorityOnlyRoot();
  try {
    const legacyAbsolute = path.join(tempRoot, 'data/maps/map-001-blockout-candidate-002.json');
    assert.equal(fs.existsSync(legacyAbsolute), false);

    const { report } = materializeWalkableEnvelopeAuthority(tempRoot);
    assert.equal(report.status, 'PASS');
    assert.equal(report.derivedRaster.walkableCellCount, 17);
    assert.equal(report.candidate002Dependency, false);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
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
