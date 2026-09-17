#!/usr/bin/env python3
"""Validate the derived SQLite reference prototype and its critical indexes."""

from __future__ import annotations

import importlib.util
import sqlite3
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BUILDER_PATH = REPO_ROOT / "tools" / "botanical-data" / "build_reference_sqlite.py"


def load_builder_module():
    spec = importlib.util.spec_from_file_location("arboris_reference_builder", BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("could not load build_reference_sqlite.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def plan_text(connection: sqlite3.Connection, sql: str, params: tuple) -> str:
    return " | ".join(
        str(row[3]) for row in connection.execute(f"EXPLAIN QUERY PLAN {sql}", params)
    )


class ReferenceSQLiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.builder = load_builder_module()
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.database_path = Path(cls.temp_dir.name) / "reference.sqlite3"
        cls.builder.build_database(cls.database_path)
        cls.connection = sqlite3.connect(cls.database_path)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.connection.close()
        cls.temp_dir.cleanup()

    def test_core_counts_match_canonical_export(self) -> None:
        self.assertEqual(
            self.connection.execute("SELECT COUNT(*) FROM species").fetchone()[0], 6
        )
        self.assertEqual(
            self.connection.execute("SELECT COUNT(*) FROM characters").fetchone()[0], 24
        )
        self.assertEqual(
            self.connection.execute("SELECT COUNT(*) FROM species_characters").fetchone()[0],
            89,
        )
        self.assertGreater(
            self.connection.execute(
                "SELECT COUNT(*) FROM species_character_states"
            ).fetchone()[0],
            0,
        )

    def test_expected_state_is_exploded_for_fast_filtering(self) -> None:
        states = [
            row[0]
            for row in self.connection.execute(
                """
                SELECT state
                FROM species_character_states
                WHERE species_id = ? AND character_id = ?
                ORDER BY state
                """,
                ("SP-001", "CH-003"),
            )
        ]
        self.assertEqual(states, ["entero"])

    def test_character_first_relation_query_uses_secondary_index(self) -> None:
        plan = plan_text(
            self.connection,
            "SELECT species_id FROM species_characters WHERE character_id = ?",
            ("CH-003",),
        )
        self.assertIn("idx_species_characters_character", plan)

    def test_character_state_candidate_query_uses_lookup_index(self) -> None:
        plan = plan_text(
            self.connection,
            """
            SELECT species_id
            FROM species_character_states
            WHERE character_id = ? AND state = ?
            """,
            ("CH-003", "entero"),
        )
        self.assertIn("idx_species_character_states_lookup", plan)

    def test_photo_lookup_uses_species_index(self) -> None:
        plan = plan_text(
            self.connection,
            "SELECT photo_id FROM photos WHERE species_id = ?",
            ("SP-001",),
        )
        self.assertIn("idx_photos_species", plan)

    def test_database_keeps_source_provenance_metadata(self) -> None:
        value = self.connection.execute(
            "SELECT value FROM metadata WHERE key = 'source_sha256'"
        ).fetchone()
        self.assertIsNotNone(value)
        self.assertTrue(value[0].startswith('"') and value[0].endswith('"'))


if __name__ == "__main__":
    unittest.main()
