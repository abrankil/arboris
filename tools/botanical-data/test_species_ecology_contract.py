#!/usr/bin/env python3
"""Unit tests for the SpeciesEcologyFact validation contract."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
VALIDATOR_PATH = REPO_ROOT / "tools" / "botanical-data" / "validate_master_export.py"


def load_validator_module():
    spec = importlib.util.spec_from_file_location(
        "arboris_master_validator",
        VALIDATOR_PATH,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("could not load validate_master_export.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SpeciesEcologyContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.validator = load_validator_module()
        cls.species_ids = {"SP-001", "SP-004", "SP-005", "SP-006"}
        cls.source_ids = {"F-010", "F-013", "F-014", "F-016", "F-019"}

    def validate(self, records):
        errors = []
        warnings = []
        self.validator.validate_species_ecology(
            records,
            species_id_set=self.species_ids,
            source_id_set=self.source_ids,
            errors=errors,
            warnings=warnings,
        )
        return errors, warnings

    def base_fact(self, **overrides):
        fact = {
            "ecology_fact_id": "ECO-0001",
            "species_id": "SP-006",
            "dimension": "fenologia_floracion",
            "valor_texto": "octubre a enero",
            "valor_codificado": ["10", "11", "12", "01"],
            "valor_min": None,
            "valor_max": None,
            "unidad": None,
            "alcance_tipo": None,
            "alcance_valor": None,
            "fuente_ids": ["F-019"],
            "estado": "activo",
            "notas": None,
        }
        fact.update(overrides)
        return fact

    def test_empty_dataset_is_valid(self):
        errors, warnings = self.validate([])
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])

    def test_invalid_id_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(ecology_fact_id="ECO-1"),
        ])
        self.assertTrue(any("ecology_fact_id inválido" in error for error in errors))

    def test_unknown_species_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(species_id="SP-999"),
        ])
        self.assertTrue(any("species_id inexistente" in error for error in errors))

    def test_empty_source_ids_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(fuente_ids=[]),
        ])
        self.assertTrue(any("array no vacío" in error for error in errors))

    def test_unknown_source_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(fuente_ids=["F-999"]),
        ])
        self.assertTrue(any("fuente_id inexistente" in error for error in errors))

    def test_altitude_min_above_max_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(
                dimension="rango_altitudinal",
                valor_texto=None,
                valor_codificado=[],
                valor_min=2000,
                valor_max=10,
                unidad="m",
            ),
        ])
        self.assertTrue(any("valor_min no puede superar valor_max" in error for error in errors))

    def test_altitude_requires_meter_unit(self):
        errors, _ = self.validate([
            self.base_fact(
                dimension="rango_altitudinal",
                valor_texto=None,
                valor_codificado=[],
                valor_min=10,
                valor_max=2000,
                unidad="km",
            ),
        ])
        self.assertTrue(any("requiere unidad='m'" in error for error in errors))

    def test_invalid_month_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(valor_codificado=["10", "13"]),
        ])
        self.assertTrue(any("mes inválido" in error for error in errors))

    def test_duplicate_month_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(valor_codificado=["10", "10"]),
        ])
        self.assertTrue(any("mes duplicado" in error for error in errors))

    def test_invalid_udec_distribution_code_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(
                dimension="distribucion_geografica",
                valor_texto=None,
                valor_codificado=["VAL", "XXX"],
            ),
        ])
        self.assertTrue(any("código de distribución UdeC inválido" in error for error in errors))

    def test_duplicate_semantic_fact_ignores_text_variation_when_months_match(self):
        first = self.base_fact(
            ecology_fact_id="ECO-0001",
            valor_texto="octubre a enero",
            fuente_ids=["F-019"],
        )
        second = self.base_fact(
            ecology_fact_id="ECO-0002",
            valor_texto="octubre-enero",
            fuente_ids=["F-014"],
        )
        errors, _ = self.validate([first, second])
        self.assertTrue(any("ECOLOGY_DUPLICATE_FACT" in error for error in errors))

    def test_duplicate_semantic_fact_ignores_source_difference(self):
        first = self.base_fact(
            ecology_fact_id="ECO-0001",
            fuente_ids=["F-019"],
        )
        second = self.base_fact(
            ecology_fact_id="ECO-0002",
            fuente_ids=["F-014"],
        )
        errors, _ = self.validate([first, second])
        self.assertTrue(any("ECOLOGY_DUPLICATE_FACT" in error for error in errors))

    def test_multiple_active_altitude_facts_same_scope_are_blocked(self):
        first = self.base_fact(
            ecology_fact_id="ECO-0001",
            species_id="SP-004",
            dimension="rango_altitudinal",
            valor_texto=None,
            valor_codificado=[],
            valor_min=0,
            valor_max=1000,
            unidad="m",
            fuente_ids=["F-010"],
        )
        second = self.base_fact(
            ecology_fact_id="ECO-0002",
            species_id="SP-004",
            dimension="rango_altitudinal",
            valor_texto=None,
            valor_codificado=[],
            valor_min=1000,
            valor_max=2000,
            unidad="m",
            fuente_ids=["F-010"],
        )
        errors, _ = self.validate([first, second])
        self.assertTrue(
            any("ECOLOGY_UNRESOLVED_MULTIPLE_FACTS" in error for error in errors)
        )

    def test_multiple_distinct_habitats_are_allowed(self):
        first = self.base_fact(
            ecology_fact_id="ECO-0001",
            species_id="SP-005",
            dimension="habitat",
            valor_texto="matorral mediterráneo asoleado",
            valor_codificado=[],
            fuente_ids=["F-013"],
        )
        second = self.base_fact(
            ecology_fact_id="ECO-0002",
            species_id="SP-005",
            dimension="habitat",
            valor_texto="laderas pedregosas",
            valor_codificado=[],
            fuente_ids=["F-014"],
        )
        errors, _ = self.validate([first, second])
        self.assertFalse(any("ECOLOGY_UNRESOLVED_MULTIPLE_FACTS" in error for error in errors))

    def test_incomplete_scope_pair_is_rejected(self):
        errors, _ = self.validate([
            self.base_fact(
                alcance_tipo="geografico",
                alcance_valor=None,
            ),
        ])
        self.assertTrue(any("deben estar ambos definidos" in error for error in errors))

    def test_multiple_active_phenology_facts_warn(self):
        first = self.base_fact(
            ecology_fact_id="ECO-0001",
            valor_codificado=["10", "11", "12", "01"],
        )
        second = self.base_fact(
            ecology_fact_id="ECO-0002",
            valor_texto="noviembre a enero",
            valor_codificado=["11", "12", "01"],
            fuente_ids=["F-014"],
        )
        errors, warnings = self.validate([first, second])
        self.assertFalse(any("ECOLOGY_UNRESOLVED_MULTIPLE_FACTS" in error for error in errors))
        self.assertTrue(any("ECOLOGY_MULTIPLE_PHENOLOGY_FACTS" in warning for warning in warnings))


if __name__ == "__main__":
    unittest.main()
