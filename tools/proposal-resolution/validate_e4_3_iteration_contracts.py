#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from jsonschema import Draft7Validator

from validate_e3_contracts import (
    validate_schema,
    validate_sem_prop_004,
    validate_status_derivation,
)

ROOT = Path(__file__).resolve().parents[2]
RUN_SCHEMA = ROOT / "tools/proposal-resolution/schemas/run-state.schema.json"
REPORT_SCHEMA = ROOT / "tools/proposal-resolution/schemas/validation-report.schema.json"


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def assert_repo_source_refs_exist(report):
    for finding in report.get("findings", []):
        for ref in finding.get("sourceRefs", []):
            path_part = ref.split("#", 1)[0]
            if "://" in path_part:
                continue
            target = ROOT / path_part
            if not target.exists():
                raise AssertionError(f"repo-local sourceRef does not exist: {ref}")


def assert_run_proposal_binding(run, proposal):
    if proposal["control"]["runId"] != run["runId"]:
        raise AssertionError("proposal runId does not match run-state")
    if proposal["control"]["iteration"] != run["state"]["currentIteration"]:
        raise AssertionError("proposal iteration does not match run-state currentIteration")
    if proposal["control"]["baseline"] != run["control"]["baseline"]:
        raise AssertionError("proposal baseline does not match run-state baseline")

    latest = run["iterations"][-1]
    if latest["iteration"] != proposal["control"]["iteration"]:
        raise AssertionError("latest run iteration does not match proposal iteration")
    if latest["proposal"]["proposalId"] != proposal["proposalId"]:
        raise AssertionError("latest run proposalId does not match proposal")

    history = run["candidateHistory"][-1]
    if history["iteration"] != proposal["control"]["iteration"]:
        raise AssertionError("latest candidateHistory iteration does not match proposal iteration")

    artifact_path = proposal["control"]["subject"]["artifactPath"]
    roots = run["control"]["policy"]["artifactWritePolicy"]["allowedRoots"]
    if not any(artifact_path == root or artifact_path.startswith(root + "/") for root in roots):
        raise AssertionError("proposal artifactPath is outside run-state allowedRoots")


def assert_report_bindings(run, proposal, report):
    control = report["control"]
    if control["runId"] != run["runId"]:
        raise AssertionError("validation-report runId does not match run-state")
    if control["proposalBinding"]["proposalId"] != proposal["proposalId"]:
        raise AssertionError("validation-report proposalId does not match proposal")
    if control["proposalBinding"]["iteration"] != proposal["control"]["iteration"]:
        raise AssertionError("validation-report iteration does not match proposal")
    if control["authorityBinding"]["authorityId"] != run["control"]["baseline"]["authorityId"]:
        raise AssertionError("validation-report authorityId does not match run-state")
    if control["authorityBinding"]["authorityManifestSha256"] != run["control"]["baseline"]["authorityManifestSha256"]:
        raise AssertionError("validation-report authority hash does not match run-state")
    if control["authorityBinding"]["sourceCandidate"]["id"] != run["control"]["baseline"]["sourceCandidate"]["id"]:
        raise AssertionError("validation-report sourceCandidate id does not match run-state")
    if control["authorityBinding"]["sourceCandidate"]["sha256"] != run["control"]["baseline"]["sourceCandidate"]["sha256"]:
        raise AssertionError("validation-report sourceCandidate hash does not match run-state")
    if control["validatorBinding"] != run["control"]["validatorBinding"]:
        raise AssertionError("validation-report validator binding does not match run-state")

    latest = run["iterations"][-1]["validationReport"]
    if latest is None:
        raise AssertionError("post-validation run-state must bind the validation-report")
    if latest["reportId"] != report["reportId"] or latest["status"] != report["status"]:
        raise AssertionError("run-state validation binding does not match validation-report")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=["pre", "post"], required=True)
    parser.add_argument("--run", required=True)
    parser.add_argument("--proposal", required=True)
    parser.add_argument("--report")
    args = parser.parse_args()

    run = load(args.run)
    proposal = load(args.proposal)

    validate_schema(run, RUN_SCHEMA, "run-state R4")
    validate_schema(
        proposal,
        ROOT / "tools/proposal-resolution/schemas/proposal.schema.json",
        "proposal R2",
    )
    validate_sem_prop_004(proposal)
    assert_run_proposal_binding(run, proposal)

    checked = {
        "runStateSchema": "R4",
        "proposalSchema": "R2",
        "semanticInvariant": "SEM-PROP-004",
    }

    if args.phase == "post":
        if not args.report:
            raise AssertionError("--report is required for post phase")
        report = load(args.report)
        validate_schema(report, REPORT_SCHEMA, "validation-report R1")
        validate_status_derivation(report)
        assert_repo_source_refs_exist(report)
        assert_report_bindings(run, proposal, report)
        checked["validationReportSchema"] = "R1"
        checked["sourceRefs"] = "EXIST"

    print(json.dumps({"status": "PASS", **checked}, ensure_ascii=False))


if __name__ == "__main__":
    main()
