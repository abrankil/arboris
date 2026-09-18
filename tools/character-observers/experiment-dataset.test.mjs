import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadExperimentDataset,
  getPartitionForIndividual,
  getPartitionForPhoto,
  buildObserverInput,
  getAnnotationsForPhoto,
  listUsablePhotoIds,
  isExcludedPhoto,
  OBSERVER_INPUT_WHITELIST_FIELDS,
} from './experiment-dataset.mjs';

const BANNED_FIELDS = [
  'species_id',
  'speciesId',
  'photoId',
  'individualId',
  'archivo',
  'filename',
  'nombre_cientifico',
  'nombre_comun',
  'scientificName',
  'commonName',
  'status',
  'observedState',
  'observed_state',
  'groundTruth',
];

async function load() {
  return loadExperimentDataset();
}

test('development partition has exactly 30 usable photos', async () => {
  const dataset = await load();
  assert.equal(listUsablePhotoIds(dataset, 'development').length, 30);
});

test('holdout partition has exactly 14 usable photos', async () => {
  const dataset = await load();
  assert.equal(listUsablePhotoIds(dataset, 'holdout').length, 14);
});

test('no individual_id appears in both partitions', async () => {
  const dataset = await load();
  const dev = new Set(
    listUsablePhotoIds(dataset, 'development').map(
      id => dataset.photosById.get(id).individual_id,
    ),
  );
  const holdout = new Set(
    listUsablePhotoIds(dataset, 'holdout').map(
      id => dataset.photosById.get(id).individual_id,
    ),
  );
  for (const individualId of dev) {
    assert.equal(holdout.has(individualId), false);
  }
});

test('PH-029 is excluded and its exclusion prevails over LC003 holdout membership', async () => {
  const dataset = await load();
  assert.equal(isExcludedPhoto(dataset, 'PH-029'), true);
  assert.equal(getPartitionForPhoto(dataset, 'PH-029'), 'excluded');

  // LC003's other photo (PH-028) remains usable in holdout.
  assert.equal(getPartitionForPhoto(dataset, 'PH-028'), 'holdout');
  assert.equal(getPartitionForIndividual(dataset, 'LC003'), 'holdout');

  const holdoutIds = listUsablePhotoIds(dataset, 'holdout');
  assert.equal(holdoutIds.includes('PH-029'), false);
});

test('excluded + development + holdout accounts for all 45 registered photos', async () => {
  const dataset = await load();
  const dev = listUsablePhotoIds(dataset, 'development').length;
  const holdout = listUsablePhotoIds(dataset, 'holdout').length;
  const excluded = Object.keys(dataset.excludedPhotos).length;
  assert.equal(dev + holdout + excluded, dataset.photosById.size);
  assert.equal(dataset.photosById.size, 45);
});

test('buildObserverInput exposes exactly the minimal whitelisted keys', async () => {
  const dataset = await load();
  const input = buildObserverInput(dataset, 'PH-001');
  const keys = Object.keys(input).sort();
  assert.deepEqual(keys, [
    'captureDate',
    'characterId',
    'evidenceType',
    'imageRef',
    'organStructure',
  ]);
  for (const key of keys) {
    assert.equal(OBSERVER_INPUT_WHITELIST_FIELDS.includes(key), true);
  }
  assert.equal(input.characterId, 'CH-003');
});

test('buildObserverInput never exposes species or ground-truth fields', async () => {
  const dataset = await load();
  const input = buildObserverInput(dataset, 'PH-001');
  const serialized = JSON.stringify(input);
  for (const banned of BANNED_FIELDS) {
    assert.equal(
      serialized.toLowerCase().includes(banned.toLowerCase()),
      false,
      `observer input must not contain ${banned}`,
    );
  }
});

test('buildObserverInput refuses to build input for an excluded photo', async () => {
  const dataset = await load();
  assert.throws(() => buildObserverInput(dataset, 'PH-029'), /excluded/);
});

test('buildObserverInput fails explicitly for an unknown photo_id', async () => {
  const dataset = await load();
  assert.throws(() => buildObserverInput(dataset, 'PH-999'), /Unknown photo_id/);
});

test('getPartitionForIndividual fails explicitly for an unknown individual_id', async () => {
  const dataset = await load();
  assert.throws(
    () => getPartitionForIndividual(dataset, 'ZZ999'),
    /Unknown individual_id/,
  );
});

test('getPartitionForPhoto fails explicitly for an unknown photo_id', async () => {
  const dataset = await load();
  assert.throws(() => getPartitionForPhoto(dataset, 'PH-999'), /Unknown photo_id/);
});

test('annotations.json starts empty and is never used to build observer input', async () => {
  const dataset = await load();
  assert.deepEqual(dataset.annotations, []);
  const annotations = getAnnotationsForPhoto(dataset, 'PH-001');
  assert.deepEqual(annotations, []);
});

test('getAnnotationsForPhoto fails explicitly for an unknown photo_id', async () => {
  const dataset = await load();
  assert.throws(
    () => getAnnotationsForPhoto(dataset, 'PH-999'),
    /Unknown photo_id/,
  );
});
