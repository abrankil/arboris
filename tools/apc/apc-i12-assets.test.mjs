import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApcAssetRuntime,
  sha256OriginalBytes,
  verifyApcRelinkFile,
} from './apc-i12-assets.mjs';

test('exact-byte SHA-256 is deterministic and lowercase', async () => {
  const bytes = new TextEncoder().encode('abc');
  const digest = await sha256OriginalBytes(bytes);
  assert.equal(digest, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('relink accepts same digest despite persisted hex capitalization', async () => {
  const bytes = new TextEncoder().encode('abc');
  const result = await verifyApcRelinkFile(bytes, 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
  assert.equal(result.match, true);
});

test('relink rejects different bytes', async () => {
  const result = await verifyApcRelinkFile(
    new TextEncoder().encode('different'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
  assert.equal(result.match, false);
  assert.equal(result.reason, 'FINGERPRINT_MISMATCH');
});

test('asset runtime revokes previous URL on replacement and clear', () => {
  const created = [];
  const revoked = [];
  const runtime = new ApcAssetRuntime({
    createObjectURL(file) {
      const url = `blob:test-${created.length + 1}`;
      created.push([file, url]);
      return url;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    },
  });

  runtime.attach('PH-1', { name: 'a.jpg' });
  runtime.attach('PH-1', { name: 'b.jpg' });
  assert.deepEqual(revoked, ['blob:test-1']);
  runtime.clear();
  assert.deepEqual(revoked, ['blob:test-1', 'blob:test-2']);
  assert.equal(runtime.get('PH-1'), null);
});
