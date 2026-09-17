import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCanonicalDataset } from './dataset.mjs';

test('ACE isolation probe: canonical dataset remains independently loadable', () => {
  const dataset = loadCanonicalDataset();
  assert.ok(dataset);
});
