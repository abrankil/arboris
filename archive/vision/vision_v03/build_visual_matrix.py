from pathlib import Path
import csv

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "results" / "photo_inventory.csv"
OUTPUT_FILE = BASE_DIR / "results" / "visual_botanical_matrix.csv"

VISUAL_FIELDS = [
    "leaf_arrangement",
    "leaf_shape",
    "leaf_apex",
    "leaf_margin",
    "teeth",
    "venation",
    "surface",
    "relative_color",
    "underside",
    "reproductive_structures",
]

BASE_FIELDS = [
    "species_code",
    "individual",
    "evidence_type",
    "photo_number",
    "filename",
    "relative_path",
]

EXTRA_FIELDS = [
    "notes",
]

fieldnames = BASE_FIELDS.copy()

for field in VISUAL_FIELDS:
    fieldnames.append(f"{field}_value")
    fieldnames.append(f"{field}_visibility")
    fieldnames.append(f"{field}_confidence")

fieldnames.extend(EXTRA_FIELDS)

with INPUT_FILE.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    photos = list(reader)

rows = []

for photo in photos:
    row = {}

    for field in BASE_FIELDS:
        row[field] = photo.get(field, "")

    for field in VISUAL_FIELDS:
        row[f"{field}_value"] = ""
        row[f"{field}_visibility"] = ""
        row[f"{field}_confidence"] = ""

    row["notes"] = ""
    rows.append(row)

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT_FILE.open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Fotografias incorporadas: {len(rows)}")
print(f"Caracteres visuales por fotografia: {len(VISUAL_FIELDS)}")
print(f"Matriz creada en: {OUTPUT_FILE}")