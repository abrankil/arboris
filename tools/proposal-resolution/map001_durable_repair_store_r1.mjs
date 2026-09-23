import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

import { logicalSha256 } from './map001_validation_adapter_r1.mjs';
import { reduceMap001RunState } from './map001_run_state_reducer_r1.mjs';
import { verifyMap001ExecutionPins } from './map001_single_iteration_orchestrator_r1.mjs';
import { buildMap001RepairTransactionCandidate } from './map001_repair_transaction_candidate_r1.mjs';

export class Map001DurableStoreError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'Map001DurableStoreError';
    this.code = code;
    this.details = details;
  }
}

export class Map001DurableStoreCrash extends Error {
  constructor(point) {
    super('simulated crash at ' + point);
    this.name = 'Map001DurableStoreCrash';
    this.point = point;
  }
}

const RUN_SCHEMA_GATE = 'tools/proposal-resolution/validate_e4_reducer_contracts.py';
const OPERATIONAL_DEPENDENCY_PATHS = [
  ['E5_1_REPAIR_GATE', 'tools/proposal-resolution/map001_repair_gate_r1.mjs'],
  ['E5_2_TRANSACTION_CANDIDATE', 'tools/proposal-resolution/map001_repair_transaction_candidate_r1.mjs'],
  ['E5_3_DURABLE_STORE', 'tools/proposal-resolution/map001_durable_repair_store_r1.mjs'],
  ['RUN_SCHEMA_GATE', RUN_SCHEMA_GATE],
];

function fail(code, message, details = null) {
  throw new Map001DurableStoreError(code, message, details);
}

function jsonClone(value, label) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    fail('NON_JSON_INPUT', label + ' must be JSON-serializable', { message: error.message });
  }
}

function readJson(filePath, label) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail('READ_FAILED', 'failed to read ' + label, { filePath, message: error.message });
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail('INVALID_JSON', label + ' is not valid JSON', { filePath, message: error.message });
  }
}

function writeJsonFsync(filePath, value, flags = 'w') {
  const fd = fs.openSync(filePath, flags, 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify(value, null, 2) + '\n', 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function fsyncDirectory(dirPath) {
  const fd = fs.openSync(dirPath, fs.constants.O_RDONLY);
  try {
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function ensureSupportedPlatform(platform = process.platform) {
  if (platform !== 'linux') {
    fail(
      'UNSUPPORTED_PLATFORM',
      'E5.3 execution is currently guarded to Linux; durable evidence is limited to the CI-tested Ubuntu/Linux environment and does not certify every Linux filesystem',
      { platform }
    );
  }
}

function rawSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function operationalDependencyBindings(root) {
  return OPERATIONAL_DEPENDENCY_PATHS.map(([dependencyId, relPath]) => {
    const abs = path.resolve(root, relPath);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      fail('OPERATIONAL_DEPENDENCY_MISSING', 'required E5 dependency is missing', {
        dependencyId,
        path: relPath,
      });
    }
    return {
      dependencyId,
      path: relPath,
      sha256: rawSha256(abs),
    };
  });
}

function verifyOperationalDependencies(root, bindings) {
  const expected = OPERATIONAL_DEPENDENCY_PATHS.map(([dependencyId, relPath]) => ({
    dependencyId,
    path: relPath,
  }));
  const observed = bindings.map((item) => ({
    dependencyId: item.dependencyId,
    path: item.path,
  }));
  if (!isDeepStrictEqual(observed, expected)) {
    fail(
      'OPERATIONAL_DEPENDENCY_SET_MISMATCH',
      'E5 operational dependency id/path set changed',
      { expected, observed }
    );
  }
  for (const binding of bindings) {
    const abs = path.resolve(root, binding.path);
    if (!fs.existsSync(abs) || rawSha256(abs) !== binding.sha256) {
      fail('OPERATIONAL_DEPENDENCY_DRIFT', 'E5 operational dependency hash drift', {
        dependencyId: binding.dependencyId,
        path: binding.path,
      });
    }
  }
}

function runSchemaGate({ run, reportsById, root, pythonExecutable }) {
  const gatePath = path.resolve(root, RUN_SCHEMA_GATE);
  if (!fs.existsSync(gatePath) || !fs.statSync(gatePath).isFile()) {
    fail('RUN_SCHEMA_GATE_MISSING', 'Run State R5 schema gate is missing');
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e5-3-'));
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
    const proc = spawnSync(pythonExecutable, args, { cwd: root, encoding: 'utf8' });
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

function validateRun({ run, reportsById, root, pythonExecutable }) {
  const schema = runSchemaGate({ run, reportsById, root, pythonExecutable });
  let integrity;
  try {
    integrity = verifyMap001ExecutionPins({ run, root });
  } catch (error) {
    fail('RUN_EXECUTION_PIN_CHECK_FAILED', 'run execution provenance check failed', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
    });
  }
  const derived = reduceMap001RunState({
    run,
    validationReportsById: reportsById,
    integrity,
  });
  if (derived.status === 'SYSTEM_ERROR') {
    fail('RUN_SEMANTIC_INVALID', 'run reducer derived SYSTEM_ERROR', { derived });
  }
  if (!isDeepStrictEqual(run.state, derived)) {
    fail('RUN_STATE_DERIVATION_MISMATCH', 'persisted run.state differs from reducer output', {
      persisted: run.state,
      derived,
    });
  }
  return { schema, derived };
}

function assertRepairChildDelta(before, after) {
  if (before.runId !== after.runId || !isDeepStrictEqual(before.control, after.control)) {
    fail('RUN_CONTROL_MUTATION', 'E5.3 cannot change run identity or control');
  }
  if (after.iterations.length !== before.iterations.length + 1) {
    fail('REPAIR_CHILD_DELTA_INVALID', 'after snapshot must add exactly one child iteration');
  }
  if (after.candidateHistory.length !== before.candidateHistory.length + 1) {
    fail('REPAIR_CHILD_DELTA_INVALID', 'after snapshot must add exactly one candidateHistory entry');
  }

  const beforePrefix = before.iterations.slice(0, -1);
  const afterPrefix = after.iterations.slice(0, -2);
  if (!isDeepStrictEqual(beforePrefix, afterPrefix)) {
    fail('RUN_HISTORY_MUTATION', 'historical iterations before current parent changed');
  }
  if (!isDeepStrictEqual(before.candidateHistory, after.candidateHistory.slice(0, -1))) {
    fail('CANDIDATE_HISTORY_MUTATION', 'existing candidateHistory changed');
  }

  const parentBefore = before.iterations.at(-1);
  const parentAfter = after.iterations.at(-2);
  if (
    parentBefore.iteration !== parentAfter.iteration
    || !isDeepStrictEqual(parentBefore.proposal, parentAfter.proposal)
    || !isDeepStrictEqual(parentBefore.validationReport, parentAfter.validationReport)
    || parentBefore.repair !== null
    || parentAfter.repair === null
  ) {
    fail('PARENT_REPAIR_DELTA_INVALID', 'parent must change only from repair=null to exact repair binding');
  }

  const child = after.iterations.at(-1);
  if (
    child.iteration !== parentAfter.iteration + 1
    || child.validationReport !== null
    || child.repair !== null
  ) {
    fail('CHILD_ITERATION_INVALID', 'after snapshot must contain immediate unvalidated child');
  }
  const childHistory = after.candidateHistory.at(-1);
  if (childHistory.iteration !== child.iteration) {
    fail('CHILD_HISTORY_INVALID', 'child candidateHistory iteration mismatch');
  }
}

function pathsFor(runPath) {
  return {
    runPath,
    lockPath: runPath + '.lock',
    journalPath: runPath + '.txn.json',
    nextPath: runPath + '.next.json',
    dirPath: path.dirname(runPath),
  };
}

function maybeCrash(crashAt, point) {
  if (crashAt === point) throw new Map001DurableStoreCrash(point);
}

function unlinkIfExists(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function validateBindingShape(binding, label) {
  if (!binding || binding.schemaVersion !== '0.1') {
    fail(
      'RECOVERY_METADATA_VERSION_UNSUPPORTED',
      label + ' schemaVersion must equal 0.1',
      { observedSchemaVersion: binding?.schemaVersion ?? null }
    );
  }
  if (
    typeof binding.transactionId !== 'string'
    || binding.transactionId.length === 0
    || typeof binding.runId !== 'string'
    || binding.runId.length === 0
    || !/^[0-9a-f]{64}$/.test(binding.beforeSha256 ?? '')
    || !/^[0-9a-f]{64}$/.test(binding.afterSha256 ?? '')
  ) {
    fail('RECOVERY_BINDING_INVALID', label + ' binding is invalid');
  }
}

function assertRecoveryRunId(binding, run, label) {
  if (binding.runId !== run?.runId) {
    fail(
      'RECOVERY_RUN_ID_MISMATCH',
      label + ' runId does not match durable run',
      {
        bindingRunId: binding.runId,
        visibleRunId: run?.runId ?? null,
      }
    );
  }
}

function coreBinding(value) {
  return {
    transactionId: value.transactionId,
    runId: value.runId,
    beforeSha256: value.beforeSha256,
    afterSha256: value.afterSha256,
  };
}

function cleanupTransactionFiles(paths, { journal = true, next = true, lock = true } = {}) {
  if (journal) unlinkIfExists(paths.journalPath);
  if (next) unlinkIfExists(paths.nextPath);
  if (lock) unlinkIfExists(paths.lockPath);
  fsyncDirectory(paths.dirPath);
}

export function commitMap001RepairSnapshot({
  runPath,
  expectedBeforeSha256,
  parentProposal,
  validationReport,
  repair,
  childProposalId,
  validationReportsById = {},
  root,
  transactionId,
  pythonExecutable = 'python',
  crashAt = null,
  platform = process.platform,
  now = () => new Date().toISOString(),
}) {
  ensureSupportedPlatform(platform);
  if (typeof runPath !== 'string' || !path.isAbsolute(runPath)) {
    fail('RUN_PATH_REQUIRED', 'runPath must be absolute');
  }
  if (typeof root !== 'string' || root.length === 0) fail('ROOT_REQUIRED', 'repository root required');
  if (typeof transactionId !== 'string' || transactionId.length === 0) {
    fail('TRANSACTION_ID_REQUIRED', 'transactionId is required');
  }

  const normalizedParent = jsonClone(parentProposal, 'parentProposal');
  const normalizedReport = jsonClone(validationReport, 'validationReport');
  const normalizedRepair = jsonClone(repair, 'repair');
  const reports = jsonClone(validationReportsById, 'validationReportsById');
  const paths = pathsFor(runPath);
  fs.mkdirSync(paths.dirPath, { recursive: true });

  if (fs.existsSync(paths.lockPath)) {
    fail('CONCURRENT_WRITER', 'writer lock already exists');
  }
  if (fs.existsSync(paths.journalPath) || fs.existsSync(paths.nextPath)) {
    fail('RECOVERY_REQUIRED', 'transaction metadata exists; recover before commit');
  }

  const prelockRun = readJson(paths.runPath, 'durable run');
  const prelockBeforeSha256 = logicalSha256(prelockRun);
  if (prelockBeforeSha256 !== expectedBeforeSha256) {
    fail('CAS_MISMATCH', 'durable run no longer matches expected before hash', {
      expectedBeforeSha256,
      observedBeforeSha256: prelockBeforeSha256,
    });
  }

  let prelockCandidate;
  try {
    prelockCandidate = buildMap001RepairTransactionCandidate({
      run: prelockRun,
      parentProposal: normalizedParent,
      validationReport: normalizedReport,
      repair: normalizedRepair,
      childProposalId,
      root,
      validationReportsById: reports,
      pythonExecutable,
    });
  } catch (error) {
    fail('E5_2_REVALIDATION_FAILED', 'fresh E5.2 reconstruction failed before lock', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
    });
  }
  if (
    prelockCandidate.transactionStatus !== 'CANDIDATE_NOT_PERSISTED'
    || prelockCandidate.persistencePerformed !== false
    || prelockCandidate.inputState?.status !== 'READY_TO_REPAIR'
  ) {
    fail('E5_2_CANDIDATE_CONTRACT_INVALID', 'E5.2 candidate contract flags are invalid');
  }

  const proposedPrelock = prelockCandidate.proposedRunSnapshot;
  const afterSha256 = logicalSha256(proposedPrelock);
  if (afterSha256 === prelockBeforeSha256) {
    fail('NO_OP_TRANSACTION', 'E5.2 proposed snapshot must differ from durable before snapshot');
  }

  const dependencies = operationalDependencyBindings(root);
  const lock = {
    schemaVersion: '0.1',
    transactionId,
    runId: prelockRun.runId,
    beforeSha256: expectedBeforeSha256,
    afterSha256,
    operationalDependencies: dependencies,
  };

  let lockCreated = false;
  let journalPrepared = false;
  try {
    try {
      writeJsonFsync(paths.lockPath, lock, 'wx');
      lockCreated = true;
      fsyncDirectory(paths.dirPath);
    } catch (error) {
      if (error.code === 'EEXIST') {
        fail('CONCURRENT_WRITER', 'writer lock already exists');
      }
      throw error;
    }

    maybeCrash(crashAt, 'C1');

    const before = readJson(paths.runPath, 'durable run');
    const beforeSha256 = logicalSha256(before);
    if (beforeSha256 !== expectedBeforeSha256) {
      fail('CAS_MISMATCH', 'durable run changed after lock acquisition', {
        expectedBeforeSha256,
        observedBeforeSha256: beforeSha256,
      });
    }

    let transactionCandidate;
    try {
      transactionCandidate = buildMap001RepairTransactionCandidate({
        run: before,
        parentProposal: normalizedParent,
        validationReport: normalizedReport,
        repair: normalizedRepair,
        childProposalId,
        root,
        validationReportsById: reports,
        pythonExecutable,
      });
    } catch (error) {
      fail('E5_2_REVALIDATION_FAILED', 'fresh E5.2 reconstruction failed under lock', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
      });
    }

    if (
      transactionCandidate.transactionStatus !== 'CANDIDATE_NOT_PERSISTED'
      || transactionCandidate.persistencePerformed !== false
      || transactionCandidate.inputState?.status !== 'READY_TO_REPAIR'
    ) {
      fail('E5_2_CANDIDATE_CONTRACT_INVALID', 'E5.2 candidate contract flags are invalid');
    }

    const proposed = transactionCandidate.proposedRunSnapshot;
    if (logicalSha256(proposed) !== afterSha256) {
      fail('E5_2_CANDIDATE_CHANGED_AFTER_LOCK', 'E5.2 reconstructed candidate changed after lock');
    }

    const beforeValidation = validateRun({
      run: before,
      reportsById: reports,
      root,
      pythonExecutable,
    });
    if (beforeValidation.derived.status !== 'READY_TO_REPAIR') {
      fail('RUN_NOT_READY_TO_REPAIR', 'durable before state must be READY_TO_REPAIR', {
        state: beforeValidation.derived,
      });
    }

    assertRepairChildDelta(before, proposed);
    const afterValidation = validateRun({
      run: proposed,
      reportsById: reports,
      root,
      pythonExecutable,
    });
    verifyOperationalDependencies(root, dependencies);

    const journal = {
      schemaVersion: '0.1',
      phase: 'PREPARED',
      transactionId,
      runId: before.runId,
      beforeSha256,
      afterSha256,
      runPath: paths.runPath,
      nextPath: paths.nextPath,
      createdAt: now(),
      operationalDependencies: dependencies,
    };
    writeJsonFsync(paths.journalPath, journal, 'wx');
    journalPrepared = true;
    fsyncDirectory(paths.dirPath);
    maybeCrash(crashAt, 'C2');

    writeJsonFsync(paths.nextPath, proposed, 'wx');
    fsyncDirectory(paths.dirPath);
    maybeCrash(crashAt, 'C3');
    maybeCrash(crashAt, 'C4');

    fs.renameSync(paths.nextPath, paths.runPath);
    fsyncDirectory(paths.dirPath);
    maybeCrash(crashAt, 'C5');

    const visible = readJson(paths.runPath, 'durable after run');
    if (logicalSha256(visible) !== afterSha256) {
      fail('POST_COMMIT_HASH_MISMATCH', 'visible durable run does not equal proposed after hash');
    }
    validateRun({ run: visible, reportsById: reports, root, pythonExecutable });
    maybeCrash(crashAt, 'C6');

    unlinkIfExists(paths.journalPath);
    maybeCrash(crashAt, 'C7');
    unlinkIfExists(paths.nextPath);
    fsyncDirectory(paths.dirPath);
    maybeCrash(crashAt, 'C8');

    unlinkIfExists(paths.lockPath);
    fsyncDirectory(paths.dirPath);

    return {
      transactionStatus: 'PERSISTED',
      persistencePerformed: true,
      transactionId,
      beforeSha256,
      afterSha256,
      outputState: afterValidation.derived,
      operationalDependencies: dependencies,
      e5_2: {
        transactionStatus: transactionCandidate.transactionStatus,
        persistencePerformed: transactionCandidate.persistencePerformed,
        childProposalSha256: transactionCandidate.childProposalSha256,
        repairSha256: transactionCandidate.repairSha256,
      },
    };
  } catch (error) {
    if (error instanceof Map001DurableStoreCrash) throw error;
    if (lockCreated && !journalPrepared) {
      unlinkIfExists(paths.lockPath);
      fsyncDirectory(paths.dirPath);
    }
    throw error;
  }
}

export function recoverMap001RepairStore({
  runPath,
  validationReportsById = {},
  root,
  pythonExecutable = 'python',
  platform = process.platform,
}) {
  ensureSupportedPlatform(platform);
  const paths = pathsFor(runPath);
  const reports = jsonClone(validationReportsById, 'validationReportsById');

  const hasLock = fs.existsSync(paths.lockPath);
  const hasJournal = fs.existsSync(paths.journalPath);
  const hasNext = fs.existsSync(paths.nextPath);

  if (!hasLock) {
    if (hasJournal || hasNext) {
      fail('RECOVERY_ORPHAN_METADATA', 'journal/next exists without writer lock');
    }
    const visible = readJson(paths.runPath, 'durable run');
    validateRun({ run: visible, reportsById: reports, root, pythonExecutable });
    return { recoveryStatus: 'NORMAL', visibleSha256: logicalSha256(visible) };
  }

  const lock = readJson(paths.lockPath, 'lock');
  validateBindingShape(lock, 'lock');
  verifyOperationalDependencies(root, lock.operationalDependencies ?? []);

  const visible = readJson(paths.runPath, 'durable run');
  assertRecoveryRunId(lock, visible, 'lock');
  const visibleSha256 = logicalSha256(visible);
  const visibleClass = visibleSha256 === lock.beforeSha256
    ? 'before'
    : visibleSha256 === lock.afterSha256
      ? 'after'
      : 'other';

  if (!hasJournal) {
    if (hasNext) fail('RECOVERY_ORPHAN_NEXT', 'next exists without journal');
    if (visibleClass === 'other') {
      fail('RECOVERY_DIVERGENCE', 'visible hash matches neither lock before nor after');
    }
    validateRun({ run: visible, reportsById: reports, root, pythonExecutable });
    cleanupTransactionFiles(paths, { journal: false, next: false, lock: true });
    return {
      recoveryStatus: visibleClass === 'before' ? 'RECOVERED_BEFORE' : 'RECOVERED_AFTER',
      visibleSha256,
    };
  }

  const journal = readJson(paths.journalPath, 'journal');
  validateBindingShape(journal, 'journal');
  assertRecoveryRunId(journal, visible, 'journal');
  if (
    journal.phase !== 'PREPARED'
    || !isDeepStrictEqual(coreBinding(lock), coreBinding(journal))
    || journal.runPath !== paths.runPath
    || journal.nextPath !== paths.nextPath
  ) {
    fail('RECOVERY_BINDING_MISMATCH', 'lock and journal bindings do not match');
  }
  verifyOperationalDependencies(root, journal.operationalDependencies ?? []);

  let next = null;
  if (hasNext) {
    next = readJson(paths.nextPath, 'next snapshot');
    assertRecoveryRunId(journal, next, 'next snapshot');
    if (logicalSha256(next) !== journal.afterSha256) {
      fail('RECOVERY_NEXT_HASH_MISMATCH', 'next snapshot does not match journal after hash');
    }
    validateRun({ run: next, reportsById: reports, root, pythonExecutable });
  }

  if (visibleClass === 'other') {
    fail('RECOVERY_DIVERGENCE', 'visible hash matches neither journal before nor after');
  }

  if (visibleClass === 'before' && !hasNext) {
    validateRun({ run: visible, reportsById: reports, root, pythonExecutable });
    cleanupTransactionFiles(paths, { journal: true, next: false, lock: true });
    return { recoveryStatus: 'RECOVERED_BEFORE', visibleSha256 };
  }

  if (visibleClass === 'before' && hasNext) {
    fs.renameSync(paths.nextPath, paths.runPath);
    fsyncDirectory(paths.dirPath);
    const after = readJson(paths.runPath, 'recovered after run');
    assertRecoveryRunId(journal, after, 'recovered after run');
    if (logicalSha256(after) !== journal.afterSha256) {
      fail('RECOVERY_POST_REPLACE_HASH_MISMATCH', 'recovered visible run hash mismatch');
    }
    validateRun({ run: after, reportsById: reports, root, pythonExecutable });
    cleanupTransactionFiles(paths, { journal: true, next: false, lock: true });
    return { recoveryStatus: 'RECOVERED_AFTER', visibleSha256: journal.afterSha256 };
  }

  validateRun({ run: visible, reportsById: reports, root, pythonExecutable });
  cleanupTransactionFiles(paths, { journal: true, next: hasNext, lock: true });
  return { recoveryStatus: 'RECOVERED_AFTER', visibleSha256 };
}
