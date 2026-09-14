from pathlib import Path
import csv
import re


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
SPECIES_DIR = PROJECT_DIR / "species"
RESULTS_DIR = BASE_DIR / "results"

RESULTS_DIR.mkdir(exist_ok=True)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

rows = []

for image_path in sorted(SPECIES_DIR.rglob("*")):

    if not image_path.is_file():
        continue

    if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
        continue

    filename = image_path.name
    stem = image_path.stem

    # Ejemplo:
    # SP002_LC004_ramilla_01
    match = re.match(
        r"^(SP\d{3})_([A-Za-z]+\d+)_(.+?)_(\d+)$",
        stem
    )

    if match:
        species_code = match.group(1)
        individual = match.group(2)
        evidence_type = match.group(3)
        photo_number = match.group(4)
    else:
        species_code = ""
        individual = ""
        evidence_type = ""
        photo_number = ""

    rows.append({
        "species_code": species_code,
        "individual": individual,
        "evidence_type": evidence_type,
        "photo_number": photo_number,
        "filename": filename,
        "relative_path": str(image_path.relative_to(PROJECT_DIR)),
    })


output_file = RESULTS_DIR / "photo_inventory.csv"

with open(output_file, "w", newline="", encoding="utf-8-sig") as f:

    fieldnames = [
        "species_code",
        "individual",
        "evidence_type",
        "photo_number",
        "filename",
        "relative_path",
    ]

    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)


print("\nINVENTARIO FOTOGRAFICO ARBORIS")
print("=" * 50)

print(f"\nFotografias encontradas: {len(rows)}")

unrecognized = [
    row for row in rows
    if not row["species_code"]
]

print(f"Nombres reconocidos automaticamente: {len(rows) - len(unrecognized)}")
print(f"Nombres que requieren revision: {len(unrecognized)}")

if unrecognized:
    print("\nArchivos que requieren revision:")
    for row in unrecognized:
        print(f"  {row['filename']}")

print(f"\nInventario guardado en:")
print(output_file)