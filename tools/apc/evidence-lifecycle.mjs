export const APC_EVIDENCE_STATUSES = Object.freeze(['OBSERVED', 'UNCERTAIN', 'NOT_OBSERVABLE']);
export const APC_LIFECYCLE_STATUSES = Object.freeze(['DRAFT', 'CONFIRMED']);

const STATUS_TO_H16 = Object.freeze({
  OBSERVED: 'observed',
  UNCERTAIN: 'uncertain',
  NOT_OBSERVABLE: 'not_observable',
});
const H16_TO_STATUS = Object.freeze(Object.fromEntries(Object.entries(STATUS_TO_H16).map(([k,v]) => [v,k])));

function text(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

export function normalizeApcEvidenceStatus(status) {
  return STATUS_TO_H16[status] ?? null;
}

export function denormalizeH16Status(status) {
  return H16_TO_STATUS[status] ?? null;
}

export function validateApcEvidenceForHandoff(input) {
  const errors = [];
  if (!text(input?.evidenceId)) errors.push('evidenceId is required');
  if (!Number.isInteger(input?.revision) || input.revision < 1) errors.push('revision must be an integer >= 1');
  if (input?.current !== true) errors.push('current must be true for handoff');
  if (input?.lifecycleStatus !== 'CONFIRMED') errors.push('lifecycleStatus must be CONFIRMED for handoff');
  if (!APC_EVIDENCE_STATUSES.includes(input?.evidenceStatus)) errors.push(`evidenceStatus must be one of: ${APC_EVIDENCE_STATUSES.join(', ')}`);
  if (!text(input?.sourceType) || !text(input?.sourceId)) errors.push('sourceType and sourceId are required');

  const conf = input?.confirmation;
  if (!conf || typeof conf !== 'object') errors.push('confirmation is required for CONFIRMED evidence');
  else {
    if (conf.confirmedByType !== 'human') errors.push('confirmation.confirmedByType must be human in the pilot');
    if (!text(conf.confirmedById)) errors.push('confirmation.confirmedById is required');
    if (!text(conf.confirmedAt)) errors.push('confirmation.confirmedAt is required');
  }

  if (input?.evidenceStatus === 'OBSERVED') {
    if (!text(input?.observedState)) errors.push('observedState is required when evidenceStatus=OBSERVED');
  } else {
    if (text(input?.observedState)) errors.push(`observedState must be empty when evidenceStatus=${input?.evidenceStatus}`);
    if (!text(input?.reason)) errors.push(`reason is required when evidenceStatus=${input?.evidenceStatus}`);
  }

  if (!input?.acquisition || !['manual','prefilled','automatic'].includes(input.acquisition.mode)) errors.push('acquisition.mode must be manual, prefilled or automatic');

  return { valid: errors.length === 0, errors };
}
