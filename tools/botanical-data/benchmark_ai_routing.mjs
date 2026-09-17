#!/usr/bin/env node
/**
 * Directional benchmark for the Árboris AI/data retrieval path.
 *
 * It compares the historical broad cross-species read pattern (all joined
 * species views) against the optimized normalized route used by AGENTS.md and
 * data/README.md. This measures repository payload and host parse/query cost;
 * it does NOT measure model cognition, token generation latency, network/tool
 * latency, or Android runtime performance.
 */

import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const BOTANICAL_DIR = join(REPO_ROOT, 'data', 'botanical');
const SPECIES_DIR = join(REPO_ROOT, 'data', 'species');
const DEFAULT_CHARACTER = 'CH-003';

const NORMALIZED_FILES = [
  'species.json',
  'characters.json',
  'species_characters.json',
];

function parseArgs(argv) {
  const args = {
    characterId: DEFAULT_CHARACTER,
    samples: 60,
    json: null,
    markdown: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--character') { args.characterId = String(value).toUpperCase(); i += 1; }
    else if (arg === '--samples') { args.samples = Number(value); i += 1; }
    else if (arg === '--json') { args.json = resolve(value); i += 1; }
    else if (arg === '--markdown') { args.markdown = resolve(value); i += 1; }
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(args.samples) || args.samples < 5) {
    throw new Error('--samples must be >= 5');
  }
  return args;
}

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function summarize(valuesMs) {
  const valuesUs = valuesMs.map(value => value * 1000).sort((a, b) => a - b);
  const mean = valuesUs.reduce((sum, value) => sum + value, 0) / valuesUs.length;
  return {
    samples: valuesUs.length,
    median_us: Number(percentile(valuesUs, 50).toFixed(3)),
    p95_us: Number(percentile(valuesUs, 95).toFixed(3)),
    mean_us: Number(mean.toFixed(3)),
    min_us: Number(valuesUs[0].toFixed(3)),
    max_us: Number(valuesUs.at(-1).toFixed(3)),
  };
}

function benchmark(operation, samples) {
  const durations = [];
  let checksum = 0;

  for (let i = 0; i < 5; i += 1) checksum += operation();

  for (let sample = 0; sample < samples; sample += 1) {
    const start = performance.now();
    checksum += operation();
    durations.push(performance.now() - start);
  }
  return { ...summarize(durations), checksum };
}

function joinedSpeciesFiles() {
  return readdirSync(SPECIES_DIR)
    .filter(name => /^SP\d{3}_.+\.json$/i.test(name))
    .sort();
}

function bytesOf(paths) {
  return paths.reduce((sum, path) => sum + statSync(path).size, 0);
}

function loadBroadJoinedViews(characterId) {
  const rows = [];
  for (const name of joinedSpeciesFiles()) {
    const view = JSON.parse(readFileSync(join(SPECIES_DIR, name), 'utf8'));
    const match = (view.botanical_characters ?? []).find(
      item => item?.character?.caracter_id === characterId
    );
    rows.push({
      species_id: view.species?.species_id ?? null,
      nombre_cientifico: view.species?.nombre_cientifico ?? null,
      relation: match?.relation ?? null,
    });
  }
  return rows;
}

function loadNormalizedComparison(characterId) {
  const species = JSON.parse(readFileSync(join(BOTANICAL_DIR, 'species.json'), 'utf8'));
  const characters = JSON.parse(readFileSync(join(BOTANICAL_DIR, 'characters.json'), 'utf8'));
  const relations = JSON.parse(readFileSync(join(BOTANICAL_DIR, 'species_characters.json'), 'utf8'));

  const character = characters.find(row => row.caracter_id === characterId) ?? null;
  const bySpecies = new Map(species.map(row => [row.species_id, row]));
  const rows = relations
    .filter(row => row.caracter_id === characterId)
    .map(row => ({
      species_id: row.species_id,
      nombre_cientifico: bySpecies.get(row.species_id)?.nombre_cientifico ?? null,
      estado_esperado: row.estado_esperado ?? null,
      variabilidad: row.variabilidad ?? null,
      poder_diagnostico: row.poder_diagnostico ?? null,
      confianza: row.confianza ?? null,
    }));

  return {
    character: character
      ? {
          caracter_id: character.caracter_id,
          nombre_caracter: character.nombre_caracter,
          estados_permitidos: character.estados_permitidos,
        }
      : null,
    rows,
  };
}

function ratio(numerator, denominator) {
  return denominator ? Number((numerator / denominator).toFixed(3)) : null;
}

function renderMarkdown(report) {
  return `# Árboris — AI/data routing benchmark\n\n` +
    `**Generated:** ${report.generated_at}\n\n` +
    `**Environment:** Node ${report.environment.node}; ${report.environment.platform}/${report.environment.arch}.\n\n` +
    `> Proxy benchmark for repository retrieval efficiency. It measures bytes and host parse/query time, not model cognition or answer-generation latency.\n\n` +
    `## Query\n\n` +
    `Cross-species comparison for \`${report.query.character_id}\`.\n\n` +
    `## Payload\n\n` +
    `- broad joined-species input: ${report.payload.broad_joined_bytes} bytes\n` +
    `- optimized normalized input: ${report.payload.normalized_input_bytes} bytes\n` +
    `- compact normalized result: ${report.payload.compact_result_bytes} bytes\n` +
    `- broad / normalized input ratio: ${report.ratios.broad_to_normalized_payload}x\n` +
    `- broad / compact result ratio: ${report.ratios.broad_to_compact_result}x\n\n` +
    `## Host parse + query timing\n\n` +
    `| Route | Median µs | p95 µs |\n` +
    `| --- | ---: | ---: |\n` +
    `| Broad joined species views | ${report.timings.broad_joined.median_us.toFixed(3)} | ${report.timings.broad_joined.p95_us.toFixed(3)} |\n` +
    `| Optimized normalized route | ${report.timings.normalized.median_us.toFixed(3)} | ${report.timings.normalized.p95_us.toFixed(3)} |\n\n` +
    `Normalized/broad median ratio: ${report.ratios.normalized_to_broad_time}x.\n\n` +
    `## Interpretation boundary\n\n` +
    `- The optimized route is the repository read strategy documented in AGENTS.md and data/README.md.\n` +
    `- The broad route intentionally represents the expensive pattern the routing layer is designed to avoid.\n` +
    `- File-system cache, runner variance and JSON parser implementation affect timing. Payload byte ratios are deterministic for the commit.\n` +
    `- This benchmark is evidence of reduced retrieval/context cost, not a direct measurement of an AI model's private reasoning speed.\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const broadFiles = joinedSpeciesFiles().map(name => join(SPECIES_DIR, name));
  const normalizedFiles = NORMALIZED_FILES.map(name => join(BOTANICAL_DIR, name));

  const broadExample = loadBroadJoinedViews(args.characterId);
  const normalizedExample = loadNormalizedComparison(args.characterId);
  if (!normalizedExample.character) {
    throw new Error(`Character not found: ${args.characterId}`);
  }

  const broadTiming = benchmark(
    () => loadBroadJoinedViews(args.characterId).filter(row => row.relation).length,
    args.samples
  );
  const normalizedTiming = benchmark(
    () => loadNormalizedComparison(args.characterId).rows.length,
    args.samples
  );

  const broadBytes = bytesOf(broadFiles);
  const normalizedBytes = bytesOf(normalizedFiles);
  const compactResultBytes = Buffer.byteLength(JSON.stringify(normalizedExample), 'utf8');

  const report = {
    benchmark_version: 1,
    generated_at: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    query: {
      character_id: args.characterId,
      broad_rows: broadExample.length,
      normalized_rows: normalizedExample.rows.length,
    },
    payload: {
      broad_joined_files: broadFiles.length,
      broad_joined_bytes: broadBytes,
      normalized_files: normalizedFiles.length,
      normalized_input_bytes: normalizedBytes,
      compact_result_bytes: compactResultBytes,
    },
    timings: {
      broad_joined: broadTiming,
      normalized: normalizedTiming,
    },
    ratios: {
      broad_to_normalized_payload: ratio(broadBytes, normalizedBytes),
      broad_to_compact_result: ratio(broadBytes, compactResultBytes),
      normalized_to_broad_time: ratio(normalizedTiming.median_us, broadTiming.median_us),
      broad_to_normalized_time: ratio(broadTiming.median_us, normalizedTiming.median_us),
    },
    interpretation: {
      direct_model_thinking_measurement: false,
      deterministic_payload_ratio: true,
      purpose: 'prove reduced repository retrieval/context cost for the optimized AI data route',
    },
  };

  const markdown = renderMarkdown(report);
  if (args.json) {
    mkdirSync(dirname(args.json), { recursive: true });
    writeFileSync(args.json, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  if (args.markdown) {
    mkdirSync(dirname(args.markdown), { recursive: true });
    writeFileSync(args.markdown, markdown, 'utf8');
  }
  process.stdout.write(markdown);
}

try {
  main();
} catch (error) {
  console.error(error.stack ?? error.message ?? String(error));
  process.exitCode = 1;
}
