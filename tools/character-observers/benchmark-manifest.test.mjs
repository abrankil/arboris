import test from 'node:test';
import assert from 'node:assert/strict';
import { validateH16BenchmarkManifest } from './benchmark-manifest.mjs';

test('H16-EXP-001 benchmark manifest V1 has fixed membership and anti-leakage', async () => {
  const result = await validateH16BenchmarkManifest();
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.deepEqual(result.counts, {
    development: 30,
    holdout: 14,
    excluded: 1,
    outsideManifest: 48,
  });
});

test('new photos in canonical registry are not silently absorbed into frozen benchmark', async () => {
  const result = await validateH16BenchmarkManifest();
  assert.equal(result.outsideManifest.length, 48);
  assert.equal(result.outsideManifest[0], 'PH-046');
  assert.equal(result.outsideManifest.at(-1), 'PH-093');
});

test('PH-029 remains excluded while PH-028 remains holdout', async () => {
  const result = await validateH16BenchmarkManifest();
  assert.ok(result.manifest.partitions.excluded.includes('PH-029'));
  assert.ok(result.manifest.partitions.holdout.includes('PH-028'));
  assert.equal(result.manifest.partitions.holdout.includes('PH-029'), false);
});


test('every frozen benchmark asset has a Git blob identity', async () => {
  const result = await validateH16BenchmarkManifest();
  assert.ok(result.manifest.photos.every(item => /^[0-9a-f]{40}$/.test(item.assetIdentity.gitBlobSha1)));
});

test('PH-028 and excluded PH-029 resolve to the same frozen blob identity', async () => {
  const result = await validateH16BenchmarkManifest();
  const byId = new Map(result.manifest.photos.map(item => [item.photoId, item]));
  assert.equal(byId.get('PH-028').assetIdentity.gitBlobSha1, byId.get('PH-029').assetIdentity.gitBlobSha1);
});
