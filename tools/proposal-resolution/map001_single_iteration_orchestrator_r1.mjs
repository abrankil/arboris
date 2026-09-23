import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  logicalSha256,
  validateMap001Proposal,
} from './map001_validation_adapter_r1.mjs';
import { reduceMap001RunState } from './map001_run_state_reducer_r1.mjs';

export class Map001SingleIterationOrchestratorError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'Map001SingleIterationOrchestratorError';
    this.code = code;
    this.details = details;
  }
}

const CONTRACT_GATE = 'tools/proposal-resolution/validate_e4_3_iteration_contracts.py';

function rawSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fail(code, message, details = null) {
  throw new Map001SingleIterationOrchestratorError(code, message, details);
}

function ensureFile(root, repoRelativePath, label) {
  const absolute = path.resolve(root, repoRelativePath);
  const resolvedRoot = path.resolve(root);
  const rootWithSep = resolvedRoot + path.sep;
  if (!(absolute === resolvedRoot || absolute.startsWith(rootWithSep))) {
    fail('PIN_PATH_OUTSIDE_REPO', label + ' resolves outside repository root', { repoRelativePath });
  }
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    fail('PINNED_FILE_MISSING', label + ' is missing', { repoRelativePath });
  }
  return absolute;
}

function systemMismatch(component, expectedSha256, observedSha256, message) {
  return {
    systemError: {
      code: 'PROVENANCE_MISMATCH',
      message,
      component,
      expectedSha256,
      observedSha256,
    },
  };
}

export function verifyMap001ExecutionPins({ run, root }) {
  const baseline = run?.control?.baseline;
  const validatorBinding = run?.control?.validatorBinding;
  const resolverBinding = run?.control?.resolverBinding;
  const contractSet = run?.control?.contractSet;

  if (!baseline || !validatorBinding || !resolverBinding || !contractSet) {
    return {
      systemError: {
        code: 'RUN_CONTROL_INCOMPLETE',
        message: 'run.control must contain baseline, validatorBinding, resolverBinding and contractSet.',
        component: 'CONTRACT_RUN_STATE',
      },
    };
  }

  const authorityPath = ensureFile(root, baseline.authorityPath, 'authority manifest');
  const sourcePath = ensureFile(root, baseline.sourceCandidate.path, 'source candidate');

  const observedAuthoritySha = rawSha256(authorityPath);
  if (observedAuthoritySha !== baseline.authorityManifestSha256) {
    return {
      authorityChanged: {
        component: 'AUTHORITY_MANIFEST',
        expectedSha256: baseline.authorityManifestSha256,
        observedSha256: observedAuthoritySha,
      },
    };
  }

  const observedSourceSha = rawSha256(sourcePath);
  if (observedSourceSha !== baseline.sourceCandidate.sha256) {
    return {
      authorityChanged: {
        component: 'SOURCE_CANDIDATE',
        expectedSha256: baseline.sourceCandidate.sha256,
        observedSha256: observedSourceSha,
      },
    };
  }

  const validatorPath = ensureFile(root, validatorBinding.implementationPath, 'validator implementation');
  const observedValidatorSha = rawSha256(validatorPath);
  if (observedValidatorSha !== validatorBinding.implementationSha256) {
    return systemMismatch(
      'VALIDATOR_IMPLEMENTATION',
      validatorBinding.implementationSha256,
      observedValidatorSha,
      'Pinned validator implementation SHA-256 does not match repository bytes.'
    );
  }

  const resolverPath = ensureFile(root, resolverBinding.implementationPath, 'resolver implementation');
  const observedResolverSha = rawSha256(resolverPath);
  if (observedResolverSha !== resolverBinding.implementationSha256) {
    return systemMismatch(
      'RESOLVER_IMPLEMENTATION',
      resolverBinding.implementationSha256,
      observedResolverSha,
      'Pinned resolver implementation SHA-256 does not match repository bytes.'
    );
  }

  const contracts = [
    ['proposal', 'CONTRACT_PROPOSAL', '$id'],
    ['repair', 'CONTRACT_REPAIR', '$id'],
    ['validationReport', 'CONTRACT_VALIDATION_REPORT', '$id'],
    ['runState', 'CONTRACT_RUN_STATE', '$id'],
    ['semanticContract', 'CONTRACT_SEMANTIC', 'contractId'],
  ];

  let semanticContract = null;

  for (const [key, component, idField] of contracts) {
    const binding = contractSet[key];
    if (!binding) {
      return {
        systemError: {
          code: 'CONTRACT_BINDING_MISSING',
          message: 'Missing contractSet binding for ' + key + '.',
          component,
        },
      };
    }

    const absolute = ensureFile(root, binding.path, key + ' contract');
    const observedSha = rawSha256(absolute);
    if (observedSha !== binding.sha256) {
      return systemMismatch(
        component,
        binding.sha256,
        observedSha,
        'Pinned ' + key + ' contract SHA-256 does not match repository bytes.'
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(absolute, 'utf8'));
    } catch (error) {
      return {
        systemError: {
          code: 'CONTRACT_UNREADABLE',
          message: key + ' contract is not valid JSON: ' + error.message,
          component,
        },
      };
    }
    if (parsed[idField] !== binding.schemaId) {
      return {
        systemError: {
          code: 'CONTRACT_ID_MISMATCH',
          message: key + ' contract identity does not match contractSet.schemaId.',
          component,
        },
      };
    }
    if (key === 'semanticContract') semanticContract = parsed;
  }

  const dependencyPolicy = semanticContract?.resolverDependencyPolicy;
  const requiredIds = dependencyPolicy?.requiredDependencyIds;
  const dependencies = resolverBinding.dependencies;

  if (!Array.isArray(requiredIds) || dependencyPolicy?.exactSetRequired !== true) {
    return {
      systemError: {
        code: 'RESOLVER_DEPENDENCY_POLICY_INVALID',
        message: 'Semantic contract does not define an exact resolver dependency set.',
        component: 'CONTRACT_SEMANTIC',
      },
    };
  }
  if (!Array.isArray(dependencies)) {
    return {
      systemError: {
        code: 'RESOLVER_DEPENDENCIES_MISSING',
        message: 'resolverBinding.dependencies is required by the active semantic contract.',
        component: 'RESOLVER_IMPLEMENTATION',
      },
    };
  }

  const observedIds = dependencies.map((item) => item.dependencyId);
  const uniqueIds = new Set(observedIds);
  const sortedRequired = [...requiredIds].sort();
  const sortedObserved = [...observedIds].sort();

  if (
    uniqueIds.size !== observedIds.length
    || JSON.stringify(sortedObserved) !== JSON.stringify(sortedRequired)
  ) {
    return {
      systemError: {
        code: 'RESOLVER_DEPENDENCY_SET_MISMATCH',
        message: 'resolverBinding.dependencies must match the semantic contract required dependency set exactly.',
        component: 'RESOLVER_IMPLEMENTATION',
      },
    };
  }

  for (const dependency of dependencies) {
    const absolute = ensureFile(root, dependency.path, 'resolver dependency ' + dependency.dependencyId);
    const observedSha = rawSha256(absolute);
    if (observedSha !== dependency.sha256) {
      return systemMismatch(
        'RESOLVER_IMPLEMENTATION',
        dependency.sha256,
        observedSha,
        'Pinned resolver dependency ' + dependency.dependencyId + ' SHA-256 does not match repository bytes.'
      );
    }
  }

  return {};
}

function runContractGate({
  phase,
  run,
  proposal,
  report = null,
  root,
  pythonExecutable,
}) {
  const gatePath = ensureFile(root, CONTRACT_GATE, 'E4.3 contract gate');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map001-e4-3-'));
  try {
    const runPath = path.join(dir, 'run.json');
    const proposalPath = path.join(dir, 'proposal.json');
    fs.writeFileSync(runPath, JSON.stringify(run, null, 2));
    fs.writeFileSync(proposalPath, JSON.stringify(proposal, null, 2));

    const args = [
      gatePath,
      '--phase', phase,
      '--run', runPath,
      '--proposal', proposalPath,
      '--proposal-sha', logicalSha256(proposal),
      '--candidate-sha', logicalSha256(proposal.intent.candidate),
    ];

    if (report) {
      const reportPath = path.join(dir, 'validation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      args.push('--report', reportPath, '--report-sha', logicalSha256(report));
    }

    const result = spawnSync(pythonExecutable, args, {
      cwd: root,
      encoding: 'utf8',
    });

    if (result.status !== 0) {
      fail(
        phase === 'pre' ? 'CONTRACT_PRECONDITION_FAILED' : 'CONTRACT_POSTCONDITION_FAILED',
        'E4.3 ' + phase + '-validation contract gate failed.',
        {
          status: result.status,
          stdout: result.stdout,
          stderr: result.stderr,
        }
      );
    }

    return JSON.parse(result.stdout.trim());
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function bindReport(run, report) {
  const updated = structuredClone(run);
  const latest = updated.iterations.at(-1);
  latest.validationReport = {
    reportId: report.reportId,
    sha256: logicalSha256(report),
    status: report.status,
  };
  return updated;
}

function withState(run, state) {
  const updated = structuredClone(run);
  updated.state = structuredClone(state);
  return updated;
}

export async function executeMap001ValidationIteration({
  run,
  proposal,
  reportId,
  root,
  previousValidationReportsById = {},
  pythonExecutable = 'python',
}) {
  const integrity = verifyMap001ExecutionPins({ run, root });
  const preState = reduceMap001RunState({
    run,
    validationReportsById: previousValidationReportsById,
    integrity,
  });

  if (preState.status !== 'READY_TO_VALIDATE') {
    return {
      executedValidation: false,
      validationReport: null,
      state: preState,
      run: withState(run, preState),
      contractPrecheck: null,
      contractPostcheck: null,
    };
  }

  const contractPrecheck = runContractGate({
    phase: 'pre',
    run,
    proposal,
    root,
    pythonExecutable,
  });

  const validationReport = await validateMap001Proposal({
    proposal,
    reportId,
    validatorBinding: run.control.validatorBinding,
    root,
  });

  let updatedRun = bindReport(run, validationReport);
  const validationReportsById = {
    ...previousValidationReportsById,
    [validationReport.reportId]: validationReport,
  };

  const state = reduceMap001RunState({
    run: updatedRun,
    validationReportsById,
  });
  updatedRun = withState(updatedRun, state);

  const contractPostcheck = runContractGate({
    phase: 'post',
    run: updatedRun,
    proposal,
    report: validationReport,
    root,
    pythonExecutable,
  });

  return {
    executedValidation: true,
    validationReport,
    state,
    run: updatedRun,
    contractPrecheck,
    contractPostcheck,
  };
}
