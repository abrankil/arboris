import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const DEFAULT_BOTANICAL_DIR = join(REPO_ROOT, 'data', 'botanical');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function listFromValue(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value)
    .split('|')
    .map(item => item.trim())
    .filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function buildVariabilityIndex(variabilityEntries) {
  const bySpecies = new Map();

  for (const entry of variabilityEntries) {
    const speciesId = entry.species_id;
    const characterId = entry.caracter_id;

    if (!bySpecies.has(speciesId)) bySpecies.set(speciesId, new Map());
    const byCharacter = bySpecies.get(speciesId);
    if (!byCharacter.has(characterId)) byCharacter.set(characterId, []);

    byCharacter.get(characterId).push({
      speciesId,
      characterId,
      alternativeState: entry.estado_alternativo,
      contextId: entry.contexto_id ?? null,
      frequency: entry.frecuencia ?? null,
      notes: entry.nota ?? null,
      raw: entry,
    });
  }

  return bySpecies;
}

function buildRelationIndex(relations) {
  const bySpecies = new Map();

  for (const relation of relations) {
    const speciesId = relation.species_id;
    const characterId = relation.caracter_id;

    if (!bySpecies.has(speciesId)) bySpecies.set(speciesId, new Map());
    const byCharacter = bySpecies.get(speciesId);

    if (byCharacter.has(characterId)) {
      throw new Error(`Duplicate species-character relation ${speciesId} / ${characterId}`);
    }

    byCharacter.set(characterId, {
      speciesId,
      characterId,
      expectedStates: uniqueSorted(listFromValue(relation.estado_esperado)),
      variability: relation.variabilidad ?? null,
      sourceId: relation.fuente_id ?? null,
      imageDetectable: relation.detectable_imagen ?? null,
      fieldVerifiable: relation.verificable_campo ?? null,
      diagnosticPower: relation.poder_diagnostico ?? null,
      interactionSafety: relation.interaction_safety ?? null,
      observationCost: relation.costo_observacion ?? null,
      confidence: relation.confianza ?? null,
      notes: relation.notas ?? null,
      raw: relation,
    });
  }

  return bySpecies;
}

export async function loadCanonicalDataset(options = {}) {
  const botanicalDir = options.botanicalDir ?? DEFAULT_BOTANICAL_DIR;

  const [metadata, species, characters, speciesCharacters, characterVariability] = await Promise.all([
    readJson(join(botanicalDir, 'metadata.json')),
    readJson(join(botanicalDir, 'species.json')),
    readJson(join(botanicalDir, 'characters.json')),
    readJson(join(botanicalDir, 'species_characters.json')),
    readJson(join(botanicalDir, 'character_variability.json')),
  ]);

  const computableStatus = metadata.computable_status ?? 'activo';
  const activeCharacters = characters
    .filter(character => character.estado_piloto === computableStatus)
    .map(character => ({
      characterId: character.caracter_id,
      group: character.grupo ?? null,
      name: character.nombre_caracter,
      dataType: character.tipo_dato ?? null,
      allowedStates: uniqueSorted(listFromValue(character.estados_permitidos)),
      imageObservable: character.observable_foto ?? null,
      fieldObservable: character.observable_campo ?? null,
      phenologyDependency: character.dependencia_fenologica ?? null,
      baseRisk: character.riesgo_base ?? null,
      baseInvasiveness: character.invasividad_base ?? null,
      description: character.descripcion ?? null,
      pilotStatus: character.estado_piloto,
      appliesIf: character.aplica_si ?? null,
      raw: character,
    }));

  const normalizedSpecies = species.map(item => ({
    speciesId: item.species_id,
    scientificName: item.nombre_cientifico,
    commonName: item.nombre_comun,
    family: item.familia ?? null,
    order: item.orden ?? null,
    habit: item.habito ?? null,
    origin: item.origen ?? null,
    endemism: item.endemismo ?? null,
    pilotStatus: item.estado_piloto ?? null,
    notes: item.notas ?? null,
    raw: item,
  }));

  const activeCharacterIds = new Set(activeCharacters.map(character => character.characterId));
  const activeRelations = speciesCharacters.filter(relation => activeCharacterIds.has(relation.caracter_id));
  const relationsBySpecies = buildRelationIndex(activeRelations);
  const variabilityBySpecies = buildVariabilityIndex(characterVariability);

  return {
    metadata,
    species: normalizedSpecies,
    characters: activeCharacters,
    relations: activeRelations,
    speciesById: new Map(normalizedSpecies.map(item => [item.speciesId, item])),
    charactersById: new Map(activeCharacters.map(item => [item.characterId, item])),
    relationsBySpecies,
    variabilityBySpecies,
    stats: {
      species: normalizedSpecies.length,
      activeCharacters: activeCharacters.length,
      activeRelations: activeRelations.length,
      masterVersion: metadata.master_version ?? null,
      schemaVersion: metadata.schema_version ?? null,
      sourceFile: metadata.source_file ?? null,
    },
  };
}

export function getRelation(dataset, speciesId, characterId) {
  return dataset.relationsBySpecies.get(speciesId)?.get(characterId) ?? null;
}

export function getVariability(dataset, speciesId, characterId) {
  return dataset.variabilityBySpecies.get(speciesId)?.get(characterId) ?? [];
}
