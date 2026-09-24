from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BOTANICAL_DIR = ROOT / "data" / "botanical"
OUTPUT_DIR = ROOT / "data" / "species"

REQUIRED_FILES = {
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


class SpeciesBuildError(RuntimeError):
    pass


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload):
    path.write_text(
        json.dumps(
            payload,
            ensure_ascii=False,
            indent=2,
            sort_keys=False,
        )
        + "\n",
        encoding="utf-8",
    )


def slugify(value: str) -> str:
    text = unicodedata.normalize("NFKD", value)
    text = "".join(
        char
        for char in text
        if not unicodedata.combining(char)
    )
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def runtime_species_id(canonical_id: str) -> str:
    return canonical_id.replace("-", "")


def load_canonical_data():
    data = {}

    for key, filename in REQUIRED_FILES.items():
        path = BOTANICAL_DIR / filename
        if not path.exists():
            raise SpeciesBuildError(
                f"Falta archivo canónico requerido: {path}"
            )
        data[key] = read_json(path)

    if not isinstance(data["metadata"], dict):
        raise SpeciesBuildError("metadata.json debe ser un objeto.")

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
        if not isinstance(data[key], list):
            raise SpeciesBuildError(
                f"{REQUIRED_FILES[key]} debe contener un array."
            )

    return data


def index_unique(records, field: str, label: str):
    index = {}

    for record in records:
        value = record.get(field)

        if not isinstance(value, str) or not value:
            raise SpeciesBuildError(
                f"{label}: registro sin {field} válido."
            )

        if value in index:
            raise SpeciesBuildError(
                f"{label}: {field} duplicado: {value}"
            )

        index[value] = record

    return index


def build_species_view(
    species_record,
    *,
    metadata,
    character_by_id,
    source_by_id,
    relations,
    photos,
    glossary,
    model_errors,
    species_ecology,
):
    species_id = species_record["species_id"]
    computable_status = metadata["computable_status"]

    species_relations = [
        relation
        for relation in relations
        if relation.get("species_id") == species_id
    ]

    botanical_characters = []
    used_source_ids = set()
    expected_states = set()

    for relation in species_relations:
        character_id = relation.get("caracter_id")
        character = character_by_id.get(character_id)

        if character is None:
            raise SpeciesBuildError(
                f"{species_id}: relación con carácter inexistente "
                f"{character_id}"
            )

        source_id = relation.get("fuente_id")
        source = None

        if source_id:
            source = source_by_id.get(source_id)
            if source is None:
                raise SpeciesBuildError(
                    f"{species_id}/{character_id}: fuente inexistente "
                    f"{source_id}"
                )
            used_source_ids.add(source_id)

        states = relation.get("estado_esperado") or []
        if not isinstance(states, list):
            raise SpeciesBuildError(
                f"{species_id}/{character_id}: "
                "estado_esperado debe ser array."
            )

        expected_states.update(
            state
            for state in states
            if isinstance(state, str)
        )

        botanical_characters.append(
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

    species_photos = [
        record
        for record in photos
        if record.get("species_id") == species_id
    ]

    species_errors = [
        record
        for record in model_errors
        if record.get("species_id_real") == species_id
    ]

    species_ecology_facts = [
        record
        for record in species_ecology
        if (
            record.get("species_id") == species_id
            and record.get("estado") == "activo"
        )
    ]

    for fact in species_ecology_facts:
        source_ids = fact.get("fuente_ids") or []
        if not isinstance(source_ids, list):
            raise SpeciesBuildError(
                f"{species_id}/{fact.get('ecology_fact_id')}: "
                "fuente_ids debe ser array."
            )
        for source_id in source_ids:
            if source_id not in source_by_id:
                raise SpeciesBuildError(
                    f"{species_id}/{fact.get('ecology_fact_id')}: "
                    f"fuente inexistente {source_id}"
                )
            used_source_ids.add(source_id)

    glossary_terms = [
        record
        for record in glossary
        if record.get("termino") in expected_states
    ]

    for term in glossary_terms:
        source_id = term.get("fuente_id")
        if source_id:
            if source_id not in source_by_id:
                raise SpeciesBuildError(
                    f"{species_id}: glosario referencia fuente "
                    f"inexistente {source_id}"
                )
            used_source_ids.add(source_id)

    relevant_sources = [
        source
        for source in source_by_id.values()
        if source["fuente_id"] in used_source_ids
    ]

    return {
        "view_schema": "arboris.species-card.v3",
        "generated_from": {
            "master_name": metadata.get("master_name"),
            "master_version": metadata.get("master_version"),
            "schema_version": metadata.get("schema_version"),
            "source_file": metadata.get("source_file"),
            "source_sha256": metadata.get("source_sha256"),
            "source_of_truth": metadata.get("source_of_truth"),
        },
        "species": species_record,
        "botanical_characters": botanical_characters,
        "ecology": species_ecology_facts,
        "photos": species_photos,
        "sources": relevant_sources,
        "glossary": glossary_terms,
        "model_errors": species_errors,
    }


def main():
    print("ÁRBORIS — GENERACIÓN DE FICHAS CANÓNICAS POR ESPECIE")
    print("=" * 72)

    data = load_canonical_data()

    metadata = data["metadata"]
    species = data["species"]
    characters = data["characters"]
    relations = data["species_characters"]
    sources = data["sources"]
    photos = data["photos"]
    glossary = data["glossary"]
    model_errors = data["model_errors"]
    species_ecology = data["species_ecology"]

    character_by_id = index_unique(
        characters,
        "caracter_id",
        "characters.json",
    )
    source_by_id = index_unique(
        sources,
        "fuente_id",
        "sources.json",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    generated_paths = []

    for species_record in species:
        species_id = species_record.get("species_id")
        scientific_name = species_record.get("nombre_cientifico")

        if not species_id or not scientific_name:
            raise SpeciesBuildError(
                "Cada especie debe tener species_id y "
                "nombre_cientifico."
            )

        filename = (
            f"{runtime_species_id(species_id)}_"
            f"{slugify(scientific_name)}.json"
        )

        output_path = OUTPUT_DIR / filename

        payload = build_species_view(
            species_record,
            metadata=metadata,
            character_by_id=character_by_id,
            source_by_id=source_by_id,
            relations=relations,
            photos=photos,
            glossary=glossary,
            model_errors=model_errors,
            species_ecology=species_ecology,
        )

        write_json(output_path, payload)
        generated_paths.append(output_path)

        print(
            f"Created: {output_path.relative_to(ROOT)} "
            f"| {len(payload['botanical_characters'])} caracteres "
            f"| {len(payload['photos'])} fotos"
        )

    expected_names = {path.name for path in generated_paths}

    for existing in OUTPUT_DIR.glob("SP*.json"):
        if existing.name not in expected_names:
            raise SpeciesBuildError(
                "Existe una ficha SP*.json no generada por el Master "
                f"actual: {existing.relative_to(ROOT)}. "
                "No se borra automáticamente."
            )

    print()
    print(
        f"OK — {len(generated_paths)} fichas canónicas generadas "
        "desde data/botanical/."
    )
    print(
        "Estas fichas son vistas derivadas: no deben editarse "
        "manualmente."
    )


if __name__ == "__main__":
    main()
