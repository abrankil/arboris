import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileAscPrompt, validateAscContract } from './compile_asc.mjs';

const fixture = JSON.parse(
  fs.readFileSync(new URL('./fixtures/real-scene-translation-001.json', import.meta.url), 'utf8'),
);

test('real field translation fixture validates as ASC v0.1', () => {
  assert.doesNotThrow(() => validateAscContract(fixture));
});

test('real field translation fixture compiles deterministically', () => {
  const first = compileAscPrompt(fixture);
  const second = compileAscPrompt(structuredClone(fixture));

  assert.equal(first, second);
});

test('OPEN-sensitive field is preserved in compiled output', () => {
  const prompt = compileAscPrompt(fixture);

  assert.match(prompt, /\[OPEN\]/);
  assert.match(prompt, /Map topology and walkable envelope\./);
  assert.match(prompt, /Territorialized species placement rules\./);
  assert.match(prompt, /Generative provider and execution implementation\./);
});

test('removing the spatial OPEN constraint changes the compiled contract', () => {
  const reduced = structuredClone(fixture);
  reduced.open = reduced.open.filter((item) => item !== 'Map topology and walkable envelope.');

  assert.notEqual(compileAscPrompt(fixture), compileAscPrompt(reduced));
});

test('removing the generated-output prohibition changes the compiled contract', () => {
  const reduced = structuredClone(fixture);
  reduced.prohibited = reduced.prohibited.filter(
    (item) => item !== 'Do not present a generated image as automatic ecological or botanical evidence.',
  );

  assert.notEqual(compileAscPrompt(fixture), compileAscPrompt(reduced));
});

test('negative reduction control fails closed when an unauthorized key is introduced', () => {
  const invalid = { ...fixture, inventedField: 'must fail' };

  assert.throws(
    () => validateAscContract(invalid),
    /unknown top-level key\(s\): inventedField/,
  );
});

test('artistic freedom is not authorized merely by field evidence', () => {
  assert.deepEqual(fixture.artisticFreedom, []);
});
