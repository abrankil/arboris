import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VERSION = '0.1';
const VERSION_2 = '0.2';
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

const V2_OPTIONAL_KEYS = new Set([
  'bootstrapAuthority',
  'taskBaseline',
  'stateMachine',
  'stagedContentEquivalence',
]);

const V2_ALLOWED_KEYS = new Set([...ALLOWED_KEYS, ...V2_OPTIONAL_KEYS]);

const TASK_BASELINE_ACTIONS = new Set(['stop', 'stop_and_recapture']);
const STAGED_OPERATIONS = new Set(['added', 'modified', 'deleted', 'renamed']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertNonEmptyString(value, key) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} must be a non-empty string`);
  }
}

function assertBoolean(value, key) {
  if (typeof value !== 'boolean') {
    throw new Error(`${key} must be a boolean`);
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

function assertNonEmptyStringArray(value, key) {
  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array of strings`);
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new Error(`${key}[${index}] must be a non-empty string`);
    }
  }

  if (value.length === 0) {
    throw new Error(`${key} must contain at least one item`);
  }
}

function assertClosedObjectKeys(value, requiredKeys, label) {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be a JSON object`);
  }

  const unknown = Object.keys(value).filter((key) => !requiredKeys.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${label}: unknown key(s): ${unknown.join(', ')}`);
  }

  const missing = requiredKeys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  if (missing.length > 0) {
    throw new Error(`${label}: missing key(s): ${missing.join(', ')}`);
  }
}

function assertNoUnknownKeys(value, allowedKeys, label) {
  const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${label}: unknown key(s): ${unknown.join(', ')}`);
  }
}

function validateCoreStructure(contract, allowedKeys, expectedVersion) {
  if (!isPlainObject(contract)) {
    throw new Error('ASC contract must be a JSON object');
  }

  const unknownKeys = Object.keys(contract).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(`unknown top-level key(s): ${unknownKeys.join(', ')}`);
  }

  const missingKeys = [...ALLOWED_KEYS].filter(
    (key) => !Object.prototype.hasOwnProperty.call(contract, key),
  );
  if (missingKeys.length > 0) {
    throw new Error(`missing required key(s): ${missingKeys.join(', ')}`);
  }

  if (contract.version !== expectedVersion) {
    throw new Error(`version must be "${expectedVersion}"`);
  }

  if (contract.executionMode !== EXECUTION_MODE) {
    throw new Error(`executionMode must be "${EXECUTION_MODE}" in ASC v${expectedVersion}`);
  }

  for (const key of STRING_KEYS) {
    assertNonEmptyString(contract[key], key);
  }

  for (const key of ARRAY_KEYS) {
    assertStringArray(contract[key], key);
  }

  return contract;
}

function assertBootstrapAuthority(value) {
  assertClosedObjectKeys(value, ['bootstrapDocument', 'canonicalAuthority'], 'bootstrapAuthority');
  assertNonEmptyString(value.bootstrapDocument, 'bootstrapAuthority.bootstrapDocument');
  assertNonEmptyString(value.canonicalAuthority, 'bootstrapAuthority.canonicalAuthority');
}

function assertTaskBaseline(value) {
  assertClosedObjectKeys(value, ['capture', 'invalidateOn', 'onInvalidation'], 'taskBaseline');
  assertNonEmptyStringArray(value.capture, 'taskBaseline.capture');
  assertNonEmptyStringArray(value.invalidateOn, 'taskBaseline.invalidateOn');

  assertClosedObjectKeys(value.onInvalidation, ['action'], 'taskBaseline.onInvalidation');
  assertNonEmptyString(value.onInvalidation.action, 'taskBaseline.onInvalidation.action');

  if (!TASK_BASELINE_ACTIONS.has(value.onInvalidation.action)) {
    const allowed = [...TASK_BASELINE_ACTIONS].map((action) => `"${action}"`).join(', ');
    throw new Error(`taskBaseline.onInvalidation.action must be one of ${allowed}`);
  }
}

function assertStateMachine(value) {
  assertClosedObjectKeys(value, ['states', 'transitions'], 'stateMachine');

  const { states, transitions } = value;

  if (!Array.isArray(states)) {
    throw new Error('stateMachine.states must be an array');
  }
  if (states.length === 0) {
    throw new Error('stateMachine.states must contain at least one item');
  }

  const stateIds = new Set();
  for (const [index, state] of states.entries()) {
    const label = `stateMachine.states[${index}]`;
    assertClosedObjectKeys(state, ['id', 'name'], label);
    assertNonEmptyString(state.id, `${label}.id`);
    assertNonEmptyString(state.name, `${label}.name`);

    if (stateIds.has(state.id)) {
      throw new Error(`stateMachine.states contains duplicate id "${state.id}"`);
    }
    stateIds.add(state.id);
  }

  if (!Array.isArray(transitions)) {
    throw new Error('stateMachine.transitions must be an array');
  }

  const seenTransitions = new Set();
  for (const [index, transition] of transitions.entries()) {
    const label = `stateMachine.transitions[${index}]`;

    if (!isPlainObject(transition)) {
      throw new Error(`${label} must be a JSON object with source and target`);
    }

    assertNoUnknownKeys(transition, ['source', 'target', 'condition', 'authorization'], label);
    assertNonEmptyString(transition.source, `${label}.source`);
    assertNonEmptyString(transition.target, `${label}.target`);

    if (Object.prototype.hasOwnProperty.call(transition, 'condition')) {
      assertNonEmptyString(transition.condition, `${label}.condition`);
    }
    if (Object.prototype.hasOwnProperty.call(transition, 'authorization')) {
      assertNonEmptyString(transition.authorization, `${label}.authorization`);
    }

    if (!stateIds.has(transition.source)) {
      throw new Error(`${label} references unknown state id "${transition.source}"`);
    }
    if (!stateIds.has(transition.target)) {
      throw new Error(`${label} references unknown state id "${transition.target}"`);
    }

    const canonicalKey = JSON.stringify([
      transition.source,
      transition.target,
      transition.condition ?? null,
      transition.authorization ?? null,
    ]);

    if (seenTransitions.has(canonicalKey)) {
      throw new Error(
        'stateMachine.transitions contains a duplicate transition '
        + `(source="${transition.source}", target="${transition.target}", `
        + `condition="${transition.condition ?? 'none'}", authorization="${transition.authorization ?? 'none'}")`,
      );
    }
    seenTransitions.add(canonicalKey);
  }
}

function assertStagedContentEquivalence(value) {
  assertClosedObjectKeys(value, ['entries', 'requireNoUnstagedDivergence'], 'stagedContentEquivalence');

  const { entries, requireNoUnstagedDivergence } = value;

  if (!Array.isArray(entries)) {
    throw new Error('stagedContentEquivalence.entries must be an array');
  }

  for (const [index, entry] of entries.entries()) {
    const label = `stagedContentEquivalence.entries[${index}]`;

    if (!isPlainObject(entry)) {
      throw new Error(`${label} must be a JSON object`);
    }

    assertNoUnknownKeys(entry, ['path', 'operation', 'from'], label);
    assertNonEmptyString(entry.path, `${label}.path`);
    assertNonEmptyString(entry.operation, `${label}.operation`);

    if (!STAGED_OPERATIONS.has(entry.operation)) {
      const allowed = [...STAGED_OPERATIONS].map((op) => `"${op}"`).join(', ');
      throw new Error(`${label}.operation must be one of ${allowed}`);
    }

    const hasFrom = Object.prototype.hasOwnProperty.call(entry, 'from');

    if (entry.operation === 'renamed') {
      if (!hasFrom) {
        throw new Error(`${label}.from is required when operation is "renamed"`);
      }
      assertNonEmptyString(entry.from, `${label}.from`);
    } else if (hasFrom) {
      throw new Error(`${label}.from must not be present when operation is "${entry.operation}"`);
    }
  }

  assertBoolean(requireNoUnstagedDivergence, 'stagedContentEquivalence.requireNoUnstagedDivergence');
}

export function validateAscContract(contract) {
  return validateCoreStructure(contract, ALLOWED_KEYS, VERSION);
}

export function validateAscContractV2(contract) {
  const valid = validateCoreStructure(contract, V2_ALLOWED_KEYS, VERSION_2);

  if (Object.prototype.hasOwnProperty.call(valid, 'bootstrapAuthority')) {
    assertBootstrapAuthority(valid.bootstrapAuthority);
  }
  if (Object.prototype.hasOwnProperty.call(valid, 'taskBaseline')) {
    assertTaskBaseline(valid.taskBaseline);
  }
  if (Object.prototype.hasOwnProperty.call(valid, 'stateMachine')) {
    assertStateMachine(valid.stateMachine);
  }
  if (Object.prototype.hasOwnProperty.call(valid, 'stagedContentEquivalence')) {
    assertStagedContentEquivalence(valid.stagedContentEquivalence);
  }

  return valid;
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

function renderBootstrapAuthority(valid) {
  if (!Object.prototype.hasOwnProperty.call(valid, 'bootstrapAuthority')) {
    return null;
  }

  const { bootstrapDocument, canonicalAuthority } = valid.bootstrapAuthority;
  return `[BOOTSTRAP AUTHORITY]\nbootstrap: ${bootstrapDocument}\ncanonical: ${canonicalAuthority}`;
}

function renderTaskBaseline(valid) {
  if (!Object.prototype.hasOwnProperty.call(valid, 'taskBaseline')) {
    return null;
  }

  const { capture, invalidateOn, onInvalidation } = valid.taskBaseline;

  return [
    renderListSection('TASK BASELINE — CAPTURE', capture),
    renderListSection('TASK BASELINE — INVALIDATE ON', invalidateOn),
    renderScalarSection('TASK BASELINE — ON INVALIDATION', `action: ${onInvalidation.action}`),
  ].join('\n\n');
}

function renderStateMachine(valid) {
  if (!Object.prototype.hasOwnProperty.call(valid, 'stateMachine')) {
    return null;
  }

  const { states, transitions } = valid.stateMachine;

  const stateLines = states.map((state) => `${state.id} ${state.name}`);
  const transitionLines = transitions.map((transition) => {
    const details = [];
    if (transition.condition) {
      details.push(`condition: ${transition.condition}`);
    }
    if (transition.authorization) {
      details.push(`authorization: ${transition.authorization}`);
    }
    const suffix = details.length > 0 ? ` (${details.join('; ')})` : '';
    return `${transition.source} -> ${transition.target}${suffix}`;
  });

  return [
    renderListSection('STATE MACHINE', stateLines),
    renderListSection('STATE MACHINE TRANSITIONS', transitionLines),
  ].join('\n\n');
}

function renderStagedContentEquivalence(valid) {
  if (!Object.prototype.hasOwnProperty.call(valid, 'stagedContentEquivalence')) {
    return null;
  }

  const { entries, requireNoUnstagedDivergence } = valid.stagedContentEquivalence;

  const entryLines = entries.map((entry) => (
    entry.operation === 'renamed'
      ? `${entry.operation}: ${entry.path} (from: ${entry.from})`
      : `${entry.operation}: ${entry.path}`
  ));

  return [
    renderListSection('STAGED CONTENT EQUIVALENCE — ENTRIES', entryLines),
    renderScalarSection(
      'STAGED CONTENT EQUIVALENCE — REQUIRE NO UNSTAGED DIVERGENCE',
      String(requireNoUnstagedDivergence),
    ),
  ].join('\n\n');
}

const V2_RENDERERS = [
  renderBootstrapAuthority,
  renderTaskBaseline,
  renderStateMachine,
  renderStagedContentEquivalence,
];

function compileAscPromptCore(valid, extraRenderers) {
  const sections = [
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
    ...extraRenderers.map((render) => render(valid)).filter((section) => section !== null),
  ];

  return sections.join('\n\n') + '\n';
}

export function compileAscPrompt(contract) {
  if (isPlainObject(contract) && contract.version === VERSION_2) {
    return compileAscPromptCore(validateAscContractV2(contract), V2_RENDERERS);
  }

  return compileAscPromptCore(validateAscContract(contract), []);
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
