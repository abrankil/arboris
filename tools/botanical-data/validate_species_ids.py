import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPECIES_FILE = ROOT / "data" / "botanical" / "species.json"

CANONICAL_ID_RE = re.compile(r"^SP-\d{3}$")
LEGACY_RUNTIME_ID_RE = re.compile(r"^SP\d{3}$")


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def legacy_runtime_id(canonical_id: str) -> str:
    """
    Devuelve la equivalencia histórica usada por algunos prototipos.

    SP-001 -> SP001

    Esta conversión existe solo como comprobación de compatibilidad.
    El motor canónico de Árboris debe usar species_id directamente.
    """
    return canonical_id.replace("-", "")


def main():
    print("\nÁRBORIS — VALIDACIÓN DE IDs DE ESPECIE")
    print("=" * 72)

    errors = []

    if not SPECIES_FILE.exists():
        raise FileNotFoundError(f"No existe: {SPECIES_FILE}")

    species = load_json(SPECIES_FILE)

    if not isinstance(species, list):
        raise ValueError("species.json debe contener un array JSON.")

    canonical_ids = set()
    legacy_ids = set()
    scientific_names = set()
    results = []

    for index, record in enumerate(species, start=1):
        if not isinstance(record, dict):
            errors.append(
                f"Registro {index}: debe ser un objeto JSON."
            )
            continue

        canonical_id = record.get("species_id")
        scientific_name = record.get("nombre_cientifico")

        if not isinstance(canonical_id, str) or not canonical_id:
            errors.append(
                f"Registro {index}: species_id ausente o inválido."
            )
            continue

        if not CANONICAL_ID_RE.fullmatch(canonical_id):
            errors.append(
                f"{canonical_id}: formato inválido; se espera SP-000."
            )

        if canonical_id in canonical_ids:
            errors.append(
                f"species_id duplicado: {canonical_id}"
            )
        canonical_ids.add(canonical_id)

        compatibility_id = legacy_runtime_id(canonical_id)

        if not LEGACY_RUNTIME_ID_RE.fullmatch(compatibility_id):
            errors.append(
                f"{canonical_id}: equivalencia histórica inválida "
                f"({compatibility_id})."
            )

        if compatibility_id in legacy_ids:
            errors.append(
                f"Equivalencia histórica duplicada: {compatibility_id}"
            )
        legacy_ids.add(compatibility_id)

        if not isinstance(scientific_name, str) or not scientific_name.strip():
            errors.append(
                f"{canonical_id}: nombre_cientifico ausente o inválido."
            )
            normalized_name = None
        else:
            normalized_name = scientific_name.strip().casefold()
            if normalized_name in scientific_names:
                errors.append(
                    f"nombre_cientifico duplicado: {scientific_name}"
                )
            scientific_names.add(normalized_name)

        results.append(
            {
                "canonical_id": canonical_id,
                "legacy_id": compatibility_id,
                "scientific_name": scientific_name,
            }
        )

    print()

    for result in results:
        print(
            f"{result['canonical_id']} | "
            f"{result['scientific_name']} | "
            f"compatibilidad histórica: {result['legacy_id']}"
        )

    print("\n" + "=" * 72)
    print(f"Especies comprobadas: {len(results)}")
    print(f"Conflictos de ID/datos: {len(errors)}")

    if errors:
        print("\nDETALLE DE CONFLICTOS:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print(
        "\nOK — Todos los species_id canónicos son válidos y únicos."
    )
    print(
        "OK — La equivalencia histórica SP-00X -> SP00X es determinista "
        "y no presenta colisiones."
    )
    print(
        "\nNota: data/species, species_pilot.json y logic.mjs no participan "
        "en esta validación."
    )
    print(
        "El motor canónico debe usar species_id (SP-00X) directamente; "
        "SP00X queda solo como compatibilidad con prototipos antiguos."
    )


if __name__ == "__main__":
    main()
