// Traduccion de la fuente botanica computable al vocabulario de la clave.
// Este modulo no importa ni modifica logic.mjs: primero permite inspeccionar
// y comparar la traduccion antes de conectar la clave.
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PILOT_SPECIES = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005', 'SP006'];
export const KEY_CHARACTER_IDS = {
  margin: 'CH-003',
  glands: 'CH-017',
  venation: 'CH-008',
  underside: 'CH-005',
};

const SOURCE_TO_KEY = {
  margin: {
    entero: 'entire', ondulado: 'entire', finamente_serrado: 'toothed',
    serrado: 'toothed', dentado: 'toothed',
  },
  glands: { si: 'yes', no: 'no' },
  venation: { si: 'yes', no: 'no' },
  underside: { similar: 'no', mas_palido: 'yes', glauco: 'yes' },
};

const sourceStates = character => character?.expectedStates ?? [];

function translateStates(questionId, character) {
  if (!character) return [];
  const translated = sourceStates(character)
    .flatMap(state => SOURCE_TO_KEY[questionId][state] ?? [])
    .filter((state, index, values) => values.indexOf(state) === index);

  // Una ficha con estados permitidos pero sin estado esperado no aporta
  // evidencia restrictiva. La ausencia queda representada como [].
  return translated;
}

export function adaptSpecies(species) {
  if (!species?.id) throw new Error('Species record requires an id');
  const characters = new Map((species.botanicalCharacters ?? [])
    .map(character => [character.characterId, character]));
  const states = Object.fromEntries(Object.entries(KEY_CHARACTER_IDS)
    .map(([questionId, characterId]) => [questionId,
      translateStates(questionId, characters.get(characterId))]));

  return {
    id: species.id,
    scientificName: species.scientificName,
    commonName: species.commonName,
    states,
    source: Object.fromEntries(Object.entries(KEY_CHARACTER_IDS)
      .map(([questionId, characterId]) => [questionId, characters.get(characterId)
        ? { characterId, expectedStates: sourceStates(characters.get(characterId)) }
        : { characterId, expectedStates: [], status: 'unknown' }])),
  };
}

export function adaptSpeciesRecords(speciesRecords) {
  const records = speciesRecords.map(adaptSpecies);
  const ids = new Set(records.map(record => record.id));
  const missing = PILOT_SPECIES.filter(id => !ids.has(id));
  if (missing.length) throw new Error(`Missing pilot species: ${missing.join(', ')}`);
  return records.sort((a, b) => PILOT_SPECIES.indexOf(a.id) - PILOT_SPECIES.indexOf(b.id));
}

export async function loadPilotSpecies(directory = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'species')) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
  return adaptSpeciesRecords(await Promise.all(files.map(async file =>
    JSON.parse(await readFile(join(directory, file), 'utf8')))));
}

export function statesForKey(records) {
  return Object.fromEntries(records.map(record => [record.id, record.states]));
}

export function compareStates(records, expectedStates) {
  return records.flatMap(record => Object.keys(KEY_CHARACTER_IDS).flatMap(questionId => {
    const actual = record.states[questionId] ?? [];
    const expected = expectedStates[record.id]?.[questionId] ?? [];
    if (JSON.stringify(actual) === JSON.stringify(expected)) return [];
    return [{
      speciesId: record.id,
      questionId,
      actual,
      expected,
      reason: actual.length === 0 ? 'source_unknown' : 'translation_or_key_difference',
    }];
  }));
}
