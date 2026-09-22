function canonicalText(value) {
  return typeof value === 'string' && value && value === value.trim() ? value : null;
}

function normalizePair(a, b) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

/**
 * Builds the I9 incompatibility provider from explicit character semantics.
 *
 * The provider is intentionally conservative: different strings are NOT
 * incompatible merely because they differ. A character may expose either:
 *
 *   incompatibilityPairs: [['state_a','state_b'], ...]
 *   raw.incompatibility_pairs: [['state_a','state_b'], ...]
 *
 * If neither exists, the provider returns false.
 */
export function createApcStateIncompatibilityProvider(dataset) {
  return function areStatesIncompatible(a, b, { characterId } = {}) {
    if (!canonicalText(characterId)) return false;
    if (!canonicalText(a) || !canonicalText(b) || a === b) return false;

    const character = dataset?.allCharactersById?.get?.(characterId);
    if (!character) return false;

    const pairs =
      character.incompatibilityPairs ??
      character?.raw?.incompatibility_pairs ??
      [];

    if (!Array.isArray(pairs)) return false;
    const target = normalizePair(a, b);

    return pairs.some(pair =>
      Array.isArray(pair) &&
      pair.length === 2 &&
      canonicalText(pair[0]) &&
      canonicalText(pair[1]) &&
      normalizePair(pair[0], pair[1]) === target
    );
  };
}

/**
 * I10 only asks whether a contradiction is material to the assessment
 * substrate. I12 preserves every registered contradiction as relevant by
 * default, without deciding which evidence is correct.
 */
export function createApcContradictionRelevanceProvider() {
  return function isContradictionRelevant(contradiction) {
    return contradiction != null;
  };
}
