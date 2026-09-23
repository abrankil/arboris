import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export class Map001ProposalValidationAdapterError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'Map001ProposalValidationAdapterError';
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

export function logicalSha256(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

export function buildMap001ValidationView(report) {
  if (!report || report.status !== 'PASS') {
    throw new Map001ProposalValidationAdapterError(
      'AUTHORITY_RUNTIME_NOT_PASS',
      'MAP-001 authority runtime must PASS before a proposal can be validated',
      { status: report?.status ?? null, code: report?.code ?? null }
    );
  }
  if (report.candidate002Dependency !== false) {
    throw new Map001ProposalValidationAdapterError(
      'LEGACY_DEPENDENCY_FORBIDDEN',
      'MAP-001 proposal validation cannot depend on Candidate 002'
    );
  }
  if (!report.derivedRaster || typeof report.derivedRaster !== 'object') {
    throw new Map001ProposalValidationAdapterError(
      'AUTHORITY_RUNTIME_REPORT_INCOMPLETE',
      'authority runtime PASS report lacks derivedRaster'
    );
  }

  return {
    schemaVersion: '0.1',
    viewType: 'MAP001_LOCAL_NAVIGATION_DERIVED_VIEW',
    authority: {
      authorityId: report.authorityId,
      envelopeId: report.envelopeId,
      authorityState: report.authorityState,
      futureRasterAuthority: report.futureRasterAuthority,
    },
    semantics: {
      frameBoundaryPolicy: report.frameBoundaryPolicy,
      territorialGeometryClaim: report.territorialGeometryClaim,
      localFrameUnit: report.localFrameUnit,
      metricScale: report.metricScale,
      worldBearing: report.worldBearing,
      productionStandard: report.productionStandard,
    },
    derivedRaster: structuredClone(report.derivedRaster),
  };
}

const ABSENT = Object.freeze({ state: 'ABSENT' });

function escapeToken(token) {
  return token.replaceAll('~', '~0').replaceAll('/', '~1');
}

function pointerJoin(base, token) {
  return `${base}/${escapeToken(token)}`;
}

function sameJson(a, b) {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}

// Arrays are atomic leaves so walkableCells/endpoints findings stay compact and stable.
export function diffValidationView(expected, observed, pointer = '') {
  if (sameJson(expected, observed)) return [];

  const expectedIsObj = expected && typeof expected === 'object' && !Array.isArray(expected);
  const observedIsObj = observed && typeof observed === 'object' && !Array.isArray(observed);

  if (expectedIsObj && observedIsObj) {
    const keys = [...new Set([...Object.keys(expected), ...Object.keys(observed)])].sort();
    const diffs = [];
    for (const key of keys) {
      const hasE = Object.prototype.hasOwnProperty.call(expected, key);
      const hasO = Object.prototype.hasOwnProperty.call(observed, key);
      const p = pointerJoin(pointer, key);
      if (!hasE) {
        diffs.push({ path: p, expected: ABSENT, observed: structuredClone(observed[key]) });
      } else if (!hasO) {
        diffs.push({ path: p, expected: structuredClone(expected[key]), observed: ABSENT });
      } else {
        diffs.push(...diffValidationView(expected[key], observed[key], p));
      }
    }
    return diffs;
  }

  return [{ path: pointer || '/', expected: structuredClone(expected), observed: structuredClone(observed) }];
}

function pointerWithin(pointer, root) {
  return pointer === root || pointer.startsWith(`${root}/`);
}

export function classifyDifference(diff) {
  if (diff.expected === 'OPEN') return 'OPEN_BLOCKER';
  if (pointerWithin(diff.path, '/derivedRaster')) return 'AUTO_REPAIR';
  return 'AUTHORITY_BLOCKER';
}

function findingCode(disposition, p) {
  const normalized = p
    .replace(/~1/g, '_')
    .replace(/~0/g, '_')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || 'ROOT';
  return `MAP001.${disposition}.${normalized}`;
}

function sourceRefsFor(disposition, proposal) {
  const authorityPath = proposal.control.baseline.authorityPath;
  if (disposition === 'AUTO_REPAIR') {
    return [authorityPath, 'tools/map-navigation/materialize_walkable_envelope_001.mjs'];
  }
  return [authorityPath];
}

function makeFinding(index, disposition, diff, proposal) {
  const common = {
    findingId: `FND-${String(index + 1).padStart(3, '0')}`,
    disposition,
    code: findingCode(disposition, diff.path),
    message:
      disposition === 'AUTO_REPAIR'
        ? `Derived navigation output differs from the authoritative runtime at ${diff.path}.`
        : disposition === 'OPEN_BLOCKER'
          ? `Proposal attempts to change an authority value that must remain OPEN at ${diff.path}.`
          : `Proposal differs from protected MAP-001 authority outside the delegated auto-repair surface at ${diff.path}.`,
    sourceRefs: sourceRefsFor(disposition, proposal),
    targetPaths: [diff.path],
    expected: diff.expected,
    observed: diff.observed,
  };

  if (disposition === 'AUTO_REPAIR') {
    return {
      ...common,
      repairDirective: {
        minimalChangeRequired: true,
        hint: 'Restore this derived value from the authoritative MAP-001 runtime view.',
      },
    };
  }
  if (disposition === 'OPEN_BLOCKER') {
    return { ...common, requiredAction: 'HUMAN_DECISION_OR_NEW_EVIDENCE' };
  }
  return { ...common, requiredAction: 'AUTHORITY_REVIEW' };
}

export function deriveValidationStatus(findings) {
  const dispositions = findings.map((f) => f.disposition);
  if (dispositions.includes('AUTHORITY_BLOCKER')) return 'AUTHORITY_BLOCKER';
  if (dispositions.includes('OPEN_BLOCKER')) return 'OPEN_BLOCKER';
  if (findings.length > 0) return 'REJECT_FIXABLE';
  return 'PASS';
}

export function validateProposalAgainstAuthorityReport({
  proposal,
  authorityReport,
  reportId,
  validatorBinding,
}) {
  if (!proposal || proposal.proposalType !== 'MAP001_LOCAL_NAVIGATION_DERIVED') {
    throw new Map001ProposalValidationAdapterError(
      'PROPOSAL_TYPE_UNSUPPORTED',
      'Expected MAP001_LOCAL_NAVIGATION_DERIVED proposal'
    );
  }
  if (!/^MAP001-VAL-[0-9]{4,}$/.test(reportId ?? '')) {
    throw new Map001ProposalValidationAdapterError(
      'REPORT_ID_INVALID',
      'reportId must match MAP001-VAL-NNNN'
    );
  }

  const expected = buildMap001ValidationView(authorityReport);
  const observed = proposal.intent?.candidate;
  const diffs = diffValidationView(expected, observed);
  const findings = diffs
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((diff, index) => makeFinding(index, classifyDifference(diff), diff, proposal));

  return {
    schemaVersion: '0.1',
    reportId,
    reportType: 'MAP001_LOCAL_NAVIGATION_VALIDATION',
    control: {
      owner: 'RESOLVER',
      runId: proposal.control.runId,
      proposalBinding: {
        proposalId: proposal.proposalId,
        sha256: logicalSha256(proposal),
        iteration: proposal.control.iteration,
      },
      authorityBinding: {
        authorityId: proposal.control.baseline.authorityId,
        authorityManifestSha256: proposal.control.baseline.authorityManifestSha256,
        sourceCandidate: {
          id: proposal.control.baseline.sourceCandidate.id,
          sha256: proposal.control.baseline.sourceCandidate.sha256,
        },
      },
      validatorBinding: structuredClone(validatorBinding),
    },
    status: deriveValidationStatus(findings),
    findings,
  };
}

export async function validateMap001Proposal({
  proposal,
  reportId,
  validatorBinding,
  root,
  authorityPath,
}) {
  const modulePath = path.resolve(root, validatorBinding.implementationPath);
  const domain = await import(pathToFileURL(modulePath).href);
  if (typeof domain.materializeWalkableEnvelopeAuthority !== 'function') {
    throw new Map001ProposalValidationAdapterError(
      'DOMAIN_VALIDATOR_ENTRYPOINT_MISSING',
      'Pinned validator does not export materializeWalkableEnvelopeAuthority'
    );
  }
  const { report } = domain.materializeWalkableEnvelopeAuthority(
    root,
    authorityPath ?? proposal.control.baseline.authorityPath
  );
  return validateProposalAgainstAuthorityReport({
    proposal,
    authorityReport: report,
    reportId,
    validatorBinding,
  });
}
