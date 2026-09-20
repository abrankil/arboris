import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const DEFAULT_EXPERIMENT_DIR = join(REPO_ROOT, 'data', 'experiments', 'h16-exp-001');
const DEFAULT_BOTANICAL_DIR = join(REPO_ROOT, 'data', 'botanical');
const DEFAULT_SPECIES_DIR = join(REPO_ROOT, 'species');

const PARTITION_NAMES = Object.freeze(['development', 'holdout']);

// Fields an observer is allowed to receive. Anything not listed here
// (species_id, archivo/filename, scientific/common name, status,
// observedState, ground truth of any kind) must never reach the observer
// input, per docs/HITO16_CHARACTER_EXTRACTION_REFERENCE.md#16.16.
const OBSERVER_INPUT_WHITELIST = Object.freeze([
  'characterId',
  'imageRef',
  'organStructure',
  'evidenceType',
  'captureDate',
]);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

// Resolves each photos.json `archivo` (filename) against the repo's
// species/*/photos/ tree, trusted-layer only: the resulting repoPath must
// never leave this module's internal indices.
async function buildRepoFilenameIndex(speciesDir) {
  const files = await walkFiles(speciesDir);
  const byFilename = new Map();
  for (const repoPath of files) {
    const filename = repoPath.split(/[\\/]/).pop();
    if (!byFilename.has(filename)) byFilename.set(filename, []);
    byFilename.get(filename).push(repoPath);
  }
  return byFilename;
}

async function resolveAssetsForPhotos(photosById, speciesDir) {
  const byFilename = await buildRepoFilenameIndex(speciesDir);
  const assetsByPhotoId = new Map();

  for (const photo of photosById.values()) {
    const filename = photo.archivo;
    const matches = byFilename.get(filename) ?? [];

    if (matches.length !== 1) {
      throw new Error(
        `photo_id ${photo.photo_id} (${filename}) resolved to ${matches.length} repo assets; expected exactly 1`,
      );
    }

    const [repoPath] = matches;
    const contents = await readFile(repoPath);
    const assetKey = createHash('sha256').update(contents).digest('hex');

    assetsByPhotoId.set(photo.photo_id, { repoPath, assetKey });
  }

  return assetsByPhotoId;
}

function buildPhotosIndex(photos) {
  const byId = new Map();
  for (const photo of photos) {
    if (!photo.photo_id) {
      throw new Error('Photo record is missing photo_id');
    }
    if (byId.has(photo.photo_id)) {
      throw new Error(`Duplicate photo_id ${photo.photo_id}`);
    }
    byId.set(photo.photo_id, photo);
  }
  return byId;
}

function buildIndividualPartitionIndex(partitions, photosById) {
  const individualToPartition = new Map();

  for (const partitionName of PARTITION_NAMES) {
    const individuals = partitions[partitionName] ?? [];
    for (const individualId of individuals) {
      if (individualToPartition.has(individualId)) {
        throw new Error(
          `individual_id ${individualId} appears in more than one partition`,
        );
      }
      individualToPartition.set(individualId, partitionName);
    }
  }

  const knownIndividuals = new Set(
    [...photosById.values()].map(photo => photo.individual_id),
  );

  for (const individualId of individualToPartition.keys()) {
    if (!knownIndividuals.has(individualId)) {
      throw new Error(
        `Split references unknown individual_id ${individualId}`,
      );
    }
  }

  return individualToPartition;
}

function validateExcludedPhotos(excludedPhotos, photosById) {
  for (const photoId of Object.keys(excludedPhotos)) {
    if (!photosById.has(photoId)) {
      throw new Error(`Exclusion references unknown photo_id ${photoId}`);
    }
  }
}

function validateAnnotations(annotations, photosById) {
  for (const annotation of annotations) {
    const imageRef = annotation?.imageRef;
    if (!imageRef || !photosById.has(imageRef)) {
      throw new Error(
        `Annotation references unknown imageRef ${imageRef}`,
      );
    }
  }
}

export async function loadExperimentDataset(options = {}) {
  const experimentDir = options.experimentDir ?? DEFAULT_EXPERIMENT_DIR;
  const botanicalDir = options.botanicalDir ?? DEFAULT_BOTANICAL_DIR;
  const speciesDir = options.speciesDir ?? DEFAULT_SPECIES_DIR;

  const [split, annotations, photos] = await Promise.all([
    readJson(join(experimentDir, 'split.json')),
    readJson(join(experimentDir, 'annotations.json')),
    readJson(join(botanicalDir, 'photos.json')),
  ]);

  const allPhotosById = buildPhotosIndex(photos);
  const individualToPartition = buildIndividualPartitionIndex(
    split.partitions ?? {},
    allPhotosById,
  );
  const excludedPhotos = split.excludedPhotos ?? {};

  validateExcludedPhotos(excludedPhotos, allPhotosById);

  // H16-EXP-001 is a closed experimental universe defined by its split:
  // only photos belonging to a declared partition, plus explicitly excluded
  // photos retained for exclusion/provenance checks, are part of this dataset.
  // data/botanical/photos.json is a broader canonical photo registry and must
  // not silently expand the experiment when new photos are added there.
  const experimentPhotos = photos.filter(photo => (
    Object.prototype.hasOwnProperty.call(excludedPhotos, photo.photo_id)
    || individualToPartition.has(photo.individual_id)
  ));
  const photosById = buildPhotosIndex(experimentPhotos);

  validateAnnotations(annotations, photosById);

  // Trusted layer only: repoPath must never be exposed by buildObserverInput().
  const assetsByPhotoId = await resolveAssetsForPhotos(photosById, speciesDir);

  return {
    experimentId: split.experimentId ?? null,
    characterId: split.characterId ?? null,
    photosById,
    individualToPartition,
    excludedPhotos,
    annotations,
    partitions: split.partitions ?? {},
    assetsByPhotoId,
  };
}

export function getPartitionForIndividual(dataset, individualId) {
  if (!dataset.individualToPartition.has(individualId)) {
    throw new Error(`Unknown individual_id ${individualId}`);
  }
  return dataset.individualToPartition.get(individualId);
}

export function getPhotoRecord(dataset, photoId) {
  const photo = dataset.photosById.get(photoId);
  if (!photo) {
    throw new Error(`Unknown photo_id ${photoId}`);
  }
  return photo;
}

export function isExcludedPhoto(dataset, photoId) {
  if (!dataset.photosById.has(photoId)) {
    throw new Error(`Unknown photo_id ${photoId}`);
  }
  return Object.prototype.hasOwnProperty.call(dataset.excludedPhotos, photoId);
}

export function getPartitionForPhoto(dataset, photoId) {
  if (isExcludedPhoto(dataset, photoId)) {
    return 'excluded';
  }
  const photo = getPhotoRecord(dataset, photoId);
  return getPartitionForIndividual(dataset, photo.individual_id);
}

export function listUsablePhotoIds(dataset, partitionName) {
  if (!PARTITION_NAMES.includes(partitionName)) {
    throw new Error(`Unknown partition ${partitionName}`);
  }

  const photoIds = [];
  for (const photo of dataset.photosById.values()) {
    if (isExcludedPhoto(dataset, photo.photo_id)) continue;
    if (getPartitionForIndividual(dataset, photo.individual_id) === partitionName) {
      photoIds.push(photo.photo_id);
    }
  }
  return photoIds.sort();
}

/**
 * Builds the only payload an observer may receive for a given photo.
 * Uses an explicit whitelist so unrelated/new photo fields (species_id,
 * archivo, taxonomic names, etc.) can never leak in by accident.
 */
export function buildObserverInput(dataset, photoId) {
  if (isExcludedPhoto(dataset, photoId)) {
    throw new Error(`photo_id ${photoId} is excluded and cannot be used as observer input`);
  }

  // photo_id, individual_id, repoPath and filename are kept only
  // internally, for provenance/split/evaluation bookkeeping — they must
  // never reach the observer payload itself.
  const photo = getPhotoRecord(dataset, photoId);
  const asset = dataset.assetsByPhotoId.get(photoId);
  if (!asset) {
    throw new Error(`No resolved repo asset for photo_id ${photoId}`);
  }

  const candidate = {
    characterId: dataset.characterId ?? 'CH-003',
    imageRef: asset.assetKey,
    organStructure: photo.organo_estructura ?? null,
    evidenceType: photo.tipo_evidencia ?? null,
    captureDate: photo.fecha_captura ?? null,
  };

  for (const key of Object.keys(candidate)) {
    if (!OBSERVER_INPUT_WHITELIST.includes(key)) {
      throw new Error(`Observer input field ${key} is not in the whitelist`);
    }
  }

  return candidate;
}

/**
 * Annotations are ground truth for evaluation only. They must never be
 * merged into buildObserverInput()'s output.
 */
export function getAnnotationsForPhoto(dataset, photoId) {
  if (!dataset.photosById.has(photoId)) {
    throw new Error(`Unknown photo_id ${photoId}`);
  }
  return dataset.annotations.filter(annotation => annotation.imageRef === photoId);
}

export const OBSERVER_INPUT_WHITELIST_FIELDS = OBSERVER_INPUT_WHITELIST;
export const EXPERIMENT_PARTITIONS = PARTITION_NAMES;
