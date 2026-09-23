#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from jsonschema import Draft7Validator

ROOT = Path(__file__).resolve().parents[2]
PROPOSAL_SCHEMA = ROOT / "tools/proposal-resolution/schemas/proposal.schema.json"
REPAIR_SCHEMA = ROOT / "tools/proposal-resolution/schemas/repair.schema.json"
REPORT_SCHEMA = ROOT / "tools/proposal-resolution/schemas/validation-report.schema.json"


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate(instance, schema_path, label):
    schema = load(schema_path)
    Draft7Validator.check_schema(schema)
    errors = sorted(
        Draft7Validator(schema).iter_errors(instance),
        key=lambda error: list(error.absolute_path),
    )
    if errors:
        error = errors[0]
        where = "/" + "/".join(str(part) for part in error.absolute_path)
        raise AssertionError(f"{label} schema violation at {where}: {error.message}")


def validate_report_status(report):
    dispositions = [finding["disposition"] for finding in report["findings"]]
    if "AUTHORITY_BLOCKER" in dispositions:
        expected = "AUTHORITY_BLOCKER"
    elif "OPEN_BLOCKER" in dispositions:
        expected = "OPEN_BLOCKER"
    elif dispositions:
        expected = "REJECT_FIXABLE"
    else:
        expected = "PASS"
    if report["status"] != expected:
        raise AssertionError(
            f"validation-report status mismatch: expected {expected}, got {report['status']}"
        )


def validate_pre(parent, report, repair, args):
    validate(parent, PROPOSAL_SCHEMA, "parent proposal R2")
    validate(report, REPORT_SCHEMA, "validation-report R1")
    validate(repair, REPAIR_SCHEMA, "repair R1")
    validate_report_status(report)

    if report["status"] != "REJECT_FIXABLE":
        raise AssertionError("repair basis must be REJECT_FIXABLE")

    binding = report["control"]["proposalBinding"]
    if binding["proposalId"] != parent["proposalId"]:
        raise AssertionError("report does not bind parent proposalId")
    if binding["sha256"] != args.parent_sha:
        raise AssertionError("report does not bind parent logical hash")
    if binding["iteration"] != parent["control"]["iteration"]:
        raise AssertionError("report does not bind parent iteration")
    if report["control"]["runId"] != parent["control"]["runId"]:
        raise AssertionError("report runId does not bind parent runId")

    control = repair["control"]
    if control["runId"] != parent["control"]["runId"]:
        raise AssertionError("repair runId does not match parent")
    if control["parentProposal"] != {
        "proposalId": parent["proposalId"],
        "sha256": args.parent_sha,
        "iteration": parent["control"]["iteration"],
    }:
        raise AssertionError("repair parentProposal binding mismatch")
    if control["validationBasis"] != {
        "reportId": report["reportId"],
        "sha256": args.report_sha,
        "status": "REJECT_FIXABLE",
    }:
        raise AssertionError("repair validationBasis binding mismatch")


def validate_post(parent, repair, child, args):
    validate(child, PROPOSAL_SCHEMA, "child proposal R2")

    child_control = child["control"]
    if child_control["runId"] != parent["control"]["runId"]:
        raise AssertionError("child runId does not match parent")
    if child_control["iteration"] != parent["control"]["iteration"] + 1:
        raise AssertionError("child iteration must be parent iteration + 1")
    if child_control["baseline"] != parent["control"]["baseline"]:
        raise AssertionError("child baseline must equal parent baseline")
    if child_control["lineage"]["parentProposal"] != {
        "proposalId": parent["proposalId"],
        "sha256": args.parent_sha,
        "iteration": parent["control"]["iteration"],
    }:
        raise AssertionError("child parentProposal lineage mismatch")
    if child_control["lineage"]["originatingRepair"] != {
        "repairId": repair["repairId"],
        "sha256": args.repair_sha,
    }:
        raise AssertionError("child originatingRepair lineage mismatch")

    subject = child_control["subject"]
    parent_subject = parent["control"]["subject"]
    if subject["mode"] != "MODIFY_DERIVED":
        raise AssertionError("child subject mode must be MODIFY_DERIVED")
    for key in ["artifactRole", "artifactId", "artifactPath"]:
        if subject[key] != parent_subject[key]:
            raise AssertionError(f"child subject {key} must match parent")
    if subject["baseSha256"] != args.parent_candidate_sha:
        raise AssertionError("child baseSha256 must match parent candidate logical hash")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=["pre", "post"], required=True)
    parser.add_argument("--parent", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--repair", required=True)
    parser.add_argument("--child")
    parser.add_argument("--parent-sha", required=True)
    parser.add_argument("--report-sha", required=True)
    parser.add_argument("--repair-sha")
    parser.add_argument("--parent-candidate-sha")
    args = parser.parse_args()

    parent = load(args.parent)
    report = load(args.report)
    repair = load(args.repair)

    validate_pre(parent, report, repair, args)

    checked = {
        "status": "PASS",
        "phase": args.phase,
        "parentProposalSchema": "R2",
        "validationReportSchema": "R1",
        "repairSchema": "R1",
        "reportStatus": "REDERIVED",
        "parentReportRepairBindings": "BOUND",
    }

    if args.phase == "post":
        if not args.child or not args.repair_sha or not args.parent_candidate_sha:
            raise AssertionError(
                "post phase requires --child, --repair-sha and --parent-candidate-sha"
            )
        child = load(args.child)
        validate_post(parent, repair, child, args)
        checked["childProposalSchema"] = "R2"
        checked["childLineage"] = "BOUND"

    print(json.dumps(checked))


if __name__ == "__main__":
    main()
