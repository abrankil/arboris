from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BOTANICAL_DIR = ROOT / "data" / "botanical"
SPECIES_DIR = ROOT / "data" / "species"

CANONICAL_FILES = {
    "metadata": "metadata.json",
    "species": "species.json",
    "characters": "characters.json",
    "species_characters": "species_characters.json",
    "sources": "sources.json",
    "photos": "photos.json",
    "glossary": "glossary.json",
    "model_errors": "model_errors.json",
    "species_ecology": "species_ecology.json",
}


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def slugify(value: str) -> str:
    text = unicodedata.normalize("NFKD", value)
    text = "".join(
        char for char in text
        if not unicodedata.combining(char)
    )
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def runtime_species_id(canonical_id: str) -> str:
    return canonical_id.replace("-", "")


def index_unique(records, field, label, errors):
    result = {}

    for i, record in enumerate(records, start=1):
        if not isinstance(record, dict):
            errors.append(f"{label}[{i}] no es un objeto.")
            continue

        value = record.get(field)

        if not isinstance(value, str) or not value:
            errors.append(
                f"{label}[{i}] no tiene {field} válido."
            )
            continue

        if value in result:
            errors.append(
                f"{label}: {field} duplicado: {value}"
            )
            continue

        result[value] = record

    return result


def expected_filename(species_record):
    return (
        f"{runtime_species_id(species_record['species_id'])}_"
        f"{slugify(species_record['nombre_cientifico'])}.json"
    )


def compare_exact(label, actual, expected, errors):
    if actual != expected:
        errors.append(f"{label}: no coincide con los JSON canónicos.")


def main():
    print("\nÁRBORIS — VALIDACIÓN DE FICHAS CANÓNICAS POR ESPECIE")
    print("=" * 72)

    errors = []
    warnings = []

    canonical = {}

    for key, filename in CANONICAL_FILES.items():
        path = BOTANICAL_DIR / filename

        if not path.exists():
            errors.append(
                f"Falta archivo canónico requerido: {path.relative_to(ROOT)}"
            )
            continue

        try:
            canonical[key] = read_json(path)
        except Exception as exc:
            errors.append(
                f"No se pudo leer {path.relative_to(ROOT)}: {exc}"
            )

    if errors:
        finish(errors, warnings)

    metadata = canonical["metadata"]
    species = canonical["species"]
    characters = canonical["characters"]
    relations = canonical["species_characters"]
    sources = canonical["sources"]
    photos = canonical["photos"]
    glossary = canonical["glossary"]
    model_errors = canonical["model_errors"]
    species_ecology = canonical["species_ecology"]

    if not isinstance(metadata, dict):
        errors.append("metadata.json debe ser un objeto.")

    for key in (
        "species",
        "characters",
        "species_characters",
        "sources",
        "photos",
        "glossary",
        "model_errors",
        "species_ecology",
    ):
        if not isinstance(canonical[key], list):
            errors.append(
                f"{CANONICAL_FILES[key]} debe ser un array."
            )

    if errors:
        finish(errors, warnings)

    character_by_id = index_unique(
        characters,
        "caracter_id",
        "characters.json",
        errors,
    )
    source_by_id = index_unique(
        sources,
        "fuente_id",
        "sources.json",
        errors,
    )

    if errors:
        finish(errors, warnings)

    computable_status = metadata.get("computable_status")

    expected_files = {
        expected_filename(record): record
        for record in species
    }

    actual_files = {
        path.name: path
        for path in SPECIES_DIR.glob("SP*.json")
    }

    missing = sorted(set(expected_files) - set(actual_files))
    extra = sorted(set(actual_files) - set(expected_files))

    for filename in missing:
        errors.append(f"Falta ficha esperada: data/species/{filename}")

    for filename in extra:
        errors.append(
            f"Ficha no derivada del Master actual: data/species/{filename}"
        )

    total_characters = 0
    total_photos = 0

    for filename, species_record in expected_files.items():
        path = actual_files.get(filename)
        if path is None:
            continue

        try:
            card = read_json(path)
        except Exception as exc:
            errors.append(f"{filename}: JSON inválido: {exc}")
            continue

        if not isinstance(card, dict):
            errors.append(f"{filename}: la ficha debe ser un objeto.")
            continue

        species_id = species_record["species_id"]

        expected_generated_from = {
            "master_name": metadata.get("master_name"),
            "master_version": metadata.get("master_version"),
            "schema_version": metadata.get("schema_version"),
            "source_file": metadata.get("source_file"),
            "source_sha256": metadata.get("source_sha256"),
            "source_of_truth": metadata.get("source_of_truth"),
        }

        compare_exact(
            f"{filename}/view_schema",
            card.get("view_schema"),
            "arboris.species-card.v3",
            errors,
        )
        compare_exact(
            f"{filename}/generated_from",
            card.get("generated_from"),
            expected_generated_from,
            errors,
        )
        compare_exact(
            f"{filename}/species",
            card.get("species"),
            species_record,
            errors,
        )

        species_relations = [
            relation
            for relation in relations
            if relation.get("species_id") == species_id
        ]

        expected_character_entries = []
        used_source_ids = set()
        expected_states = set()

        for relation in species_relations:
            character_id = relation.get("caracter_id")
            character = character_by_id.get(character_id)

            if character is None:
                errors.append(
                    f"{species_id}: carácter inexistente {character_id}"
                )
                continue

            source_id = relation.get("fuente_id")
            source = None

            if source_id:
                source = source_by_id.get(source_id)
                if source is None:
                    errors.append(
                        f"{species_id}/{character_id}: "
                        f"fuente inexistente {source_id}"
                    )
                else:
                    used_source_ids.add(source_id)

            states = relation.get("estado_esperado") or []
            if isinstance(states, list):
                expected_states.update(
                    state for state in states
                    if isinstance(state, str)
                )
            else:
                errors.append(
                    f"{species_id}/{character_id}: "
                    "estado_esperado no es array."
                )

            expected_character_entries.append(
                {
                    "character": character,
                    "relation": relation,
                    "source": source,
                    "computable": (
                        character.get("estado_piloto")
                        == computable_status
                    ),
                }
            )

        compare_exact(
            f"{filename}/botanical_characters",
            card.get("botanical_characters"),
            expected_character_entries,
            errors,
        )

        expected_photos = [
            record for record in photos
            if record.get("species_id") == species_id
        ]
        compare_exact(
            f"{filename}/photos",
            card.get("photos"),
            expected_photos,
            errors,
        )

        expected_model_errors = [
            record for record in model_errors
            if record.get("species_id_real") == species_id
        ]
        compare_exact(
            f"{filename}/model_errors",
            card.get("model_errors"),
            expected_model_errors,
            errors,
        )

        expected_ecology = [
            record
            for record in species_ecology
            if (
                record.get("species_id") == species_id
                and record.get("estado") == "activo"
            )
        ]
        compare_exact(
            f"{filename}/ecology",
            card.get("ecology"),
            expected_ecology,
            errors,
        )

        for fact in expected_ecology:
            source_ids = fact.get("fuente_ids") or []
            if not isinstance(source_ids, list):
                errors.append(
                    f"{species_id}/{fact.get('ecology_fact_id')}: "
                    "fuente_ids no es array."
                )
                continue
            for source_id in source_ids:
                if source_id not in source_by_id:
                    errors.append(
                        f"{species_id}/{fact.get('ecology_fact_id')}: "
                        f"fuente inexistente {source_id}"
                    )
                else:
                    used_source_ids.add(source_id)

        expected_glossary = [
            record for record in glossary
            if record.get("termino") in expected_states
        ]
        compare_exact(
            f"{filename}/glossary",
            card.get("glossary"),
            expected_glossary,
            errors,
        )

        for term in expected_glossary:
            source_id = term.get("fuente_id")
            if source_id:
                if source_id not in source_by_id:
                    errors.append(
                        f"{species_id}: glosario referencia "
                        f"fuente inexistente {source_id}"
                    )
                else:
                    used_source_ids.add(source_id)

        expected_sources = [
            source for source in sources
            if source.get("fuente_id") in used_source_ids
        ]
        compare_exact(
            f"{filename}/sources",
            card.get("sources"),
            expected_sources,
            errors,
        )

        card_characters = card.get("botanical_characters")
        card_photos = card.get("photos")

        if isinstance(card_characters, list):
            total_characters += len(card_characters)
        if isinstance(card_photos, list):
            total_photos += len(card_photos)

        active_count = sum(
            1
            for entry in expected_character_entries
            if entry["computable"]
        )

        print(
            f"{species_id}: "
            f"{len(expected_character_entries)} caracteres "
            f"({active_count} computables) | "
            f"{len(expected_photos)} fotos | "
            f"{len(expected_sources)} fuentes"
        )

    print("\n" + "=" * 72)
    print(f"Fichas esperadas:       {len(expected_files)}")
    print(f"Fichas encontradas:     {len(actual_files)}")
    print(f"Caracteres vinculados:  {total_characters}")
    print(f"Fotos vinculadas:       {total_photos}")

    finish(errors, warnings)


def finish(errors, warnings):
    print()
    print(f"Advertencias: {len(warnings)}")
    for warning in warnings:
        print(f"  - {warning}")

    print()
    print(f"Errores: {len(errors)}")
    for error in errors:
        print(f"  - {error}")

    print()

    if errors:
        print("ERROR — LAS FICHAS NO ESTÁN SINCRONIZADAS.")
        raise SystemExit(1)

    print("OK — 6 FICHAS CANÓNICAS SINCRONIZADAS.")
    print(
        "Cada ficha reproduce exclusivamente datos canónicos "
        "derivados de Master Botánico 2.0."
    )
    print(
        "No existe conocimiento botánico adicional ni una segunda "
        "fuente de verdad."
    )
    raise SystemExit(0)


if __name__ == "__main__":
    main()
