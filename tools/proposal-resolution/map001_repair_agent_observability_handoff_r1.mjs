export const MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_LIMITS_R1 = Object.freeze({
  MAX_REFERENCES: 8,
  MAX_COUNTERS: 8,
  MAX_ID_CHARS: 96,
  MAX_REFERENCE_CHARS: 128,
  MAX_OUTCOME_CHARS: 64,
  MAX_COUNTER_ID_CHARS: 64,
  MAX_ENCODED_BYTES: 2048,
});

const READY = 'READY';
const DROPPED = 'DROPPED';

export const MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1 = Object.freeze({
  DROPPED: 'OBSERVABILITY_HANDOFF_DROPPED',
  BUDGET_EXCEEDED: 'OBSERVABILITY_HANDOFF_BUDGET_EXCEEDED',
  CRITICAL_WINDOW: 'OBSERVABILITY_CRITICAL_WINDOW_VIOLATION',
});

function dropped(code) {
  return Object.freeze({ status: DROPPED, code });
}

function safeString(value, maxChars) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxChars;
}

function sanitizeReferences(value, limits) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (value.length > limits.MAX_REFERENCES) return null;

  const out = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!safeString(item, limits.MAX_REFERENCE_CHARS)) return null;
    out.push(item);
  }
  return out;
}

function sanitizeCounters(value, limits) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (value.length > limits.MAX_COUNTERS) return null;

  const out = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

    const counterId = item.counterId;
    const counterValue = item.value;

    if (!safeString(counterId, limits.MAX_COUNTER_ID_CHARS)) return null;
    if (!Number.isSafeInteger(counterValue) || counterValue < 0) return null;

    out.push(Object.freeze({ counterId, value: counterValue }));
  }
  return out;
}

function freezeHandoff(handoff) {
  Object.freeze(handoff.existingReferenceIdsOrDigests);
  Object.freeze(handoff.optionalFixedSizeCounters);
  return Object.freeze(handoff);
}

export function buildMap001RepairAgentObservabilityHandoffR1(input) {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.DROPPED);
    }

    if (input.criticalWindowActive === true) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.CRITICAL_WINDOW);
    }
    if (
      input.criticalWindowActive !== undefined
      && input.criticalWindowActive !== false
    ) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.DROPPED);
    }

    const limits = MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_LIMITS_R1;

    const authoritativeTransitionId = input.authoritativeTransitionId;
    const eventClassId = input.eventClassId;
    const boundedOutcomeCode = input.boundedOutcomeCode;

    if (!safeString(authoritativeTransitionId, limits.MAX_ID_CHARS)) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.DROPPED);
    }
    if (!safeString(eventClassId, limits.MAX_ID_CHARS)) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.DROPPED);
    }
    if (!safeString(boundedOutcomeCode, limits.MAX_OUTCOME_CHARS)) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.DROPPED);
    }

    const existingReferenceIdsOrDigests = sanitizeReferences(
      input.existingReferenceIdsOrDigests,
      limits
    );
    if (!existingReferenceIdsOrDigests) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.BUDGET_EXCEEDED);
    }

    const optionalFixedSizeCounters = sanitizeCounters(
      input.optionalFixedSizeCounters,
      limits
    );
    if (!optionalFixedSizeCounters) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.BUDGET_EXCEEDED);
    }

    const handoff = freezeHandoff({
      schemaVersion: '0.1',
      authoritativeTransitionId,
      eventClassId,
      existingReferenceIdsOrDigests,
      boundedOutcomeCode,
      optionalFixedSizeCounters,
    });

    const encodedBytes = Buffer.byteLength(JSON.stringify(handoff), 'utf8');
    if (encodedBytes > limits.MAX_ENCODED_BYTES) {
      return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.BUDGET_EXCEEDED);
    }

    return Object.freeze({ status: READY, handoff });
  } catch {
    return dropped(MAP001_REPAIR_AGENT_OBSERVABILITY_HANDOFF_CODES_R1.DROPPED);
  }
}
