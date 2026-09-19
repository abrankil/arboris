#!/usr/bin/env python3
"""Build a derived SQLite reference database from canonical botanical JSON.

The database is a runtime/profiling artifact, never an editorial source of truth.
The physical schema is intentionally marked as a prototype while the pilot's
end-to-end persistence requirements are still being validated.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
BOTANICAL_DIR = REPO_ROOT / "data" / "botanical"
DEFAULT_OUTPUT = REPO_ROOT / "build" / "arboris_reference.sqlite3"
SCHEMA_VERSION = 1


def read_json(name: str) -> Any:
    with (BOTANICAL_DIR / name).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def payload(row: dict[str, Any]) -> str:
    return json.dumps(row, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def create_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        PRAGMA foreign_keys = ON;

        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        ) WITHOUT ROWID;

        CREATE TABLE species (
            species_id TEXT PRIMARY KEY,
            scientific_name TEXT NOT NULL,
            common_name TEXT,
            family TEXT,
            pilot_status TEXT,
            payload_json TEXT NOT NULL
        ) WITHOUT ROWID;

        CREATE TABLE characters (
            character_id TEXT PRIMARY KEY,
            group_name TEXT,
            character_name TEXT NOT NULL,
            pilot_status TEXT,
            payload_json TEXT NOT NULL
        ) WITHOUT ROWID;

        CREATE TABLE sources (
            source_id TEXT PRIMARY KEY,
            source_type TEXT,
            reference_text TEXT,
            payload_json TEXT NOT NULL
        ) WITHOUT ROWID;

        CREATE TABLE species_characters (
            species_id TEXT NOT NULL,
            character_id TEXT NOT NULL,
            source_id TEXT,
            diagnostic_power TEXT,
            confidence TEXT,
            image_detectable TEXT,
            field_verifiable TEXT,
            observation_cost TEXT,
            interaction_safety TEXT,
            payload_json TEXT NOT NULL,
            PRIMARY KEY (species_id, character_id),
            FOREIGN KEY (species_id) REFERENCES species(species_id),
            FOREIGN KEY (character_id) REFERENCES characters(character_id),
            FOREIGN KEY (source_id) REFERENCES sources(source_id)
        ) WITHOUT ROWID;

        CREATE TABLE species_character_states (
            species_id TEXT NOT NULL,
            character_id TEXT NOT NULL,
            state TEXT NOT NULL,
            PRIMARY KEY (species_id, character_id, state),
            FOREIGN KEY (species_id, character_id)
                REFERENCES species_characters(species_id, character_id)
                ON DELETE CASCADE
        ) WITHOUT ROWID;

        CREATE TABLE photos (
            photo_id TEXT PRIMARY KEY,
            species_id TEXT NOT NULL,
            individual_id TEXT,
            organ_structure TEXT,
            evidence_type TEXT,
            diagnostic_quality TEXT,
            payload_json TEXT NOT NULL,
            FOREIGN KEY (species_id) REFERENCES species(species_id)
        ) WITHOUT ROWID;

        CREATE TABLE model_errors (
            error_id TEXT PRIMARY KEY,
            species_id_real TEXT,
            individual_id TEXT,
            payload_json TEXT NOT NULL,
            FOREIGN KEY (species_id_real) REFERENCES species(species_id)
        ) WITHOUT ROWID;

        CREATE INDEX idx_species_characters_character
            ON species_characters(character_id, species_id);

        CREATE INDEX idx_species_character_states_lookup
            ON species_character_states(character_id, state, species_id);

        CREATE INDEX idx_photos_species
            ON photos(species_id);

        CREATE INDEX idx_photos_individual
            ON photos(individual_id);

        CREATE INDEX idx_model_errors_species
            ON model_errors(species_id_real);
        """
    )
    connection.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")


def populate(connection: sqlite3.Connection) -> None:
    metadata = read_json("metadata.json")
    species = read_json("species.json")
    characters = read_json("characters.json")
    sources = read_json("sources.json")
    relations = read_json("species_characters.json")
    photos = read_json("photos.json")
    model_errors = read_json("model_errors.json")

    connection.executemany(
        "INSERT INTO metadata(key, value) VALUES (?, ?)",
        [
            (str(key), json.dumps(value, ensure_ascii=False, separators=(",", ":")))
            for key, value in metadata.items()
        ],
    )

    connection.executemany(
        """
        INSERT INTO species(
            species_id, scientific_name, common_name, family, pilot_status, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (
                row["species_id"],
                row["nombre_cientifico"],
                row.get("nombre_comun"),
                row.get("familia"),
                row.get("estado_piloto"),
                payload(row),
            )
            for row in species
        ],
    )

    connection.executemany(
        """
        INSERT INTO characters(
            character_id, group_name, character_name, pilot_status, payload_json
        ) VALUES (?, ?, ?, ?, ?)
        """,
        [
            (
                row["caracter_id"],
                row.get("grupo"),
                row["nombre_caracter"],
                row.get("estado_piloto"),
                payload(row),
            )
            for row in characters
        ],
    )

    connection.executemany(
        """
        INSERT INTO sources(source_id, source_type, reference_text, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        [
            (
                row["fuente_id"],
                row.get("tipo"),
                row.get("referencia"),
                payload(row),
            )
            for row in sources
        ],
    )

    relation_rows = []
    state_rows = []
    for row in relations:
        relation_rows.append(
            (
                row["species_id"],
                row["caracter_id"],
                row.get("fuente_id"),
                row.get("poder_diagnostico"),
                row.get("confianza"),
                row.get("detectable_imagen"),
                row.get("verificable_campo"),
                row.get("costo_observacion"),
                row.get("interaction_safety"),
                payload(row),
            )
        )
        states = row.get("estado_esperado") or []
        if not isinstance(states, list):
            states = [states]
        for state in states:
            if state is not None and str(state).strip():
                state_rows.append(
                    (row["species_id"], row["caracter_id"], str(state).strip())
                )

    connection.executemany(
        """
        INSERT INTO species_characters(
            species_id, character_id, source_id, diagnostic_power, confidence,
            image_detectable, field_verifiable, observation_cost,
            interaction_safety, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        relation_rows,
    )

    connection.executemany(
        """
        INSERT INTO species_character_states(species_id, character_id, state)
        VALUES (?, ?, ?)
        """,
        state_rows,
    )

    connection.executemany(
        """
        INSERT INTO photos(
            photo_id, species_id, individual_id, organ_structure, evidence_type,
            diagnostic_quality, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                row["photo_id"],
                row["species_id"],
                row.get("individual_id"),
                row.get("organo_estructura"),
                row.get("tipo_evidencia"),
                row.get("calidad_diagnostica"),
                payload(row),
            )
            for row in photos
        ],
    )

    connection.executemany(
        """
        INSERT INTO model_errors(error_id, species_id_real, individual_id, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        [
            (
                row["error_id"],
                row.get("species_id_real"),
                row.get("individual_id"),
                payload(row),
            )
            for row in model_errors
        ],
    )


def build_database(output: Path, force: bool = False) -> Path:
    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    if output.exists():
        if not force:
            raise FileExistsError(
                f"output already exists: {output}; use --force to replace it"
            )
        output.unlink()

    connection = sqlite3.connect(output)
    try:
        with connection:
            create_schema(connection)
            populate(connection)
        connection.execute("PRAGMA optimize")
    except Exception:
        connection.close()
        if output.exists():
            output.unlink()
        raise
    finally:
        try:
            connection.close()
        except Exception:
            pass

    return output


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Build the derived Árboris botanical SQLite reference prototype."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="output database path (default: build/arboris_reference.sqlite3)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="replace an existing output database",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    output = build_database(args.output, force=args.force)
    print(output)


if __name__ == "__main__":
    main()
