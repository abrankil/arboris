#!/usr/bin/env python3
"""Smoke tests for the compact botanical query CLI."""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
QUERY_TOOL = REPO_ROOT / "tools" / "botanical-data" / "query_botanical.py"


def run_query(*args: str) -> tuple[dict | list, str]:
    completed = subprocess.run(
        [sys.executable, str(QUERY_TOOL), *args],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(completed.stdout), completed.stdout


class QueryBotanicalTests(unittest.TestCase):
    def test_stats_reports_canonical_dataset(self) -> None:
        result, _ = run_query("stats")
        self.assertEqual(result["master_version"], "2.0.0")
        self.assertEqual(result["counts"]["species"], 6)
        self.assertEqual(result["counts"]["species_characters"], 89)
        self.assertGreater(result["canonical_json_bytes"], 0)

    def test_legacy_species_id_is_normalized_for_read_only_queries(self) -> None:
        result, _ = run_query("species", "SP001")
        self.assertEqual(result["species_id"], "SP-001")

    def test_relation_returns_joined_context_without_persisting_a_view(self) -> None:
        result, _ = run_query("relation", "SP-001", "CH-003", "--with-source")
        self.assertEqual(result["species"]["species_id"], "SP-001")
        self.assertEqual(result["character"]["caracter_id"], "CH-003")
        self.assertEqual(result["relation"]["species_id"], "SP-001")
        self.assertIn("source", result)

    def test_compare_can_limit_candidate_species(self) -> None:
        result, _ = run_query("compare", "CH-003", "SP-001", "SP-002")
        self.assertEqual(result["character"]["caracter_id"], "CH-003")
        self.assertEqual(len(result["rows"]), 2)

    def test_pretty_flag_is_accepted_after_subcommand(self) -> None:
        result, raw = run_query("stats", "--pretty")
        self.assertEqual(result["counts"]["species"], 6)
        self.assertIn("\n  ", raw)


if __name__ == "__main__":
    unittest.main()
