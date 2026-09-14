import csv
import os

from bioclip.predict import CustomLabelsClassifier

DATASET_DIR = "inaturalist_dataset"
OUTPUT_CSV = "bioclip_inaturalist_results.csv"

SPECIES = {
    "SP001_peumo": "Cryptocarya alba",
    "SP002_litre": "Lithraea caustica",
    "SP003_bollen": "Kageneckia oblonga",
    "SP004_mitique": "Podanthus mitiqui",
    "SP005_colliguay": "Colliguaja odorifera",
    "SP006_quillay": "Quillaja saponaria",
}

LABELS = list(SPECIES.values())

print("Cargando BioCLIP 2...")

classifier = CustomLabelsClassifier(
    cls_ary=LABELS,
    device="cpu"
)

rows = []

for folder, true_species in SPECIES.items():

    folder_path = os.path.join(DATASET_DIR, folder)

    print("\n" + "=" * 70)
    print(f"Especie real: {true_species}")
    print("=" * 70)

    if not os.path.isdir(folder_path):
        print(f"No existe carpeta: {folder_path}")
        continue

    image_files = sorted(
        f for f in os.listdir(folder_path)
        if f.lower().endswith(
            (".jpg", ".jpeg", ".png", ".webp")
        )
    )

    total = len(image_files)

    for index, filename in enumerate(image_files, start=1):

        image_path = os.path.join(
            folder_path,
            filename,
        )

        try:
            predictions = classifier.predict(
                image_path
            )

        except Exception as e:
            print(
                f"ERROR {filename}: {e}"
            )
            continue

        ranking = []

        for rank, prediction in enumerate(
            predictions,
            start=1
        ):
            ranking.append(
                {
                    "rank": rank,
                    "species": prediction[
                        "classification"
                    ],
                    "score": float(
                        prediction["score"]
                    ),
                }
            )

        top1 = ranking[0]

        true_result = next(
            item
            for item in ranking
            if item["species"] == true_species
        )

        correct = (
            top1["species"] == true_species
        )

        print(
            f"{index:02d}/{total} "
            f"{'OK' if correct else 'XX'} "
            f"{filename} -> "
            f"{top1['species']} "
            f"({top1['score']:.4f}) "
            f"| real rank: "
            f"{true_result['rank']}"
        )

        row = {
            "folder": folder,
            "filename": filename,
            "true_species": true_species,
            "predicted_species": top1[
                "species"
            ],
            "top1_score": top1["score"],
            "correct_top1": correct,
            "true_species_rank": true_result[
                "rank"
            ],
            "true_species_score": true_result[
                "score"
            ],
        }

        for item in ranking:
            row[
                f"rank_{item['rank']}_species"
            ] = item["species"]

            row[
                f"rank_{item['rank']}_score"
            ] = item["score"]

        rows.append(row)


if rows:

    fieldnames = list(rows[0].keys())

    with open(
        OUTPUT_CSV,
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(rows)


print("\n" + "=" * 70)
print("EVALUACIÓN TERMINADA")
print("=" * 70)

print(f"Imágenes evaluadas: {len(rows)}")
print(f"Resultados: {OUTPUT_CSV}")