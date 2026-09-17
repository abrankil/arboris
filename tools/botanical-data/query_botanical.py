#!/usr/bin/env python3
"""Compact read-only queries over Árboris canonical botanical JSON.

This tool is intentionally a reader, not a second source of truth. It returns
small payloads for humans and AI agents without requiring them to load all
canonical tables or the denormalized species cards.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
BOTANICAL_DIR = REPO_ROOT / "data" / "botanical"

CANONICAL_FILES = (
    "metadata.json",
    "species.json",
    "characters.json",
    "species_characters.json",
    "sources.json",
    "glossary.json",
    "photos.json",
    "model_errors.json",
)


def read_json(name: str) -> Any:
    path = BOTANICAL_DIR / name
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def normalize_species_id(value: str) -> str:
    value = value.strip().upper()
    legacy = re.fullmatch(r"SP(\d{3})", value)
    if legacy:
        return f"SP-{legacy.group(1)}"
    return value


def load_dataset() -> dict[str, Any]:
    metadata = read_json("metadata.json")
    species = read_json("species.json")
    characters = read_json("characters.json")
    relations = read_json("species_characters.json")
    sources = read_json("sources.json")
    photos = read_json("photos.json")
    model_errors = read_json("model_errors.json")

    return {
        "metadata": metadata,
        "species": species,
        "characters": characters,
        "relations": relations,
        "sources": sources,
        "photos": photos,
        "model_errors": model_errors,
        "species_by_id": {row["species_id"]: row for row in species},
        "characters_by_id": {row["caracter_id"]: row for row in characters},
        "relations_by_pair": {
            (row["species_id"], row["caracter_id"]): row for row in relations
        },
        "sources_by_id": {row["fuente_id"]: row for row in sources},
    }


def species_summary(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "species_id": row.get("species_id"),
        "nombre_cientifico": row.get("nombre_cientifico"),
        "nombre_comun": row.get("nombre_comun"),
        "familia": row.get("familia"),
        "habito": row.get("habito"),
        "estado_piloto": row.get("estado_piloto"),
    }


def character_summary(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "caracter_id": row.get("caracter_id"),
        "grupo": row.get("grupo"),
        "nombre_caracter": row.get("nombre_caracter"),
        "tipo_dato": row.get("tipo_dato"),
        "estados_permitidos": row.get("estados_permitidos"),
        "observable_foto": row.get("observable_foto"),
        "observable_campo": row.get("observable_campo"),
        "estado_piloto": row.get("estado_piloto"),
    }


def relation_summary(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "species_id": row.get("species_id"),
        "caracter_id": row.get("caracter_id"),
        "estado_esperado": row.get("estado_esperado"),
        "variabilidad": row.get("variabilidad"),
        "fuente_id": row.get("fuente_id"),
        "detectable_imagen": row.get("detectable_imagen"),
        "verificable_campo": row.get("verificable_campo"),
        "poder_diagnostico": row.get("poder_diagnostico"),
        "interaction_safety": row.get("interaction_safety"),
        "costo_observacion": row.get("costo_observacion"),
        "confianza": row.get("confianza"),
        "notas": row.get("notas"),
    }


def fail(message: str, exit_code: int = 2) -> None:
    print(json.dumps({"error": message}, ensure_ascii=False, separators=(",", ":")))
    raise SystemExit(exit_code)


def command_stats(dataset: dict[str, Any]) -> dict[str, Any]:
    file_sizes = {
        name: (BOTANICAL_DIR / name).stat().st_size for name in CANONICAL_FILES
    }
    return {
        "master_version": dataset["metadata"].get("master_version"),
        "schema_version": dataset["metadata"].get("schema_version"),
        "source_file": dataset["metadata"].get("source_file"),
        "counts": {
            "species": len(dataset["species"]),
            "characters": len(dataset["characters"]),
            "species_characters": len(dataset["relations"]),
            "sources": len(dataset["sources"]),
            "photos": len(dataset["photos"]),
            "model_errors": len(dataset["model_errors"]),
        },
        "canonical_json_bytes": sum(file_sizes.values()),
        "file_bytes": file_sizes,
    }


def command_species(dataset: dict[str, Any], species_id: str | None) -> Any:
    if species_id is None:
        return [species_summary(row) for row in dataset["species"]]

    species_id = normalize_species_id(species_id)
    row = dataset["species_by_id"].get(species_id)
    if row is None:
        fail(f"unknown species_id: {species_id}")
    return row


def command_character(dataset: dict[str, Any], character_id: str | None) -> Any:
    if character_id is None:
        return [character_summary(row) for row in dataset["characters"]]

    character_id = character_id.strip().upper()
    row = dataset["characters_by_id"].get(character_id)
    if row is None:
        fail(f"unknown character_id: {character_id}")
    return row


def command_relation(
    dataset: dict[str, Any], species_id: str, character_id: str, with_source: bool
) -> dict[str, Any]:
    species_id = normalize_species_id(species_id)
    character_id = character_id.strip().upper()

    species = dataset["species_by_id"].get(species_id)
    character = dataset["characters_by_id"].get(character_id)
    if species is None:
        fail(f"unknown species_id: {species_id}")
    if character is None:
        fail(f"unknown character_id: {character_id}")

    relation = dataset["relations_by_pair"].get((species_id, character_id))
    result = {
        "species": species_summary(species),
        "character": character_summary(character),
        "relation": relation_summary(relation),
    }
    if with_source and relation is not None:
        result["source"] = dataset["sources_by_id"].get(relation.get("fuente_id"))
    return result


def command_compare(
    dataset: dict[str, Any],
    character_id: str,
    species_ids: list[str],
    with_source: bool,
) -> dict[str, Any]:
    character_id = character_id.strip().upper()
    character = dataset["characters_by_id"].get(character_id)
    if character is None:
        fail(f"unknown character_id: {character_id}")

    selected_ids = (
        [normalize_species_id(item) for item in species_ids]
        if species_ids
        else [row["species_id"] for row in dataset["species"]]
    )

    rows = []
    for species_id in selected_ids:
        species = dataset["species_by_id"].get(species_id)
        if species is None:
            fail(f"unknown species_id: {species_id}")
        relation = dataset["relations_by_pair"].get((species_id, character_id))
        item: dict[str, Any] = {
            "species": species_summary(species),
            "relation": relation_summary(relation),
        }
        if with_source and relation is not None:
            item["source"] = dataset["sources_by_id"].get(relation.get("fuente_id"))
        rows.append(item)

    return {"character": character_summary(character), "rows": rows}


def command_source(dataset: dict[str, Any], source_id: str) -> dict[str, Any]:
    source_id = source_id.strip().upper()
    row = dataset["sources_by_id"].get(source_id)
    if row is None:
        fail(f"unknown source_id: {source_id}")
    return row


def command_photos(dataset: dict[str, Any], species_id: str | None) -> list[dict[str, Any]]:
    rows = dataset["photos"]
    if species_id is not None:
        canonical_id = normalize_species_id(species_id)
        if canonical_id not in dataset["species_by_id"]:
            fail(f"unknown species_id: {canonical_id}")
        rows = [row for row in rows if row.get("species_id") == canonical_id]
    return rows


def command_errors(dataset: dict[str, Any], species_id: str | None) -> list[dict[str, Any]]:
    rows = dataset["model_errors"]
    if species_id is not None:
        canonical_id = normalize_species_id(species_id)
        if canonical_id not in dataset["species_by_id"]:
            fail(f"unknown species_id: {canonical_id}")
        rows = [row for row in rows if row.get("species_id_real") == canonical_id]
    return rows


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Read compact slices of Árboris canonical botanical data."
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="pretty-print JSON; may be placed before or after the command",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("stats", help="show dataset counts and canonical JSON payload sizes")

    species_parser = subparsers.add_parser("species", help="list species or show one species")
    species_parser.add_argument("species_id", nargs="?")

    character_parser = subparsers.add_parser(
        "character", help="list character summaries or show one character"
    )
    character_parser.add_argument("character_id", nargs="?")

    relation_parser = subparsers.add_parser(
        "relation", help="show one species × character relation"
    )
    relation_parser.add_argument("species_id")
    relation_parser.add_argument("character_id")
    relation_parser.add_argument("--with-source", action="store_true")

    compare_parser = subparsers.add_parser(
        "compare", help="compare expected states for one character across species"
    )
    compare_parser.add_argument("character_id")
    compare_parser.add_argument("species_ids", nargs="*")
    compare_parser.add_argument("--with-source", action="store_true")

    source_parser = subparsers.add_parser("source", help="show one source record")
    source_parser.add_argument("source_id")

    photos_parser = subparsers.add_parser(
        "photos", help="list photo metadata, optionally filtered by species"
    )
    photos_parser.add_argument("species_id", nargs="?")

    errors_parser = subparsers.add_parser(
        "errors", help="list documented model errors, optionally filtered by real species"
    )
    errors_parser.add_argument("species_id", nargs="?")

    return parser


def main() -> None:
    parser = build_parser()
    raw_args = sys.argv[1:]
    pretty = "--pretty" in raw_args
    args = parser.parse_args([item for item in raw_args if item != "--pretty"])
    dataset = load_dataset()

    if args.command == "stats":
        result = command_stats(dataset)
    elif args.command == "species":
        result = command_species(dataset, args.species_id)
    elif args.command == "character":
        result = command_character(dataset, args.character_id)
    elif args.command == "relation":
        result = command_relation(
            dataset, args.species_id, args.character_id, args.with_source
        )
    elif args.command == "compare":
        result = command_compare(
            dataset, args.character_id, args.species_ids, args.with_source
        )
    elif args.command == "source":
        result = command_source(dataset, args.source_id)
    elif args.command == "photos":
        result = command_photos(dataset, args.species_id)
    elif args.command == "errors":
        result = command_errors(dataset, args.species_id)
    else:
        fail(f"unsupported command: {args.command}")

    if pretty:
        json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    else:
        json.dump(result, sys.stdout, ensure_ascii=False, separators=(",", ":"))
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
