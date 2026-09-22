function listFromValue(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  return String(value)
    .split('|')
    .map(item => item.trim())
    .filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function buildContextIndex(contexts) {
  const contextsById = new Map();

  for (const context of contexts) {
    const contextId = context.contexto_id;

    if (!contextId) {
      throw new Error(
        'Context entry is missing contexto_id',
      );
    }

    if (contextsById.has(contextId)) {
      throw new Error(
        `Duplicate context ${contextId}`,
      );
    }

    contextsById.set(contextId, {
      contextId,
      description: context.descripcion ?? null,
      raw: context,
    });
  }

  return contextsById;
}

function buildSourceIndex(sources) {
  const sourcesById = new Map();

  for (const source of sources) {
    const sourceId = source.fuente_id;

    if (!sourceId) {
      throw new Error(
        'Source entry is missing fuente_id',
      );
    }

    if (sourcesById.has(sourceId)) {
      throw new Error(
        `Duplicate source ${sourceId}`,
      );
    }

    sourcesById.set(sourceId, {
      sourceId,
      type: source.tipo ?? null,
      reference: source.referencia ?? null,
      priorityUse: source.uso_prioritario ?? null,
      url: source.url ?? null,
      notes: source.notas ?? null,
      raw: source,
    });
  }

  return sourcesById;
}

function buildRelationIndex(relations) {
  const bySpecies = new Map();

  for (const relation of relations) {
    const speciesId = relation.species_id;
    const characterId = relation.caracter_id;

    if (!bySpecies.has(speciesId)) {
      bySpecies.set(speciesId, new Map());
    }

    const byCharacter = bySpecies.get(speciesId);

    if (byCharacter.has(characterId)) {
      throw new Error(
        `Duplicate species-character relation ${speciesId} / ${characterId}`,
      );
    }

    byCharacter.set(characterId, {
      speciesId,
      characterId,
      expectedStates: uniqueSorted(
        listFromValue(relation.estado_esperado),
      ),
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

function validateVariabilityEntries(
  variabilityEntries,
  speciesById,
  allCharactersById,
  contextsById,
  sourcesById,
  allRelationsBySpecies,
) {
  for (const entry of variabilityEntries) {
    const speciesId = entry.species_id;
    const characterId = entry.caracter_id;
    const alternativeState = entry.estado_alternativo;
    const contextId = entry.contexto_id ?? null;
    const sourceId = entry.fuente_id ?? null;

    if (!speciesId || !speciesById.has(speciesId)) {
      throw new Error(
        `Variability references unknown species_id ${speciesId}`,
      );
    }

    if (!characterId || !allCharactersById.has(characterId)) {
      throw new Error(
        `Variability references unknown or inactive caracter_id ${characterId}`,
      );
    }

    if (
      !allRelationsBySpecies
        .get(speciesId)
        ?.has(characterId)
    ) {
      throw new Error(
        `Variability references missing canonical relation ${speciesId} / ${characterId}`,
      );
    }

    if (!alternativeState) {
      throw new Error(
        `Variability entry ${speciesId} / ${characterId} is missing estado_alternativo`,
      );
    }

    const character = allCharactersById.get(characterId);

    if (
      character.allowedStates.length > 0
      && !character.allowedStates.includes(
        String(alternativeState),
      )
    ) {
      throw new Error(
        `Variability entry ${speciesId} / ${characterId} references invalid estado_alternativo ${alternativeState}`,
      );
    }

    if (contextId && !contextsById.has(contextId)) {
      throw new Error(
        `Variability entry ${speciesId} / ${characterId} references unknown contexto_id ${contextId}`,
      );
    }

    if (!sourceId) {
      throw new Error(
        `Variability entry ${speciesId} / ${characterId} is missing fuente_id`,
      );
    }

    if (!sourcesById.has(sourceId)) {
      throw new Error(
        `Variability entry ${speciesId} / ${characterId} references unknown fuente_id ${sourceId}`,
      );
    }
  }
}

function buildVariabilityIndex(variabilityEntries) {
  const bySpecies = new Map();

  for (const entry of variabilityEntries) {
    const speciesId = entry.species_id;
    const characterId = entry.caracter_id;

    if (!bySpecies.has(speciesId)) {
      bySpecies.set(speciesId, new Map());
    }

    const byCharacter = bySpecies.get(speciesId);

    if (!byCharacter.has(characterId)) {
      byCharacter.set(characterId, []);
    }

    byCharacter.get(characterId).push({
      speciesId,
      characterId,
      alternativeState: entry.estado_alternativo,
      contextId: entry.contexto_id ?? null,
      frequency: entry.frecuencia ?? null,
      sourceId: entry.fuente_id,
      notes: entry.nota ?? null,
      raw: entry,
    });
  }

  return bySpecies;
}

export async function loadCanonicalDataset(options = {}) {
  // Node-only filesystem loading is resolved lazily so the pure dataset
  // accessors in this module remain importable by the local I12 browser harness.
  const [{ readFile }, pathModule, urlModule] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
    import('node:url'),
  ]);
  const { dirname, join, resolve } = pathModule;
  const { fileURLToPath } = urlModule;
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '..', '..');
  const botanicalDir = options.botanicalDir ?? join(repoRoot, 'data', 'botanical');
  const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

  const [
    metadata,
    species,
    characters,
    speciesCharacters,
    characterVariability,
    contexts,
    sources,
  ] = await Promise.all([
    readJson(join(botanicalDir, 'metadata.json')),
    readJson(join(botanicalDir, 'species.json')),
    readJson(join(botanicalDir, 'characters.json')),
    readJson(join(botanicalDir, 'species_characters.json')),
    readJson(join(botanicalDir, 'character_variability.json')),
    readJson(join(botanicalDir, 'contexts.json')),
    readJson(join(botanicalDir, 'sources.json')),
  ]);

  const computableStatus =
    metadata.computable_status ?? 'activo';

  const allCharacters = characters
    .map(character => ({
      characterId: character.caracter_id,
      group: character.grupo ?? null,
      name: character.nombre_caracter,
      dataType: character.tipo_dato ?? null,
      allowedStates: uniqueSorted(
        listFromValue(character.estados_permitidos),
      ),
      imageObservable: character.observable_foto ?? null,
      fieldObservable: character.observable_campo ?? null,
      phenologyDependency:
        character.dependencia_fenologica ?? null,
      baseRisk: character.riesgo_base ?? null,
      baseInvasiveness:
        character.invasividad_base ?? null,
      description: character.descripcion ?? null,
      pilotStatus: character.estado_piloto,
      appliesIf: character.aplica_si ?? null,
      raw: character,
    }));

  const activeCharacters = allCharacters.filter(
    character =>
      character.pilotStatus === computableStatus,
  );

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

  const speciesById = new Map(
    normalizedSpecies.map(
      item => [item.speciesId, item],
    ),
  );

  const allCharactersById = new Map(
    allCharacters.map(
      item => [item.characterId, item],
    ),
  );

  const charactersById = new Map(
    activeCharacters.map(
      item => [item.characterId, item],
    ),
  );

  const activeCharacterIds = new Set(
    activeCharacters.map(
      character => character.characterId,
    ),
  );

  // Preserve the complete canonical relation registry separately from
  // the computable ACE view. H16/APC needs canonical existence checks,
  // while ACE continues to consume only active/computable relations.
  const allRelations = speciesCharacters;
  const allRelationsBySpecies =
    buildRelationIndex(allRelations);

  const activeRelations =
    allRelations.filter(
      relation =>
        activeCharacterIds.has(
          relation.caracter_id,
        ),
    );

  const relationsBySpecies =
    buildRelationIndex(activeRelations);

  const contextsById =
    buildContextIndex(contexts);

  const sourcesById =
    buildSourceIndex(sources);

  validateVariabilityEntries(
    characterVariability,
    speciesById,
    allCharactersById,
    contextsById,
    sourcesById,
    allRelationsBySpecies,
  );

  const variabilityBySpecies =
    buildVariabilityIndex(
      characterVariability,
    );

  return {
    metadata,
    computableStatus,
    species: normalizedSpecies,
    characters: activeCharacters,
    allCharacters,
    relations: activeRelations,
    allRelations,
    contexts,
    sources,
    speciesById,
    charactersById,
    allCharactersById,
    contextsById,
    sourcesById,
    relationsBySpecies,
    allRelationsBySpecies,
    variabilityBySpecies,
    stats: {
      species: normalizedSpecies.length,
      activeCharacters: activeCharacters.length,
      activeRelations: activeRelations.length,
      allRelations: allRelations.length,
      contexts: contextsById.size,
      sources: sourcesById.size,
      variabilityEntries: characterVariability.length,
      masterVersion: metadata.master_version ?? null,
      schemaVersion: metadata.schema_version ?? null,
      sourceFile: metadata.source_file ?? null,
    },
  };
}

export function getRelation(
  dataset,
  speciesId,
  characterId,
) {
  return (
    dataset.relationsBySpecies
      .get(speciesId)
      ?.get(characterId)
    ?? null
  );
}

export function getVariability(
  dataset,
  speciesId,
  characterId,
) {
  return (
    dataset.variabilityBySpecies
      .get(speciesId)
      ?.get(characterId)
    ?? []
  );
}