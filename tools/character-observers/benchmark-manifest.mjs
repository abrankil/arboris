import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const DEFAULT_MANIFEST = join(REPO_ROOT, 'data', 'experiments', 'h16-exp-001', 'benchmark-manifest-v1.json');
const DEFAULT_PHOTOS = join(REPO_ROOT, 'data', 'botanical', 'photos.json');
const PARTITIONS = new Set(['development','holdout','excluded']);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function validateH16BenchmarkManifest({
  manifestPath = DEFAULT_MANIFEST,
  photosPath = DEFAULT_PHOTOS,
} = {}) {
  const [manifest, photos] = await Promise.all([readJson(manifestPath), readJson(photosPath)]);
  const errors = [];
  const photosById = new Map(photos.map(p => [p.photo_id, p]));

  if (manifest.experimentId !== 'H16-EXP-001') errors.push('experimentId must be H16-EXP-001');
  if (manifest.characterId !== 'CH-003') errors.push('characterId must be CH-003');
  if (!/^\d+\.\d+\.\d+$/.test(manifest.manifestVersion ?? '')) errors.push('manifestVersion must be semver');
  if (!manifest.sourceDataset?.commit || !/^[0-9a-f]{40}$/.test(manifest.sourceDataset.commit)) errors.push('sourceDataset.commit must be a full Git SHA');
  if (!manifest.sourceDataset?.gitBlobSha1 || !/^[0-9a-f]{40}$/.test(manifest.sourceDataset.gitBlobSha1)) errors.push('sourceDataset.gitBlobSha1 must be a Git blob SHA');
  if (manifest.sourceDataset?.semantic !== 'expanded_registry_snapshot') errors.push('sourceDataset.semantic must describe the expanded registry snapshot');
  if (manifest.benchmarkPopulation?.semantic !== 'historical_pre_expansion_subset') errors.push('benchmarkPopulation.semantic must describe the frozen historical subset');
  const candidateState = manifest.status === 'CANDIDATE' && manifest.validationState === 'PENDING_FINAL_ASC_VALIDATION';
  const frozenState = manifest.status === 'FROZEN' && manifest.validationState === 'VALIDATED_WITH_ASC';
  if (!candidateState && !frozenState) {
    errors.push('manifest status/validationState pair must be CANDIDATE/PENDING_FINAL_ASC_VALIDATION or FROZEN/VALIDATED_WITH_ASC');
  }

  const entries = Array.isArray(manifest.photos) ? manifest.photos : [];
  const seen = new Set();
  const devIndividuals = new Set();
  const holdIndividuals = new Set();
  const partitionIds = { development:new Set(), holdout:new Set(), excluded:new Set() };

  for (const item of entries) {
    if (!item?.photoId || seen.has(item.photoId)) {
      errors.push(`duplicate or missing photoId: ${item?.photoId}`);
      continue;
    }
    seen.add(item.photoId);
    if (!PARTITIONS.has(item.partition)) errors.push(`invalid partition for ${item.photoId}`);
    const canonical = photosById.get(item.photoId);
    if (!canonical) errors.push(`unknown current photoId: ${item.photoId}`);
    if (canonical && canonical.individual_id !== item.individualId) errors.push(`individual mismatch for ${item.photoId}`);
    if (!item.assetIdentity || item.assetIdentity.kind !== 'git_commit_path') errors.push(`assetIdentity.kind invalid for ${item.photoId}`);
    if (item.assetIdentity?.commit !== manifest.sourceDataset?.commit) errors.push(`asset commit mismatch for ${item.photoId}`);
    if (!/^[0-9a-f]{40}$/.test(item.assetIdentity?.gitBlobSha1 ?? '')) errors.push(`asset gitBlobSha1 invalid for ${item.photoId}`);
    if (typeof item.assetIdentity?.path !== 'string' || !item.assetIdentity.path.endsWith('.jpg')) {
      errors.push(`asset path invalid for ${item.photoId}`);
    }
    if (canonical && typeof item.assetIdentity?.path === 'string') {
      const expectedTail = `/${canonical.individual_id}/${canonical.archivo}`;
      const expectedPrefix = `species/${canonical.species_id}_`;
      if (!item.assetIdentity.path.startsWith(expectedPrefix) || !item.assetIdentity.path.endsWith(expectedTail)) {
        errors.push(`asset path does not match canonical photo metadata for ${item.photoId}`);
      }
    }
    partitionIds[item.partition]?.add(item.photoId);
    if (item.partition === 'development') devIndividuals.add(item.individualId);
    if (item.partition === 'holdout') holdIndividuals.add(item.individualId);
  }

  for (const id of devIndividuals) if (holdIndividuals.has(id)) errors.push(`individual leakage across development/holdout: ${id}`);

  for (const partition of ['development','holdout','excluded']) {
    const declared = manifest.partitions?.[partition] ?? [];
    const actual = [...partitionIds[partition]].sort();
    const expected = [...declared].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`partition list mismatch: ${partition}`);
  }

  if (partitionIds.development.size !== 30) errors.push('development must contain 30 frozen photos');
  if (partitionIds.holdout.size !== 14) errors.push('holdout must contain 14 frozen photos');
  if (partitionIds.excluded.size !== 1) errors.push('excluded must contain 1 frozen photo');
  if (entries.length !== 45) errors.push('manifest must freeze exactly 45 historical photos');
  if (!partitionIds.excluded.has('PH-029')) errors.push('PH-029 must remain excluded');
  if (manifest.excludedPhotos?.['PH-029']?.duplicateOf !== 'PH-028') errors.push('PH-029 duplicateOf must remain PH-028');

  const outsideManifest = photos.filter(p => !seen.has(p.photo_id)).map(p => p.photo_id).sort();

  return {
    valid: errors.length === 0,
    errors,
    manifest,
    counts: {
      development: partitionIds.development.size,
      holdout: partitionIds.holdout.size,
      excluded: partitionIds.excluded.size,
      outsideManifest: outsideManifest.length,
    },
    outsideManifest,
  };
}
