#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from jsonschema import Draft7Validator

ROOT = Path(__file__).resolve().parents[2]
RUN_STATE_SCHEMA = ROOT / "tools/proposal-resolution/schemas/run-state.schema.json"
VALIDATION_REPORT_SCHEMA = ROOT / "tools/proposal-resolution/schemas/validation-report.schema.json"


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run", required=True)
    parser.add_argument("--report", action="append", default=[])
    args = parser.parse_args()

    run = load(args.run)
    validate(run, RUN_STATE_SCHEMA, "run-state R5")

    for index, report_path in enumerate(args.report, start=1):
        validate(load(report_path), VALIDATION_REPORT_SCHEMA, f"validation-report R1 #{index}")

    print(json.dumps({
        "status": "PASS",
        "runStateSchema": "R5",
        "validationReportSchema": "R1",
        "reportsChecked": len(args.report),
    }))


if __name__ == "__main__":
    main()
