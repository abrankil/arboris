#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
from copy import deepcopy
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




def decode_pointer(pointer):
    if not isinstance(pointer, str) or not pointer.startswith("/") or pointer == "/":
        raise AssertionError(f"invalid candidate pointer: {pointer!r}")
    raw_tokens = pointer[1:].split("/")
    tokens = []
    for raw in raw_tokens:
        index = 0
        while index < len(raw):
            if raw[index] == "~":
                if index + 1 >= len(raw) or raw[index + 1] not in ("0", "1"):
                    raise AssertionError(f"invalid JSON Pointer escape: {pointer!r}")
                index += 2
                continue
            index += 1
        tokens.append(raw.replace("~1", "/").replace("~0", "~"))
    return tokens


def strict_array_index(token):
    if not re.fullmatch(r"0|[1-9][0-9]*", token):
        raise AssertionError(f"invalid strict array index: {token!r}")
    return int(token)


def parent_and_key(doc, pointer):
    tokens = decode_pointer(pointer)
    current = doc
    for token in tokens[:-1]:
        if isinstance(current, list):
            index = strict_array_index(token)
            if index >= len(current):
                raise AssertionError(f"missing array parent for {pointer}")
            current = current[index]
        elif isinstance(current, dict):
            if token not in current:
                raise AssertionError(f"missing object parent for {pointer}")
            current = current[token]
        else:
            raise AssertionError(f"cannot traverse scalar for {pointer}")
    return current, tokens[-1]


def apply_child_change(doc, change):
    parent, key = parent_and_key(doc, change["targetPath"])
    operation = change["operation"]

    if operation == "add":
        if isinstance(parent, list):
            if key == "-":
                parent.append(deepcopy(change["after"]))
                return
            index = strict_array_index(key)
            if index != len(parent):
                raise AssertionError("array add requires index == length or /-")
            parent.append(deepcopy(change["after"]))
            return
        if not isinstance(parent, dict) or key in parent:
            raise AssertionError("object add target must be absent")
        parent[key] = deepcopy(change["after"])
        return

    if isinstance(parent, list):
        index = strict_array_index(key)
        if index >= len(parent):
            raise AssertionError("array target missing")
        observed = parent[index]
        if observed != change["before"]:
            raise AssertionError("child change before mismatch")
        if operation == "remove":
            parent.pop(index)
        elif operation == "replace":
            if change["before"] == change["after"]:
                raise AssertionError("replace cannot be a no-op")
            parent[index] = deepcopy(change["after"])
        else:
            raise AssertionError(f"unsupported child operation: {operation}")
        return

    if not isinstance(parent, dict) or key not in parent:
        raise AssertionError("object target missing")
    if parent[key] != change["before"]:
        raise AssertionError("child change before mismatch")
    if operation == "remove":
        del parent[key]
    elif operation == "replace":
        if change["before"] == change["after"]:
            raise AssertionError("replace cannot be a no-op")
        parent[key] = deepcopy(change["after"])
    else:
        raise AssertionError(f"unsupported child operation: {operation}")


def pointer_within(pointer, scope):
    return pointer == scope or pointer.startswith(scope + "/")


def validate_repair_semantics(report, repair):
    finding_ids = [finding["findingId"] for finding in report["findings"]]
    if len(finding_ids) != len(set(finding_ids)):
        raise AssertionError("validation-report findingId values must be unique")
    finding_by_id = {finding["findingId"]: finding for finding in report["findings"]}

    operations = repair["patch"]["operations"]
    edit_ids = [operation["editId"] for operation in operations]
    if len(edit_ids) != len(set(edit_ids)):
        raise AssertionError("repair editId values must be unique")

    targets = [operation["targetPath"] for operation in operations]
    if len(targets) != len(set(targets)):
        raise AssertionError("repair target paths must be unique")
    for index, left in enumerate(targets):
        for right in targets[index + 1 :]:
            if pointer_within(left, right) or pointer_within(right, left):
                raise AssertionError("repair target paths must not overlap")

    for operation in operations:
        for finding_id in operation["findingRefs"]:
            finding = finding_by_id.get(finding_id)
            if finding is None:
                raise AssertionError(f"unknown findingRef: {finding_id}")
            if finding["disposition"] != "AUTO_REPAIR":
                raise AssertionError(f"findingRef is not AUTO_REPAIR: {finding_id}")
            if not any(
                pointer_within(operation["targetPath"], scope)
                for scope in finding["targetPaths"]
            ):
                raise AssertionError(
                    f"repair target is outside cited finding scope: {finding_id}"
                )


def expected_child_changes(repair):
    changes = []
    for index, operation in enumerate(repair["patch"]["operations"], start=1):
        change = {
            "changeId": f"CHG-{index:03d}",
            "operation": operation["operation"],
            "targetPath": operation["targetPath"],
            "rationale": operation["rationale"],
        }
        if operation["operation"] != "add":
            change["before"] = deepcopy(operation["expectedBefore"])
        if operation["operation"] != "remove":
            change["after"] = deepcopy(operation["after"])
        changes.append(change)
    return changes


def raw_sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def resolve_repo_file(repo_relative, label):
    root = ROOT.resolve()
    target = (ROOT / repo_relative).resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise AssertionError(f"{label} resolves outside repository root") from exc
    if not target.is_file():
        raise AssertionError(f"{label} does not exist: {repo_relative}")
    return target


def validate_report_provenance(parent, report):
    baseline = parent["control"]["baseline"]
    authority = report["control"]["authorityBinding"]
    expected_authority = {
        "authorityId": baseline["authorityId"],
        "authorityManifestSha256": baseline["authorityManifestSha256"],
        "sourceCandidate": {
            "id": baseline["sourceCandidate"]["id"],
            "sha256": baseline["sourceCandidate"]["sha256"],
        },
    }
    if authority != expected_authority:
        raise AssertionError("validation-report authorityBinding does not match parent baseline")

    authority_path = resolve_repo_file(baseline["authorityPath"], "authority manifest")
    source_path = resolve_repo_file(baseline["sourceCandidate"]["path"], "source candidate")
    if raw_sha256(authority_path) != baseline["authorityManifestSha256"]:
        raise AssertionError("parent authority manifest raw hash mismatch")
    if raw_sha256(source_path) != baseline["sourceCandidate"]["sha256"]:
        raise AssertionError("parent source candidate raw hash mismatch")

    validator = report["control"]["validatorBinding"]
    validator_path = resolve_repo_file(
        validator["implementationPath"], "validator implementation"
    )
    if raw_sha256(validator_path) != validator["implementationSha256"]:
        raise AssertionError("validation-report validator implementation raw hash mismatch")

    for finding in report["findings"]:
        for ref in finding.get("sourceRefs", []):
            path_part = ref.split("#", 1)[0]
            if "://" in path_part:
                continue
            resolve_repo_file(path_part, "finding sourceRef")


def validate_pre(parent, report, repair, args):
    validate(parent, PROPOSAL_SCHEMA, "parent proposal R2")
    validate(report, REPORT_SCHEMA, "validation-report R1")
    validate(repair, REPAIR_SCHEMA, "repair R1")
    validate_report_status(report)
    validate_report_provenance(parent, report)
    validate_repair_semantics(report, repair)

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
    if child["proposalId"] == parent["proposalId"]:
        raise AssertionError("child proposalId must differ from parent proposalId")

    expected_changes = expected_child_changes(repair)
    if child["intent"]["changes"] != expected_changes:
        raise AssertionError("child declared changes are not equivalent to repair operations")

    reconstructed = deepcopy(parent["intent"]["candidate"])
    for change in child["intent"]["changes"]:
        apply_child_change(reconstructed, change)
    if reconstructed != child["intent"]["candidate"]:
        raise AssertionError(
            "child declared changes do not reconstruct child candidate from parent candidate"
        )


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
        "reportProvenance": "VERIFIED",
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
        checked["repairSemantics"] = "VERIFIED"
        checked["childChanges"] = "RECONSTRUCT_CHILD"

    print(json.dumps(checked))


if __name__ == "__main__":
    main()
