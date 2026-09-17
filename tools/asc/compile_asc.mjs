import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VERSION = '0.1';
const EXECUTION_MODE = 'compile-only';

const STRING_KEYS = ['testId', 'objective'];
const ARRAY_KEYS = [
  'authorizedSources',
  'structuralContract',
  'mandatoryRelations',
  'open',
  'doNotInfer',
  'prohibited',
  'artisticFreedom',
  'cameraFormat',
  'readingPriorities',
  'validationCriteria',
];

const REQUIRED_NONEMPTY_ARRAYS = new Set([
  'authorizedSources',
  'structuralContract',
  'validationCriteria',
]);

const ALLOWED_KEYS = new Set([
  'version',
  'executionMode',
  ...STRING_KEYS,
  ...ARRAY_KEYS,
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertNonEmptyString(value, key) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} must be a non-empty string`);
  }
}

function assertStringArray(value, key) {
  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array of strings`);
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new Error(`${key}[${index}] must be a non-empty string`);
    }
  }

  if (REQUIRED_NONEMPTY_ARRAYS.has(key) && value.length === 0) {
    throw new Error(`${key} must contain at least one item`);
  }
}

export function validateAscContract(contract) {
  if (!isPlainObject(contract)) {
    throw new Error('ASC contract must be a JSON object');
  }

  const unknownKeys = Object.keys(contract).filter((key) => !ALLOWED_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(`unknown top-level key(s): ${unknownKeys.join(', ')}`);
  }

  const missingKeys = [...ALLOWED_KEYS].filter(
    (key) => !Object.prototype.hasOwnProperty.call(contract, key),
  );
  if (missingKeys.length > 0) {
    throw new Error(`missing required key(s): ${missingKeys.join(', ')}`);
  }

  if (contract.version !== VERSION) {
    throw new Error(`version must be "${VERSION}"`);
  }

  if (contract.executionMode !== EXECUTION_MODE) {
    throw new Error(`executionMode must be "${EXECUTION_MODE}" in ASC v0.1`);
  }

  for (const key of STRING_KEYS) {
    assertNonEmptyString(contract[key], key);
  }

  for (const key of ARRAY_KEYS) {
    assertStringArray(contract[key], key);
  }

  return contract;
}

function renderScalarSection(title, value) {
  return `[${title}]\n${value}`;
}

function renderListSection(title, items) {
  const body = items.length > 0
    ? items.map((item) => `- ${item}`).join('\n')
    : '- NONE DECLARED';
  return `[${title}]\n${body}`;
}

export function compileAscPrompt(contract) {
  const valid = validateAscContract(contract);

  return [
    renderScalarSection('ASC VERSION', valid.version),
    renderScalarSection('TEST ID', valid.testId),
    renderScalarSection('OBJECTIVE', valid.objective),
    renderScalarSection('EXECUTION MODE', valid.executionMode),
    renderListSection('AUTHORIZED INPUT / SOURCES', valid.authorizedSources),
    renderListSection('STRUCTURAL CONTRACT', valid.structuralContract),
    renderListSection('MANDATORY RELATIONS', valid.mandatoryRelations),
    renderListSection('OPEN', valid.open),
    renderListSection('DO NOT INFER', valid.doNotInfer),
    renderListSection('PROHIBITED', valid.prohibited),
    renderListSection('AUTHORIZED ARTISTIC FREEDOM', valid.artisticFreedom),
    renderListSection('CAMERA / FORMAT', valid.cameraFormat),
    renderListSection('READING PRIORITIES', valid.readingPriorities),
    renderListSection('VALIDATION CRITERIA', valid.validationCriteria),
  ].join('\n\n') + '\n';
}

function parseCliArgs(argv) {
  if (argv.length === 0) {
    throw new Error('usage: compile_asc.mjs <contract.json> [--output <file>]');
  }

  const inputPath = argv[0];
  let outputPath = null;

  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output') {
      if (outputPath !== null || i + 1 >= argv.length) {
        throw new Error('invalid --output usage');
      }
      outputPath = argv[i + 1];
      i += 1;
      continue;
    }
    throw new Error(`unknown CLI argument: ${arg}`);
  }

  return { inputPath, outputPath };
}

function runCli(argv) {
  const { inputPath, outputPath } = parseCliArgs(argv);
  const raw = fs.readFileSync(inputPath, 'utf8');
  let contract;

  try {
    contract = JSON.parse(raw);
  } catch (error) {
    throw new Error(`invalid JSON in ${inputPath}: ${error.message}`);
  }

  const prompt = compileAscPrompt(contract);

  if (outputPath) {
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
    fs.writeFileSync(outputPath, prompt, 'utf8');
    return;
  }

  process.stdout.write(prompt);
}

const invokedAsScript = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedAsScript) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`ASC v0.1 compile error: ${error.message}\n`);
    process.exitCode = 1;
  }
}
