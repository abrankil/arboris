#!/usr/bin/env python3
import argparse
import json
from copy import deepcopy
from pathlib import Path

from jsonschema import Draft7Validator

ROOT = Path(__file__).resolve().parents[2]
PROPOSAL_SCHEMA = ROOT / "tools/proposal-resolution/schemas/proposal.schema.json"
REPORT_SCHEMA = ROOT / "tools/proposal-resolution/schemas/validation-report.schema.json"
SEMANTIC_CONTRACT = ROOT / "tools/proposal-resolution/contracts/cross-contract.semantic.json"


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate_schema(instance, schema_path, label):
    schema = load(schema_path)
    Draft7Validator.check_schema(schema)
    errors = sorted(Draft7Validator(schema).iter_errors(instance), key=lambda e: list(e.absolute_path))
    if errors:
        first = errors[0]
        where = "/" + "/".join(str(x) for x in first.absolute_path)
        raise AssertionError(f"{label} schema violation at {where}: {first.message}")


def decode_pointer(pointer):
    if not pointer.startswith("/") or pointer == "/":
        raise AssertionError(f"invalid candidate pointer: {pointer!r}")
    return [t.replace("~1", "/").replace("~0", "~") for t in pointer[1:].split("/")]


def parent_and_key(doc, pointer):
    tokens = decode_pointer(pointer)
    cur = doc
    for token in tokens[:-1]:
        if isinstance(cur, list):
            if not token.isdigit() or int(token) >= len(cur):
                raise AssertionError(f"missing array parent for {pointer}")
            cur = cur[int(token)]
        elif isinstance(cur, dict):
            if token not in cur:
                raise AssertionError(f"missing object parent for {pointer}")
            cur = cur[token]
        else:
            raise AssertionError(f"cannot traverse scalar for {pointer}")
    return cur, tokens[-1]


def apply_change(doc, change):
    parent, key = parent_and_key(doc, change["targetPath"])
    op = change["operation"]
    if op == "add":
        if isinstance(parent, dict):
            if key in parent:
                raise AssertionError(f"add target already exists: {change['targetPath']}")
            parent[key] = deepcopy(change["after"])
        elif isinstance(parent, list):
            if key == "-":
                parent.append(deepcopy(change["after"]))
            elif key.isdigit() and int(key) == len(parent):
                parent.append(deepcopy(change["after"]))
            else:
                raise AssertionError(f"invalid array add target: {change['targetPath']}")
        else:
            raise AssertionError(f"add parent is scalar: {change['targetPath']}")
    elif op == "remove":
        if isinstance(parent, dict):
            if key not in parent or parent[key] != change["before"]:
                raise AssertionError(f"remove expectedBefore mismatch: {change['targetPath']}")
            del parent[key]
        elif isinstance(parent, list):
            if not key.isdigit() or int(key) >= len(parent) or parent[int(key)] != change["before"]:
                raise AssertionError(f"remove expectedBefore mismatch: {change['targetPath']}")
            parent.pop(int(key))
        else:
            raise AssertionError(f"remove parent is scalar: {change['targetPath']}")
    elif op == "replace":
        if isinstance(parent, dict):
            if key not in parent or parent[key] != change["before"]:
                raise AssertionError(f"replace expectedBefore mismatch: {change['targetPath']}")
            parent[key] = deepcopy(change["after"])
        elif isinstance(parent, list):
            if not key.isdigit() or int(key) >= len(parent) or parent[int(key)] != change["before"]:
                raise AssertionError(f"replace expectedBefore mismatch: {change['targetPath']}")
            parent[int(key)] = deepcopy(change["after"])
        else:
            raise AssertionError(f"replace parent is scalar: {change['targetPath']}")
    else:
        raise AssertionError(f"unsupported operation: {op}")


def validate_sem_prop_004(proposal):
    semantic = load(SEMANTIC_CONTRACT)
    invariant = next((x for x in semantic.get("invariants", []) if x.get("id") == "SEM-PROP-004"), None)
    if not invariant or invariant.get("check") != "DECLARED_CHANGES_RECONSTRUCT_CANDIDATE_EXACTLY":
        raise AssertionError("approved semantic contract does not expose SEM-PROP-004 as expected")

    subject = proposal["control"]["subject"]
    if subject["mode"] != "CREATE_DERIVED":
        raise AssertionError("E3 contract gate fixture currently proves CREATE_DERIVED only")

    reconstructed = {}
    for change in proposal["intent"]["changes"]:
        apply_change(reconstructed, change)

    if reconstructed != proposal["intent"]["candidate"]:
        raise AssertionError("SEM-PROP-004 failed: declared changes do not reconstruct candidate exactly")


def validate_status_derivation(report):
    dispositions = [f["disposition"] for f in report["findings"]]
    if "AUTHORITY_BLOCKER" in dispositions:
        expected = "AUTHORITY_BLOCKER"
    elif "OPEN_BLOCKER" in dispositions:
        expected = "OPEN_BLOCKER"
    elif dispositions:
        expected = "REJECT_FIXABLE"
    else:
        expected = "PASS"
    if report["status"] != expected:
        raise AssertionError(f"validation-report status mismatch: expected {expected}, got {report['status']}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--proposal", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()

    proposal = load(args.proposal)
    report = load(args.report)

    validate_schema(proposal, PROPOSAL_SCHEMA, "proposal")
    validate_sem_prop_004(proposal)
    validate_schema(report, REPORT_SCHEMA, "validation-report")
    validate_status_derivation(report)

    if report["control"]["proposalBinding"]["proposalId"] != proposal["proposalId"]:
        raise AssertionError("validation-report proposalId does not bind the tested proposal")
    if report["control"]["proposalBinding"]["iteration"] != proposal["control"]["iteration"]:
        raise AssertionError("validation-report iteration does not bind the tested proposal")

    print(json.dumps({
        "status": "PASS",
        "proposalSchema": "R2",
        "validationReportSchema": "R1",
        "semanticInvariant": "SEM-PROP-004"
    }))


if __name__ == "__main__":
    main()
