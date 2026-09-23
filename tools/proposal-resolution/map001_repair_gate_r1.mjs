import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

import { logicalSha256 } from './map001_validation_adapter_r1.mjs';

const CONTRACT_GATE = 'tools/proposal-resolution/validate_e5_repair_contracts.py';

function runContractGate({
  phase,
  parentProposal,
  validationReport,
  repair,
  result = null,
  root,
  pythonExecutable,
}) {
  const gatePath = path.resolve(root, CONTRACT_GATE);
  const resolvedRoot = path.resolve(root);
  const rootWithSep = resolvedRoot + path.sep;
  if (!(gatePath === resolvedRoot || gatePath.startsWith(rootWithSep))) {
    fail('CONTRACT_GATE_PATH_INVALID', 'E5.1 contract gate resolves outside repository root');
  }
  if (!fs.existsSync(gatePath) || !fs.statSync(gatePath).isFile()) {
    fail('CONTRACT_GATE_MISSING', 'E5.1 contract gate is missing');
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e5-1-'));
  try {
    const parentPath = path.join(dir, 'parent.json');
    const reportPath = path.join(dir, 'report.json');
    const repairPath = path.join(dir, 'repair.json');
    fs.writeFileSync(parentPath, JSON.stringify(parentProposal, null, 2));
    fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));
    fs.writeFileSync(repairPath, JSON.stringify(repair, null, 2));

    const args = [
      gatePath,
      '--phase', phase,
      '--parent', parentPath,
      '--report', reportPath,
      '--repair', repairPath,
      '--parent-sha', logicalSha256(parentProposal),
      '--report-sha', logicalSha256(validationReport),
    ];

    if (phase === 'post') {
      const childPath = path.join(dir, 'child.json');
      fs.writeFileSync(childPath, JSON.stringify(result.childProposal, null, 2));
      args.push(
        '--child', childPath,
        '--repair-sha', result.repairSha256,
        '--parent-candidate-sha', result.parentCandidateSha256
      );
    }

    const proc = spawnSync(pythonExecutable, args, {
      cwd: root,
      encoding: 'utf8',
    });

    if (proc.status !== 0) {
      fail(
        phase === 'pre' ? 'REPAIR_CONTRACT_PRECONDITION_FAILED' : 'REPAIR_CONTRACT_POSTCONDITION_FAILED',
        'E5.1 ' + phase + ' contract gate failed',
        { status: proc.status, stdout: proc.stdout, stderr: proc.stderr }
      );
    }

    return JSON.parse(proc.stdout.trim());
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export class Map001RepairGateError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'Map001RepairGateError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = null) {
  throw new Map001RepairGateError(code, message, details);
}

function decodePointer(pointer) {
  if (typeof pointer !== 'string' || !pointer.startsWith('/') || pointer === '/') {
    fail('POINTER_INVALID', 'repair targetPath must be a non-root JSON Pointer');
  }
  const rawTokens = pointer.slice(1).split('/');
  return rawTokens.map((raw) => {
    for (let i = 0; i < raw.length; i += 1) {
      if (raw[i] === '~') {
        const next = raw[i + 1];
        if (next !== '0' && next !== '1') {
          fail('POINTER_ESCAPE_INVALID', 'JSON Pointer contains an invalid ~ escape', { pointer });
        }
        i += 1;
      }
    }
    return raw.replaceAll('~1', '/').replaceAll('~0', '~');
  });
}

function strictArrayIndex(token, { allowAppend = false } = {}) {
  if (allowAppend && token === '-') return { append: true, index: null };
  if (!/^(0|[1-9][0-9]*)$/.test(token)) {
    fail('ARRAY_INDEX_INVALID', 'Array index must be 0 or a non-zero digit sequence without leading zeros', { token });
  }
  return { append: false, index: Number(token) };
}

function parentAndKey(doc, pointer) {
  const tokens = decodePointer(pointer);
  let current = doc;

  for (const token of tokens.slice(0, -1)) {
    if (Array.isArray(current)) {
      const { index } = strictArrayIndex(token);
      if (index >= current.length) {
        fail('POINTER_PARENT_MISSING', 'Array parent does not exist', { pointer, token });
      }
      current = current[index];
    } else if (current && typeof current === 'object') {
      if (!Object.hasOwn(current, token)) {
        fail('POINTER_PARENT_MISSING', 'Object parent does not exist', { pointer, token });
      }
      current = current[token];
    } else {
      fail('POINTER_PARENT_SCALAR', 'Cannot traverse through scalar parent', { pointer, token });
    }
  }

  return { parent: current, key: tokens.at(-1) };
}

function deepEqual(a, b) {
  return isDeepStrictEqual(a, b);
}

function pointerWithin(pointer, scope) {
  return pointer === scope || pointer.startsWith(scope + '/');
}

function validateOperationIdentity(operations) {
  const editIds = operations.map((op) => op.editId);
  if (new Set(editIds).size !== editIds.length) {
    fail('DUPLICATE_EDIT_ID', 'Repair editId values must be unique');
  }
}

function validateNonOverlappingTargets(operations) {
  const targets = operations.map((op) => op.targetPath);
  if (new Set(targets).size !== targets.length) {
    fail('DUPLICATE_REPAIR_TARGET', 'Repair operations cannot target the same path twice');
  }
  const sorted = [...targets].sort((a, b) => a.length - b.length || a.localeCompare(b));
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      if (pointerWithin(sorted[j], sorted[i])) {
        fail('OVERLAPPING_REPAIR_TARGETS', 'Repair operations cannot target overlapping paths', {
          ancestor: sorted[i],
          descendant: sorted[j],
        });
      }
    }
  }
}

function findingMap(report) {
  const findings = report.findings ?? [];
  const ids = findings.map((finding) => finding.findingId);
  if (new Set(ids).size !== ids.length) {
    fail('DUPLICATE_FINDING_ID', 'Validation report findingId values must be unique');
  }
  return new Map(findings.map((finding) => [finding.findingId, finding]));
}

function validateOperationAuthorization(operation, findingsById) {
  if (!Array.isArray(operation.findingRefs) || operation.findingRefs.length === 0) {
    fail('FINDING_REFS_REQUIRED', 'Every repair operation must cite at least one finding');
  }

  for (const findingId of operation.findingRefs) {
    const finding = findingsById.get(findingId);
    if (!finding) {
      fail('FINDING_REF_UNKNOWN', 'Repair cites a finding absent from the validation report', { findingId });
    }
    if (finding.disposition !== 'AUTO_REPAIR') {
      fail('FINDING_NOT_AUTO_REPAIR', 'Repair may cite only AUTO_REPAIR findings', { findingId });
    }
    const withinThisFinding = (finding.targetPaths ?? [])
      .some((scope) => pointerWithin(operation.targetPath, scope));
    if (!withinThisFinding) {
      fail(
        'REPAIR_TARGET_OUTSIDE_FINDING_SCOPE',
        'Repair target must be within the declared scope of every cited finding',
        { targetPath: operation.targetPath, findingId }
      );
    }
  }
}

function applyOperation(candidate, operation) {
  const { parent, key } = parentAndKey(candidate, operation.targetPath);

  if (operation.operation === 'add') {
    if (Array.isArray(parent)) {
      const { append, index } = strictArrayIndex(key, { allowAppend: true });
      const targetIndex = append ? parent.length : index;
      if (targetIndex !== parent.length) {
        fail('ARRAY_ADD_INDEX_INVALID', 'Array add is permitted only at index == length or /-', {
          targetPath: operation.targetPath,
          length: parent.length,
        });
      }
      parent.push(structuredClone(operation.after));
      return;
    }
    if (!parent || typeof parent !== 'object') {
      fail('ADD_PARENT_INVALID', 'add parent must be an object or array');
    }
    if (Object.hasOwn(parent, key)) {
      fail('ADD_TARGET_EXISTS', 'add target already exists', { targetPath: operation.targetPath });
    }
    parent[key] = structuredClone(operation.after);
    return;
  }

  if (operation.operation === 'remove' || operation.operation === 'replace') {
    let observed;
    if (Array.isArray(parent)) {
      const { index } = strictArrayIndex(key);
      if (index >= parent.length) {
        fail('TARGET_MISSING', 'repair target does not exist', { targetPath: operation.targetPath });
      }
      observed = parent[index];
      if (!deepEqual(observed, operation.expectedBefore)) {
        fail('EXPECTED_BEFORE_MISMATCH', 'repair expectedBefore does not match current candidate', {
          targetPath: operation.targetPath,
        });
      }
      if (operation.operation === 'remove') {
        parent.splice(index, 1);
      } else {
        if (deepEqual(operation.expectedBefore, operation.after)) {
          fail('REPLACE_NOOP', 'replace after must differ from expectedBefore', { targetPath: operation.targetPath });
        }
        parent[index] = structuredClone(operation.after);
      }
      return;
    }

    if (!parent || typeof parent !== 'object' || !Object.hasOwn(parent, key)) {
      fail('TARGET_MISSING', 'repair target does not exist', { targetPath: operation.targetPath });
    }
    observed = parent[key];
    if (!deepEqual(observed, operation.expectedBefore)) {
      fail('EXPECTED_BEFORE_MISMATCH', 'repair expectedBefore does not match current candidate', {
        targetPath: operation.targetPath,
      });
    }
    if (operation.operation === 'remove') {
      delete parent[key];
    } else {
      if (deepEqual(operation.expectedBefore, operation.after)) {
        fail('REPLACE_NOOP', 'replace after must differ from expectedBefore', { targetPath: operation.targetPath });
      }
      parent[key] = structuredClone(operation.after);
    }
    return;
  }

  fail('REPAIR_OPERATION_UNSUPPORTED', 'Unsupported repair operation', { operation: operation.operation });
}

function childChangesFromOperations(operations) {
  return operations.map((op, index) => ({
    changeId: 'CHG-' + String(index + 1).padStart(3, '0'),
    operation: op.operation,
    targetPath: op.targetPath,
    ...(op.operation !== 'add' ? { before: structuredClone(op.expectedBefore) } : {}),
    ...(op.operation !== 'remove' ? { after: structuredClone(op.after) } : {}),
    rationale: op.rationale,
  }));
}

export function validateAndApplyMap001Repair({
  parentProposal,
  validationReport,
  repair,
  childProposalId,
}) {
  if (validationReport?.status !== 'REJECT_FIXABLE') {
    fail('REPAIR_BASIS_NOT_FIXABLE', 'Only REJECT_FIXABLE may produce an automatic repair');
  }
  if (!/^MAP001-PROP-[0-9]{4,}$/.test(childProposalId ?? '')) {
    fail('CHILD_PROPOSAL_ID_INVALID', 'childProposalId must match MAP001-PROP-NNNN');
  }
  if (childProposalId === parentProposal?.proposalId) {
    fail('CHILD_PROPOSAL_ID_REUSED', 'child proposalId must differ from parent proposalId');
  }
  if (repair?.control?.runId !== parentProposal?.control?.runId) {
    fail('RUN_ID_MISMATCH', 'repair runId does not match parent proposal');
  }

  const parentSha = logicalSha256(parentProposal);
  const reportSha = logicalSha256(validationReport);
  if (
    repair.control.parentProposal?.proposalId !== parentProposal.proposalId
    || repair.control.parentProposal?.sha256 !== parentSha
    || repair.control.parentProposal?.iteration !== parentProposal.control.iteration
  ) {
    fail('REPAIR_PARENT_BINDING_MISMATCH', 'repair parentProposal binding does not match the exact parent');
  }
  if (
    repair.control.validationBasis?.reportId !== validationReport.reportId
    || repair.control.validationBasis?.sha256 !== reportSha
    || repair.control.validationBasis?.status !== 'REJECT_FIXABLE'
  ) {
    fail('REPAIR_VALIDATION_BASIS_MISMATCH', 'repair validationBasis does not match the exact report');
  }

  const operations = repair.patch?.operations ?? [];
  if (operations.length === 0) fail('REPAIR_PATCH_EMPTY', 'repair patch must contain operations');
  validateOperationIdentity(operations);
  validateNonOverlappingTargets(operations);

  const findingsById = findingMap(validationReport);
  for (const operation of operations) validateOperationAuthorization(operation, findingsById);

  const childCandidate = structuredClone(parentProposal.intent.candidate);
  for (const operation of operations) applyOperation(childCandidate, operation);

  const repairSha = logicalSha256(repair);
  const parentCandidateSha = logicalSha256(parentProposal.intent.candidate);

  const childProposal = {
    schemaVersion: '0.2',
    proposalId: childProposalId,
    proposalType: parentProposal.proposalType,
    control: {
      owner: 'RESOLVER',
      runId: parentProposal.control.runId,
      iteration: parentProposal.control.iteration + 1,
      lineage: {
        parentProposal: {
          proposalId: parentProposal.proposalId,
          sha256: parentSha,
          iteration: parentProposal.control.iteration,
        },
        originatingRepair: {
          repairId: repair.repairId,
          sha256: repairSha,
        },
      },
      baseline: structuredClone(parentProposal.control.baseline),
      subject: {
        mode: 'MODIFY_DERIVED',
        artifactRole: parentProposal.control.subject.artifactRole,
        artifactId: parentProposal.control.subject.artifactId,
        artifactPath: parentProposal.control.subject.artifactPath,
        baseSha256: parentCandidateSha,
      },
    },
    intent: {
      objective: parentProposal.intent.objective,
      changes: childChangesFromOperations(operations),
      candidate: childCandidate,
      notes: 'Generated deterministically from validated Repair R1; requires full domain revalidation.',
    },
  };

  return {
    repairSha256: repairSha,
    parentProposalSha256: parentSha,
    validationReportSha256: reportSha,
    parentCandidateSha256: parentCandidateSha,
    childCandidateSha256: logicalSha256(childCandidate),
    childProposal,
  };
}


export function executeMap001RepairGate({
  parentProposal,
  validationReport,
  repair,
  childProposalId,
  root,
  pythonExecutable = 'python',
}) {
  if (typeof root !== 'string' || root.length === 0) {
    fail('ROOT_REQUIRED', 'repository root is required for executable E5.1 contract validation');
  }

  let normalizedParent;
  let normalizedReport;
  let normalizedRepair;
  try {
    normalizedParent = JSON.parse(JSON.stringify(parentProposal));
    normalizedReport = JSON.parse(JSON.stringify(validationReport));
    normalizedRepair = JSON.parse(JSON.stringify(repair));
  } catch (error) {
    fail('NON_JSON_INPUT', 'E5.1 inputs must be JSON-serializable artifacts', { message: error.message });
  }

  const contractPrecheck = runContractGate({
    phase: 'pre',
    parentProposal: normalizedParent,
    validationReport: normalizedReport,
    repair: normalizedRepair,
    root,
    pythonExecutable,
  });

  const result = validateAndApplyMap001Repair({
    parentProposal: normalizedParent,
    validationReport: normalizedReport,
    repair: normalizedRepair,
    childProposalId,
  });

  const contractPostcheck = runContractGate({
    phase: 'post',
    parentProposal: normalizedParent,
    validationReport: normalizedReport,
    repair: normalizedRepair,
    result,
    root,
    pythonExecutable,
  });

  return {
    ...result,
    contractPrecheck,
    contractPostcheck,
  };
}
