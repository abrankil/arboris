import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CURRENT_DIR = ROOT / "data" / "species"
PREVIEW_DIR = ROOT / "tools" / "botanical-data" / "output"
OUTPUT_DIR = ROOT / "tools" / "botanical-data" / "compare_output"


SPECIES_FILES = [
    "SP001_cryptocarya_alba.json",
    "SP002_lithraea_caustica.json",
    "SP003_kageneckia_oblonga.json",
    "SP004_podanthus_mitiqui.json",
    "SP005_colliguaja_odorifera.json",
    "SP006_quillaja_saponaria.json",
]


def load_json(path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def get_preview_filename(current_filename):
    stem = current_filename.replace(".json", "")
    return f"{stem}.preview.json"


def compare_species(current, generated):
    species_generated = generated.get("species", {})

    identity_fields = {
        "id": (
            current.get("id"),
            species_generated.get("id"),
        ),
        "commonName": (
            current.get("commonName"),
            species_generated.get("commonName"),
        ),
        "scientificName": (
            current.get("scientificName"),
            species_generated.get("scientificName"),
        ),
        "family": (
            current.get("family"),
            species_generated.get("family"),
        ),
        "habit": (
            current.get("habit"),
            species_generated.get("habit"),
        ),
        "origin": (
            current.get("origin"),
            species_generated.get("origin"),
        ),
    }

    conflicts = {}

    for field, (current_value, generated_value) in identity_fields.items():
        if (
            current_value is not None
            and generated_value is not None
            and current_value != generated_value
        ):
            conflicts[field] = {
                "current": current_value,
                "generated": generated_value,
            }

    current_photos = current.get("photos", [])

    comparison = {
        "speciesId": species_generated.get("id"),
        "scientificName": species_generated.get("scientificName"),
        "identityConflicts": conflicts,
        "currentPhotos": len(current_photos),
        "generatedCharacters": len(
            generated.get("characters", [])
        ),
        "keepFromCurrent": {
            "photos": bool(current_photos),
        },
        "addFromMaster": {
            "order": species_generated.get("order"),
            "pilotStatus": species_generated.get("pilotStatus"),
            "speciesNotes": species_generated.get("notes"),
            "characters": True,
            "dataVersion": generated.get("dataVersion"),
            "source": generated.get("source"),
        },
    }

    return comparison


def main():
    print("\nÁRBORIS — COMPARACIÓN DE FICHAS")
    print("=" * 60)

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    summary = []

    for filename in SPECIES_FILES:
        current_path = CURRENT_DIR / filename
        preview_path = PREVIEW_DIR / get_preview_filename(filename)

        if not current_path.exists():
            print(f"\nFALTA JSON ACTUAL: {current_path}")
            continue

        if not preview_path.exists():
            print(f"\nFALTA PREVIEW: {preview_path}")
            continue

        current = load_json(current_path)
        generated = load_json(preview_path)

        comparison = compare_species(
            current=current,
            generated=generated,
        )

        output_path = (
            OUTPUT_DIR
            / filename.replace(
                ".json",
                ".comparison.json",
            )
        )

        with output_path.open(
            "w",
            encoding="utf-8",
        ) as f:
            json.dump(
                comparison,
                f,
                ensure_ascii=False,
                indent=2,
            )

        conflict_count = len(
            comparison["identityConflicts"]
        )

        summary.append(
            {
                "speciesId": comparison["speciesId"],
                "scientificName": comparison["scientificName"],
                "identityConflicts": conflict_count,
                "currentPhotos": comparison["currentPhotos"],
                "generatedCharacters": comparison["generatedCharacters"],
            }
        )

        status = (
            "OK"
            if conflict_count == 0
            else "REVISAR"
        )

        print(
            f"\n{status} "
            f"{comparison['speciesId']} — "
            f"{comparison['scientificName']}"
        )

        print(
            f"  Fotos actuales: "
            f"{comparison['currentPhotos']}"
        )

        print(
            f"  Caracteres desde Master: "
            f"{comparison['generatedCharacters']}"
        )

        print(
            f"  Conflictos de identidad: "
            f"{conflict_count}"
        )

        if conflict_count:
            for field, conflict in (
                comparison[
                    "identityConflicts"
                ].items()
            ):
                print(
                    f"    {field}: "
                    f"{conflict['current']} "
                    f"!= "
                    f"{conflict['generated']}"
                )

    summary_path = (
        OUTPUT_DIR
        / "comparison_summary.json"
    )

    with summary_path.open(
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            {
                "speciesCount": len(summary),
                "species": summary,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)

    for item in summary:
        status = (
            "OK"
            if item[
                "identityConflicts"
            ] == 0
            else "REVISAR"
        )

        print(
            f"{status:7} "
            f"{item['speciesId']} "
            f"{item['scientificName']:<25} "
            f"fotos={item['currentPhotos']:<2} "
            f"caracteres={item['generatedCharacters']:<2} "
            f"conflictos={item['identityConflicts']}"
        )

    print(
        "\nNo se modificó ningún archivo "
        "de data/species/."
    )

    print(
        "Resultados guardados en "
        "tools/botanical-data/compare_output/"
    )


if __name__ == "__main__":
    main()