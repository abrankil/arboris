import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileAscPrompt, validateAscContract } from './compile_asc.mjs';

const fixture = JSON.parse(
  fs.readFileSync(new URL('./fixtures/minimal-contract.json', import.meta.url), 'utf8'),
);

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
