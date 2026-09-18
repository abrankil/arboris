import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileAscPrompt, validateAscContract, validateAscContractV2 } from './compile_asc.mjs';

const fixture = JSON.parse(
  fs.readFileSync(new URL('./fixtures/minimal-contract.json', import.meta.url), 'utf8'),
);

const fixtureV2 = { ...fixture, version: '0.2' };

test('compiles the same valid contract deterministically', () => {
  const first = compileAscPrompt(fixture);
  const second = compileAscPrompt(structuredClone(fixture));

  assert.equal(first, second);
  assert.match(first, /\[ASC VERSION\]\n0\.1/);
  assert.match(first, /\[EXECUTION MODE\]\ncompile-only/);
  assert.match(first, /\[OPEN\]\n- Proveedor generativo definitivo\./);
  assert.match(first, /\[DO NOT INFER\]\n- No seleccionar proveedor por plausibilidad o conveniencia\./);
});

test('keeps optional empty sections explicit', () => {
  const prompt = compileAscPrompt(fixture);

  assert.match(prompt, /\[AUTHORIZED ARTISTIC FREEDOM\]\n- NONE DECLARED/);
  assert.match(prompt, /\[CAMERA \/ FORMAT\]\n- NONE DECLARED/);
});

test('preserves stable section order', () => {
  const prompt = compileAscPrompt(fixture);
  const headings = [
    '[ASC VERSION]',
    '[TEST ID]',
    '[OBJECTIVE]',
    '[EXECUTION MODE]',
    '[AUTHORIZED INPUT / SOURCES]',
    '[STRUCTURAL CONTRACT]',
    '[MANDATORY RELATIONS]',
    '[OPEN]',
    '[DO NOT INFER]',
    '[PROHIBITED]',
    '[AUTHORIZED ARTISTIC FREEDOM]',
    '[CAMERA / FORMAT]',
    '[READING PRIORITIES]',
    '[VALIDATION CRITERIA]',
  ];

  let previous = -1;
  for (const heading of headings) {
    const current = prompt.indexOf(heading);
    assert.ok(current > previous, `${heading} must appear after the previous section`);
    previous = current;
  }
});

test('rejects compile-and-execute in v0.1', () => {
  assert.throws(
    () => validateAscContract({ ...fixture, executionMode: 'compile-and-execute' }),
    /executionMode must be "compile-only"/,
  );
});

test('rejects unknown top-level keys instead of ignoring them', () => {
  assert.throws(
    () => validateAscContract({ ...fixture, provider: 'example' }),
    /unknown top-level key\(s\): provider/,
  );
});

test('rejects missing required keys', () => {
  const invalid = structuredClone(fixture);
  delete invalid.objective;

  assert.throws(
    () => validateAscContract(invalid),
    /missing required key\(s\): objective/,
  );
});

test('requires core arrays to contain at least one item', () => {
  assert.throws(
    () => validateAscContract({ ...fixture, validationCriteria: [] }),
    /validationCriteria must contain at least one item/,
  );
});

test('a v0.1 contract without an explicit version key fails exactly like today', () => {
  const invalid = structuredClone(fixture);
  delete invalid.version;

  assert.throws(
    () => validateAscContract(invalid),
    /missing required key\(s\): version/,
  );
});

test('a v0.2 contract with none of the optional capabilities compiles like the 14 core sections only', () => {
  const prompt = compileAscPrompt(fixtureV2);

  assert.match(prompt, /\[ASC VERSION\]\n0\.2/);
  assert.doesNotMatch(prompt, /\[BOOTSTRAP AUTHORITY\]/);
  assert.doesNotMatch(prompt, /\[TASK BASELINE/);
  assert.doesNotMatch(prompt, /\[STATE MACHINE/);
  assert.doesNotMatch(prompt, /\[STAGED CONTENT EQUIVALENCE/);
});

test('a v0.2 contract compiles with all four new capabilities declared', () => {
  const contract = {
    ...fixtureV2,
    bootstrapAuthority: {
      bootstrapDocument: 'CLAUDE.md',
      canonicalAuthority: 'docs/ARBORIS_SCENE_COMPILER.md',
    },
    taskBaseline: {
      capture: ['repositoryRoot', 'branch', 'head'],
      invalidateOn: ['unexpectedFileChange'],
      onInvalidation: { action: 'stop_and_recapture' },
    },
    stateMachine: {
      states: [
        { id: 'S2', name: 'IMPLEMENT' },
        { id: 'S3', name: 'VALIDATE' },
      ],
      transitions: [
        { source: 'S2', target: 'S3' },
        { source: 'S3', target: 'S2', condition: 'validation_failed' },
      ],
    },
    stagedContentEquivalence: {
      entries: [
        { path: 'tools/asc/compile_asc.mjs', operation: 'modified' },
      ],
      requireNoUnstagedDivergence: true,
    },
  };

  const prompt = compileAscPrompt(contract);

  assert.match(prompt, /\[ASC VERSION\]\n0\.2/);
  assert.match(prompt, /\[BOOTSTRAP AUTHORITY\]\nbootstrap: CLAUDE\.md\ncanonical: docs\/ARBORIS_SCENE_COMPILER\.md/);
  assert.match(prompt, /\[TASK BASELINE — CAPTURE\]\n- repositoryRoot\n- branch\n- head/);
  assert.match(prompt, /\[TASK BASELINE — INVALIDATE ON\]\n- unexpectedFileChange/);
  assert.match(prompt, /\[TASK BASELINE — ON INVALIDATION\]\naction: stop_and_recapture/);
  assert.match(prompt, /\[STATE MACHINE\]\n- S2 IMPLEMENT\n- S3 VALIDATE/);
  assert.match(prompt, /\[STATE MACHINE TRANSITIONS\]\n- S2 -> S3\n- S3 -> S2 \(condition: validation_failed\)/);
  assert.match(prompt, /\[STAGED CONTENT EQUIVALENCE — ENTRIES\]\n- modified: tools\/asc\/compile_asc\.mjs/);
  assert.match(prompt, /\[STAGED CONTENT EQUIVALENCE — REQUIRE NO UNSTAGED DIVERGENCE\]\ntrue/);
});

test('rejects an unknown ASC version', () => {
  assert.throws(
    () => compileAscPrompt({ ...fixture, version: '0.3' }),
    /version must be "0\.1"/,
  );
});

test('rejects a v0.2-only key when the contract declares version 0.1', () => {
  assert.throws(
    () => validateAscContract({
      ...fixture,
      bootstrapAuthority: { bootstrapDocument: 'x', canonicalAuthority: 'y' },
    }),
    /unknown top-level key\(s\): bootstrapAuthority/,
  );
});

test('accepts a valid bootstrapAuthority', () => {
  const prompt = compileAscPrompt({
    ...fixtureV2,
    bootstrapAuthority: {
      bootstrapDocument: 'CLAUDE.md',
      canonicalAuthority: 'docs/ARBORIS_SCENE_COMPILER.md',
    },
  });

  assert.match(prompt, /\[BOOTSTRAP AUTHORITY\]\nbootstrap: CLAUDE\.md\ncanonical: docs\/ARBORIS_SCENE_COMPILER\.md/);
});

test('rejects an invalid bootstrapAuthority', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      bootstrapAuthority: { bootstrapDocument: 'CLAUDE.md', canonicalAuthority: '' },
    }),
    /bootstrapAuthority\.canonicalAuthority must be a non-empty string/,
  );
});

test('accepts a valid taskBaseline', () => {
  const prompt = compileAscPrompt({
    ...fixtureV2,
    taskBaseline: {
      capture: ['repositoryRoot', 'branch'],
      invalidateOn: ['unexpectedFileChange'],
      onInvalidation: { action: 'stop' },
    },
  });

  assert.match(prompt, /\[TASK BASELINE — CAPTURE\]\n- repositoryRoot\n- branch/);
  assert.match(prompt, /\[TASK BASELINE — INVALIDATE ON\]\n- unexpectedFileChange/);
  assert.match(prompt, /\[TASK BASELINE — ON INVALIDATION\]\naction: stop/);
});

test('rejects a taskBaseline with an empty capture list', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      taskBaseline: { capture: [], invalidateOn: ['x'], onInvalidation: { action: 'stop' } },
    }),
    /taskBaseline\.capture must contain at least one item/,
  );
});

test('accepts both initially valid onInvalidation actions', () => {
  for (const action of ['stop', 'stop_and_recapture']) {
    const valid = validateAscContractV2({
      ...fixtureV2,
      taskBaseline: { capture: ['branch'], invalidateOn: ['x'], onInvalidation: { action } },
    });

    assert.equal(valid.taskBaseline.onInvalidation.action, action);
  }
});

test('rejects an unknown onInvalidation action', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      taskBaseline: { capture: ['branch'], invalidateOn: ['x'], onInvalidation: { action: 'restart' } },
    }),
    /taskBaseline\.onInvalidation\.action must be one of "stop", "stop_and_recapture"/,
  );
});

const baseStates = [
  { id: 'S2', name: 'IMPLEMENT' },
  { id: 'S3', name: 'VALIDATE' },
];

test('accepts a valid stateMachine', () => {
  const valid = validateAscContractV2({
    ...fixtureV2,
    stateMachine: { states: baseStates, transitions: [{ source: 'S2', target: 'S3' }] },
  });

  assert.equal(valid.stateMachine.states.length, 2);
});

test('rejects a transition to a nonexistent state', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      stateMachine: { states: baseStates, transitions: [{ source: 'S2', target: 'S99' }] },
    }),
    /stateMachine\.transitions\[0\] references unknown state id "S99"/,
  );
});

test('rejects a transition from a nonexistent state', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      stateMachine: { states: baseStates, transitions: [{ source: 'S99', target: 'S3' }] },
    }),
    /stateMachine\.transitions\[0\] references unknown state id "S99"/,
  );
});

test('rejects a truly identical duplicate transition', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      stateMachine: {
        states: baseStates,
        transitions: [
          { source: 'S2', target: 'S3' },
          { source: 'S2', target: 'S3' },
        ],
      },
    }),
    /stateMachine\.transitions contains a duplicate transition/,
  );
});

test('allows an explicit cycle between two states', () => {
  const valid = validateAscContractV2({
    ...fixtureV2,
    stateMachine: {
      states: baseStates,
      transitions: [
        { source: 'S2', target: 'S3' },
        { source: 'S3', target: 'S2', condition: 'validation_failed' },
      ],
    },
  });

  assert.equal(valid.stateMachine.transitions.length, 2);
});

test('same source/target with different condition are not duplicates', () => {
  const valid = validateAscContractV2({
    ...fixtureV2,
    stateMachine: {
      states: baseStates,
      transitions: [
        { source: 'S3', target: 'S2', condition: 'validation_failed' },
        { source: 'S3', target: 'S2', condition: 'audit_findings_require_rework' },
      ],
    },
  });

  assert.equal(valid.stateMachine.transitions.length, 2);
});

test('same source/target with different authorization are not duplicates', () => {
  const valid = validateAscContractV2({
    ...fixtureV2,
    stateMachine: {
      states: baseStates,
      transitions: [
        { source: 'S3', target: 'S2', authorization: 'explicit_stage_authorization' },
        { source: 'S3', target: 'S2', authorization: 'explicit_close_authorization' },
      ],
    },
  });

  assert.equal(valid.stateMachine.transitions.length, 2);
});

test('accepts added, modified, deleted and renamed entries', () => {
  const valid = validateAscContractV2({
    ...fixtureV2,
    stagedContentEquivalence: {
      entries: [
        { path: 'new-file.mjs', operation: 'added' },
        { path: 'existing-file.mjs', operation: 'modified' },
        { path: 'removed-file.mjs', operation: 'deleted' },
        { path: 'new-name.mjs', operation: 'renamed', from: 'old-name.mjs' },
      ],
      requireNoUnstagedDivergence: false,
    },
  });

  assert.equal(valid.stagedContentEquivalence.entries.length, 4);
});

test('rejects a renamed entry without from', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      stagedContentEquivalence: {
        entries: [{ path: 'new-name.mjs', operation: 'renamed' }],
        requireNoUnstagedDivergence: false,
      },
    }),
    /stagedContentEquivalence\.entries\[0\]\.from is required when operation is "renamed"/,
  );
});

test('rejects from used on a non-renamed operation', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      stagedContentEquivalence: {
        entries: [{ path: 'file.mjs', operation: 'added', from: 'other.mjs' }],
        requireNoUnstagedDivergence: false,
      },
    }),
    /stagedContentEquivalence\.entries\[0\]\.from must not be present when operation is "added"/,
  );
});

test('rejects an unknown staged operation', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      stagedContentEquivalence: {
        entries: [{ path: 'file.mjs', operation: 'copied' }],
        requireNoUnstagedDivergence: false,
      },
    }),
    /stagedContentEquivalence\.entries\[0\]\.operation must be one of "added", "modified", "deleted", "renamed"/,
  );
});

test('requireNoUnstagedDivergence must be a boolean', () => {
  assert.throws(
    () => validateAscContractV2({
      ...fixtureV2,
      stagedContentEquivalence: { entries: [], requireNoUnstagedDivergence: 'true' },
    }),
    /stagedContentEquivalence\.requireNoUnstagedDivergence must be a boolean/,
  );

  const valid = validateAscContractV2({
    ...fixtureV2,
    stagedContentEquivalence: { entries: [], requireNoUnstagedDivergence: true },
  });

  assert.equal(valid.stagedContentEquivalence.requireNoUnstagedDivergence, true);
});
