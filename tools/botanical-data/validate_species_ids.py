import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

SPECIES_DIR = ROOT / "data" / "species"
BOTANICAL_DIR = ROOT / "data" / "botanical"
KEY_FILE = ROOT / "tools" / "botanical-key-validation" / "logic.mjs"

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


def expected_runtime_id(master_id):
    """
    SP-001 -> SP001
    """
    if not master_id:
        return None

    return master_id.replace("-", "")


def main():
    print("\nÁRBORIS — VALIDACIÓN DE IDs")
    print("=" * 72)

    errors = []

    # ---------------------------------------------------------
    # 1. Leer snapshot de especies procedente de la Master
    # ---------------------------------------------------------

    species_snapshot_path = BOTANICAL_DIR / "species_pilot.json"

    if not species_snapshot_path.exists():
        raise FileNotFoundError(
            f"No existe: {species_snapshot_path}"
        )

    species_snapshot = load_json(species_snapshot_path)
    master_species = species_snapshot.get("records", [])

    master_by_runtime_id = {}

    for species in master_species:
        master_id = species.get("species_id")
        runtime_id = expected_runtime_id(master_id)

        if not master_id or not runtime_id:
            errors.append(
                f"Registro Master sin species_id válido: {species}"
            )
            continue

        master_by_runtime_id[runtime_id] = species

    # ---------------------------------------------------------
    # 2. Leer texto de la clave
    # ---------------------------------------------------------

    if not KEY_FILE.exists():
        raise FileNotFoundError(
            f"No existe la clave: {KEY_FILE}"
        )

    key_text = KEY_FILE.read_text(
        encoding="utf-8"
    )

    # ---------------------------------------------------------
    # 3. Comprobar las seis fichas
    # ---------------------------------------------------------

    results = []

    for filename in SPECIES_FILES:
        path = SPECIES_DIR / filename

        if not path.exists():
            errors.append(
                f"Falta ficha: {filename}"
            )
            continue

        data = load_json(path)

        runtime_id = data.get("id")

        botanical_data = data.get(
            "botanicalData",
            {},
        )

        master_id = botanical_data.get(
            "masterSpeciesId"
        )

        # Si la ficha no conserva el master ID en botanicalData,
        # intentamos obtenerlo desde el snapshot.
        master_record = master_by_runtime_id.get(
            runtime_id
        )

        expected_master_id = (
            master_record.get("species_id")
            if master_record
            else None
        )

        expected_id = expected_runtime_id(
            expected_master_id
        )

        id_ok = (
            runtime_id is not None
            and expected_id == runtime_id
        )

        master_trace_ok = (
            master_id is None
            or master_id == expected_master_id
        )

        # Buscamos si el runtime ID aparece actualmente
        # en logic.mjs. Esto es diagnóstico, no exige todavía
        # que la futura clave dependa de IDs hardcodeados.
        appears_in_key = (
            runtime_id in key_text
            if runtime_id
            else False
        )

        if not id_ok:
            errors.append(
                f"{filename}: runtime ID {runtime_id} "
                f"no corresponde a Master ID "
                f"{expected_master_id}"
            )

        if not master_trace_ok:
            errors.append(
                f"{filename}: masterSpeciesId "
                f"{master_id} != {expected_master_id}"
            )

        results.append(
            {
                "master_id": expected_master_id,
                "runtime_id": runtime_id,
                "id_ok": id_ok,
                "master_trace_ok": master_trace_ok,
                "appears_in_key": appears_in_key,
                "scientific_name": data.get(
                    "scientificName",
                    "",
                ),
            }
        )

    # ---------------------------------------------------------
    # 4. Mostrar resultados
    # ---------------------------------------------------------

    print(
        f"{'MASTER':<10}"
        f"{'RUNTIME':<10}"
        f"{'FICHA':<9}"
        f"{'TRAZA':<9}"
        f"{'CLAVE':<9}"
        f"ESPECIE"
    )

    print("-" * 72)

    for result in results:
        print(
            f"{str(result['master_id']):<10}"
            f"{str(result['runtime_id']):<10}"
            f"{'OK' if result['id_ok'] else 'ERROR':<9}"
            f"{'OK' if result['master_trace_ok'] else 'ERROR':<9}"
            f"{'SÍ' if result['appears_in_key'] else 'NO':<9}"
            f"{result['scientific_name']}"
        )

    print("\n" + "=" * 72)

    print(
        f"Especies comprobadas: {len(results)}"
    )

    print(
        f"Conflictos de ID: {len(errors)}"
    )

    if errors:
        print("\nDETALLE DE CONFLICTOS:")

        for error in errors:
            print(f"- {error}")

    else:
        print(
            "\nOK — La equivalencia "
            "SP-00X → SP00X es consistente."
        )

    print(
        "\nNota: la columna CLAVE solo indica si el ID "
        "aparece actualmente en logic.mjs."
    )

    print(
        "No se modificó ningún archivo."
    )


if __name__ == "__main__":
    main()