import { buildCanonicalDatasetFromRaw } from '../../canonical-identification/dataset.mjs';

async function readJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.json();
}

export async function loadBrowserCanonicalDataset(baseUrl = '../../../data/botanical/') {
  const url = name => new URL(name, new URL(baseUrl, import.meta.url));
  const [
    metadata,
    species,
    characters,
    speciesCharacters,
    characterVariability,
    contexts,
    sources,
  ] = await Promise.all([
    readJson(url('metadata.json')),
    readJson(url('species.json')),
    readJson(url('characters.json')),
    readJson(url('species_characters.json')),
    readJson(url('character_variability.json')),
    readJson(url('contexts.json')),
    readJson(url('sources.json')),
  ]);

  return buildCanonicalDatasetFromRaw({
    metadata,
    species,
    characters,
    speciesCharacters,
    characterVariability,
    contexts,
    sources,
  });
}
