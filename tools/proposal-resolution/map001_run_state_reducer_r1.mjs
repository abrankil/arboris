import crypto from 'node:crypto';

import { logicalSha256 } from './map001_validation_adapter_r1.mjs';

export class Map001RunStateReducerError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'Map001RunStateReducerError';
    this.code = code;
    this.details = details;
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

function systemError(code, message, component = 'CONTRACT_RUN_STATE') {
  return {
    status: 'SYSTEM_ERROR',
    evidence: {
      kind: 'SYSTEM_ERROR',
      code,
      message,
      component,
    },
  };
}

function withIteration(state, currentIteration) {
  return { ...state, currentIteration };
}

function normalizeExternalSystemError(value, currentIteration) {
  if (!value) return null;
  return {
    status: 'SYSTEM_ERROR',
    currentIteration,
    evidence: {
      kind: 'SYSTEM_ERROR',
      code: value.code ?? 'EXTERNAL_SYSTEM_ERROR',
      message: value.message ?? 'External system integrity check failed.',
      ...(value.component ? { component: value.component } : {}),
      ...(value.expectedSha256 ? { expectedSha256: value.expectedSha256 } : {}),
      ...(value.observedSha256 ? { observedSha256: value.observedSha256 } : {}),
    },
  };
}

function normalizeAuthorityChanged(value, currentIteration) {
  if (!value) return null;
  return {
    status: 'AUTHORITY_CHANGED',
    currentIteration,
    evidence: {
      kind: 'AUTHORITY_CHANGED',
      component: value.component,
      expectedSha256: value.expectedSha256,
      observedSha256: value.observedSha256,
    },
  };
}

export function findingSignature(finding) {
  return stableJson({
    disposition: finding.disposition,
    code: finding.code,
    targetPaths: [...(finding.targetPaths ?? [])].sort(),
  });
}

export function findingSetFingerprint(report) {
  const signatures = (report?.findings ?? []).map(findingSignature).sort();
  return crypto.createHash('sha256').update(JSON.stringify(signatures)).digest('hex');
}

function reportSignatureSet(report) {
  return new Set((report?.findings ?? []).map(findingSignature));
}

function introducesRegression(previousReport, currentReport) {
  const previous = reportSignatureSet(previousReport);
  return [...reportSignatureSet(currentReport)].some((signature) => !previous.has(signature));
}

function validateRunHistory(run, validationReportsById) {
  const iterations = run?.iterations;
  const history = run?.candidateHistory;

  if (!Array.isArray(iterations) || iterations.length === 0) {
    return systemError('RUN_HISTORY_INVALID', 'run.iterations must contain at least one iteration.');
  }
  if (!Array.isArray(history) || history.length !== iterations.length) {
    return systemError(
      'CANDIDATE_HISTORY_INVALID',
      'candidateHistory must contain exactly one entry per committed proposal iteration.'
    );
  }

  for (let index = 0; index < iterations.length; index += 1) {
    const expectedIteration = index + 1;
    const iteration = iterations[index];
    const historyEntry = history[index];

    if (iteration.iteration !== expectedIteration) {
      return systemError(
        'RUN_HISTORY_INVALID',
        `iterations must be contiguous from 1; expected ${expectedIteration}, observed ${iteration.iteration}.`
      );
    }
    if (historyEntry?.iteration !== iteration.iteration) {
      return systemError(
        'CANDIDATE_HISTORY_INVALID',
        `candidateHistory entry ${index + 1} does not match iteration ${iteration.iteration}.`
      );
    }
    if (!/^[0-9a-f]{64}$/.test(historyEntry?.candidateSha256 ?? '')) {
      return systemError(
        'CANDIDATE_HISTORY_INVALID',
        `candidateHistory iteration ${iteration.iteration} has an invalid candidateSha256.`
      );
    }

    if (iteration.repair !== null) {
      if (iteration.validationReport?.status !== 'REJECT_FIXABLE') {
        return systemError(
          'REPAIR_BASIS_INVALID',
          `iteration ${iteration.iteration} has a repair without REJECT_FIXABLE validation.`,
          'CONTRACT_REPAIR'
        );
      }
      if (index === iterations.length - 1) {
        return systemError(
          'REPAIR_CHILD_ATOMICITY_VIOLATION',
          `iteration ${iteration.iteration} persists a repair without an immediate child proposal.`,
          'CONTRACT_RUN_STATE'
        );
      }
      if (iterations[index + 1].iteration !== iteration.iteration + 1) {
        return systemError(
          'REPAIR_CHILD_ATOMICITY_VIOLATION',
          `repair at iteration ${iteration.iteration} is not followed by the immediate child iteration.`,
          'CONTRACT_RUN_STATE'
        );
      }
    }

    const binding = iteration.validationReport;
    if (binding !== null) {
      const report = validationReportsById[binding.reportId];
      if (!report) {
        return systemError(
          'VALIDATION_REPORT_MISSING',
          `validation report ${binding.reportId} is required by run history but was not supplied.`,
          'CONTRACT_VALIDATION_REPORT'
        );
      }
      if (report.reportId !== binding.reportId || report.status !== binding.status) {
        return systemError(
          'VALIDATION_REPORT_BINDING_MISMATCH',
          `validation report ${binding.reportId} does not match its run-state binding.`,
          'CONTRACT_VALIDATION_REPORT'
        );
      }
      if (logicalSha256(report) !== binding.sha256) {
        return systemError(
          'VALIDATION_REPORT_HASH_MISMATCH',
          `validation report ${binding.reportId} logical hash does not match its run-state binding.`,
          'CONTRACT_VALIDATION_REPORT'
        );
      }
    }
  }

  const currentIteration = run?.state?.currentIteration;
  const latestIteration = iterations.at(-1).iteration;
  if (currentIteration !== latestIteration) {
    return systemError(
      'CURRENT_ITERATION_MISMATCH',
      `run.state.currentIteration must equal latest committed iteration ${latestIteration}.`
    );
  }

  return null;
}

function detectCycle(candidateHistory) {
  const latest = candidateHistory.at(-1);
  const firstMatch = candidateHistory
    .slice(0, -1)
    .find((entry) => entry.candidateSha256 === latest.candidateSha256);

  if (!firstMatch) return null;
  return {
    repeatedCandidateSha256: latest.candidateSha256,
    firstSeenIteration: firstMatch.iteration,
  };
}

function reportForBinding(binding, validationReportsById) {
  if (!binding) return null;
  return validationReportsById[binding.reportId] ?? null;
}

function previousRepairBasis(iterations, validationReportsById) {
  if (iterations.length < 2) return null;
  const previous = iterations.at(-2);
  if (previous.repair === null) return null;
  if (previous.validationReport?.status !== 'REJECT_FIXABLE') return null;
  return reportForBinding(previous.validationReport, validationReportsById);
}

function consecutiveSameFingerprintCount(iterations, validationReportsById, fingerprint) {
  let count = 0;
  for (let index = iterations.length - 1; index >= 0; index -= 1) {
    const binding = iterations[index].validationReport;
    if (!binding || binding.status !== 'REJECT_FIXABLE') break;
    const report = reportForBinding(binding, validationReportsById);
    if (!report || findingSetFingerprint(report) !== fingerprint) break;
    count += 1;
  }
  return count;
}

export function reduceMap001RunState({
  run,
  validationReportsById = {},
  integrity = {},
}) {
  const iterations = run?.iterations ?? [];
  const currentIteration = run?.state?.currentIteration ?? iterations.at(-1)?.iteration ?? 1;

  const externalSystem = normalizeExternalSystemError(integrity.systemError, currentIteration);
  if (externalSystem) return externalSystem;

  const structuralError = validateRunHistory(run, validationReportsById);
  if (structuralError) return withIteration(structuralError, currentIteration);

  const authorityChanged = normalizeAuthorityChanged(integrity.authorityChanged, currentIteration);
  if (authorityChanged) return authorityChanged;

  const cycle = detectCycle(run.candidateHistory);
  if (cycle) {
    return {
      status: 'CYCLE_DETECTED',
      currentIteration,
      evidence: {
        kind: 'CYCLE_DETECTED',
        ...cycle,
      },
    };
  }

  const latestIteration = iterations.at(-1);
  const latestBinding = latestIteration.validationReport;

  if (latestBinding === null) {
    return { status: 'READY_TO_VALIDATE', currentIteration };
  }

  if (latestBinding.status === 'AUTHORITY_BLOCKER') {
    return { status: 'AUTHORITY_BLOCKED', currentIteration };
  }
  if (latestBinding.status === 'OPEN_BLOCKER') {
    return { status: 'OPEN_BLOCKED', currentIteration };
  }
  if (latestBinding.status === 'PASS') {
    return { status: 'DOMAIN_PASS', currentIteration };
  }
  if (latestBinding.status !== 'REJECT_FIXABLE') {
    return withIteration(
      systemError(
        'VALIDATION_STATUS_UNSUPPORTED',
        `Unsupported validation status: ${latestBinding.status}.`,
        'CONTRACT_VALIDATION_REPORT'
      ),
      currentIteration
    );
  }

  const currentReport = reportForBinding(latestBinding, validationReportsById);
  const repairBasis = previousRepairBasis(iterations, validationReportsById);
  if (repairBasis && introducesRegression(repairBasis, currentReport)) {
    return {
      status: 'REGRESSION',
      currentIteration,
      evidence: {
        kind: 'REGRESSION',
        previousValidation: {
          id: repairBasis.reportId,
          sha256: logicalSha256(repairBasis),
        },
        currentValidation: {
          id: currentReport.reportId,
          sha256: logicalSha256(currentReport),
        },
      },
    };
  }

  const fingerprint = findingSetFingerprint(currentReport);
  const repeatCount = consecutiveSameFingerprintCount(iterations, validationReportsById, fingerprint);
  if (repeatCount >= run.control.policy.stallRepeatThreshold) {
    return {
      status: 'STALLED',
      currentIteration,
      evidence: {
        kind: 'STALLED',
        findingSetFingerprint: fingerprint,
        repeatCount,
      },
    };
  }

  if (currentIteration >= run.control.policy.maxIterations) {
    return {
      status: 'MAX_ITERATIONS',
      currentIteration,
      evidence: {
        kind: 'MAX_ITERATIONS',
        limit: run.control.policy.maxIterations,
      },
    };
  }

  return { status: 'READY_TO_REPAIR', currentIteration };
}
