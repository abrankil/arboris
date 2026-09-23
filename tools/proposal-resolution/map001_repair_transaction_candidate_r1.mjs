import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

import { logicalSha256 } from './map001_validation_adapter_r1.mjs';
import { reduceMap001RunState } from './map001_run_state_reducer_r1.mjs';
import { verifyMap001ExecutionPins } from './map001_single_iteration_orchestrator_r1.mjs';
import { executeMap001RepairGate } from './map001_repair_gate_r1.mjs';

export class Map001RepairTransactionCandidateError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'Map001RepairTransactionCandidateError';
    this.code = code;
    this.details = details;
  }
}

const RUN_SCHEMA_GATE = 'tools/proposal-resolution/validate_e4_reducer_contracts.py';

function fail(code, message, details = null) {
  throw new Map001RepairTransactionCandidateError(code, message, details);
}

function jsonClone(value, label) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    fail('NON_JSON_INPUT', label + ' must be JSON-serializable', { message: error.message });
  }
}

function runSchemaGate({ run, reportsById, root, pythonExecutable }) {
  const gatePath = path.resolve(root, RUN_SCHEMA_GATE);
  const resolvedRoot = path.resolve(root);
  const rootWithSep = resolvedRoot + path.sep;
  if (!(gatePath === resolvedRoot || gatePath.startsWith(rootWithSep))) {
    fail('RUN_SCHEMA_GATE_PATH_INVALID', 'Run schema gate resolves outside repository root');
  }
  if (!fs.existsSync(gatePath) || !fs.statSync(gatePath).isFile()) {
    fail('RUN_SCHEMA_GATE_MISSING', 'Run schema gate is missing');
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e5-2-'));
  try {
    const runPath = path.join(dir, 'run.json');
    fs.writeFileSync(runPath, JSON.stringify(run, null, 2));

    const args = [gatePath, '--run', runPath];
    let index = 0;
    for (const report of Object.values(reportsById)) {
      index += 1;
      const reportPath = path.join(dir, 'report-' + index + '.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      args.push('--report', reportPath);
    }

    const proc = spawnSync(pythonExecutable, args, {
      cwd: root,
      encoding: 'utf8',
    });

    if (proc.status !== 0) {
      fail('RUN_SCHEMA_GATE_FAILED', 'Run State R5 schema gate failed', {
        status: proc.status,
        stdout: proc.stdout,
        stderr: proc.stderr,
      });
    }

    return JSON.parse(proc.stdout.trim());
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function exactBinding(actual, expected) {
  return isDeepStrictEqual(actual, expected);
}

function mergeCurrentReport(validationReportsById, validationReport) {
  const merged = { ...validationReportsById };
  const existing = merged[validationReport.reportId];
  if (existing && logicalSha256(existing) !== logicalSha256(validationReport)) {
    fail(
      'REPORT_MAP_COLLISION',
      'validationReportsById already contains the same reportId with different content',
      { reportId: validationReport.reportId }
    );
  }
  merged[validationReport.reportId] = validationReport;
  return merged;
}

function assertHistoricalIdIntegrity(run) {
  const proposalIds = run.iterations.map((iteration) => iteration.proposal.proposalId);
  if (new Set(proposalIds).size !== proposalIds.length) {
    fail(
      'RUN_PROPOSAL_IDS_NOT_UNIQUE',
      'existing run history contains duplicate proposalId values'
    );
  }

  const repairIds = run.iterations
    .map((iteration) => iteration.repair?.repairId)
    .filter(Boolean);
  if (new Set(repairIds).size !== repairIds.length) {
    fail(
      'RUN_REPAIR_IDS_NOT_UNIQUE',
      'existing run history contains duplicate repairId values'
    );
  }
}

function assertRunControlBindings({ run, parentProposal, validationReport }) {
  if (!isDeepStrictEqual(run.control.baseline, parentProposal.control.baseline)) {
    fail(
      'RUN_PARENT_BASELINE_MISMATCH',
      'run control baseline does not match current parent proposal baseline'
    );
  }
  if (!isDeepStrictEqual(run.control.validatorBinding, validationReport.control.validatorBinding)) {
    fail(
      'RUN_REPORT_VALIDATOR_MISMATCH',
      'run validator binding does not match current validation report'
    );
  }
}

function assertFreshIds(run, repairId, childProposalId) {
  const proposalIds = new Set(
    run.iterations.map((iteration) => iteration.proposal.proposalId)
  );
  if (proposalIds.has(childProposalId)) {
    fail('CHILD_PROPOSAL_ID_NOT_UNIQUE', 'child proposalId already exists in run history', {
      childProposalId,
    });
  }

  const repairIds = new Set(
    run.iterations
      .map((iteration) => iteration.repair?.repairId)
      .filter(Boolean)
  );
  if (repairIds.has(repairId)) {
    fail('REPAIR_ID_NOT_UNIQUE', 'repairId already exists in run history', { repairId });
  }
}

function assertCurrentMembership({
  run,
  parentProposal,
  validationReport,
}) {
  const latest = run.iterations.at(-1);
  const latestHistory = run.candidateHistory.at(-1);

  if (run.runId !== parentProposal.control.runId) {
    fail('RUN_PARENT_ID_MISMATCH', 'runId does not match parent proposal');
  }
  if (run.runId !== validationReport.control.runId) {
    fail('RUN_REPORT_ID_MISMATCH', 'runId does not match validation report');
  }

  const expectedProposalBinding = {
    proposalId: parentProposal.proposalId,
    sha256: logicalSha256(parentProposal),
  };
  if (!exactBinding(latest.proposal, expectedProposalBinding)) {
    fail(
      'PARENT_NOT_CURRENT_RUN_PROPOSAL',
      'parent proposal does not match the current run-state proposal binding'
    );
  }

  const expectedReportBinding = {
    reportId: validationReport.reportId,
    sha256: logicalSha256(validationReport),
    status: validationReport.status,
  };
  if (!exactBinding(latest.validationReport, expectedReportBinding)) {
    fail(
      'REPORT_NOT_CURRENT_RUN_VALIDATION',
      'validation report does not match the current run-state validation binding'
    );
  }

  if (latest.repair !== null) {
    fail('CURRENT_ITERATION_ALREADY_REPAIRED', 'current run iteration already contains a repair');
  }

  if (latest.iteration !== parentProposal.control.iteration) {
    fail('CURRENT_ITERATION_PARENT_MISMATCH', 'parent iteration does not match current run iteration');
  }

  const parentCandidateSha = logicalSha256(parentProposal.intent.candidate);
  if (
    latestHistory?.iteration !== latest.iteration
    || latestHistory?.candidateSha256 !== parentCandidateSha
  ) {
    fail(
      'CURRENT_CANDIDATE_HISTORY_MISMATCH',
      'current candidateHistory entry does not bind the parent candidate'
    );
  }
}

export function buildMap001RepairTransactionCandidate({
  run,
  parentProposal,
  validationReport,
  repair,
  childProposalId,
  root,
  validationReportsById = {},
  pythonExecutable = 'python',
}) {
  if (typeof root !== 'string' || root.length === 0) {
    fail('ROOT_REQUIRED', 'repository root is required');
  }

  const normalizedRun = jsonClone(run, 'run');
  const normalizedParent = jsonClone(parentProposal, 'parentProposal');
  const normalizedReport = jsonClone(validationReport, 'validationReport');
  const normalizedRepair = jsonClone(repair, 'repair');
  const normalizedReportsById = jsonClone(validationReportsById, 'validationReportsById');
  const reports = mergeCurrentReport(normalizedReportsById, normalizedReport);

  const inputSchemaCheck = runSchemaGate({
    run: normalizedRun,
    reportsById: reports,
    root,
    pythonExecutable,
  });

  assertCurrentMembership({
    run: normalizedRun,
    parentProposal: normalizedParent,
    validationReport: normalizedReport,
  });
  assertRunControlBindings({
    run: normalizedRun,
    parentProposal: normalizedParent,
    validationReport: normalizedReport,
  });
  assertHistoricalIdIntegrity(normalizedRun);
  assertFreshIds(normalizedRun, normalizedRepair.repairId, childProposalId);

  let integrity;
  try {
    integrity = verifyMap001ExecutionPins({ run: normalizedRun, root });
  } catch (error) {
    fail(
      'RUN_EXECUTION_PIN_CHECK_FAILED',
      'run execution provenance check failed',
      { code: error?.code, message: error?.message, details: error?.details }
    );
  }

  const derivedPreState = reduceMap001RunState({
    run: normalizedRun,
    validationReportsById: reports,
    integrity,
  });
  if (derivedPreState.status !== 'READY_TO_REPAIR') {
    fail(
      'RUN_NOT_READY_TO_REPAIR',
      'repair transaction candidate requires derived READY_TO_REPAIR state',
      { derivedState: derivedPreState }
    );
  }
  if (!isDeepStrictEqual(normalizedRun.state, derivedPreState)) {
    fail(
      'RUN_STATE_DERIVATION_MISMATCH',
      'persisted run.state does not equal the state derived from current run history',
      { persistedState: normalizedRun.state, derivedState: derivedPreState }
    );
  }

  const repairResult = executeMap001RepairGate({
    parentProposal: normalizedParent,
    validationReport: normalizedReport,
    repair: normalizedRepair,
    childProposalId,
    root,
    pythonExecutable,
  });

  const proposedRun = structuredClone(normalizedRun);
  const parentIteration = proposedRun.iterations.at(-1);
  parentIteration.repair = {
    repairId: normalizedRepair.repairId,
    sha256: repairResult.repairSha256,
  };

  const childIteration = parentIteration.iteration + 1;
  proposedRun.iterations.push({
    iteration: childIteration,
    proposal: {
      proposalId: repairResult.childProposal.proposalId,
      sha256: logicalSha256(repairResult.childProposal),
    },
    validationReport: null,
    repair: null,
  });
  proposedRun.candidateHistory.push({
    iteration: childIteration,
    candidateSha256: repairResult.childCandidateSha256,
  });
  proposedRun.state = {
    status: 'READY_TO_VALIDATE',
    currentIteration: childIteration,
  };

  const derivedPostState = reduceMap001RunState({
    run: proposedRun,
    validationReportsById: reports,
  });

  if (derivedPostState.status === 'SYSTEM_ERROR') {
    fail(
      'PROPOSED_RUN_INVALID',
      'proposed atomic repair+child snapshot is semantically invalid',
      { derivedState: derivedPostState }
    );
  }

  proposedRun.state = derivedPostState;

  const outputSchemaCheck = runSchemaGate({
    run: proposedRun,
    reportsById: reports,
    root,
    pythonExecutable,
  });

  return {
    transactionStatus: 'CANDIDATE_NOT_PERSISTED',
    persistencePerformed: false,
    inputState: derivedPreState,
    outputState: derivedPostState,
    repairSha256: repairResult.repairSha256,
    childProposal: repairResult.childProposal,
    childProposalSha256: logicalSha256(repairResult.childProposal),
    childCandidateSha256: repairResult.childCandidateSha256,
    proposedRunSnapshot: proposedRun,
    contractChecks: {
      runInput: inputSchemaCheck,
      repairPre: repairResult.contractPrecheck,
      repairPost: repairResult.contractPostcheck,
      runOutput: outputSchemaCheck,
    },
  };
}
