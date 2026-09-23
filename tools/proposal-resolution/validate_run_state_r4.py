#!/usr/bin/env python3
import copy
import json
from pathlib import Path

from jsonschema import Draft7Validator

ROOT = Path(__file__).resolve().parents[2]
RUN_STATE_SCHEMA = ROOT / "tools/proposal-resolution/schemas/run-state.schema.json"
SEMANTIC_CONTRACT = ROOT / "tools/proposal-resolution/contracts/cross-contract.semantic.json"

SHA_A = "a" * 64
SHA_B = "b" * 64
SHA_C = "c" * 64


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def errors(instance, schema):
    return sorted(Draft7Validator(schema).iter_errors(instance), key=lambda e: list(e.absolute_path))


def fixture():
    schema_paths = {
        "proposal": ("arboris:proposal-resolution:map001:proposal:r2", "tools/proposal-resolution/schemas/proposal.schema.json"),
        "repair": ("arboris:proposal-resolution:map001:repair:r1", "tools/proposal-resolution/schemas/repair.schema.json"),
        "validationReport": ("arboris:proposal-resolution:map001:validation-report:r1", "tools/proposal-resolution/schemas/validation-report.schema.json"),
        "runState": ("arboris:proposal-resolution:map001:run-state:r4", "tools/proposal-resolution/schemas/run-state.schema.json"),
        "semanticContract": ("MAP001-CROSS-CONTRACT-SEMANTICS-002", "tools/proposal-resolution/contracts/cross-contract.semantic.json"),
    }
    contract_set = {
        key: {"schemaId": sid, "path": path, "sha256": SHA_C}
        for key, (sid, path) in schema_paths.items()
    }
    return {
        "schemaVersion": "0.4",
        "runId": "MAP001-RUN-0001",
        "runType": "MAP001_LOCAL_NAVIGATION_PROPOSAL_RESOLUTION",
        "control": {
            "owner": "RESOLVER",
            "scope": "MAP001_LOCAL_NAVIGATION",
            "baseline": {
                "authorityId": "MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001",
                "authorityPath": "data/baselines/map001-walkable-envelope-authority-001.json",
                "authorityManifestSha256": SHA_A,
                "sourceCandidate": {
                    "id": "MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001",
                    "path": "data/maps/map-001-walkable-envelope-candidate-001.json",
                    "sha256": SHA_B,
                },
            },
            "validatorBinding": {
                "validatorId": "MAP001.NAV.AUTHORITY.RUNTIME.001",
                "scope": "MAP001_LOCAL_NAVIGATION",
                "implementationPath": "tools/map-navigation/materialize_walkable_envelope_001.mjs",
                "implementationSha256": SHA_C,
            },
            "resolverBinding": {
                "resolverId": "MAP001.RESOLVER.001",
                "implementationPath": "tools/proposal-resolution/map001_resolver_r1.mjs",
                "implementationSha256": SHA_C,
            },
            "contractSet": contract_set,
            "policy": {
                "maxIterations": 8,
                "stallRepeatThreshold": 3,
                "repeatCandidateHashAction": "CYCLE_DETECTED",
                "regressionAction": "REGRESSION",
                "artifactWritePolicy": {
                    "allowedRoots": ["build/proposal-resolution"],
                    "createCollisionPolicy": "FAIL_IF_EXISTS",
                },
            },
        },
        "state": {
            "status": "CYCLE_DETECTED",
            "currentIteration": 3,
            "evidence": {
                "kind": "CYCLE_DETECTED",
                "repeatedCandidateSha256": SHA_A,
                "firstSeenIteration": 1,
            },
        },
        "iterations": [
            {
                "iteration": 1,
                "proposal": {"proposalId": "MAP001-PROP-0001", "sha256": SHA_A},
                "validationReport": {
                    "reportId": "MAP001-VAL-0001",
                    "sha256": SHA_B,
                    "status": "REJECT_FIXABLE",
                },
                "repair": {"repairId": "MAP001-REPAIR-0001", "sha256": SHA_C},
            },
            {
                "iteration": 2,
                "proposal": {"proposalId": "MAP001-PROP-0002", "sha256": SHA_B},
                "validationReport": {
                    "reportId": "MAP001-VAL-0002",
                    "sha256": SHA_C,
                    "status": "REJECT_FIXABLE",
                },
                "repair": {"repairId": "MAP001-REPAIR-0002", "sha256": SHA_A},
            },
            {
                "iteration": 3,
                "proposal": {"proposalId": "MAP001-PROP-0003", "sha256": SHA_C},
                "validationReport": None,
                "repair": None,
            },
        ],
        "candidateHistory": [
            {"iteration": 1, "candidateSha256": SHA_A},
            {"iteration": 2, "candidateSha256": SHA_B},
            {"iteration": 3, "candidateSha256": SHA_A},
        ],
    }


def main():
    schema = load(RUN_STATE_SCHEMA)
    semantic = load(SEMANTIC_CONTRACT)
    Draft7Validator.check_schema(schema)

    assert schema["$id"] == "arboris:proposal-resolution:map001:run-state:r4"
    assert schema["properties"]["schemaVersion"]["const"] == "0.4"

    valid = fixture()
    assert not errors(valid, schema), errors(valid, schema)

    legacy_hashes = copy.deepcopy(valid)
    legacy_hashes["seenCandidateHashes"] = [SHA_A, SHA_B]
    del legacy_hashes["candidateHistory"]
    assert errors(legacy_hashes, schema), "R4 must reject legacy seenCandidateHashes"

    legacy_policy = copy.deepcopy(valid)
    policy = legacy_policy["control"]["policy"]
    policy["repeatProposalHashAction"] = policy.pop("repeatCandidateHashAction")
    assert errors(legacy_policy, schema), "R4 must reject repeatProposalHashAction"

    assert semantic["contractId"] == "MAP001-CROSS-CONTRACT-SEMANTICS-002"
    assert semantic["schemaVersion"] == "0.2"
    expected_precedence = [
        "SYSTEM_ERROR",
        "AUTHORITY_CHANGED",
        "CYCLE_DETECTED",
        "READY_TO_VALIDATE",
        "AUTHORITY_BLOCKED",
        "OPEN_BLOCKED",
        "DOMAIN_PASS",
        "REGRESSION",
        "STALLED",
        "MAX_ITERATIONS",
        "READY_TO_REPAIR",
    ]
    assert semantic["runStatePolicy"]["statePrecedence"] == expected_precedence

    invariant_ids = {item["id"] for item in semantic["invariants"]}
    for required in ["SEM-RUN-006", "SEM-RUN-007", "SEM-RUN-008", "SEM-RUN-009", "SEM-ASC-001"]:
        assert required in invariant_ids, f"missing invariant {required}"

    print(json.dumps({
        "status": "PASS",
        "runStateSchema": "R4",
        "semanticContract": "R2",
        "cycleFixture": "A->B->A accepted",
        "legacySeenCandidateHashes": "rejected",
        "legacyRepeatProposalHashAction": "rejected",
        "statePrecedence": "frozen",
        "repairChildAtomicity": "declared",
        "stalledRepeatCountExactness": "declared",
        "domainPassAscSeparation": "preserved",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
