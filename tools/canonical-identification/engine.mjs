import { getRelation, getVariability } from './dataset.mjs';

const UNKNOWN_OBSERVATION_STATES = new Set([
  'unknown',
  'not_observable',
  'not_applicable',
  'not_evaluated',
  'no_se',
  'no_sé',
  'no_observable',
  'no_aplica',
]);

const POWER_SCORE = new Map([
  ['alto', 3],
  ['medio', 2],
  ['bajo', 1],
]);

const YES_VALUES = new Set(['si', 'sí', 'yes', 'true']);

const LOW_COST = new Set(['bajo', 'nulo', 'nula']);

const SAFE_VALUES = new Set(['seguro', 'bajo']);

const CONTAINS_APPLIES_IF =
  /^([A-Z]{2}-\d{3})\s+contiene\s+(.+)$/i;

function normalizeToken(value) {
  return String(value)
    .trim()
    .toLowerCase();
}

function toStateSet(value) {
  if (value == null) return new Set();
  const values = Array.isArray(value) ? value : [value];

  return new Set(
    values
      .map(String)
      .map(item => item.trim())
      .filter(Boolean),
  );
}

function hasUnknownObservationState(states) {
  return [...states]
    .some(state => UNKNOWN_OBSERVATION_STATES.has(state));
}

function intersects(left, right) {
  for (const value of left) {
    if (right.has(value)) return true;
  }

  return false;
}

function normalizeCandidateIds(dataset, candidateIds = null) {
  if (candidateIds == null) {
    return dataset.species.map(
      species => species.speciesId,
    );
  }

  const normalized = [];
  const seen = new Set();

  for (const speciesId of candidateIds) {
    if (!dataset.speciesById.has(speciesId)) {
      throw new Error(
        `Unknown candidate species_id ${speciesId}`,
      );
    }

    if (seen.has(speciesId)) continue;

    seen.add(speciesId);
    normalized.push(speciesId);
  }

  return normalized;
}

export function diagnosticPowerScore(value) {
  return POWER_SCORE.get(
    value,
  ) ?? 0;
}

export function compatible(
  expectedStatesInput,
  observedStatesInput,
) {
  const expectedStates = toStateSet(expectedStatesInput);
  const observedStates = toStateSet(observedStatesInput);

  if (expectedStates.size === 0) {
    return {
      compatible: true,
      reason: 'expected_unknown',
    };
  }

  if (observedStates.size === 0) {
    return {
      compatible: true,
      reason: 'observed_unknown',
    };
  }

  if (hasUnknownObservationState(observedStates)) {
    return {
      compatible: true,
      reason: 'observed_not_resolved',
    };
  }

  if (intersects(expectedStates, observedStates)) {
    return {
      compatible: true,
      reason: 'state_overlap',
    };
  }

  return {
    compatible: false,
    reason: 'explicit_state_conflict',
  };
}

export function normalizeEvidence(evidence = []) {
  if (Array.isArray(evidence)) {
    return evidence
      .map(item => ({
        characterId:
          item.characterId
          ?? item.character_id,

        observedStates: [
          ...toStateSet(
            item.observedStates
            ?? item.observed_states
            ?? item.states
            ?? item.state,
          ),
        ],

        source:
          item.source
          ?? 'unknown',

        context:
          item.context
          ?? null,
      }))
      .filter(item => item.characterId);
  }

  return Object.entries(evidence)
    .map(([characterId, states]) => ({
      characterId,
      observedStates: [...toStateSet(states)],
      source: 'unknown',
    }));
}

function evidenceByCharacter(normalizedEvidence) {
  const byCharacter = new Map();

  for (const item of normalizedEvidence) {
    if (!byCharacter.has(item.characterId)) {
      byCharacter.set(
        item.characterId,
        new Set(),
      );
    }

    const target =
      byCharacter.get(item.characterId);

    for (const state of item.observedStates) {
      target.add(state);
    }
  }

  return byCharacter;
}

function parseAppliesIf(appliesIf) {
  if (!appliesIf) return null;

  const match = String(appliesIf)
    .trim()
    .match(CONTAINS_APPLIES_IF);

  if (!match) return null;

  return {
    parentCharacterId:
      match[1].toUpperCase(),

    requiredState:
      match[2].trim(),
  };
}

function appliesIfSatisfied(
  character,
  evidenceIndex,
) {
  const rule =
    parseAppliesIf(character.appliesIf);

  if (!rule) return true;

  const parentStates =
    evidenceIndex.get(
      rule.parentCharacterId,
    ) ?? new Set();

  if (
    !parentStates.size
    || hasUnknownObservationState(
      parentStates,
    )
  ) {
    return false;
  }

  return [...parentStates].some(
    state =>
      normalizeToken(state)
      === normalizeToken(
        rule.requiredState,
      ),
  );
}

function isDocumentedVariability(
  dataset,
  speciesId,
  characterId,
  observedStates,
  context,
) {
  if (!context) return false;

  return getVariability(
    dataset,
    speciesId,
    characterId,
  ).some(entry => (
    entry.contextId === context
    && observedStates.has(entry.alternativeState)
  ));
}

export function filterCandidates(
  dataset,
  evidence = [],
  candidateIds = null,
) {
  const normalizedEvidence =
    normalizeEvidence(evidence);

  const startingCandidates =
    normalizeCandidateIds(
      dataset,
      candidateIds,
    );

  const remaining = [];
  const eliminated = [];

  for (const speciesId of startingCandidates) {
    const conflicts = [];

    for (const item of normalizedEvidence) {
      const relation = getRelation(
        dataset,
        speciesId,
        item.characterId,
      );

      const expectedStates =
        relation?.expectedStates ?? [];

      const result = compatible(
        expectedStates,
        item.observedStates,
      );

      if (
        !result.compatible
        && isDocumentedVariability(
          dataset,
          speciesId,
          item.characterId,
          toStateSet(item.observedStates),
          item.context,
        )
      ) {
        continue;
      }

      if (!result.compatible) {
        conflicts.push({
          speciesId,
          characterId: item.characterId,
          expectedStates,
          observedStates: item.observedStates,
          reason: result.reason,
        });
      }
    }

    if (conflicts.length) {
      eliminated.push({
        speciesId,
        conflicts,
      });
    } else {
      remaining.push(speciesId);
    }
  }

  return {
    remaining,
    eliminated,
  };
}

function averageRelationScore(
  dataset,
  candidateIds,
  characterId,
) {
  const relations = candidateIds
    .map(speciesId => (
      getRelation(
        dataset,
        speciesId,
        characterId,
      )
    ))
    .filter(Boolean);

  if (!relations.length) return 0;

  let score = 0;

  for (const relation of relations) {
    score +=
      diagnosticPowerScore(
        relation.diagnosticPower,
      );

    if (
      YES_VALUES.has(
        String(
          relation.imageDetectable,
        ).toLowerCase(),
      )
    ) {
      score += 1;
    }

    if (
      LOW_COST.has(
        String(
          relation.observationCost,
        ).toLowerCase(),
      )
    ) {
      score += 1;
    }

    if (
      SAFE_VALUES.has(
        String(
          relation.interactionSafety,
        ).toLowerCase(),
      )
    ) {
      score += 1;
    }
  }

  return score / relations.length;
}

function partitionCandidateStates(
  dataset,
  candidateIds,
  characterId,
) {
  const groups = new Map();

  for (const speciesId of candidateIds) {
    const relation = getRelation(
      dataset,
      speciesId,
      characterId,
    );

    const states =
      relation?.expectedStates ?? [];

    const key = states.length
      ? states.slice().sort().join('|')
      : '__unknown__';

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(speciesId);
  }

  return groups;
}

function characterScore(
  dataset,
  candidateIds,
  characterId,
) {
  const groups = partitionCandidateStates(
    dataset,
    candidateIds,
    characterId,
  );

  const knownGroups = [
    ...groups.entries(),
  ].filter(
    ([key]) => key !== '__unknown__',
  );

  if (knownGroups.length < 2) {
    return null;
  }

  const largestKnownGroup = Math.max(
    ...knownGroups.map(
      ([, members]) => members.length,
    ),
  );

  const unknownCount =
    groups.get('__unknown__')?.length
    ?? 0;

  return {
    characterId,
    largestKnownGroup,
    unknownCount,
    knownGroupCount:
      knownGroups.length,

    relationScore:
      averageRelationScore(
        dataset,
        candidateIds,
        characterId,
      ),
  };
}

function characterEvidenceStatus(
  dataset,
  evidence,
  characterId,
  candidateIds = null,
) {
  const normalizedEvidence =
    normalizeEvidence(evidence);

  const characterEvidence =
    normalizedEvidence.filter(
      item =>
        item.characterId
        === characterId,
    );

  if (!characterEvidence.length) {
    return 'visible';
  }

  const otherEvidence =
    normalizedEvidence.filter(
      item =>
        item.characterId
        !== characterId,
    );

  const candidatesBefore =
    candidateIds == null
      ? filterCandidates(
        dataset,
        otherEvidence,
      ).remaining
      : normalizeCandidateIds(
        dataset,
        candidateIds,
      );

  const candidatesAfter =
    filterCandidates(
      dataset,
      characterEvidence,
      candidatesBefore,
    ).remaining;

  return (
    candidatesAfter.length
    < candidatesBefore.length
  )
    ? 'resolved'
    : 'attempted';
}

export function nextCharacter(
  dataset,
  evidence = [],
  candidateIds = null,
) {
  const normalizedEvidence =
    normalizeEvidence(evidence);

  const currentCandidateIds =
    candidateIds == null
      ? filterCandidates(
        dataset,
        normalizedEvidence,
      ).remaining
      : normalizeCandidateIds(
        dataset,
        candidateIds,
      );

  const observedCharacterIds =
    new Set(
      normalizedEvidence.map(
        item => item.characterId,
      ),
    );

  const evidenceIndex =
    evidenceByCharacter(
      normalizedEvidence,
    );

  const scores =
    dataset.characters
      .filter(character => (
        !observedCharacterIds.has(
          character.characterId,
        )
      ))
      .map(character => (
        characterScore(
          dataset,
          currentCandidateIds,
          character.characterId,
          evidenceIndex,
        )
      ))
      .filter(Boolean)
      .sort((left, right) => {
        if (
          left.largestKnownGroup
          !== right.largestKnownGroup
        ) {
          return (
            left.largestKnownGroup
            - right.largestKnownGroup
          );
        }

        if (
          left.unknownCount
          !== right.unknownCount
        ) {
          return (
            left.unknownCount
            - right.unknownCount
          );
        }

        if (
          left.knownGroupCount
          !== right.knownGroupCount
        ) {
          return (
            right.knownGroupCount
            - left.knownGroupCount
          );
        }

        if (
          left.relationScore
          !== right.relationScore
        ) {
          return (
            right.relationScore
            - left.relationScore
          );
        }

        return left.characterId
          .localeCompare(
            right.characterId,
          );
      });

  if (!scores.length) {
    return null;
  }

  const best = scores[0];

  const character =
    dataset.charactersById.get(
      best.characterId,
    );

  return {
    ...best,
    character,
    candidates:
      currentCandidateIds,
  };
}

export function retryCharacter(
  dataset,
  evidence = [],
  characterId,
  candidateIds = null,
) {
  if (
    !dataset.charactersById.has(
      characterId,
    )
  ) {
    return null;
  }

  if (
    characterEvidenceStatus(
      dataset,
      evidence,
      characterId,
      candidateIds,
    ) !== 'attempted'
  ) {
    return null;
  }

  const normalizedEvidence =
    normalizeEvidence(evidence);

  const currentCandidateIds =
    candidateIds == null
      ? filterCandidates(
        dataset,
        normalizedEvidence,
      ).remaining
      : normalizeCandidateIds(
        dataset,
        candidateIds,
      );

  const evidenceIndex =
    evidenceByCharacter(
      normalizedEvidence,
    );

  const score =
    characterScore(
      dataset,
      currentCandidateIds,
      characterId,
      evidenceIndex,
    );

  return {
    characterId,
    character:
      dataset.charactersById.get(
        characterId,
      ),
    candidates:
      currentCandidateIds,
    ...(score ?? {}),
  };
}

export function assessIdentification(
  dataset,
  evidence = [],
  candidateIds = null,
) {
  const result =
    filterCandidates(
      dataset,
      evidence,
      candidateIds,
    );

  /*
   * Hito 15 supported contract:
   *
   * A diagnostic dimension is identified by characterId.
   * Repeated observations of the same character therefore
   * count as one evaluated dimension, never as additional
   * independent support.
   */
  const evaluableCharacterIds =
    new Set(
      normalizeEvidence(evidence)
        .filter(item => (
          item.observedStates.length
          && !hasUnknownObservationState(
            toStateSet(
              item.observedStates,
            ),
          )
        ))
        .map(
          item => item.characterId,
        ),
    );

  if (
    result.remaining.length === 0
  ) {
    return {
      status: 'unresolved',
      reason:
        'contradictory_evidence',
      ...result,
    };
  }

  if (
    result.remaining.length > 1
  ) {
    return {
      status: 'ambiguous',
      reason:
        'multiple_candidates',
      ...result,
    };
  }

  if (
    evaluableCharacterIds.size >= 2
  ) {
    return {
      status: 'supported',
      reason:
        'single_candidate_with_multiple_dimensions',
      ...result,
    };
  }

  return {
    status: 'tentative',
    reason:
      'single_candidate_limited_evidence',
    ...result,
  };
}
