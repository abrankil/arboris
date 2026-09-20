from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

DEFAULT_SPEC_PATH = (
    ROOT / "config" / "botanical" / "controlled_vocabularies.json"
)

EXPECTED_SPECIFICATION_ID = "arboris-controlled-vocabularies"


class ControlledVocabularyError(ValueError):
    """Raised when the controlled-vocabulary specification is invalid."""


def load_spec(path: Path | None = None) -> dict[str, Any]:
    spec_path = path if path is not None else DEFAULT_SPEC_PATH

    if not spec_path.exists():
        raise ControlledVocabularyError(
            f"Controlled-vocabulary specification not found: {spec_path}"
        )

    try:
        with spec_path.open("r", encoding="utf-8-sig") as handle:
            spec = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise ControlledVocabularyError(
            f"Cannot load controlled-vocabulary specification "
            f"{spec_path}: {exc}"
        ) from exc

    validate_spec(spec)

    return spec


def validate_spec(spec: Any) -> None:
    if not isinstance(spec, dict):
        raise ControlledVocabularyError(
            "Controlled-vocabulary specification root must be an object."
        )

    required_keys = {
        "specification_id",
        "specification_version",
        "contract_id",
        "contract_version",
        "scope",
        "fields",
    }

    actual_keys = set(spec)

    missing = required_keys - actual_keys
    extra = actual_keys - required_keys

    if missing:
        raise ControlledVocabularyError(
            "Missing specification keys: "
            + ", ".join(sorted(missing))
        )

    if extra:
        raise ControlledVocabularyError(
            "Unexpected specification keys: "
            + ", ".join(sorted(extra))
        )

    for key in (
        "specification_id",
        "specification_version",
        "contract_id",
        "contract_version",
    ):
        value = spec[key]
        if not isinstance(value, str) or not value.strip():
            raise ControlledVocabularyError(
                f"{key} must be a non-empty string."
            )

    if spec["specification_id"] != EXPECTED_SPECIFICATION_ID:
        raise ControlledVocabularyError(
            "Unexpected specification_id: "
            f"{spec['specification_id']!r}"
        )

    scope = spec["scope"]
    fields = spec["fields"]

    if not isinstance(scope, list) or not scope:
        raise ControlledVocabularyError(
            "scope must be a non-empty array."
        )

    if not all(isinstance(item, str) and item for item in scope):
        raise ControlledVocabularyError(
            "scope entries must be non-empty strings."
        )

    if len(scope) != len(set(scope)):
        raise ControlledVocabularyError(
            "scope contains duplicate entries."
        )

    if not isinstance(fields, dict) or not fields:
        raise ControlledVocabularyError(
            "fields must be a non-empty object."
        )

    if set(scope) != set(fields):
        raise ControlledVocabularyError(
            "scope and fields must contain exactly the same field names."
        )

    for field_name, definition in fields.items():
        _validate_field_definition(field_name, definition)


def _validate_field_definition(
    field_name: str,
    definition: Any,
) -> None:
    if not isinstance(field_name, str) or not field_name:
        raise ControlledVocabularyError(
            "field names must be non-empty strings."
        )

    if not isinstance(definition, dict):
        raise ControlledVocabularyError(
            f"{field_name}: definition must be an object."
        )

    expected_keys = {"nullable", "allowed_values"}
    actual_keys = set(definition)

    if actual_keys != expected_keys:
        raise ControlledVocabularyError(
            f"{field_name}: definition must contain exactly "
            "'nullable' and 'allowed_values'."
        )

    if not isinstance(definition["nullable"], bool):
        raise ControlledVocabularyError(
            f"{field_name}.nullable must be boolean."
        )

    allowed_values = definition["allowed_values"]

    if not isinstance(allowed_values, list) or not allowed_values:
        raise ControlledVocabularyError(
            f"{field_name}.allowed_values must be a non-empty array."
        )

    if not all(
        isinstance(value, str) and value
        for value in allowed_values
    ):
        raise ControlledVocabularyError(
            f"{field_name}.allowed_values must contain "
            "non-empty strings only."
        )

    if len(allowed_values) != len(set(allowed_values)):
        raise ControlledVocabularyError(
            f"{field_name}.allowed_values contains duplicates."
        )


def resolve_field(
    field_name: str,
    spec: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Resolve the exact controlled-vocabulary contract for one governed field."""

    if not isinstance(field_name, str) or not field_name:
        raise ControlledVocabularyError(
            "field_name must be a non-empty string."
        )

    resolved_spec = load_spec() if spec is None else spec

    if spec is not None:
        validate_spec(resolved_spec)

    fields = resolved_spec["fields"]

    if field_name not in fields:
        raise ControlledVocabularyError(
            f"Field is not governed by the controlled-vocabulary "
            f"specification: {field_name!r}"
        )

    definition = fields[field_name]

    return {
        "field_name": field_name,
        "nullable": definition["nullable"],
        "allowed_values": tuple(definition["allowed_values"]),
        "specification_id": resolved_spec["specification_id"],
        "specification_version": resolved_spec["specification_version"],
    }
