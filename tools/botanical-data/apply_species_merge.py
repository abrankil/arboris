import json
import shutil
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

SPECIES_DIR = ROOT / "data" / "species"
MERGED_DIR = ROOT / "tools" / "botanical-data" / "merge_output"

BACKUP_ROOT = (
    ROOT
    / "tools"
    / "botanical-data"
    / "backups"
)


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


def main():
    print("\nÁRBORIS — APLICAR FUSIÓN DE FICHAS")
    print("=" * 60)

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    backup_dir = BACKUP_ROOT / timestamp

    backup_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    # ---------------------------------------------------------
    # Verificación previa
    # ---------------------------------------------------------

    for filename in SPECIES_FILES:

        current_path = SPECIES_DIR / filename

        merged_path = (
            MERGED_DIR
            / filename.replace(
                ".json",
                ".merged.json",
            )
        )

        if not current_path.exists():
            raise FileNotFoundError(
                f"Falta ficha actual: {current_path}"
            )

        if not merged_path.exists():
            raise FileNotFoundError(
                f"Falta ficha fusionada: {merged_path}"
            )

        merged = load_json(merged_path)

        warnings = (
            merged
            .get("botanicalData", {})
            .get("validationWarnings")
        )

        if warnings != 0:
            raise ValueError(
                f"{filename} tiene "
                f"{warnings} advertencias."
            )

    print(
        "Verificación previa: OK"
    )

    # ---------------------------------------------------------
    # Backup
    # ---------------------------------------------------------

    for filename in SPECIES_FILES:

        source = SPECIES_DIR / filename
        destination = backup_dir / filename

        shutil.copy2(
            source,
            destination,
        )

    print(
        f"Copia de seguridad creada en:\n"
        f"{backup_dir.relative_to(ROOT)}"
    )

    # ---------------------------------------------------------
    # Aplicar fichas fusionadas
    # ---------------------------------------------------------

    for filename in SPECIES_FILES:

        merged_path = (
            MERGED_DIR
            / filename.replace(
                ".json",
                ".merged.json",
            )
        )

        target_path = SPECIES_DIR / filename

        shutil.copy2(
            merged_path,
            target_path,
        )

        print(
            f"ACTUALIZADO  {filename}"
        )

    print("\n" + "=" * 60)
    print("FUSIÓN APLICADA")
    print("=" * 60)

    print(
        f"Fichas actualizadas: "
        f"{len(SPECIES_FILES)}"
    )

    print(
        "\nLos archivos anteriores siguen "
        "disponibles en la carpeta de backup."
    )


if __name__ == "__main__":
    main()