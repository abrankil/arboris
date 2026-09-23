import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createApcContradictionRelevanceProvider,
  createApcStateIncompatibilityProvider,
} from './apc-i12-semantics.mjs';

test('I12 incompatibility provider never treats generic inequality as contradiction', () => {
  const dataset = {
    allCharactersById: new Map([
      ['CH-001', { characterId: 'CH-001', allowedStates: ['a','b'] }],
    ]),
  };
  const incompatible = createApcStateIncompatibilityProvider(dataset);
  assert.equal(incompatible('a','b',{ characterId:'CH-001' }), false);
});

test('I12 incompatibility provider honors explicit character contract pairs', () => {
  const dataset = {
    allCharactersById: new Map([
      ['CH-001', {
        characterId: 'CH-001',
        allowedStates: ['a','b','c'],
        incompatibilityPairs: [['a','b']],
      }],
    ]),
  };
  const incompatible = createApcStateIncompatibilityProvider(dataset);
  assert.equal(incompatible('a','b',{ characterId:'CH-001' }), true);
  assert.equal(incompatible('b','a',{ characterId:'CH-001' }), true);
  assert.equal(incompatible('a','c',{ characterId:'CH-001' }), false);
});

test('I12 contradiction relevance provider preserves registered contradictions', () => {
  const relevant = createApcContradictionRelevanceProvider();
  assert.equal(relevant({ contradictionId:'C-1' }), true);
  assert.equal(relevant(null), false);
});
