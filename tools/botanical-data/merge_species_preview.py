import json
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CURRENT_DIR = ROOT / "data" / "species"
PREVIEW_DIR = ROOT / "tools" / "botanical-data" / "output"
MERGED_DIR = ROOT / "tools" / "botanical-data" / "merge_output"


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


def save_json(path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2,
        )


def preview_filename(current_filename):
    stem = current_filename.removesuffix(".json")
    return f"{stem}.preview.json"


def merge_species(current, generated):
    """
    Fusión conservadora.

    PRINCIPIO:
    - El JSON actual conserva fotos y demás información ya existente.
    - La Master aporta conocimiento botánico validado.
    - No se elimina información existente.
    """

    merged = deepcopy(current)

    master_species = generated.get("species", {})

    # ---------------------------------------------------------
    # IDENTIDAD / TAXONOMÍA
    # ---------------------------------------------------------
    #
    # Estos campos ya fueron comparados previamente y dieron
    # cero conflictos entre los seis JSON y la Master.
    # ---------------------------------------------------------

    merged["id"] = master_species.get(
        "id",
        merged.get("id"),
    )

    merged["commonName"] = master_species.get(
        "commonName",
        merged.get("commonName"),
    )

    merged["scientificName"] = master_species.get(
        "scientificName",
        merged.get("scientificName"),
    )

    merged["family"] = master_species.get(
        "family",
        merged.get("family"),
    )

    merged["order"] = master_species.get(
        "order",
        merged.get("order"),
    )

    merged["habit"] = master_species.get(
        "habit",
        merged.get("habit"),
    )

    merged["origin"] = master_species.get(
        "origin",
        merged.get("origin"),
    )

    # ---------------------------------------------------------
    # ENDEMISMO
    # ---------------------------------------------------------

    endemic_value = master_species.get("endemicChile")

    if endemic_value is not None:
        if isinstance(endemic_value, bool):
            merged["endemicChile"] = endemic_value
        else:
            normalized = str(endemic_value).strip().lower()

            merged["endemicChile"] = normalized in {
                "sí",
                "si",
                "true",
                "1",
            }

    # ---------------------------------------------------------
    # ESTADO DEL PILOTO
    # ---------------------------------------------------------

    if master_species.get("pilotStatus") is not None:
        merged["pilotStatus"] = master_species["pilotStatus"]

    # ---------------------------------------------------------
    # NOTAS EDITORIALES DE LA MASTER
    # ---------------------------------------------------------
    #
    # No usamos "notes" directamente porque podría existir
    # información antigua con ese nombre en algún JSON.
    # ---------------------------------------------------------

    if master_species.get("notes") is not None:
        merged["botanicalNotes"] = master_species["notes"]

    # ---------------------------------------------------------
    # CARACTERES BOTÁNICOS VALIDADOS
    # ---------------------------------------------------------

    merged["botanicalCharacters"] = deepcopy(
        generated.get("characters", [])
    )

    # ---------------------------------------------------------
    # TRAZABILIDAD
    # ---------------------------------------------------------

    merged["botanicalData"] = {
        "version": generated.get("dataVersion"),
        "source": generated.get("source"),
        "masterSpeciesId": master_species.get("masterId"),
        "validationWarnings": generated.get(
            "validation",
            {},
        ).get(
            "warningCount",
            0,
        ),
    }

    return merged


def validate_merge(current, merged, generated):
    """
    Comprobaciones básicas para asegurarnos de que la fusión
    no destruyó información existente.
    """

    errors = []

    # ---------------------------------------------------------
    # Fotos
    # ---------------------------------------------------------

    current_photos = current.get("photos", [])
    merged_photos = merged.get("photos", [])

    if current_photos != merged_photos:
        errors.append(
            "La lista de fotos cambió durante la fusión."
        )

    # ---------------------------------------------------------
    # Cantidad de caracteres
    # ---------------------------------------------------------

    expected_character_count = len(
        generated.get("characters", [])
    )

    merged_character_count = len(
        merged.get("botanicalCharacters", [])
    )

    if merged_character_count != expected_character_count:
        errors.append(
            "La cantidad de caracteres botánicos no coincide "
            "con la vista previa validada."
        )

    # ---------------------------------------------------------
    # Advertencias de la Master
    # ---------------------------------------------------------

    warning_count = generated.get(
        "validation",
        {},
    ).get(
        "warningCount",
        0,
    )

    if warning_count != 0:
        errors.append(
            f"La ficha generada tiene {warning_count} "
            "advertencias de validación."
        )

    # ---------------------------------------------------------
    # Identidad
    # ---------------------------------------------------------

    for field in [
        "id",
        "commonName",
        "scientificName",
        "family",
        "habit",
        "origin",
    ]:
        master_value = generated.get(
            "species",
            {},
        ).get(field)

        merged_value = merged.get(field)

        if (
            master_value is not None
            and merged_value != master_value
        ):
            errors.append(
                f"El campo {field} no coincide con la Master."
            )

    return errors


def main():
    print("\nÁRBORIS — FUSIÓN SEGURA DE FICHAS")
    print("=" * 60)

    MERGED_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    summary = []

    for filename in SPECIES_FILES:
        current_path = CURRENT_DIR / filename

        generated_path = (
            PREVIEW_DIR
            / preview_filename(filename)
        )

        if not current_path.exists():
            print(
                f"\nERROR: no existe {current_path}"
            )
            continue

        if not generated_path.exists():
            print(
                f"\nERROR: no existe {generated_path}"
            )
            continue

        current = load_json(current_path)
        generated = load_json(generated_path)

        merged = merge_species(
            current=current,
            generated=generated,
        )

        errors = validate_merge(
            current=current,
            merged=merged,
            generated=generated,
        )

        output_path = (
            MERGED_DIR
            / filename.replace(
                ".json",
                ".merged.json",
            )
        )

        save_json(
            output_path,
            merged,
        )

        photo_count = len(
            merged.get("photos", [])
        )

        character_count = len(
            merged.get(
                "botanicalCharacters",
                [],
            )
        )

        summary.append(
            {
                "id": merged.get("id"),
                "scientificName": merged.get(
                    "scientificName"
                ),
                "photos": photo_count,
                "characters": character_count,
                "errors": len(errors),
                "output": str(
                    output_path.relative_to(ROOT)
                ).replace("\\", "/"),
            }
        )

        status = "OK" if not errors else "REVISAR"

        print(
            f"\n{status} "
            f"{merged.get('id')} — "
            f"{merged.get('scientificName')}"
        )

        print(
            f"  Fotos conservadas: {photo_count}"
        )

        print(
            f"  Caracteres botánicos: {character_count}"
        )

        print(
            f"  Errores de fusión: {len(errors)}"
        )

        for error in errors:
            print(
                f"    - {error}"
            )

    # ---------------------------------------------------------
    # RESUMEN
    # ---------------------------------------------------------

    summary_path = (
        MERGED_DIR
        / "merge_summary.json"
    )

    save_json(
        summary_path,
        {
            "speciesCount": len(summary),
            "species": summary,
        },
    )

    print("\n" + "=" * 60)
    print("RESUMEN DE FUSIÓN")
    print("=" * 60)

    total_errors = 0

    for item in summary:
        status = (
            "OK"
            if item["errors"] == 0
            else "REVISAR"
        )

        total_errors += item["errors"]

        print(
            f"{status:7} "
            f"{item['id']} "
            f"{item['scientificName']:<25} "
            f"fotos={item['photos']:<2} "
            f"caracteres={item['characters']:<2} "
            f"errores={item['errors']}"
        )

    print(
        f"\nEspecies procesadas: {len(summary)}"
    )

    print(
        f"Errores totales: {total_errors}"
    )

    print(
        "\nArchivos de prueba guardados en:"
    )

    print(
        "tools/botanical-data/merge_output/"
    )

    print(
        "\nIMPORTANTE: no se modificó ningún "
        "archivo de data/species/."
    )


if __name__ == "__main__":
    main()