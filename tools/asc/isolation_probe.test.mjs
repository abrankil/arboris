import test from 'node:test';
import assert from 'node:assert/strict';
import { compileAscPrompt } from './compile_asc.mjs';

test('ASC isolation probe: compiler remains independently callable', () => {
  const contract = {
    version: '0.1',
    executionMode: 'compile-only',
    testId: 'ISOLATION-ASC-001',
    objective: 'Isolation probe',
    authorizedSources: ['ASC'],
    structuralContract: ['Compile only'],
    mandatoryRelations: ['None'],
    open: [],
    doNotInfer: [],
    prohibited: [],
    artisticFreedom: [],
    cameraFormat: [],
    readingPriorities: [],
    validationCriteria: ['Deterministic compilation']
  };
  assert.equal(typeof compileAscPrompt(contract), 'string');
});
