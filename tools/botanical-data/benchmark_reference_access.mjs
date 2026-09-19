#!/usr/bin/env node
/**
 * Controlled host benchmark for Árboris reference-data access.
 *
 * This benchmark compares canonical JSON + in-memory indexes against the
 * derived SQLite prototype using the same Node.js process. It is deliberately
 * non-gating: GitHub-hosted timing is directional and does not replace Android
 * device profiling with expo-sqlite.
 */

import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { loadCanonicalDataset, getRelation } from '../canonical-identification/dataset.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const BOTANICAL_DIR = join(REPO_ROOT, 'data', 'botanical');
const DEFAULT_DB = join(REPO_ROOT, 'build', 'arboris_reference.sqlite3');

const ENGINE_JSON_FILES = [
  'metadata.json',
  'species.json',
  'characters.json',
  'species_characters.json',
];
const ALL_CANONICAL_FILES = [
  ...ENGINE_JSON_FILES,
  'sources.json',
  'glossary.json',
  'photos.json',
  'model_errors.json',
];

function parseArgs(argv) {
  const args = {
    db: DEFAULT_DB,
    json: null,
    markdown: null,
    warmSamples: 40,
    warmOps: 1000,
    sessionSamples: 40,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--db') { args.db = resolve(value); i += 1; }
    else if (arg === '--json') { args.json = resolve(value); i += 1; }
    else if (arg === '--markdown') { args.markdown = resolve(value); i += 1; }
    else if (arg === '--warm-samples') { args.warmSamples = Number(value); i += 1; }
    else if (arg === '--warm-ops') { args.warmOps = Number(value); i += 1; }
    else if (arg === '--session-samples') { args.sessionSamples = Number(value); i += 1; }
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function summarize(valuesMs, divisor = 1) {
  const perOpUs = valuesMs.map(value => (value * 1000) / divisor).sort((a, b) => a - b);
  const mean = perOpUs.reduce((sum, value) => sum + value, 0) / perOpUs.length;
  return {
    samples: perOpUs.length,
    ops_per_sample: divisor,
    median_us: Number(percentile(perOpUs, 50).toFixed(4)),
    p95_us: Number(percentile(perOpUs, 95).toFixed(4)),
    mean_us: Number(mean.toFixed(4)),
    min_us: Number(perOpUs[0].toFixed(4)),
    max_us: Number(perOpUs.at(-1).toFixed(4)),
  };
}

function benchmarkSync(operation, samples, opsPerSample) {
  const durations = [];
  let checksum = 0;

  for (let warm = 0; warm < 5; warm += 1) checksum += Number(operation() ?? 0);

  for (let sample = 0; sample < samples; sample += 1) {
    const start = performance.now();
    for (let i = 0; i < opsPerSample; i += 1) checksum += Number(operation() ?? 0);
    durations.push(performance.now() - start);
  }
  return { ...summarize(durations, opsPerSample), checksum };
}

async function benchmarkAsync(operation, samples) {
  const durations = [];
  let checksum = 0;
  for (let sample = 0; sample < samples; sample += 1) {
    const start = performance.now();
    checksum += Number(await operation() ?? 0);
    durations.push(performance.now() - start);
  }
  return { ...summarize(durations, 1), checksum };
}

function listFromValue(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map(String);
  return String(value).split('|').map(item => item.trim()).filter(Boolean);
}

function sizeOfFiles(names) {
  return names.reduce((sum, name) => sum + statSync(join(BOTANICAL_DIR, name)).size, 0);
}

function ratio(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(3));
}

function renderMarkdown(report) {
  const rows = report.metrics;
  const fmt = value => Number(value).toFixed(3);
  return `# Árboris — JSON vs SQLite host benchmark\n\n` +
    `**Generated:** ${report.generated_at}\n\n` +
    `**Environment:** Node ${report.environment.node}; ${report.environment.platform}/${report.environment.arch}.\n\n` +
    `> Directional host benchmark only. It does not establish the Android runtime architecture. ` +
    `The final gate requires profiling with expo-sqlite on representative Android hardware.\n\n` +
    `## Dataset\n\n` +
    `- species: ${report.dataset.species}\n` +
    `- active characters: ${report.dataset.active_characters}\n` +
    `- active relations: ${report.dataset.active_relations}\n` +
    `- engine JSON bytes: ${report.storage.engine_json_bytes}\n` +
    `- all canonical JSON bytes: ${report.storage.all_canonical_json_bytes}\n` +
    `- SQLite bytes: ${report.storage.sqlite_bytes}\n` +
    `- SQLite / engine JSON size ratio: ${report.storage.sqlite_to_engine_json_ratio}x\n\n` +
    `## Timings\n\n` +
    `| Scenario | JSON median µs | SQLite median µs | SQLite/JSON |\n` +
    `| --- | ---: | ---: | ---: |\n` +
    `| Fresh session / first lookup | ${fmt(rows.fresh_session.json.median_us)} | ${fmt(rows.fresh_session.sqlite.median_us)} | ${report.ratios.fresh_session}x |\n` +
    `| Species lookup | ${fmt(rows.species_lookup.json.median_us)} | ${fmt(rows.species_lookup.sqlite.median_us)} | ${report.ratios.species_lookup}x |\n` +
    `| Species × character relation | ${fmt(rows.relation_lookup.json.median_us)} | ${fmt(rows.relation_lookup.sqlite.median_us)} | ${report.ratios.relation_lookup}x |\n` +
    `| Character → candidate relations | ${fmt(rows.character_candidates.json.median_us)} | ${fmt(rows.character_candidates.sqlite.median_us)} | ${report.ratios.character_candidates}x |\n` +
    `| Character + state → compatible species | ${fmt(rows.state_candidates.json.median_us)} | ${fmt(rows.state_candidates.sqlite.median_us)} | ${report.ratios.state_candidates}x |\n\n` +
    `## Interpretation boundary\n\n` +
    `- JSON timings include the current canonical in-memory index strategy.\n` +
    `- SQLite warm timings use prepared indexed statements on one open connection.\n` +
    `- Fresh-session timings intentionally measure different startup models: JSON parses the canonical engine bundle and builds its indexes; SQLite opens the DB and performs a first indexed lookup.\n` +
    `- OS page cache, GitHub runner variance and Node's node:sqlite implementation make these results unsuitable as an Android verdict.\n` +
    `- Do not change the final runtime architecture solely from these numbers.\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(args.db)) {
    throw new Error(`SQLite database not found: ${args.db}. Run build_reference_sqlite.py first.`);
  }

  const dataset = await loadCanonicalDataset({ botanicalDir: BOTANICAL_DIR });
  const sampleRelation = dataset.relations.find(row => listFromValue(row.estado_esperado).length > 0);
  if (!sampleRelation) throw new Error('No relation with expected states found.');

  const speciesId = sampleRelation.species_id;
  const characterId = sampleRelation.caracter_id;
  const state = listFromValue(sampleRelation.estado_esperado)[0];

  const db = new DatabaseSync(args.db, { readOnly: true });
  const speciesStmt = db.prepare('SELECT species_id FROM species WHERE species_id = ?');
  const relationStmt = db.prepare(
    'SELECT species_id, character_id FROM species_characters WHERE species_id = ? AND character_id = ?'
  );
  const characterCandidatesStmt = db.prepare(
    'SELECT species_id FROM species_characters WHERE character_id = ? ORDER BY species_id'
  );
  const stateCandidatesStmt = db.prepare(
    'SELECT species_id FROM species_character_states WHERE character_id = ? AND state = ? ORDER BY species_id'
  );

  const jsonSpeciesLookup = () => dataset.speciesById.get(speciesId)?.speciesId === speciesId ? 1 : 0;
  const sqliteSpeciesLookup = () => speciesStmt.get(speciesId)?.species_id === speciesId ? 1 : 0;
  const jsonRelationLookup = () => getRelation(dataset, speciesId, characterId) ? 1 : 0;
  const sqliteRelationLookup = () => relationStmt.get(speciesId, characterId) ? 1 : 0;
  const jsonCharacterCandidates = () => dataset.relations.filter(row => row.caracter_id === characterId).length;
  const sqliteCharacterCandidates = () => characterCandidatesStmt.all(characterId).length;
  const jsonStateCandidates = () => dataset.relations.filter(
    row => row.caracter_id === characterId && listFromValue(row.estado_esperado).includes(state)
  ).length;
  const sqliteStateCandidates = () => stateCandidatesStmt.all(characterId, state).length;

  const jsonFreshSession = async () => {
    const fresh = await loadCanonicalDataset({ botanicalDir: BOTANICAL_DIR });
    return getRelation(fresh, speciesId, characterId) ? 1 : 0;
  };
  const sqliteFreshSession = async () => {
    const freshDb = new DatabaseSync(args.db, { readOnly: true });
    try {
      const row = freshDb.prepare(
        'SELECT species_id FROM species_characters WHERE species_id = ? AND character_id = ?'
      ).get(speciesId, characterId);
      return row ? 1 : 0;
    } finally {
      freshDb.close();
    }
  };

  const metrics = {
    fresh_session: {
      json: await benchmarkAsync(jsonFreshSession, args.sessionSamples),
      sqlite: await benchmarkAsync(sqliteFreshSession, args.sessionSamples),
    },
    species_lookup: {
      json: benchmarkSync(jsonSpeciesLookup, args.warmSamples, args.warmOps),
      sqlite: benchmarkSync(sqliteSpeciesLookup, args.warmSamples, args.warmOps),
    },
    relation_lookup: {
      json: benchmarkSync(jsonRelationLookup, args.warmSamples, args.warmOps),
      sqlite: benchmarkSync(sqliteRelationLookup, args.warmSamples, args.warmOps),
    },
    character_candidates: {
      json: benchmarkSync(jsonCharacterCandidates, args.warmSamples, args.warmOps),
      sqlite: benchmarkSync(sqliteCharacterCandidates, args.warmSamples, args.warmOps),
    },
    state_candidates: {
      json: benchmarkSync(jsonStateCandidates, args.warmSamples, args.warmOps),
      sqlite: benchmarkSync(sqliteStateCandidates, args.warmSamples, args.warmOps),
    },
  };
  db.close();

  const report = {
    benchmark_version: 1,
    generated_at: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    dataset: {
      master_version: dataset.stats.masterVersion,
      schema_version: dataset.stats.schemaVersion,
      species: dataset.stats.species,
      active_characters: dataset.stats.activeCharacters,
      active_relations: dataset.stats.activeRelations,
    },
    sample_query: { species_id: speciesId, character_id: characterId, state },
    storage: {
      engine_json_bytes: sizeOfFiles(ENGINE_JSON_FILES),
      all_canonical_json_bytes: sizeOfFiles(ALL_CANONICAL_FILES),
      sqlite_bytes: statSync(args.db).size,
      sqlite_to_engine_json_ratio: ratio(statSync(args.db).size, sizeOfFiles(ENGINE_JSON_FILES)),
      sqlite_to_all_json_ratio: ratio(statSync(args.db).size, sizeOfFiles(ALL_CANONICAL_FILES)),
    },
    config: {
      warm_samples: args.warmSamples,
      warm_ops_per_sample: args.warmOps,
      fresh_session_samples: args.sessionSamples,
    },
    metrics,
    ratios: {
      fresh_session: ratio(metrics.fresh_session.sqlite.median_us, metrics.fresh_session.json.median_us),
      species_lookup: ratio(metrics.species_lookup.sqlite.median_us, metrics.species_lookup.json.median_us),
      relation_lookup: ratio(metrics.relation_lookup.sqlite.median_us, metrics.relation_lookup.json.median_us),
      character_candidates: ratio(metrics.character_candidates.sqlite.median_us, metrics.character_candidates.json.median_us),
      state_candidates: ratio(metrics.state_candidates.sqlite.median_us, metrics.state_candidates.json.median_us),
    },
    interpretation: {
      authority: 'canonical JSON remains derived from the Master; SQLite remains regenerable runtime/profiling data',
      host_only: true,
      android_runtime_decision: 'OPEN',
      caveat: 'Run expo-sqlite profiling on representative Android hardware before choosing final runtime storage.',
    },
  };

  const jsonText = `${JSON.stringify(report, null, 2)}\n`;
  const markdownText = renderMarkdown(report);

  if (args.json) {
    mkdirSync(dirname(args.json), { recursive: true });
    writeFileSync(args.json, jsonText, 'utf8');
  }
  if (args.markdown) {
    mkdirSync(dirname(args.markdown), { recursive: true });
    writeFileSync(args.markdown, markdownText, 'utf8');
  }

  process.stdout.write(markdownText);
}

main().catch(error => {
  console.error(error.stack ?? error.message ?? String(error));
  process.exitCode = 1;
});
