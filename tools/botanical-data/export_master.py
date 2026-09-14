import json
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[2]

MASTER_FILE = (
    ROOT
    / "data"
    / "source"
    / "Base_botanica_Pokedex_flora_Master.xlsx"
)

OUTPUT_DIR = (
    ROOT
    / "data"
    / "botanical"
)


EXPORTS = {
    "Especies_Piloto": "species_pilot.json",
    "Caracteres": "characters.json",
    "Especie_Caracter": "species_characters.json",
    "Fuentes": "sources.json",
}


def clean_value(value):
    if pd.isna(value):
        return None

    if isinstance(value, str):
        return value.strip()

    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass

    return value


def dataframe_to_records(df):
    records = []

    for _, row in df.iterrows():
        record = {
            column: clean_value(value)
            for column, value in row.items()
        }

        records.append(record)

    return records


def main():
    print("\nÁRBORIS — EXPORTACIÓN MASTER")
    print("=" * 50)

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    for sheet_name, filename in EXPORTS.items():

        df = pd.read_excel(
            MASTER_FILE,
            sheet_name=sheet_name,
        )

        records = dataframe_to_records(df)

        output_file = (
            OUTPUT_DIR
            / filename
        )

        with output_file.open(
            "w",
            encoding="utf-8",
        ) as f:

            json.dump(
                {
                    "dataVersion":
                        "pilot-master-v0.1",

                    "source":
                        "Base_botanica_Pokedex_flora_Master.xlsx",

                    "sheet":
                        sheet_name,

                    "recordCount":
                        len(records),

                    "records":
                        records,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        print(
            f"{sheet_name:<20} "
            f"→ {filename} "
            f"({len(records)} registros)"
        )

    print("\nExportación terminada.")
    print(
        "Archivos guardados en "
        "data/botanical/"
    )


if __name__ == "__main__":
    main()