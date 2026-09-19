import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compareLegacyRaster,
  validateWalkableEnvelopeMigration,
  DEFAULT_AUTHORITY_PATH
} from './materialize_walkable_envelope_001.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const MODEL_PATH = path.join(ROOT, 'data/maps/map-001-walkable-envelope-candidate-001.json');
const AUTHORITY_PATH = path.join(ROOT, DEFAULT_AUTHORITY_PATH);
const CANDIDATE_REL = 'data/maps/map-001-walkable-envelope-candidate-001.json';

const model = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));

// migration-evidence only (RECTIFICATION 001, objective 3): this is the sole
// suite that reads Candidate 002
// (data/maps/map-001-blockout-candidate-002.json). authority-runtime
// behavior is covered exclusively by materialize_walkable_envelope_001.test.mjs.

// Builds a temp root containing byte-for-byte copies of only the authority
// manifest and Candidate 001 — Candidate 002 is never copied, so migration
// validation observes a real, structural absence without ever moving the
// frozen legacy artifact.
function buildAuthorityOnlyRoot() {
  const tempRoot = fs.mkdtempSync(path.join(ROOT, 'tools/map-navigation/.tmp-migration-noc2-root-'));
  const authorityDest = path.join(tempRoot, DEFAULT_AUTHORITY_PATH);
  const candidateDest = path.join(tempRoot, CANDIDATE_REL);
  fs.mkdirSync(path.dirname(authorityDest), { recursive: true });
  fs.mkdirSync(path.dirname(candidateDest), { recursive: true });
  fs.copyFileSync(AUTHORITY_PATH, authorityDest);
  fs.copyFileSync(MODEL_PATH, candidateDest);
  return tempRoot;
}

test('migration-evidence: valid Candidate 002 -> compatibility verdict produced (MIGRATION_PASS)', () => {
  const result = validateWalkableEnvelopeMigration(ROOT);
  assert.equal(result.status, 'MIGRATION_PASS');
  assert.ok(result.comparison);
  assert.equal(result.comparison.legacyHashMatches, true);
  assert.equal(result.comparison.exactCellSetMatch, true);
});

test('migration-evidence: Candidate 002 missing -> structured missing-input failure, no PASS/REVISE verdict', () => {
  const tempRoot = buildAuthorityOnlyRoot();
  try {
    const legacyAbsolute = path.join(tempRoot, 'data/maps/map-001-blockout-candidate-002.json');
    assert.equal(fs.existsSync(legacyAbsolute), false);

    const result = validateWalkableEnvelopeMigration(tempRoot);
    assert.equal(result.status, 'MIGRATION_INPUT_MISSING');
    assert.equal(result.failureClass, 'MIGRATION_INPUT_FAILURE');
    assert.equal(result.code, 'LEGACY_CANDIDATE_ABSENT');
    assert.notEqual(result.status, 'MIGRATION_PASS');
    assert.notEqual(result.status, 'MIGRATION_REVISE');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('compareLegacyRaster (reused, unchanged core) still matches legacy Candidate 002 exactly', () => {
  const comparison = compareLegacyRaster(model, ROOT);
  assert.equal(comparison.exactCellSetMatch, true);
  assert.equal(comparison.legacyHashMatches, true);
});
